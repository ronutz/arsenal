// ============================================================================
// src/lib/tools/wheel-filename-explainer/compute.ts
// ----------------------------------------------------------------------------
// Wheel filename & PEP 440 version explainer: the pure engine (D-49:
// deterministic, local, no clock, no network, no randomness).
//
// TWO MODES
//   1. A file name. A wheel ({distribution}-{version}(-{build tag})?-{python
//      tag}-{abi tag}-{platform tag}.whl) is taken apart: the name and how it
//      normalizes, the version and how it normalizes, the build tag, each tag
//      of each compressed set, every expanded tag triple and what each one
//      requires (interpreters and platforms), plus findings. A source
//      distribution ({name}-{version}.tar.gz) is read the same way, without
//      tags. A URL or path is accepted: the last path segment is read (query
//      and fragment dropped, %XX decoded).
//   2. A list of versions, with an optional specifier set: each version
//      parsed and normalized, the list sorted by the PEP 440 order (equal
//      versions grouped), and, with a specifier, which versions are in range
//      and which an installer would take by default.
//
// THE RULES (all read 2026-10-27; see the module headers of names.ts,
// pep440.ts and tags.ts for the rest):
//   - Binary distribution format (packaging.python.org/en/latest/
//     specifications/binary-distribution-format/), "File name convention" and
//     "Escaping and Unicode": the six parts; the build tag "Must start with a
//     digit", sorts as (initial digits as an int, the rest as a str), and
//     "new distributions which need to be referenced externally should not
//     use build numbers"; the distribution part is the normalized name with
//     "-" as "_" (consumers must accept "." and upper case); versions
//     normalized; no "-" inside any component.
//   - Source distribution format, "Source distribution file name" (PEP 625):
//     {name}-{version}.tar.gz with the name normalized as for wheels and the
//     version canonical; code "MAY recognise source distribution files by the
//     .tar.gz suffix and the presence of precisely one hyphen".
//   - packaging 26.3's parse_wheel_filename and parse_sdist_filename (the
//     oracle for the golden vectors) decide what is refused outright: the
//     ".whl" suffix (case-sensitive), 4 or 5 hyphens, no "__" in the name, a
//     valid version, a build tag starting with digits, no empty tag set
//     member, every python tag an identifier; for sdists ".tar.gz" or ".zip"
//     and a split at the last hyphen. This engine also refuses a name that is
//     not in the name format (packaging accepts any word characters there).
//
// Input is bounded (MAX_INPUT_CHARS; MAX_VERSIONS versions; MAX_EXPANDED tag
// triples) and every scan is a loop or an anchored pattern of single classes.
// ============================================================================

import { checkName, normalizeName, wheelEscapedName, isIdentifier, type NameCheck } from "./names"; // names
import { parseVersion, parseSpecifierSet, compareVersions, selectVersions, normInt, MAX_VERSION_CHARS, type Pep440Version, type VersionError, type SpecifierSetParse, type Selection } from "./pep440"; // versions
import { readPythonTag, readAbiTag, readPlatformTag, interpreterRule, matchTarget, ANDROID_ABIS, IOS_MULTIARCH, type PythonTag, type AbiTag, type PlatformTag, type InterpreterRule, type Target, type TargetMatch } from "./tags"; // tags

// ---------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------

