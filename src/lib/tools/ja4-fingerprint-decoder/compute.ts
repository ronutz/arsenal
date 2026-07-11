// ============================================================================
// src/lib/tools/ja4-fingerprint-decoder/compute.ts
// ----------------------------------------------------------------------------
// JA4 TLS CLIENT FINGERPRINT DECODER - decode a JA4 fingerprint (the human-
// readable a_b_c form) into its fields, or compute the hashed JA4 from a raw,
// unhashed fingerprint (JA4_r / JA4_ro). Everything here is deterministic and
// offline: it computes what it can show and never guesses.
//
// SCOPE & LICENSING (deliberate): this implements JA4 (TLS Client
// Fingerprinting) only, which FoxIO releases under the permissive BSD 3-Clause
// license - the same terms as JA3 - so it is free to implement, including
// commercially. The other JA4+ methods (JA4S/H/X/T/SSH/L) are under the FoxIO
// License 1.1, which does not permit monetization, so they are intentionally
// NOT implemented here. JA3 (also BSD 3-Clause) is now largely deprecated -
// modern browsers randomize TLS extension order to defeat it - so it is covered
// in the companion Learn article rather than as a compute mode.
//
// Algorithm source (verified byte-exact against the spec's own vectors):
//   FoxIO-LLC/ja4, technical_details/JA4.md
//   https://github.com/FoxIO-LLC/ja4/blob/main/technical_details/JA4.md
// ============================================================================

import { hashString } from "@/lib/tools/hash-preimage-finder/compute";

// ---- GREASE ---------------------------------------------------------------
// draft-davidben-tls-grease reserved values; ignored everywhere in JA4.
const GREASE = new Set<number>([
  0x0a0a, 0x1a1a, 0x2a2a, 0x3a3a, 0x4a4a, 0x5a5a, 0x6a6a, 0x7a7a,
  0x8a8a, 0x9a9a, 0xaaaa, 0xbaba, 0xcaca, 0xdada, 0xeaea, 0xfafa,
]);
function isGrease(hex4: string): boolean {
  return GREASE.has(parseInt(hex4, 16));
}

// ---- Field maps (JA4_a) ---------------------------------------------------
/** First character of JA4_a: the transport the ClientHello rode in on. */
export const PROTOCOLS: Record<string, string> = {
  t: "TLS over TCP",
  q: "QUIC (HTTP/3)",
  d: "DTLS",
};
/** Characters 2-3 of JA4_a: TLS/DTLS version (from supported_versions if present). */
export const TLS_VERSIONS: Record<string, string> = {
  "13": "TLS 1.3",
  "12": "TLS 1.2",
  "11": "TLS 1.1",
  "10": "TLS 1.0",
  s3: "SSL 3.0",
  s2: "SSL 2.0",
  d1: "DTLS 1.0",
  d2: "DTLS 1.2",
  d3: "DTLS 1.3",
  "00": "Unknown",
};
/** Common two-character ALPN markers (first+last char of the first ALPN value).
 *  The two-character form is lossy, so labels are best-effort for common ALPNs. */
export const ALPN_LABELS: Record<string, string> = {
  "00": "No ALPN offered",
  h1: "HTTP/1.1",
  h2: "HTTP/2",
  h3: "HTTP/3",
  dt: "DNS-over-TLS",
  hq: "HTTP/3 over QUIC (hq)",
  sp: "SPDY",
};

export interface Ja4Part {
  code: string;
  label: string;
}
export type Ja4Mode = "decoded" | "computed";

export interface Ja4Result {
  ok: boolean;
  input: string;
  /** "decoded" when a hashed JA4 was read; "computed" when hashes were derived
   *  from a raw JA4_r/JA4_ro input. */
  mode?: Ja4Mode;
  /** The canonical hashed fingerprint (echoed when decoding, assembled when
   *  computing from raw). */
  fingerprint?: string;
  ja4a?: string;
  protocol?: Ja4Part;
  tlsVersion?: Ja4Part;
  sni?: Ja4Part;
  cipherCount?: number;
  extensionCount?: number;
  alpn?: Ja4Part;
  /** JA4_b - truncated SHA-256 of the sorted cipher list (one-way). */
  cipherHash?: string;
  /** JA4_c - truncated SHA-256 of the sorted extension list + signature algs. */
  extensionHash?: string;
  notes?: string[];
  error?: { message: string };
}

