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
//
// PORTABILITY (2026-10-26): a section of its own lists each construct in the
// pattern whose support or meaning differs between ECMAScript, PCRE2 (NGINX)
// and Tcl's Advanced Regular Expressions (BIG-IP iRules). It is a static
// reading of the tokens (portabilityOf in compute.ts), shown even when this
// browser cannot compile the pattern, because pasting an NGINX or iRules
// pattern is the point. Prose comes from tools.regex.port.* in the packs.
// ============================================================================

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  compileRegex,
  findMatches,
  explainPattern,
  detectReDoS,
  MAX_MATCHES,
  // 2026-10-26: the portability view.
  portabilityOf,
  FLAVOURS,
  MAX_PORTABILITY_LENGTH,
  type RegexToken,
  type RegexMatch,
  type PortFinding,
  type PortVerdict,
} from "@/lib/tools/regex";

// D-83 Example samples — verbatim from this tool's golden vectors.
const EXAMPLE_PAT = "\\d+";
const EXAMPLE_FLAGS = "g";
const EXAMPLE_TEXT = "a1b22c333";
// D-83 Portability example: the "showcase" portability vector and its match vector, verbatim.
const PORT_EXAMPLE_PAT = "(?<=user=)(?<name>\\w+)\\b";
// Its flags.
const PORT_EXAMPLE_FLAGS = "g";
// Its test text (SHOWCASE_MATCH_VECTORS).
const PORT_EXAMPLE_TEXT = "user=admin&role=ops";

// Each verdict borrows an existing badge colour: indigo, amber, red.
const VERDICT_BADGE: Record<PortVerdict, string> = {
  // Supported the same way.
  same: "cidr-badge cidr-badge--identical",
  // Supported, with another meaning or syntax.
  different: "cidr-badge cidr-badge--contains",
  // Not supported.
  unsupported: "cidr-badge cidr-badge--partial",
};

/** Optional opening values (2026-10-26). The tool page passes none; a render harness passes the examples. */
interface RegexToolProps {
  /** The pattern to open with (default empty). */
  initialPattern?: string;
  /** The flags to open with (default g). */
  initialFlags?: string;
  /** The test text to open with (default empty). */
  initialText?: string;
}

export default function RegexTool({ initialPattern = "", initialFlags = "g", initialText = "" }: RegexToolProps = {}) {
  const t = useTranslations("tools.regex");
  // Opening values come from the props, which default to the old fixed values.
  const [pattern, setPattern] = useState(initialPattern);
  // Flags default to g, as before.
  const [flags, setFlags] = useState(initialFlags);
  // The test text defaults to empty, as before.
  const [testText, setTestText] = useState(initialText);
  const [runRisky, setRunRisky] = useState(false);

  // A new pattern or flags must clear an earlier "run anyway" consent.
  useEffect(() => {
    setRunRisky(false);
  }, [pattern, flags]);

  const compiled = useMemo(() => (pattern ? compileRegex(pattern, flags) : null), [pattern, flags]);
  const redos = useMemo(() => (pattern ? detectReDoS(pattern) : { risky: false }), [pattern]);
  const explanation = useMemo<RegexToken[]>(() => (pattern && compiled?.ok ? explainPattern(pattern) : []), [pattern, compiled]);
  // The portability report reads the pattern whether or not this browser compiles it.
  const portability = useMemo(() => (pattern ? portabilityOf(pattern, flags) : null), [pattern, flags]);

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

  // One construct: its occurrences as written, its name, and a line per flavour.
  const portRow = (f: PortFinding, i: number) => (
    <div className="regex-match" key={i}>
      <div className="regex-match-head">
        {/* The construct as written in the pattern (up to three forms). */}
        <code className="regex-match-text mono">{f.examples.join("   ")}</code>
        {/* Its name, and how often it occurs when more than once. */}
        <span className="regex-match-pos">
          {t(`port.${f.id}.name`)}
          {f.count > 1 ? ` · ${t("portCount", { count: f.count })}` : ""}
        </span>
      </div>
      {FLAVOURS.map((fl) => (
        <div className="regex-match-groups" key={fl}>
          {/* The flavour. */}
          <span className="regex-match-glabel">{t(`portFlavour.${fl}`)}</span>
          {/* The verdict, in words as well as colour. */}
          <span className={VERDICT_BADGE[f.cells[fl].verdict]}>{t(`portVerdict.${f.cells[fl].verdict}`)}</span>
          {/* How this flavour treats it. */}
          <span className="regex-tok-desc">{t(`port.${f.id}.${f.cells[fl].note}`, f.params)}</span>
        </div>
      ))}
    </div>
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
                <code className="mono">{g.value === undefined ? "-" : g.value}</code>
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
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="regex-pattern">
            {t("patternLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => { setPattern(EXAMPLE_PAT); setFlags(EXAMPLE_FLAGS); setTestText(EXAMPLE_TEXT); }}>{t("example")}</button>
            {/* 2026-10-26: a second example that shows the portability view at work. */}
            <button type="button" className="b64-copy" onClick={() => { setPattern(PORT_EXAMPLE_PAT); setFlags(PORT_EXAMPLE_FLAGS); setTestText(PORT_EXAMPLE_TEXT); }}>{t("examplePortability")}</button>
            <button type="button" className="b64-copy" onClick={() => { setPattern(""); setTestText(""); }}>{t("clear")}</button>
          </div>
        </div>
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

      {/* Portability: ECMAScript, PCRE2 and Tcl AREs, compared statically. */}
      {portability && (
        <div className="regex-section">
          <span className="regex-section-title">{t("portHeading")}</span>
          {/* What the view is, and that only ECMAScript runs here. */}
          <p className="cidr-note">{t("portIntro")}</p>
          {portability.tooLong ? (
            // Over the cap: say so rather than read it.
            <p className="regex-nomatch">{t("portTooLong", { limit: MAX_PORTABILITY_LENGTH.toLocaleString() })}</p>
          ) : portability.findings.length === 0 ? (
            // Nothing from the list: not a promise of portability.
            <p className="regex-nomatch">{t("portNone")}</p>
          ) : (
            // One card per construct.
            <div className="regex-matches">{portability.findings.map(portRow)}</div>
          )}
          {/* Where each flavour runs, from the vendors' own documents. */}
          <p className="cidr-note">{t("portWhereHeading")}</p>
          <ul className="cidr-unfit-list">
            <li>{t("portWhereEcmascript")}</li>
            <li>{t("portWherePcre2")}</li>
            <li>{t("portWhereTcl")}</li>
            <li>{t("portWhereAsm")}</li>
          </ul>
          {/* What the view does not check. */}
          <p className="regex-trunc">{t("portScope")}</p>
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
