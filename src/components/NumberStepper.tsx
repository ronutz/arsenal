// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/NumberStepper.tsx
// ----------------------------------------------------------------------------
// UP AND DOWN BUTTONS FOR ANY NUMERIC FIELD ON THE SITE (PRIME 03/11/2026:
// "implement an arrow up and arrow down system so that the values can be set
// through the click of a mouse (or press of the touchscreen)").
//
// <StepperField> wraps an existing input and puts a down arrow (decrease) and
// an up arrow (increase) beside it. The input stays exactly as it was (typing still works,
// its own onChange still validates); the buttons call the same setter with the
// value one step on (src/lib/stepper.ts). A press steps once; holding steps
// again after 450 ms and then faster, until the pointer lifts or a bound is
// reached, where the button is disabled.
//
// The buttons are 44 px touch targets, named for the field ("Increase Hours
// until the stated deadline"), and left out of the Tab order: a keyboard
// already has the arrow keys, native on type="number" fields and given to
// text fields with inputMode numeric or decimal by stepperKeyDown(). So a form
// keeps the Tab stops it had, and a screen reader still finds the buttons.
//
// Label the field with <label htmlFor> above or beside it, not a <label> that
// wraps it: a wrapping label would pull the arrows' names into the field's own
// accessible name ("Port Decrease Port Increase Port").
// ============================================================================

"use client";