// ---- Hash helpers (the deterministic, verifiable core) --------------------
/** Parse a comma-separated hex list into lowercase 4-char codes, dropping blanks. */
function parseHexList(csv: string): string[] {
  return csv
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter((x) => x.length > 0)
    .map((x) => x.replace(/^0x/, "").padStart(4, "0"));
}

/**
 * JA4_b: truncated (first 12) lowercase SHA-256 of the cipher list, GREASE
 * removed, sorted in hex order. Empty list -> the spec's 000000000000 sentinel.
 */
export function computeCipherHash(csv: string): string {
  const kept = parseHexList(csv).filter((h) => !isGrease(h));
  if (kept.length === 0) return "000000000000";
  kept.sort(); // 4-char lowercase hex lexical sort == hex-value sort
  return hashString("sha256", kept.join(",")).slice(0, 12);
}

/**
 * JA4_c: truncated (first 12) lowercase SHA-256 of the extension list - GREASE,
 * SNI (0000) and ALPN (0010) removed, sorted - then, if any signature
 * algorithms are present, an underscore and the sig-alg list in ORIGINAL order.
 * Empty extension list -> the spec's 000000000000 sentinel.
 */
export function computeExtensionHash(extCsv: string, sigAlgCsv: string): string {
  const kept = parseHexList(extCsv).filter(
    (h) => !isGrease(h) && h !== "0000" && h !== "0010",
  );
  if (kept.length === 0) return "000000000000";
  kept.sort();
  const sigAlgs = parseHexList(sigAlgCsv).filter((h) => !isGrease(h));
  const str = sigAlgs.length ? `${kept.join(",")}_${sigAlgs.join(",")}` : kept.join(",");
  return hashString("sha256", str).slice(0, 12);
}

// ---- ALPN character rendering (spec edge cases) ---------------------------
function isAlnumByte(b: number): boolean {
  return (b >= 0x30 && b <= 0x39) || (b >= 0x41 && b <= 0x5a) || (b >= 0x61 && b <= 0x7a);
}
/**
 * The JA4_a ALPN marker: first and last ASCII-alphanumeric characters of the
 * first ALPN value. If either end is non-alphanumeric, the hex of that byte is
 * used instead (per the spec's byte-rendering rules). "00" if there is no ALPN.
 */
export function alpnMarker(firstAlpn: string): string {
  if (!firstAlpn) return "00";
  const bytes = Array.from(firstAlpn, (c) => c.charCodeAt(0) & 0xff);
  if (bytes.length === 1) {
    const b = bytes[0];
    return isAlnumByte(b) ? firstAlpn + firstAlpn : b.toString(16).padStart(2, "0");
  }
  const first = bytes[0];
  const last = bytes[bytes.length - 1];
  const fc = isAlnumByte(first) ? String.fromCharCode(first) : first.toString(16).padStart(2, "0")[0];
  const lc = isAlnumByte(last) ? String.fromCharCode(last) : last.toString(16).padStart(2, "0")[1];
  return fc + lc;
}

// ---- Decode a hashed JA4_a into its parts ---------------------------------
function decodeJa4a(a: string, notes: string[]): Partial<Ja4Result> {
  const out: Partial<Ja4Result> = { ja4a: a };
  const proto = a[0];
  out.protocol = { code: proto, label: PROTOCOLS[proto] ?? "Unknown transport" };
  const ver = a.slice(1, 3);
  out.tlsVersion = { code: ver, label: TLS_VERSIONS[ver] ?? "Unknown version" };
  const sni = a[3];
  out.sni = {
    code: sni,
    label: sni === "d" ? "SNI present (destination is a domain)" : sni === "i" ? "No SNI (destination is an IP)" : "Unknown SNI marker",
  };
  const cc = a.slice(4, 6);
  const ec = a.slice(6, 8);
  out.cipherCount = Number(cc);
  out.extensionCount = Number(ec);
  if (cc === "99") notes.push("Cipher count is capped at 99 by the spec.");
  const alpn = a.slice(8, 10);
  out.alpn = { code: alpn, label: ALPN_LABELS[alpn] ?? `ALPN marker "${alpn}" (first+last character of the first ALPN value)` };
  return out;
}

