// ============================================================================
// src/app/[locale]/tools/page.tsx
// ----------------------------------------------------------------------------
// TOOLS INDEX — the hub for the toolbox. Renders every entry in the tool
// registry (src/config/tools.ts), grouped by category. Built to grow: today it
// lists one tool (the CIDR calculator), and new tools appear here automatically
// as they are added to the registry. Statically generated per locale.
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import { Link } from "@/i18n/navigation";
import { tools, toolCategories } from "@/config/tools";

export default async function ToolsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("tools");
  const tNav = await getTranslations("nav");

  const categories = toolCategories();

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article>
          {/* Hero */}
          <section className="certs-hero">
            <div className="container certs-container">
              <h1 className="certs-title">{t("title")}</h1>
              <p className="certs-lede">{t("lede")}</p>
            </div>
          </section>

          {/* One block per category */}
          {categories.map((category) => (
            <section className="section" key={category}>
              <div className="container certs-container">
                <h2 className="tools-category">{category}</h2>
                <ul className="tools-grid">
                  {tools
                    .filter((tool) => tool.category === category)
                    .map((tool) =>
                      tool.available ? (
                        <li key={tool.id}>
                          <Link href={tool.href} className="tools-card">
                            <h3 className="tools-card-name">{tool.name}</h3>
                            <p className="tools-card-blurb">{tool.blurb}</p>
                            <span className="tools-card-go" aria-hidden="true">
                              {t("open")} →
                            </span>
                          </Link>
                        </li>
                      ) : (
                        <li key={tool.id}>
                          <div className="tools-card tools-card--soon" aria-disabled="true">
                            <h3 className="tools-card-name">{tool.name}</h3>
                            <p className="tools-card-blurb">{tool.blurb}</p>
                            <span className="tools-card-soon">{t("comingSoon")}</span>
                          </div>
                        </li>
                      )
                    )}
                </ul>
              </div>
            </section>
          ))}

          {/* Growth note */}
          <section className="section">
            <div className="container certs-container">
              <p className="tools-note">{t("note")}</p>
            </div>
          </section>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
