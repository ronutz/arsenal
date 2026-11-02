"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0
// ============================================================================
// src/components/CvPrintButton.tsx
// ----------------------------------------------------------------------------
// "Save as PDF" on the CV page (27/10/2026). There is no PDF file on the server:
// a file the site serves is crawled like any page, address included. This button
// reveals every protected address on the page (REVEAL_EMAIL_EVENT, which
// ProtectedEmail listens for), waits a moment for the page to show it, and opens
// the browser's print dialog, where the visitor picks "Save as PDF". The CV's
// print styles (.cv-page under @media print in components.css) lay the page out
// as a document: no site header, footer or buttons.
// ============================================================================

import { REVEAL_EMAIL_EVENT } from "@/lib/protected-email"; // the reveal signal

/**
 * The button.
 * @param label its words, from the page's pack ("Save as PDF")
 * @param hint the line under it ("Your browser's print dialog: choose Save as PDF.")
 */
export default function CvPrintButton({ label, hint }: { label: string; hint: string }) {
  /** Reveal the address, then print. */
  const onClick = () => {
    window.dispatchEvent(new Event(REVEAL_EMAIL_EVENT)); // every ProtectedEmail on the page shows its address
    window.setTimeout(() => window.print(), 150); // after React has rendered it
  };
  return (
    <span className="cv-print">
      <button type="button" className="cidr-button cv-print-button" onClick={onClick}>{label}</button>
      <span className="cv-print-hint">{hint}</span>
    </span>
  );
}
