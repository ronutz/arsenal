// ============================================================================
// src/app/[locale]/dev/other/page.tsx
// ----------------------------------------------------------------------------
// THE /dev/other INDEX - the green room, now for the genuinely OTHER tools:
// shapes the main catalogue's definitions cannot hold yet (experimental input
// contracts, odd outputs, ideas finding their form) for reasons OTHER than
// network egress - egress tools live next door in /dev/out, in red. The
// house principles keep holding here, and the room says so on the door. The
// page keeps the .env-other green mini-theme: same darkness, different hue,
// different paperwork. Currently unoccupied, and honest about it.
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
  const t = await getTranslations({ locale, namespace: "devOther" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

// The room's inventory. Empty by honest design until a tool defies the
// definitions for a reason other than egress; each future entry pairs a
// route with its i18n key under devOther.tools.*.
const OTHER_TOOLS = [
  { key: "pcapAnalyzer", href: "/dev/other/pcap-analyzer" },
  { key: "serialConsole", href: "/dev/other/web-serial-console" },
  { key: "fingerprint", href: "/dev/other/fingerprint" },
  { key: "subnetDrill", href: "/dev/other/subnet-drill" },
] as const;

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

            {/* The room's short notice: what "other" means, what still holds. */}
            <div className="envother-notice">
              <p className="envother-notice-title mono">{t("notice.title")}</p>
              <p className="envother-notice-text">{t("notice.p1")}</p>
              <p className="envother-notice-text">{t("notice.p2")}</p>
            </div>

            {/* The room now has a resident; render the card grid. */}
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
