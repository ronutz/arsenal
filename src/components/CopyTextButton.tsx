"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0
// ============================================================================
// src/components/CopyTextButton.tsx
// ----------------------------------------------------------------------------
// A Copy button for a block of text the page already shows (27/10/2026: the
// media kit's bios on /about/cv). The text arrives as a prop, rendered by the
// server like the rest of the page; the button only puts it on the clipboard
// and says "Copied" for two seconds.
// ============================================================================

import { useState } from "react"; // the copied state

/**
 * The button.
 * @param text what to copy
 * @param label the button's words ("Copy")
 * @param done its words once copied ("Copied")
 */
export default function CopyTextButton({ text, label, done }: { text: string; label: string; done: string }) {
  const [copied, setCopied] = useState(false); // shown for two seconds after a copy
  /** Copy, and say so. */
  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(text); // the clipboard
      setCopied(true); // say so
      window.setTimeout(() => setCopied(false), 2000); // and stop
    } catch {
      // A browser that refuses the clipboard: the text is on the page to select by hand.
    }
  };
  return (
    <button type="button" className="b64-copy cv-copy" onClick={onClick}>{copied ? done : label}</button>
  );
}
