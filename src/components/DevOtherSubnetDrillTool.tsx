// ============================================================================
// src/components/DevOtherSubnetDrillTool.tsx
// ----------------------------------------------------------------------------
// SUBNETTING DRILL TRAINER — the first /dev/other resident's client.
//
// The two green-room axes made concrete:
//   RANDOMNESS — each round is generated from a fresh seed (Date.now at Start),
//     so no two rounds match; the engine's seeded PRNG keeps each round
//     internally reproducible (and vector-testable) even though rounds differ.
//   PERSISTENT STATE — the best streak and lifetime totals live in
//     localStorage, so the trainer remembers you across visits. Guarded so a
//     private-mode / no-storage browser degrades to session-only, never breaks.
//
// The subnet math is the cidr engine's (imported by the engine module); this
// component only drives rounds, grades via the pure grader, and keeps score.
// Everything is local — nothing is generated on or sent to a server.
// ============================================================================
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  generateDrill,
  grade,
  type Difficulty,
  type DrillQuestion,
} from "@/lib/dev-other/subnet-drill/compute";

const ROUND_SIZE = 10;
const STORE_KEY = "ronutz:subnet-drill:stats";
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

interface Stats {
  bestStreak: number;
  totalCorrect: number;
  totalAnswered: number;
}
const ZERO_STATS: Stats = { bestStreak: 0, totalCorrect: 0, totalAnswered: 0 };

type Phase = "config" | "playing" | "done";

