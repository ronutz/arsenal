"use client";

// ============================================================================
// ShareControl - a small, privacy-preserving share affordance for tool and
// article pages (2026-07-10). Mobile-first: where the Web Share API exists the
// trigger opens the OS share sheet directly (one tap reaches every app the
// reader actually has). Where it is absent - typically desktop - it expands a
// single "Copy URL" action. No third-party SDKs and no trackers: it only ever
// touches the current page URL, in keeping with the privacy-first thesis.
//
// A VALUE IN THE ADDRESS (Round 1 RT01, 2026-10-20). A tool page opened by a
// handoff keeps the handed-over value in the fragment (#input=...; see
// src/lib/handoff.ts). Sharing the address shares that value, so when the
// fragment carries one, Share never jumps straight to the OS sheet: it opens
// the popover first, with one sentence saying the address contains what was
// entered and that whoever receives it can read it, then offers Copy URL and,
// where the browser has one, the share sheet. Without a handoff nothing
// changes. The address is read at the moment of the click, so a value the
// reader has since cleared (the hook drops it from the address) is not named.
// ============================================================================

import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
// Whether the address carries a tool value in its fragment (RT01, 2026-10-20).
import { fragmentCarriesHandoff } from "@/lib/handoff";

export default function ShareControl({ title }: { title?: string }) {
  const t = useTranslations("share");
  const [open, setOpen] = useState(false); // Copy-URL popover (desktop fallback)
  const [copied, setCopied] = useState(false);
  // Whether the address held a handed-over tool value when the popover opened, so the notice is shown (RT01).
  const [carriesValue, setCarriesValue] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // While the popover is open, dismiss it on an outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  /** Open the OS share sheet with the current address (the popover's second action, and Share without a value). */
  const nativeShare = useCallback(async () => {
    // The address as it stands at the moment of sharing.
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      await navigator.share({
        title: title || (typeof document !== "undefined" ? document.title : ""),
        url,
      });
    } catch {
      // The reader dismissed the sheet or the share was aborted; nothing to do.
    }
  }, [title]);

  const onShare = useCallback(async () => {
    // A tool value in the fragment: tell the reader before anything is shared, in the popover (RT01).
    const carries = typeof window !== "undefined" && fragmentCarriesHandoff(window.location.hash);
    setCarriesValue(carries);
    if (carries) {
      setOpen((v) => !v);
      return;
    }
    // Prefer the native share sheet when the browser supports it.
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      await nativeShare();
      return;
    }
    // No Web Share API (typically desktop): reveal the Copy URL affordance.
    setOpen((v) => !v);
  }, [nativeShare]);

  const onCopy = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access was blocked; leave the popover open to copy manually.
    }
  }, []);

  return (
    <div className="share-control" ref={rootRef}>
      <button
        type="button"
        className="share-trigger"
        aria-label={t("label")}
        aria-expanded={open}
        onClick={onShare}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        <span>{t("label")}</span>
      </button>
      {open && (
        <div className="share-pop" role="group" aria-label={t("label")}>
          {/* The address carries what the reader entered (#input=): say so before it is copied or shared (RT01). */}
          {carriesValue && <p className="share-note">{t("stateNote")}</p>}
          <button type="button" className="share-copy" onClick={onCopy}>
            {copied ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
            <span>{copied ? t("copied") : t("copyUrl")}</span>
          </button>
          {/* With a value in the address, the OS share sheet is offered here, after the notice, where it exists. */}
          {carriesValue && typeof navigator !== "undefined" && typeof navigator.share === "function" && (
            <button type="button" className="share-copy" onClick={() => void nativeShare()}>
              <span>{t("label")}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
