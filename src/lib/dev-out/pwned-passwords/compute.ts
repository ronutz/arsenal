// ============================================================================
// src/lib/dev-out/pwned-passwords/compute.ts
// ----------------------------------------------------------------------------
// PWNED PASSWORDS CHECK - the third /dev/out resident (2026-10-26), built on
// the pattern of the RDAP and ASN lookups: everything that can be computed
// locally is computed here, deterministically, and pinned by golden vectors;
// the one request to the live service is sent only on the reader's explicit
// action (Ask or Enter, through the AskGate of src/lib/dev-out/ask.ts).
//
// WHAT THE SERVICE DOCUMENTS (Have I Been Pwned, API v3, section "Pwned
// Passwords", read 2026-10-26, https://haveibeenpwned.com/API/v3#PwnedPasswords):
//   - each password in the corpus is stored as the SHA-1 hash (and the NTLM
//     hash) "of a UTF-8 encoded password";
//   - the range search takes "the first 5 characters of either a SHA-1 or an
//     NTLM hash (not case-sensitive)": GET https://api.pwnedpasswords.com/range/{first 5 SHA-1 chars};
//   - the answer is "the suffix of every hash beginning with the specified
//     prefix, followed by a count of how many times it appears in the data
//     set"; the client searches it for its own suffix, and "if not found, the
//     password does not exist in the data set";
//   - every one of the 1,048,576 prefixes answers HTTP 200 ("there is no
//     circumstance in which the API should return HTTP 404");
//   - padding: the request header "Add-Padding: true" pads the answer so its
//     size does not reveal the prefix, and "Padded entries always have a
//     password count of 0 and can be discarded once received";
//   - "There is no authorisation required for the free Pwned Passwords API";
//     "There is no rate limit on the Pwned Passwords API"; CORS "accepts all
//     origins" on the APIs that need no key;
//   - incremental searching (a request per keystroke) can let an observer at
//     the service's edge discern the password; checking once the whole
//     password is entered "mitigates this risk". This tool never sends on
//     typing at all: only on Ask or Enter.
//
// MEASURED FROM THIS CONTAINER on 2026-10-26 22:48-22:49 São Paulo (curl, Origin:
// https://ronutz.com, full log in the build notes): HTTP 200, text/plain;
// charset=utf-8, lines "SUFFIX:COUNT" with 35 upper-case hexadecimal digits,
// separated by CRLF, no trailing line break; access-control-allow-origin: *;
// the preflight for Add-Padding answers access-control-allow-headers:
// Add-Padding and access-control-allow-methods: GET; padded answers carry
// cache-control: no-store and put the count-0 lines after the real ones; a
// malformed prefix answers HTTP 400 with a plain-text reason.
//
// WHAT NEVER HAPPENS HERE: the password is not stored, logged, put in a URL or
// a fragment, or sent. Only the five-character prefix of its SHA-1 hash leaves
// the browser, and only through askRange() below.
//
// PRIME DIRECTIVE (D-19): every line commented.
// ============================================================================

// The shared egress timeout, so every red-room tool gives up after the same time and the copy can say so.
import { ASK_TIMEOUT_MS } from "@/lib/dev-out/ask";

// ----------------------------------------------------------------------------
// Constants, each from the service's documentation read 2026-10-26
// ----------------------------------------------------------------------------

/** When the documentation behind these rules was read, surfaced in the page's provenance line. */
export const SOURCE_SNAPSHOT = Object.freeze({
  // The day the API v3 page, the Passwords page and the padding post were downloaded and read.
  accessed: "2026-10-26",
  // The API documentation's Pwned Passwords section (range search, padding, CORS, rate limiting, licence).
  apiDoc: "https://haveibeenpwned.com/API/v3#PwnedPasswords",
  // The service's own announcement of padding, linked from the API documentation.
  paddingPost: "https://www.troyhunt.com/enhancing-pwned-passwords-privacy-with-padding/",
});

/** The one host this tool may reach; the page's Content-Security-Policy names it and nothing else. */
export const API_HOST = "api.pwnedpasswords.com";

/** The range endpoint without its prefix (API v3, "Searching by hash range using k-anonymity"). */
export const RANGE_BASE = `https://${API_HOST}/range/`;

/** The padding request header's name (API v3, "Introducing padding"). */
export const PADDING_HEADER_NAME = "Add-Padding";

/** The padding request header's value, as the documentation's example gives it. */
export const PADDING_HEADER_VALUE = "true";

