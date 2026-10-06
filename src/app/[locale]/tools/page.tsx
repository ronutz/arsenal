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
// Step 3 of Round 1 (wave T, 2026-10-06): the paste box that runs every manifest's input detectors (E3), the
// intents derived from the catalogue's posture verbs (E1), the five starter workflows (E4) and the three floors
// stated in one paragraph (E5).
import PasteWhatYouHave from "@/components/PasteWhatYouHave";
import { WORKFLOWS } from "@/content/tools/workflows";
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

  // INTENTS (E1, SCOUT, adopted 2026-10-06): the guided layer groups the generic index by what the reader needs
  // to DO, derived from each tool's catalogue posture rather than from a new field nobody remembers to set
  // (D-74). The posture's first verb decides: decode and parse are "decode"; explain, reference, lookup,
  // compare, map, classify, triage and translate are "understand"; compute, calculate, convert and transform
  // are "compute"; build, generate and structure are "build"; validate, verify, lint, test and simulate are
  // "check". A posture with no known verb falls to "understand", the catalogue's commonest posture.
  const INTENTS = ["decode", "understand", "compute", "build", "check"] as const;
  type Intent = (typeof INTENTS)[number];
  const intentOf = (posture: string | undefined): Intent => {
    const verb = (posture ?? "").toLowerCase().match(/[a-z]+/)?.[0] ?? "";
    if (/^(decode|parse)$/.test(verb)) return "decode";
    if (/^(compute|calculate|convert|transform)$/.test(verb)) return "compute";
    if (/^(build|generate|structure)$/.test(verb)) return "build";
    if (/^(validate|verify|lint|test|simulate)$/.test(verb)) return "check";
    return "understand";
  };
  const intents = INTENTS.map((intent) => ({
    intent,
    tools: agnosticTools
      .filter((tl) => intentOf(cat.get(tl.id)?.posture) === intent)
      .sort((a, b) => t(`${a.id}.name`).localeCompare(t(`${b.id}.name`), locale)),
  })).filter((g) => g.tools.length > 0);

  // PASTE WHAT YOU HAVE (E3): every tool the page can link, generic index and hubs alike, by slug, with its
  // localised name and page; the detectors run in the browser against the pasted text (see the component).
  const pasteTargets = Object.fromEntries(
    tools.filter((tl) => tl.available).map((tl) => [tl.id, { name: t(`${tl.id}.name`), href: `/${locale}${tl.href}/` }]),
  );

  // WORKFLOWS (E4): the five starter chains resolved against the registry; a slug that is not built is dropped
  // from the chain here and reported by the guard, never shown as a dead link.
  const builtById = new Map(tools.filter((tl) => tl.available).map((tl) => [tl.id, tl]));
  const workflows = WORKFLOWS.map((w) => ({
    id: w.id,
    steps: w.steps
      .filter((st) => builtById.has(st.slug))
      .map((st) => ({
        slug: st.slug,
        name: t(`${st.slug}.name`),
        href: builtById.get(st.slug)!.href,
        alternatives: (st.alternatives ?? []).filter((a) => builtById.has(a)).map((a) => ({ slug: a, name: t(`${a}.name`), href: builtById.get(a)!.href })),
      })),
  }));

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
              {/* THE THREE FLOORS, stated once (E5, SCOUT, adopted 2026-10-06): the main floor, the green room and
                  the red room, each named with what it promises, each a link to where it begins. */}
              <p className="tools-floors">
                {t.rich("hub.floors", {
                  main: (chunks) => <a href="#directory" className="tools-floors-link">{chunks}</a>,
                  green: (chunks) => <a href="#room-green" className="tools-floors-link tools-floors-link--green">{chunks}</a>,
                  red: (chunks) => <a href="#room-red" className="tools-floors-link tools-floors-link--red">{chunks}</a>,
                })}
              </p>
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

            {/* PASTE WHAT YOU HAVE (E3): the box that runs every manifest's input detectors over the pasted text
                and offers the tools that recognise it. Nothing leaves the browser. */}
            <section className="hub-paste" aria-labelledby="hub-paste-title">
              <h2 className="section-title hub-h2" id="hub-paste-title">{t("hub.pasteTitle")}</h2>
              <p className="hub-lede">{t("hub.pasteLede")}</p>
              <PasteWhatYouHave
                targets={pasteTargets}
                label={t("hub.pasteLabel")}
                placeholder={t("hub.pastePlaceholder")}
                hint={t("hub.pasteHint")}
                resultsLabel={t("hub.pasteResults")}
                noMatch={t("hub.pasteNoMatch")}
                clearLabel={t("hub.pasteClear")}
              />
            </section>

            {/* BY WHAT YOU NEED TO DO (E1): the five intents, each a closed list of its tools with one line on the
                posture it groups. Derived from the catalogue's posture verbs; see intentOf above. */}
            <section className="hub-intents" aria-labelledby="hub-intents-title">
              <h2 className="section-title hub-h2" id="hub-intents-title">{t("hub.intentsTitle")}</h2>
              <p className="hub-lede">{t("hub.intentsLede")}</p>
              <div className="hub-intent-grid">
                {intents.map((g) => (
                  <details key={g.intent} className="hub-intent" id={`intent-${g.intent}`}>
                    <summary className="hub-intent-summary">
                      <span className="hub-intent-title">{t(`hub.intents.${g.intent}.title`)}</span>
                      <span className="hub-intent-count mono">{g.tools.length}</span>
                    </summary>
                    <p className="hub-intent-lede">{t(`hub.intents.${g.intent}.lede`)}</p>
                    <ul className="hub-intent-list">
                      {g.tools.map((tl) => (
                        <li key={tl.id}>
                          <Link href={tl.href} className="hub-intent-link">{t(`${tl.id}.name`)}</Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            </section>

            {/* WORKFLOWS (E4): five chains that follow one artefact from tool to tool; a forked step lists its
                vendor alternatives. Started here, grows by data (src/content/tools/workflows.ts). */}
            <section className="hub-workflows" aria-labelledby="hub-workflows-title">
              <h2 className="section-title hub-h2" id="hub-workflows-title">{t("hub.workflowsTitle")}</h2>
              <p className="hub-lede">{t("hub.workflowsLede")}</p>
              <ul className="hub-workflow-list">
                {workflows.map((w) => (
                  <li key={w.id} className="hub-workflow">
                    <h3 className="hub-workflow-title">{t(`hub.workflows.${w.id}.title`)}</h3>
                    <p className="hub-workflow-lede">{t(`hub.workflows.${w.id}.lede`)}</p>
                    <ol className="hub-workflow-steps">
                      {w.steps.map((st) => (
                        <li key={st.slug} className="hub-workflow-step">
                          <Link href={st.href} className="hub-workflow-link">{st.name}</Link>
                          {st.alternatives.length > 0 && (
                            <span className="hub-workflow-alts">
                              {" "}{t("hub.workflowsOr")}{" "}
                              {st.alternatives.map((a, i) => (
                                <span key={a.slug}>
                                  {i > 0 && ", "}
                                  <Link href={a.href} className="hub-workflow-link hub-workflow-link--alt">{a.name}</Link>
                                </span>
                              ))}
                            </span>
                          )}
                        </li>
                      ))}
                    </ol>
                  </li>
                ))}
              </ul>
            </section>

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

          {/* THE GENERAL-PURPOSE INDEX, named and counted (E7): the directory layer begins here. Renamed from "The complete
              index" on 2026-10-06 (SCOUT's adoption audit, rows 5 and 22): it lists the general-purpose tools, so the lede
              states that scope and counts the platform tools beside it (every available tool this index does not list),
              with the door to the vendor hubs where they live. */}
          <div className="container certs-container hub-directory-head" id="directory">
            <h2 className="section-title hub-h2">{t("hub.directoryTitle")}</h2>
            <p className="hub-lede">
              {t.rich("hub.directoryLede", {
                count: agnosticTools.length,
                categories: categories.length,
                platform: tools.filter((tl) => tl.available).length - agnosticTools.length,
                hubs: (chunks) => <Link href="/vendor-hubs">{chunks}</Link>,
              })}
            </p>
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
