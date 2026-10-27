// ============================================================================
// src/lib/dev-out/doh-lookup/wire.ts
// ----------------------------------------------------------------------------
// THE DNS WIRE FORMAT, BOTH WAYS, for the DNS-over-HTTPS lookup
// (/dev/out/doh-lookup, 2026-10-27). Pure and deterministic: no network, no
// clock, no randomness. The page builds the query here, shows its bytes, and
// decodes the resolver's answer here; golden-vectors.ts pins both directions.
//
// WHAT IT FOLLOWS (all read 2026-10-27 at rfc-editor.org):
//   - RFC 8484 (DoH): one DNS message in "application/dns-message", "the DNS
//     on-the-wire format defined in Section 4.2.1 of [RFC1035]", at most 65535
//     bytes; for GET, base64url "Padding characters for base64url MUST NOT be
//     included" (section 6); clients "SHOULD use a DNS ID of 0" (4.1).
//   - RFC 1035 sections 3.1 (names as length-prefixed labels, a zero octet at
//     the root), 2.3.4 (labels of 63 octets or less, names of 255 octets or
//     less), 4.1.1 (the header), 4.1.2 (the question), 4.1.3 (resource
//     records), 4.1.4 (message compression: a two-octet pointer whose first
//     two bits are ones, "a pointer to a prior occurance of the same name"),
//     3.3 and 3.4 (the RDATA of CNAME, MX, NS, PTR, SOA, TXT and A), 5.1
//     (\X and \DDD escapes in presentation form).
//   - RFC 3596 section 2.2 (AAAA: 16 octets); RFC 5952 section 4 (how an IPv6
//     address is written: lower case, no leading zeros, the longest run of
//     two or more zero fields as "::", the first run on a tie).
//   - RFC 6891 section 6.1 (the OPT pseudo-RR: root owner, CLASS = payload
//     size, TTL = extended RCODE, VERSION, DO and Z, options as code, length,
//     data; "MUST be 0 (root domain)"); RFC 3225 (the DO bit); RFC 7830
//     section 3 (Padding, option 12, octets "SHOULD be set to 0x00"); RFC
//     8467 section 4.1 (queries padded "to the closest multiple of 128
//     octets"); RFC 8914 section 2 (Extended DNS Error, option 15: INFO-CODE
//     then UTF-8 EXTRA-TEXT); RFC 5001 (NSID, option 3); RFC 7871 section 6
//     (client subnet, option 8); RFC 7873 (COOKIE, option 10).
//   - RFC 4034 sections 2.1 and 2.2 (DNSKEY), 3.1 and 3.2 (RRSIG, signer name
//     uncompressed, times as YYYYMMDDHHmmSS), 4.1 and 4.1.2 (NSEC and its type
//     bit maps), 5.1 and 5.3 (DS), Appendix B (the key tag); RFC 5155 sections
//     3.2, 3.3, 4.2 and 4.3 (NSEC3, NSEC3PARAM, base32hex without padding);
//     RFC 9460 sections 2.2 and 7 and Appendix A (SVCB and HTTPS); RFC 8659
//     section 4.1 (CAA); RFC 3597 section 5 (unknown types as \# length hex);
//     RFC 2181 section 8 (a TTL with its top bit set is treated as zero).
//   - RFC 4648 sections 4, 5 and 7 (base64, base64url, base32hex).
//
// STRICT LIMITS. A message longer than 65535 bytes or shorter than its
// 12-byte header is refused; so is a name that runs past the end, uses a
// reserved label type, exceeds 255 octets, or follows a compression pointer
// that does not point strictly before the place the name (or the previous
// jump) began, which makes a pointer loop impossible; so is a record whose
// fixed fields or RDATA run past the end, an OPT record that is not at the
// root or not in the additional section, a second OPT record, an option that
// overruns its record, and any byte left over after the last record. A
// record whose RDATA does not have its type's shape is kept and shown in the
// generic RFC 3597 form, marked malformed, rather than guessed at.
//
// PRIME DIRECTIVE (D-19): every line commented.
// ============================================================================

// The registry tables, for type, class, option, algorithm and digest names.
import {
  typeName,
  className,
  rcodeName,
  SVC_PARAM_KEY_NAMES,
  EDE_NAMES,
  EDNS_OPTION_NAMES,
  DNSSEC_ALGORITHM_NAMES,
  DS_DIGEST_NAMES,
} from "./tables";

// ----------------------------------------------------------------------------
// Limits and fixed values, each with its source
// ----------------------------------------------------------------------------

/** The largest message this module encodes or decodes (RFC 8484 section 6: "restricts the maximum size ... to 65535 bytes"). */
export const MAX_MESSAGE_OCTETS = 65535;

/** The DNS header is twelve octets (RFC 1035 section 4.1.1). */
export const HEADER_OCTETS = 12;

/** A label holds at most 63 octets (RFC 1035 section 2.3.4). */
export const MAX_LABEL_OCTETS = 63;

/** A name holds at most 255 octets in wire form, length octets and the root's zero included (RFC 1035 section 2.3.4). */
export const MAX_NAME_OCTETS = 255;

/**
 * The most compression pointers one name may follow. Each pointer must already point strictly before the previous
 * jump (so a loop cannot happen); this cap is a second, independent stop. A 255-octet name has at most 127 labels.
 */
export const MAX_POINTER_JUMPS = 127;

/** The EDNS UDP payload size advertised (RFC 6891 section 6.2.5 suggests 4096 "as a starting point"; DoH servers "MUST ignore" it, RFC 8484 section 6). */
export const EDNS_PAYLOAD_SIZE = 4096;

/** Queries are padded to a multiple of this many octets (RFC 8467 section 4.1). */
export const QUERY_PADDING_BLOCK = 128;

/** The RR type numbers this module encodes or decodes by name (IANA RR TYPEs). */
export const T = Object.freeze({
  // RFC 1035 types.
  A: 1, NS: 2, CNAME: 5, SOA: 6, PTR: 12, MX: 15, TXT: 16,
  // IPv6 addresses and DNAME.
  AAAA: 28, DNAME: 39,
  // The EDNS pseudo-type.
  OPT: 41,
  // DNSSEC.
  DS: 43, RRSIG: 46, NSEC: 47, DNSKEY: 48, NSEC3: 50, NSEC3PARAM: 51, CDS: 59, CDNSKEY: 60,
  // Service bindings.
  SVCB: 64, HTTPS: 65,
  // The compact denial signal (RFC 9824).
  NXNAME: 128,
  // Certification authority authorisation.
  CAA: 257,
});

/** The EDNS option codes this module reads by name (IANA EDNS0 Option Codes). */
export const OPT_CODE = Object.freeze({
  // RFC 5001.
  NSID: 3,
  // RFC 7871.
  CLIENT_SUBNET: 8,
  // RFC 7873.
  COOKIE: 10,
  // RFC 7830.
  PADDING: 12,
  // RFC 8914.
  EDE: 15,
});

/** The Internet class (RFC 1035 section 3.2.4). */
export const CLASS_IN = 1;

// ----------------------------------------------------------------------------
// Refusals
// ----------------------------------------------------------------------------

/** Why a byte sequence was refused as a DNS message. */
export type WireRefusal =
  // Fewer octets than the 12-octet header.
  | "tooShort"
  // More than 65535 octets.
  | "tooLarge"
  // A name runs past the end of the message (or of its RDATA).
  | "truncatedName"
  // A label length octet starting with the bits 01 or 10 (reserved label types).
  | "badLabelType"
  // A compression pointer that does not point strictly before where its name, or the previous jump, began.
  | "badPointer"
  // More compression pointers than MAX_POINTER_JUMPS in one name.
  | "tooManyPointers"
  // A name longer than 255 octets.
  | "nameTooLong"
  // A question or record whose fixed fields or RDATA run past the end.
  | "truncatedRecord"
  // Octets left over after the last record the header counts.
  | "trailingBytes"
  // An OPT record whose owner is not the root.
  | "optNotRoot"
  // An OPT record in the answer or authority section.
  | "optOutsideAdditional"
  // More than one OPT record.
  | "multipleOpt"
  // An EDNS option that runs past the end of the OPT record.
  | "badOption";

