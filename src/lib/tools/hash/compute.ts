// ============================================================================
// src/lib/tools/hash/compute.ts
// ----------------------------------------------------------------------------
// CRYPTOGRAPHIC HASHES - the compute core for the Hash tool.
//
// Uses the platform Web Crypto API (crypto.subtle.digest) rather than a shipped
// JS implementation: it is audited, constant-folded into native code, and
// available in both the browser and modern Node. Because digest() returns a
// Promise, run()/hashAll() are ASYNC here (the one place a tool diverges from
// the sync CIDR/JWT/base64 cores). The digests are still deterministic, so a
// single golden-vector set covers the transform; the runner just awaits.
//
// hashAll() computes SHA-1/256/384/512 in parallel and returns each as hex and
// base64; the UI shows whichever the user selects, so switching algorithms
// never recomputes. Input is hashed as its UTF-8 bytes.
//
// FILES (2026-10-26). The second half of this file adds the pure part of file
// hashing: the digests of raw bytes (hashBytes), the size limit and its
// decision (FILE_HASH_MAX_BYTES, decideFileSize), reading one Blob within that
// limit (hashBlob), a byte-size description for display (describeByteSize) and
// the VirusTotal file-report link for a SHA-256 (virusTotalFileReportUrl). The
// text path above is unchanged. Why a limit at all: Web Crypto's digest() takes
// the whole message as one BufferSource and starts by "getting a copy of the
// bytes held by the data parameter" (W3C Web Cryptography Level 2, 14.3.5);
// there is no streaming form, so the file's bytes must all be in memory, and
// each call holds a second copy while it runs. The limit is explained where it
// is declared.
// ============================================================================

/** The digest algorithms this tool computes (also the UI toggle order). */
export type HashAlgorithm = "SHA-256" | "SHA-384" | "SHA-512" | "SHA-1";

/** Order matters: index 0 is the default selection (SHA-256); SHA-1 is last. */
export const HASH_ALGORITHMS: readonly HashAlgorithm[] = [
  "SHA-256",
  "SHA-384",
  "SHA-512",
  "SHA-1",
];

/** One digest rendered two ways. */
export interface HashDigest {
  hex: string;
  base64: string;
}

/** The deterministic result: every algorithm's digest of the input. */
export interface HashResult {
  input: string;
  digests: Record<HashAlgorithm, HashDigest>;
}

/** Lowercase hex of a byte array. */
function bytesToHex(bytes: Uint8Array): string {
  let hex = "";
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, "0");
  return hex;
}

/** Standard base64 of a byte array (digests are short, so a single pass is ok). */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/** Digest one algorithm over the given bytes, rendered hex + base64. */
async function digestOne(algorithm: HashAlgorithm, data: BufferSource): Promise<HashDigest> {
  const buffer = await crypto.subtle.digest(algorithm, data);
  const bytes = new Uint8Array(buffer);
  return { hex: bytesToHex(bytes), base64: bytesToBase64(bytes) };
}

/**
 * hashAll - the deterministic (async) entry point. Hashes the input's UTF-8
 * bytes with every supported algorithm, in parallel.
 * @param input arbitrary text to hash
 */
export async function hashAll(input: string): Promise<HashResult> {
  const value = input ?? "";
  const data = new TextEncoder().encode(value);
  const pairs = await Promise.all(
    HASH_ALGORITHMS.map(async (algorithm) => {
      const digest = await digestOne(algorithm, data);
      return [algorithm, digest] as const;
    })
  );
  const digests = Object.fromEntries(pairs) as Record<HashAlgorithm, HashDigest>;
  return { input: value, digests };
}

// ============================================================================
// FILE HASHING (2026-10-26)
// ----------------------------------------------------------------------------
// Everything below is pure apart from Web Crypto itself and the one Blob read
// in hashBlob(); it runs the same in a browser and in Node 22, so the golden
// vectors exercise it directly. The component only gathers the File from an
// <input type="file"> or a drop and renders what these functions return.
// ============================================================================

