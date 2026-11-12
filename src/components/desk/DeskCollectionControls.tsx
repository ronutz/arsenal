"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/desk/DeskCollectionControls.tsx
// ----------------------------------------------------------------------------
// A SERIES ON THE READER'S DESK (PLAN-personal-desk-20261112, sections 3.3 and
// 3.9): on each Learn series card and on a training series' page, the
// reader's progress through it, "7 of 12 read", in words with a single-hue bar
// beside it (never a gauge, no traffic-light colours: unread is not a fault),
// derived from the read marks and never stored; Save; and "Add as a path",
// either following the series (an article added later appears in the path) or
// as the reader's own copy to reorder and change: the reader's choice.
//
// The members come from the page itself (the series' written articles, in
// order), so no index is fetched here. The line keeps its height before the
// desk is read, so nothing moves when the numbers arrive.
// ============================================================================

// React's state.
import { useState } from "react";
// The page's strings.
import { useTranslations } from "next-intl";
// Locale-aware links.
import { Link } from "@/i18n/navigation";
// The desk's verbs.
import { createPath, saveItem, unsaveItem, pathProgress } from "@/lib/desk/store";
// The desk in a component.
import { useDesk } from "@/lib/desk/useDesk";
// The automatic sync, loaded only when this browser syncs.
import { useAutoSync } from "@/lib/desk/autoSync";
// Identifiers.
import type { ItemId } from "@/lib/desk/ids";

/**
 * Progress, Save, and Add as a path, for one collection.
 *
 * @param props the collection's identifier and its written members in order
 * @returns the controls
 */
export default function DeskCollectionControls(props: { item: ItemId; members: ItemId[] }) {
  // The words.
  const t = useTranslations("deskItem");
  // The desk.
  const { data, ready } = useDesk();
  // Changes made here reach the sync when this browser syncs.
  useAutoSync();
  // Whether the two ways of adopting are shown.
  const [choosing, setChoosing] = useState(false);
  // What happened, in words.
  const [msg, setMsg] = useState("");
  // Progress over the members.
  const { done, total } = pathProgress({ items: props.members }, data.read);
  // Saved.
  const saved = props.item in data.saved;
  // Already adopted as a path.
  const adopted = data.paths.some((p) => p.from?.id === props.item);

  /**
   * Adopt the collection as a path.
   *
   * @param mode live (follows it) or frozen (a copy)
   */
  const adopt = (mode: "live" | "frozen") => {
    // Made, with an empty name: the page shows the collection's own title.
    const r = createPath("", props.members, { id: props.item, mode });
    // Said.
    setMsg(r.ok ? t("adopted") : t("menu.tooMany"));
    // Closed.
    setChoosing(false);
  };

  // The controls.
  return (
    <div className="desk-collection" data-pagefind-ignore>
      {/* Progress: words first, then a bar in one hue, the same scale everywhere; hidden (not removed) until read. */}
      <p className={`desk-progress${ready ? "" : " desk-pending"}`}>
        <span className="desk-progress-text mono">{t("progress", { done, total })}</span>
        <span className="desk-bar" aria-hidden="true">
          <span className="desk-bar-fill" style={{ width: `${total ? Math.round((done / total) * 100) : 0}%` }} />
        </span>
      </p>
      <div className="desk-controls-row">
        {/* Save. */}
        <button type="button" className="desk-btn" aria-pressed={saved} onClick={() => (saved ? unsaveItem(props.item) : saveItem(props.item))}>
          <span className="desk-sign" aria-hidden="true">{saved ? "★" : "☆"}</span> {saved ? t("saved") : t("save")}
        </button>
        {/* Adopted already: said, with the way to it; otherwise the two ways to adopt. */}
        {adopted ? (
          <span className="desk-collection-on">
            <span className="desk-sign" aria-hidden="true">{"✓"}</span> {t("onDesk")} · <Link href="/desk" className="desk-link">{t("open")}</Link>
          </span>
        ) : (
          <button type="button" className="desk-btn" aria-expanded={choosing} onClick={() => setChoosing((v) => !v)}>
            <span className="desk-sign" aria-hidden="true">+</span> {t("adopt")}
          </button>
        )}
      </div>
      {/* The reader's choice: follow the collection, or copy it. */}
      {choosing && !adopted && (
        <div className="desk-collection-choose" role="group" aria-label={t("adopt")}>
          <button type="button" className="desk-btn" onClick={() => adopt("live")}>{t("adoptLive")}</button>
          <button type="button" className="desk-btn" onClick={() => adopt("frozen")}>{t("adoptFrozen")}</button>
        </div>
      )}
      {/* What happened, and where this is kept. */}
      <p className="desk-controls-note" role="status">
        {msg ? <>{msg} </> : null}
        {t("kept")}
      </p>
    </div>
  );
}
