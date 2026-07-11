// ============================================================================
// src/lib/tools/f5xc-tls-security-level-mapper/index.ts
// ----------------------------------------------------------------------------
// THE F5XC TLS SECURITY-LEVEL MAPPER - a {manifest, run, vectors} triple.
// Forward (level -> versions + ciphers) and reverse (cipher -> levels), from
// F5's verbatim TLS Reference table. Pure and offline.
// ============================================================================

import { run } from "./compute";
import { GOLDEN_VECTOR_SET_ID } from "./golden-vectors";

export { forwardLevel, reverseLookup, run, CIPHERS, LEVEL_TLS } from "./compute";
export type { Level, Strength, CipherEntry, MapperResult, ForwardResult, ReverseResult, ReverseMatch } from "./compute";
export { GOLDEN_VECTOR_SET_ID, verifyVectors, goldenVectors } from "./golden-vectors";

export { run as default };

export const manifest = Object.freeze({
  toolFamily: "F5 Distributed Cloud (XC)",
  toolSlug: "f5xc-tls-security-level-mapper",
  canonicalAliases: ["xc-tls-levels", "f5xc-cipher-mapper", "xc-tls-security-level", "f5xc-tls-ciphers", "distributed-cloud-tls-levels"],
  inputDetectors: [],

  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["bounded-parse"],
  shareSafetyDefault: "param",

  learnLinks: ["learn/f5xc-tls-security-levels-explained"],
  sources: [
    {
      id: "xc-tls-reference",
      label: "F5 Distributed Cloud: TLS Reference (predefined security levels and cipher suites)",
      type: "docs",
      url: "https://docs.cloud.f5.com/docs-v2/web-app-and-api-protection/reference/tls-reference",
      access_date: "2026-07-11",
      scope: "the verbatim cipher table: Default/High (min TLS 1.2), Medium and Low (min TLS 1.0), all max TLS 1.3, cumulative",
      status: "active",
    },
    {
      id: "xc-create-tcp-lb",
      label: "F5 Distributed Cloud: Create TCP Load Balancer (TLS security level semantics)",
      type: "docs",
      url: "https://docs.cloud.f5.com/docs-v2/multi-cloud-app-connect/how-to/load-balance/create-tcp-load-balancer",
      access_date: "2026-07-11",
      scope: "High = TLS 1.2 + PFS + strong; Medium = TLS 1.0 + PFS + medium; Low = TLS 1.0 + non-PFS + weak",
      status: "active",
    },
    {
      id: "k000148226",
      label: "F5 K000148226: Why is TLSv1.0/1.1 enabled for F5 XC HTTP LB",
      type: "kb",
      url: "https://my.f5.com/manage/s/article/K000148226",
      access_date: "2026-07-11",
      scope: "TLS 1.0/1.1 appears when a lower level (Medium/Low, min TLS 1.0) is selected; the Default/High level is min TLS 1.2",
      status: "active",
    },
    {
      id: "k000148079",
      label: "F5 K000148079: Weak ciphers presented by Load Balancer",
      type: "kb",
      url: "https://my.f5.com/manage/s/article/K000148079",
      access_date: "2026-07-11",
      scope: "the Low level presents non-PFS static-RSA ciphers that scanners flag as weak",
      status: "active",
    },
  ],
  credits: [
    { handle: "f5-docs", display_name: "F5 Distributed Cloud documentation", role: "reference", public: true },
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});