/**
 * The largest file the tool hashes: 256 MiB (268,435,456 bytes).
 *
 * WHY THIS NUMBER. The platform sets no size limit of its own, so the limit is
 * a design choice, made from what the specifications require:
 *   - Blob.arrayBuffer() reads every byte of the file into one new ArrayBuffer
 *     (W3C File API, 3.3.4: "reading all bytes from stream"), so the whole file
 *     is in memory before any hashing starts;
 *   - digest() begins by copying the bytes it is given (Web Cryptography Level
 *     2, 14.3.5), so while a digest runs the page holds the file twice;
 *   - digest() has no progress report and cannot be cancelled once started.
 * hashBytes() therefore runs the four algorithms one after another, never side
 * by side, so the peak is about twice the file (about 512 MiB at the limit)
 * instead of five times. 256 MiB is a conservative choice, not a platform
 * figure: it keeps that peak near half a gibibyte. A larger file is refused
 * before a single byte is read, with a message naming the operating system's
 * own commands instead (sha256sum on Linux, Get-FileHash in PowerShell).
 */
export const FILE_HASH_MAX_BYTES = 256 * 1024 * 1024;

/** The outcome of checking a reported file size against the limit. */
export type FileSizeDecision =
  // Within the limit: the file may be read.
  | { ok: true; size: number }
  // Larger than the limit: refused before reading.
  | { ok: false; reason: "too-large"; size: number; limit: number }
  // Not a byte count at all (negative, fractional, NaN or beyond 2^53 - 1): refused.
  | { ok: false; reason: "invalid-size"; size: number };

/**
 * decideFileSize - may a file of this reported size be hashed?
 * Blob.size is an unsigned long long (File API 3.2), so anything that is not a
 * non-negative safe integer did not come from a real Blob and is refused.
 * @param size the size the browser reports, in bytes
 * @param limit the largest size accepted (defaults to FILE_HASH_MAX_BYTES)
 */
export function decideFileSize(size: number, limit: number = FILE_HASH_MAX_BYTES): FileSizeDecision {
  // A byte count is a whole, non-negative number the engine can represent exactly.
  if (!Number.isSafeInteger(size) || size < 0) return { ok: false, reason: "invalid-size", size };
  // The limit itself is accepted; one byte more is not.
  if (size > limit) return { ok: false, reason: "too-large", size, limit };
  // Within the limit (the empty file included).
  return { ok: true, size };
}

/** The digests of a byte sequence, with the number of bytes they cover. */
export interface BytesHashResult {
  /** How many bytes were hashed. */
  byteLength: number;
  /** Every algorithm's digest of those bytes, hex and base64. */
  digests: Record<HashAlgorithm, HashDigest>;
}

/** Called before each algorithm runs: which one, its 0-based position, and how many there are. */
export type HashStepListener = (algorithm: HashAlgorithm, index: number, total: number) => void;

/**
 * hashBytes - every supported digest of raw bytes (no text encoding involved).
 * The algorithms run ONE AFTER ANOTHER, in HASH_ALGORITHMS order, because each
 * digest() call copies its input: running them side by side would hold up to
 * four copies of a large file at once (see FILE_HASH_MAX_BYTES).
 * @param bytes the bytes to hash, exactly as read (backed by an ordinary ArrayBuffer, as Web Crypto's BufferSource requires)
 * @param onStep optional listener told which algorithm is about to run
 */
export async function hashBytes(bytes: Uint8Array<ArrayBuffer>, onStep?: HashStepListener): Promise<BytesHashResult> {
  // Filled in algorithm order.
  const digests = {} as Record<HashAlgorithm, HashDigest>;
  // One at a time, so at most one copy of the bytes is held by Web Crypto.
  for (let i = 0; i < HASH_ALGORITHMS.length; i++) {
    // The algorithm for this step.
    const algorithm = HASH_ALGORITHMS[i];
    // Tell the caller (the UI shows "SHA-384, 2 of 4").
    if (onStep) onStep(algorithm, i, HASH_ALGORITHMS.length);
    // The same digest-and-format helper the text path uses.
    digests[algorithm] = await digestOne(algorithm, bytes);
  }
  // The byte count travels with the digests so the UI can show what was covered.
  return { byteLength: bytes.byteLength, digests };
}

