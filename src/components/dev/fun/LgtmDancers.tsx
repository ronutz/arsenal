// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/LgtmDancers.tsx
// ----------------------------------------------------------------------------
// THE DANCING BOTS (PRIME 17/11/2026 01:57: "We need dancing bots (at least 4)
// to the lgtm tune"). Five original line-drawn robots stand on the tune's
// stage and dance to it: each has its own moves, and all of them follow the
// music the player hears, because LgtmTune drives them from the same audio
// clock that drives the readout (the beat from the section's tempo, the kick,
// the snare, the hats and the crash as they sound, a green check when an
// approval chimes, every arm up when the LGTM stamp lands).
//
// The moves are written to the SVG directly, frame by frame, through an
// imperative handle (no React render per frame). They stand still when the
// tune is not playing, and they never move for a reader who asks for reduced
// motion: only the green checks appear for them. The look follows the era
// through the stage's tokens (fun-lgtm.css, .lgtm-dancers).
// ============================================================================

"use client";

// React's ref forwarding, handle, refs and effect.
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
// The score's voices, for the drum hits.
import type { Voice } from "@/lib/fun/lgtm/score";

/** What the player can tell the dancers. */
export interface DancersHandle {
  /** One frame while the tune plays: the beat count from the start, fractional. */
  tick(beat: number): void;
  /** A drum hit as it sounds. */
  hit(voice: Voice): void;
  /** An approval chimes: the next dancer shows a green check for a moment. */
  approve(): void;
  /** The LGTM stamp lands: every arm up, every check on. */
  finale(): void;
  /** Back to the standing pose, checks off. */
  rest(): void;
}

/** The parts of one dancer the moves reach (any may be missing on a given robot). */
interface Parts {
  /** The whole robot (bounce, slide, sway). */
  root?: SVGGElement | null;
  /** The head (tilt, nod). */
  head?: SVGGElement | null;
  /** The left arm, from the shoulder. */
  armL?: SVGGElement | null;
  /** The right arm, from the shoulder. */
  armR?: SVGGElement | null;
  /** The left forearm, from the elbow (the pop-and-lock robot only). */
  foreL?: SVGGElement | null;
  /** The right forearm, from the elbow (the pop-and-lock robot only). */
  foreR?: SVGGElement | null;
  /** The left leg, from the hip. */
  legL?: SVGGElement | null;
  /** The right leg, from the hip. */
  legR?: SVGGElement | null;
  /** The wheel (the wheeled robot only). */
  wheel?: SVGGElement | null;
  /** The green check above the head. */
  check?: SVGGElement | null;
  /** The antenna or eye lights that flash with the hats. */
  bulbs: SVGElement[];
}

