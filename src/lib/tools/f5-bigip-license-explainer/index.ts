// ============================================================================
// src/lib/tools/f5-bigip-license-explainer/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING BIG-IP LICENSE EXPLAINER MODULE - a self-contained
// {manifest, run, vectors} triple, mirroring the f5-service-check-date
// reference module. The engine (compute.ts) is a pure, decode-only parser for
// /config/bigip.license contents whose line grammar is grounded in two real,
// sanitized lab license files (BIG-IQ-managed and directly licensed, provided
// by the site author, 2026-07-03) and whose field meanings are grounded in the
// F5 knowledge base articles cited in `sources` below. The service check date
// found in a paste is judged against F5's K7727 License Check Date table by
// REUSING the sibling f5-service-check-date engine (one vendored table, two
// consumers), so both tools always agree.
//
// Because this decodes VENDOR-DEFINED file content rather than a stable
// standard, the tool carries a vendor-documentation disclaimer (surfaced via
// src/config/toolProvenance.ts): field meanings are only as current as the
// cited articles, and licensing decisions must be confirmed against F5's own
// documentation or support.
// ============================================================================

import { run } from "./compute";
import {
  GOLDEN_VECTOR_SET_ID,
  LICENSE_GOLDEN_VECTORS,
  LICENSE_REJECT_VECTORS,
} from "./golden-vectors";

// Re-export the compute surface + vector metadata at the module boundary.
export {
  run,
  parseBigipLicense,
  parseActiveModuleLine,
  decodePlatformId,
  BigipLicenseError,
} from "./compute";
export type {
  ParsedBigipLicense,
  ActiveModule,
  LicenseToken,
  LicenseDate,
  ValidationMaterial,
  BigipLicenseErrorCode,
} from "./compute";
export {
  GOLDEN_VECTOR_SET_ID,
  LICENSE_GOLDEN_VECTORS,
  LICENSE_REJECT_VECTORS,
  FIXTURE_BIGIQ,
  FIXTURE_DIRECT,
  verifyVectors,
} from "./golden-vectors";

/** The D-49 declarative manifest for the BIG-IP license explainer. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "F5 LTM, iRules & platform",
  toolSlug: "f5-bigip-license-explainer",
  canonicalAliases: [
    "bigip-license",
    "bigip-license-explainer",
    "f5-license-explainer",
    "license-decoder",
    "bigip.license",
  ],
  inputDetectors: [
    {
      // A pasted license FILE (not just the service-check-date line): any of
      // the three strong file markers routes here, above the sibling's
      // service-check-date detector (priority 9), so a full-file paste opens
      // the explainer while a lone date line still works in either tool.
      // Fixed-word alternation with case handled via classes (detector
      // patterns compile without flags) -> linear, ReDoS-safe. Unanchored on
      // purpose: the markers sit mid-text in a paste.
      kind: "regex",
      pattern:
        "[Aa]ctive [Mm]odule\\s*:|[Rr]egistration [Kk]ey\\s*:|BIG-I[PQ] (System|Product) License",
      priority: 10,
      example: "active module :  LTM, 1 Gbps, VE|CCCCCCC-CCCCCCC|...",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser", // runs client-side
  executionClass: ["localOnly"], // pure local parse; no network, no clock
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["redos-guard"], // per-line, anchored/fixed-width patterns
  // A license carries the base registration key, per-module keys, and the
  // Dossier / Authorization signatures - credential-adjacent material that
  // must never land in a shareable URL of any kind.
  shareSafetyDefault: "ephemeral",

  // -- Teaching & provenance --
  learnLinks: ["learn/bigip-license-file-anatomy"],
  sources: [
    {
      id: "f5-k000160443",
      label: "F5 K000160443 - Understanding the output of tmsh show sys license on BIG-IP",
      type: "vendor-doc",
      url: "https://my.f5.com/manage/s/article/K000160443",
      access_date: "2026-07-03",
      scope:
        "field-by-field meaning of the license fields (Licensed On vs Service Check Date vs License End Date, Registration key, Platform ID, Licensed Version) and the /config/bigip.license file location",
      status: "active",
    },
    {
      id: "f5-k7727",
      label: "F5 K7727 - License activation may be required before a software upgrade for BIG-IP",
      type: "vendor-doc",
      url: "https://my.f5.com/manage/s/article/K7727",
      access_date: "2026-07-01",
      scope:
        "the Service Check Date definition and the per-version License Check Date table used for the upgrade-eligibility verdict (via the sibling f5-service-check-date engine)",
      status: "active",
    },
    {
      id: "f5-k3782",
      label: "F5 K3782 - Finding the serial number or registration key of your BIG-IP system",
      type: "vendor-doc",
      url: "https://my.f5.com/manage/s/article/K3782",
      access_date: "2026-07-03",
      scope:
        "the registration key sample shape (5-5-5-5-7) and the license field set as shown by tmsh",
      status: "active",
    },
    {
      id: "f5-k7752",
      label: "F5 K7752 - Licensing the BIG-IP system",
      type: "vendor-doc",
      url: "https://my.f5.com/manage/s/article/K7752",
      access_date: "2026-07-03",
      scope:
        "the 27-character base registration key and the add-on (per-module) registration key model",
      status: "active",
    },
    {
      id: "f5-k42091606",
      label: "F5 K42091606 - Determine your BIG-IP VE SKU and permitted software version range",
      type: "vendor-doc",
      url: "https://my.f5.com/manage/s/article/K42091606",
      access_date: "2026-07-03",
      scope:
        "Exclusive_version fields in bigip.license define the permitted software range for VE Version Plus licenses",
      status: "active",
    },
    {
      id: "f5-k15643",
      label: "F5 K15643 - BIG-IP VE Version Plus license offerings",
      type: "vendor-doc",
      url: "https://my.f5.com/manage/s/article/K15643",
      access_date: "2026-07-03",
      scope:
        "Version Plus semantics: the permitted-range ceiling embedded in VE SKUs, which the Exclusive_version ceiling corresponds to",
      status: "active",
    },
    {
      id: "f5-k02011230",
      label: "F5 K02011230 - Platform ID change for BIG-IP VE systems",
      type: "vendor-doc",
      url: "https://my.f5.com/manage/s/article/K02011230",
      access_date: "2026-07-03",
      scope: "Z100-family platform IDs belong to BIG-IP Virtual Edition",
      status: "active",
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});

/**
 * run - the registry-facing entry point. Parses pasted bigip.license contents
 * (full file or fragment) into the structured explanation, including the
 * K7727 upgrade-eligibility verdict for the service check date. Throws
 * BigipLicenseError (empty / notRecognized), which the UI localizes.
 * @param input pasted /config/bigip.license contents, full or partial
 * @returns the decoded license structure
 */
export function runTool(input: string) {
  return run(input);
}

// Vectors, exposed by the conventional names the golden-vector runner expects.
export const goldenVectors = LICENSE_GOLDEN_VECTORS;
export const rejectVectors = LICENSE_REJECT_VECTORS;
