// ============================================================================
// src/lib/tools/f5-bigip-license-explainer/compute.ts
// ----------------------------------------------------------------------------
// THE BIG-IP LICENSE EXPLAINER ENGINE - a pure, deterministic, decode-only
// parser for /config/bigip.license contents (full file or any fragment).
//
// GROUND TRUTH. The line grammar below is derived from two real-world,
// sanitized license files provided by the site author from lab systems on
// 2026-07-03: one managed by BIG-IQ License Manager ("BIG-IQ Product License
// File" header, Licensed version 5.3.0) and one licensed directly on the
// BIG-IP ("BIG-IP System License Key File" header, Licensed version 13.0.0).
// Field meanings are grounded in F5's published documentation:
//   * F5 K7727  - the Service Check Date semantics and the per-version
//                 License Check Date table (consumed via the sibling
//                 f5-service-check-date engine, which vendors that table);
//   * F5 K3782 / K000160443 - the license field set (Registration Key,
//                 Licensed date, Service Check Date, Platform ID, Licensed
//                 version) and the /config/bigip.license location;
//   * F5 K7752  - the 27-character base registration key and the add-on
//                 (per-module) key model;
//   * F5 K42091606 - Exclusive_version fields on VE licenses define the
//                 permitted software range;
//   * F5 K02011230 - Z100-family platform IDs belong to BIG-IP VE.
//
// OBSERVED GRAMMAR (verified programmatically against both samples):
//   * comment lines start with "#" (including decorative section headers);
//   * data lines are "<key> : <value>" with flexible space padding; keys may
//     contain spaces ("active module", "Registration Key", "Auth vers") or be
//     snake_case feature tokens ("perf_VE_cores", "mod_ltm");
//   * "active module" value is pipe-separated: the module display name, then
//     that module's 7-7 key, then its feature names; commas are legal INSIDE
//     any segment ("BIG-IP, VE, LAB", "SSL, 500 TPS Per Core"), so the pipe -
//     never the comma - is the separator. A file may carry SEVERAL active
//     module lines, each with its own key (observed: two in the direct file);
//   * "optional module" lines carry a name only (licensable but dormant);
//   * "Exclusive_version", "Deny_version", and "Exclusive_Platform" repeat,
//     one value per line (globs like "13.*.*", platform IDs like "Z100x");
//   * token values observed: "enabled" AND "enable", "UNLIMITED" AND
//     "unlimited", plain integers, and free text - all are normalized;
//   * date lines observed: "Licensed date" and "Service check date", both in
//     compact yyyymmdd. "License start" / "License end" / "Appliance SN" were
//     ABSENT from both samples, so they are parsed when present but must be
//     treated as optional (the tmsh view in K3782/K000160443 shows start/end
//     fields, so licenses that carry them exist);
//   * BIG-IQ management is signalled by the "BIG-IQ Product License File"
//     header and the license_manager_key / pool_license_information fields;
//   * Dossier / Authorization / license_manager_key / pool_license_information
//     are cryptographic validation material: the engine records presence and
//     length ONLY and never echoes their contents.
//
// DETERMINISM & SAFETY. No clock, no network: the K7727 verdict comes from the
// sibling engine's vendored table, so the same paste always yields the same
// answer. Every regex is per-line, anchored or fixed-width, with no nested
// quantifiers - linear scans, ReDoS-safe. Decode-only: nothing is validated
// against a live system and nothing is transmitted.
// ============================================================================

import {
  lookupByDate,
  parseServiceCheckDate,
  type DateLookupResult,
} from "../f5-service-check-date/compute";

// ----------------------------------------------------------------------------
// Errors
// ----------------------------------------------------------------------------

export type BigipLicenseErrorCode = "empty" | "notRecognized";

export class BigipLicenseError extends Error {
  code: BigipLicenseErrorCode;
  constructor(code: BigipLicenseErrorCode, message?: string) {
    super(message ?? code);
    this.name = "BigipLicenseError";
    this.code = code;
  }
}

