// ============================================================================
// src/lib/tools/curl-command-builder/index.ts
// ----------------------------------------------------------------------------
// CURL COMMAND BUILDER - a {manifest, run, vectors} triple. Pick any of the 27
// protocols the current curl tool speaks, fill protocol-aware fields, toggle
// the options that matter, and get the exact command with every flag explained
// and safety warnings surfaced. The inverse of http-request-translator (which
// parses a pasted command); the two cross-link.
//
// Nothing is executed and nothing leaves the browser (D-49 localOnly). The
// protocol table is grounded in curl.se and everything.curl.dev (2026-07-07).
// ============================================================================

import { buildCurl, type BuilderState } from "./compute";
import { SET_ID, verifyVectors } from "./golden-vectors";

export { buildCurl, PROTOCOLS, PROTOCOL_MAP, shq } from "./compute";
export type { BuilderState, BuildResult, CommandPart, ProtocolInfo, KV, PathKind } from "./compute";
export { SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest for the curl-command-builder tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "HTTP & web",
  toolSlug: "curl-command-builder",
  canonicalAliases: [
    "curl-builder",
    "curl-generator",
    "curl-helper",
    "curl-command-builder",
    "build-curl",
    "curl-cheatsheet",
  ],
  // A form-driven builder: nothing pasteable to auto-detect, so no OMNIBOX
  // detectors (pasted curl commands route to http-request-translator).
  inputDetectors: [],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: SET_ID,
  dangerousInputHandling: ["never-fetches", "never-executes", "shell-escapes-output"],
  shareSafetyDefault: "caution", // a built command can carry credentials (-u user:pass)

  // -- Teaching & provenance --
  learnLinks: [
    "learn/curl-protocols-beyond-http",
    "learn/reading-a-curl-command",
    "learn/curl-security-flags",
    "learn/curl-data-flags-and-content-type",
    "learn/curl-headers-auth-and-cookies",
  ],
  sources: [
    { id: "curl-manpage", label: "curl - man page (protocols and options)", url: "https://curl.se/docs/manpage.html" },
    { id: "curl-howto", label: "curl - How To Use (supported protocol list)", url: "https://curl.se/docs/manual.html" },
    { id: "everything-curl-protocols", label: "everything curl - the protocols curl speaks", url: "https://everything.curl.dev/protocols/curl.html" },
  ],
});

/** API entry point: structured JSON in (BuilderState), BuildResult out. */
export function run(input: BuilderState) {
  return buildCurl(input);
}

// Surface verifyVectors for the test harness.
export const __selftest = verifyVectors;
