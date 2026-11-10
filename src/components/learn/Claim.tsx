// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/Claim.tsx
// ----------------------------------------------------------------------------
// <Claim status="alleged" by="...">text</Claim> IN AN ARTICLE'S MDX (PRIME
// 2026-11-09 14:57: the series documents "roots, facts, events, theories,
// allegations, rebuttals, evidences, without ever taking a side"). The text
// stays as written; a small label after it says what kind of claim it is, so
// an allegation never reads as a finding:
//   established  a court finding, an official record, a replicated result
//   attributed   attributed by a government, regulator or platform
//   reported     reported by the press or researchers, not adjudicated
//   alleged      asserted by one party, not established
//   disputed     contested on the evidence by credible sources
//   denied       denied by the party it concerns (name it in "by")
// An unknown status stops the build, with the article's mistake named.
// ============================================================================

import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

/** The statuses a claim may carry, in the order of the method note. */
export const CLAIM_STATUSES = ["established", "attributed", "reported", "alleged", "disputed", "denied"] as const;
/** One of them. */
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

/** A claim with its evidence status, and optionally who attributes, alleges or denies it. */
export default async function Claim({ status, by, children }: { status: string; by?: string; children: ReactNode }) {
  // A status outside the list is an authoring error.
  if (!(CLAIM_STATUSES as readonly string[]).includes(status)) {
    throw new Error(`<Claim status="${status}"> must be one of ${CLAIM_STATUSES.join(", ")}`);
  }
  // The labels.
  const t = await getTranslations("learnClaims");
  // The label: the status, then who, when the article names them.
  const label = by ? t("statusBy", { status: t(`status.${status}`), who: by }) : t(`status.${status}`);
  return (
    <span className={`claim claim--${status}`}>
      {/* The claim as the article states it. */}
      {children}{" "}
      {/* Its status, in words (colour only repeats them). */}
      <span className="claim-status">{label}</span>
    </span>
  );
}
