// ============================================================================
// src/config/privacyRevisions.ts
// ----------------------------------------------------------------------------
// THE PRIVACY NOTICE'S OWN REVISION RECORD.
//
// The privacy page used to print its "last updated" date as a hand-written
// string in sixteen packs, and the strings drifted: the English said 6 October
// 2026 while the changelog recorded disclosure changes on the 7th and the 13th,
// and fourteen packs still said 30 June (production audit of 2026-10-15, F14).
// The date is now data, declared once here with a one-line note per revision,
// and the page formats it in the reader's language. A new disclosure change
// adds one row at the TOP and its note to the privacy_page.revisions block of
// the two authored packs; nothing else moves.
//
// Only changes to what the notice discloses belong here, not deployments, not
// translation touch-ups that change no meaning, and not the site's content date
// (the footer carries that separately).
// ============================================================================

/** One revision of the notice: the day (ISO date) and the key of its note under privacy_page.revisions. */
export interface PrivacyRevision {
  /** The day the revised notice was published, as YYYY-MM-DD. */
  readonly date: string;
  /** The message key of the one-line note, under privacy_page.revisions. */
  readonly key: string;
}

/** The revisions, newest first. Every date is a changelog entry's date. */
export const PRIVACY_REVISIONS: readonly PrivacyRevision[] = [
  // Share results (PRIME 27/10/2026): the explicit share button is described, what its link carries, and that tools
  // whose input can hold secrets carry a derived form. Published with the batch of 27/10/2026.
  { date: "2026-10-27", key: "r20261027share" },
  // The hash tool's file view links a file's SHA-256 to VirusTotal; the notice says that only following that link
  // sends the hash (never the file), under VirusTotal's terms. Published with the batch of 27/10/2026.
  { date: "2026-10-27", key: "r20261027hash" },
  // The speed test joins the red room: privacy_page.short3 and toolsBody name what it sends (test data, to
  // Cloudflare's speed test service) and when (only when the reader presses Start). Its own key, so it cannot collide
  // with another helper's row of the same day; ANVIL aligns the date with the changelog entry that publishes it.
  { date: "2026-10-27", key: "r20261027speed" },
  // Privacy round 3 (PRIME's decisions of 26/10/2026): what Cloudflare does as the host is disclosed, its Workers
  // Logs (what a record holds, for how long) and its bot check (the script it adds to each page, the __cf_bm and
  // cf_clearance cookies), and every "no cookies" statement is scoped to the site's own code. Same day as B9, so a
  // second row with its own key; ANVIL aligns the date with the changelog entry that publishes it.
  { date: "2026-10-26", key: "r20261026b" },
  // Round 1 batch B, B9: where the counting code can be read, how long the store keeps the counts (the provider's
  // own documentation, with its read date), and that the provider, not this site's code, sets how long its connection
  // data is kept. Staged 2026-10-26; ANVIL aligns the date with the changelog entry that publishes it.
  { date: "2026-10-26", key: "r20261026" },
  // Round 1 RT01 and RT02: a value handed from one page to a tool travels after the # (never in a request), what
  // older ?input= links sent, and Enter named beside Ask for the red room. The date is the day the copy was staged;
  // ANVIL aligns it with the changelog entry that publishes it.
  { date: "2026-10-25", key: "r20261025" },
  // The Portuguese notice re-read beside the English; a lost qualifier ("of any kind") restored.
  { date: "2026-10-13", key: "r20261013" },
  // The visitor count's status recorded; the user agent and network reads explained; the Guided or Directory
  // choice named among the stored values; the local-first claim scoped to the catalogue with the red room named.
  { date: "2026-10-07", key: "r20261007" },
  // The search box's reopen preference named among the stored values.
  { date: "2026-10-06", key: "r20261006" },
  // Every key written to the browser listed, including the language last used, the shortcut bindings and the
  // recently-opened trail.
  { date: "2026-10-05", key: "r20261005" },
  // Why preferences live only on the device.
  { date: "2026-07-03", key: "r20260703" },
];

/** The newest revision (the list is kept newest first, and asserted so). */
export function latestPrivacyRevision(): PrivacyRevision {
  // The list is never empty.
  const first = PRIVACY_REVISIONS[0];
  // Newest first, or a reader would be told an older date than the one in force.
  for (let i = 1; i < PRIVACY_REVISIONS.length; i += 1) {
    if (PRIVACY_REVISIONS[i].date > PRIVACY_REVISIONS[i - 1].date) {
      throw new Error(`privacyRevisions: ${PRIVACY_REVISIONS[i].date} is listed after the older ${PRIVACY_REVISIONS[i - 1].date}`);
    }
  }
  // Done.
  return first;
}

/** An ISO date formatted as a long date in the reader's language, from noon UTC so no zone shifts the day. */
export function formatRevisionDate(iso: string, locale: string): string {
  // Noon UTC: a day boundary in no inhabited zone.
  const d = new Date(`${iso}T12:00:00Z`);
  // The reader's language, long form ("6 de outubro de 2026", "6 October 2026", "6. Oktober 2026"); English is
  // formatted as en-GB because the house writes British English (2026-10-26: Stats printed "October 26, 2026").
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale, { dateStyle: "long", timeZone: "UTC" }).format(d);
}
