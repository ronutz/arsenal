"use client";

// ============================================================================
// src/components/SlidePresenter.tsx
// ----------------------------------------------------------------------------
// PRESENT THE SLIDES IN THE BROWSER (milestone (m2), 2026-10-06). PRIME, 19:21:
// "Can we allow presenting the slides on the site through the browser, without
// the need to download? With, at least, controls for full screen, next and
// previous slide, and alike."
//
// What the reader gets, and why each piece is there:
//   - ONE SLIDE AT A TIME, as an image rendered once from the course's own PDF
//     at 1920 x 1080 (sharp on a 1080p projector); the next and the previous
//     slide are fetched ahead, so moving feels instant. No viewer library, no
//     plug-in, nothing sent anywhere: the images are static files.
//   - THE CONTROLS PRIME ASKED FOR, AND THEIR KEYS: previous and next (arrows,
//     PageUp/PageDown, Space and Shift+Space), first and last (Home, End), full
//     screen (F; Esc leaves it), a counter with a go-to field, a progress bar.
//     On a phone, a swipe moves; on a computer, a click on the slide advances.
//   - FULL SCREEN that works everywhere: the Fullscreen API where the browser
//     has it, and where it does not (an iPhone's Safari has no element full
//     screen) the presenter covers the window instead. In full screen the
//     controls step aside after a few seconds without a mouse movement.
//   - CONTENTS: every slide by title, grouped by the course's own parts, one
//     click to jump (C opens it).
//   - NOTES: the slide's own speaker notes (N), fetched once per language from
//     the deck manifest only when first asked for, because they are where this
//     course carries its teaching (PRIME, 13:36: "complete with informative
//     slide notes").
//   - BOTH LANGUAGES: the decks share their slides, so the deck's language is a
//     switch, independent of the page's.
//   - AN ADDRESS PER SLIDE: #slide-12 (and ?deck=pt-BR when the deck is not the
//     page's language), read on arrival and kept current without adding history
//     entries, so a teacher can send a student straight to a slide.
// Every string comes in as props from the page (the "materials" namespace), so
// this client component needs no message namespace of its own.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** One language's deck: its slide titles (index 0 is slide 1), where its images live, and its manifest. */
export interface PresenterDeck {
  /** The deck's language code ("en", "pt-BR"). */
  lang: string;
  /** The language's name in its own words, for the switch ("English", "Português"). */
  label: string;
  /** Every slide's title, in deck order. */
  titles: string[];
  /** The images' folder, ending in a slash: an image is `${imageBase}${NNN}.webp`. */
  imageBase: string;
  /** The deck manifest (titles and notes), fetched when the notes are first opened. */
  manifest: string;
}

/** One part of the course, as the contents panel groups the slides. */
export interface PresenterPart {
  /** The part's number in the course (1 to 10). */
  n: number;
  /** The module it belongs to. */
  module: number;
  /** Its title in the page's language. */
  title: string;
  /** Its first and last slide, inclusive. */
  start: number;
  end: number;
}

/** Every word the presenter shows, resolved by the page; templates keep their {placeholders}. */
export interface PresenterLabels {
  /** The region's accessible name ("Slides of TCP/IP: Concepts and IP Routing"). */
  region: string;
  previous: string;
  next: string;
  /** "{n} / {total}", the counter. */
  counter: string;
  /** "Slide {n} of {total}: {title}", announced on every move. */
  announce: string;
  /** The go-to field's label and its button. */
  goTo: string;
  goButton: string;
  contents: string;
  notes: string;
  fullscreen: string;
  exitFullscreen: string;
  /** The deck-language switch's label ("Slides in"). */
  deckLanguage: string;
  /** Contents: the frame around the parts, the module heading, the part heading. */
  opening: string;
  closing: string;
  /** "Module {n}". */
  module: string;
  /** "Part {n}". */
  part: string;
  /** "Slides {start} to {end}". */
  partRange: string;
  /** The notes panel's heading, and its loading, error and empty states. */
  notesTitle: string;
  notesLoading: string;
  notesError: string;
  notesEmpty: string;
}

/** Fill a template's {name} placeholders. */
const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (whole, key: string) => (key in values ? String(values[key]) : whole));

/** A slide number as the image file names it: 1 -> "001". */
const pad3 = (n: number) => String(n).padStart(3, "0");

