"use client";

// ============================================================================
// src/components/dev/fun/ToyShare.tsx
// ----------------------------------------------------------------------------
// THE SHARE LINE of the /dev/fun toys (PRIME 03/11/2026, "Yes on all your
// suggested ideas"): Meeting Bingo, The Global Cat Distribution System, the
// Boss-Key Screens and the Importance Meter. A few lines of plain text that end
// with the toy's address, copied to the clipboard by one Copy button, the way
// the /dev/fun games copy their share card (src/lib/fun/share.ts, copyText).
//
// What it shows:
//   - optionally the text itself, so the reader sees what will be copied
//     (the cat's link carries a name: the reader sees it before copying);
//   - optionally notes under it (what the link carries, the site's warning);
//   - the Copy button, which says "Copied" with a tick for two seconds after a
//     copy; a hidden polite live region says the same to a screen reader;
//   - when the browser refuses the copy, the games' "Copy failed" words and the
//     text in a read-only box, selected on focus, to copy by hand.
//
// Nothing is posted anywhere and nothing is stored: the text goes to the
// clipboard, and only when the reader presses the button. The strings arrive
// as props from the server pages, like every other string of these toys.
// ============================================================================

// React state and the timer that fades the confirmation.
import { useEffect, useState } from "react";
// The games' clipboard helper, with its fallback for browsers without the asynchronous Clipboard API.
import { copyText } from "@/lib/fun/share";

/** The button's words, resolved by the server page. */
export interface ToyShareLabels {
  /** The button at rest ("Copy"). */
  copy: string;
  /** The button after a copy ("Copied"). */
  copied: string;
  /** Said when the browser refused the copy (the games' "Copy failed: select and copy by hand"). */
  copyFailed: string;
}

/** How long the "Copied" confirmation stays (ms), as in the games. */
const CONFIRM_MS = 2000;

/**
 * Fill a share template's simple {name} arguments on the client. The page hands the template over raw (t.raw), as the
 * Mega Brain does with totalTerms, because the values (a meeting type, a cat) are only known in the browser; a plural
 * is never left to this: the page resolves those with the language's plural rules and sends one wording per count.
 *
 * @param template the message as authored, with {name} arguments only
 * @param values the value for each argument
 * @returns the message with every argument replaced (an argument without a value is left as written)
 */
export function fillTemplate(template: string, values: Readonly<Record<string, string>>): string {
  // Each {name} in turn, replaced by its value when there is one.
  return template.replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (whole, key: string) => (key in values ? values[key] : whole));
}

/**
 * A share line and its Copy button.
 *
 * @param props.text what is copied (lines joined with newlines)
 * @param props.labels the button's words
 * @param props.preview show the text above the button
 * @param props.notes lines shown under the text (what a link carries, a warning)
 * @param props.subject when set, the button's accessible name names it ("Copy: Apple II · 1977"), for a page with
 *                      many share buttons; the visible word stays the first part of that name (WCAG 2.5.3)
 * @param props.className an extra class for the wrapper (placement belongs to the toy's own stylesheet block)
 */
export default function ToyShare({
  text,
  labels,
  preview = false,
  notes = [],
  subject,
  className = "",
}: {
  text: string;
  labels: ToyShareLabels;
  preview?: boolean;
  notes?: readonly string[];
  subject?: string;
  className?: string;
}) {
  // The outcome of the last press: nothing yet, copied, or refused by the browser.
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");

  // The confirmation fades after two seconds; a refusal stays, with the text to copy by hand.
  useEffect(() => {
    // Only a successful copy fades.
    if (state !== "ok") return;
    // Back to the button's resting word later.
    const id = window.setTimeout(() => setState("idle"), CONFIRM_MS);
    // A new press, or the line going away, cancels it.
    return () => window.clearTimeout(id);
  }, [state]);

  // A different text (another meeting type, another cat) puts the button back to rest.
  useEffect(() => {
    // The old confirmation or refusal was about the old text.
    setState("idle");
  }, [text]);

  /** Copy the text and say how it went. */
  const onCopy = async () => {
    // The copy, and its outcome.
    setState((await copyText(text)) ? "ok" : "fail");
  };

  // The button's visible word now.
  const word = state === "ok" ? labels.copied : labels.copy;

  return (
    <div className={`toy-share${state === "fail" ? " is-failed" : ""}${className ? ` ${className}` : ""}`}>
      {/* The text, when the toy wants it seen before it is copied. */}
      {preview && <pre className="toy-share-text">{text}</pre>}
      {/* The notes under it. */}
      {notes.map((n, i) => (
        <p key={i} className="toy-share-note">
          {n}
        </p>
      ))}
      {/* The one action. */}
      <button
        type="button"
        className={`toy-share-copy${state === "ok" ? " is-copied" : ""}`}
        onClick={() => void onCopy()}
        // With a subject, the name says which line this button copies; it starts with the visible word.
        aria-label={subject ? `${word}: ${subject}` : undefined}
      >
        {state === "ok" ? (
          // A tick once copied (the same glyph as the site's Share results button).
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          // Two sheets, for copy (the same glyph as the site's Share results button).
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
        {/* The visible word. */}
        <span>{word}</span>
      </button>
      {/* Said politely to a screen reader: the confirmation, or the refusal. Always present, so a change is heard. */}
      <span className="sr-only" role="status" aria-live="polite">
        {state === "ok" ? labels.copied : state === "fail" ? labels.copyFailed : ""}
      </span>
      {/* Refused: the words, and the text in a box to select and copy by hand. */}
      {state === "fail" && (
        <>
          {/* The games' wording. */}
          <p className="toy-share-note">{labels.copyFailed}</p>
          {/* Read-only, selected whole when it takes focus. */}
          <textarea
            className="toy-share-manual"
            readOnly
            value={text}
            rows={Math.min(6, text.split("\n").length + 1)}
            aria-label={labels.copyFailed}
            onFocus={(e) => e.currentTarget.select()}
          />
        </>
      )}
    </div>
  );
}
