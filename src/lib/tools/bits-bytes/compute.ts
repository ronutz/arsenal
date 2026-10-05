// ============================================================================
// src/lib/tools/bits-bytes/compute.ts
// ----------------------------------------------------------------------------
// BITS, BYTES AND THROUGHPUT - the pure, deterministic engine.
//
// LINEAGE. A "Calculadora de bits e bytes" sat on nutzmann.net from 2004 and on
// ntz.com.br in 2013 (see /about/earlier-sites): six unit fields, a note about
// the IEC's 1998 binary prefixes, a worked example (a "56k" modem moving a
// "56k" file takes about 8.2 seconds, not one), a connection-type table and a
// powers-of-1024 capacity table. This is that calculator rebuilt the way the
// site builds tools: exact arithmetic, both conventions shown side by side,
// every rate and every rule sourced.
//
// WHAT IT DOES. Reads a quantity written the way people write it ("1.5 GB",
// "700 MiB", "64 kbit/s", "12.5 MB/s", "2h 30min") and answers three kinds of
// question: how much is this (a size in every unit of both conventions, with
// the exact bit count), how fast is this (a rate in bits and bytes per second
// and how much it moves per minute, hour and day), and how long does this
// take (a size over a rate, with an optional efficiency, or any two of size,
// rate and time giving the third). The connection table answers the third
// question for a set of standard link rates at once.
//
// EXACTNESS. Quantities are decimals held as a BigInt mantissa and a power of
// ten, so 1.5 GB is exactly 12 000 000 000 bits and a zettabyte in bits is
// written out in full; nothing is rounded until it is printed, and printing
// says how many significant digits it kept. Time is computed as a rational
// (bits over bits per second) and printed to the millisecond.
//
// CONVENTIONS. SI prefixes mean powers of 1000 (kB = 1000 bytes), IEC binary
// prefixes mean powers of 1024 (KiB = 1024 bytes), per IEC 60027-2 Amendment 2
// (1999), now IEC 80000-13, as NIST documents. A plain capital K with no unit,
// as ls(1) reads it, means 1024. A lower-case b is a bit and a capital B a
// byte; "Kb" and "kb" are read as kilobit and reported as ambiguous, because
// marketing copy uses them for both.
//
// SOURCES (all read 2026-10-04): NIST, Prefixes for binary multiples; ls(1)
// from GNU coreutils (man7.org) for -h, --si and the SIZE argument; RFC 2544
// Appendix C (Ethernet on-wire size: preamble 64 bits, frame 8 x N bits, gap
// 96 bits) and RFC 791 and RFC 9293 (20-octet minimum IPv4 and TCP headers)
// for the efficiency preset; ITU-T V.90 (56 000 bit/s downstream), ITU-T G.704
// (1544 and 2048 kbit/s), IEEE 802.3-2022 (1 Mb/s to 400 Gb/s) for the
// connection table; the archived 2004 and 2013 calculator pages for the
// lineage rows and the worked example.
// ============================================================================

// ----------------------------------------------------------------------------
// Sources
// ----------------------------------------------------------------------------

/** A source the manifest publishes: what, where, when read, used for what. */
export interface Source {
  id: string;
  label: string;
  type: "reference" | "implementation" | "vendor-docs" | "vendor-kb" | "vendor-community";
  url: string;
  access_date: string;
  scope: string;
}

/** The day every source below was read. */
const READ = "2026-10-04";

/** Build a source record. */
const src = (id: string, label: string, type: Source["type"], url: string, scope: string): Source => ({ id, label, type, url, access_date: READ, scope });

