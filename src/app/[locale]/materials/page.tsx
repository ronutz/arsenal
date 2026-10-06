// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/app/[locale]/materials/page.tsx
// ----------------------------------------------------------------------------
// THE OPEN MATERIALS INDEX (milestone (m1), 2026-10-06; PRIME 13:36: "I want to
// occasionally share content and material on the site ... We should probably
// have a dedicated section and/or page for the content we'll be sharing").
//
// One card per material from the registry (src/content/materials/materials.ts),
// each with its title, subtitle, the facts a reader decides on (slides, speaker
// notes, languages, licence) and the door to its datasheet. A short index by
// design: the datasheet is where a material is presented in full.
//
// Statically generated for every locale; the copy is authored in en and pt-BR
// and falls back to English elsewhere, like every namespace on the site.
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import Breadcrumbs from "@/components/Breadcrumbs";
import { ogImages } from "@/lib/og";
import { MATERIALS } from "@/content/materials/materials";

/** One index page per locale. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** Title, description and the index's own social card. */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "materials" });
  return {
    title: t("index.metaTitle"),
    description: t("index.metaDescription"),
    ...ogImages("page", "materials", locale, t("index.title")),
  };
}

export default async function MaterialsIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("materials");
  const tNav = await getTranslations("nav");

  // The cards, from the registry: every figure on a card is the registry's (the slide count, the languages of the
  // files), so a material added or replaced updates its card without an edit here.
  const cards = MATERIALS.map((m) => ({
    slug: m.slug,
    title: t(`items.${m.slug}.title`),
    subtitle: t(`items.${m.slug}.subtitle`),
    slides: m.slides,
    languages: [...new Set(m.files.map((f) => f.lang))].map((l) => t(`labels.${l}`)),
    // The SPDX identifier written the way people read it ("CC0-1.0" -> "CC0 1.0").
    license: m.license.replace("-", " "),
  }));

  return (
    <>
      <a href="#main" className="skip-link" data-pagefind-ignore>
        {tNav("skipToContent")}
      </a>
      <Header />
      <main id="main">
        <section className="section">
          <div className="container materials-container">
            <Breadcrumbs ariaLabel={tNav("breadcrumb")} items={[{ label: tNav("home"), href: "/" }, { label: t("index.title") }]} />
            <p className="materials-eyebrow mono">{t("index.eyebrow")}</p>
            <h1 className="page-hero-title">{t("index.title")}</h1>
            <p className="page-hero-lede">{t("index.lede")}</p>
            <ul className="materials-cards">
              {cards.map((c) => (
                <li key={c.slug} className="materials-card">
                  <h2 className="materials-card-title">
                    <Link href={`/materials/${c.slug}`}>{c.title}</Link>
                  </h2>
                  <p className="materials-card-subtitle">{c.subtitle}</p>
                  <p className="materials-card-facts mono">
                    <span>{t("index.slidesBadge", { count: c.slides })}</span>
                    <span>{c.languages.join(" · ")}</span>
                    <span>{c.license}</span>
                  </p>
                  <p className="materials-card-cta">{t("index.cardCta")} &rarr;</p>
                </li>
              ))}
            </ul>
            {/* Taught live (PRIME, 15:59): every material is also a class he teaches; the form opens on the custom
                program topic. With one material the link names it; with several it opens the form without a course. */}
            <div className="materials-live">
              <h2 className="materials-live-title">{t("index.liveTitle")}</h2>
              <p className="materials-live-body">{t("index.liveBody")}</p>
              <p className="materials-live-cta">
                <Link
                  href={cards.length === 1 ? `/contact?intent=course&course=${encodeURIComponent(cards[0].title)}#contact-form` : "/contact?intent=course#contact-form"}
                  className="btn btn-primary"
                >
                  {t("labels.liveCta")} &rarr;
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
