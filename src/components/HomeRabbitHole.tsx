"use client";

// ============================================================================
// src/components/HomeRabbitHole.tsx
// ----------------------------------------------------------------------------
// SURPRISE ME (2026-10-05, home page review items 9, 18, 32 and 49). The depth
// of the corpus as entertainment: one button, one random destination among
// 1,700 or so (an obscure company, an unusual tool, an article, a person, a
// strange glossary term, a certification guide), with its kind named so the
// reader knows what they are about to open. Three narrower buttons do the
// same for one kind each ("a useful tool", "something weird", "a forgotten
// company"), the review's own words. The pool is public/home-index.json,
// fetched the first time a button is pressed and never before, so the home
// page pays nothing for the feature until someone wants it. The pick happens
// in the browser; nothing is sent anywhere and nothing is remembered.
// ============================================================================

import { useCallback, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/** One index entry, as gen-home-index writes it. */
interface Entry { k: string; p: string; t: { en: string; "pt-BR"?: string } }

/** The three narrow buttons: a kind each. */
const NARROW: { key: "tool" | "term" | "company"; label: string }[] = [
  { key: "tool", label: "surpriseTool" },
  { key: "term", label: "surpriseWeird" },
  { key: "company", label: "surpriseCompany" },
];

export default function HomeRabbitHole() {
  const t = useTranslations("home.front");
  const locale = useLocale();
  // The pool, loaded on first use.
  const pool = useRef<Entry[] | null>(null);
  // The current pick, and whether a load is in flight.
  const [pick, setPick] = useState<Entry | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  /** Load the pool once, then choose; `kind` narrows the draw. */
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
      if (!candidates.length) return setFailed(true);
      // Never the same pick twice in a row.
      let next = candidates[Math.floor(Math.random() * candidates.length)];
      if (pick && candidates.length > 1 && next.p === pick.p) next = candidates[(candidates.indexOf(next) + 1) % candidates.length];
      setPick(next);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }, [pick]);

  const title = (e: Entry) => (locale === "pt-BR" && e.t["pt-BR"]) || e.t.en;

  return (
    <div className="rabbit">
      <div className="rabbit-actions">
        <button type="button" className="btn btn-primary rabbit-main" onClick={() => draw()} disabled={busy}>{t("surpriseMain")}</button>
        {NARROW.map((n) => (
          <button key={n.key} type="button" className="rabbit-narrow" onClick={() => draw(n.key)} disabled={busy}>{t(n.label)}</button>
        ))}
      </div>
      {/* The pick: its kind, its title, the way in. */}
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