/** Every source, in the order the manifest lists them. */
export const SOURCES: Source[] = [
  src("nist-binary", "NIST Reference on Constants, Units, and Uncertainty: Prefixes for binary multiples", "reference", "https://physics.nist.gov/cuu/Units/binary.html", "the IEC approved names and symbols for binary multiples in December 1998 (IEC 60027-2 Amendment 2, 1999-01): kibi Ki 2^10, mebi Mi 2^20, gibi Gi 2^30, tebi Ti 2^40, pebi Pi 2^50, exbi Ei 2^60; these are not part of the SI, whose prefixes are decimal (mega means 1 000 000)"),
  src("ls1", "ls(1), GNU coreutils (man7.org)", "reference", "https://man7.org/linux/man-pages/man1/ls.1.html", "-h, --human-readable prints sizes like 1K 234M 2G; --si does likewise but uses powers of 1000 not 1024; the SIZE argument reads K, M, G, T, P, E, Z, Y, R, Q as powers of 1024 and KB, MB, ... as powers of 1000, with KiB=K, MiB=M also accepted"),
  src("rfc2544-c", "RFC 2544: Benchmarking Methodology for Network Interconnect Devices, Appendix C", "reference", "https://www.rfc-editor.org/rfc/rfc2544#appendix-C", "Ethernet size on the wire: preamble 64 bits, frame 8 x N bits, gap 96 bits; the theoretical maximum frame rates per media (812 frames per second of 1518 bytes at 10 Mb/s)"),
  src("rfc791", "RFC 791: Internet Protocol", "reference", "https://www.rfc-editor.org/rfc/rfc791", "the IPv4 header is at least 20 octets (IHL minimum 5 words)"),
  src("rfc9293", "RFC 9293: Transmission Control Protocol (TCP)", "reference", "https://www.rfc-editor.org/rfc/rfc9293", "the TCP header is at least 20 octets (Data Offset minimum 5 words)"),
  src("rfc8200", "RFC 8200: Internet Protocol, Version 6 (IPv6) Specification, section 8.3", "reference", "https://www.rfc-editor.org/rfc/rfc8200#section-8.3", "the IPv4 MSS is the packet size minus 40 octets (20 for the minimum IPv4 header and 20 for the minimum TCP header); over IPv6 it is minus 60 octets, because the minimum-length IPv6 header is 20 octets longer, that is 40 octets"),
  src("rfc768", "RFC 768: User Datagram Protocol", "reference", "https://www.rfc-editor.org/rfc/rfc768", "the UDP length includes the header and the data, so its minimum value is eight: an 8-octet header"),
  src("itu-v90", "ITU-T Recommendation V.90 (09/98)", "reference", "https://www.itu.int/rec/T-REC-V.90/en", "a digital modem and analogue modem pair for the PSTN at data signalling rates of up to 56 000 bit/s downstream and up to 33 600 bit/s upstream"),
  src("itu-g704", "ITU-T Recommendation G.704 (10/98)", "reference", "https://www.itu.int/rec/T-REC-G.704/en", "synchronous frame structures used at 1544, 6312, 2048, 8448 and 44 736 kbit/s hierarchical levels (the T1 and E1 rates)"),
  src("ieee8023", "IEEE Std 802.3-2022, IEEE Standard for Ethernet", "reference", "https://standards.ieee.org/ieee/802.3/10422/", "Ethernet operation is specified for selected speeds from 1 Mb/s to 400 Gb/s with a common MAC; the 10, 100, 1000 Mb/s and 2.5, 5, 10, 25, 40, 100, 400 Gb/s rows of the connection table"),
  src("ntz-2004", "nutzmann.net, Calculadora de bits e bytes (2004-10-09), Internet Archive capture", "reference", "https://web.archive.org/web/20041009131549/http://nutzmann.net:80/bitsandbytes.htm", "the original calculator: six unit fields, its note that it used the market convention in force before the IEC's 1998 regulation and would change when the new standard was adopted in practice, the 56k worked example (a 56 KB file of 57 344 bytes over a 56 000 bit/s modem: at least 8.2 seconds, not one) and its connection-type table, kept here as the lineage rows"),
  src("ntz-2013", "ntz.com.br, Calculadora e conversão de bits e bytes (2013), Internet Archive capture", "reference", "https://web.archive.org/web/2013/http://ntz.com.br/bitsandbytes.html", "the same calculator on the 2013 site, with its IEC prefix table (kibibit to exbibyte) and its powers-of-1024 capacity table"),
];

// ----------------------------------------------------------------------------
// Exact decimals: a BigInt mantissa over a power of ten
// ----------------------------------------------------------------------------

/** An exact decimal: value = num / 10^scale. */
export interface Dec {
  num: bigint;
  scale: number;
}

const ten = (n: number): bigint => 10n ** BigInt(n);

/** Parses a decimal literal ("1.5", "0.25", "12") exactly; null when malformed. */
export function parseDec(text: string): Dec | null {
  const m = /^(\d+)(?:[.,](\d+))?$/.exec(text.trim());
  if (!m) return null;
  const frac = m[2] ?? "";
  return { num: BigInt(m[1] + frac), scale: frac.length };
}

/** Multiplies an exact decimal by an integer. */
const mulInt = (d: Dec, k: bigint): Dec => ({ num: d.num * k, scale: d.scale });

/**
 * Formats num / den as a decimal string with at most `maxFrac` fractional
 * digits and no trailing zeros; `exact` says whether the division terminated
 * within that precision (false means the printed value is rounded half-up).
 */