/** The longest input read (characters). */
export const MAX_INPUT_CHARS = 20_000; // a list of a few hundred versions, or one long URL
/** The most versions read in version mode. */
export const MAX_VERSIONS = 500; // enough for a project's whole history
/** The most expanded tag triples explained (a compressed set can multiply). */
export const MAX_EXPANDED = 400; // more is listed as a count only

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Findings about a file name: errors make it invalid; warnings and notes do not. */
export type FindingCode =
  // errors (the name cannot be read as a wheel or sdist)
  | "not-a-distribution" // no .whl, .tar.gz or .zip suffix
  | "suffix-case" // ".WHL" and the like: the suffix is case-sensitive
  | "wrong-part-count" // a wheel needs 4 or 5 hyphens
  | "sdist-no-hyphen" // no hyphen between name and version
  | "empty-name" // nothing before the first hyphen
  | "double-underscore" // "__" in a wheel's name part
  | "bad-name" // not a valid name (ASCII letters, digits, ".", "_", "-")
  | "bad-version" // not a PEP 440 version
  | "bad-build-tag" // the build tag does not start with a digit
  | "empty-tag" // an empty member in a tag or tag set
  | "python-tag-not-identifier" // a python tag that is not an identifier
  // warnings
  | "name-not-escaped" // upper case or "." in the name part (accepted, not what producers write)
  | "version-not-normalized" // the version part is not in its normal form
  | "local-version" // a local version label (PyPI does not allow them)
  | "build-tag-used" // a build tag (the specification's warning)
  | "tags-not-sorted" // a compressed set is not sorted
  | "tags-uppercase" // upper case in a tag (tags are compared in lower case)
  | "impossible-combination" // a python and ABI pair no installer lists
  | "unknown-python-tag" // a python tag in another shape
  | "unknown-platform" // a platform tag of no known family
  | "linux-simple-tag" // linux_<arch>: the specification calls the simple form insufficient for public distribution
  | "legacy-manylinux" // manylinux1 / 2010 / 2014: aliases (PEP 600)
  | "legacy-arch-mismatch" // a legacy manylinux name with an architecture it was not defined for
  | "macos-version-shape" // macOS x outside 10 to 15 and 26+, or x >= 11 with a minor other than 0
  | "android-abi" // an Android ABI outside the four
  | "ios-multiarch" // an iOS multiarch outside the three
  | "sdist-zip" // a .zip sdist: the standard is .tar.gz
  | "sdist-hyphens" // more than one hyphen in an sdist name
  | "too-many-tags"; // more expanded triples than MAX_EXPANDED

/** One finding, with the parameters its message needs. */
export interface Finding {
  /** The stable code. */
  code: FindingCode;
  /** Error, warning or note. */
  severity: "error" | "warning" | "note";
  /** Values for the message (all strings or numbers). */
  params: Record<string, string | number>;
} // Finding

/** One expanded tag triple, with what it requires. */
export interface ExpandedTag {
  /** python-abi-platform, lower case. */
  tag: string;
  /** The python tag reading. */
  python: PythonTag;
  /** The ABI tag reading. */
  abi: AbiTag;
  /** The platform tag reading. */
  platform: PlatformTag;
  /** Which interpreters accept the python and ABI pair. */
  interpreter: InterpreterRule;
} // ExpandedTag

/** A file name, read. */
export interface FilenameReading {
  /** wheel, sdist (.tar.gz) or sdist-zip. */
  kind: "wheel" | "sdist" | "sdist-zip" | "unknown";
  /** The file name read (after any URL or path was stripped). */
  fileName: string;
  /** True when a URL or path was given and its last segment was read. */
  fromPath: boolean;
  /** The parts as written (absent ones are null). */
  parts: { distribution: string; version: string; build: string | null; python: string | null; abi: string | null; platform: string | null };
  /** The name check (format and normalized form). */
  name: NameCheck | null;
  /** The name as a wheel or sdist should write it (normalized, "_" for "-"). */
  expectedName: string;
  /** The parsed version, or null. */
  version: Pep440Version | null;
  /** Why the version failed, or null. */
  versionError: VersionError | null;
  /** The build tag's number and rest, or null. */
  build: { number: string; rest: string } | null;
  /** Python tags of the set, in written order. */
  pythonTags: PythonTag[];
  /** ABI tags of the set. */
  abiTags: AbiTag[];
  /** Platform tags of the set. */
  platformTags: PlatformTag[];
  /** Every combination, explained (up to MAX_EXPANDED). */
  expanded: ExpandedTag[];
  /** How many combinations there are in all. */
  expandedCount: number;
  /** The findings. */
  findings: Finding[];
  /** False when an error finding exists. */
  valid: boolean;
} // FilenameReading

/** One entry of version mode. */
export interface VersionEntry {
  /** The text as given. */
  text: string;
  /** The parsed version, or null. */
  version: Pep440Version | null;
  /** Why it failed, or null. */
  error: VersionError | null;
} // VersionEntry

