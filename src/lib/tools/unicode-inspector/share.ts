// ============================================================================
// src/lib/tools/unicode-inspector/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the Unicode inspector (posture "input"): a link
// carries the mode the reader is in and its box as typed, with the mode's
// own choices, so the receiving page shows the same report. One box per
// mode, and the box's name says the mode:
//   Inspect a text   text, with the four cleaning switches (invisible,
//                    spaces, punct, fold; 1 or 0) and escape (the language
//                    the text is written out in);
//   One code point   cp;
//   Find by name     query;
//   Normalise        norm, and compare when a second text was typed.
// A choice at the page's default is left out of the link and restored as the
// default on arrival (cleaning: invisible, spaces and punct on, fold off;
// escape: json).
//
// The names are not "input". This page reads #input= with usePrefill (the
// ASCII table's links open a code point here that way), and a share that
// restores a mode, its box and its choices together needs an arrival of its
// own (useShareArrival); with "input" among its names both hooks would read
// the same value (ROLLOUT.md section 5). So the share uses names usePrefill
// never reads, and #input= keeps working exactly as before.
//
// Arrival: the mode is set, its box fills as a paste would and its choices
// are set; the page computes (the name table loads in the page, as for a
// paste). Two boxes at once, a choice of another mode, a value the page does
// not offer, or a box longer than its field holds makes the whole share
// malformed: ignored.
// ============================================================================

import { DEFAULT_CLEAN, ESCAPE_STYLES, type CleanOptions, type EscapeStyle } from "./compute"; // the cleaning defaults and the escape languages
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: one mode and its box and choices. */
export type UnicodeShareState =
  | { mode: "inspect"; text: string; clean: CleanOptions; escape: EscapeStyle } // Inspect a text
  | { mode: "codepoint"; cp: string } // One code point
  | { mode: "search"; query: string } // Find by name
  | { mode: "normalise"; norm: string; compare: string }; // Normalise ("" when there is no second text)

/** The cleaning switches by link name. */
const CLEAN_NAMES: readonly [string, keyof CleanOptions][] = [["invisible", "removeInvisible"], ["spaces", "asciiSpaces"], ["punct", "asciiPunctuation"], ["fold", "foldLookalikes"]]; // name, option

/** The names each mode may carry. */
const MODE_NAMES: Readonly<Record<UnicodeShareState["mode"], readonly string[]>> = { inspect: ["text", "invisible", "spaces", "punct", "fold", "escape"], codepoint: ["cp"], search: ["query"], normalise: ["norm", "compare"] }; // per mode

/** The longest box each mode's field holds (the page's maxLength), where it is below the link's own bound. */
const MAX_CP = 200; // the code point field
/** The search field's length. */
const MAX_QUERY = 120; // the search field

/** The spec. */
export const UNICODE_INSPECTOR_SHARE: ShareSpec<UnicodeShareState> = Object.freeze({
  tool: "unicode-inspector", // the slug
  posture: "input", // the box as typed
  carriesKey: "share.carries", // tools.unicode-inspector.share.carries (it names the mode)
  names: ["text", "cp", "query", "norm", "compare", "invisible", "spaces", "punct", "fold", "escape"], // names usePrefill never reads
  /** The mode's box with the choices that differ from the defaults. */
  encode(s: UnicodeShareState): ShareEncoding {
    if (s.mode === "inspect") { // Inspect a text
      if (s.text === "") return { ok: false, reason: "empty" } as const; // nothing typed
      const params: Record<string, string> = { text: s.text }; // the text as typed
      for (const [name, key] of CLEAN_NAMES) if (s.clean[key] !== DEFAULT_CLEAN[key]) params[name] = s.clean[key] ? "1" : "0"; // a switch changed
      if (s.escape !== "json") params.escape = s.escape; // another language
      return { ok: true, params } as const; // the values
    } // inspect
    if (s.mode === "codepoint") return s.cp.trim() === "" ? ({ ok: false, reason: "empty" } as const) : ({ ok: true, params: { cp: s.cp } } as const); // the code point as typed
    if (s.mode === "search") return s.query.trim() === "" ? ({ ok: false, reason: "empty" } as const) : ({ ok: true, params: { query: s.query } } as const); // the words as typed
    if (s.norm === "") return { ok: false, reason: "empty" } as const; // Normalise: nothing typed
    return { ok: true, params: s.compare === "" ? { norm: s.norm } : { norm: s.norm, compare: s.compare } } as const; // the text, and the second one if any
  },
  /** Exactly one box, only its mode's choices, each one the page offers. */
  decode(v: Readonly<Record<string, string | null>>): UnicodeShareState | null {
    const boxes = (["text", "cp", "query", "norm"] as const).filter((n) => !!v[n]); // the boxes present (a link never carries an empty value)
    if (boxes.length !== 1) return null; // none, or two modes at once: malformed
    const mode = boxes[0] === "text" ? "inspect" : boxes[0] === "cp" ? "codepoint" : boxes[0] === "query" ? "search" : "normalise"; // the box names the mode
    if (Object.keys(v).some((n) => !!v[n] && !MODE_NAMES[mode].includes(n))) return null; // a choice of another mode: malformed
    if (mode === "inspect") { // Inspect a text
      const clean: CleanOptions = { ...DEFAULT_CLEAN }; // the defaults, then the switches the link carries
      for (const [name, key] of CLEAN_NAMES) { // each switch
        const x = v[name]; // its value, or null
        if (x === null || x === undefined) continue; // absent: the default
        if (x !== "1" && x !== "0") return null; // not a switch: malformed
        clean[key] = x === "1"; // on or off
      } // switches
      const escape = (v.escape ?? "json") as EscapeStyle; // absent: JSON
      if (!ESCAPE_STYLES.includes(escape)) return null; // not offered: malformed
      return { mode, text: v.text as string, clean, escape }; // the state
    } // inspect
    if (mode === "codepoint") return (v.cp as string).length > MAX_CP ? null : { mode, cp: v.cp as string }; // within the field
    if (mode === "search") return (v.query as string).length > MAX_QUERY ? null : { mode, query: v.query as string }; // within the field
    return { mode, norm: v.norm as string, compare: v.compare ?? "" }; // Normalise
  },
});
