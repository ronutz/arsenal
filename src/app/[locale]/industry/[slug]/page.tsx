// ============================================================================
// src/app/[locale]/industry/[slug]/page.tsx
//
// MOVED 2026-07-29 (PRIME) from /about/vendors/<slug>.
//
// The two page types had been sharing one path and they are not the same
// thing. `/about/vendors/<slug>` is autobiography - what PRIME did inside a
// company. This is a COMPANY HISTORY, which belongs beside the industry
// timeline it is reached from and shares its data with.
//
// Second move for these URLs this week (the /partner/ segment was flattened
// out a few days ago), so `public/_redirects` carries rules for both old
// shapes. The sitemap regenerates from the built pages and self-corrects.
//
// FLATTENED 2026-07-28 (PRIME): was /about/vendors/<slug>. The extra
// segment described how the site organised its own data - "these came from the
// partner list" - which is not a distinction a reader has any reason to care
// about. Both kinds of vendor page are now siblings under /about/vendors/.
//
// Safe because the two sets do not overlap: 15 static career pages, 74 dynamic
// profile slugs, zero collisions (checked before moving). Next.js resolves a
// static segment ahead of [slug], so /about/vendors/f5 keeps its hand-written
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

import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import VendorTags from "@/components/VendorTags";
import SiteFooter from "@/components/SiteFooter";
import { TAG_ROUTES, vendorsByTag, TAG_ROUTE_FOR, getPartnerVendor, partnerVendorSlugs } from "@/content/vendors/partners";
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
import { parxtechProfile } from "@/content/vendors/profiles/parxtech";
import { accessHomeFleetProfile } from "@/content/vendors/profiles/access-home-fleet";
import { watchguardProfile } from "@/content/vendors/profiles/watchguard";
import { a10KempProfile } from "@/content/vendors/profiles/a10-kemp";
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
  [a10KempProfile.slug]: a10KempProfile,
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
    const listed = vendorsByTag(tag);
    const tTag = await getTranslations({ locale, namespace: "industryTags" });
    return (
      <>
        <Header />
        <main id="main">
          <section className="section">
            <div className="container vendor-container">
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
                      <span className="vendor-timeline-year mono" aria-hidden="true">
                        {v.founded}
                      </span>
                      <Link className="vendor-card" href={`/industry/${v.slug}`}>
                        <span className="vendor-card-years mono">
                          {v.founded}
                          {v.ended ? ` - ${v.ended.year}` : " - present"}
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
              <Link href="/industry" className="article-back">
                ← {t("backToVendors")}
              </Link>
              {/* The eyebrow says what the PAGE is (PRIME 2026-07-28). The
                  relationship - training partner, worked with, authorized to
                  instruct - moves to the tag row, where more than one can be
                  true at once. */}
              <p className="vendor-years mono">{tp("lineageEyebrow")}</p>
              <VendorTags reduPartner={isRedu} reduLabel={tp("reduPill")} />
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

                {vendor.careerChapter && (
            /* The link back to the person. Kept deliberately small and
               placed after the history rather than before it: this page is
               about the company, and the fact that somebody worked here is
               a footnote to that, not the headline. */
            <section className="section">
              <div className="about-cred-grid">
                <Link
                  href={`/about/vendors/${vendor.careerChapter.slug}`}
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
                                <span className="lineage-sub-what"> &mdash; {sub.what}</span>
                                {sub.founder && (
                                  <span className="lineage-sub-founder"> Founded by {sub.founder}.</span>
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
            <section className="section">
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
