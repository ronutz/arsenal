// ============================================================================
// src/lib/tools/wheel-filename-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the wheel filename & PEP 440 version explainer
// (posture "input": file names and versions name nothing of the reader's).
// Two modes, two kinds of link:
//   File name  input (the box as typed) and, when the target check is open,
//              the target as its six choices: impl (cpython or pypy), python
//              ("3.13"), ft (1 for a free-threaded build, else 0), os, osver
//              ("2.39"; absent for Windows) and arch;
//   Versions   mode=versions, versions (the list as typed) and spec (the
//              specifier set, when there is one).
// The box also takes a URL to a wheel, and a private index's URL can hold a
// credential before the "@": a password, or a single-part token in the user
// name's place (pip's "Authentication" page, read 2026-11-01; see
// ../pyproject-toml-explainer/url-credentials.ts). The reading needs only the
// file name at the end of the path, so such a URL gets no link (blocked
// "credentials", the popover says so) and the reader pastes the file name.
//
// Arrival: the mode is chosen and its fields fill as typed; a target opens the
// target check with those choices. Every choice must be one the page offers
// (the lists below are the page's own); anything else makes the whole share
// malformed. The fields of the other mode keep what the opener had.
// ============================================================================

import { explainFilename, explainVersions, MAX_INPUT_CHARS } from "./compute"; // the page's own engine
import type { Target } from "./tags"; // the target shape
import { findUrlCredentials } from "../pyproject-toml-explainer/url-credentials"; // credentials in an index URL
import { normaliseLines } from "../../share/text-secrets"; // line ends as the check counts them
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The Python minor versions the target offers: the supported branches (3.11 to 3.15), as the page lists them. */
export const TARGET_MINORS: readonly number[] = Object.freeze([11, 12, 13, 14, 15]); // see the page's comment for the dates
/** The glibc versions offered for a Linux target (2.17, the manylinux2014 baseline, to 2.41). */
export const TARGET_GLIBC: readonly number[] = Object.freeze([17, 23, 26, 27, 28, 31, 34, 35, 36, 39, 41]); // glibc 2.x minors
/** The macOS versions offered. */
export const TARGET_MACOS: readonly (readonly [number, number])[] = Object.freeze([[10, 9], [10, 13], [10, 15], [11, 0], [12, 0], [13, 0], [14, 0], [15, 0], [26, 0]] as const); // 10.9 to 26
/** The musl versions offered. */
export const TARGET_MUSL: readonly (readonly [number, number])[] = Object.freeze([[1, 1], [1, 2]] as const); // musl 1.1 and 1.2

/**
 * The OS versions the target offers for an operating system.
 * @param os the operating system
 * @returns the versions, as [major, minor] pairs ([0, 0] alone for Windows, which has none)
 */
export function targetOsVersions(os: Target["os"]): Array<[number, number]> {
  if (os === "linux-glibc") return TARGET_GLIBC.map((m) => [2, m] as [number, number]); // glibc 2.x
  if (os === "linux-musl") return TARGET_MUSL.map((v) => [v[0], v[1]] as [number, number]); // musl
  if (os === "macos") return TARGET_MACOS.map((v) => [v[0], v[1]] as [number, number]); // macOS
  return [[0, 0]]; // Windows: none
} // targetOsVersions

/**
 * The architectures the target offers for an operating system.
 * @param os the operating system
 * @returns the architectures, as sysconfig names them
 */
export function targetArchs(os: Target["os"]): string[] {
  if (os === "macos") return ["arm64", "x86_64"]; // macOS
  if (os === "windows") return ["x86_64", "arm64", "x86"]; // Windows
  return ["x86_64", "aarch64", "armv7l", "ppc64le", "s390x"]; // Linux
} // targetArchs

/** The operating systems, by their stable ids. */
const OSES: readonly Target["os"][] = ["linux-glibc", "linux-musl", "macos", "windows"]; // the four

/** The state: one mode's fields. */
export type WheelShareState =
  | { mode: "file"; input: string; target: Target | null } // a file name, with the target check's choices when it is open
  | { mode: "versions"; versions: string; spec: string }; // versions and a specifier set

/**
 * The credential findings in a file-name box (a URL with something before its "@").
 * @param input the box as typed
 * @returns the findings, in reading order
 */
export function wheelUrlCredentials(input: string): ReturnType<typeof findUrlCredentials> {
  return findUrlCredentials(normaliseLines(input)); // http and https userinfo
} // wheelUrlCredentials

/**
 * Encode from what the page already read.
 * @param s the state
 * @param read whether the page has a reading of this mode (false while blank or too long)
 * @returns the mode's fields, nothing, or blocked
 */