/**
 * The part of a W3C File API Blob (a File is a Blob with a name) that
 * hashBlob() uses. A real File satisfies it; the vectors also pass small
 * stand-ins to test the refusal and failure paths without huge allocations.
 */
export interface ReadableBlob {
  /** The size the browser reports, in bytes (File API 3.2). */
  readonly size: number;
  /** Reads every byte into one ArrayBuffer (File API 3.3.4). */
  arrayBuffer(): Promise<ArrayBuffer>;
}

/** The outcome of hashing one Blob. */
export type BlobHashOutcome =
  // Hashed: the digests of every byte read.
  | { ok: true; result: BytesHashResult }
  // Refused before reading: larger than the limit.
  | { ok: false; reason: "too-large"; size: number; limit: number }
  // Refused before reading: the reported size is not a byte count.
  | { ok: false; reason: "invalid-size"; size: number }
  // The read itself failed; errorName is the DOMException name (NotFoundError, NotReadableError, SecurityError...).
  | { ok: false; reason: "read-failed"; errorName: string }
  // The read returned a different number of bytes from the size reported before it: the file changed meanwhile.
  | { ok: false; reason: "size-mismatch"; size: number; read: number }
  // The bytes were read but hashing them failed (no Web Crypto in this context, or an unusable buffer).
  | { ok: false; reason: "hash-failed"; errorName: string };

/** The name of a thrown value: a DOMException's or Error's name, or "Error" for anything else. */
function errorNameOf(e: unknown): string {
  // DOMException and Error both carry a string name.
  if (e && typeof e === "object" && "name" in e && typeof (e as { name: unknown }).name === "string") return (e as { name: string }).name;
  // Anything else thrown.
  return "Error";
}

/** Options for hashBlob. */
export interface HashBlobOptions {
  /** The largest size accepted; defaults to FILE_HASH_MAX_BYTES. */
  limit?: number;
  /** Told which algorithm is about to run (see hashBytes). */
  onStep?: HashStepListener;
}

/**
 * hashBlob - check the size, read the bytes, hash them.
 * The size check comes FIRST, so a file over the limit is refused without a
 * single byte being read. Never throws: every failure, of the read or of the
 * hashing, is returned as an outcome.
 * @param blob the File (or any Blob) to hash
 * @param options the limit and the step listener
 */
export async function hashBlob(blob: ReadableBlob, options: HashBlobOptions = {}): Promise<BlobHashOutcome> {
  // The size the browser reports, checked before anything is read.
  const decision = decideFileSize(blob.size, options.limit ?? FILE_HASH_MAX_BYTES);
  // Refused: hand the decision back as the outcome (same fields).
  if (!decision.ok) return decision;
  // The bytes, read locally by the browser; nothing is sent anywhere.
  let buffer: ArrayBuffer;
  try {
    // One read of the whole file (File API 3.3.4).
    buffer = await blob.arrayBuffer();
  } catch (e) {
    // A DOMException carries a name (NotFoundError, NotReadableError, SecurityError); reported, never thrown.
    return { ok: false, reason: "read-failed", errorName: errorNameOf(e) };
  }
  // A read that disagrees with the size reported a moment earlier means the file changed while it was read.
  if (buffer.byteLength !== decision.size) return { ok: false, reason: "size-mismatch", size: decision.size, read: buffer.byteLength };
  try {
    // Hash every byte, one algorithm at a time.
    const result = await hashBytes(new Uint8Array(buffer), options.onStep);
    // Done.
    return { ok: true, result };
  } catch (e) {
    // Web Crypto missing (crypto.subtle exists only in secure contexts) or a buffer it cannot use: reported, never thrown.
    return { ok: false, reason: "hash-failed", errorName: errorNameOf(e) };
  }
}

