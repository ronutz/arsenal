// ============================================================================
// src/app/[locale]/dev/out/doh-lookup/page.tsx
// ----------------------------------------------------------------------------
// DNS-OVER-HTTPS LOOKUP - a /dev/out tool page (2026-10-27). Red room wrapper,
// compact environment notice, the explicit-egress client component, and
// inline about, resolver and sources blocks (this room's tools live outside
// the catalogue, so provenance renders here rather than through the tool-page
// map). The page's own Content-Security-Policy (public/_headers) lets it
// connect to 'self' and the three resolver hosts it offers, nothing else.
// ============================================================================
// The metadata type for generateMetadata.
import type { Metadata } from "next";
// The nested provider that hands the client component its message slice.
import MessageSlice from "@/components/MessageSlice";
// Server-side translations and the static-export locale hook.
import { getTranslations, setRequestLocale } from "next-intl/server";
// The site header.
import Header from "@/components/Header";
// The site footer.
import SiteFooter from "@/components/SiteFooter";
// The room's notice (compact on tool pages).
import EnvOutNotice from "@/components/EnvOutNotice";
// The tool itself.
import DevOutDohLookupTool from "@/components/DevOutDohLookupTool";
// Locale-aware internal links.
import { Link } from "@/i18n/navigation";
// The resolvers, for the list with their documentation and privacy links.
import { RESOLVERS } from "@/lib/dev-out/doh-lookup/compute";
// The rel every external link carries.
import { externalRel } from "@/lib/links";

// The about block's points, in reading order: what the query holds, why these resolvers, why GET, what the resolver
// receives, and how HTTPS and DNSSEC differ (each a devOut.doh.<key>.lead and .body pair).
const ABOUT_POINTS = ["aboutQuery", "aboutWhy", "aboutGet", "aboutSees", "aboutDnssec"] as const;

/**
 * The page's title and description, per locale.
 * @param params the route parameters (the locale)
 * @returns the metadata
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  // The locale of this export.
  const { locale } = await params;
  // The room's messages.
  const t = await getTranslations({ locale, namespace: "devOut" });
  // Title and description from devOut.doh.
  return {
    title: t("doh.metaTitle"),
    description: t("doh.metaDescription"),
  };
}

/**
 * The DNS-over-HTTPS lookup page.
 * @param params the route parameters (the locale)
 * @returns the page
 */
