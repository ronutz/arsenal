// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/python-ipaddress-explorer/compute.ts
// ----------------------------------------------------------------------------
// THE IPADDRESS EXPLORER LAB'S MODEL (Python run, 2026-10-27), the interactive
// companion of the article "Python's ipaddress module: strict parsing,
// networks, summarisation and IPv6". The reader types a string and chooses
// what to pass it to, as one of these Python expressions would:
//
//     ipaddress.ip_address(text)
//     ipaddress.ip_network(text)                 # strict=True, the default
//     ipaddress.ip_network(text, strict=False)
//     ipaddress.ip_interface(text)
//
// optionally followed by .subnets(new_prefix=N) or .supernet(new_prefix=N).
// The model answers as CPython 3.13.16 does: which class constructor the
// factory tried, what each one raised (class and message, word for word), the
// object that came back with a selection of its attributes as the REPL would
// print them, its is_* properties, and the method's result or exception.
//
// THE RULES, each stated in the article with its source (read 2026-10-27; the
// module's documentation for 3.13 and the module's own source at the tag
// v3.13.16, Lib/ipaddress.py, which is the file this container runs and is
// unchanged in 3.13.18; 3.14.10 and 3.15.2 behave the same for everything the
// lab shows):
//   1. The factories try the IPv4 class, then the IPv6 class, catching only
//      AddressValueError and NetmaskValueError, and otherwise raise ValueError
//      "<text!r> does not appear to be an IPv4 or IPv6 address|network|
//      interface" (documentation: the factories' "error messages provide
//      minimal information"; the class constructors report the reason).
//   2. IPv4 text: exactly four dot-separated decimal octets, 0 to 255, at most
//      three ASCII digits each, no leading zeros (documentation: "Leading
//      zeroes are not tolerated"; changed in 3.9.5 to be "as strict as glibc
//      inet_pton()"), with the source's messages for each failure.
//   3. IPv6 text: at most 45 characters (gh-128840, 3.13.5), split on ":" at
//      most nine times, an optional dotted IPv4 tail, at most eight colons and
//      one "::", hexadecimal groups of at most four digits, an optional zone
//      after "%" that must be non-empty and hold no "%" (RFC 4007), with the
//      source's messages for each failure.
//   4. Masks: a prefix of ASCII digits from 0 to the address width (leading
//      zeros accepted); for IPv4 also a dotted netmask, or a host mask when the
//      first field is zero, an all-zero mask being a netmask (documentation,
//      IPv4Network); "'<mask>' is not a valid netmask" otherwise.
//   5. strict=True refuses host bits with ValueError "<addr>/<len> has host
//      bits set", which the factory does not catch; strict=False masks them.
//      An interface keeps the host address and builds its network with
//      strict=False.
//   6. Text forms: IPv4 dotted decimal; IPv6 compressed by replacing the first
//      longest run of two or more zero groups with "::" (RFC 5952, sections
//      4.2.2 and 4.2.3), an IPv4-mapped address written ::ffff:a.b.c.d, a zone
//      appended after "%"; exploded, packed, int and reverse_pointer as the
//      source builds them.
//   7. hosts(): all addresses but the network and broadcast addresses for
//      IPv4, but the Subnet-Router anycast address for IPv6; both ends on a
//      /31 or /127; the single address on a /32 or /128 (documentation).
//   8. subnets() and supernet() with new_prefix, and their ValueError messages
//      ("new prefix must be longer", "new prefix must be shorter", and the two
//      range messages); a /32 or /128 yields itself from subnets(), a /0
//      returns itself from supernet() (source). Addresses and interfaces have
//      neither method: AttributeError.
//   9. The is_* properties: the 3.13 lists of blocks that are not globally
//      reachable (IPv4 and IPv6, with the 192.0.0.9, 192.0.0.10 and six IPv6
//      exceptions), 100.64.0.0/10 neither private nor global, IPv4-mapped IPv6
//      addresses judged by their IPv4 address (documentation, "Changed in
//      version 3.13"), multicast, loopback, link-local, reserved, unspecified
//      and site-local blocks from the source; a network has a property when
//      its first and last addresses both have it, and a network's is_private
//      reads the lists without the IPv4-mapped rule (source).
//  10. Four blocks where CPython's lists and IANA's special-purpose registries
//      (last updated 2025-10-09, read 2026-10-27) disagree about global
//      reachability: 192.88.99.2/32, 100:0:0:1::/64, 2001:1::3/128 and
//      5f00::/16 (the article's table; the runs show CPython's answers).
//  11. Since 3.13.16 (bpo-44012) exploded keeps an IPv6 zone, and
//      reverse_pointer, which the source builds from exploded, carries the
//      zone's characters too (the lab says so in a note; the article states it).
//
// WHAT IT LEAVES OUT, stated in the lab's scope note: integers, bytes and
// tuples as arguments (the lab takes text only, printable ASCII, at most 64
// characters), every other method and operator (collapse_addresses,
// summarize_address_range, address_exclude, comparisons, arithmetic), the
// attributes it does not list, and the 3.15 change that gives IPv4Interface an
// is_unspecified of its own (here, as on 3.13, it is always False).
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** The four calls the lab offers, as keys. */
export const CALLS = ["ip_address", "ip_network", "ip_network_loose", "ip_interface"] as const;
/** One call. */
export type Call = (typeof CALLS)[number];
/** The methods the lab can call on the result. */
export const METHODS = ["none", "subnets", "supernet"] as const;
/** One method choice. */
export type Method = (typeof METHODS)[number];
/** The longest text the lab accepts (a bound of the lab, not of Python). */
export const MAX_TEXT_LENGTH = 64;

/** The reader's settings. */
export interface IpaddressInput {
  /** The string passed to the factory, as typed. */
  text: string;
  /** Which factory, and for ip_network which strict mode. */
  call: Call;
  /** The method called on the result, if any. */
  method: Method;
  /** new_prefix for the method, as typed; empty means the method's default (one bit). */
  newPrefix: string;
}

/** Why the lab refused the settings (stable codes, worded by the component). */
export type IpaddressErrorCode = "too-long" | "not-printable-ascii" | "bad-choice" | "bad-new-prefix";

/** A refusal of the lab's own (not a Python exception). */
export class IpaddressLabError extends Error {
  /** The stable code. */
  readonly code: IpaddressErrorCode;
  /** Build it with its code as the message too. */
  constructor(code: IpaddressErrorCode) {
    // The code doubles as the message for logs.
    super(code);
    // Kept for the component and the vectors.
    this.code = code;
  }
}

/** The Python exception classes the model can raise. */
export type PyExceptionName = "AddressValueError" | "NetmaskValueError" | "ValueError" | "AttributeError";

/** A Python exception inside the model: its class and str() of it. */
class PyError extends Error {
  /** The Python class name. */
  readonly pyType: PyExceptionName;
  /** The message, as str(exception) prints it. */
  readonly pyMessage: string;
  /** Build it from the class and the message. */
  constructor(pyType: PyExceptionName, pyMessage: string) {
    // The JavaScript message mirrors the Python one.
    super(`${pyType}: ${pyMessage}`);
    // The class.
    this.pyType = pyType;
    // The message.
    this.pyMessage = pyMessage;
  }
}

// ---------------------------------------------------------------------------
// Python text forms: repr() of a str and of bytes (printable ASCII input only)
// ---------------------------------------------------------------------------

