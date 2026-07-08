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
import { CATALOGUE } from "@/content/catalogue/catalogue";
import FamilyChip from "@/components/FamilyChip";
import { categoryColor } from "@/config/categoryColors";
import { vendorColor, populatedVendors } from "@/config/vendors";
import ScrollToTop from "@/components/ScrollToTop";
import CategoryFilter from "@/components/CategoryFilter";
import ViewToggle from "@/components/ViewToggle";

export default async function ToolsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("tools");
  const tHub = await getTranslations("vendorHub"); // hub-strip chrome
  const tNav = await getTranslations("nav");

  // The generic index lists VENDOR-AGNOSTIC tools only (PRIME directive
  // 2026-07-03); vendor tools live on their hubs, linked in the strip above.
  const agnosticTools = tools.filter((t) => t.available && !(t.vendors ?? []).length);
  // Public-safe catalogue join for the list view: posture and anchors are
  // already public on the roadmap; isNew/vectors are quality signals, not
  // internal machinery (ranks, notes, merge IDs stay admin-only).
  const cat = new Map(CATALOGUE.map((e) => [e.slug, e]));
  const categories = [...new Set(agnosticTools.map((t) => t.category))].sort((a, b) =>
    t(`categories.${a}`).localeCompare(t(`categories.${b}`), locale),
  );

  // Tool count per vendor hub, computed the same way the hub route filters its
  // tools, so the number shown in the strip always matches what the hub lists.
  const vendorToolCount = (v: string) =>
    tools.filter((tl) => tl.available && (tl.vendors ?? []).includes(v)).length;

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
              <p className="hero-eyebrow">{t("eyebrow")}</p>
              <h1 className="page-hero-title">{t("title")}</h1>
              <p className="page-hero-lede">{t("lede")}</p>
            </div>
          </section>

          {/* Vendor hub strip - hub discoverability lives HERE, on top of the
              listing, not in the header (nav stays small; PRIME 2026-07-03).
              One pill per POPULATED vendor, same source as the hub route, so
              new vendors appear automatically. Label reuses the localized
              vendor name + the vendorHub.eyebrow chrome key. */}
          {populatedVendors().length > 0 && (
            <div className="container certs-container vendor-hub-strip">
              {populatedVendors().map((v) => (
                <Link key={v} href={`/${v}`} className="vendor-hub-strip-link">
                  <span
                    className="category-dot"
                    style={{ "--chip-color": vendorColor(v) } as React.CSSProperties}
                    aria-hidden="true"
                  />
                  {t(`vendors.${v}`)} {tHub("eyebrow")}{" "}
                  <span className="vendor-hub-strip-count">({vendorToolCount(v)})</span> →
                </Link>
              ))}
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

          {/* Second nav utility: show/hide categories (client island; the
              jump-nav above scrolls, this one filters what is displayed). */}
          {categories.length > 1 && (
            <div className="container certs-container">
              <CategoryFilter
                legend={t("filterLegend")}
                allLabel={t("filterAll")}
                noneLabel={t("filterNone")}
                emptyLabel={t("filterEmpty")}
                groups={categories.map((category) => ({
                  key: category,
                  sectionId: category,
                  label: t(`categories.${category}`),
                  color: categoryColor(category),
                }))}
              />
              {/* Third nav utility: cards/list density (client island; sets
                  data-view on <main>, CSS re-flows the same cards into rows). */}
              <ViewToggle
                targetId="main"
                storageKey="ronutz:view:tools"
                legend={t("viewLegend")}
                cardsLabel={t("viewCards")}
                listLabel={t("viewList")}
              />
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
                  {agnosticTools
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

                {/* LIST VIEW — the same tools in catalogue anatomy, reusing the
                    admin-table vocabulary (the reference layout). Hidden by
                    default; main[data-view="list"] swaps the grid for this. */}
                <div className="admin-table-wrap pubcat">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>{t("listHead.tool")}</th>
                        <th>{t("listHead.badges")}</th>
                        <th>{t("listHead.posture")}</th>
                        <th>{t("listHead.anchors")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agnosticTools
                        .filter((tool) => tool.category === category)
                        .sort((a, b) =>
                          t(`${a.id}.name`).localeCompare(t(`${b.id}.name`), locale),
                        )
                        .map((tool) => {
                          const c = cat.get(tool.id);
                          return (
                            <tr key={tool.id} data-vendors={(tool.vendors ?? []).join(" ")}>
                              <td>
                                <Link href={tool.href} className="pubcat-toollink">
                                  <span className="admin-name">{t(`${tool.id}.name`)}</span>
                                  <span className="admin-slug mono">{tool.id}</span>
                                </Link>
                              </td>
                              <td className="admin-status-cell">
                                <FamilyChip
                                  category={tool.category}
                                  label={t(`categories.${tool.category}`)}
                                />
                                {c?.isNew && <span className="admin-tag admin-tag--new">new</span>}
                                {typeof c?.vectors === "number" && (
                                  <span className="admin-tag">{c.vectors} GV</span>
                                )}
                              </td>
                              <td className="mono admin-posture">{c?.posture ?? "—"}</td>
                              <td className="admin-specs">{c?.specs?.length ? c.specs.join(" · ") : "—"}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          ))}

          {/* Growth note */}
          <section className="section">
            <div className="container certs-container">
              <p className="tools-note">{t("note")}</p>
            </div>
          </section>
          {/* A quiet door to /dev/fun — the not-serious shelf. No emphasis.
              Same treatment as the colophon's footer link. */}
          <p className="colophon-devfun mono">
            <Link href="/dev/fun" className="colophon-devfun-link">
              /dev/fun
            </Link>
          </p>
          {/* The green door: /dev/other, in the other environment's
              characteristic tone, after the last listed tool (PRIME 08/07). */}
          <p className="colophon-devfun mono devother-door">
            <Link href="/dev/other" className="devother-door-link">
              /dev/other
            </Link>
            <span className="devother-door-tagline">{t("devOtherTagline")}</span>
          </p>
          {/* The red door: /dev/out, the egress room, right after the green
              one (PRIME 08/07: basic-colors triad). */}
          <p className="colophon-devfun mono devout-door">
            <Link href="/dev/out" className="devout-door-link">
              /dev/out
            </Link>
            <span className="devout-door-tagline">{t("devOutTagline")}</span>
          </p>
        </article>
      </main>

      <SiteFooter />

      <ScrollToTop label={t("backToTop")} />
    </>
  );
}
