// ============================================================================
// src/components/SiteFooter.tsx
// ----------------------------------------------------------------------------
// SITE FOOTER — the shared footer used on every page.
//
// Renders "Built by Rodolfo Nützmann with CONCORD", with CONCORD linking to the
// colophon (/colophon), which documents the build. Centralizing this here means
// the footer is maintained in one place rather than inline on every page.
//
// The "builtWith" string contains the word CONCORD; to link just that word
// without splitting the translation, we use next-intl's rich-text formatting:
// the message is authored with a <c>...</c> tag around CONCORD, and we map that
// tag to a Link here. (The plain-text fallback below keeps older messages
// working until each locale's string is updated.)
// ============================================================================

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { redEducationUrl, externalRel } from "@/config/redEducation";

export default async function SiteFooter() {
  const t = await getTranslations("footer");

  // Honoring Red Education, the authorized training center. Lead-attributed
  // (utm_campaign=footer) and referrer-preserving (externalRel drops the
  // referrer-suppressing rel for Red Education links).
  const reduUrl = redEducationUrl("footer");

  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        {/* Red Education callout — book official training with the authorized
            training center. Prominent, honoring, and lead-attributed. */}
        <p className="footer-built footer-redu">
          <a
            href={reduUrl}
            target="_blank"
            rel={externalRel(reduUrl)}
            className="footer-built-link"
          >
            {t("redEducation")} →
          </a>
        </p>
        <p className="footer-built">
          {/* The whole line links to the colophon; simple and reliable. */}
          <Link href="/colophon" className="footer-built-link">
            {t("builtWith")}
          </Link>
        </p>
        {/* Quiet link to the translation contribution page, so speakers of any
            language can find it (the in-page notice only shows on machine-draft
            locales). */}
        <p className="footer-contribute">
          <Link href="/contribute" className="footer-contribute-link">
            {t("contribute")}
          </Link>
        </p>
        <p className="footer-contribute">
          <Link href="/api" className="footer-contribute-link">
            {t("api")}
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
        {/* Privacy notice: an accurate, plain-language disclosure (no cookies,
            no analytics, what little data the hosting layer and a local theme
            setting involve), covering the GDPR / LGPD essentials. */}
        <p className="footer-contribute">
          <Link href="/privacy" className="footer-contribute-link">
            {t("privacy")}
          </Link>
        </p>
      </div>
    </footer>
  );
}