const HEX12 = /^[0-9a-f]{12}$/;
const JA4A = /^[tqd][a-z0-9]{2}[di]\d{2}\d{2}..$/;

/**
 * Decode a hashed JA4 (a_b_c), or compute the canonical hashed JA4 from a raw
 * fingerprint. Raw input is detected by comma-bearing sections (JA4_r / JA4_ro):
 *   a_<ciphers>_<extensions>[_<sig-algs>]
 * The compute path filters GREASE, removes SNI/ALPN from extensions, sorts, and
 * hashes - so it yields the same canonical JA4 whether given sorted (-r) or
 * original-order (-o) raw values.
 */
export function decodeJa4(raw: string): Ja4Result {
  const input = raw.trim();
  if (!input) return { ok: false, input, error: { message: "Enter a JA4 fingerprint or a raw JA4_r value." } };

  const parts = input.split("_");
  const notes: string[] = [];
  const a = parts[0];
  if (!a || a.length !== 10) {
    return { ok: false, input, error: { message: "The JA4_a section (before the first underscore) must be exactly 10 characters, e.g. t13d1516h2." } };
  }

  const looksRaw = parts.slice(1).some((p) => p.includes(",")) || parts.length > 3;
  if (looksRaw) {
    // ---- compute mode: derive JA4_b / JA4_c from raw lists ----
    const ciphers = parts[1] ?? "";
    const exts = parts[2] ?? "";
    const sigAlgs = parts[3] ?? "";
    const cipherHash = computeCipherHash(ciphers);
    const extensionHash = computeExtensionHash(exts, sigAlgs);
    const decoded = decodeJa4a(a, notes);
    notes.push("Computed from raw (unhashed) values. GREASE was ignored; ciphers and extensions were sorted; SNI and ALPN were removed from the extension hash.");
    return {
      ok: true,
      input,
      mode: "computed",
      fingerprint: `${a}_${cipherHash}_${extensionHash}`,
      ...decoded,
      cipherHash,
      extensionHash,
      notes,
    };
  }

  // ---- decode mode: a hashed a_b_c fingerprint ----
  if (parts.length !== 3) {
    return { ok: false, input, error: { message: "A hashed JA4 has three underscore-separated sections: JA4_a_JA4_b_JA4_c." } };
  }
  const [, b, c] = parts;
  if (!HEX12.test(b) || !HEX12.test(c)) {
    return { ok: false, input, error: { message: "JA4_b and JA4_c must each be 12 lowercase hex characters (a truncated SHA-256). If you have the raw cipher and extension lists, paste those instead to compute them." } };
  }
  if (!JA4A.test(a)) {
    notes.push("JA4_a does not match the usual shape (transport, 2-char version, d/i, 2-digit counts, ALPN); decoding it positionally anyway.");
  }
  const decoded = decodeJa4a(a, notes);
  notes.push("JA4_b and JA4_c are truncated SHA-256 hashes and cannot be reversed to recover the cipher or extension lists.");
  return {
    ok: true,
    input,
    mode: "decoded",
    fingerprint: input,
    ...decoded,
    cipherHash: b,
    extensionHash: c,
    notes,
  };
}

// ============================================================================
// JA3 (the predecessor) - BSD 3-Clause, like JA4. JA3 concatenates five decimal
// fields from the ClientHello (SSLVersion,Ciphers,Extensions,EllipticCurves,
// EllipticCurvePointFormats), joins values with "-" and fields with ",", and
// takes the MD5. It is largely deprecated - modern browsers randomize extension
// order, which JA3 hashes in place, so a JA3 changes on every connection - but
// it is still seen in older tooling and threat feeds.
//   Source: salesforce/ja3 (README), verified byte-exact against its examples.
// ============================================================================