/** How many hexadecimal characters of the hash are sent: five (API v3: "the first 5 characters"). */
export const PREFIX_LENGTH = 5;

/** How many hexadecimal characters stay on the device: the other 35 of SHA-1's 40. */
export const SUFFIX_LENGTH = 35;

/** A SHA-1 digest is 160 bits, written as 40 hexadecimal characters. */
export const HASH_HEX_LENGTH = 40;

/**
 * The largest answer this page will read, in characters. Measured on 2026-10-26: a padded answer for prefix 21BD1
 * held 2,124 lines in 83,383 bytes. Two million characters (about 50,000 lines) leaves room for the corpus to grow
 * more than twentyfold and still keeps a broken or hostile body from tying up the page.
 */
export const MAX_RANGE_CHARS = 2_000_000;

/** The most digits a count may have: 15 keeps every count exact in a JavaScript number (2^53 has 16 digits). */
export const MAX_COUNT_DIGITS = 15;

// ----------------------------------------------------------------------------
// Errors for the local layers
// ----------------------------------------------------------------------------

/** "notHash": not 40 hexadecimal characters; "notPrefix": not 5 hexadecimal characters. */
export type PwnedErrorCode = "notHash" | "notPrefix";

/** A refusal by one of the local layers, carrying a code the vectors can compare. */
export class PwnedError extends Error {
  /** Which rule refused the input. */
  code: PwnedErrorCode;
  /**
   * @param code the rule that refused
   * @param message an optional human-readable detail (never the password)
   */
  constructor(code: PwnedErrorCode, message?: string) {
    // The message defaults to the code, so a stack trace never needs the input.
    super(message ?? code);
    // A recognisable name for instanceof-free checks.
    this.name = "PwnedError";
    // Keep the code for callers and vectors.
    this.code = code;
  }
}

// ----------------------------------------------------------------------------
// 1. Hashing: Web Crypto SHA-1 over the UTF-8 bytes
// ----------------------------------------------------------------------------

/** The part of SubtleCrypto this module uses, so a test can pass its own. */
export type DigestLike = Pick<SubtleCrypto, "digest">;

/**
 * The browser's (or Node's) Web Crypto digest, or null where it is missing.
 * The W3C Web Cryptography API marks `crypto.subtle` [SecureContext]: on a page served over plain HTTP it does not
 * exist, and the page says so instead of hashing some other way.
 * @returns the SubtleCrypto object, or null
 */
export function getSubtle(): DigestLike | null {
  // globalThis.crypto exists in browsers and in Node 19 and later; subtle only in a secure context.
  const subtle = (globalThis as { crypto?: { subtle?: DigestLike } }).crypto?.subtle;
  // A missing digest is reported as null, never papered over.
  return subtle && typeof subtle.digest === "function" ? subtle : null;
}

/**
 * The UTF-8 bytes of the password, exactly as typed.
 * TextEncoder always encodes UTF-8 (WHATWG Encoding: its encoding getter returns "utf-8"); no trimming and no Unicode
 * normalisation are applied, because the service documents UTF-8 and no normalisation step, so a composed "ñ" and an
 * "n" followed by a combining tilde are different passwords to it, and to this tool.
 * @param password the text to encode
 * @returns its UTF-8 byte sequence
 */
export function utf8Bytes(password: string): Uint8Array<ArrayBuffer> {
  // One encoder per call: it holds no state worth keeping.
  return new TextEncoder().encode(password);
}

/**
 * A byte buffer as upper-case hexadecimal, the case the range API answers in.
 * @param buf the digest bytes
 * @returns two hexadecimal characters per byte
 */
export function toHexUpper(buf: ArrayBuffer): string {
  // A view over the bytes.
  const bytes = new Uint8Array(buf);
  // The characters, appended byte by byte.
  let out = "";
  // Walk every byte in order.
  for (const b of bytes) out += b.toString(16).padStart(2, "0");
  // Upper case, as the service writes its suffixes.
  return out.toUpperCase();
}

/**
 * SHA-1 of the password's UTF-8 bytes, by Web Crypto (W3C Web Cryptography API, "SHA-1" digest per FIPS 180-4).
 * @param password the text to hash (never logged, never stored by this module)
 * @param subtle the digest to use (planCheck passes getSubtle(), the browser's own)
 * @returns the 40-character upper-case hexadecimal digest
 */
export async function sha1Hex(password: string, subtle: DigestLike): Promise<string> {
  // The digest of the exact UTF-8 bytes.
  const digest = await subtle.digest("SHA-1", utf8Bytes(password));
  // Written the way the service writes hashes.
  return toHexUpper(digest);
}

