// ============================================================================
// src/lib/tools/rpki-origin-validation/compute.ts
// ----------------------------------------------------------------------------
// Route origin validation calculator: the pure engine (D-49: deterministic,
// local, no clock, no network, no randomness).
//
// WHAT IT COMPUTES. Given one Route (a prefix and its origin AS) and a list of
// Validated ROA Payloads (VRPs) the reader supplies, it returns the validation
// state RFC 6811 section 2 defines (Valid, Invalid or NotFound) and the reason
// for it, VRP by VRP: which VRPs Cover the Route Prefix, which of those Match,
// and why each covering VRP that does not Match fails (another AS, a prefix
// longer than its maxLength, or AS 0, which can never be Matched).
//
// THE DEFINITIONS IT IMPLEMENTS (RFC 6811 section 2, read 2026-10-19):
//   Covered: "the VRP prefix length is less than or equal to the Route prefix
//     length, and the VRP prefix address and the Route prefix address are
//     identical for all bits specified by the VRP prefix length".
//   Matched: "the Route Prefix is Covered by that VRP, the Route prefix length
//     is less than or equal to the VRP maximum length, and the Route Origin
//     ASN is equal to the VRP ASN".
//   NotFound: no VRP Covers. Valid: at least one VRP Matches. Invalid: at
//     least one VRP Covers and none Matches.
//   "a Route whose Origin ASN is "NONE" cannot be Matched by any VRP" and
//   "no Route can be Matched by a VRP whose ASN is zero".
//
// WHAT IT NEVER DOES. It fetches nothing: no RPKI repository, no validator, no
// route collector. The VRPs are whatever the reader pastes, so the answer is
// the answer for that list and no other. It describes the maxLength exposure
// RFC 9319 names in that document's own terms and gives no procedure of any
// kind.
//
// PARSING IS LINEAR AND BOUNDED. Every input is split on fixed separators and
// read token by token; the few regular expressions are anchored, have no
// nested quantifiers and run on bounded tokens (ReDoS-safe by construction).
// ============================================================================

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/** Stable error codes; the UI maps each to a localised message. */
export type RovErrorCode =
  | "route-empty" // no Route given
  | "route-format" // the Route is not "<prefix> <origin AS>"
  | "prefix-format" // an address or a prefix length that does not parse
  | "host-bits" // bits set beyond the prefix length (192.0.2.1/24)
  | "origin-format" // an AS number that is neither asplain nor asdot
  | "origin-as0" // a Route whose origin is AS 0 (RFC 7607 section 2: malformed)
  | "as-range" // an AS number outside 0 to 4294967295
  | "vrps-empty" // no VRP given
  | "vrp-format" // a VRP line that is not prefix, optional maxLength, AS
  | "maxlength-range" // a maxLength outside prefix length to 32 or 128 (RFC 9582 s4.3.2.2)
  | "too-many" // more VRPs or more characters than the engine accepts
  | "slurm-format" // JSON that is not a SLURM file or a prefixAssertions array
  | "slurm-version" // a SLURM file whose slurmVersion is not 1 (RFC 8416 s3.2)
  | "slurm-member" // a member RFC 8416 does not define (s3.1: MUST NOT be used)
  | "request-format"; // an API request that is not { route, vrps }

