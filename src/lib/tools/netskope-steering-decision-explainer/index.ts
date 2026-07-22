// ============================================================================
// src/lib/tools/netskope-steering-decision-explainer/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING NETSKOPE STEERING DECISION EXPLAINER -
// {manifest, run, vectors}. Paste-spec grammar in, documented decision walk
// out: STEERED / BYPASSED / BLOCKED / DIRECT plus the why-ledger.
// Why-explainer first-class output (the T4/ZCC pattern): where the public
// docs do not publish a rule - notably cross-family exception precedence -
// the ledger says so rather than inventing one. API-included
// (local-equivalent), matching its ZCC sibling. Paired article:
// learn/netskope-steering-methods.
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, STEERING_VECTORS } from "./golden-vectors";

export { run, parseSpec } from "./compute";
export type { SteeringDecision, LedgerStep, Verdict, Mode } from "./compute";
export { GOLDEN_VECTOR_SET_ID, STEERING_VECTORS, verifyVectors } from "./golden-vectors";
export type { SteeringVector } from "./golden-vectors";

/** The D-49 declarative manifest for the netskope-steering-decision-explainer. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Netskope",
  toolSlug: "netskope-steering-decision-explainer",
  canonicalAliases: ["steering-decision", "netskope-steering", "steering-explainer"],
  inputDetectors: [
    {
      kind: "regex",
      pattern: "^\\s*(mode|dynamic|location|tunnel|fail-close|flow)\\s*:",
      priority: 3,
      example: "mode: web",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["line-anchored-errors", "strict-key-grammar", "40-line-cap", "match-must-be-configured"],
  shareSafetyDefault: "review", // specs may name internal hosts/apps

  // -- Teaching & provenance --
  learnLinks: [
    "learn/netskope-steering-methods",
    "learn/netskope-inline-tls-decryption",
    "learn/netskope-client-deployment",
  ],
  sources: [
    {
      id: "ns-steering-profile",
      label: "Netskope docs: Configure a Steering Profile - the three traffic modes and their audiences; RFC1918 always bypassed by default; the Netskope-maintained cert-pinned bypass list",
      type: "vendor-doc",
      url: "https://docs.netskope.com/en/configure-a-steering-profile",
      access_date: "2026-07-22",
      scope: "traffic modes (Cloud Apps Only / Web Traffic / All Traffic), default bypasses, exception surface",
      status: "active",
    },
    {
      id: "ns-steering-config",
      label: "Netskope docs: Creating a Steering Configuration - Fail Close behavior (domain/IP/cert-pinned exceptions applied, category exceptions blocked); the non-standard-port-accessed-by-IP pitfall and its FQDN+IP remedy",
      type: "vendor-doc",
      url: "https://docs.netskope.com/en/creating-a-steering-configuration",
      access_date: "2026-07-22",
      scope: "Fail Close split, non-standard web ports, dynamic-toggle exception-loss warning",
      status: "active",
    },
    {
      id: "ns-dynamic-steering",
      label: "Netskope docs: Enabling Dynamic Steering - On-Premises Detection Profiles, per-location traffic modes including None (no tunnel, exceptions not processed), per-location firewall/category exception sets",
      type: "vendor-doc",
      url: "https://docs.netskope.com/en/enabling-dynamic-steering",
      access_date: "2026-07-22",
      scope: "dynamic steering semantics",
      status: "active",
    },
    {
      id: "ns-cert-pinned",
      label: "Netskope docs: Certificate Pinned Applications - per-profile exception actions including Steer and decrypt at Netskope Cloud",
      type: "vendor-doc",
      url: "https://docs.netskope.com/en/certificate-pinned-applications",
      access_date: "2026-07-22",
      scope: "cert-pinned exception actions and the steer-and-decrypt opt-in",
      status: "active",
    },
  ],
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

export const goldenVectors = STEERING_VECTORS;