/** Version mode, read. */
export interface VersionsReading {
  /** Every entry in input order. */
  entries: VersionEntry[];
  /** Indices of the valid entries, ascending by the PEP 440 order (stable for equal versions). */
  sorted: number[];
  /** Groups of indices that are equal under the order (only groups of two or more). */
  equalGroups: number[][];
  /** The specifier set, when one was given. */
  specifier: SpecifierSetParse | null;
  /** The selection over the valid entries (indices into entries), when a valid specifier was given. */
  selection: Selection | null;
  /** True when more than MAX_VERSIONS were given (the rest were not read). */
  truncated: boolean;
} // VersionsReading

/** The engine's whole answer. */
export interface WheelExplainResult {
  /** Which mode ran. */
  mode: "filename" | "versions" | "empty" | "too-long";
  /** The file name reading (filename mode). */
  filename: FilenameReading | null;
  /** The versions reading (versions mode). */
  versions: VersionsReading | null;
} // WheelExplainResult

// ---------------------------------------------------------------------------
// File names
// ---------------------------------------------------------------------------

/**
 * Take the last path segment of a URL or path, dropping a query and a fragment and decoding %XX escapes.
 * @param input the text as given (already trimmed)
 * @returns the file name and whether anything was stripped
 */
export function lastSegment(input: string): { name: string; fromPath: boolean } {
  // Cut the fragment, then the query, then everything up to the last slash or backslash.
  let s = input; // working copy
  const hash = s.indexOf("#"); // fragment
  if (hash >= 0) s = s.slice(0, hash); // dropped
  const q = s.indexOf("?"); // query
  if (q >= 0) s = s.slice(0, q); // dropped
  const slash = Math.max(s.lastIndexOf("/"), s.lastIndexOf("\\")); // the last separator
  const fromPath = slash >= 0 || s.length !== input.length; // anything stripped
  s = s.slice(slash + 1); // the last segment
  if (s.includes("%")) { try { s = decodeURIComponent(s); } catch { /* a malformed escape: keep the text as it is */ } } // %2B and friends
  return { name: s, fromPath }; // the file name
} // lastSegment

/**
 * Read a wheel or sdist file name.
 * @param raw the file name, URL or path
 * @returns the reading
 */
export function explainFilename(raw: string): FilenameReading {
  // Strip a URL or path first.
  const { name: fileName, fromPath } = lastSegment(raw.trim()); // the file name
  const findings: Finding[] = []; // collected findings
  /** Record a finding. */
  const add = (code: FindingCode, severity: Finding["severity"], params: Record<string, string | number> = {}): void => { findings.push({ code, severity, params }); }; // push
  const out: FilenameReading = { // filled in below
    kind: "unknown", fileName, fromPath, parts: { distribution: "", version: "", build: null, python: null, abi: null, platform: null }, // nothing read yet
    name: null, expectedName: "", version: null, versionError: null, build: null, pythonTags: [], abiTags: [], platformTags: [], expanded: [], expandedCount: 0, findings, valid: false, // empty
  }; // out
  const lower = fileName.toLowerCase(); // for the suffix check only
  let stem: string; // the name without its suffix
  if (fileName.endsWith(".whl")) { out.kind = "wheel"; stem = fileName.slice(0, -4); } // a wheel
  else if (fileName.endsWith(".tar.gz")) { out.kind = "sdist"; stem = fileName.slice(0, -7); } // the standard sdist
  else if (fileName.endsWith(".zip")) { out.kind = "sdist-zip"; stem = fileName.slice(0, -4); add("sdist-zip", "warning"); } // a legacy sdist
  else { // not a distribution file name
    add(lower.endsWith(".whl") || lower.endsWith(".tar.gz") || lower.endsWith(".zip") ? "suffix-case" : "not-a-distribution", "error"); // why
    return finish(out); // nothing more to read
  } // suffix
  if (out.kind === "wheel") readWheel(stem, out, add); else readSdist(stem, out, add); // the parts
  return finish(out); // with the verdict
} // explainFilename

/**
 * Set the verdict from the findings.
 * @param out the reading
 * @returns the same reading
 */
function finish(out: FilenameReading): FilenameReading {
  // Valid when no finding is an error.
  out.valid = out.kind !== "unknown" && !out.findings.some((f) => f.severity === "error"); // the verdict
  return out; // done
} // finish

