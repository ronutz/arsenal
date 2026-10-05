// ============================================================================
// src/lib/tools/dig-command-builder/index.ts
// ----------------------------------------------------------------------------
// DIG COMMAND BUILDER: the self-describing {manifest, run, vectors} triple
// (D-49). Say what you want to look up, where to ask and how, and get one
// copy-pasteable dig command line with every token explained, findings for
// the combinations that are redundant or contradictory, and a summary of what
// the query will carry (transport, port, RD, DO, CD, EDNS, cookie). The
// inverse of dig-output-explainer, which reads what dig printed; the two
// cross-link. Nothing is executed and nothing leaves the browser.
//
// Facts come from the BIND 9 dig manual, the DNS RFCs and the IANA registry,
// all read 2026-10-04 (SOURCES in compute.ts).
// ============================================================================

import { run as compute, SOURCES, type DigInput, type DigResult } from "./compute";
import { GOLDEN_VECTOR_SET_ID, VECTORS } from "./golden-vectors";

// The compute layer's public types and helpers.
export type { DigInput, DigResult, Part, PartKind, Finding, FindingCode, Severity, Effective, Question, Transport, Ipv, Klass, OutputMode, Source } from "./compute";
export { SOURCES, RR_TYPES, COMMON_TYPES, CLASSES, DEFAULT_PORT, MAX_FIELD, reverseName, typeNumber, shq, isIpv4, isIpv6 } from "./compute";
// The vector set and its runner.
export { GOLDEN_VECTOR_SET_ID, VECTORS, verifyVectors, pin } from "./golden-vectors";

/** The D-49 declarative manifest. */
export const manifest = Object.freeze({
  // The family the tool is listed under (the catalogue uses the same name).
  toolFamily: "Networking & addressing",
  // The slug.
  toolSlug: "dig-command-builder",
  // Other names it answers to.
  canonicalAliases: ["dig-builder", "dig-generator", "build-dig", "dns-query-builder", "dig-cheatsheet", "dig-command"],
  // A form-driven builder: nothing pasteable to detect (pasted dig output routes to dig-output-explainer); the example is a valid API body.
  inputDetectors: [
    { kind: "regex", priority: 3, pattern: "^\\{\\s*\"(name|reverse|server|type)\"\\s*:", example: "{\"name\":\"example.com\",\"server\":\"192.0.2.53\",\"type\":\"MX\",\"dnssec\":true,\"multiline\":true}" },
  ],
  // Runs in the browser.
  capabilityBadge: "browser",
  // Nothing leaves the page.
  executionClass: ["localOnly"],
  // The API runs this same code.
  apiCapabilityClass: "local-equivalent",
  // The vector set.
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  // How hostile input is handled: every field is cut at 300 characters and read by anchored expressions; the output is a command string that is never run here, and tokens that need it are shell-quoted; a TSIG secret is never accepted (only a key file path, as the manual advises).
  dangerousInputHandling: ["bounded-parse", "generated-code-only", "never-executes", "never-fetches", "shell-escapes-output"],
  // A built command may name an internal server or a key file path: share with care.
  shareSafetyDefault: "caution",
  // The Learn article written for it.
  learnLinks: ["learn/anatomy-of-a-dig-command-line"],
  // Tools that teach the neighbouring ideas.
  relatedTools: ["dig-output-explainer", "curl-command-builder", "ipv6"],
  // Sources, each read live on its access date.
  sources: SOURCES.map((s) => ({ ...s, status: "active" as const })),
  // Credits.
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

/** run: the registry-facing entry point. */
export function run(input: DigInput): DigResult {
  // The compute layer does the work.
  return compute(input);
}

/** The vectors (the page's Example button uses one verbatim, D-83). */
export const goldenVectors = VECTORS;
