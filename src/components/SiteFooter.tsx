// ============================================================================
// src/components/SiteFooter.tsx
// ----------------------------------------------------------------------------
// SITE FOOTER — the shared footer used on every page.
//
// Order: the directory of the five worlds (since 2026-10-06 the site's one
// directory: "Everything on ronutz", each world's coloured verb, each
// destination's count as a bare number; PRIME's Option A, 16:45 and 16:49) |
// credits (-> /colophon) | grouped utility links (ideas + translations,
// then contact + legal) | the Red
// Education training callout | the machine-readable row (monospace, a step
// smaller) | and the build stamp last.
//
// next-intl rich-text is used so a single word can be styled without splitting
// the translation: the Red Education line authors <b>Red Education</b> and we
// map that tag to a brand-colored span; the line ends with a graduation-cap
// emoji rather than an arrow. (The Buy Me a Coffee link that used to share
// this row moved to /contribute/tools on 2026-07-15, taking its monochrome
// U+FE0E cup with it - the support pitch and the support link now live
// together.)
// ============================================================================

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BUILD_TIME } from "@/generated/build-info";
import LicenseBadges from "@/components/LicenseBadges";
import ItemViews from "@/components/ItemViews";
import { getLocale } from "next-intl/server";
import { WORLDS } from "@/config/worlds";
// The directory's counts by destination, shared with the colophon and the user guide (2026-10-06).
import { getWorldCountLabels, getWorldCountNumbers } from "@/lib/worldCounts";
import { attributeRedEducationUrl, externalRel, RED_EDUCATION_BASE } from "@/config/redEducation";