/** Typed error carrying a stable code and, for a VRP, its line or position. */
export class RovError extends Error {
  /** The stable code. */
  readonly code: RovErrorCode;
  /** The 1-based line (text) or position (SLURM) of the VRP at fault, if any. */
  readonly line?: number;
  /** Build an error with its code, an English message and an optional line. */
  constructor(code: RovErrorCode, message: string, line?: number) {
    super(message); // the English message the API returns
    this.name = "RovError"; // a recognisable name in stack traces
    this.code = code; // the stable code the UI localises
    if (line !== undefined) this.line = line; // only set when a VRP is at fault
  }
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** The address family of a prefix. */
export type Family = "ipv4" | "ipv6";

/** How one VRP relates to the Route, in RFC 6811 section 2's terms. */
export type VrpRelation =
  | "match" // Covers and Matches: the Route is Valid because of it
  | "wrong-as" // Covers; the VRP names another AS
  | "too-specific" // Covers; the Route prefix is longer than the VRP maxLength
  | "wrong-as-and-too-specific" // Covers; both of the above
  | "as0" // Covers; a VRP with AS 0 can never be Matched (RFC 6811 s2, RFC 6483 s4)
  | "origin-none" // Covers; a Route whose origin is NONE can never be Matched (RFC 6811 s2)
  | "not-covering" // same family, but the VRP does not Cover the Route Prefix
  | "other-family"; // an IPv4 VRP for an IPv6 Route, or the reverse

/** One VRP, as read, with its relation to the Route. */
export interface VrpReport {
  /** 1-based position in the list (after comments and blank lines are dropped). */
  index: number;
  /** 1-based source line for the text format; the array position for SLURM. */
  line: number;
  /** The VRP prefix, canonical (RFC 5952 for IPv6). */
  prefix: string;
  /** The VRP prefix length. */
  length: number;
  /** The maximum length; equal to the prefix length when none was given. */
  maxLength: number;
  /** True when the input stated a maxLength (or maxPrefixLength). */
  maxLengthGiven: boolean;
  /** The VRP ASN, asplain (RFC 5396). */
  asn: number;
  /** The SLURM comment, when the assertion carried one. */
  comment?: string;
  /** True when this VRP Covers the Route Prefix (RFC 6811 s2). */
  covers: boolean;
  /** The relation to the Route, see VrpRelation. */
  relation: VrpRelation;
  /** Set on a match whose prefix is shorter than the Route's: the maxLength range made it Valid. */
  viaMaxLength?: boolean;
}

/** The maxLength note RFC 9319 asks for: a VRP that authorises more than its own prefix. */
export interface MaxLengthNote {
  /** The VRP's position in the list. */
  index: number;
  /** The VRP prefix, canonical. */
  prefix: string;
  /** The VRP prefix length. */
  length: number;
  /** The VRP maxLength (greater than length). */
  maxLength: number;
  /** The VRP ASN. */
  asn: number;
  /** How many prefixes the VRP authorises: 2^(maxLength - length + 1) - 1, as a decimal string. */
  authorisedPrefixes: string;
  /** True when this VRP Covers the Route being checked. */
  coversRoute: boolean;
}

/** Notes beside the verdict, each tied to a document. */
export type RovNoteCode =
  | "as0-only" // Invalid and every covering VRP is AS 0: the holder disavows routing it (RFC 6483 s4)
  | "as0-overridden" // Valid although an AS 0 VRP also Covers (RFC 6483 s4: lower relative preference)
  | "origin-none" // the Route's origin is NONE (RFC 6811 s2)
  | "duplicates-removed" // identical VRPs were counted once (RFC 8416 s3.4.1: excluding duplicates)
  | "slurm-filters-not-applied" // the SLURM file has filters; they act on RPKI data, not on assertions (RFC 8416 s3.2)
  | "valid-via-maxlength"; // the only Match is through a maxLength range

/** The full result. */
export interface RovResult {
  /** The Route as read. */
  route: {
    /** The Route prefix, canonical. */
    prefix: string;
    /** Its address family. */
    family: Family;
    /** Its prefix length. */
    length: number;
    /** The Route Origin ASN, asplain, or "NONE" (RFC 6811 s2). */
    origin: number | "NONE";
    /** The origin in asdot (RFC 5396 s2), when it is a number. */
    originAsdot?: string;
  };
  /** The RFC 6811 validation state. */
  state: "Valid" | "Invalid" | "NotFound";
  /** Where the VRPs came from: the line format or a SLURM JSON document. */
  vrpFormat: "text" | "slurm";
  /** How many distinct VRPs were read. */
  vrpCount: number;
  /** How many of them Cover the Route Prefix. */
  covering: number;
  /** How many of them Match the Route. */
  matching: number;
  /** Every VRP, in input order, with its relation to the Route. */
  vrps: VrpReport[];
  /** VRPs whose maxLength exceeds their prefix length (AS 0 excluded), per RFC 9319 s5. */
  maxLengthNotes: MaxLengthNote[];
  /** Notes beside the verdict. */
  notes: RovNoteCode[];
  /** How many duplicate VRPs were dropped (0 when none). */
  duplicatesRemoved: number;
  /** How many SLURM prefixFilters were present and not applied (0 when none or text). */
  slurmFiltersIgnored: number;
}

/** The engine's input: a Route line and the VRPs (text, or SLURM JSON as text or as parsed JSON). */
export interface RovInput {
  /** "<prefix> <origin AS>", e.g. "192.0.2.0/24 AS64496". */
  route: string;
  /** One VRP per line, or a SLURM document (RFC 8416), as text or already parsed. */
  vrps: unknown;
}

// ---------------------------------------------------------------------------
// Limits (bounded input: the engine refuses rather than slows down)
// ---------------------------------------------------------------------------

/** Most characters accepted in the VRP text. */
const MAX_VRP_CHARS = 1_000_000; // about 20,000 lines of a typical export
/** Most VRPs accepted. */
const MAX_VRPS = 20_000; // a bounded list keeps the page and the API responsive
/** Most characters accepted in the Route line. */
const MAX_ROUTE_CHARS = 200; // a prefix and an AS fit easily
/** The largest AS number: four octets (RFC 6811 s3 requires four-octet support). */
const MAX_ASN = 4294967295; // 2^32 - 1

// ---------------------------------------------------------------------------
// Address parsing and formatting (BigInt keeps IPv6 exact)
// ---------------------------------------------------------------------------

/** A parsed prefix: family, address as an integer, and length. */
interface Prefix {
  /** The address family. */
  family: Family;
  /** The address as an unsigned integer (32 or 128 bits). */
  addr: bigint;
  /** The prefix length. */
  length: number;
}

/** Bits in an address of each family. */
const BITS: Record<Family, number> = { ipv4: 32, ipv6: 128 }; // fixed by IPv4 and IPv6

/** Parse a dotted-quad IPv4 address into an integer, or return null. */
function parseIPv4(s: string): bigint | null {
  const parts = s.split("."); // four decimal octets
  if (parts.length !== 4) return null; // anything else is not a dotted quad
  let v = 0n; // the accumulated address
  for (const p of parts) { // each octet in turn
    if (!/^\d{1,3}$/.test(p)) return null; // one to three digits only
    if (p.length > 1 && p.startsWith("0")) return null; // leading zeros are refused (octal ambiguity)
    const n = Number(p); // the octet value
    if (n > 255) return null; // out of range
    v = (v << 8n) | BigInt(n); // shift in the octet
  } // every octet read
  return v; // the 32-bit address
}

/** Parse an IPv6 address (RFC 4291 text forms, one "::" at most) into an integer, or return null. */
function parseIPv6(s: string): bigint | null {
  if (s.length < 2 || s.length > 45) return null; // shortest "::", longest with an embedded IPv4
  const dbl = s.indexOf("::"); // where the zero run is, if anywhere
  if (dbl !== -1 && s.indexOf("::", dbl + 1) !== -1) return null; // two "::" are ambiguous
  const head = dbl === -1 ? s : s.slice(0, dbl); // groups before the "::"
  const tail = dbl === -1 ? "" : s.slice(dbl + 2); // groups after the "::"
  const headGroups = head === "" ? [] : head.split(":"); // empty head when s starts with "::"
  const tailGroups = tail === "" ? [] : tail.split(":"); // empty tail when s ends with "::"
  const groups: number[] = []; // the 16-bit groups, in order
  const readGroups = (list: string[], out: number[]): boolean => { // parse a run of groups
    for (let i = 0; i < list.length; i++) { // each group
      const g = list[i]; // the text of the group
      if (i === list.length - 1 && g.includes(".")) { // an embedded IPv4 tail (::ffff:192.0.2.1)
        const v4 = parseIPv4(g); // read it as a dotted quad
        if (v4 === null) return false; // malformed
        out.push(Number(v4 >> 16n), Number(v4 & 0xffffn)); // two 16-bit groups
        continue; // next group (there is none)
      } // ordinary group
      if (!/^[0-9a-fA-F]{1,4}$/.test(g)) return false; // one to four hex digits
      out.push(parseInt(g, 16)); // the group value
    } // all read
    return true; // well formed
  }; // readGroups
  const front: number[] = []; // groups before the zero run
  const back: number[] = []; // groups after it
  if (!readGroups(headGroups, front) || !readGroups(tailGroups, back)) return null; // malformed group
  if (dbl === -1) { // no zero run: exactly eight groups
    if (front.length !== 8) return null; // too few or too many
    groups.push(...front); // the whole address
  } else { // a zero run fills the gap
    const missing = 8 - front.length - back.length; // how many zero groups "::" stands for
    if (missing < 1) return null; // "::" must stand for at least one group
    groups.push(...front, ...new Array<number>(missing).fill(0), ...back); // expand it
  } // eight groups now
  let v = 0n; // the accumulated address
  for (const g of groups) v = (v << 16n) | BigInt(g); // shift in each group
  return v; // the 128-bit address
}

/** Format an IPv4 integer as a dotted quad. */
function formatIPv4(v: bigint): string {
  return [24n, 16n, 8n, 0n].map((s) => String(Number((v >> s) & 0xffn))).join("."); // four octets
}

/** Format an IPv6 integer in RFC 5952 canonical form (lowercase, longest zero run of two or more compressed). */
function formatIPv6(v: bigint): string {
  const g: number[] = []; // the eight groups
  for (let i = 7; i >= 0; i--) g.push(Number((v >> BigInt(i * 16)) & 0xffffn)); // most significant first
  let bestStart = -1; // start of the longest zero run
  let bestLen = 0; // its length
  for (let i = 0; i < 8; ) { // scan for zero runs
    if (g[i] !== 0) { i++; continue; } // not a zero group
    let j = i; // end of this run
    while (j < 8 && g[j] === 0) j++; // extend it
    if (j - i > bestLen) { bestStart = i; bestLen = j - i; } // first longest wins (RFC 5952 s4.2.3)
    i = j; // continue after the run
  } // runs found
  const hex = g.map((x) => x.toString(16)); // lowercase, no leading zeros (RFC 5952 s4.1, s4.3)
  if (bestLen < 2) return hex.join(":"); // a single zero group is not compressed (RFC 5952 s4.2.2)
  const left = hex.slice(0, bestStart).join(":"); // groups before the run
  const right = hex.slice(bestStart + bestLen).join(":"); // groups after it
  return `${left}::${right}`; // the compressed form
}

/** Format a prefix canonically. */
function formatPrefix(p: Prefix): string {
  return `${p.family === "ipv4" ? formatIPv4(p.addr) : formatIPv6(p.addr)}/${p.length}`; // address/length
}

/** Parse "address/length"; throws prefix-format or host-bits with the given line. */
function parsePrefix(text: string, line?: number): Prefix {
  const slash = text.indexOf("/"); // the length separator
  if (slash <= 0 || slash !== text.lastIndexOf("/")) { // missing, leading or repeated
    throw new RovError("prefix-format", `"${text}" is not a prefix in address/length form`, line); // refused
  } // one slash
  const addrText = text.slice(0, slash); // the address part
  const lenText = text.slice(slash + 1); // the length part
  if (!/^\d{1,3}$/.test(lenText)) { // the length is one to three digits
    throw new RovError("prefix-format", `"${text}" has no valid prefix length`, line); // refused
  } // digits
  const family: Family = addrText.includes(":") ? "ipv6" : "ipv4"; // a colon means IPv6
  const addr = family === "ipv4" ? parseIPv4(addrText) : parseIPv6(addrText); // the integer
  if (addr === null) { // malformed address
    throw new RovError("prefix-format", `"${addrText}" is not a valid ${family === "ipv4" ? "IPv4" : "IPv6"} address`, line); // refused
  } // address read
  const length = Number(lenText); // the prefix length
  if (length > BITS[family]) { // longer than the address
    throw new RovError("prefix-format", `prefix length /${length} is longer than ${BITS[family]} bits`, line); // refused
  } // length in range
  const hostBits = BigInt(BITS[family] - length); // bits after the prefix
  const network = (addr >> hostBits) << hostBits; // the address with host bits cleared
  if (network !== addr) { // bits set beyond the length
    const p: Prefix = { family, addr: network, length }; // what was probably meant
    throw new RovError("host-bits", `"${text}" has bits set beyond /${length}; the prefix is ${formatPrefix(p)}`, line); // refused
  } // a clean prefix
  return { family, addr, length }; // the parsed prefix
}

// ---------------------------------------------------------------------------
// AS numbers (RFC 5396: asplain, asdot+, asdot)
// ---------------------------------------------------------------------------

/** Parse an AS number in asplain or asdot(+) form, with or without a leading "AS"; throws origin-format or as-range. */
function parseAsn(text: string, line?: number): number {
  const body = /^as/i.test(text) ? text.slice(2) : text; // drop an "AS" prefix
  const dot = /^(\d{1,5})\.(\d{1,5})$/.exec(body); // asdot+: <high>.<low> (RFC 5396 s2)
  if (dot) { // asdot form
    const hi = Number(dot[1]); // high-order 16 bits
    const lo = Number(dot[2]); // low-order 16 bits
    if (hi > 65535 || lo > 65535) { // each half is 16 bits
      throw new RovError("as-range", `"${text}": each half of an asdot AS number is 0 to 65535`, line); // refused
    } // halves in range
    return hi * 65536 + lo; // the asplain value
  } // not asdot
  if (!/^\d{1,10}$/.test(body)) { // asplain: decimal digits only
    throw new RovError("origin-format", `"${text}" is not an AS number (asplain such as AS64496, or asdot such as AS1.10)`, line); // refused
  } // digits
  const n = Number(body); // the value
  if (n > MAX_ASN) { // beyond four octets
    throw new RovError("as-range", `"${text}" is beyond the four-octet AS range (0 to ${MAX_ASN})`, line); // refused
  } // in range
  return n; // the asplain value
}

/** Render an AS number in asdot (RFC 5396 s2: asplain below 65536, asdot+ from 65536). */
export function toAsdot(asn: number): string {
  return asn < 65536 ? String(asn) : `${Math.floor(asn / 65536)}.${asn % 65536}`; // high.low
}

// ---------------------------------------------------------------------------
// The Route
// ---------------------------------------------------------------------------

/** A parsed Route: prefix and origin (or NONE). */
interface Route {
  /** The Route Prefix. */
  prefix: Prefix;
  /** The Route Origin ASN, or "NONE". */
  origin: number | "NONE";
}

/** Parse "<prefix> <origin>"; the origin may be "AS 64496", asdot, or NONE (RFC 6811 s2). */
function parseRoute(raw: string): Route {
  const text = raw.trim(); // ignore surrounding whitespace
  if (text === "") throw new RovError("route-empty", "enter a Route: a prefix and its origin AS, such as 192.0.2.0/24 AS64496"); // nothing to do
  if (text.length > MAX_ROUTE_CHARS) throw new RovError("too-many", `the Route is longer than ${MAX_ROUTE_CHARS} characters`); // bounded
  let tokens = text.split(/[\s,]+/).filter((t) => t !== ""); // prefix and origin, separated by blanks or a comma
  if (tokens.length === 3 && /^as$/i.test(tokens[1])) tokens = [tokens[0], `AS${tokens[2]}`]; // "AS 64496" as RFC 9319 writes it
  if (tokens.length !== 2 || !tokens[0].includes("/")) { // exactly a prefix and an origin
    throw new RovError("route-format", "a Route is a prefix and its origin AS, such as 192.0.2.0/24 AS64496"); // refused
  } // two tokens
  const prefix = parsePrefix(tokens[0]); // the Route Prefix
  if (/^none$/i.test(tokens[1])) return { prefix, origin: "NONE" }; // RFC 6811's distinguished value
  const origin = parseAsn(tokens[1]); // the Route Origin ASN
  if (origin === 0) { // AS 0 cannot originate (RFC 7607 s2)
    throw new RovError("origin-as0", "a Route with origin AS 0 is malformed and is never validated: RFC 7607 section 2 says a BGP speaker MUST NOT originate or propagate it"); // refused
  } // a usable origin
  return { prefix, origin }; // the Route
}

// ---------------------------------------------------------------------------
// VRPs: the line format
// ---------------------------------------------------------------------------

/** One VRP as read, before comparison. */
interface Vrp {
  /** The VRP prefix. */
  prefix: Prefix;
  /** The maximum length (the prefix length when absent). */
  maxLength: number;
  /** True when a maxLength was stated. */
  maxLengthGiven: boolean;
  /** The VRP ASN. */
  asn: number;
  /** Source line (text) or array position (SLURM). */
  line: number;
  /** SLURM comment, if any. */
  comment?: string;
}

/** Check a maxLength against RFC 9582 s4.3.2.2 and return it; throws maxlength-range. */
function checkMaxLength(maxLength: number, prefix: Prefix, line: number): number {
  if (!Number.isInteger(maxLength) || maxLength < prefix.length || maxLength > BITS[prefix.family]) { // outside the MUST range
    throw new RovError("maxlength-range", `maxLength ${maxLength} must be between the prefix length /${prefix.length} and ${BITS[prefix.family]} (RFC 9582 section 4.3.2.2)`, line); // refused
  } // in range
  return maxLength; // accepted
}

/**
 * Parse one VRP line. Fields are separated by blanks or commas:
 *   <prefix>[-maxLength] [maxLength] <AS>   e.g. "192.0.2.0/24 24 AS64496", "192.0.2.0/24-24 AS64496"
 * An AS written with its "AS" prefix may stand anywhere ("AS64496,192.0.2.0/24,24"); a bare AS
 * number must come last, after an optional bare maxLength.
 */
function parseVrpLine(text: string, line: number): Vrp {
  let tokens = text.split(/[\s,]+/).filter((t) => t !== ""); // the fields
  const merged: string[] = []; // fields with "AS 64496" joined into "AS64496"
  for (let i = 0; i < tokens.length; i++) { // each field
    if (/^as$/i.test(tokens[i]) && i + 1 < tokens.length) { merged.push(`AS${tokens[i + 1]}`); i++; continue; } // join "AS" and its number
    merged.push(tokens[i]); // an ordinary field
  } // joined
  tokens = merged; // use the joined fields
  const prefixTokens = tokens.filter((t) => t.includes("/")); // the prefix field
  if (prefixTokens.length !== 1) { // exactly one prefix per line
    throw new RovError("vrp-format", `line ${line}: a VRP is one prefix, an optional maxLength and an AS, such as 192.0.2.0/24 24 AS64496`, line); // refused
  } // one prefix
  let prefixText = prefixTokens[0]; // the prefix, maybe with "-maxLength"
  let maxLength: number | undefined; // the maxLength, if stated
  const dash = /^([^-]+)-(\d{1,3})$/.exec(prefixText); // RFC 9319's "prefix-maxLength" notation
  if (dash) { prefixText = dash[1]; maxLength = Number(dash[2]); } // split it
  const prefix = parsePrefix(prefixText, line); // the VRP prefix
  const rest = tokens.filter((t) => t !== prefixTokens[0]); // everything but the prefix
  const asTagged = rest.filter((t) => /^as/i.test(t)); // AS numbers written with "AS"
  const bare = rest.filter((t) => !/^as/i.test(t)); // bare numbers (maxLength or AS)
  let asText: string; // the AS field
  if (asTagged.length > 1) { // two AS numbers on one line
    throw new RovError("vrp-format", `line ${line}: one AS per VRP (a ROA carries a single AS number)`, line); // refused
  } else if (asTagged.length === 1) { // the AS is marked; any bare number is the maxLength
    asText = asTagged[0]; // the AS
    if (bare.length > 1) throw new RovError("vrp-format", `line ${line}: unexpected field "${bare[1]}"`, line); // too many fields
    if (bare.length === 1) { // a bare maxLength
      if (maxLength !== undefined) throw new RovError("vrp-format", `line ${line}: the maxLength is given twice`, line); // both notations
      if (!/^\d{1,3}$/.test(bare[0])) throw new RovError("vrp-format", `line ${line}: "${bare[0]}" is not a maxLength`, line); // not a length
      maxLength = Number(bare[0]); // the maxLength
    } // maxLength handled
  } else { // no marked AS: positional, [maxLength] AS
    if (bare.length === 0) throw new RovError("vrp-format", `line ${line}: the VRP has no AS`, line); // missing AS
    if (bare.length > 2) throw new RovError("vrp-format", `line ${line}: unexpected field "${bare[2]}"`, line); // too many fields
    asText = bare[bare.length - 1]; // the last bare field is the AS
    if (bare.length === 2) { // the first is the maxLength
      if (maxLength !== undefined) throw new RovError("vrp-format", `line ${line}: the maxLength is given twice`, line); // both notations
      if (!/^\d{1,3}$/.test(bare[0])) throw new RovError("vrp-format", `line ${line}: "${bare[0]}" is not a maxLength`, line); // not a length
      maxLength = Number(bare[0]); // the maxLength
    } // maxLength handled
  } // AS found
  const asn = parseAsn(asText, line); // the VRP ASN (AS 0 allowed: RFC 6483 s4)
  const given = maxLength !== undefined; // was a maxLength stated?
  const ml = checkMaxLength(given ? (maxLength as number) : prefix.length, prefix, line); // absent means exact (RFC 9582 s4.3.2.2)
  return { prefix, maxLength: ml, maxLengthGiven: given, asn, line }; // the VRP
}

/** Read the line format: "#" starts a comment, blank lines are skipped. */
function parseVrpText(text: string): Vrp[] {
  const out: Vrp[] = []; // the VRPs
  const lines = text.split(/\r?\n/); // one VRP per line
  for (let i = 0; i < lines.length; i++) { // each line
    const hash = lines[i].indexOf("#"); // a comment, if any
    const body = (hash === -1 ? lines[i] : lines[i].slice(0, hash)).trim(); // the line without it
    if (body === "") continue; // blank or comment-only
    if (out.length >= MAX_VRPS) throw new RovError("too-many", `more than ${MAX_VRPS} VRPs`); // bounded
    out.push(parseVrpLine(body, i + 1)); // the VRP, with its 1-based line
  } // all lines
  return out; // the list
}

// ---------------------------------------------------------------------------
// VRPs: SLURM (RFC 8416 s3.4.1 prefixAssertions)
// ---------------------------------------------------------------------------

/** Top-level members of a SLURM file (RFC 8416 s3.2). */
const SLURM_MEMBERS = new Set(["slurmVersion", "validationOutputFilters", "locallyAddedAssertions"]); // s3.2
/** Members RFC 8416 s3.4.1 defines for a ROA Prefix Assertion. */
const ASSERTION_MEMBERS = new Set(["prefix", "asn", "maxPrefixLength", "comment"]); // s3.4.1

/** Is this a plain JSON object (not an array, not null)? */
function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v); // a JSON object
}

