// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/RodVoice.tsx
// ----------------------------------------------------------------------------
// <RodVoice said="YYYY-MM-DD">...</RodVoice> IN AN ARTICLE'S MDX (PRIME
// 2026-11-09 14:57, the psychological-operations series: "Whenever there is
// something with MY (Rod) voice, meaning it will be a personal bias or an
// opinion without facts or evidences to substantiate it, the site content
// guards will explicitly and evidently state so").
//
// A server component: the block is labelled in the page's language as
// Rodolfo Nützmann's view, says it is an opinion and not an established fact,
// and gives the date he stated it. scripts/check-rod-voice.mjs fails the build
// when an article of the series speaks in the first person outside this block,
// or when a block has no valid date.
// ============================================================================

// English dates and lists in British form, through one helper (PRIME 11/11/2026 00:09).
import { intlLocale } from "@/i18n/locales";
import type { ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";

/** One labelled block of PRIME's own opinion, with the day he stated it. */
export default async function RodVoice({ said, children }: { said: string; children: ReactNode }) {
  // The date must be a real calendar day in ISO form; anything else is an authoring error that stops the build.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(said) || Number.isNaN(Date.parse(`${said}T12:00:00Z`))) {
    throw new Error(`<RodVoice said="${said}"> needs the day the view was stated, as YYYY-MM-DD`);
  }
  // The page's language, for the label and the date.
  const locale = await getLocale();
  // The block's words.
  const t = await getTranslations("learnVoice");
  // The day, written the way the page's language writes a date (noon UTC, so no time zone shifts the day).
  const day = new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${said}T12:00:00Z`));
  return (
    <aside className="rod-voice" role="note" aria-label={t("kicker")}>
      {/* Whose view this is, first, so no reader takes it for the article's finding. */}
      <p className="rod-voice-kicker">{t("kicker")}</p>
      {/* What it is not, and when it was said. */}
      <p className="rod-voice-label">{t("label", { date: day })}</p>
      {/* The view itself, as written in the article. */}
      <div className="rod-voice-body">{children}</div>
    </aside>
  );
}
