"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/DetailsToggleAll.tsx
// ----------------------------------------------------------------------------
// EXPAND ALL / COLLAPSE ALL FOR A BLOCK OF NATIVE DISCLOSURES (row 61, PRIME
// 2026-10-07 08:41: on /study-guides, "as we expect to have many, please allow
// collapsing of individual items (NetFun I, NetFun I[I]) and of the sections
// (NetFun, SecFun, ...)"). The block's <details> are rendered on the server and
// work without script; this island adds the two buttons every collapsible page
// carries (the reading paths' rule, ReadingPathSections), opening or closing
// every <details> inside one container, sections and cards alike. The buttons
// use the reading paths' classes, so the two rows look the same.
// ============================================================================

export default function DetailsToggleAll({ containerId, expandLabel, collapseLabel }: {
  /** The id of the element whose <details> the buttons open and close. */
  containerId: string;
  /** The two buttons' words, from the page's pack. */
  expandLabel: string;
  collapseLabel: string;
}) {
  /** Open or close every disclosure inside the container. */
  const setAll = (open: boolean) => {
    const box = document.getElementById(containerId);
    box?.querySelectorAll("details").forEach((d) => {
      d.open = open;
    });
  };
  return (
    <div className="dig-input-actions details-toggle-all">
      <button type="button" className="b64-copy" onClick={() => setAll(true)}>
        {expandLabel}
      </button>
      <button type="button" className="b64-copy" onClick={() => setAll(false)}>
        {collapseLabel}
      </button>
    </div>
  );
}