/** A refusal, carrying its code and, where one octet is to blame, its offset. */
export class WireError extends Error {
  /** Which rule refused the message. */
  code: WireRefusal;
  /** The offset of the offending octet, or null. */
  offset: number | null;
  /**
   * @param code the rule that refused
   * @param offset the offset of the offending octet, when one is to blame
   */
  constructor(code: WireRefusal, offset: number | null = null) {
    // The message is the code: no message content is echoed into errors.
    super(code);
    // A recognisable name.
    this.name = "WireError";
    // Keep the code for callers and vectors.
    this.code = code;
    // And the offset.
    this.offset = offset;
  }
}

// ----------------------------------------------------------------------------
// Bytes to text: hex, base64, base64url, base32hex
// ----------------------------------------------------------------------------

/**
 * Bytes as hexadecimal.
 * @param bytes the octets
 * @param upper true for upper case (DS digests, NSEC3 salts), false for lower case
 * @returns two characters per octet
 */
export function toHex(bytes: Uint8Array, upper = true): string {
  // The characters, appended octet by octet.
  let out = "";
  // Each octet as two hexadecimal digits.
  for (const b of bytes) out += b.toString(16).padStart(2, "0");
  // In the case asked for.
  return upper ? out.toUpperCase() : out;
}

// The base64 alphabet (RFC 4648 section 4, Table 1).
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/**
 * Bytes as base64 with padding (RFC 4648 section 4), the form DNSKEY, RRSIG and ECH values are presented in.
 * @param bytes the octets
 * @returns the base64 text
 */
export function toBase64(bytes: Uint8Array): string {
  // The output.
  let out = "";
  // Three octets at a time become four characters.
  for (let i = 0; i < bytes.length; i += 3) {
    // The 24-bit group, missing octets as zero.
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    // The first two characters always exist.
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63];
    // The third, or "=" when the group had one octet.
    out += i + 1 < bytes.length ? B64[(n >> 6) & 63] : "=";
    // The fourth, or "=" when the group had fewer than three octets.
    out += i + 2 < bytes.length ? B64[n & 63] : "=";
  }
  // Done.
  return out;
}

/**
 * Bytes as base64url without padding (RFC 4648 section 5; RFC 8484 section 6: "Padding characters for base64url
 * MUST NOT be included"), the form of the GET request's dns parameter.
 * @param bytes the octets
 * @returns the base64url text
 */
