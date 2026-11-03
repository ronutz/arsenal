// ============================================================================
// src/app/[locale]/dev/fun/importance-meter/page.tsx
// ----------------------------------------------------------------------------
// /dev/fun - THE IMPORTANCE METER.
//
// Built unlisted at PRIME's instruction (2026-07-30), it has since earned a
// modest card, last on the /dev/fun shelf, whose copy does not say what it
// measures, so it still rewards the person who opens it. It stays out of the
// tools registry, the catalogue and every reading path, and it appears in
// sitemap.xml and llms.txt (also PRIME's call). The shelf's card links this
// English page from every language and, outside English, carries an "EN" badge
// (review R4-10, 03/11/2026).
//
// Like its neighbours here it sits OUTSIDE the /tools framework: no catalogue
// row, no golden vectors, no Example/Clear affordance. D-83 does not apply to a
// toy whose output is a constant, the same exemption the /dev/other residents
// carry.
//
// On the joke: it is built sincerely on purpose. The weights are real, the
// subtotal genuinely moves, the workings are shown line by line, and then the
// subtotal is multiplied by one coefficient. The coefficient is zero. The site
// promises tools that compute rather than guess, and this one keeps that
// promise exactly - it is simply computing something whose answer was never
// going to vary.
//
// THE SHARE LINE AND THE SOCIAL CARD (PRIME 03/11/2026, "Yes on all your
// suggested ideas"): the share line's templates are resolved here, raw, and
// filled by the meter; its words stay English, like the page. The social card
// is English too, and it is the only one: every other language redirects here.
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import { Link } from "@/i18n/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import SuppressLetterShortcuts from "@/components/SuppressLetterShortcuts";
import ImportanceMeter from "@/components/dev/fun/ImportanceMeter";

/**
 * ENGLISH ONLY (PRIME 2026-07-31).
 *
 * The joke is an English idiom and does not survive translation: the pt-BR
 * version read as a literal description of a rude phrase rather than as a
 * deadpan corporate instrument, which is the opposite of funny. So this page
 * generates for `en` alone, and the other locales redirect here rather than
 * 404 - see public/_redirects.
 *
 * It is one of the very few pages on the site that opt out of the locale
 * set, and it does so because the content genuinely cannot be localised, not
 * because translating it was inconvenient.
 */
export function generateStaticParams() {
  return [{ locale: "en" }];
}

// The social card (see the file header): English, the page's one language. 1200 x 630 PNG in public/.
const OG_IMAGE = "/og-importance-meter-en.png";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "importanceMeter" });
  // The page's title and description, used by the social card's preview as well.
  const title = t("metaTitle");
  const description = t("metaDescription");
  // The card's size and its description for a reader who cannot see it.
  const image = { url: OG_IMAGE, width: 1200, height: 630, alt: t("ogAlt") };
  return {
    title,
    description,
    // The preview a link to this page unfolds into, as on the Mega Brain page.
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "ronutz.com",
      url: `https://ronutz.com/${locale}/dev/fun/importance-meter`,
      images: [image],
    },
    // The same card for X and the readers of its card tags.
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}

export default async function ImportanceMeterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("importanceMeter");
  const tNav = await getTranslations("nav");
  // The /dev/fun shelf's common words: the Copy button's "Copied" and "Copy failed" are the games' own.
  const tCommon = await getTranslations("devFun.games.common");

  const labels = {
    subjectLabel: t("subjectLabel"),
    subjectPlaceholder: t("subjectPlaceholder"),
    urgentLabel: t("urgentLabel"),
    ccLabel: t("ccLabel"),
    escalationLabel: t("escalationLabel"),
    escalationOptions: t.raw("escalationOptions") as string[],
    deadlineLabel: t("deadlineLabel"),
    raisedLabel: t("raisedLabel"),
    movedLabel: t("movedLabel"),
    yes: t("yes"),
    no: t("no"),
    measureButton: t("measureButton"),
    resetButton: t("resetButton"),
    workingsHeading: t("workingsHeading"),
    subtotalLabel: t("subtotalLabel"),
    coefficientLabel: t("coefficientLabel"),
    coefficientNote: t("coefficientNote"),
    resultHeading: t("resultHeading"),
    unitLabel: t("unitLabel"),
    remarks: {
      trivial: t("remarks.trivial"),
      ordinary: t("remarks.ordinary"),
      elevated: t("remarks.elevated"),
      considerable: t("remarks.considerable"),
      spectacular: t("remarks.spectacular"),
    },
    methodHeading: t("methodHeading"),
    methodBody: t("methodBody"),
    gaugeAria: t("gaugeAria"),
    overrideBanner: t("overrideBanner"),
    overrideConsequenceLabel: t("overrideConsequenceLabel"),
    overrideRevert: t("overrideRevert"),
    overrideHint: t("overrideHint"),
    fullscreenEnter: t("fullscreenEnter"),
    fullscreenExit: t("fullscreenExit"),
    disclaimerHeading: t("disclaimerHeading"),
    disclaimerBody: t("disclaimerBody"),
    disclaimerSourcesHeading: t("disclaimerSourcesHeading"),
    // The share card's first line is the meter's name.
    meterName: t("title"),
    // The share lines, raw: the meter fills {urgency}, {remark}, {result} and {override}.
    shareUrgency: t.raw("shareUrgency") as string,
    shareResult: t.raw("shareResult") as string,
    shareOverride: t.raw("shareOverride") as string,
    // The Copy button: "Copy", then the games' "Copied" and "Copy failed".
    share: { copy: tCommon("copy"), copied: tCommon("copied"), copyFailed: tCommon("copyFailed") },
  };

  return (
    <>
      <Header />
      <main id="main">
        {/* This page listens for a typed sequence; single-letter navigation
            shortcuts would make it impossible to complete. */}
        <SuppressLetterShortcuts />
        <section className="section">
          <div className="container bingo-page-container">
            <Breadcrumbs
              items={[
                { label: tNav("home"), href: "/" },
                { label: "/dev/fun", href: "/dev/fun" },
                { label: t("title") },
              ]}
            />
            <div className="bingo-head">
              <p className="bingo-devfun mono">
                <Link href="/dev/fun" className="bingo-devfun-link">
                  /dev/fun
                </Link>
              </p>
              <h1 className="article-title">{t("title")}</h1>
              <p className="bingo-tagline">{t("tagline")}</p>
              <p className="bingo-intro">{t("intro")}</p>
            </div>

            <ImportanceMeter labels={labels} />

          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
