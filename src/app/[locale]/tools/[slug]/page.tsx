// ============================================================================
// src/app/[locale]/tools/[slug]/page.tsx
// ----------------------------------------------------------------------------
// PER-TOOL PAGE - the detail view for a single tool, statically generated for
// every (locale, slug). The registry (src/config/tools.ts) supplies the name
// and blurb; the local tool module supplies the live component and its RFC
// sources (rendered as a References block). Every tool, CIDR included, lives at
// /tools/<slug>; the home page additionally embeds the CIDR widget as a live
// demo, but /tools/cidr is its canonical page.
//
// Adding a tool page = drop one entry in TOOL_PAGES below; generateStaticParams
// expands it across every locale automatically.
// ============================================================================

import type { ComponentType } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import ToolLearnPanel from "@/components/ToolLearnPanel";
import { tools } from "@/config/tools";
import JwtTool from "@/components/JwtTool";
import { manifest as jwtManifest } from "@/lib/tools/jwt";
import Base64Tool from "@/components/Base64Tool";
import { manifest as base64Manifest } from "@/lib/tools/base64";
import HashTool from "@/components/HashTool";
import { manifest as hashManifest } from "@/lib/tools/hash";
import HmacTool from "@/components/HmacTool";
import { manifest as hmacManifest } from "@/lib/tools/hmac";
import TotpHotpTool from "@/components/TotpHotpTool";
import { manifest as totpHotpManifest } from "@/lib/tools/totp-hotp";
import DiffTool from "@/components/DiffTool";
import { manifest as diffManifest } from "@/lib/tools/diff";
import PkceTool from "@/components/PkceTool";
import { manifest as pkceManifest } from "@/lib/tools/pkce";
import UuidTool from "@/components/UuidTool";
import { manifest as uuidManifest } from "@/lib/tools/uuid";
import X509Tool from "@/components/X509Tool";
import { manifest as x509Manifest } from "@/lib/tools/x509";
import Ipv6Tool from "@/components/Ipv6Tool";
import { manifest as ipv6Manifest } from "@/lib/tools/ipv6";
import CipherTool from "@/components/CipherTool";
import { manifest as cipherManifest } from "@/lib/tools/cipher";
import CidrTool from "@/components/CidrTool";
// CIDR's single-subnet engine + manifest are now arsenal-local; the
// src/lib/tools/cidr module adds the extended modes and exports no manifest of
// its own, so the References block sources come from the tool's manifest.
import { manifest as cidrManifest } from "@/lib/tools/cidr";
import SecureHeadersTool from "@/components/SecureHeadersTool";
import { manifest as secureHeadersManifest } from "@/lib/tools/secure-headers";
import SamlDecoderTool from "@/components/SamlDecoderTool";
import { manifest as samlDecoderManifest } from "@/lib/tools/saml-decoder";
import OidcTool from "@/components/OidcTool";
import { manifest as oidcManifest } from "@/lib/tools/oidc";
import BigipCookieTool from "@/components/BigipCookieTool";
import { manifest as bigipManifest } from "@/lib/tools/bigip-persistence-cookie";
import UrlInspectorTool from "@/components/UrlInspectorTool";
import { manifest as urlManifest } from "@/lib/tools/url-inspector";
import JsonFormatterTool from "@/components/JsonFormatterTool";
import { manifest as jsonManifest } from "@/lib/tools/json-formatter";
import JsonYamlConvertTool from "@/components/JsonYamlConvertTool";
import { manifest as jsonYamlManifest } from "@/lib/tools/json-yaml-convert";
import TmshConfigExplainerTool from "@/components/TmshConfigExplainerTool";
import { manifest as tmshManifest } from "@/lib/tools/tmsh-config-explainer";
import DigOutputExplainerTool from "@/components/DigOutputExplainerTool";
import { manifest as digManifest } from "@/lib/tools/dig-output-explainer";
import NslookupOutputExplainerTool from "@/components/NslookupOutputExplainerTool";
import { manifest as nslookupManifest } from "@/lib/tools/nslookup-output-explainer";
import XmlDecoderTool from "@/components/XmlDecoderTool";
import { manifest as xmlManifest } from "@/lib/tools/xml-decoder";
import F5xcServicePolicyExplainerTool from "@/components/F5xcServicePolicyExplainerTool";
import { manifest as f5xcServicePolicyManifest } from "@/lib/tools/f5xc-service-policy-explainer";
import PersistenceMethodExplainerTool from "@/components/PersistenceMethodExplainerTool";
import { manifest as persistManifest } from "@/lib/tools/persistence-method-explainer";
import F5CipherStringExpanderTool from "@/components/F5CipherStringExpanderTool";
import { manifest as cipherStrManifest } from "@/lib/tools/f5-cipher-string-expander";
import F5SslProfileExplainerTool from "@/components/F5SslProfileExplainerTool";
import { manifest as sslProfileManifest } from "@/lib/tools/f5-ssl-profile-explainer";
import EpochTool from "@/components/EpochTool";
import { manifest as epochManifest } from "@/lib/tools/epoch";
import CertRenewalPlannerTool from "@/components/CertRenewalPlannerTool";
import { manifest as certRenewalManifest } from "@/lib/tools/cert-renewal-planner";
import CsrDecoderTool from "@/components/CsrDecoderTool";
import { manifest as csrManifest } from "@/lib/tools/csr-decoder";
import IrulesEventOrderTool from "@/components/IrulesEventOrderTool";
import { manifest as irevManifest } from "@/lib/tools/irules-event-order";
import SyslogPriDecoderTool from "@/components/SyslogPriDecoderTool";
import { manifest as syslogPriManifest } from "@/lib/tools/syslog-pri-decoder";
import JwksExplainerTool from "@/components/JwksExplainerTool";
import { manifest as jwksManifest } from "@/lib/tools/jwks-explainer";
import RegexTool from "@/components/RegexTool";
import { manifest as regexManifest } from "@/lib/tools/regex";
import BigipTcpdumpBuilderTool from "@/components/BigipTcpdumpBuilderTool";
import { manifest as tcpdumpManifest } from "@/lib/tools/bigip-tcpdump-builder";
import CvssVectorDecoderTool from "@/components/CvssVectorDecoderTool";
import { manifest as cvssManifest } from "@/lib/tools/cvss-vector-decoder";
import HttpRequestTranslatorTool from "@/components/HttpRequestTranslatorTool";
import { manifest as curlManifest } from "@/lib/tools/http-request-translator";
import HashPreimageFinderTool from "@/components/HashPreimageFinderTool";
import { manifest as hpfManifest } from "@/lib/tools/hash-preimage-finder";
import SsrfUrlClassifierTool from "@/components/SsrfUrlClassifierTool";
import { manifest as ssrfManifest } from "@/lib/tools/ssrf-url-classifier";