export function encodeWheelShare(s: WheelShareState, read: boolean): ShareEncoding {
  if (!read) return { ok: false, reason: "empty" }; // no reading: nothing to share
  if (s.mode === "versions") return { ok: true, params: { mode: "versions", versions: s.versions, spec: s.spec } }; // a blank field carries nothing
  if (wheelUrlCredentials(s.input).length > 0) return { ok: false, reason: "blocked", code: "credentials" }; // a URL with a credential: paste the file name
  if (!s.target) return { ok: true, params: { input: s.input } }; // the file name alone
  const t = s.target; // the target check's choices
  return { ok: true, params: { input: s.input, impl: t.impl, python: `${t.major}.${t.minor}`, ft: t.freeThreaded ? "1" : "0", os: t.os, osver: t.os === "windows" ? "" : t.osVersion.join("."), arch: t.arch } }; // every choice (Windows has no version)
} // encodeWheelShare

/**
 * Whether the page has a reading of a state's mode.
 * @param s the state
 * @returns true when it does
 */
function hasReading(s: WheelShareState): boolean {
  if (s.mode === "file") return s.input.trim() !== "" && s.input.length <= MAX_INPUT_CHARS && !!explainFilename(s.input); // the file name read
  return (s.versions.trim() !== "" || s.spec.trim() !== "") && s.versions.length + s.spec.length <= MAX_INPUT_CHARS && !!explainVersions(s.versions, s.spec); // the versions read
} // hasReading

/**
 * The target from a link's six values, or null when any is not one the page offers.
 * @param v the values
 * @returns the target, or null
 */
function decodeTarget(v: Readonly<Record<string, string | null>>): Target | null {
  const impl = v.impl === "cpython" || v.impl === "pypy" ? v.impl : null; // CPython or PyPy
  const py = /^3\.(\d{1,2})$/.exec(v.python ?? ""); // 3.N
  const minor = py ? Number(py[1]) : NaN; // N
  const os = OSES.find((o) => o === v.os) ?? null; // a known system
  if (!impl || !TARGET_MINORS.includes(minor) || !os || (v.ft !== "1" && v.ft !== "0")) return null; // a choice the page does not offer
  if (v.ft === "1" && !(impl === "cpython" && minor >= 13)) return null; // free-threaded builds are CPython 3.13 and later
  const versions = targetOsVersions(os); // what the page offers for that system
  const osVersion = os === "windows" ? (v.osver === null ? versions[0] : null) : versions.find((p) => p.join(".") === v.osver) ?? null; // Windows carries none
  if (!osVersion || !targetArchs(os).includes(v.arch ?? "")) return null; // a version or architecture the page does not offer
  return { impl, major: 3, minor, freeThreaded: v.ft === "1", os, osVersion, arch: v.arch as string }; // the target
} // decodeTarget

/** The target's six names. */
const TARGET_NAMES = ["impl", "python", "ft", "os", "osver", "arch"] as const; // as in the link

/** The spec. */
export const WHEEL_SHARE: ShareSpec<WheelShareState> = Object.freeze({
  tool: "wheel-filename-explainer", // the slug
  posture: "input", // file names and versions; a URL's credential blocks
  carriesKey: "share.carries", // tools.wheel-filename-explainer.share.carries
  names: ["input", "mode", "versions", "spec", ...TARGET_NAMES], // the file name first
  /** The mode's fields, nothing, or blocked (the spec reads them itself). */
  encode(s: WheelShareState): ShareEncoding {
    return encodeWheelShare(s, hasReading(s)); // read, then encoded
  },
  /** One mode's fields, with nothing of the other mode; a target only whole and only with a file name. */
  decode(v: Readonly<Record<string, string | null>>): WheelShareState | null {
    const anyTarget = TARGET_NAMES.some((n) => v[n] !== null); // a target value present
    if (v.mode === "versions") { // the versions mode
      if (v.input !== null || anyTarget) return null; // a field of the file mode
      const versions = v.versions ?? ""; // absent: blank
      const spec = v.spec ?? ""; // absent: blank
      return versions.trim() !== "" || spec.trim() !== "" ? { mode: "versions", versions, spec } : null; // something to read
    } // versions
    if (v.mode !== null) return null; // an unknown mode (the file mode writes none)
    if (v.versions !== null || v.spec !== null) return null; // a field of the versions mode
    if (!v.input || v.input.trim() === "") return null; // no file name
    if (!anyTarget) return { mode: "file", input: v.input, target: null }; // the file name alone
    const target = decodeTarget(v); // the target, whole
    return target ? { mode: "file", input: v.input, target } : null; // or malformed
  },
});
