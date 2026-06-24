// ============================================================================
// src/app/[locale]/admin/page.tsx
// ----------------------------------------------------------------------------
// ADMIN PAGE (SCAFFOLD) — the config-backed control surface.
//
// Reads the CURRENT settings from the config modules and hands them to the
// AdminPanel client component to render. noindex (this is an internal surface).
//
// On the static site this is a preview: it reflects build-time config, and the
// panel's toggles change only the in-session preview. When the service layer
// exists, this page's data source and the panel's controls bind to it and the
// surface goes live, by design, without restructuring.
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import AdminPanel, { type AdminData, type AdminCopy } from "@/components/AdminPanel";
import { allFlags } from "@/config/features";
import { routeForPlatform } from "@/config/leadRouting";
import { contactEmail, contactFormEndpoint } from "@/config/contact";
import { allTipProviders } from "@/config/tipJar";
import {
  authorizedIdentities,
  ROLE_PERMISSIONS,
  FEDERATED_ONLY,
} from "@/config/adminAccess";

// Internal surface: keep it out of search.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// SECURITY: the admin surface is excluded from the public production build by
// default. It is only generated when ENABLE_ADMIN_PREVIEW=true (e.g. local or a
// private preview). With the flag off, returning no params means no /admin pages
// are emitted into the static export, so the surface and the access model are
// not exposed publicly. Real protection comes from the service layer; this gate
// simply avoids shipping an unsecured admin surface to the internet.
const ADMIN_PREVIEW = process.env.ENABLE_ADMIN_PREVIEW === "true";

export function generateStaticParams() {
  if (!ADMIN_PREVIEW) return [];
  return routing.locales.map((locale) => ({ locale }));
}

/** Mask an email for display even in the preview (e.g. r****@gmail.com). */
function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return "****";
  const head = user.slice(0, 1);
  return `${head}${"*".repeat(Math.max(user.length - 1, 3))}@${domain}`;
}

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // SECURITY: with the preview flag off (the production default), render a bare
  // stub that exposes nothing, rather than the scaffold. The static export may
  // still emit this route, but it contains no settings, no access model, and no
  // admin UI. The real admin surface only appears with ENABLE_ADMIN_PREVIEW=true
  // (private/local), and real protection comes from the service layer.
  if (!ADMIN_PREVIEW) {
    return (
      <main id="main" style={{ padding: "4rem 1.5rem", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>
          Not available.
        </p>
      </main>
    );
  }

  const t = await getTranslations("admin");
  const tNav = await getTranslations("nav");

  // --- Read current config into the panel's data shape ---
  const flags = allFlags();
  const features = [
    { key: "requestTraining", label: t("flagRequestTraining"), description: t("flagRequestTrainingDesc"), value: flags.requestTraining },
    { key: "tipJar", label: t("flagTipJar"), description: t("flagTipJarDesc"), value: flags.tipJar },
    { key: "toolFunding", label: t("flagToolFunding"), description: t("flagToolFundingDesc"), value: flags.toolFunding },
    { key: "toolProvenance", label: t("flagToolProvenance"), description: t("flagToolProvenanceDesc"), value: flags.toolProvenance },
  ];

  const data: AdminData = {
    features,
    routingDefault: routeForPlatform("f5").name, // global default resolves the same for all
    routingOverrides: [], // none configured yet
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

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <section className="section">
          <div className="container admin-container">
            <p className="hero-eyebrow">{t("eyebrow")}</p>
            <h1 className="admin-title">{t("title")}</h1>
            <p className="admin-lede">{t("lede")}</p>
            <AdminPanel data={data} copy={copy} />
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
