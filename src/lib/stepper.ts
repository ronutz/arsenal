// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/stepper.ts
// ----------------------------------------------------------------------------
// THE ARITHMETIC BEHIND THE SITE'S UP AND DOWN BUTTONS (PRIME 03/11/2026:
// "wherever there is a value to be entered ... implement an arrow up and arrow
// down system so that the values can be set through the click of a mouse (or
// press of the touchscreen)"). Pure functions, no React: the next value of a
// numeric field one step up or down, kept inside its bounds, written with no
// more decimals than the step or the current value need, and with the decimal
// mark the reader typed (a comma stays a comma).
// ============================================================================

/** Bounds and increment of a numeric field. */
export interface StepOptions {
  /** The smallest allowed value (none: unbounded below). */
  min?: number;
  /** The largest allowed value (none: unbounded above). */
  max?: number;
  /** The increment (default 1). */
  step?: number;
  /** Whole numbers only: the result is rounded to an integer, so a refused "100.5" steps to "101", not "101.5". */
  integer?: boolean;
  /** Where an empty field starts (default 0, brought inside the bounds): the field's own default when it shows one,
   *  such as 443 for an HTTPS port whose placeholder says 443. */
  start?: number;
}

/**
 * How many decimals a number is written with (1 → 0, 0.5 → 1, 0.25 → 2, 1e-7 → 7).
 *
 * @param n a finite number
 * @returns its count of decimals, at most 10
 */
export function decimalsOf(n: number): number {
  // Not a finite number: no decimals.
  if (!Number.isFinite(n)) return 0;
  // The shortest round-trip form, which may be exponential for tiny or huge values.
  const s = String(n);
  // Exponential form ("1e-7"): the exponent says how many decimals.
  const exp = /e-(\d+)$/i.exec(s);
  // Its decimals, plus those of the mantissa, capped.
  if (exp) return Math.min(10, Number(exp[1]) + (s.split("e")[0].split(".")[1]?.length ?? 0));
  // The digits after the point.
  const dot = s.indexOf(".");
  // None, or how many.
  return dot < 0 ? 0 : Math.min(10, s.length - dot - 1);
}

/**
 * The number a field's text holds, read leniently: spaces ignored, a lone comma read as the decimal point.
 *
 * @param text what the field shows
 * @returns the number, or NaN when the text holds none
 */
export function readNumber(text: string | number): number {
  // A number passes straight through.
  if (typeof text === "number") return text;
  // Spaces (including no-break spaces) removed.
  const t = text.replace(/[\s ]/g, "");
  // Empty: no number.
  if (t === "") return NaN;
  // A comma with no point is a decimal comma ("2,5"); otherwise commas are not part of a number here.
  const norm = t.includes(",") && !t.includes(".") ? t.replace(",", ".") : t;
  // Only a plain decimal number counts (no hex, no exponent typed by mistake).
  return /^[+-]?(\d+\.?\d*|\.\d+)$/.test(norm) ? Number(norm) : NaN;
}

/**
 * The value one step up or down from the current one, as the text the field should show.
 *
 * An empty or unreadable field starts at `start` when given (a port field's placeholder default, 443), else at 0, in
 * both cases brought inside the bounds (so an empty signed offset starts at 0, not at -1440, and a field from 1 to 32
 * starts at 1). Steps sit on a grid of multiples of
 * the step from the lower bound (or 0), as a browser's number field: a value off the grid moves to the nearest grid
 * value in the direction of travel. The result has the decimals of the step (none for an integer field), and keeps a
 * decimal comma when the field had one.
 *
 * @param current what the field shows now
 * @param direction +1 for up, -1 for down
 * @param opts the bounds and the increment
 * @returns the new text
 */
export function stepValue(current: string | number, direction: 1 | -1, opts: StepOptions = {}): string {
  // The increment, never zero or negative.
  const step = opts.step && opts.step > 0 ? opts.step : 1;
  // The bounds (unbounded when absent).
  const lo = typeof opts.min === "number" ? opts.min : -Infinity;
  // The upper one.
  const hi = typeof opts.max === "number" ? opts.max : Infinity;
  // Keep a value inside the bounds.
  const clamp = (n: number) => Math.min(hi, Math.max(lo, n));
  // The current number, if any.
  const now = readNumber(current);
  // The decimals to write: none for an integer field, else the step's and the grid origin's (a stepped value sits on
  // the grid, so it needs no more than those), or the upper bound's when the value stops there (40.95, not 41).
  const placesFor = (n: number) => (opts.integer ? 0 : Math.max(decimalsOf(step), Number.isFinite(lo) ? decimalsOf(lo) : 0, n === hi ? decimalsOf(hi) : 0));
  // The grid the steps sit on: multiples of the step from the lower bound (or from 0 when unbounded below), as a
  // browser's own number field does.
  const origin = Number.isFinite(lo) ? lo : 0;
  // How many steps the current value is from the grid's origin (a fraction when it is off the grid).
  const k = (now - origin) / step;
  // Off the grid (beyond rounding noise): the first grid value in the direction of travel, so 2.5 with a step of 1
  // goes up to 3 and down to 2, and a refused "100.5" in a whole-number field goes to 101 or 100. On it: one step.
  const offGrid = Number.isFinite(k) && Math.abs(k - Math.round(k)) > 1e-9;
  // Where the step lands before the bounds.
  const moved = offGrid ? origin + (direction > 0 ? Math.ceil(k) : Math.floor(k)) * step : now + direction * step;
  // The next number: from nothing, the start value (or 0) brought inside the bounds; otherwise the step, inside them.
  const raw = Number.isFinite(now) ? clamp(moved) : clamp(typeof opts.start === "number" && Number.isFinite(opts.start) ? opts.start : 0);
  // An integer field is whole even at a fractional bound, and stays inside the bounds (max 40.95 gives 40, not 41).
  const whole = Math.round(raw);
  // The whole number, pulled back inside a fractional bound.
  const next = opts.integer ? (whole > hi ? Math.floor(hi) : whole < lo ? Math.ceil(lo) : whole) : raw;
  // The decimals this value needs.
  const places = placesFor(next);
  // Rounded to those decimals, so 0.1 + 0.2 shows as 0.3; trailing zeros dropped ("2.50" → "2.5", "3.0" → "3").
  let out = next.toFixed(places);
  // Only a decimal part can lose zeros.
  if (out.includes(".")) out = out.replace(/\.?0+$/, "");
  // "-0" reads as "0".
  if (out === "-0") out = "0";
  // A field typed with a decimal comma keeps it.
  return typeof current === "string" && current.includes(",") && !current.includes(".") ? out.replace(".", ",") : out;
}

/**
 * Whether a step in a direction would change the value (false at a bound, so the button can be disabled there).
 *
 * @param current what the field shows now
 * @param direction +1 for up, -1 for down
 * @param opts the bounds
 * @returns true when the step would move the value
 */
export function canStep(current: string | number, direction: 1 | -1, opts: StepOptions = {}): boolean {
  // The current number.
  const now = readNumber(current);
  // An empty or unreadable field can always be given a value.
  if (!Number.isFinite(now)) return true;
  // The bounds an integer field can actually reach (a max of 40.95 stops it at 40).
  const top = typeof opts.max === "number" ? (opts.integer ? Math.floor(opts.max) : opts.max) : Infinity;
  // The lower one.
  const bottom = typeof opts.min === "number" ? (opts.integer ? Math.ceil(opts.min) : opts.min) : -Infinity;
  // Up is possible below the upper bound; down above the lower one.
  return direction > 0 ? now < top : now > bottom;
}
