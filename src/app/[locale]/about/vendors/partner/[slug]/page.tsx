// ============================================================================
// src/app/[locale]/about/vendors/partner/[slug]/page.tsx
// ----------------------------------------------------------------------------
// PARTNER / OTHER-VENDOR PAGE - a data-driven page for the non-career vendors
// linked from the Vendors index (Red Education training partners Rodolfo does
// not personally teach, and corporate-lineage entries for other vendors).
//
// Content comes from src/content/vendors/partners.ts, where every fact is
// verified. The "redu" group renders a clear disclaimer (Rodolfo does not
// deliver this vendor's training) plus Red Education's verified award record;
// nothing here implies he is authorized for these vendors.
// ============================================================================

import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import { getPartnerVendor, partnerVendorSlugs } from "@/content/vendors/partners";
import { routing } from "@/i18n/routing";
import VendorProfileSections from "@/components/VendorProfileSections";
import type { VendorProfile } from "@/content/vendors/profile-types";
import { hpeJuniperArubaProfile } from "@/content/vendors/profiles/hpe-juniper-aruba";
import { brocadeBroadcomProfile } from "@/content/vendors/profiles/brocade-broadcom";
import { mcafeeFireeyeTrellixProfile } from "@/content/vendors/profiles/mcafee-fireeye-trellix";
import { mikrotikProfile } from "@/content/vendors/profiles/mikrotik";
import { radwareProfile } from "@/content/vendors/profiles/radware";
import { impervaThalesProfile } from "@/content/vendors/profiles/imperva-thales";
import { versaProfile } from "@/content/vendors/profiles/versa";
import { nortelBayProfile } from "@/content/vendors/profiles/nortel-bay";
import { madgeProfile } from "@/content/vendors/profiles/madge";
import { checkPointProfile } from "@/content/vendors/profiles/check-point";
import { cyberarkProfile } from "@/content/vendors/profiles/cyberark";
import { riverbedProfile } from "@/content/vendors/profiles/riverbed";
import { symantecProfile } from "@/content/vendors/profiles/symantec";
import { avayaProfile } from "@/content/vendors/profiles/avaya";
import { nutanixProfile } from "@/content/vendors/profiles/nutanix";
import { redHatProfile } from "@/content/vendors/profiles/red-hat";
import { paesslerProfile } from "@/content/vendors/profiles/paessler";
import { mobileironProfile } from "@/content/vendors/profiles/mobileiron";
import { sunMicrosystemsProfile } from "@/content/vendors/profiles/sun-microsystems";
import { siliconGraphicsProfile } from "@/content/vendors/profiles/silicon-graphics";
import { xeroxProfile } from "@/content/vendors/profiles/xerox";
import { decProfile } from "@/content/vendors/profiles/dec";
import { nokiaProfile } from "@/content/vendors/profiles/nokia";
import { ericssonProfile } from "@/content/vendors/profiles/ericsson";
import { huaweiProfile } from "@/content/vendors/profiles/huawei";
import { siemensProfile } from "@/content/vendors/profiles/siemens";
import { novellProfile } from "@/content/vendors/profiles/novell";
import { oracleProfile } from "@/content/vendors/profiles/oracle";
import { ibmProfile } from "@/content/vendors/profiles/ibm";
import { sapProfile } from "@/content/vendors/profiles/sap";
import { threeComProfile } from "@/content/vendors/profiles/3com";
import { compaqProfile } from "@/content/vendors/profiles/compaq";
import { netscapeProfile } from "@/content/vendors/profiles/netscape";
import { motorolaProfile } from "@/content/vendors/profiles/motorola";
import { unisysProfile } from "@/content/vendors/profiles/unisys";
import { dataGeneralProfile } from "@/content/vendors/profiles/data-general";
import { marconiProfile } from "@/content/vendors/profiles/marconi";
import { wangProfile } from "@/content/vendors/profiles/wang";
import { tandemProfile } from "@/content/vendors/profiles/tandem";
import { bellLabsLucentAlcatelProfile } from "@/content/vendors/profiles/bell-labs-lucent-alcatel";
import { intelAmdProfile } from "@/content/vendors/profiles/intel-amd";
import { randProfile } from "@/content/vendors/profiles/rand";
import { toshibaProfile } from "@/content/vendors/profiles/toshiba";
import { hitachiProfile } from "@/content/vendors/profiles/hitachi";
import { bullProfile } from "@/content/vendors/profiles/bull";
import { ncsaProfile } from "@/content/vendors/profiles/ncsa";
import { cienaProfile } from "@/content/vendors/profiles/ciena";
import { snifferLineageProfile } from "@/content/vendors/profiles/sniffer-lineage";
import { blueCoatPacketeerProfile } from "@/content/vendors/profiles/blue-coat-packeteer";
import { cycladesAvocentVertivProfile } from "@/content/vendors/profiles/cyclades-avocent-vertiv";
import { dellForce10Profile } from "@/content/vendors/profiles/dell-force10";
import { zteProfile } from "@/content/vendors/profiles/zte";
import { flukeProfile } from "@/content/vendors/profiles/fluke";
import { dnsBindProfile } from "@/content/vendors/profiles/dns-bind";
import { httpGopherProfile } from "@/content/vendors/profiles/http-gopher";
import { nvidiaProfile } from "@/content/vendors/profiles/nvidia";
import { aristaProfile } from "@/content/vendors/profiles/arista";
import { ubiquitiProfile } from "@/content/vendors/profiles/ubiquiti";
import { accessHomeFleetProfile } from "@/content/vendors/profiles/access-home-fleet";
import { watchguardProfile } from "@/content/vendors/profiles/watchguard";
import { a10KempProfile } from "@/content/vendors/profiles/a10-kemp";
import { datacomProfile } from "@/content/vendors/profiles/datacom";
import { banyanProfile } from "@/content/vendors/profiles/banyan";
import { fujitsuProfile } from "@/content/vendors/profiles/fujitsu";
import { necProfile } from "@/content/vendors/profiles/nec";

