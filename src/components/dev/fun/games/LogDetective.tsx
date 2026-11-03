// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/games/LogDetective.tsx
// ----------------------------------------------------------------------------
// LOG DETECTIVE, the board (PRIME 03/11/2026). The day's log excerpt in a
// monospaced box that wraps and scrolls inside itself (never the page), with
// line numbers; three questions in turn: the attacker's address (a short
// list), the first malicious line and the line where it succeeded (tap or
// arrow to a line, then confirm). One try each, feedback after each, and a
// closing report: what happened, what to log, what to alert on.
// The case comes from src/lib/fun/games/log-detective/engine.ts.
// ============================================================================

"use client";

// React's state, effects, refs and memo.
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
// The game's strings and the shell's.
import { useTranslations } from "next-intl";
// The frame: stats, rules, result.
import GameShell, { type ShellResult } from "./GameShell";
// Today's UTC day.
import { useToday } from "@/lib/fun/hooks";
// The puzzle number of a day.
import { puzzleNumber } from "@/lib/fun/daily";
// The share card and the time format.
import { formatDuration, shareText } from "@/lib/fun/share";
// The record: results and the day's saved state.
import { loadRecord, recordResult, saveDailyState } from "@/lib/fun/storage";
// The rules.
import { GAME_ID, QUESTIONS, dailyCase, isRight, markLine, practiceCase, type Case } from "@/lib/fun/games/log-detective/engine";

/** The game's address below /dev/fun/. */
const SLUG = "log-detective";

/** Right answers that keep the daily streak. */
const PASS = 2;

/**
 * A combined-format line with its user agent cut to the first product token ("Mozilla/5.0 …", "curl/8.5.0"),
 * so a phone shows one or two rows per line instead of four or five. Tools that announce themselves keep their
 * name, which is the part of a user agent an analyst reads first.
 *
 * @param line the line as logged
 * @returns the line with a shortened user agent, or unchanged when it has no quoted last field
 */
function compactUserAgent(line: string): string {
  // The last quoted field of a combined-format line is the user agent.
  const m = /"([^"]*)"\s*$/.exec(line);
  // No such field: the line as it is.
  if (!m) return line;
  // Its first product token.
  const first = m[1].split(" ")[0];
  // The token, with an ellipsis when something was left out.
  const short = m[1].includes(" ") ? `${first} …` : first;
  // The line up to the field, then the shortened field.
  return `${line.slice(0, m.index)}"${short}"`;
}

/** What is saved for the daily case. */
interface DailySave {
  /** The answers given: an address, then two line indexes (null while unanswered). */
  answers: (string | number | null)[];
  /** Milliseconds spent so far. */
  elapsed: number;
}

/**
 * The Log Detective game.
 *
 * @param props the page's locale
 * @returns the game in its shell
 */
