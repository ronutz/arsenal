"use client";

// ============================================================================
// src/lib/hooks/useQuickTaps.ts
// ----------------------------------------------------------------------------
// FIVE QUICK TAPS (PRIME 03/11/2026, "Yes on all your suggested ideas"): the
// touch route to the /dev/fun cheat codes. A phone has no keyboard to type
// IDDQD on the Mega Brain or IDKFA on the Importance Meter, so five quick taps
// on one element (the brain, the gauge) do what the typed code does.
//
// The rule, kept strict so ordinary play never fires it:
//   - only touch (and pen) taps count: a mouse has the keyboard beside it;
//   - only taps on the element the handler is attached to count;
//   - a run is the taps that land within WINDOW_MS of its first tap; all of
//     them must land inside that window (five taps in about two seconds is a
//     deliberate drumroll, not someone tapping the brain for its one-liners);
//   - a run that does not reach the count by the end of its window lapses and
//     the next tap starts a new one.
// The hook only counts. The caller shows the progress (the same cue the typed
// code lights, onTap) and clears it when a run lapses (onLapse); the run that
// reaches the count resets itself, and the caller fires what the code fires.
// ============================================================================

// Refs for the run and its timer, a callback that stays the same, and the unmount clean-up.
import { useCallback, useEffect, useRef } from "react";
// The pointer event the handler receives.
import type { PointerEvent as ReactPointerEvent } from "react";

/** How long a run lasts from its first tap (ms): "taps within about 2 seconds". */
export const QUICK_TAP_WINDOW_MS = 2000;

/** The taps a run needs: one per letter of IDDQD and IDKFA. */
export const QUICK_TAP_COUNT = 5;

/**
 * The tap from which a caller shows its progress cue. The typed code shows its cue from the first right letter, a key
 * nobody presses by accident; a tap on the brain is ordinary play, so a cue at the first tap, or the second, would
 * flash at most players and give the secret away. Three taps inside the window are already a drumroll.
 */
export const QUICK_TAP_CUE_FROM = 3;

/**
 * Count quick touch taps on one element.
 *
 * @param count the taps a run needs (five)
 * @param onTap called on every counted tap with the run's length so far (1 to count)
 * @param onLapse called when a run ends without reaching the count, with the length it reached
 * @returns the handler to put on the element's onPointerUp
 */
export function useQuickTaps(
  count: number,
  onTap: (n: number) => void,
  onLapse: (n: number) => void,
): (e: ReactPointerEvent<Element>) => void {
  // The run: how many taps, and when the first landed (performance.now()).
  const runRef = useRef<{ n: number; start: number }>({ n: 0, start: 0 });
  // The timer that ends a run at the close of its window.
  const timerRef = useRef<number | null>(null);
  // The latest callbacks, so the handler itself never changes.
  const tapRef = useRef(onTap);
  tapRef.current = onTap;
  const lapseRef = useRef(onLapse);
  lapseRef.current = onLapse;

  // A pending timer is cleared when the element's page closes.
  useEffect(
    () => () => {
      // Nothing left to lapse.
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  return useCallback(
    (e: ReactPointerEvent<Element>) => {
      // A mouse click is not a tap: the keyboard is right there.
      if (e.pointerType !== "touch" && e.pointerType !== "pen") return;
      // When this tap landed.
      const now = performance.now();
      // The run so far.
      const run = runRef.current;
      // No run yet, or the last one's window has closed: this tap starts a new run.
      if (run.n === 0 || now - run.start > QUICK_TAP_WINDOW_MS) {
        // The new run.
        runRef.current = { n: 1, start: now };
        // Its window ends WINDOW_MS from now; an earlier timer belonged to a run already over.
        if (timerRef.current !== null) window.clearTimeout(timerRef.current);
        // At the close of the window, a run still short of the count lapses.
        timerRef.current = window.setTimeout(() => {
          // The run as it stands then.
          const reached = runRef.current.n;
          // Over.
          runRef.current = { n: 0, start: 0 };
          // No timer pending any more.
          timerRef.current = null;
          // Tell the caller, so it can put its cue away.
          if (reached > 0) lapseRef.current(reached);
        }, QUICK_TAP_WINDOW_MS);
      } else {
        // Inside the window: one more tap in this run.
        runRef.current = { n: run.n + 1, start: run.start };
      }
      // The run's length now.
      const n = runRef.current.n;
      // The run reached the count: it is complete, and it resets before the caller fires anything.
      if (n >= count) {
        // A finished run does not lapse.
        if (timerRef.current !== null) window.clearTimeout(timerRef.current);
        // No timer pending.
        timerRef.current = null;
        // Ready for another.
        runRef.current = { n: 0, start: 0 };
      }
      // The caller lights its cue (and fires on the last tap).
      tapRef.current(Math.min(n, count));
    },
    [count],
  );
}