// Rich profiles, keyed by slug. Vendors without a profile render the simple layout.
const PROFILES: Record<string, VendorProfile> = {
  [hpeJuniperArubaProfile.slug]: hpeJuniperArubaProfile,
  [brocadeBroadcomProfile.slug]: brocadeBroadcomProfile,
  [mcafeeFireeyeTrellixProfile.slug]: mcafeeFireeyeTrellixProfile,
  [mikrotikProfile.slug]: mikrotikProfile,
  [radwareProfile.slug]: radwareProfile,
  [impervaThalesProfile.slug]: impervaThalesProfile,
  [versaProfile.slug]: versaProfile,
  [nortelBayProfile.slug]: nortelBayProfile,
  [madgeProfile.slug]: madgeProfile,
  // The 2026-07-15 wave (PRIME): full lineage treatment for the remaining
  // Red Education partner catalog.
  [checkPointProfile.slug]: checkPointProfile,
  [cyberarkProfile.slug]: cyberarkProfile,
  [riverbedProfile.slug]: riverbedProfile,
  [symantecProfile.slug]: symantecProfile,
  [avayaProfile.slug]: avayaProfile,
  [nutanixProfile.slug]: nutanixProfile,
  [redHatProfile.slug]: redHatProfile,
  [paesslerProfile.slug]: paesslerProfile,
  [mobileironProfile.slug]: mobileironProfile,
  // The pioneer-giants wave (PRIME 2026-07-16): the founders of the industry.
  [sunMicrosystemsProfile.slug]: sunMicrosystemsProfile,
  [siliconGraphicsProfile.slug]: siliconGraphicsProfile,
  [xeroxProfile.slug]: xeroxProfile,
  [decProfile.slug]: decProfile,
  [nokiaProfile.slug]: nokiaProfile,
  [ericssonProfile.slug]: ericssonProfile,
  [huaweiProfile.slug]: huaweiProfile,
  [siemensProfile.slug]: siemensProfile,
  [novellProfile.slug]: novellProfile,
  [oracleProfile.slug]: oracleProfile,
  [ibmProfile.slug]: ibmProfile,
  [sapProfile.slug]: sapProfile,
  // Pioneer wave 2 (PRIME 2026-07-16).
  [threeComProfile.slug]: threeComProfile,
  [compaqProfile.slug]: compaqProfile,
  [netscapeProfile.slug]: netscapeProfile,
  [motorolaProfile.slug]: motorolaProfile,
  [unisysProfile.slug]: unisysProfile,
  [dataGeneralProfile.slug]: dataGeneralProfile,
  // Pioneer wave 3 (PRIME 2026-07-16).
  [marconiProfile.slug]: marconiProfile,
  [wangProfile.slug]: wangProfile,
  [tandemProfile.slug]: tandemProfile,
  [bellLabsLucentAlcatelProfile.slug]: bellLabsLucentAlcatelProfile,
  [intelAmdProfile.slug]: intelAmdProfile,
  [randProfile.slug]: randProfile,
  [toshibaProfile.slug]: toshibaProfile,
  [hitachiProfile.slug]: hitachiProfile,
  [bullProfile.slug]: bullProfile,
  [ncsaProfile.slug]: ncsaProfile,
  [cienaProfile.slug]: cienaProfile,
  [snifferLineageProfile.slug]: snifferLineageProfile,
  [blueCoatPacketeerProfile.slug]: blueCoatPacketeerProfile,
  [cycladesAvocentVertivProfile.slug]: cycladesAvocentVertivProfile,
  [dellForce10Profile.slug]: dellForce10Profile,
  [zteProfile.slug]: zteProfile,
  [flukeProfile.slug]: flukeProfile,
  [dnsBindProfile.slug]: dnsBindProfile,
  [httpGopherProfile.slug]: httpGopherProfile,
  [nvidiaProfile.slug]: nvidiaProfile,
  [aristaProfile.slug]: aristaProfile,
  [ubiquitiProfile.slug]: ubiquitiProfile,
  [accessHomeFleetProfile.slug]: accessHomeFleetProfile,
  [watchguardProfile.slug]: watchguardProfile,
  [a10KempProfile.slug]: a10KempProfile,
  [datacomProfile.slug]: datacomProfile,
  [banyanProfile.slug]: banyanProfile,
  [fujitsuProfile.slug]: fujitsuProfile,
  [necProfile.slug]: necProfile,
};

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    partnerVendorSlugs.map((slug) => ({ locale, slug })),
  );
}

