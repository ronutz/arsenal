"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/ContentStrings.tsx
// ----------------------------------------------------------------------------
// THE CLIENT SIDE OF THE STRINGS THAT LIVE IN CODE (09/11/2026; the scheme is
// described in src/i18n/contentStrings.ts). A server page loads the maps of the
// modules it shows for its locale and wraps the client component in
// <ContentStrings strings={...}>; the component calls useContentString() and
// passes every English string (or rendered English sentence) it would show
// through it. With no provider, or an empty map (English, Brazilian Portuguese,
// a locale not written yet), the English comes back unchanged.
// ============================================================================

import { createContext, useCallback, useContext, type ReactNode } from "react"; // context and memoised callbacks
import { matchContent, type ContentStrings as Strings } from "@/i18n/contentMatch"; // the shared lookup

/** The map in force for the subtree (empty outside any provider). */
const Ctx = createContext<Strings>({});

/**
 * Provide one language's strings for the modules of a page.
 *
 * @param props the map and the subtree
 * @returns the provider
 */
export default function ContentStrings({ strings, children }: { strings: Strings; children: ReactNode }) {
  // The map, as given by the server page.
  return <Ctx.Provider value={strings}>{children}</Ctx.Provider>;
}

/**
 * The translator for strings held in code: English in, the page language out (the English when none is written).
 *
 * @returns a stable function of the English text
 */
export function useContentString(): (en: string) => string {
  // The map in force.
  const map = useContext(Ctx);
  // Stable across renders while the map is the same.
  return useCallback((en: string) => matchContent(map, en), [map]);
}
