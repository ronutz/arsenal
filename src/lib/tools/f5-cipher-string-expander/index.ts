// ============================================================================
// src/lib/tools/f5-cipher-string-expander/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING F5 CIPHER-STRING EXPLAINER - a self-contained {manifest, run,
// vectors} triple. Paste an F5 BIG-IP cipher string (or a pre-built rule name)
// and get its sets parsed in order, every keyword and operator explained, and
// a security read: forward secrecy, good exclusions, and weak or deprecated
// choices flagged.
//
// HONEST SCOPE: this explains the cipher string's meaning and posture. It does
// NOT reproduce the exact ordered suite list that `tmm --clientciphers` prints,
// because that list depends on the per-TMOS-version cipher database, which is
// not vendored here. Pairs with the live cipher-suite decoder.
// ============================================================================

import { run, type CipherResult } from "./compute";
import { GOLDEN_VECTOR_SET_ID, C_VECTORS } from "./golden-vectors";

export { run } from "./compute";
export type { CipherResult, CipherSet, KeywordExplain, Operator, KwCategory, Security } from "./compute";
export { GOLDEN_VECTOR_SET_ID, C_VECTORS, verifyVectors } from "./golden-vectors";
export type { CVector } from "./golden-vectors";

/** The D-49 declarative manifest for the f5-cipher-string-expander tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "TLS & transport",
  toolSlug: "f5-cipher-string-expander",
  canonicalAliases: ["f5-cipher-string-explainer", "bigip-cipher-string", "f5-cipher-rule-explainer", "tmm-cipher-string"],
  inputDetectors: [
    {
      kind: "regex",
      pattern: "^(f5-default|f5-secure|f5-ecc|f5-aes|f5-hw_keys)$",
      priority: 8,
      example: "f5-secure",
    },
    {
      kind: "regex",
      pattern: "(?:^|[:,\\s])![A-Za-z0-9_]+",
      priority: 6,
      example: "DEFAULT:!SSLv3:!RC4",
    },
    {
      kind: "regex",
      pattern: "@STRENGTH\\b",
      priority: 6,
      example: "ECDHE:RSA:@STRENGTH",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent", // for what it claims: a complete local analysis of the string itself

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["bounded-parse"],
  shareSafetyDefault: "fragment",
  notes: [
    "Explains the cipher string's keywords, operators, and security posture. It does not reproduce the exact ordered suite list, which depends on the per-TMOS-version cipher database; for that, run tmm --clientciphers on the target version.",
  ],

  // -- Teaching & provenance --
  learnLinks: ["learn/f5-cipher-string-syntax", "learn/tls-cipher-security-keywords", "learn/f5-cipher-rules-and-groups"],
  sources: [
    {
      id: "ssl-administration",
      label: "F5 BIG-IP SSL Administration: Traffic Management",
      type: "vendor-docs",
      url: "https://techdocs.f5.com/kb/en-us/products/big-ip_ltm/manuals/product/bigip-ssl-administration-13-0-0/4.html",
      access_date: "2026-06-29",
      scope: "cipher string keywords, the DEFAULT set, and tmm --clientciphers",
      status: "active",
    },
    {
      id: "cipher-rules-v13",
      label: "F5 DevCentral: Cipher Rules and Groups in BIG-IP v13",
      type: "vendor-community",
      url: "https://community.f5.com/kb/technicalarticles/cipher-rules-and-groups-in-big-ip-v13/279555",
      access_date: "2026-06-29",
      scope: "cipher rules and groups, boolean operators, and the pre-built rules",
      status: "active",
    },
    {
      id: "custom-cipher-config",
      label: "F5: Configuring a Custom Cipher String for SSL Negotiation",
      type: "vendor-docs",
      url: "https://techdocs.f5.com/kb/en-us/products/big-ip_ltm/manuals/product/ltm-custom-cipher-ssl-negotiation-configuration-13-0-0/1.html",
      access_date: "2026-06-29",
      scope: "building a cipher string from rules and groups, and F5 hardening recommendations",
      status: "active",
    },
  ],
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

export const goldenVectors = C_VECTORS;

export type ToolRunResult = CipherResult;
