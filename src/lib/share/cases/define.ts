// ============================================================================
// src/lib/share/cases/define.ts
// ----------------------------------------------------------------------------
// The shape of a tool's share cases, and the runner the central harness
// (src/lib/share/share-vectors.ts) calls. A rollout helper writes one cases
// file per tool (src/lib/share/cases/<slug>.ts) with defineShareCases and adds
// it to cases/index.ts; nothing in the tool's own golden vectors changes.
//
// What every case proves:
//   accept   state -> encode gives exactly `params` -> a link -> the arrival
//            restores exactly `restored`, and the address it leaves is the
//            bare page; a link carrying "input" is also read the same by
//            readHandoff (so usePrefill tools and the language switcher
//            agree); no string of `mustNotContain` is in the link, raw,
//            percent-encoded, form-encoded or decoded.
//   arrive   values a link may carry -> the state they restore (decode only:
//            defaults for absent optional values, for example).
//   empty    a state with nothing to share -> encode says "empty".
//   blocked  a state that has a result no link may carry -> "blocked", code.
//   reject   malformed arriving values -> decode gives null, and the arrival
//            leaves the address clean and applies nothing.
// ============================================================================

import { buildShareLink, type ShareParams } from "../format"; // the link format
import { readHandoff } from "../../handoff"; // the #input= reader usePrefill uses
import { resolveArrival, type ShareSpec } from "../spec"; // the spec and the arrival rule

/** A tool's cases. E: the state encode takes; D: the state an arrival restores. */
export interface ShareCases<E, D> {
  /** The tool's spec. */
  spec: ShareSpec<E, D>;
  /** Round trips. */
  accept: readonly { id: string; state: E; params: ShareParams; restored: D; mustNotContain?: readonly string[] }[];
  /** Decode-only arrivals. */
  arrive?: readonly { id: string; values: Readonly<Record<string, string | null>>; restored: D }[];
  /** Nothing to share. */
  empty?: readonly { id: string; state: E }[];
  /** A result no link may carry. */
  blocked?: readonly { id: string; state: E; code: string }[];
  /** Malformed arrivals. */
  reject: readonly { id: string; values: Readonly<Record<string, string | null>> }[];
}

/** One tool's cases, ready to run (the generic types closed over). */
export interface ShareCaseRunner {
  /** The tool's slug. */
  tool: string;
  /** How many cases it holds. */
  count: number;
  /** Run every case against a page address (no fragment). */
  run(base: string, check: (ok: boolean, msg: string) => void): void;
}

/** Canonical JSON (sorted keys), so two states compare by content. */
function canon(x: unknown): string {
  return JSON.stringify(x, (_k, v) => (v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.entries(v as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : 1))) : v)); // keys sorted
} // canon

/** The forms a string can take in a link: as is, percent-encoded, and form-encoded (spaces as "+"). */
function forms(s: string): string[] {
  return [s, encodeURIComponent(s), new URLSearchParams({ x: s }).toString().slice(2)]; // three spellings
} // forms

/** Decode a link's text for searching, or return it unchanged when it is not decodable. */
function decoded(href: string): string {
  try { return decodeURIComponent(href); } catch { return href; } // a stray % would throw
} // decoded

/**
 * Close a tool's cases over their types.
 * @param c the cases
 * @returns the runner
 */
export function defineShareCases<E, D>(c: ShareCases<E, D>): ShareCaseRunner {
  const count = c.accept.length + (c.arrive?.length ?? 0) + (c.empty?.length ?? 0) + (c.blocked?.length ?? 0) + c.reject.length; // every case
  return {
    tool: c.spec.tool, // the slug
    count, // the size
    run(base: string, check: (ok: boolean, msg: string) => void): void {
      const tag = (id: string): string => `[${c.spec.tool} ${id}]`; // a failure's prefix
      for (const v of c.accept) { // round trips
        const enc = c.spec.encode(v.state); // state -> values
        check(enc.ok && canon(enc.params) === canon(v.params), `${tag(v.id)} encode gave ${canon(enc)}`); // exactly the pinned values
        if (!enc.ok) continue; // nothing more to test
        check(Object.keys(enc.params).every((n) => c.spec.names.includes(n)), `${tag(v.id)} a value outside spec.names`); // declared names only
        const link = buildShareLink(base, enc.params); // values -> link
        check(link.kind === "link", `${tag(v.id)} no link: ${link.kind}`); // within the bound, valid names
        if (link.kind !== "link") continue; // nothing more to test
        const out = resolveArrival(link.href, c.spec); // link -> state
        check(canon(out.state) === canon(v.restored), `${tag(v.id)} restored ${canon(out.state)}`); // the state again
        check(out.cleaned === base, `${tag(v.id)} the address after arrival is ${out.cleaned}`); // nothing left in it
        if (enc.params.input !== undefined) { const h = readHandoff(new URL(link.href).hash, ""); check(h.kind === "value" && h.value === enc.params.input, `${tag(v.id)} readHandoff reads another value`); } // usePrefill agrees
        for (const secret of v.mustNotContain ?? []) for (const f of forms(secret)) check(!link.href.includes(f) && !decoded(link.href).includes(secret), `${tag(v.id)} the link contains ${JSON.stringify(secret)}`); // never in the link
      } // accept
      for (const v of c.arrive ?? []) check(canon(c.spec.decode(v.values)) === canon(v.restored), `${tag(v.id)} decode gave ${canon(c.spec.decode(v.values))}`); // decode only
      for (const v of c.empty ?? []) { const e = c.spec.encode(v.state); check(!e.ok && e.reason === "empty", `${tag(v.id)} expected empty, got ${canon(e)}`); } // nothing to share
      for (const v of c.blocked ?? []) { const e = c.spec.encode(v.state); check(!e.ok && e.reason === "blocked" && e.code === v.code, `${tag(v.id)} expected blocked ${v.code}, got ${canon(e)}`); } // blocked
      for (const v of c.reject) { // malformed arrivals
        check(c.spec.decode(v.values) === null, `${tag(v.id)} decode accepted it`); // refused
        const frag = new URLSearchParams(Object.entries(v.values).filter(([, x]) => x !== null) as [string, string][]).toString(); // as a link would carry them
        const out = resolveArrival(frag ? `${base}#${frag}` : base, c.spec); // arriving
        check(out.state === null && (frag === "" || out.cleaned === base), `${tag(v.id)} arrival applied ${canon(out.state)} or left ${out.cleaned}`); // ignored and stripped
      } // reject
    },
  };
} // defineShareCases