/** The binary (IEC) units a size is shown in; each is 1,024 of the one before. */
export type ByteUnit = "B" | "KiB" | "MiB" | "GiB" | "TiB";

/** The units in order of size. */
const BYTE_UNITS: readonly ByteUnit[] = ["B", "KiB", "MiB", "GiB", "TiB"];

/** A byte count described in the largest fitting IEC unit, rounded to one decimal place. */
export interface ByteSize {
  /** The exact count. */
  bytes: number;
  /** The unit chosen. */
  unit: ByteUnit;
  /** The count in that unit, rounded to one decimal place (whole bytes stay whole). */
  value: number;
}

/**
 * describeByteSize - a byte count in the largest IEC unit whose rounded value
 * is at least 1 and below 1,024 (TiB is the last unit). Rounding happens
 * before the unit is settled, so 1,048,575 bytes reads as "1 MiB", never as
 * "1024 KiB". Returns null for anything that is not a byte count.
 * @param bytes the exact count
 */
export function describeByteSize(bytes: number): ByteSize | null {
  // Only real byte counts are described.
  if (!Number.isSafeInteger(bytes) || bytes < 0) return null;
  // Under one KiB: whole bytes, no rounding.
  if (bytes < 1024) return { bytes, unit: "B", value: bytes };
  // The power of 1,024 that fits, capped at the last unit.
  let k = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), BYTE_UNITS.length - 1);
  // Floating-point logs can land one step high at exact powers' neighbours: step back while the unit is too big.
  while (k > 1 && bytes < Math.pow(1024, k)) k--;
  // The value in that unit, rounded to one decimal place.
  let value = Math.round((bytes / Math.pow(1024, k)) * 10) / 10;
  // Rounding up to 1,024 means the next unit reads better ("1 MiB", not "1024 KiB").
  if (value >= 1024 && k < BYTE_UNITS.length - 1) {
    // One unit up.
    k++;
    // Recomputed in the new unit.
    value = Math.round((bytes / Math.pow(1024, k)) * 10) / 10;
  }
  // The description.
  return { bytes, unit: BYTE_UNITS[k], value };
}

/**
 * VirusTotal's documented form for linking to the most recent report on a
 * file: https://www.virustotal.com/gui/file/<resource>/detection, where the
 * resource may be the file's MD5, SHA-1 or SHA-256 (VirusTotal, "How can I
 * link to the most recent report on a given file or URL?", docs.virustotal.com,
 * read 2026-10-26 and again 2026-10-27, same form). This tool builds it from
 * the SHA-256 only.
 */
export const VIRUSTOTAL_FILE_REPORT_PREFIX = "https://www.virustotal.com/gui/file/";

/** The path segment VirusTotal's documented link ends with. */
export const VIRUSTOTAL_FILE_REPORT_SUFFIX = "/detection";

/**
 * virusTotalFileReportUrl - the VirusTotal report link for a SHA-256 digest,
 * or null when the value is not one. The value is trimmed and lower-cased,
 * then must be exactly 64 hexadecimal characters, so nothing but a SHA-256
 * can ever be placed in the URL (a 40-character SHA-1 is refused here even
 * though VirusTotal would accept it: the tool links the SHA-256 only).
 * Building the URL sends nothing: the reader decides whether to follow it.
 * @param sha256Hex the SHA-256 digest as hexadecimal
 */
export function virusTotalFileReportUrl(sha256Hex: string): string | null {
  // Tolerate surrounding space and upper case; the tool itself always passes lower-case hex.
  const value = (sha256Hex ?? "").trim().toLowerCase();
  // Exactly 64 hexadecimal characters: a SHA-256 and nothing else.
  if (!/^[0-9a-f]{64}$/.test(value)) return null;
  // The documented form, with the digest as the resource.
  return `${VIRUSTOTAL_FILE_REPORT_PREFIX}${value}${VIRUSTOTAL_FILE_REPORT_SUFFIX}`;
}

