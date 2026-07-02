// ============================================================================
// src/app/[locale]/admin1029384756/page.tsx
// ----------------------------------------------------------------------------
// ADMIN CONSOLE — internal control + catalogue surface.
//
// Moved OFF the guessable /admin path to an unguessable URI (PRIME decision):
// the static site has no access-control layer, so obscurity is the only gate.
// This page is therefore:
//   • generated EN-ONLY (one page, internal, not multiplied across locales);
//   • noindex / nofollow (robots);
//   • excluded from search (data-pagefind-ignore on <main>);
//   • linked from nowhere (no nav / footer entry).
//
// SECURITY NOTE: obscurity is not access control. Anyone with the URL can read
// this. It exposes only non-sensitive build/config data; admin emails are
// masked. Do not place secrets here.
//
// It renders two things: (1) the config-backed control surface (feature flags,
// lead routing, contact, tip jar, access model) via <AdminPanel>; and (2) the
// CONSOLIDATED TOOL CATALOGUE — the ratified inventory and its disposition,
// from src/content/catalogue/catalogue.ts.
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import AdminPanel, { type AdminData, type AdminCopy } from "@/components/AdminPanel";
import PrivPreviewOnly from "@/components/PrivPreviewOnly";
import { allFlags } from "@/config/features";
import { routeForPlatform } from "@/config/leadRouting";
import { contactEmail, contactFormEndpoint } from "@/config/contact";
import { allTipProviders } from "@/config/tipJar";
import {
  authorizedIdentities,
  ROLE_PERMISSIONS,
  FEDERATED_ONLY,
} from "@/config/adminAccess";
import {
  CATALOGUE,
  FAMILIES,
  MERGES,
  byFamily,
  counts,
  buildQueue,
  consolidationBacklog,
} from "@/content/catalogue/catalogue";

// Internal surface: keep it out of search engines.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Console",
};

// Ship EN-ONLY. One internal page, not 24 localized copies.
export function generateStaticParams() {
  return [{ locale: "en" }];
}

/** Mask an email for display, hiding BOTH the local-part and the domain so no
 *  real address or business domain can leak, even in the page's hydration data.
 *  The identity provider is shown separately (idp), which is context enough. */
function maskEmail(email: string): string {
  const [user] = email.split("@");
  if (!user) return "*****@*****";
  const head = user.slice(0, 1);
  return `${head}${"*".repeat(Math.max(user.length - 1, 3))}@*****`;
}

