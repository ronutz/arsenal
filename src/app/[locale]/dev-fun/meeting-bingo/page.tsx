// ============================================================================
// src/app/[locale]/dev-fun/meeting-bingo/page.tsx
// ----------------------------------------------------------------------------
// /dev/fun — MEETING BINGO. Buzzword bingo with a meeting-type selector: pick
// the kind of meeting, get a card of the cliches that meeting is guaranteed
// to produce. Like the Mega Brain, this is deliberately OUTSIDE the /tools
// framework (no catalogue entry, no golden vectors) — a toy, not a
// deterministic tool.
//
// UNLIKE the Mega Brain (pt-BR only), this page renders in EVERY locale:
// content is authored in the i18n catalogs for en + pt-BR (each with its OWN
// natively-written phrase pools — the pt-BR card is real corporativês, not a
// translation), and the request-config's deep-merge serves English to the
// other locales until their packs are translated (the standard "translate
// later" path). The server assembles the localized dataset here and hands it
// to the client component as props.
//
// The bare shortcut ronutz.com/bingo 302s to the EN page — see
// VANITY_REDIRECTS in worker/index.ts.
//
// History, verified: buzzword bingo was invented at Silicon Graphics in early
// 1993 by Tom Davis (with Seth Katz; Chris Pirazzi's web version spread it)
// and popularized by the 1994-02-22 Dilbert strip. Credited in the footer of
// the page, linked to Wikipedia for the curious.
// ============================================================================

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import { Link } from "@/i18n/navigation";
import MeetingBingo, { type BingoType } from "@/components/dev-fun/MeetingBingo";

// The 9 meeting types, in display order. Ids are stable keys into the i18n
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
] as const;

// A 5x5 card with a FREE center needs 24 phrases; pools carry ~30 so cards
// vary. If an authored (or future translated) pool ever drops below 24, the
// static build fails HERE, loudly, instead of shipping a broken card.
const MIN_POOL = 24;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meetingBingo" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
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
    free: t("free"),
    bingo: t("bingo"),
    bingoSub: t("bingoSub"),
    shuffling: t("shuffling"),
  };

  return (
    <>
      <Header />
      <main id="main">
        <section className="section">
          <div className="container bingo-page-container">
            <div className="bingo-head">
              <p className="bingo-devfun mono">
                <Link href="/dev-fun" className="bingo-devfun-link" title={t("devFunTitle")}>/dev/fun</Link>
              </p>
              <h1 className="bingo-title">{t("title")}</h1>
              <p className="bingo-tagline">{t("tagline")}</p>
              <p className="bingo-intro">{t("intro")}</p>
            </div>

            <MeetingBingo labels={labels} types={types} />

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