export function formatRatio(num: bigint, den: bigint, maxFrac = 6): { text: string; exact: boolean } {
  if (den === 0n) return { text: "∞", exact: true };
  const neg = num < 0n !== den < 0n;
  let n = num < 0n ? -num : num;
  const d = den < 0n ? -den : den;
  // Scale up, divide, then round half-up on the digit after the last kept one.
  const scaled = n * ten(maxFrac + 1);
  let q = scaled / d;
  const rem = scaled % d;
  const exact = rem === 0n && q % 10n === 0n;
  q = (q + 5n) / 10n; // round half-up to maxFrac digits
  let s = q.toString().padStart(maxFrac + 1, "0");
  let intPart = s.slice(0, s.length - maxFrac);
  let fracPart = maxFrac > 0 ? s.slice(s.length - maxFrac).replace(/0+$/, "") : "";
  if (intPart === "") intPart = "0";
  // Group the integer part in threes with thin spaces for readability.
  intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const text = (neg ? "-" : "") + intPart + (fracPart ? "." + fracPart : "");
  return { text, exact };
}

/** Formats an exact decimal. */
const formatDec = (d: Dec, maxFrac = 6) => formatRatio(d.num, ten(d.scale), maxFrac);

// ----------------------------------------------------------------------------
// Units
// ----------------------------------------------------------------------------

/** How many bits one of the unit is. Powers of ten and of 1024, as BigInt. */
const KI = 1024n;
const UNIT_BITS: Record<string, bigint> = {
  // bits
  bit: 1n, kbit: 1000n, Mbit: 1000n ** 2n, Gbit: 1000n ** 3n, Tbit: 1000n ** 4n, Pbit: 1000n ** 5n,
  Kibit: KI, Mibit: KI ** 2n, Gibit: KI ** 3n, Tibit: KI ** 4n,
  // bytes, decimal
  B: 8n, kB: 8n * 1000n, MB: 8n * 1000n ** 2n, GB: 8n * 1000n ** 3n, TB: 8n * 1000n ** 4n, PB: 8n * 1000n ** 5n, EB: 8n * 1000n ** 6n, ZB: 8n * 1000n ** 7n,
  // bytes, binary
  KiB: 8n * KI, MiB: 8n * KI ** 2n, GiB: 8n * KI ** 3n, TiB: 8n * KI ** 4n, PiB: 8n * KI ** 5n, EiB: 8n * KI ** 6n, ZiB: 8n * KI ** 7n,
};

/** The units a size is shown in, in table order. */
export const SIZE_UNITS: readonly string[] = ["bit", "B", "kbit", "KiB", "kB", "Mbit", "MiB", "MB", "Gbit", "GiB", "GB", "Tbit", "TiB", "TB", "PiB", "PB"];
/** The units a rate is shown in (per second), in table order. */
export const RATE_UNITS: readonly string[] = ["bit", "kbit", "Mbit", "Gbit", "Tbit", "B", "kB", "MB", "GB", "TB", "KiB", "MiB", "GiB"];

/** What a parsed quantity is. */
export type Kind = "size" | "rate" | "time";

/** A quantity read from text. */
export interface Quantity {
  kind: Kind;
  /** The unit as normalised ("GB", "kbit", "MiB"); for time, "s". */
  unit: string;
  /** The value as written, exact. */
  value: Dec;
  /** For a size or a rate: the exact number of bits (per second for a rate), as a decimal. */
  bits: Dec;
  /** For a time: the exact number of seconds. */
  seconds: Dec;
  /** Notes about how the text was read. */
  notes: QuantityNote[];
  /** The text as written. */
  raw: string;
}

/** Things worth saying about how a quantity was read. */
export type QuantityNote =
  | "ambiguous-kb" // "Kb"/"kb": read as kilobit; some sources mean kilobyte
  | "bare-k-is-1024" // "10K": a bare capital prefix with no unit reads as 1024 bytes, as ls does
  | "si-on-bytes" // "1.5 GB": decimal, as the SI means it; disk makers agree, some operating systems do not
  | "iec-binary" // "700 MiB": binary, unambiguous
  | "bits-per-second" // the rate was written in bits
  | "bytes-per-second" // the rate was written in bytes
  | "octets"; // "octet" read as byte

/** Prefix letter to its two multipliers (decimal, binary). */
const PREFIX: Record<string, { dec: bigint; bin: bigint }> = {
  k: { dec: 1000n, bin: KI }, K: { dec: 1000n, bin: KI },
  M: { dec: 1000n ** 2n, bin: KI ** 2n }, G: { dec: 1000n ** 3n, bin: KI ** 3n }, T: { dec: 1000n ** 4n, bin: KI ** 4n },
  P: { dec: 1000n ** 5n, bin: KI ** 5n }, E: { dec: 1000n ** 6n, bin: KI ** 6n }, Z: { dec: 1000n ** 7n, bin: KI ** 7n },
};
/** Spelled-out prefixes to their letter and whether they are the binary ones. */
const WORD_PREFIX: Record<string, { letter: string; binary: boolean }> = {
  kilo: { letter: "k", binary: false }, mega: { letter: "M", binary: false }, giga: { letter: "G", binary: false }, tera: { letter: "T", binary: false }, peta: { letter: "P", binary: false }, exa: { letter: "E", binary: false }, zetta: { letter: "Z", binary: false },
  kibi: { letter: "K", binary: true }, mebi: { letter: "M", binary: true }, gibi: { letter: "G", binary: true }, tebi: { letter: "T", binary: true }, pebi: { letter: "P", binary: true }, exbi: { letter: "E", binary: true }, zebi: { letter: "Z", binary: true },
};

