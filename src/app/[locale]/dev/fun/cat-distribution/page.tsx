// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/app/[locale]/dev/fun/cat-distribution/page.tsx
// ----------------------------------------------------------------------------
// /dev/fun — THE GLOBAL CAT DISTRIBUTION SYSTEM. A tracking console for the
// internet's most reliable logistics network: stray cats assigning themselves
// to humans. The applicant enters a name (and, optionally, a city); the
// System deterministically assigns a unit — same name, same cat, forever —
// and renders the delivery manifest plus the six-step status timeline.
//
// Like Meeting Bingo, this is deliberately OUTSIDE the /tools framework (no
// catalogue entry): a toy. And like Meeting Bingo, the page renders in EVERY
// locale: labels and trait tables are authored natively in en + pt-BR
// ("Sistema Global de Distribuição de Gatos"), with the deep-merge serving
// English to the other locales until they are translated.
//
// The component (src/components/dev/fun/CatDistribution.tsx) is
// locale-agnostic; this server page resolves everything from the
// `catDistribution` i18n namespace and passes it down, t.raw() for the trait
// arrays (they are data, not ICU messages).
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import { Link } from "@/i18n/navigation";
import CatDistribution, { type CatDistributionData } from "@/components/dev/fun/CatDistribution";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "catDistribution" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function CatDistributionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("catDistribution");

  // Assemble the localized dataset. t.raw() returns the trait arrays as-is.
  const data: CatDistributionData = {
    labels: {
      nameLabel: t("nameLabel"),
      cityLabel: t("cityLabel"),
      example: t("example"),
      clear: t("clear"),
      track: t("track"),
      emptyHint: t("emptyHint"),
      manifestTitle: t("manifestTitle"),
      unitField: t("unitField"),
      coatField: t("coatField"),
      ageField: t("ageField"),
      tempField: t("tempField"),
      nameField: t("nameField"),
      vectorField: t("vectorField"),
      etaField: t("etaField"),
      etaDays: t.raw("etaDays"),
      confidence: t("confidence"),
      confidenceValue: t("confidenceValue"),
      timelineTitle: t("timelineTitle"),
      doneMark: t("doneMark"),
      pendingMark: t("pendingMark"),
      stamp: t("stamp"),
      stampSub: t("stampSub"),
      exampleName: t("exampleName"),
      exampleCity: t("exampleCity"),
      fullscreenEnterAria: t("fullscreenEnterAria"),
      fullscreenExitAria: t("fullscreenExitAria"),
    },
    coats: t.raw("coats") as string[],
    ages: t.raw("ages") as string[],
    temperaments: t.raw("temperaments") as string[],
    catNames: t.raw("catNames") as string[],
    vectors: t.raw("vectors") as string[],
    steps: t.raw("steps") as string[],
  };

  return (
    <>
      <Header />
      <main id="main">
        <section className="section">
          <div className="container bingo-page-container">
            <div className="bingo-head">
              <p className="bingo-devfun mono">
                <Link href="/dev/fun" className="bingo-devfun-link" title={t("devFunTitle")}>/dev/fun</Link>
              </p>
              <h1 className="bingo-title">{t("title")}</h1>
              <p className="bingo-tagline">{t("tagline")}</p>
              <p className="bingo-intro">{t("intro")}</p>
            </div>

            <CatDistribution data={data} />

            {/* Provenance: the meme deserves its citation too. */}
            <p className="bingo-credit">{t("creditNote")}</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