export function toBase64Url(bytes: Uint8Array): string {
  // base64 first, then the two URL-safe substitutions ("-" for "+", "_" for "/"), then no padding.
  return toBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * base64 or base64url text back to bytes (fixtures and vectors; strict: any other character refuses).
 * @param text base64 (with or without padding) or base64url
 * @returns the octets, or null when the text is not base64
 */
export function fromBase64(text: string): Uint8Array | null {
  // Accept both alphabets: map the URL-safe characters back, drop padding.
  const s = text.replace(/-/g, "+").replace(/_/g, "/").replace(/=+$/, "");
  // One leftover character can never encode a whole octet.
  if (s.length % 4 === 1) return null;
  // The output, sized exactly.
  const out = new Uint8Array(Math.floor((s.length * 3) / 4));
  // Bits waiting to be written, and how many.
  let acc = 0;
  let bits = 0;
  // Next output position.
  let o = 0;
  // Walk every character.
  for (const ch of s) {
    // Its six-bit value, or -1.
    const v = B64.indexOf(ch);
    // Not base64: refuse.
    if (v < 0) return null;
    // Append six bits.
    acc = (acc << 6) | v;
    bits += 6;
    // A whole octet is ready.
    if (bits >= 8) {
      // Take the top eight bits.
      bits -= 8;
      out[o++] = (acc >> bits) & 0xff;
    }
  }
  // Exactly the octets decoded.
  return out.subarray(0, o);
}

// The base32hex alphabet (RFC 4648 section 7, Table 4), used by NSEC3 (RFC 5155 section 3.3).
const B32HEX = "0123456789ABCDEFGHIJKLMNOPQRSTUV";

/**
 * Bytes as base32hex without padding (RFC 5155 section 3.3: "an unpadded sequence of case-insensitive base32 digits").
 * @param bytes the octets
 * @returns the base32hex text, upper case
 */
export function toBase32Hex(bytes: Uint8Array): string {
  // The output.
  let out = "";
  // Bits waiting, and how many.
  let acc = 0;
  let bits = 0;
  // Every octet adds eight bits.
  for (const b of bytes) {
    // Append the octet.
    acc = ((acc << 8) | b) & 0xffff;
    bits += 8;
    // Emit every whole five-bit group.
    while (bits >= 5) {
      // The top five bits.
      bits -= 5;
      out += B32HEX[(acc >> bits) & 31];
    }
  }
  // The last partial group, padded with zero bits.
  if (bits > 0) out += B32HEX[(acc << (5 - bits)) & 31];
  // No "=" padding.
  return out;
}

// ----------------------------------------------------------------------------
// Presentation of names and character strings (RFC 1035 section 5.1)
// ----------------------------------------------------------------------------

// The characters a label escapes with a backslash in presentation form: the label separator, the escape itself,
// and the characters that are special in master files (RFC 1035 section 5.1), as dig writes them.
const LABEL_SPECIAL = new Set([0x2e, 0x5c, 0x22, 0x28, 0x29, 0x3b, 0x40, 0x24]);

/**
 * One label in presentation form: printable ASCII as itself, the special characters as \X, every other octet as
 * \DDD with three decimal digits (RFC 1035 section 5.1), so the text maps back to exactly the same octets.
 * @param label the label's octets
 * @returns the escaped text
 */
export function labelToText(label: Uint8Array): string {
  // The output.
  let out = "";
  // Walk every octet.
  for (const b of label) {
    // The special characters keep their glyph behind a backslash.
    if (LABEL_SPECIAL.has(b)) out += "\\" + String.fromCharCode(b);
    // Printable ASCII other than space: itself.
    else if (b > 0x20 && b < 0x7f) out += String.fromCharCode(b);
    // Everything else: \DDD.
    else out += "\\" + String(b).padStart(3, "0");
  }
  // Done.
  return out;
}

/**
 * A name in presentation form, absolute (ending in "."); the root is ".".
 * @param labels the labels' octets, leftmost first
 * @returns the text
 */
export function nameToText(labels: Uint8Array[]): string {
  // The root on its own.
  if (labels.length === 0) return ".";
  // Each label escaped, joined with dots, and the final dot of an absolute name.
  return labels.map(labelToText).join(".") + ".";
}

/**
 * A character-string in presentation form: in double quotes, with the quote and the backslash escaped and every
 * octet outside printable ASCII written \DDD (RFC 1035 section 5.1; dig writes TXT and CAA values this way).
 * @param bytes the string's octets (without its length octet)
 * @returns the quoted text
 */
export function charStringToText(bytes: Uint8Array): string {
  // The opening quote.
  let out = '"';
  // Walk every octet.
  for (const b of bytes) {
    // The quote and the backslash are escaped.
    if (b === 0x22 || b === 0x5c) out += "\\" + String.fromCharCode(b);
    // Printable ASCII, space included, is itself.
    else if (b >= 0x20 && b < 0x7f) out += String.fromCharCode(b);
    // Everything else: \DDD.
    else out += "\\" + String(b).padStart(3, "0");
  }
  // The closing quote.
  return out + '"';
}

/**
 * A name's comparison key: ASCII letters folded to lower case, nothing else changed (RFC 4343: DNS names compare
 * case-insensitively for ASCII letters only).
 * @param labels the labels' octets
 * @returns the lower-cased presentation text
 */
export function nameKey(labels: Uint8Array[]): string {
  // Fold A-Z to a-z octet by octet, then present.
  return nameToText(labels.map((l) => l.map((b) => (b >= 0x41 && b <= 0x5a ? b + 0x20 : b))));
}

// ----------------------------------------------------------------------------
// Addresses
// ----------------------------------------------------------------------------

/**
 * Four octets as a dotted-quad IPv4 address.
 * @param b the four octets
 * @returns the address text
 */
export function ipv4ToText(b: Uint8Array): string {
  // Each octet in decimal, joined with dots.
  return Array.from(b).join(".");
}

/**
 * Sixteen octets as an IPv6 address in RFC 5952 section 4 form (lower case, no leading zeros, the longest run of two
 * or more zero fields as "::", the first such run on a tie), with an IPv4-mapped address in mixed notation (section
 * 5), as dig prints it.
 * @param b the sixteen octets
 * @returns the address text
 */
export function ipv6ToText(b: Uint8Array): string {
  // The eight 16-bit fields.
  const f: number[] = [];
  // Two octets per field.
  for (let i = 0; i < 16; i += 2) f.push((b[i] << 8) | b[i + 1]);
  // IPv4-mapped (::ffff:a.b.c.d): RFC 5952 section 5 recommends the mixed notation.
  if (f.slice(0, 5).every((x) => x === 0) && f[5] === 0xffff) return `::ffff:${ipv4ToText(b.subarray(12, 16))}`;
  // Find the longest run of zero fields (length at least two); the first one wins a tie.
  let bestStart = -1;
  let bestLen = 0;
  // Walk the fields.
  for (let i = 0; i < 8; ) {
    // Not zero: move on.
    if (f[i] !== 0) {
      // Next field.
      i++;
      continue;
    }
    // Measure this run.
    let j = i;
    while (j < 8 && f[j] === 0) j++;
    // Longer than the best so far (strictly, so the first run wins a tie).
    if (j - i > bestLen) {
      // Remember it.
      bestStart = i;
      bestLen = j - i;
    }
    // Continue after the run.
    i = j;
  }
  // Fields in lower-case hexadecimal without leading zeros.
  const hex = f.map((x) => x.toString(16));
  // A single zero field is never compressed (RFC 5952 section 4.2.2).
  if (bestLen < 2) return hex.join(":");
  // The fields before and after the run.
  const head = hex.slice(0, bestStart).join(":");
  const tail = hex.slice(bestStart + bestLen).join(":");
  // "::" in place of the run.
  return `${head}::${tail}`;
}

// ----------------------------------------------------------------------------
// The query (RFC 1035 sections 4.1.1 and 4.1.2; RFC 6891; RFC 7830; RFC 8467)
// ----------------------------------------------------------------------------

/** What the query carries. */
export interface QueryOptions {
  /** The name's labels as ASCII text, leftmost first ([] is the root). */
  labels: string[];
  /** The query type. */
  qtype: number;
  /** RD: ask the resolver to recurse. */
  recursionDesired: boolean;
  /** AD in the query: "the requester understands and is interested in the value of the AD bit" (RFC 6840 section 5.7). */
  authenticData: boolean;
  /** CD: ask the resolver not to validate (RFC 4035 section 3.2.2). */
  checkingDisabled: boolean;
  /** Add an OPT record (EDNS(0), RFC 6891). */
  edns: boolean;
  /** The DO bit in the OPT record: DNSSEC records wanted (RFC 3225). Ignored without EDNS. */
  dnssecOk: boolean;
  /** Pad the query to a multiple of 128 octets with the Padding option (RFC 7830; RFC 8467 section 4.1). Ignored without EDNS. */
  pad: boolean;
}

/**
 * The query's name in wire form: each label as its length octet and its octets, then the root's zero octet.
 * @param labels the labels as text; each must already be 1 to 63 ASCII characters (checked by the caller)
 * @returns the octets
 */
export function encodeName(labels: string[]): Uint8Array {
  // Room for every label, its length octet and the root octet.
  const out: number[] = [];
  // Each label.
  for (const l of labels) {
    // The length octet.
    out.push(l.length);
    // The label's ASCII octets.
    for (let i = 0; i < l.length; i++) out.push(l.charCodeAt(i) & 0xff);
  }
  // The root.
  out.push(0);
  // As bytes.
  return Uint8Array.from(out);
}

/**
 * Build the query message. The ID is always 0 (RFC 8484 section 4.1: "SHOULD use a DNS ID of 0 in every DNS
 * request"), the opcode QUERY, one question in class IN.
 * @param o what the query carries
 * @returns the wire-format message
 */
export function buildQuery(o: QueryOptions): Uint8Array {
  // The question name.
  const qname = encodeName(o.labels);
  // The header's second 16-bit word: QR 0, opcode 0, AA 0, TC 0, then RD, RA 0, Z 0, AD, CD, RCODE 0.
  const flags = (o.recursionDesired ? 0x0100 : 0) | (o.authenticData ? 0x0020 : 0) | (o.checkingDisabled ? 0x0010 : 0);
  // The octets, built in order.
  const out: number[] = [];
  // ID 0.
  out.push(0, 0);
  // The flags word.
  out.push(flags >> 8, flags & 0xff);
  // QDCOUNT 1, ANCOUNT 0, NSCOUNT 0, ARCOUNT 1 with EDNS or 0 without.
  out.push(0, 1, 0, 0, 0, 0, 0, o.edns ? 1 : 0);
  // QNAME.
  out.push(...qname);
  // QTYPE.
  out.push((o.qtype >> 8) & 0xff, o.qtype & 0xff);
  // QCLASS IN.
  out.push(0, CLASS_IN);
  // Without EDNS the message ends here.
  if (!o.edns) return Uint8Array.from(out);
  // The OPT record's owner is the root (RFC 6891 section 6.1.2: "MUST be 0").
  out.push(0);
  // TYPE OPT (41).
  out.push(0, T.OPT);
  // CLASS: the requestor's UDP payload size.
  out.push(EDNS_PAYLOAD_SIZE >> 8, EDNS_PAYLOAD_SIZE & 0xff);
  // TTL: EXTENDED-RCODE 0, VERSION 0, then the DO bit at the top of the flags, Z zero (RFC 6891 section 6.1.3).
  out.push(0, 0, o.dnssecOk ? 0x80 : 0, 0);
  // Without padding, RDLEN 0 and no options.
  if (!o.pad) {
    // RDLEN 0.
    out.push(0, 0);
    // Done.
    return Uint8Array.from(out);
  }
  // With padding: the message so far, plus RDLEN (2) and the option's code and length (4), padded to 128.
  const unpadded = out.length + 2 + 4;
  // The padding octets needed to reach the next multiple of 128 (none when already a multiple).
  const padLen = (QUERY_PADDING_BLOCK - (unpadded % QUERY_PADDING_BLOCK)) % QUERY_PADDING_BLOCK;
  // RDLEN: one option of 4 + padLen octets.
  const rdlen = 4 + padLen;
  // RDLEN.
  out.push(rdlen >> 8, rdlen & 0xff);
  // OPTION-CODE 12 (Padding).
  out.push(0, OPT_CODE.PADDING);
  // OPTION-LENGTH.
  out.push(padLen >> 8, padLen & 0xff);
  // The padding octets, all zero (RFC 7830 section 3).
  for (let i = 0; i < padLen; i++) out.push(0);
  // Done.
  return Uint8Array.from(out);
}

// ----------------------------------------------------------------------------
// Reading: the cursor and the name reader (RFC 1035 sections 3.1 and 4.1.4)
// ----------------------------------------------------------------------------

/**
 * A big-endian 16-bit value, refusing to read past `end`.
 * @param buf the message
 * @param at the offset
 * @param end the first offset that may not be read
 * @returns the value
 */
function u16(buf: Uint8Array, at: number, end: number): number {
  // Both octets must exist before end.
  if (at + 2 > end) throw new WireError("truncatedRecord", at);
  // Network order.
  return (buf[at] << 8) | buf[at + 1];
}

/**
 * A big-endian 32-bit unsigned value, refusing to read past `end`.
 * @param buf the message
 * @param at the offset
 * @param end the first offset that may not be read
 * @returns the value
 */
function u32(buf: Uint8Array, at: number, end: number): number {
  // All four octets must exist before end.
  if (at + 4 > end) throw new WireError("truncatedRecord", at);
  // Network order, kept unsigned.
  return ((buf[at] << 24) >>> 0) + ((buf[at + 1] << 16) | (buf[at + 2] << 8) | buf[at + 3]);
}

/** A name read from the message. */
export interface ReadName {
  /** The labels' octets, leftmost first. */
  labels: Uint8Array[];
  /** The offset just after the name where it was written (after its first pointer, if any). */
  next: number;
  /** How many compression pointers were followed. */
  pointers: number;
}

/**
 * Read a domain name. A pointer must point strictly before the offset where this name began, and each further
 * pointer strictly before the previous pointer's target: the targets only ever decrease, so a loop is impossible.
 * @param buf the message
 * @param start where the name begins
 * @param end the first offset the name's own labels may not reach (the RDATA's end for a name inside RDATA)
 * @param allowPointers false where the type's definition forbids compression (RRSIG signer, NSEC next name, SVCB target)
 * @returns the name, or throws WireError
 */
export function readName(buf: Uint8Array, start: number, end: number, allowPointers = true): ReadName {
  // The labels found so far.
  const labels: Uint8Array[] = [];
  // Where reading continues.
  let pos = start;
  // Where the caller resumes: set at the first pointer or at the root octet.
  let next = -1;
  // Pointers must point strictly before this offset.
  let limit = start;
  // The current bound: the caller's end until the first jump, the whole message after it.
  let bound = end;
  // Pointers followed.
  let pointers = 0;
  // The name's wire length so far: the root's zero octet.
  let total = 1;
  // Read label by label.
  for (;;) {
    // The length octet must exist.
    if (pos >= bound) throw new WireError("truncatedName", pos);
    // The length octet.
    const len = buf[pos];
    // Its two top bits say what kind of octet this is.
    const kind = len & 0xc0;
    // 11: a compression pointer.
    if (kind === 0xc0) {
      // Not allowed for this field: the caller decides what that means (a malformed RDATA).
      if (!allowPointers) throw new WireError("badPointer", pos);
      // The pointer's second octet must exist.
      if (pos + 1 >= bound) throw new WireError("truncatedName", pos);
      // The 14-bit offset.
      const target = ((len & 0x3f) << 8) | buf[pos + 1];
      // Strictly before where this name, or the previous jump, began: never forward, never onto itself.
      if (target >= limit) throw new WireError("badPointer", pos);
      // A second, independent stop.
      if (++pointers > MAX_POINTER_JUMPS) throw new WireError("tooManyPointers", pos);
      // The caller resumes after the first pointer.
      if (next < 0) next = pos + 2;
      // The next pointer must go further back still.
      limit = target;
      // Labels after a jump may lie anywhere in the message.
      bound = buf.length;
      // Jump.
      pos = target;
      // Continue reading at the target.
      continue;
    }
    // 01 and 10: reserved label types (RFC 6891 section 5 retired the extended label types).
    if (kind !== 0) throw new WireError("badLabelType", pos);
    // A zero octet: the root, the end of the name.
    if (len === 0) {
      // The caller resumes after it, unless a pointer already set that.
      if (next < 0) next = pos + 1;
      // Done.
      break;
    }
    // Count the label and its length octet.
    total += len + 1;
    // Over 255 octets: refused.
    if (total > MAX_NAME_OCTETS) throw new WireError("nameTooLong", pos);
    // The label's octets must lie within the bound.
    if (pos + 1 + len > bound) throw new WireError("truncatedName", pos);
    // Keep the label.
    labels.push(buf.subarray(pos + 1, pos + 1 + len));
    // Move past it.
    pos += 1 + len;
  }
  // The name.
  return { labels, next, pointers };
}

// ----------------------------------------------------------------------------
// Decoded message types
// ----------------------------------------------------------------------------

/** The header, field by field (RFC 1035 section 4.1.1; AD and CD from RFC 4035 section 3.2). */
export interface Header {
  /** The 16-bit ID. */
  id: number;
  /** QR: 1 in a response. */
  qr: boolean;
  /** The 4-bit opcode. */
  opcode: number;
  /** AA: authoritative answer. */
  aa: boolean;
  /** TC: truncated. */
  tc: boolean;
  /** RD: recursion desired (copied from the query). */
  rd: boolean;
  /** RA: recursion available. */
  ra: boolean;
  /** Z: the one remaining reserved bit, which must be zero. */
  z: boolean;
  /** AD: authentic data. */
  ad: boolean;
  /** CD: checking disabled (copied from the query, RFC 4035 section 3.2.2). */
  cd: boolean;
  /** The 4-bit RCODE in the header (the OPT record may extend it). */
  rcodeLow: number;
  /** The four counts. */
  qdcount: number;
  /** Records in the answer section. */
  ancount: number;
  /** Records in the authority section. */
  nscount: number;
  /** Records in the additional section, the OPT record included. */
  arcount: number;
}

/** The question (RFC 1035 section 4.1.2). */
export interface Question {
  /** The name, presented. */
  name: string;
  /** The name's comparison key (lower case). */
  key: string;
  /** QTYPE. */
  qtype: number;
  /** QCLASS. */
  qclass: number;
}

/** A remark the page explains about one record, in its own words. */
export type RdataNote =
  // MX 0 . : the domain accepts no mail (RFC 7505).
  | "nullMx"
  // A CAA record with its critical flag set (RFC 8659 section 4.1).
  | "caaCritical"
  // A DNSKEY with the SEP bit: the key a DS in the parent points at (commonly called the KSK).
  | "keySep"
  // A DNSKEY with the zone key bit only (commonly called the ZSK).
  | "keyZone"
  // A DNSKEY with the REVOKE bit (RFC 5011).
  | "keyRevoked"
  // An NSEC or NSEC3 whose type bit map holds NXNAME: the name does not exist (RFC 9824).
  | "nxname"
  // An NSEC3 with the Opt-Out flag (RFC 5155 section 3.1.2.1).
  | "optOut"
  // An SVCB or HTTPS record with priority 0 (AliasMode, RFC 9460 section 2.4.2).
  | "aliasMode"
  // A TTL whose top bit was set, read as zero (RFC 2181 section 8).
  | "ttlTopBit";

/** One labelled fact the page shows beside a record's RDATA (values are protocol data, not prose). */
export interface RdataFact {
  /** Which fact (the page's message key). */
  key: "keyTag" | "algorithm" | "digestType" | "signedOn" | "expiresOn" | "covered" | "signer";
  /** The value. */
  value: string;
}

/** A record's RDATA, decoded. */
export interface Rdata {
  /** The presentation form, as dig prints it (base64 unbroken). */
  text: string;
  /** Facts the page lists under the record. */
  facts: RdataFact[];
  /** Remarks the page explains. */
  notes: RdataNote[];
  /** True when the RDATA does not have its type's shape: text is then the generic RFC 3597 form. */
  malformed: boolean;
}

/** A resource record (RFC 1035 section 4.1.3). */
export interface WireRecord {
  /** The owner name, presented. */
  name: string;
  /** The owner's comparison key. */
  key: string;
  /** TYPE. */
  type: number;
  /** The type's mnemonic. */
  typeName: string;
  /** CLASS. */
  klass: number;
  /** The class's name. */
  className: string;
  /** TTL in seconds (0 when the top bit was set, RFC 2181 section 8). */
  ttl: number;
  /** RDLENGTH. */
  rdlength: number;
  /** The decoded RDATA. */
  rdata: Rdata;
  /** Where the record starts in the message. */
  offset: number;
}

/** One EDNS option. */
export interface EdnsOption {
  /** OPTION-CODE. */
  code: number;
  /** The option's registry name, or null. */
  name: string | null;
  /** OPTION-LENGTH. */
  length: number;
  /** A readable summary of OPTION-DATA (the page adds words around it). */
  text: string;
  /** For an Extended DNS Error: the INFO-CODE. */
  edeCode?: number;
  /** For an Extended DNS Error: the INFO-CODE's registry name, or null. */
  edeName?: string | null;
  /** For an Extended DNS Error: the EXTRA-TEXT. */
  edeText?: string;
}

/** The OPT record, read (RFC 6891 section 6.1). */
export interface Edns {
  /** CLASS: the sender's UDP payload size. */
  payloadSize: number;
  /** The upper eight bits of the extended RCODE. */
  extendedRcode: number;
  /** VERSION. */
  version: number;
  /** DO. */
  dnssecOk: boolean;
  /** CO, the Compact Answers OK flag (RFC 9824 section 5.1). */
  compactOk: boolean;
  /** The remaining Z bits. */
  z: number;
  /** The options, in order. */
  options: EdnsOption[];
}

/** A whole message, decoded. */
export interface Message {
  /** The header. */
  header: Header;
  /** The question section (usually one entry, RFC 9619). */
  questions: Question[];
  /** The answer section. */
  answer: WireRecord[];
  /** The authority section. */
  authority: WireRecord[];
  /** The additional section, the OPT record left out. */
  additional: WireRecord[];
  /** The OPT record, or null. */
  edns: Edns | null;
  /** The full 12-bit RCODE: the header's 4 bits plus the OPT record's 8 (RFC 6891 section 6.1.3). */
  rcode: number;
  /** Its name. */
  rcodeName: string;
  /** The message's length in octets. */
  size: number;
  /** How many compression pointers the names followed, message-wide (a teaching figure). */
  pointers: number;
}

// ----------------------------------------------------------------------------
// RDATA decoders
// ----------------------------------------------------------------------------

/** A malformed RDATA inside a well-framed record: thrown by decoders, caught by decodeRdata. */
class RdataShapeError extends Error {}

/**
 * The generic presentation of any RDATA (RFC 3597 section 5): "\#", the length in decimal, the octets in hex.
 * @param rd the RDATA octets
 * @returns the text
 */
export function genericRdata(rd: Uint8Array): string {
  // Zero-length RDATA is "\# 0".
  return rd.length === 0 ? "\\# 0" : `\\# ${rd.length} ${toHex(rd)}`;
}

/**
 * The key tag of a DNSKEY RDATA (RFC 4034 Appendix B): the one's-complement-style sum over the RDATA octets, for
 * every algorithm except 1 (RSA/MD5), whose tag is taken from the key's last octets (Appendix B.1).
 * @param rd the DNSKEY RDATA
 * @returns the 16-bit key tag
 */
export function keyTag(rd: Uint8Array): number {
  // Algorithm 1: the most significant 16 of the least significant 24 bits of the modulus (Appendix B.1).
  if (rd.length >= 4 && rd[3] === 1) return rd.length >= 3 ? (rd[rd.length - 3] << 8) | rd[rd.length - 2] : 0;
  // The running sum.
  let ac = 0;
  // Even offsets add the octet shifted left by eight, odd offsets add it as is.
  for (let i = 0; i < rd.length; i++) ac += i & 1 ? rd[i] : rd[i] << 8;
  // Fold the carry once.
  ac += (ac >> 16) & 0xffff;
  // The low 16 bits.
  return ac & 0xffff;
}

/**
 * An RRSIG time field (RFC 4034 section 3.2: seconds since 1 January 1970 UTC, presented as YYYYMMDDHHmmSS).
 * @param secs the 32-bit value
 * @returns the 14-digit UTC timestamp
 */
export function rrsigTime(secs: number): string {
  // A UTC date from the seconds (32-bit values cover 1970 to 2106 without serial arithmetic).
  const d = new Date(secs * 1000);
  // Two-digit fields.
  const p = (n: number) => String(n).padStart(2, "0");
  // YYYYMMDDHHmmSS.
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}`;
}

/**
 * The same time, written for reading: YYYY-MM-DD HH:mm:SS UTC.
 * @param secs the 32-bit value
 * @returns the readable timestamp
 */
export function readableTime(secs: number): string {
  // From the compact form.
  const s = rrsigTime(secs);
  // Hyphens, a space and colons, then the zone.
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)} ${s.slice(8, 10)}:${s.slice(10, 12)}:${s.slice(12, 14)} UTC`;
}

