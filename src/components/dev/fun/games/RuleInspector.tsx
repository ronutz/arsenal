// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/games/RuleInspector.tsx
// ----------------------------------------------------------------------------
// RULE INSPECTOR, the desk (PRIME 08/11/2026, the arcade's first wave). One
// connection at a time arrives at the office's edge firewall; the player
// permits or denies it with two big buttons, A or the left arrow, D or the
// right arrow. Beside it lie the policy, read from the top, and the state
// table of the connections the policy has let open this round. Before the
// second and the third round a change tightens the policy (the notice names
// it and shows the inserted rules; the clock stops while it is read). After
// the fifteenth call the audit lists every wrong call and what decided it:
// the first matching rule (and the opposite rule below it that first match
// never read), the state table, or the implicit deny.
//
// The rules live in src/lib/fun/games/rule-inspector/engine.ts, which decides
// every connection; this file only shows the desk, takes the calls and keeps
// the clock. Two modes: today's shift (the same for everyone on a UTC day,
// saved after every call, so a reload resumes it behind a Resume cover and
// the clock waits for it; it posts to the public board when it ends) and
// practice shifts from a seed picked here. House rules: Start comes before
// anything of the shift is on the page and starts the clock; the frame
// flashes, shakes and buzzes at the end; reduced motion drops the card's
// arrival; the keys are shown on the buttons; every target is 44 px or more.
// ============================================================================

"use client";

// React's state, effects, refs, memo and callbacks.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// The game's strings and the shell's.
import { useTranslations } from "next-intl";
// Locale-aware links inside the site.
import { Link } from "@/i18n/navigation";
// The frame: stats, rules, result.
import GameShell, { type ShellResult } from "./GameShell";
// The Start cover and the clock that counts only visible time (shared with the grid puzzles).
import { StartCover, useRoundClock } from "./LogicPuzzleKit";
// Today's UTC day (or the earlier day in play), the earlier day, the reduced-motion preference.
import { useEarlierDay, useReducedMotion, useToday } from "@/lib/fun/hooks";
// The puzzle number of a day.
import { puzzleNumber } from "@/lib/fun/daily";
// The share card and the time format.
import { formatDuration, shareText } from "@/lib/fun/share";
// The record: the day's saved state and the results.
import { loadRecord, recordResult, saveDailyState } from "@/lib/fun/storage";
// The site's single-key shortcuts stand down while a shift owns A and D.
import { setSiteShortcutsSuppressed } from "@/lib/pageCapabilities";
// The rules.
import {
  GAME_ID,
  ICMP_ECHO,
  PASS_MARK,
  PER_ROUND,
  PROTOCOLS,
  ROUNDS,
  SHIFT_SIZE,
  SPECIAL_SOURCES,
  dailyShift,
  grade,
  practiceShift,
  serviceName,
  shareRows,
  specialBlockOf,
  stateBefore,
  type Action,
  type Decision,
  type Packet,
  type Rule,
  type Shift,
} from "@/lib/fun/games/rule-inspector/engine";

/** The connection card's element id: the answer buttons are described by it. */
const CARD_ID = "fg-ri-card";

/** The two modes. */
type Mode = "daily" | "practice";

/** Where the shift stands: before Start (or before Resume), a change notice, a connection on the desk, or over. */
type Phase = "cover" | "notice" | "desk" | "done";

/** What is saved for today's shift: the calls so far and the clock. */
interface DailySave {
  /** One letter a call, p (permit) or d (deny). */
  calls: string;
  /** Milliseconds counted so far. */
  e: number;
  /** The final time, once the fifteenth call is made. */
  t?: number;
  /** True once the shift is over. */
  done?: boolean;
}

/** The game's translator, as this file uses it. */
type T = (key: string, values?: Record<string, string | number>) => string;

/**
 * A usable time from a saved shift (a missing or damaged field counts as none).
 *
 * @param x the stored value
 * @returns milliseconds, or null
 */
function savedMs(x: unknown): number | null {
  // A finite, non-negative number only.
  return typeof x === "number" && Number.isFinite(x) && x >= 0 ? x : null;
}

/**
 * The calls of a saved shift, cleaned (only p and d, at most fifteen).
 *
 * @param x the stored value
 * @returns the calls, or null when there are none
 */
function savedCalls(x: unknown): string | null {
  // Text of p and d only.
  return typeof x === "string" && /^[pd]*$/.test(x) ? x.slice(0, SHIFT_SIZE) : null;
}

/**
 * The mark of a kept daily state, for days played before the marks existed (GameShell's gradeSaved): the fifteen
 * calls against that day's shift, with the pass mark.
 *
 * @param day the shift's day
 * @param state the kept state
 * @returns 1 passed, 0 finished below the mark, null not finished
 */
