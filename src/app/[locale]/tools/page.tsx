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
import FamilyChip from "@/components/FamilyChip";
import { categoryColor } from "@/config/categoryColors";
import { vendorColor, browseVendors } from "@/config/vendors";
import ToolVendorFilter from "@/components/ToolVendorFilter";

export default async function ToolsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("tools");
  const tNav = await getTranslations("nav");

  // Vendor families to offer in the browse-by-vendor filter (populated + always-show).
  const vendorKeys = browseVendors();

  // Alphabetical (locale-aware) by the resolved category label, so each
  // language sees its categories in its own A->Z order.
  const categories = [...toolCategories()].sort((a, b) =>
    t(`categories.${a}`).localeCompare(t(`categories.${b}`), locale),
  );

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

          {/* Browse by vendor (client-side filter; progressive enhancement) */}
          {vendorKeys.length > 0 && (
            <div className="container certs-container tools-jumpnav" style={{ marginTop: "2rem" }}>
              <ToolVendorFilter
                vendors={vendorKeys}
                labels={Object.fromEntries(vendorKeys.map((v) => [v, t(`vendors.${v}`)]))}
                allLabel={t("vendorFilterAll")}
                legend={t("vendorFilterLabel")}
              />
            </div>
          )}

          {/* Category jump-nav */}
          {categories.length > 1 && (
            <div className="container certs-container tools-jumpnav" style={{ marginTop: "2rem" }}>
              <nav className="category-nav" aria-label={t("jumpTo")}>
                <span className="category-nav-label">{t("jumpTo")}</span>
                <ul className="category-nav-list">
                  {categories.map((category) => (
                    <li key={category} data-jumpnav={category}>
                      <a href={`#${category}`} className="category-nav-link">
                        {t(`categories.${category}`)}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          )}

          {/* One block per category */}
          {categories.map((category) => (
            <section className="section category-section" id={category} key={category}>
              <div className="container certs-container">
                <h2 className="tools-category">
                  <span
                    className="category-dot"
                    style={{ "--chip-color": categoryColor(category) } as React.CSSProperties}
                    aria-hidden="true"
                  />
                  <Link href={`/category/${category}`} className="tools-category-link">
                    {t(`categories.${category}`)}
                  </Link>
                </h2>
                <ul className="tools-grid">
                  {tools
                    .filter((tool) => tool.category === category)
                    .sort((a, b) =>
                      t(`${a.id}.name`).localeCompare(t(`${b.id}.name`), locale),
                    )
                    .map((tool) =>
                      tool.available ? (
                        <li key={tool.id} className="tools-grid-item" data-vendors={(tool.vendors ?? []).join(" ")}>
                          <Link href={tool.href} className="tools-card">
                            <h3 className="tools-card-name">{t(`${tool.id}.name`)}</h3>
                            <p className="tools-card-blurb">{t(`${tool.id}.blurb`)}</p>
                            <span className="family-chip-row">
                              <FamilyChip
                                category={tool.category}
                                label={t(`categories.${tool.category}`)}
                              />
                              {(tool.vendors ?? []).map((v) => (
                                <FamilyChip
                                  key={v}
                                  category={v}
                                  color={vendorColor(v)}
                                  label={t(`vendors.${v}`)}
                                />
                              ))}
                            </span>
                            <span className="tools-card-go" aria-hidden="true">
                              {t("open")} →
                            </span>
                          </Link>
                        </li>
                      ) : (
                        <li key={tool.id} className="tools-grid-item" data-vendors={(tool.vendors ?? []).join(" ")}>
                          <div className="tools-card tools-card--soon" aria-disabled="true">
                            <h3 className="tools-card-name">{t(`${tool.id}.name`)}</h3>
                            <p className="tools-card-blurb">{t(`${tool.id}.blurb`)}</p>
                            <span className="family-chip-row">
                              <FamilyChip
                                category={tool.category}
                                label={t(`categories.${tool.category}`)}
                              />
                              {(tool.vendors ?? []).map((v) => (
                                <FamilyChip
                                  key={v}
                                  category={v}
                                  color={vendorColor(v)}
                                  label={t(`vendors.${v}`)}
                                />
                              ))}
                            </span>
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
