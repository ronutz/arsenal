"use client";

// ============================================================================
// src/components/NotFoundClient.tsx
// ----------------------------------------------------------------------------
// The interactive half of the 404 page. Renders inside the root not-found
// (which is outside the locale provider), so it takes its data as props and
// resolves locale + the requested path from window.location at runtime:
//   - fills in the real requested path (GET ... 404),
//   - cycles an authentic Amiga Guru Meditation alert through variations,
//   - and picks one tool or article at random from the whole site ("digital
//     randomness"), linking into whatever locale the visitor was already in.
// All copy with apostrophes lives in string data (not JSX text) to keep the
// build's lint happy.
// ============================================================================

import { useEffect, useState } from "react";
import { BOFH_EXCUSES } from "@/content/bofh/excuses";

type PoolItem = { k: "tool" | "learn"; p: string; l: string };

const QUIP = "It's you, not me.";

// Authentic Guru Meditation alerts. Format is #CODE.TASKADDR (8 hex . 8 hex);
// fatal alerts lead with 8. The CPU-trap codes are real (02 bus error, 03
// address error, 04 illegal instruction, 05 divide-by-zero, 0B unimplemented
// opcode); the task addresses use famous hex sentinels and ASCII words — a real
// Amiga touch, e.g. 48454C50 spells "HELP". "Address error" is a fitting 404.
const GURU: { code: string; meaning: string }[] = [
  { code: "00000003.48454C50", meaning: "address error · the address does not exist (task 0x48454C50 = 'HELP')" },
  { code: "00000004.4C4F5354", meaning: "illegal instruction · task 0x4C4F5354 = 'LOST'" },
  { code: "00000005.DEADBEEF", meaning: "divide by zero · task 0xDEADBEEF" },
  { code: "8000000B.CAFEBABE", meaning: "unimplemented opcode (fatal) · task 0xCAFEBABE" },
  { code: "81000005.8BADF00D", meaning: "exec: corrupted memory list · task 0x8BADF00D ('ate bad food')" },
  { code: "00000002.BAADF00D", meaning: "bus error · memory does not exist · 0xBAADF00D" },
];

// A short stack of other famous non-serious errors, accurately attributed.
const CONSOLE_ERRORS: { pre: string; tone: "info" | "warn" | "err"; text: string; dim?: string }[] = [
  { pre: "418", tone: "info", text: "I'm a teapot: the server refuses to brew this page", dim: "RFC 2324" },
  { pre: "!!", tone: "warn", text: "PC LOAD LETTER" },
  { pre: "??", tone: "warn", text: "Keyboard not found. Press F1 to continue." },
  { pre: ">_", tone: "info", text: "These aren't the droids you're looking for." },
  { pre: "!!", tone: "warn", text: "lp0 on fire" },
  { pre: "xx", tone: "err", text: "Segmentation fault (core dumped)" },
  { pre: "??", tone: "warn", text: "Abort, Retry, Fail?" },
];

