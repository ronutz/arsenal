// ============================================================================
// src/app/[locale]/glossary/domain/[domain]/page.tsx
// ----------------------------------------------------------------------------
// One browsable page per glossary DOMAIN: /glossary/domain/crypto and so on.
//
// WHY (PRIME, 2026-09-14, "findability needs improvements").
//
// The measurement that prompted it: /tools ships a 441 KB index organised into
// fifteen named categories. /glossary ships a THREE MEGABYTE index organised by
// nothing but first letter - A101, B79, C157. A reader who does not already
// know the word they want has no way in.
//
// The data to fix that was already there and unused. Every one of the 1,703
// entries carries `domains`, and every domain already has a translated label.
// The index even has a client-side domain filter - but you must download three
// megabytes before you can use it, and the result has no URL, so it cannot be
// linked, shared, bookmarked or indexed.
//
// These pages are the missing half: the same grouping, addressable. An article
// about certificates can now point at the cryptography glossary specifically
// rather than at 1,703 terms and an apology.
//
// SCOPE: generated for every LIVE locale, matching the glossary index rather
// than the term pages. Index pages are advertised everywhere; only the term
// detail pages are limited to the authored locales (2026-09-10 decision), and
// a link into those simply redirects for the rest.
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import Breadcrumbs from "@/components/Breadcrumbs";
import { LIVE_LOCALE_CODES } from "@/i18n/locales";
import {
  getAllGlossaryEntries,
  getGlossaryDomains,
  type GlossaryDomain,
} from "@/content/glossary/glossary";

export const dynamicParams = false;

export function generateStaticParams() {
  const domains = getGlossaryDomains();
  return LIVE_LOCALE_CODES.flatMap((locale) =>
    domains.map((domain) => ({ locale, domain }))
  );
}

function entriesFor(domain: string) {
  return getAllGlossaryEntries()
    .filter((e) => (e.domains as readonly string[]).includes(domain))
    .sort((a, b) =>
      a.headword.localeCompare(b.headword, "en", { sensitivity: "base" })
    );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; domain: string }>;
}): Promise<Metadata> {
  const { locale, domain } = await params;
  const t = await getTranslations({ locale, namespace: "glossary" });
  const label = t(`domains.${domain}`);
  const count = entriesFor(domain).length;
  return {
    title: t("domainPageTitle", { domain: label }),
    description: t("domainPageDescription", { domain: label, count }),
  };
}

export default async function GlossaryDomainPage({
  params,
}: {
  params: Promise<{ locale: string; domain: string }>;
}) {
  const { locale, domain } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("glossary");
  const tNav = await getTranslations("nav");

  const label = t(`domains.${domain}`);
  const entries = entriesFor(domain);
  const others = getGlossaryDomains().filter((d) => d !== domain);

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />
      <main id="main">
        <section className="section">
          <div className="container">
            <Breadcrumbs
              items={[
                { href: "/glossary", label: t("title") },
                { label },
              ]}
            />
            <h1 className="page-hero-title">
              {t("domainPageTitle", { domain: label })}
            </h1>
            <p className="page-hero-lede">
              {t("domainPageDescription", { domain: label, count: entries.length })}
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <ul className="glossary-domain-list">
              {entries.map((e) => (
                <li key={e.slug} className="glossary-domain-item">
                  <Link href={`/glossary/${e.slug}`} className="glossary-domain-term">
                    {e.headword}
                  </Link>
                  {e.expansion && (
                    <span className="glossary-domain-expansion">{e.expansion}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Every other domain, so this page is a junction rather than a
            cul-de-sac - the thing the A-Z index never gave a reader. */}
        <section className="section">
          <div className="container">
            <h2 className="section-title">{t("otherDomains")}</h2>
            <ul className="glossary-domain-rail">
              {others.map((d) => (
                <li key={d}>
                  <Link href={`/glossary/domain/${d}`} className="glossary-domain-chip">
                    {t(`domains.${d}` as `domains.${GlossaryDomain}`)}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/glossary" className="glossary-domain-chip">
                  {t("allDomains")}
                </Link>
              </li>
            </ul>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