/**
 * A type bit map (RFC 4034 section 4.1.2): windows in increasing order, each with a length of 1 to 32 octets.
 * @param rd the RDATA
 * @param at where the bit map starts
 * @param end the RDATA's end
 * @returns the type numbers, ascending
 */
function readTypeBitmap(rd: Uint8Array, at: number, end: number): number[] {
  // The types found.
  const types: number[] = [];
  // The previous window, so windows must increase.
  let lastWindow = -1;
  // Read window blocks to the end.
  while (at < end) {
    // The window number and the bitmap length must both exist.
    if (at + 2 > end) throw new RdataShapeError();
    // Window number.
    const win = rd[at];
    // Bitmap length.
    const len = rd[at + 1];
    // Windows in increasing order, lengths 1 to 32, the bitmap within the RDATA.
    if (win <= lastWindow || len < 1 || len > 32 || at + 2 + len > end) throw new RdataShapeError();
    // Each set bit is a type: window * 256 + bit position.
    for (let i = 0; i < len; i++) {
      // The octet.
      const byte = rd[at + 2 + i];
      // Its eight bits, most significant first.
      for (let bit = 0; bit < 8; bit++) if (byte & (0x80 >> bit)) types.push(win * 256 + i * 8 + bit);
    }
    // Next window.
    lastWindow = win;
    at += 2 + len;
  }
  // Ascending by construction.
  return types;
}