export default function DevOtherSubnetDrillTool() {
  const t = useTranslations("devOther.subnetDrill");

  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [phase, setPhase] = useState<Phase>("config");
  const [questions, setQuestions] = useState<DrillQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<null | { correct: boolean; expected: string }>(null);
  const [roundCorrect, setRoundCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [stats, setStats] = useState<Stats>(ZERO_STATS);

  // Restore persistent stats on mount (the state axis).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Stats;
        if (typeof parsed.bestStreak === "number") setStats(parsed);
      }
    } catch {
      // No storage → session-only; nothing lost, nothing thrown.
    }
  }, []);

  const persist = useCallback((next: Stats) => {
    setStats(next);
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch {
      /* session-only fallback */
    }
  }, []);

  const startRound = useCallback(() => {
    // A fresh seed per round = genuine randomness; the engine keeps the round
    // itself reproducible from that seed.
    const seed = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
    setQuestions(generateDrill(seed, difficulty, ROUND_SIZE));
    setIdx(0);
    setInput("");
    setFeedback(null);
    setRoundCorrect(0);
    setPhase("playing");
  }, [difficulty]);

  const current = questions[idx];

  const promptText = useMemo(() => {
    if (!current) return "";
    switch (current.kind) {
      case "network-address":
        return t("q.network", { cidr: current.prompt.cidr! });
      case "broadcast-address":
        return t("q.broadcast", { cidr: current.prompt.cidr! });
      case "usable-hosts":
        return t("q.hosts", { cidr: current.prompt.cidr! });
      case "netmask":
        return t("q.netmask", { cidr: current.prompt.cidr! });
      case "host-count-to-prefix":
        return t("q.hostToPrefix", { n: current.prompt.hostCount! });
      case "contains-host":
        return t("q.contains", { host: current.prompt.host!, cidr: current.prompt.cidr! });
    }
  }, [current, t]);

  const submit = useCallback(() => {
    if (!current || feedback) return; // one grade per question
    const g = grade(current, input);
    setFeedback({ correct: g.correct, expected: g.expected });
    const nextStreak = g.correct ? streak + 1 : 0;
    setStreak(nextStreak);
    if (g.correct) setRoundCorrect((c) => c + 1);
    persist({
      bestStreak: Math.max(stats.bestStreak, nextStreak),
      totalCorrect: stats.totalCorrect + (g.correct ? 1 : 0),
      totalAnswered: stats.totalAnswered + 1,
    });
  }, [current, feedback, input, streak, stats, persist]);

  const next = useCallback(() => {
    if (idx + 1 >= questions.length) {
      setPhase("done");
      return;
    }
    setIdx((i) => i + 1);
    setInput("");
    setFeedback(null);
  }, [idx, questions.length]);

  const resetStats = useCallback(() => persist(ZERO_STATS), [persist]);

  const answerHint = current
    ? {
        ipv4: t("hint.ipv4"),
        netmask: t("hint.netmask"),
        integer: t("hint.integer"),
        prefix: t("hint.prefix"),
        boolean: t("hint.boolean"),
      }[current.answerType]
    : "";

  return (
    <div className="cidr-tool jwt-tool">
      {/* Persistent scoreboard — the state axis, always visible. */}
      <div className="drill-scoreboard">
        <span className="drill-stat">
          <span className="drill-stat-label">{t("stats.streak")}</span>
          <span className="drill-stat-value mono">{streak}</span>
        </span>
        <span className="drill-stat">
          <span className="drill-stat-label">{t("stats.best")}</span>
          <span className="drill-stat-value mono">{stats.bestStreak}</span>
        </span>
        <span className="drill-stat">
          <span className="drill-stat-label">{t("stats.lifetime")}</span>
          <span className="drill-stat-value mono">
            {stats.totalCorrect}/{stats.totalAnswered}
          </span>
        </span>
        {stats.totalAnswered > 0 && (
          <button type="button" className="b64-copy drill-reset" onClick={resetStats}>
            {t("stats.reset")}
          </button>
        )}
      </div>

      {phase === "config" && (
        <div className="drill-config">
          <span className="cidr-label">{t("difficulty.label")}</span>
          <div className="drill-diff-row">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                type="button"
                className={difficulty === d ? "viewtoggle-btn viewtoggle-btn--on" : "viewtoggle-btn"}
                aria-pressed={difficulty === d}
                onClick={() => setDifficulty(d)}
              >
                {t(`difficulty.${d}`)}
              </button>
            ))}
          </div>
          <button type="button" className="b64-copy drill-start" onClick={startRound}>
            {t("start", { n: ROUND_SIZE })}
          </button>
          <p className="cidr-privacy">
            <span className="cidr-lock" aria-hidden="true">
              🔒
            </span>{" "}
            {t("runsLocally")}
          </p>
        </div>
      )}

      {phase === "playing" && current && (
        <div className="drill-play">
          <p className="drill-progress mono">
            {t("progress", { i: idx + 1, n: questions.length })}
          </p>
          <p className="drill-prompt">{promptText}</p>

          {current.answerType === "boolean" ? (
            <div className="drill-bool-row">
              <button
                type="button"
                className="b64-copy"
                disabled={!!feedback}
                onClick={() => {
                  setInput("yes");
                  const g = grade(current, "yes");
                  setFeedback({ correct: g.correct, expected: g.expected });
                  const ns = g.correct ? streak + 1 : 0;
                  setStreak(ns);
                  if (g.correct) setRoundCorrect((c) => c + 1);
                  persist({
                    bestStreak: Math.max(stats.bestStreak, ns),
                    totalCorrect: stats.totalCorrect + (g.correct ? 1 : 0),
                    totalAnswered: stats.totalAnswered + 1,
                  });
                }}
              >
                {t("yes")}
              </button>
              <button
                type="button"
                className="b64-copy"
                disabled={!!feedback}
                onClick={() => {
                  setInput("no");
                  const g = grade(current, "no");
                  setFeedback({ correct: g.correct, expected: g.expected });
                  const ns = g.correct ? streak + 1 : 0;
                  setStreak(ns);
                  if (g.correct) setRoundCorrect((c) => c + 1);
                  persist({
                    bestStreak: Math.max(stats.bestStreak, ns),
                    totalCorrect: stats.totalCorrect + (g.correct ? 1 : 0),
                    totalAnswered: stats.totalAnswered + 1,
                  });
                }}
              >
                {t("no")}
              </button>
            </div>
          ) : (
            <div className="drill-answer-row">
              <input
                className="cidr-input mono"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (feedback ? next() : submit());
                }}
                placeholder={answerHint}
                disabled={!!feedback}
                autoComplete="off"
                spellCheck={false}
                aria-label={promptText}
              />
              {!feedback && (
                <button type="button" className="b64-copy" onClick={submit}>
                  {t("check")}
                </button>
              )}
            </div>
          )}

          {feedback && (
            <div className={feedback.correct ? "drill-feedback drill-feedback--ok" : "drill-feedback drill-feedback--no"}>
              <p className="drill-feedback-verdict">
                {feedback.correct ? t("correct") : t("incorrect", { answer: feedback.expected })}
              </p>
              <button type="button" className="b64-copy" onClick={next} autoFocus>
                {idx + 1 >= questions.length ? t("finish") : t("nextQ")}
              </button>
            </div>
          )}
        </div>
      )}

      {phase === "done" && (
        <div className="drill-done">
          <h3 className="jwt-panel-title">{t("roundOver")}</h3>
          <p className="drill-score mono">
            {t("roundScore", { correct: roundCorrect, n: questions.length })}
          </p>
          <div className="fc-export-row">
            <button type="button" className="b64-copy" onClick={startRound}>
              {t("again")}
            </button>
            <button type="button" className="b64-copy" onClick={() => setPhase("config")}>
              {t("changeDifficulty")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
