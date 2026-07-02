// ============================================================================
// src/lib/tools/f5-service-check-date/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING F5 SERVICE-CHECK-DATE MODULE - a self-contained
// {manifest, run, vectors} triple, mirroring the cipher / tmsh-config reference
// modules. The engine is a deterministic two-way lookup over a vendored copy of
// F5's authoritative License Check Date table (registry-data.ts, transcribed
// from F5 K7727), so its golden vectors are stable and it runs entirely client-
// side (no network, no clock).
//
// Because this tool encodes VENDOR DOCUMENTATION (which changes with each BIG-IP
// release) rather than a stable standard, it also carries a vendor-documentation
// disclaimer, surfaced through the provenance panel (src/config/toolProvenance.ts):
// the value is only as current as the vendored K7727 snapshot, and production
// upgrade planning must re-verify against K7727 or the target system's
// /etc/version_date. The manifest's `sources` cite K7727 (the table + rules) and
// K8986 (the version-schema definitions that fix the upgrade-vs-update boundary).
// ============================================================================

import { run, type LookupResult } from "./compute";
import {
  GOLDEN_VECTOR_SET_ID,
  SERVICE_CHECK_GOLDEN_VECTORS,
  SERVICE_CHECK_REJECT_VECTORS,
} from "./golden-vectors";

// Re-export the compute surface + vector metadata at the module boundary.
export {
  run,
  lookupByVersion,
  lookupByDate,
  parseVersion,
  parseServiceCheckDate,
  ServiceCheckError,
} from "./compute";
export type {
  LookupResult,
  VersionLookupResult,
  DateLookupResult,
  ParsedVersion,
  ParsedDate,
  ServiceCheckErrorCode,
} from "./compute";
export {
  GOLDEN_VECTOR_SET_ID,
  SERVICE_CHECK_GOLDEN_VECTORS,
  SERVICE_CHECK_REJECT_VECTORS,
  verifyVectors,
} from "./golden-vectors";
export {
  LICENSE_CHECK_TABLE,
  TABLE_PROVENANCE,
  ANY_PATCH,
  type LicenseCheckEntry,
} from "./registry-data";

/** The D-49 declarative manifest for the F5 service-check-date tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "F5 LTM, iRules & platform",
  toolSlug: "f5-service-check-date",
  canonicalAliases: [
    "service-check-date",
    "bigip-service-check-date",
    "f5-license-check-date",
    "license-check-date",
    "version-date",
  ],
  inputDetectors: [
    {
      // A service check date in the bigip.license compact form or an ISO-ish
      // date. Anchored + fixed-width, so linear and ReDoS-safe.
      kind: "regex",
      pattern: "^\\s*\\d{4}([-/]?)\\d{2}\\1\\d{2}\\s*$",
      priority: 8,
      example: "20230611",
    },
    {
      // A BIG-IP version (major.minor with optional patch / "x"). Anchored,
      // single-quantifier per field.
      kind: "regex",
      pattern: "^\\s*(?:big-ip\\s+|v)?\\d{1,2}\\.\\d{1,2}(?:\\.(?:\\d{1,3}|x))?\\s*$",
      priority: 7,
      example: "17.1.3",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser", // runs client-side
  executionClass: ["localOnly"], // pure local lookup over a vendored table; no network, no clock
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["redos-guard"], // anchored, linear detectors + parsers
  shareSafetyDefault: "param", // a version or a service check date is non-sensitive

  // -- Teaching & provenance --
  learnLinks: [
    "learn/bigip-service-check-date",
    "learn/bigip-upgrade-vs-update",
    "learn/bigip-license-reactivation",
  ],
  sources: [
    {
      id: "f5-k7727",
      label:
        "F5 K7727 - License activation may be required before a software upgrade for BIG-IP",
      type: "vendor-doc",
      url: "https://my.f5.com/manage/s/article/K7727",
      access_date: "2026-07-01",
      scope:
        "the per-version License Check Date table, the Service Check Date definition (earlier of last activation / contract expiry), and the enforcement behaviour on upgrade and startup",
      status: "active",
    },
    {
      id: "f5-k8986",
      label: "F5 K8986 - F5 product support policies",
      type: "vendor-doc",
      url: "https://my.f5.com/manage/s/article/K8986",
      access_date: "2026-07-01",
      scope:
        "BIG-IP version schema: the major / minor / maintenance / point-release definitions that fix the upgrade-vs-update boundary the gate applies to",
      status: "active",
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});

/**
 * run - the registry-facing entry point. Auto-detects the input: a date routes
 * to the reachable-versions lookup, a version routes to the minimum-service-
 * check-date lookup. Throws ServiceCheckError (empty / format / unknownVersion),
 * which the UI catches and localizes.
 * @param input a service check date (yyyymmdd / yyyy-mm-dd / yyyy/mm/dd) or a BIG-IP version
 * @returns the two-way lookup result
 */
export function runTool(input: string): LookupResult {
  return run(input);
}

// Vectors, exposed by the conventional names the golden-vector runner expects.
export const goldenVectors = SERVICE_CHECK_GOLDEN_VECTORS;
export const rejectVectors = SERVICE_CHECK_REJECT_VECTORS;
