// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/games/FirstMatch.tsx
// ----------------------------------------------------------------------------
// FIRST MATCH, the board (PRIME 03/11/2026). Twenty levels and a daily level
// of access-list ordering: read the policy, pick entries from the hand, order
// them, send the wave. Every packet is judged by the site's own access-list
// engine (src/lib/fun/games/first-match/engine.ts calls the ACL first-match
// evaluator), and the wave flies across a lane to show it; under reduced
// motion the lane is left out and the results are a plain list.
// Keyboard: every control is a button; in the list, the arrow keys move
// between entries, Shift with an arrow moves the entry, Delete removes it.
// ============================================================================

"use client";

// React's state, memo, effects, refs and callbacks.
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
// Strings.
import { useTranslations } from "next-intl";
// The frame every game sits in.
import GameShell, { type ShellResult } from "./GameShell";
// Today's day and the motion preference.
import { useReducedMotion, useToday } from "@/lib/fun/hooks";
// The puzzle number for the share card.
import { puzzleNumber } from "@/lib/fun/daily";
// The share card.
import { shareText } from "@/lib/fun/share";
// The one storage key.
import { loadRecord, recordResult, saveDailyState, updateRecord } from "@/lib/fun/storage";
// The rules of the game.
import { DAILY_WAVES, FM_ID, LEVELS, dailyLevel, judge, levelScore, solve, type FmClause, type FmJudgement, type FmLevel, type FmPacket } from "@/lib/fun/games/first-match/engine";

/** What a daily level keeps in storage. */
interface DailySave {
  /** The player's list, as card ids, top first. */
  order: string[];
  /** Each wave sent: which packets were judged right. */
  waves: boolean[][];
  /** Finished. */
  done: boolean;
  /** Passed. */
  won: boolean;
}

/** What the levels keep in the record's extra field. */
interface LevelsSave {
  /** The best score of each passed level, by key. */
  best: Record<string, number>;
  /** The level last open (0-based). */
  at: number;
}

/** The milliseconds between two packets of a wave, and one packet's flight. */
const STAGGER_MS = 220;
/** One packet's flight across the lane. */
const FLIGHT_MS = 1000;

/**
 * The board.
 *
 * @param props the page's locale, for the share card's address
 * @returns the game
 */
