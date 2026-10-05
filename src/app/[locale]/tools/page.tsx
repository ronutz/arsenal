// ============================================================================
// src/app/[locale]/tools/page.tsx
// ----------------------------------------------------------------------------
// TOOLS INDEX — the hub for the toolbox. Renders every entry in the tool
// registry (src/config/tools.ts), grouped by category. Built to grow: today it
// lists one tool (the CIDR calculator), and new tools appear here automatically
// as they are added to the registry. Statically generated per locale.
// ============================================================================

import { getTranslations, setRequestLocale } from "next-intl/server";
import { ogImages } from "@/lib/og";
import Header from "@/components/Header";
import HubSearch from "@/components/HubSearch";
import SiteFooter from "@/components/SiteFooter";
import { Link } from "@/i18n/navigation";
import { tools, toolCategories } from "@/config/tools";
import { CATALOGUE } from "@/content/catalogue/catalogue";
import FamilyChip from "@/components/FamilyChip";
import WasmChip from "@/components/WasmChip";
import { categoryColor } from "@/config/categoryColors";
import { vendorColor, populatedVendors } from "@/config/vendors";
import ScrollToTop from "@/components/ScrollToTop";
import CategoryFilter from "@/components/CategoryFilter";
import ViewToggle from "@/components/ViewToggle";
// Wave T, the cheap half (2026-10-05; SCOUT E6, E7): the Guided | Directory switch built for Learn, and "Recently
// added" derived from the changelog the way the home's New column is, never typed.
import HubViewSwitch from "@/components/HubViewSwitch";
import { CHANGELOG } from "@/content/changelog/changelog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tools" });
  const alt = t("title");
  // Static page OG card (see scripts/gen-og.mts + src/lib/og.ts).
  return { title: alt, ...ogImages("page", "tools", locale, alt) };
}

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
  const tp = await getTranslations("tools.portal");

  // The generic index lists VENDOR-AGNOSTIC tools only (PRIME directive
  // 2026-07-03); vendor tools live on their hubs, linked in the strip above.
  // Open-standard tools with a vendor AFFILIATION (vendorNeutral) belong in the
  // generic grid too - the hub tag must not hide a standards tool (see
  // src/config/tools.ts).
  const agnosticTools = tools.filter((t) => t.available && (!(t.vendors ?? []).length || t.vendorNeutral));
  // Public-safe catalogue join for the list view: posture and anchors are
  // already public on the roadmap; isNew/vectors are quality signals, not
  // internal machinery (ranks, notes, merge IDs stay admin-only).
  const cat = new Map(CATALOGUE.map((e) => [e.slug, e]));
  const categories = [...new Set(agnosticTools.map((t) => t.category))].sort((a, b) =>
    t(`categories.${a}`).localeCompare(t(`categories.${b}`), locale),
  );

  // RECENTLY ADDED (E6): the newest tools, read from the changelog's "tool" entries (newest first, the array's
  // order), each tool once, those the generic index lists (vendor tools belong to their hubs), at most six. The
  // date shown is the entry's; nothing here is typed by hand.
  const byId = new Map(agnosticTools.map((tl) => [tl.id, tl]));
  const recent: { id: string; href: string; date: string }[] = [];
  for (const entry of CHANGELOG) {
    if (entry.kind !== "tool" || !entry.tools) continue;
    for (const id of entry.tools) {
      const tl = byId.get(id);
      if (tl && !recent.some((r) => r.id === id)) recent.push({ id, href: tl.href, date: entry.date });
    }
    if (recent.length >= 6) break;
  }
  const dateFmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });

  // Tool count per vendor hub, computed the same way the hub route filters its
  // tools, so the number shown in the strip always matches what the hub lists.
  const vendorToolCount = (v: string) =>
    tools.filter((tl) => tl.available && (tl.vendors ?? []).includes(v)).length;

  return (
    <>
      <a href="#main" className="skip-link" data-pagefind-ignore>
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
              {/* The scoped search field (wave 0, 2026-10-05; SCOUT E2): opens the one dialog inside the Use world. */}
              <HubSearch scope="use" label={t("hubSearch.label")} placeholder={t("hubSearch.placeholder")} examplesLabel={t("hubSearch.examples")} examples={["CIDR", "JWT", "BIG-IP", "FortiGate", "syslog", "regex"]} />
              {/* Guided | Directory (E7): the same switch Learn has; Directory hides the guided layer below so the
                  complete index and its controls come first; remembered per surface; #directory opens it. */}
              <HubViewSwitch targetId="main" storageKey="ronutz:hub:tools" legend={t("hub.switchLegend")} guidedLabel={t("hub.switchGuided")} directoryLabel={t("hub.switchDirectory")} />
            </div>
          </section>

          {/* PORTAL CARDS replacing the per-vendor pill strip (PRIME
              2026-08-06). The strip grew by one pill for every populated
              vendor and had become a wall of near-identical links; these four
              are a fixed set that does not grow with the catalogue.

              WIDE rather than tall (PRIME's preference): each carries a
              sentence of explanation, and a tall card wastes the width the
              sentence needs while pushing the tools index further down the
              page - which is the thing the first card exists to counteract.

              The first is an in-page jump, mirroring what /learn already does:
              this page IS the tool index, and it sat below a screen of
              signposting with nothing pointing back at it. */}
          <div className="container certs-container hub-guided">
            <div className="learn-portal-grid learn-portal-grid-wide">
              <a href="#tools-index" className="learn-portal-card learn-portal-card-wide" style={{ "--note-accent": "var(--accent-primary)" } as React.CSSProperties}>
                <span className="learn-portal-ornament" aria-hidden>&#9660;</span>
                <p className="learn-portal-title">
                  {tp("jumpTitle")} <span className="learn-portal-arrow">&#8595;</span>
                </p>
                <p className="learn-portal-lede">{tp("jumpLede")}</p>
              </a>
              <Link href="/vendor-hubs" className="learn-portal-card learn-portal-card-wide" style={{ "--note-accent": "var(--color-success)" } as React.CSSProperties}>
                <span className="learn-portal-ornament" aria-hidden>&#9670;</span>
                <p className="learn-portal-title">
                  {tp("hubsTitle")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{tp("hubsLede")}</p>
              </Link>
              <Link href="/study-guides" className="learn-portal-card learn-portal-card-wide" style={{ "--note-accent": "var(--color-warning)" } as React.CSSProperties}>
                <span className="learn-portal-ornament" aria-hidden>&#9632;</span>
                <p className="learn-portal-title">
                  {tp("guidesTitle")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{tp("guidesLede")}</p>
              </Link>
              <Link href="/certifications" className="learn-portal-card learn-portal-card-wide" style={{ "--note-accent": "var(--color-danger)" } as React.CSSProperties}>
                <span className="learn-portal-ornament" aria-hidden>&#10003;</span>
                <p className="learn-portal-title">
                  {tp("examsTitle")} <span className="learn-portal-arrow">&#8594;</span>
                </p>
                <p className="learn-portal-lede">{tp("examsLede")}</p>
              </Link>
            </div>

            {/* RECENTLY ADDED (E6): the newest tools with their dates, from the changelog. */}
            {recent.length > 0 && (
              <section className="hub-recent" aria-labelledby="hub-recent-title">
                <h2 className="section-title hub-h2" id="hub-recent-title">{t("hub.recentTitle")}</h2>
                <p className="hub-lede">{t("hub.recentLede")}</p>
                <ul className="hub-around-list">
                  {recent.map((r) => (
                    <li key={r.id} className="hub-around-item hub-recent-item">
                      <Link href={r.href} className="hub-around-link">{t(`${r.id}.name`)}</Link>
                      <span className="hub-around-lede">{t(`${r.id}.blurb`)}</span>
                      <time className="hub-recent-date mono" dateTime={r.date}>{dateFmt.format(new Date(`${r.date}T12:00:00Z`))}</time>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* THE COMPLETE INDEX, named and counted (E7): the directory layer begins here. */}
          <div className="container certs-container hub-directory-head" id="directory">
            <h2 className="section-title hub-h2">{t("hub.directoryTitle")}</h2>
            <p className="hub-lede">{t("hub.directoryLede", { count: agnosticTools.length, categories: categories.length })}</p>
          </div>


          {/* Sticky nav-utility bar (PRIME 2026-07-09): jump-to + show-only +
              view density in one strip that sticks just below the site header on
              scroll, so both selectors stay reachable. Collapsed by default (the
              jump-nav <details> and the per-category chips both start closed). */}
          {categories.length > 1 && (
            <div className="nav-utility-bar">
              {/* Jump target for the first portal card. Placed on the
                  utility bar because that is the top of the actual index -
                  landing on the first category would skip the filters. */}
              <div id="tools-index" className="container certs-container nav-utility-inner">
                {/* Jump-to: native <details>, no JS; summary is a prominent pill. */}
                <details className="jumpnav">
                  <summary className="jumpnav-summary" aria-label={t("jumpTo")}>
                    <span className="jumpnav-chevron" aria-hidden="true">
                      &#9656;
                    </span>
                    {t("jumpTo")}
                  </summary>
                  <ul className="category-nav-list">
                    {categories.map((category) => (
                      <li key={category} data-jumpnav={category}>
                        <a href={`#${category}`} className="category-nav-link">
                          {t(`categories.${category}`)}
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
                {/* Show-only (filters what is displayed) + cards/list density. */}
                <div className="nav-utility-controls">
                  <CategoryFilter
                    legend={t("filterLegend")}
                    allLabel={t("filterAll")}
                    noneLabel={t("filterNone")}
                    emptyLabel={t("filterEmpty")}
                    moreLabel={t("filterMore")}
                    fewerLabel={t("filterFewer")}
                    groups={categories.map((category) => ({
                      key: category,
                      sectionId: category,
                      label: t(`categories.${category}`),
                      color: categoryColor(category),
                    }))}
                  />
                  <ViewToggle
                    targetId="main"
                    storageKey="ronutz:view:tools"
                    legend={t("viewLegend")}
                    cardsLabel={t("viewCards")}
                    listLabel={t("viewList")}
                  />
                </div>
              </div>
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
                              {/* The short WebAssembly mark: this tool downloads a third-party engine on first use. */}
                              {tool.runtime === "wasm" && <WasmChip label={t("wasmPillShort")} />}
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
                                <span className="admin-badges">
                                  <FamilyChip
                                    category={tool.category}
                                    label={t(`categories.${tool.category}`)}
                                  />
                                  {c?.isNew && <span className="admin-tag admin-tag--new">new</span>}
                                  {typeof c?.vectors === "number" && (
                                    <span
                                      className="admin-tag"
                                      title={t(c?.verification === "snapshot" ? "listHead.svTitle" : "listHead.gvTitle")}
                                    >
                                      {`${c.vectors} ${c?.verification === "snapshot" ? "SV" : "GV"}`}
                                    </span>
                                  )}
                                </span>
                              </td>
                              <td className="mono admin-posture">{c?.posture ?? "-"}</td>
                              <td className="admin-specs">{c?.specs?.length ? c.specs.join(" · ") : "-"}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          ))}

          {/* ---- The rooms as categories (QF-2) ----------------------------
              The green and red rooms each get their own category section: one
              explainer card, tinted to the room's palette, leading to its index.
              This replaces the former quiet mono door-links and the growth note.
              Rendered as .tools-grid single-card sections so they sit in the same
              rhythm as the tool categories above. */}
          <section id="room-green" className="section room-section room-section--green">
            <div className="container certs-container">
              <h2 className="tools-category room-section-heading">
                {t("roomsGreenCategory")}
              </h2>
              <ul className="tools-grid">
                <li className="tools-grid-item">
                  <Link href="/dev/other" className="tools-card room-card">
                    <h3 className="tools-card-name">{t("roomsGreenTitle")}</h3>
                    <p className="tools-card-blurb">{t("roomsGreenDesc")}</p>
                    <span className="room-card-cta">{t("roomsGreenCta")}</span>
                  </Link>
                </li>
              </ul>
            </div>
          </section>
          <section id="room-red" className="section room-section room-section--red">
            <div className="container certs-container">
              <h2 className="tools-category room-section-heading">
                {t("roomsRedCategory")}
              </h2>
              <ul className="tools-grid">
                <li className="tools-grid-item">
                  <Link href="/dev/out" className="tools-card room-card">
                    <h3 className="tools-card-name">{t("roomsRedTitle")}</h3>
                    <p className="tools-card-blurb">{t("roomsRedDesc")}</p>
                    <span className="room-card-cta">{t("roomsRedCta")}</span>
                  </Link>
                </li>
              </ul>
            </div>
          </section>
          {/* A quiet door to /dev/fun — the not-serious shelf. No emphasis.
              Same treatment as the colophon's footer link. Kept quiet on
              purpose: the toys are not a category, unlike the two rooms above. */}
          <p className="colophon-devfun mono">
            <Link href="/dev/fun" className="colophon-devfun-link">
              /dev/fun
            </Link>
          </p>
        </article>
      </main>

      <SiteFooter />

      <ScrollToTop label={t("backToTop")} />
    </>
  );
}
