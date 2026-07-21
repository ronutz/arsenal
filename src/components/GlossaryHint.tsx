"use client";

// ============================================================================
// src/components/GlossaryHint.tsx
// ----------------------------------------------------------------------------
// GLOSSARY HINT — the client affordance (trigger + popup).
//
// This is the small interactive island the server-side <GlossaryTerm> hands its
// already-resolved strings to. It owns ONLY presentation + interaction:
//   - the matched word, rendered inline with a subtle dashed underline;
//   - a popup on hover (desktop) / tap (mobile) / focus (keyboard) showing the
//     term's def + context, scrollable, with an "Expand" link to the full
//     /glossary/<slug> page;
//   - full keyboard access (focusable trigger, Escape to close) and
//     reduced-motion friendliness.
//
// It deliberately holds NO glossary data of its own — def/context/headword/href
// arrive as props, so the client bundle never carries the ~814-entry glossary.
//
// THE TRI-STATE SWITCH (first | all | off) lives on <html> as
// data-glossary-hints: absent = first (the default), "all", or "off" — set
// before paint by the layout's inline script and flipped live by the settings
// control. This island mirrors the attribute into state: a mark is ACTIVE when
// the mode is not "off" and (it is the first occurrence, or the mode is
// "all"). Inactive marks render as ordinary prose spans — no button, no focus
// stop, zero interaction cost.
// ============================================================================

import { useId, useRef, useState, useCallback, useEffect } from "react";

interface GlossaryHintProps {
  /** The exact words matched in prose (rendered as the trigger text). */
  children: string;
  /** Term display name for the popup header. */
  headword: string;
  /** One-line definition (popup lead). */
  def: string;
  /** Fuller context paragraph (popup body, scrollable). */
  context: string;
  /** Localized href to the full glossary entry, e.g. /pt-BR/glossary/snat. */
  href: string;
  /** Localized label for the expand action ("Expand" / "Abrir"). */
  expandLabel: string;
  /** Which occurrence of the term this mark is; "rest" activates only in "all" mode. */
  occ?: "first" | "rest";
}

export default function GlossaryHint({
  children,
  headword,
  def,
  context,
  href,
  expandLabel,
  occ = "first",
}: GlossaryHintProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"first" | "all" | "off">("first");
  const panelId = useId();
  const wrapRef = useRef<HTMLSpanElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Respect the global tri-state. The attribute is applied before paint by the
  // layout script; we mirror it into state so inactive marks go fully inert.
  // We also react to later changes from the settings page via the observer.
  useEffect(() => {
    const read = () => {
      const v = document.documentElement.getAttribute("data-glossary-hints");
      setMode(v === "off" ? "off" : v === "all" ? "all" : "first");
    };
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-glossary-hints"],
    });
    return () => obs.disconnect();
  }, []);

  const clearTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const show = useCallback(() => {
    clearTimer();
    setOpen(true);
  }, []);

  // Small close delay so moving the pointer from the word into the popup does
  // not dismiss it.
  const scheduleHide = useCallback(() => {
    clearTimer();
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }, []);

  const toggle = useCallback(() => {
    clearTimer();
    setOpen((v) => !v);
  }, []);

  // Dismiss on Escape and on outside interaction.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDocPointer = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDocPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDocPointer);
    };
  }, [open]);

  useEffect(() => () => clearTimer(), []);

  // Inactive (off, or a rest-occurrence outside "all" mode): ordinary prose.
  const active = mode !== "off" && (occ !== "rest" || mode === "all");
  if (!active) return <span className="gloss-hint-off">{children}</span>;

  return (
    <span
      ref={wrapRef}
      className="gloss-hint"
      onMouseEnter={show}
      onMouseLeave={scheduleHide}
    >
      <button
        type="button"
        className="gloss-hint-trigger"
        aria-expanded={open}
        aria-describedby={open ? panelId : undefined}
        // Tap (mobile) and click toggle; also handles keyboard activation.
        onClick={(e) => {
          // Do not follow any parent link; this is a definition trigger.
          e.preventDefault();
          toggle();
        }}
        onFocus={show}
        onBlur={scheduleHide}
      >
        {children}
      </button>

      {open && (
        <span
          id={panelId}
          role="tooltip"
          className="gloss-hint-panel"
          // Keep it open while the pointer is inside the panel.
          onMouseEnter={show}
          onMouseLeave={scheduleHide}
        >
          <span className="gloss-hint-head">{headword}</span>
          <span className="gloss-hint-def">{def}</span>
          <span className="gloss-hint-context">{context}</span>
          <a className="gloss-hint-expand" href={href}>
            {expandLabel}
            <span aria-hidden="true"> &rarr;</span>
          </a>
        </span>
      )}
    </span>
  );
}
