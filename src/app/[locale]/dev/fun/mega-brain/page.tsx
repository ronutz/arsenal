// ============================================================================
// src/app/[locale]/dev/fun/mega-brain/page.tsx
// ----------------------------------------------------------------------------
// /dev/fun — Mega Brain Console. An easter-egg page, deliberately OUTSIDE the
// /tools framework (no catalogue entry, no golden vectors, no dual-locale
// article requirement — it is a joke, not a deterministic tool).
//
// Localized (PRIME 05/07/2026, "translate the mega-brain tool to English"). It
// used to render pt-BR only and client-redirect every other locale; now it
// renders in ALL 16 locales, resolving the `megaBrain` i18n namespace and
// handing the strings to the client console as props. EN + pt-BR authored
// natively; the other 14 locales fall back to English per key until translated.
// [locale] static params come from the layout, so no generateStaticParams here.
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SuppressLetterShortcuts from "@/components/SuppressLetterShortcuts";
import SiteFooter from "@/components/SiteFooter";
import MegaBrainConsole, { type MegaBrainLabels } from "@/components/dev/fun/MegaBrainConsole";
import PageCapabilities from "@/components/PageCapabilities";

// The Mano Deyvin tribute links his reaction video, the one that started the joke (PRIME 05/11/2026 09:43; checked
// 05/11/2026 09:4x through YouTube's oEmbed: "O FINCH PROMPT MAGICO DO THIAGO FINCH", by mano deyvin).
const MANO_HREF = "https://www.youtube.com/shorts/EiHnBZJ8Xxo";
// The XGH axioms page. Its old address (gohorseprocess.com.br/extreme-go-horse-xgh/) now redirects to the site's
// home page; the axioms live here, axiom 1 reading "Pensou, não é XGH" (read with curl 03/11/2026 09:1x).
const XGH_HREF = "https://gohorse.com.br/extreme-go-horse-xgh.html";
// The social card has its words baked into the image, so there is one per language (PRIME 03/11/2026: "fully
// translate the card and the actual page"): the Portuguese card ("FORÇA TOTAL", ronutz.com/mb) for pt-BR, the
// English one ("FULL POWER", ronutz.com/dev/fun/mega-brain) for English and every language that reads the English
// strings until it is translated.
const OG_IMAGE_PT = "/og-mega-brain.png";
const OG_IMAGE_EN = "/og-mega-brain-en.png";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "megaBrain" });
  const title = t("ogTitle");
  const description = t("ogDesc");
  // The card in the page's language: Portuguese for pt-BR, English otherwise.
  const ogImage = locale === "pt-BR" ? OG_IMAGE_PT : OG_IMAGE_EN;
  const image = { url: ogImage, width: 1200, height: 630, alt: t("ogAlt") };
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "ronutz.com",
      url: `https://ronutz.com/${locale}/dev/fun/mega-brain`,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function MegaBrainPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("megaBrain");

  // Resolve every console string from the catalog into the props bundle.
  const labels: MegaBrainLabels & { bossHint: string; bossDismiss: string } = {
    titlebar: t("titlebar"),
    devFunTitle: t("devFunTitle"),
    close: t("close"),
    closeAria: t("closeAria"),
    homeTitle: t("homeTitle"),
    failsafeEngageAria: t("failsafeEngageAria"),
    failsafeEngageTitle: t("failsafeEngageTitle"),
    failsafeRestoreAria: t("failsafeRestoreAria"),
    failsafeRestoreTitle: t("failsafeRestoreTitle"),
    manoAria: t("manoAria"),
    manoTitle: t("manoTitle"),
    manoDismiss: t("manoDismiss"),
    bossAria: t("bossAria"),
    bossTitle: t("bossTitle"),
    m0: t("m0"),
    m1: t("m1"),
    m25: t("m25"),
    m50: t("m50"),
    m75: t("m75"),
    m100: t("m100"),
    meterLabel: t("meterLabel"),
    meterLabelGoh: t("meterLabelGoh"),
    burnoutReadout: t("burnoutReadout"),
    leverLabel: t("leverLabel"),
    leverAria: t("leverAria"),
    leverHint: t("leverHint"),
    leverHintGoh: t("leverHintGoh"),
    leverTitleGoh: t("leverTitleGoh"),
    fullPower: t("fullPower"),
    turnOff: t("turnOff"),
    stopLabel: t("stopLabel"),
    motionOffAria: t("motionOffAria"),
    motionOnAria: t("motionOnAria"),
    fullscreenEnterAria: t("fullscreenEnterAria"),
    fullscreenExitAria: t("fullscreenExitAria"),
    disabledTitleGoh: t("disabledTitleGoh"),
    manoRealityCheck: t("manoRealityCheck"),
    manoSub: t("manoSub"),
    manoCreditPre: t("manoCreditPre"),
    manoCreditName: t("manoCreditName"),
    manoCreditPost: t("manoCreditPost"),
    totalBanner: t("totalBanner"),
    // totalTerms contains a literal {count} that the MegaBrainConsole component
    // fills client-side via String.replace. Fetch it raw so next-intl does not
    // try to ICU-format it here (which throws FORMATTING_ERROR, the {count}
    // argument being intentionally absent at this layer).
    totalTerms: t.raw("totalTerms"),
    totalFine: t("totalFine"),
    gohLine: t("gohLine"),
    gohSub: t("gohSub"),
    gohFinePre: t("gohFinePre"),
    gohFineLink: t("gohFineLink"),
    gohFinePost: t("gohFinePost"),
    burnoutLine: t("burnoutLine"),
    burnoutSub: t("burnoutSub"),
    godLine: t("godLine"),
    godSub: t("godSub"),
    godOff: t("godOff"),
    bossHint: t("bossHint"),
    bossDismiss: t("bossDismiss"),
  };
  // XGH axiom lore (axiom 1 quoted, the rest original riffs).
  const xgh = t.raw("xgh") as string[];
  const clickPhrases = t.raw("clickPhrases") as string[];

  return (
    <>
      <Header />
      <main id="main">
        {/* This page listens for a typed sequence; single-letter navigation
            shortcuts would make it impossible to complete. */}
        <SuppressLetterShortcuts />
        {/* Slim top: the console is its own framed box, so the section's
            large top padding just stranded it below the header (PRIME). */}
        <section className="section mb-section">
          <div className="container mb-page-container">
            <MegaBrainConsole
              labels={labels}
              xgh={xgh}
              clickPhrases={clickPhrases}
              manoHref={MANO_HREF}
              xghHref={XGH_HREF}
              localeTag={locale}
            />
          </div>
        </section>
      </main>

      {/* T-DOT: register the mega-brain screen's "." context capabilities - a
          legend of its interactive controls. These are descriptive (the controls
          themselves are on screen), so the panel is a discoverability aid: press
          "." to see what the dots and the lever do. */}
      <PageCapabilities
        set={{
          title: t("ctxTitle"),
          capabilities: [
            { id: "lever", kind: "legend", label: t("ctxLever"), detail: t("ctxLeverDetail") },
            { id: "failsafe", kind: "legend", label: t("ctxFailsafe"), detail: t("ctxFailsafeDetail") },
            { id: "mano", kind: "legend", label: t("ctxMano"), detail: t("ctxMano2") },
            { id: "boss", kind: "legend", label: t("ctxBoss"), detail: t("ctxBossDetail") },
          ],
        }}
      />

      <SiteFooter />
    </>
  );
}
