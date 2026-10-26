// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/profile-inheritance/compute.ts
// ----------------------------------------------------------------------------
// THE PROFILE INHERITANCE LAB'S MODEL (2026-10-26), the interactive companion
// of the article "Profiles on a Virtual Server" (its section "Inheritance and
// how it reads"). One parent TCP profile and two custom children derived from
// it: child A leaves the idle timeout alone, child B either inherits it too or
// sets its own value. The reader sets the parent's idle timeout now and after
// an edit, and the model gives the value in force on each profile before and
// after the edit:
//
//   1. A child inherits every setting of its parent that it has not modified,
//      and later changes to the parent propagate to it automatically.
//   2. A setting the child modified (its Custom box checked, in the
//      Configuration utility) keeps the child's value, even when the parent's
//      value changes later; the parent never overwrites it through inheritance.
//   3. So an override that happens to equal the parent's value is still an
//      override: it stops following the parent the moment the parent changes.
//
// Rules 1 and 2 are F5's own, from the BIG-IP 21.1 profiles reference chapter
// "Introduction to local traffic profiles" (custom and parent profiles, and the
// Custom check box), cited in the article. The opening parent value, 300
// seconds, is the tcp profile's default idle-timeout in the v17 tmsh reference.
// What the model leaves out, stated in the lab's scope note: other settings,
// other profile types, connections already open when a value changes, and
// editing a system default profile itself.
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** The tcp profile's default idle-timeout, in seconds (tmsh reference, ltm profile tcp). */
export const TCP_DEFAULT_IDLE_TIMEOUT = 300;
/** The smallest timeout the lab accepts, in seconds. */
export const MIN_SECONDS = 1;
/** The largest timeout the lab accepts, in seconds (one day: a bound for the lab, not a platform limit). */
export const MAX_SECONDS = 86400;

/** Whether child B inherits the idle timeout or sets its own. */
export type ChildMode = "inherit" | "custom";

/** The reader's settings. */
export interface InheritanceInput {
  /** The parent profile's idle timeout before the edit, in seconds. */
  parentBefore: number;
  /** The parent profile's idle timeout after the edit, in seconds. */
  parentAfter: number;
  /** Whether child B inherits the setting or carries its own (Custom checked). */
  childB: ChildMode;
  /** Child B's own value, in seconds (used only when it is custom). */
  childBValue: number;
}

/** One profile's value before and after the parent's edit. */
export interface ProfileValues {
  /** The value in force before the edit, in seconds. */
  before: number;
  /** The value in force after the edit, in seconds. */
  after: number;
  /** True when the value comes from the parent (inherited), false when it is the profile's own. */
  inherited: boolean;
}

/** The model's answer. */
export interface InheritanceResult {
  /** The parent's own values. */
  parent: ProfileValues;
  /** Child A: inherits the setting (rule 1). */
  childA: ProfileValues;
  /** Child B: inherits it, or keeps its own value (rule 2). */
  childB: ProfileValues;
  /** True when the parent's value changes in the edit. */
  parentChanged: boolean;
  /** Rule 3: true when B's own value equals the parent's value before the edit, so it looks inherited but is not. */
  overrideLooksInherited: boolean;
  /** True when, after the edit, A and B are in force with different values. */
  childrenDiverge: boolean;
}

/** The stable codes an invalid input is refused with. */
export type InheritanceErrorCode = "bad-seconds" | "bad-mode";

/** The error a refused input throws, with its stable code. */
export class InheritanceError extends Error {
  /** The stable code, for vectors and for the interface's message. */
  readonly code: InheritanceErrorCode;
  /** Build the error from its code and a message for developers. */
  constructor(code: InheritanceErrorCode, message: string) {
    // The message for developers.
    super(message);
    // The code for everything else.
    this.code = code;
  }
}

/** True when a value is a whole number of seconds within the lab's range. */
function isSeconds(v: number): boolean {
  // Whole and within the range.
  return Number.isInteger(v) && v >= MIN_SECONDS && v <= MAX_SECONDS;
}

/** The value in force on the parent and on both children, before and after the parent's edit. */
export function compute(input: InheritanceInput): InheritanceResult {
  // Child B's mode must be one of the two.
  if (input.childB !== "inherit" && input.childB !== "custom") throw new InheritanceError("bad-mode", `not a child mode: ${String(input.childB)}`);
  // The parent's two values must be valid timeouts.
  if (!isSeconds(input.parentBefore) || !isSeconds(input.parentAfter)) throw new InheritanceError("bad-seconds", "parent timeout out of range");
  // B's own value matters only when it is custom, and must then be valid.
  if (input.childB === "custom" && !isSeconds(input.childBValue)) throw new InheritanceError("bad-seconds", "child timeout out of range");
  // The parent's own values.
  const parent: ProfileValues = { before: input.parentBefore, after: input.parentAfter, inherited: false };
  // Rule 1: A has not modified the setting, so it follows the parent before and after.
  const childA: ProfileValues = { before: input.parentBefore, after: input.parentAfter, inherited: true };
  // Rule 2: a custom B keeps its own value both times; an inheriting B follows the parent.
  const custom = input.childB === "custom";
  // B's values.
  const childB: ProfileValues = custom ? { before: input.childBValue, after: input.childBValue, inherited: false } : { before: input.parentBefore, after: input.parentAfter, inherited: true };
  // Every figure, for the result panel.
  return {
    parent,
    childA,
    childB,
    parentChanged: input.parentBefore !== input.parentAfter,
    overrideLooksInherited: custom && input.childBValue === input.parentBefore,
    childrenDiverge: childA.after !== childB.after,
  };
}

/** The lab's opening state: the tcp default of 300 s raised to 600 s, both children inheriting. */
export const DEFAULT_INPUT: InheritanceInput = { parentBefore: TCP_DEFAULT_IDLE_TIMEOUT, parentAfter: 600, childB: "inherit", childBValue: 90 };

/** The Example button's state: B was set to 300 s by hand, the same as the parent, and stays there when the parent moves to 600 s. */
export const EXAMPLE_INPUT: InheritanceInput = { parentBefore: TCP_DEFAULT_IDLE_TIMEOUT, parentAfter: 600, childB: "custom", childBValue: 300 };
