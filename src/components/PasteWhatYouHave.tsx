"use client";
// ============================================================================
// src/components/PasteWhatYouHave.tsx
// ----------------------------------------------------------------------------
// "PASTE WHAT YOU HAVE" (E3 of Round 1, SCOUT; adopted 2026-10-06).
//
// A box on /tools that runs every tool manifest's regex input detectors over
// whatever the reader pastes and offers the tools that recognise it, ranked by
// the detectors' own priority. The detectors have existed in every manifest
// since D-49 (inputDetectors: anchored patterns with a priority and an example)
// and nothing ran them until tonight; this is the omnibox they were written for.
//
// WHAT RUNS. src/lib/tools/input-detectors.generated.json, written at build time
// by scripts/gen-input-detectors.mts from the manifests: slug, family, priority,
// pattern, example, regex detectors only, every pattern compiled at build time
// so an invalid one fails the build rather than the page. The patterns are the
// site's own, anchored, written for inputs of a known shape; the box still
// bounds what it tests (the first 20,000 characters) and tests the whole text
// and its first non-empty line, so a pasted log with a JWT on line one is still
// recognised as a JWT.
//
// NOTHING LEAVES THE BROWSER. The text is matched in memory and never stored,
// never sent, and cleared with the box; the component holds it in state only
// while the box is open. Same rule as every tool on the main floor.
//
// WHAT IT SHOWS. Up to eight matches, each tool once, lowest priority number
// first (the manifests use 0 for "this is unmistakably mine"), then by name;
// the tool's family beside its name, and a one-line note when nothing matched
// pointing at the intents and the directory below. Names and links come in as
// props from the server page, which has the locale's messages; the component
// itself carries no namespace.
// ============================================================================
import { useMemo, useState } from "react";
import detectors from "@/lib/tools/input-detectors.generated.json";

/** One tool the box may offer: its localised name and its page. */
export interface PasteTarget {
  name: string;
  href: string;
}

/** One generated detector, as the JSON carries it. */
interface Detector {
  slug: string;
  family: string;
  priority: number;
  pattern: string;
  example: string;
}

/** The most text the box will test; a pasted megabyte is cut here, not matched. */
const MAX_CHARS = 20000;
/** How many matches the box lists. */
const MAX_MATCHES = 8;

export default function PasteWhatYouHave({
  targets,
  label,
  placeholder,
  hint,
  resultsLabel,
  noMatch,
  clearLabel,
}: {
  /** Tool slug -> name and href, for the tools the page can link (the generic index plus the hubs). */
  targets: Record<string, PasteTarget>;
  /** The box's accessible label. */
  label: string;
  /** The placeholder ("A token, a header, a log line, a CIDR..."). */
  placeholder: string;
  /** The privacy line under the box. */
  hint: string;
  /** The heading over the matches ("Tools that recognise this"). */
  resultsLabel: string;
  /** The line shown when nothing matched. */
  noMatch: string;
  /** The clear button. */
  clearLabel: string;
}) {
  // The pasted text, held only while the reader is here.
  const [text, setText] = useState("");

  // Every pattern compiled once per mount; the generator already proved they compile.
  const compiled = useMemo(
    () => (detectors as { detectors: Detector[] }).detectors.map((d) => ({ ...d, re: new RegExp(d.pattern) })),
    [],
  );

  // The matches for the current text: the whole text (trimmed, bounded) and its first non-empty line.
  const matches = useMemo(() => {
    const whole = text.slice(0, MAX_CHARS).trim();
    if (!whole) return [];
    const firstLine = whole.split(/\r?\n/).find((l) => l.trim() !== "")?.trim() ?? "";
    const best = new Map<string, { slug: string; family: string; priority: number; example: string }>();
    for (const d of compiled) {
      if (!targets[d.slug]) continue; // a tool the page cannot link is not offered
      let hit = false;
      try {
        hit = d.re.test(whole) || (firstLine !== whole && d.re.test(firstLine));
      } catch {
        hit = false; // a pathological input against a pattern: treated as no match, never as a crash
      }
      if (!hit) continue;
      const prev = best.get(d.slug);
      if (!prev || d.priority < prev.priority) best.set(d.slug, { slug: d.slug, family: d.family, priority: d.priority, example: d.example });
    }
    return [...best.values()]
      .sort((a, b) => a.priority - b.priority || targets[a.slug].name.localeCompare(targets[b.slug].name))
      .slice(0, MAX_MATCHES);
  }, [text, compiled, targets]);

  return (
    <div className="paste-box">
      <label className="paste-box-label" htmlFor="paste-what-you-have">{label}</label>
      <textarea
        id="paste-what-you-have"
        className="paste-box-input mono"
        placeholder={placeholder}
        value={text}
        rows={3}
        spellCheck={false}
        autoComplete="off"
        onChange={(e) => setText(e.target.value)}
      />
      <div className="paste-box-foot">
        <span className="paste-box-hint">{hint}</span>
        {text && (
          <button type="button" className="paste-box-clear" onClick={() => setText("")}>
            {clearLabel}
          </button>
        )}
      </div>
      {/* The matches, or the honest line when there are none; nothing until something is pasted. */}
      {text.trim() !== "" && (
        <div className="paste-box-results" aria-live="polite">
          {matches.length > 0 ? (
            <>
              <p className="paste-box-results-title">{resultsLabel}</p>
              <ul className="paste-box-list">
                {matches.map((m) => (
                  <li key={m.slug} className="paste-box-item">
                    <a href={targets[m.slug].href} className="paste-box-link">{targets[m.slug].name}</a>
                    {m.family && <span className="paste-box-family">{m.family}</span>}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="paste-box-nomatch">{noMatch}</p>
          )}
        </div>
      )}
    </div>
  );
}