// ----------------------------------------------------------------------------
// 2. The split: what is sent and what stays
// ----------------------------------------------------------------------------

// Exactly 40 hexadecimal characters, either case; anchored with one bounded quantifier, so linear time (ReDoS-safe).
const HASH_RE = /^[0-9A-Fa-f]{40}$/;

// Exactly 5 upper-case hexadecimal characters, the form this tool sends; anchored and bounded.
const PREFIX_RE = /^[0-9A-F]{5}$/;

/** A hash cut into the part that is sent and the part that stays on the device. */
export interface HashSplit {
  /** All 40 characters, upper case. */
  hash: string;
  /** The first 5: the only thing that leaves the browser. */
  prefix: string;
  /** The other 35: compared locally, never sent. */
  suffix: string;
}

/**
 * Cut a SHA-1 hash into its 5-character prefix and 35-character suffix.
 * @param hex 40 hexadecimal characters, either case
 * @returns the upper-case hash, prefix and suffix
 * @throws PwnedError("notHash") for anything else
 */
export function splitHash(hex: string): HashSplit {
  // Anything but 40 hexadecimal characters is not a SHA-1 hash.
  if (!HASH_RE.test(hex)) throw new PwnedError("notHash");
  // Upper case, as the service answers.
  const hash = hex.toUpperCase();
  // The prefix and the suffix, by position.
  return { hash, prefix: hash.slice(0, PREFIX_LENGTH), suffix: hash.slice(PREFIX_LENGTH) };
}

/**
 * The exact URL the tool would request for a prefix.
 * @param prefix five upper-case hexadecimal characters
 * @returns https://api.pwnedpasswords.com/range/<prefix>
 * @throws PwnedError("notPrefix") for anything else, so no other path can ever be built
 */
export function rangeUrl(prefix: string): string {
  // Only a well-formed prefix makes a URL.
  if (!PREFIX_RE.test(prefix)) throw new PwnedError("notPrefix");
  // The documented endpoint plus the prefix, nothing else.
  return RANGE_BASE + prefix;
}

/**
 * The curl command that repeats the request from the reader's own machine (failure paths only).
 * It carries the prefix and the padding header, never the password or the suffix.
 * @param prefix five upper-case hexadecimal characters
 * @returns a one-line shell command
 */
export function curlCommand(prefix: string): string {
  // The same URL and header the browser would send; -s keeps curl quiet.
  return `curl -s -H '${PADDING_HEADER_NAME}: ${PADDING_HEADER_VALUE}' ${rangeUrl(prefix)}`;
}

/** What the page can show before any egress. */
export type CheckPlan =
  // The field is empty: nothing to hash, nothing to send.
  | { kind: "empty" }
  // This page has no Web Crypto (plain HTTP): nothing is hashed, nothing is sent.
  | { kind: "noCrypto" }
  // Hashed: the split, and the exact URL the Ask button would request.
  | ({ kind: "ready"; url: string } & HashSplit);

/**
 * The deterministic pre-flight, run as the reader types: hash locally and say what would be sent.
 * An empty field is the only input refused; every other string, spaces included, is a password to check as typed.
 * @param password the field's value (not trimmed)
 * @param subtle the digest to use; getSubtle() by default
 * @returns the plan
 */
export async function planCheck(password: string, subtle: DigestLike | null = getSubtle()): Promise<CheckPlan> {
  // Nothing typed: no hash.
  if (password === "") return { kind: "empty" };
  // No Web Crypto here: say so rather than hash some other way.
  if (!subtle) return { kind: "noCrypto" };
  // Hash, then cut.
  const split = splitHash(await sha1Hex(password, subtle));
  // The plan carries the URL built from the prefix alone.
  return { kind: "ready", url: rangeUrl(split.prefix), ...split };
}

// ----------------------------------------------------------------------------
// 3. Reading the answer: strict, padding-aware
// ----------------------------------------------------------------------------

// One line of the answer: 35 hexadecimal characters, a colon, 1 to 15 digits. Anchored, bounded quantifiers, no
// alternation that can overlap: linear time on any input (ReDoS-safe).
const LINE_RE = /^([0-9A-Fa-f]{35}):([0-9]{1,15})$/;

/** Why an answer was refused rather than read. */
export type RangeRefusal =
  // No lines at all: every prefix has entries, so an empty body is not an answer.
  | "empty"
  // Longer than MAX_RANGE_CHARS.
  | "tooLarge"
  // A line that is not SUFFIX:COUNT (an HTML page, a truncated body, a blank line in the middle).
  | "malformedLine"
  // The same suffix twice with a count above 0: the format promises one line per hash.
  | "duplicate";

