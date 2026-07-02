// ============================================================================
// src/lib/tools/f5-service-check-date/compute.ts
// ----------------------------------------------------------------------------
// THE F5 SERVICE-CHECK-DATE ENGINE - pure, deterministic, two-directional.
//
// Two questions, one vendored table (registry-data.ts, transcribed from F5 K7727):
//
//   1. VERSION -> minimum service check date.
//      Given a BIG-IP version, return the License Check Date for it: the minimum
//      Service Check Date a license must carry to be allowed to boot that
//      version. (F5 K7727, "Enforcement during startup": if the service check
//      date is earlier than the license check date, the system initializes but
//      does NOT load its configuration until the license is reactivated.)
//
//   2. SERVICE CHECK DATE -> reachable versions.
//      Given a system's Service Check Date, return every version whose License
//      Check Date is on or before it (reachable) and every version whose License
//      Check Date is later (blocked - would require a license reactivation
//      first), plus the newest reachable version.
//
// GRANULARITY. The gate applies to a major/minor UPGRADE only. Per K7727, F5
// defines an upgrade as a change in the first or second version number, and an
// update (maintenance or point release within the same major.minor) does NOT
// trigger any service/license check date verification. So a version's License
// Check Date is a property of its major.minor, and all maintenance/point
// releases within it share the date.
//
// DETERMINISM. There is no device clock here: both the service check date and
// the version are inputs, and the License Check Dates are table constants.
// Dates are compared in the yyyymmdd compact form as integers (chronological ==
// numeric), so no Date object or timezone ever enters. Same input -> same output,
// which is what makes the golden vectors stable (D-49).
//
// This engine DECODES and LOOKS UP only; it never contacts a device or the F5
// license server. The vendored table is F5 documentation and may lag a brand-new
// release, so the tool carries a vendor-documentation disclaimer and production
// planning must re-verify against K7727 or the target system's /etc/version_date.
// ============================================================================

import {
  LICENSE_CHECK_TABLE,
  ANY_PATCH,
  type LicenseCheckEntry,
} from "./registry-data";

// ----------------------------------------------------------------------------
// Errors
// ----------------------------------------------------------------------------

export type ServiceCheckErrorCode = "empty" | "format" | "unknownVersion";

export class ServiceCheckError extends Error {
  code: ServiceCheckErrorCode;
  constructor(code: ServiceCheckErrorCode, message?: string) {
    super(message ?? code);
    this.name = "ServiceCheckError";
    this.code = code;
  }
}

// ----------------------------------------------------------------------------
// Result shapes
// ----------------------------------------------------------------------------

/** A parsed BIG-IP version. `patch` is 0 when the input gave only major.minor. */
export interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
  /** True when the input carried an explicit patch/maintenance component. */
  hadPatch: boolean;
}

/** VERSION -> minimum service check date. */
export interface VersionLookupResult {
  kind: "version";
  input: string;
  parsed: ParsedVersion;
  /** The matched K7727 row. */
  matched: LicenseCheckEntry;
  /** Minimum required service check date, ISO yyyy-mm-dd (== matched.dateISO). */
  minServiceCheckDateISO: string;
  /** Same, in the bigip.license compact yyyymmdd form (== matched.dateCompact). */
  minServiceCheckDateCompact: string;
  /** True when the row covers a whole major.minor (the normal, modern case). */
  isMajorMinorRow: boolean;
}

/** A parsed service check date, kept in both display and compact forms. */
export interface ParsedDate {
  iso: string; // yyyy-mm-dd
  compact: string; // yyyymmdd
}

/** SERVICE CHECK DATE -> reachable / blocked versions. */
export interface DateLookupResult {
  kind: "date";
  serviceCheckDateISO: string;
  serviceCheckDateCompact: string;
  /** Versions whose License Check Date <= the service check date (newest first). */
  reachable: LicenseCheckEntry[];
  /** Versions whose License Check Date > the service check date (newest first). */
  blocked: LicenseCheckEntry[];
  /** Highest-version reachable row, or null if none. */
  newestReachable: LicenseCheckEntry | null;
  /** Lowest-version blocked row (the nearest version that needs reactivation), or null. */
  nextBlocked: LicenseCheckEntry | null;
}

export type LookupResult = VersionLookupResult | DateLookupResult;

// ----------------------------------------------------------------------------
// Version-tuple helpers
// ----------------------------------------------------------------------------

/** Compare two [major, minor, patch] tuples: -1 if a<b, 0 if equal, 1 if a>b. */
function cmpTuple(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
): number {
  for (let i = 0; i < 3; i++) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }
  return 0;
}

/** True when version tuple v lies within a row's inclusive [lo, hi] bounds. */
function entryContains(entry: LicenseCheckEntry, v: readonly [number, number, number]): boolean {
  return cmpTuple(v, entry.lo) >= 0 && cmpTuple(v, entry.hi) <= 0;
}

// ----------------------------------------------------------------------------
// Parsing
// ----------------------------------------------------------------------------

// A BIG-IP version: optional "v" / "BIG-IP " prefix, then major.minor, an
// optional patch (a number or the literal "x"), and an optional ignored
// point-release component. Anchored and single-quantifier per field -> linear,
// ReDoS-safe.
const VERSION_RE = /^\s*(?:big-ip\s+|v)?(\d{1,2})\.(\d{1,2})(?:\.(\d{1,3}|x|X))?(?:\.\d{1,3})?\s*$/;