/**
 * One SvcParamValue in presentation form (RFC 9460 sections 7.1 to 7.4 and Appendix A; RFC 9461 for dohpath).
 * @param key the SvcParamKey
 * @param v the value's octets
 * @returns the "key" or "key=value" text
 */
function svcParamToText(key: number, v: Uint8Array): string {
  // The key's name, or key<n> for an unregistered one (RFC 9460 section 2.1).
  const name = SVC_PARAM_KEY_NAMES[key] ?? `key${key}`;
  // Dispatch on the key.
  switch (key) {
    // mandatory: a non-empty list of 2-octet keys.
    case 0: {
      // A whole, non-empty number of keys.
      if (v.length === 0 || v.length % 2 !== 0) throw new RdataShapeError();
      // The keys' names.
      const keys: string[] = [];
      // Two octets each.
      for (let i = 0; i < v.length; i += 2) {
        // The key number.
        const k = (v[i] << 8) | v[i + 1];
        // Its name.
        keys.push(SVC_PARAM_KEY_NAMES[k] ?? `key${k}`);
      }
      // Comma-separated.
      return `${name}=${keys.join(",")}`;
    }
    // alpn: a non-empty list of length-prefixed, non-empty identifiers.
    case 1: {
      // The identifiers.
      const ids: string[] = [];
      // Walk the list.
      for (let i = 0; i < v.length; ) {
        // The length octet.
        const len = v[i];
        // Non-empty and within the value.
        if (len === 0 || i + 1 + len > v.length) throw new RdataShapeError();
        // The identifier: printable ASCII as itself; a comma or backslash inside it is escaped for the value-list
        // and that escape escaped again for the quoted string (RFC 9460 Appendix A.1).
        let s = "";
        // Each octet.
        for (const b of v.subarray(i + 1, i + 1 + len)) {
          // A comma: "\," in the list, "\\," once quoted.
          if (b === 0x2c) s += "\\\\,";
          // A backslash: "\\" in the list, "\\\\" once quoted.
          else if (b === 0x5c) s += "\\\\\\\\";
          // The quote.
          else if (b === 0x22) s += '\\"';
          // Printable ASCII.
          else if (b >= 0x20 && b < 0x7f) s += String.fromCharCode(b);
          // Anything else as \DDD.
          else s += "\\" + String(b).padStart(3, "0");
        }
        // Keep it.
        ids.push(s);
        // Next identifier.
        i += 1 + len;
      }
      // At least one.
      if (ids.length === 0) throw new RdataShapeError();
      // Quoted, comma-separated, as dig prints it.
      return `${name}="${ids.join(",")}"`;
    }
    // no-default-alpn: no value.
    case 2:
      // Must be empty.
      if (v.length !== 0) throw new RdataShapeError();
      // The key alone.
      return name;
    // port: two octets.
    case 3:
      // Exactly two.
      if (v.length !== 2) throw new RdataShapeError();
      // The port number.
      return `${name}=${(v[0] << 8) | v[1]}`;
    // ipv4hint: one or more IPv4 addresses.
    case 4: {
      // A whole, non-empty number of addresses.
      if (v.length === 0 || v.length % 4 !== 0) throw new RdataShapeError();
      // The addresses.
      const a: string[] = [];
      // Four octets each.
      for (let i = 0; i < v.length; i += 4) a.push(ipv4ToText(v.subarray(i, i + 4)));
      // Comma-separated.
      return `${name}=${a.join(",")}`;
    }
    // ech: an ECHConfigList, presented in base64.
    case 5:
      // Base64 of the octets.
      return `${name}=${toBase64(v)}`;
    // ipv6hint: one or more IPv6 addresses.
    case 6: {
      // A whole, non-empty number of addresses.
      if (v.length === 0 || v.length % 16 !== 0) throw new RdataShapeError();
      // The addresses.
      const a: string[] = [];
      // Sixteen octets each.
      for (let i = 0; i < v.length; i += 16) a.push(ipv6ToText(v.subarray(i, i + 16)));
      // Comma-separated.
      return `${name}=${a.join(",")}`;
    }
    // Any other key, dohpath included: the value as a quoted character-string.
    default:
      // An empty value is the key alone.
      return v.length === 0 ? name : `${name}=${charStringToText(v)}`;
  }
}

