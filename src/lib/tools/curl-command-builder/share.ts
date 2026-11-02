// ============================================================================
// src/lib/tools/curl-command-builder/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the curl command builder (posture "derived",
// raised on 2026-10-27 from the inventory's "input-caution"): the form has a
// password field and its command can carry credentials (the manifest says
// so: "-u user:pass"). A link carries the copy of the form that
// shareableBuilderState() in compute.ts makes (the password field, header
// credentials, cookie values, a proxy's or host's password, secret query,
// body and form values replaced by REDACTED), so the receiving page builds
// the same flags and warnings. The tool's own share vectors pin the copy.
//
// The builder is a form with nothing to paste (ROLLOUT section 11.3): the link
// carries named values only, no `input`. The names, a contract once shipped:
//   protocol (the scheme key; https is left out), host, port, path, method
//   (GET is left out; HEAD is how the page shows -I), httpversion (http1.1,
//   http2, http3), headers (one "name TAB value" line per row), data,
//   urlencode (1 when the body is sent with --data-urlencode), form (one
//   "name TAB value TAB 1 or 0" line per row, the last saying whether the
//   value is a file), user, pass, upload, output (remoteName or file),
//   outputfile, mailfrom, mailrcpt (the field's own comma-separated text),
//   cookie, cookiejar, useragent, proxy, resolve, cacert, conntimeout,
//   maxtime, retry, and the switches verbose, silent, include, follow,
//   insecure, compressed, listonly ("1" when on, left out when off).
// A row's fields come from one-line inputs, which hold no line break; a tab
// typed into one travels as a space (the only change a link makes, pinned by
// a case). Blank rows are not carried.
//
// Blocked (code "secret"): when the command built from the copy still holds a
// key or token no rule can name (a JWT in the path), the popover says so.
//
// Arrival: an unknown protocol, method, version or output, a switch other
// than 1 or 0, or a row with the wrong number of fields makes the whole share
// malformed: it is ignored. Otherwise the form is replaced whole (a field the
// link does not carry is emptied), and the page builds the command; nothing
// is run or sent.
// ============================================================================

import { PROTOCOL_MAP, shareableBuilderState, type BuilderState, type KV, type ShareableBuilderState } from "./compute"; // the engine and the derived form
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state the spec encodes: the form, and whether it builds a command. */
export interface CurlBuilderShareState {
  /** The form. */
  form: BuilderState;
  /** Whether buildCurl gives a command for it (the page already knows). */
  built: boolean;
}

/** The text fields, by link name and form field (each a one-line input or the body). */
const TEXT_FIELDS: readonly (readonly [string, keyof BuilderState])[] = Object.freeze([
  ["host", "host"], ["port", "port"], ["path", "path"], ["data", "data"], ["user", "user"], ["pass", "pass"], ["upload", "upload"], ["outputfile", "outputFile"], ["mailfrom", "mailFrom"], ["cookie", "cookie"], ["cookiejar", "cookieJar"], ["useragent", "userAgent"], ["proxy", "proxy"], ["resolve", "resolve"], ["cacert", "cacert"], ["conntimeout", "connectTimeout"], ["maxtime", "maxTime"], ["retry", "retry"],
] as const); // link name, field

/** The switches, by link name and form field. */
const SWITCHES: readonly (readonly [string, keyof BuilderState])[] = Object.freeze([
  ["verbose", "verbose"], ["silent", "silent"], ["include", "include"], ["follow", "followRedirects"], ["insecure", "insecure"], ["compressed", "compressed"], ["listonly", "listOnly"],
] as const); // link name, field

/** The methods the page's select offers (HEAD is the -I switch). */
const METHODS: ReadonlySet<string> = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]); // the select's options

/** The HTTP versions the page's select offers. */
const VERSIONS: ReadonlySet<string> = new Set(["http1.1", "http2", "http3"]); // "" is automatic

/** A field's text with tabs made spaces (a one-line field cannot hold a line break; a tab would split a row). */
const cell = (v: string): string => v.replace(/\t/g, " "); // the only change a link makes

/** Every link name, in a stable order. */
export const CURL_BUILDER_NAMES: readonly string[] = Object.freeze(["protocol", ...TEXT_FIELDS.map(([n]) => n), "method", "httpversion", "headers", "urlencode", "form", "output", "mailrcpt", ...SWITCHES.map(([n]) => n)]); // the contract

/**
 * Encode a form (the copy is made first, so no credential reaches the values).
 * @param s the state
 * @param copy shareableBuilderState's result for s.form, or null to make it here
 * @returns the named values of the copy, nothing, or blocked
 */
