// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/games/IncidentCommander.tsx
// ----------------------------------------------------------------------------
// INCIDENT COMMANDER, the console (PRIME 03/11/2026): an idle game about
// running a service. The simulation is the engine's
// (src/lib/fun/games/incident-commander); this component renders it, sends it
// the player's actions and one tick a second, and keeps the save in this
// browser's record for the game (extra.save and extra.savedAt), every few
// seconds and when the page is hidden. On the way back, the time away is
// credited at a reduced, capped rate and summed up in "While you were away".
//
// Review R3 (03/11/2026): a newly noticed incident is announced in the polite
// line, counted in the tab's title ("(1) Incident Commander") and, while the
// incidents panel is off screen, flagged by a chip at the bottom of the screen
// that takes the player to it (R3-12). The post-mortem's report opens where
// the button was pressed, with the finished run's numbers on its card and a
// "Close" that does what it says (R3-08, R3-13); it used to open in the frame's
// panel at the foot of the page, with the new run's numbers and "Play again".
// ============================================================================

"use client";

// React's state, effects, refs and memoisation.
import { useCallback, useEffect, useRef, useState } from "react";
// The game's strings and the shell's.
import { useTranslations } from "next-intl";
// The frame around every game.
import GameShell from "./GameShell";
// Today's UTC day and the reduced-motion preference.
import { useRealToday, useReducedMotion } from "@/lib/fun/hooks";
// The share card, the clipboard and the time format.
import { copyText, formatDuration, shareText } from "@/lib/fun/share";
// What this browser remembers.
import { loadRecord, recordResult, updateRecord } from "@/lib/fun/storage";
// The simulation.
import {
  GAME_ID,
  ITEMS,
  PRESTIGE_AT,
  SHIP_REVIEWED_S,
  SHIP_UNREVIEWED_S,
  BAD_REVIEWED,
  BAD_UNREVIEWED,
  FIRST_INCIDENT_S,
  act,
  compact,
  cost,
  derive,
  newGame,
  offline,
  restore,
  tick,
  type AwaySummary,
  type IcAction,
  type IcState,
  type ItemId,
} from "@/lib/fun/games/incident-commander/engine";

/** Seconds between saves. */
const SAVE_EVERY_MS = 5000;
/** A gap longer than this between ticks (a throttled or hidden tab) is credited as time away. */
const AWAY_GAP_S = 15;
/** Time away shorter than this gets no summary. */
const AWAY_SUMMARY_S = 60;

/** A written post-mortem, as its report shows it. */
interface PmReport {
  /** Post-mortems written, this one included. */
  n: number;
  /** Lessons learned in all. */
  lessons: number;
  /** The share card: the finished run's numbers. */
  share: string;
}

/**
 * Save the game in the record's extra field.
 *
 * @param s the state
 */
function save(s: IcState): void {
  // The state and the wall-clock time of the save.
  updateRecord(GAME_ID, (r) => ({ ...r, extra: { ...r.extra, save: s, savedAt: Date.now() } }));
}

/**
 * The console.
 *
 * @param props the page's locale (for numbers and the share card's address)
 * @returns the game
 */