/**
 * Decode one record's RDATA by type. Framing errors were caught by the caller; a shape error here marks only this
 * record malformed.
 * @param buf the whole message (names in RDATA may point back into it)
 * @param type the record's TYPE
 * @param start the RDATA's first octet
 * @param end the RDATA's end
 * @returns the decoded RDATA
 */
export function decodeRdata(buf: Uint8Array, type: number, start: number, end: number): Rdata {
  // The RDATA's octets.
  const rd = buf.subarray(start, end);
  // The facts and notes gathered.
  const facts: RdataFact[] = [];
  // Remarks.
  const notes: RdataNote[] = [];
  // A name inside RDATA that must end exactly at the RDATA's end.
  const wholeName = (at: number, allowPointers: boolean): string => {
    // Read it within the RDATA.
    const n = readName(buf, at, end, allowPointers);
    // Nothing may follow it.
    if (n.next !== end) throw new RdataShapeError();
    // Presented.
    return nameToText(n.labels);
  };
  try {
    // Dispatch on the type.
    switch (type) {
      // A: four octets (RFC 1035 section 3.4.1).
      case T.A:
        // Exactly four.
        if (rd.length !== 4) throw new RdataShapeError();
        // Dotted quad.
        return { text: ipv4ToText(rd), facts, notes, malformed: false };
      // AAAA: sixteen octets (RFC 3596 section 2.2).
      case T.AAAA:
        // Exactly sixteen.
        if (rd.length !== 16) throw new RdataShapeError();
        // RFC 5952 form.
        return { text: ipv6ToText(rd), facts, notes, malformed: false };
      // NS, CNAME, PTR, DNAME: one name (compression allowed for the RFC 1035 types; DNAME too, as in RFC 3597 section 4).
      case T.NS:
      case T.CNAME:
      case T.PTR:
      case T.DNAME:
        // The name, filling the RDATA.
        return { text: wholeName(start, true), facts, notes, malformed: false };
      // MX: preference and exchange (RFC 1035 section 3.3.9).
      case T.MX: {
        // The preference.
        const pref = u16(buf, start, end);
        // The exchange.
        const exchange = wholeName(start + 2, true);
        // Preference 0 and the root: the null MX of RFC 7505 section 3.
        if (pref === 0 && exchange === ".") notes.push("nullMx");
        // "pref exchange".
        return { text: `${pref} ${exchange}`, facts, notes, malformed: false };
      }
      // TXT: one or more character-strings (RFC 1035 section 3.3.14).
      case T.TXT: {
        // The strings.
        const parts: string[] = [];
        // Walk the RDATA.
        for (let i = start; i < end; ) {
          // The length octet.
          const len = buf[i];
          // The string must fit.
          if (i + 1 + len > end) throw new RdataShapeError();
          // Quoted and escaped.
          parts.push(charStringToText(buf.subarray(i + 1, i + 1 + len)));
          // Next string.
          i += 1 + len;
        }
        // At least one string.
        if (parts.length === 0) throw new RdataShapeError();
        // Space-separated, as dig prints them.
        return { text: parts.join(" "), facts, notes, malformed: false };
      }
      // SOA (RFC 1035 section 3.3.13).
      case T.SOA: {
        // MNAME.
        const m = readName(buf, start, end, true);
        // RNAME.
        const r = readName(buf, m.next, end, true);
        // Five 32-bit fields must fill the rest exactly.
        if (r.next + 20 !== end) throw new RdataShapeError();
        // SERIAL, REFRESH, RETRY, EXPIRE, MINIMUM.
        const nums = [0, 4, 8, 12, 16].map((k) => u32(buf, r.next + k, end));
        // "mname rname serial refresh retry expire minimum".
        return { text: `${nameToText(m.labels)} ${nameToText(r.labels)} ${nums.join(" ")}`, facts, notes, malformed: false };
      }
      // CAA (RFC 8659 section 4.1).
      case T.CAA: {
        // Flags and the tag length must exist.
        if (rd.length < 2) throw new RdataShapeError();
        // Flags.
        const flags = rd[0];
        // Tag length: 1 to 15.
        const tagLen = rd[1];
        // The tag must fit and be non-empty.
        if (tagLen < 1 || tagLen > 15 || 2 + tagLen > rd.length) throw new RdataShapeError();
        // The tag: ASCII letters and digits only.
        const tag = String.fromCharCode(...rd.subarray(2, 2 + tagLen));
        // Anything else is not a CAA tag.
        if (!/^[A-Za-z0-9]{1,15}$/.test(tag)) throw new RdataShapeError();
        // The critical flag, bit 0 counted from the left (value 128).
        if (flags & 0x80) notes.push("caaCritical");
        // "flags tag "value"".
        return { text: `${flags} ${tag} ${charStringToText(rd.subarray(2 + tagLen))}`, facts, notes, malformed: false };
      }
      // DS and CDS (RFC 4034 section 5.1).
      case T.DS:
      case T.CDS: {
        // Key tag, algorithm, digest type, and at least one octet of digest.
        if (rd.length < 5) throw new RdataShapeError();
        // Key tag.
        const tag = (rd[0] << 8) | rd[1];
        // Facts.
        facts.push({ key: "keyTag", value: String(tag) }, { key: "algorithm", value: algorithmText(rd[2]) }, { key: "digestType", value: digestText(rd[3]) });
        // "tag alg digesttype DIGEST".
        return { text: `${tag} ${rd[2]} ${rd[3]} ${toHex(rd.subarray(4))}`, facts, notes, malformed: false };
      }
      // DNSKEY and CDNSKEY (RFC 4034 section 2.1).
      case T.DNSKEY:
      case T.CDNSKEY: {
        // Flags, protocol, algorithm, and at least one octet of key.
        if (rd.length < 5) throw new RdataShapeError();
        // Flags.
        const flags = (rd[0] << 8) | rd[1];
        // Bit 7 (value 256) is the Zone Key flag, bit 15 (value 1) the Secure Entry Point (section 2.1.1); bit 8
        // (value 128) is REVOKE (RFC 5011 section 7).
        if (flags & 0x0080) notes.push("keyRevoked");
        // SEP set: the key a DS points at; zone key alone: the signing key.
        if (flags & 0x0001) notes.push("keySep");
        // Zone key without SEP.
        else if (flags & 0x0100) notes.push("keyZone");
        // Facts: the key tag and the algorithm.
        facts.push({ key: "keyTag", value: String(keyTag(rd)) }, { key: "algorithm", value: algorithmText(rd[3]) });
        // "flags protocol algorithm base64".
        return { text: `${flags} ${rd[2]} ${rd[3]} ${toBase64(rd.subarray(4))}`, facts, notes, malformed: false };
      }
      // RRSIG (RFC 4034 section 3.1).
      case T.RRSIG: {
        // The 18 fixed octets must exist.
        if (rd.length < 18) throw new RdataShapeError();
        // Type covered.
        const covered = (rd[0] << 8) | rd[1];
        // Expiration and inception.
        const exp = u32(buf, start + 8, end);
        const inc = u32(buf, start + 12, end);
        // Key tag.
        const tag = (rd[16] << 8) | rd[17];
        // The signer's name, never compressed (section 3.1.7).
        const signer = readName(buf, start + 18, end, false);
        // At least one octet of signature after it.
        if (signer.next >= end) throw new RdataShapeError();
        // The signer presented.
        const signerText = nameToText(signer.labels);
        // Facts.
        facts.push(
          { key: "covered", value: typeName(covered) },
          { key: "algorithm", value: algorithmText(rd[2]) },
          { key: "keyTag", value: String(tag) },
          { key: "signer", value: signerText },
          { key: "signedOn", value: readableTime(inc) },
          { key: "expiresOn", value: readableTime(exp) },
        );
        // "TYPE alg labels origttl expiration inception tag signer base64".
        const text = `${typeName(covered)} ${rd[2]} ${rd[3]} ${u32(buf, start + 4, end)} ${rrsigTime(exp)} ${rrsigTime(inc)} ${tag} ${signerText} ${toBase64(buf.subarray(signer.next, end))}`;
        // Done.
        return { text, facts, notes, malformed: false };
      }
      // NSEC (RFC 4034 section 4.1).
      case T.NSEC: {
        // The next owner name, never compressed (section 4.1.1).
        const n = readName(buf, start, end, false);
        // The type bit map.
        const types = readTypeBitmap(buf, n.next, end);
        // NXNAME present: compact denial of existence (RFC 9824 section 3).
        if (types.includes(T.NXNAME)) notes.push("nxname");
        // The types as mnemonics (already on the record's line, so not repeated as a fact).
        const typeText = types.map(typeName).join(" ");
        // "next TYPES".
        return { text: `${nameToText(n.labels)}${typeText ? " " + typeText : ""}`, facts, notes, malformed: false };
      }
      // NSEC3 (RFC 5155 section 3.2).
      case T.NSEC3: {
        // Hash algorithm, flags, iterations and salt length must exist.
        if (rd.length < 5) throw new RdataShapeError();
        // Salt length.
        const saltLen = rd[4];
        // The salt and the hash length must exist.
        if (5 + saltLen + 1 > rd.length) throw new RdataShapeError();
        // Hash length.
        const hashLen = rd[5 + saltLen];
        // The next hashed owner must fit.
        if (5 + saltLen + 1 + hashLen > rd.length || hashLen === 0) throw new RdataShapeError();
        // The salt in hex, or "-" when empty (section 3.3).
        const salt = saltLen === 0 ? "-" : toHex(rd.subarray(5, 5 + saltLen));
        // The next hashed owner in base32hex.
        const nextHash = toBase32Hex(rd.subarray(6 + saltLen, 6 + saltLen + hashLen));
        // The type bit map.
        const types = readTypeBitmap(buf, start + 6 + saltLen + hashLen, end);
        // NXNAME present.
        if (types.includes(T.NXNAME)) notes.push("nxname");
        // Opt-Out, the flags field's least significant bit.
        if (rd[1] & 0x01) notes.push("optOut");
        // The types as mnemonics (already on the record's line, so not repeated as a fact).
        const typeText = types.map(typeName).join(" ");
        // "alg flags iterations salt NEXT TYPES".
        return { text: `${rd[0]} ${rd[1]} ${(rd[2] << 8) | rd[3]} ${salt} ${nextHash}${typeText ? " " + typeText : ""}`, facts, notes, malformed: false };
      }
      // NSEC3PARAM (RFC 5155 section 4.2).
      case T.NSEC3PARAM: {
        // Fixed fields.
        if (rd.length < 5) throw new RdataShapeError();
        // Salt length.
        const saltLen = rd[4];
        // The salt fills the rest exactly.
        if (5 + saltLen !== rd.length) throw new RdataShapeError();
        // "alg flags iterations salt".
        return { text: `${rd[0]} ${rd[1]} ${(rd[2] << 8) | rd[3]} ${saltLen === 0 ? "-" : toHex(rd.subarray(5))}`, facts, notes, malformed: false };
      }
      // SVCB and HTTPS (RFC 9460 section 2.2).
      case T.SVCB:
      case T.HTTPS: {
        // SvcPriority.
        const prio = u16(buf, start, end);
        // TargetName, uncompressed.
        const target = readName(buf, start + 2, end, false);
        // The parameters.
        const params: string[] = [];
        // The previous key, so keys strictly increase ("Clients MUST consider an RR malformed if ... not in strictly
        // increasing numeric order").
        let lastKey = -1;
        // Walk the parameters.
        for (let i = target.next; i < end; ) {
          // Key and length must exist ("the end of the RDATA occurs within a SvcParam" is malformed).
          if (i + 4 > end) throw new RdataShapeError();
          // The key.
          const key = (buf[i] << 8) | buf[i + 1];
          // The value's length.
          const len = (buf[i + 2] << 8) | buf[i + 3];
          // Increasing keys, a value within the RDATA.
          if (key <= lastKey || i + 4 + len > end) throw new RdataShapeError();
          // Presented.
          params.push(svcParamToText(key, buf.subarray(i + 4, i + 4 + len)));
          // Next parameter.
          lastKey = key;
          i += 4 + len;
        }
        // Priority 0 is AliasMode (section 2.4.2).
        if (prio === 0) notes.push("aliasMode");
        // "prio target params".
        return { text: [String(prio), nameToText(target.labels), ...params].join(" "), facts, notes, malformed: false };
      }
      // Every other type: the generic form.
      default:
        // RFC 3597 section 5.
        return { text: genericRdata(rd), facts, notes, malformed: false };
    }
  } catch (e) {
    // A shape error, or a name error inside the RDATA: this record is malformed, the message is not.
    if (e instanceof RdataShapeError || e instanceof WireError) return { text: genericRdata(rd), facts: [], notes: [], malformed: true };
    // Anything else is a bug: let it surface.
    throw e;
  }
}