/**
 * Read the name and version parts common to wheels and sdists.
 * @param distribution the name part as written
 * @param versionText the version part as written
 * @param out the reading to fill
 * @param add the finding recorder
 * @param wheel true for a wheel (stricter name rule)
 */
function readNameAndVersion(distribution: string, versionText: string, out: FilenameReading, add: (c: FindingCode, s: Finding["severity"], p?: Record<string, string | number>) => void, wheel: boolean): void {
  // The name: never empty; in a wheel no "__"; always the name format.
  out.parts.distribution = distribution; // as written
  out.parts.version = versionText; // as written
  out.expectedName = wheelEscapedName(distribution); // what a producer writes
  if (distribution === "") add("empty-name", "error"); // nothing before the hyphen
  else { // something to check
    out.name = checkName(distribution); // the name format
    if (wheel && distribution.includes("__")) add("double-underscore", "error"); // packaging refuses it
    else if (!out.name.valid) add("bad-name", "error", { at: out.name.at + 1 }); // outside the format
    else if (distribution !== out.expectedName) add("name-not-escaped", "warning", { expected: out.expectedName }); // accepted, not what producers write
  } // name
  const v = parseVersion(versionText); // the version
  if (!v.ok) { out.versionError = v.error; add("bad-version", "error"); return; } // invalid
  out.version = v.version; // parsed
  if (versionText !== v.version.normalized) add("version-not-normalized", "warning", { normalized: v.version.normalized }); // not canonical
  if (v.version.local) add("local-version", "note"); // a local label
} // readNameAndVersion

/**
 * Read a wheel's stem (the name without ".whl").
 * @param stem the stem
 * @param out the reading to fill
 * @param add the finding recorder
 */
