// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/MethodNote.tsx
// ----------------------------------------------------------------------------
// <MethodNote /> IN AN ARTICLE'S MDX: the standing note every part of the
// psychological-operations series carries (PRIME 2026-11-09 14:57: the site
// "never claims right or wrong, it only analyzes and reports on the information
// created and published elsewhere", "all things may change and what is unknown
// is unknown"). One text, from the "learnMethod" messages, so every part says
// it in the same words; scripts/check-rod-voice.mjs requires it in each part.
// ============================================================================

import { getTranslations } from "next-intl/server";

/** The series' statement of method. */
export default async function MethodNote() {
  // The note's words.
  const t = await getTranslations("learnMethod");
  return (
    <aside className="method-note" role="note" aria-label={t("title")}>
      {/* The heading names what the note is. */}
      <p className="method-note-title">{t("title")}</p>
      {/* The method, in one paragraph. */}
      <p className="method-note-body">{t("body")}</p>
    </aside>
  );
}
