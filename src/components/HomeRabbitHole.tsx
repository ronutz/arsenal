"use client";

// ============================================================================
// src/components/HomeRabbitHole.tsx
// ----------------------------------------------------------------------------
// TAKE ME SOMEWHERE (2026-10-05, home page review items 9, 18, 32 and 49;
// PRIME 11:35: "I also liked the TAKE ME SOMEWHERE form"). The depth of the
// corpus as entertainment: one button, one random destination among 1,700 or
// so (an obscure company, an unusual tool, an article, a person, a strange
// glossary term, a certification guide), with its kind named so the reader
// knows what they are about to open, and the choice left to the reader: open
// it, or draw again. Narrower buttons do the same for one kind each: three at
// first ("a useful tool", "something weird", "a forgotten company", the
// review's own words), eight since 2026-10-06 (PRIME 16:39: "a forgotten
// company" can read as an insult to the contemporary companies it draws, so it
// became "a company with a story"; and one pill for every kind in the pool,
// The Roles and The Practice joining the pool that day). The pool is
// public/home-index.json, fetched the first time a draw is
// asked for and never before, so the home page pays nothing for the feature
// until someone wants it. The sixth intent card at the top of the page asks
// for a draw through the "ronutz:surprise" event and scrolls here, so the
// column already shows a destination when the reader arrives (PRIME 03:10 and
// 11:03). The pick happens in the browser; nothing is sent anywhere and
// nothing is remembered.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/** One index entry, as gen-home-index writes it. */
interface Entry { k: string; p: string; t: { en: string; "pt-BR"?: string } }

/** The kinds the pool holds (gen-home-index), each with its narrow button. */
type Kind = "tool" | "term" | "company" | "person" | "article" | "guide" | "role" | "practice";

/** The narrow buttons: a kind each, in the order a curious reader scans them (the three originals first). The labels
 *  live under home.front (surprise*), the badge names under home.front.kind. */
const NARROW: { key: Kind; label: string }[] = [
  { key: "tool", label: "surpriseTool" },
  { key: "term", label: "surpriseWeird" },
  { key: "company", label: "surpriseCompany" },
  { key: "person", label: "surprisePerson" },
  { key: "article", label: "surpriseArticle" },
  { key: "guide", label: "surpriseGuide" },
  { key: "role", label: "surpriseRole" },
  { key: "practice", label: "surprisePractice" },
];

/** The event the intent card dispatches to ask for a draw (bubbles from the document). */
export const SURPRISE_EVENT = "ronutz:surprise";

export default function HomeRabbitHole() {
  const t = useTranslations("home.front");
  const locale = useLocale();
  // The pool, loaded on first use.
  const pool = useRef<Entry[] | null>(null);
  // The current pick, and whether a load is in flight.
  const [pick, setPick] = useState<Entry | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  // The latest pick, readable from the event handler without re-subscribing on every change.
  const last = useRef<Entry | null>(null);
  // The component's root, to find the column it sits in (the column is server-rendered by the page).
  const root = useRef<HTMLDivElement>(null);

  /** Load the pool once, then choose; `kind` narrows the draw; never the same pick twice in a row. */
  const draw = useCallback(async (kind?: string) => {
    setBusy(true);
    setFailed(false);
    try {
      if (!pool.current) {
        const res = await fetch("/home-index.json");
        const data = (await res.json()) as { entries?: Entry[] };
        pool.current = Array.isArray(data.entries) ? data.entries : [];
      }
      const candidates = kind ? pool.current.filter((e) => e.k === kind) : pool.current;
      if (!candidates.length) { setFailed(true); return; }
      let next = candidates[Math.floor(Math.random() * candidates.length)];
      const prev = last.current;
      if (prev && candidates.length > 1 && next.p === prev.p) next = candidates[(candidates.indexOf(next) + 1) % candidates.length];
      last.current = next;
      setPick(next);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }, []);

  // The intent card's request: draw once, so the reader lands on a destination rather than on a button; bring the
  // column into view (its scroll margin clears the sticky header) and restart the arrival pulse, which the :target
  // rule alone cannot do twice (the fragment does not change on a repeat click).
  useEffect(() => {
    const onAsk = () => {
      void draw();
      const col = root.current?.closest<HTMLElement>(".happening-col--surprise");
      if (!col) return;
      col.scrollIntoView({ block: "start" });
      // Drop the class, flush styles, add it back: the animation starts over.
      col.classList.remove("is-arriving");
      void col.offsetWidth;
      col.classList.add("is-arriving");
    };
    document.addEventListener(SURPRISE_EVENT, onAsk);
    return () => document.removeEventListener(SURPRISE_EVENT, onAsk);
  }, [draw]);

  /** The title in the reader's locale, falling back to English. */
  const title = (e: Entry) => (locale === "pt-BR" && e.t["pt-BR"]) || e.t.en;

  return (
    <div className="rabbit" ref={root}>
      <div className="rabbit-actions">
        <button type="button" className="btn btn-primary rabbit-main" onClick={() => void draw()} disabled={busy}>{pick ? t("surpriseAgain") : t("surpriseMain")}</button>
        {NARROW.map((n) => (
          <button key={n.key} type="button" className="rabbit-narrow" onClick={() => void draw(n.key)} disabled={busy}>{t(n.label)}</button>
        ))}
      </div>
      {/* The pick: its kind, its title, the way in; the reader chooses to open it or to draw again. */}
      {pick && (
        <p className="rabbit-pick" aria-live="polite">
          <span className={`happening-kind happening-kind--${pick.k}`}>{t(`kind.${pick.k}`)}</span>
          <Link href={pick.p} className="rabbit-link">{title(pick)} <span aria-hidden="true">&#8594;</span></Link>
        </p>
      )}
      {failed && <p className="happening-note">{t("surpriseFailed")}</p>}
    </div>
  );
}