function readWheel(stem: string, out: FilenameReading, add: (c: FindingCode, s: Finding["severity"], p?: Record<string, string | number>) => void): void {
  // Five or six parts.
  const parts = stem.split("-"); // split at every hyphen
  if (parts.length !== 5 && parts.length !== 6) { add("wrong-part-count", "error", { hyphens: parts.length - 1 }); return; } // not the convention
  const [distribution, versionText] = parts; // the first two
  readNameAndVersion(distribution, versionText, out, add, true); // name and version
  if (parts.length === 6) { // a build tag
    const b = parts[2]; // as written
    out.parts.build = b; // kept
    let i = 0; // leading digits
    while (i < b.length && b[i] >= "0" && b[i] <= "9") i++; // count them
    if (i === 0) add("bad-build-tag", "error"); // must start with a digit
    else { out.build = { number: normInt(b.slice(0, i)), rest: b.slice(i) }; add("build-tag-used", "warning"); } // (int, str)
  } // build
  const [py, abi, plat] = parts.slice(-3); // the three tag sets
  out.parts.python = py; // as written
  out.parts.abi = abi; // as written
  out.parts.platform = plat; // as written
  const sets = [py.split("."), abi.split("."), plat.split(".")]; // the compressed sets
  if (sets.some((s) => s.includes(""))) { add("empty-tag", "error"); return; } // an empty member
  for (const p of sets[0]) if (!isIdentifier(p)) { add("python-tag-not-identifier", "error", { tag: p }); return; } // str.isidentifier()
  if (sets.some((s) => s.join(".") !== s.join(".").toLowerCase())) add("tags-uppercase", "warning"); // compared in lower case
  for (const s of sets) { // each set
    const sorted = [...s].sort(); // Python's sorted() on ASCII strings (code unit order)
    if (s.length > 1 && s.join(".") !== sorted.join(".")) add("tags-not-sorted", "warning", { set: s.join(".") }); // "a '.'-separated, sorted, collection"
  } // sets
  out.pythonTags = sets[0].map(readPythonTag); // python tags
  out.abiTags = sets[1].map(readAbiTag); // ABI tags
  out.platformTags = sets[2].map(readPlatformTag); // platform tags
  for (const t of out.pythonTags) if (t.unreadable) add("unknown-python-tag", "warning", { tag: t.tag }); // another shape
  for (const t of out.platformTags) { // platform checks
    if (t.family === "other") add("unknown-platform", "note", { tag: t.tag }); // another sysconfig platform
    if (t.family === "linux") add("linux-simple-tag", "warning", { tag: t.tag }); // the simple Linux form
    if (t.legacy) { // a legacy manylinux name
      add("legacy-manylinux", "note", { tag: t.tag, alias: `manylinux_${t.version?.[0]}_${t.version?.[1]}_${t.arch}` }); // its alias
      const allowed: Record<string, string[]> = { manylinux1: ["x86_64", "i686"], manylinux2010: ["x86_64", "i686"], manylinux2014: ["x86_64", "i686", "aarch64", "armv7l", "ppc64", "ppc64le", "s390x"] }; // per PEP
      if (!allowed[t.legacy].includes(t.arch)) add("legacy-arch-mismatch", "warning", { tag: t.tag, legacy: t.legacy }); // not defined for it
    } // legacy
    if (t.family === "macos" && t.version) { // macOS shape
      const [x, y] = t.version; // major and minor
      if (!((x >= 10 && x <= 15) || x >= 26) || (x >= 11 && y !== 0)) add("macos-version-shape", "warning", { tag: t.tag }); // the specification's rule
    } // macos
    if (t.family === "android" && !ANDROID_ABIS.includes(t.arch)) add("android-abi", "warning", { tag: t.tag }); // not one of four
    if (t.family === "ios" && !IOS_MULTIARCH.includes(`${t.arch}_${t.sdk}`)) add("ios-multiarch", "warning", { tag: t.tag }); // not one of three
  } // platforms
  out.expandedCount = sets[0].length * sets[1].length * sets[2].length; // every combination
  if (out.expandedCount > MAX_EXPANDED) add("too-many-tags", "note", { count: out.expandedCount, max: MAX_EXPANDED }); // listed as a count only
  const impossible = new Set<string>(); // pairs already reported
  outer: for (const p of out.pythonTags) for (const a of out.abiTags) for (const pl of out.platformTags) { // each combination, written order
    const rule = interpreterRule(p, a, pl); // what the combination needs
    if (rule.kind === "impossible" && rule.reason !== "unreadable") { const k = `${p.tag}-${a.tag}-${rule.reason}`; if (!impossible.has(k)) { impossible.add(k); add("impossible-combination", "warning", { pair: `${p.tag}-${a.tag}`, reason: rule.reason }); } } // once per pair and reason
    if (out.expanded.length >= MAX_EXPANDED) break outer; // the bound
    out.expanded.push({ tag: `${p.tag}-${a.tag}-${pl.tag}`.toLowerCase(), python: p, abi: a, platform: pl, interpreter: rule }); // explained
  } // combinations
} // readWheel

/**
 * Read an sdist's stem (the name without ".tar.gz" or ".zip").
 * @param stem the stem
 * @param out the reading to fill
 * @param add the finding recorder
 */
function readSdist(stem: string, out: FilenameReading, add: (c: FindingCode, s: Finding["severity"], p?: Record<string, string | number>) => void): void {
  // Split at the last hyphen, as packaging does; the standard has exactly one.
  const cut = stem.lastIndexOf("-"); // the last hyphen
  if (cut < 0) { add("sdist-no-hyphen", "error"); return; } // no version part
  if (stem.indexOf("-") !== cut) add("sdist-hyphens", "warning"); // more than one hyphen
  readNameAndVersion(stem.slice(0, cut), stem.slice(cut + 1), out, add, false); // name and version
} // readSdist

// ---------------------------------------------------------------------------
// Versions
// ---------------------------------------------------------------------------

/**
 * Read version mode: versions separated by white space or commas, and at most one specifier line.
 * @param versionsText the versions
 * @param specifierText the specifier set ("" for none)
 * @returns the reading
 */