// ----------------------------------------------------------------------------
// Result shapes
// ----------------------------------------------------------------------------

/** A license date in both display and file-compact forms. */
export interface LicenseDate {
  iso: string; // yyyy-mm-dd
  compact: string; // yyyymmdd (the form the file itself uses)
}

/** One "active module" line: name | key | features... (pipe-separated). */
export interface ActiveModule {
  /** Module display name (first pipe segment; commas are part of the name). */
  name: string;
  /** The module's own 7-7 key (second segment), or null if absent/odd-shaped. */
  key: string | null;
  /** True when the second segment matched the observed 7-7 key shape. */
  keyShapeValid: boolean;
  /** Feature names (remaining segments, order preserved). */
  features: string[];
}

/** A normalized feature/limit token line ("perf_VE_cores : 8" etc). */
export interface LicenseToken {
  key: string;
  /** The raw value exactly as written. */
  raw: string;
  /**
   * Normalized kind: "enabled" covers both observed spellings (enabled /
   * enable); "unlimited" covers UNLIMITED / unlimited; "number" is a plain
   * integer (parsed into `number`); anything else stays "text".
   */
  kind: "enabled" | "disabled" | "unlimited" | "number" | "text";
  number?: number;
}

/** Cryptographic validation material: presence + length only, never echoed. */
export interface ValidationMaterial {
  present: boolean;
  length: number;
}

/** The full decoded license. Absent fields are null / empty arrays. */
export interface ParsedBigipLicense {
  /** Management flavor, detected from the header + BIG-IQ-only fields. */
  flavor: "bigiq-managed" | "direct" | "unknown";
  /** The header comment title line, e.g. "BIG-IP System License Key File". */
  headerTitle: string | null;
  authVers: string | null;
  usage: string | null;
  vendor: string | null;
  /** The base registration key; shape checked against the 5-5-5-5-7 pattern
   *  (27 characters, per F5 K7752 / K3782). */
  registrationKey: { value: string; shapeValid: boolean } | null;
  licensedVersion: string | null;
  /** Platform ID with a conservative decode (null when not in the map). */
  platformId: { id: string; decoded: string | null } | null;
  applianceSN: string | null;
  licensedDate: LicenseDate | null;
  /** The "Service Status" free-text line, when present. F5 K42091606 shows it
   *  appearing under Licensing Information when there is no active service
   *  contract ("As of YYYY-MM-DD there is no active service contract...").  */
  serviceStatus: string | null;
  /** Service check date plus the K7727 upgrade-eligibility verdict computed
   *  by the sibling f5-service-check-date engine. */
  serviceCheckDate: (LicenseDate & { k7727: DateLookupResult }) | null;
  licenseStart: LicenseDate | null;
  licenseEnd: LicenseDate | null;
  activeModules: ActiveModule[];
  optionalModules: string[];
  tokens: LicenseToken[];
  exclusiveVersions: string[];
  /** The highest BIG-IP-style Exclusive_version entry (major >= 9), or null.
   *  Per F5 K42091606, the permitted BIG-IP range is read from these entries;
   *  the same article's own example also lists low entries (5.*.* to 8.*.*)
   *  that sit below the K7727 table's floor (9.2.0) and are NOT counted when
   *  reading the BIG-IP ceiling. The ceiling maps to a Version Plus SKU
   *  generation (F5 K15643; e.g. 11.6.0-16.x is the V16 range per K000152695). */
  bigipVersionCeiling: string | null;
  denyVersions: string[];
  exclusivePlatforms: string[];
  validation: {
    dossier: ValidationMaterial;
    authorization: ValidationMaterial;
    licenseManagerKey: ValidationMaterial;
    poolLicenseInformation: ValidationMaterial;
    certificateAuth: string | null;
  };
  stats: {
    totalLines: number;
    commentLines: number;
    kvLines: number;
    unrecognizedLines: number;
  };
  /** True when the text carried enough license markers to explain at all. */
  recognized: boolean;
}

