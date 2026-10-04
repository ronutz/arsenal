// ============================================================================
// src/app/[locale]/about/earlier-sites/page.tsx
// ----------------------------------------------------------------------------
// THE EARLIER SITES (PRIME, 2026-10-03). What the Internet Archive kept of
// nutzmann.net (first capture 25 August 2004) and ntz.com.br (NTZ Tecnologia
// from 2013; a different owner before that): for each era, what the site was,
// how it was built, what it offered and what it contained, then what carried
// through to this site, then the full inventory with a link to every capture.
//
// Facts come from the captures catalogued the same day (94 pages saved, printed
// and read; canon BUILD-earlier-sites-captured-and-published-20261003), not
// from memory. The narrative lives in the "earlierSites" message namespace
// (en and pt-BR authored; the other locales fall back to English per key); the
// inventory is data in src/content/about/earlier-sites.ts, generated from the
// capture logs so a timestamp here is one the archive actually served.
//
// Why a page of its own and not a paragraph: PRIME asked for the nature, date
// and age, characteristics, offerings and contents of each site, which is a
// catalogue, and a catalogue wants tables and links. The 1996-2020 era page
// carries a one-paragraph section pointing here; the about page carries a card.
//
// Title only in generateMetadata, with a description: ogImages() would name a
// card under public/og/page/ that gen-og does not generate for this slug, and
// check-og fails on a manifest entry with nothing behind it (the same reason
// the era pages keep the default social card).
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import {
  ARCHIVED_ERAS,
  ARCHIVED_PAGE_COUNT,
  ARCHIVE_READ_DATE,
  FIRST_CAPTURE_YEAR,
  captureDate,
  waybackUrl,
} from "@/content/about/earlier-sites";

/** The four labelled paragraphs every era carries, in display order. */
const ERA_FIELDS = ["nature", "characteristics", "offerings", "contents"] as const;

/** The "what carried through" items, in display order (message keys under earlierSites.carried). */
const CARRIED = ["tools", "independence", "teaching", "vendors", "company"] as const;

/** Page title and description from the authored copy (see the header on why no social card). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "earlierSites" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function EarlierSitesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("earlierSites");
  const tNav = await getTranslations("nav");

  // The sites' age is derived at build time from the first capture year, so the
  // sentence stays true without anyone editing a number (the site rebuilds often).
  const yearsSince = new Date().getFullYear() - FIRST_CAPTURE_YEAR;

  return (
    <>
      <a href="#main" className="skip-link" data-pagefind-ignore>
        {tNav("skipToContent")}
      </a>
      <Header />
      <main id="main">
        <article>
          {/* Hero: back link, eyebrow, title, lede with the page count and read date. */}
          <section className="era-hero">
            <div className="container era-container">
              <Link href="/about" className="article-back">
                &#8592; {t("backToAbout")}
              </Link>
              <p className="era-years mono">{t("eyebrow")}</p>
              <h1 className="era-title">{t("title")}</h1>
              <p className="era-subtitle">
                {t("lede", { pages: ARCHIVED_PAGE_COUNT, date: ARCHIVE_READ_DATE })}
              </p>
            </div>
          </section>

          {/* Age line and provenance: how the record was made and why it can be checked. */}
          <section className="section">
            <div className="container era-container">
              <p className="era-intro">{t("ageLine", { years: yearsSince })}</p>
              <div className="es-provenance vendor-note">
                <h2 className="es-h2">{t("provenanceTitle")}</h2>
                <p>{t("provenanceBody", { date: ARCHIVE_READ_DATE })}</p>
              </div>
            </div>
          </section>

          {/* One block per era: title and years, four labelled paragraphs, then the inventory. */}
          <section className="section era-body-section">
            <div className="container era-container">
              <div className="es-eras">
                {ARCHIVED_ERAS.map((era, i) => (
                  <section className="es-era" key={era.id} id={era.id}>
                    <span className="era-section-num mono">{String(i + 1).padStart(2, "0")}</span>
                    <div className="es-era-content">
                      <p className="es-era-years mono">
                        {era.domain} · {t(`eras.${era.id}.years`)}
                      </p>
                      <h2 className="era-section-title">{t(`eras.${era.id}.title`)}</h2>
                      <dl className="es-fields">
                        {ERA_FIELDS.map((f) => (
                          <div className="es-field" key={f}>
                            <dt className="es-field-label">{t(`labels.${f}`)}</dt>
                            <dd className="es-field-body">{t(`eras.${era.id}.${f}`)}</dd>
                          </div>
                        ))}
                      </dl>
                      {/* The inventory is collapsed by default: the paragraphs are the reading,
                          the table is the evidence, and a reader opens it when they want to check. */}
                      <details className="es-inventory">
                        <summary className="es-inventory-summary">
                          <span className="es-inventory-title">{t("inventoryTitle")}</span>
                          <span className="es-inventory-count">
                            {t("inventorySummary", { count: era.pages.length, from: era.from, to: era.to })}
                          </span>
                        </summary>
                        <div className="es-table-wrap">
                          <table className="es-table">
                            <thead>
                              <tr>
                                <th scope="col">{t("colFile")}</th>
                                <th scope="col">{t("colTitle")}</th>
                                <th scope="col">{t("colCaptured")}</th>
                                <th scope="col">{t("colLink")}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {era.pages.map((p) => (
                                <tr key={p.file}>
                                  <td className="mono es-cell-file">{p.file}</td>
                                  <td className="es-cell-title">{p.title || t("untitled")}</td>
                                  <td className="mono es-cell-date">{captureDate(p)}</td>
                                  <td className="es-cell-link">
                                    <a href={waybackUrl(p)} rel="noopener noreferrer" target="_blank">
                                      {t("open")}
                                    </a>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </details>
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </section>

          {/* What carried through: five threads from the old sites to this one, with the live links. */}
          <section className="section">
            <div className="container era-container">
              <h2 className="section-title">{t("carriedTitle")}</h2>
              <ul className="es-carried">
                {CARRIED.map((k) => (
                  <li className="es-carried-item" key={k}>
                    {t(`carried.${k}`)}
                  </li>
                ))}
              </ul>
              <p className="es-links-title">{t("linksTitle")}</p>
              <ul className="es-links">
                <li><Link href="/tools/cidr">{t("linkCidr")}</Link></li>
                <li><Link href="/learn/structured-cabling">{t("linkCabling")}</Link></li>
                <li><Link href="/roadmap">{t("linkRoadmap")}</Link></li>
                <li><Link href="/advisory">{t("linkAdvisory")}</Link></li>
                <li><Link href="/training">{t("linkTraining")}</Link></li>
                <li><Link href="/about/1996-2020">{t("linkEra")}</Link></li>
              </ul>
            </div>
          </section>

          {/* Sources: the archive, the read date, and why the index rather than the availability endpoint. */}
          <section className="section era-closer-section">
            <div className="container era-container">
              <h2 className="es-h2">{t("sourcesTitle")}</h2>
              <p className="es-sources">{t("sourcesBody", { date: ARCHIVE_READ_DATE })}</p>
            </div>
          </section>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