// React's state, refs and effects.
import { useCallback, useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
// The two button names, from the global "stepper" namespace (every page carries it).
import { useTranslations } from "next-intl";
// The arithmetic.
import { canStep, stepValue, type StepOptions } from "@/lib/stepper";

/** Wait before a held button starts repeating. */
const HOLD_DELAY_MS = 450;
/** Repeat interval at first. */
const REPEAT_MS = 90;
/** Repeat interval after ten repeats. */
const FAST_REPEAT_MS = 40;

/** What a stepper needs to know about its field. */
export interface StepperProps extends StepOptions {
  /** What the field holds now (its text, or the number its state keeps). */
  value: string | number;
  /** Set the field: called with the new text, exactly as the field's own onChange would set it. */
  onValue: (next: string) => void;
  /** The field's name, for the buttons' names ("Increase <label>"). */
  label: string;
  /** The input's id, so the buttons say which field they control. */
  inputId?: string;
  /** Disabled with the field. */
  disabled?: boolean;
}

/**
 * The decrease and increase buttons alone (for a layout that places them itself).
 *
 * @param props the field's value, its setter, its bounds and its name
 * @returns the two buttons
 */
export function NumberStepper(props: StepperProps) {
  // The two names.
  const t = useTranslations("stepper");
  // The latest props, read by a repeating timer (each step re-renders with the new value).
  const latest = useRef(props);
  // Kept current on every render.
  latest.current = props;
  // The hold timer and the repeat count.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // How many repeats so far (they speed up after ten).
  const repeats = useRef(0);
  // Set when a pointer press already stepped, so the click that follows it does not step again.
  const pressed = useRef(false);

  // Stop any hold in progress.
  const stop = useCallback(() => {
    // The pending timer, if any, cancelled.
    if (timer.current !== null) clearTimeout(timer.current);
    // None now.
    timer.current = null;
    // Count from zero next time.
    repeats.current = 0;
  }, []);

  // One step in a direction, from the latest value; false when a bound stopped it.
  const stepOnce = useCallback((direction: 1 | -1): boolean => {
    // The latest field state.
    const p = latest.current;
    // Nothing at a bound or while disabled.
    if (p.disabled || !canStep(p.value, direction, p)) return false;
    // The new text.
    const next = stepValue(p.value, direction, p);
    // Unchanged (a bound reached exactly): stop.
    if (next === String(p.value)) return false;
    // Set the field.
    p.onValue(next);
    // Keep the latest value at hand for the next repeat, before React re-renders.
    latest.current = { ...p, value: next };
    // Stepped.
    return true;
  }, []);

  // A held button: step again after a pause, then faster.
  const hold = useCallback(
    (direction: 1 | -1) => {
      // Each tick schedules the next one while steps keep moving.
      const tick = () => {
        // A bound reached: stop.
        if (!stepOnce(direction)) return stop();
        // One more repeat.
        repeats.current += 1;
        // The next tick, faster after ten.
        timer.current = setTimeout(tick, repeats.current > 10 ? FAST_REPEAT_MS : REPEAT_MS);
      };
      // The first repeat after the hold delay.
      timer.current = setTimeout(tick, HOLD_DELAY_MS);
    },
    [stepOnce, stop],
  );

  // Never leave a timer running after the field goes.
  useEffect(() => stop, [stop]);

  // One button's handlers and attributes.
  const button = (direction: 1 | -1) => {
    // Whether this direction can move.
    const enabled = !props.disabled && canStep(props.value, direction, props);
    // The button.
    return (
      <button
        type="button"
        className="num-stepper-btn"
        // Out of the Tab order: the keyboard has the arrow keys on the field itself.
        tabIndex={-1}
        aria-label={t(direction > 0 ? "increase" : "decrease", { label: props.label })}
        aria-controls={props.inputId}
        disabled={!enabled}
        onPointerDown={(e) => {
          // The main button or a touch only.
          if (e.button !== 0) return;
          // Keep the focus where it is (on the field, if the reader was typing).
          e.preventDefault();
          // The click that follows this press must not step again.
          pressed.current = true;
          // Step now.
          stepOnce(direction);
          // And again while held.
          hold(direction);
        }}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        onClick={() => {
          // A pointer press already stepped.
          if (pressed.current) {
            // Consumed.
            pressed.current = false;
            // Done.
            return;
          }
          // A screen reader's or a keyboard's activation: one step.
          stepOnce(direction);
        }}
        // A long press must not open a menu or select text on a phone.
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* An arrow up or down, drawn in the text colour (the button's name says it in words). */}
        <svg className="num-stepper-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
          <path d={direction > 0 ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6"} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    );
  };

  // Down (decrease) first, then up (increase), as on a number line.
  return (
    <span className="num-stepper">
      {button(-1)}
      {button(1)}
    </span>
  );
}

/**
 * A numeric field with its up and down buttons beside it: wrap the existing input and pass its value and setter.
 *
 * @param props the stepper's props and the input itself as the child
 * @returns the field and its buttons, in one row that shrinks the input before it wraps
 */
export function StepperField(props: StepperProps & { children: ReactNode; className?: string }) {
  // The input as given, then the buttons.
  const { children, className, ...stepper } = props;
  // One row.
  return (
    <div className={`num-field${className ? ` ${className}` : ""}`}>
      {children}
      <NumberStepper {...stepper} />
    </div>
  );
}

/**
 * Arrow keys for a numeric text field (inputMode numeric or decimal), which browsers do not step on their own: Arrow
 * Up and Down step once, Page Up and Page Down ten steps. A type="number" field already steps natively; do not add it
 * there.
 *
 * @param opts the field's value, setter and bounds
 * @returns an onKeyDown handler for the input
 */
export function stepperKeyDown(opts: StepOptions & { value: string | number; onValue: (next: string) => void }) {
  // The handler.
  return (e: KeyboardEvent<HTMLInputElement>) => {
    // Which way, and how far.
    const dir = e.key === "ArrowUp" || e.key === "PageUp" ? 1 : e.key === "ArrowDown" || e.key === "PageDown" ? -1 : 0;
    // Any other key is the field's own business.
    if (dir === 0 || e.altKey || e.ctrlKey || e.metaKey) return;
    // The arrows would otherwise move the caret or scroll the page.
    e.preventDefault();
    // Page keys move ten steps.
    const times = e.key.startsWith("Page") ? 10 : 1;
    // Step from the current value, as many times as asked, inside the bounds.
    let v = String(opts.value);
    // Each step.
    for (let k = 0; k < times; k += 1) v = stepValue(v, dir as 1 | -1, opts);
    // Set the field once.
    opts.onValue(v);
  };
}
