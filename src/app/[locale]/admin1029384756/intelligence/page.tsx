// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/app/[locale]/admin1029384756/intelligence/page.tsx
// ----------------------------------------------------------------------------
// THE OPERATOR'S INTELLIGENCE DASHBOARD (PRIME 12/11/2026 02:16 and 02:35): which
// parts of the site get the most interest, and so deserve the next round of
// work. It sits beside the Console, on the same unguessable path, and follows
// the Console's rules for an internal page:
//   - generated in English only (one page, not one per language);
//   - noindex, nofollow (so it is also left out of the sitemap, which reads
//     each page's own robots directive);
//   - excluded from the site's search (data-pagefind-ignore);
//   - linked from the Console only.
//
// WHAT A VISITOR WHO FOUND THE ADDRESS WOULD SEE: the same aggregate figures
// the public Stats page shows, arranged differently. The one thing that is
// not public, the words of searches that found nothing, is refused by the
// Worker without the operator's key (worker/intel.ts); nothing of it is in
// this page's HTML or script. So the page is not hidden behind the preview
// switch the Console uses: it has nothing to hide that the server does not
// already guard.
//
// The page is a frame; everything on it is drawn by src/components/
// IntelDashboard.tsx from the site's own /api/stats/ routes.
// ============================================================================

// The page's metadata type.
import type { Metadata } from "next";
// Static rendering in the page's language.
import { setRequestLocale } from "next-intl/server";
// The link back to the Console, in the page's language.
import { Link } from "@/i18n/navigation";
// The site's header and footer.
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
// The dashboard itself.
import IntelDashboard from "@/components/IntelDashboard";

// An internal page: kept out of search engines.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Intelligence",
};

/**
 * English only: one internal page, not one per language.
 *
 * @returns the one language this page is built in
 */
export function generateStaticParams() {
  return [{ locale: "en" }];
}

/**
 * The dashboard's page.
 *
 * @param props the route's parameters (the language)
 * @returns the page
 */
export default async function IntelligencePage({ params }: { params: Promise<{ locale: string }> }) {
  // The language of this render.
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    // The whole page, header and footer included, is left out of the site's search, as the Console is.
    <div data-pagefind-ignore="all" style={{ display: "contents" }}>
      <Header />
      <main id="main" data-pagefind-ignore="all">
        <section className="section">
          <div className="container">
            <p className="hero-eyebrow">Console</p>
            <h1 className="admin-title">Intelligence</h1>
            <p className="admin-lede">
              What is read and what is used, so the next round of work goes where the interest is. Pages read are counted
              at the server for every reader; uses, rounds, reads to the end, shares and searches come only from readers
              who said yes to the interest counts. Everything here is a count of the site, never of a person.
            </p>
            <p className="admin-lede">
              <Link href="/admin1029384756">Back to the Console</Link>
            </p>
            <IntelDashboard />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