/** Normalised unit symbol for a prefix letter, binary flag and bit/byte base. */
function symbolFor(letter: string, binary: boolean, bytes: boolean): string {
  if (!letter) return bytes ? "B" : "bit";
  // The decimal prefix is k (SI); the binary one is Ki (IEC). Any other letter is itself.
  const L = letter === "k" || letter === "K" ? (binary ? "K" : "k") : letter;
  return `${L}${binary ? "i" : ""}${bytes ? "B" : "bit"}`;
}

/** The longest input the engine reads for one quantity. */
export const MAX_FIELD = 64;

/** The time units the engine reads: ms, s, min, h, d and their English and Portuguese words. */
const TIME_UNIT = "ms|s|sec|secs|seconds?|segundos?|min|mins|minutes?|minutos?|h|hr|hrs|hours?|horas?|d|days?|dias?";
/** A whole duration: one or more number+unit groups and nothing else. */
const TIME_SHAPE = new RegExp(`^(\\d+(?:[.,]\\d+)?\\s*(${TIME_UNIT})\\s*)+$`, "i");
/** One number+unit group, for matchAll. */
const TIME_GROUP = new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*(${TIME_UNIT})`, "gi");

/**
 * Parses one quantity: a size ("1.5 GB", "700 MiB", "8 bits", "2 kilobytes"),
 * a rate ("100 Mbit/s", "1 Gbps", "12.5 MB/s", "56k") or a time ("90 s",
 * "2h 30min", "1.5 days"). Returns null when the text is not a quantity.
 */
export function parseQuantity(raw: string, expect?: Kind): Quantity | null {
  const text = raw.trim().slice(0, MAX_FIELD);
  if (!text) return null;
  const notes: QuantityNote[] = [];

  // ---- time: one or more number+unit groups ("2h 30min", "90 s", "1.5 days", "2 horas"); the unit words are English and Portuguese
  if (expect === "time" || TIME_SHAPE.test(text)) {
    // In the time field the whole text must still be number+unit groups: "1 semana" is not a duration the engine knows.
    if (!TIME_SHAPE.test(text)) return null;
    const groups = [...text.matchAll(TIME_GROUP)];
    if (groups.length === 0) return null;
    // Sum in milliseconds exactly, then express as seconds (scale 3 or more).
    let total: Dec = { num: 0n, scale: 3 };
    for (const g of groups) {
      const v = parseDec(g[1]); if (!v) return null;
      const u = g[2].toLowerCase();
      const factorMs = u === "ms" ? 1n : /^(s|sec|secs|second|seconds|segundos?)$/.test(u) ? 1000n : /^(min|mins|minute|minutes|minutos?)$/.test(u) ? 60_000n : /^(h|hr|hrs|hour|hours|horas?)$/.test(u) ? 3_600_000n : 86_400_000n;
      // v (scale k) * factorMs ms -> as a Dec in ms, then to seconds by adding 3 to the scale.
      const ms: Dec = { num: v.num * factorMs, scale: v.scale };
      const asSeconds: Dec = { num: ms.num, scale: ms.scale + 3 };
      // Align scales and add.
      const scale = Math.max(total.scale, asSeconds.scale);
      total = { num: total.num * ten(scale - total.scale) + asSeconds.num * ten(scale - asSeconds.scale), scale };
    }
    return { kind: "time", unit: "s", value: total, bits: { num: 0n, scale: 0 }, seconds: total, notes, raw: text };
  }

  // ---- size or rate: number, optional prefix, unit, optional "/s" or "ps"
  const m = /^(\d+(?:[.,]\d+)?)\s*([A-Za-z]*?)(bps|\/s|ps|\/sec|per second)?$/.exec(text);
  if (!m) return null;
  const value = parseDec(m[1]); if (!value) return null;
  let word = m[2] ?? "";
  const rateSuffix = m[3] ?? "";
  // "bps" means bits per second; strip the "b" from the unit match.
  let isRate = rateSuffix !== "" || expect === "rate";
  if (rateSuffix === "bps") { /* unit is whatever precedes, bits implied below */ }

  // Spelled-out forms: "kilobytes", "mebibits", "bytes", "bits", "octets".
  let letter = "";
  let binary = false;
  let bytes: boolean | null = null;
  const lower = word.toLowerCase();
  const wm = /^(kilo|mega|giga|tera|peta|exa|zetta|kibi|mebi|gibi|tebi|pebi|exbi|zebi)?(bytes?|bits?|octets?)$/.exec(lower);
  if (wm) {
    if (wm[1]) { letter = WORD_PREFIX[wm[1]].letter; binary = WORD_PREFIX[wm[1]].binary; }
    bytes = wm[2].startsWith("byte") || wm[2].startsWith("octet");
    if (wm[2].startsWith("octet")) notes.push("octets");
  } else {
    // Symbolic forms: [prefix][i](b|B|bit|bits|byte|bytes) or a bare prefix ("56k", "10K", "1.5M").
    const sm = /^([kKMGTPEZ])?(i)?(bits?|bytes?|b|B)?$/.exec(word);
    if (!sm) return null;
    if (!sm[1] && !sm[3] && rateSuffix !== "bps") return null; // a bare number is not a quantity
    letter = sm[1] ?? "";
    binary = sm[2] === "i";
    const u = sm[3] ?? "";
    if (u === "" ) {
      // "56k", "10K": bare prefix. As a rate ("56k", "56kbps") it is bits; as a size it is 1024-based bytes, as ls reads it.
      if (isRate || rateSuffix === "bps") bytes = false;
      else { bytes = true; binary = true; notes.push("bare-k-is-1024"); }
    } else if (u === "b" || u.startsWith("bit")) {
      bytes = false;
      // "Kb"/"kb"/"Mb" with a capital prefix and lower-case b: read as bits, flagged, since marketing uses both.
      if (u === "b" && letter && !binary) notes.push("ambiguous-kb");
    } else {
      bytes = true;
    }
    if (rateSuffix === "bps") { isRate = true; }
  }
  if (bytes === null) return null;
  if (expect === "size" && isRate) return null;
  if (expect === "rate") isRate = true;
  if (letter && !binary && bytes) notes.push("si-on-bytes");
  if (binary) notes.push("iec-binary");
  if (isRate) notes.push(bytes ? "bytes-per-second" : "bits-per-second");

  const unit = symbolFor(letter, binary, bytes);
  const mult = letter ? (binary ? PREFIX[letter].bin : PREFIX[letter].dec) : 1n;
  const bits = mulInt(value, mult * (bytes ? 8n : 1n));
  return { kind: isRate ? "rate" : "size", unit, value, bits, seconds: { num: 0n, scale: 0 }, notes, raw: text };
}

// ----------------------------------------------------------------------------
// The connection table
// ----------------------------------------------------------------------------

/** A standard link rate, with the source that states it. */
export interface Link {
  id: string;
  /** Nominal rate in bits per second. */
  bitsPerSecond: bigint;
  /** The source id in SOURCES. */
  source: string;
  /** True for the rows the 2004 and 2013 calculators carried. */
  lineage: boolean;
}

/** The connection table: the lineage rows, then the Ethernet speeds of IEEE 802.3-2022. */
export const LINKS: readonly Link[] = [
  { id: "v90-56k", bitsPerSecond: 56_000n, source: "itu-v90", lineage: true },
  { id: "isdn-b-64k", bitsPerSecond: 64_000n, source: "ntz-2004", lineage: true },
  { id: "t1", bitsPerSecond: 1_544_000n, source: "itu-g704", lineage: true },
  { id: "e1", bitsPerSecond: 2_048_000n, source: "itu-g704", lineage: false },
  { id: "eth-10m", bitsPerSecond: 10_000_000n, source: "ieee8023", lineage: true },
  { id: "eth-100m", bitsPerSecond: 100_000_000n, source: "ieee8023", lineage: true },
  { id: "eth-1g", bitsPerSecond: 1_000_000_000n, source: "ieee8023", lineage: false },
  { id: "eth-2_5g", bitsPerSecond: 2_500_000_000n, source: "ieee8023", lineage: false },
  { id: "eth-5g", bitsPerSecond: 5_000_000_000n, source: "ieee8023", lineage: false },
  { id: "eth-10g", bitsPerSecond: 10_000_000_000n, source: "ieee8023", lineage: false },
  { id: "eth-25g", bitsPerSecond: 25_000_000_000n, source: "ieee8023", lineage: false },
  { id: "eth-40g", bitsPerSecond: 40_000_000_000n, source: "ieee8023", lineage: false },
  { id: "eth-100g", bitsPerSecond: 100_000_000_000n, source: "ieee8023", lineage: false },
  { id: "eth-400g", bitsPerSecond: 400_000_000_000n, source: "ieee8023", lineage: false },
];

// ----------------------------------------------------------------------------
// Efficiency presets
// ----------------------------------------------------------------------------

/**
 * Protocol efficiency presets: payload bytes carried per bytes on the wire.
 * TCP over IPv4 over Ethernet with a 1500-byte MTU: 1500 - 20 (IPv4, RFC 791)
 * - 20 (TCP, RFC 9293) = 1460 payload octets per frame; on the wire the frame
 * is 1500 + 18 (header and FCS) = 1518, plus 8 (preamble) and 12 (gap) from
 * RFC 2544 Appendix C = 1538. 1460 / 1538 = 94.93 %. Over IPv6 the header is
 * 40 octets (RFC 8200 s8.3), so 1440; UDP's header is 8 octets (RFC 768), so
 * 1472 over IPv4.
 */
export const EFFICIENCY_PRESETS: readonly { id: string; payload: bigint; onWire: bigint }[] = [
  { id: "line-rate", payload: 1n, onWire: 1n },
  { id: "tcp-ipv4-ethernet-1500", payload: 1460n, onWire: 1538n },
  { id: "tcp-ipv6-ethernet-1500", payload: 1440n, onWire: 1538n },
  { id: "udp-ipv4-ethernet-1500", payload: 1472n, onWire: 1538n },
];

// ----------------------------------------------------------------------------
// The result
// ----------------------------------------------------------------------------

/** One row of a unit table. */
export interface UnitRow { unit: string; text: string; exact: boolean }

/** What the engine says about a size. */
export interface SizeView {
  bits: string;
  bytes: string;
  /** The value in every size unit. */
  table: UnitRow[];
  /** When the input used an SI prefix on bytes: the same label read the 1024 way, and the gap. */
  otherReading: { asBinaryText: string; asDecimalText: string; binaryUnit: string; decimalUnit: string; gapPercent: string } | null;
}

/** What the engine says about a rate. */
export interface RateView {
  bitsPerSecond: string;
  bytesPerSecond: string;
  /** The rate in every rate unit, per second. */
  table: UnitRow[];
  /** How much moves in a minute, an hour and a day, in a sensible byte unit. */
  per: { minute: string; hour: string; day: string };
}

/** A duration in parts, from an exact number of seconds. */
export interface Duration { days: number; hours: number; minutes: number; seconds: number; millis: number; totalSeconds: string }

/** What the engine says about a transfer. */
export interface TransferView {
  /** Which of the three was derived. */
  derived: "time" | "rate" | "size";
  time: Duration | null;
  rateBitsPerSecond: string | null;
  sizeBits: string | null;
  /** The derived rate or size, in every unit, when one was derived. */
  derivedRate: RateView | null;
  derivedSize: SizeView | null;
  /** The efficiency applied, as a percentage string, and its preset id if one. */
  efficiencyPercent: string;
  efficiencyPreset: string | null;
  /** Transfer time of the size over each standard link, at the same efficiency. */
  connections: { id: string; bitsPerSecond: string; time: Duration; lineage: boolean }[];
}

/** A quantity as the result carries it: every number already a string, so the result is JSON-safe. */
export interface QuantityView {
  kind: Kind;
  unit: string;
  raw: string;
  /** The value as written. */
  value: string;
  /** Exact bits (per second for a rate); "" for a time. */
  bits: string;
  /** Exact seconds; "" for a size or a rate. */
  seconds: string;
  notes: QuantityNote[];
}

/** Projects a parsed quantity onto its JSON-safe view. */
function viewOf(q: Quantity): QuantityView {
  return {
    kind: q.kind, unit: q.unit, raw: q.raw,
    value: formatDec(q.value, 9).text,
    bits: q.kind === "time" ? "" : formatDec(q.bits, 9).text,
    seconds: q.kind === "time" ? formatDec(q.seconds, 3).text : "",
    notes: q.notes,
  };
}

/** Error codes the component localises. */
export type ErrorCode = "empty" | "unreadable-size" | "unreadable-rate" | "unreadable-time" | "need-two" | "zero-rate" | "zero-time" | "efficiency-range";

export interface BitsBytesInput {
  size?: string;
  rate?: string;
  time?: string;
  /** Efficiency as a percentage (0 < e <= 100) or a preset id; absent means 100. */
  efficiency?: string;
}

export interface BitsBytesResult {
  ok: boolean;
  error: ErrorCode | null;
  size: QuantityView | null;
  rate: QuantityView | null;
  time: QuantityView | null;
  sizeView: SizeView | null;
  rateView: RateView | null;
  transfer: TransferView | null;
}

/** Breaks an exact number of seconds (num/den) into days, hours, minutes, seconds and milliseconds. */
function toDuration(num: bigint, den: bigint): Duration {
  if (den === 0n) return { days: 0, hours: 0, minutes: 0, seconds: 0, millis: 0, totalSeconds: "∞" };
  // Round to the millisecond, half-up.
  const ms = (num * 1000n * 2n + den) / (den * 2n);
  const millis = Number(ms % 1000n);
  let s = ms / 1000n;
  const seconds = Number(s % 60n); s /= 60n;
  const minutes = Number(s % 60n); s /= 60n;
  const hours = Number(s % 24n); s /= 24n;
  // totalSeconds keeps six decimals so a frame time (1.2304 ms) survives the print; the parts stop at the millisecond.
  return { days: Number(s), hours, minutes, seconds, millis, totalSeconds: formatRatio(num, den, 6).text };
}

/** An exact ratio as a decimal with up to `scale` fractional digits (rounded half-up). */
function decFromRatio(num: bigint, den: bigint, scale = 9): Dec {
  const q = (num * ten(scale) * 2n + den) / (den * 2n);
  return { num: q, scale };
}

/** A quantity built from bits (or seconds) the engine derived rather than read. */
function derivedQuantity(kind: Kind, unit: string, bits: Dec, seconds: Dec): Quantity {
  return { kind, unit, value: kind === "time" ? seconds : bits, bits, seconds, notes: [], raw: "" };
}

/** Picks the largest byte unit in which the value is at least 1, and formats. */
function bestByteUnit(bits: Dec): string {
  const order = ["TB", "GB", "MB", "kB", "B"];
  for (const u of order) {
    const r = formatRatio(bits.num, UNIT_BITS[u] * ten(bits.scale), 3);
    if (!r.text.startsWith("0") || u === "B") return `${r.text} ${u}`;
  }
  return "";
}

/** The size table and the two readings. */
function sizeView(q: Quantity): SizeView {
  const table = SIZE_UNITS.map((unit) => ({ unit, ...formatRatio(q.bits.num, UNIT_BITS[unit] * ten(q.bits.scale), 6) }));
  let otherReading: SizeView["otherReading"] = null;
  const m = /^([kKMGTPEZ])(i?)B$/.exec(q.unit);
  if (m) {
    const letter = m[1] === "K" ? "k" : m[1];
    const dec = PREFIX[letter].dec, bin = PREFIX[letter].bin;
    const decimalUnit = symbolFor(letter, false, true), binaryUnit = symbolFor(letter, true, true);
    // The same number of units, read the other way.
    const asBinaryBits: Dec = mulInt(q.value, bin * 8n);
    const asDecimalBits: Dec = mulInt(q.value, dec * 8n);
    // Gap: (bin - dec) / dec as a percentage, exact to two decimals.
    const gapPercent = formatRatio((bin - dec) * 100n, dec, 2).text;
    otherReading = {
      asBinaryText: `${formatDec(q.value).text} ${binaryUnit} = ${formatRatio(asBinaryBits.num, 8n * ten(asBinaryBits.scale), 0).text} B`,
      asDecimalText: `${formatDec(q.value).text} ${decimalUnit} = ${formatRatio(asDecimalBits.num, 8n * ten(asDecimalBits.scale), 0).text} B`,
      binaryUnit, decimalUnit, gapPercent,
    };
  }
  return {
    bits: formatRatio(q.bits.num, ten(q.bits.scale), 6).text,
    bytes: formatRatio(q.bits.num, 8n * ten(q.bits.scale), 6).text,
    table,
    otherReading,
  };
}

/** The rate table and the per-minute, per-hour, per-day figures. */
function rateView(q: Quantity): RateView {
  const table = RATE_UNITS.map((unit) => ({ unit, ...formatRatio(q.bits.num, UNIT_BITS[unit] * ten(q.bits.scale), 6) }));
  const per = (secs: bigint) => bestByteUnit({ num: q.bits.num * secs, scale: q.bits.scale });
  return {
    bitsPerSecond: formatRatio(q.bits.num, ten(q.bits.scale), 6).text,
    bytesPerSecond: formatRatio(q.bits.num, 8n * ten(q.bits.scale), 6).text,
    table,
    per: { minute: per(60n), hour: per(3600n), day: per(86_400n) },
  };
}

/**
 * run - the deterministic entry point.
 * Any one of size, rate or time is explained on its own; any two give the third.
 */
export function run(input: BitsBytesInput): BitsBytesResult {
  const empty = (error: ErrorCode | null): BitsBytesResult => ({ ok: false, error, size: null, rate: null, time: null, sizeView: null, rateView: null, transfer: null });
  const sizeText = (input.size ?? "").trim(), rateText = (input.rate ?? "").trim(), timeText = (input.time ?? "").trim();
  if (!sizeText && !rateText && !timeText) return empty("empty");

  const size = sizeText ? parseQuantity(sizeText, "size") : null;
  if (sizeText && !size) return empty("unreadable-size");
  const rate = rateText ? parseQuantity(rateText, "rate") : null;
  if (rateText && !rate) return empty("unreadable-rate");
  const time = timeText ? parseQuantity(timeText, "time") : null;
  if (timeText && !time) return empty("unreadable-time");

  // Efficiency: a preset id or a percentage.
  let effNum = 1n, effDen = 1n, effPreset: string | null = null;
  if (input.efficiency && input.efficiency.trim()) {
    const preset = EFFICIENCY_PRESETS.find((p) => p.id === input.efficiency!.trim());
    if (preset) { effNum = preset.payload; effDen = preset.onWire; effPreset = preset.id; }
    else {
      const pct = parseDec(input.efficiency.replace("%", ""));
      if (!pct || pct.num <= 0n || pct.num > 100n * ten(pct.scale)) return empty("efficiency-range");
      effNum = pct.num; effDen = 100n * ten(pct.scale);
    }
  }
  const efficiencyPercent = formatRatio(effNum * 100n, effDen, 2).text;

  const result: BitsBytesResult = {
    ok: true, error: null, size: size ? viewOf(size) : null, rate: rate ? viewOf(rate) : null, time: time ? viewOf(time) : null,
    sizeView: size ? sizeView(size) : null,
    rateView: rate ? rateView(rate) : null,
    transfer: null,
  };

  // Transfer: at least two of the three.
  const have = [size, rate, time].filter(Boolean).length;
  if (have >= 2) {
    // Payload bits moved per second = rate * efficiency.
    let derived: TransferView["derived"];
    let dur: Duration | null = null, rateBps: string | null = null, sizeBits: string | null = null;
    let derivedRate: RateView | null = null, derivedSize: SizeView | null = null;
    if (size && rate) {
      if (rate.bits.num === 0n) return empty("zero-rate");
      // time = sizeBits / (rateBits * eff) = (size.num / 10^ss) / ((rate.num / 10^rs) * effNum/effDen)
      const num = size.bits.num * ten(rate.bits.scale) * effDen;
      const den = rate.bits.num * ten(size.bits.scale) * effNum;
      dur = toDuration(num, den); derived = "time";
    } else if (size && time) {
      if (time.seconds.num === 0n) return empty("zero-time");
      // rate = sizeBits / (seconds * eff)
      const num = size.bits.num * ten(time.seconds.scale) * effDen;
      const den = time.seconds.num * ten(size.bits.scale) * effNum;
      rateBps = formatRatio(num, den, 3).text; derived = "rate";
      derivedRate = rateView(derivedQuantity("rate", "bit", decFromRatio(num, den), { num: 0n, scale: 0 }));
    } else {
      // size = rate * eff * seconds
      const num = rate!.bits.num * time!.seconds.num * effNum;
      const den = ten(rate!.bits.scale + time!.seconds.scale) * effDen;
      sizeBits = formatRatio(num, den, 3).text; derived = "size";
      derivedSize = sizeView(derivedQuantity("size", "bit", decFromRatio(num, den), { num: 0n, scale: 0 }));
    }
    // The connection table for a size: time over each standard link at the same efficiency.
    const sizeForLinks: Dec | null = size ? size.bits : derivedSize ? decFromRatio(rate!.bits.num * time!.seconds.num * effNum, ten(rate!.bits.scale + time!.seconds.scale) * effDen) : null;
    const connections = sizeForLinks
      ? LINKS.map((l) => ({ id: l.id, bitsPerSecond: formatRatio(l.bitsPerSecond, 1n, 0).text, lineage: l.lineage, time: toDuration(sizeForLinks.num * effDen, l.bitsPerSecond * ten(sizeForLinks.scale) * effNum) }))
      : [];
    result.transfer = { derived, time: dur, rateBitsPerSecond: rateBps, sizeBits, derivedRate, derivedSize, efficiencyPercent, efficiencyPreset: effPreset, connections };
  } else if (size) {
    // A size alone still gets the connection table at line rate (or the chosen efficiency).
    result.transfer = {
      derived: "time", time: null, rateBitsPerSecond: null, sizeBits: null, derivedRate: null, derivedSize: null, efficiencyPercent, efficiencyPreset: effPreset,
      connections: LINKS.map((l) => ({ id: l.id, bitsPerSecond: formatRatio(l.bitsPerSecond, 1n, 0).text, lineage: l.lineage, time: toDuration(size.bits.num * effDen, l.bitsPerSecond * ten(size.bits.scale) * effNum) })),
    };
  }
  return result;
}
