// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/app/[locale]/desk/page.tsx
// ----------------------------------------------------------------------------
// MY DESK, THE READER'S OWN PAGE (PRIME 12/11/2026 12:42: "yes on the most
// functionally rich and user convenient options"; PLAN-personal-desk-20261112).
// Named "My desk" (pt-BR "Minha bancada", es "Mi escritorio", de "Mein
// Schreibtisch", fr "Mon bureau", it "La mia scrivania").
//
// The server renders the frame: the title, one sentence on what the page is,
// and one on where it is kept, with the way to Settings (export, transfer
// link, sync). Everything the reader saved exists only in their browser, so
// the widgets are drawn there (src/components/desk/DeskPage.tsx), inside a
// slice carrying the page's own messages. The page asks search engines not to
// index it: it holds nothing until a reader fills it, and what it then holds
// is theirs. One page per live language, statically generated.
// ============================================================================

// The page's metadata type.
import type { Metadata } from "next";
// Server-side strings and static rendering.
import { getTranslations, setRequestLocale } from "next-intl/server";
// Locale-aware links.
import { Link } from "@/i18n/navigation";
// The site's chrome.
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
// The nested message provider (A1).
import MessageSlice from "@/components/MessageSlice";
// The page's body, drawn in the browser.
import DeskPage from "@/components/desk/DeskPage";

/**
 * The page's title and description; not indexed.
 *
 * @param props the route params
 * @returns the metadata
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  // The locale.
  const { locale } = await params;
  // The page's strings.
  const t = await getTranslations({ locale, namespace: "desk" });
  // Title and description; a personal page is followed, not indexed (and so left out of the sitemap).
  return { title: t("title"), description: t("metaDescription"), robots: { index: false, follow: true } };
}

/**
 * The page.
 *
 * @param props the route params
 * @returns the page
 */
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  // The locale.
  const { locale } = await params;
  // Static rendering for this locale.
  setRequestLocale(locale);
  // The page's strings.
  const t = await getTranslations("desk");
  // The Settings page's words for the counting switch (the same switch is in the Privacy and settings widget).
  const ts = await getTranslations("settings_page");
  // The page.
  return (
    <>
      <Header />
      <main id="main">
        <section className="section desk-section">
          <div className="container">
            <h1 className="page-hero-title">{t("title")}</h1>
            <p className="page-hero-lede">{t("lede")}</p>
            {/* Where the page is kept, in one sentence, with the way to keep a copy. */}
            <p className="desk-where">
              {t("where")} <Link href="/settings#desk" className="desk-link">{t("whereLink")}</Link>
            </p>
            {/* The reader's desk, drawn in the browser. */}
            <MessageSlice namespaces={["desk", "deskItem", "deskData.phase", "tools.categories"]}>
              {/* The counting switch's words in the Privacy and settings widget are the Settings page's own. */}
              <DeskPage
                interestLabels={{
                  toggle: ts("interestToggle"),
                  on: ts("interestOn"),
                  off: ts("interestOff"),
                  browserNo: ts("interestBrowserNo"),
                  more: ts("interestMore"),
                }}
              />
            </MessageSlice>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