export default async function DohLookupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // The locale of this export.
  const { locale } = await params;
  // Static rendering for this locale.
  setRequestLocale(locale);
  // The room's messages.
  const t = await getTranslations("devOut");

  return (
    <div className="env-out">
      <Header />
      <main id="main">
        <section className="section">
          <div className="container devfun-page-container">
            <div className="devfun-head">
              {/* The tool's name and the room's badge. */}
              <h1 className="devfun-title">
                {t("tools.dohLookup.name")} <span className="envout-badge mono">{t("badge")}</span>
              </h1>
              {/* One line on what it does. */}
              <p className="devfun-tagline">{t("tools.dohLookup.blurb")}</p>
            </div>

            {/* The room's rules, compact. */}
            <EnvOutNotice compact />

            {/* The tool, with only its own messages sliced in. */}
            <MessageSlice namespaces={["devOut.doh"]}>
              <DevOutDohLookupTool />
            </MessageSlice>

            {/* About, resolvers and provenance, inline (off-catalogue room): one left-aligned reading column with small
                section headings (reworked 2026-10-27 after looking at it: centred paragraphs read as a wall). */}
            <div style={{ maxWidth: "620px", margin: "2rem auto 0" }}>
              {/* How it works. */}
              <h2 className="jwt-panel-title">{t("doh.aboutTitle")}</h2>
              {/* What DoH carries: the lead. */}
              <p className="devfun-intro" style={{ marginBottom: "0.9rem" }}>
                {t("doh.about1")}
              </p>
              {/* Then one short point per question a reader brings, each opening with its question in bold (reworked
                  2026-10-27 after looking at it: three long paragraphs read as a wall at 390 px). */}
              {ABOUT_POINTS.map((k, i) => (
                <p key={k} className="devfun-intro" style={{ marginBottom: i === ABOUT_POINTS.length - 1 ? "1.5rem" : "0.7rem" }}>
                  {/* The question, as the point's first words. */}
                  <strong>{t(`doh.${k}.lead`)}</strong> {t(`doh.${k}.body`)}
                </p>
              ))}
              {/* The resolvers, one card each: who, the endpoint, the operator's pages, what those pages say. */}
              <h2 className="jwt-panel-title">{t("doh.resolversLabel")}</h2>
              {RESOLVERS.map((r) => (
                <div key={r.id} className="dig-record">
                  {/* Service and operator: the primary line. */}
                  <div className="dig-record-head">
                    <span className="dig-record-name">{t("doh.resolverLine", { service: r.service, operatedBy: t(`doh.operatedBy.${r.id}`) })}</span>
                  </div>
                  {/* The endpoint. */}
                  <div className="dig-mono dig-rdata">{r.endpoint}</div>
                  {/* The operator's documentation and privacy policy. */}
                  <p className="dig-meaning">
                    <a href={r.docs} target="_blank" rel={externalRel(r.docs)}>
                      {t("doh.resolverDocs")}
                    </a>
                    {" · "}
                    <a href={r.privacy} target="_blank" rel={externalRel(r.privacy)}>
                      {t("doh.resolverPrivacy")}
                    </a>
                  </p>
                  {/* What the operator documents about validation, client subnet, blocking and logs (read on the date given). */}
                  <p className="dig-meaning">{t(`doh.resolverNote.${r.id}`)}</p>
                </div>
              ))}
              {/* Where to go next on the site. */}
              <h2 className="jwt-panel-title" style={{ marginTop: "1.5rem" }}>
                {t("doh.learnLabel")}
              </h2>
              <p className="tools-note">
                <Link href="/learn/encrypted-dns-dot-doh-doq">{t("doh.learnDoh")}</Link> ·{" "}
                <Link href="/learn/dnssec-end-to-end">{t("doh.dnssecLab")}</Link> ·{" "}
                <Link href="/tools/dig-output-explainer">{t("doh.digExplainer")}</Link> ·{" "}
                <Link href="/tools/dig-command-builder">{t("doh.digBuilder")}</Link>
              </p>
              {/* Sources, folded: each read on the date given (the documents themselves are in English). */}
              <details className="tcl-details" style={{ marginTop: "1.5rem" }}>
                <summary>{t("doh.sourcesLabel")}</summary>
                <p className="tools-note">
                  RFC 8484 (DNS Queries over HTTPS), sections 4.1, 4.1.1, 4.2.1, 4.2.2, 5.1, 6, 8.2 and 9 · RFC 1035,
                  sections 2.3.4, 3.1, 3.3, 3.4, 4.1 and 5.1 · RFC 3596 · RFC 4034 · RFC 4035, sections 3.2.2 and 3.2.3 · RFC
                  6840, sections 5.7 to 5.9 · RFC 6891 · RFC 3225 · RFC 7830 · RFC 8467, section 4.1 · RFC 8914 · RFC 9460 ·
                  RFC 9461 · RFC 9462 · RFC 9619 · RFC 9824 · RFC 2308, section 5 · RFC 2181, sections 5 and 8 · RFC 3597 ·
                  RFC 4343 · RFC 4648 · RFC 5011 · RFC 5155 · RFC 5952 · RFC 7505 · RFC 8659 (all at rfc-editor.org, read
                  2026-10-27) · IANA, Domain Name System (DNS) Parameters (updated 2026-10-16), DNSSEC Algorithm Numbers, DS
                  RR Type Digest Algorithms and DNS SVCB Service Parameter Keys (read 2026-10-27) · WHATWG Fetch Standard,
                  CORS-safelisted request and response headers (read 2026-10-27) · the three resolvers&apos; DoH
                  documentation and privacy pages listed above, and Cloudflare&apos;s 1.1.1.1 FAQ and Extended DNS error
                  codes page, Google Public DNS&apos;s Security and EDNS Client Subnet pages, Quad9&apos;s Threat Blocking
                  page (all read 2026-10-27) · curl manual, curl 8.23.1 (read 2026-10-27)
                </p>
              </details>
              {/* Back to the room. */}
              <p className="tools-note">
                <Link href="/dev/out" className="devout-door-link">
                  {t("backToOut")}
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
