// ============================================================================
// src/lib/tools/dig-command-builder/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the dig command builder (posture
// "input-caution"): a link carries the form as filled in, one named value per
// field that is set, after the "#": the name to look up as the primary value
// (#input=example.com), then the others by short names
// (&type=MX&server=192.0.2.53&dnssec=1&multiline=1). A switch goes as "1"
// only when it is on; a choice goes by its stable id (transport=tls). The
// manifest: "a built command may name an internal server or a key file path:
// share with care" (shareSafetyDefault "caution"), so the popover adds the
// tool's own caution line. The form holds no secret: dig's -k takes a key
// file's path, and the builder offers no option that takes a key itself.
//
// Arrival (useShareArrival in DigCommandBuilderTool): the link's form replaces
// the page's whole form (the page opens on the Example; a field the link does
// not carry is cleared, so the command is exactly the sender's), and the page
// assembles the command. Nothing is executed or sent, as always (D-49). A
// choice the form does not offer, a switch other than 1 or 0, or a value
// longer than its field allows makes the whole share malformed: ignored. Other
// text is left to the engine, which refuses it with its own finding.
// ============================================================================

import { COMMON_TYPES, CLASSES, type DigInput, type Ipv, type OutputMode, type Transport } from "./compute"; // the form's shape and choices
import type { ShareSpec } from "../../share/spec"; // the spec shape

/** The text fields: the form's key, its name in a link, and the field's maxLength on the page. */
const TEXT_FIELDS: readonly { key: keyof DigInput; name: string; max: number }[] = [
  { key: "name", name: "input", max: 300 }, // the owner name: the primary value
  { key: "type", name: "type", max: 16 }, // the record type (a common one, or typed by hand)
  { key: "ixfrSerial", name: "ixfrserial", max: 10 }, // the IXFR serial
  { key: "reverse", name: "reverse", max: 300 }, // -x address
  { key: "server", name: "server", max: 300 }, // @server
  { key: "port", name: "port", max: 5 }, // -p
  { key: "source", name: "source", max: 300 }, // -b
  { key: "httpsEndpoint", name: "endpoint", max: 300 }, // +https=/path
  { key: "bufsize", name: "bufsize", max: 5 }, // +bufsize
  { key: "subnet", name: "subnet", max: 300 }, // +subnet
  { key: "timeout", name: "timeout", max: 5 }, // +timeout
  { key: "tries", name: "tries", max: 4 }, // +tries
  { key: "retry", name: "retry", max: 4 }, // +retry
  { key: "keyfile", name: "keyfile", max: 300 }, // -k path
];

/** The switches, carried as "1" when on (the form's key and the link's name are the same word). */
const SWITCHES: readonly (keyof DigInput)[] = ["trace", "nssearch", "norecurse", "dnssec", "cd", "noedns", "nocookie", "nsid", "ignore", "identify", "multiline", "ttlunits", "qr", "norc"]; // in the form's order

/** The choices: the form's key, the link's name, and the values the form offers. */
const CHOICES: readonly { key: keyof DigInput; name: string; values: readonly string[] }[] = [
  { key: "klass", name: "class", values: CLASSES }, // IN, CH, HS
  { key: "transport", name: "transport", values: ["udp", "tcp", "tls", "https"] satisfies Transport[] }, // the four transports
  { key: "ipv", name: "ipv", values: ["4", "6"] satisfies Ipv[] }, // -4 or -6 ("" is no choice and is not carried)
  { key: "output", name: "output", values: ["full", "short", "answer", "yaml"] satisfies OutputMode[] }, // what to print
];

/**
 * Whether a record type is one the type select lists (otherwise the page shows the "another type" field).
 * @param type the form's type text
 * @returns true for an empty type or a listed one
 */
export function isCommonDigType(type: string | undefined): boolean {
  const t = (type ?? "").toUpperCase(); // the select compares in upper case
  return t === "" || COMMON_TYPES.includes(t); // listed, or none
} // isCommonDigType

/** The spec. */
export const DIG_COMMAND_BUILDER_SHARE: ShareSpec<DigInput> = Object.freeze({
  tool: "dig-command-builder", // the slug
  posture: "input-caution", // the form as filled in, with the standard warning and a caution line
  carriesKey: "share.carries", // tools.dig-command-builder.share.carries
  names: [...TEXT_FIELDS.map((f) => f.name), ...CHOICES.map((c) => c.name), ...SWITCHES.map((s) => String(s))], // "input" first
  /** Every field that is set, as typed; nothing for an empty form. */
  encode(state: DigInput) {
    const params: Record<string, string> = {}; // the values
    for (const f of TEXT_FIELDS) { const v = state[f.key]; if (typeof v === "string" && v !== "") params[f.name] = v; } // text as typed
    for (const c of CHOICES) { const v = state[c.key]; if (typeof v === "string" && v !== "") params[c.name] = v; } // a choice by its id
    for (const s of SWITCHES) if (state[s] === true) params[String(s)] = "1"; // a switch that is on
    if (Object.keys(params).length === 0) return { ok: false, reason: "empty" } as const; // nothing to share: the button is disabled
    return { ok: true, params } as const; // the values
  },
  /** The form back, validated against the choices, the switches and the fields' lengths. */
  decode(values: Readonly<Record<string, string | null>>) {
    const out: Record<string, string | boolean> = {}; // the restored form
    for (const f of TEXT_FIELDS) { // each text field
      const v = values[f.name]; // its value, if carried
      if (v === null || v === undefined) continue; // not carried: empty
      if (v.length > f.max) return null; // longer than the field allows: malformed
      out[f.key] = v; // as typed
    } // text
    for (const c of CHOICES) { // each choice
      const v = values[c.name]; // its value, if carried
      if (v === null || v === undefined) continue; // not carried: the default
      if (!c.values.includes(v)) return null; // not offered: malformed
      out[c.key] = v; // the choice
    } // choices
    for (const s of SWITCHES) { // each switch
      const v = values[String(s)]; // its value, if carried
      if (v === null || v === undefined || v === "0") continue; // off
      if (v !== "1") return null; // a switch is 1 or 0
      out[s] = true; // on
    } // switches
    if (Object.keys(out).length === 0) return null; // nothing to fill
    return out as DigInput; // the form (choices validated above against the engine's own types)
  },
});
