// ============================================================================
// src/lib/tools/url-inspector/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING URL INSPECTOR MODULE - a self-contained {manifest, run, vectors}
// triple. Paste a URL, see every RFC 3986 component named, the query string
// broken out into percent-decoded parameters, an internationalized host decoded
// from punycode, and an assessment that flags embedded credentials, plaintext
// schemes, redundant ports, and characters that should be normalized.
//
// Faithful dissection, not normalization: it shows the URL as written. Pure and
// offline; it parses a string and contacts nothing.
//
// shareSafetyDefault: "fragment" - a URL can carry credentials or tokens, so the
// input stays out of the query string and server logs.
// ============================================================================

import { inspectUrl, type UrlReport } from "./compute";
import { GOLDEN_VECTOR_SET_ID, URL_GOLDEN_VECTORS, URL_REJECT_VECTORS } from "./golden-vectors";

export { inspectUrl, UrlParseError } from "./compute";
export type {
  UrlReport,
  UrlReason,
  QueryParam,
  HostType,
  UrlParseErrorCode,
} from "./compute";
export {
  GOLDEN_VECTOR_SET_ID,
  URL_GOLDEN_VECTORS,
  URL_REJECT_VECTORS,
  verifyVectors,
} from "./golden-vectors";
export type { UrlGoldenVector, UrlRejectVector } from "./golden-vectors";

/** The D-49 declarative manifest for the url-inspector tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "HTTP & web",
  toolSlug: "url-inspector",
  canonicalAliases: ["url-decoder", "url-parser", "uri-inspector", "query-string-parser", "url-dissector"],
  inputDetectors: [
    {
      kind: "regex",
      pattern: "^[a-zA-Z][a-zA-Z0-9+.\\-]*://",
      priority: 8,
      example: "https://user@host.example.com:8443/p?a=1#f",
    },
    {
      kind: "regex",
      pattern: "^(https?|ftp|ftps|ws|wss|mailto|tel):",
      priority: 7,
      example: "mailto:foo@bar.com",
    },
    {
      kind: "regex",
      pattern: "[?&][^=&\\s]+=[^&\\s]*",
      priority: 4,
      example: "/search?q=hello%20world&lang=en",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["redos-guard"], // RFC 3986 regex is linear; punycode is bounded
  shareSafetyDefault: "fragment", // a URL may carry credentials or tokens

  // -- Teaching & provenance --
  learnLinks: ["learn/url-anatomy", "learn/query-strings", "learn/url-encoding-and-idn"],
  sources: [
    {
      id: "rfc3986",
      label: "RFC 3986 - Uniform Resource Identifier (URI): Generic Syntax",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc3986",
      access_date: "2026-06-29",
      scope: "the component grammar (scheme, authority, path, query, fragment) and the parsing regex",
      status: "active",
    },
    {
      id: "whatwg-url",
      label: "WHATWG URL Standard",
      type: "spec",
      url: "https://url.spec.whatwg.org/",
      access_date: "2026-06-29",
      scope: "browser URL parsing, special schemes, and the form-urlencoded query (plus as space)",
      status: "active",
    },
    {
      id: "rfc3492",
      label: "RFC 3492 - Punycode: A Bootstring encoding for IDNA",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc3492",
      access_date: "2026-06-29",
      scope: "decoding an xn-- host label back to Unicode",
      status: "active",
    },
    {
      id: "rfc5890",
      label: "RFC 5890 - Internationalized Domain Names for Applications (IDNA)",
      type: "rfc",
      url: "https://www.rfc-editor.org/rfc/rfc5890",
      access_date: "2026-06-29",
      scope: "the IDNA framework that the punycode host form belongs to",
      status: "active",
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});

/**
 * run - the registry-facing entry point. Deterministic dissection; throws a
 * UrlParseError only on empty input.
 */
export function run(input: string): UrlReport {
  return inspectUrl(input);
}

export const goldenVectors = URL_GOLDEN_VECTORS;
export const rejectVectors = URL_REJECT_VECTORS;
