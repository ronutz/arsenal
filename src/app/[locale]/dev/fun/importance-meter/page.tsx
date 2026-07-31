// ============================================================================
// src/app/[locale]/dev/fun/importance-meter/page.tsx
// ----------------------------------------------------------------------------
// /dev/fun - THE IMPORTANCE METER. *** UNLISTED, at PRIME's instruction. ***
//
// Nothing links here. It is deliberately absent from the /dev/fun index, from
// the tools registry, from the catalogue and from every reading path. It DOES
// appear in sitemap.xml and llms.txt - also PRIME's call - so it is findable by
// a machine reading the index and by a person who already knows the address,
// and by nobody browsing the site.
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
 * This is the ONLY page on the site that opts out of the locale set, and it
 * does so because the content genuinely cannot be localised, not because
 * translating it was inconvenient.
 */
export function generateStaticParams() {
  return [{ locale: "en" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "importanceMeter" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
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