// Service check date in the three forms F5 shows: yyyymmdd (bigip.license),
// yyyy-mm-dd, and yyyy/mm/dd. Each anchored and fixed-width.
const DATE_COMPACT_RE = /^\s*(\d{4})(\d{2})(\d{2})\s*$/;
const DATE_DASH_RE = /^\s*(\d{4})-(\d{2})-(\d{2})\s*$/;
const DATE_SLASH_RE = /^\s*(\d{4})\/(\d{2})\/(\d{2})\s*$/;

function isLeap(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}
function daysInMonth(y: number, m: number): number {
  return [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
}

/**
 * Parse a BIG-IP version string into major/minor/patch. `patch` is 0 when the
 * input gave only major.minor or used "x"; `hadPatch` records whether an explicit
 * numeric patch was present. Throws ServiceCheckError("format") on anything that
 * is not a version.
 */
export function parseVersion(input: string): ParsedVersion {
  const m = VERSION_RE.exec(input);
  if (!m) throw new ServiceCheckError("format", "not a BIG-IP version");
  const major = Number(m[1]);
  const minor = Number(m[2]);
  const rawPatch = m[3];
  const hadPatch = rawPatch !== undefined && rawPatch.toLowerCase() !== "x";
  const patch = hadPatch ? Number(rawPatch) : 0;
  return { major, minor, patch, hadPatch };
}

/**
 * Parse a service check date in yyyymmdd, yyyy-mm-dd, or yyyy/mm/dd form into
 * both display (ISO) and compact (yyyymmdd) forms. Validates a real calendar date
 * (sane year, month 1-12, day within the month). Throws ServiceCheckError("format")
 * otherwise.
 */
export function parseServiceCheckDate(input: string): ParsedDate {
  const m = DATE_COMPACT_RE.exec(input) ?? DATE_DASH_RE.exec(input) ?? DATE_SLASH_RE.exec(input);
  if (!m) throw new ServiceCheckError("format", "not a service check date");
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (y < 1990 || y > 2100 || mo < 1 || mo > 12 || d < 1 || d > daysInMonth(y, mo)) {
    throw new ServiceCheckError("format", "not a valid calendar date");
  }
  const pad = (n: number, w: number) => String(n).padStart(w, "0");
  const iso = `${pad(y, 4)}-${pad(mo, 2)}-${pad(d, 2)}`;
  const compact = `${pad(y, 4)}${pad(mo, 2)}${pad(d, 2)}`;
  return { iso, compact };
}

/** Cheap check used by run() to route an input to the date branch. */
function looksLikeDate(input: string): boolean {
  return DATE_COMPACT_RE.test(input) || DATE_DASH_RE.test(input) || DATE_SLASH_RE.test(input);
}

// ----------------------------------------------------------------------------
// Lookups
// ----------------------------------------------------------------------------

/** VERSION -> minimum service check date. Throws if no K7727 row covers it. */
export function lookupByVersion(input: string): VersionLookupResult {
  const parsed = parseVersion(input);
  const v: [number, number, number] = [parsed.major, parsed.minor, parsed.patch];
  const matched = LICENSE_CHECK_TABLE.find((e) => entryContains(e, v));
  if (!matched) throw new ServiceCheckError("unknownVersion", `no License Check Date for ${input}`);
  const isMajorMinorRow = matched.hi[2] === ANY_PATCH;
  return {
    kind: "version",
    input,
    parsed,
    matched,
    minServiceCheckDateISO: matched.dateISO,
    minServiceCheckDateCompact: matched.dateCompact,
    isMajorMinorRow,
  };
}

/** SERVICE CHECK DATE -> reachable / blocked versions (each list newest-version first). */
export function lookupByDate(input: string): DateLookupResult {
  const scd = parseServiceCheckDate(input);
  const scdNum = Number(scd.compact);

  const reachable: LicenseCheckEntry[] = [];
  const blocked: LicenseCheckEntry[] = [];
  for (const e of LICENSE_CHECK_TABLE) {
    if (Number(e.dateCompact) <= scdNum) reachable.push(e);
    else blocked.push(e);
  }
  // Sort both by version, newest (highest tuple) first. lo is a safe identity
  // for each row since the rows partition the version space.
  const byVersionDesc = (a: LicenseCheckEntry, b: LicenseCheckEntry) => cmpTuple(b.lo, a.lo);
  reachable.sort(byVersionDesc);
  blocked.sort(byVersionDesc);

  return {
    kind: "date",
    serviceCheckDateISO: scd.iso,
    serviceCheckDateCompact: scd.compact,
    reachable,
    blocked,
    newestReachable: reachable.length > 0 ? reachable[0] : null,
    // nearest blocked version above the reachable set = the lowest-version blocked row
    nextBlocked: blocked.length > 0 ? blocked[blocked.length - 1] : null,
  };
}

/**
 * run - the registry-facing entry point. Auto-detects the input: a date-shaped
 * string routes to the reachable-versions lookup, otherwise it is treated as a
 * version. Throws ServiceCheckError (empty / format / unknownVersion); the UI
 * catches and localizes it.
 */
export function run(input: string): LookupResult {
  const trimmed = input.trim();
  if (trimmed === "") throw new ServiceCheckError("empty", "no input");
  if (looksLikeDate(trimmed)) return lookupByDate(trimmed);
  return lookupByVersion(trimmed);
}
