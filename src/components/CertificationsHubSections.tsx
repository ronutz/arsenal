"use client";

// ============================================================================
// src/components/CertificationsHubSections.tsx
// ----------------------------------------------------------------------------
// COLLAPSIBLE CERTIFICATIONS HUB (PRIME directive 2026-07-21, item 2).
// Vendors render as always-visible sections in hub order; each certification
// under a vendor is a collapsible row - COLLAPSED by default, expanding to
// its exam-guide cards - with Expand-all / Collapse-all controls at the top.
// All display strings are precomputed server-side and passed as props, so
// this component owns only the open/closed state (no i18n namespace needed
// client-side). House CSS classes only; D-19 comments throughout.
//
// THE NAVIGATOR (R1-b2, 2026-10-06; SCOUT's Round 1 adoption audit rows 8 and
// 10; PLAN-round1-closeout-20261006). Above the vendors, a find field and a
// switch: the field narrows every vendor at once by exam name, code, vendor,
// certification and the earlier names the record holds (the server folds that
// text; the browser only compares), opening every vendor and certification that
// still has a match; the switch shows the retired exams, which the default view
// leaves out because a candidate cannot book them. A line counts what is shown,
// a legend says what each badge means, and an empty result says so, offering
// the retired matches when that is where they are. Both settings live in the
// address (?q= and ?retired=1), so a filtered hub can be shared. Hidden cards
// stay in the document with the `hidden` attribute, as every panel here does
// (2026-08-16), so the guide links remain crawlable and findable in the page.
// ============================================================================

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
// The same folding the server applied to each guide's search text.
import { foldForSearch, type GuideStatus } from "@/lib/certStatus";

export interface HubGuide {
  slug: string;
  /** The guide's status on the build day (src/lib/certStatus.ts). */
  status: GuideStatus;
  /** The status in the reader's words, for the card's data and the count. */
  statusLabel: string;
  /** Everything a candidate might type to find this exam, folded (lower case, no accents, single spaces). */
  search: string;
  examCode: string;
  examName: string;
  /** Precomputed badge text: "N objectives" or the in-preparation label. */
  badge: string;
  preparing: boolean;
  /** Set when the vendor has not released the exam yet — a DIFFERENT fact from
   *  "we have not transcribed the blueprint yet". */
  availabilityNote?: string | null;
  /** Set when a version of this exam is being withdrawn (PRIME 2026-07-26).
   *  Shown on the card because a deadline changes what to book. */
  retirement?: { exam: string; until: string; replacedBy: string | null } | null;
  /** The card's retirement badge, worded and dated by the page on the build day (2026-10-06); null when none applies. */
  retirementBadge?: string | null;
  cta: string;
}

export interface HubCert {
  key: string;
  name: string;
  code: string;
  /** Precomputed "requires all N exams" line. */
  /** Null when requirementMode is "custom" and the note carries the rule. */
  requiresText: string | null;
  /** Official wording for a requirement the mode cannot express (NSE 8's
   *  "Core practical exam AND one elective"). Null when there is nothing extra. */
  requirementNote?: string | null;
  /** Certifications that must be ACTIVE before this one can be earned. */
  /** "standalone" = outside the vendor's certification ladder (PRIME
   *  2026-07-27). Labelled on the card because someone planning a route to a
   *  higher certification needs to know this one does not advance them. */
  track?: "standalone" | null;
  standaloneLabel?: string;
  prerequisites?: string[];
  prerequisitesLabel?: string;
  /** The vendor's own page for this certification, so requirements can be
   *  checked against the source rather than trusted to this site. */
  sourceUrl?: string | null;
  sourceLabel?: string;
  renewalNote?: string | null;
  guides: HubGuide[];
}

export interface HubVendorGroup {
  vendor: string;
  vendorLabel: string;
  /** One-line summary shown on the vendor card at the top of the hub. */
  vendorBlurb: string;
  /** Precomputed "N certifications - M exam guides" line for the card. */
  vendorCount: string;
  certs: HubCert[];
}

/** The find field's and the retired switch's words, resolved by the page (templates keep their {placeholders}). */
export interface HubFilterCopy {
  /** The toolbar's heading. */
  title: string;
  /** The field's accessible label, also shown above it. */
  label: string;
  /** The field's placeholder: real examples. */
  placeholder: string;
  /** The Clear button. */
  clear: string;
  /** "Show retired exams ({count})". */
  showRetired: string;
  /** "{shown} of {total} exam guides". */
  shown: string;
  /** "No exam guide matches “{query}”." */
  noMatch: string;
  /** "Show the {count} retired guides that match". */
  noMatchRetired: string;
  /** What each badge on a card means. */
  legend: readonly { label: string; body: string }[];
}

