// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/ReaderQuestions.tsx
// ----------------------------------------------------------------------------
// <ReaderQuestions>...</ReaderQuestions> IN AN ARTICLE'S MDX (PRIME 12/11/2026
// 15:18): where an article leaves something open, it hands the reader
// questions to think about, never a personal view. This replaces the earlier
// labelled-opinion block, which is gone from the site; scripts/check-rod-voice.mjs
// fails the build if an opinion block or a "Rodolfo Nützmann's view" label
// comes back.
//
// A server component: a titled box, in the page's language, around the
// article's own list of questions.
// ============================================================================

import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

/** A box of open questions the article leaves to its reader. */
export default async function ReaderQuestions({ children }: { children: ReactNode }) {
  // The box's title, in the page's language.
  const t = await getTranslations("learnQuestions");
  return (
    <aside className="reader-questions" role="note" aria-label={t("title")}>
      {/* What the box holds, said first. */}
      <p className="reader-questions-title">{t("title")}</p>
      {/* The questions, as written in the article. */}
      <div className="reader-questions-body">{children}</div>
    </aside>
  );
}
