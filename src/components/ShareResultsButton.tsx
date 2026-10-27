"use client";

// ============================================================================
// src/components/ShareResultsButton.tsx
// ----------------------------------------------------------------------------
// "SHARE RESULTS" (PRIME 27/10/2026: an explicit button to share a tool with
// what the reader typed; site-wide, three tools first, then family by family).
//
// One button beside a tool's output. Disabled while there is nothing to share.
// Pressed, it opens a small popover that says, in this order:
//   1. exactly what the link carries (one line the tool supplies, from its
//      spec's carriesKey), and any detail lines the tool adds;
//   2. the site's standard warning, share.stateNote (the address includes what
//      was entered after the #; the browser never sends that part; anyone
//      given the address can read it);
//   3. then Copy link and, where the browser has one, its share sheet; or,
//      when no link can be made, why (over the length bound, or a reason the
//      tool gives), in place of the warning, which is about a link.
// The link is the page's own address with the values after the "#", built by
// buildShareLink (src/lib/share/format.ts) at the moment it is shown. Nothing
// is written to the address bar or to history: the link only goes to the
// clipboard or to the share sheet, and only when the reader presses one of
// them. The keyboard follows ShareControl: Escape and a click outside close
// the popover, and Escape returns focus to the button.
//
// Styling reuses ShareControl's classes (share-control, share-trigger,
// share-pop, share-copy, share-note), with inline styles for what those
// classes, made for a one-line header popover, do not set (no new class):
//   - the popover has a fixed readable width, min(19rem, viewport - 2.5rem),
//     instead of shrinking to the button's width (the first screenshots at
//     390 px showed a column of three words per line);
//   - it opens below the button's left edge and, if that would leave the
//     screen, below its right edge instead (measured when it opens);
//   - the "what it carries" line is in the primary text colour and weight,
//     so it reads first; the standard warning keeps share-note's quieter tone;
//   - Copy link carries ShareControl's copy and check icons and the accent
//     colour: the one primary action; the share sheet stays secondary;
//   - the trigger never wraps or shrinks, and looks disabled when it is.
// It is absolutely positioned, so opening it moves nothing on the page.
// ============================================================================

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react"; // state, the popover's id, the root element, the fit check
import { useTranslations } from "next-intl"; // the shareResults and share namespaces
import { buildShareLink } from "@/lib/share/format"; // the one link format
import type { ShareEncoding } from "@/lib/share/spec"; // what the tool's spec gave

/** The button's inputs. */
export interface ShareResultsButtonProps {
  /** What the tool's spec encoded from the current state. */
  encoding: ShareEncoding;
  /** The one line saying exactly what the link carries (the tool's carriesKey, translated). */
  carries: string;
  /** Further lines the tool adds under it (for example which values are left unmasked). */
  details?: readonly string[];
  /** The tool's message for a blocked encoding (shown instead of the actions). */
  blockedMessage?: string;
  /** The title handed to the share sheet (the tool's name). */
  title?: string;
}