// ============================================================================
// COMPARE WITH AN EXPECTED HASH (2026-10-27, PRIME: "Yes on the offers: a
// “compare with expected hash” box in the hash tool")
// ----------------------------------------------------------------------------
// The reader pastes the hash a download page publishes; the tool says whether
// it equals one of the four digests already computed (of the text or of the
// file), and in which algorithm and encoding. Pure and synchronous: it only
// compares strings the page already holds, so nothing is hashed again and
// nothing leaves the browser.
//
// WHAT IS ACCEPTED, and why each form (each is how the value is commonly
// published or printed):
//   - bare hex, either case (sha256sum, Get-FileHash, most download pages);
//   - hex with spaces or colons between byte pairs (fingerprints as printed by
//     openssl x509 -fingerprint and many vendor pages);
//   - a coreutils line, "<hex>  <name>" or "<hex> *<name>" (GNU coreutils
//     9.12, cksum output modes, the untagged format: the checksum, a space, a
//     space for text mode or an asterisk for binary, the file name; a leading
//     backslash when the name had to be escaped);
//   - a tagged line, "SHA256 (<name>) = <hex>" (the same page's tagged format,
//     "digest_name (file name) = digest", printed by sha256sum --tag and cksum);
//   - a label before the value, "sha256:<hex>" (OCI image digests, PyPI and
//     npm lock files use this form) or "sha256-<base64>" (Subresource
//     Integrity, W3C SRI section 3.5: hash-algorithm "-" base64-value);
//   - base64, standard or URL-safe, padded or not (SRI, npm "integrity").
// A label names the algorithm: then only that algorithm is compared, so a
// value labelled SHA-512 never "matches" a SHA-256 by accident.
// ============================================================================

/** The outcome of comparing a pasted value with the four digests. */
export type HashComparison =
  // Nothing pasted (only whitespace).
  | { kind: "empty" }
  // Neither hex nor base64 once the accepted wrappers are removed.
  | { kind: "malformed" }
  // Equal to one digest: which algorithm, in which encoding, and the label if there was one.
  | { kind: "match"; algorithm: HashAlgorithm; encoding: "hex" | "base64"; label: HashAlgorithm | null }
  // Equal to none: the algorithm whose digest has this length (if any), and the label if there was one.
  | { kind: "no-match"; sameLengthAs: HashAlgorithm | null; encoding: "hex" | "base64"; label: HashAlgorithm | null };

/** The algorithm a label names ("sha256", "SHA-256", "sha2-256" are not all accepted: only sha1/256/384/512 with or without a hyphen). */
function labelAlgorithm(label: string): HashAlgorithm | null {
  // The digits after "sha", with an optional hyphen.
  const m = /^sha-?(1|256|384|512)$/i.exec(label);
  // Not one of the four.
  if (!m) return null;
  // The canonical name.
  return (m[1] === "1" ? "SHA-1" : `SHA-${m[1]}`) as HashAlgorithm;
}

/** The hex length (characters) of each algorithm's digest: 160, 256, 384 and 512 bits. */
const HEX_LENGTH: Record<HashAlgorithm, number> = { "SHA-1": 40, "SHA-256": 64, "SHA-384": 96, "SHA-512": 128 };

/** The padded base64 length of each digest: 4 * ceil(bytes / 3). */
const BASE64_LENGTH: Record<HashAlgorithm, number> = { "SHA-1": 28, "SHA-256": 44, "SHA-384": 64, "SHA-512": 88 };

/**
 * compareWithExpected - does the pasted value equal one of the digests?
 * @param expected what the reader pasted
 * @param digests the four digests the page already computed (of the text or of the file)
 */
