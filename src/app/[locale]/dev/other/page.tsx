// ============================================================================
// src/app/[locale]/dev/other/page.tsx
// ----------------------------------------------------------------------------
// THE /dev/other INDEX - the green room. Tools here ASK the live internet
// instead of computing locally, so the whole page (header + main + footer)
// wraps in .env-other: the hue-rotated Obsidian mini-theme whose deep-green
// background marks "another environment". The full four-paragraph notice
// renders here; tool pages carry the compact version. Cards reuse the house
// tools-card vocabulary - the tokens turn green for free inside the wrapper.
// ============================================================================
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import EnvOtherNotice from "@/components/EnvOtherNotice";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "devOther" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

// The room's inventory. Grows as C-87 tools land; each entry pairs a route
// with its i18n key under devOther.tools.*.
const OTHER_TOOLS = [{ key: "rdapLookup", href: "/dev/other/rdap-lookup" }] as const;

export default async function DevOtherIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("devOther");

  return (
    <div className="env-other">
      <Header />
      <main id="main">
        <section className="section">
          <div className="container devfun-page-container">
            <div className="devfun-head">
              <h1 className="devfun-title">
                {t("title")} <span className="envother-badge mono">{t("badge")}</span>
              </h1>
              <p className="devfun-tagline">{t("tagline")}</p>
              <p className="devfun-intro">{t("intro")}</p>
            </div>

            <EnvOtherNotice />

            <ul className="tools-grid">
              {OTHER_TOOLS.map((tool) => (
                <li key={tool.key} className="tools-grid-item">
                  <Link href={tool.href} className="tools-card">
                    <h3 className="tools-card-name">{t(`tools.${tool.key}.name`)}</h3>
                    <p className="tools-card-blurb">{t(`tools.${tool.key}.blurb`)}</p>
                  </Link>
                </li>
              ))}
            </ul>

            <p className="tools-note" style={{ marginTop: "1.5rem" }}>
              <Link href="/dev" className="devother-door-link">
                {t("backToDev")}
              </Link>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