export default function FirstMatch({ locale }: { locale: string }) {
  // The game's strings.
  const t = useTranslations("devFun.games.first-match");
  // The shell's strings.
  const tc = useTranslations("devFun.games.common");
  // Today's UTC day (null until mount).
  const today = useToday();
  // The motion preference.
  const reduce = useReducedMotion();
  // Levels or the daily.
  const [mode, setMode] = useState<"levels" | "daily">("levels");
  // The open level (0-based).
  const [at, setAt] = useState(0);
  // The best score of each passed level.
  const [best, setBest] = useState<Record<string, number>>({});
  // The player's list: card ids, top first.
  const [order, setOrder] = useState<string[]>([]);
  // The waves sent on this level.
  const [waves, setWaves] = useState<FmJudgement[][]>([]);
  // The list as it was when the last wave was sent (its results describe that list only).
  const [sentOrder, setSentOrder] = useState<string[] | null>(null);
  // A wave in the air (the lane is animating it).
  const [flying, setFlying] = useState(false);
  // The round is over (passed, or the daily ran out of waves or was given up).
  const [over, setOver] = useState<null | { won: boolean; gaveUp: boolean }>(null);
  // The shell re-reads storage when this changes.
  const [version, setVersion] = useState(0);
  // The polite announcement line.
  const [live, setLive] = useState("");
  // The entry row to focus after a keyboard move.
  const focusRow = useRef<number | null>(null);
  // The list's rows, for focus.
  const rowRefs = useRef<(HTMLLIElement | null)[]>([]);
  // The flight timer.
  const flightTimer = useRef<number | null>(null);

  // The level on the board: a hand level, or today's daily (null before mount).
  const level: FmLevel | null = useMemo(() => {
    // The daily needs the day.
    if (mode === "daily") return today ? dailyLevel(today) : null;
    // A hand level.
    return LEVELS[at];
  }, [mode, at, today]);

  // Cards by id.
  const byId = useMemo(() => new Map((level?.cards ?? []).map((c) => [c.id, c])), [level]);
  // The list's entries as text.
  const lines = useMemo(() => order.map((id) => byId.get(id)?.line ?? "").filter((l) => l !== ""), [order, byId]);
  // The latest wave, while the list is still the one it was sent through (an edit makes its results stale).
  const last = waves.length > 0 && sentOrder !== null && sentOrder.join("|") === order.join("|") ? waves[waves.length - 1] : null;

  // On mount: the saved level progress.
  useEffect(() => {
    // The stored progress.
    const saved = loadRecord(FM_ID).extra as Partial<LevelsSave>;
    // The best scores.
    setBest(saved.best && typeof saved.best === "object" ? saved.best : {});
    // The level last open.
    if (typeof saved.at === "number" && saved.at >= 0 && saved.at < LEVELS.length) setAt(saved.at);
  }, []);

  // A new level (or mode): a fresh board, or the daily's saved state.
  useEffect(() => {
    // Any flight is cancelled.
    if (flightTimer.current !== null) window.clearTimeout(flightTimer.current);
    // Not flying.
    setFlying(false);
    // The daily restores what was saved for today.
    if (mode === "daily" && today && level) {
      // The saved state, if any.
      const saved = loadRecord(FM_ID).daily[today] as DailySave | undefined;
      // Restore it when it fits this level.
      if (saved && Array.isArray(saved.order) && saved.order.every((id) => level.cards.some((c) => c.id === id))) {
        // The list.
        setOrder(saved.order);
        // The list the last wave went through.
        setSentOrder(saved.order);
        // The last wave's judgements again from the engine; earlier waves as right-or-wrong marks only.
        const lastWave = judge(saved.order.map((id) => level.cards.find((c) => c.id === id)!.line), level.packets);
        // Earlier waves rebuilt from their marks (the share card only needs the marks).
        const rebuilt = (saved.waves ?? []).map((w, i, all) => (i === all.length - 1 ? lastWave : w.map((ok) => ({ action: "deny" as const, by: "entry" as const, rule: null, correct: ok }))));
        // The waves.
        setWaves(rebuilt);
        // Finished or not.
        setOver(saved.done ? { won: saved.won, gaveUp: !saved.won && rebuilt.length < DAILY_WAVES } : null);
        // Restored.
        return;
      }
    }
    // A fresh board.
    setOrder([]);
    // No waves.
    setWaves([]);
    // No list sent.
    setSentOrder(null);
    // Not over.
    setOver(null);
  }, [mode, today, level]);

  // Clear the flight timer on unmount.
  useEffect(() => () => {
    // Pending timer.
    if (flightTimer.current !== null) window.clearTimeout(flightTimer.current);
  }, []);

  // After a keyboard move, focus follows the moved entry.
  useEffect(() => {
    // Nothing to focus.
    if (focusRow.current === null) return;
    // The row.
    rowRefs.current[focusRow.current]?.focus();
    // Done.
    focusRow.current = null;
  }, [order]);

  /**
   * Save the daily state.
   *
   * @param next what to save
   */
  const saveDaily = useCallback((next: DailySave) => {
    // Only the daily is saved by day.
    if (mode !== "daily" || !today) return;
    // Written.
    saveDailyState(FM_ID, today, next);
  }, [mode, today]);

  // Whether the board takes moves.
  const locked = flying || over !== null || !level;

  /**
   * Add a card at the bottom of the list.
   *
   * @param id the card
   */
  const add = (id: string) => {
    // Not while locked.
    if (locked) return;
    // The new list.
    const next = [...order, id];
    // Set.
    setOrder(next);
    // Announced with its sequence number.
    setLive(t("live.added", { line: byId.get(id)?.line ?? "", seq: next.length * 10 }));
  };

  /**
   * Remove an entry.
   *
   * @param i its position
   */
  const remove = (i: number) => {
    // Not while locked.
    if (locked) return;
    // The entry.
    const id = order[i];
    // The new list.
    setOrder(order.filter((_, k) => k !== i));
    // Focus stays near.
    focusRow.current = Math.min(i, order.length - 2) >= 0 ? Math.min(i, order.length - 2) : null;
    // Announced.
    setLive(t("live.removed", { line: byId.get(id)?.line ?? "" }));
  };

  /**
   * Move an entry up or down.
   *
   * @param i its position
   * @param dir -1 up, +1 down
   */
  const move = (i: number, dir: -1 | 1) => {
    // Not while locked.
    if (locked) return;
    // The target position.
    const j = i + dir;
    // Off the ends.
    if (j < 0 || j >= order.length) return;
    // The swap.
    const next = order.slice();
    // Exchanged.
    [next[i], next[j]] = [next[j], next[i]];
    // Set.
    setOrder(next);
    // Focus follows.
    focusRow.current = j;
    // Announced with its new sequence number.
    setLive(t("live.moved", { line: byId.get(order[i])?.line ?? "", seq: (j + 1) * 10 }));
  };

  /**
   * Keys on a list row: arrows between rows, Shift+arrow moves, Delete removes.
   *
   * @param e the key event
   * @param i the row
   */
  const onRowKey = (e: KeyboardEvent<HTMLLIElement>, i: number) => {
    // Up.
    if (e.key === "ArrowUp") {
      // Not the browser's scroll.
      e.preventDefault();
      // With Shift, the entry moves; without, the focus.
      if (e.shiftKey) move(i, -1); else rowRefs.current[i - 1]?.focus();
    } else if (e.key === "ArrowDown") {
      // Not the browser's scroll.
      e.preventDefault();
      // With Shift, the entry moves; without, the focus.
      if (e.shiftKey) move(i, 1); else rowRefs.current[i + 1]?.focus();
    } else if (e.key === "Delete" || e.key === "Backspace") {
      // Not the browser's back.
      e.preventDefault();
      // Removed.
      remove(i);
    }
  };

  /**
   * Finish the round: record it, and save the daily.
   *
   * @param won passed or not
   * @param wavesSent the waves as sent
   * @param gaveUp whether the player asked for the answer
   */
  const finish = (won: boolean, wavesSent: FmJudgement[][], gaveUp: boolean) => {
    // The round is over.
    setOver({ won, gaveUp });
    // Nothing to record without a day or a level.
    if (!today || !level) return;
    // The daily: counters and streak, and the finished state.
    if (mode === "daily") {
      // Recorded once.
      recordResult(FM_ID, { dayKey: today, won, daily: true });
      // Saved finished.
      saveDaily({ order, waves: wavesSent.map((w) => w.map((j) => j.correct)), done: true, won });
    } else if (won) {
      // The level's score.
      const score = levelScore(level, lines.length, wavesSent.length);
      // The new bests.
      const nextBest = { ...best, [level.key]: Math.max(best[level.key] ?? 0, score) };
      // Kept on the board.
      setBest(nextBest);
      // The progress written.
      updateRecord(FM_ID, (r) => ({ ...r, extra: { ...r.extra, best: nextBest, at } }));
      // The campaign total is the score the shell shows as best.
      recordResult(FM_ID, { dayKey: today, won: true, score: Object.values(nextBest).reduce((a, b) => a + b, 0), higherIsBetter: true });
    }
    // The shell re-reads.
    setVersion((v) => v + 1);
  };

  /** Send the wave. */
  const send = () => {
    // Not while locked.
    if (locked || !level) return;
    // The engine judges every packet.
    const js = judge(lines, level.packets);
    // The waves so far.
    const all = [...waves, js];
    // Kept.
    setWaves(all);
    // The list it went through.
    setSentOrder(order);
    // How many right.
    const right = js.filter((j) => j.correct).length;
    // Passed when all are right.
    const passed = right === js.length;
    // The daily runs out of waves.
    const outOfWaves = mode === "daily" && !passed && all.length >= DAILY_WAVES;
    // What happens when the wave lands.
    const land = () => {
      // Landed.
      setFlying(false);
      // Announced.
      setLive(t("live.wave", { n: all.length, right, total: js.length }) + (passed ? ` ${t("live.passed")}` : ""));
      // A pass or the last wave ends the round.
      if (passed || outOfWaves) finish(passed, all, false);
      // Otherwise the daily saves its progress.
      else saveDaily({ order, waves: all.map((w) => w.map((j) => j.correct)), done: false, won: false });
    };
    // Reduced motion: no flight.
    if (reduce) { land(); return; }
    // The flight.
    setFlying(true);
    // Lands after the last packet's flight.
    flightTimer.current = window.setTimeout(land, STAGGER_MS * level.packets.length + FLIGHT_MS);
  };

  /** Give up the daily: show one shortest list. */
  const giveUp = () => {
    // Only on the daily, while playing.
    if (mode !== "daily" || locked) return;
    // Over, lost.
    finish(false, waves, true);
  };

  /** Replay the open level from scratch. */
  const replay = () => {
    // A fresh board.
    setOrder([]);
    // No waves.
    setWaves([]);
    // No list sent.
    setSentOrder(null);
    // Playing again.
    setOver(null);
  };

  /**
   * Open another level.
   *
   * @param i the level (0-based)
   */
  const openLevel = (i: number) => {
    // Inside the range.
    const k = Math.max(0, Math.min(LEVELS.length - 1, i));
    // Opened.
    setAt(k);
    // Remembered.
    updateRecord(FM_ID, (r) => ({ ...r, extra: { ...r.extra, at: k } }));
  };

  // One shortest list, for the answer after a lost daily (solved only when needed).
  const answer = useMemo(() => (over && !over.won && level ? solve(level).shortest[0]?.map((i) => level.cards[i].line) ?? [] : []), [over, level]);

  // The share card and the shell's result.
  const result: ShellResult | null = useMemo(() => {
    // Only when over.
    if (!over || !level) return null;
    // One emoji row per wave: green right, red wrong.
    const rows = waves.map((w) => w.map((j) => (j.correct ? "🟩" : "🟥")).join(""));
    // The rule count against par.
    const summary = t("share.rules", { rules: lines.length, par: level.par });
    // The daily.
    if (mode === "daily" && today) {
      // The card.
      const share = shareText({ title: `${t("cardName")} #${puzzleNumber(today)}`, lines: over.won ? rows : [...rows, "❌"], summary, locale, slug: FM_ID });
      // Passed or not.
      return over.won
        ? { won: true, headline: t("result.dailyPassed"), detail: t("result.detail", { rules: lines.length, par: level.par, waves: waves.length }), share }
        : { won: false, headline: over.gaveUp ? t("result.gaveUp") : t("result.outOfWaves"), detail: t("result.answerBelow"), share };
    }
    // A level.
    const score = levelScore(level, lines.length, waves.length);
    // The card.
    const share = shareText({ title: t("share.levelTitle", { name: t("cardName"), n: at + 1 }), lines: rows, summary, locale, slug: FM_ID });
    // Passed.
    return { won: true, headline: t("result.levelPassed", { n: at + 1 }), detail: `${tc("score")} ${score} · ${t("result.detail", { rules: lines.length, par: level.par, waves: waves.length })}`, share };
  }, [over, level, waves, lines.length, mode, today, t, tc, locale, at]);

  /**
   * A packet as one line of text.
   *
   * @param p the packet
   * @returns "TCP 203.0.113.7:51514 → 10.0.0.10:80 SYN"
   */
  const packetText = (p: FmPacket): string => {
    // ICMP has no ports.
    if (p.proto === "icmp") return `ICMP ${p.src} → ${p.dst}`;
    // TCP shows whether it is an opening segment or a reply.
    const flag = p.proto === "tcp" ? ` ${p.ack ? t("flagAck") : t("flagSyn")}` : "";
    // Protocol, ends, flag.
    return `${p.proto.toUpperCase()} ${p.src}:${p.sport} → ${p.dst}:${p.dport}${flag}`;
  };

  /**
   * What decided a packet, in words.
   *
   * @param j the judgement
   * @returns the sentence
   */
  const outcomeText = (j: FmJudgement): string => {
    // The empty-list rule.
    if (j.by === "empty-list") return t("outcome.empty");
    // The implicit deny.
    if (j.by === "implicit-deny") return t("outcome.implicit");
    // An entry, by its sequence number.
    return t(j.action === "permit" ? "outcome.permitBy" : "outcome.denyBy", { seq: ((j.rule ?? 0) + 1) * 10 });
  };

  /**
   * A daily clause in words.
   *
   * @param c the clause
   * @returns the sentence
   */
  const clauseText = (c: FmClause): string => {
    // The source in words.
    const source = c.src.kind === "any" ? t("src.any") : c.src.kind === "host" ? t("src.host", { ip: c.src.addr }) : t("src.net", { net: `${c.src.addr}/24` });
    // The service in words.
    const service = t(`svc.${c.svc}`);
    // With or without the excepted host.
    return c.except ? t("daily.clauseExcept", { service, host: c.host, source, except: c.except }) : t("daily.clause", { service, host: c.host, source });
  };

  // The rules under "How to play".
  const rules = (
    <ul>
      <li>{t("rules.r1")}</li>
      <li>{t("rules.r2")}</li>
      <li>{t("rules.r3")}</li>
      <li>{t("rules.r4")}</li>
      <li>{t("rules.r5")}</li>
    </ul>
  );

  // The cards still in the hand.
  const hand = level ? level.cards.filter((c) => !order.includes(c.id)) : [];
  // The waves left on the daily.
  const wavesLeft = DAILY_WAVES - waves.length;

  // The game.
  return (
    <GameShell gameId={FM_ID} kind={mode === "daily" ? "daily" : "score"} today={today} rules={rules} result={result} onPlayAgain={replay} formatBest={(b) => t("bestPoints", { n: b })} version={version}>
      <div className="fg-fm">
        {/* Levels or the daily. */}
        <div className="fg-buttons" role="group" aria-label={t("modeLabel")}>
          <button type="button" className={`fg-button${mode === "levels" ? " fg-button-primary" : ""}`} aria-pressed={mode === "levels"} onClick={() => setMode("levels")}>
            {t("modeLevels")}
          </button>
          <button type="button" className={`fg-button${mode === "daily" ? " fg-button-primary" : ""}`} aria-pressed={mode === "daily"} onClick={() => setMode("daily")}>
            {tc("daily")}
          </button>
        </div>

        {/* Before mount the daily has no day: a neutral board. */}
        {!level && <p className="fg-muted">{tc("loading")}</p>}

        {level && (
          <>
            {/* The level line: which level, its par, and the way to the others. */}
            <div className="fg-fm-levelbar">
              {mode === "levels" ? (
                <>
                  <button type="button" className="fg-button" onClick={() => openLevel(at - 1)} disabled={at === 0 || flying} aria-label={t("prevLevel")}>
                    ←
                  </button>
                  <span className="fg-readout">{t("levelOf", { n: at + 1, total: LEVELS.length })}</span>
                  <button type="button" className="fg-button" onClick={() => openLevel(at + 1)} disabled={at === LEVELS.length - 1 || flying} aria-label={t("nextLevel")}>
                    →
                  </button>
                </>
              ) : (
                <span className="fg-readout">{t("wavesLeft", { n: wavesLeft })}</span>
              )}
              <span className="fg-chip">{t("par", { n: level.par })}</span>
              {mode === "levels" && best[level.key] !== undefined && <span className="fg-chip fg-fm-passed">{t("passedMark", { score: best[level.key] })}</span>}
            </div>

            {/* The policy in plain words. */}
            <section className="fg-fm-policy" aria-labelledby="fg-fm-policy-h">
              <h2 id="fg-fm-policy-h" className="fg-fm-h">
                {mode === "levels" ? t(`levels.${level.key}.title`) : t("dailyTitle")}
              </h2>
              {mode === "levels" ? (
                <p className="fg-fm-policy-text">{t(`levels.${level.key}.policy`)}</p>
              ) : (
                <p className="fg-fm-policy-text">
                  {(level.clauses ?? []).map((c) => clauseText(c)).join(" ")} {t("daily.nothingElse")}
                </p>
              )}
            </section>

            <div className="fg-fm-cols">
              {/* The player's list. */}
              <section className="fg-fm-panel" aria-labelledby="fg-fm-list-h">
                <h2 id="fg-fm-list-h" className="fg-fm-h">{t("listTitle")}</h2>
                <p className="fg-fm-acl-head fg-mono">ip access-list extended FIRST-MATCH</p>
                {order.length === 0 && <p className="fg-muted fg-small">{t("emptyList")}</p>}
                <ol className="fg-fm-list">
                  {order.map((id, i) => {
                    // The deciding entry of a packet in the last wave is marked after a wave.
                    const decided = last ? last.filter((j) => j.rule === i).length : 0;
                    // The row.
                    return (
                      <li key={id} ref={(el) => { rowRefs.current[i] = el; }} className="fg-fm-row" tabIndex={0} onKeyDown={(e) => onRowKey(e, i)} aria-label={t("rowLabel", { seq: (i + 1) * 10, line: byId.get(id)?.line ?? "" })}>
                        <span className="fg-fm-seq fg-mono">{(i + 1) * 10}</span>
                        <span className="fg-fm-line fg-mono">{byId.get(id)?.line}</span>
                        {decided > 0 && !flying && <span className="fg-fm-hits fg-small">{t("hits", { n: decided })}</span>}
                        <span className="fg-fm-row-actions">
                          <button type="button" className="fg-button fg-fm-icon" onClick={() => move(i, -1)} disabled={locked || i === 0} aria-label={t("moveUp")}>↑</button>
                          <button type="button" className="fg-button fg-fm-icon" onClick={() => move(i, 1)} disabled={locked || i === order.length - 1} aria-label={t("moveDown")}>↓</button>
                          <button type="button" className="fg-button fg-fm-icon" onClick={() => remove(i)} disabled={locked} aria-label={t("remove")}>×</button>
                        </span>
                      </li>
                    );
                  })}
                </ol>
                {order.length > 0 && <p className="fg-fm-implicit fg-mono">{t("implicitDeny")}</p>}
                <p className="fg-muted fg-small">{t("keysHint")}</p>
              </section>

              {/* The hand. */}
              <section className="fg-fm-panel" aria-labelledby="fg-fm-hand-h">
                <h2 id="fg-fm-hand-h" className="fg-fm-h">{t("handTitle")}</h2>
                {hand.length === 0 && <p className="fg-muted fg-small">{t("handEmpty")}</p>}
                <ul className="fg-fm-hand">
                  {hand.map((c) => (
                    <li key={c.id}>
                      <button type="button" className="fg-fm-card" onClick={() => add(c.id)} disabled={locked} aria-label={t("addLabel", { line: c.line })}>
                        <span className="fg-fm-plus" aria-hidden="true">+</span>
                        <span className="fg-mono">{c.line}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* The wave in flight: sources on the left, the list in the middle, the servers on the right. */}
            {!reduce && (
              <div className="fg-fm-lane" aria-hidden="true">
                <span className="fg-fm-lane-from fg-small">{t("laneFrom")}</span>
                <span className="fg-fm-wall" />
                <span className="fg-fm-lane-to fg-small">{t("laneTo")}</span>
                <svg className="fg-fm-server" viewBox="0 0 24 24" focusable="false">
                  <rect x="4" y="3" width="16" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  <rect x="4" y="14" width="16" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  <circle cx="8" cy="6.5" r="1.1" fill="currentColor" />
                  <circle cx="8" cy="17.5" r="1.1" fill="currentColor" />
                </svg>
                {flying && last && level.packets.map((_, i) => (
                  <span key={`${waves.length}-${i}`} className={`fg-fm-pkt ${last[i].action === "permit" ? "fg-fm-pkt-pass" : "fg-fm-pkt-block"} ${last[i].correct ? "fg-fm-pkt-ok" : "fg-fm-pkt-bad"}`} style={{ "--fg-fm-i": i } as CSSProperties}>
                    {i + 1}
                  </span>
                ))}
              </div>
            )}

            {/* The wave as a list: what each packet is, and once landed, what happened and whether it was right. */}
            <section className="fg-fm-panel" aria-labelledby="fg-fm-wave-h">
              <h2 id="fg-fm-wave-h" className="fg-fm-h">{t("trafficTitle")}</h2>
              <ol className="fg-fm-wave">
                {level.packets.map((p, i) => {
                  // The judgement, shown once the wave has landed.
                  const j = last && !flying ? last[i] : null;
                  // The row.
                  return (
                    <li key={i} className={`fg-fm-pkt-row${j ? (j.correct ? " fg-fm-ok" : " fg-fm-bad") : ""}`}>
                      <span className="fg-fm-num fg-mono">{i + 1}</span>
                      <span className="fg-mono fg-fm-pkt-text">{packetText(p)}</span>
                      {j && (
                        <span className="fg-fm-verdict fg-small">
                          {outcomeText(j)}
                          {" · "}
                          {j.correct ? t("right") : t(p.expect === "permit" ? "wrongShouldPermit" : "wrongShouldDeny")}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>

            {/* The controls. */}
            {!over && (
              <div className="fg-buttons">
                <button type="button" className="fg-button fg-button-primary" onClick={send} disabled={locked}>
                  {flying ? t("sending") : t("send")}
                </button>
                <button type="button" className="fg-button" onClick={() => { setOrder([]); setLive(t("live.cleared")); }} disabled={locked || order.length === 0}>
                  {tc("clear")}
                </button>
                {mode === "daily" && (
                  <button type="button" className="fg-button" onClick={giveUp} disabled={locked}>
                    {tc("giveUp")}
                  </button>
                )}
              </div>
            )}

            {/* After a passed level: its lesson, and the next one. */}
            {over?.won && mode === "levels" && (
              <div className="fg-fm-lesson">
                <p className="fg-fm-h">{t("lessonTitle")}</p>
                <p>{t(`levels.${level.key}.lesson`)}</p>
                {at < LEVELS.length - 1 && (
                  <button type="button" className="fg-button fg-button-primary" onClick={() => openLevel(at + 1)}>
                    {t("nextLevel")}
                  </button>
                )}
                {at === LEVELS.length - 1 && <p className="fg-small fg-muted">{t("allDone")}</p>}
              </div>
            )}

            {/* After a lost daily: one shortest list. */}
            {over && !over.won && answer.length > 0 && (
              <div className="fg-fm-lesson">
                <p className="fg-fm-h">{t("answerTitle")}</p>
                <ol className="fg-fm-answer fg-mono">
                  {answer.map((l, i) => (
                    <li key={i}>{(i + 1) * 10} {l}</li>
                  ))}
                </ol>
              </div>
            )}
          </>
        )}

        {/* The polite announcement line. */}
        <p className="fg-fm-sr" aria-live="polite">{live}</p>
      </div>
    </GameShell>
  );
}