export default async function SiteFooter() {
  const t = await getTranslations("footer");
  const tBadges = await getTranslations("licenseBadges");
  const tStats = await getTranslations("stats_page");
  const locale = await getLocale();
  // The footer's affiliation link to Red Education (option B, PRIME 2026-10-06 13:01): the root destination
  // with the five-parameter attribution, pageType "footer" and cta "affiliation", built once per render.
  const reduAffiliationHref = attributeRedEducationUrl(RED_EDUCATION_BASE, { pageType: "footer", locale, cta: "affiliation" });
  // The five worlds' titles and entry labels live with the home page's copy (home.front.world.*, home.map.*).
  const tHome = await getTranslations("home");
  const tNav = await getTranslations("nav");
  /** A registry label key to its text: "map.x" under home, "nav.x" under nav, "footer.x" here, "=Literal" as is. */
  const label = (key: string) => key.startsWith("=") ? key.slice(1) : key.startsWith("nav.") ? tNav(key.slice(4)) : key.startsWith("footer.") ? t(key.slice(7)) : tHome(key);
  // The counts beside the destinations (PRIME 2026-10-06 16:49: "use only the numbers for the items in the footer"):
  // the bare number is what the eye reads; the phrase ("183 live", "28 courses across 4 vendors") is what a screen
  // reader hears and what the pointer shows, so the number never stands alone without its noun.
  const countNumbers = getWorldCountNumbers(locale);
  const countLabels = await getWorldCountLabels(locale);
  const nf = new Intl.NumberFormat(locale);

  return (
    // data-pagefind-ignore keeps the footer out of the search index: its Red
    // Education line and legal links are on every page, so without this a search
    // for "Red Education" matched the whole site through the footer rather than
    // the pages about it (2026-10-04). The page itself stays indexed.
    <footer className="site-footer" data-pagefind-ignore>
      <div className="container site-footer-inner">
        {/* This page's own count. Mounted here, once, so every route carries a
            counter without each of eighty-seven pages having to remember one -
            see components/ItemViews.tsx for why it locates itself. Renders
            nothing at all until it has a number. */}
        <ItemViews label={tStats("itemLabel")} locale={locale} />
        {/* THE DIRECTORY BY THE FIVE WORLDS (wave 0, 2026-10-05; SCOUT G21), from the shared registry, so every page ends
            with the way to every system. Since 2026-10-06 (PRIME's Option A, 16:45) it is the site's ONE directory: the
            home page's "Everything on ronutz" section, which sat right above it as an uneven duplicate, is gone (its full
            form, with the count phrases, now lives on the colophon), and the footer carries what made that section worth
            having: the title and its line, each world's coloured verb (16:49: "Compute, Read, Trace, Hire, About") and
            each destination's count as a bare number. Titles and verbs from the home copy, entries the primary ones (the
            human sitemap lists the rest). */}
        <p className="footer-worlds-head">
          <span className="footer-worlds-title">{tHome("front.everythingTitle")}</span>
          <span className="footer-worlds-lede">{tHome("front.everythingBody")}</span>
        </p>
        <nav className="footer-worlds" aria-label={t("directoryAria")}>
          {WORLDS.map((w) => (
            <div key={w.key} className={`footer-world footer-world--${w.key}`}>
              <p className="footer-world-title">{tHome(`front.world.${w.key}`)}</p>
              {/* The world's verb, in the world's colour (the same accent as the rule above the column). */}
              <p className="footer-world-verb mono">{tHome(`front.worldVerb.${w.key}`)}</p>
              <ul className="footer-world-list">
                {w.items.map((it) => {
                  // The destination's count, when it has one (Dev tools, Advisory, Speaking and About do not).
                  const n = countNumbers[it.href];
                  return (
                    <li key={it.href} className="footer-world-item">
                      <Link href={it.href} className="footer-world-link">{label(it.label)}</Link>
                      {n !== undefined && (
                        <span className="footer-world-count mono" title={countLabels[it.href]}>
                          <span aria-hidden="true">{nf.format(n)}</span>
                          <span className="sr-only">{countLabels[it.href]}</span>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <p className="footer-built">
          {/* The whole line links to the colophon; simple and reliable. */}
          <Link href="/colophon" className="footer-built-link">
            {t("builtWith")}
          </Link>
        </p>

        {/* Open-source / license badges: a quiet, sitewide brand signal that the
            project is open and how it is licensed. The cluster links to
            /license (the full terms). Compact 'footer' variant. */}
        <LicenseBadges
          variant="footer"
          labels={{
            groupAria: tBadges("groupAria"),
            openSource: tBadges("openSource"),
            codeLicense: tBadges("codeLicense"),
            contentLicense: tBadges("contentLicense"),
          }}
        />

        {/* Utility links, consolidated into ONE compact row with dimmed-middot
            separators, in this deliberate order: participation first (share an
            idea, improve the translations), then legal (license, privacy),
            then contact last. Long enough to wrap gracefully on narrow
            screens; the flexless <p> lets the browser break at separators.
            The machine-readable row lives at the end of the footer, just
            above the build stamp. The /api link sits on that trailing row,
            right after the build stamp: the endpoints are implemented and
            documented, but the API is not served from this site (its page
            explains why). */}
        <p className="footer-contribute">
          <Link href="/guide" className="footer-contribute-link">
            {t("guide")}
          </Link>
          {/* ONE separator, not three. Removing the Blog and Glossary links
              earlier left their separators behind - a link and its separator
              are one unit and have to be removed together. */}
          <span className="footer-sep" aria-hidden="true">&#183;</span>
          <Link href="/contribute/tools" className="footer-contribute-link">
            {t("contributeTools")}
          </Link>
          <span className="footer-sep" aria-hidden="true">&#183;</span>
          {/* "Improve the translations" MOVED OUT of the footer (PRIME
              2026-08-06) to /contribute/tools, where it sits beside the other
              ways to contribute, with a pointer from /contact. A footer link is
              seen by everybody and acted on by almost nobody; the contribute
              page is read by the few people actually considering it. */}
          <Link href="/license" className="footer-contribute-link">
            {t("license")}
          </Link>
          <span className="footer-sep" aria-hidden="true">&#183;</span>
          {/* Disclaimer / limitation of liability (PRIME, 2026-07-06): sits in
              the legal cluster between License and Privacy. */}
          <Link href="/disclaimer" className="footer-contribute-link">
            {t("disclaimer")}
          </Link>
          <span className="footer-sep" aria-hidden="true">&#183;</span>
          <Link href="/privacy" className="footer-contribute-link">
            {t("privacy")}
          </Link>
          <span className="footer-sep" aria-hidden="true">&#183;</span>
          {/* Stats sits next to Privacy deliberately: the Privacy page states
              what is counted, and this is where the counts are shown. */}
          <Link href="/stats" className="footer-contribute-link">
            {t("stats")}
          </Link>
          <span className="footer-sep" aria-hidden="true">&#183;</span>
          <Link href="/settings" className="footer-contribute-link">
            {t("settings")}
          </Link>
          <span className="footer-sep" aria-hidden="true">&#183;</span>
          <Link href="/contact" className="footer-contribute-link">
            {t("feedback")}
          </Link>
        </p>
        {/* Support row: since 2026-07-15 the line belongs to Red Education
            alone - the Buy Me a Coffee link moved to /contribute/tools, where
            the support pitch actually lives (PRIME directive). Since
            2026-10-06 (PRIME 12:02) the copy is the affiliation, "Rodolfo
            Nützmann is a Senior Technical Instructor and Advisor at Red
            Education", in all 16 message packs, replacing the booking pitch.
            Since 2026-10-06 13:01 (PRIME, option B of the footer decision) the
            sentence carries TWO links: the role phrase (the <r> tag in the
            message) goes to the on-site profile page /red-education, and the
            brand name (the <b> tag) is a followed external link to
            rededucation.com, attributed at render time like every other Red
            Education link (pageType "footer", cta "affiliation", so analytics
            can tell the site-wide affiliation apart from the page CTAs) and
            with externalRel so the referrer is sent. One brand-anchor link per
            page, no CTA, no superlatives: an affiliation statement, which is
            the form Google's own linking guidance treats as a regular link. The
            line still ends with a graduation cap. */}
        <p className="footer-support footer-built footer-redu">
          {t.rich("redEducation", {
            r: (chunks) => (
              <Link href="/red-education" className="footer-built-link">
                {chunks}
              </Link>
            ),
            b: (chunks) => (
              <a
                href={reduAffiliationHref}
                target="_blank"
                rel={externalRel(reduAffiliationHref)}
                className="footer-built-link brand"
              >
                {chunks}
              </a>
            ),
          })}
          {"\u00A0🎓"}
        </p>

        {/* QUIET TRAILING LINE - one dimmed closing row: the build stamp
            first (one timestamp per build via scripts/gen-build-info.mjs, in
            UTC so it is unambiguous), then the machine-readable surface: the
            llms.txt map for AI agents, robots.txt, and the Learn RSS feed.
            Small, monospace, low-contrast (.footer-machine), pushed apart
            from the human links above: reference plumbing, not a call to
            action. File links are plain anchors (static files, not locale
            routes). */}
        <p className="footer-machine">
          {/* The stamp doubles as the door to the changelog: the natural
              "what changed?" affordance for anyone who reads build stamps. */}
          <Link href="/changelog" className="footer-contribute-link">
            {t("lastModified", {
              stamp: new Date(BUILD_TIME).toISOString().slice(0, 16).replace("T", " ") + " UTC",
            })}
          </Link>
          <span className="footer-sep" aria-hidden="true">&#183;</span>
          {/* The API reference: the endpoints are implemented and documented,
              but the API is not served from this site (the /api page explains
              why). Surfaced here, right after the build stamp, as reference
              material rather than a call to action. */}
          <Link href="/api" className="footer-contribute-link">
            {t("api")}
          </Link>
          <span className="footer-sep" aria-hidden="true">&#183;</span>
          {/* The public source repository. External anchor (leaves the site). */}
          <a
            href="https://github.com/ronutz/arsenal"
            className="footer-contribute-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("source")}
          </a>
          <span className="footer-sep" aria-hidden="true">&#183;</span>
          <a href="/llms.txt" className="footer-contribute-link">
            llms.txt
          </a>
          <span className="footer-sep" aria-hidden="true">&#183;</span>
          <a href="/robots.txt" className="footer-contribute-link">
            robots.txt
          </a>
          <span className="footer-sep" aria-hidden="true">&#183;</span>
          <a href="/feed.xml" className="footer-contribute-link">
            feed.xml
          </a>
          <span className="footer-sep" aria-hidden="true">&#183;</span>
          {/* The human sitemap (PRIME 2026-07-16): a curated, readable section
              map at /sitemap - the human counterpart to sitemap.xml, which the
              page itself links. Locale route, hence Link. */}
          <Link href="/sitemap" className="footer-contribute-link">
            {t("sitemap")}
          </Link>
        </p>
      </div>
    </footer>
  );
}
