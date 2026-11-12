// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/desk/menuLabels.ts
// ----------------------------------------------------------------------------
// The "Add to a path" panel's words (DeskAddMenu), read from a translator of
// the deskItem.menu messages, wherever the panel opens: an item page, the desk
// page, or the search dialog (where deskItem.menu is part of the global slice,
// src/i18n/clientMessages.ts). The sentences that name a path keep their
// {name} placeholder, filled by the panel when it knows the name.
// ============================================================================

// The panel's words.
import type { DeskMenuLabels } from "./DeskAddMenu";

/** A translator of the deskItem.menu messages (next-intl's t, scoped). */
export type MenuTranslator = (key: string, values?: Record<string, string>) => string;

/**
 * The panel's words.
 *
 * @param t a translator scoped to deskItem.menu
 * @returns the labels
 */
export function menuLabels(t: MenuTranslator): DeskMenuLabels {
  // The placeholder kept as written, for the panel to fill.
  const keep = { name: "{name}" };
  // Every label.
  return {
    title: t("title"),
    save: t("save"),
    saved: t("saved"),
    paths: t("paths"),
    none: t("none"),
    newName: t("newName"),
    create: t("create"),
    added: t("added", keep),
    already: t("already", keep),
    full: t("full", keep),
    tooMany: t("tooMany"),
    live: t("live", keep),
    untitled: t("untitled"),
    close: t("close"),
    kept: t("kept"),
    open: t("open"),
    limitSaved: t("limitSaved"),
  };
}