export default function LogDetective({ locale }: { locale: string }) {
  // The game's strings.
  const t = useTranslations("devFun.games.log-detective");
  // The shell's strings.
  const tc = useTranslations("devFun.games.common");
  // Today, after mount.
  const today = useToday();
  // Daily or practice.
  const [mode, setMode] = useState<"daily" | "practice">("daily");
  // The practice case's seed.
  const [seed, setSeed] = useState(0);
  // The answers given so far.
  const [answers, setAnswers] = useState<(string | number | null)[]>([null, null, null]);
  // The line under the cursor.
  const [active, setActive] = useState(-1);
  // The time spent, in milliseconds (shown).
  const [elapsed, setElapsed] = useState(0);
  // When the clock last started (performance.now()), or null when stopped.
  const startedAt = useRef<number | null>(null);
  // Time banked before the last start.
  const banked = useRef(0);
  // The stats line re-reads storage when this changes.
  const [version, setVersion] = useState(0);
  // Whether the daily case was finished before this visit (so it is not recorded twice).
  const [restoredDone, setRestoredDone] = useState(false);
  // The polite announcement.
  const [say, setSay] = useState("");
  // The log box, for scrolling the cursor into view.
  const boxRef = useRef<HTMLDivElement | null>(null);
  // Whether web lines show a shortened user agent (on by default on narrow screens, where full ones wrap a lot).
  const [shortUa, setShortUa] = useState(false);

  // On mount: a narrow screen starts with short user agents.
  useEffect(() => {
    // Not every environment has matchMedia.
    if (typeof window === "undefined" || !window.matchMedia) return;
    // The same breakpoint the shelf uses for two columns.
    if (window.matchMedia("(max-width: 639px)").matches) setShortUa(true);
  }, []);

  // The case in play.
  const kase: Case | null = useMemo(() => {
    // Nothing before mount.
    if (!today) return null;
    // The day's case, or a practice one.
    return mode === "daily" ? dailyCase(today) : practiceCase(seed, today);
  }, [today, mode, seed]);

  // Which question is open: the first unanswered one (3 when all are answered).
  const step = answers.findIndex((a) => a === null) === -1 ? 3 : answers.findIndex((a) => a === null);
  // Right or wrong per answered question.
  const results = kase ? answers.map((a, i) => (a === null ? null : isRight(kase, QUESTIONS[i], a))) : [null, null, null];
  // Finished.
  const done = step === 3;

  // Restore the daily case's state when the day is known.
  useEffect(() => {
    // Only the daily case.
    if (!today || mode !== "daily") return;
    // The saved state.
    const saved = loadRecord(GAME_ID).daily[today] as DailySave | undefined;
    // Valid saves only.
    if (saved && Array.isArray(saved.answers) && saved.answers.length === 3) {
      // The answers.
      setAnswers(saved.answers);
      // The time already spent.
      banked.current = typeof saved.elapsed === "number" ? saved.elapsed : 0;
      // Shown.
      setElapsed(banked.current);
      // Finished before.
      setRestoredDone(saved.answers.every((a) => a !== null));
    } else {
      // A fresh case.
      setAnswers([null, null, null]);
      // No time yet.
      banked.current = 0;
      // Shown.
      setElapsed(0);
      // Not finished.
      setRestoredDone(false);
    }
    // No cursor yet.
    setActive(-1);
  }, [today, mode]);

  // The clock runs while a case is open and unfinished.
  useEffect(() => {
    // Nothing to time.
    if (!kase || done) {
      // Stopped: bank what was running.
      if (startedAt.current !== null) {
        // Banked.
        banked.current += performance.now() - startedAt.current;
        // Stopped.
        startedAt.current = null;
        // Shown.
        setElapsed(banked.current);
      }
      // No ticking.
      return;
    }
    // Started now.
    startedAt.current = performance.now();
    // Twice a second.
    const id = window.setInterval(() => {
      // The time so far.
      if (startedAt.current !== null) setElapsed(banked.current + performance.now() - startedAt.current);
    }, 500);
    // Cleared, banking the time.
    return () => {
      // The interval.
      window.clearInterval(id);
      // Banked.
      if (startedAt.current !== null) banked.current += performance.now() - startedAt.current;
      // Stopped.
      startedAt.current = null;
    };
  }, [kase, done]);

  // The time right now, exactly.
  const now = () => banked.current + (startedAt.current !== null ? performance.now() - startedAt.current : 0);

  // Give an answer to the open question.
  const give = useCallback(
    (value: string | number) => {
      // Nothing open.
      if (!kase || done) return;
      // The new answers.
      const next = answers.slice();
      // This question's.
      next[step] = value;
      // Kept.
      setAnswers(next);
      // Right or wrong.
      const ok = isRight(kase, QUESTIONS[step], value);
      // The right answer, said in words.
      const truth = step === 0 ? kase.attacker : t("lineN", { n: (step === 1 ? kase.first : kase.success) + 1 });
      // Announced.
      setSay(ok ? t("right") : t("wrongIs", { answer: truth }));
      // The time at this answer.
      const ms = now();
      // The daily case is saved after every answer.
      if (mode === "daily" && today) saveDailyState(GAME_ID, today, { answers: next, elapsed: ms } satisfies DailySave);
      // The last answer finishes the case.
      if (step === 2 && today) {
        // Right answers.
        const right = next.filter((a, i) => a !== null && isRight(kase, QUESTIONS[i], a)).length;
        // Recorded: daily for the streak, practice as a played round.
        recordResult(GAME_ID, { dayKey: today, won: right >= PASS, daily: mode === "daily" });
        // The stats line re-reads.
        setVersion((v) => v + 1);
      }
    },
    [kase, done, answers, step, t, mode, today],
  );

  // Keyboard navigation in the log: arrows, Home, End, Page Up and Down; Enter or Space confirms a line question.
  const onLogKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    // No case.
    if (!kase) return;
    // The last line.
    const lastLine = kase.lines.length - 1;
    // The target line for each key.
    let to = active;
    // Down.
    if (e.key === "ArrowDown") to = Math.min(lastLine, active + 1);
    // Up.
    else if (e.key === "ArrowUp") to = Math.max(0, active - 1);
    // Ten down.
    else if (e.key === "PageDown") to = Math.min(lastLine, active + 10);
    // Ten up.
    else if (e.key === "PageUp") to = Math.max(0, active - 10);
    // First.
    else if (e.key === "Home") to = 0;
    // Last.
    else if (e.key === "End") to = lastLine;
    // Confirm.
    else if ((e.key === "Enter" || e.key === " ") && active >= 0 && (step === 1 || step === 2)) {
      // Not a scroll.
      e.preventDefault();
      // The answer.
      give(active);
      // Done.
      return;
    } else return;
    // Not a page scroll.
    e.preventDefault();
    // Moved.
    setActive(to);
    // Announced.
    setSay(t("announceLine", { n: to + 1 }));
  };

  // Keep the cursor's line in view inside the box.
  useEffect(() => {
    // Nothing selected.
    if (active < 0 || !boxRef.current) return;
    // The line's element.
    const el = boxRef.current.querySelector<HTMLElement>(`[data-line="${active}"]`);
    // Scrolled inside its box only.
    if (el) {
      // The box and the line.
      const box = boxRef.current;
      // Above the visible part.
      if (el.offsetTop < box.scrollTop) box.scrollTop = el.offsetTop;
      // Below it.
      else if (el.offsetTop + el.offsetHeight > box.scrollTop + box.clientHeight) box.scrollTop = el.offsetTop + el.offsetHeight - box.clientHeight;
    }
  }, [active]);

  // Start a new practice case.
  const newPractice = () => {
    // Practice mode.
    setMode("practice");
    // A fresh seed (the component picks it; the engine stays pure).
    setSeed((Date.now() ^ Math.floor(performance.now() * 1000)) >>> 0);
    // Nothing answered.
    setAnswers([null, null, null]);
    // No time.
    banked.current = 0;
    // Shown.
    setElapsed(0);
    // No cursor.
    setActive(-1);
    // Not a restored case.
    setRestoredDone(false);
  };

  // The right answers.
  const right = results.filter((r) => r === true).length;
  // The shell's result once all three are answered.
  let result: ShellResult | null = null;
  // Finished.
  if (kase && done && today) {
    // The time.
    const time = formatDuration(elapsed);
    // The result.
    result = {
      // Two or more right.
      won: right >= PASS,
      // n of 3 in m:ss.
      headline: t("headline", { right, time }),
      // The incident's name.
      detail: t(`scenario.${kase.scenario}.name`),
      // "Log Detective #N", the time and the marks.
      share: shareText({ title: mode === "daily" ? t("shareTitle", { n: puzzleNumber(today) }) : t("sharePractice"), lines: [markLine(results.map((r) => r === true))], summary: time, locale, slug: SLUG }),
    };
  }

  // The rules.
  const rules = (
    <ul>
      {["rule1", "rule2", "rule3", "rule4"].map((k) => (
        <li key={k}>{t(k)}</li>
      ))}
    </ul>
  );

  // Each line's state classes: the cursor, the answers once given, the attacker's lines once finished.
  const lineClass = (i: number): string => {
    // The base class.
    const cls = ["fg-ld-line"];
    // Under the cursor.
    if (i === active) cls.push("fg-ld-active");
    // No case.
    if (!kase) return cls.join(" ");
    // The attacker's lines, shown only at the end.
    if (done && kase.lines[i].includes(` ${kase.attacker} `) || (done && kase.lines[i].startsWith(`${kase.attacker} `))) cls.push("fg-ld-attacker");
    // The first malicious line, once that question is answered.
    if (answers[1] !== null && i === kase.first) cls.push("fg-ld-first");
    // The success line, once that question is answered.
    if (answers[2] !== null && i === kase.success) cls.push("fg-ld-success");
    // A wrong pick.
    if ((answers[1] === i && i !== kase.first) || (answers[2] === i && i !== kase.success)) cls.push("fg-ld-wrong");
    // The classes.
    return cls.join(" ");
  };

  // The board.
  return (
    <GameShell gameId={GAME_ID} kind={mode === "daily" ? "daily" : "free"} today={today} rules={rules} result={result} onPlayAgain={newPractice} version={version}>
      {/* The polite announcer. */}
      <p className="sr-only" aria-live="polite">
        {say}
      </p>

      {/* The modes. */}
      <div className="fg-ld-modes" role="group" aria-label={t("modesLabel")}>
        <button type="button" className="fg-button fg-ld-mode" aria-pressed={mode === "daily"} onClick={() => setMode("daily")}>
          {tc("daily")}
        </button>
        <button type="button" className="fg-button fg-ld-mode" aria-pressed={mode === "practice"} onClick={newPractice}>
          {tc("practice")}
        </button>
      </div>

      {/* Before mount: a neutral board. */}
      {!kase && <p className="fg-muted">{tc("loading")}</p>}

      {kase && (
        <>
          {/* The heads-up line: question, time. */}
          <div className="fg-hud">
            <span className="fg-readout">{done ? t("allDone") : t("qCount", { n: step + 1 })}</span>
            <span className="fg-readout">
              {tc("time")} {formatDuration(elapsed)}
            </span>
          </div>

          {/* The open question and its controls. */}
          {!done && (
            <div className="fg-ld-question">
              <p className="fg-ld-ask">{t(`q.${QUESTIONS[step]}`)}</p>
              {step === 0 ? (
                <div className="fg-ld-choices">
                  {kase.ipChoices.map((ip) => (
                    <button key={ip} type="button" className="fg-button fg-mono fg-ld-choice" onClick={() => give(ip)}>
                      {ip}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="fg-ld-confirm">
                  <p className="fg-muted fg-small">{t("pickLine")}</p>
                  <button type="button" className="fg-button fg-button-primary" disabled={active < 0} onClick={() => active >= 0 && give(active)}>
                    {active >= 0 ? t("confirmLine", { n: active + 1 }) : t("noLine")}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Feedback on the answers so far. */}
          {answers.some((a) => a !== null) && (
            <ol className="fg-ld-feedback">
              {QUESTIONS.map((q, i) => {
                // Unanswered questions are not listed.
                if (answers[i] === null) return null;
                // The right answer in words.
                const truth = q === "ip" ? kase.attacker : t("lineN", { n: (q === "first" ? kase.first : kase.success) + 1 });
                // One line of feedback.
                return (
                  <li key={q} className={results[i] ? "fg-ld-fb-ok" : "fg-ld-fb-bad"}>
                    <span className="fg-ld-fb-mark" aria-hidden="true">{results[i] ? "✓" : "✗"}</span> {t(`short.${q}`)}: {results[i] ? t("right") : t("wrongIs", { answer: truth })}
                  </li>
                );
              })}
            </ol>
          )}

          {/* The log. */}
          <div className="fg-ld-frame">
            <p className="fg-ld-caption">
              <span className="fg-mono">{kase.server}</span> · {t(kase.format === "web" ? "formatWeb" : "formatSsh")}
            </p>
            {/* Web logs only: the user agent can be cut short, so each line takes fewer rows. */}
            {kase.format === "web" && (
              <label className="fg-ld-ua">
                <input type="checkbox" checked={shortUa} onChange={(e) => setShortUa(e.target.checked)} />
                {t("shortUa")}
              </label>
            )}
            <div
              ref={boxRef}
              className="fg-ld-log"
              role="listbox"
              tabIndex={0}
              aria-label={t("logLabel", { server: kase.server })}
              aria-activedescendant={active >= 0 ? `fg-ld-line-${active}` : undefined}
              onKeyDown={onLogKey}
              onFocus={() => active < 0 && setActive(0)}
            >
              {kase.lines.map((line, i) => (
                <div key={i} id={`fg-ld-line-${i}`} data-line={i} role="option" aria-selected={i === active} className={lineClass(i)} onClick={() => setActive(i)}>
                  <span className="fg-ld-no" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="fg-ld-text">{kase.format === "web" && shortUa ? compactUserAgent(line) : line}</span>
                </div>
              ))}
            </div>
            <p className="fg-muted fg-small">{t("listHint")}</p>
          </div>

          {/* The closing report. */}
          {done && (
            <section className="fg-ld-report" aria-labelledby="fg-ld-report-title">
              <h2 id="fg-ld-report-title" className="fg-ld-report-title">
                {t("whatHappened")}: {t(`scenario.${kase.scenario}.name`)}
              </h2>
              <p>
                {t(`scenario.${kase.scenario}.what`, { ip: kase.attacker, first: kase.first + 1, success: kase.success + 1, count: kase.facts.count, path: kase.facts.path, user: kase.facts.user })}
              </p>
              <h3 className="fg-ld-report-sub">{t("whatToLog")}</h3>
              <p>{t(`scenario.${kase.scenario}.log`)}</p>
              <h3 className="fg-ld-report-sub">{t("whatToAlert")}</h3>
              <p>{t(`scenario.${kase.scenario}.alert`)}</p>
              <p className="fg-ld-legend fg-small">
                <span className="fg-ld-legend-item">
                  <span className="fg-ld-key fg-ld-key-attacker" aria-hidden="true" /> {t("legendAttacker")}
                </span>
                <span className="fg-ld-legend-item">
                  <span className="fg-ld-key fg-ld-key-first" aria-hidden="true" /> {t("legendFirst")}
                </span>
                <span className="fg-ld-legend-item">
                  <span className="fg-ld-key fg-ld-key-success" aria-hidden="true" /> {t("legendSuccess")}
                </span>
              </p>
              {mode === "daily" && restoredDone && <p className="fg-muted fg-small">{t("alreadyDone")}</p>}
            </section>
          )}
        </>
      )}
    </GameShell>
  );
}
