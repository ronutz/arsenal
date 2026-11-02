// ============================================================================
// src/lib/tools/f5xc-tls-security-level-mapper/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the F5 XC TLS security-level mapper (posture
// "input", as the inventory gives it: the manifest's "param"). The page has
// two outputs at once: a level's versions and ciphers (picked with a
// button), and the levels that include each cipher of a pasted suite or
// scanner line. Each has its own button (ROLLOUT 7.3: two modes with
// different outputs), and each link carries only its own value
// (2026-11-01, wave 4B). A level or a cipher suite names no system or person.
//
// Names: `level` (High, Medium, Low) from the level's button; `input` (the
// cipher line as typed) from the cipher's button. An arrival sets whichever
// it carries (a link written by hand may carry both); an unknown level, or
// neither name, makes it malformed.
//
// Arrival: the level is picked and the cipher line fills, as if clicked and
// typed; both readings follow.
// ============================================================================

import { reverseLookup, type Level } from "./compute"; // the page's own reverse lookup
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The levels, by their stable ids (as the page offers them). */
export const TLS_LEVELS: readonly Level[] = Object.freeze(["High", "Medium", "Low"]); // the buttons

/** The state one button shares, or an arrival restores: a level, a cipher line, or both. */
export interface TlsMapperShareState {
  /** The level picked, when the link carries one. */
  level?: Level;
  /** The cipher line as typed, when the link carries one. */
  input?: string;
}

/** The spec. */
export const TLS_MAPPER_SHARE: ShareSpec<TlsMapperShareState> = Object.freeze({
  tool: "f5xc-tls-security-level-mapper", // the slug
  posture: "input", // a level or a cipher line
  carriesKey: "share.carries", // tools.f5xc-tls-security-level-mapper.share.carries
  names: ["input", "level"], // "input" first
  /** The value the button sits under: a picked level, or a cipher line the page recognised at least one cipher in. */
  encode(s: TlsMapperShareState): ShareEncoding {
    const params: Record<string, string> = {}; // what goes
    if (s.level !== undefined) params.level = s.level; // the level's button
    if (s.input !== undefined && s.input.trim() !== "") { const r = reverseLookup(s.input); if (r.ok && r.matches.length > 0) params.input = s.input; } // the cipher's button, once something matched
    return Object.keys(params).length > 0 ? { ok: true, params } : { ok: false, reason: "empty" }; // the values, or nothing
  },
  /** A known level, a non-blank cipher line, or both. */
  decode(v: Readonly<Record<string, string | null>>): TlsMapperShareState | null {
    const out: TlsMapperShareState = {}; // the state
    if (v.level !== null && v.level !== undefined) { if (!(TLS_LEVELS as readonly string[]).includes(v.level)) return null; out.level = v.level as Level; } // a known level
    if (v.input !== null && v.input !== undefined) { if (v.input.trim() === "") return null; out.input = v.input; } // a cipher line
    return out.level !== undefined || out.input !== undefined ? out : null; // at least one
  },
});