/** Fill a template's {name} placeholders. */
const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (whole, key: string) => (key in values ? String(values[key]) : whole));

export default function CertificationsHubSections({
  groups,
  expandAllLabel,
  collapseAllLabel,
  vendorsHeading,
  filter,
}: {
  groups: HubVendorGroup[];
  expandAllLabel: string;
  collapseAllLabel: string;
  /** Heading above the vendor overview cards. */
  vendorsHeading: string;
  /** The navigator's words (R1-b2). */
  filter: HubFilterCopy;
}) {
  // -- Open/closed state now covers BOTH levels (PRIME 2026-07-24):
  //    a flag per VENDOR (`vendor-<key>`) and a flag per CERTIFICATION
  //    (`<cert.key>`). Both default to COLLAPSED, so a reader first sees
  //    every vendor at a glance and expands only the one they care about.
  const [open, setOpen] = useState<Record<string, boolean>>({});

  // Expand-all / collapse-all must act on EVERY collapsible on the page,
  // vendors and certifications alike, or "expand all" would leave the
  // certification rows hidden inside a newly opened vendor.
  const allKeys = [
    ...groups.map((g) => `vendor-${g.vendor}`),
    ...groups.flatMap((g) => g.certs.map((c) => c.key)),
  ];
  const setAll = (value: boolean) =>
    setOpen(Object.fromEntries(allKeys.map((k) => [k, value])));

  // ---- The navigator (R1-b2) ----
  // The find field's text, and whether retired exams are shown.
  const [query, setQuery] = useState("");
  const [showRetired, setShowRetired] = useState(false);
  // Whether the address has been read yet: until it has, the address is not written either, or the first write
  // would erase the very settings the reader arrived with.
  const [addressRead, setAddressRead] = useState(false);
  // On arrival, take both settings from the address, so a filtered hub can be shared and reloaded.
  useEffect(() => {
    // The page is static: the address is read in the browser, once.
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) setQuery(q.slice(0, 120));
    if (params.get("retired") === "1") setShowRetired(true);
    setAddressRead(true);
  }, []);
  // Keep the address in step with the settings, without a navigation or a history entry per keystroke.
  useEffect(() => {
    // Not before the arrival settings are in.
    if (!addressRead) return;
    const url = new URL(window.location.href);
    // An empty field or the default switch leaves no trace in the address.
    if (query.trim()) url.searchParams.set("q", query.trim());
    else url.searchParams.delete("q");
    if (showRetired) url.searchParams.set("retired", "1");
    else url.searchParams.delete("retired");
    window.history.replaceState(window.history.state, "", url);
  }, [query, showRetired, addressRead]);

  // The words typed, folded the way the server folded each guide; every word must appear in a guide's text.
  const terms = useMemo(() => foldForSearch(query).split(" ").filter(Boolean), [query]);
  const searching = terms.length > 0;
  /** Does a guide match the words typed (ignoring the retired switch)? */
  const matchesQuery = (g: HubGuide) => terms.every((term) => g.search.includes(term));
  /** Is a guide shown: it matches, and it is not retired unless retired exams are asked for. */
  const isVisible = (g: HubGuide) => matchesQuery(g) && (showRetired || g.status !== "retired");
  // The counts: every guide, the ones shown, the retired ones (for the switch), the retired ones that match.
  const allGuides = groups.flatMap((g) => g.certs.flatMap((c) => c.guides));
  const shownCount = allGuides.filter(isVisible).length;
  const retiredCount = allGuides.filter((g) => g.status === "retired").length;
  const retiredMatches = allGuides.filter((g) => g.status === "retired" && matchesQuery(g)).length;

  return (
    <>
      {/* ---- The navigator (R1-b2): find, the retired switch, the count, the legend ---- */}
      <section className="section certhub-filter-section" aria-labelledby="certhub-filter-title">
        <div className="container certs-container">
          <div className="certhub-filter" role="search">
            <h2 className="certs-group-title" id="certhub-filter-title">{filter.title}</h2>
            <label className="certhub-filter-label" htmlFor="certhub-filter-input">{filter.label}</label>
            <div className="certhub-filter-row">
              <input
                id="certhub-filter-input"
                className="cidr-input certhub-filter-input"
                type="search"
                value={query}
                maxLength={120}
                placeholder={filter.placeholder}
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => setQuery(e.target.value)}
                aria-describedby="certhub-filter-count"
              />
              <button type="button" className="b64-copy certhub-filter-clear" onClick={() => setQuery("")} disabled={!query}>
                {filter.clear}
              </button>
            </div>
            <label className="certhub-filter-switch">
              <input type="checkbox" checked={showRetired} onChange={(e) => setShowRetired(e.target.checked)} />
              <span>{fill(filter.showRetired, { count: retiredCount })}</span>
            </label>
            {/* The count, announced politely as it changes. */}
            <p className="certhub-filter-count" id="certhub-filter-count" aria-live="polite">
              {fill(filter.shown, { shown: shownCount, total: allGuides.length })}
            </p>
            {/* Nothing matches: say so, and offer the retired matches when that is where they are. */}
            {shownCount === 0 && (
              <p className="certhub-filter-empty">
                {fill(filter.noMatch, { query: query.trim() })}
                {!showRetired && retiredMatches > 0 && (
                  <>
                    {" "}
                    <button type="button" className="certhub-filter-more" onClick={() => setShowRetired(true)}>
                      {fill(filter.noMatchRetired, { count: retiredMatches })}
                    </button>
                  </>
                )}
              </p>
            )}
            {/* What the badges on the cards mean. */}
            <dl className="certhub-legend">
              {filter.legend.map((item) => (
                <div key={item.label} className="certhub-legend-item">
                  <dt className="certhub-guide-badge certhub-guide-badge--prep">{item.label}</dt>
                  <dd className="certhub-legend-body">{item.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ---- Vendor overview cards (PRIME 2026-07-24): every vendor the hub
             covers, visible at a glance before anything is expanded. Clicking
             a card opens that vendor's section and scrolls to it, so the cards
             double as a table of contents. ---- */}
      <section className="section">
        <div className="container certs-container">
          <h2 className="certs-group-title">{vendorsHeading}</h2>
          <ul className="certhub-guide-grid">
            {groups.map((g) => (
              <li className="certhub-guide-card-wrap" key={`card-${g.vendor}`}>
                <a
                  href={`#vendor-${g.vendor}`}
                  className="certhub-guide-card"
                  onClick={() => setOpen((o) => ({ ...o, [`vendor-${g.vendor}`]: true }))}
                >
                  <span className="certhub-guide-name">{g.vendorLabel}</span>
                  <span className="certhub-guide-meta">
                    <span className="certhub-guide-badge">{g.vendorCount}</span>
                  </span>
                  <span className="certs-group-intro">{g.vendorBlurb}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---- Expand / collapse all: placed directly ABOVE the certifications
             list rather than above the vendor cards (PRIME 2026-07-24), so the
             controls sit with the thing they control instead of floating at
             the top of the page. Acts on vendors AND certification rows. ---- */}
      <section className="section">
        <div className="container certs-container">
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setAll(true)}>
              {expandAllLabel}
            </button>
            <button type="button" className="b64-copy" onClick={() => setAll(false)}>
              {collapseAllLabel}
            </button>
          </div>
        </div>
      </section>

      {/* ---- One COLLAPSIBLE section per vendor, in hub order ---- */}
      {groups.map((g) => {
        const vKey = `vendor-${g.vendor}`;
        // A vendor with nothing visible under the current settings is hidden whole (kept in the document).
        const vVisible = g.certs.some((c) => c.guides.some(isVisible));
        // While searching, every vendor that still has a match is open, so the matches are on screen.
        const vOpen = searching ? vVisible : !!open[vKey];
        return (
        <section className="section certhub-cert" id={vKey} key={g.vendor} hidden={!vVisible}>
          <div className="container certs-container">
            {/* Vendor title is now the collapse control itself. */}
            <button
              type="button"
              className="certhub-cert-row"
              aria-expanded={vOpen}
              aria-controls={`${vKey}-certs`}
              onClick={() => setOpen((o) => ({ ...o, [vKey]: !o[vKey] }))}
            >
              <span className="certhub-guide-cta" aria-hidden="true">
                {vOpen ? "\u25be" : "\u25b8"}
              </span>
              <h2 className="certs-group-title">{g.vendorLabel}</h2>
              <span className="certs-badge certs-badge--current mono">{g.vendorCount}</span>
            </button>

            {/* ---- Collapsible certification rows, in certification order ----

                 RENDERED ALWAYS, HIDDEN WHEN CLOSED (2026-08-16). This panel and
                 the one below used to be CONDITIONALLY MOUNTED, which meant the
                 exam-guide links did not exist in the HTML until a reader had
                 clicked twice.

                 The audit of 2026-08-16 found 104 /certifications/<slug> pages
                 with no inbound link from anywhere on the site, and this was the
                 whole reason: THE INDEX THAT LISTS THEM RENDERED ITS LIST IN THE
                 BROWSER.

                 On a static-export site whose thesis is that the work is done in
                 the page rather than behind it, that was the wrong trade. The
                 `hidden` attribute gives the same collapsed appearance, keeps
                 the content in the document for crawlers and for find-in-page,
                 and makes `aria-controls` point at an element that actually
                 exists - which it did not before. */}
            <div id={`${vKey}-certs`} hidden={!vOpen}>
            {g.certs.map((cert) => {
              // A certification with no visible guide is hidden (kept in the document).
              const cVisible = cert.guides.some(isVisible);
              // While searching, every certification with a match is open.
              const isOpen = searching ? cVisible : !!open[cert.key];
              return (
                <div id={cert.key} key={cert.key} hidden={!cVisible}>
                  <button
                    type="button"
                    className="certhub-cert-row"
                    aria-expanded={isOpen}
                    aria-controls={`${cert.key}-guides`}
                    onClick={() => setOpen((o) => ({ ...o, [cert.key]: !o[cert.key] }))}
                  >
                    <span className="certhub-guide-cta" aria-hidden="true">
                      {isOpen ? "\u25be" : "\u25b8"}
                    </span>
                    <span className="certhub-guide-name">{cert.name}</span>
                    <span className="certs-badge certs-badge--current mono">{cert.code}</span>
                  </button>

                  <div id={`${cert.key}-guides`} hidden={!isOpen}>
                      {cert.requiresText && (
                        <p className="certs-group-intro">{cert.requiresText}</p>
                      )}
                      {/* Requirements sit with the certification LEVEL, not with
                          the individual exams, because that is the unit a
                          candidate plans against (PRIME 2026-07-25). */}
                      {cert.requirementNote && (
                        <p className="certs-group-intro">{cert.requirementNote}</p>
                      )}
                      {cert.sourceUrl && (
                        <p className="certs-group-intro">
                          <a
                            className="certhub-guide-cta"
                            href={cert.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {cert.sourceLabel} &#8599;
                          </a>
                        </p>
                      )}
                      {cert.prerequisites && cert.prerequisites.length > 0 && (
                        <p className="certs-group-intro">
                          <strong>{cert.prerequisitesLabel}:</strong>{" "}
                          {cert.prerequisites.join(" · ")}
                        </p>
                      )}
                      <ul className="certhub-guide-grid">
                        {cert.guides.map((guide) => (
                          <li className="certhub-guide-card-wrap" key={guide.slug} hidden={!isVisible(guide)} data-status={guide.status}>
                            <Link
                              href={`/certifications/${guide.slug}`}
                              className="certhub-guide-card"
                            >
                              <span className="certhub-guide-code mono">{guide.examCode}</span>
                              <span className="certhub-guide-name">{guide.examName}</span>
                              <span className="certhub-guide-meta">
                                <span
                                  className={
                                    guide.preparing
                                      ? "certhub-guide-badge certhub-guide-badge--prep"
                                      : "certhub-guide-badge"
                                  }
                                >
                                  {guide.badge}
                                </span>
                                {/* Availability caveat sits on the CARD so a
                                    reader scanning a level sees which exams
                                    cannot be sat yet without opening each one. */}
                                {cert.track === "standalone" && (
                                  <p className="certhub-guide-badge certhub-guide-badge--prep">
                                    {cert.standaloneLabel}
                                  </p>
                                )}
                                {guide.retirementBadge && (
                                  <p className="certhub-guide-badge certhub-guide-badge--prep">
                                    {guide.retirementBadge}
                                  </p>
                                )}
                                {guide.availabilityNote && (
                                  <span className="certhub-guide-badge certhub-guide-badge--prep">
                                    {guide.availabilityNote}
                                  </span>
                                )}
                                <span className="certhub-guide-cta">{guide.cta} &#8594;</span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                      {cert.renewalNote && <p className="certhub-renewal">{cert.renewalNote}</p>}
                    </div>
                </div>
              );
            })}
            </div>
          </div>
        </section>
        );
      })}
    </>
  );
}