export default async function AdminConsolePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("admin");
  const tNav = await getTranslations("nav");

  // --- Config-backed control surface (existing) ---
  const flags = allFlags();
  const features = [
    { key: "requestTraining", label: t("flagRequestTraining"), description: t("flagRequestTrainingDesc"), value: flags.requestTraining },
    { key: "tipJar", label: t("flagTipJar"), description: t("flagTipJarDesc"), value: flags.tipJar },
    { key: "toolFunding", label: t("flagToolFunding"), description: t("flagToolFundingDesc"), value: flags.toolFunding },
    { key: "toolProvenance", label: t("flagToolProvenance"), description: t("flagToolProvenanceDesc"), value: flags.toolProvenance },
  ];

  const data: AdminData = {
    features,
    routingDefault: routeForPlatform("f5").name,
    routingOverrides: [],
    contactEmail: contactEmail(),
    contactFormMode: contactFormEndpoint() ? t("formEndpoint") : t("formMailto"),
    tipProviders: allTipProviders().map((p) => ({
      label: p.label,
      enabled: p.enabled,
      configured: p.enabled && p.url.trim().length > 0,
    })),
    access: {
      federatedOnly: FEDERATED_ONLY,
      identities: authorizedIdentities().map((a) => ({
        email: maskEmail(a.email),
        idp: a.idp === "google" ? "Google" : "Microsoft Entra ID",
        role: a.role,
      })),
      permissions: ROLE_PERMISSIONS.owner,
    },
  };

  const copy: AdminCopy = {
    previewBanner: t("previewBanner"),
    featuresTitle: t("featuresTitle"),
    routingTitle: t("routingTitle"),
    routingDefaultLabel: t("routingDefaultLabel"),
    routingNoOverrides: t("routingNoOverrides"),
    contactTitle: t("contactTitle"),
    contactEmailLabel: t("contactEmailLabel"),
    contactFormLabel: t("contactFormLabel"),
    tipJarTitle: t("tipJarTitle"),
    tipConfigured: t("tipConfigured"),
    tipNotConfigured: t("tipNotConfigured"),
    on: t("on"),
    off: t("off"),
    accessTitle: t("accessTitle"),
    accessNote: t("accessNote"),
    accessFederatedOnly: t("accessFederatedOnly"),
    accessRoleLabel: t("accessRoleLabel"),
    accessPermsLabel: t("accessPermsLabel"),
  };

  // --- Catalogue ---
  const c = counts();
  const queue = buildQueue();
  const backlog = consolidationBacklog();

  return (
    // The display:contents wrapper carries data-pagefind-ignore so the WHOLE
    // page (header and footer included, not just <main>) is excluded from the
    // search index — keeping the unguessable URL out of search results — while
    // remaining transparent to the body's flex layout.
    <div data-pagefind-ignore="all" style={{ display: "contents" }}>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <PrivPreviewOnly>
      <main id="main" data-pagefind-ignore="all">
        {/* ===== Config-backed control surface ===== */}
        <section className="section">
          <div className="container admin-container">
            <p className="hero-eyebrow">{t("eyebrow")}</p>
            <h1 className="admin-title">{t("title")}</h1>
            <p className="admin-lede">{t("lede")}</p>
            <AdminPanel data={data} copy={copy} />
          </div>
        </section>

        {/* ===== Consolidated tool catalogue ===== */}
        <section className="section admin-cat">
          <div className="container">
            <h2 className="admin-cat-h2">Tool catalogue</h2>
            <p className="admin-cat-sub">
              Consolidated, ratified inventory and its disposition. Source of truth:
              <code> src/content/catalogue/catalogue.ts</code>. Not wired into the public tool registry.
            </p>

            <div className="admin-chips">
              <span className="admin-chip admin-chip--live">{c.live} live</span>
              <span className="admin-chip admin-chip--queued">{c.queued} queued</span>
              <span className="admin-chip admin-chip--deferred">{c.deferred} deferred</span>
              <span className="admin-chip admin-chip--dropped">{c.dropped} dropped</span>
              <span className="admin-chip">{c.total} total</span>
              <span className="admin-chip admin-chip--f5">{c.f5Queued} F5-priority queued</span>
              <span className="admin-chip admin-chip--fortinet">{c.fortinetQueued} Fortinet queued</span>
              <span className="admin-chip admin-chip--extreme">{c.extremeQueued} Extreme queued</span>
              <span className="admin-chip admin-chip--netskope">{c.netskopeQueued} Netskope queued</span>
              <span className="admin-chip admin-chip--new">{c.udp} new UDP decoders</span>
            </div>

            {/* Consolidation backlog — build BEFORE any new queue tool */}
            {backlog.length > 0 && (
              <>
                <h3 className="admin-cat-h3">Consolidation backlog · build first ({backlog.length})</h3>
                <p className="admin-cat-foot">
                  LIVE tools whose ratified merge is not yet built. These take priority over the value queue below.
                </p>
                <ul className="admin-backlog">
                  {backlog.map((tool) => (
                    <li key={tool.slug} className="admin-backlog-item">
                      <span className="admin-slug mono">{tool.slug}</span>
                      <span className="admin-tag admin-tag--pending">merge pending</span>
                      <span className="admin-backlog-note">{tool.note}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* Build queue, value-ordered (F5 pinned first) */}
            <h3 className="admin-cat-h3">Build queue · by value (F5 pinned first)</h3>
            <ol className="admin-queue">
              {queue.map((tool, i) => (
                <li key={tool.slug} className="admin-queue-item">
                  <span className="admin-queue-n mono">{String(i + 1).padStart(2, "0")}</span>
                  <span className="admin-queue-name">
                    <span className="admin-slug mono">{tool.slug}</span>
                    {tool.f5 && <span className="admin-tag admin-tag--f5">F5</span>}
                    {tool.fortinet && <span className="admin-tag admin-tag--fortinet">Fortinet</span>}
                    {tool.extreme && <span className="admin-tag admin-tag--extreme">Extreme</span>}
                    {tool.netskope && <span className="admin-tag admin-tag--netskope">Netskope</span>}
                    {tool.isNew && <span className="admin-tag admin-tag--new">new</span>}
                  </span>
                  <span className="admin-queue-posture mono">{tool.posture}</span>
                </li>
              ))}
            </ol>

            {/* Per-family tables */}
            {FAMILIES.map((fam) => {
              const items = byFamily(fam);
              if (!items.length) return null;
              return (
                <div key={fam} className="admin-fam">
                  <h3 className="admin-cat-h3">
                    {fam} <span className="admin-fam-count">{items.length}</span>
                  </h3>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Tool</th>
                          <th>Status</th>
                          <th>Posture</th>
                          <th>Anchors</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((tool) => (
                          <tr key={tool.slug}>
                            <td>
                              <span className="admin-slug mono">{tool.slug}</span>
                              <span className="admin-name">{tool.name}</span>
                            </td>
                            <td className="admin-status-cell">
                              <span className={`admin-badge admin-badge--${tool.status}`}>{tool.status}</span>
                              {tool.f5 && <span className="admin-tag admin-tag--f5">F5</span>}
                              {tool.fortinet && <span className="admin-tag admin-tag--fortinet">Fortinet</span>}
                              {tool.extreme && <span className="admin-tag admin-tag--extreme">Extreme</span>}
                              {tool.netskope && <span className="admin-tag admin-tag--netskope">Netskope</span>}
                              {tool.consolidationPending && <span className="admin-tag admin-tag--pending">merge pending</span>}
                              {tool.isNew && <span className="admin-tag admin-tag--new">new</span>}
                              {typeof tool.vectors === "number" && (
                                <span className="admin-tag">{tool.vectors} GV</span>
                              )}
                            </td>
                            <td className="mono admin-posture">{tool.posture}</td>
                            <td className="admin-specs">{tool.specs?.join(", ") || "—"}</td>
                            <td className="admin-note">{tool.note || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}

            {/* Consolidation decisions */}
            <h3 className="admin-cat-h3">Consolidation decisions</h3>
            <ul className="admin-merges">
              {MERGES.map((m) => (
                <li key={m.id} className={`admin-merge admin-merge--${m.outcome}`}>
                  <span className="admin-merge-id mono">{m.id}</span>
                  <span className="admin-merge-outcome">{m.outcome}</span>
                  <span className="admin-merge-text">{m.text}</span>
                </li>
              ))}
            </ul>

            <p className="admin-cat-foot">
              Dispositions: <strong>built</strong> (live) · <strong>accept</strong> (queued) · <strong>defer</strong>
              {" "}(egress / extended tiers, gating model reserved) · <strong>drop</strong> (control-defeat /
              frame-forging, refused on principle — decoders deliver the educational value without the weapon).
            </p>
          </div>
        </section>
      </main>
      </PrivPreviewOnly>

      <SiteFooter />
    </div>
  );
}