/** How long the controls stay after the last movement in full screen, in milliseconds. */
const IDLE_MS = 2800;

/** How far a finger has to travel sideways to count as a swipe, in CSS pixels. */
const SWIPE_PX = 48;

/** The Fullscreen API with the WebKit prefix Safari on iPad still uses, typed once. */
type FsDocument = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void>; webkitFullscreenEnabled?: boolean };
type FsElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };

export default function SlidePresenter({
  decks,
  initialLang,
  parts,
  width,
  height,
  labels,
}: {
  /** The decks, one per language, all with the same slide count. */
  decks: PresenterDeck[];
  /** The deck shown first: the page's language when a deck exists in it. */
  initialLang: string;
  /** The course's parts, in order. */
  parts: PresenterPart[];
  /** The images' pixel size (every slide alike). */
  width: number;
  height: number;
  labels: PresenterLabels;
}) {
  // The slide count, from the first deck (the guard proves every deck has the same).
  const total = decks[0].titles.length;
  // The deck shown, and its record.
  const [lang, setLang] = useState(initialLang);
  const deck = decks.find((d) => d.lang === lang) ?? decks[0];
  // The slide shown, counted from 0.
  const [index, setIndex] = useState(0);
  // The two panels.
  const [contentsOpen, setContentsOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  // Full screen: true in either form; `pseudo` when the window is covered instead (no Fullscreen API).
  const [fullscreen, setFullscreen] = useState(false);
  const [pseudo, setPseudo] = useState(false);
  // In full screen, whether the controls have stepped aside.
  const [idle, setIdle] = useState(false);
  // The notes per deck language: the paragraphs of every slide, or the fetch's state.
  const [notes, setNotes] = useState<Record<string, string[][] | "loading" | "error">>({});
  // The go-to field's text.
  const [goText, setGoText] = useState("");
  // The presenter's root (full screen is asked of it), and the current entry of the contents list.
  const rootRef = useRef<HTMLDivElement>(null);
  const currentItemRef = useRef<HTMLButtonElement>(null);
  // Whether the address has been read; until then it is not written, or the first write would erase the slide asked for.
  const [addressRead, setAddressRead] = useState(false);
  // Where a pointer went down on the slide, for swipes and clicks.
  const downAt = useRef<{ x: number; y: number; type: string } | null>(null);

  /** Move to a slide, counted from 0, kept inside the deck. */
  const go = useCallback((i: number) => setIndex(Math.min(total - 1, Math.max(0, i))), [total]);
  /** One slide on, one slide back (functional, so a key handler never moves from a stale slide). */
  const next = useCallback(() => setIndex((i) => Math.min(total - 1, i + 1)), [total]);
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  /** The image of a slide in the deck shown. */
  const src = useCallback((i: number) => `${deck.imageBase}${pad3(i + 1)}.webp`, [deck.imageBase]);

  // ---- The address: read once on arrival, then kept in step ----
  useEffect(() => {
    // #slide-N picks the slide; ?deck= picks the deck when it names one that exists.
    const m = /^#slide-(\d+)$/.exec(window.location.hash);
    if (m) go(Number(m[1]) - 1);
    const asked = new URLSearchParams(window.location.search).get("deck");
    if (asked && decks.some((d) => d.lang === asked)) setLang(asked);
    setAddressRead(true);
  }, [decks, go]);
  useEffect(() => {
    // A link to another slide pasted into this tab, or the browser's own navigation inside the page.
    const onHash = () => {
      const m = /^#slide-(\d+)$/.exec(window.location.hash);
      if (m) go(Number(m[1]) - 1);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [go]);
  useEffect(() => {
    // Not before the arrival address is in.
    if (!addressRead) return;
    const url = new URL(window.location.href);
    url.hash = `slide-${index + 1}`;
    // The deck appears in the address only when it is not the page's own language.
    if (lang !== initialLang) url.searchParams.set("deck", lang);
    else url.searchParams.delete("deck");
    window.history.replaceState(window.history.state, "", url);
  }, [index, lang, initialLang, addressRead]);

  // ---- The neighbours, fetched ahead so the next move shows at once ----
  useEffect(() => {
    for (const i of [index + 1, index - 1, index + 2]) {
      if (i >= 0 && i < total) {
        // An Image object is enough: the browser keeps the response for the <img> that asks next.
        const img = new Image();
        img.src = src(i);
      }
    }
  }, [index, total, src]);

  // ---- The notes, fetched once per language, only when first opened ----
  useEffect(() => {
    if (!notesOpen || notes[lang]) return;
    setNotes((n) => ({ ...n, [lang]: "loading" }));
    fetch(deck.manifest)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: { slides: { n: number; notes: string[] }[] }) => setNotes((n) => ({ ...n, [lang]: j.slides.map((s) => s.notes) })))
      .catch(() => setNotes((n) => ({ ...n, [lang]: "error" })));
  }, [notesOpen, lang, deck.manifest, notes]);

  // ---- Full screen ----
  /** Whether the browser can put an element in full screen. */
  const apiAvailable = () => {
    const d = document as FsDocument;
    return Boolean(d.fullscreenEnabled || d.webkitFullscreenEnabled);
  };
  /** Enter or leave full screen, by the API where it exists and by covering the window where it does not. */
  const toggleFullscreen = useCallback(() => {
    const d = document as FsDocument;
    const el = rootRef.current as FsElement | null;
    if (!el) return;
    // Leaving: whichever form is in use.
    if (d.fullscreenElement || d.webkitFullscreenElement) {
      (d.exitFullscreen ? d.exitFullscreen() : d.webkitExitFullscreen?.())?.catch(() => undefined);
      return;
    }
    if (pseudo) {
      setPseudo(false);
      setFullscreen(false);
      return;
    }
    // Entering: the API first, the cover where there is none (or where the request is refused or throws).
    const cover = () => {
      setPseudo(true);
      setFullscreen(true);
    };
    if (!apiAvailable()) {
      cover();
      return;
    }
    try {
      const ask = el.requestFullscreen ? el.requestFullscreen() : el.webkitRequestFullscreen?.();
      Promise.resolve(ask).catch(cover);
    } catch {
      cover();
    }
  }, [pseudo]);
  useEffect(() => {
    // The API's own state is the truth for the real full screen (Esc and the browser's controls leave it too).
    const onChange = () => {
      const d = document as FsDocument;
      setFullscreen(Boolean(d.fullscreenElement || d.webkitFullscreenElement));
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);
  useEffect(() => {
    // Covering the window: the page behind must not scroll.
    document.documentElement.classList.toggle("presenter-covering", pseudo);
    return () => document.documentElement.classList.remove("presenter-covering");
  }, [pseudo]);

  // ---- In full screen, the controls step aside when the pointer rests ----
  useEffect(() => {
    if (!fullscreen) {
      setIdle(false);
      return;
    }
    let timer = window.setTimeout(() => setIdle(true), IDLE_MS);
    // Any movement, touch or key brings them back and restarts the wait.
    const wake = () => {
      setIdle(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setIdle(true), IDLE_MS);
    };
    window.addEventListener("pointermove", wake);
    window.addEventListener("pointerdown", wake);
    window.addEventListener("keydown", wake);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointermove", wake);
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
    };
  }, [fullscreen]);

  // ---- The keys ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Shortcuts belong to the browser and the system.
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName ?? "";
      // Typing in a field is typing, not presenting.
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t?.isContentEditable) return;
      // On a button or a link, Space and Enter press it; the arrows still move.
      const onControl = tag === "BUTTON" || tag === "A";
      switch (e.key) {
        case "ArrowRight":
        case "PageDown":
          e.preventDefault();
          next();
          break;
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          prev();
          break;
        case " ":
          if (onControl) return;
          e.preventDefault();
          if (e.shiftKey) prev();
          else next();
          break;
        case "Home":
          e.preventDefault();
          go(0);
          break;
        case "End":
          e.preventDefault();
          go(total - 1);
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "n":
        case "N":
          e.preventDefault();
          setNotesOpen((o) => !o);
          break;
        case "c":
        case "C":
          e.preventDefault();
          setContentsOpen((o) => !o);
          break;
        case "Escape":
          // Esc closes the contents first; in the covering form it also leaves (the API handles its own Esc).
          if (contentsOpen) setContentsOpen(false);
          else if (pseudo) {
            setPseudo(false);
            setFullscreen(false);
          }
          break;
        default:
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, go, total, toggleFullscreen, contentsOpen, pseudo]);

  // ---- The contents: the current entry scrolled into view when the panel opens ----
  useEffect(() => {
    if (contentsOpen) currentItemRef.current?.scrollIntoView({ block: "nearest" });
  }, [contentsOpen, index]);

  // The part the current slide belongs to (none for the opening and closing slides).
  const n = index + 1;
  const part = parts.find((p) => n >= p.start && n <= p.end) ?? null;
  // The contents, grouped: the opening, each module's parts, the closing.
  const groups = useMemo(() => {
    const first = parts.length ? parts[0].start : total + 1;
    const last = parts.length ? parts[parts.length - 1].end : 0;
    const range = (a: number, b: number) => Array.from({ length: Math.max(0, b - a + 1) }, (_, k) => a + k);
    return {
      opening: range(1, first - 1),
      modules: [...new Set(parts.map((p) => p.module))].map((mod) => ({ mod, parts: parts.filter((p) => p.module === mod) })),
      closing: range(last + 1, total),
      range,
    };
  }, [parts, total]);
  // The current slide's notes, or the state of their fetch.
  const deckNotes = notes[lang];
  const slideNotes = Array.isArray(deckNotes) ? deckNotes[index] ?? [] : null;

  /** One entry of the contents list. Its id is the slide's address (#slide-N), so every address the presenter writes,
   *  and every link to one (the datasheet's parts), names an element that exists in the page, script or no script. */
  const entry = (s: number) => (
    <li key={s} id={`slide-${s}`}>
      <button
        type="button"
        className={`presenter-contents-slide${s === n ? " is-current" : ""}`}
        aria-current={s === n ? "true" : undefined}
        ref={s === n ? currentItemRef : undefined}
        onClick={() => {
          go(s - 1);
          setContentsOpen(false);
        }}
      >
        <span className="presenter-contents-n mono">{s}</span> {deck.titles[s - 1]}
      </button>
    </li>
  );

  return (
    <div
      ref={rootRef}
      className={`presenter${fullscreen ? " is-fullscreen" : ""}${pseudo ? " is-covering" : ""}${idle ? " is-idle" : ""}`}
      role="region"
      aria-label={labels.region}
    >
      {/* The slide. A click advances (a computer's mouse); a sideways swipe moves either way (a finger or a pen). */}
      <div
        className="presenter-stage"
        onPointerDown={(e) => {
          downAt.current = { x: e.clientX, y: e.clientY, type: e.pointerType };
        }}
        onPointerUp={(e) => {
          const d = downAt.current;
          downAt.current = null;
          if (!d) return;
          const dx = e.clientX - d.x;
          const dy = e.clientY - d.y;
          // A swipe: mostly sideways and far enough.
          if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
            if (dx < 0) next();
            else prev();
            return;
          }
          // A click with a mouse, without travel: the next slide.
          if (d.type === "mouse" && Math.abs(dx) < 6 && Math.abs(dy) < 6 && e.button === 0) next();
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={`${lang}-${n}`}
          className="presenter-slide"
          src={src(index)}
          alt={deck.titles[index]}
          width={width}
          height={height}
          decoding="async"
          draggable={false}
        />
      </div>

      {/* The progress through the deck. */}
      <div className="presenter-progress" aria-hidden="true">
        <span className="presenter-progress-fill" style={{ width: `${(n / total) * 100}%` }} />
      </div>

      {/* The controls. */}
      <div className="presenter-bar">
        <div className="presenter-bar-group">
          <button type="button" className="presenter-btn" onClick={prev} disabled={index === 0} aria-label={labels.previous} title={`${labels.previous} (←)`}>
            <span aria-hidden="true">‹</span> <span className="presenter-btn-word">{labels.previous}</span>
          </button>
          <span className="presenter-count mono" aria-hidden="true">{fill(labels.counter, { n, total })}</span>
          <button type="button" className="presenter-btn presenter-btn--next" onClick={next} disabled={index === total - 1} aria-label={labels.next} title={`${labels.next} (→)`}>
            <span className="presenter-btn-word">{labels.next}</span> <span aria-hidden="true">›</span>
          </button>
        </div>
        {/* Go to a slide by its number. */}
        <form
          className="presenter-goto"
          onSubmit={(e) => {
            e.preventDefault();
            const v = Number(goText);
            if (Number.isInteger(v) && v >= 1 && v <= total) go(v - 1);
            setGoText("");
          }}
        >
          <label className="sr-only" htmlFor="presenter-goto-input">{labels.goTo}</label>
          <input
            id="presenter-goto-input"
            className="presenter-goto-input mono"
            type="number"
            inputMode="numeric"
            min={1}
            max={total}
            value={goText}
            placeholder={String(n)}
            onChange={(e) => setGoText(e.target.value)}
          />
          <button type="submit" className="presenter-btn">{labels.goButton}</button>
        </form>
        <div className="presenter-bar-group">
          <button type="button" className="presenter-btn" aria-expanded={contentsOpen} aria-controls="presenter-contents" onClick={() => setContentsOpen((o) => !o)} title={`${labels.contents} (C)`}>
            {labels.contents}
          </button>
          <button type="button" className="presenter-btn" aria-pressed={notesOpen} onClick={() => setNotesOpen((o) => !o)} title={`${labels.notes} (N)`}>
            {labels.notes}
          </button>
          {/* The deck's language, when there is more than one deck. */}
          {decks.length > 1 && (
            <span className="presenter-langs" role="group" aria-label={labels.deckLanguage}>
              {decks.map((d) => (
                <button key={d.lang} type="button" className="presenter-lang" aria-pressed={d.lang === lang} onClick={() => setLang(d.lang)} lang={d.lang}>
                  {d.label}
                </button>
              ))}
            </span>
          )}
          <button type="button" className="presenter-btn presenter-btn--fs" aria-pressed={fullscreen} onClick={toggleFullscreen} title={`${fullscreen ? labels.exitFullscreen : labels.fullscreen} (F)`}>
            {fullscreen ? labels.exitFullscreen : labels.fullscreen}
          </button>
        </div>
      </div>

      {/* Where the slide sits in the course. */}
      {part && (
        <p className="presenter-where">
          {fill(labels.part, { n: part.n })} · {part.title}
        </p>
      )}

      {/* The contents: every slide by title, grouped as the course is. Kept in the document while closed. */}
      <nav id="presenter-contents" className="presenter-contents" aria-label={labels.contents} hidden={!contentsOpen}>
        {groups.opening.length > 0 && (
          <div className="presenter-contents-group">
            <p className="presenter-contents-head">{labels.opening}</p>
            <ol className="presenter-contents-list">{groups.opening.map(entry)}</ol>
          </div>
        )}
        {groups.modules.map(({ mod, parts: modParts }) => (
          <div className="presenter-contents-group" key={mod}>
            <p className="presenter-contents-module">{fill(labels.module, { n: mod })}</p>
            {modParts.map((p) => (
              <div key={p.n} className="presenter-contents-part">
                <p className="presenter-contents-head">
                  {fill(labels.part, { n: p.n })} · {p.title}{" "}
                  <span className="presenter-contents-range mono">{fill(labels.partRange, { start: p.start, end: p.end })}</span>
                </p>
                <ol className="presenter-contents-list">{groups.range(p.start, p.end).map(entry)}</ol>
              </div>
            ))}
          </div>
        ))}
        {groups.closing.length > 0 && (
          <div className="presenter-contents-group">
            <p className="presenter-contents-head">{labels.closing}</p>
            <ol className="presenter-contents-list">{groups.closing.map(entry)}</ol>
          </div>
        )}
      </nav>

      {/* The speaker notes of the slide shown. */}
      {notesOpen && (
        <section className="presenter-notes" aria-label={labels.notesTitle} lang={lang}>
          <p className="presenter-notes-title">{labels.notesTitle}</p>
          {deckNotes === "loading" || deckNotes === undefined ? (
            <p className="presenter-notes-state">{labels.notesLoading}</p>
          ) : deckNotes === "error" ? (
            <p className="presenter-notes-state">{labels.notesError}</p>
          ) : slideNotes && slideNotes.length > 0 ? (
            slideNotes.map((para, i) => <p key={i} className="presenter-notes-para">{para}</p>)
          ) : (
            <p className="presenter-notes-state">{labels.notesEmpty}</p>
          )}
        </section>
      )}

      {/* Every move, said once, politely. */}
      <p className="sr-only" aria-live="polite">
        {fill(labels.announce, { n, total, title: deck.titles[index] })}
      </p>
    </div>
  );
}