/** Read SLURM prefixAssertions from a full file, a { prefixAssertions } object or a bare array. */
function parseSlurm(doc: unknown): { vrps: Vrp[]; filters: number } {
  let assertions: unknown; // the prefixAssertions array
  let filters = 0; // prefixFilters present (reported, not applied)
  if (Array.isArray(doc)) { // a bare array of assertions
    assertions = doc; // use it as is
  } else if (isObject(doc)) { // an object
    if ("slurmVersion" in doc && doc.slurmVersion !== 1) { // RFC 8416 s3.2: MUST be 1
      throw new RovError("slurm-version", `slurmVersion must be 1 (RFC 8416 section 3.2), got ${JSON.stringify(doc.slurmVersion)}`); // refused
    } // version fine or absent
    const out = doc.validationOutputFilters; // the filters member, if any
    if (isObject(out) && Array.isArray(out.prefixFilters)) filters = out.prefixFilters.length; // counted only
    const added = doc.locallyAddedAssertions; // the assertions member, if any
    if (isObject(added)) { // a full SLURM file: only the three members RFC 8416 s3.2 defines
      for (const k of Object.keys(doc)) { // each top-level member
        if (!SLURM_MEMBERS.has(k)) throw new RovError("slurm-member", `"${k}" is not a member of a SLURM file (RFC 8416 section 3.2)`); // refused
      } // members fine
    } // checked
    if (isObject(added)) assertions = added.prefixAssertions; // a full SLURM file
    else if ("prefixAssertions" in doc) assertions = doc.prefixAssertions; // a { prefixAssertions } object
    else throw new RovError("slurm-format", "the JSON has no locallyAddedAssertions.prefixAssertions (RFC 8416 section 3.4.1)"); // nothing to read
  } else { // neither
    throw new RovError("slurm-format", "the JSON must be a SLURM file, an object with prefixAssertions, or an array of them"); // refused
  } // assertions located
  if (!Array.isArray(assertions)) throw new RovError("slurm-format", "prefixAssertions must be an array (RFC 8416 section 3.4.1)"); // wrong type
  if (assertions.length > MAX_VRPS) throw new RovError("too-many", `more than ${MAX_VRPS} VRPs`); // bounded
  const vrps: Vrp[] = []; // the VRPs
  assertions.forEach((a, i) => { // each assertion, 1-based position i + 1
    const pos = i + 1; // the position reported in errors
    if (!isObject(a)) throw new RovError("slurm-format", `assertion ${pos} is not an object`, pos); // wrong type
    for (const k of Object.keys(a)) { // RFC 8416 s3.1: undefined members MUST NOT be used
      if (!ASSERTION_MEMBERS.has(k)) throw new RovError("slurm-member", `assertion ${pos}: "${k}" is not a member RFC 8416 section 3.4.1 defines`, pos); // refused
    } // members fine
    if (typeof a.prefix !== "string") throw new RovError("slurm-format", `assertion ${pos}: "prefix" must be a string`, pos); // required
    if (typeof a.asn !== "number" || !Number.isInteger(a.asn) || a.asn < 0 || a.asn > MAX_ASN) { // required, a number
      throw new RovError("as-range", `assertion ${pos}: "asn" must be a number from 0 to ${MAX_ASN}`, pos); // refused
    } // asn fine
    const prefix = parsePrefix(a.prefix.trim(), pos); // the prefix (uppercase hex accepted, as RFC 8416's own example writes it)
    const given = a.maxPrefixLength !== undefined; // optional member
    if (given && typeof a.maxPrefixLength !== "number") throw new RovError("maxlength-range", `assertion ${pos}: "maxPrefixLength" must be a number`, pos); // wrong type
    const ml = checkMaxLength(given ? (a.maxPrefixLength as number) : prefix.length, prefix, pos); // RFC 9582 range
    if (a.comment !== undefined && typeof a.comment !== "string") throw new RovError("slurm-format", `assertion ${pos}: "comment" must be a string`, pos); // wrong type
    vrps.push({ prefix, maxLength: ml, maxLengthGiven: given, asn: a.asn, line: pos, ...(typeof a.comment === "string" ? { comment: a.comment } : {}) }); // the VRP
  }); // all assertions
  return { vrps, filters }; // the VRPs and the filter count
}

