// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/fun/hooks.ts
// ----------------------------------------------------------------------------
// SMALL REACT HOOKS shared by the /dev/fun games: today's UTC day (read once,
// after mount, so the static HTML and the first render agree), the player's
// reduced-motion preference, a stopwatch, and a steady tick for real-time games.
//
// Earlier puzzles (PRIME 05/11/2026): on a page opened with ?day=YYYY-MM-DD
// (archive.ts), useToday() returns that earlier day, so every game draws, saves
// and shows the earlier puzzle through the code it already has. What must stay
// on the real today (the streak, the new-day notice, practice lists, a game
// with no daily) reads useRealToday(); the frame reads useDayRequest().
// ============================================================================

"use client";

// React's state, effects and refs.
import { useCallback, useEffect, useRef, useState } from "react";
// The UTC day of an instant.
import { utcDayKey } from "./daily";
// The ?day= request, checked against the clock.
import { readDayRequest, type DayRequest } from "./archive";

/**
 * The day whose puzzle the page plays, as YYYY-MM-DD, or null until the component has mounted: today's UTC day, or
 * the earlier day the address asks for (?day=, honoured only for a day before today, see archive.ts).
 *
 * A static page cannot know the day it will be read on, so the games render a
 * neutral state first and draw the puzzle once this returns a day.
 *
 * @returns the day in play, or null before mount
 */
export function useToday(): string | null {
  // Null on the server and on the first client render.
  const [day, setDay] = useState<string | null>(null);
  // After mount, read the address and the clock once.
  useEffect(() => {
    // The checked request.
    const req = readDayRequest();
    // The earlier day when one is in play, today otherwise.
    setDay(req.earlier ?? req.today);
  }, []);
  // The day, or null.
  return day;
}

/**
 * Today's UTC day as YYYY-MM-DD, whatever the address asks for, or null until the component has mounted.
 *
 * @returns today's day key, or null before mount
 */
export function useRealToday(): string | null {
  // Null on the server and on the first client render.
  const [day, setDay] = useState<string | null>(null);
  // After mount, read the clock once.
  useEffect(() => {
    // The day, in UTC.
    setDay(utcDayKey(new Date()));
  }, []);
  // The day, or null.
  return day;
}

/**
 * The earlier day the page plays (?day=), or null: on today's puzzle, before mount, and when the request was refused.
 *
 * @returns the earlier day, or null
 */
export function useEarlierDay(): string | null {
  // Null until read.
  const [day, setDay] = useState<string | null>(null);
  // After mount, read the address and the clock once.
  useEffect(() => {
    // The checked request's earlier day.
    setDay(readDayRequest().earlier);
  }, []);
  // The day, or null.
  return day;
}

/**
 * The whole request, for the frame around a game: today, the earlier day in play, a refused request; null before mount.
 *
 * @returns the checked request, or null before mount
 */
export function useDayRequest(): DayRequest | null {
  // Null on the server and on the first client render.
  const [req, setReq] = useState<DayRequest | null>(null);
  // After mount, read the address and the clock once.
  useEffect(() => {
    // Checked against today.
    setReq(readDayRequest());
  }, []);
  // The request, or null.
  return req;
}

/**
 * Whether the player asked the system for reduced motion.
 *
 * @returns true when animations should be kept to a minimum
 */
export function useReducedMotion(): boolean {
  // False until the media query has been read.
  const [reduce, setReduce] = useState(false);
  // Read and follow the preference.
  useEffect(() => {
    // Not every environment has matchMedia.
    if (typeof window === "undefined" || !window.matchMedia) return;
    // The query.
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Its current answer.
    setReduce(mq.matches);
    // Follow changes while the page is open.
    const on = (e: MediaQueryListEvent) => setReduce(e.matches);
    // Subscribe.
    mq.addEventListener?.("change", on);
    // Unsubscribe on unmount.
    return () => mq.removeEventListener?.("change", on);
  }, []);
  // The preference.
  return reduce;
}

/**
 * A stopwatch: elapsed milliseconds while running, frozen when stopped.
 *
 * Since 06/11/2026 the time already counted is kept in a ref, not read from the displayed state: Exit the Editor's
 * Restart resets and starts it in one handler (PRIME 06/11/2026, the screen and the clock start together), and a start
 * that read the state would have resumed from the reset's stale value. A start while running is ignored, so a later
 * first key cannot move the origin either.
 *
 * @returns the elapsed time and controls to start, stop and reset it
 */
export function useStopwatch(): { elapsed: number; running: boolean; start: () => void; stop: () => number; reset: () => void } {
  // The elapsed time shown.
  const [elapsed, setElapsed] = useState(0);
  // Whether it is running.
  const [running, setRunning] = useState(false);
  // The performance.now() of the (re)start, minus any time already counted.
  const origin = useRef(0);
  // The time counted while stopped (zero after a reset), read by start whatever the displayed state says.
  const counted = useRef(0);
  // Whether it is running, for the controls (the state above is for rendering).
  const on = useRef(false);
  // Tick four times a second while running; whole seconds are what is shown.
  useEffect(() => {
    // Nothing to do when stopped.
    if (!running) return;
    // The interval.
    const id = window.setInterval(() => setElapsed(performance.now() - origin.current), 250);
    // Cleared when stopped or unmounted.
    return () => window.clearInterval(id);
  }, [running]);
  // Start (or resume) from the time already counted; a stopwatch already running carries on.
  const start = useCallback(() => {
    // Already running: nothing moves.
    if (on.current) return;
    // The origin moves back by what was counted before.
    origin.current = performance.now() - counted.current;
    // Running.
    on.current = true;
    // Shown.
    setRunning(true);
  }, []);
  // Stop and return the exact elapsed time.
  const stop = useCallback(() => {
    // The precise value at this instant, or what was counted when it was not running.
    const final = on.current ? performance.now() - origin.current : counted.current;
    // Kept for a later start.
    counted.current = final;
    // Off.
    on.current = false;
    // Frozen there.
    setElapsed(final);
    // Not running.
    setRunning(false);
    // For the caller's result.
    return final;
  }, []);
  // Back to zero, stopped.
  const reset = useCallback(() => {
    // Nothing counted.
    counted.current = 0;
    // Off.
    on.current = false;
    // Zero.
    setElapsed(0);
    // Stopped.
    setRunning(false);
  }, []);
  // The stopwatch.
  return { elapsed, running, start, stop, reset };
}

/**
 * Call a function on every animation frame while active, with the time since the previous frame.
 *
 * @param active whether the loop runs
 * @param onFrame called with the milliseconds since the last frame (capped at 100, so a background tab does not jump)
 */
export function useFrameLoop(active: boolean, onFrame: (dtMs: number) => void): void {
  // The latest callback, so the loop does not restart when it changes.
  const cb = useRef(onFrame);
  // Keep it current.
  useEffect(() => {
    // The newest function.
    cb.current = onFrame;
  }, [onFrame]);
  // The loop itself.
  useEffect(() => {
    // Nothing while inactive.
    if (!active) return;
    // The handle of the next frame request.
    let handle = 0;
    // The time of the previous frame.
    let last = performance.now();
    // One frame.
    const step = (now: number) => {
      // Time since the previous frame, capped.
      const dt = Math.min(100, now - last);
      // Remember this frame.
      last = now;
      // The game's update.
      cb.current(dt);
      // The next frame.
      handle = window.requestAnimationFrame(step);
    };
    // Start.
    handle = window.requestAnimationFrame(step);
    // Stop on deactivation or unmount.
    return () => window.cancelAnimationFrame(handle);
  }, [active]);
}
