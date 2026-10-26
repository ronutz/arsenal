// ============================================================================
// src/app/[locale]/industry/[slug]/page.tsx
//
// MOVED 2026-07-29 (PRIME) from /industry/chapters/<slug>.
//
// The two page types had been sharing one path and they are not the same
// thing. `/industry/chapters/<slug>` is autobiography - what PRIME did inside a
// company. This is a COMPANY HISTORY, which belongs beside the industry
// timeline it is reached from and shares its data with.
//
// Second move for these URLs this week (the /partner/ segment was flattened
// out a few days ago), so `public/_redirects` carries rules for both old
// shapes. The sitemap regenerates from the built pages and self-corrects.
//
// FLATTENED 2026-07-28 (PRIME): was /industry/chapters/<slug>. The extra
// segment described how the site organised its own data - "these came from the
// partner list" - which is not a distinction a reader has any reason to care
// about. Both kinds of vendor page are now siblings under /industry/chapters/.
//
// Safe because the two sets do not overlap: 15 static career pages, 74 dynamic
// profile slugs, zero collisions (checked before moving). Next.js resolves a
// static segment ahead of [slug], so /industry/chapters/f5 keeps its hand-written
// page and everything else falls through to this one.
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

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import Breadcrumbs from "@/components/Breadcrumbs";
import VendorTags from "@/components/VendorTags";
import SiteFooter from "@/components/SiteFooter";
import { TAG_ROUTES, vendorsByTag, TAG_ROUTE_FOR, getPartnerVendor, partnerVendorSlugs } from "@/content/vendors/partners";
// The single lifecycle decision (ARC-02, 2026-10-25): no surface may print "present" for a company the record says ended.
import { lifecycleOf } from "@/content/vendors/partners";
// The parent's wording by kind (ANVIL decision 2, 26/10/2026): "part of" a company, "owned by" a fund.
import { parentStatusKey } from "@/content/vendors/partners";
// Authored locale prose for a record, where it exists (ARC-02/CC06, 2026-10-25); English otherwise.
import { localizePartnerVendor, localizeProfile } from "@/lib/vendorLocale";
// One plain-text, bounded summary per page for description, og:description and twitter:description (ARC-06).
import { withDescription } from "@/lib/metaDescription";
// The layout's default social card, restated so adding a description keeps it (ARC-06).
import { ogDefault } from "@/lib/og";
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
// D-07 (PRIME 20/07/2026): every link pointing to Red Education carries lead
// attribution and keeps the referrer; other external links stay fully strict.
import { attributeRedEducationUrl, externalRel } from "@/config/redEducation";
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
import { cabletronEnterasysProfile } from "@/content/vendors/profiles/cabletron-enterasys";
import { ciscoProfile } from "@/content/vendors/profiles/cisco";
import { extremeProfile } from "@/content/vendors/profiles/extreme";
import { f5Profile } from "@/content/vendors/profiles/f5";
import { fortinetProfile } from "@/content/vendors/profiles/fortinet";
import { ironportProfile } from "@/content/vendors/profiles/ironport";
import { netscreenJuniperProfile } from "@/content/vendors/profiles/netscreen-juniper";
import { netskopeProfile } from "@/content/vendors/profiles/netskope";
import { paloAltoProfile } from "@/content/vendors/profiles/palo-alto";
import { pingIdentityProfile } from "@/content/vendors/profiles/ping-identity";
import { pulseSecureProfile } from "@/content/vendors/profiles/pulse-secure";
import { riverstoneProfile } from "@/content/vendors/profiles/riverstone";
import { zscalerProfile } from "@/content/vendors/profiles/zscaler";
import { cloudflareProfile } from "@/content/vendors/profiles/cloudflare";
import { akamaiProfile } from "@/content/vendors/profiles/akamai";
import { equinixProfile } from "@/content/vendors/profiles/equinix";
import { crowdstrikeProfile } from "@/content/vendors/profiles/crowdstrike";
import { splunkProfile } from "@/content/vendors/profiles/splunk";
import { tenableProfile } from "@/content/vendors/profiles/tenable";
import { qualysProfile } from "@/content/vendors/profiles/qualys";
import { rapid7Profile } from "@/content/vendors/profiles/rapid7";
import { elasticProfile } from "@/content/vendors/profiles/elastic";
import { sophosProfile } from "@/content/vendors/profiles/sophos";
import { kasperskyProfile } from "@/content/vendors/profiles/kaspersky";
import { solarwindsProfile } from "@/content/vendors/profiles/solarwinds";
import { ivantiProfile } from "@/content/vendors/profiles/ivanti";
import { edsProfile } from "@/content/vendors/profiles/eds";
import { netappProfile } from "@/content/vendors/profiles/netapp";
import { kyndrylProfile } from "@/content/vendors/profiles/kyndryl";
import { nozomiProfile } from "@/content/vendors/profiles/nozomi-networks";
import { illumioProfile } from "@/content/vendors/profiles/illumio";
import { lotusProfile } from "@/content/vendors/profiles/lotus";
import { altavistaProfile } from "@/content/vendors/profiles/altavista";
import { emcProfile } from "@/content/vendors/profiles/emc";
import { genesysProfile } from "@/content/vendors/profiles/genesys";
import { apacheProfile } from "@/content/vendors/profiles/apache";
import { arcsightProfile } from "@/content/vendors/profiles/arcsight";
import { lumenProfile } from "@/content/vendors/profiles/lumen-centurylink-level3";
import { usroboticsProfile } from "@/content/vendors/profiles/usrobotics";
import { freeradiusProfile } from "@/content/vendors/profiles/freeradius";
import { honeywellProfile } from "@/content/vendors/profiles/honeywell";
import { tandyProfile } from "@/content/vendors/profiles/tandy-radioshack";
import { cpqdProfile } from "@/content/vendors/profiles/cpqd";
import { telebrasProfile } from "@/content/vendors/profiles/telebras-system";
import { brasilTelecomProfile } from "@/content/vendors/profiles/brasil-telecom";
import { stefaniniProfile } from "@/content/vendors/profiles/stefanini";
import { offsecProfile } from "@/content/vendors/profiles/offsec";
import { googleSearchProfile } from "@/content/vendors/profiles/google-search";
import { forcepointProfile } from "@/content/vendors/profiles/websense-forcepoint";
import { pearsonVueProfile } from "@/content/vendors/profiles/pearson-vue";
import { comptiaProfile } from "@/content/vendors/profiles/comptia";
import { credlyProfile } from "@/content/vendors/profiles/credly";
import { ingramMicroProfile } from "@/content/vendors/profiles/ingram-micro";
import { westconProfile } from "@/content/vendors/profiles/westcon-comstor";
import { scansourceProfile } from "@/content/vendors/profiles/scansource";
import { arrowProfile } from "@/content/vendors/profiles/arrow-electronics";
import { techDataSynnexProfile } from "@/content/vendors/profiles/tech-data-synnex";
import { anixterProfile } from "@/content/vendors/profiles/anixter";
import { hclProfile } from "@/content/vendors/profiles/hcl";
import { accentureProfile } from "@/content/vendors/profiles/accenture";
import { promonLogicalisProfile } from "@/content/vendors/profiles/promon-logicalis";
import { tivitProfile } from "@/content/vendors/profiles/tivit";
import { compugrafProfile } from "@/content/vendors/profiles/compugraf";
import { parxtechProfile } from "@/content/vendors/profiles/parxtech";
import { capgeminiProfile } from "@/content/vendors/profiles/capgemini";
import { cipherProfile } from "@/content/vendors/profiles/cipher";
import { navaProfile } from "@/content/vendors/profiles/nava";
import { cylkProfile } from "@/content/vendors/profiles/cylk";
import { flipsideProfile } from "@/content/vendors/profiles/flipside";
import { tdecProfile } from "@/content/vendors/profiles/tdec";
import { accessHomeFleetProfile } from "@/content/vendors/profiles/access-home-fleet";
import { watchguardProfile } from "@/content/vendors/profiles/watchguard";
import { a10Profile } from "@/content/vendors/profiles/a10";
import { kempProfile } from "@/content/vendors/profiles/kemp";
import { datacomProfile } from "@/content/vendors/profiles/datacom";
import { banyanProfile } from "@/content/vendors/profiles/banyan";
import { fujitsuProfile } from "@/content/vendors/profiles/fujitsu";
import { necProfile } from "@/content/vendors/profiles/nec";
import { dolchProfile } from "@/content/vendors/profiles/dolch";
import { cycladesNetworkProfile } from "@/content/vendors/profiles/cyclades-network";
import { asusAskeyProfile } from "@/content/vendors/profiles/asus-askey";
import { netgearProfile } from "@/content/vendors/profiles/netgear";
import { tpLinkProfile } from "@/content/vendors/profiles/tp-link";
import { zyxelProfile } from "@/content/vendors/profiles/zyxel";
import { alliedTelesisProfile } from "@/content/vendors/profiles/allied-telesis";

