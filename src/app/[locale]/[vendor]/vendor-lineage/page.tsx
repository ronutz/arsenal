// ============================================================================
// src/app/[locale]/[vendor]/vendor-lineage/page.tsx
// ----------------------------------------------------------------------------
// A vendor's corporate lineage: who it bought, what those companies became,
// and what the platform is actually made of.
//
// MOVED HERE 2026-07-27 (PRIME) from /about/vendor-lineages. Two things were
// wrong with the old home. It sat under About, which is the autobiographical
// section, when a lineage is about the VENDOR rather than about Rodolfo. And
// it was written as a hub for every vendor's lineage while containing exactly
// one, so its copy spoke about vendors in general and then showed F5.
//
// Here the page belongs to the vendor whose story it tells, one click from
// that vendor's tools and articles. The route generates itself from the
// LINEAGES registry, so a vendor without researched acquisition history simply
// has no page - rather than an empty one promising more soon.
// ============================================================================

import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import AcquisitionTimeline from "@/components/AcquisitionTimeline";
import { lineageFor, LINEAGE_VENDORS } from "@/content/lineages";
import { populatedVendors } from "@/config/vendors";
import { LIVE_LOCALE_CODES } from "@/i18n/locales";

/** One page per (locale, vendor-with-a-lineage-AND-a-hub).
 *
 *  The hub condition is not cosmetic. This page lives under /<vendor>/ and its
 *  back link returns to /<vendor>, which only exists once that vendor has at
 *  least one tool. Publishing a lineage for a vendor with no hub would ship a
 *  page whose only way out is a 404 - which is how Check Point's lineage was
 *  caught before it shipped, its research being finished well before its tools
 *  were. The data sits ready and the page appears by itself the day the hub
 *  does. */
export function generateStaticParams() {
  const withHub = new Set(populatedVendors());
  return LIVE_LOCALE_CODES.flatMap((locale) =>
    LINEAGE_VENDORS.filter((v) => withHub.has(v)).map((vendor) => ({ locale, vendor })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; vendor: string }>;
}) {
  const { locale, vendor } = await params;
  const lineage = lineageFor(vendor);
  if (!lineage) return {};
  const t = await getTranslations({ locale, namespace: "lineages" });
  return {
    title: t("titleFor", { vendor: lineage.name }),
    description: lineage.tagline,
  };
}

export default async function VendorLineagePage({
  params,
}: {
  params: Promise<{ locale: string; vendor: string }>;
}) {
  const { locale, vendor } = await params;
  setRequestLocale(locale);

  const lineage = lineageFor(vendor);
  if (!lineage) notFound();

  /* PASS THE LOCALE EXPLICITLY (2026-08-14).

     WHAT IS OBSERVED: this page logged MISSING_MESSAGE for "sources" during
     the build, with a BARE key name rather than "lineages.sources" - and
     lineages.sources exists in both locale packs. So the KEY was never
     missing; the lookup was not finding the namespace.

     WHAT IS NOT CLAIMED: that the shorthand form is at fault in general. The
     same shorthand appears at roughly 148 call sites in this app and only this
     page reported anything, so a blanket explanation would be wrong. The
     object form is used a few lines above in this very file, and matching it
     here removes one variable without asserting a cause I cannot demonstrate.

     OUTCOME, RECORDED 2026-08-14: THE MESSAGE SURVIVED THIS CHANGE. One
     MISSING_MESSAGE for "sources" still appears in a full pt-BR build, so
     passing the locale explicitly was NOT the fix. The change is kept because
     the object form is the better one and matches the rest of the file, but it
     did not do what was hoped and this comment says so rather than leaving a
     fix that looks successful.

     WHAT IS RULED OUT: the key is absent (it exists in both packs), and the
     shorthand call form (148 other call sites use it without complaint).
     STILL OPEN: why this one lookup, on this one page, does not resolve.
     Whoever picks this up should start by instrumenting the call rather than
     trusting anything above. */
  const t = await getTranslations({ locale, namespace: "lineages" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tHub = await getTranslations({ locale, namespace: "vendorHub" });

  const labels = {
    founded: t("founded"),
    acquisitions: t("acquisitions"),
    became: t("became"),
    sources: t("sources"),
    asOf: t("asOf"),
    nameChanges: t("nameChanges"),
  };

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article>
          <section className="lineage-hero">
            <div className="container lineage-container">
              {/* Back to the hub this page belongs to, not to About. */}
              <Link href={`/${vendor}`} className="article-back">
                ← {t("backToHub", { vendor: lineage.name })}
              </Link>
              <h1 className="page-hero-title">{t("titleFor", { vendor: lineage.name })}</h1>
              <p className="page-hero-lede">{lineage.tagline}</p>
              <p className="lineage-intro">{t("introFor", { vendor: lineage.name })}</p>
            </div>
          </section>

          <section className="section" id={vendor}>
            <div className="container lineage-container">
              <AcquisitionTimeline lineage={lineage} labels={labels} />
            </div>
          </section>

          <section className="section">
            <div className="container lineage-container">
              <p>
                <Link className="btn btn-secondary" href={`/${vendor}`}>
                  {tHub("eyebrow")} &#8594;
                </Link>
              </p>
            </div>
          </section>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