/** Read the VRPs from text (line format or JSON text) or from parsed JSON. */
function parseVrps(input: unknown): { vrps: Vrp[]; format: "text" | "slurm"; filters: number } {
  if (typeof input === "string") { // text: the line format, or JSON as text
    if (input.length > MAX_VRP_CHARS) throw new RovError("too-many", `the VRP list is longer than ${MAX_VRP_CHARS} characters`); // bounded
    const t = input.trim(); // ignore surrounding whitespace
    if (t === "") throw new RovError("vrps-empty", "enter at least one VRP: a prefix, an optional maxLength and an AS, one per line"); // nothing to compare with
    if (t.startsWith("{") || t.startsWith("[")) { // JSON
      let doc: unknown; // the parsed document
      try { doc = JSON.parse(t); } catch { throw new RovError("slurm-format", "the VRP list starts like JSON but does not parse as JSON"); } // not JSON
      const s = parseSlurm(doc); // read it as SLURM
      return { vrps: s.vrps, format: "slurm", filters: s.filters }; // SLURM VRPs
    } // the line format
    return { vrps: parseVrpText(t), format: "text", filters: 0 }; // text VRPs
  } // parsed JSON (the API's JSON body may carry the SLURM object itself)
  if (Array.isArray(input) || isObject(input)) { // a SLURM structure
    const s = parseSlurm(input); // read it
    return { vrps: s.vrps, format: "slurm", filters: s.filters }; // SLURM VRPs
  } // anything else
  throw new RovError("vrps-empty", "enter at least one VRP: a prefix, an optional maxLength and an AS, one per line"); // nothing usable
}