function gradeSaved(day: string, state: unknown): 0 | 1 | null {
  // The saved calls.
  const calls = savedCalls((state as Partial<DailySave> | null)?.calls);
  // Finished means every connection called.
  if (calls === null || calls.length < SHIFT_SIZE) return null;
  // Passed or not.
  return grade(dailyShift(day), calls).right >= PASS_MARK ? 1 : 0;
}

/**
 * A fresh seed for a practice shift (the component picks it; the engine stays pure).
 *
 * @returns an unsigned 32-bit number
 */
function freshSeed(): number {
  // One random word from the platform.
  const a = new Uint32Array(1);
  // Filled.
  crypto.getRandomValues(a);
  // The seed.
  return a[0];
}

/**
 * An address as a rule shows it: a single host without its /32.
 *
 * @param prefix the prefix
 * @returns the text
 */
function addrText(prefix: string): string {
  // A host prefix reads as the host.
  return prefix.endsWith("/32") ? prefix.slice(0, -3) : prefix;
}

/**
 * A protocol as the desk names it: its IANA keyword, with the number for the ones without ports.
 *
 * @param proto the protocol
 * @returns the keyword, for example "TCP" or "ESP (50)"
 */
function protoName(proto: Packet["proto"]): string {
  // The registry's entry.
  const p = PROTOCOLS[proto];
  // TCP and UDP by name alone; the others with their number.
  return proto === "tcp" || proto === "udp" ? p.keyword : `${p.keyword} (${p.number})`;
}

/**
 * Ports as a rule shows them: each number with its IANA service name.
 *
 * @param r the rule
 * @param t the game's strings
 * @returns the text, or "" when the rule names no port
 */
function portsText(r: Rule, t: T): string {
  // No ports named.
  if (r.ports === null) return "";
  // Each port with its name.
  const list = r.ports.map((p) => `${p} (${serviceName(r.proto ?? "tcp", p) ?? "?"})`).join(", ");
  // "port 443 (https)" or "ports 500 (isakmp), 4500 (ipsec-nat-t)".
  return ` ${t(r.ports.length > 1 ? "word.ports" : "word.port")} ${list}`;
}

/**
 * A rule as the policy lists it, after its number and action: direction, protocol, source, destination, ports.
 *
 * @param r the rule
 * @param t the game's strings
 * @returns the text
 */
function ruleText(r: Rule, t: T): string {
  // The source: anyone, the special-purpose blocks, or the prefixes.
  const src = r.src === null ? t("word.any") : r.srcSet === "special" ? t("word.special") : r.src.map(addrText).join(", ");
  // The destination.
  const dst = r.dst === null ? t("word.any") : r.dst.map(addrText).join(", ");
  // The protocol, or any.
  const proto = r.proto === null ? t("word.anyProto") : protoName(r.proto);
  // All of it.
  return `${t(r.dir === "in" ? "word.in" : "word.out")} ${proto} ${src} → ${dst}${portsText(r, t)}`;
}

/**
 * A connection in one line, as the audit and the state table show it.
 *
 * @param p the connection
 * @param t the game's strings
 * @returns the text
 */
function packetLine(p: Packet, t: T): string {
  // The ends, with ports where the protocol has them.
  const ends = p.sport === null ? `${p.src} → ${p.dst}` : `${p.src}:${p.sport} → ${p.dst}:${p.dport}`;
  // The flags, or the ICMP type.
  const extra = p.flags ? ` ${t(`flagShort.${p.flags}`)}` : p.icmpType !== null ? ` ${t("typeShort", { n: p.icmpType })}` : "";
  // Direction, protocol, ends, extra.
  return `${t(p.dir === "in" ? "word.in" : "word.out")} ${protoName(p.proto)} ${ends}${extra}`;
}

/**
 * A connection in words, for screen readers: where it comes from, what it is, and its ends.
 *
 * @param p the connection
 * @param n its number in the shift (1-based)
 * @param t the game's strings
 * @returns one sentence
 */
function describe(p: Packet, n: number, t: T): string {
  // "Connection 4 of 15: inbound, from the internet. TCP ...".
  return `${t("connectionOf", { n, total: SHIFT_SIZE })}: ${t(p.dir === "in" ? "dirIn" : "dirOut")}. ${packetLine(p, t)}.`;
}

/**
 * Why the policy decides a connection the way it does, for the audit.
 *
 * @param d the decision
 * @param p the connection
 * @param policy the round's policy
 * @param t the game's strings
 * @returns one or two sentences
 */