/** A reference link shown under a tool (from its manifest sources). */
interface ToolSource {
  id: string;
  label: string;
  url?: string;
}

/** The render unit for one tool page: its component + its source links. */
interface ToolPage {
  Component: ComponentType;
  sources: ToolSource[];
}

// The slug map. Each entry pairs a route segment with its live component and
// the references to surface. CIDR is included here (canonical /tools/cidr) and
// also appears as a live demo on the home page.
const TOOL_PAGES: Record<string, ToolPage> = {
  jwt: {
    Component: JwtTool,
    sources: jwtManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  base64: {
    Component: Base64Tool,
    sources: base64Manifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  hash: {
    Component: HashTool,
    sources: hashManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  hmac: {
    Component: HmacTool,
    sources: hmacManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "totp-hotp": {
    Component: TotpHotpTool,
    sources: totpHotpManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  diff: {
    Component: DiffTool,
    sources: diffManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  pkce: {
    Component: PkceTool,
    sources: pkceManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  uuid: {
    Component: UuidTool,
    sources: uuidManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  x509: {
    Component: X509Tool,
    sources: x509Manifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  ipv6: {
    Component: Ipv6Tool,
    sources: ipv6Manifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  cipher: {
    Component: CipherTool,
    sources: cipherManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  cidr: {
    Component: CidrTool,
    // the manifest types sources as unknown; narrow to the fields we render.
    sources: (
      cidrManifest.sources as { id: string; label: string; url?: string }[]
    ).map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "secure-headers": {
    Component: SecureHeadersTool,
    sources: secureHeadersManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "saml-decoder": {
    Component: SamlDecoderTool,
    sources: samlDecoderManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  oidc: {
    Component: OidcTool,
    sources: oidcManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "bigip-persistence-cookie": {
    Component: BigipCookieTool,
    sources: bigipManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "url-inspector": {
    Component: UrlInspectorTool,
    sources: urlManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "json-formatter": {
    Component: JsonFormatterTool,
    sources: jsonManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "json-yaml-convert": {
    Component: JsonYamlConvertTool,
    sources: jsonYamlManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "tmsh-config-explainer": {
    Component: TmshConfigExplainerTool,
    sources: tmshManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "dig-output-explainer": {
    Component: DigOutputExplainerTool,
    sources: digManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "nslookup-output-explainer": {
    Component: NslookupOutputExplainerTool,
    sources: nslookupManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "xml-decoder": {
    Component: XmlDecoderTool,
    sources: xmlManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5xc-service-policy-explainer": {
    Component: F5xcServicePolicyExplainerTool,
    sources: f5xcServicePolicyManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "cvss-vector-decoder": {
    Component: CvssVectorDecoderTool,
    sources: cvssManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "http-request-translator": {
    Component: HttpRequestTranslatorTool,
    sources: curlManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "hash-preimage-finder": {
    Component: HashPreimageFinderTool,
    sources: hpfManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "ssrf-url-classifier": {
    Component: SsrfUrlClassifierTool,
    sources: ssrfManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "bigip-tcpdump-builder": {
    Component: BigipTcpdumpBuilderTool,
    sources: tcpdumpManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "persistence-method-explainer": {
    Component: PersistenceMethodExplainerTool,
    sources: persistManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5-cipher-string-expander": {
    Component: F5CipherStringExpanderTool,
    sources: cipherStrManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5-ssl-profile-explainer": {
    Component: F5SslProfileExplainerTool,
    sources: sslProfileManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  epoch: {
    Component: EpochTool,
    sources: epochManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "cert-renewal-planner": {
    Component: CertRenewalPlannerTool,
    sources: certRenewalManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "csr-decoder": {
    Component: CsrDecoderTool,
    sources: csrManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "irules-event-order": {
    Component: IrulesEventOrderTool,
    sources: irevManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "syslog-pri-decoder": {
    Component: SyslogPriDecoderTool,
    sources: syslogPriManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "jwks-explainer": {
    Component: JwksExplainerTool,
    sources: jwksManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  regex: {
    Component: RegexTool,
    sources: regexManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
};

/** Pre-generate every tool page for every locale at build time. */
export function generateStaticParams() {
  const slugs = Object.keys(TOOL_PAGES);
  return routing.locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const page = TOOL_PAGES[slug];
  if (!page) notFound();

  const entry = tools.find((tool) => tool.id === slug);
  const tNav = await getTranslations("nav");
  const tTools = await getTranslations("tools");
  const Component = page.Component;

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article className="section">
          <div className="container article-container">
            <Link href="/tools" className="article-back">
              ← {tTools("backToTools")}
            </Link>
            {entry && <h1 className="article-title">{tTools(`${slug}.name`)}</h1>}
            {entry && <p className="article-summary">{tTools(`${slug}.blurb`)}</p>}

            <Component />

            <ToolLearnPanel toolSlug={slug} locale={locale} heading={tTools("learnHeading")} />

            {page.sources.length > 0 && (
              <section className="tool-sources" aria-label={tTools("references")}>
                <h2 className="tool-sources-title">{tTools("references")}</h2>
                <ul className="tool-sources-list">
                  {page.sources.map((source) => (
                    <li key={source.id}>
                      {source.url ? (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tool-sources-link"
                        >
                          {source.label}
                        </a>
                      ) : (
                        source.label
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