// ---------------------------------------------------------------------------
// The comparison (RFC 6811 section 2)
// ---------------------------------------------------------------------------

/** Does the VRP prefix Cover the Route prefix? (RFC 6811 s2, "Covered") */
function covers(vrp: Prefix, route: Prefix): boolean {
  if (vrp.family !== route.family) return false; // another family never covers
  if (vrp.length > route.length) return false; // "VRP prefix length is less than or equal to the Route prefix length"
  const shift = BigInt(BITS[vrp.family] - vrp.length); // bits the VRP length leaves unspecified
  return vrp.addr >> shift === route.addr >> shift; // "identical for all bits specified by the VRP prefix length"
}

/** 2^(maxLength - length + 1) - 1: every prefix from /length to /maxLength inside the VRP prefix. */
function authorisedCount(length: number, maxLength: number): string {
  return ((1n << BigInt(maxLength - length + 1)) - 1n).toString(); // exact, any size
}

/**
 * run: validate one Route against a VRP list.
 * @param input { route: "<prefix> <origin AS>", vrps: line-format text, SLURM JSON text, or parsed SLURM JSON }
 * @returns the RFC 6811 state, each VRP's relation, the RFC 9319 maxLength notes and the notes
 */
export function run(input: RovInput): RovResult {
  if (!isObject(input) || typeof input.route !== "string") { // the API's request shape
    throw new RovError("request-format", 'the request is an object { "route": "<prefix> <origin AS>", "vrps": "<one VRP per line, or SLURM JSON>" }'); // refused
  } // shape fine
  const route = parseRoute(input.route); // the Route
  const parsed = parseVrps(input.vrps); // the VRPs as given
  // Duplicates: identical prefix, maxLength and AS count once (RFC 8416 s3.4.1 sends the set "excluding duplicates").
  const seen = new Set<string>(); // keys already read
  const vrps: Vrp[] = []; // the distinct VRPs, input order kept
  for (const v of parsed.vrps) { // each VRP
    const key = `${formatPrefix(v.prefix)} ${v.maxLength} ${v.asn}`; // its identity
    if (seen.has(key)) continue; // a duplicate
    seen.add(key); // remember it
    vrps.push(v); // keep it
  } // deduplicated
  if (vrps.length === 0) throw new RovError("vrps-empty", "enter at least one VRP: a prefix, an optional maxLength and an AS, one per line"); // an empty SLURM array
  const duplicatesRemoved = parsed.vrps.length - vrps.length; // how many were dropped
  const rp = route.prefix; // shorthand for the Route Prefix
  const reports: VrpReport[] = []; // one report per VRP
  const maxLengthNotes: MaxLengthNote[] = []; // the RFC 9319 notes
  let covering = 0; // VRPs that Cover
  let matching = 0; // VRPs that Match
  let as0Covering = 0; // covering VRPs with AS 0
  vrps.forEach((v, i) => { // each VRP, 1-based index i + 1
    const isCovering = covers(v.prefix, rp); // the Covered test
    let relation: VrpRelation; // the relation to report
    let viaMaxLength: boolean | undefined; // set on a match through a maxLength range
    if (v.prefix.family !== rp.family) relation = "other-family"; // never compared
    else if (!isCovering) relation = "not-covering"; // does not Cover
    else if (v.asn === 0) relation = "as0"; // "no Route can be Matched by a VRP whose ASN is zero"
    else if (route.origin === "NONE") relation = "origin-none"; // "a Route whose Origin ASN is "NONE" cannot be Matched"
    else { // a candidate for Matched
      const tooLong = rp.length > v.maxLength; // "Route prefix length is less than or equal to the VRP maximum length" fails
      const otherAs = route.origin !== v.asn; // "Route Origin ASN is equal to the VRP ASN" fails
      if (tooLong && otherAs) relation = "wrong-as-and-too-specific"; // both fail
      else if (tooLong) relation = "too-specific"; // length fails
      else if (otherAs) relation = "wrong-as"; // AS fails
      else { relation = "match"; viaMaxLength = rp.length > v.prefix.length; } // Matched; longer than the VRP prefix means maxLength did it
    } // relation set
    if (isCovering) covering++; // count Covers
    if (relation === "match") matching++; // count Matches
    if (relation === "as0") as0Covering++; // count AS 0 Covers
    reports.push({ // the VRP report
      index: i + 1, // position
      line: v.line, // source line or position
      prefix: formatPrefix(v.prefix), // canonical prefix
      length: v.prefix.length, // prefix length
      maxLength: v.maxLength, // maximum length
      maxLengthGiven: v.maxLengthGiven, // stated or implied
      asn: v.asn, // the AS
      ...(v.comment !== undefined ? { comment: v.comment } : {}), // the SLURM comment
      covers: isCovering, // Covered?
      relation, // the relation
      ...(viaMaxLength !== undefined ? { viaMaxLength } : {}), // only on a match
    }); // reported
    // RFC 9319 s5: a maxLength beyond the prefix length usually makes a ROA non-minimal. AS 0 authorises nothing, so it is left out.
    if (v.maxLength > v.prefix.length && v.asn !== 0) { // a range, not one prefix
      maxLengthNotes.push({ index: i + 1, prefix: formatPrefix(v.prefix), length: v.prefix.length, maxLength: v.maxLength, asn: v.asn, authorisedPrefixes: authorisedCount(v.prefix.length, v.maxLength), coversRoute: isCovering }); // the note
    } // noted
  }); // all VRPs compared
  // The state, exactly as RFC 6811 section 2 defines it.
  const state: RovResult["state"] = matching > 0 ? "Valid" : covering > 0 ? "Invalid" : "NotFound"; // Valid wins, then Invalid
  const notes: RovNoteCode[] = []; // the notes, in a fixed order
  if (route.origin === "NONE") notes.push("origin-none"); // RFC 6811 s2
  if (state === "Invalid" && as0Covering === covering) notes.push("as0-only"); // only AS 0 Covers: the holder disavows routing (RFC 6483 s4)
  if (state === "Valid" && as0Covering > 0) notes.push("as0-overridden"); // AS 0 has a lower relative preference (RFC 6483 s4)
  if (state === "Valid" && reports.every((r) => r.relation !== "match" || r.viaMaxLength === true)) notes.push("valid-via-maxlength"); // every Match is through a range
  if (duplicatesRemoved > 0) notes.push("duplicates-removed"); // RFC 8416 s3.4.1
  if (parsed.filters > 0) notes.push("slurm-filters-not-applied"); // RFC 8416 s3.2
  return { // the result
    route: { // the Route as read
      prefix: formatPrefix(rp), // canonical
      family: rp.family, // family
      length: rp.length, // length
      origin: route.origin, // asplain or NONE
      ...(route.origin !== "NONE" ? { originAsdot: toAsdot(route.origin) } : {}), // asdot when numeric
    }, // route
    state, // the verdict
    vrpFormat: parsed.format, // text or slurm
    vrpCount: vrps.length, // distinct VRPs
    covering, // how many Cover
    matching, // how many Match
    vrps: reports, // per-VRP detail
    maxLengthNotes, // RFC 9319 notes
    notes, // notes
    duplicatesRemoved, // dropped duplicates
    slurmFiltersIgnored: parsed.filters, // filters present, not applied
  }; // done
}