/** The line style every robot is drawn with (the same as the stamp toy's bot). */
const STROKE = { fill: "none", stroke: "currentColor", strokeWidth: 2.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** How many dancers there are. */
const COUNT = 5;

/** The pop-and-lock robot's four poses: left shoulder, left elbow, right shoulder, right elbow, in degrees. */
const POSES: readonly (readonly [number, number, number, number])[] = [
  // Arms out, forearms hanging.
  [0, 0, 0, 0],
  // The left forearm up.
  [0, 180, 0, 0],
  // The right forearm up.
  [0, 0, 0, -180],
  // Both arms down and folded in.
  [-60, 100, 60, -100],
];

/**
 * A linear blend.
 *
 * @param a the value at 0
 * @param b the value at 1
 * @param k how far, 0 to 1
 * @returns the blend
 */
function mix(a: number, b: number, k: number): number {
  // From a towards b.
  return a + (b - a) * k;
}

/**
 * Sets a rotation about a pivot, or nothing for a missing part.
 *
 * @param el the part
 * @param deg degrees, clockwise on screen
 * @param cx the pivot's x
 * @param cy the pivot's y
 */
function rot(el: SVGGElement | null | undefined, deg: number, cx: number, cy: number): void {
  // Missing parts are skipped.
  if (el) el.setAttribute("transform", `rotate(${deg.toFixed(1)} ${cx} ${cy})`);
}

/**
 * Sets a translation (and an optional rotation about a pivot), or nothing for a missing part.
 *
 * @param el the part
 * @param x the shift right
 * @param y the shift down
 * @param deg an extra rotation, degrees
 * @param cx the rotation's pivot x
 * @param cy the rotation's pivot y
 */
function move(el: SVGGElement | null | undefined, x: number, y: number, deg = 0, cx = 32, cy = 90): void {
  // Missing parts are skipped.
  if (!el) return;
  // The shift, then the turn about the pivot.
  el.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${deg.toFixed(1)} ${cx} ${cy})`);
}

/**
 * The five dancers, drawn once and moved by the player through the handle.
 */
const LgtmDancers = forwardRef<DancersHandle>(function LgtmDancers(_props, ref) {
  // The parts of every dancer, filled by the ref callbacks below.
  const parts = useRef<Parts[]>(Array.from({ length: COUNT }, () => ({ bulbs: [] })));
  // The drum envelopes: each jumps to 1 on its hit and decays.
  const env = useRef({ kick: 0, snare: 0, hat: 0, crash: 0 });
  // The last frame's time, for the decay.
  const last = useRef(0);
  // The stamp has landed: arms stay up.
  const final = useRef(false);
  // Whose turn it is to show the next approval.
  const turn = useRef(0);
  // The timers that take the checks down again.
  const timers = useRef<number[]>([]);
  // The reader asked for reduced motion.
  const still = useRef(false);

  // Reduced motion, read once and followed if it changes.
  useEffect(() => {
    // The query.
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Its answer now.
    still.current = mq.matches;
    // Its answer later.
    const on = () => {
      // Kept.
      still.current = mq.matches;
    };
    // Listened to.
    mq.addEventListener("change", on);
    // And released, with any pending check timers.
    return () => {
      // The listener.
      mq.removeEventListener("change", on);
      // The timers.
      timers.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  /**
   * A ref callback that files one part of one dancer.
   *
   * @param i the dancer
   * @param key the part
   * @returns the callback
   */
  const part = (i: number, key: Exclude<keyof Parts, "bulbs">) => (el: SVGGElement | null) => {
    // Filed (or cleared on unmount).
    parts.current[i][key] = el;
  };

  /**
   * A ref callback that files one light of one dancer.
   *
   * @param i the dancer
   * @returns the callback
   */
  const bulb = (i: number) => (el: SVGElement | null) => {
    // Added once.
    if (el && !parts.current[i].bulbs.includes(el)) parts.current[i].bulbs.push(el);
  };

  /**
   * Shows or hides one dancer's check.
   *
   * @param i the dancer
   * @param on shown or not
   */
  const showCheck = (i: number, on: boolean) => {
    // The check.
    const c = parts.current[i].check;
    // Its class says whether it shows.
    if (c) c.classList.toggle("lgtm-dancer-check-on", on);
  };

  // What the player can call.
  useImperativeHandle(ref, () => ({
    tick(beat: number) {
      // No motion for a reader who asked for none.
      if (still.current) return;
      // This frame's time.
      const now = performance.now();
      // Seconds since the last frame (capped, so a slow frame does not jump).
      const dt = last.current ? Math.min(0.1, (now - last.current) / 1000) : 0;
      // Kept for the next frame.
      last.current = now;
      // The envelopes decay: the kick fast, the snare a little slower, the hats fastest, the crash slowly.
      const e = env.current;
      // Kick.
      e.kick *= Math.exp(-dt * 9);
      // Snare.
      e.snare *= Math.exp(-dt * 7);
      // Hats.
      e.hat *= Math.exp(-dt * 14);
      // Crash.
      e.crash *= Math.exp(-dt * 2.5);
      // The beat's number and where in it we are.
      const n = Math.floor(beat);
      // Fraction of the beat, 0 to 1.
      const ph = beat - n;
      // One sway every two beats.
      const sway = Math.sin(Math.PI * beat);
      // One bob every beat.
      const bob = Math.sin(2 * Math.PI * beat);
      // Arms go up with the crash, and stay up after the stamp.
      const up = final.current ? 1 : Math.min(1, e.crash * 1.2);
      // The lights follow the hats.
      const glow = (0.35 + 0.65 * e.hat).toFixed(2);
      // Every dancer's lights.
      parts.current.forEach((p) => p.bulbs.forEach((b) => b.setAttribute("opacity", glow)));

      // Dancer 0, the box: bounces on the kick, pumps one arm then the other on each beat, tilts its head.
      const d0 = parts.current[0];
      // The bounce.
      move(d0.root, 0, -8 * e.kick);
      // The left arm, up on even beats.
      rot(d0.armL, mix(n % 2 === 0 ? 100 : 12, 145, up) + 10 * e.kick, 20, 40);
      // The right arm, up on odd beats.
      rot(d0.armR, mix(n % 2 === 0 ? -12 : -100, -145, up) - 10 * e.kick, 44, 40);
      // The head tilts with the sway.
      rot(d0.head, 7 * sway, 32, 34);

      // Dancer 1, the dome: pop and lock, snapping to a new pose on every beat.
      const d1 = parts.current[1];
      // This beat's pose and the last one.
      const to = POSES[n % 4];
      // The pose before it.
      const from = POSES[(n + 3) % 4];
      // A hard snap in the first eighth of the beat.
      const k = Math.min(1, ph / 0.12);
      // The left shoulder (blended to arms up for the crash: upper arm raised, forearm pointing up).
      rot(d1.armL, mix(mix(from[0], to[0], k), 50, up), 22, 38);
      // The left elbow.
      rot(d1.foreL, mix(mix(from[1], to[1], k), 90, up), 13, 38);
      // The right shoulder.
      rot(d1.armR, mix(mix(from[2], to[2], k), -50, up), 42, 38);
      // The right elbow.
      rot(d1.foreR, mix(mix(from[3], to[3], k), -90, up), 51, 38);
      // The head turns on the snare, one way then the other.
      rot(d1.head, (n % 2 === 0 ? 10 : -10) * e.snare, 32, 32);
      // A small drop on the kick.
      move(d1.root, 0, -3 * e.kick);

      // Dancer 2, the tall one: sways from the feet, swings its arms, nods on the snare.
      const d2 = parts.current[2];
      // The sway, about the feet.
      move(d2.root, 0, 0, 9 * sway, 32, 88);
      // The left arm swings against the sway.
      rot(d2.armL, mix(25 + 30 * sway, 150, up), 26, 28);
      // The right arm too.
      rot(d2.armR, mix(-25 + 30 * sway, -150, up), 38, 28);
      // The nod.
      move(d2.head, 0, 3 * e.snare);
      // The legs shift with the weight.
      rot(d2.legL, -4 * sway, 29, 63);
      // The other leg.
      rot(d2.legR, -4 * sway, 35, 63);

      // Dancer 3, the wheel: rolls from side to side, rocks on the beat, waves.
      const d3 = parts.current[3];
      // The roll, one way every two beats, with a bump on the kick.
      move(d3.root, 7 * Math.sin((Math.PI * beat) / 2), -2 * e.kick, 6 * bob, 32, 80);
      // The wheel turns with the roll.
      rot(d3.wheel, beat * 120, 32, 80);
      // The left arm waves on the up half of the bob.
      rot(d3.armL, mix(20 + 45 * Math.max(0, bob), 140, up), 21, 42);
      // The right arm on the down half.
      rot(d3.armR, mix(-20 - 45 * Math.max(0, -bob), -140, up), 43, 42);

      // Dancer 4, the twin antennas: jumps on the snare, scissors its legs on the beat, flaps on the hats.
      const d4 = parts.current[4];
      // The jump.
      move(d4.root, 0, -12 * e.snare - 4 * e.kick);
      // The left leg.
      rot(d4.legL, n % 2 === 0 ? 14 : -6, 26, 64);
      // The right leg.
      rot(d4.legR, n % 2 === 0 ? 6 : -14, 38, 64);
      // The left arm flaps.
      rot(d4.armL, mix(15 + 40 * e.hat, 135, up), 18, 47);
      // The right arm.
      rot(d4.armR, mix(-15 - 40 * e.hat, -135, up), 46, 47);
      // The head bobs.
      rot(d4.head, 5 * bob, 32, 40);
    },
    hit(voice: Voice) {
      // The envelopes.
      const e = env.current;
      // Each drum to its envelope.
      if (voice === "kick") e.kick = 1;
      // The snare (the clap in the 64-bit era is a snare voice too).
      else if (voice === "snare") e.snare = 1;
      // Closed and open hats.
      else if (voice === "hat" || voice === "ohat") e.hat = voice === "ohat" ? 1 : Math.max(e.hat, 0.7);
      // The crash.
      else if (voice === "crash") e.crash = 1;
    },
    approve() {
      // The dancer whose turn it is.
      const i = turn.current % COUNT;
      // The next one next time.
      turn.current += 1;
      // The check shows.
      showCheck(i, true);
      // And goes, unless the stamp has landed meanwhile.
      timers.current.push(window.setTimeout(() => {
        // Kept for the finale.
        if (!final.current) showCheck(i, false);
      }, 700));
    },
    finale() {
      // Arms stay up.
      final.current = true;
      // Every check on.
      for (let i = 0; i < COUNT; i += 1) showCheck(i, true);
    },
    rest() {
      // No pending check timers.
      timers.current.forEach((id) => window.clearTimeout(id));
      // None left.
      timers.current = [];
      // The envelopes at rest.
      env.current = { kick: 0, snare: 0, hat: 0, crash: 0 };
      // No last frame.
      last.current = 0;
      // Not the finale.
      final.current = false;
      // From the first dancer again.
      turn.current = 0;
      // Every part back to its drawn pose, every light dim, every check off.
      parts.current.forEach((p, i) => {
        // The moving parts.
        [p.root, p.head, p.armL, p.armR, p.foreL, p.foreR, p.legL, p.legR, p.wheel].forEach((el) => el?.removeAttribute("transform"));
        // The lights.
        p.bulbs.forEach((b) => b.setAttribute("opacity", "0.35"));
        // The check.
        showCheck(i, false);
      });
    },
  }));

  /**
   * The green check above a dancer's head.
   *
   * @param i the dancer
   * @returns the check
   */
  const check = (i: number) => (
    <g ref={part(i, "check")} className="lgtm-dancer-check" transform="translate(32 -5)">
      {/* The green disc. */}
      <circle r="5.5" className="lgtm-dancer-check-disc" />
      {/* The tick. */}
      <path d="M-2.6 0l1.8 1.8 3.4-3.6" className="lgtm-dancer-check-tick" />
    </g>
  );

  // The five robots, side by side on the stage floor.
  return (
    <div className="lgtm-dancers" aria-hidden="true">
      {/* Dancer 0, the box: a square head with one antenna, a screen on its chest. */}
      <svg className="lgtm-dancer lgtm-dancer-0" viewBox="0 -12 64 108" focusable="false">
        <g ref={part(0, "root")}>
          {/* The legs, from the hips, with feet. */}
          <g ref={part(0, "legL")}><path d="M27 62v20h-5" {...STROKE} /></g>
          <g ref={part(0, "legR")}><path d="M37 62v20h5" {...STROKE} /></g>
          {/* The body and the green tick on its screen. */}
          <rect x="20" y="36" width="24" height="26" rx="3" className="lgtm-dancer-face" {...STROKE} />
          <path d="M26 49l4 4 8-8" {...STROKE} />
          {/* The arms, from the shoulders. */}
          <g ref={part(0, "armL")}><path d="M20 40l-10 12" {...STROKE} /></g>
          <g ref={part(0, "armR")}><path d="M44 40l10 12" {...STROKE} /></g>
          {/* The head: a square screen with two eyes and a straight mouth, the antenna on top. */}
          <g ref={part(0, "head")}>
            <rect x="18" y="12" width="28" height="22" rx="4" className="lgtm-dancer-face" {...STROKE} />
            <path d="M25 20v4M39 20v4M27 28h10" {...STROKE} />
            <path d="M32 12V6" {...STROKE} />
            <circle ref={bulb(0)} cx="32" cy="4" r="2.6" fill="currentColor" opacity="0.35" />
          </g>
        </g>
        {check(0)}
      </svg>

      {/* Dancer 1, the dome: a domed head with a visor, jointed arms for popping and locking. */}
      <svg className="lgtm-dancer lgtm-dancer-1" viewBox="0 -12 64 108" focusable="false">
        <g ref={part(1, "root")}>
          {/* The legs. */}
          <path d="M28 62v20h-4M36 62v20h4" {...STROKE} />
          {/* The body, narrowing to the hips. */}
          <path d="M22 34h20l-3 28h-14z" className="lgtm-dancer-face" {...STROKE} />
          {/* The left arm: upper arm out, forearm from the elbow. */}
          <g ref={part(1, "armL")}>
            <path d="M22 38h-9" {...STROKE} />
            <g ref={part(1, "foreL")}><path d="M13 38v10" {...STROKE} /></g>
          </g>
          {/* The right arm. */}
          <g ref={part(1, "armR")}>
            <path d="M42 38h9" {...STROKE} />
            <g ref={part(1, "foreR")}><path d="M51 38v10" {...STROKE} /></g>
          </g>
          {/* The head: a dome with a visor band, its light in the visor. */}
          <g ref={part(1, "head")}>
            <path d="M18 31a14 14 0 0 1 28 0z" className="lgtm-dancer-face" {...STROKE} />
            <path d="M22 23h20" {...STROKE} />
            <circle ref={bulb(1)} cx="32" cy="23" r="2.4" fill="currentColor" opacity="0.35" />
          </g>
        </g>
        {check(1)}
      </svg>

      {/* Dancer 2, the tall one: a small round head with one eye, a long neck and long arms. */}
      <svg className="lgtm-dancer lgtm-dancer-2" viewBox="0 -12 64 108" focusable="false">
        <g ref={part(2, "root")}>
          {/* The legs. */}
          <g ref={part(2, "legL")}><path d="M29 63v21h-4" {...STROKE} /></g>
          <g ref={part(2, "legR")}><path d="M35 63v21h4" {...STROKE} /></g>
          {/* The slim body. */}
          <rect x="26" y="23" width="12" height="40" rx="3" className="lgtm-dancer-face" {...STROKE} />
          {/* The long arms. */}
          <g ref={part(2, "armL")}><path d="M26 28l-9 18" {...STROKE} /></g>
          <g ref={part(2, "armR")}><path d="M38 28l9 18" {...STROKE} /></g>
          {/* The head on its neck, the single eye lit. */}
          <g ref={part(2, "head")}>
            <path d="M32 17v6" {...STROKE} />
            <circle cx="32" cy="10" r="7" className="lgtm-dancer-face" {...STROKE} />
            <circle ref={bulb(2)} cx="32" cy="10" r="2.6" fill="currentColor" opacity="0.35" />
          </g>
        </g>
        {check(2)}
      </svg>

      {/* Dancer 3, the wheel: a rounded head with big eyes, a body on one wheel. */}
      <svg className="lgtm-dancer lgtm-dancer-3" viewBox="0 -12 64 108" focusable="false">
        <g ref={part(3, "root")}>
          {/* The wheel and its spokes. */}
          <g ref={part(3, "wheel")}>
            <circle cx="32" cy="80" r="10" className="lgtm-dancer-face" {...STROKE} />
            <path d="M32 72v16M24 80h16" {...STROKE} />
          </g>
          {/* The body. */}
          <rect x="21" y="36" width="22" height="30" rx="6" className="lgtm-dancer-face" {...STROKE} />
          {/* The arms. */}
          <g ref={part(3, "armL")}><path d="M21 42l-9 8" {...STROKE} /></g>
          <g ref={part(3, "armR")}><path d="M43 42l9 8" {...STROKE} /></g>
          {/* The head: two big round eyes, one bent antenna with its light. */}
          <rect x="17" y="14" width="30" height="20" rx="8" className="lgtm-dancer-face" {...STROKE} />
          <circle cx="25" cy="24" r="3" fill="currentColor" />
          <circle cx="39" cy="24" r="3" fill="currentColor" />
          <path d="M24 14l-3-6" {...STROKE} />
          <circle ref={bulb(3)} cx="20" cy="6" r="2.4" fill="currentColor" opacity="0.35" />
        </g>
        {check(3)}
      </svg>

      {/* Dancer 4, the twin antennas: a squat robot with two lights and short legs. */}
      <svg className="lgtm-dancer lgtm-dancer-4" viewBox="0 -12 64 108" focusable="false">
        <g ref={part(4, "root")}>
          {/* The legs, from the hips. */}
          <g ref={part(4, "legL")}><path d="M26 64v18h-4" {...STROKE} /></g>
          <g ref={part(4, "legR")}><path d="M38 64v18h4" {...STROKE} /></g>
          {/* The wide body. */}
          <rect x="18" y="42" width="28" height="22" rx="4" className="lgtm-dancer-face" {...STROKE} />
          {/* The short arms. */}
          <g ref={part(4, "armL")}><path d="M18 47l-8 6" {...STROKE} /></g>
          <g ref={part(4, "armR")}><path d="M46 47l8 6" {...STROKE} /></g>
          {/* The head: a wide screen, two dash eyes, two antennas with lights. */}
          <g ref={part(4, "head")}>
            <rect x="16" y="22" width="32" height="18" rx="6" className="lgtm-dancer-face" {...STROKE} />
            <path d="M24 31h4M36 31h4M22 22l-4-8M42 22l4-8" {...STROKE} />
            <circle ref={bulb(4)} cx="18" cy="12" r="2.4" fill="currentColor" opacity="0.35" />
            <circle ref={bulb(4)} cx="46" cy="12" r="2.4" fill="currentColor" opacity="0.35" />
          </g>
        </g>
        {check(4)}
      </svg>
    </div>
  );
});

// The handle's component.
export default LgtmDancers;
