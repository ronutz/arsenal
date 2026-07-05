"use client";

// ============================================================================
// src/components/dev-fun/MegaBrainConsole.tsx
// ----------------------------------------------------------------------------
// /dev/fun — MEGA BRAIN CONSOLE. A deliberately over-the-top parody of the
// Thiago Finch "Mega Brain" meme ("use all the power of your Mega Brain",
// "full power"), which the Brazilian dev community loves to mock. Drag the
// POWER lever to 100%, watch the brain go supernova, collect the catchphrases.
// It computes nothing and grounds nothing: it is a stress reliever. Pure client
// theatre.
//
// Originally pt-BR only; now localized (PRIME 05/07/2026). All copy arrives as
// props from the server page, which resolves the `megaBrain` i18n namespace, so
// this component is locale-agnostic. EN + pt-BR are authored natively; the
// other 14 locales get the English per-key fallback until translated.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import BossApp from "@/components/dev-fun/BossApp";
import { drawBossScreen, type BossScreenKind } from "@/components/dev-fun/boss-screens";

/** Every string the console renders, resolved by the server page. */
export interface MegaBrainLabels {
  titlebar: string;
  devFunTitle: string;
  close: string;
  closeAria: string;
  homeTitle: string;
  failsafeEngageAria: string;
  failsafeEngageTitle: string;
  failsafeRestoreAria: string;
  failsafeRestoreTitle: string;
  manoAria: string;
  manoTitle: string;
  manoDismiss: string;
  bossAria: string;
  bossTitle: string;
  m0: string;
  m1: string;
  m25: string;
  m50: string;
  m75: string;
  m100: string;
  meterLabel: string;
  meterLabelGoh: string;
  burnoutReadout: string;
  leverLabel: string;
  leverAria: string;
  leverHint: string;
  leverHintGoh: string;
  leverTitleGoh: string;
  fullPower: string;
  turnOff: string;
  stopLabel: string;
  motionOffAria: string;
  motionOnAria: string;
  disabledTitleGoh: string;
  manoRealityCheck: string;
  manoSub: string;
  manoCreditPre: string;
  manoCreditName: string;
  manoCreditPost: string;
  totalBanner: string;
  totalTerms: string; // contains "{count}"
  totalFine: string;
  gohLine: string;
  gohSub: string;
  gohFinePre: string;
  gohFineLink: string;
  gohFinePost: string;
  burnoutLine: string;
  burnoutSub: string;
  disclaimer: string;
  bossHint: string;
  bossDismiss: string;
}

// Power tier drives the escalating visuals.
function tierFor(power: number): number {
  if (power >= 100) return 5;
  if (power >= 75) return 4;
  if (power >= 50) return 3;
  if (power >= 25) return 2;
  if (power >= 1) return 1;
  return 0;
}

