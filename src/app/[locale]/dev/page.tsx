// ============================================================================
// src/app/[locale]/dev/page.tsx
// ----------------------------------------------------------------------------
// THE /dev INDEX - the little landing for the developer wing. Two rooms:
// /dev/fun (the not-serious shelf, default weather) and /dev/other (the
// green room, where tools ask the live internet). Same classification,
// navigation, display, and localization disciplines as /tools and /learn:
// canonical /dev under the locale tree, localized metadata, house shell,
// existing card vocabulary (devfun-card reused; the /dev/other card carries
// the environment badge in its characteristic tone).
// ============================================================================
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dev" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function DevIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dev");

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
              {/* Room one: /dev/fun — default weather. */}
              <Link href="/dev/fun" className="devfun-card">
                <span className="devfun-card-top">
                  <span className="devfun-card-name">{t("fun.title")}</span>
                  <span className="devfun-card-arrow" aria-hidden="true">
                    &#8594;
                  </span>
                </span>
                <span className="devfun-card-desc">{t("fun.tagline")}</span>
              </Link>

              {/* Room two: /dev/other — the green room, badged in its own tone. */}
              <Link href="/dev/other" className="devfun-card">
                <span className="devfun-card-top">
                  <span className="devfun-card-name">{t("other.title")}</span>
                  <span className="envother-badge mono">{t("other.badge")}</span>
                  <span className="devfun-card-arrow" aria-hidden="true">
                    &#8594;
                  </span>
                </span>
                <span className="devfun-card-desc">{t("other.tagline")}</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