// Rich profiles, keyed by slug. Vendors without a profile render the simple layout.
const PROFILES: Record<string, VendorProfile> = {
  [compugrafProfile.slug]: compugrafProfile,
  [tivitProfile.slug]: tivitProfile,
  [promonLogicalisProfile.slug]: promonLogicalisProfile,
  [accentureProfile.slug]: accentureProfile,
  [hclProfile.slug]: hclProfile,
  [anixterProfile.slug]: anixterProfile,
  [techDataSynnexProfile.slug]: techDataSynnexProfile,
  [arrowProfile.slug]: arrowProfile,
  [scansourceProfile.slug]: scansourceProfile,
  [westconProfile.slug]: westconProfile,
  [ingramMicroProfile.slug]: ingramMicroProfile,
  [credlyProfile.slug]: credlyProfile,
  [comptiaProfile.slug]: comptiaProfile,
  [pearsonVueProfile.slug]: pearsonVueProfile,
  [forcepointProfile.slug]: forcepointProfile,
  [googleSearchProfile.slug]: googleSearchProfile,
  [offsecProfile.slug]: offsecProfile,
  [stefaniniProfile.slug]: stefaniniProfile,
  [brasilTelecomProfile.slug]: brasilTelecomProfile,
  [telebrasProfile.slug]: telebrasProfile,
  [cpqdProfile.slug]: cpqdProfile,
  [tandyProfile.slug]: tandyProfile,
  [honeywellProfile.slug]: honeywellProfile,
  [freeradiusProfile.slug]: freeradiusProfile,
  [usroboticsProfile.slug]: usroboticsProfile,
  [lumenProfile.slug]: lumenProfile,
  [arcsightProfile.slug]: arcsightProfile,
  [apacheProfile.slug]: apacheProfile,
  [genesysProfile.slug]: genesysProfile,
  [emcProfile.slug]: emcProfile,
  [altavistaProfile.slug]: altavistaProfile,
  [lotusProfile.slug]: lotusProfile,
  [illumioProfile.slug]: illumioProfile,
  [nozomiProfile.slug]: nozomiProfile,
  [kyndrylProfile.slug]: kyndrylProfile,
  [netappProfile.slug]: netappProfile,
  [edsProfile.slug]: edsProfile,
  [ivantiProfile.slug]: ivantiProfile,
  [solarwindsProfile.slug]: solarwindsProfile,
  [sophosProfile.slug]: sophosProfile,
  [kasperskyProfile.slug]: kasperskyProfile,
  [elasticProfile.slug]: elasticProfile,
  [tenableProfile.slug]: tenableProfile,
  [qualysProfile.slug]: qualysProfile,
  [rapid7Profile.slug]: rapid7Profile,
  [splunkProfile.slug]: splunkProfile,
  [crowdstrikeProfile.slug]: crowdstrikeProfile,
  [equinixProfile.slug]: equinixProfile,
  [akamaiProfile.slug]: akamaiProfile,
  [cabletronEnterasysProfile.slug]: cabletronEnterasysProfile,
  [ciscoProfile.slug]: ciscoProfile,
  [extremeProfile.slug]: extremeProfile,
  [f5Profile.slug]: f5Profile,
  [fortinetProfile.slug]: fortinetProfile,
  [ironportProfile.slug]: ironportProfile,
  [netscreenJuniperProfile.slug]: netscreenJuniperProfile,
  [netskopeProfile.slug]: netskopeProfile,
  [paloAltoProfile.slug]: paloAltoProfile,
  [pingIdentityProfile.slug]: pingIdentityProfile,
  [pulseSecureProfile.slug]: pulseSecureProfile,
  [riverstoneProfile.slug]: riverstoneProfile,
  [zscalerProfile.slug]: zscalerProfile,
  [cloudflareProfile.slug]: cloudflareProfile,
  [parxtechProfile.slug]: parxtechProfile,
  [capgeminiProfile.slug]: capgeminiProfile,
  [cipherProfile.slug]: cipherProfile,
  [navaProfile.slug]: navaProfile,
  [cylkProfile.slug]: cylkProfile,
  [flipsideProfile.slug]: flipsideProfile,
  [tdecProfile.slug]: tdecProfile,
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
  [dolchProfile.slug]: dolchProfile,
  [cycladesNetworkProfile.slug]: cycladesNetworkProfile,
  [asusAskeyProfile.slug]: asusAskeyProfile,
  [netgearProfile.slug]: netgearProfile,
  [tpLinkProfile.slug]: tpLinkProfile,
  [zyxelProfile.slug]: zyxelProfile,
  [alliedTelesisProfile.slug]: alliedTelesisProfile,
  [accessHomeFleetProfile.slug]: accessHomeFleetProfile,
  [watchguardProfile.slug]: watchguardProfile,
  [a10Profile.slug]: a10Profile,
  [kempProfile.slug]: kempProfile,
  [datacomProfile.slug]: datacomProfile,
  [banyanProfile.slug]: banyanProfile,
  [fujitsuProfile.slug]: fujitsuProfile,
  [necProfile.slug]: necProfile,
};