/** A range answer, read. */
export interface ParsedRange {
  /** Real entries: suffix (upper case) to count, every count at least 1. */
  real: Map<string, number>;
  /** Padding lines (count 0), counted and discarded. */
  padded: number;
  /** Every line read, real and padding. */
  lines: number;
}

/** The outcome of reading an answer: a range, or a refusal naming the first offending line. */
export type RangeParse =
  // Read in full.
  | { ok: true; range: ParsedRange }
  // Refused; line is 1-based where one line is to blame, null otherwise.
  | { ok: false; code: RangeRefusal; line: number | null };

/**
 * Read a range answer. Lines are separated by CRLF (as measured) or LF; one trailing line break is tolerated. A
 * line with a count of 0 is padding (API v3: "Padded entries always have a password count of 0") and is discarded.
 * Anything that is not SUFFIX:COUNT refuses the whole answer, because a body that does not follow the format is not
 * an answer and must never be shown as one.
 * @param body the response text
 * @returns the parsed range, or the refusal
 */
export function parseRange(body: string): RangeParse {
  // A body beyond the cap is refused before it is split.
  if (body.length > MAX_RANGE_CHARS) return { ok: false, code: "tooLarge", line: null };
  // Split on LF; a CR left at a line's end is removed below.
  const raw = body.split("\n");
  // One trailing line break leaves one empty element at the end: drop it, once.
  if (raw.length > 0 && raw[raw.length - 1] === "") raw.pop();
  // Nothing left: not an answer.
  if (raw.length === 0) return { ok: false, code: "empty", line: null };
  // The real entries.
  const real = new Map<string, number>();
  // The padding lines seen.
  let padded = 0;
  // Walk every line with its 1-based number.
  for (let i = 0; i < raw.length; i++) {
    // The line without the CR of a CRLF ending.
    const line = raw[i].endsWith("\r") ? raw[i].slice(0, -1) : raw[i];
    // The documented shape, or a refusal naming the line.
    const m = LINE_RE.exec(line);
    // Not SUFFIX:COUNT: the whole answer is refused.
    if (!m) return { ok: false, code: "malformedLine", line: i + 1 };
    // The suffix in upper case, for comparison.
    const suffix = m[1].toUpperCase();
    // The count, exact (at most 15 digits).
    const count = Number(m[2]);
    // A count of 0 is padding: counted, then discarded.
    if (count === 0) {
      // One more padding line.
      padded += 1;
      // Nothing else to do with it.
      continue;
    }
    // A real suffix seen twice is not the documented format.
    if (real.has(suffix)) return { ok: false, code: "duplicate", line: i + 1 };
    // Keep the real entry.
    real.set(suffix, count);
  }
  // The answer, read in full.
  return { ok: true, range: { real, padded, lines: raw.length } };
}

/**
 * Look for the password's suffix among the real entries. Padding never matches, because padding lines were
 * discarded by parseRange (the padding post warns that a padded suffix equal to the searched one would otherwise be a
 * false positive).
 * @param range a parsed answer
 * @param suffix the 35-character suffix kept on the device
 * @returns found with its count, or not found
 */
export function matchSuffix(range: ParsedRange, suffix: string): { found: true; count: number } | { found: false } {
  // The real entry for this suffix, if any.
  const count = range.real.get(suffix.toUpperCase());
  // Present with a count of at least 1: found.
  return count !== undefined ? { found: true, count } : { found: false };
}

/** The verdict the page shows for a readable answer, or the refusal it explains instead. */
export type RangeVerdict =
  // The suffix is in the corpus.
  | { kind: "found"; count: number; real: number; padded: number; lines: number }
  // The suffix is not in the corpus.
  | { kind: "notFound"; real: number; padded: number; lines: number }
  // The answer could not be read; never shown as a result.
  | { kind: "refused"; code: RangeRefusal; line: number | null };

/**
 * Read an answer and compare it with the suffix kept on the device.
 * @param body the response text
 * @param suffix the 35-character suffix
 * @returns found, not found, or refused
 */
export function assessRange(body: string, suffix: string): RangeVerdict {
  // Read first.
  const parsed = parseRange(body);
  // A refusal passes through unchanged.
  if (!parsed.ok) return { kind: "refused", code: parsed.code, line: parsed.line };
  // The line counts, shown beside the verdict.
  const { real, padded, lines } = parsed.range;
  // Compare locally.
  const m = matchSuffix(parsed.range, suffix);
  // Found: with its count.
  if (m.found) return { kind: "found", count: m.count, real: real.size, padded, lines };
  // Not found.
  return { kind: "notFound", real: real.size, padded, lines };
}

