// ============================================================================
// src/components/SiteFooter.tsx
// ----------------------------------------------------------------------------
// SITE FOOTER — the shared footer used on every page.
//
// Order: credits (-> /colophon) | grouped utility links (ideas + translations,
// then contact + legal) | a quiet "buy me a coffee" support link | the Red
// Education training callout | the machine-readable row (monospace, a step
// smaller) | and the build stamp last.
//
// next-intl rich-text is used so a single word can be styled without splitting
// the translation: the Red Education line authors <b>Red Education</b> and we
// map that tag to a brand-colored span; the line ends with a graduation-cap
// emoji rather than an arrow. The coffee line ends with a coffee-cup glyph
// forced to MONOCHROME (U+FE0E) so it inherits the link's muted-amber color and
// blends with the footer instead of rendering as a bright color emoji.
// ============================================================================

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BUILD_TIME } from "@/generated/build-info";
import LicenseBadges from "@/components/LicenseBadges";

// Buy Me a Coffee support link.
const COFFEE_URL = "https://buymeacoffee.com/ronutz";

export default async function SiteFooter() {
  const t = await getTranslations("footer");
  const tBadges = await getTranslations("licenseBadges");

  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
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
          <span className="footer-sep" aria-hidden="true">&#183;</span>
          {/* The Glossary: a content destination alongside the guide, ahead of
              the participation + legal clusters. */}
          <Link href="/glossary" className="footer-contribute-link">
            {t("glossary")}
          </Link>
          <span className="footer-sep" aria-hidden="true">&#183;</span>
          <Link href="/contribute/tools" className="footer-contribute-link">
            {t("contributeTools")}
          </Link>
          <span className="footer-sep" aria-hidden="true">&#183;</span>
          <Link href="/contribute" className="footer-contribute-link">
            {t("contribute")}
          </Link>
          <span className="footer-sep" aria-hidden="true">&#183;</span>
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
          <Link href="/settings" className="footer-contribute-link">
            {t("settings")}
          </Link>
          <span className="footer-sep" aria-hidden="true">&#183;</span>
          <Link href="/contact" className="footer-contribute-link">
            {t("feedback")}
          </Link>
        </p>
        {/* Support row: the coffee link and the Red Education callout share
            ONE line, separated by a WIDE middot (.footer-sep-wide) so the two
            unrelated items read as clearly distinct - deliberately more air
            than the tight separators in the utility row above. The cup is
            forced to monochrome (U+FE0E) so it inherits the link's muted
            amber; on the training link only the brand name is colored (the
            <b> tag in the message), and the line ends with a graduation cap.
            Wraps into two natural lines on narrow screens. */}
        <p className="footer-support footer-built footer-redu">
          <a
            href={COFFEE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-coffee-link"
          >
            {t("coffee")}
            {"\u00A0\u2615\uFE0E"}
          </a>
          <span className="footer-sep footer-sep-wide" aria-hidden="true">&#183;</span>
          {/* Red Education callout: now points to the on-site profile/homage
              page (/red-education), which carries the lead-attributed outbound
              link - site-wide internal linking for the page (PRIME 2026-07-09). */}
          <Link href="/red-education" className="footer-built-link">
            {t.rich("redEducation", {
              b: (chunks) => <span className="brand">{chunks}</span>,
            })}
            {"\u00A0🎓"}
          </Link>
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
        </p>
      </div>
    </footer>
  );
}
