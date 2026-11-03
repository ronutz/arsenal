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
// arrays (they are data, not ICU messages), and the ETA already formatted for
// each possible number of days, so its plural is right in every language.
//
// THE SHARE LINE AND THE SOCIAL CARD (PRIME 03/11/2026, "Yes on all your
// suggested ideas"): the share block's words come from here too (its line is
// a raw template the component fills; the warning about values after the "#"
// is the site's own share.stateNote). The social card has its words baked into
// the image, so there is one per language, as on the Mega Brain page: the
// Portuguese card for pt-BR, the English one for every other language.
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import { Link } from "@/i18n/navigation";
import CatDistribution, { type CatDistributionData } from "@/components/dev/fun/CatDistribution";

// The social cards (see the file header): Portuguese for pt-BR, English otherwise. 1200 x 630 PNG in public/.
const OG_IMAGE_PT = "/og-cat-distribution-pt-br.png";
const OG_IMAGE_EN = "/og-cat-distribution-en.png";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "catDistribution" });
  // The page's title and description, used by the social card's preview as well.
  const title = t("metaTitle");
  const description = t("metaDescription");
  // The card in the page's language: Portuguese for pt-BR, English otherwise.
  const ogImage = locale === "pt-BR" ? OG_IMAGE_PT : OG_IMAGE_EN;
  // Its size and its description for a reader who cannot see it.
  const image = { url: ogImage, width: 1200, height: 630, alt: t("ogAlt") };
  return {
    title,
    description,
    // The preview a link to this page unfolds into, as on the Mega Brain page.
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "ronutz.com",
      url: `https://ronutz.com/${locale}/dev/fun/cat-distribution`,
      images: [image],
    },
    // The same card for X and the readers of its card tags.
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
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
  // The /dev/fun shelf's common words: the Copy button's "Copied" and "Copy failed" are the games' own.
  const tCommon = await getTranslations("devFun.games.common");
  // The site's share words: its standard warning about values after the "#".
  const tShare = await getTranslations("share");

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
      // One wording per possible ETA, 1 to 14 days (the component's range), with the language's plural rules applied
      // here, so "1 day" and "2 days" come out right (review R4-03).
      etaDays: Array.from({ length: 14 }, (_, i) => t("etaDays", { n: i + 1 })),
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
      // The share block: the card's first line is the System's name.
      systemName: t("title"),
      // Its heading.
      shareTitle: t("shareTitle"),
      // The assignment line, raw: {name}, {cat}, {unit} and {eta} are filled in the browser.
      shareLine: t.raw("shareLine") as string,
      // What the link carries, without and with a city.
      shareCarriesName: t("shareCarriesName"),
      shareCarriesNameCity: t("shareCarriesNameCity"),
      // The site's standard warning, as the tools' Share results button shows it.
      stateNote: tShare("stateNote"),
      // The Copy button: "Copy", then the games' "Copied" and "Copy failed".
      share: { copy: tCommon("copy"), copied: tCommon("copied"), copyFailed: tCommon("copyFailed") },
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
              <h1 className="article-title">{t("title")}</h1>
              <p className="bingo-tagline">{t("tagline")}</p>
              <p className="bingo-intro">{t("intro")}</p>
            </div>

            {/* The locale writes the page's own address into the share link. */}
            <CatDistribution data={data} locale={locale} />

            {/* Provenance: the meme deserves its citation too. */}
            <p className="bingo-credit">{t("creditNote")}</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
