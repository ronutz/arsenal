// ============================================================================
// src/lib/tools/f5-bigip-index-base-finder/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the BIG-IP zero-or-one finder (posture "input":
// search words, filters and a short value to count in, nothing of the
// reader's network). The tool is a form with two modes, so a link carries
// named values only (no "input"), and the mode it opens in:
//   Look up     search (the words, at most 200 characters), base (zero, one,
//               right, mixed, value, count) and area (tcl, irules, config,
//               platform, api, logs), each only when set; "mode" is absent.
//               With no words and no filter there is nothing to share.
//   Translate   mode=translate, question (char, field, segment, label,
//               element, search), value (at most 2,000 characters), n (1 to
//               1,000; not for search), sep (field only, 1 to 20 characters)
//               and needle (search only, at most 200 characters).
// The counts are the page's own field limits (maxLength and the engine's).
//
// Arrival: the mode opens and its fields are set; the page computes as it
// does on typing (the Tcl 8.4.6 teaching engine runs locally, as on every
// keystroke; nothing is fetched). A field of the other mode, an unknown mode,
// base, area or question, a value over its limit, or an N out of range makes
// the whole share malformed: ignored.
// ============================================================================

import { AREAS, BASES, QUESTIONS, type Area, type Base, type Question } from "./compute"; // the choices
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state of either mode (the component passes the open mode's fields). */
export type IndexShareState =
  | { mode: "lookup"; query: string; base: Base | "all"; area: Area | "all" } // the look-up filters
  | { mode: "translate"; question: Question; value: string; n: string; separator: string; needle: string }; // the translator's inputs

/** The names a look-up link may carry. */
const LOOKUP_NAMES = ["search", "base", "area"]; // with no "mode"
/** The names a translation link may carry. */
const TRANSLATE_NAMES = ["mode", "question", "value", "n", "sep", "needle"]; // "mode" is "translate"

/** The spec. */
export const INDEX_BASE_SHARE: ShareSpec<IndexShareState> = Object.freeze({
  tool: "f5-bigip-index-base-finder", // the slug
  posture: "input", // words, filters and a value to count in
  carriesKey: "share.carries", // tools.f5-bigip-index-base-finder.share.carries (an ICU select on the mode)
  names: ["mode", "search", "base", "area", "question", "value", "n", "sep", "needle"], // no "input": a form
  /** The open mode's fields; nothing for an unfiltered look-up. */
  encode(s: IndexShareState): ShareEncoding {
    const p: Record<string, string> = {}; // the values
    if (s.mode === "lookup") { // the look-up
      if (s.query.trim() !== "") p.search = s.query; // the words, as typed
      if (s.base !== "all") p.base = s.base; // a base filter
      if (s.area !== "all") p.area = s.area; // an area filter
      if (Object.keys(p).length === 0) return { ok: false, reason: "empty" } as const; // the whole catalogue: the bare page shows it
      return { ok: true, params: p } as const; // the filters
    } // the look-up
    p.mode = "translate"; // the translator
    p.question = s.question; // which question
    p.value = s.value; // the value (an empty one is left out, and an arrival empties the field)
    if (s.question !== "search") p.n = String(Math.trunc(Number(s.n))); // N as the engine reads it
    if (s.question === "field") p.sep = s.separator; // the separator
    if (s.question === "search") p.needle = s.needle; // the text to find
    return { ok: true, params: p } as const; // the inputs
  },
  /** The mode's fields, validated against the page's choices and limits. */
  decode(v: Readonly<Record<string, string | null>>): IndexShareState | null {
    const has = (k: string) => v[k] !== null && v[k] !== undefined; // carried
    if (!has("mode")) { // a look-up
      if (TRANSLATE_NAMES.some(has)) return null; // a translator field without the mode
      if (!LOOKUP_NAMES.some(has)) return null; // nothing to fill
      const query = v.search ?? ""; // the words
      if (query.length > 200) return null; // over the field's limit
      const base = v.base ?? "all"; // the base filter
      if (base !== "all" && !(BASES as string[]).includes(base)) return null; // a base the page does not list
      const area = v.area ?? "all"; // the area filter
      if (area !== "all" && !(AREAS as string[]).includes(area)) return null; // an area the page does not list
      return { mode: "lookup", query, base: base as Base | "all", area: area as Area | "all" }; // the filters
    } // a look-up
    if (v.mode !== "translate") return null; // an unknown mode
    if (LOOKUP_NAMES.some(has)) return null; // a look-up field in a translation
    const question = v.question ?? ""; // the question
    if (!(QUESTIONS as string[]).includes(question)) return null; // one the page does not ask
    const value = v.value ?? ""; // the value
    if (value.length > 2000) return null; // over the field's limit
    let n = "1"; // N, for a search (ignored there)
    if (question === "search") { if (has("n")) return null; } // a search takes no N
    else { const raw = v.n ?? ""; if (!/^\d{1,4}$/.test(raw) || Number(raw) < 1 || Number(raw) > 1000) return null; n = String(Number(raw)); } // N from 1 to 1,000
    if (has("sep") !== (question === "field")) return null; // a separator exactly for a field question
    const separator = v.sep ?? "."; // the separator (the page's start value when none goes)
    if (separator.length < 1 || separator.length > 20) return null; // the field's limits
    if (has("needle") && question !== "search") return null; // a needle only for a search
    const needle = v.needle ?? ""; // the text to find
    if (needle.length > 200) return null; // the field's limit
    return { mode: "translate", question: question as Question, value, n, separator, needle }; // the inputs
  },
});
