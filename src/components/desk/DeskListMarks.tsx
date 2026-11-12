"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/desk/DeskListMarks.tsx
// ----------------------------------------------------------------------------
// SAVED AND READ, ON THE INDEX PAGES (PLAN-personal-desk-20261112, sections 3.9
// and 4: "indicators on list pages added after paint without moving the
// layout"). On the Learn, Tools and Glossary index pages, each card of an item
// the reader saved or marked read (done, for a tool) gets a small label on its
// top edge: "★ Saved", "✓ Read" or "✓ Done", a sign and the word, never colour
// alone. The labels are placed after the page has painted, absolutely, over
// the card's top border, so nothing on the page moves and nothing under them
// is covered (the label straddles the border and the card's own padding);
// they ignore the pointer, so the card's link works through them.
//
// Light by design: these pages are among the site's largest, so this reads
// the stored desk's text itself (ronutz:desk:v1, the same key the store
// writes) and takes only its saved and read maps, without loading the store.
// It follows changes made in other tabs (the storage event). It writes
// nothing and sends nothing. The words come from the page, as props.
// ============================================================================

// React's effect.
import { useEffect } from "react";

/** The desk's key (src/lib/desk/store.ts, DESK_KEY), read here without the store. */
const DESK_KEY = "ronutz:desk:v1";

/** The kind of item a page's links name, by the first segment of their address. */
const KIND_OF: Record<string, "tool" | "learn" | "term"> = { tools: "tool", learn: "learn", glossary: "term" };

/** An item page's address: an optional locale, the section, the slug, an optional trailing slash. */
const ITEM_HREF = /^(?:\/[A-Za-z]{2}(?:-[A-Za-z]{2,4})?)?\/(tools|learn|glossary)\/([a-z0-9][a-z0-9-]{0,95})\/?(?:[?#].*)?$/;

/** The words of the labels. */
export interface ListMarkLabels {
  /** "Saved". */
  saved: string;
  /** "Read". */
  read: string;
  /** "Done" (a tool). */
  done: string;
}

/**
 * The saved and read maps of the stored desk, or empty ones.
 *
 * @returns the two sets of identifiers
 */
function readMarks(): { saved: Set<string>; read: Set<string> } {
  // Storage can refuse, the text can be malformed.
  try {
    // The stored text.
    const raw = window.localStorage.getItem(DESK_KEY);
    // Parsed loosely: only the two maps' keys are used.
    const d = raw ? (JSON.parse(raw) as { saved?: unknown; read?: unknown }) : {};
    // A map's keys, when it is an object.
    const keys = (m: unknown) => new Set(m && typeof m === "object" && !Array.isArray(m) ? Object.keys(m as object) : []);
    // Both.
    return { saved: keys(d.saved), read: keys(d.read) };
  } catch {
    // Nothing.
    return { saved: new Set(), read: new Set() };
  }
}

/**
 * Put or update the label on one card.
 *
 * @param card the card element
 * @param chips the label's parts: sign and word each, or none to take the label off
 */
function markCard(card: HTMLElement, chips: [string, string][]): void {
  // The label already there, if any.
  const old = card.querySelector<HTMLElement>(":scope > .desk-mark");
  // Nothing to say: the label goes.
  if (chips.length === 0) {
    // Removed.
    old?.remove();
    // The card back as it was.
    card.classList.remove("desk-marked");
    // Done.
    return;
  }
  // Its text, to skip a label that already says this.
  const text = chips.map((c) => c.join(" ")).join(" · ");
  // Unchanged.
  if (old?.dataset.text === text) return;
  // A new label.
  const mark = document.createElement("span");
  // Its class.
  mark.className = "desk-mark";
  // Remembered.
  mark.dataset.text = text;
  // Each part: the sign hidden from assistive technology, the word read.
  for (const [sign, word] of chips) {
    // The part.
    const chip = document.createElement("span");
    // Its class.
    chip.className = "desk-mark-chip";
    // The sign.
    const s = document.createElement("span");
    // Not read aloud: the word says it.
    s.setAttribute("aria-hidden", "true");
    // The sign's text.
    s.textContent = sign;
    // Sign, space, word.
    chip.append(s, ` ${word}`);
    // Added.
    mark.append(chip);
  }
  // Replaced or added.
  if (old) old.replaceWith(mark); else card.append(mark);
  // The card positions it.
  card.classList.add("desk-marked");
}

/**
 * The markers.
 *
 * @param props the selector of the page's cards (each holding one item link) and the labels' words
 * @returns nothing (it decorates the cards the server drew)
 */
export default function DeskListMarks(props: { selector: string; labels: ListMarkLabels }) {
  // After paint: label the cards, and again after a change in another tab.
  useEffect(() => {
    /** Label every card of the page from the stored desk. */
    const apply = () => {
      // The reader's marks.
      const { saved, read } = readMarks();
      // Nothing saved or read, and nothing labelled yet: nothing to do.
      if (saved.size === 0 && read.size === 0 && !document.querySelector(".desk-mark")) return;
      // Each card.
      for (const card of document.querySelectorAll<HTMLElement>(props.selector)) {
        // Its item link.
        const href = card.querySelector("a[href]")?.getAttribute("href") ?? "";
        // The item it names.
        const m = ITEM_HREF.exec(href);
        // Not an item: left alone.
        if (!m) continue;
        // Its identifier.
        const id = `${KIND_OF[m[1]]}:${m[2]}`;
        // The label's parts.
        const chips: [string, string][] = [];
        // Saved.
        if (saved.has(id)) chips.push(["★", props.labels.saved]);
        // Read (done, for a tool).
        if (read.has(id)) chips.push(["✓", m[1] === "tools" ? props.labels.done : props.labels.read]);
        // Labelled.
        markCard(card, chips);
      }
    };
    // Whether the browser has an idle callback (Safari before 18 has none).
    const idle = typeof window.requestIdleCallback === "function";
    // Once the page is idle after paint, or on the next turn where there is no idle callback.
    const handle = idle ? window.requestIdleCallback(apply) : window.setTimeout(apply, 0);
    // Another tab's change to the desk.
    const onStorage = (e: StorageEvent) => { if (e.key === null || e.key === DESK_KEY) apply(); };
    // Listening.
    window.addEventListener("storage", onStorage);
    // Stopped when the page is left.
    return () => {
      // Not listening.
      window.removeEventListener("storage", onStorage);
      // The pending call cancelled.
      if (idle) window.cancelIdleCallback(handle); else window.clearTimeout(handle);
    };
  }, [props.selector, props.labels]);
  // Nothing drawn by React.
  return null;
}