/**
 * An algorithm number with its mnemonic, "13 (ECDSAP256SHA256)".
 * @param n the algorithm number
 * @returns the text
 */
function algorithmText(n: number): string {
  // The registry's mnemonic, if any.
  const name = DNSSEC_ALGORITHM_NAMES[n];
  // Number and name, or the number alone.
  return name ? `${n} (${name})` : String(n);
}

/**
 * A digest type number with its name, "2 (SHA-256)".
 * @param n the digest type
 * @returns the text
 */
function digestText(n: number): string {
  // The registry's name, if any.
  const name = DS_DIGEST_NAMES[n];
  // Number and name, or the number alone.
  return name ? `${n} (${name})` : String(n);
}

// ----------------------------------------------------------------------------
// The OPT record (RFC 6891 section 6.1)
// ----------------------------------------------------------------------------

/**
 * EXTRA-TEXT as readable text: UTF-8 decoded without failing, control characters shown as \DDD.
 * @param bytes the octets
 * @returns the text
 */
function utf8Text(bytes: Uint8Array): string {
  // Decode leniently: a broken sequence becomes U+FFFD rather than an exception.
  const s = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  // Control characters (C0 and DEL) escaped so nothing invisible reaches the page.
  return s.replace(/[\u0000-\u001f\u007f]/g, (c) => "\\" + String(c.charCodeAt(0)).padStart(3, "0"));
}

/**
 * Read the OPT record's options.
 * @param buf the message
 * @param start the RDATA's first octet
 * @param end the RDATA's end
 * @returns the options
 */
function readOptions(buf: Uint8Array, start: number, end: number): EdnsOption[] {
  // The options found.
  const out: EdnsOption[] = [];
  // Walk the RDATA.
  for (let i = start; i < end; ) {
    // Code and length must exist.
    if (i + 4 > end) throw new WireError("badOption", i);
    // OPTION-CODE.
    const code = (buf[i] << 8) | buf[i + 1];
    // OPTION-LENGTH.
    const length = (buf[i + 2] << 8) | buf[i + 3];
    // The data must fit.
    if (i + 4 + length > end) throw new WireError("badOption", i);
    // OPTION-DATA.
    const data = buf.subarray(i + 4, i + 4 + length);
    // The registry name.
    const name = EDNS_OPTION_NAMES[code] ?? null;
    // The option, summarised by code.
    if (code === OPT_CODE.EDE && length >= 2) {
      // INFO-CODE.
      const edeCode = (data[0] << 8) | data[1];
      // EXTRA-TEXT.
      const edeText = utf8Text(data.subarray(2));
      // Code, name and text.
      out.push({ code, name, length, text: `${edeCode}${edeText ? " " + edeText : ""}`, edeCode, edeName: EDE_NAMES[edeCode] ?? null, edeText });
    } else if (code === OPT_CODE.PADDING) {
      // Only the count matters (and whether every octet is zero, as RFC 7830 section 3 asks).
      out.push({ code, name, length, text: `${length}${data.every((b) => b === 0) ? "" : " (non-zero)"}` });
    } else if (code === OPT_CODE.NSID) {
      // NSID is opaque: hex, plus the printable reading when every octet is printable ASCII (dig shows both).
      const printable = data.every((b) => b >= 0x20 && b < 0x7f);
      // Hex and, where it reads as text, the text.
      out.push({ code, name, length, text: `${toHex(data)}${printable && length > 0 ? ` ("${String.fromCharCode(...data)}")` : ""}` });
    } else if (code === OPT_CODE.CLIENT_SUBNET && length >= 4) {
      // FAMILY, SOURCE PREFIX-LENGTH, SCOPE PREFIX-LENGTH, ADDRESS (RFC 7871 section 6).
      const family = (data[0] << 8) | data[1];
      // The address octets, padded to a whole address for presentation.
      const addr = data.subarray(4);
      // IPv4 or IPv6, or the raw octets.
      const text =
        family === 1 && addr.length <= 4
          ? ipv4ToText(Uint8Array.from([...addr, 0, 0, 0, 0].slice(0, 4)))
          : family === 2 && addr.length <= 16
            ? ipv6ToText(Uint8Array.from([...addr, ...new Array(16).fill(0)].slice(0, 16)))
            : toHex(addr);
      // "address/source/scope".
      out.push({ code, name, length, text: `${text}/${data[2]}/${data[3]}` });
    } else {
      // Any other option: its octets in hex.
      out.push({ code, name, length, text: toHex(data) });
    }
    // Next option.
    i += 4 + length;
  }
  // Done.
  return out;
}

