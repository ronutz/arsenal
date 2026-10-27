// ============================================================================
// src/lib/share/spec.ts
// ----------------------------------------------------------------------------
// THE PER-TOOL SHARE SPEC: what a tool's "Share results" link carries and how
// an arriving link becomes the tool's state again. One small file per tool
// (src/lib/tools/<slug>/share.ts), written in minutes by a rollout helper:
//   - posture: which of the four postures of ROLLOUT.md the tool takes;
//   - carriesKey: the message key, under tools.<slug>, of the one line the
//     popover shows first ("The link carries ...");
//   - names: the fragment names it writes and reads ("input" first);
//   - encode: the tool's state to the values (or why there is nothing to
//     share, or why sharing is blocked), a pure function;
//   - decode: the values back to the tool's state, validated: anything
//     malformed gives null, and the arrival is then ignored and stripped,
//     never parsed loosely.
// The round trips (state, link, state) live in ONE central harness
// (src/lib/share/share-vectors.ts and src/lib/share/cases/), so adding a tool
// never changes that tool's own golden-vector set id.
//
// resolveArrival() is the arrival rule as a pure function: the client hook
// (use-share-arrival.ts) only applies its answer, so the rule is tested here.
// ============================================================================

import { hrefWithoutShareParams, readShareParams, type ShareParams } from "./format"; // the link format

/**
 * The four postures (ROLLOUT.md maps every shareSafetyDefault value in use to one of them, citing build spec v1.11
 * section 9.1 and charter section 6.4, D-27 c: sharing "with data" is an explicit choice, labelled plainly).
 */
export type SharePosture =
  | "input" // the input as typed, with the standard warning (share.stateNote)
  | "input-caution" // the input as typed, with the standard warning and a caution line of the tool's own
  | "derived" // a derived form only (an encrypted string without its passphrase, a masked or redacted copy)
  | "none"; // no share; the tool says why

/** What encoding a state gave. */
export type ShareEncoding =
  | { ok: true; params: ShareParams } // the values to put in the link
  | { ok: false; reason: "empty" } // nothing to share yet: the button is disabled
  | { ok: false; reason: "blocked"; code: string; values?: Readonly<Record<string, string | number>> }; // there is a result, but no link may carry it; the tool says why (code -> its message)

/** A tool's share spec. E is the state the tool encodes; D is the state an arrival restores (often the same). */
export interface ShareSpec<E, D = E> {
  /** The tool's slug. */
  readonly tool: string;
  /** Its posture. */
  readonly posture: SharePosture;
  /** The "what this link carries" message key, relative to tools.<slug> (by convention "share.carries"). */
  readonly carriesKey: string;
  /** The fragment names it writes and reads, "input" first when it has one. */
  readonly names: readonly string[];
  /** State to values; pure; never throws. */
  encode(state: E): ShareEncoding;
  /** Values to state, or null for anything malformed; pure; never throws. */
  decode(values: Readonly<Record<string, string | null>>): D | null;
}

/** What an arrival comes to. */
export interface ArrivalOutcome<D> {
  /** The state to apply, or null (no share for this tool, or one that was malformed or over-long). */
  state: D | null;
  /** The address without this tool's values, or null when it carried none (nothing to rewrite). */
  cleaned: string | null;
}

/**
 * The arrival rule: read the tool's names from the fragment only, decode them with the spec, and in every case
 * (accepted, malformed or over-long) return the address without them, so the address never keeps a share once read.
 * @param href the full address the page opened with (or changed to, on hashchange)
 * @param spec the tool's share spec
 * @returns the state to apply (or null) and the cleaned address (or null)
 */
export function resolveArrival<E, D>(href: string, spec: ShareSpec<E, D>): ArrivalOutcome<D> {
  const url = new URL(href); // parsed
  const read = readShareParams(url.hash, spec.names); // fragment only
  const cleaned = hrefWithoutShareParams(href, spec.names); // the names leave the fragment and the query alike
  if (read.kind !== "values") return { state: null, cleaned }; // none here, or over-long: ignored
  let state: D | null = null; // the decoded state
  try {
    state = spec.decode(read.values); // validated by the tool's own rules
  } catch {
    state = null; // a decode that throws is a defect; the arrival is ignored rather than half applied
  } // try
  return { state, cleaned }; // apply the state (if any), then show the cleaned address
} // resolveArrival
