// ============================================================================
// src/app/[locale]/dev/fun/page.tsx
// ----------------------------------------------------------------------------
// /dev/fun — THE INDEX of the not-serious shelf (PRIME 04/07/2026). The toys
// themselves (Mega Brain, Meeting Bingo) live one level down; this page is the
// front door they never had: linked from the quiet end of the site footer's
// machine line and from the bottom of the colophon.
//
// Deliberately OUTSIDE the /tools framework, like everything under /dev/fun:
// no catalogue entries, no golden vectors. Renders in every locale; copy is
// authored in the i18n catalogs for en + pt-BR, with the other locales served
// by the English per-key fallback until translated (the standard path).
//
// The toy list is a hand-kept constant: /dev/fun earns a new entry only when
// something ships, and each entry is two catalog keys plus an href. When a
// third toy lands, add it here and to the devFun.toys catalog namespace.
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import { Link } from "@/i18n/navigation";

// The shelf, in shipping order. `badge` marks a toy whose content exists in a
// single language (the Mega Brain speaks Portuguese only, by design).
const TOYS = [
  { key: "megaBrain", href: "/dev/fun/mega-brain", badged: true },
  { key: "meetingBingo", href: "/dev/fun/meeting-bingo", badged: false },
  { key: "bossScreens", href: "/dev/fun/boss-screens", badged: false },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "devFun" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function DevFunIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("devFun");

  return (
    <>
      <Header />
      <main id="main">
        <section className="section">
          <div className="container devfun-page-container">
            <div className="devfun-head">
              <h1 className="devfun-title">{t("title")}</h1>
              <p className="devfun-tagline">{t("tagline")}</p>
              <p className="devfun-intro">{t("intro")}</p>
            </div>

            <div className="devfun-list">
              {TOYS.map((toy) => (
                <Link key={toy.key} href={toy.href} className="devfun-card">
                  <span className="devfun-card-top">
                    <span className="devfun-card-name">{t(`toys.${toy.key}.name`)}</span>
                    {toy.badged && (
                      <span className="devfun-badge mono">{t(`toys.${toy.key}.badge`)}</span>
                    )}
                    <span className="devfun-card-arrow" aria-hidden="true">
                      &#8594;
                    </span>
                  </span>
                  <span className="devfun-card-desc">{t(`toys.${toy.key}.desc`)}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