// ----------------------------------------------------------------------------
// The message
// ----------------------------------------------------------------------------

/**
 * Decode a whole message, strictly.
 * @param buf the octets as received
 * @returns the message, or throws WireError
 */
export function decodeMessage(buf: Uint8Array): Message {
  // Larger than the media type allows.
  if (buf.length > MAX_MESSAGE_OCTETS) throw new WireError("tooLarge", null);
  // Smaller than a header.
  if (buf.length < HEADER_OCTETS) throw new WireError("tooShort", null);
  // The end of the message.
  const end = buf.length;
  // The flags word.
  const flags = (buf[2] << 8) | buf[3];
  // The header, field by field.
  const header: Header = {
    // ID.
    id: (buf[0] << 8) | buf[1],
    // QR, bit 15.
    qr: !!(flags & 0x8000),
    // Opcode, bits 11 to 14.
    opcode: (flags >> 11) & 0x0f,
    // AA, bit 10.
    aa: !!(flags & 0x0400),
    // TC, bit 9.
    tc: !!(flags & 0x0200),
    // RD, bit 8.
    rd: !!(flags & 0x0100),
    // RA, bit 7.
    ra: !!(flags & 0x0080),
    // Z, bit 6.
    z: !!(flags & 0x0040),
    // AD, bit 5.
    ad: !!(flags & 0x0020),
    // CD, bit 4.
    cd: !!(flags & 0x0010),
    // RCODE, bits 0 to 3.
    rcodeLow: flags & 0x000f,
    // QDCOUNT.
    qdcount: (buf[4] << 8) | buf[5],
    // ANCOUNT.
    ancount: (buf[6] << 8) | buf[7],
    // NSCOUNT.
    nscount: (buf[8] << 8) | buf[9],
    // ARCOUNT.
    arcount: (buf[10] << 8) | buf[11],
  };
  // Where reading continues.
  let pos = HEADER_OCTETS;
  // Pointers followed, message-wide.
  let pointers = 0;
  // The question section.
  const questions: Question[] = [];
  // Each question.
  for (let i = 0; i < header.qdcount; i++) {
    // QNAME.
    const n = readName(buf, pos, end, true);
    // Count its pointers.
    pointers += n.pointers;
    // QTYPE and QCLASS.
    const qtype = u16(buf, n.next, end);
    const qclass = u16(buf, n.next + 2, end);
    // Keep it.
    questions.push({ name: nameToText(n.labels), key: nameKey(n.labels), qtype, qclass });
    // Next.
    pos = n.next + 4;
  }
  // The three record sections.
  const sections: WireRecord[][] = [[], [], []];
  // Their counts.
  const counts = [header.ancount, header.nscount, header.arcount];
  // The OPT record, once found.
  let edns: Edns | null = null;
  // Each section in order.
  for (let s = 0; s < 3; s++) {
    // Each record the header counts.
    for (let i = 0; i < counts[s]; i++) {
      // Where this record starts.
      const offset = pos;
      // The owner name.
      const n = readName(buf, pos, end, true);
      // Count its pointers.
      pointers += n.pointers;
      // TYPE, CLASS, TTL, RDLENGTH.
      const type = u16(buf, n.next, end);
      const klass = u16(buf, n.next + 2, end);
      const ttlRaw = u32(buf, n.next + 4, end);
      const rdlength = u16(buf, n.next + 8, end);
      // The RDATA's bounds.
      const rdStart = n.next + 10;
      const rdEnd = rdStart + rdlength;
      // The RDATA must lie within the message.
      if (rdEnd > end) throw new WireError("truncatedRecord", n.next + 8);
      // Next record.
      pos = rdEnd;
      // The OPT pseudo-record.
      if (type === T.OPT) {
        // Only in the additional section (RFC 6891 section 6.1.1).
        if (s !== 2) throw new WireError("optOutsideAdditional", offset);
        // Only one.
        if (edns) throw new WireError("multipleOpt", offset);
        // Its owner is the root.
        if (n.labels.length !== 0) throw new WireError("optNotRoot", offset);
        // TTL: EXTENDED-RCODE, VERSION, DO, CO and Z.
        edns = {
          // CLASS: the payload size.
          payloadSize: klass,
          // The upper eight bits of the RCODE.
          extendedRcode: (ttlRaw >>> 24) & 0xff,
          // VERSION.
          version: (ttlRaw >>> 16) & 0xff,
          // DO, the top bit of the flags.
          dnssecOk: !!(ttlRaw & 0x8000),
          // CO, the next bit (RFC 9824 section 5.1).
          compactOk: !!(ttlRaw & 0x4000),
          // The rest of Z.
          z: ttlRaw & 0x3fff,
          // The options.
          options: readOptions(buf, rdStart, rdEnd),
        };
        // OPT is not shown among the records.
        continue;
      }
      // RFC 2181 section 8: a TTL with the top bit set is treated as zero.
      const topBit = ttlRaw > 0x7fffffff;
      // The RDATA, decoded.
      const rdata = decodeRdata(buf, type, rdStart, rdEnd);
      // Note the TTL rule when it applied.
      if (topBit) rdata.notes.push("ttlTopBit");
      // Keep the record.
      sections[s].push({
        // Owner, presented.
        name: nameToText(n.labels),
        // Owner's comparison key.
        key: nameKey(n.labels),
        // TYPE and its name.
        type,
        typeName: typeName(type),
        // CLASS and its name.
        klass,
        className: className(klass),
        // TTL.
        ttl: topBit ? 0 : ttlRaw,
        // RDLENGTH.
        rdlength,
        // RDATA.
        rdata,
        // Offset.
        offset,
      });
    }
  }
  // Nothing may follow the last record.
  if (pos !== end) throw new WireError("trailingBytes", pos);
  // The full RCODE: the OPT record's eight bits above the header's four.
  const rcode = ((edns?.extendedRcode ?? 0) << 4) | header.rcodeLow;
  // The message.
  return {
    header,
    questions,
    answer: sections[0],
    authority: sections[1],
    additional: sections[2],
    edns,
    rcode,
    rcodeName: rcodeName(rcode),
    size: buf.length,
    pointers,
  };
}

/**
 * A hex dump, sixteen octets per line: the offset in hex, the octets (a wider gap after the eighth), and their
 * printable ASCII between bars, dots for every other octet.
 * @param buf the octets
 * @param max the most octets to show (the page caps long answers)
 * @returns the lines joined with newlines
 */
export function hexDump(buf: Uint8Array, max = 4096): string {
  // The lines.
  const lines: string[] = [];
  // The shown part.
  const shown = Math.min(buf.length, max);
  // Sixteen octets per line.
  for (let i = 0; i < shown; i += 16) {
    // This line's octets.
    const row = buf.subarray(i, Math.min(i + 16, shown));
    // Hex pairs, with an extra space after the eighth.
    let hex = "";
    // Each octet.
    for (let j = 0; j < 16; j++) {
      // The pair, or blanks past the end.
      hex += j < row.length ? row[j].toString(16).padStart(2, "0") + " " : "   ";
      // The middle gap.
      if (j === 7) hex += " ";
    }
    // Printable ASCII, dots elsewhere.
    const ascii = Array.from(row, (b) => (b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : ".")).join("");
    // Offset, octets, text.
    lines.push(`${i.toString(16).padStart(8, "0")}  ${hex} |${ascii}|`);
  }
  // Done.
  return lines.join("\n");
}
