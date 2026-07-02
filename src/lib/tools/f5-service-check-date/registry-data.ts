// ============================================================================
// src/lib/tools/f5-service-check-date/registry-data.ts
// ----------------------------------------------------------------------------
// THE VENDORED F5 LICENSE CHECK DATE TABLE.
//
// Every BIG-IP major/minor version carries a static "License Check Date": the
// minimum Service Check Date a system's license must carry to be eligible to
// boot that version. The values below are transcribed VERBATIM from F5's own
// authoritative article:
//
//   F5 K7727 - "License activation may be required before a software upgrade
//   for BIG-IP" (https://my.f5.com/manage/s/article/K7727)
//   Published 2015-10-20, updated 2026-05-06, retrieved 2026-07-01.
//
// This is vendor documentation, not a stable standard: F5 adds a new row with
// every major/minor release and may correct historical rows. The tool that
// consumes this table therefore carries a vendor-documentation disclaimer, and
// the table is provenance-stamped (RETRIEVED) so a stale copy is obvious. For
// production upgrade planning the value MUST be re-verified against K7727 (or
// the `/etc/version_date` file on the target system), never taken from here
// alone.
//
// MATCHING MODEL. Each row pins an inclusive version-tuple range [lo, hi]. For a
// modern "x.y.x" row (all patch releases of a major.minor), hi patch is the
// ANY_PATCH sentinel. For a single legacy release the range is a single point,
// and for a legacy span the range is the two endpoints F5 lists. A parsed
// version [major, minor, patch] matches the row whose range contains it; the
// K7727 rows partition the version space, so a version matches at most one row.
// Modern versions (12.0.x and later) are all clean major/minor rows, so matching
// is exact over the entire currently-relevant range; the tuple bounds also make
// the pre-12 legacy rows (with their per-maintenance granularity) exact.
//
// DATE MODEL. Each row stores the License Check Date twice: `dateISO` (yyyy-mm-dd,
// for display) and `dateCompact` (yyyymmdd, the exact form BIG-IP writes into
// `bigip.license` as "Service check date : 20230208"). The compact form is an
// 8-digit string that compares lexicographically the same way it compares
// chronologically, so all date comparisons in compute.ts are pure string/number
// comparisons with no timezone or Date-object involvement (keeps it deterministic
// and golden-vector-stable).
// ============================================================================

/** Sentinel upper patch bound meaning "any patch release of this major.minor". */
export const ANY_PATCH = 9999 as const;

/** One row of the K7727 License Check Date table (BIG-IP entries only). */
export interface LicenseCheckEntry {
  /** F5's verbatim label for the version(s) this row covers. */
  readonly label: string;
  /** License Check Date, ISO yyyy-mm-dd (display form). */
  readonly dateISO: string;
  /** License Check Date, yyyymmdd (the bigip.license compact form). */
  readonly dateCompact: string;
  /** Inclusive low version bound [major, minor, patch]. */
  readonly lo: readonly [number, number, number];
  /** Inclusive high version bound [major, minor, patch]; patch may be ANY_PATCH. */
  readonly hi: readonly [number, number, number];
}

