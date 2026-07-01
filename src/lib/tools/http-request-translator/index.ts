// ============================================================================
// src/lib/tools/http-request-translator/index.ts
// ----------------------------------------------------------------------------
// HTTP REQUEST TRANSLATOR & EXPLAINER - a {manifest, run, vectors} triple. Paste
// a curl command and get it (a) explained: method, URL, every header, the body
// with its real Content-Type, auth, and each flag spelled out; and (b) translated
// to fetch (JS), a raw HTTP/1.1 request, HTTPie, and Python requests.
//
// One parse feeds both views. Nothing is sent and no request is executed (zero
// egress, D-49); the command you paste is decoded locally in the browser. This
// tool absorbs the former "curl command explainer" (catalogue merge M8) and is
// deliberately distinct from http-message-decoder, which decodes raw HTTP
// messages rather than curl commands.
// ============================================================================

import { parseCurl } from "./compute";
import { SET_ID, verifyVectors } from "./golden-vectors";

export { parseCurl } from "./compute";
export type { CurlParse, KV, OptionView, BodyView, UrlView, Translations } from "./compute";
export { SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest for the http-request-translator tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "HTTP & web",
  toolSlug: "http-request-translator",
  canonicalAliases: [
    "curl",
    "curl-explainer",
    "curl-command-explainer",
    "curl-to-fetch",
    "curl-converter",
    "http-request-translator",
    "request-translator",
  ],
  inputDetectors: [
    { kind: "regex", pattern: "^\\s*\\$?\\s*curl(\\.exe)?\\s", priority: 8, example: "curl -X POST https://api.example.com -d '{\"a\":1}'" },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: SET_ID,
  dangerousInputHandling: ["bounded-parse", "never-fetches", "never-executes"],
  shareSafetyDefault: "caution", // a pasted curl command can carry tokens, cookies, or Basic-auth credentials

  // -- Teaching & provenance --
  learnLinks: [
    "learn/reading-a-curl-command",
    "learn/curl-data-flags-and-content-type",
    "learn/curl-to-fetch",
    "learn/curl-headers-auth-and-cookies",
    "learn/curl-method-inference",
    "learn/curl-security-flags",
  ],
  sources: [
    { id: "curl-manpage", label: "curl - man page (command options)", url: "https://curl.se/docs/manpage.html" },
    { id: "rfc-9110", label: "RFC 9110 - HTTP Semantics", url: "https://www.rfc-editor.org/rfc/rfc9110" },
    { id: "mdn-fetch", label: "MDN - Using the Fetch API", url: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch" },
    { id: "httpie-docs", label: "HTTPie - Documentation", url: "https://httpie.io/docs/cli" },
    { id: "requests-docs", label: "Requests - Quickstart", url: "https://requests.readthedocs.io/en/latest/user/quickstart/" },
  ],
});

/** Tool entry point. Deterministic; delegates to the pure, local engine. */
export function run(input: string) {
  return parseCurl(input);
}

// Surface verifyVectors for the test harness.
export const __selftest = verifyVectors;
