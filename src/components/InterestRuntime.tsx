"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/InterestRuntime.tsx
// ----------------------------------------------------------------------------
// THE INTEREST COUNTS' ONE PIECE OF PAGE CHROME (PRIME 12/11/2026 02:35), on
// every page through the locale layout. It does two things.
//
// 1. IT ASKS, UNTIL IT HAS AN ANSWER, AND NEVER INSISTS. A small panel at the
//    foot of the window, a few seconds after a page opens: what would be
//    counted, a Yes and a No of equal weight, and a link to the privacy
//    page's account of it. It is not a dialog: it takes no focus, blocks
//    nothing, and the page works the same with it open. The answer is kept
//    in this browser (src/lib/interest/client.ts) and can be changed on the
//    Settings page. A reader who leaves it unanswered is not followed around
//    with it: it goes away when the page is left, and is shown on at most
//    two pages of one visit (MAX_ASKS_PER_LOAD), a count kept in memory only.
//    It never shows when the browser sends Global Privacy Control or Do Not
//    Track (that is already a no), on the private surfaces, or once an
//    answer exists.
//
// 2. IT LISTENS FOR THE COUNTABLE THINGS that the page marks in its HTML, so
//    no tool or article needs code of its own:
//      data-interest-zone="tool_use:tools:<slug>"  the first typing or button
//          press inside the element counts one use, once per page view;
//      data-interest-end="read_end:learn:<slug>"   the element coming into
//          view counts a read to the end, once, and only after the page has
//          been open long enough to have been read (MIN_READ_MS);
//      a followed link to Red Education counts one, named by the kind of page
//          its address says it came from (a click, or a middle click that
//          opens it in a new tab).
//    Every count goes through track(), which sends nothing without a yes.
//
// The strings come from the layout as props (resolved on the server in the
// page's language), so this component adds no message namespace to the page.
// ============================================================================

// React's state, effects and refs.
import { useEffect, useRef, useState } from "react";
// The current path, to start each page view afresh (and next-intl's link for the privacy page).
import { Link, usePathname } from "@/i18n/navigation";
// The choice, the "do not count me" signals, and the one function that sends a count.
import { INTEREST_EVENT, browserSaysNo, readInterestChoice, track, writeInterestChoice, type InterestChoice } from "@/lib/interest/client";
// The lists a marked element's value is checked against.
import { INTEREST_KINDS, INTEREST_SECTIONS, INTEREST_SLUG, type InterestKind, type InterestSection } from "@/lib/interest/shape";

/** The panel's strings, in the page's language. */
export interface InterestLabels {
  /** The question. */
  title: string;
  /** What would be counted, and what never is. */
  body: string;
  /** The yes button. */
  yes: string;
  /** The no button. */
  no: string;
  /** The link to the privacy page's section. */
  more: string;
}

/** How long after a page opens the question appears, in milliseconds: after the page has settled, never as its first paint. */
const ASK_AFTER_MS = 3500;
/** How long a page must have been open before reaching its end counts as a read, in milliseconds. */
const MIN_READ_MS = 20000;
/** Red Education's host, as its links are written (src/config/redEducation.ts). */
const RED_HOST = /(^|\.)rededucation\.com$/i;
/** The private surfaces, which never ask and never count. */
const PRIVATE_PATH = /^\/(admin1029384756|copy8825140637)(\/|$)/;
/** How many pages of one visit (one load of the site in this tab) may show the unanswered question. */
const MAX_ASKS_PER_LOAD = 2;
/** How many pages have shown it since the site was loaded in this tab; in memory only, gone with the tab. */
let asksThisLoad = 0;
/** What counts as working with a tool when clicked: a control of the tool, not a stretch of text and not a link out of it. */
const CONTROL = "button, input, select, textarea, [role='button'], [role='switch'], [role='tab'], [contenteditable='true']";

/**
 * Read a marked element's value, "kind:section:item", against the lists.
 *
 * @param value the attribute's value
 * @returns the three parts, or null when the value names nothing countable
 */