// ----------------------------------------------------------------------------
// Shapes & maps
// ----------------------------------------------------------------------------

// Base registration key: 5-5-5-5-7 alphanumeric groups (27 characters plus
// dashes). Shape per F5 K7752 ("27-character string") and the K3782 sample
// (J1744-76883-90149-96395-1680471). Anchored, fixed-width -> linear.
const REG_KEY_RE = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{7}$/;

// Per-module (add-on) key: 7-7 groups, observed on every active-module line in
// both samples and matching the tmsh "(YYYYYYY-YYYYYYY)" rendering.
const MODULE_KEY_RE = /^[A-Z0-9]{7}-[A-Z0-9]{7}$/;

// A data line: "<key> : <value>". The key is everything before the first
// colon, trimmed; observed keys never contain a colon and values in the wild
// (names, globs, base64, hex) never need one preserved on the key side.
// Anchored, single pass -> linear.
const KV_RE = /^([^#:][^:]*?)\s*:\s*(.*?)\s*$/;

// Header title inside the leading comment block, e.g.
// "#       BIG-IP System License Key File" / "#       BIG-IQ Product License File".
const HEADER_TITLE_RE = /^#\s*(BIG-I[PQ][^#]*License[^#]*File)\s*$/i;

/**
 * Conservative Platform ID -> product decode. Every entry cites at least one
 * F5 source; anything not listed decodes to null and the UI shows the raw ID
 * with a pointer to F5 K9476 (the authoritative hardware/software matrix).
 *   * Z100 family -> BIG-IP Virtual Edition: F5 K02011230 ("Platform ID change
 *     for BIG-IP VE systems") plus the Exclusive_Platform lists observed in
 *     both sample files (Z100, Z100H, Z100K, Z100x, Z100AzureCloud, ...).
 *   * Hardware IDs -> marketing names: F5 K3782's own example pairs D106 with
 *     the BIG-IP 8900; the remaining pairs are from F5's EUD platform notes
 *     (techdocs.f5.com), cross-referenced with K9476.
 */
const PLATFORM_ID_MAP: ReadonlyArray<{ match: RegExp; name: string }> = [
  { match: /^Z100/i, name: "BIG-IP Virtual Edition (VE)" },
  { match: /^D106$/i, name: "BIG-IP 8900" },
  { match: /^C112$/i, name: "BIG-IP 2000 series" },
  { match: /^C113$/i, name: "BIG-IP 4000 series" },
  { match: /^C109$/i, name: "BIG-IP 5000 series" },
  { match: /^D110$/i, name: "BIG-IP 7000 series" },
  { match: /^D112$/i, name: "BIG-IP 10000 series" },
  { match: /^D113$/i, name: "BIG-IP 10000 series" },
];

/** Decode a Platform ID to a product name, or null when not in the map. */
export function decodePlatformId(id: string): string | null {
  for (const entry of PLATFORM_ID_MAP) {
    if (entry.match.test(id)) return entry.name;
  }
  return null;
}

// ----------------------------------------------------------------------------
// Small parsers
// ----------------------------------------------------------------------------

/** Parse a license date value (compact yyyymmdd; tolerant of dashed/slashed
 *  forms via the sibling's validated date parser). Returns null on garbage
 *  rather than throwing: a single odd date line should not sink a whole file. */
function parseLicenseDate(value: string): LicenseDate | null {
  try {
    const p = parseServiceCheckDate(value);
    return { iso: p.iso, compact: p.compact };
  } catch {
    return null;
  }
}

/** Parse one "active module" pipe-grammar value (see header for evidence). */
export function parseActiveModuleLine(value: string): ActiveModule {
  const segments = value.split("|").map((s) => s.trim()).filter((s) => s.length > 0);
  const name = segments[0] ?? "";
  let key: string | null = null;
  let keyShapeValid = false;
  let features: string[] = [];
  if (segments.length > 1) {
    if (MODULE_KEY_RE.test(segments[1])) {
      key = segments[1];
      keyShapeValid = true;
      features = segments.slice(2);
    } else {
      // Odd second segment: keep it as a feature rather than losing it.
      features = segments.slice(1);
    }
  }
  return { name, key, keyShapeValid, features };
}

/** Normalize a token value into its kind (see LicenseToken for the variants
 *  observed in the samples: enabled/enable, UNLIMITED/unlimited, integers). */
function classifyToken(key: string, raw: string): LicenseToken {
  if (/^enabled?$/i.test(raw)) return { key, raw, kind: "enabled" };
  if (/^disabled?$/i.test(raw)) return { key, raw, kind: "disabled" };
  if (/^unlimited$/i.test(raw)) return { key, raw, kind: "unlimited" };
  if (/^\d+$/.test(raw)) return { key, raw, kind: "number", number: Number(raw) };
  return { key, raw, kind: "text" };
}

// ----------------------------------------------------------------------------
// The parser
// ----------------------------------------------------------------------------

/**
 * Parse pasted bigip.license contents (full file or fragment) into the
 * structured, explainable form above. Pure and total: never throws; the
 * `recognized` flag says whether enough license markers were present.
 */
export function parseBigipLicense(text: string): ParsedBigipLicense {
  const out: ParsedBigipLicense = {
    flavor: "unknown",
    headerTitle: null,
    authVers: null,
    usage: null,
    vendor: null,
    registrationKey: null,
    licensedVersion: null,
    platformId: null,
    applianceSN: null,
    licensedDate: null,
    serviceStatus: null,
    serviceCheckDate: null,
    licenseStart: null,
    licenseEnd: null,
    activeModules: [],
    optionalModules: [],
    tokens: [],
    exclusiveVersions: [],
    bigipVersionCeiling: null,
    denyVersions: [],
    exclusivePlatforms: [],
    validation: {
      dossier: { present: false, length: 0 },
      authorization: { present: false, length: 0 },
      licenseManagerKey: { present: false, length: 0 },
      poolLicenseInformation: { present: false, length: 0 },
      certificateAuth: null,
    },
    stats: { totalLines: 0, commentLines: 0, kvLines: 0, unrecognizedLines: 0 },
    recognized: false,
  };

  let sawInstallLine = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0) continue;
    out.stats.totalLines++;

    // ---- comments: count, and mine the header title / install hint ----
    if (line.startsWith("#")) {
      out.stats.commentLines++;
      if (out.headerTitle === null) {
        const h = HEADER_TITLE_RE.exec(line);
        if (h) out.headerTitle = h[1].trim();
      }
      // The direct-license header carries an explicit install path line
      // ('Install this file as "/config/bigip.license".'); a useful direct-
      // flavor signal when BIG-IQ markers are absent.
      if (/Install this file as/i.test(line)) sawInstallLine = true;
      continue;
    }

    // ---- key/value lines ----
    const m = KV_RE.exec(line);
    if (!m) {
      out.stats.unrecognizedLines++;
      continue;
    }
    out.stats.kvLines++;
    const key = m[1];
    const value = m[2];
    const keyLc = key.toLowerCase();

    switch (keyLc) {
      case "active module":
        out.activeModules.push(parseActiveModuleLine(value));
        continue;
      case "optional module":
        out.optionalModules.push(value);
        continue;
      case "exclusive_version":
        out.exclusiveVersions.push(value);
        continue;
      case "deny_version":
        out.denyVersions.push(value);
        continue;
      case "exclusive_platform":
        out.exclusivePlatforms.push(value);
        continue;
      case "registration key":
        out.registrationKey = { value, shapeValid: REG_KEY_RE.test(value) };
        continue;
      case "licensed version":
        out.licensedVersion = value;
        continue;
      case "platform id":
        out.platformId = { id: value, decoded: decodePlatformId(value) };
        continue;
      case "appliance sn":
        out.applianceSN = value;
        continue;
      case "usage":
        out.usage = value;
        continue;
      case "vendor":
        out.vendor = value;
        continue;
      case "auth vers":
        out.authVers = value;
        continue;
      case "certificate_auth":
        out.validation.certificateAuth = value;
        continue;
      case "licensed date":
        out.licensedDate = parseLicenseDate(value);
        continue;
      case "service status":
        // Free text; kept verbatim (K42091606 quotes the no-contract wording).
        out.serviceStatus = value;
        continue;
      case "license start":
        out.licenseStart = parseLicenseDate(value);
        continue;
      case "license end":
        out.licenseEnd = parseLicenseDate(value);
        continue;
      case "service check date": {
        const d = parseLicenseDate(value);
        // The K7727 verdict reuses the sibling engine's vendored table; a
        // garbage date simply leaves the field null (decode-only tolerance).
        out.serviceCheckDate = d ? { ...d, k7727: lookupByDate(d.compact) } : null;
        continue;
      }
      // ---- validation material: record presence + length, never the value ----
      case "dossier":
        out.validation.dossier = { present: true, length: value.length };
        continue;
      case "authorization":
        out.validation.authorization = { present: true, length: value.length };
        continue;
      case "license_manager_key":
        out.validation.licenseManagerKey = { present: true, length: value.length };
        continue;
      case "pool_license_information":
        out.validation.poolLicenseInformation = { present: true, length: value.length };
        continue;
      default:
        // Feature/limit tokens: snake_case-ish keys with no spaces
        // (perf_VE_cores, mod_ltm, gtm_rate_limit, waf_gc, ...).
        if (/^[A-Za-z][A-Za-z0-9_]*$/.test(key)) {
          out.tokens.push(classifyToken(key, value));
        } else {
          out.stats.unrecognizedLines++;
        }
        continue;
    }
  }

  // ---- flavor: BIG-IQ markers win; then the direct-file header signals ----
  const bigiq =
    out.validation.licenseManagerKey.present ||
    out.validation.poolLicenseInformation.present ||
    (out.headerTitle !== null && /BIG-IQ/i.test(out.headerTitle));
  if (bigiq) {
    out.flavor = "bigiq-managed";
  } else if ((out.headerTitle !== null && /BIG-IP/i.test(out.headerTitle)) || sawInstallLine) {
    out.flavor = "direct";
  }

  // ---- BIG-IP ceiling from the Exclusive_version entries (see field doc) ----
  {
    let best: { glob: string; major: number; minor: number } | null = null;
    for (const glob of out.exclusiveVersions) {
      const gm = /^(\d+)\.(\d+|\*)/.exec(glob);
      if (!gm) continue;
      const major = Number(gm[1]);
      if (major < 9) continue; // below the K7727 BIG-IP floor: not a BIG-IP entry
      const minor = gm[2] === "*" ? 999 : Number(gm[2]); // "*" outranks any digit
      if (!best || major > best.major || (major === best.major && minor > best.minor)) {
        best = { glob, major, minor };
      }
    }
    out.bigipVersionCeiling = best ? best.glob : null;
  }

  // ---- recognized: enough license markers to be worth explaining ----
  out.recognized =
    out.registrationKey !== null ||
    out.serviceCheckDate !== null ||
    out.activeModules.length > 0 ||
    out.headerTitle !== null;

  return out;
}

/**
 * run - the registry-facing entry point. Throws BigipLicenseError("empty") on
 * blank input and ("notRecognized") when the text carries no license markers;
 * otherwise returns the full decode. The UI catches and localizes the errors.
 */
export function run(input: string): ParsedBigipLicense {
  const trimmed = input.trim();
  if (trimmed === "") throw new BigipLicenseError("empty", "no input");
  const parsed = parseBigipLicense(trimmed);
  if (!parsed.recognized) {
    throw new BigipLicenseError("notRecognized", "no bigip.license markers found");
  }
  return parsed;
}
