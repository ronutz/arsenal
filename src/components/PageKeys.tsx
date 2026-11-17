// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

"use client";

// ============================================================================
// src/components/PageKeys.tsx
// ----------------------------------------------------------------------------
// A PAGE TELLS THE HELP ITS OWN KEYS (PRIME 16/11/2026 03:14: "change the
// contents of the help contextually, to reflect the correct mapping of keys in
// pages that have exceptions"). A client component calls usePageKeys with when
// its keys apply and the sentences that name them (its own localized rules or
// key hint, so the help and the page never word them differently); a server
// page renders <PageKeys /> instead. The help opened with "?" or "h"
// (src/components/KeyboardShortcuts.tsx) shows them first, under "On this
// page". Passing null registers nothing (for a page whose keys apply only in
// one mode, such as My desk while it is being arranged).
// ============================================================================

import { useEffect } from "react";
import { clearPageKeys, setPageKeys, type PageKeysWhen } from "@/lib/pageCapabilities";

/**
 * Register the page's own keys while the calling component is mounted.
 *
 * @param spec when they apply and the sentences naming them, or null for none
 */
export function usePageKeys(spec: { when: PageKeysWhen; lines: string[] } | null): void {
  // The registration's identity: the mode and the words (a new language or mode registers again).
  const when = spec?.when ?? null;
  const joined = spec ? spec.lines.join("\n") : null;
  useEffect(() => {
    // Nothing to register.
    if (when === null || joined === null) return;
    // Registered, with its token.
    const token = setPageKeys({ when, lines: joined.split("\n") });
    // Cleared on unmount, only if still this page's.
    return () => clearPageKeys(token);
  }, [when, joined]);
}

/**
 * The same, for a server page: render it anywhere on the page.
 *
 * @param props.when when the keys apply
 * @param props.lines the sentences naming them, in the reader's language
 * @returns nothing visible
 */
export default function PageKeys(props: { when: PageKeysWhen; lines: string[] }) {
  // Registered while mounted.
  usePageKeys(props);
  // Nothing to draw.
  return null;
}