export default async function PartnerVendorPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const vendor = getPartnerVendor(slug);
  if (!vendor) notFound();

  const t = await getTranslations("vendors");
  const tp = await getTranslations("partnerVendors");
  const tNav = await getTranslations("nav");

  const isRedu = vendor.group === "redu";

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article>
          <section className="vendor-hero">
            <div className="container vendor-container">
              <Link href="/about/vendors" className="article-back">
                ← {t("backToVendors")}
              </Link>
              <p className="vendor-years mono">
                {isRedu ? tp("reduEyebrow") : vendor.group === "contemporary" ? tp("contemporaryEyebrow") : tp("otherEyebrow")}
              </p>
              <h1 className="vendor-name">{vendor.name}</h1>
              <p className="vendor-tagline">{vendor.tagline}</p>
            </div>
          </section>

          <section className="section">
            <div className="container vendor-container">
              <p className="era-intro">{vendor.intro}</p>
            </div>
          </section>

          {/* Accuracy note (other group): no training association. */}
          {!isRedu && vendor.note && (
            <section className="section">
              <div className="container vendor-container">
                <aside className="partner-disclaimer">
                  <span className="partner-disclaimer-tag mono">{tp("disclaimerTag")}</span>
                  <p className="partner-disclaimer-text">{vendor.note}</p>
                </aside>
              </div>
            </section>
          )}

          {/* Disclaimer (redu group): Rodolfo does not teach this vendor. */}
          {isRedu && (
            <section className="section">
              <div className="container vendor-container">
                <aside className="partner-disclaimer">
                  <span className="partner-disclaimer-tag mono">{tp("disclaimerTag")}</span>
                  <p className="partner-disclaimer-text">{tp("disclaimerText", { vendor: vendor.name })}</p>
                </aside>
              </div>
            </section>
          )}

          {/* Body */}
          <section className="section era-body-section">
            <div className="container vendor-container">
              <div className="partner-body">
                {vendor.body.map((p, i) => (
                  <p className="partner-body-p" key={i}>{p}</p>
                ))}
              </div>
            </div>
          </section>

          {/* Rich profile: foundings, timeline, products, innovations, markets, analysts */}
          {PROFILES[slug] && (
            <section className="section">
              <div className="container vendor-container">
                <VendorProfileSections
                  profile={PROFILES[slug]}
                  labels={{
                    founding: tp("foundingTitle"),
                    personalChip: tp("personalChipLabel"),
                    founders: tp("foundersLabel"),
                    timeline: tp("timelineTitle"),
                    products: tp("productsTitle"),
                    innovations: tp("innovationsTitle"),
                    markets: tp("marketsTitle"),
                    analyst: tp("analystTitle"),
                  }}
                />
              </div>
            </section>
          )}

          {/* Awards (redu group) */}
          {vendor.awards && vendor.awards.length > 0 && (
            <section className="section">
              <div className="container vendor-container">
                <h2 className="partner-awards-title">{tp("awardsTitle")}</h2>
                <ul className="partner-awards-list">
                  {vendor.awards.map((a) => (
                    <li className="partner-award" key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* External link */}
          {vendor.externalUrl && (
            <section className="section">
              <div className="container vendor-container">
                <a
                  href={vendor.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                >
                  {vendor.externalLabel ?? vendor.externalUrl} ↗
                </a>
              </div>
            </section>
          )}

          {/* Sources */}
          {vendor.sources && vendor.sources.length > 0 && (
            <section className="section">
              <div className="container vendor-container">
                <div className="partner-sources">
                  <span className="partner-sources-label mono">{tp("sourcesLabel")}</span>
                  <ul className="partner-sources-list">
                    {vendor.sources.map((s) => (
                      <li key={s.url}>
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="partner-source-link">
                          {s.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
