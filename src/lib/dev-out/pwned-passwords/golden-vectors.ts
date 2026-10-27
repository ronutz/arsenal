// ============================================================================
// src/lib/dev-out/pwned-passwords/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors for the local layers of the Pwned Passwords check. As with the
// RDAP and ASN lookups, the LIVE answer carries no golden-vector guarantee (the
// room's notice says so); everything computed on the device is pinned here:
// the Web Crypto SHA-1 over UTF-8, the prefix and suffix split, the URL, the
// parsing of a range answer (padding lines discarded, malformed answers
// refused), the local match, and the sorting of the request's outcomes
// (driven by a mock fetch, so no vector touches the network).
//
// WHERE THE EXPECTATIONS COME FROM (2026-10-26):
//   - every SHA-1 below was computed by an independent implementation,
//     coreutils `printf %s '<string>' | sha1sum` (and `openssl dgst -sha1` for
//     P@ssw0rd), then hard-coded; this file runs the same strings through Web
//     Crypto and compares. Four of them are also published by the service's
//     creator in the padding post (troyhunt.com, 5 March 2020, read
//     2026-10-26): P@ssw0rd 21bd12dc..., P@ssw0rd2 9e823816..., 020293
//     21bd1925... and sparky50 21bd16d4..., and they agree;
//   - the range fixture is a live capture of GET
//     https://api.pwnedpasswords.com/range/21BD1 with Add-Padding: true, taken
//     2026-10-26 22:49 São Paulo (2,124 lines, 199 of them padding, sha256
//     f70c2d76...0df8a06), trimmed to nine of its lines, joined with CRLF as
//     received, no trailing line break.
// ONLY WELL-KNOWN BREACHED TEST STRINGS appear here ("password", "P@ssw0rd" and
// the like), never a real secret.
// ============================================================================

import {
  sha1Hex,
  splitHash,
  rangeUrl,
  planCheck,
  curlCommand,
  parseRange,
  matchSuffix,
  assessRange,
  askRange,
  getSubtle,
  PwnedError,
  MAX_RANGE_CHARS,
  RANGE_BASE,
  type RangeFetchLike,
  type RangeRequestInit,
} from "./compute";

// Dated so a change of expectations is visible in review.
export const GOLDEN_VECTOR_SET_ID = "dev-out-pwned-passwords/2026-10-26";

// ---- hashing: Web Crypto SHA-1 over UTF-8, against sha1sum ------------------

// Each row: a test string and the upper-case SHA-1 that sha1sum gave for its UTF-8 bytes.
const HASH_VECTORS: { id: string; input: string; sha1: string }[] = [
  // The most common breached password; sha1sum 5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8.
  { id: "password", input: "password", sha1: "5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8" },
  // The service creator's own example (padding post and the 2022 SHA-1 post); sha1sum and openssl agree.
  { id: "P@ssw0rd", input: "P@ssw0rd", sha1: "21BD12DC183F740EE76F27B78EB39C8AD972A757" },
  // From the padding post: a different prefix, 9E823.
  { id: "P@ssw0rd2", input: "P@ssw0rd2", sha1: "9E823816A6A507E61B90E00F5BE3B695F6896A7D" },
  // From the padding post: another password in the 21BD1 range.
  { id: "020293", input: "020293", sha1: "21BD192580CAD5C57296F8488DF190D23046B05F" },
  // From the padding post: a third password in the 21BD1 range.
  { id: "sparky50", input: "sparky50", sha1: "21BD16D4A08CB51C8B88FC8CE07742974D7D541D" },
  // A string of digits, as common as they come.
  { id: "123456", input: "123456", sha1: "7C4A8D09CA3762AF61E59520943DC26494F8941B" },
  // The three-letter textbook input.
  { id: "abc", input: "abc", sha1: "A9993E364706816ABA3E25717850C26C9CD0D89D" },
  // A leading space is part of the password: not trimmed, so a different hash from "password".
  { id: "leading-space", input: " password", sha1: "780F7B5DE4C2B4F5805F1E5F642B1B55CDA24482" },
  // Non-ASCII: "contraseña" with U+00F1 is the bytes 63 6f 6e 74 72 61 73 65 c3 b1 61 in UTF-8.
  { id: "utf8-composed", input: "contraseña", sha1: "8C31B65BDECDC9F18B695D7318186FD1FEED690D" },
  // The same word with "n" + U+0303 (combining tilde): no normalisation, so a different hash.
  { id: "utf8-decomposed", input: "contraseña", sha1: "DC44D4D9352F97FB3957EB1B09E42870B2FE5C6D" },
];

