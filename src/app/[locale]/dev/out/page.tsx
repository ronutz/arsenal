// ============================================================================
// src/app/[locale]/dev/out/page.tsx
// ----------------------------------------------------------------------------
// THE /dev/out INDEX - the red room, home of the networkEgress class. Tools
// here ASK the live internet instead of computing locally, so the whole page
// (header + main + footer) wraps in .env-out: the hue-rotated Obsidian
// mini-theme whose deep-red background marks "the room where packets leave".
// The full four-paragraph egress notice renders here; tool pages carry the
// compact version. Cards reuse the house tools-card vocabulary - the tokens
// turn red for free inside the wrapper.
// ============================================================================
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import EnvOutNotice from "@/components/EnvOutNotice";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "devOut" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

// The room's inventory. Grows as C-87 residents land; each entry pairs a
// route with its i18n key under devOut.tools.*.
const OUT_TOOLS = [
  { key: "rdapLookup", href: "/dev/out/rdap-lookup" },
  { key: "asnLookup", href: "/dev/out/asn-lookup" },
  // The DNS-over-HTTPS lookup (2026-10-27): the query is built in wire format on the page, one GET to the chosen resolver
  // (or, since that afternoon, a POST after its CORS preflight, where the resolver allows it).
  { key: "dohLookup", href: "/dev/out/doh-lookup" },
  // The Pwned Passwords check (2026-10-26): the password is hashed locally, only a five-character hash prefix is sent.
  { key: "pwnedPasswords", href: "/dev/out/pwned-passwords" },
  // The speed test (2026-10-27): Cloudflare's open-source engine, run only on Start, results logging off, no packet loss.
  { key: "speedTest", href: "/dev/out/speed-test" },
] as const;

export default async function DevOutIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("devOut");

  return (
    <div className="env-out">
      <Header />
      <main id="main">
        <section className="section">
          <div className="container devfun-page-container">
            <div className="devfun-head">
              <h1 className="devfun-title">
                {t("title")} <span className="envout-badge mono">{t("badge")}</span>
              </h1>
              <p className="devfun-tagline">{t("tagline")}</p>
              <p className="devfun-intro">{t("intro")}</p>
            </div>

            <EnvOutNotice />

            <ul className="tools-grid">
              {OUT_TOOLS.map((tool) => (
                <li key={tool.key} className="tools-grid-item">
                  <Link href={tool.href} className="tools-card">
                    <h3 className="tools-card-name">{t(`tools.${tool.key}.name`)}</h3>
                    <p className="tools-card-blurb">{t(`tools.${tool.key}.blurb`)}</p>
                    {/* What leaves the browser, to whom, and on which button (2026-10-27, PRIME's hub review). */}
                    <dl className="devout-facts">
                      {(["sends", "to", "when"] as const).map((f) => (
                        <div key={f} className="devout-fact">
                          <dt className="devout-fact-label mono">{t(`facts.${f}`)}</dt>
                          <dd className="devout-fact-value">{t(`tools.${tool.key}.${f}`)}</dd>
                        </div>
                      ))}
                    </dl>
                  </Link>
                </li>
              ))}
            </ul>

            <p className="tools-note" style={{ marginTop: "1.5rem" }}>
              <Link href="/dev" className="devout-door-link">
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
