// ============================================================================
// src/lib/tools/expect-script-builder/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the Expect script builder (posture
// "input-caution", the inventory's; the manifest's shareSafetyDefault is
// "caution"). A form (ROLLOUT 11.3): the link carries named values only, never
// the script (the page writes it again from the form, byte for byte, since
// the engine is pure). Every choice is always written (a form carries every
// field, so an old link keeps its meaning if a default changes); a text field
// is written when the form shows it for the choices made (the port only for
// ssh, the key file only for a key, the program only for another program ...),
// since the builder reads no hidden field and a hidden one could still hold
// text the reader no longer sees.
//
// The builder never takes a password: it reads one from an environment
// variable (only the variable's name is a field) or asks for it at run time,
// and its scripts write no secret (its engine's "SAFE BY CONSTRUCTION"). The
// form still names a host, a user and the commands, hence the caution line,
// and a reader can type a secret into a text field (a command that sets a
// password, a program line such as sshpass -p ...). So the shared secrets
// check (src/lib/share/text-secrets.ts, the site's base check reused as is)
// reads every text field the link would carry: a credential a standard
// defines blocks the link and the popover names the field; a value whose name
// only looks like a secret ("username admin secret ...", "set password ...")
// is named in the caution line instead.
//
// Arrival: the form is set as the reader would set it, the fields the link
// does not carry at their defaults, and the page builds the script. Every
// choice must be one the page offers, every switch 1 or 0, every timeout a
// whole number from 1 to the page's limit, and no hidden field may be present;
// anything else makes the whole share malformed. Free text the builder
// refuses shows its errors, as when typed.
// ============================================================================

