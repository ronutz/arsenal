// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/Lab.tsx
// ----------------------------------------------------------------------------
// <Lab id="..." /> IN AN ARTICLE'S MDX (2026-10-26). A server component: it
// renders the lab's heading and lede in the page's language (so they are in the
// exported HTML and in the outline of the article), then the interactive body
// inside a nested message provider that carries exactly the two namespaces the
// lab reads: "learnLabs.shell" (the frame's words) and "learnLabs.<id>" (the
// lab's). The section's id, lab-<id>, is the anchor the "Interactive" marker in
// the article header links to.
//
// An id that is not in the registry fails the build here, with the article's
// author's mistake named, rather than shipping an empty box.
// ============================================================================

import { getTranslations } from "next-intl/server";
import MessageSlice from "@/components/MessageSlice";
import LabLoader from "@/components/learn/labs/LabLoader";
import { findLab } from "@/content/learn/labs";

export default async function Lab({ id }: { id: string }) {
  // An unregistered id is an authoring error: stop the build and say which.
  if (!findLab(id)) throw new Error(`<Lab id="${id}" /> names no lab in src/content/learn/labs.ts`);
  // The frame's words and the lab's words, server side, for the heading.
  const tShell = await getTranslations("learnLabs.shell");
  // Every lab's words; this lab's are read below by key, under its id.
  const t = await getTranslations("learnLabs");
  return (
    <section className="lab" id={`lab-${id}`} aria-labelledby={`lab-${id}-title`}>
      {/* The kicker says what kind of block this is; the title says what the lab does. */}
      <p className="lab-kicker mono">{tShell("kicker")}</p>
      <h3 className="lab-title" id={`lab-${id}-title`}>
        {t(`${id}.title`)}
      </h3>
      <p className="lab-lede">{t(`${id}.lede`)}</p>
      {/* The interactive body, with exactly its two namespaces. */}
      <MessageSlice namespaces={["learnLabs.shell", `learnLabs.${id}`]}>
        <LabLoader id={id} />
      </MessageSlice>
    </section>
  );
}