// Rows are transcribed top-to-bottom from the K7727 table (newest first). The
// BIG-IP product is the focus of this tool; the Enterprise Manager rows in K7727
// are intentionally omitted (separate, long-EOL product).
export const LICENSE_CHECK_TABLE: readonly LicenseCheckEntry[] = Object.freeze([
  { label: "21.1.x", dateISO: "2026-04-15", dateCompact: "20260415", lo: [21, 1, 0], hi: [21, 1, ANY_PATCH] },
  { label: "21.0.x", dateISO: "2025-10-29", dateCompact: "20251029", lo: [21, 0, 0], hi: [21, 0, ANY_PATCH] },
  { label: "17.5.x", dateISO: "2025-02-12", dateCompact: "20250212", lo: [17, 5, 0], hi: [17, 5, ANY_PATCH] },
  { label: "17.1.x", dateISO: "2023-02-08", dateCompact: "20230208", lo: [17, 1, 0], hi: [17, 1, ANY_PATCH] },
  { label: "17.0.x", dateISO: "2022-03-31", dateCompact: "20220331", lo: [17, 0, 0], hi: [17, 0, ANY_PATCH] },
  { label: "16.1.x", dateISO: "2021-06-11", dateCompact: "20210611", lo: [16, 1, 0], hi: [16, 1, ANY_PATCH] },
  { label: "16.0.x", dateISO: "2020-06-16", dateCompact: "20200616", lo: [16, 0, 0], hi: [16, 0, ANY_PATCH] },
  { label: "15.1.x", dateISO: "2019-11-05", dateCompact: "20191105", lo: [15, 1, 0], hi: [15, 1, ANY_PATCH] },
  { label: "15.0.x", dateISO: "2019-05-03", dateCompact: "20190503", lo: [15, 0, 0], hi: [15, 0, ANY_PATCH] },
  { label: "14.1.x", dateISO: "2018-10-25", dateCompact: "20181025", lo: [14, 1, 0], hi: [14, 1, ANY_PATCH] },
  { label: "14.0.x", dateISO: "2018-07-11", dateCompact: "20180711", lo: [14, 0, 0], hi: [14, 0, ANY_PATCH] },
  { label: "13.1.x", dateISO: "2017-09-12", dateCompact: "20170912", lo: [13, 1, 0], hi: [13, 1, ANY_PATCH] },
  { label: "13.0.x", dateISO: "2017-01-13", dateCompact: "20170113", lo: [13, 0, 0], hi: [13, 0, ANY_PATCH] },
  { label: "12.1.x", dateISO: "2016-03-18", dateCompact: "20160318", lo: [12, 1, 0], hi: [12, 1, ANY_PATCH] },
  { label: "12.0.x", dateISO: "2015-08-03", dateCompact: "20150803", lo: [12, 0, 0], hi: [12, 0, ANY_PATCH] },
  { label: "11.6.x", dateISO: "2014-08-05", dateCompact: "20140805", lo: [11, 6, 0], hi: [11, 6, ANY_PATCH] },
  { label: "11.5.x", dateISO: "2013-12-05", dateCompact: "20131205", lo: [11, 5, 0], hi: [11, 5, ANY_PATCH] },
  { label: "11.4.x", dateISO: "2013-04-23", dateCompact: "20130423", lo: [11, 4, 0], hi: [11, 4, ANY_PATCH] },
  { label: "11.3.0", dateISO: "2012-10-25", dateCompact: "20121025", lo: [11, 3, 0], hi: [11, 3, 0] },
  { label: "11.2.1", dateISO: "2012-08-20", dateCompact: "20120820", lo: [11, 2, 1], hi: [11, 2, 1] },
  { label: "11.2.0", dateISO: "2012-04-25", dateCompact: "20120425", lo: [11, 2, 0], hi: [11, 2, 0] },
  { label: "11.1.0", dateISO: "2011-11-01", dateCompact: "20111101", lo: [11, 1, 0], hi: [11, 1, 0] },
  { label: "11.0.0", dateISO: "2011-07-11", dateCompact: "20110711", lo: [11, 0, 0], hi: [11, 0, 0] },
  { label: "10.2.2 - 10.2.4", dateISO: "2010-10-01", dateCompact: "20101001", lo: [10, 2, 2], hi: [10, 2, 4] },
  { label: "10.2.1", dateISO: "2010-06-05", dateCompact: "20100605", lo: [10, 2, 1], hi: [10, 2, 1] },
  { label: "10.1.0 - 10.2.0", dateISO: "2009-11-24", dateCompact: "20091124", lo: [10, 1, 0], hi: [10, 2, 0] },
  { label: "10.0.1", dateISO: "2009-04-24", dateCompact: "20090424", lo: [10, 0, 1], hi: [10, 0, 1] },
  { label: "10.0.0", dateISO: "2009-01-12", dateCompact: "20090112", lo: [10, 0, 0], hi: [10, 0, 0] },
  { label: "9.6.0 - 9.6.1", dateISO: "2007-12-05", dateCompact: "20071205", lo: [9, 6, 0], hi: [9, 6, 1] },
  { label: "9.4.8", dateISO: "2009-05-27", dateCompact: "20090527", lo: [9, 4, 8], hi: [9, 4, 8] },
  { label: "9.4.6 - 9.4.7", dateISO: "2008-09-15", dateCompact: "20080915", lo: [9, 4, 6], hi: [9, 4, 7] },
  { label: "9.4.5", dateISO: "2008-05-01", dateCompact: "20080501", lo: [9, 4, 5], hi: [9, 4, 5] },
  { label: "9.4.4", dateISO: "2007-12-07", dateCompact: "20071207", lo: [9, 4, 4], hi: [9, 4, 4] },
  { label: "9.4.2 - 9.4.3", dateISO: "2007-09-18", dateCompact: "20070918", lo: [9, 4, 2], hi: [9, 4, 3] },
  { label: "9.4.0 - 9.4.1", dateISO: "2006-10-02", dateCompact: "20061002", lo: [9, 4, 0], hi: [9, 4, 1] },
  { label: "9.3.1", dateISO: "2007-10-09", dateCompact: "20071009", lo: [9, 3, 1], hi: [9, 3, 1] },
  { label: "9.3.0", dateISO: "2007-03-23", dateCompact: "20070323", lo: [9, 3, 0], hi: [9, 3, 0] },
  { label: "9.2.0 - 9.2.5", dateISO: "2005-08-24", dateCompact: "20050824", lo: [9, 2, 0], hi: [9, 2, 5] },
]);

/** Provenance for the vendored table, surfaced by the tool and its docs. */
export const TABLE_PROVENANCE = Object.freeze({
  source: "F5 K7727",
  sourceUrl: "https://my.f5.com/manage/s/article/K7727",
  sourceTitle:
    "License activation may be required before a software upgrade for BIG-IP",
  published: "2015-10-20",
  vendorUpdated: "2026-05-06",
  retrieved: "2026-07-01",
  /** The single newest version in the vendored table, for a freshness hint. */
  newestVersionLabel: "21.1.x",
});
