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

        <nav className="site-nav" aria-label={t("primaryAria")}>
          <Link href="/tools" className="site-nav-link">
            {t("tools")}
          </Link>
          <Link href="/learn" className="site-nav-link">
            {t("learn")}
          </Link>
          {/* Certifications and Vendors were removed from the primary nav
              (PRIME 2026-08-06). Both remain fully reachable as cards on the
              Learn index, which is where somebody looking for study material or
              a vendor hub actually starts. The nav had grown to seven items;
              two of them duplicated a destination one click away, and a nav
              that lists everything ranks nothing. /certifications and
              /vendor-hubs are unchanged and still linked from Learn, from the
              Tools and Learn vendor strips, and from search. */}
          {/* Industry hub (PRIME 2026-07-15): the front door to the
              deep-research vendor histories and lineages. */}
          <Link href="/industry" className="site-nav-link">
            {t("industry")}
          </Link>
          <Link href="/about" className="site-nav-link">
            {t("about")}
          </Link>
          <Link href="/training" className="site-nav-link">
            {t("training")}
          </Link>
          {/* ADVISORY (schema D, PRIME 2026-08-06). The commercial offer had no
              entry point at all: /advisory had zero inbound links while sitting
              built and reachable only by typing the URL. Training was in the
              nav and advisory was not, which described the business backwards.
              /speaking is reached FROM advisory rather than from here, because
              event organisers arrive by referral and search, not by browsing a
              navigation bar. */}
          <Link href="/advisory" className="site-nav-link">
            {t("advisory")}
          </Link>
          {/* Contact intentionally lives in the footer (nav option (a), sleek
              4-item explore bar); /contact remains fully reachable. */}
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
