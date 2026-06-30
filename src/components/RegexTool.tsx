"use client";

// ============================================================================
// src/components/RegexTool.tsx
// ----------------------------------------------------------------------------
// THE REGEX TOOLKIT — compile, test, and explain a JavaScript regular
// expression, all in one view.
//
//   • Type a pattern and flags; the tool reports syntax errors as you go.
//   • The pattern is broken into annotated tokens so you can read what it does.
//   • Paste test text and every match is highlighted, with its capture groups
//     and named groups listed.
//
// SAFETY: a regex tester can hang the tab on catastrophic backtracking. The
// explanation and the ReDoS check are pure and run live; the actual matching
// runs live only when the pattern looks safe. If the static check flags the
// classic (a+)+ shape, matching waits behind an explicit "Run anyway" so a
// single keystroke cannot freeze the page. Input length is capped too.
//
// Everything runs in the browser — no fetch, no server. Output is escaped text
// through React, so even hostile input cannot inject markup.
// ============================================================================

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  compileRegex,
  findMatches,
  explainPattern,
  detectReDoS,
  MAX_MATCHES,
  type RegexToken,
  type RegexMatch,
} from "@/lib/tools/regex";

export default function RegexTool() {
  const t = useTranslations("tools.regex");
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [testText, setTestText] = useState("");
  const [runRisky, setRunRisky] = useState(false);

  // A new pattern or flags must clear an earlier "run anyway" consent.
  useEffect(() => {
    setRunRisky(false);
  }, [pattern, flags]);

  const compiled = useMemo(() => (pattern ? compileRegex(pattern, flags) : null), [pattern, flags]);
  const redos = useMemo(() => (pattern ? detectReDoS(pattern) : { risky: false }), [pattern]);
  const explanation = useMemo<RegexToken[]>(() => (pattern && compiled?.ok ? explainPattern(pattern) : []), [pattern, compiled]);

  const canRun = !!compiled?.ok && testText.length > 0 && (!redos.risky || runRisky);
  const result = useMemo(
    () => (canRun ? findMatches(pattern, flags, testText) : null),
    [canRun, pattern, flags, testText],
  );

  // Build highlighted test text from non-overlapping match spans.
  const highlighted = useMemo(() => {
    if (!result || !result.ok || result.matches.length === 0) return null;
    const parts: ReactNode[] = [];
    let pos = 0;
    result.matches.forEach((m, i) => {
      const start = m.index;
      const end = m.index + m.match.length;
      if (start > pos) parts.push(<span key={`g${i}`}>{testText.slice(pos, start)}</span>);
      if (m.match.length === 0) {
        parts.push(<mark key={`z${i}`} className="regex-hl regex-hl--zero" aria-hidden="true" />);
      } else {
        parts.push(
          <mark key={`m${i}`} className={`regex-hl regex-hl--${i % 2}`}>
            {testText.slice(start, end)}
          </mark>,
        );
      }
      pos = Math.max(pos, end);
    });
    if (pos < testText.length) parts.push(<span key="tail">{testText.slice(pos)}</span>);
    return parts;
  }, [result, testText]);

  const tokenChip = (tok: RegexToken, i: number) => (
    <li className={`regex-tok regex-tok--${tok.type}`} key={i}>
      <code className="regex-tok-text">{tok.text}</code>
      <span className="regex-tok-desc">{tok.description}</span>
    </li>
  );

  const matchRow = (m: RegexMatch, i: number) => {
    const named = Object.entries(m.named).filter(([, v]) => v !== undefined);
    return (
      <div className="regex-match" key={i}>
        <div className="regex-match-head">
          <code className="regex-match-text mono">{m.match === "" ? "∅" : m.match}</code>
          <span className="regex-match-pos">
            {t("atWord")} {m.index}
          </span>
        </div>
        {m.groups.length > 0 && (
          <div className="regex-match-groups">
            <span className="regex-match-glabel">{t("groupsWord")}</span>
            {m.groups.map((g) => (
              <span className="regex-group" key={g.index}>
                <span className="regex-group-n">{g.index}</span>
                <code className="mono">{g.value === undefined ? "—" : g.value}</code>
              </span>
            ))}
          </div>
        )}
        {named.length > 0 && (
          <div className="regex-match-groups">
            <span className="regex-match-glabel">{t("namedWord")}</span>
            {named.map(([k, v]) => (
              <span className="regex-group" key={k}>
                <span className="regex-group-n regex-group-name">{k}</span>
                <code className="mono">{v}</code>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="cidr-tool json-tool regex-tool">
      <div className="cidr-head">
        <h3 className="cidr-title">{t("title")}</h3>
        <p className="cidr-desc">{t("description")}</p>
      </div>

      {/* Pattern + flags, styled like a /pattern/flags literal */}
      <div className="cidr-input-row">
        <label className="cidr-label" htmlFor="regex-pattern">
          {t("patternLabel")}
        </label>
        <div className="regex-literal">
          <span className="regex-slash">/</span>
          <input
            id="regex-pattern"
            className="regex-pattern mono"
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder={t("patternPlaceholder")}
            autoComplete="off"
            spellCheck={false}
            aria-label={t("patternLabel")}
          />
          <span className="regex-slash">/</span>
          <input
            className="regex-flags mono"
            type="text"
            value={flags}
            onChange={(e) => setFlags(e.target.value)}
            placeholder={t("flagsPlaceholder")}
            autoComplete="off"
            spellCheck={false}
            aria-label={t("flagsLabel")}
            size={6}
          />
        </div>
        <p className="cidr-runs">{t("runsLocally")}</p>
      </div>

      {/* Compile status */}
      {compiled && !compiled.ok && (
        <p className="regex-status regex-status--bad">
          <strong>{t("invalid")}</strong> <span className="mono">{compiled.error?.message}</span>
        </p>
      )}
      {compiled && compiled.ok && <p className="regex-status regex-status--ok">{t("valid")}</p>}

      {/* ReDoS warning */}
      {pattern && redos.risky && (
        <div className="regex-redos">
          <span className="regex-redos-title">{t("redosTitle")}</span>
          <p className="regex-redos-body">{t("redosBody")}</p>
          {!runRisky && testText.length > 0 && (
            <button type="button" className="cidr-button--ghost regex-run-anyway" onClick={() => setRunRisky(true)}>
              {t("runAnyway")}
            </button>
          )}
        </div>
      )}

      {/* Explanation */}
      {explanation.length > 0 && (
        <div className="regex-section">
          <span className="regex-section-title">{t("explanationHeading")}</span>
          <ul className="regex-tokens">{explanation.map(tokenChip)}</ul>
        </div>
      )}

      {/* Test text */}
      <div className="cidr-input-row">
        <label className="cidr-label" htmlFor="regex-test">
          {t("testLabel")}
        </label>
        <textarea
          id="regex-test"
          className="json-input mono"
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          placeholder={t("testPlaceholder")}
          rows={5}
          spellCheck={false}
        />
      </div>

      {/* Results */}
      {result && result.inputTooLong && <p className="regex-status regex-status--bad">{t("tooLong")}</p>}

      {result && result.ok && (
        <div className="regex-section">
          <div className="regex-results-head">
            <span className="regex-section-title">{t("matchesHeading")}</span>
            <span className="regex-count">{result.count}</span>
          </div>

          {result.count === 0 ? (
            <p className="regex-nomatch">{t("noMatches")}</p>
          ) : (
            <>
              <pre className="regex-haystack">{highlighted}</pre>
              <div className="regex-matches">{result.matches.map(matchRow)}</div>
              {result.truncated && (
                <p className="regex-trunc">
                  {t("showingFirst")} {MAX_MATCHES.toLocaleString()} {t("matchesWord")}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