/** JA3 SSLVersion field is the decimal TLS version from the ClientHello. */
export const JA3_SSL_VERSIONS: Record<string, string> = {
  "768": "SSL 3.0",
  "769": "TLS 1.0",
  "770": "TLS 1.1",
  "771": "TLS 1.2",
  "772": "TLS 1.3",
};

export interface Ja3Result {
  ok: boolean;
  input: string;
  /** The MD5 hash (the JA3 fingerprint). */
  hash?: string;
  /** True when the input was a bare 32-char MD5, which cannot be decoded. */
  opaque?: boolean;
  ja3String?: string;
  sslVersion?: Ja4Part;
  cipherCount?: number;
  extensionCount?: number;
  curveCount?: number;
  pointFormatCount?: number;
  notes?: string[];
  error?: { message: string };
}

/**
 * Compute a JA3 from its string form, or recognize a bare JA3 MD5. The MD5 is
 * taken over the exact five-field string, matching the JA3 specification and its
 * published vectors; GREASE is expected to be excluded already (the JA3-producing
 * code removes it before building the string).
 */
export function computeJa3(input: string): Ja3Result {
  const s = input.trim();
  if (!s) return { ok: false, input: s, error: { message: "Enter a JA3 string or a JA3 MD5." } };
  if (/^[0-9a-f]{32}$/i.test(s)) {
    return {
      ok: true,
      input: s,
      hash: s.toLowerCase(),
      opaque: true,
      notes: [
        "This is a 32-character MD5, the JA3 hash itself. It is one-way and cannot be decoded back to the ClientHello fields. Paste the JA3 string (the comma-separated field list) to see the fields and recompute the hash.",
      ],
    };
  }
  const fields = s.split(",");
  if (fields.length !== 5) {
    return { ok: false, input: s, error: { message: "A JA3 string has five comma-separated fields: SSLVersion,Ciphers,Extensions,EllipticCurves,EllipticCurvePointFormats." } };
  }
  const [ver, ciphers, exts, curves, formats] = fields;
  const count = (f: string) => (f.trim() === "" ? 0 : f.split("-").filter((x) => x.trim() !== "").length);
  const notes: string[] = [];
  if (!(ver in JA3_SSL_VERSIONS)) notes.push(`SSLVersion ${ver} is not one of the common values; showing it as-is.`);
  notes.push("The JA3 fingerprint is the MD5 of this exact string. GREASE values should already be excluded, per the JA3 specification.");
  return {
    ok: true,
    input: s,
    ja3String: s,
    hash: hashString("md5", s),
    sslVersion: { code: ver, label: JA3_SSL_VERSIONS[ver] ?? "Unknown version" },
    cipherCount: count(ciphers),
    extensionCount: count(exts),
    curveCount: count(curves),
    pointFormatCount: count(formats),
    notes,
  };
}

// ---- Auto-dispatch between JA4 and JA3 ------------------------------------
/** A JA4 always contains underscores; a JA3 is decimal fields, or a bare MD5. */
function isLikelyJa3(s: string): boolean {
  if (s.includes("_")) return false;
  if (/^[0-9a-f]{32}$/i.test(s)) return true;
  return /^\d{2,5},/.test(s);
}

export type AnalyzeResult =
  | { kind: "ja4"; ja4: Ja4Result }
  | { kind: "ja3"; ja3: Ja3Result };

/** Detect whether the input is a JA4 or a JA3 and analyze it accordingly. */
export function analyze(input: string): AnalyzeResult {
  const s = input.trim();
  return isLikelyJa3(s) ? { kind: "ja3", ja3: computeJa3(s) } : { kind: "ja4", ja4: decodeJa4(s) };
}

/** D-49 run entrypoint (API parity): auto-detects JA4 vs JA3. */
export function run(input: string): AnalyzeResult {
  return analyze(input);
}