export function explainVersions(versionsText: string, specifierText: string): VersionsReading {
  // Split the versions (no version contains white space or a comma).
  const tokens = versionsText.split(/[\s,]+/).filter((x) => x !== ""); // the texts (one class: linear)
  const truncated = tokens.length > MAX_VERSIONS; // over the bound
  const entries: VersionEntry[] = tokens.slice(0, MAX_VERSIONS).map((text) => { // each version
    const p = parseVersion(text); // parse
    return p.ok ? { text, version: p.version, error: null } : { text, version: null, error: p.error }; // the entry
  }); // entries
  const valid = entries.map((_, i) => i).filter((i) => entries[i].version !== null); // valid indices
  const sorted = [...valid].sort((a, b) => compareVersions(entries[a].version as Pep440Version, entries[b].version as Pep440Version) || a - b); // stable ascending
  const equalGroups: number[][] = []; // runs of equal versions
  for (let k = 0; k < sorted.length; ) { // walk the sorted list
    let j = k + 1; // end of the run
    while (j < sorted.length && compareVersions(entries[sorted[k]].version as Pep440Version, entries[sorted[j]].version as Pep440Version) === 0) j++; // equal ones
    if (j - k > 1) equalGroups.push(sorted.slice(k, j)); // a group
    k = j; // next run
  } // runs
  const spec = specifierText.trim() === "" ? null : parseSpecifierSet(specifierText); // the specifier set
  let selection: Selection | null = null; // the installer's view
  if (spec && spec.ok) { // a valid set
    const sel = selectVersions(valid.map((i) => entries[i].version as Pep440Version), spec.clauses); // over the valid ones
    const map = (xs: number[]) => xs.map((x) => valid[x]); // back to entry indices
    selection = { inRange: map(sel.inRange), selected: map(sel.selected), prereleasePolicy: sel.prereleasePolicy, preferred: sel.preferred < 0 ? -1 : valid[sel.preferred] }; // mapped
  } // selection
  return { entries, sorted, equalGroups, specifier: spec, selection, truncated }; // the reading
} // explainVersions

// ---------------------------------------------------------------------------
// The API entry point
// ---------------------------------------------------------------------------

/**
 * Is the text a single distribution file name (or a URL or path to one)?
 * @param text the trimmed input
 * @returns true when it ends in .whl, .tar.gz or .zip (after a query or fragment is dropped) and has no white space
 */
export function looksLikeFilename(text: string): boolean {
  // One token whose last segment has a distribution suffix.
  if (/\s/.test(text)) return false; // a list
  const n = lastSegment(text).name.toLowerCase(); // the file name
  return n.endsWith(".whl") || n.endsWith(".tar.gz") || n.endsWith(".zip"); // a suffix
} // looksLikeFilename

/**
 * run: the registry-facing entry point. A single file name (or URL) is explained; anything else is version mode,
 * where a line starting with an operator character (~ = ! < >) is the specifier set and every other line holds
 * versions separated by white space or commas.
 * @param input the text
 * @returns the result
 */
export function run(input: string): WheelExplainResult {
  // Bounds, then the mode.
  if (input.length > MAX_INPUT_CHARS) return { mode: "too-long", filename: null, versions: null }; // refused
  const text = input.trim(); // the text
  if (text === "") return { mode: "empty", filename: null, versions: null }; // nothing
  if (looksLikeFilename(text)) return { mode: "filename", filename: explainFilename(text), versions: null }; // one file name
  const lines = text.split(/\r?\n/); // lines
  const specLine = lines.find((l) => /^[ \t]*[~=!<>]/.test(l)) ?? ""; // the first specifier line (an anchored class run: linear)
  const versionLines = lines.filter((l) => l !== specLine || specLine === ""); // the rest
  return { mode: "versions", filename: null, versions: explainVersions(versionLines.join("\n"), specLine) }; // version mode
} // run

/**
 * Check a parsed wheel against a described target.
 * @param reading a wheel reading
 * @param target the target
 * @returns the match, or null when the reading has no tags
 */
export function checkTarget(reading: FilenameReading, target: Target): TargetMatch | null {
  // Every combination, even beyond the explained ones.
  if (reading.kind !== "wheel" || reading.pythonTags.length === 0) return null; // nothing to match
  const all: string[] = []; // every triple
  for (const p of reading.pythonTags) for (const a of reading.abiTags) for (const pl of reading.platformTags) all.push(`${p.tag}-${a.tag}-${pl.tag}`.toLowerCase()); // expanded
  return matchTarget(all, target); // the answer
} // checkTarget

export { MAX_VERSION_CHARS }; // re-exported for the page's messages
export { normalizeName }; // re-exported for the page