export function generateStaticParams() {
  // Company pages AND the tag-filtered lists share this route. They cannot be
  // separate dynamic segments at the same level, so the page branches on
  // whether the slug is a tag route. A guard forbids collisions between the
  // two sets, because a company whose slug matched a tag route would simply be
  // unreachable and nothing would say so.
  return routing.locales.flatMap((locale) => [
    ...partnerVendorSlugs.map((slug) => ({ locale, slug })),
    ...Object.keys(TAG_ROUTES).map((slug) => ({ locale, slug })),
  ]);
}

/**
 * Entry slug -> vendor hub key, for the seven company histories whose
 * acquisitions live on a hub's vendor-lineage page. Deliberately explicit:
 * two of the seven do not match by string (`check-point` vs `checkpoint`,
 * `ping-identity` vs `ping`), and a silent mismatch here would produce exactly
 * the failure this map was added to fix - a reference with nowhere to go.
 */
const LINEAGE_HUB_KEY: Record<string, string> = {
  f5: "f5",
  fortinet: "fortinet",
  netskope: "netskope",
  extreme: "extreme",
  zscaler: "zscaler",
  "ping-identity": "ping",
  "check-point": "checkpoint",
};

/**
 * PAGE TITLE (2026-08-16).
 *
 * This route had NO metadata export at all, so all 298 pages under /industry
 * inherited the site-wide default title - the largest block of identical
 * <title> values on the site, and the vendor hubs are exactly the pages a
 * reader reaches from a search for a company name.
 *
 * It branches the same way the page does, because the route serves two shapes:
 * a company page and a tag-filtered list. A title that did not branch would be
 * wrong for one of them.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;

  const tag = TAG_ROUTES[slug];
  if (tag) {
    const tTag = await getTranslations({ locale, namespace: "industryTags" });
    return { title: tTag(`${tag}.title`) };
  }

  // The record, with its prose in this locale where an overlay was authored.
  const record = getPartnerVendor(slug);
  if (!record) return {};
  const vendor = localizePartnerVendor(record, locale);

  // TITLE SHORTENED 2026-10-25 (Round 1, ARC-06). It was `${name} - ${tagline}`,
  // which on a lineage card produced titles of two hundred characters and more
  // ("Nortel & Bay Networks - the giant that vanished - From 1895 Montreal to a
  // third of Canada's stock index ..."). The record's name already carries its
  // short subtitle; the section label says where the page sits. The company's
  // own name still comes first, because it is what somebody typed into a search
  // box. Names are unique across records, so titles stay distinct.
  const tInd = await getTranslations({ locale, namespace: "industry" });
  const title = `${vendor.name} · ${tInd("navLabel")}`;

  // DESCRIPTION (ARC-06): the record's own one-line summary (its tagline),
  // the same text the card and the hero show, instead of the site-wide
  // tagline every company page inherited. Plain text, bounded, one value for
  // the three description fields. Canonical and hreflang still come from the
  // layout. This route never set its own card, and Next.js replaces the
  // layout's whole openGraph/twitter object once a page sets one, so the base
  // below restates the layout's own default card, type and site name exactly
  // (same image, same alt) and the description is merged into it.
  const tSite = await getTranslations({ locale, namespace: "site" });
  const card = ogDefault(tSite("name"));
  const base = {
    openGraph: { type: "website" as const, siteName: tSite("name"), ...card.openGraph },
    twitter: card.twitter,
  };
  return { title, ...withDescription(vendor.tagline || vendor.intro, base, `industry/${slug}`) };
}

export default async function PartnerVendorPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  // ---- TAG-FILTERED LIST -------------------------------------------------
  // If the slug names a tag route, this is a filtered timeline rather than a
  // company. Rendered from the same data the tags live on, so it cannot drift:
  // tag a company and it appears here, untag it and it leaves. That is the
  // whole reason PRIME's request for distributor and reseller pages was built
  // this way rather than as hand-maintained lists.
  const tag = TAG_ROUTES[slug];
  if (tag) {
    // Prose in the reader's locale where an overlay was authored, as on the /industry index (ARC-02/CC06).
    const listed = vendorsByTag(tag).map((v) => localizePartnerVendor(v, locale));
    const tTag = await getTranslations({ locale, namespace: "industryTags" });
    const tNavTag = await getTranslations({ locale, namespace: "nav" });
    const tIndTag = await getTranslations({ locale, namespace: "industry" });
    // The timeline rows below reuse partnerVendors' own labels, so the string
    // is declared once and both routes read the same key (PRIME 2026-10-02).
    const tpTag = await getTranslations({ locale, namespace: "partnerVendors" });
    return (
      <>
        <Header />
        <main id="main">
          <section className="section">
            <div className="container vendor-container">
              {/* ADDED 2026-08-10 (PRIME): the category pages had no
                  breadcrumbs, so a reader who landed on /industry/vendors from
                  search had no way back up to the timeline they are a filtered
                  view OF. */}
              <Breadcrumbs
                ariaLabel={tNavTag("breadcrumb")}
                items={[
                  { label: tNavTag("home"), href: "/" },
                  { label: tIndTag("navLabel"), href: "/industry" },
                  { label: tTag(`${tag}.title`) },
                ]}
              />
              <p className="vendor-eyebrow mono">{tTag("eyebrow")}</p>
              <h1 className="article-title">{tTag(`${tag}.title`)}</h1>
              <p className="era-intro">{tTag(`${tag}.intro`)}</p>
              <p className="ztc-notes mono">
                {tTag("count", { count: listed.length })}
              </p>

              {listed.length === 0 ? (
                <p className="ztc-notes">{tTag("empty")}</p>
              ) : (
                <div className="vendor-timeline">
                  {listed.map((v) => (
                    <div className="vendor-timeline-row" key={v.slug}>
                      {/* The gutter marks POSITION (PRIME 2026-10-02): vendorsByTag
                          orders by storyStart(), so a card sorted at its
                          predecessor's year is labelled with that year here while
                          the card below states its own subject's founding. */}
                      <span className="vendor-timeline-year mono" aria-hidden="true">
                        {v.storyBegins?.year ?? v.founded}
                      </span>
                      <Link className="vendor-card" href={`/industry/${v.slug}`}>
                        <span className="vendor-card-years mono">
                          {/* LIFECYCLE (ARC-02, 2026-10-25): this line wrote a
                              literal English " - present" for every record
                              without an ending, defunct companies included. It
                              now reads lifecycleOf() and the same translated
                              labels as the /industry index. */}
                          {(() => {
                            // The record's lifecycle, decided in one place.
                            const lc = lifecycleOf(v);
                            // Dated ending: founded to that year.
                            if (lc.state === "ended") return tpTag("timelineSpan", { from: v.founded ?? "", to: lc.year });
                            // Ended without a sourced year: say so, never "present".
                            if (lc.state === "ended-undated") return tpTag("timelineEndedUndated", { from: v.founded ?? "" });
                            // No ending and no own site on file: never "present" (round 2, PRIME 2026-10-25).
                            if (lc.state === "unverified") return tpTag("timelineUnverified", { from: v.founded ?? "" });
                            // Several companies or a protocol: no single status (PRIME ruling 2, 26/10/2026).
                            if (lc.state === "lineage") return tpTag("timelineLineage", { from: v.founded ?? "" });
                            // Present and owned by a parent: say whose (PRIME ruling 1, 26/10/2026); plain text,
                            // because this card is itself a link.
                            if (lc.parent) {
                              // The key follows the owner's kind and the year on file (parentStatusKey, 26/10/2026).
                              return tpTag.rich(parentStatusKey(lc.parent), {
                                // The card's own founding year.
                                from: v.founded ?? "",
                                // The parent's name, a fact kept as the record writes it (a state owner alone is named in the locale via the overlay).
                                parent: lc.parent.name,
                                // The completion year, read only by the "Since" variant.
                                since: lc.parent.since ?? "",
                                // The name as text inside the card's link.
                                org: (chunks) => chunks,
                              });
                            }
                            // The company's own live site is on file: present.
                            return tpTag("timelineSince", { from: v.founded ?? "" });
                          })()}
                          {/* WHOSE YEAR IS THIS (PRIME 2026-10-02). Same reason
                              as on the /industry index: where the year belongs
                              to a company this card is not named for, the card
                              says so rather than letting a bare year imply the
                              wrong founding. */}
                          {v.storyBegins && (
                            <span className="vendor-card-founded-company">
                              <span className="vendor-card-founded-company-label">
                                {tpTag("storyBeginsLabel")}
                              </span>
                              {`${v.storyBegins.year}, ${v.storyBegins.company}`}
                            </span>
                          )}
                          {v.foundedCompany && (
                            <span className="vendor-card-founded-company">
                              <span className="vendor-card-founded-company-label">
                                {tpTag("foundedCompanyLabel")}
                              </span>
                              {v.foundedCompany}
                            </span>
                          )}
                        </span>
                        <span className="vendor-card-name">{v.name}</span>
                        <span className="vendor-card-tagline">{v.tagline}</span>
                        {/* Other tags this company holds, so a reader can move
                            sideways rather than back. */}
                        {(v.tags ?? []).filter((x) => x !== tag).length > 0 && (
                          <span className="vendor-card-tags mono">
                            {(v.tags ?? [])
                              .filter((x) => x !== tag)
                              .map((x) => tTag(`${x}.short`))
                              .join(" · ")}
                          </span>
                        )}
                      </Link>
                    </div>
                  ))}
                </div>
              )}

              <p className="ztc-notes">
                <Link href="/industry">{tTag("backToAll")}</Link>
              </p>
            </div>
          </section>
        </main>
        <SiteFooter />
      </>
    );
  }

  const record = getPartnerVendor(slug);
  if (!record) notFound();
  // Prose in the reader's locale where an overlay was authored; every fact
  // (years, ending year, sources, tags) stays the English record's (ARC-02/CC06).
  const vendor = localizePartnerVendor(record, locale);
  // The profile likewise: a complete translation, or the English profile.
  const profile = localizeProfile(slug, PROFILES[slug], locale);
  // What the hero may say about the company still existing (ARC-02).
  const lifecycle = lifecycleOf(vendor);

  const t = await getTranslations("vendors");
  const tp = await getTranslations("partnerVendors");

  const isRedu = vendor.group === "redu";

  return (
    <>
      <Header />

      <main id="main">
        <article>
          <section className="vendor-hero">
            <div className="container vendor-container">
              <Link href="/industry" className="article-back">
                ← {t("backToVendors")}
              </Link>
              {/* The eyebrow says what the PAGE is (PRIME 2026-07-28). The
                  relationship - training partner, worked with, authorized to
                  instruct - moves to the tag row, where more than one can be
                  true at once. */}
              <p className="vendor-years mono">{tp("lineageEyebrow")}</p>
              {/* The engagement marker was already on the index card and
                  missing here, so a reader who arrived straight at a company
                  page saw no relationship at all (PRIME, 2026-09-01). The
                  component has always supported it; the page never passed it. */}
              <VendorTags
                reduPartner={isRedu}
                reduLabel={tp("reduPill")}
                workedWith={
                  vendor.relationships?.includes("worked-with-directly") ||
                  vendor.relationships?.includes("worked-inside") ||
                  false
                }
                workedWithLabel={
                  vendor.relationships?.includes("worked-inside")
                    ? tp("careerPill")
                    : tp("workedWithPill")
                }
              />
              <h1 className="vendor-name">{vendor.name}</h1>
              <p className="vendor-tagline">{vendor.tagline}</p>
              {/* ENDED COMPANIES SAY SO ON THEIR OWN PAGE (ARC-02, 2026-10-25).
                  The index card carried the span and the note; a reader who
                  arrived here from search saw neither. Active records add
                  nothing, so their pages are unchanged. */}
              {lifecycle.state !== "active" && (
                <p className="vendor-card-end">
                  {/* Round 2 (PRIME 2026-10-25): an unverified record says so here too. */}
                  {lifecycle.state === "ended"
                    ? tp("timelineSpan", { from: vendor.founded ?? "", to: lifecycle.year })
                    : lifecycle.state === "ended-undated"
                      ? tp("timelineEndedUndated", { from: vendor.founded ?? "" })
                      : lifecycle.state === "lineage"
                        // Ruling 2 (PRIME 26/10/2026): a lineage card says it has no single status.
                        ? tp("timelineLineage", { from: vendor.founded ?? "" })
                        : tp("timelineUnverified", { from: vendor.founded ?? "" })}
                  {/* Ended states and lineage cards carry a note; "unverified" has none. */}
                  {lifecycle.state !== "unverified" && lifecycle.note ? `. ${lifecycle.note}` : ""}
                </p>
              )}
              {/* A LINEAGE CARD SENDS THE READER TO THE STATUSES THAT DO EXIST (PRIME ruling 2, 26/10/2026): the
                  member companies' own cards, by their short names in the reader's locale. Absent for the protocol
                  cards, which have no member companies. */}
              {lifecycle.state === "lineage" && lifecycle.members && lifecycle.members.length > 0 && (
                <p className="vendor-card-tagline" style={{ display: "block", marginTop: "0.5rem" }}>
                  {/* The label, then the members separated by commas. */}
                  {tp("lineageMembersLabel")}{" "}
                  {lifecycle.members.map((m, i) => {
                    // The member's record, localised for its name (the guard guarantees the slug resolves).
                    const member = getPartnerVendor(m);
                    // A short name: the title before its " - " subtitle, as the hub's doors show it.
                    const short = member ? localizePartnerVendor(member, locale).name.split(/\s[-–—]\s/)[0] : m;
                    // Comma before every member but the first, then the link.
                    return (
                      <span key={m}>
                        {i > 0 ? ", " : ""}
                        <Link href={`/industry/${m}`}>{short}</Link>
                      </span>
                    );
                  })}
                </p>
              )}
              {/* A SUBSIDIARY SAYS WHOSE IT IS (PRIME ruling 1, 26/10/2026): "1996 - present, part of HPE (since
                  2025)", the parent linked to its own card when it has one. Deliberately NOT .vendor-card-end, which
                  marks a company that is not "present" (and which the production probe expects absent on active
                  records); it takes the card's own status-line style instead, so card and page read alike. */}
              {lifecycle.state === "active" && lifecycle.parent && (
                <>
                  <p className="vendor-card-years mono" style={{ display: "block", marginTop: "1rem" }}>
                    {/* The key follows the owner's kind and the year on file (parentStatusKey, 26/10/2026). */}
                    {tp.rich(parentStatusKey(lifecycle.parent), {
                      // The company's own founding year, as on the card.
                      from: vendor.founded ?? "",
                      // The parent's name, a fact kept as the record writes it (a state owner alone is named in the locale via the overlay).
                      parent: lifecycle.parent.name,
                      // The completion year, read only by the "Since" variant.
                      since: lifecycle.parent.since ?? "",
                      // The name links to the parent's card when the record names one, and is plain text otherwise.
                      org: (chunks) => (lifecycle.parent?.slug ? <Link href={`/industry/${lifecycle.parent.slug}`}>{chunks}</Link> : chunks),
                    })}
                  </p>
                  {/* The parent's note, when the record carries one (in the reader's locale through the overlay). */}
                  {lifecycle.parent.note && (
                    <p className="vendor-card-tagline" style={{ display: "block", marginTop: "0.35rem" }}>
                      {lifecycle.parent.note}
                    </p>
                  )}
                </>
              )}
            </div>
          </section>

          <section className="section section-accent">
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

          {/* REMOVED 2026-08-04 (PRIME). This block rendered a note reading
              "Rodolfo does not deliver {vendor} training" on twelve vendor
              pages. It was a deliberate July design - an honest disclaimer on
              pages for vendors Red Education is authorised for but PRIME does
              not personally teach - and it is now forbidden by a later standing
              rule: NEVER state that he teaches something, and never state that
              he does not.

              The reasoning recorded when that rule was applied to three other
              vendors holds here too: a stale denial is more damaging than a
              stale claim, because it is public, searchable, and contradicts an
              authorisation the moment one is granted.

              These are corporate-history pages. They carry no training claim in
              either direction, which is what the `group: "other"` pages have
              always done and what these now do too. */}

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
          {profile && (
            <section className="section section-accent">
              <div className="container vendor-container">
                <VendorProfileSections
                  profile={profile}
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

                {vendor.careerChapter && (
            /* The link back to the person. Kept deliberately small and
               placed after the history rather than before it: this page is
               about the company, and the fact that somebody worked here is
               a footnote to that, not the headline. */
            <section className="section section-accent">
              <div className="about-cred-grid">
                <Link
                  href={`/industry/chapters/${vendor.careerChapter.slug}`}
                  className="about-cred-card"
                >
                  <span className="about-cred-eyebrow">{tp("careerCardEyebrow")}</span>
                  <span className="about-cred-title">
                    {tp("careerCardTitle", { years: vendor.careerChapter.years })}
                  </span>
                  <span className="about-cred-desc">{tp("careerCardDesc")}</span>
                  <span className="about-cred-cta">{tp("careerCardCta")} &rarr;</span>
                </Link>
              </div>
            </section>
          )}

          {vendor.acquisitions && vendor.acquisitions.length > 0 && (
            /* Same markup as the vendor-lineage pages, deliberately: the
               nested-acquisition rule applies to both page types and a
               reader should meet one idea, not two. */
            <section className="section">
              {/* CONTAINER ADDED 2026-08-04 (PRIME reported this section as
                  badly formatted). Every other section on this page wraps its
                  content in `container vendor-container`; this one did not, so
                  the list ran full-bleed at whatever width the viewport was.
                  It was ALSO nested inside the sources <ul> until the same
                  pass - two separate faults producing one visible symptom. */}
              <div className="container vendor-container">
                <h2 className="section-title">{tp("acquisitionsHeading")}</h2>
                <ol className="lineage-timeline">
                  {[...vendor.acquisitions]
                    .sort((a, b) => a.year - b.year)
                    .map((a) => (
                      <li className="lineage-deal" key={`${a.year}-${a.name}`}>
                        <p className="lineage-deal-top">
                          <span className="lineage-deal-year mono">{a.year}</span>{" "}
                          <span className="lineage-deal-name">{a.name}</span>
                          {a.price ? (
                            <span className="lineage-deal-price mono"> {a.price}</span>
                          ) : null}
                        </p>
                        <p className="lineage-deal-what">{a.what}</p>
                        {a.founder && (
                          <p className="lineage-deal-founder">{a.founder}</p>
                        )}
                        {a.subAcquisitions && a.subAcquisitions.length > 0 && (
                          <ul className="lineage-sub-list">
                            {a.subAcquisitions.map((sub) => (
                              <li className="lineage-sub" key={`${sub.year}-${sub.name}`}>
                                <span className="lineage-sub-year mono">{sub.year}</span>{" "}
                                <span className="lineage-sub-name">{sub.name}</span>
                                {sub.price ? (
                                  <span className="lineage-sub-price mono"> {sub.price}</span>
                                ) : null}
                                {/* 2026-10-25: was " &mdash; ", an em dash rendered into English
                                    pages (D-55), invisible to the string-based em-dash guard. */}
                                <span className="lineage-sub-what">: {sub.what}</span>
                                {/* 2026-10-25: was a hard-coded English "Founded by", now a
                                    translated label so pt-BR pages read in Portuguese. */}
                                {sub.founder && (
                                  <span className="lineage-sub-founder"> {tp("subFounder", { name: sub.founder })}</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                        {a.became && (
                          <p className="lineage-deal-became">{a.became}</p>
                        )}
                        {a.sourceNote && (
                          <p className="lineage-deal-note">{a.sourceNote}</p>
                        )}
                      </li>
                    ))}
                </ol>
              </div>
            </section>
          )}

          {/* External link */}
          {vendor.externalUrl && (
            <section className="section section-accent">
              <div className="container vendor-container">
                <a
                  href={attributeRedEducationUrl(vendor.externalUrl, { vendor: vendor.slug, pageType: "vendor-partner", pageSlug: vendor.slug, locale, cta: "site-link" })}
                  target="_blank"
                  rel={externalRel(vendor.externalUrl)}
                  className="btn btn-secondary"
                >
                  {vendor.externalLabel ?? vendor.externalUrl} ↗
                </a>
              </div>
            </section>
          )}

          {/* VENDOR LINEAGE LINK - added 2026-08-04 (PRIME).
              Seven entries carry the sentence "its acquisitions are on the
              vendor lineage page". The page exists and holds the deals - but
              nothing on this page LINKED to it, so a reader was told where to
              go and given no way to get there.

              The slugs differ from the hub keys (`check-point` -> `checkpoint`,
              `ping-identity` -> `ping`), which is why this needs an explicit
              map rather than a string match. Only these vendors have a hub and
              therefore a lineage page; everyone else renders nothing. */}
          {LINEAGE_HUB_KEY[vendor.slug] && (
            <section className="section">
              <div className="container vendor-container">
                <Link
                  href={`/${LINEAGE_HUB_KEY[vendor.slug]}/vendor-lineage`}
                  className="partner-lineage-link"
                >
                  {tp("lineageLink")} &rarr;
                </Link>
              </div>
            </section>
          )}

          {/* Sources */}
          {/* --- FROM THE COMPANY (golden standard, PRIME 2026-08-06) ---
               Placed BEFORE sources, and visibly separate from them. A source
               is evidence this site cites; this is where the company speaks for
               itself. Keeping them apart stops vendor marketing being read as
               corroboration of our claims.

               A defunct company gets a statement, not a link. Sending a reader
               to an acquirer's homepage under the dead company's name would
               misrepresent who is still trading. */}
          {vendor.official && (
            <section className="section section-accent">
              <div className="container vendor-container">
                <div className="partner-sources">
                  <span className="partner-sources-label mono">{tp("officialLabel")}</span>
                  {vendor.official.defunct ? (
                    <p className="vendor-note-body">
                      {tp("officialDefunct")}
                      {vendor.official.successor && (
                        <>
                          {" "}
                          {tp("officialSuccessor")}{" "}
                          <a href={vendor.official.successor.url} target="_blank" rel="noopener noreferrer">
                            {vendor.official.successor.label}
                          </a>
                          .
                        </>
                      )}
                    </p>
                  ) : (
                    <ul className="partner-sources-list">
                      {vendor.official.url && (
                        <li>
                          <a href={vendor.official.url} target="_blank" rel="noopener noreferrer">
                            {tp("officialSite")} &#8599;
                          </a>
                        </li>
                      )}
                      {vendor.official.resources?.map((r) => (
                        <li key={r.url}>
                          <a href={r.url} target="_blank" rel="noopener noreferrer">
                            {r.label} &#8599;
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </section>
          )}

          {vendor.sources && vendor.sources.length > 0 && (
            <section className="section">
              <div className="container vendor-container">
                <div className="partner-sources">
                  <span className="partner-sources-label mono">{tp("sourcesLabel")}</span>
                  <ul className="partner-sources-list">
              {vendor.sources.map((s) => (
                      <li key={s.url}>
                        <a
                          href={attributeRedEducationUrl(s.url, { vendor: vendor.slug, pageType: "vendor-partner", pageSlug: vendor.slug, locale, cta: "source-link" })}
                          target="_blank"
                          rel={externalRel(s.url)}
                          className="partner-source-link"
                        >
                          {s.label}
                        </a>
                        {/* A qualification of the source itself, where one is
                            needed - what it is good for and what it is not.
                            Rendered rather than left in the data, because a
                            caveat nobody can see is not a caveat. */}
                        {s.sourceNote && (
                          <p className="partner-source-note">{s.sourceNote}</p>
                        )}
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