function parseMark(value: string | null): { kind: InterestKind; section: InterestSection; item: string } | null {
  // Three parts.
  const [k, s, i] = (value ?? "").split(":");
  // Each from its list.
  if (!(INTEREST_KINDS as readonly string[]).includes(k ?? "")) return null;
  if (!(INTEREST_SECTIONS as readonly string[]).includes(s ?? "")) return null;
  if (!INTEREST_SLUG.test(i ?? "")) return null;
  // Typed.
  return { kind: k as InterestKind, section: s as InterestSection, item: i as string };
}

/**
 * The question, and the listeners. Renders nothing except while the question is open.
 *
 * @param props the panel's strings
 * @returns the panel, or null
 */
export default function InterestRuntime(props: { labels: InterestLabels }) {
  // The current path without its language.
  const pathname = usePathname();
  // The choice: undefined until read after mount (so the server and the first render agree on "nothing shown").
  const [choice, setChoice] = useState<InterestChoice | undefined>(undefined);
  // Whether the question is open.
  const [asking, setAsking] = useState(false);
  // What this page view has already counted (zones and ends count once per view).
  const seen = useRef<Set<string>>(new Set());
  // When this page view began, for the read-to-the-end rule.
  const viewStart = useRef(0);

  // The choice, read once after mount and followed when it changes (the Settings switch, another tab).
  useEffect(() => {
    // The stored answer.
    setChoice(readInterestChoice());
    // A change made on this page.
    const onChange = () => setChoice(readInterestChoice());
    // A change made in another tab.
    const onStorage = (e: StorageEvent) => { if (e.key === null || e.key.startsWith("ronutz:interest")) setChoice(readInterestChoice()); };
    // Listening.
    window.addEventListener(INTEREST_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    // Stopped.
    return () => { window.removeEventListener(INTEREST_EVENT, onChange); window.removeEventListener("storage", onStorage); };
  }, []);

  // The question: only where no answer exists, the browser has not already said no, and the page is a public one.
  useEffect(() => {
    // A new page starts without the question: an unanswered one does not travel with the reader.
    setAsking(false);
    // Answered, not read yet, a "do not count me" browser, a private surface, or shown often enough: nothing to ask.
    if (choice !== null || browserSaysNo() || PRIVATE_PATH.test(pathname) || asksThisLoad >= MAX_ASKS_PER_LOAD) return;
    // After the page has settled: shown, and counted as one of this visit's showings.
    const timer = window.setTimeout(() => { asksThisLoad += 1; setAsking(true); }, ASK_AFTER_MS);
    // Not if the page is left first.
    return () => window.clearTimeout(timer);
  }, [choice, pathname]);

  // Each page view starts afresh: nothing counted yet, and its clock at zero.
  useEffect(() => {
    // Forgotten.
    seen.current = new Set();
    // Now.
    viewStart.current = performance.now();
  }, [pathname]);

  // Working with a marked zone, and following a link to Red Education: two listeners on the document.
  useEffect(() => {
    // Private surfaces are never counted.
    if (PRIVATE_PATH.test(pathname)) return;
    // Count a marked zone once per page view.
    const countZone = (target: EventTarget | null) => {
      // The element acted on.
      const el = target instanceof Element ? target : null;
      // Its marked zone, if it sits in one.
      const zone = el?.closest("[data-interest-zone]");
      if (!zone) return;
      // What the zone names.
      const mark = parseMark(zone.getAttribute("data-interest-zone"));
      if (!mark) return;
      // Once per page view.
      const key = `${mark.kind}:${mark.section}:${mark.item}`;
      if (seen.current.has(key)) return;
      seen.current.add(key);
      // Counted (track sends nothing without a yes).
      track(mark.kind, mark.section, mark.item);
    };
    // Typing or changing a field inside a zone is working with it.
    const onInput = (e: Event) => countZone(e.target);
    // A followed link to Red Education is counted wherever it is on the page.
    const countLink = (target: EventTarget | null) => {
      // The link clicked, if the click landed in one.
      const a = target instanceof Element ? target.closest("a[href]") : null;
      if (!(a instanceof HTMLAnchorElement)) return;
      try {
        // Its address.
        const to = new URL(a.href);
        // Only Red Education's.
        if (!RED_HOST.test(to.hostname)) return;
        // The kind of page the link says it came from: the first part of utm_content (src/config/redEducation.ts).
        const from = (to.searchParams.get("utm_content") ?? "").split("/")[0].toLowerCase();
        // Counted under that name, or "link" when the address says nothing usable.
        track("out_red", "site", INTEREST_SLUG.test(from) ? from : "link");
      } catch {
        /* an address that cannot be read is not counted */
      }
    };
    // A click counts as working with a tool when it lands on one of its controls; and it may be on a link out.
    const onClick = (e: MouseEvent) => {
      // The element clicked.
      const el = e.target instanceof Element ? e.target : null;
      if (!el) return;
      // A control inside a zone.
      if (el.closest(CONTROL)) countZone(el);
      // A link out to Red Education.
      countLink(el);
    };
    // A middle click opens a link in a new tab without a click event: the same link, counted the same way.
    const onAuxClick = (e: MouseEvent) => { if (e.button === 1) countLink(e.target); };
    // Listening (capture is not needed: these events bubble).
    document.addEventListener("input", onInput);
    document.addEventListener("change", onInput);
    document.addEventListener("click", onClick);
    document.addEventListener("auxclick", onAuxClick);
    // Stopped.
    return () => {
      document.removeEventListener("input", onInput);
      document.removeEventListener("change", onInput);
      document.removeEventListener("click", onClick);
      document.removeEventListener("auxclick", onAuxClick);
    };
  }, [pathname]);

  // Reaching the end of an article or an entry: the marked element coming into view, after long enough on the page.
  useEffect(() => {
    // Private surfaces are never counted, and an old browser without the observer simply does not count this.
    if (PRIVATE_PATH.test(pathname) || typeof IntersectionObserver === "undefined") return;
    // Timers waiting for the page to have been open long enough.
    const timers: number[] = [];
    // The observer: one count per marked end, once per page view.
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        // Only when it comes into view.
        if (!entry.isIntersecting) continue;
        // Its mark.
        const el = entry.target;
        const mark = parseMark(el.getAttribute("data-interest-end"));
        // Watched once.
        io.unobserve(el);
        if (!mark) continue;
        const key = `${mark.kind}:${mark.section}:${mark.item}`;
        if (seen.current.has(key)) continue;
        seen.current.add(key);
        // How much longer until the page has been open long enough to have been read.
        const wait = Math.max(0, MIN_READ_MS - (performance.now() - viewStart.current));
        // Counted then, if the reader is still on the page (the element still in the document) and looking at it (the
        // tab in front): a page left open in a background tab was not read to its end.
        timers.push(window.setTimeout(() => { if (el.isConnected && document.visibilityState === "visible") track(mark.kind, mark.section, mark.item); }, wait));
      }
    });
    // The page's marked ends, found after the page's own content has rendered.
    const start = window.setTimeout(() => {
      document.querySelectorAll("[data-interest-end]").forEach((el) => io.observe(el));
    }, 0);
    // Stopped when the page is left.
    return () => {
      window.clearTimeout(start);
      timers.forEach((t) => window.clearTimeout(t));
      io.disconnect();
    };
  }, [pathname]);

  // Answer the question.
  const answer = (c: "yes" | "no") => {
    // Kept, and the page's other parts told.
    writeInterestChoice(c);
    // Closed.
    setAsking(false);
    setChoice(c);
  };

  // Nothing to show.
  if (!asking) return null;

  // The question: a region, not a dialog (no focus taken, nothing blocked).
  return (
    <section className="interest-ask" role="region" aria-label={props.labels.title} data-pagefind-ignore>
      <p className="interest-ask-title">{props.labels.title}</p>
      <p className="interest-ask-body">
        {props.labels.body}{" "}
        <Link href="/privacy#interest" className="interest-ask-more">
          {props.labels.more}
        </Link>
      </p>
      {/* Two buttons of the same size and weight: neither answer is the easier one. */}
      <div className="interest-ask-actions">
        <button type="button" className="interest-ask-btn" onClick={() => answer("yes")}>
          {props.labels.yes}
        </button>
        <button type="button" className="interest-ask-btn" onClick={() => answer("no")}>
          {props.labels.no}
        </button>
      </div>
    </section>
  );
}