// ---- the split and the URL --------------------------------------------------

// Each row: a hash (either case), the five characters sent, the 35 kept, and the URL built from the prefix.
const SPLIT_VECTORS: { id: string; hash: string; prefix: string; suffix: string; url: string }[] = [
  // "password": 5BAA6 is all that leaves the browser.
  { id: "password", hash: "5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8", prefix: "5BAA6", suffix: "1E4C9B93F3F0682250B6CF8331B7EE68FD8", url: "https://api.pwnedpasswords.com/range/5BAA6" },
  // "P@ssw0rd": the documentation's own sample prefix, 21BD1.
  { id: "P@ssw0rd", hash: "21BD12DC183F740EE76F27B78EB39C8AD972A757", prefix: "21BD1", suffix: "2DC183F740EE76F27B78EB39C8AD972A757", url: "https://api.pwnedpasswords.com/range/21BD1" },
  // Lower-case input (as sha1sum prints it) comes out upper case.
  { id: "lowercase-in", hash: "5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8", prefix: "5BAA6", suffix: "1E4C9B93F3F0682250B6CF8331B7EE68FD8", url: "https://api.pwnedpasswords.com/range/5BAA6" },
];

// Hashes splitHash must refuse: too short, too long, a non-hexadecimal character, empty.
const SPLIT_REJECTS: { id: string; hash: string }[] = [
  // 39 characters.
  { id: "short", hash: "5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD" },
  // 41 characters.
  { id: "long", hash: "5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD80" },
  // A G in place of a hexadecimal digit.
  { id: "not-hex", hash: "5BAA61E4C9B93F3F0682250B6CF8331B7EE68FDG" },
  // Nothing.
  { id: "empty", hash: "" },
];

// Prefixes rangeUrl must refuse, so no other path can ever be requested.
const PREFIX_REJECTS: { id: string; prefix: string }[] = [
  // Four characters (the service answers 400 to this, measured 2026-10-26).
  { id: "four", prefix: "5BAA" },
  // Six characters (the email range length, not the password one; the service answers 400).
  { id: "six", prefix: "5BAA61" },
  // Lower case: the tool always sends upper case.
  { id: "lower", prefix: "5baa6" },
  // A path traversal attempt.
  { id: "path", prefix: "../x" },
];

// ---- the range fixture: live capture 2026-10-26, trimmed ---------------------

// Nine lines of the padded 21BD1 answer: lines 340-344 (real, around P@ssw0rd), 826 (sparky50), 1114 (020293), and
// the first and last padding lines (1926 and 2124, count 0); CRLF as received, no trailing line break.
const FIXTURE_21BD1 = [
  "2D6980B9098804E7A83DC5831BFBAF3927F:1",
  "2D8D1B3FAACCA6A3C6A91617B2FA32E2F57:1",
  "2DC183F740EE76F27B78EB39C8AD972A757:6421042",
  "2DCD15B6AF26467FDF91D9CA3202B48E82A:1",
  "2DE4C0087846D223DBBCCF071614590F300:4",
  "6D4A08CB51C8B88FC8CE07742974D7D541D:2999",
  "92580CAD5C57296F8488DF190D23046B05F:17769",
  "6D8ED515D19B8BFBC0E28069B59F6E6FF9C:0",
  "3474264D5407E55533C289D3A9A40CD3A3B:0",
].join("\r\n");

// The suffixes the match vectors look for.
const SUFFIX_P_SSW0RD = "2DC183F740EE76F27B78EB39C8AD972A757";
// sparky50's suffix in the same range.
const SUFFIX_SPARKY50 = "6D4A08CB51C8B88FC8CE07742974D7D541D";
// 020293's suffix in the same range.
const SUFFIX_020293 = "92580CAD5C57296F8488DF190D23046B05F";
// A padding line's suffix: present in the body with count 0, so it must NOT match.
const SUFFIX_PADDING = "6D8ED515D19B8BFBC0E28069B59F6E6FF9C";
// "password"'s suffix, which belongs to another range: absent.
const SUFFIX_ABSENT = "1E4C9B93F3F0682250B6CF8331B7EE68FD8";

// ---- answers that must be refused, never shown as results -------------------