/** repr() of a str made of printable ASCII, as CPython writes it. */
export function pyStrRepr(s: string): string {
  // CPython picks double quotes when the text holds a single quote and no double quote.
  const quote = s.includes("'") && !s.includes('"') ? '"' : "'";
  // Backslashes are doubled; the chosen quote is escaped; everything else is printable ASCII and stays.
  const body = s.replace(/\\/g, "\\\\").replace(quote === "'" ? /'/g : /(?!)/g, "\\'");
  // The quoted text.
  return `${quote}${body}${quote}`;
}

/** repr() of a bytes object, as CPython writes it. */
function pyBytesRepr(bytes: readonly number[]): string {
  // The same quote rule as str, judged on the bytes 0x27 (') and 0x22 (").
  const quote = bytes.includes(0x27) && !bytes.includes(0x22) ? '"' : "'";
  // Each byte in turn.
  const body = bytes
    .map((b) => {
      // Backslash doubled.
      if (b === 0x5c) return "\\\\";
      // The chosen quote escaped.
      if (b === quote.charCodeAt(0)) return `\\${quote}`;
      // Tab, newline and carriage return have short escapes.
      if (b === 0x09) return "\\t";
      // Newline.
      if (b === 0x0a) return "\\n";
      // Carriage return.
      if (b === 0x0d) return "\\r";
      // Printable ASCII stays as it is.
      if (b >= 0x20 && b < 0x7f) return String.fromCharCode(b);
      // Every other byte as \xhh.
      return `\\x${b.toString(16).padStart(2, "0")}`;
    })
    .join("");
  // The b'...' form.
  return `b${quote}${body}${quote}`;
}

/** Python's str.split(sep, maxsplit): at most maxsplit splits, the rest kept in the last part. */
function pySplit(s: string, sep: string, maxsplit: number): string[] {
  // The parts found so far.
  const parts: string[] = [];
  // Where the next part starts.
  let start = 0;
  // Split until the limit or the end.
  while (parts.length < maxsplit) {
    // The next separator.
    const i = s.indexOf(sep, start);
    // None left: stop.
    if (i < 0) break;
    // The part before it.
    parts.push(s.slice(start, i));
    // Continue after it.
    start = i + sep.length;
  }
  // The remainder is the last part.
  parts.push(s.slice(start));
  // All of them.
  return parts;
}

// ---------------------------------------------------------------------------
// Widths and integer helpers (BigInt for both versions)
// ---------------------------------------------------------------------------

/** The two IP versions. */
type Version = 4 | 6;
/** Address width in bits per version. */
const BITS: Readonly<Record<Version, number>> = { 4: 32, 6: 128 };
/** All ones, per version. */
const ALL_ONES: Readonly<Record<Version, bigint>> = { 4: (1n << 32n) - 1n, 6: (1n << 128n) - 1n };

/** The netmask integer of a prefix length (_ip_int_from_prefix). */
function maskOf(v: Version, prefixlen: number): bigint {
  // All ones XOR all ones shifted right by the prefix length.
  return ALL_ONES[v] ^ (ALL_ONES[v] >> BigInt(prefixlen));
}

/** Bit length of a non-negative BigInt (int.bit_length). */
function bitLength(n: bigint): number {
  // Zero has no bits.
  return n === 0n ? 0 : n.toString(2).length;
}

/** The prefix length a mask integer encodes, or null when it mixes ones and zeros (_prefix_from_ip_int). */
function prefixFromIpInt(v: Version, n: bigint): number | null {
  // Trailing zero bits, capped at the width (_count_righthand_zero_bits).
  const trailing = n === 0n ? BITS[v] : Math.min(BITS[v], bitLength(~n & (n - 1n)));
  // The candidate prefix length.
  const prefixlen = BITS[v] - trailing;
  // What remains after dropping the trailing zeros must be all ones.
  const leading = n >> BigInt(trailing);
  // The ones a clean mask would have.
  const allOnes = (1n << BigInt(prefixlen)) - 1n;
  // A mixed pattern is not a mask.
  return leading === allOnes ? prefixlen : null;
}

// ---------------------------------------------------------------------------
// IPv4 text (rule 2)
// ---------------------------------------------------------------------------

/** One decimal octet, or a plain ValueError message (_parse_octet). */
function parseOctet(s: string): bigint {
  // Empty octet.
  if (s === "") throw new PyError("ValueError", "Empty octet not permitted");
  // ASCII digits only (the lab's text is ASCII, so isdigit() is [0-9]).
  if (!/^[0-9]+$/.test(s)) throw new PyError("ValueError", `Only decimal digits permitted in ${pyStrRepr(s)}`);
  // At most three characters.
  if (s.length > 3) throw new PyError("ValueError", `At most 3 characters permitted in ${pyStrRepr(s)}`);
  // No leading zero except the octet "0" itself.
  if (s !== "0" && s[0] === "0") throw new PyError("ValueError", `Leading zeros are not permitted in ${pyStrRepr(s)}`);
  // The value.
  const n = Number(s);
  // At most 255.
  if (n > 255) throw new PyError("ValueError", `Octet ${n} (> 255) not permitted`);
  // Accepted.
  return BigInt(n);
}

/** An IPv4 address string to its integer, or AddressValueError (_BaseV4._ip_int_from_string). */
function v4IntFromString(ipStr: string): bigint {
  // Empty text.
  if (ipStr === "") throw new PyError("AddressValueError", "Address cannot be empty");
  // Split on every dot.
  const octets = ipStr.split(".");
  // Exactly four.
  if (octets.length !== 4) throw new PyError("AddressValueError", `Expected 4 octets in ${pyStrRepr(ipStr)}`);
  // The value, octet by octet, first failure reported.
  let n = 0n;
  // Each octet in order.
  for (const o of octets) {
    // Parse it, wrapping its message with the whole string.
    try {
      // Shift in eight bits.
      n = (n << 8n) | parseOctet(o);
    } catch (e) {
      // "<reason> in <whole!r>".
      if (e instanceof PyError) throw new PyError("AddressValueError", `${e.pyMessage} in ${pyStrRepr(ipStr)}`);
      // Anything else is a bug.
      throw e;
    }
  }
  // The address as an integer.
  return n;
}

/** An IPv4 integer as dotted decimal (_BaseV4._string_from_ip_int). */
function v4StringFromInt(n: bigint): string {
  // Four bytes, most significant first.
  return [24n, 16n, 8n, 0n].map((s) => ((n >> s) & 255n).toString()).join(".");
}

// ---------------------------------------------------------------------------
// IPv6 text (rules 3 and 6)
// ---------------------------------------------------------------------------

/** One hexadecimal group, or a plain ValueError message (_parse_hextet). */
function parseHextet(s: string): bigint {
  // Only the 22 hexadecimal digit characters (an empty group passes this test, as in CPython).
  if (!/^[0-9A-Fa-f]*$/.test(s)) throw new PyError("ValueError", `Only hex digits permitted in ${pyStrRepr(s)}`);
  // At most four of them.
  if (s.length > 4) throw new PyError("ValueError", `At most 4 characters permitted in ${pyStrRepr(s)}`);
  // int("", 16) fails as Python's int() does.
  if (s === "") throw new PyError("ValueError", "invalid literal for int() with base 16: ''");
  // The value.
  return BigInt(`0x${s}`);
}

/** An IPv6 address string (no zone) to its integer, or AddressValueError (_BaseV6._ip_int_from_string). */
function v6IntFromString(ipStr: string): bigint {
  // Empty text.
  if (ipStr === "") throw new PyError("AddressValueError", "Address cannot be empty");
  // More than 45 characters is refused before any splitting (gh-128840).
  if (ipStr.length > 45) {
    // Very long texts are shortened in the message.
    const shorten = ipStr.length > 100 ? `${ipStr.slice(0, 45)}(${ipStr.length - 90} chars elided)${ipStr.slice(-45)}` : ipStr;
    // The refusal.
    throw new PyError("AddressValueError", `At most 45 characters expected in ${pyStrRepr(shorten)}`);
  }
  // Split on ":" at most nine times.
  const parts = pySplit(ipStr, ":", 9);
  // At least three parts (two colons).
  if (parts.length < 3) throw new PyError("AddressValueError", `At least 3 parts expected in ${pyStrRepr(ipStr)}`);
  // A dotted tail is an IPv4 address worth two groups.
  if (parts[parts.length - 1].includes(".")) {
    // The tail, removed from the list.
    const tail = parts.pop() as string;
    // Its value, or the IPv4 error wrapped with the whole string.
    let v4: bigint;
    // Parse it as IPv4Address would.
    try {
      // The IPv4 integer.
      v4 = v4IntFromString(tail);
    } catch (e) {
      // "<IPv4 reason> in <whole!r>".
      if (e instanceof PyError) throw new PyError("AddressValueError", `${e.pyMessage} in ${pyStrRepr(ipStr)}`);
      // Anything else is a bug.
      throw e;
    }
    // The high group.
    parts.push(((v4 >> 16n) & 0xffffn).toString(16));
    // The low group.
    parts.push((v4 & 0xffffn).toString(16));
  }
  // At most eight colons.
  if (parts.length > 9) throw new PyError("AddressValueError", `At most 8 colons permitted in ${pyStrRepr(ipStr)}`);
  // The "::", found as an empty part away from the ends.
  let skip: number | null = null;
  // Inner parts only.
  for (let i = 1; i < parts.length - 1; i++) {
    // An empty inner part.
    if (parts[i] === "") {
      // A second one is refused.
      if (skip !== null) throw new PyError("AddressValueError", `At most one '::' permitted in ${pyStrRepr(ipStr)}`);
      // The first one is the "::".
      skip = i;
    }
  }
  // Parts before and after the "::", and the groups it stands for.
  let hi: number;
  // After.
  let lo: number;
  // Skipped.
  let skipped: number;
  // With a "::".
  if (skip !== null) {
    // Parts before it.
    hi = skip;
    // Parts after it.
    lo = parts.length - skip - 1;
    // A leading empty part belongs to "::" only.
    if (parts[0] === "") {
      // It is not a group.
      hi -= 1;
      // Anything else before "::" makes the leading colon a stray.
      if (hi) throw new PyError("AddressValueError", `Leading ':' only permitted as part of '::' in ${pyStrRepr(ipStr)}`);
    }
    // A trailing empty part belongs to "::" only.
    if (parts[parts.length - 1] === "") {
      // It is not a group.
      lo -= 1;
      // Anything else after "::" makes the trailing colon a stray.
      if (lo) throw new PyError("AddressValueError", `Trailing ':' only permitted as part of '::' in ${pyStrRepr(ipStr)}`);
    }
    // "::" must stand for at least one group.
    skipped = 8 - (hi + lo);
    // Otherwise too many groups were written.
    if (skipped < 1) throw new PyError("AddressValueError", `Expected at most 7 other parts with '::' in ${pyStrRepr(ipStr)}`);
  } else {
    // Without "::", exactly eight groups.
    if (parts.length !== 8) throw new PyError("AddressValueError", `Exactly 8 parts expected without '::' in ${pyStrRepr(ipStr)}`);
    // No leading colon.
    if (parts[0] === "") throw new PyError("AddressValueError", `Leading ':' only permitted as part of '::' in ${pyStrRepr(ipStr)}`);
    // No trailing colon.
    if (parts[parts.length - 1] === "") throw new PyError("AddressValueError", `Trailing ':' only permitted as part of '::' in ${pyStrRepr(ipStr)}`);
    // All parts are groups.
    hi = parts.length;
    // None after.
    lo = 0;
    // None skipped.
    skipped = 0;
  }
  // The groups into one integer, first failure reported with the whole string.
  try {
    // The value so far.
    let n = 0n;
    // The groups before "::".
    for (let i = 0; i < hi; i++) n = (n << 16n) | parseHextet(parts[i]);
    // The zero groups "::" stands for.
    n <<= BigInt(16 * skipped);
    // The groups after "::".
    for (let i = parts.length - lo; i < parts.length; i++) n = (n << 16n) | parseHextet(parts[i]);
    // The address as an integer.
    return n;
  } catch (e) {
    // "<reason> in <whole!r>".
    if (e instanceof PyError) throw new PyError("AddressValueError", `${e.pyMessage} in ${pyStrRepr(ipStr)}`);
    // Anything else is a bug.
    throw e;
  }
}

/** Compress the groups: the first longest run of two or more "0" groups becomes "" (_compress_hextets). */
function compressHextets(hextets: string[]): string[] {
  // Best run so far.
  let bestStart = -1;
  // Its length.
  let bestLen = 0;
  // Current run.
  let curStart = -1;
  // Its length.
  let curLen = 0;
  // Scan the groups.
  hextets.forEach((h, i) => {
    // A zero group extends the current run.
    if (h === "0") {
      // One longer.
      curLen += 1;
      // Its start, if new.
      if (curStart === -1) curStart = i;
      // Strictly longer than the best: the first longest run wins ties.
      if (curLen > bestLen) {
        // New best length.
        bestLen = curLen;
        // New best start.
        bestStart = curStart;
      }
    } else {
      // Any other group ends the run.
      curLen = 0;
      // No run open.
      curStart = -1;
    }
  });
  // A single zero group is never compressed (RFC 5952, 4.2.2).
  if (bestLen > 1) {
    // Where the run ends.
    const end = bestStart + bestLen;
    // A copy to edit.
    let out = hextets.slice();
    // A run at the end needs an extra empty part for the trailing "::".
    if (end === out.length) out.push("");
    // The run becomes one empty part.
    out.splice(bestStart, bestLen, "");
    // A run at the start needs an extra empty part for the leading "::".
    if (bestStart === 0) out = ["", ...out];
    // Compressed.
    return out;
  }
  // Nothing to compress.
  return hextets;
}

/** An IPv6 integer in compressed form, without IPv4 or zone (_BaseV6._string_from_ip_int). */
function v6StringFromInt(n: bigint): string {
  // Thirty-two hexadecimal digits.
  const hex = n.toString(16).padStart(32, "0");
  // Eight groups without leading zeros.
  const groups = Array.from({ length: 8 }, (_, i) => BigInt(`0x${hex.slice(i * 4, i * 4 + 4)}`).toString(16));
  // Joined after compression.
  return compressHextets(groups).join(":");
}

/** An IPv6 integer in exploded form, eight groups of four digits. */
function v6ExplodedFromInt(n: bigint): string {
  // Thirty-two hexadecimal digits.
  const hex = n.toString(16).padStart(32, "0");
  // Eight groups of four.
  return Array.from({ length: 8 }, (_, i) => hex.slice(i * 4, i * 4 + 4)).join(":");
}

/** Split a zone off an IPv6 text, or AddressValueError (_split_scope_id). */
function splitScopeId(ipStr: string): [string, string | null] {
  // Partition at the first "%".
  const i = ipStr.indexOf("%");
  // No zone.
  if (i < 0) return [ipStr, null];
  // The zone text.
  const scope = ipStr.slice(i + 1);
  // It must be non-empty and hold no further "%".
  if (scope === "" || scope.includes("%")) throw new PyError("AddressValueError", `Invalid IPv6 address: "${pyStrRepr(ipStr)}"`);
  // Address and zone.
  return [ipStr.slice(0, i), scope];
}

// ---------------------------------------------------------------------------
// The objects (plain records) and their constructors (rules 1, 4, 5)
// ---------------------------------------------------------------------------

/** An address object: IPv4Address or IPv6Address. */
interface Addr {
  /** Which kind of object. */
  kind: "address";
  /** 4 or 6. */
  v: Version;
  /** The value. */
  ip: bigint;
  /** The zone (IPv6 only), or null. */
  scope: string | null;
}

/** A network object: IPv4Network or IPv6Network. */
interface Net {
  /** Which kind of object. */
  kind: "network";
  /** 4 or 6. */
  v: Version;
  /** network_address, which keeps a zone when nothing was masked off. */
  netAddr: Addr;
  /** The prefix length. */
  prefixlen: number;
  /** What hosts() yields on a /32 or /128: the address built again from the text. */
  single: Addr | null;
}

/** An interface object: IPv4Interface or IPv6Interface. */
interface Iface {
  /** Which kind of object. */
  kind: "interface";
  /** 4 or 6. */
  v: Version;
  /** The host address value. */
  ip: bigint;
  /** Its zone (IPv6 only), or null. */
  scope: string | null;
  /** The prefix length. */
  prefixlen: number;
  /** The network, built with strict=False. */
  network: Net;
}

/** Any object the factories return. */
type IpObject = Addr | Net | Iface;

/** IPv4Address(text). */
function newV4Address(text: string): Addr {
  // A "/" is refused by the address class.
  if (text.includes("/")) throw new PyError("AddressValueError", `Unexpected '/' in ${pyStrRepr(text)}`);
  // The value.
  return { kind: "address", v: 4, ip: v4IntFromString(text), scope: null };
}

/** IPv6Address(text). */
function newV6Address(text: string): Addr {
  // A "/" is refused by the address class.
  if (text.includes("/")) throw new PyError("AddressValueError", `Unexpected '/' in ${pyStrRepr(text)}`);
  // The zone first.
  const [addr, scope] = splitScopeId(text);
  // Then the address without it.
  return { kind: "address", v: 6, ip: v6IntFromString(addr), scope };
}

/** The address constructor of a version. */
function newAddress(v: Version, text: string): Addr {
  // IPv4 or IPv6.
  return v === 4 ? newV4Address(text) : newV6Address(text);
}

/** Address and mask parts of a network or interface text (_split_addr_prefix). */
function splitAddrPrefix(v: Version, text: string): [string, string | number] {
  // Split on every "/".
  const parts = text.split("/");
  // At most one.
  if (parts.length > 2) throw new PyError("AddressValueError", `Only one '/' permitted in ${pyStrRepr(text)}`);
  // With a mask, or the full width.
  return parts.length === 2 ? [parts[0], parts[1]] : [parts[0], BITS[v]];
}

/** The prefix length from a string of digits, or NetmaskValueError (_prefix_from_prefix_string). */
function prefixFromPrefixString(v: Version, s: string): number {
  // ASCII digits only (no sign, no space).
  if (!/^[0-9]+$/.test(s)) throw new PyError("NetmaskValueError", `${pyStrRepr(s)} is not a valid netmask`);
  // The value (leading zeros accepted, as int() does).
  const n = Number(s);
  // In range.
  if (!(n >= 0 && n <= BITS[v])) throw new PyError("NetmaskValueError", `${pyStrRepr(s)} is not a valid netmask`);
  // Accepted.
  return n;
}

/** The prefix length of a mask argument (_make_netmask). */
function makeNetmask(v: Version, arg: string | number): number {
  // An integer (only the default width reaches here as a number).
  if (typeof arg === "number") return arg;
  // IPv6 accepts a prefix only.
  if (v === 6) return prefixFromPrefixString(6, arg);
  // IPv4: a prefix first.
  try {
    // Digits.
    return prefixFromPrefixString(4, arg);
  } catch (e) {
    // Only the netmask refusal falls through.
    if (!(e instanceof PyError) || e.pyType !== "NetmaskValueError") throw e;
  }
  // Then a dotted mask, parsed like an address.
  let n: bigint;
  // The address parser.
  try {
    // Its integer.
    n = v4IntFromString(arg);
  } catch (e) {
    // Not an address: not a mask.
    if (e instanceof PyError) throw new PyError("NetmaskValueError", `${pyStrRepr(arg)} is not a valid netmask`);
    // Anything else is a bug.
    throw e;
  }
  // A netmask (ones then zeros; all ones and all zeros count as netmasks).
  const asNetmask = prefixFromIpInt(4, n);
  // Accepted as a netmask.
  if (asNetmask !== null) return asNetmask;
  // A host mask: zeros then ones, read by inverting it.
  const asHostmask = prefixFromIpInt(4, n ^ ALL_ONES[4]);
  // Accepted as a host mask.
  if (asHostmask !== null) return asHostmask;
  // Neither.
  throw new PyError("NetmaskValueError", `${pyStrRepr(arg)} is not a valid netmask`);
}

/** IPv4Network / IPv6Network from an address text and a mask argument. */
function newNetworkFromParts(v: Version, addrText: string, mask: string | number, strict: boolean): Net {
  // The address first (its errors come before the mask's).
  const netAddr = newAddress(v, addrText);
  // Then the mask.
  const prefixlen = makeNetmask(v, mask);
  // The mask as an integer.
  const m = maskOf(v, prefixlen);
  // The network as written.
  let net: Net = { kind: "network", v, netAddr, prefixlen, single: null };
  // Host bits set?
  if ((netAddr.ip & m) !== netAddr.ip) {
    // strict refuses, naming the network as written.
    if (strict) throw new PyError("ValueError", `${netStr(net)} has host bits set`);
    // Otherwise the bits are masked off and the zone is lost.
    net = { ...net, netAddr: { kind: "address", v, ip: netAddr.ip & m, scope: null } };
  }
  // A /32 or /128 yields the address built again from the text.
  if (prefixlen === BITS[v]) net = { ...net, single: newAddress(v, addrText) };
  // The network.
  return net;
}

/** IPv4Network(text, strict) / IPv6Network(text, strict). */
function newNetwork(v: Version, text: string, strict: boolean): Net {
  // Split the text.
  const [addr, mask] = splitAddrPrefix(v, text);
  // Build from the parts.
  return newNetworkFromParts(v, addr, mask, strict);
}

/** IPv4Interface(text) / IPv6Interface(text). */
function newInterface(v: Version, text: string): Iface {
  // Split the text.
  const [addrText, mask] = splitAddrPrefix(v, text);
  // The host address first.
  const a = newAddress(v, addrText);
  // Then its network, never strict.
  const network = newNetworkFromParts(v, addrText, mask, false);
  // The interface.
  return { kind: "interface", v, ip: a.ip, scope: a.scope, prefixlen: network.prefixlen, network };
}

// ---------------------------------------------------------------------------
// Text forms of the objects (rule 6)
// ---------------------------------------------------------------------------

/** The IPv4 address an IPv6 value maps, or null (ipv4_mapped). */
function mappedOf(ip: bigint): bigint | null {
  // ::ffff:0:0/96.
  return ip >> 32n === 0xffffn ? ip & 0xffffffffn : null;
}

/** str() of an address. */
function addrStr(a: Addr): string {
  // IPv4: dotted decimal.
  if (a.v === 4) return v4StringFromInt(a.ip);
  // An IPv4-mapped address keeps the dotted tail.
  const m = mappedOf(a.ip);
  // The six high groups compressed, then the IPv4 address; or the plain compressed form.
  const base = m !== null ? `${v6StringFromInt(a.ip >> 32n)}:${v4StringFromInt(m)}` : v6StringFromInt(a.ip);
  // The zone, if any.
  return a.scope ? `${base}%${a.scope}` : base;
}

/** str() of a network. */
function netStr(n: Net): string {
  // Network address and prefix length.
  return `${addrStr(n.netAddr)}/${n.prefixlen}`;
}

/** str() of an interface. */
function ifaceStr(i: Iface): string {
  // IPv4: dotted address; IPv6: the address's own str() with its zone.
  const a = i.v === 4 ? v4StringFromInt(i.ip) : addrStr({ kind: "address", v: 6, ip: i.ip, scope: i.scope });
  // With the prefix length.
  return `${a}/${i.prefixlen}`;
}

/** The class name of an object. */
function className(o: IpObject): string {
  // IPv4 or IPv6, then the kind.
  return `IPv${o.v}${o.kind === "address" ? "Address" : o.kind === "network" ? "Network" : "Interface"}`;
}

/** str() of any object. */
function strOf(o: IpObject): string {
  // By kind.
  return o.kind === "address" ? addrStr(o) : o.kind === "network" ? netStr(o) : ifaceStr(o);
}

/** repr() of any object. */
function reprOf(o: IpObject): string {
  // ClassName('str').
  return `${className(o)}(${pyStrRepr(strOf(o))})`;
}

/** A bare address object of a version and value. */
function bare(v: Version, ip: bigint): Addr {
  // No zone.
  return { kind: "address", v, ip, scope: null };
}

/** exploded of an address (IPv6Address._explode_shorthand_ip_string). */
function addrExploded(a: Addr): string {
  // IPv4: the same as str().
  if (a.v === 4) return addrStr(a);
  // The full groups, then the zone.
  const raw = v6ExplodedFromInt(a.ip) + (a.scope ? `%${a.scope}` : "");
  // A mapped address: the first six groups (30 characters with their colons) and the dotted IPv4 address.
  const m = mappedOf(a.ip);
  // Mapped or not.
  return m !== null ? `${raw.slice(0, 30)}${v4StringFromInt(m)}` : raw;
}

/** reverse_pointer of an address. */
function addrReversePointer(a: Addr): string {
  // IPv4: the octets reversed under in-addr.arpa.
  if (a.v === 4) return `${addrStr(a).split(".").reverse().join(".")}.in-addr.arpa`;
  // A mapped address: six groups as nibbles, then the IPv4 value as eight hex digits, reversed.
  const m = mappedOf(a.ip);
  // The characters to reverse.
  const chars = m !== null ? `${(v6ExplodedFromInt(a.ip) + (a.scope ? `%${a.scope}` : "")).slice(0, 30)}${m.toString(16).padStart(8, "0")}` : addrExploded(a);
  // Reversed, colons dropped, one label per character.
  return `${[...chars].reverse().filter((c) => c !== ":").join(".")}.ip6.arpa`;
}

/** packed of a value, as a list of bytes. */
function packedOf(v: Version, ip: bigint): number[] {
  // 4 or 16 bytes.
  const len = BITS[v] / 8;
  // Most significant first.
  return Array.from({ length: len }, (_, i) => Number((ip >> BigInt((len - 1 - i) * 8)) & 0xffn));
}

// ---------------------------------------------------------------------------
// Properties (rule 9)
// ---------------------------------------------------------------------------

/** A block as [network integer, prefix length]. */
type Block = readonly [bigint, number];

/** Parse a constant block (the lists below are well formed). */
function blk(v: Version, text: string): Block {
  // Address and length.
  const [a, l] = text.split("/");
  // The integer of the address part.
  return [v === 4 ? v4IntFromString(a) : v6IntFromString(a), Number(l)];
}

/** Whether a value is inside a block (Network.__contains__). */
function inBlock(v: Version, ip: bigint, b: Block): boolean {
  // Masked value equals the block's network.
  return (ip & maskOf(v, b[1])) === b[0];
}

/** CPython 3.13.16's IPv4 constants. */
const V4 = {
  // 169.254.0.0/16.
  linkLocal: blk(4, "169.254.0.0/16"),
  // 127.0.0.0/8.
  loopback: blk(4, "127.0.0.0/8"),
  // 224.0.0.0/4.
  multicast: blk(4, "224.0.0.0/4"),
  // 100.64.0.0/10, neither private nor global.
  shared: blk(4, "100.64.0.0/10"),
  // Not globally reachable.
  private: ["0.0.0.0/8", "10.0.0.0/8", "127.0.0.0/8", "169.254.0.0/16", "172.16.0.0/12", "192.0.0.0/24", "192.0.0.170/31", "192.0.2.0/24", "192.168.0.0/16", "198.18.0.0/15", "198.51.100.0/24", "203.0.113.0/24", "240.0.0.0/4", "255.255.255.255/32"].map((b) => blk(4, b)),
  // The exceptions inside 192.0.0.0/24.
  exceptions: ["192.0.0.9/32", "192.0.0.10/32"].map((b) => blk(4, b)),
  // 240.0.0.0/4.
  reserved: blk(4, "240.0.0.0/4"),
} as const;

/** CPython 3.13.16's IPv6 constants. */
const V6 = {
  // fe80::/10.
  linkLocal: blk(6, "fe80::/10"),
  // ff00::/8.
  multicast: blk(6, "ff00::/8"),
  // Not globally reachable.
  private: ["::1/128", "::/128", "::ffff:0:0/96", "64:ff9b:1::/48", "100::/64", "2001::/23", "2001:db8::/32", "2002::/16", "3fff::/20", "fc00::/7", "fe80::/10"].map((b) => blk(6, b)),
  // Globally reachable blocks inside 2001::/23.
  exceptions: ["2001:1::1/128", "2001:1::2/128", "2001:3::/32", "2001:4:112::/48", "2001:20::/28", "2001:30::/28"].map((b) => blk(6, b)),
  // Reserved by the IETF.
  reserved: ["::/8", "100::/8", "200::/7", "400::/6", "800::/5", "1000::/4", "4000::/3", "6000::/3", "8000::/3", "a000::/3", "c000::/3", "e000::/4", "f000::/5", "f800::/6", "fe00::/9"].map((b) => blk(6, b)),
  // fec0::/10, deprecated site-local.
  siteLocal: blk(6, "fec0::/10"),
} as const;

/** The property names the lab shows, in display order. */
export const PROPERTIES = ["is_private", "is_global", "is_loopback", "is_link_local", "is_multicast", "is_reserved", "is_unspecified", "is_site_local"] as const;
/** One property name. */
export type PropertyName = (typeof PROPERTIES)[number];

/** IPv4Address's properties of a value. */
function v4Props(ip: bigint): Record<Exclude<PropertyName, "is_site_local">, boolean> {
  // In a private block and in no exception.
  const isPrivate = V4.private.some((b) => inBlock(4, ip, b)) && V4.exceptions.every((b) => !inBlock(4, ip, b));
  // All of them.
  return {
    // Private.
    is_private: isPrivate,
    // Global: not shared space and not private.
    is_global: !inBlock(4, ip, V4.shared) && !isPrivate,
    // 127/8.
    is_loopback: inBlock(4, ip, V4.loopback),
    // 169.254/16.
    is_link_local: inBlock(4, ip, V4.linkLocal),
    // 224/4.
    is_multicast: inBlock(4, ip, V4.multicast),
    // 240/4.
    is_reserved: inBlock(4, ip, V4.reserved),
    // 0.0.0.0.
    is_unspecified: ip === 0n,
  };
}

/** IPv6Address's properties of a value (IPv4-mapped values judged as IPv4). */
function v6Props(ip: bigint): Record<PropertyName, boolean> {
  // The mapped IPv4 value, if any.
  const m = mappedOf(ip);
  // Site-local never follows the mapping.
  const siteLocal = inBlock(6, ip, V6.siteLocal);
  // A mapped address borrows the IPv4 answers.
  if (m !== null) return { ...v4Props(m), is_site_local: siteLocal };
  // In a private block and in no exception.
  const isPrivate = V6.private.some((b) => inBlock(6, ip, b)) && V6.exceptions.every((b) => !inBlock(6, ip, b));
  // All of them.
  return {
    // Private.
    is_private: isPrivate,
    // Global is the opposite of private for IPv6.
    is_global: !isPrivate,
    // ::1.
    is_loopback: ip === 1n,
    // fe80::/10.
    is_link_local: inBlock(6, ip, V6.linkLocal),
    // ff00::/8.
    is_multicast: inBlock(6, ip, V6.multicast),
    // The reserved blocks.
    is_reserved: V6.reserved.some((b) => inBlock(6, ip, b)),
    // ::.
    is_unspecified: ip === 0n,
    // fec0::/10.
    is_site_local: siteLocal,
  };
}

/** The properties of an object; is_site_local only for IPv6. */
function propsOf(o: IpObject): { name: PropertyName; value: boolean }[] {
  // The values by name.
  let vals: Partial<Record<PropertyName, boolean>>;
  // Addresses: their own value.
  if (o.kind === "address") vals = o.v === 4 ? v4Props(o.ip) : v6Props(o.ip);
  // Interfaces: the address's answers, with the documented overrides.
  else if (o.kind === "interface") {
    // The address-level answers.
    const base: Partial<Record<PropertyName, boolean>> = o.v === 4 ? v4Props(o.ip) : v6Props(o.ip);
    // The network-level answers the overrides read.
    const net = netProps(o.network);
    // IPv4Interface compares itself with the address 0.0.0.0, and an interface never equals an address.
    if (o.v === 4) vals = { ...base, is_unspecified: false };
    // IPv6Interface: both the address and its network must qualify.
    else vals = { ...base, is_unspecified: o.ip === 0n && Boolean(net.is_unspecified), is_loopback: Boolean(base.is_loopback) && Boolean(net.is_loopback) };
  }
  // Networks.
  else vals = netProps(o);
  // In display order, site-local for IPv6 only.
  return PROPERTIES.filter((p) => p !== "is_site_local" || o.v === 6).map((p) => ({ name: p, value: Boolean(vals[p]) }));
}

/** A network's properties: both ends must have them, and is_private reads the lists directly. */
function netProps(n: Net): Partial<Record<PropertyName, boolean>> {
  // The two ends as values.
  const first = n.netAddr.ip;
  // The broadcast (last) value.
  const last = first | (ALL_ONES[n.v] ^ maskOf(n.v, n.prefixlen));
  // Address-level answers of each end.
  const pf = n.v === 4 ? v4Props(first) : v6Props(first);
  // Of the last.
  const pl = n.v === 4 ? v4Props(last) : v6Props(last);
  // The lists of the version.
  const lists = n.v === 4 ? V4 : V6;
  // Both ends in one private block, and neither in an exception.
  const isPrivate = lists.private.some((b) => inBlock(n.v, first, b) && inBlock(n.v, last, b)) && lists.exceptions.every((b) => !inBlock(n.v, first, b) && !inBlock(n.v, last, b));
  // IPv4 networks inside 100.64.0.0/10 are not global either.
  const shared = n.v === 4 && inBlock(4, first, V4.shared) && inBlock(4, last, V4.shared);
  // All of them.
  const out: Partial<Record<PropertyName, boolean>> = {
    // Private.
    is_private: isPrivate,
    // Global.
    is_global: !shared && !isPrivate,
    // Both ends.
    is_loopback: pf.is_loopback && pl.is_loopback,
    // Both ends.
    is_link_local: pf.is_link_local && pl.is_link_local,
    // Both ends.
    is_multicast: pf.is_multicast && pl.is_multicast,
    // Both ends.
    is_reserved: pf.is_reserved && pl.is_reserved,
    // Both ends.
    is_unspecified: pf.is_unspecified && pl.is_unspecified,
  };
  // Site-local for IPv6 networks.
  if (n.v === 6) out.is_site_local = inBlock(6, first, V6.siteLocal) && inBlock(6, last, V6.siteLocal);
  // The answers.
  return out;
}

// ---------------------------------------------------------------------------
// Where CPython and IANA disagree (rule 10)
// ---------------------------------------------------------------------------

/** One registry row CPython 3.13.16 does not follow. */
export interface IanaDisagreement {
  /** The registry's block. */
  block: string;
  /** The registry's Name column. */
  name: string;
  /** The registry's RFC column. */
  rfc: string;
  /** The registry's Globally Reachable column. */
  ianaGlobal: boolean;
  /** What CPython's is_global says for addresses in it. */
  pythonGlobal: boolean;
}

/** The four rows, from the IANA CSVs read 2026-10-27 (both last updated 2025-10-09). */
const DISAGREEMENTS: readonly (IanaDisagreement & { v: Version; b: Block })[] = [
  // IPv4: 6a44 relay anycast.
  { v: 4, b: blk(4, "192.88.99.2/32"), block: "192.88.99.2/32", name: "6a44-relay anycast address", rfc: "RFC 6751", ianaGlobal: false, pythonGlobal: true },
  // IPv6: the dummy prefix.
  { v: 6, b: blk(6, "100:0:0:1::/64"), block: "100:0:0:1::/64", name: "Dummy IPv6 Prefix", rfc: "RFC 9780", ianaGlobal: false, pythonGlobal: true },
  // IPv6: DNS-SD SRP anycast.
  { v: 6, b: blk(6, "2001:1::3/128"), block: "2001:1::3/128", name: "DNS-SD Service Registration Protocol Anycast", rfc: "RFC 9665", ianaGlobal: true, pythonGlobal: false },
  // IPv6: SRv6 SIDs.
  { v: 6, b: blk(6, "5f00::/16"), block: "5f00::/16", name: "Segment Routing (SRv6) SIDs", rfc: "RFC 9602", ianaGlobal: false, pythonGlobal: true },
];

// ---------------------------------------------------------------------------
// The lab's result
// ---------------------------------------------------------------------------

/** One constructor the factory tried. */
export interface Attempt {
  /** The class, e.g. "IPv4Network". */
  cls: string;
  /** The call as Python would read it, e.g. "IPv4Network('192.0.2.77/26')". */
  call: string;
  /** Returned an object, raised and was caught by the factory, or raised past it. */
  outcome: "returned" | "caught" | "propagated";
  /** The exception class, when it raised. */
  exception?: PyExceptionName;
  /** The exception's message, when it raised. */
  message?: string;
}

/** One attribute row: the Python expression on the object and the value the REPL prints. */
export interface Field {
  /** The attribute or call, e.g. "network_address" or "int(x)". */
  name: string;
  /** repr() of the value. */
  value: string;
}

/** The method's outcome. */
export interface MethodResult {
  /** The call, e.g. "subnets(new_prefix=28)". */
  call: string;
  /** subnets: how many it yields (as decimal text, it can exceed 2**53). */
  count?: string;
  /** subnets: the first ones and the last (reprs); supernet: the one network. */
  items?: string[];
  /** Whether items skips some subnets between the second and the last. */
  gap?: boolean;
  /** The exception, when the call raised. */
  error?: { exception: PyExceptionName; message: string };
}

/** Everything the lab shows for one setting. */
export interface IpaddressResult {
  /** The whole operation as one Python expression. */
  python: string;
  /** The factory's tries, in order. */
  attempts: Attempt[];
  /** The object's repr, when the factory returned one. */
  repr: string | null;
  /** The object's class, when there is one. */
  cls: string | null;
  /** The final exception, when the factory raised. */
  error: { exception: PyExceptionName; message: string } | null;
  /** Attributes of the object, in display order. */
  fields: Field[];
  /** hosts(): how many, the first and the last (networks only). */
  hosts: { count: string; first: string; last: string } | null;
  /** The is_* properties. */
  props: { name: PropertyName; value: boolean }[];
  /** The method's result, when one was asked for and the factory returned. */
  method: MethodResult | null;
  /** strict=False masked host bits off: the network is not what was typed. */
  masked: boolean;
  /** The registry row CPython disagrees with, when the address falls in one. */
  iana: IanaDisagreement | null;
  /** A zoned IPv6 address whose reverse_pointer carries the zone (exploded keeps it since 3.13.16, bpo-44012). */
  zoneInPointer: boolean;
  /** How it ended. */
  verdict: "object" | "masked" | "error";
}

/** The opening state: an interface, the host address with its network. */
export const DEFAULT_INPUT: IpaddressInput = Object.freeze({ text: "192.0.2.77/26", call: "ip_interface", method: "none", newPrefix: "" });
/** The Example: the same text as a strict network, which the factory refuses. */
export const EXAMPLE_INPUT: IpaddressInput = Object.freeze({ text: "192.0.2.77/26", call: "ip_network", method: "none", newPrefix: "" });

/** The factory's name and its keyword arguments for a call key. */
function factoryOf(call: Call): { fn: string; kw: string; kind: "address" | "network" | "interface" } {
  // By call.
  switch (call) {
    // ip_address(text).
    case "ip_address":
      return { fn: "ip_address", kw: "", kind: "address" };
    // ip_network(text).
    case "ip_network":
      return { fn: "ip_network", kw: "", kind: "network" };
    // ip_network(text, strict=False).
    case "ip_network_loose":
      return { fn: "ip_network", kw: ", strict=False", kind: "network" };
    // ip_interface(text).
    default:
      return { fn: "ip_interface", kw: "", kind: "interface" };
  }
}

/** Run one constructor of the factory. */
function construct(kind: "address" | "network" | "interface", v: Version, text: string, strict: boolean): IpObject {
  // By kind.
  if (kind === "address") return newAddress(v, text);
  // Networks honour strict.
  if (kind === "network") return newNetwork(v, text, strict);
  // Interfaces never refuse host bits.
  return newInterface(v, text);
}

/** The attribute rows of an object. */
function fieldsOf(o: IpObject): Field[] {
  // str() first, for every kind.
  const rows: Field[] = [{ name: "str(x)", value: pyStrRepr(strOf(o)) }];
  // Addresses.
  if (o.kind === "address") {
    // exploded.
    rows.push({ name: "exploded", value: pyStrRepr(addrExploded(o)) });
    // int().
    rows.push({ name: "int(x)", value: o.ip.toString() });
    // packed.
    rows.push({ name: "packed", value: pyBytesRepr(packedOf(o.v, o.ip)) });
    // reverse_pointer.
    rows.push({ name: "reverse_pointer", value: pyStrRepr(addrReversePointer(o)) });
    // IPv4: the mapped IPv6 address (3.13).
    if (o.v === 4) rows.push({ name: "ipv6_mapped", value: `IPv6Address(${pyStrRepr(`::ffff:${addrStr(o)}`)})` });
    // IPv6: zone and embedded IPv4 addresses.
    else {
      // The zone.
      rows.push({ name: "scope_id", value: o.scope === null ? "None" : pyStrRepr(o.scope) });
      // ::ffff:0:0/96.
      const m = mappedOf(o.ip);
      // ipv4_mapped.
      rows.push({ name: "ipv4_mapped", value: m === null ? "None" : reprOf(bare(4, m)) });
      // 2002::/16.
      rows.push({ name: "sixtofour", value: o.ip >> 112n === 0x2002n ? reprOf(bare(4, (o.ip >> 80n) & 0xffffffffn)) : "None" });
      // 2001::/32: server, then the inverted client.
      rows.push({ name: "teredo", value: o.ip >> 96n === 0x20010000n ? `(${reprOf(bare(4, (o.ip >> 64n) & 0xffffffffn))}, ${reprOf(bare(4, ~o.ip & 0xffffffffn))})` : "None" });
    }
  }
  // Networks.
  else if (o.kind === "network") {
    // The mask integer.
    const m = maskOf(o.v, o.prefixlen);
    // The host mask integer.
    const hm = ALL_ONES[o.v] ^ m;
    // network_address (keeps a zone when nothing was masked).
    rows.push({ name: "network_address", value: reprOf(o.netAddr) });
    // broadcast_address.
    rows.push({ name: "broadcast_address", value: reprOf(bare(o.v, o.netAddr.ip | hm)) });
    // netmask.
    rows.push({ name: "netmask", value: reprOf(bare(o.v, m)) });
    // hostmask.
    rows.push({ name: "hostmask", value: reprOf(bare(o.v, hm)) });
    // prefixlen.
    rows.push({ name: "prefixlen", value: String(o.prefixlen) });
    // num_addresses.
    rows.push({ name: "num_addresses", value: (hm + 1n).toString() });
    // with_netmask.
    rows.push({ name: "with_netmask", value: pyStrRepr(`${addrStr(o.netAddr)}/${addrStr(bare(o.v, m))}`) });
    // with_hostmask.
    rows.push({ name: "with_hostmask", value: pyStrRepr(`${addrStr(o.netAddr)}/${addrStr(bare(o.v, hm))}`) });
  }
  // Interfaces.
  else {
    // The mask integer.
    const m = maskOf(o.v, o.prefixlen);
    // The address without the zone, as _string_from_ip_int writes it (no dotted IPv4 tail).
    const plain = o.v === 4 ? v4StringFromInt(o.ip) : v6StringFromInt(o.ip);
    // ip.
    rows.push({ name: "ip", value: reprOf(bare(o.v, o.ip)) });
    // network.
    rows.push({ name: "network", value: reprOf(o.network) });
    // with_prefixlen.
    rows.push({ name: "with_prefixlen", value: pyStrRepr(`${plain}/${o.prefixlen}`) });
    // with_netmask.
    rows.push({ name: "with_netmask", value: pyStrRepr(`${plain}/${addrStr(bare(o.v, m))}`) });
    // with_hostmask.
    rows.push({ name: "with_hostmask", value: pyStrRepr(`${plain}/${addrStr(bare(o.v, ALL_ONES[o.v] ^ m))}`) });
  }
  // The rows.
  return rows;
}

/** hosts(): count, first and last (rule 7). */
function hostsOf(n: Net): { count: string; first: string; last: string } {
  // First and last values of the network.
  const net = n.netAddr.ip;
  // Broadcast.
  const bcast = net | (ALL_ONES[n.v] ^ maskOf(n.v, n.prefixlen));
  // /32 or /128: the single address, built again from the text.
  if (n.prefixlen === BITS[n.v] && n.single) return { count: "1", first: reprOf(n.single), last: reprOf(n.single) };
  // /31 or /127: both addresses.
  if (n.prefixlen === BITS[n.v] - 1) return { count: "2", first: reprOf(bare(n.v, net)), last: reprOf(bare(n.v, bcast)) };
  // IPv4: all but the network and broadcast addresses.
  if (n.v === 4) return { count: (bcast - net - 1n).toString(), first: reprOf(bare(4, net + 1n)), last: reprOf(bare(4, bcast - 1n)) };
  // IPv6: all but the Subnet-Router anycast address (the first).
  return { count: (bcast - net).toString(), first: reprOf(bare(6, net + 1n)), last: reprOf(bare(6, bcast)) };
}

/** subnets() or supernet() on an object (rule 8). */
function methodOf(o: IpObject, method: "subnets" | "supernet", newPrefix: number | null): MethodResult {
  // The call as written.
  const call = `${method}(${newPrefix === null ? "" : `new_prefix=${newPrefix}`})`;
  // Addresses and interfaces have no such method.
  if (o.kind !== "network") return { call, error: { exception: "AttributeError", message: `'${className(o)}' object has no attribute '${method}'` } };
  // The width.
  const max = BITS[o.v];
  // subnets().
  if (method === "subnets") {
    // A /32 or /128 yields itself, whatever was asked.
    if (o.prefixlen === max) return { call, count: "1", items: [reprOf(o)], gap: false };
    // The requested length must not be shorter.
    if (newPrefix !== null && newPrefix < o.prefixlen) return { call, error: { exception: "ValueError", message: "new prefix must be longer" } };
    // One bit by default.
    const newLen = newPrefix === null ? o.prefixlen + 1 : newPrefix;
    // Not beyond the width.
    if (newLen > max) return { call, error: { exception: "ValueError", message: `prefix length diff ${newLen} is invalid for netblock ${netStr(o)}` } };
    // How many.
    const count = 1n << BigInt(newLen - o.prefixlen);
    // The step between them.
    const step = 1n << BigInt(max - newLen);
    // Network i.
    const nth = (i: bigint) => reprOf({ kind: "network", v: o.v, netAddr: bare(o.v, o.netAddr.ip + i * step), prefixlen: newLen, single: null });
    // First, second and last.
    const items = count === 1n ? [nth(0n)] : count === 2n ? [nth(0n), nth(1n)] : [nth(0n), nth(1n), nth(count - 1n)];
    // The answer.
    return { call, count: count.toString(), items, gap: count > 3n };
  }
  // supernet() of a /0 is itself.
  if (o.prefixlen === 0) return { call, items: [reprOf(o)] };
  // The requested length must not be longer.
  if (newPrefix !== null && newPrefix > o.prefixlen) return { call, error: { exception: "ValueError", message: "new prefix must be shorter" } };
  // How many bits to drop.
  const diff = newPrefix === null ? 1 : o.prefixlen - newPrefix;
  // The new length.
  const newLen = o.prefixlen - diff;
  // Not below zero.
  if (newLen < 0) return { call, error: { exception: "ValueError", message: `current prefixlen is ${o.prefixlen}, cannot have a prefixlen_diff of ${diff}` } };
  // The wider network.
  return { call, items: [reprOf({ kind: "network", v: o.v, netAddr: bare(o.v, o.netAddr.ip & maskOf(o.v, newLen)), prefixlen: newLen, single: null })] };
}

/** The registry row CPython disagrees with, for an address or an interface's address. */
function ianaOf(o: IpObject): IanaDisagreement | null {
  // Networks are not judged.
  if (o.kind === "network") return null;
  // The first row that holds the value.
  const row = DISAGREEMENTS.find((d) => d.v === o.v && inBlock(o.v, o.ip, d.b));
  // Without the internal fields.
  return row ? { block: row.block, name: row.name, rfc: row.rfc, ianaGlobal: row.ianaGlobal, pythonGlobal: row.pythonGlobal } : null;
}

/** Validate the settings, or refuse them with a code. */
function validate(input: IpaddressInput): number | null {
  // The text's bound.
  if (input.text.length > MAX_TEXT_LENGTH) throw new IpaddressLabError("too-long");
  // Printable ASCII only (space included).
  if (!/^[\x20-\x7e]*$/.test(input.text)) throw new IpaddressLabError("not-printable-ascii");
  // Known choices only.
  if (!(CALLS as readonly string[]).includes(input.call) || !(METHODS as readonly string[]).includes(input.method)) throw new IpaddressLabError("bad-choice");
  // new_prefix: empty, or an integer of at most four digits.
  const np = input.newPrefix.trim();
  // Empty: the method's default.
  if (np === "") return null;
  // Anything else must be an integer.
  if (!/^[+-]?[0-9]{1,4}$/.test(np)) throw new IpaddressLabError("bad-new-prefix");
  // Its value.
  return Number(np);
}

/** Run the reader's settings through the model. */
export function compute(input: IpaddressInput): IpaddressResult {
  // Refuse what the lab does not take.
  const newPrefix = validate(input);
  // The factory and its words.
  const f = factoryOf(input.call);
  // strict for networks.
  const strict = input.call !== "ip_network_loose";
  // The text as Python would see it.
  const arg = pyStrRepr(input.text);
  // The method part of the expression.
  const methodPart = input.method === "none" ? "" : `.${input.method}(${newPrefix === null ? "" : `new_prefix=${newPrefix}`})`;
  // The factory call with the method.
  const expr = `ipaddress.${f.fn}(${arg}${f.kw})${methodPart}`;
  // subnets() returns an iterator: list() shows what it yields.
  const python = input.method === "subnets" ? `list(${expr})` : expr;
  // The tries.
  const attempts: Attempt[] = [];
  // The object, if one comes back.
  let obj: IpObject | null = null;
  // The final exception, if one escapes.
  let error: { exception: PyExceptionName; message: string } | null = null;
  // IPv4 first, then IPv6.
  for (const v of [4, 6] as const) {
    // The class name.
    const cls = `IPv${v}${f.kind === "address" ? "Address" : f.kind === "network" ? "Network" : "Interface"}`;
    // The call as Python reads it.
    const call = `${cls}(${arg}${f.kind === "network" && !strict ? ", strict=False" : ""})`;
    // Try it.
    try {
      // The object.
      obj = construct(f.kind, v, input.text, strict);
      // Recorded.
      attempts.push({ cls, call, outcome: "returned" });
      // Done.
      break;
    } catch (e) {
      // Only modelled Python exceptions are expected.
      if (!(e instanceof PyError)) throw e;
      // The factory catches only these two.
      const caught = e.pyType === "AddressValueError" || e.pyType === "NetmaskValueError";
      // Recorded.
      attempts.push({ cls, call, outcome: caught ? "caught" : "propagated", exception: e.pyType, message: e.pyMessage });
      // A ValueError escapes the factory at once.
      if (!caught) {
        // The final exception.
        error = { exception: e.pyType, message: e.pyMessage };
        // No further try.
        break;
      }
    }
  }
  // Both classes refused: the factory's own message.
  if (!obj && !error) error = { exception: "ValueError", message: `${arg} does not appear to be an IPv4 or IPv6 ${f.kind}` };
  // Whether strict=False changed the network.
  let masked = false;
  // Compare the network with what was typed.
  if (obj && obj.kind === "network" && !strict) {
    // The address part as typed, parsed again (it parsed once already).
    const typed = newAddress(obj.v, splitAddrPrefix(obj.v, input.text)[0]);
    // Different value: bits were masked.
    masked = typed.ip !== obj.netAddr.ip;
  }
  // The method, when the factory returned.
  const method = obj && input.method !== "none" ? methodOf(obj, input.method, newPrefix) : null;
  // The result.
  return {
    // The expression.
    python,
    // The tries.
    attempts,
    // repr.
    repr: obj ? reprOf(obj) : null,
    // Class.
    cls: obj ? className(obj) : null,
    // Exception.
    error,
    // Attributes.
    fields: obj ? fieldsOf(obj) : [],
    // hosts().
    hosts: obj && obj.kind === "network" ? hostsOf(obj) : null,
    // Properties.
    props: obj ? propsOf(obj) : [],
    // Method.
    method,
    // Masked.
    masked,
    // IANA.
    iana: obj ? ianaOf(obj) : null,
    // A zoned, unmapped IPv6 address: reverse_pointer is built from exploded, which keeps the zone.
    zoneInPointer: obj !== null && obj.kind === "address" && obj.v === 6 && obj.scope !== null && mappedOf(obj.ip) === null,
    // Verdict.
    verdict: !obj ? "error" : masked ? "masked" : "object",
  };
}