// ----------------------------------------------------------------------------
// 4. The one request (non-deterministic; its outcome sorting is vector-tested with a mock)
// ----------------------------------------------------------------------------

/** The request options askRange always sends, typed as literals so a test can check every one. */
export interface RangeRequestInit {
  /** GET, the documented method (the preflight answer allows GET only). */
  method: "GET";
  /** Only the padding header. */
  headers: { "Add-Padding": "true" };
  /** WHATWG Fetch: "omit" excludes credentials and ignores any sent back (the service's edge sets a cookie). */
  credentials: "omit";
  /** W3C Referrer Policy: "no-referrer" sends no Referer header at all. */
  referrerPolicy: "no-referrer";
  /** WHATWG Fetch: "no-store" behaves as if there were no HTTP cache, so no answer is kept on the device. */
  cache: "no-store";
  /** A redirect would be a different host or path than the one displayed: treat it as a failure. */
  redirect: "error";
  /** The AskGate's controller, so an input change or the timer can abandon the request. */
  signal: AbortSignal;
}

/** The fetch signature askRange needs, so a test can pass a mock. */
export type RangeFetchLike = (input: string, init: RangeRequestInit) => Promise<{
  status: number;
  ok: boolean;
  text: () => Promise<string>;
}>;

/** What the request produced, before the page reads the body. */
export type RangeAskOutcome =
  // A 2xx with its text.
  | { kind: "ok"; body: string }
  // Any non-2xx, relayed verbatim (the service documents no 404 for this API).
  | { kind: "httpError"; status: number }
  // No answer within ASK_TIMEOUT_MS.
  | { kind: "timeout" }
  // Network failure, CORS failure or a Content-Security-Policy block: indistinguishable to page JavaScript.
  | { kind: "network" }
  // A 2xx whose body could not be read.
  | { kind: "unreadable"; status: number };

/**
 * Send the one request for a prefix and sort the outcome. Never throws. The URL is the one the page displayed.
 * @param url the exact range URL shown before the action (built by rangeUrl)
 * @param controller the AbortController from AskGate.begin()
 * @param fetchImpl the fetch to use (the browser's by default; a mock in tests)
 * @param timeoutMs how long to wait before abandoning the request
 * @returns the outcome
 */
export async function askRange(
  url: string,
  controller: AbortController,
  fetchImpl: RangeFetchLike = (input, init) => fetch(input, init),
  timeoutMs: number = ASK_TIMEOUT_MS,
): Promise<RangeAskOutcome> {
  // Set when the timer, not the reader, aborted, so the two are told apart.
  let timedOut = false;
  // The timer that abandons a request taking too long.
  const timer = setTimeout(() => {
    // Remember why the request stopped.
    timedOut = true;
    // Abandon it.
    controller.abort();
  }, timeoutMs);
  try {
    // The one request: GET, padding on, no credentials, no referrer, no cache, no redirects.
    const res = await fetchImpl(url, {
      // The documented method.
      method: "GET",
      // Padding on (API v3, "Introducing padding").
      headers: { "Add-Padding": "true" },
      // No cookies either way.
      credentials: "omit",
      // No Referer header.
      referrerPolicy: "no-referrer",
      // Nothing written to or read from the HTTP cache.
      cache: "no-store",
      // A redirect fails the request instead of being followed.
      redirect: "error",
      // Abortable by the gate and the timer.
      signal: controller.signal,
    });
    // Any non-2xx is relayed verbatim.
    if (!res.ok) return { kind: "httpError", status: res.status };
    // A 2xx: read the text.
    try {
      // The whole body as text (the service sends text/plain; charset=utf-8).
      return { kind: "ok", body: await res.text() };
    } catch {
      // The body ended early because of the timeout, or could not be read.
      return timedOut ? { kind: "timeout" } : { kind: "unreadable", status: res.status };
    }
  } catch {
    // The timer's abort is a timeout; anything else (network, CORS, CSP, a redirect, an input-change abort) is a
    // failure to complete. An input-change abort is dropped by the page through AskGate.isCurrent anyway.
    return timedOut ? { kind: "timeout" } : { kind: "network" };
  } finally {
    // The timer never outlives the request.
    clearTimeout(timer);
  }
}
