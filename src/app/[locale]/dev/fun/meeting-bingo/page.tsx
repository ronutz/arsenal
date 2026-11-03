// ============================================================================
// src/app/[locale]/dev/fun/meeting-bingo/page.tsx
// ----------------------------------------------------------------------------
// /dev/fun — MEETING BINGO. Buzzword bingo with a meeting-type selector: pick
// the kind of meeting and the card size, get a card of the cliches that
// meeting is guaranteed to produce. Like the Mega Brain, this is deliberately
// OUTSIDE the /tools framework (no catalogue entry, no golden vectors) — a
// toy, not a deterministic tool.
//
// Like every toy on the shelf, this page renders in EVERY locale: content is
// authored in the i18n catalogs, with natively-written phrase pools in en,
// pt-BR, de, es, fr, it and nl (the pt-BR card is real corporativês, not a
// translation; fr, it and nl carry their own labels as well), and the
// request-config's deep-merge serves English per key to whatever a locale has
// not translated (the standard "translate later" path). The server assembles the localized dataset here and hands it to the
// client component as props. The card a player is on is kept in their browser
// (MeetingBingo.tsx, review R4-07).
//
// The bare shortcut ronutz.com/bingo 302s to the EN page — see
// VANITY_REDIRECTS in worker/index.ts.
//
// History, verified: buzzword bingo was invented at Silicon Graphics in early
// 1993 by Tom Davis (with Seth Katz; Chris Pirazzi's web version spread it)
// and popularised by the 1994-02-22 Dilbert strip. Credited in the footer of
// the page, linked to Wikipedia for the curious.
//
// THE SOCIAL CARD (PRIME 03/11/2026, "Yes on all your suggested ideas"): like
// the Mega Brain's, its words are baked into the image, so there is one per
// language: the Portuguese card for pt-BR, the English one for English and for
// every language that reads the English strings until it is translated. The
// share line's words (the template and its plural for each count of marks)
// are resolved here and handed to the card as props.
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import { Link } from "@/i18n/navigation";
import MeetingBingo, { type BingoType } from "@/components/dev/fun/MeetingBingo";

// The 13 meeting types, in display order. Ids are stable keys into the i18n
// catalogs (meetingBingo.types.<id>); names and pools are locale content.
const TYPE_IDS = [
  "videocall",
  "standup",
  "allhands",
  "sales",
  "vendorpitch",
  "warroom",
  "strategy",
  "kickoff",
  "budget",
  // The 2026-07-18 profession pack (PRIME): four fields whose meetings have
  // their own liturgy. Pools authored natively in each language that has
  // meeting pools; the other locales fall back to the English pool via the
  // i18n deep-merge.
  "legal",
  "infra",
  "hr",
  "marketing",
] as const;

// The largest card, 5x5 with a FREE center, needs 24 phrases (4x4 needs 16,
// 3x3 needs 8); pools carry ~30 so cards vary. If an authored (or future translated) pool ever drops below 24, the
// static build fails HERE, loudly, instead of shipping a broken card.
const MIN_POOL = 24;

// The social cards (see the file header): Portuguese for pt-BR, English otherwise. 1200 x 630 PNG in public/.
const OG_IMAGE_PT = "/og-meeting-bingo-pt-br.png";
const OG_IMAGE_EN = "/og-meeting-bingo-en.png";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meetingBingo" });
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
      url: `https://ronutz.com/${locale}/dev/fun/meeting-bingo`,
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

export default async function MeetingBingoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("meetingBingo");
  // The /dev/fun shelf's common words: the Copy button's "Copied" and "Copy failed" are the games' own.
  const tCommon = await getTranslations("devFun.games.common");

  // Assemble the localized dataset from the catalogs. t.raw() returns the
  // phrase arrays as-is (they are data, not ICU messages).
  const types: BingoType[] = TYPE_IDS.map((id) => {
    const phrases = t.raw(`types.${id}.phrases`) as string[];
    if (!Array.isArray(phrases) || phrases.length < MIN_POOL) {
      throw new Error(
        `[meeting-bingo] locale "${locale}", type "${id}": pool has ${
          Array.isArray(phrases) ? phrases.length : 0
        } phrases; a 5x5 card needs at least ${MIN_POOL}.`,
      );
    }
    return { id, name: t(`types.${id}.name`), phrases };
  });

  const labels = {
    typeLabel: t("typeLabel"),
    newCard: t("newCard"),
    // The armed New card button's two wordings (review R4-07).
    newCardConfirm: t("newCardConfirm"),
    changeConfirm: t("changeConfirm"),
    free: t("free"),
    sizeLabel: t("sizeLabel"),
    bingo: t("bingo"),
    bingoSub: t("bingoSub"),
    shuffling: t("shuffling"),
    fullscreenEnterAria: t("fullscreenEnterAria"),
    fullscreenExitAria: t("fullscreenExitAria"),
    // The share line's template, raw: its {type}, {squares} and {size} are filled in the browser.
    shareLine: t.raw("shareLine") as string,
    // "0 squares" to "25 squares", with this language's plural rules (a 5x5 card has at most 24 marks to make).
    shareSquares: Array.from({ length: 26 }, (_, n) => t("shareSquares", { n })),
    // The Copy button: "Copy", then the games' "Copied" and "Copy failed".
    share: { copy: tCommon("copy"), copied: tCommon("copied"), copyFailed: tCommon("copyFailed") },
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

            {/* The locale writes the page's own address into the share line. */}
            <MeetingBingo labels={labels} types={types} locale={locale} />

            {/* Provenance, as tradition deserves (see file header). */}
            <p className="bingo-credit">
              <a
                className="bingo-credit-link"
                href="https://en.wikipedia.org/wiki/Buzzword_bingo"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("creditLinkLabel")}
              </a>
              {t("creditRest")}
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
