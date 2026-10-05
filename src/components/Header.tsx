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
// The navigation is a client island since 2026-10-04 so it can mark the
// current section (aria-current); the labels are still translated here.
import SiteNav from "./SiteNav";

export default async function Header() {
  const t = await getTranslations("nav");
  const tSite = await getTranslations("site");

  return (
    // data-pagefind-ignore keeps the header's text (the navigation labels, the
    // search button, the language switcher) out of the search index, so an
    // excerpt starts with the page's own words rather than "ronutz Search Ctrl K"
    // and a search for a nav label does not match every page (2026-10-04). The
    // page itself stays indexed; only this element's content is skipped. The
    // same attribute sits on the skip link ("Skip to content") that every page
    // renders before this header, and on the site footer, for the same reason.
    <header className="site-header" data-pagefind-ignore>
      <div className="container site-header-inner">
        {/* Wordmark — lowercase, mono-accented, matching the practitioner tone. */}
        <Link href="/" className="wordmark" aria-label={tSite("name")}>
          <span className="wordmark-text">ronutz</span>
          <span className="wordmark-dot" aria-hidden="true" />
        </Link>

        {/* Six destinations in three groups (PRIME 2026-08-06 for the set and
            the order; PRIME 2026-10-04 for the grouping and the active state,
            adopting the review of the bar; see SiteNav.tsx). Certifications and
            Vendors were removed from the bar on 2026-08-06 (both reachable from
            Learn: a nav that lists everything ranks nothing); Industry joined on
            2026-07-15; Advisory on 2026-08-06, because the commercial offer had
            no entry point while Training had one; About is last, where the eye
            finishes. /speaking is reached from Advisory, About, the homepage and
            the footer rather than from here, and Contact lives in the footer. */}
        <SiteNav
          ariaLabel={t("primaryAria")}
          groups={[
            { key: "knowledge", items: [
              { href: "/tools", label: t("tools"), tone: "knowledge" },
              { href: "/learn", label: t("learn"), tone: "knowledge" },
              { href: "/industry", label: t("industry"), tone: "knowledge" },
            ] },
            { key: "work", items: [
              { href: "/training", label: t("training"), tone: "training" },
              { href: "/advisory", label: t("advisory"), tone: "advisory" },
            ] },
            { key: "person", items: [
              { href: "/about", label: t("about"), tone: "about" },
            ] },
          ]}
        />

        <div className="site-header-actions">
          <Search />
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