/** The "Share results" button and its popover. */
export default function ShareResultsButton({ encoding, carries, details = [], blockedMessage = "", title = "" }: ShareResultsButtonProps) {
  const t = useTranslations("shareResults"); // the button's own words
  const ts = useTranslations("share"); // the site's standard warning, share.stateNote
  const [open, setOpen] = useState(false); // the popover
  const [copied, setCopied] = useState(false); // the Copy link feedback
  const [copyFailed, setCopyFailed] = useState(false); // the clipboard refused: show the link to copy by hand
  const [canShareSheet, setCanShareSheet] = useState(false); // navigator.share exists (known only after hydration)
  const rootRef = useRef<HTMLDivElement>(null); // for the outside-click test
  const triggerRef = useRef<HTMLButtonElement>(null); // focus returns here on Escape
  const popRef = useRef<HTMLDivElement>(null); // the popover, for the fit check
  const [alignRight, setAlignRight] = useState(false); // open below the right edge instead of the left
  const popId = useId(); // ties the button to its popover

  const disabled = !encoding.ok && encoding.reason === "empty"; // nothing to share yet

  // The share sheet is a browser feature: detected once, on the client.
  useEffect(() => { setCanShareSheet(typeof navigator !== "undefined" && typeof navigator.share === "function"); }, []);

  // A change of what would be shared closes the popover, so it never offers a link for older state. Compared by
  // content (at most 16,384 characters of values), so a parent that rebuilds an equal encoding does not close it.
  const encodingKey = JSON.stringify(encoding); // the encoding as text
  useEffect(() => { setOpen(false); setCopied(false); setCopyFailed(false); }, [encodingKey]);

  // When it opens: if the popover would leave the screen on the right, anchor it to the button's right edge instead.
  useLayoutEffect(() => {
    if (!open) { setAlignRight(false); return; } // closed: back to the default
    const r = popRef.current?.getBoundingClientRect(); // where it landed
    if (r && r.right > window.innerWidth - 8) setAlignRight(true); // past the edge: flip (measured before paint)
  }, [open]);

  // While open: a click outside closes it; Escape closes it and returns focus to the button (as ShareControl).
  useEffect(() => {
    if (!open) return; // nothing to watch
    const onDown = (e: MouseEvent) => { if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false); }; // outside
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); triggerRef.current?.focus(); } }; // Escape
    document.addEventListener("mousedown", onDown); // listen
    document.addEventListener("keydown", onKey); // listen
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); }; // stop
  }, [open]);

  /** The link, built from the page's own address (origin and path; never its query or fragment). */
  const link = (() => {
    if (!open || !encoding.ok || typeof window === "undefined") return null; // only while shown
    return buildShareLink(window.location.origin + window.location.pathname, encoding.params); // the one format
  })();

  /** Copy the link; on refusal, show it to copy by hand. */
  const onCopy = useCallback(async (href: string) => {
    try {
      await navigator.clipboard.writeText(href); // to the clipboard only
      setCopied(true); // say so
      window.setTimeout(() => setCopied(false), 2000); // then back
    } catch {
      setCopyFailed(true); // the field below shows the link
    } // try
  }, []);

  /** Hand the link to the browser's share sheet. */
  const onSheet = useCallback(async (href: string) => {
    try {
      await navigator.share({ title: title || (typeof document !== "undefined" ? document.title : ""), url: href }); // the OS sheet
    } catch {
      // Dismissed or refused: nothing to do.
    } // try
  }, [title]);

  return (
    <div className="share-control" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="share-trigger"
        aria-expanded={open}
        aria-controls={open ? popId : undefined}
        disabled={disabled}
        style={{ whiteSpace: "nowrap", flexShrink: 0, ...(disabled ? { opacity: 0.5, cursor: "not-allowed" } : {}) }}
        onClick={() => setOpen((v) => !v)}
      >
        {/* The same three-node share glyph as ShareControl. */}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        <span>{t("button")}</span>
      </button>
      {open && (
        <div
          ref={popRef}
          className="share-pop"
          id={popId}
          role="group"
          aria-label={t("button")}
          style={{ width: "min(19rem, calc(100vw - 2.5rem))", ...(alignRight ? { left: "auto", right: 0 } : {}) }}
        >
          {/* 1. Exactly what the link carries (read first), then the tool's details, only when there is a link they are
              about: a caution such as "read it before you send the link" above "No link" contradicted it (wave 1A,
              27/10/2026, seen in the too-long state). */}
          <p className="share-note" style={{ color: "var(--text-primary)", fontWeight: 600, maxWidth: "none" }}>{carries}</p>
          {link && link.kind === "link" && details.map((d, i) => (<p key={i} className="share-note" style={{ maxWidth: "none" }}>{d}</p>))}
          {/* 2. The site's standard warning about values after the #, only when there is a link it is about. */}
          {link && link.kind === "link" && <p className="share-note" style={{ maxWidth: "none" }}>{ts("stateNote")}</p>}
          {/* 3. The actions, or why there are none. */}
          {!encoding.ok && encoding.reason === "blocked" && <p className="share-note" role="status" style={{ maxWidth: "none", color: "var(--text-primary)" }}>{blockedMessage}</p>}
          {link && link.kind === "too-long" && <p className="share-note" role="status" style={{ maxWidth: "none", color: "var(--text-primary)" }}>{t("tooLong", { length: link.length, max: link.max })}</p>}
          {link && link.kind === "link" && (
            <>
              {/* The primary action: ShareControl's copy and check icons, in the accent colour. */}
              <button type="button" className="share-copy" style={{ color: "var(--accent-primary)" }} onClick={() => void onCopy(link.href)}>
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
                <span>{copied ? t("copied") : t("copyLink")}</span>
              </button>
              {canShareSheet && (
                <button type="button" className="share-copy" onClick={() => void onSheet(link.href)}>
                  <span>{t("shareSheet")}</span>
                </button>
              )}
              {copyFailed && (
                <>
                  <p className="share-note" role="status">{t("copyFailed")}</p>
                  {/* Read-only, so it can be selected and copied by hand; it shows only what the link carries. */}
                  <input className="cidr-input mono" type="text" readOnly value={link.href} aria-label={t("linkLabel")} onFocus={(e) => e.currentTarget.select()} />
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
