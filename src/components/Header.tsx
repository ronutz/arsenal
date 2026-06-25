// ============================================================================
// src/components/Header.tsx
// ----------------------------------------------------------------------------
// THE SITE HEADER — wordmark, primary navigation, and the language switcher.
//
// All nav links use the locale-aware <Link> from i18n/navigation, so clicking
// any of them preserves the visitor's current language. Nav labels come from
// the message pack (localized + English fallback). The header is a server
// component except for the switcher (which is a client island).
// ============================================================================

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeSwitcher from "./ThemeSwitcher";
import Search from "./Search";

export default async function Header() {
  const t = await getTranslations("nav");
  const tSite = await getTranslations("site");

  return (
    <header className="site-header">
      <div className="container site-header-inner">
        {/* Wordmark — lowercase, mono-accented, matching the practitioner tone. */}
        <Link href="/" className="wordmark" aria-label={tSite("name")}>
          <span className="wordmark-text">ronutz</span>
          <span className="wordmark-dot" aria-hidden="true" />
        </Link>

        <nav className="site-nav" aria-label="Primary">
          <Link href="/tools" className="site-nav-link">
            {t("tools")}
          </Link>
          <Link href="/learn" className="site-nav-link">
            {t("learn")}
          </Link>
          <Link href="/about" className="site-nav-link">
            {t("about")}
          </Link>
          <Link href="/training" className="site-nav-link">
            {t("training")}
          </Link>
          <Link href="/certifications" className="site-nav-link">
            {t("certs")}
          </Link>
          <Link href="/endorsements" className="site-nav-link">
            {t("endorsements")}
          </Link>
          <Link href="/contact" className="site-nav-link">
            {t("contact")}
          </Link>
        </nav>

        <div className="site-header-actions">
          <Search />
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