// Each row: a body and the refusal (with the 1-based line where one is to blame).
const REFUSE_VECTORS: { id: string; body: string; code: string; line: number | null }[] = [
  // An empty body: every prefix has entries, so this is not an answer.
  { id: "empty", body: "", code: "empty", line: null },
  // An HTML page (a captive portal, a challenge page) instead of the range.
  { id: "html", body: "<!DOCTYPE html>\r\n<html><body>Just a moment...</body></html>", code: "malformedLine", line: 1 },
  // A non-hexadecimal character in a suffix.
  { id: "not-hex", body: "2DC183F740EE76F27B78EB39C8AD972A75G:1", code: "malformedLine", line: 1 },
  // A 34-character suffix.
  { id: "short-suffix", body: "2DC183F740EE76F27B78EB39C8AD972A75:1", code: "malformedLine", line: 1 },
  // No colon.
  { id: "no-colon", body: "2DC183F740EE76F27B78EB39C8AD972A757 1", code: "malformedLine", line: 1 },
  // A count that is not a number.
  { id: "count-text", body: "2DC183F740EE76F27B78EB39C8AD972A757:many", code: "malformedLine", line: 1 },
  // A negative count.
  { id: "count-negative", body: "2DC183F740EE76F27B78EB39C8AD972A757:-1", code: "malformedLine", line: 1 },
  // A 16-digit count, beyond exact integers.
  { id: "count-16-digits", body: "2DC183F740EE76F27B78EB39C8AD972A757:1234567890123456", code: "malformedLine", line: 1 },
  // A blank line in the middle.
  { id: "blank-middle", body: "2D6980B9098804E7A83DC5831BFBAF3927F:1\r\n\r\n2DC183F740EE76F27B78EB39C8AD972A757:6421042", code: "malformedLine", line: 2 },
  // Two trailing line breaks: only one is tolerated.
  { id: "two-trailing", body: "2DC183F740EE76F27B78EB39C8AD972A757:6421042\r\n\r\n", code: "malformedLine", line: 2 },
  // A body cut off in the middle of its second line.
  { id: "truncated", body: "2D6980B9098804E7A83DC5831BFBAF3927F:1\r\n2DC183F740EE76F2", code: "malformedLine", line: 2 },
  // The same real suffix twice.
  { id: "duplicate", body: "2DC183F740EE76F27B78EB39C8AD972A757:6421042\r\n2DC183F740EE76F27B78EB39C8AD972A757:5", code: "duplicate", line: 2 },
  // One character beyond the cap.
  { id: "too-large", body: "0".repeat(MAX_RANGE_CHARS + 1), code: "tooLarge", line: null },
];

// ---- the mock fetch for the request vectors ---------------------------------

/** One recorded call: the URL and the options the request was sent with. */
interface Recorded {
  /** The URL fetched. */
  url: string;
  /** The options, as askRange passed them. */
  init: RangeRequestInit;
}

/**
 * A fetch that records its call and answers as told.
 * @param behaviour what the mock does: answer a status and body, reject, fail the body read, or hang until aborted
 * @param log where calls are recorded
 * @returns the mock
 */
