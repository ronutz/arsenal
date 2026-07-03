// ============================================================================
// src/lib/tools/f5-dos-vector-explainer/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING AFM DoS-VECTOR EXPLAINER - a self-contained {manifest,
// run, vectors} triple. Paste security dos device-config / profile stanzas
// (or a vector name, or "vectors") and get every vector explained in the
// vendor's own one-liners with the threshold mechanics spelled out and the
// configuration cross-checked deterministically. Defensive configuration
// only: this tool explains protections and never generates traffic.
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, DOS_VECTORS } from "./golden-vectors";

export { run, VECTORS, CATEGORY_LABELS } from "./compute";
export type {
  DosResult,
  VectorInfo,
  VectorReading,
  VectorCategory,
  FieldNote,
  ToolRunResult,
} from "./compute";
export { GOLDEN_VECTOR_SET_ID, DOS_VECTORS, verifyVectors } from "./golden-vectors";
export type { DosVector } from "./golden-vectors";

/** The D-49 declarative manifest for the f5-dos-vector-explainer tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "F5 GTM, AFM & APM",
  toolSlug: "f5-dos-vector-explainer",
  canonicalAliases: [
    "dos-vector-explainer" /* pre-prefix catalogue slug; never shipped publicly */,
    "afm-dos-vectors",
    "dos-profile-explainer",
    "device-dos",
  ],
  inputDetectors: [
    {
      kind: "regex",
      pattern: "^\\s*security dos (device-config|profile)\\b",
      priority: 8,
      example: "security dos device-config dos-device-config { dos-device-vector { tcp-half-open { } } }",
    },
    {
      kind: "regex",
      pattern: "\\b(dos-device-vector|network-attack-vector|detection-threshold-pps)\\b",
      priority: 7,
      example: "detection-threshold-pps 2500",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["depth-guard", "irule-not-executed", "defensive-config-only"],
  shareSafetyDefault: "fragment", // DoS thresholds describe a defense posture

  // -- Teaching & provenance --
  learnLinks: ["learn/bigip-syn-flood-protection", "learn/bigip-connection-eviction-policies"],
  relatedTools: ["f5-tmsh-config-explainer", "f5-gslb-decision-flow"],
  sources: [
    {
      id: "tmsh-dos-device-config",
      label: "F5 TMSH Reference: security dos device-config (the vector-types table with per-vector descriptions and db tunables; the threshold parameter semantics; floor/ceiling; simulate scoping)",
      type: "vendor-docs",
      url: "https://clouddocs.f5.com/cli/tmsh-reference/v13/modules/security/security_dos_device-config.html",
      access_date: "2026-07-03",
      scope: "the curated catalogue's names and descriptions verbatim; the 1-minute/1-hour threshold semantics; the hardware rate-limit statement; bad-actor and blacklisting attributes",
      status: "active",
    },
    {
      id: "tmsh-dos-profile",
      label: "F5 TMSH Reference: security dos profile (per-profile vector attributes: rate-threshold, rate-increase, rate-limit, state, per-source and per-destination controls, scrubbing defaults)",
      type: "vendor-docs",
      url: "https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/security/security_dos_profile.html",
      access_date: "2026-07-03",
      scope: "the profile-context attribute names the parser and inversion check map",
      status: "active",
    },
    {
      id: "f5-ddos-training-auto-threshold",
      label: "F5 DDoS training labs: auto-thresholding behavior (detection thresholds adjust to observed traffic; mitigation limits are always stress-driven; anomalies without stress alert but do not block)",
      type: "vendor-docs",
      url: "https://clouddocs.f5.com/training/community/ddos/html/class1/module1/lab6.html",
      access_date: "2026-07-03",
      scope: "the automatic-mode explanation the auto-threshold observation quotes",
      status: "active",
    },
    {
      id: "devcentral-syncookie-logs",
      label: "F5 DevCentral: SYN Cookie Troubleshooting - Logs (AFM Device DoS precedence over the LTM global SYN cookie; the mitigation-below-detection warning and its silent-drop consequence)",
      type: "vendor-community",
      url: "https://community.f5.com/kb/technicalarticles/9-syn-cookie-troubleshooting-logs/279431",
      access_date: "2026-07-03",
      scope: "the tcp-half-open interplay notes and the inversion observation's operational consequence",
      status: "active",
    },
  ],
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

export const goldenVectors = DOS_VECTORS;
