"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/desk/DeskItemPicker.tsx
// ----------------------------------------------------------------------------
// FIND AN ITEM TO ADD (the desk's "add" picker): a field that searches the
// site index's titles in the page's language, as the reader types, and a short
// list of matches with an Add button each. Used by the paths widget to add an
// item or a whole series. Local: it searches the index file already loaded,
// nothing is sent.
// ============================================================================

// React's state and ids.
import { useId, useMemo, useState } from "react";
// Identifiers.
import { itemId, type ItemId, type ItemKind } from "@/lib/desk/ids";
// The index search.
import { searchIndex, type SiteIndex } from "@/lib/desk/siteIndex";

/** The picker's words. */
export interface PickerLabels {
  /** The field's label. */
  label: string;
  /** The field's placeholder. */
  placeholder: string;
  /** No match. */
  none: string;
  /** The add button. */
  add: string;
  /** The kind's name, per kind. */
  kind: (k: ItemKind) => string;
}

/**
 * The picker.
 *
 * @param props the index, the kinds to search, what to do with a pick, the words, and items already present
 * @returns the field and its matches
 */
export default function DeskItemPicker(props: { index: SiteIndex | null; kinds?: readonly ItemKind[]; onPick: (id: ItemId) => void; labels: PickerLabels; present?: readonly ItemId[] }) {
  // What was typed.
  const [q, setQ] = useState("");
  // The field's id, for its label.
  const fid = useId();
  // The matches (none before the index arrives or before anything is typed).
  const hits = useMemo(() => (props.index && q.trim() ? searchIndex(props.index, q, 8, props.kinds) : []), [props.index, q, props.kinds]);
  // The picker.
  return (
    <div className="desk-picker">
      <label className="desk-picker-label" htmlFor={fid}>{props.labels.label}</label>
      <input id={fid} className="desk-input" type="search" value={q} placeholder={props.labels.placeholder} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
      {/* Matches, or "no match" once something was typed. */}
      {q.trim() && (
        <ul className="desk-picker-list" aria-live="polite">
          {hits.length === 0 && <li className="desk-muted">{props.labels.none}</li>}
          {hits.map((it) => {
            // Its identifier.
            const id = itemId(it.k, it.s);
            // Already there.
            const has = props.present?.includes(id) ?? false;
            // A row.
            return (
              <li key={id} className="desk-picker-row">
                <span className="desk-chip">{props.labels.kind(it.k)}</span>
                <span className="desk-picker-title">{it.t}</span>
                <button type="button" className="desk-btn" disabled={has} onClick={() => props.onPick(id)}>
                  <span className="desk-sign" aria-hidden="true">{has ? "✓" : "+"}</span> {props.labels.add}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