export default function IncidentCommander({ locale }: { locale: string }) {
  // The game's strings and the shell's.
  const t = useTranslations("devFun.games.incident-commander");
  const tc = useTranslations("devFun.games.common");
  // Today, after mount.
  const today = useRealToday();
  // Reduced motion (the jump to the incidents is instant then).
  const reduce = useReducedMotion();
  // The game, loaded after mount.
  const [s, setS] = useState<IcState | null>(null);
  // "While you were away".
  const [away, setAway] = useState<AwaySummary | null>(null);
  // The post-mortem's report, shown under its button until closed.
  const [pm, setPm] = useState<PmReport | null>(null);
  // The report's copy button's feedback.
  const [pmCopied, setPmCopied] = useState<"idle" | "ok" | "fail">("idle");
  // Whether the incidents panel is on screen (the alert chip shows only when it is not).
  const [panelSeen, setPanelSeen] = useState(true);
  // The shell's stats line re-reads storage when this changes.
  const [version, setVersion] = useState(0);
  // The status copy button's feedback.
  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");
  // The polite line.
  const [say, setSay] = useState("");
  // The latest state, for the timers and the page-hide handler.
  const ref = useRef<IcState | null>(null);
  // Kept in step.
  ref.current = s;
  // The wall-clock time of the last tick.
  const lastTick = useRef(0);
  // Whether a save has been written (so a reset of the stats can be noticed).
  const saved = useRef(false);
  // The incidents already announced, by id.
  const announced = useRef<Set<number>>(new Set());
  // The incidents panel, watched and scrolled to.
  const panelRef = useRef<HTMLElement>(null);
  // The page's own title, before any count is put in front of it.
  const baseTitle = useRef<string | null>(null);
  // The title this component last set.
  const titleSet = useRef<string | null>(null);
  // The decimal separator of the page's language.
  const sep = locale === "pt-BR" ? "," : ".";
  // A compact number.
  const n = useCallback((x: number) => compact(x, sep), [sep]);
  // A number with one decimal, in the page's language (3,0 on a pt-BR page; review R3-08 found "3.0 noves").
  const one = useCallback((x: number) => x.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }), [locale]);

  // Load once mounted: the save, plus the time away; or a new game.
  useEffect(() => {
    // The record's extra field.
    const extra = loadRecord(GAME_ID).extra;
    // A usable save.
    const loaded = restore(extra.save);
    // None: a new game with a seed picked here (the engine stays pure).
    if (!loaded) {
      // New.
      const fresh = newGame(Math.floor(Math.random() * 0x100000000));
      // Kept.
      setS(fresh);
      // Done.
      lastTick.current = performance.now();
      return;
    }
    // Seconds since the save, by the wall clock.
    const awayS = typeof extra.savedAt === "number" ? Math.max(0, (Date.now() - extra.savedAt) / 1000) : 0;
    // A reload or a short absence just carries on (incidents in progress stay in progress).
    if (awayS <= AWAY_GAP_S) {
      // The few seconds simulated as usual.
      setS(tick(loaded, awayS));
    } else {
      // A real absence: credited at the reduced rate.
      const back = offline(loaded, awayS);
      // Kept.
      setS(back.state);
      // Summed up when it was long enough to matter.
      if (awayS >= AWAY_SUMMARY_S) setAway(back.summary);
    }
    // There is a save to watch.
    saved.current = true;
    // The clock.
    lastTick.current = performance.now();
  }, []);

  // One tick a second, measured by the clock; a long gap counts as time away.
  useEffect(() => {
    // Not loaded yet.
    if (!s) return;
    // The interval.
    const id = window.setInterval(() => {
      // The current state.
      const cur = ref.current;
      // Not loaded.
      if (!cur) return;
      // Seconds since the last tick.
      const now = performance.now();
      const dt = (now - lastTick.current) / 1000;
      lastTick.current = now;
      // A long gap: credited as time away.
      if (dt > AWAY_GAP_S) {
        // The reduced rate.
        const back = offline(cur, dt);
        // Kept.
        setS(back.state);
        // Summed up.
        if (dt >= AWAY_SUMMARY_S) setAway(back.summary);
        // Done.
        return;
      }
      // The step.
      setS(tick(cur, dt));
    }, 1000);
    // Stopped.
    return () => window.clearInterval(id);
    // The timer only needs to start once the game exists.
  }, [s === null]); // eslint-disable-line react-hooks/exhaustive-deps

  // Saves: every few seconds, and when the page is hidden or closed.
  useEffect(() => {
    // Not loaded.
    if (!s) return;
    // Save, unless the stats were reset (the save is gone): then start again.
    const write = () => {
      // The current state.
      const cur = ref.current;
      // Nothing to save.
      if (!cur) return;
      // The shell's "Reset my stats" removed the save: a new game.
      if (saved.current && !loadRecord(GAME_ID).extra.save) {
        // New.
        const fresh = newGame(Math.floor(Math.random() * 0x100000000));
        // Kept and saved.
        setS(fresh);
        save(fresh);
        // Done.
        return;
      }
      // Saved.
      save(cur);
      saved.current = true;
    };
    // Every few seconds.
    const id = window.setInterval(write, SAVE_EVERY_MS);
    // When hidden.
    const onVis = () => {
      // Only on hiding.
      if (document.visibilityState === "hidden") write();
    };
    // Listening.
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", write);
    // Stopped.
    return () => {
      // Cleared.
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", write);
    };
  }, [s === null]); // eslint-disable-line react-hooks/exhaustive-deps

  // The copy buttons' feedback fades.
  useEffect(() => {
    // Nothing to fade.
    if (copied === "idle" && pmCopied === "idle") return;
    // Later.
    const id = window.setTimeout(() => {
      // Both back to idle.
      setCopied("idle");
      setPmCopied("idle");
    }, 2000);
    // Cleared.
    return () => window.clearTimeout(id);
  }, [copied, pmCopied]);

  // A newly noticed incident is announced once (review R3-12: they used to arrive in silence).
  useEffect(() => {
    // Not loaded.
    if (!s) return;
    // The incidents noticed and not yet announced.
    const fresh = s.active.filter((i) => s.t >= i.detectAt && !announced.current.has(i.id));
    // Nothing new.
    if (fresh.length === 0) return;
    // Remembered.
    for (const i of fresh) announced.current.add(i.id);
    // One taken by on-call needs nothing from the player; the others ask for a call.
    const mine = fresh.filter((i) => !i.fixing);
    // Announced: the first new one that needs a call, or the on-call engineer's.
    setSay(mine.length > 0 ? t("sayIncident", { kind: t(`incidents.${mine[0].kind}.title`) }) : t("sayOnCall", { kind: t(`incidents.${fresh[0].kind}.title`) }));
  }, [s, t]);

  // Incidents waiting for the player's call: noticed, not being fixed.
  const waiting = s ? s.active.filter((i) => s.t >= i.detectAt && !i.fixing) : [];

  // The tab's title counts them, "(1) Incident Commander | /dev/fun", so a player in another tab sees one come in.
  // Checked on every tick: the framework can set the page's title again after this ran (its metadata arrives late),
  // and a title someone else set becomes the new base.
  useEffect(() => {
    // Someone else set the title (or this is the first run): that is the page's own title now.
    if (baseTitle.current === null || document.title !== titleSet.current) baseTitle.current = document.title;
    // The title wanted: the count in front of the page's own, or the page's own.
    const want = waiting.length > 0 ? t("titleCount", { n: waiting.length, title: baseTitle.current }) : baseTitle.current;
    // Set only when it differs.
    if (document.title !== want) document.title = want;
    // Remembered, to tell this title from one set elsewhere.
    titleSet.current = want;
  }, [s, waiting.length, t]);

  // Leaving the page puts the title back as it was.
  useEffect(
    () => () => {
      // Only when the title is still the one set here (the next page may already have its own).
      if (baseTitle.current !== null && document.title === titleSet.current) document.title = baseTitle.current;
    },
    [],
  );

  // Whether the incidents panel is on screen.
  useEffect(() => {
    // The panel.
    const el = panelRef.current;
    // Not drawn yet, or no observer here (the chip then stays hidden).
    if (!el || typeof IntersectionObserver === "undefined") return;
    // Watched: a quarter of it in view counts.
    const io = new IntersectionObserver((entries) => setPanelSeen(entries.some((en) => en.isIntersecting && en.intersectionRatio > 0.25)), { threshold: [0, 0.25, 0.5] });
    // From now.
    io.observe(el);
    // Stopped when the page goes.
    return () => io.disconnect();
  }, [s === null]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Bring the incidents panel into view, its first response under the keyboard. */
  const goToIncidents = () => {
    // The panel.
    const el = panelRef.current;
    // Not drawn.
    if (!el) return;
    // Scrolled to, smoothly unless motion is reduced.
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    // The first response that can be pressed, or the panel's heading.
    const target = el.querySelector<HTMLElement>(".fg-ic-action:not(:disabled)") ?? el.querySelector<HTMLElement>("h2");
    // Focused without a second jump.
    target?.focus({ preventScroll: true });
  };

  /**
   * The share card for a state.
   *
   * @param x the state whose numbers it shows
   * @param written post-mortems written (the finished run's card counts the one just written)
   * @returns the text
   */
  const card = (x: IcState, written = x.postMortems) => {
    // The numbers.
    const d = derive(x);
    // The card, its numbers in the page's language.
    return shareText({ title: t("shareTitle"), lines: [t("shareLine1", { nines: one(d.nines), cps: n(d.perSecond) }), t("shareLine2", { n: written })], locale, slug: GAME_ID });
  };

  /**
   * Dispatch an action.
   *
   * @param a the action
   */
  const dispatch = (a: IcAction) => {
    // The current state.
    const cur = ref.current;
    // Not loaded.
    if (!cur) return;
    // The new state.
    const next = act(cur, a);
    // Nothing happened.
    if (next === cur) return;
    // Kept.
    ref.current = next;
    setS(next);
    // A post-mortem: recorded, saved, and reported under its button.
    if (a.type === "prestige") {
      // Saved at once.
      save(next);
      // Counted as a finished round.
      if (today) recordResult(GAME_ID, { dayKey: today, won: true });
      setVersion((v) => v + 1);
      // Incidents of the old run are forgotten; the new run's ids start again from 1.
      announced.current = new Set();
      // The report: the card shows the run that just ended, with this post-mortem counted (review R3-08).
      setPm({ n: next.postMortems, lessons: next.lessons, share: card(cur, next.postMortems) });
      setPmCopied("idle");
      // Announced.
      setSay(t("pmHeadline", { n: next.postMortems }));
    }
    // A right or wrong call is announced.
    if (a.type === "respond") setSay(a.choice === 0 ? t("sayRight") : t("sayWrong"));
  };

  // Before mount: a neutral line, the same as the static HTML.
  if (!s) {
    // The shell with a loading line.
    return (
      <GameShell gameId={GAME_ID} kind="free" today={today} rules={<p>{t("rule1")}</p>} result={null} version={version}>
        <p className="fg-muted">{tc("loading")}</p>
      </GameShell>
    );
  }

  // The numbers.
  const d = derive(s);
  // Incidents noticed, and whether any is still unnoticed.
  const seen = s.active.filter((i) => s.t >= i.detectAt);
  const unseen = s.active.some((i) => s.t < i.detectAt);
  // The milestone's progress.
  const pct = Math.min(100, Math.floor((s.earned / PRESTIGE_AT) * 100));
  // The risk of a release in each switch position, with staging.
  const staged = Math.pow(0.5, s.levels.staging);
  const riskReviewed = Math.round(BAD_REVIEWED * staged * 100);
  const riskApproved = Math.round(BAD_UNREVIEWED * staged * 100);

  // The rules.
  const rules = (
    <>
      <p>{t("rule1")}</p>
      <ul>
        <li>{t("rule2", { minutes: Math.ceil(FIRST_INCIDENT_S / 60) })}</li>
        <li>{t("rule3")}</li>
        <li>{t("rule4")}</li>
        <li>{t("rule5", { hours: 8 })}</li>
      </ul>
    </>
  );

  // The page.
  return (
    <GameShell gameId={GAME_ID} kind="free" today={today} rules={rules} result={null} version={version}>
      {/* The polite line. */}
      <p className="fg-ic-sr" aria-live="polite">{say}</p>
      {/* While you were away. */}
      {away && (
        <div className="fg-ic-away" role="status">
          <p className="fg-ic-away-title">{t("awayTitle")}</p>
          <p>{t("awayBody", { time: formatDuration(away.seconds * 1000), credits: n(away.credits), incidents: away.incidents, handled: away.handled })}</p>
          {away.awaySeconds > away.seconds && <p className="fg-small fg-muted">{t("awayCapped", { hours: 8 })}</p>}
          <button type="button" className="fg-button" onClick={() => setAway(null)}>
            {t("awayDismiss")}
          </button>
        </div>
      )}
      {/* The dashboard. */}
      <div className="fg-ic-stats">
        <div className="fg-ic-stat">
          <span className="fg-ic-stat-label">{t("credits")}</span>
          <span className="fg-ic-stat-value">{n(s.credits)}</span>
          <span className="fg-ic-stat-sub">{t("perSecond", { n: n(d.perSecond) })}</span>
        </div>
        <div className="fg-ic-stat">
          <span className="fg-ic-stat-label">{t("traffic")}</span>
          <span className="fg-ic-stat-value">{n(d.served)}</span>
          <span className="fg-ic-stat-sub">{t("trafficSub", { demand: n(d.demand), capacity: n(d.capacity) })}</span>
        </div>
        <div className="fg-ic-stat">
          <span className="fg-ic-stat-label">{t("uptime")}</span>
          <span className="fg-ic-stat-value">{t("nines", { n: one(d.nines) })}</span>
          <span className="fg-ic-stat-sub">{(d.availability * 100).toFixed(3).replace(".", sep)} %</span>
        </div>
        <div className="fg-ic-stat">
          <span className="fg-ic-stat-label">{t("reputation")}</span>
          <span className="fg-ic-stat-value">{Math.round(s.rep)}</span>
          <span className="fg-ic-meter" aria-hidden="true">
            <span className="fg-ic-meter-fill" style={{ width: `${Math.round(s.rep)}%` }} />
          </span>
        </div>
      </div>
      {/* Capacity short of demand. */}
      {d.capacity < d.demand && <p className="fg-ic-warn">{t("overloaded", { n: n(d.demand - d.capacity) })}</p>}
      {/* Incidents: the panel is outlined while one waits for a call. */}
      <section ref={panelRef} className={`fg-ic-panel ${waiting.length > 0 ? "fg-ic-panel-alert" : ""}`} aria-labelledby="fg-ic-incidents">
        <h2 className="fg-ic-h" id="fg-ic-incidents" tabIndex={-1}>
          {t("incidentsTitle")}
        </h2>
        {s.active.length === 0 && <p className="fg-muted">{t("allQuiet")}</p>}
        {unseen && <p className="fg-ic-warn">{t("undetected")}</p>}
        {seen.map((inc) => (
          <div key={inc.id} className={`fg-ic-incident ${inc.fixing ? "fg-ic-incident-fixing" : ""}`}>
            <p className="fg-ic-incident-title">{t(`incidents.${inc.kind}.title`)}</p>
            <p className="fg-ic-incident-desc">{t(`incidents.${inc.kind}.desc`)}</p>
            {inc.fixing ? (
              <p className="fg-ic-incident-eta">{inc.onCall ? t("onCallFixing", { s: Math.max(0, Math.ceil(inc.endAt - s.t)) }) : t("youFixing", { s: Math.max(0, Math.ceil(inc.endAt - s.t)) })}</p>
            ) : (
              <>
                <div className="fg-ic-actions">
                  {inc.order.map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      className={`fg-button fg-ic-action ${inc.tried.includes(choice) ? "fg-ic-tried" : ""}`}
                      disabled={inc.tried.includes(choice) || s.t < inc.lockUntil}
                      onClick={() => dispatch({ type: "respond", id: inc.id, choice })}
                    >
                      {t(`incidents.${inc.kind}.a${choice}`)}
                    </button>
                  ))}
                </div>
                {s.t < inc.lockUntil && <p className="fg-ic-incident-eta">{t("locked", { s: Math.ceil(inc.lockUntil - s.t) })}</p>}
              </>
            )}
          </div>
        ))}
      </section>
      {/* The switch. */}
      <section className="fg-ic-panel" aria-labelledby="fg-ic-review">
        <h2 className="fg-ic-h" id="fg-ic-review">
          {t("reviewTitle")}
        </h2>
        <button type="button" role="switch" aria-checked={s.approve} className={`fg-ic-switch ${s.approve ? "fg-ic-switch-on" : ""}`} onClick={() => dispatch({ type: "approve", on: !s.approve })}>
          <span className="fg-ic-switch-track" aria-hidden="true">
            <span className="fg-ic-switch-thumb" />
          </span>
          <span>{t("approveLabel")}</span>
        </button>
        <p className="fg-small">{t("approveTradeoff", { reviewedEvery: SHIP_REVIEWED_S, reviewedRisk: riskReviewed, approvedEvery: SHIP_UNREVIEWED_S, approvedRisk: riskApproved })}</p>
        <p className="fg-small fg-muted">{t("approveCount", { features: s.features, bad: s.badDeploys })}</p>
      </section>
      {/* The shop. */}
      <section className="fg-ic-panel" aria-labelledby="fg-ic-shop">
        <h2 className="fg-ic-h" id="fg-ic-shop">
          {t("shopTitle")}
        </h2>
        <ul className="fg-ic-shop">
          {ITEMS.map((item) => {
            // Its price.
            const price = cost(s, item.id);
            // At the ceiling.
            const maxed = !Number.isFinite(price);
            // The row.
            return (
              <li key={item.id} className="fg-ic-item">
                <span className="fg-ic-item-text">
                  <span className="fg-ic-item-name">
                    {t(`items.${item.id}.name`)} <span className="fg-mono fg-muted">{t("owned", { n: s.levels[item.id as ItemId], max: item.max })}</span>
                  </span>
                  <span className="fg-ic-item-effect">{t(`items.${item.id}.effect`)}</span>
                </span>
                <button type="button" className="fg-button fg-ic-buy" disabled={maxed || s.credits < price} onClick={() => dispatch({ type: "buy", item: item.id })} aria-label={maxed ? t("maxedLabel", { name: t(`items.${item.id}.name`) }) : t("buyLabel", { name: t(`items.${item.id}.name`), cost: n(price) })}>
                  {maxed ? t("maxed") : n(price)}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="fg-small fg-muted">{t("setupLine", { detect: Math.round(d.detectS), onCall: Math.round(d.onCallChance * 100) })}</p>
      </section>
      {/* The post-mortem. */}
      <section className="fg-ic-panel" aria-labelledby="fg-ic-pm">
        <h2 className="fg-ic-h" id="fg-ic-pm">
          {t("pmTitle")}
        </h2>
        <p className="fg-small">{t("pmExplain", { target: n(PRESTIGE_AT) })}</p>
        <div className="fg-ic-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={t("pmProgress")}>
          <span className="fg-ic-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="fg-small fg-muted">{t("pmStatus", { earned: n(s.earned), target: n(PRESTIGE_AT), lessons: s.lessons, bonus: s.lessons * 10, n: s.postMortems })}</p>
        <button type="button" className="fg-button fg-button-primary" disabled={!d.canPrestige} onClick={() => dispatch({ type: "prestige" })}>
          {d.canPrestige ? t("pmButtonReady", { lessons: d.lessonsOnPrestige }) : t("pmButton")}
        </button>
        {/* The report of the post-mortem just written, where the player is looking. */}
        {pm && (
          <div className="fg-result fg-result-won fg-ic-pm-report" role="status">
            <p className="fg-result-headline">{t("pmHeadline", { n: pm.n })}</p>
            <p className="fg-result-detail">{t("pmDetail", { lessons: pm.lessons, bonus: pm.lessons * 10 })}</p>
            <div className="fg-result-actions">
              <button type="button" className="fg-button fg-button-primary" onClick={async () => setPmCopied((await copyText(pm.share)) ? "ok" : "fail")}>
                {pmCopied === "ok" ? tc("copied") : pmCopied === "fail" ? tc("copyFailed") : tc("copyResult")}
              </button>
              <button type="button" className="fg-button" onClick={() => setPm(null)}>
                {t("pmClose")}
              </button>
            </div>
          </div>
        )}
      </section>
      {/* What happened lately. */}
      <section className="fg-ic-panel" aria-labelledby="fg-ic-feed">
        <h2 className="fg-ic-h" id="fg-ic-feed">
          {t("feedTitle")}
        </h2>
        {s.events.length === 0 ? (
          <p className="fg-muted fg-small">{t("feedEmpty")}</p>
        ) : (
          <ul className="fg-ic-feed">
            {s.events.map((e, i) => (
              <li key={`${e.t}-${i}`}>
                <span className="fg-mono fg-muted">{formatDuration(e.t * 1000)}</span> {t(`events.${e.type}`, { kind: e.kind ? t(`incidents.${e.kind}.title`) : "" })}
              </li>
            ))}
          </ul>
        )}
        <p className="fg-small fg-muted">{t("tally", { incidents: s.incidents, you: s.fixedByYou, onCall: s.fixedByOnCall, wrong: s.wrongCalls })}</p>
      </section>
      {/* An incident waits for a call and its panel is off screen: a chip at the bottom of the screen takes the player there. */}
      {waiting.length > 0 && !panelSeen && (
        <button type="button" className="fg-ic-alert" onClick={goToIncidents}>
          <span className="fg-ic-alert-dot" aria-hidden="true" />
          <span>{t("alertChip", { n: waiting.length, kind: t(`incidents.${waiting[0].kind}.title`) })}</span>
        </button>
      )}
      {/* The status card. */}
      <div className="fg-buttons">
        <button type="button" className="fg-button" onClick={async () => setCopied((await copyText(card(s))) ? "ok" : "fail")}>
          {copied === "ok" ? tc("copied") : copied === "fail" ? tc("copyFailed") : t("copyStatus")}
        </button>
      </div>
    </GameShell>
  );
}