export function encodeCurlBuilder(s: CurlBuilderShareState, copy: ShareableBuilderState | null): ShareEncoding {
  if (!s.built) return { ok: false, reason: "empty" }; // no command yet (no host): the button is disabled
  const c = copy ?? shareableBuilderState(s.form); // the copy
  if (c.residual) return { ok: false, reason: "blocked", code: "secret", values: { line: c.residual.line, label: c.residual.label } }; // a secret no rule can name: no link
  const f = c.state; // the copy's fields
  const params: Record<string, string> = {}; // the values
  if (f.protocol !== "https") params.protocol = f.protocol; // the default left out
  for (const [name, key] of TEXT_FIELDS) { const v = f[key]; if (typeof v === "string" && v !== "") params[name] = key === "data" ? v : cell(v); } // each text field (the body may hold tabs and line breaks)
  if (f.headOnly) params.method = "HEAD"; // -I, as the select shows it
  else if (f.method && f.method !== "GET") params.method = f.method; // GET left out
  if (f.httpVersion) params.httpversion = f.httpVersion; // automatic left out
  const headers = (f.headers ?? []).filter((h) => h.name !== "" || h.value !== ""); // rows that hold something
  if (headers.length) params.headers = headers.map((h) => `${cell(h.name)}\t${cell(h.value)}`).join("\n"); // one row per line
  if (f.dataMode === "urlencode") params.urlencode = "1"; // --data-urlencode
  const form = (f.form ?? []).filter((x) => x.name !== "" || x.value !== ""); // rows that hold something
  if (form.length) params.form = form.map((x) => `${cell(x.name)}\t${cell(x.value)}\t${x.isFile ? "1" : "0"}`).join("\n"); // one row per line
  if (f.output && f.output !== "stdout") params.output = f.output; // stdout left out
  if (f.mailRcpt && f.mailRcpt.length) params.mailrcpt = f.mailRcpt.map(cell).join(", "); // the field's own text
  for (const [name, key] of SWITCHES) if (f[key] === true) params[name] = "1"; // on
  return { ok: true, params }; // the copy's values
} // encodeCurlBuilder

/** Rows of tab-separated cells, each with exactly `n` cells, or null. */
function rows(v: string, n: number): string[][] | null {
  const out = v.split("\n").map((l) => l.split("\t")); // lines, then cells
  return out.every((r) => r.length === n) ? out : null; // the right shape, or malformed
} // rows

/** The spec. */
export const CURL_BUILDER_SHARE: ShareSpec<CurlBuilderShareState, BuilderState> = Object.freeze({
  tool: "curl-command-builder", // the slug
  posture: "derived", // the copy of the form with every credential replaced
  carriesKey: "share.carries", // tools.curl-command-builder.share.carries
  names: CURL_BUILDER_NAMES, // named values only: a form (ROLLOUT 11.3)
  /** The copy's values, nothing, or blocked. */
  encode(s: CurlBuilderShareState): ShareEncoding {
    return encodeCurlBuilder(s, null); // made here
  },
  /** The form, strictly: an unknown choice, a bad switch or a misshapen row makes the share malformed. */
  decode(v: Readonly<Record<string, string | null>>): BuilderState | null {
    const protocol = v.protocol ?? "https"; // the default
    if (!PROTOCOL_MAP.has(protocol)) return null; // an unknown protocol
    const out: BuilderState = { protocol }; // the form, built up
    for (const [name, key] of TEXT_FIELDS) if (v[name] !== null && v[name] !== undefined) (out as unknown as Record<string, string>)[key] = v[name] as string; // the text fields
    if (v.method !== null && v.method !== undefined) { // a method
      if (!METHODS.has(v.method) || v.method === "GET") return null; // unknown, or the default written out
      if (v.method === "HEAD") out.headOnly = true; // -I
      else out.method = v.method as BuilderState["method"]; // the select's value
    } // method
    if (v.httpversion !== null && v.httpversion !== undefined) { if (!VERSIONS.has(v.httpversion)) return null; out.httpVersion = v.httpversion as BuilderState["httpVersion"]; } // a version
    if (v.headers !== null && v.headers !== undefined) { const r = rows(v.headers, 2); if (!r) return null; out.headers = r.map(([name, value]) => ({ name, value })); } // header rows
    if (v.urlencode !== null && v.urlencode !== undefined) { if (v.urlencode !== "1") return null; out.dataMode = "urlencode"; } // --data-urlencode
    if (v.form !== null && v.form !== undefined) { // form rows
      const r = rows(v.form, 3); // name, value, file
      if (!r || r.some((x) => x[2] !== "1" && x[2] !== "0")) return null; // misshapen
      out.form = r.map(([name, value, file]): KV => (file === "1" ? { name, value, isFile: true } : { name, value })); // the rows
    } // form
    if (v.output !== null && v.output !== undefined) { if (v.output !== "remoteName" && v.output !== "file") return null; out.output = v.output; } // an output choice
    if (v.mailrcpt !== null && v.mailrcpt !== undefined) out.mailRcpt = v.mailrcpt.split(",").map((x) => x.trim()).filter(Boolean); // as the field splits it
    for (const [name, key] of SWITCHES) { const x = v[name]; if (x === null || x === undefined) continue; if (x !== "1" && x !== "0") return null; if (x === "1") (out as unknown as Record<string, boolean>)[key] = true; } // the switches
    return out; // the form
  },
});