export default function MegaBrainConsole({
  labels,
  xgh,
  clickPhrases,
  manoHref,
  xghHref,
  localeTag,
}: {
  labels: MegaBrainLabels;
  /** XGH axiom lore: axiom 1 quoted, the rest original riffs (server-provided). */
  xgh: string[];
  /** Witty one-liners popped on each brain click, shuffle-bagged (server-provided). */
  clickPhrases: string[];
  /** Mano Deyvin YouTube URL. */
  manoHref: string;
  /** eXtreme Go Horse reference URL. */
  xghHref: string;
  /** BCP-47 tag for number formatting (e.g. "pt-BR", "en"). */
  localeTag: string;
}) {
  const [power, setPower] = useState(0);
  const [terms, setTerms] = useState(0); // fake "smart terms searched" counter
  const rampRef = useRef<number | null>(null);
  const [reacting, setReacting] = useState(false); // Mano Deyvin reality-check overlay
  const manoTimerRef = useRef<number | null>(null);
  // Motion switch: when false, the console stops all shaking/pulsing/spinning
  // (data-motion="off" on the console). Independent of the OS reduced-motion
  // pref (which is always honored via CSS media query); this is the manual,
  // in-frame control for people who want motion off regardless. Persisted so it
  // sticks across visits. Starts "on" and is corrected from storage after mount
  // (avoids any server/client markup mismatch).
  const [motionOn, setMotionOn] = useState(true);
  useEffect(() => {
    try {
      if (localStorage.getItem("ronutz-mb-motion") === "off") setMotionOn(false);
    } catch {
      /* private mode: keep the default */
    }
  }, []);
  const toggleMotion = () => {
    setMotionOn((on) => {
      const next = !on;
      try {
        localStorage.setItem("ronutz-mb-motion", next ? "on" : "off");
      } catch {
        /* private mode: session-only */
      }
      return next;
    });
  };
  // Boss key: which mock work-app is showing (null = console visible).
  const [bossApp, setBossApp] = useState<null | BossScreenKind>(null);
  // FAIL-SAFE (red dot): `burnout` is the brief overload transition, `goHorse`
  // the engaged mode. prevPowerRef remembers the power to restore on disengage;
  // failTimerRef drives the burnout -> Go Horse handover; axiomIdx cycles lore.
  const [burnout, setBurnout] = useState(false);
  const [goHorse, setGoHorse] = useState(false);
  const [axiomIdx, setAxiomIdx] = useState(0);
  const failTimerRef = useRef<number | null>(null);
  const prevPowerRef = useRef(0);

  // --- Brain click: vibration (scaled by tier) + a witty popup phrase. ---
  // vibeLevel 0 = idle; 1..4 map to tiers 1..4 (tier 5 is TOTAL FORCE, whose
  // own console shake already owns the screen, so clicks there add no vibe).
  const [vibeLevel, setVibeLevel] = useState(0);
  const vibeTimerRef = useRef<number | null>(null);
  // Each popped phrase gets a fresh id so re-clicking the SAME phrase still
  // re-triggers the CSS pop animation (keyed on id).
  const [pop, setPop] = useState<{ id: number; text: string } | null>(null);
  const popTimerRef = useRef<number | null>(null);
  const popIdRef = useRef(0);
  // Shuffle-bag: draw phrases without repeat until the bag empties, then refill.
  // Avoids the "same line twice in a row" that pure random gives on 24 items.
  const bagRef = useRef<string[]>([]);
  const drawPhrase = useCallback((): string => {
    if (bagRef.current.length === 0) {
      const next = [...clickPhrases];
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      // If the last shown phrase would be first again, rotate it to the back so
      // consecutive bags never collide at the seam.
      if (next.length > 1 && pop && next[next.length - 1] === pop.text) {
        next.unshift(next.pop() as string);
      }
      bagRef.current = next;
    }
    return bagRef.current.pop() as string;
  }, [clickPhrases, pop]);

  const onBrainClick = useCallback(() => {
    // Go Horse mode reuses the stage click to restore; burnout is mid-transition.
    // In both, skip the vibe/popup so we don't fight those states.
    if (goHorse || burnout) return;
    const lvl = Math.min(tierFor(power), 4); // 0 at rest, up to 4 pre-TOTAL
    if (lvl > 0) {
      setVibeLevel(0); // reset so the same level re-animates on rapid clicks
      // next frame, apply — a tick lets the class drop before re-adding
      requestAnimationFrame(() => setVibeLevel(lvl));
      if (vibeTimerRef.current) window.clearTimeout(vibeTimerRef.current);
      vibeTimerRef.current = window.setTimeout(() => setVibeLevel(0), 420);
    }
    const id = ++popIdRef.current;
    setPop({ id, text: drawPhrase() });
    if (popTimerRef.current) window.clearTimeout(popTimerRef.current);
    popTimerRef.current = window.setTimeout(() => {
      setPop((cur) => (cur && cur.id === id ? null : cur));
    }, 1400);
  }, [goHorse, burnout, power, drawPhrase]);

  // Clean up the click timers on unmount.
  useEffect(() => {
    return () => {
      if (vibeTimerRef.current) window.clearTimeout(vibeTimerRef.current);
      if (popTimerRef.current) window.clearTimeout(popTimerRef.current);
    };
  }, []);

  // Milestone lines by threshold reached, resolved from labels.
  const milestoneLine = (p: number): string => {
    if (p >= 100) return labels.m100;
    if (p >= 75) return labels.m75;
    if (p >= 50) return labels.m50;
    if (p >= 25) return labels.m25;
    if (p >= 1) return labels.m1;
    return labels.m0;
  };
  const milestoneKey = (p: number): number =>
    p >= 100 ? 100 : p >= 75 ? 75 : p >= 50 ? 50 : p >= 25 ? 25 : p >= 1 ? 1 : 0;

  // Visuals run on fxPower: Go Horse mode pins the meter at "infinite
  // productivity" (100) regardless of the real power, which burnout zeroed.
  const fxPower = goHorse ? 100 : power;
  const tier = tierFor(fxPower);
  const atTotal = power >= 100;

  // The "smart terms" counter only ticks at full power. Dopamine.
  useEffect(() => {
    if (!atTotal) return;
    const id = window.setInterval(() => setTerms((t) => t + Math.floor(3 + Math.random() * 12)), 130);
    return () => window.clearInterval(id);
  }, [atTotal]);

  // Go Horse mode: cycle the axiom lore on a lazy interval.
  useEffect(() => {
    if (!goHorse) return;
    const id = window.setInterval(() => setAxiomIdx((i) => (i + 1) % xgh.length), 3200);
    return () => window.clearInterval(id);
  }, [goHorse, xgh.length]);

  // Cancel any ramp on unmount.
  useEffect(() => () => {
    if (rampRef.current) cancelAnimationFrame(rampRef.current);
    if (manoTimerRef.current) window.clearTimeout(manoTimerRef.current);
    if (failTimerRef.current) window.clearTimeout(failTimerRef.current);
  }, []);

  const stopRamp = () => { if (rampRef.current) { cancelAnimationFrame(rampRef.current); rampRef.current = null; } };

  // FULL POWER button: satisfying ramp from wherever you are to 100%.
  const forcaTotal = useCallback(() => {
    stopRamp();
    const start = performance.now();
    const from = power;
    const dur = 1400;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      // easeOutCubic for a punchy finish
      const eased = 1 - Math.pow(1 - p, 3);
      setPower(Math.round(from + (100 - from) * eased));
      if (p < 1) rampRef.current = requestAnimationFrame(step);
      else rampRef.current = null;
    };
    rampRef.current = requestAnimationFrame(step);
  }, [power]);

  // "turn off" is the master reset: it also clears a burnout / Go Horse state.
  const desligar = () => {
    stopRamp();
    if (failTimerRef.current) { window.clearTimeout(failTimerRef.current); failTimerRef.current = null; }
    setBurnout(false);
    setGoHorse(false);
    setPower(0);
    setTerms(0);
  };

  const onLever = (v: number) => { stopRamp(); setPower(v); };

  // Shout-out to Mano Deyvin, whose react sparked the whole meme. Fittingly,
  // his button is the reality check: it deflates the hype (that is his bit).
  const reactDoMano = () => {
    stopRamp();
    setPower(0);
    setTerms(0);
    // PRIME 05/07/2026: the tribute stays up until the user taps the beer mug
    // (the mano dot); no auto-dismiss, so the shout-out is deliberate.
    setReacting(true);
  };

  // Boss key: hide the console behind a random vintage work app (drawn from the
  // shared shuffled bag, so all ten screens appear evenly). Arrow keys navigate
  // between screens; any other key/click brings the console back.
  const bossKey = () => setBossApp(drawBossScreen());

  // FAIL-SAFE (the red dot). First press: the Mega Brain overloads (burnout
  // shudder, ~1.5s), then the console fails over to Go Horse mode, where
  // thinking is disabled by design (Axiom nº 1) and productivity reads infinite.
  // Second press restores the exact pre-burnout power. PRIME's spec: "Mega
  // Brain is suffering burnout, ENGAGE GO-HORSE FTW!"
  const failSafe = () => {
    if (failTimerRef.current) { window.clearTimeout(failTimerRef.current); failTimerRef.current = null; }
    if (goHorse || burnout) {
      // Disengage: bring the Mega Brain back exactly where it was.
      setBurnout(false);
      setGoHorse(false);
      setPower(prevPowerRef.current);
      return;
    }
    stopRamp();
    prevPowerRef.current = power;
    setPower(0); // the brain gives out
    setTerms(0);
    setBurnout(true);
    failTimerRef.current = window.setTimeout(() => {
      setBurnout(false);
      setAxiomIdx(0);
      setGoHorse(true);
      failTimerRef.current = null;
      // PRIME 05/07/2026: 3000ms (was 1500) so the burnout message reads longer.
    }, 3000);
  };

  // Brain scale + glow scale with power.
  const scale = 1 + (fxPower / 100) * 0.7;
  const glow = 6 + (fxPower / 100) * 60;

  return (
    <>
    <div className={`mb-console mb-tier-${tier}${burnout ? " mb-burnout" : ""}${goHorse ? " mb-goh" : ""}`} data-total={atTotal ? "1" : "0"} data-vibe={vibeLevel} data-motion={motionOn ? "on" : "off"} style={{ ["--mb-power" as string]: fxPower, ["--mb-power-pct" as string]: `${fxPower}%` }}>
      <div className="mb-titlebar">
        <button
          type="button"
          className="mb-dot mb-dot-failsafe"
          onClick={failSafe}
          aria-pressed={goHorse || burnout}
          aria-label={goHorse || burnout ? labels.failsafeRestoreAria : labels.failsafeEngageAria}
          title={goHorse || burnout ? labels.failsafeRestoreTitle : labels.failsafeEngageTitle}
        />
        <button type="button" className={`mb-dot mb-dot-mano${reacting ? " mb-dot-mano-cheer" : ""}`} onClick={reacting ? () => setReacting(false) : reactDoMano} aria-label={labels.manoAria} title={labels.manoTitle} />
        <button type="button" className="mb-dot mb-dot-boss" onClick={bossKey} aria-label={labels.bossAria} title={labels.bossTitle} />
        <span className="mb-titlebar-text mono">
          <Link href="/dev-fun" className="mb-titlebar-devfun" title={labels.devFunTitle}>/dev/fun</Link>
          {labels.titlebar}
        </span>
        {/* PRIME 05/07/2026: subtle motion switch. Understated by design — a
            small frame control, not a loud button — so it stays out of the way
            but lets anyone who wants motion off turn it off (and it sticks).
            aria-pressed reflects "motion off" state for assistive tech. */}
        <button
          type="button"
          className="mb-motion-toggle"
          onClick={toggleMotion}
          aria-pressed={!motionOn}
          aria-label={motionOn ? labels.motionOffAria : labels.motionOnAria}
          title={motionOn ? labels.motionOffAria : labels.motionOnAria}
        >
          <span aria-hidden="true">{motionOn ? "◐" : "○"}</span>
        </button>
        {/* PRIME 05/07/2026: the two power controls now live as pills in the
            upper frame — Força Total as a fixed-pink lightning pill (a constant
            pink, distinct from the power-reactive brain glow), and STOP as a red
            octagonal emergency-stop button, mimicking a real e-stop. */}
        <div className="mb-titlebar-actions">
          <button
            type="button"
            className="mb-pill mb-pill-forca"
            onClick={forcaTotal}
            disabled={goHorse || burnout}
            title={goHorse || burnout ? labels.disabledTitleGoh : undefined}
          >
            {labels.fullPower}
          </button>
          <button
            type="button"
            className="mb-pill mb-pill-stop"
            onClick={desligar}
            aria-label={labels.turnOff}
            title={labels.turnOff}
          >
            <span className="mb-pill-stop-text">{labels.stopLabel}</span>
          </button>
        </div>
        {/* PRIME 05/07/2026: the frame carries the site's own address, and both
            it and the ✕ exit to the home page (the ✕ used to go to /tools). */}
        <Link href="/" className="mb-titlebar-url mono" title={labels.homeTitle}>ronutz.com/</Link>
        <Link href="/" className="mb-close" aria-label={labels.closeAria} title={labels.close}>✕</Link>
      </div>

      <div
        className={`mb-stage${goHorse ? " mb-stage-goh" : ""}`}
        aria-hidden="true"
        onClick={goHorse ? failSafe : onBrainClick}
      >
        <div className="mb-aura" style={{ opacity: 0.15 + (fxPower / 100) * 0.85, transform: `scale(${1 + fxPower / 60})` }} />
        <div className="mb-brain-scale" style={{ transform: `scale(${scale})` }}>
          <div
            className="mb-brain"
            style={{ filter: `drop-shadow(0 0 ${glow}px rgba(255,45,149,${0.3 + fxPower / 130})) drop-shadow(0 0 ${glow / 2}px rgba(34,211,238,${fxPower / 160}))` }}
          >
            {goHorse ? "🐴" : burnout ? "🫠" : "🧠"}
          </div>
        </div>
        {tier >= 4 && <div className="mb-rays" />}
        {goHorse && <div className="mb-gallop">🐴</div>}
        {pop && (
          <div key={pop.id} className="mb-clickpop mono">
            {pop.text}
          </div>
        )}
      </div>

      {/* aria-live goes quiet in Go Horse mode; the axiom carousel would spam
          screen readers on every 3.2s tick otherwise. */}
      <div className="mb-readout" role="status" aria-live={goHorse ? "off" : "polite"}>
        <div className="mb-percent mono">{goHorse ? "∞" : burnout ? "ERR" : power}<span className="mb-percent-sign">%</span></div>
        <div key={goHorse ? `xgh-${axiomIdx}` : burnout ? "burnout" : milestoneKey(power)} className="mb-milestone">
          {goHorse ? xgh[axiomIdx] : burnout ? labels.burnoutReadout : milestoneLine(power)}
        </div>
      </div>

      {/* PRIME 05/07/2026: the fail-safe / Go Horse banner sits ABOVE the
          slider now (was below the buttons). */}
      {(burnout || goHorse) && (
        <div className={`mb-goh-banner ${goHorse ? "is-goh" : "is-burnout"}`} role="status">
          {goHorse ? (
            <>
              <p className="mb-goh-line">{labels.gohLine}</p>
              <p className="mb-goh-sub mono">{labels.gohSub}</p>
              <p className="mb-goh-fine">
                {labels.gohFinePre}
                <a href={xghHref} target="_blank" rel="noopener noreferrer">{labels.gohFineLink}</a>
                {labels.gohFinePost}
              </p>
            </>
          ) : (
            <>
              <p className="mb-goh-line">{labels.burnoutLine}</p>
              <p className="mb-goh-sub mono">{labels.burnoutSub}</p>
            </>
          )}
        </div>
      )}

      <div className="mb-powerbar">
        <div className={`mb-powerbar-fill${goHorse ? " mb-powerbar-fill-goh" : ""}`} style={{ width: `${fxPower}%` }} />
        <span className="mb-powerbar-label mono">{goHorse ? labels.meterLabelGoh : labels.meterLabel}</span>
      </div>

      <div className="mb-lever-wrap">
        <label htmlFor="mb-lever" className="mb-lever-label mono">{labels.leverLabel}</label>
        <input
          id="mb-lever"
          className="mb-lever"
          type="range"
          min={0}
          max={100}
          value={power}
          onChange={(e) => onLever(parseInt(e.target.value, 10))}
          aria-label={labels.leverAria}
          disabled={goHorse || burnout}
          title={goHorse ? labels.leverTitleGoh : undefined}
        />
      </div>
      <p className="mb-lever-hint mono">{goHorse ? labels.leverHintGoh : labels.leverHint}</p>


      {reacting && (
        <div
          className="mb-mano-overlay"
          role="status"
          onClick={() => setReacting(false)}
        >
          <div className="mb-mano-card">
            <p className="mb-mano-emoji">🍺</p>
            <p className="mb-mano-line">{labels.manoRealityCheck}</p>
            <p className="mb-mano-sub">{labels.manoSub}</p>
            <p className="mb-mano-credit">
              {labels.manoCreditPre}
              <a href={manoHref} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>{labels.manoCreditName}</a>
              {labels.manoCreditPost}
            </p>
            <p className="mb-mano-dismiss mono">{labels.manoDismiss}</p>
          </div>
        </div>
      )}

      {atTotal && (
        <div className="mb-total-banner">
          <p className="mb-total-line">{labels.totalBanner}</p>
          <p className="mb-total-sub mono">{labels.totalTerms.replace("{count}", terms.toLocaleString(localeTag))}</p>
          <p className="mb-total-fine">{labels.totalFine}</p>
        </div>
      )}


      <p className="mb-disclaimer">{labels.disclaimer}</p>
    </div>
    {bossApp && <BossApp kind={bossApp} onDismiss={() => setBossApp(null)} onNavigate={(k) => setBossApp(k)} hint={labels.bossHint} dismissLabel={labels.bossDismiss} />}
    </>
  );
}