function reason(d: Decision, p: Packet, policy: readonly Rule[], t: T): string {
  // The state table let it through.
  if (d.by === "state") return t("byState", { n: (d.opener ?? 0) + 1, seq: d.openerSeq ?? 0 });
  // The state table refused it.
  if (d.by === "no-state") return t("byNoState");
  // Nothing matched.
  if (d.by === "implicit") return t("byImplicit");
  // The deciding rule.
  const r = policy.find((x) => x.id === d.rule);
  // Its words.
  const rule = r ? `${r.seq} ${r.action} ${ruleText(r, t)}` : String(d.seq ?? "");
  // A special-purpose source: named with its block.
  const block = d.rule === "spoofSpecial" ? specialBlockOf(p.src) : null;
  // The rule, the block, and the rule below that first match never read.
  return [t("byRule", { rule }), block ? t("bySpecial", { addr: p.src, block: block.prefix, name: block.name, rfc: block.rfc }) : "", d.shadow ? t("byShadow", { below: d.shadow.seq, action: t(d.shadow.action === "permit" ? "verbPermit" : "verbDeny") }) : ""].filter((s) => s !== "").join(" ");
}

/**
 * The Rule Inspector game.
 *
 * @param props the page's locale
 * @returns the game in its shell
 */
export default function RuleInspector({ locale }: { locale: string }) {
  // The game's strings.
  const t = useTranslations("devFun.games.rule-inspector") as unknown as T;
  // The shell's strings.
  const tc = useTranslations("devFun.games.common");
  // The day in play, after mount (today's, or an earlier day's on a ?day= page).
  const today = useToday();
  // The earlier day in play, for the wording, or null.
  const earlierDay = useEarlierDay();
  // Whether to keep motion down.
  const reduce = useReducedMotion();
  // The mode.
  const [mode, setMode] = useState<Mode>("daily");
  // The practice shift's seed (picked when practice starts).
  const [seed, setSeed] = useState<number | null>(null);
  // The calls so far.
  const [calls, setCalls] = useState("");
  // Where the shift stands.
  const [phase, setPhase] = useState<Phase>("cover");
  // Whether the daily shift on the page was restored finished (its audit starts folded, nothing flashes).
  const [restoredDone, setRestoredDone] = useState(false);
  // The finished shift's time, or null.
  const [finalMs, setFinalMs] = useState<number | null>(null);
  // The stats line re-reads storage when this changes.
  const [version, setVersion] = useState(0);
  // The polite announcement.
  const [say, setSay] = useState("");
  // The calls as the clock's saves and the key handler read them between renders.
  const callsRef = useRef("");
  // The phase as the key handler reads it.
  const phaseRef = useRef<Phase>("cover");
  // The Permit button, focused for each new connection.
  const permitRef = useRef<HTMLButtonElement | null>(null);
  // The notice's Start button, focused when a change is shown.
  const roundRef = useRef<HTMLButtonElement | null>(null);
  // The clock: it runs only while a connection waits on the desk; today's shift saves it as it goes.
  const clock = useRoundClock((ms) => {
    // Only today's shift keeps its time, and only while it is on the desk.
    if (mode === "daily" && today && phaseRef.current === "desk") saveDailyState(GAME_ID, today, { calls: callsRef.current, e: ms } satisfies DailySave);
  });

  // The shift on the desk: the day's, or the practice seed's.
  const shift: Shift | null = useMemo(() => (mode === "daily" ? (today ? dailyShift(today) : null) : seed !== null ? practiceShift(seed) : null), [mode, today, seed]);

  // Keep the refs in step with the state.
  callsRef.current = calls;
  phaseRef.current = phase;

  // Today's shift comes back from storage once the day is known.
  useEffect(() => {
    // Not before mount.
    if (!today) return;
    // The saved state.
    const saved = loadRecord(GAME_ID).daily[today] as Partial<DailySave> | undefined;
    // Its calls.
    const c = savedCalls(saved?.calls);
    // Nothing saved: the cover waits for Start.
    if (c === null) return;
    // Restored.
    setCalls(c);
    callsRef.current = c;
    // The clock so far.
    const e = savedMs(saved?.e) ?? 0;
    // Finished: the result again, the clock stopped at the final time.
    if (c.length >= SHIFT_SIZE) {
      // The final time.
      const fin = savedMs(saved?.t) ?? e;
      // Shown.
      setFinalMs(fin);
      clock.reset(fin);
      // Over, restored.
      setRestoredDone(true);
      setPhase("done");
      // Done here.
      return;
    }
    // Mid-shift: the clock waits at its saved total.
    clock.reset(e);
    // At a round's end the change notice comes next; mid-round the cover offers Resume.
    setPhase(c.length > 0 && c.length % PER_ROUND === 0 ? "notice" : "cover");
    // The clock's functions are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);

  // Start, or resume, today's shift: the desk and the clock together.
  const startDaily = () => {
    // Only today's shift, known and not over.
    if (mode !== "daily" || !today || phase !== "cover") return;
    // A fresh shift is saved at once, so a reload resumes it rather than covering it again.
    if (callsRef.current.length === 0) saveDailyState(GAME_ID, today, { calls: "", e: 0 } satisfies DailySave);
    // The clock from where it stood.
    clock.start(clock.now());
    // The desk.
    setPhase("desk");
    // The first connection, announced through the buttons it describes.
    window.setTimeout(() => permitRef.current?.focus(), 0);
  };

  // Start a practice shift: a new seed, the desk and the clock together (the press is the Start).
  const startPractice = () => {
    // Leaving today's shift mid-round: its time so far is saved, so coming back resumes it where it was.
    if (mode === "daily" && phase === "desk" && today) saveDailyState(GAME_ID, today, { calls: callsRef.current, e: clock.stop() } satisfies DailySave);
    // A new shift.
    setSeed(freshSeed());
    // Practice.
    setMode("practice");
    // Nothing called.
    setCalls("");
    callsRef.current = "";
    // No final time.
    setFinalMs(null);
    // Not a restored result.
    setRestoredDone(false);
    // The clock from zero.
    clock.start(0);
    // The desk.
    setPhase("desk");
    // Focus the answers.
    window.setTimeout(() => permitRef.current?.focus(), 0);
  };

  // Back to today's shift, as storage has it.
  const showDaily = () => {
    // Leaving practice stops its clock.
    if (mode === "practice") clock.reset(0);
    // Today's shift.
    setMode("daily");
    // As saved.
    const saved = today ? (loadRecord(GAME_ID).daily[today] as Partial<DailySave> | undefined) : undefined;
    // Its calls.
    const c = savedCalls(saved?.calls) ?? "";
    // Restored.
    setCalls(c);
    callsRef.current = c;
    // Its time.
    const e = savedMs(saved?.e) ?? 0;
    // Finished, at a round's end, or waiting for Start or Resume.
    if (c.length >= SHIFT_SIZE) {
      // The final time.
      const fin = savedMs(saved?.t) ?? e;
      // Shown.
      setFinalMs(fin);
      clock.reset(fin);
      // Over.
      setRestoredDone(true);
      setPhase("done");
    } else {
      // Waiting.
      clock.reset(e);
      // The notice at a round's end, else the cover.
      setPhase(c.length > 0 && c.length % PER_ROUND === 0 ? "notice" : "cover");
      // No final time.
      setFinalMs(null);
    }
  };

  // The next round after a change notice: the desk and the clock again.
  const startRound = () => {
    // Only from the notice.
    if (phase !== "notice") return;
    // The clock carries on from its total.
    clock.start(clock.now());
    // The desk.
    setPhase("desk");
    // Focus the answers.
    window.setTimeout(() => permitRef.current?.focus(), 0);
  };

  // Make a call on the connection on the desk.
  const call = useCallback(
    (action: Action) => {
      // Only with a connection on the desk.
      if (!shift || phaseRef.current !== "desk") return;
      // The calls with this one.
      const next = callsRef.current + (action === "permit" ? "p" : "d");
      // Kept.
      callsRef.current = next;
      setCalls(next);
      // Over after the fifteenth.
      const over = next.length >= SHIFT_SIZE;
      // A round's end before that.
      const boundary = !over && next.length % PER_ROUND === 0;
      // The clock stops at a round's end and at the end; it runs on otherwise.
      const ms = over || boundary ? clock.stop() : clock.now();
      // Today's shift is saved after every call.
      if (mode === "daily" && today) {
        // Over: the final time, marked done, saved before the result is recorded (the board reads it).
        if (over) saveDailyState(GAME_ID, today, { calls: next, e: ms, t: ms, done: true } satisfies DailySave);
        // Otherwise the calls and the clock.
        else saveDailyState(GAME_ID, today, { calls: next, e: ms } satisfies DailySave);
      }
      // The end of the shift.
      if (over) {
        // The grade.
        const g = grade(shift, next);
        // The final time.
        setFinalMs(ms);
        // Over.
        setPhase("done");
        // Played now, not restored.
        setRestoredDone(false);
        // Recorded: today's shift for the streak and the board, practice for the best score.
        if (today) recordResult(GAME_ID, mode === "daily" ? { dayKey: today, won: g.right >= PASS_MARK, daily: true } : { dayKey: today, won: g.right >= PASS_MARK, score: g.right, higherIsBetter: true });
        // The stats line re-reads; the frame flashes.
        setVersion((v) => v + 1);
        // Announced.
        setSay(t("sayDone", { right: g.right, total: SHIFT_SIZE }));
        // Done.
        return;
      }
      // A round's end: the change notice.
      if (boundary) {
        // The notice.
        setPhase("notice");
        // Its button takes the focus.
        window.setTimeout(() => roundRef.current?.focus(), 0);
        // Announced.
        setSay(t("sayRoundOver", { r: next.length / PER_ROUND }));
        // Done.
        return;
      }
      // The next connection, announced (the call itself is logged without a verdict: the audit comes at the end).
      const p = shift.rounds[Math.floor(next.length / PER_ROUND)].packets[next.length % PER_ROUND];
      // Spoken.
      setSay(`${t(action === "permit" ? "sayPermitted" : "sayDenied")} ${describe(p, next.length + 1, t)}`);
    },
    // The clock's functions are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shift, mode, today, t],
  );

  // The keys: A or the left arrow permits, D or the right arrow denies, while a connection is on the desk.
  useEffect(() => {
    // Only on the desk.
    if (phase !== "desk") return;
    // One listener on the window.
    const onKey = (e: KeyboardEvent) => {
      // Shortcuts with modifiers and held-down repeats are not calls.
      if (e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
      // The element in focus.
      const el = e.target as HTMLElement | null;
      // Fields keep their keys.
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)) return;
      // Permit.
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") {
        // Not typing or scrolling.
        e.preventDefault();
        // Called.
        call("permit");
      } else if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") {
        // Not typing or scrolling.
        e.preventDefault();
        // Called.
        call("deny");
      }
    };
    // Listening.
    window.addEventListener("keydown", onKey);
    // Stopped.
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, call]);

  // While a shift is under way, A and D are the game's, not the site's shortcuts.
  useEffect(() => {
    // Only on the desk and at a notice.
    if (phase !== "desk" && phase !== "notice") return;
    // The site's shortcuts off.
    setSiteShortcutsSuppressed(true);
    // Back on when the shift ends or the page goes.
    return () => setSiteShortcutsSuppressed(false);
  }, [phase]);

  // The connection on the desk, its round and its number.
  const index = Math.min(calls.length, SHIFT_SIZE - 1);
  // The round on the desk (at a notice, the round about to start).
  const roundIdx = Math.min(Math.floor(calls.length / PER_ROUND), ROUNDS - 1);
  // The round.
  const round = shift?.rounds[roundIdx] ?? null;
  // The connection.
  const packet = round && phase === "desk" ? round.packets[calls.length % PER_ROUND] : null;
  // The state table before it.
  const table = shift && phase === "desk" ? stateBefore(shift, index) : [];
  // The grade so far (the audit and the result).
  const graded = shift ? grade(shift, calls) : { right: 0, oks: [] as boolean[] };
  // The time on show: the finished shift's, else the clock's.
  const shownTime = phase === "done" && finalMs !== null ? finalMs : clock.ms;

  // The result for the shell.
  let result: ShellResult | null = null;
  // Only a finished shift.
  if (phase === "done" && shift && today && calls.length >= SHIFT_SIZE) {
    // Passed or not.
    const won = graded.right >= PASS_MARK;
    // The time line.
    const time = finalMs !== null ? ` ${t("timeTaken", { time: formatDuration(finalMs) })}` : "";
    // The result.
    result = {
      // Passed at the mark.
      won,
      // "13 of 15 calls right" (practice says so).
      headline: t(mode === "daily" ? "dailyHeadline" : "practiceHeadline", { right: graded.right, total: SHIFT_SIZE }),
      // Passed or below the mark, and the time.
      detail: `${t(won ? "detailPass" : "detailFail", { pass: PASS_MARK })}${time}`,
      // The card: the title with the score, a row of squares a round, the time; never which way a connection went.
      share: shareText({
        title: mode === "daily" ? t("shareTitle", { n: puzzleNumber(today), right: graded.right, total: SHIFT_SIZE }) : t("sharePractice", { right: graded.right, total: SHIFT_SIZE }),
        lines: [...shareRows(graded.oks), ...(finalMs !== null ? [`⏱️ ${formatDuration(finalMs)}`] : [])],
        locale,
        slug: GAME_ID,
      }),
    };
  }

  // The rules under "How to play".
  const rules = (
    <ul>
      {["rule1", "rule2", "rule3", "rule4", "rule5", "rule6"].map((k) => (
        <li key={k}>{t(k, { pass: PASS_MARK, total: SHIFT_SIZE })}</li>
      ))}
    </ul>
  );

  // The policy as a list: number, action, the rest; the rules a change just added marked.
  const policyList = (policy: readonly Rule[], added: readonly string[], onlyAdded = false) => (
    <ol className="fg-ri-rules" aria-label={t("policyTitle")}>
      {policy
        .filter((r) => !onlyAdded || added.includes(r.id))
        .map((r) => (
          <li key={r.id} className={`fg-ri-rule fg-ri-rule-${r.action}${added.includes(r.id) ? " fg-ri-rule-new" : ""}`}>
            <span className="fg-ri-seq">{r.seq}</span>
            <span className="fg-ri-act">{r.action}</span>
            <span className="fg-ri-what">{ruleText(r, t)}</span>
            {added.includes(r.id) && !onlyAdded && <span className="fg-ri-new">{t("policyNew")}</span>}
          </li>
        ))}
      {/* The end of the list, written out. */}
      {!onlyAdded && (
        <li className="fg-ri-rule fg-ri-rule-implicit">
          <span className="fg-ri-seq" aria-hidden="true">
            ·
          </span>
          <span className="fg-ri-act">deny</span>
          <span className="fg-ri-what">{t("implicitRow")}</span>
        </li>
      )}
    </ol>
  );

  // The special-purpose blocks, when the policy names them.
  const specialRule = round?.policy.find((r) => r.srcSet === "special") ?? null;

  // The game in its shell.
  return (
    <GameShell
      gameId={GAME_ID}
      // Today's shift is a daily run in the frame (its number, the streak); practice keeps the best score.
      kind={mode === "daily" ? "daily" : "score"}
      today={today}
      rules={rules}
      // No result while the shift is under way.
      result={result}
      onPlayAgain={startPractice}
      // The best practice score, out of fifteen.
      formatBest={(b) => t("bestFormat", { n: b, total: SHIFT_SIZE })}
      version={version}
      gradeSaved={gradeSaved}
    >
      {/* The polite announcer. */}
      <p className="sr-only" aria-live="polite">
        {say}
      </p>

      {/* The modes. */}
      <div className="fg-ri-modes" role="group" aria-label={t("modeLabel")}>
        <button type="button" className="fg-button fg-ri-mode" aria-pressed={mode === "daily"} onClick={showDaily}>
          {today ? t(earlierDay ? "dailyModeEarlier" : "dailyMode", { n: puzzleNumber(today) }) : t("dailyModeName")}
        </button>
        <button type="button" className="fg-button fg-ri-mode" aria-pressed={mode === "practice"} onClick={startPractice}>
          {t("practiceMode")}
        </button>
      </div>

      {/* Before mount: a neutral line, the same on the server and the first render. */}
      {!today && <p className="fg-muted">{tc("loading")}</p>}

      {/* The heads-up line: the round, the connection, the clock. */}
      {today && shift && phase !== "cover" && (
        <div className="fg-hud fg-ri-hud">
          <span className="fg-readout">{t("roundOf", { r: roundIdx + 1, rounds: ROUNDS })}</span>
          <span className="fg-readout">{phase === "done" ? t("calledAll", { total: SHIFT_SIZE }) : phase === "desk" ? t("connectionOf", { n: calls.length + 1, total: SHIFT_SIZE }) : t("calledOf", { n: calls.length, total: SHIFT_SIZE })}</span>
          <span className="fg-readout" aria-label={`${tc("time")} ${formatDuration(shownTime)}`}>
            <span className="fg-small fg-muted">{tc("time")}</span> {formatDuration(shownTime)}
          </span>
        </div>
      )}

      {/* Today's shift before Start, or before Resume after a reload: the cover, and nothing of the shift. */}
      {today && mode === "daily" && phase === "cover" && (
        <StartCover label={calls.length > 0 ? t("resume") : tc("start")} note={calls.length > 0 ? t("resumeNote") : t("startNote", { total: SHIFT_SIZE, rounds: ROUNDS })} onStart={startDaily} className="fg-ri-cover" />
      )}

      {/* A change between rounds: what it is, the rules it inserts, and the button that starts the next round. */}
      {today && shift && phase === "notice" && round?.change && (
        <div className="fg-ri-notice" role="region" aria-labelledby="fg-ri-notice-title">
          <p className="fg-ri-notice-kicker">{t("noticeKicker", { r: roundIdx + 1, n: roundIdx, of: ROUNDS - 1 })}</p>
          <h3 id="fg-ri-notice-title" className="fg-ri-notice-title">
            {t(`changes.${round.change}.title`)}
          </h3>
          <p className="fg-ri-notice-why">{t(`changes.${round.change}.why`)}</p>
          {policyList(round.policy, round.added, true)}
          <div className="fg-buttons">
            <button type="button" ref={roundRef} className="fg-button fg-button-primary" onClick={startRound}>
              {t("startRound", { r: roundIdx + 1 })}
            </button>
          </div>
          <p className="fg-small fg-muted fg-ri-notice-note">{t("noticeNote")}</p>
        </div>
      )}

      {/* The desk: the connection and the answers, the policy and the state table beside them. */}
      {today && shift && round && packet && phase === "desk" && (
        <div className="fg-ri-desk">
          <div className="fg-ri-main">
            {/* The connection, as the firewall reads its headers. */}
            <article id={CARD_ID} key={index} className={`fg-ri-card fg-ri-card-${packet.dir}${reduce ? "" : " fg-ri-arrive"}`} aria-label={describe(packet, index + 1, t)}>
              <p className="fg-ri-card-head">
                <span className="fg-ri-dir">{t(packet.dir === "in" ? "dirIn" : "dirOut")}</span>
                <span className="fg-ri-num fg-mono">#{index + 1}</span>
              </p>
              <dl className="fg-ri-fields">
                <dt>{t("protoLabel")}</dt>
                <dd className="fg-mono">{t("protoValue", { name: PROTOCOLS[packet.proto].keyword, n: PROTOCOLS[packet.proto].number })}</dd>
                <dt>{t("fromLabel")}</dt>
                <dd className="fg-mono">{packet.sport === null ? packet.src : `${packet.src} : ${packet.sport}`}</dd>
                <dt>{t("toLabel")}</dt>
                <dd className="fg-mono">{packet.dport === null ? packet.dst : `${packet.dst} : ${packet.dport}`}</dd>
                {packet.flags && (
                  <>
                    <dt>{t("flagsLabel")}</dt>
                    <dd>
                      <span className="fg-mono fg-ri-flag">{t(`flagShort.${packet.flags}`)}</span> <span className="fg-muted fg-small">{t(`flagGloss.${packet.flags}`)}</span>
                    </dd>
                  </>
                )}
                {packet.icmpType !== null && (
                  <>
                    <dt>{t("typeLabel")}</dt>
                    <dd className="fg-mono">{packet.icmpType === ICMP_ECHO ? t("icmpEcho") : packet.icmpType}</dd>
                  </>
                )}
              </dl>
            </article>
            {/* The two calls, with their keys on them. */}
            <div className="fg-ri-answers">
              <button type="button" ref={permitRef} className="fg-button fg-ri-answer fg-ri-answer-permit" aria-describedby={CARD_ID} onClick={() => call("permit")}>
                <span>{t("permit")}</span>
                <kbd className="fg-ri-key" aria-hidden="true">
                  A ←
                </kbd>
              </button>
              <button type="button" className="fg-button fg-ri-answer fg-ri-answer-deny" aria-describedby={CARD_ID} onClick={() => call("deny")}>
                <span>{t("deny")}</span>
                <kbd className="fg-ri-key" aria-hidden="true">
                  D →
                </kbd>
              </button>
            </div>
            <p className="fg-muted fg-small fg-ri-hint">{t("keysHint")}</p>
            {/* The shift's progress: a square a connection, filled once called (no verdicts until the audit). */}
            <ol className="fg-ri-strip" aria-label={t("stripLabel")}>
              {Array.from({ length: SHIFT_SIZE }, (_, i) => (
                <li key={i} className={`fg-ri-dot${i < calls.length ? " fg-ri-dot-done" : i === calls.length ? " fg-ri-dot-now" : ""}${i % PER_ROUND === 0 && i > 0 ? " fg-ri-dot-gap" : ""}`} aria-label={t(i < calls.length ? "dotDone" : i === calls.length ? "dotNow" : "dotOpen", { n: i + 1 })} />
              ))}
            </ol>
          </div>
          <div className="fg-ri-side">
            {/* The policy, read from the top. */}
            <section className="fg-ri-panel" aria-labelledby="fg-ri-policy-title">
              <h3 id="fg-ri-policy-title" className="fg-ri-panel-title">
                {t("policyTitle")}
              </h3>
              {policyList(round.policy, round.added)}
              {/* The special-purpose blocks the anti-spoofing rule names, by IANA's names. */}
              {specialRule && (
                <details className="fg-ri-special">
                  <summary className="fg-ri-special-title">{t("specialTitle", { seq: specialRule.seq })}</summary>
                  <ul className="fg-ri-special-list">
                    {SPECIAL_SOURCES.map((b) => (
                      <li key={b.prefix}>
                        <span className="fg-mono">{b.prefix}</span> <span className="fg-muted">{`${b.name}, ${b.rfc}`}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="fg-small fg-muted">{t("specialNote")}</p>
                </details>
              )}
            </section>
            {/* The state table: the connections the policy has let open this round. */}
            <section className="fg-ri-panel" aria-labelledby="fg-ri-state-title">
              <h3 id="fg-ri-state-title" className="fg-ri-panel-title">
                {t("stateTitle")}
              </h3>
              {table.length === 0 ? (
                <p className="fg-small fg-muted fg-ri-state-empty">{t("stateEmpty")}</p>
              ) : (
                <ul className="fg-ri-state">
                  {table.map((s) => (
                    <li key={s.opener} className="fg-mono">
                      {`${protoName(s.proto)} ${s.a}:${s.ap} ↔ ${s.b}:${s.bp}`} <span className="fg-muted">{t("stateBy", { n: s.opener + 1, seq: s.seq })}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}

      {/* The audit, once the shift is over: every wrong call and what decided it, then every connection. */}
      {phase === "done" && shift && calls.length >= SHIFT_SIZE && (
        <section className="fg-ri-audit" aria-labelledby="fg-ri-audit-title">
          <h3 id="fg-ri-audit-title" className="fg-ri-audit-title">
            {t("auditTitle")}
          </h3>
          <p className="fg-ri-audit-lead">{graded.right === SHIFT_SIZE ? t("auditAllRight") : t("auditWrongCount", { n: SHIFT_SIZE - graded.right })}</p>
          {/* The wrong calls, each with its reason. */}
          {graded.right < SHIFT_SIZE && (
            <ol className="fg-ri-audit-list">
              {shift.decisions.map((d, i) => {
                // Only the wrong ones here.
                if (graded.oks[i]) return null;
                // The round and the connection.
                const rd = shift.rounds[Math.floor(i / PER_ROUND)];
                const p = rd.packets[i % PER_ROUND];
                // The entry.
                return (
                  <li key={i} className="fg-ri-audit-item fg-ri-audit-wrong" value={i + 1}>
                    <p className="fg-mono fg-ri-audit-pkt">{packetLine(p, t)}</p>
                    <p className="fg-ri-audit-call">{t("auditYou", { said: t(calls[i] === "p" ? "permit" : "deny"), right: t(d.action === "permit" ? "permit" : "deny") })}</p>
                    <p className="fg-small fg-ri-audit-why">{reason(d, p, rd.policy, t)}</p>
                  </li>
                );
              })}
            </ol>
          )}
          {/* Every connection, folded on a restored shift. */}
          <details className="fg-ri-audit-all" open={!restoredDone && graded.right === SHIFT_SIZE}>
            <summary className="fg-ri-audit-all-title">{t("auditAll", { total: SHIFT_SIZE })}</summary>
            <ol className="fg-ri-audit-list">
              {shift.decisions.map((d, i) => {
                // The round and the connection.
                const rd = shift.rounds[Math.floor(i / PER_ROUND)];
                const p = rd.packets[i % PER_ROUND];
                // The entry.
                return (
                  <li key={i} className={`fg-ri-audit-item ${graded.oks[i] ? "fg-ri-audit-right" : "fg-ri-audit-wrong"}`} value={i + 1}>
                    <p className="fg-mono fg-ri-audit-pkt">{packetLine(p, t)}</p>
                    <p className="fg-small fg-ri-audit-why">
                      <strong>{t(graded.oks[i] ? "auditRight" : "auditWrong")}</strong> {t(d.action === "permit" ? "auditPermit" : "auditDeny")} {reason(d, p, rd.policy, t)}
                    </p>
                  </li>
                );
              })}
            </ol>
          </details>
        </section>
      )}

      {/* Today's shift is done: practice is still open. */}
      {mode === "daily" && phase === "done" && <p className="fg-muted fg-small">{t(earlierDay ? "dailyDoneEarlier" : "dailyDone")}</p>}

      {/* Learn the real thing: the tool, the articles, and the game that builds the list instead. */}
      <p className="fg-small fg-ri-learn">
        <span className="fg-ri-learn-lead">{t("learnLead")}</span> <Link href="/tools/acl-first-match-evaluator">{t("learnTool")}</Link> · <Link href="/learn/access-control-lists-on-switches-and-routers">{t("learnAcl")}</Link> · <Link href="/learn/fortigate-policy-order">{t("learnFortigate")}</Link> · <Link href="/learn/checkpoint-security-policy-and-rule-base">{t("learnCheckpoint")}</Link> · <Link href="/learn/private-address-space">{t("learnPrivate")}</Link>
      </p>
      <p className="fg-small fg-muted fg-ri-learn">
        {/* First Match is an arcade game, at /arcade/first-match since 08/11/2026. */}
        {t("firstMatchLead")} <Link href="/arcade/first-match">{t("firstMatchLink")}</Link>
      </p>
    </GameShell>
  );
}