export function compareWithExpected(expected: string, digests: Record<HashAlgorithm, HashDigest>): HashComparison {
  // Leading and trailing whitespace never matters.
  let s = (expected ?? "").trim();
  // Nothing to compare.
  if (s === "") return { kind: "empty" };
  // The algorithm a wrapper names, if any.
  let label: HashAlgorithm | null = null;
  // BSD form: "SHA256 (name) = value".
  const bsd = /^(sha-?\d+)\s*\(.*\)\s*=\s*(\S+)$/i.exec(s);
  // A coreutils line: "value  name" or "value *name" (the value is hex there), started with a backslash when the
  // file name holds a backslash, newline or carriage return (coreutils escapes the name then).
  const gnu = /^\\?([0-9a-f]+)\s[ *]\S.*$/i.exec(s);
  // A label and a separator: "sha256:value", "sha256=value", "sha256-value" (SRI).
  const tagged = /^(sha-?\d+)\s*[:=-]\s*(\S+)$/i.exec(s);
  if (bsd) {
    // The label names the algorithm; an unknown label is not a hash we can compare.
    label = labelAlgorithm(bsd[1]);
    // Unknown algorithm label: malformed for this tool.
    if (!label) return { kind: "malformed" };
    // The value.
    s = bsd[2];
  } else if (gnu) {
    // The digest is the first field; the file name is not compared.
    s = gnu[1];
  } else if (tagged) {
    // The label.
    label = labelAlgorithm(tagged[1]);
    // Unknown algorithm label.
    if (!label) return { kind: "malformed" };
    // The value.
    s = tagged[2];
  }
  // Hex written in byte pairs with spaces or colons: join the pairs.
  if (/^[0-9a-f]{2}([ :][0-9a-f]{2})+$/i.test(s)) s = s.replace(/[ :]/g, "");
  // Any other inner whitespace (a value wrapped across lines) is removed.
  s = s.replace(/\s+/g, "");
  // The algorithms to try: the labelled one, or all four.
  const candidates: readonly HashAlgorithm[] = label ? [label] : HASH_ALGORITHMS;
  // Hex: digits and a-f only, an even number of them (whole bytes).
  const isHex = /^[0-9a-f]+$/i.test(s) && s.length % 2 === 0;
  // Base64, standard or URL-safe, with up to two padding characters.
  const isBase64 = /^[A-Za-z0-9+/_-]+={0,2}$/.test(s);
  // The base64 form normalised: URL-safe letters to standard ones, the padding a publisher may drop restored.
  let b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  // Pad to a multiple of four.
  while (isBase64 && b64.length % 4 !== 0) b64 += "=";
  // A hex match, lower-casing the pasted value.
  if (isHex) for (const a of candidates) if (digests[a].hex === s.toLowerCase()) return { kind: "match", algorithm: a, encoding: "hex", label };
  // A base64 match (a 64-character hex-looking value can also be a SHA-384 in base64).
  if (isBase64) for (const a of candidates) if (digests[a].base64 === b64) return { kind: "match", algorithm: a, encoding: "base64", label };
  // No match, read as hex when it has a hex digest's length.
  const hexSame = isHex ? HASH_ALGORITHMS.find((a) => HEX_LENGTH[a] === s.length) ?? null : null;
  // Hex of a digest's length: report it as hex.
  if (hexSame) return { kind: "no-match", sameLengthAs: hexSame, encoding: "hex", label };
  // The digest whose base64 form is as long, if any.
  const b64Same = isBase64 ? HASH_ALGORITHMS.find((a) => BASE64_LENGTH[a] === b64.length) ?? null : null;
  // Base64 of a digest's length: report it as base64.
  if (b64Same) return { kind: "no-match", sameLengthAs: b64Same, encoding: "base64", label };
  // Hex of no digest's length (an MD5, say): report it as hex, with no length to name.
  if (isHex) return { kind: "no-match", sameLengthAs: null, encoding: "hex", label };
  // Base64 of no digest's length.
  if (isBase64) return { kind: "no-match", sameLengthAs: null, encoding: "base64", label };
  // Neither form.
  return { kind: "malformed" };
}