export default function NotFoundClient({ pool, locales }: { pool: PoolItem[]; locales: string[] }) {
  const [path, setPath] = useState("/\u2026");
  const [locale, setLocale] = useState("en");
  const [guru, setGuru] = useState(0);
  const [pick, setPick] = useState<PoolItem | null>(null);
  const [excuse, setExcuse] = useState<string | null>(null);

  // Resolve path, locale, and the random pick — client-only, after hydration,
  // so the server and first client render agree (no mismatch).
  useEffect(() => {
    const p = window.location.pathname || "/";
    setPath(p);
    const seg = p.split("/")[1];
    if (locales.includes(seg)) setLocale(seg);
    if (pool.length) setPick(pool[Math.floor(Math.random() * pool.length)]);
    if (BOFH_EXCUSES.length) setExcuse(BOFH_EXCUSES[Math.floor(Math.random() * BOFH_EXCUSES.length)]);
  }, [pool, locales]);

  // Cycle the Guru alert through its variations.
  useEffect(() => {
    const id = window.setInterval(() => setGuru((g) => (g + 1) % GURU.length), 2600);
    return () => window.clearInterval(id);
  }, []);

  const href = (p: string) => `/${locale}${p}`;
  const reshuffle = () => {
    if (pool.length) setPick(pool[Math.floor(Math.random() * pool.length)]);
  };
  // "Reopen ticket": the BOFH promptly closes it again with a NEW excuse
  // (guaranteed different from the current one - a repeat reads as a bug).
  const reopenTicket = () => {
    if (BOFH_EXCUSES.length < 2) return;
    let e: string | null = excuse;
    while (e === excuse) e = BOFH_EXCUSES[Math.floor(Math.random() * BOFH_EXCUSES.length)];
    setExcuse(e);
  };
  const g = GURU[guru];

  return (
    <div className="nf-root">
      <div className="nf-head">
        <div className="nf-404 mono">404</div>
        <div className="nf-sub">Page not found</div>
        <div className="nf-path mono">
          <span className="nf-dim">GET</span> {path} <span className="nf-arrow">&#8594;</span>{" "}
          <span className="nf-status">404 Not Found</span>
        </div>
      </div>

      <p className="nf-quip">{QUIP}</p>

      {/* Authentic Amiga Guru Meditation, cycling through variations */}
      <div className="guru" aria-label="Amiga Guru Meditation error">
        <div className="guru-l1">Software Failure.&nbsp;&nbsp;Press left mouse button to continue.</div>
        <div className="guru-l2 mono">Guru Meditation&nbsp;&nbsp;#{g.code}</div>
        <div className="guru-l3 mono">{"// "}{g.meaning}</div>
      </div>

      {/* Other famous errors, as a faux log */}
      <div className="nf-console mono">
        {CONSOLE_ERRORS.map((e, i) => (
          <div className="nf-cline" key={i}>
            <span className={`nf-cpre nf-cpre-${e.tone}`}>{e.pre}</span>
            <span className="nf-ctext">{e.text}</span>
            {e.dim ? <span className="nf-dim"> {e.dim}</span> : null}
          </div>
        ))}
      </div>

      {/* The BOFH has already ruled on this incident. Corpus + provenance:
          src/content/bofh/excuses.ts (481 excuses, served verbatim). */}
      <div className="nf-bofh" role="status" aria-live="polite">
        <p className="nf-bofh-intro">
          Ticket closed by the{" "}
          <a
            className="nf-bofh-link"
            href="https://en.wikipedia.org/wiki/Bastard_Operator_From_Hell"
            target="_blank"
            rel="noopener noreferrer"
          >
            BOFH
          </a>
          . Root cause on file:
        </p>
        {excuse ? (
          <p className="nf-bofh-excuse mono">&ldquo;{excuse}&rdquo;</p>
        ) : (
          <p className="nf-bofh-excuse nf-bofh-wait mono">consulting the excuse database&#8230;</p>
        )}
        <button
          type="button"
          className="nf-bofh-again"
          onClick={reopenTicket}
          title="Reopening produces a new excuse. It does not produce a fix."
        >
          Reopen ticket &#8635;
        </button>
      </div>

      {/* You seem lost — a random tool or article */}
      <div className="nf-lost">
        <p className="nf-lost-title">You seem lost. Here is one, plucked out of digital randomness:</p>
        {pick ? (
          <a className="nf-pick" href={href(pick.p)}>
            <span className={`nf-badge nf-badge-${pick.k}`}>{pick.k === "tool" ? "TOOL" : "LEARN"}</span>
            <span className="nf-pick-label">{pick.l}</span>
            <span className="nf-pick-arrow">&#8594;</span>
          </a>
        ) : (
          <div className="nf-pick nf-pick-empty mono">shuffling&#8230;</div>
        )}
        <div className="nf-actions">
          <a className="nf-btn" href={href("/tools")}>
            Go to the toolbox <span aria-hidden="true">&#8594;</span>
          </a>
          <button type="button" className="nf-btn nf-btn-ghost" onClick={reshuffle}>
            Shuffle again
          </button>
          <a className="nf-btn nf-btn-ghost" href={`/${locale}`}>
            Home
          </a>
        </div>
      </div>
    </div>
  );
}
