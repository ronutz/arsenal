// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/fun/hooks.ts
// ----------------------------------------------------------------------------
// SMALL REACT HOOKS shared by the /dev/fun games: today's UTC day (read once,
// after mount, so the static HTML and the first render agree), the player's
// reduced-motion preference, a stopwatch, and a steady tick for real-time games.
// ============================================================================

"use client";

// React's state, effects and refs.
import { useCallback, useEffect, useRef, useState } from "react";
// The UTC day of an instant.
import { utcDayKey } from "./daily";

/**
 * Today's UTC day as YYYY-MM-DD, or null until the component has mounted.
 *
 * A static page cannot know the day it will be read on, so the games render a
 * neutral state first and draw the puzzle once this returns a day.
 *
 * @returns today's day key, or null before mount
 */
export function useToday(): string | null {
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
 * @returns the elapsed time and controls to start, stop and reset it
 */
export function useStopwatch(): { elapsed: number; running: boolean; start: () => void; stop: () => number; reset: () => void } {
  // The elapsed time shown.
  const [elapsed, setElapsed] = useState(0);
  // Whether it is running.
  const [running, setRunning] = useState(false);
  // The performance.now() of the (re)start, minus any time already counted.
  const origin = useRef(0);
  // Tick four times a second while running; whole seconds are what is shown.
  useEffect(() => {
    // Nothing to do when stopped.
    if (!running) return;
    // The interval.
    const id = window.setInterval(() => setElapsed(performance.now() - origin.current), 250);
    // Cleared when stopped or unmounted.
    return () => window.clearInterval(id);
  }, [running]);
  // Start (or resume) from the time already counted.
  const start = useCallback(() => {
    // The origin moves back by what was counted before.
    origin.current = performance.now() - elapsed;
    // Running.
    setRunning(true);
  }, [elapsed]);
  // Stop and return the exact elapsed time.
  const stop = useCallback(() => {
    // The precise value at this instant.
    const final = performance.now() - origin.current;
    // Frozen there.
    setElapsed(final);
    // Not running.
    setRunning(false);
    // For the caller's result.
    return final;
  }, []);
  // Back to zero, stopped.
  const reset = useCallback(() => {
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
