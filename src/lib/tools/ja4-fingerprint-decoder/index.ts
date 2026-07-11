// ============================================================================
// src/lib/tools/ja4-fingerprint-decoder/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING JA4 TLS FINGERPRINT DECODER - a self-contained
// {manifest, run, vectors} triple. Decode a JA4 fingerprint into its transport,
// TLS version, SNI, cipher/extension counts and ALPN, or compute the hashed JA4
// from a raw, unhashed fingerprint. Bounded, offline, computes what it shows.
// ============================================================================

import type { Ja4Result, AnalyzeResult } from "./compute";
import { GOLDEN_VECTOR_SET_ID } from "./golden-vectors";

export {
  decodeJa4,
  run,
  analyze,
  computeCipherHash,
  computeExtensionHash,
  computeJa3,
  alpnMarker,
  PROTOCOLS,
  TLS_VERSIONS,
  ALPN_LABELS,
  JA3_SSL_VERSIONS,
} from "./compute";
export type { Ja4Result, Ja4Part, Ja4Mode, Ja3Result, AnalyzeResult } from "./compute";
export { GOLDEN_VECTOR_SET_ID, verifyVectors, goldenVectors } from "./golden-vectors";

/** The D-49 declarative manifest for the ja4-fingerprint-decoder tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Protocol & packet decoders",
  toolSlug: "ja4-fingerprint-decoder",
  canonicalAliases: ["ja4-decoder", "ja4-fingerprint", "tls-client-fingerprint", "ja4-explainer", "passive-tls-fingerprint"],
  inputDetectors: [
    {
      kind: "regex",
      // JA4_a "_" 12hex "_" 12hex  (the hashed a_b_c form)
      pattern: "^[tqd][a-z0-9]{2}[di]\\d{4}..(_[0-9a-f]{12}){2}$",
      priority: 8,
      example: "t13d1516h2_8daaf6152771_e5627efa2ab1",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["bounded-parse"],
  shareSafetyDefault: "param", // a JA4 fingerprint is a non-sensitive identifier

  // -- Teaching & provenance --
  learnLinks: ["learn/what-is-a-ja4-tls-fingerprint"],
  sources: [
    {
      id: "foxio-ja4-spec",
      label: "FoxIO JA4: TLS Client Fingerprinting (technical specification)",
      type: "spec",
      url: "https://github.com/FoxIO-LLC/ja4/blob/main/technical_details/JA4.md",
      access_date: "2026-07-10",
      scope: "the JA4 algorithm, field definitions, GREASE handling, and the worked example used as golden vectors",
      status: "active",
    },
    {
      id: "foxio-ja4-repo",
      label: "FoxIO-LLC/ja4 (README and licensing)",
      type: "spec",
      url: "https://github.com/FoxIO-LLC/ja4",
      access_date: "2026-07-10",
      scope: "JA4 is BSD 3-Clause; the rest of JA4+ is FoxIO License 1.1 (no monetization)",
      status: "active",
    },
    {
      id: "tls-grease",
      label: "draft-davidben-tls-grease: Applying GREASE to TLS Extensibility",
      type: "draft",
      url: "https://datatracker.ietf.org/doc/html/draft-davidben-tls-grease-01",
      access_date: "2026-07-10",
      scope: "the GREASE reserved values that JA4 ignores",
      status: "active",
    },
  ],
  credits: [
    { handle: "foxio", display_name: "John Althouse / FoxIO", role: "algorithm author (JA4, BSD 3-Clause)", public: true },
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});

export type ToolRunResult = AnalyzeResult;