import { build, DEFAULT_INPUT, LIMITS, PROFILE_CHOICES, type BuilderInput } from "./compute"; // the engine, its input, defaults and limits
import { blockedBySecret, findShareSecretsIn, type ShareSecretFinding } from "../../share/text-secrets"; // the shared secrets check
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The authentication methods each transport allows (the page's select lists them in this order). */
export const BUILDER_AUTH_BY_TRANSPORT: Readonly<Record<BuilderInput["transport"], readonly BuilderInput["auth"][]>> = Object.freeze({
  ssh: ["key", "env", "ask"], // a key, or a password
  telnet: ["env", "ask"], // a password only
  program: ["none", "env", "ask"], // a program may ask for nothing
});

/** One field of the form in the link: its name, its key in the engine's input, its kind, and when the form shows it. */
interface FieldSpec {
  /** The name in the link (ROLLOUT section 1, rule 3). */
  name: string;
  /** The engine's field. */
  key: keyof BuilderInput;
  /** text (a free field), choice (an id from a list), flag (1 or 0) or seconds (a whole number). */
  kind: "text" | "choice" | "flag" | "seconds";
  /** Whether the form shows it for these choices (choices and switches are always written). */
  shown: (s: Pick<BuilderInput, "transport" | "auth" | "profile" | "enable" | "output">) => boolean;
}

/** Always written. */
const ALWAYS = (): boolean => true; // every choice and switch

/** The form's fields, in the page's order. */
export const BUILDER_FIELDS: readonly FieldSpec[] = Object.freeze([
  { name: "transport", key: "transport", kind: "choice", shown: ALWAYS }, // ssh, telnet or program
  { name: "host", key: "host", kind: "text", shown: (s) => s.transport !== "program" }, // ssh and telnet
  { name: "port", key: "port", kind: "text", shown: (s) => s.transport === "ssh" }, // ssh only
  { name: "program", key: "program", kind: "text", shown: (s) => s.transport === "program" }, // another program only
  { name: "user", key: "user", kind: "text", shown: ALWAYS }, // the user
  { name: "hostargv", key: "hostFromArgv", kind: "flag", shown: ALWAYS }, // take the host from argv
  { name: "auth", key: "auth", kind: "choice", shown: ALWAYS }, // how to log in
  { name: "keyfile", key: "keyFile", kind: "text", shown: (s) => s.auth === "key" }, // a key's path
  { name: "passwordvar", key: "passwordVar", kind: "text", shown: (s) => s.auth === "env" }, // the variable's name
  { name: "profile", key: "profile", kind: "choice", shown: ALWAYS }, // the device
  { name: "prompt", key: "genericPrompt", kind: "text", shown: (s) => s.profile === "generic" }, // the generic prompt
  { name: "pagingcmd", key: "genericPagingCommand", kind: "text", shown: (s) => s.profile === "generic" }, // the generic paging command
  { name: "enable", key: "enable", kind: "choice", shown: ALWAYS }, // enable
  { name: "enablevar", key: "enableVar", kind: "text", shown: (s) => s.enable === "env" }, // the enable variable's name
  { name: "paging", key: "paging", kind: "choice", shown: ALWAYS }, // paging
  { name: "restore", key: "restorePaging", kind: "flag", shown: ALWAYS }, // put paging back
  { name: "commands", key: "commands", kind: "text", shown: ALWAYS }, // the commands
  { name: "logintimeout", key: "loginTimeout", kind: "seconds", shown: ALWAYS }, // seconds per login step
  { name: "cmdtimeout", key: "commandTimeout", kind: "seconds", shown: ALWAYS }, // seconds per command
  { name: "output", key: "output", kind: "choice", shown: ALWAYS }, // where the output goes
  { name: "logfile", key: "logFile", kind: "text", shown: (s) => s.output !== "screen" }, // the transcript file
  { name: "logout", key: "logout", kind: "text", shown: ALWAYS }, // the logout command
] as FieldSpec[]);

/** The ids each choice may take. */
const CHOICES: Readonly<Record<string, readonly string[]>> = Object.freeze({
  transport: ["ssh", "telnet", "program"], // the three ways in
  auth: ["key", "env", "ask", "none"], // checked against the transport too
  profile: PROFILE_CHOICES as readonly string[], // the device profiles and generic
  enable: ["no", "plain", "env", "ask"], // enable modes
  paging: ["off", "answer", "none"], // paging modes
  output: ["screen", "file", "both"], // output modes
});

/** What the check found, each finding tagged with its field's link name. */
export interface BuilderSecrets {
  /** Credentials. */
  secrets: (ShareSecretFinding & { field: string })[];
  /** Secret-looking names. */
  maybe: (ShareSecretFinding & { field: string })[];
}

/**
 * The text fields a link would carry for a form, with their values.
 * @param s the form
 * @returns each shown text field's link name and value
 */
function carriedTexts(s: BuilderInput): [string, string][] {
  return BUILDER_FIELDS.filter((f) => f.kind === "text" && f.shown(s)).map((f) => [f.name, String(s[f.key])] as [string, string]); // in the page's order
} // carriedTexts

/**
 * The shared check over every text field a link would carry.
 * @param s the form
 * @returns the findings, field by field
 */
export function checkBuilderText(s: BuilderInput): BuilderSecrets {
  const r = findShareSecretsIn(carriedTexts(s)); // field by field
  return { secrets: r.secrets, maybe: r.maybe }; // tagged by link name
} // checkBuilderText

/**
 * Encode from what the page already computed.
 * @param s the form
 * @param built whether the page built a script (false while the form has errors)
 * @param found the check's findings
 * @returns the form's values, nothing, or blocked
 */
export function encodeBuilderShare(s: BuilderInput, built: boolean, found: BuilderSecrets): ShareEncoding {
  if (!built) return { ok: false, reason: "empty" }; // no script: nothing to share
  const blocked = blockedBySecret(found.secrets); // a credential in a text field
  if (blocked) return blocked; // no link
  const params: Record<string, string> = {}; // the values
  for (const f of BUILDER_FIELDS) { // each field
    if (!f.shown(s)) continue; // hidden: not carried
    const v = s[f.key]; // its value
    params[f.name] = f.kind === "flag" ? (v ? "1" : "0") : String(v); // a switch as 1 or 0; the rest as text (a blank text field carries nothing)
  } // for
  return { ok: true, params }; // the form
} // encodeBuilderShare

/** What an arrival restores: every field the link carried, laid over the defaults by the page. */
export type BuilderShareArrival = Partial<BuilderInput>;

/** The spec. */
export const BUILDER_SHARE: ShareSpec<BuilderInput, BuilderShareArrival> = Object.freeze({
  tool: "expect-script-builder", // the slug
  posture: "input-caution", // the form, with a caution line, after the secrets check
  carriesKey: "share.carries", // tools.expect-script-builder.share.carries
  names: BUILDER_FIELDS.map((f) => f.name), // a form: no input (11.3)
  /** The form's values, nothing, or blocked (the spec builds the script itself; the page passes the build it made). */
  encode(s: BuilderInput): ShareEncoding {
    return encodeBuilderShare(s, build(s).ok, checkBuilderText(s)); // built, checked, encoded
  },
  /** Every choice known and consistent, every switch 1 or 0, every timeout in range, and no hidden field. */
  decode(v: Readonly<Record<string, string | null>>): BuilderShareArrival | null {
    const out: Record<string, string | number | boolean> = {}; // the restored fields
    for (const f of BUILDER_FIELDS) { // the choices, switches and timeouts first: they decide what is shown
      if (f.kind === "text") continue; // later
      const x = v[f.name]; // the value
      if (x === null) return null; // a choice, switch or timeout is always written
      if (f.kind === "choice" && !CHOICES[f.name].includes(x)) return null; // an unknown id
      if (f.kind === "flag" && x !== "1" && x !== "0") return null; // not a switch
      if (f.kind === "seconds" && (!/^\d{1,4}$/.test(x) || Number(x) < 1 || Number(x) > LIMITS.maxTimeout)) return null; // not a timeout the page takes
      out[f.key] = f.kind === "flag" ? x === "1" : f.kind === "seconds" ? Number(x) : x; // typed
    } // for
    const s = out as Pick<BuilderInput, "transport" | "auth" | "profile" | "enable" | "output">; // the choices
    if (!BUILDER_AUTH_BY_TRANSPORT[s.transport].includes(s.auth)) return null; // a login the transport does not allow
    for (const f of BUILDER_FIELDS) { // the text fields
      if (f.kind !== "text") continue; // done above
      const x = v[f.name]; // the value
      if (!f.shown(s)) { if (x !== null) return null; continue; } // a hidden field is never written
      out[f.key] = x ?? ""; // absent: the sender left it blank
    } // for
    if (String(out.commands ?? "").trim() === "") return null; // a script needs commands
    return out as BuilderShareArrival; // the fields
  },
});

/** The form an arrival leaves: the defaults with the reader's own fields blank, then the link's fields over them. */
export const BUILDER_ARRIVAL_BASE: Readonly<BuilderInput> = Object.freeze({ ...DEFAULT_INPUT, host: "", user: "", program: "", keyFile: "", commands: "", port: "" }); // the page's Clear, port included
