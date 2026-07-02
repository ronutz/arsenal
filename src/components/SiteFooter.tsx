// ============================================================================
// src/components/SiteFooter.tsx
// ----------------------------------------------------------------------------
// SITE FOOTER — the shared footer used on every page.
//
// Order: credits (-> /colophon) | utility links (translations, API, contribute,
// feedback, Privacy, License) | a quiet "buy me a coffee" support link | and the
// Red Education training callout last.
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
import { redEducationUrl, externalRel } from "@/config/redEducation";
import { BUILD_TIME } from "@/generated/build-info";

// Buy Me a Coffee support link.
const COFFEE_URL = "https://buymeacoffee.com/ronutz";

export default async function SiteFooter() {
  const t = await getTranslations("footer");

  // Honoring Red Education, the authorized training center. Lead-attributed
  // (utm_campaign=footer) and referrer-preserving.
  const reduUrl = redEducationUrl("footer");

  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        <p className="footer-built">
          {/* The whole line links to the colophon; simple and reliable. */}
          <Link href="/colophon" className="footer-built-link">
            {t("builtWith")}
          </Link>
        </p>

        {/* Utility links. */}
        <p className="footer-contribute">
          <Link href="/contribute" className="footer-contribute-link">
            {t("contribute")}
          </Link>
        </p>
        {/* /api link intentionally desurfaced while access control matures;
            the page, docs, and spec remain built and reachable by direct URL. */}
        <p className="footer-contribute">
          <Link href="/roadmap" className="footer-contribute-link">
            {t("roadmap")}
          </Link>
        </p>
        <p className="footer-contribute">
          <Link href="/contribute/tools" className="footer-contribute-link">
            {t("contributeTools")}
          </Link>
        </p>
        <p className="footer-contribute">
          <Link href="/contact" className="footer-contribute-link">
            {t("feedback")}
          </Link>
        </p>
        <p className="footer-contribute">
          <Link href="/privacy" className="footer-contribute-link">
            {t("privacy")}
          </Link>
        </p>
        {/* Licensing terms: the proprietary site plus the required third-party
            attributions. Replaces the former one-line rights statement. */}
        <p className="footer-contribute">
          <Link href="/license" className="footer-contribute-link">
            {t("license")}
          </Link>
        </p>

        {/* Build stamp: one timestamp per build (scripts/gen-build-info.mjs),
            rendered in UTC so it is unambiguous across locales. */}
        <p className="footer-modified">
          {t("lastModified", {
            stamp: new Date(BUILD_TIME).toISOString().slice(0, 16).replace("T", " ") + " UTC",
          })}
        </p>

        {/* Quiet support link. The cup is forced to monochrome (U+FE0E) so it
            inherits the link's muted-amber color rather than rendering bright. */}
        <p className="footer-coffee">
          <a
            href={COFFEE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-coffee-link"
          >
            {t("coffee")}
            {"\u00A0\u2615\uFE0E"}
          </a>
        </p>

        {/* Red Education callout — last. Only the brand name is colored (via the
            <b> tag in the message); the line ends with a graduation cap. */}
        <p className="footer-built footer-redu">
          <a
            href={reduUrl}
            target="_blank"
            rel={externalRel(reduUrl)}
            className="footer-built-link"
          >
            {t.rich("redEducation", {
              b: (chunks) => <span className="brand">{chunks}</span>,
            })}
            {"\u00A0🎓"}
          </a>
        </p>
      </div>
    </footer>
  );
}