function mockFetch(
  behaviour: { status: number; body: string } | "reject" | "badBody" | "hang",
  log: Recorded[],
): RangeFetchLike {
  // The mock itself.
  return (url, init) => {
    // Record the call before anything else.
    log.push({ url, init });
    // A network or CORS failure.
    if (behaviour === "reject") return Promise.reject(new TypeError("Failed to fetch"));
    // Never answers; rejects when the signal aborts, as a real fetch does.
    if (behaviour === "hang")
      return new Promise((_, reject) => init.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError"))));
    // A 200 whose body cannot be read.
    if (behaviour === "badBody") return Promise.resolve({ status: 200, ok: true, text: () => Promise.reject(new TypeError("body stream")) });
    // A plain answer.
    return Promise.resolve({ status: behaviour.status, ok: behaviour.status >= 200 && behaviour.status < 300, text: () => Promise.resolve(behaviour.body) });
  };
}

// ---- the runner -------------------------------------------------------------

/** The report shape the vector runner reads. */
export interface VectorReport {
  /** GOLDEN_VECTOR_SET_ID. */
  setId: string;
  /** How many checks ran. */
  total: number;
  /** How many passed. */
  passed: number;
  /** One line per failed check. */
  failures: string[];
}

/**
 * Run every vector. Async because Web Crypto's digest is (scripts/run-golden-vectors.mts awaits it).
 * @returns the report
 */
export async function verifyVectors(): Promise<VectorReport> {
  // One line per failure.
  const failures: string[] = [];
  // How many checks ran.
  let total = 0;
  // Run one check: count it, record a failure message when it returns one or throws.
  const check = async (id: string, fn: () => Promise<string | null> | string | null) => {
    // Every check counts.
    total += 1;
    try {
      // null means pass; a string explains the failure.
      const why = await fn();
      // Record a failure.
      if (why) failures.push(`${id}: ${why}`);
    } catch (e) {
      // A check that throws has failed.
      failures.push(`${id}: threw ${(e as Error).message}`);
    }
  };

  // Web Crypto must be present to run the hashing vectors (Node 19+ and every browser in a secure context).
  const subtle = getSubtle();
  // Its absence is itself a failure of the environment, reported once.
  await check("web-crypto-present", () => (subtle ? null : "globalThis.crypto.subtle is missing"));

  // Hashing: each test string through Web Crypto, compared with sha1sum's answer.
  for (const v of HASH_VECTORS) {
    // One check per string.
    await check(`sha1/${v.id}`, async () => {
      // Without Web Crypto there is nothing to compare.
      if (!subtle) return "no Web Crypto";
      // The digest as the page computes it.
      const got = await sha1Hex(v.input, subtle);
      // Byte-exact comparison.
      return got === v.sha1 ? null : `got ${got}`;
    });
  }

  // The split and the URL.
  for (const v of SPLIT_VECTORS) {
    // One check per hash.
    await check(`split/${v.id}`, () => {
      // Cut the hash.
      const s = splitHash(v.hash);
      // Every field must match, and the URL must carry the prefix and nothing else.
      const ok = s.hash === v.hash.toUpperCase() && s.prefix === v.prefix && s.suffix === v.suffix && rangeUrl(s.prefix) === v.url;
      // Name what came back.
      return ok ? null : `got ${JSON.stringify(s)} ${rangeUrl(s.prefix)}`;
    });
  }

  // Hashes that are not SHA-1 hashes.
  for (const v of SPLIT_REJECTS) {
    // One check per input.
    await check(`split-reject/${v.id}`, () => {
      try {
        // Must throw.
        splitHash(v.hash);
        // It did not.
        return "accepted";
      } catch (e) {
        // The right refusal.
        return e instanceof PwnedError && e.code === "notHash" ? null : `wrong error ${(e as Error).message}`;
      }
    });
  }

  // Prefixes that must never become a URL.
  for (const v of PREFIX_REJECTS) {
    // One check per prefix.
    await check(`prefix-reject/${v.id}`, () => {
      try {
        // Must throw.
        rangeUrl(v.prefix);
        // It did not.
        return "accepted";
      } catch (e) {
        // The right refusal.
        return e instanceof PwnedError && e.code === "notPrefix" ? null : `wrong error ${(e as Error).message}`;
      }
    });
  }

  // The plan: empty input sends nothing.
  await check("plan/empty", async () => {
    // An empty field.
    const p = await planCheck("", subtle);
    // No hash, no URL.
    return p.kind === "empty" ? null : `got ${p.kind}`;
  });

  // The plan: no Web Crypto, nothing hashed another way, nothing sent.
  await check("plan/no-crypto", async () => {
    // A page without Web Crypto.
    const p = await planCheck("password", null);
    // Reported, not worked around.
    return p.kind === "noCrypto" ? null : `got ${p.kind}`;
  });

  // The plan: "password" is ready, and the URL carries the prefix only, never the suffix or the password.
  await check("plan/password", async () => {
    // The full pre-flight.
    const p = await planCheck("password", subtle);
    // Must be ready.
    if (p.kind !== "ready") return `got ${p.kind}`;
    // The exact URL, whose path is the prefix alone (the host name itself contains "passwords", so the path is what
    // is compared), and the suffix nowhere in it.
    const ok = p.url === `${RANGE_BASE}5BAA6` && new URL(p.url).pathname === "/range/5BAA6" && p.suffix === "1E4C9B93F3F0682250B6CF8331B7EE68FD8" && !p.url.includes(p.suffix);
    // Name what came back.
    return ok ? null : `got ${p.url}`;
  });

  // The curl command for the failure paths carries the prefix and the padding header only.
  await check("curl/5BAA6", () => {
    // The command.
    const c = curlCommand("5BAA6");
    // Byte-exact.
    return c === "curl -s -H 'Add-Padding: true' https://api.pwnedpasswords.com/range/5BAA6" ? null : `got ${c}`;
  });

  // Parsing the fixture: 9 lines, 7 real, 2 padding.
  await check("parse/fixture-counts", () => {
    // Read the capture.
    const r = parseRange(FIXTURE_21BD1);
    // Must be readable.
    if (!r.ok) return `refused ${r.code}`;
    // The counts.
    return r.range.lines === 9 && r.range.real.size === 7 && r.range.padded === 2 ? null : `got ${r.range.lines}/${r.range.real.size}/${r.range.padded}`;
  });

  // Matching against the fixture: three real suffixes found with their captured counts.
  for (const [id, suffix, count] of [
    ["P@ssw0rd", SUFFIX_P_SSW0RD, 6421042],
    ["sparky50", SUFFIX_SPARKY50, 2999],
    ["020293", SUFFIX_020293, 17769],
  ] as const) {
    // One check per suffix.
    await check(`match/found-${id}`, () => {
      // Read the capture.
      const r = parseRange(FIXTURE_21BD1);
      // Must be readable.
      if (!r.ok) return `refused ${r.code}`;
      // Compare locally.
      const m = matchSuffix(r.range, suffix);
      // Found, with the captured count.
      return m.found && m.count === count ? null : `got ${JSON.stringify(m)}`;
    });
  }

  // A padding line's suffix is in the body but must not match (count 0 is discarded).
  await check("match/padding-ignored", () => {
    // Read the capture.
    const r = parseRange(FIXTURE_21BD1);
    // Must be readable.
    if (!r.ok) return `refused ${r.code}`;
    // Compare.
    return matchSuffix(r.range, SUFFIX_PADDING).found ? "a padding line matched" : null;
  });

  // A suffix from another range is not found.
  await check("match/absent", () => {
    // Read the capture.
    const r = parseRange(FIXTURE_21BD1);
    // Must be readable.
    if (!r.ok) return `refused ${r.code}`;
    // Compare.
    return matchSuffix(r.range, SUFFIX_ABSENT).found ? "an absent suffix matched" : null;
  });

  // The whole verdict for P@ssw0rd against the fixture.
  await check("assess/found", () => {
    // The verdict.
    const v = assessRange(FIXTURE_21BD1, SUFFIX_P_SSW0RD);
    // Found, with the count and the line tallies.
    return v.kind === "found" && v.count === 6421042 && v.real === 7 && v.padded === 2 && v.lines === 9 ? null : `got ${JSON.stringify(v)}`;
  });

  // The whole verdict for an absent suffix.
  await check("assess/not-found", () => {
    // The verdict.
    const v = assessRange(FIXTURE_21BD1, SUFFIX_ABSENT);
    // Not found, with the line tallies.
    return v.kind === "notFound" && v.real === 7 && v.padded === 2 ? null : `got ${JSON.stringify(v)}`;
  });

  // LF line breaks and one trailing line break read the same as the CRLF capture.
  await check("parse/lf-and-trailing-break", () => {
    // The same lines, LF-separated, with a final line break.
    const v = assessRange(FIXTURE_21BD1.replace(/\r\n/g, "\n") + "\n", SUFFIX_P_SSW0RD);
    // Same verdict.
    return v.kind === "found" && v.count === 6421042 && v.lines === 9 ? null : `got ${JSON.stringify(v)}`;
  });

  // Lower-case suffixes in the answer still match (the service documents the prefix as not case-sensitive).
  await check("parse/lowercase-suffix", () => {
    // The P@ssw0rd line in lower case.
    const v = assessRange("2dc183f740ee76f27b78eb39c8ad972a757:6421042", SUFFIX_P_SSW0RD);
    // Found.
    return v.kind === "found" && v.count === 6421042 ? null : `got ${JSON.stringify(v)}`;
  });

  // A padding line that happens to repeat a real suffix is discarded and the real entry stands.
  await check("parse/padding-collides-with-real", () => {
    // The real line, then the same suffix as padding.
    const v = assessRange(`${SUFFIX_P_SSW0RD}:6421042\r\n${SUFFIX_P_SSW0RD}:0`, SUFFIX_P_SSW0RD);
    // Found with the real count; one padding line counted.
    return v.kind === "found" && v.count === 6421042 && v.padded === 1 ? null : `got ${JSON.stringify(v)}`;
  });

  // Answers that are not answers.
  for (const v of REFUSE_VECTORS) {
    // One check per body.
    await check(`refuse/${v.id}`, () => {
      // Read it.
      const r = parseRange(v.body);
      // Must be refused, with the right code and line.
      if (r.ok) return "accepted";
      // Compare.
      return r.code === v.code && r.line === v.line ? null : `got ${r.code} at ${r.line}`;
    });
  }

  // The request: an answer comes back as text, and the request carries exactly the documented options.
  await check("ask/ok-and-request-shape", async () => {
    // The call log.
    const log: Recorded[] = [];
    // Ask with a 200 answer.
    const out = await askRange(`${RANGE_BASE}21BD1`, new AbortController(), mockFetch({ status: 200, body: FIXTURE_21BD1 }, log));
    // Exactly one call.
    if (log.length !== 1) return `${log.length} calls`;
    // What was sent.
    const { url, init } = log[0];
    // The URL and every option, one by one.
    const shapeOk =
      url === "https://api.pwnedpasswords.com/range/21BD1" &&
      init.method === "GET" &&
      JSON.stringify(init.headers) === JSON.stringify({ "Add-Padding": "true" }) &&
      init.credentials === "omit" &&
      init.referrerPolicy === "no-referrer" &&
      init.cache === "no-store" &&
      init.redirect === "error" &&
      !("body" in init);
    // Nothing of the password or the suffix anywhere in what was sent.
    const sent = `${url} ${JSON.stringify({ ...init, signal: undefined })}`;
    // The leak check.
    const leakFree = !sent.includes("P@ssw0rd") && !sent.includes(SUFFIX_P_SSW0RD);
    // The outcome must carry the body unchanged.
    const outOk = out.kind === "ok" && out.body === FIXTURE_21BD1;
    // Report.
    return shapeOk && leakFree && outOk ? null : `shape ${shapeOk} leakFree ${leakFree} out ${out.kind}`;
  });

  // The request: non-2xx statuses are relayed, never read as answers.
  for (const status of [429, 503, 404]) {
    // One check per status.
    await check(`ask/http-${status}`, async () => {
      // Ask.
      const out = await askRange(`${RANGE_BASE}21BD1`, new AbortController(), mockFetch({ status, body: "x" }, []));
      // Relayed with its status.
      return out.kind === "httpError" && out.status === status ? null : `got ${JSON.stringify(out)}`;
    });
  }

  // The request: a rejected fetch (network, CORS, CSP, a redirect) is a network failure.
  await check("ask/network", async () => {
    // Ask.
    const out = await askRange(`${RANGE_BASE}21BD1`, new AbortController(), mockFetch("reject", []));
    // Sorted as network.
    return out.kind === "network" ? null : `got ${out.kind}`;
  });

  // The request: a 200 whose body cannot be read is unreadable, not an answer.
  await check("ask/unreadable", async () => {
    // Ask.
    const out = await askRange(`${RANGE_BASE}21BD1`, new AbortController(), mockFetch("badBody", []));
    // Sorted as unreadable with its status.
    return out.kind === "unreadable" && out.status === 200 ? null : `got ${JSON.stringify(out)}`;
  });

  // The request: no answer in time is a timeout (a 25 ms limit stands in for the page's 12 s).
  await check("ask/timeout", async () => {
    // Ask a service that never answers.
    const out = await askRange(`${RANGE_BASE}21BD1`, new AbortController(), mockFetch("hang", []), 25);
    // Sorted as a timeout.
    return out.kind === "timeout" ? null : `got ${out.kind}`;
  });

  // The request: an abort by the page (the input changed) is not a timeout.
  await check("ask/aborted-by-input-change", async () => {
    // The gate's controller.
    const controller = new AbortController();
    // Start asking a service that never answers.
    const pending = askRange(`${RANGE_BASE}21BD1`, controller, mockFetch("hang", []), 10_000);
    // The input changes: the page aborts.
    controller.abort();
    // The outcome.
    const out = await pending;
    // Sorted as a failure to complete; the page drops it anyway through AskGate.isCurrent.
    return out.kind === "network" ? null : `got ${out.kind}`;
  });

  // The report.
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: total - failures.length, failures };
}
