// ============================================================================
// src/lib/tools/pyproject-toml-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the pyproject.toml explainer (posture "derived",
// raised from "input-caution" on 2026-11-01). The manifest: "a project file
// can name private indexes, internal URLs and people". A private index's URL
// often holds its credentials: pip reads "https://username:password@host/
// simple", and a single-part token "as the "username"" with no password (its
// "Authentication" page); uv embeds them in a [[tool.uv.index]] url the same
// way (its "Package indexes" page); a direct reference "name @ https://..."
// (PEP 508) can carry them too. All read 2026-11-01.
//
// So the link carries a COPY of the file (input), with every credential of an
// http or https URL replaced by bullets (./url-credentials.ts: a password
// after the user name, or a lone user name that may be a token). The page
// never needs them: its findings read the scheme, the host, the path and the
// hash of a URL, never its userinfo. The copy must read the same as the file
// (the same findings by code, severity, path and line), or no link is offered
// (blocked "copy"). Then the shared secrets check (src/lib/share/
// text-secrets.ts, the site's base check reused as is) reads the copy: any
// other credential a standard defines (a PEM private key, an Authorization
// line, a JWT, an AWS access key ID ...) blocks the link with its line, and a
// key whose name only looks like a secret is named in the caution line.
//
// A TOML basic string may spell a character as \uXXXX; written in a URL, such
// an escape could hide the "@" from any text search, so a line that holds both
// "://" and a \u or \U escape gets no link (blocked "escaped", with its line).
// No reveal switch: what the copy replaces is a credential by the pip and uv
// documents, never something to send on purpose.
//
// Arrival: the copy fills the box as a paste would, and the page explains it
// locally (no URL is fetched, no back-end imported). Any non-blank text is
// accepted, as a paste is.
// ============================================================================

import { explainPyproject, type PyprojectResult } from "./compute"; // the page's own engine
import { redactUrlCredentials } from "./url-credentials"; // credentials in an index URL
import { blockedBySecret, findShareSecrets, lineAt, normaliseLines, type ShareSecretReport } from "../../share/text-secrets"; // the shared secrets check
import { MAX_SHARE_CHARS } from "../../share/format"; // the link bound
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (the file as pasted when encoding; the copy, as the link carries it, on arrival). */
export interface PyprojectShareState {
  /** The file. */
  input: string;
}

/** Everything a share needs, computed once from the file (the page memoises it). */
export interface PyprojectSharePrep {
  /** The copy a link carries (the file itself when nothing needed replacing). */
  copy: string;
  /** How many URL credentials were replaced. */
  replaced: number;
  /** The line of a URL written with a \u escape, or 0. */
  escapedLine: number;
  /** Whether the copy reads as the file did. */
  sameReading: boolean;
  /** The shared check's report on the copy. */
  report: ShareSecretReport;
}

/** A \u or \U escape (TOML basic strings: four or eight hexadecimal digits). */
const UNICODE_ESCAPE = /\\[uU]/; // anywhere on the line

/**
 * The first line that holds a URL and a \u or \U escape, or 0.
 * @param norm the file with line feeds only
 * @returns its 1-based line, or 0
 */
function escapedUrlLine(norm: string): number {
  let offset = 0; // where the current line starts
  for (const line of norm.split("\n")) { // each line
    if (line.includes("://") && UNICODE_ESCAPE.test(line)) return lineAt(norm, offset); // found
    offset += line.length + 1; // past the line and its line feed
  } // for
  return 0; // none
} // escapedUrlLine

/**
 * A reading's findings as the reader meets them: code, severity, path and line.
 * @param r the reading
 * @returns a comparable text
 */
function findingKey(r: PyprojectResult): string {
  return JSON.stringify([r.status, r.findings.map((f) => [f.code, f.severity, f.path, f.line])]); // compact
} // findingKey

/**
 * Prepare a share of a file: the copy, its count, the escape test, the reading test and the check on the copy.
 * @param input the file as pasted
 * @returns the preparation (nothing is read when the file is blank or over the link bound)
 */
export function preparePyprojectShare(input: string): PyprojectSharePrep {
  const none: ShareSecretReport = { secrets: [], maybe: [], skipped: true }; // nothing read
  if (input.trim() === "" || input.length > MAX_SHARE_CHARS) return { copy: input, replaced: 0, escapedLine: 0, sameReading: true, report: none }; // no link could carry it anyway
  const escapedLine = escapedUrlLine(normaliseLines(input)); // a URL written with an escape
  const { copy, replaced } = redactUrlCredentials(input); // the credentials replaced
  const sameReading = replaced === 0 || findingKey(explainPyproject(copy)) === findingKey(explainPyproject(input)); // the copy reads the same
  return { copy, replaced, escapedLine, sameReading, report: findShareSecrets(copy) }; // the check reads the copy
} // preparePyprojectShare

/**
 * Encode from a preparation the page already made.
 * @param s the state (the file as pasted)
 * @param p its preparation
 * @returns the copy, nothing, or blocked
 */
export function encodePyprojectShare(s: PyprojectShareState, p: PyprojectSharePrep): ShareEncoding {
  if (s.input.trim() === "") return { ok: false, reason: "empty" }; // nothing pasted: the button is disabled
  if (p.escapedLine > 0) return { ok: false, reason: "blocked", code: "escaped", values: { line: p.escapedLine } }; // a URL written with an escape
  if (!p.sameReading) return { ok: false, reason: "blocked", code: "copy" }; // the copy would read differently
  return blockedBySecret(p.report.secrets) ?? { ok: true, params: { input: p.copy } }; // another credential, or the copy (over the bound, the button says so)
} // encodePyprojectShare

/** The spec. */
export const PYPROJECT_SHARE: ShareSpec<PyprojectShareState> = Object.freeze({
  tool: "pyproject-toml-explainer", // the slug
  posture: "derived", // a copy with URL credentials replaced
  carriesKey: "share.carries", // tools.pyproject-toml-explainer.share.carries
  names: ["input"], // #input=
  /** The copy, nothing, or blocked (the spec prepares it itself). */
  encode(s: PyprojectShareState): ShareEncoding {
    return encodePyprojectShare(s, preparePyprojectShare(s.input)); // prepared, encoded
  },
  /** Any non-blank text: the page explains it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): PyprojectShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the text, or nothing
  },
});
