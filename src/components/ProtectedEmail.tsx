"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0
// ============================================================================
// src/components/ProtectedEmail.tsx
// ----------------------------------------------------------------------------
// An e-mail address shown only when the visitor asks for it (27/10/2026, PRIME:
// "the e-mail address needs to be spam-crawler-proof").
//
// Before the click there is a button and nothing else: no address, no
// "user [at] domain", no mailto. The address comes from src/lib/protected-email
// (encoded, decoded here in the browser), so the server never renders it and
// the page's data never carries it. After the click: the address as a mailto
// link, and a Copy button.
//
// PRINTING. A "Save as PDF" button sends REVEAL_EMAIL_EVENT before it prints, and
// the browser's own beforeprint event does the same, so the visitor's PDF holds
// the address while no file on the server ever does.
// ============================================================================

import { useCallback, useEffect, useState } from "react"; // React state and effects
import { revealEmail, REVEAL_EMAIL_EVENT, type ProtectedEmailId } from "@/lib/protected-email"; // the decoder

/** The words the component shows, from the page's message pack. */
export interface ProtectedEmailCopy {
  /** The button before the reveal ("Show e-mail address"). */
  show: string;
  /** The copy button ("Copy"). */
  copy: string;
  /** The copy button once copied ("Copied"). */
  copied: string;
}

/**
 * A protected address: a button, then the address.
 * @param id which address (never the address itself)
 * @param copy the button words
 */
export default function ProtectedEmail({ id, copy }: { id: ProtectedEmailId; copy: ProtectedEmailCopy }) {
  const [address, setAddress] = useState<string | null>(null); // null until the visitor asks
  const [copied, setCopied] = useState(false); // the copy button's state
  const reveal = useCallback(() => setAddress(revealEmail(id)), [id]); // decode on request

  useEffect(() => {
    // A print (the browser's own, or the page's Save as PDF button) reveals the address first.
    window.addEventListener("beforeprint", reveal); // the browser's print
    window.addEventListener(REVEAL_EMAIL_EVENT, reveal); // the page's button
    return () => {
      window.removeEventListener("beforeprint", reveal); // clean up
      window.removeEventListener(REVEAL_EMAIL_EVENT, reveal); // clean up
    };
  }, [reveal]);

  /** Copy the address to the clipboard, and say so for two seconds. */
  const onCopy = async () => {
    if (!address) return; // nothing to copy yet
    try {
      await navigator.clipboard.writeText(address); // the clipboard
      setCopied(true); // say so
      window.setTimeout(() => setCopied(false), 2000); // and stop saying so
    } catch {
      // A browser that refuses the clipboard: the address is on screen to select by hand.
    }
  };

  if (!address) {
    // Before the click: the button only.
    return (
      <button type="button" className="b64-copy protected-email-show" onClick={reveal}>
        {copy.show}
      </button>
    );
  }
  // After the click: the address, and Copy.
  return (
    <span className="protected-email">
      <a className="protected-email-link mono" href={`mailto:${address}`}>{address}</a>
      <button type="button" className="b64-copy protected-email-copy" onClick={onCopy}>
        {copied ? copy.copied : copy.copy}
      </button>
    </span>
  );
}
