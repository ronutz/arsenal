// ============================================================================
// src/lib/tools/cgn-port-blocks/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the CGN port-block and MAP port-set calculator
// (posture "input"): a link carries the open tab and the fields typed in it,
// each as a named value after the "#", for example
//   #mode=deterministic&inside=198.51.100.0%2F28&outside=192.0.2.1&dynamic=2
// and, on the port-blocks tab, the log message size when it is not the
// default. The manifest: "pools, prefixes and port numbers are not secrets"
// (shareSafetyDefault "param").
//
// No "input" value: the tool is a form with no text to paste, so every value
// is named (ROLLOUT.md section 1: "A name ... as the reader knows it"; the
// format allows a share of named values only). The names are the engine's
// field names in lowercase, shortened to the 12 characters SHARE_NAME_RE
// allows where needed (blockspersub, compression, dynamic); they are a
// contract once shipped. A field the form adds later needs a name here.
//
// Arrival (useShareArrival in CgnPortBlocksTool): the tab opens, its fields
// are replaced by the link's (a field the link does not carry is cleared, so
// the form is exactly the sender's), the other tabs keep their values, and the
// page computes. A mode or log format the tool does not offer, or a field of
// another tab, makes the whole share malformed: ignored. Field text is left to
// the engine, which refuses a malformed value with its own message, as typing.
// ============================================================================

import type { ShareSpec } from "../../share/spec"; // the spec shape

/** The three tabs, named as the engine names them. */
export type CgnShareMode = "blocks" | "deterministic" | "map";

/** Per tab: each form field (the engine's name) and its name in a link. */
export const CGN_SHARE_FIELDS: Readonly<Record<CgnShareMode, Readonly<Record<string, string>>>> = Object.freeze({
  blocks: Object.freeze({ pool: "pool", portRange: "portrange", blockSize: "blocksize", blocksPerSubscriber: "blockspersub", subscribers: "subscribers", inside: "inside" }), // port blocks
  deterministic: Object.freeze({ inside: "inside", outside: "outside", reserved: "reserved", compressionRatio: "compression", dynamicFactor: "dynamic", maxPorts: "maxports", lookup: "lookup", revAddress: "revaddress", revPort: "revport", revTime: "revtime", configFrom: "configfrom", configUntil: "configuntil", recordTime: "recordtime" }), // RFC 7422
  map: Object.freeze({ offset: "offset", psidLength: "psidlength", psid: "psid", port: "port" }), // RFC 7597 port sets
});

/** The tabs a link may name. */
const MODES: readonly CgnShareMode[] = ["blocks", "deterministic", "map"]; // left to right, as the page shows them

/** The log message sizes the port-blocks tab offers; the first is the default. */
const LOG_FORMATS: readonly string[] = ["nat444", "ds-lite"]; // RFC 7422's 150 and 175 bytes

/** Every field name a link may carry, each once (inside is on two tabs). */
const FIELD_NAMES: readonly string[] = [...new Set(MODES.flatMap((m) => Object.values(CGN_SHARE_FIELDS[m])))]; // deduplicated

/** The state: the open tab, its fields as typed, and the log format (port-blocks tab only). */
export interface CgnShareState {
  /** The open tab. */
  mode: CgnShareMode;
  /** Its fields by the engine's name, as typed (blank fields are not carried). */
  fields: Readonly<Record<string, string>>;
  /** The port-blocks tab's log message size; absent on the other tabs, which do not use it. */
  logFormat?: string;
}

/** The spec. */
export const CGN_PORT_BLOCKS_SHARE: ShareSpec<CgnShareState> = Object.freeze({
  tool: "cgn-port-blocks", // the slug
  posture: "input", // the fields as typed, with the standard warning
  carriesKey: "share.carries", // tools.cgn-port-blocks.share.carries
  names: ["mode", "logformat", ...FIELD_NAMES], // no "input": a form with nothing to paste
  /** The tab, its non-blank fields and (port blocks) a non-default log format; nothing while the tab's form is empty. */
  encode(state: CgnShareState) {
    const params: Record<string, string> = { mode: state.mode }; // the tab, always named
    for (const [field, name] of Object.entries(CGN_SHARE_FIELDS[state.mode])) { // each field of the tab, in form order
      const v = state.fields[field] ?? ""; // its text
      if (v.trim() !== "") params[name] = v; // carried as typed
    } // fields
    if (Object.keys(params).length === 1) return { ok: false, reason: "empty" } as const; // the tab alone: nothing to share
    if (state.mode === "blocks" && state.logFormat !== undefined && state.logFormat !== LOG_FORMATS[0]) params.logformat = state.logFormat; // only when not the default
    return { ok: true, params } as const; // the values
  },
  /** A known tab, only its own fields, a known log format; anything else is ignored whole. */
  decode(values: Readonly<Record<string, string | null>>) {
    const mode = (values.mode ?? "blocks") as CgnShareMode; // absent: the first tab
    if (!MODES.includes(mode)) return null; // not a tab the tool has
    const own = CGN_SHARE_FIELDS[mode]; // this tab's fields
    const ownNames = new Set(Object.values(own)); // their link names
    for (const name of FIELD_NAMES) if (values[name] !== null && values[name] !== undefined && !ownNames.has(name)) return null; // a field of another tab: malformed
    const fields: Record<string, string> = {}; // the restored fields
    for (const [field, name] of Object.entries(own)) { // each field of the tab
      const v = values[name]; // its value, if carried
      if (v !== null && v !== undefined && v.trim() !== "") fields[field] = v; // as typed
    } // fields
    if (Object.keys(fields).length === 0) return null; // nothing to fill
    const lf = values.logformat; // the log format, if carried
    if (lf !== null && lf !== undefined && (mode !== "blocks" || !LOG_FORMATS.includes(lf))) return null; // unknown, or on a tab that has none
    return mode === "blocks" ? { mode, fields, logFormat: lf ?? LOG_FORMATS[0] } : { mode, fields }; // the state to fill
  },
});
