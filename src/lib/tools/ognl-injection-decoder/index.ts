// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/ognl-injection-decoder/index.ts
// ----------------------------------------------------------------------------
// OGNL INJECTION DECODER — a {manifest, run, vectors} triple.
//
// Reads an OGNL payload already found in a log and explains what it was trying
// to do: which constructs are present, whether they amount to a sandbox escape,
// an execution attempt, both, or neither, and which published advisory family
// the shape is consistent with.
//
// DECODE-ONLY (D-49, zero egress). It reads what you paste. It never fetches,
// never evaluates any part of the input, and holds no payload templates - so it
// cannot be turned into a generator by anyone reading the source for ideas.
// ============================================================================

import { decodeOgnl } from "./compute";
import { SET_ID, verifyVectors } from "./golden-vectors";

export { decodeOgnl } from "./compute";
export type { Finding, AdvisoryMatch, DecodeResult } from "./compute";
export { SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest for the ognl-injection-decoder tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Security & WAF",
  toolSlug: "ognl-injection-decoder",
  canonicalAliases: [
    "ognl-decoder",
    "struts-ognl-payload",
    "ognl-payload-explainer",
    "waf-ognl-log",
    "expression-language-injection",
  ],
  inputDetectors: [
    { kind: "regex", pattern: "%\\{[^}]*#_memberAccess", priority: 9, example: '%{(#_memberAccess["allowStaticMethodAccess"]=true)}' },
    { kind: "regex", pattern: "@java\\.lang\\.Runtime@getRuntime", priority: 8, example: '%{@java.lang.Runtime@getRuntime().exec("id")}' },
    { kind: "regex", pattern: "%\\{[\\s\\S]*\\}", priority: 4, example: "%{1+1}" },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: SET_ID,
  dangerousInputHandling: ["bounded-parse", "never-evaluates", "never-fetches", "no-payload-templates"],
  // A pasted payload is somebody's live attack traffic and the surrounding log
  // line can carry internal hostnames and identifiers -> never share raw input.
  shareSafetyDefault: "never",

  // -- Teaching & provenance --
  learnLinks: ["learn/ognl-injection-in-waf-logs", "glossary/ognl"],
  sources: [
    { id: "apache-s2-045", label: "Apache Struts security bulletin S2-045 (CVE-2017-5638): remote code execution via the Jakarta multipart parser", url: "https://cwiki.apache.org/confluence/display/WW/S2-045" },
    { id: "apache-s2-057", label: "Apache Struts security bulletin S2-057 (CVE-2018-11776): possible RCE when namespace and result values are evaluated", url: "https://cwiki.apache.org/confluence/display/WW/S2-057" },
    { id: "ognl-language-guide", label: "Apache Commons OGNL language guide: expression syntax and static method access", url: "https://commons.apache.org/proper/commons-ognl/language-guide.html" },
  ],
});

/** Tool entry point. Deterministic; delegates to the pure, decode-only engine. */
export function run(input: string) {
  return decodeOgnl(input);
}

export const __selftest = verifyVectors;
