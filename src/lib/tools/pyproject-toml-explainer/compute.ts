// ============================================================================
// src/lib/tools/pyproject-toml-explainer/compute.ts
// ----------------------------------------------------------------------------
// pyproject.toml explainer: the pure engine (D-49: deterministic, local, no
// clock, no network, no randomness). It reads a pyproject.toml (toml.ts),
// explains it table by table and key by key, and checks it against the
// specifications, reporting each finding with the rule's strength:
//   error   = the specification says MUST / MUST NOT (or the file is not TOML,
//             or a value has the wrong type);
//   warning = SHOULD / SHOULD NOT / MAY-raise-an-error, deprecations, and
//             syntax only newer parsers read;
//   note    = information (normalized forms, defaults that apply).
//
// THE RULES (all read 2026-10-27 with curl; see NOTES.md for the files):
//   - pyproject.toml specification (packaging.python.org/en/latest/
//     specifications/pyproject-toml/, last updated Oct 27, 2026; history to
//     "August 2026"): the three tables, "Other tables are reserved for future
//     use"; [build-system] requires (mandatory in the table, dependency
//     specifiers; the setuptools default without the table); [project] and
//     its complete key list, types and core metadata fields; name (only key
//     required statically, MUST NOT be dynamic); version (required statically
//     or dynamic); description ("Tools MAY error" on several lines); readme
//     (path or table, .md and .rst suffixes, file and text mutually
//     exclusive, content-type required in a table, UTF-8 assumed);
//     requires-python; license (SPDX expression; the table form deprecated by
//     PEP 639, file and text mutually exclusive); license-files (glob
//     patterns; an empty array means none); authors and maintainers (name
//     without commas, a valid email, at least one key); keywords;
//     classifiers (License :: deprecated; MAY error with a license string);
//     urls; scripts, gui-scripts, entry-points (no console_scripts or
//     gui_scripts group, one level only); dependencies; optional-dependencies
//     (keys MUST be valid Provides-Extra values; self-referential extras);
//     import-names and import-namespaces (PEP 794: identifiers with an
//     optional "; private", import-namespaces never empty, no name in both);
//     dynamic (name never; a static key MUST NOT also be dynamic unless it is
//     one of the extensible list or table keys, PEP 808 of May 2026); [tool]
//     (a sub-table per tool, named after the PyPI project that owns it).
//   - PEP 517 (Final): build-backend (module_path(:object_path)?, identifiers)
//     and backend-path (directories relative to the project root that MUST
//     stay inside the source tree); without build-backend, the legacy
//     setuptools behaviour (setuptools.build_meta:__legacy__).
//   - Core metadata specifications 2.6 (May 2026): Description-Content-Type
//     (text/plain, text/x-rst, text/markdown; charset UTF-8 only; variant GFM
//     or CommonMark), Project-URL (label limited to 32 characters),
//     Provides-Extra (^[a-z0-9]+(-[a-z0-9]+)*$; clashes after normalization
//     are errors).
//   - Well-known Project URLs (label normalization and the well-known list).
//   - Entry points specification (object references, group and name rules).
//   - glob patterns specification (license-files).
//   - License Expression specification and the SPDX annex (license.ts).
//   - Dependency Groups specification (PEP 735): [dependency-groups] keys are
//     valid names compared normalized, values are dependency specifiers or
//     {include-group = "..."} tables; includes MUST NOT form cycles.
//   - Dependency specifiers and version specifiers (pep508.ts, pep440.ts),
//     including the "Direct references" rules and the discouraged "==" and
//     "===" operators.
// ============================================================================

import { parseToml, MAX_TOML_CHARS, type TomlValue, type TomlTable, type TomlError, type Toml11Feature, type TomlVersion } from "./toml"; // TOML
import { parseRequirement, type RequirementParse } from "./pep508"; // dependency specifiers
import { checkLicenseExpression, type LicenseCheck } from "./license"; // SPDX expressions
import { parseVersion, parseSpecifierSet, type Pep440Version, type SpecifierSetParse } from "../wheel-filename-explainer/pep440"; // versions
import { checkName, normalizeName, isStrictExtraName, isDottedIdentifier, parseObjectReference, type ObjectReference } from "../wheel-filename-explainer/names"; // names

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The strength of a finding. */
export type Severity = "error" | "warning" | "note";

/** Every finding code (the component words each one). */
export type FindingCode =
  | "toml-1-1" | "unknown-top-level" | "wrong-type" // document
  | "no-build-system" | "bs-requires-missing" | "bs-requirement-invalid" | "bs-backend-missing" | "bs-backend-invalid" | "bs-backend-path-outside" | "bs-unknown-key" // [build-system]
  | "no-project" | "unknown-project-key" // [project] structure
  | "name-missing" | "name-dynamic" | "name-invalid" | "name-not-normalized" // name
  | "version-missing" | "version-invalid" | "version-not-normalized" | "version-local" // version
  | "static-and-dynamic" | "static-and-dynamic-extensible" | "dynamic-unknown" | "dynamic-duplicate" // dynamic
  | "description-multiline" // description
  | "readme-suffix" | "readme-both" | "readme-neither" | "readme-content-type-missing" | "readme-content-type-unsupported" | "readme-charset" | "readme-variant" // readme
  | "requires-python-invalid" // requires-python
  | "license-invalid" | "license-not-canonical" | "license-deprecated-id" | "license-table" | "license-table-both" | "license-classifier" | "license-classifier-with-expression" // license
  | "license-files-invalid" | "license-files-empty" // license-files
  | "person-empty" | "person-unknown-key" | "person-name-comma" | "person-email-invalid" // authors / maintainers
  | "url-label-long" | "url-no-scheme" // urls
  | "entry-point-reference" | "entry-point-name" | "entry-points-reserved-group" | "entry-points-nested" | "entry-points-group-name" // entry points
  | "requirement-invalid" | "requirement-strict-pin" | "requirement-arbitrary" | "requirement-direct-url" | "requirement-url-unverified" | "requirement-url-semicolon" | "requirement-extra-name" | "requirement-marker" | "requirement-parenthesized" // dependency specifiers
  | "extra-invalid" | "extra-not-normalized" | "extra-clash" | "self-extra-unknown" | "self-reference" // optional-dependencies
  | "import-name-invalid" | "import-namespaces-empty" | "import-name-both" // import names
  | "group-name-invalid" | "group-duplicate" | "group-item-invalid" | "group-include-unknown" | "group-cycle" | "group-matches-extra" // dependency groups
  | "tool-not-table"; // [tool]

/** One finding. */
export interface Finding {
  /** The stable code. */
  code: FindingCode;
  /** Its strength. */
  severity: Severity;
  /** The dotted path it concerns ("" for the document). */
  path: string;
  /** 1-based line (0 when there is none). */
  line: number;
  /** Values for the message. */
  params: Record<string, string | number>;
} // Finding

/** The explanation keys (the component's messages are keyed by these). */
export type KnownKey =
  | "bs.requires" | "bs.build-backend" | "bs.backend-path" // [build-system]
  | "p.name" | "p.version" | "p.description" | "p.readme" | "p.requires-python" | "p.license" | "p.license-files" | "p.authors" | "p.maintainers" // [project]
  | "p.keywords" | "p.classifiers" | "p.urls" | "p.scripts" | "p.gui-scripts" | "p.entry-points" | "p.dependencies" | "p.optional-dependencies" // [project]
  | "p.import-names" | "p.import-namespaces" | "p.dynamic" // [project]
  | "dg.group" | "tool.table" | "other"; // the rest

/** One requirement string, parsed, with where it is. */
export interface RequirementItem {
  /** Its index in its array. */
  index: number;
  /** The string. */
  text: string;
  /** Its line. */
  line: number;
  /** The parse. */
  parse: RequirementParse;
  /** For optional-dependencies: the extra it belongs to ("" otherwise). */
  extra: string;
} // RequirementItem

/** One explained key. */
export interface Item {
  /** The dotted path. */
  path: string;
  /** The last key. */
  key: string;
  /** 1-based line of the value. */
  line: number;
  /** The TOML type ("string", "integer", "float", "boolean", "datetime", "array", "table"). */
  type: string;
  /** Which explanation applies. */
  known: KnownKey;
  /** The core metadata field it fills, or "". */
  coreField: string;
  /** A short rendering of the value. */
  display: string;
  /** Also listed in project.dynamic. */
  dynamic: boolean;
  /** For version: the parse. */
  version?: Pep440Version;
  /** For requires-python: the specifier set. */
  specifier?: SpecifierSetParse;
  /** For dependency lists: each requirement. */
  requirements?: RequirementItem[];
  /** For scripts, gui-scripts and entry-point groups: each entry. */
  entries?: Array<{ name: string; value: string; ref: ObjectReference; line: number }>;
  /** For urls: each label. */
  urls?: Array<{ label: string; url: string; normalized: string; wellKnown: string; line: number }>;
  /** For authors and maintainers: each person and the core metadata field it fills. */
  people?: Array<{ name: string; email: string; field: string; line: number }>;
  /** For license (string form): the check. */
  license?: LicenseCheck;
  /** For readme: what it resolves to. */
  readme?: { kind: "file" | "text"; file: string; contentType: string; inferred: boolean };
  /** For a [tool.x] table or another table: its keys and their types. */
  keys?: Array<{ key: string; type: string; line: number }>;
  /** For optional-dependencies: each extra, its normalized name and how many requirements it lists. */
  extras?: Array<{ name: string; normalized: string; count: number; line: number }>;
  /** For dependency groups: the group's name normalized, and its includes. */
  group?: { normalized: string; includes: string[] };
  /** For build-backend: the object reference. */
  reference?: ObjectReference;
} // Item

/** One table of the file. */
export interface Section {
  /** Which table. */
  id: "build-system" | "project" | "dependency-groups" | "tool" | "other";
  /** Its name as written ("build-system", "tool.ruff" ...). */
  name: string;
  /** Present in the file. */
  present: boolean;
  /** Its line (0 when absent). */
  line: number;
  /** The keys, explained. */
  items: Item[];
} // Section

/** The engine's answer. */
export interface PyprojectResult {
  /** "empty", "too-long", "toml-error" or "ok". */
  status: "empty" | "too-long" | "toml-error" | "ok";
  /** The TOML grammar the file needed, and the 1.1.0 features used. */
  toml: { version: TomlVersion; features: Toml11Feature[]; crlf: boolean } | null;
  /** The TOML error, when the file is not TOML. */
  tomlError: TomlError | null;
  /** The tables, explained. */
  sections: Section[];
  /** The findings, in file order. */
  findings: Finding[];
  /** Counts by severity. */
  counts: { error: number; warning: number; note: number };
  /** The headline facts. */
  summary: { name: string; normalizedName: string; version: string; versionDynamic: boolean; backend: string; requiresPython: string; dependencies: number; extras: string[]; groups: string[]; tools: string[] };
} // PyprojectResult

// ---------------------------------------------------------------------------
// Constants from the specifications
// ---------------------------------------------------------------------------

/** The complete list of [project] keys, with their TOML type and core metadata field. */
export const PROJECT_KEYS: Record<string, { type: "string" | "array" | "table" | "string-or-table"; core: string; known: KnownKey }> = {
  authors: { type: "array", core: "Author, Author-email", known: "p.authors" }, // people
  classifiers: { type: "array", core: "Classifier", known: "p.classifiers" }, // Trove classifiers
  dependencies: { type: "array", core: "Requires-Dist", known: "p.dependencies" }, // dependencies
  description: { type: "string", core: "Summary", known: "p.description" }, // one line
  dynamic: { type: "array", core: "Dynamic", known: "p.dynamic" }, // dynamic keys
  "entry-points": { type: "table", core: "", known: "p.entry-points" }, // plugin groups
  "gui-scripts": { type: "table", core: "", known: "p.gui-scripts" }, // gui_scripts
  "import-names": { type: "array", core: "Import-Name", known: "p.import-names" }, // PEP 794
  "import-namespaces": { type: "array", core: "Import-Namespace", known: "p.import-namespaces" }, // PEP 794
  keywords: { type: "array", core: "Keywords", known: "p.keywords" }, // keywords
  license: { type: "string-or-table", core: "License-Expression", known: "p.license" }, // SPDX expression (legacy table: License)
  "license-files": { type: "array", core: "License-File", known: "p.license-files" }, // globs
  maintainers: { type: "array", core: "Maintainer, Maintainer-email", known: "p.maintainers" }, // people
  name: { type: "string", core: "Name", known: "p.name" }, // the name
  "optional-dependencies": { type: "table", core: "Requires-Dist, Provides-Extra", known: "p.optional-dependencies" }, // extras
  readme: { type: "string-or-table", core: "Description, Description-Content-Type", known: "p.readme" }, // the README
  "requires-python": { type: "string", core: "Requires-Python", known: "p.requires-python" }, // Python versions
  scripts: { type: "table", core: "", known: "p.scripts" }, // console_scripts
  urls: { type: "table", core: "Project-URL", known: "p.urls" }, // URLs
  version: { type: "string", core: "Version", known: "p.version" }, // the version
}; // PROJECT_KEYS

/** The keys that may be static and dynamic at once (lists and tables a back-end may only append to). */
export const EXTENSIBLE_KEYS = new Set(["authors", "classifiers", "dependencies", "entry-points", "gui-scripts", "import-names", "import-namespaces", "keywords", "license-files", "maintainers", "optional-dependencies", "scripts", "urls"]); // the specification's list

/** Marker findings that are information only (the specification says tools MAY accept them, or compares after normalizing); every other marker finding is a warning. */
const MARKER_NOTES = new Set(["string-characters", "extra-not-normalized"]); // notes

/** The well-known Project-URL labels and their aliases (normalized form to canonical label). */
export const WELL_KNOWN_URLS: Record<string, string> = {
  homepage: "homepage", source: "source", repository: "source", sourcecode: "source", github: "source", download: "download", // home, source, download
  changelog: "changelog", changes: "changelog", whatsnew: "changelog", history: "changelog", releasenotes: "releasenotes", // changes
  documentation: "documentation", docs: "documentation", issues: "issues", bugs: "issues", issue: "issues", tracker: "issues", // docs, issues
  issuetracker: "issues", bugtracker: "issues", funding: "funding", sponsor: "funding", donate: "funding", donation: "funding", // more issues, funding
  security: "security", securitypolicy: "security", // security policy
}; // WELL_KNOWN_URLS

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * The TOML type name of a value.
 * @param v the value
 * @returns the type name
 */
function typeOf(v: TomlValue): string {
  // Arrays of tables are arrays too.
  return v.t; // string, integer, float, boolean, datetime, array, table
} // typeOf

/**
 * A short rendering of a value (language-neutral).
 * @param v the value
 * @returns the rendering
 */
export function display(v: TomlValue): string {
  // Scalars as written, containers by size.
  switch (v.t) { // by type
    case "string": { const s = JSON.stringify(v.v); return s.length > 90 ? `${s.slice(0, 87)}..."` : s; } // quoted, cut
    case "integer": return v.raw; // as written
    case "float": return v.raw; // as written
    case "boolean": return String(v.v); // true or false
    case "datetime": return v.raw; // as written
    case "array": return `[${v.items.length}]`; // item count
    case "table": return `{${v.entries.size}}`; // key count
  } // switch
} // display

/**
 * Normalize a Project-URL label (delete ASCII punctuation and white space, lower case).
 * @param label the label
 * @returns the normalized label
 */
export function normalizeUrlLabel(label: string): string {
  // string.punctuation + string.whitespace removed, then lower().
  let out = ""; // the result
  for (const c of label) { // each character
    const n = c.charCodeAt(0); // its code
    const punct = (n >= 33 && n <= 47) || (n >= 58 && n <= 64) || (n >= 91 && n <= 96) || (n >= 123 && n <= 126); // ASCII punctuation
    const space = c === " " || c === "\t" || c === "\n" || c === "\r" || c === "\x0b" || c === "\x0c"; // string.whitespace
    if (!punct && !space) out += c; // kept
  } // characters
  return out.toLowerCase(); // lowered (Python's str.lower lowers non-ASCII too)
} // normalizeUrlLabel

/**
 * Check a glob pattern against the glob patterns specification.
 * @param p the pattern
 * @returns "" when valid, otherwise why ("parent", "absolute", "characters", "bracket")
 */
export function globProblem(p: string): string {
  // The reference implementation's checks, plus bracket balance.
  if (p.includes("..")) return "parent"; // ".." MUST NOT be used
  if (p.startsWith("/") || p.includes(":\\")) return "absolute"; // relative only
  for (const c of p) if (!(/^[A-Za-z0-9_ \-./*?[\]]$/.test(c) || (c.charCodeAt(0) > 127 && /^[\p{L}\p{N}]$/u.test(c)))) return "characters"; // \w (Unicode letters and digits) plus space - . / * ? [ ]
  let open = false; // inside [...]
  for (const c of p) { if (c === "[") { if (open) return "bracket"; open = true; } else if (c === "]") { if (!open) return "bracket"; open = false; } } // balanced ranges
  return open ? "bracket" : ""; // an unclosed range
} // globProblem

/**
 * The "Direct references" rules for a URL in a dependency specifier: a local file needs nothing; a VCS URL SHOULD
 * name a secure transport (vcs+https or vcs+ssh) and pin a commit hash; any other URL SHOULD use https and carry a
 * <hash-algorithm>=<expected-hash> fragment.
 * @param url the URL
 * @param scheme its scheme, lower case
 * @param hasHash a hash fragment is present
 * @returns "" when nothing is missing, "insecure", "no-hash" or "insecure-no-hash"
 */
export function urlIssue(url: string, scheme: string, hasHash: boolean): string {
  // Local files are trusted as they are.
  if (scheme === "file") return ""; // a local path
  const plus = scheme.indexOf("+"); // vcs+protocol
  const vcs = plus > 0 && ["git", "hg", "svn", "bzr"].includes(scheme.slice(0, plus)); // a version control URL
  const transport = vcs ? scheme.slice(plus + 1) : scheme; // the protocol
  const secure = transport === "https" || (vcs && transport === "ssh"); // a secure transport
  const pinned = vcs ? /@[0-9a-fA-F]{7,64}(#.*)?$/.test(url) || /#[0-9a-fA-F]{7,64}$/.test(url) : hasHash; // a commit hash, or a hash fragment
  return secure ? (pinned ? "" : "no-hash") : pinned ? "insecure" : "insecure-no-hash"; // what is missing
} // urlIssue

/**
 * A minimal email address check: one "@", something on both sides, no white space, a dot in the domain.
 * @param e the address
 * @returns true when it has that shape
 */
function emailLooksValid(e: string): boolean {
  // Character checks only (no regular expression over the whole address).
  const at = e.indexOf("@"); // the separator
  if (at <= 0 || at !== e.lastIndexOf("@") || at === e.length - 1) return false; // exactly one, with both sides
  for (const c of e) if (c === " " || c === "\t" || c === "<" || c === ">" || c === ",") return false; // no white space, brackets or commas
  return e.slice(at + 1).includes("."); // a dotted domain
} // emailLooksValid

// ---------------------------------------------------------------------------
// The explainer
// ---------------------------------------------------------------------------

/** The working state of one explanation. */
class Explainer {
  /** The findings. */
  findings: Finding[] = []; // collected
  /** The sections. */
  sections: Section[] = []; // collected
  /** The project's normalized name (for self-referential extras). */
  projectName = ""; // set when read
  /** The extras defined (normalized). */
  extras = new Set<string>(); // set when read
  /** The headline facts. */
  summary: PyprojectResult["summary"] = { name: "", normalizedName: "", version: "", versionDynamic: false, backend: "", requiresPython: "", dependencies: 0, extras: [], groups: [], tools: [] }; // empty

  /**
   * Record a finding.
   * @param code the code
   * @param severity its strength
   * @param path the dotted path
   * @param line the line
   * @param params message values
   */
  add(code: FindingCode, severity: Severity, path: string, line: number, params: Record<string, string | number> = {}): void {
    // Push it.
    this.findings.push({ code, severity, path, line, params }); // recorded
  } // add

  /**
   * Make an item.
   * @param path the dotted path
   * @param v the value
   * @param known the explanation key
   * @param coreField the core metadata field
   * @returns the item
   */
  item(path: string, v: TomlValue, known: KnownKey, coreField = ""): Item {
    // The common fields.
    return { path, key: path.slice(path.lastIndexOf(".") + 1), line: v.line, type: typeOf(v), known, coreField, display: display(v), dynamic: false }; // the item
  } // item

  /**
   * Check a value's type; record wrong-type when it differs.
   * @param v the value
   * @param want the expected type
   * @param path its path
   * @returns true when it matches
   */
  expect(v: TomlValue, want: string, path: string): boolean {
    // "string-or-table" accepts both.
    const ok = want === "string-or-table" ? v.t === "string" || v.t === "table" : v.t === want; // matches
    if (!ok) this.add("wrong-type", "error", path, v.line, { want, got: v.t }); // reported
    return ok; // the verdict
  } // expect

  /**
   * Parse every string of a dependency array, with the findings each one raises.
   * @param arr the array value
   * @param path its path
   * @param invalidCode the finding for an invalid string
   * @returns the parsed items
   */
  requirements(arr: TomlValue, path: string, invalidCode: FindingCode = "requirement-invalid"): RequirementItem[] {
    // Each element must be a string holding a dependency specifier.
    const out: RequirementItem[] = []; // parsed
    if (arr.t !== "array") return out; // the type was already reported
    arr.items.forEach((el, index) => { // each element
      const p = `${path}[${index}]`; // its path
      if (el.t !== "string") { this.add("wrong-type", "error", p, el.line, { want: "string", got: el.t }); return; } // not a string
      const parse = parseRequirement(el.v); // the dependency specifier
      out.push({ index, text: el.v, line: el.line, parse, extra: "" }); // kept
      if (!parse.ok) { this.add(invalidCode, "error", p, el.line, { code: parse.error.code, at: parse.error.at + 1, clause: parse.versionClause }); return; } // invalid
      const r = parse.req; // the requirement
      for (const c of r.specifier?.clauses ?? []) { // each clause
        if (c.op === "==" && !c.wildcard) this.add("requirement-strict-pin", "warning", p, el.line, { clause: c.text }); // "strongly discouraged" for published distributions
        if (c.op === "===") this.add("requirement-arbitrary", "warning", p, el.line, { clause: c.text }); // "heavily discouraged"
      } // clauses
      if (r.parenthesized) this.add("requirement-parenthesized", "note", p, el.line); // PEP 345 style: accepted, not generated
      if (r.url !== null) { // a direct reference
        this.add("requirement-direct-url", "warning", p, el.line, { url: r.url }); // index servers SHOULD NOT allow it
        if (r.url.includes(";")) this.add("requirement-url-semicolon", "warning", p, el.line, { url: r.url }); // a ";" with no space before it belongs to the URL
        const issue = urlIssue(r.url, r.urlScheme, r.urlHasHash); // the direct-reference rules
        if (issue) this.add("requirement-url-unverified", "warning", p, el.line, { scheme: r.urlScheme, issue }); // SHOULD use a secure transport and carry a hash (or a commit hash)
      } // url
      for (const x of r.extrasToNormalize) this.add("requirement-extra-name", "warning", p, el.line, { extra: x.written, normalized: x.normalized }); // PEP 685
      for (const f of r.markerFindings) this.add("requirement-marker", MARKER_NOTES.has(f.code) ? "note" : "warning", p, el.line, { marker: f.code, text: f.text, ...f.params }); // the marker rules (SHOULD / SHOULD NOT / MAY error: warning; MAY accept: note)
      if (this.projectName && r.normalizedName === this.projectName) { // a self reference
        this.add("self-reference", "note", p, el.line, { extras: r.extras.join(", ") }); // documented as supported
        for (const e of r.extras) if (!this.extras.has(normalizeName(e))) this.add("self-extra-unknown", "warning", p, el.line, { extra: e }); // an extra the project does not define
      } // self reference
    }); // elements
    return out; // parsed
  } // requirements

  /**
   * Explain the whole document.
   * @param root the root table
   */
  run(root: TomlTable): void {
    // The three specified tables in a fixed order, then dependency-groups, then everything else in file order.
    const bs = root.entries.get("build-system"); // [build-system]
    const project = root.entries.get("project"); // [project]
    const groups = root.entries.get("dependency-groups"); // [dependency-groups]
    const tool = root.entries.get("tool"); // [tool]
    if (project && project.t === "table") this.preReadProject(project); // the name and extras, needed by other tables
    this.buildSystem(bs); // [build-system]
    this.project(project); // [project]
    if (groups !== undefined) this.dependencyGroups(groups); // [dependency-groups]
    if (tool !== undefined) this.tool(tool); // [tool]
    for (const [k, v] of root.entries) { // anything else
      if (k === "build-system" || k === "project" || k === "dependency-groups" || k === "tool") continue; // handled
      this.add("unknown-top-level", "warning", k, v.line, { key: k }); // reserved for future use
      const it = this.item(k, v, "other"); // an item
      if (v.t === "table") it.keys = [...v.entries].map(([kk, vv]) => ({ key: kk, type: vv.t, line: vv.line })); // its keys
      this.sections.push({ id: "other", name: k, present: true, line: v.line, items: [it] }); // listed
    } // others
  } // run

  /**
   * Read the name and the extras before anything else (requirement checks need them).
   * @param project the [project] table
   */
  preReadProject(project: TomlTable): void {
    // Only well-typed values.
    const n = project.entries.get("name"); // the name
    if (n && n.t === "string") this.projectName = normalizeName(n.v); // normalized
    const od = project.entries.get("optional-dependencies"); // the extras
    if (od && od.t === "table") for (const k of od.entries.keys()) this.extras.add(normalizeName(k)); // normalized
  } // preReadProject

  /**
   * [build-system].
   * @param v the table, or undefined
   */
  buildSystem(v: TomlValue | undefined): void {
    // Absent: the setuptools default applies.
    if (v === undefined) { this.add("no-build-system", "note", "build-system", 0); this.sections.push({ id: "build-system", name: "build-system", present: false, line: 0, items: [] }); return; } // default
    if (!this.expect(v, "table", "build-system")) return; // wrong type
    const t = v as TomlTable; // the table
    const sec: Section = { id: "build-system", name: "build-system", present: true, line: t.line, items: [] }; // the section
    this.sections.push(sec); // listed
    const req = t.entries.get("requires"); // requires
    if (req === undefined) this.add("bs-requires-missing", "error", "build-system.requires", t.line); // mandatory in the table
    else if (this.expect(req, "array", "build-system.requires")) { // an array
      const it = this.item("build-system.requires", req, "bs.requires"); // the item
      it.requirements = this.requirements(req, "build-system.requires", "bs-requirement-invalid"); // each requirement
      sec.items.push(it); // listed
    } // requires
    const be = t.entries.get("build-backend"); // build-backend
    if (be === undefined) this.add("bs-backend-missing", "note", "build-system.build-backend", t.line); // the legacy behaviour
    else if (this.expect(be, "string", "build-system.build-backend")) { // a string
      const it = this.item("build-system.build-backend", be, "bs.build-backend"); // the item
      it.reference = parseObjectReference((be as { v: string }).v); // PEP 517 grammar (no spaces)
      if (!it.reference.valid) this.add("bs-backend-invalid", "error", "build-system.build-backend", be.line, { value: (be as { v: string }).v }); // malformed
      this.summary.backend = (be as { v: string }).v; // headline
      sec.items.push(it); // listed
    } // build-backend
    const bp = t.entries.get("backend-path"); // backend-path
    if (bp !== undefined && this.expect(bp, "array", "build-system.backend-path")) { // an array
      sec.items.push(this.item("build-system.backend-path", bp, "bs.backend-path")); // listed
      (bp as { items: TomlValue[] }).items.forEach((el, i) => { // each directory
        const p = `build-system.backend-path[${i}]`; // its path
        if (el.t !== "string") { this.add("wrong-type", "error", p, el.line, { want: "string", got: el.t }); return; } // not a string
        const segs = el.v.replace(/\\/g, "/").split("/"); // path segments
        if (el.v.startsWith("/") || el.v.startsWith("\\") || /^[A-Za-z]:/.test(el.v) || segs.includes("..")) this.add("bs-backend-path-outside", "error", p, el.line, { value: el.v }); // outside the source tree
      }); // directories
    } // backend-path
    for (const [k, vv] of t.entries) if (k !== "requires" && k !== "build-backend" && k !== "backend-path") this.add("bs-unknown-key", "warning", `build-system.${k}`, vv.line, { key: k }); // not specified
  } // buildSystem

  /**
   * [project].
   * @param v the table, or undefined
   */
  project(v: TomlValue | undefined): void {
    // Absent: the back-end provides everything.
    if (v === undefined) { this.add("no-project", "note", "project", 0); this.sections.push({ id: "project", name: "project", present: false, line: 0, items: [] }); return; } // dynamic
    if (!this.expect(v, "table", "project")) return; // wrong type
    const t = v as TomlTable; // the table
    const sec: Section = { id: "project", name: "project", present: true, line: t.line, items: [] }; // the section
    this.sections.push(sec); // listed
    const dyn = new Set<string>(); // keys listed in dynamic
    const dv = t.entries.get("dynamic"); // dynamic
    if (dv !== undefined && this.expect(dv, "array", "project.dynamic")) { // an array
      for (const el of (dv as { items: TomlValue[] }).items) { // each entry
        if (el.t !== "string") { this.add("wrong-type", "error", "project.dynamic", el.line, { want: "string", got: el.t }); continue; } // not a string
        if (!(el.v in PROJECT_KEYS) || el.v === "dynamic") this.add("dynamic-unknown", "error", "project.dynamic", el.line, { key: el.v }); // not a [project] key
        if (dyn.has(el.v)) this.add("dynamic-duplicate", "warning", "project.dynamic", el.line, { key: el.v }); // twice
        dyn.add(el.v); // kept
      } // entries
    } // dynamic
    if (dyn.has("name")) this.add("name-dynamic", "error", "project.dynamic", dv?.line ?? t.line); // MUST raise an error
    if (!t.entries.has("name")) this.add("name-missing", "error", "project.name", t.line); // the only key required statically
    if (!t.entries.has("version") && !dyn.has("version")) this.add("version-missing", "error", "project.version", t.line); // required, statically or dynamic
    for (const k of dyn) { // static and dynamic at once
      if (k === "name" || !(k in PROJECT_KEYS) || !t.entries.has(k)) continue; // reported elsewhere, or not static
      const line = t.entries.get(k)?.line ?? t.line; // where the static value is
      if (EXTENSIBLE_KEYS.has(k)) this.add("static-and-dynamic-extensible", "note", `project.${k}`, line, { key: k }); // allowed: append only
      else this.add("static-and-dynamic", "error", `project.${k}`, line, { key: k }); // MUST raise an error
    } // dynamic overlap
    this.summary.versionDynamic = dyn.has("version"); // headline
    for (const [k, val] of t.entries) { // each key, in file order
      const path = `project.${k}`; // its path
      const spec = PROJECT_KEYS[k]; // what the specification says about it
      if (!spec) { this.add("unknown-project-key", "error", path, val.line, { key: k }); sec.items.push(this.item(path, val, "other")); continue; } // not allowed
      if (!this.expect(val, spec.type, path)) continue; // wrong type
      const it = this.item(path, val, spec.known, spec.core); // the item
      it.dynamic = dyn.has(k); // also dynamic
      this.projectKey(k, val, it, t); // the key's own checks
      sec.items.push(it); // listed
    } // keys
  } // project

  /**
   * The checks of one [project] key.
   * @param k the key
   * @param v its value (type already checked)
   * @param it its item (filled in)
   * @param project the [project] table
   */
  projectKey(k: string, v: TomlValue, it: Item, project: TomlTable): void {
    // One branch per key.
    const path = it.path; // shorthand
    switch (k) { // by key
      case "name": { // the name
        const s = (v as { v: string }).v; // the text
        const c = checkName(s); // the name format
        this.summary.name = s; // headline
        this.summary.normalizedName = c.normalized; // headline
        if (!c.valid) this.add("name-invalid", "error", path, v.line, { problem: c.problem ?? "", at: c.at + 1 }); // not a valid name
        else if (c.normalized !== s) this.add("name-not-normalized", "note", path, v.line, { normalized: c.normalized }); // tools SHOULD normalize it when read
        break; // done
      } // name
      case "version": { // the version
        const s = (v as { v: string }).v; // the text
        const p = parseVersion(s); // PEP 440
        this.summary.version = s; // headline
        if (!p.ok) { this.add("version-invalid", "error", path, v.line, { code: p.error.code, at: p.error.at + 1 }); break; } // invalid
        it.version = p.version; // parsed
        if (p.version.normalized !== s) this.add("version-not-normalized", "warning", path, v.line, { normalized: p.version.normalized }); // SHOULD prefer normalized
        if (p.version.local) this.add("version-local", "note", path, v.line); // a local label
        break; // done
      } // version
      case "description": // one line
        if ((v as { v: string }).v.includes("\n")) this.add("description-multiline", "warning", path, v.line); // tools MAY error
        break; // done
      case "readme": this.readme(v, it); break; // the README
      case "requires-python": { // a specifier set
        const s = (v as { v: string }).v; // the text
        const p = parseSpecifierSet(s); // version specifiers
        it.specifier = p; // parsed
        this.summary.requiresPython = s; // headline
        if (!p.ok) this.add("requires-python-invalid", "error", path, v.line, { clause: p.errors[0]?.text ?? "", code: p.errors[0]?.code ?? "" }); // invalid
        break; // done
      } // requires-python
      case "license": this.license(v, it, project); break; // license
      case "license-files": { // globs
        const arr = (v as { items: TomlValue[] }).items; // the patterns
        if (arr.length === 0) this.add("license-files-empty", "note", path, v.line); // no license files at all
        arr.forEach((el, i) => { // each pattern
          if (el.t !== "string") { this.add("wrong-type", "error", `${path}[${i}]`, el.line, { want: "string", got: el.t }); return; } // not a string
          const why = globProblem(el.v); // the glob rules
          if (why) this.add("license-files-invalid", "error", `${path}[${i}]`, el.line, { pattern: el.v, why }); // invalid
        }); // patterns
        break; // done
      } // license-files
      case "authors": case "maintainers": this.people(k, v, it); break; // people
      case "keywords": case "classifiers": { // arrays of strings
        (v as { items: TomlValue[] }).items.forEach((el, i) => { // each element
          if (el.t !== "string") { this.add("wrong-type", "error", `${path}[${i}]`, el.line, { want: "string", got: el.t }); return; } // not a string
          if (k === "classifiers" && el.v.startsWith("License ::")) this.add("license-classifier", "warning", `${path}[${i}]`, el.line, { classifier: el.v }); // deprecated by PEP 639
        }); // elements
        break; // done
      } // keywords, classifiers
      case "urls": { // labels and URLs
        it.urls = []; // collected
        for (const [label, u] of (v as TomlTable).entries) { // each label
          if (u.t !== "string") { this.add("wrong-type", "error", `${path}.${label}`, u.line, { want: "string", got: u.t }); continue; } // not a string
          const normalized = normalizeUrlLabel(label); // the consumer's normalization
          const wellKnown = WELL_KNOWN_URLS[normalized] ?? ""; // a well-known label
          it.urls.push({ label, url: u.v, normalized, wellKnown, line: u.line }); // kept
          if (label.length > 32) this.add("url-label-long", "error", `${path}.${label}`, u.line, { label, length: label.length }); // limited to 32 characters
          if (!/^[A-Za-z][A-Za-z0-9+.-]*:/.test(u.v)) this.add("url-no-scheme", "warning", `${path}.${label}`, u.line, { url: u.v }); // not a browsable URL
        } // labels
        break; // done
      } // urls
      case "scripts": case "gui-scripts": it.entries = this.entryGroup(v as TomlTable, path); break; // console_scripts, gui_scripts
      case "entry-points": { // groups of entry points
        it.entries = []; // flattened, "group/name"
        for (const [group, g] of (v as TomlTable).entries) { // each group
          const gp = `${path}.${group}`; // its path
          if (g.t !== "table") { this.add("wrong-type", "error", gp, g.line, { want: "table", got: g.t }); continue; } // not a table
          if (group === "console_scripts" || group === "gui_scripts") this.add("entry-points-reserved-group", "error", gp, g.line, { group }); // MUST raise an error
          if (!/^\w+(\.\w+)*$/.test(group)) this.add("entry-points-group-name", "error", gp, g.line, { group }); // the group-name pattern (anchored; \w runs separated by literal dots: linear)
          for (const e of this.entryGroup(g, gp)) it.entries.push({ ...e, name: `${group} / ${e.name}` }); // its entries
        } // groups
        break; // done
      } // entry-points
      case "dependencies": { // the dependencies
        it.requirements = this.requirements(v, path); // each one
        this.summary.dependencies = it.requirements.length; // headline
        break; // done
      } // dependencies
      case "optional-dependencies": { // extras
        const seen = new Map<string, string>(); // normalized to written
        it.requirements = []; // flattened, extra by extra
        for (const [extra, list] of (v as TomlTable).entries) { // each extra
          const ep = `${path}.${extra}`; // its path
          const c = checkName(extra); // a name at least
          if (!c.valid) this.add("extra-invalid", "error", ep, list.line, { extra }); // not even a name
          else if (!isStrictExtraName(extra)) this.add("extra-not-normalized", "warning", ep, list.line, { extra, normalized: c.normalized }); // core metadata 2.3 form
          const norm = normalizeName(extra); // normalized
          if (seen.has(norm)) this.add("extra-clash", "error", ep, list.line, { extra, other: seen.get(norm) ?? "" }); // clash after normalization
          seen.set(norm, extra); // kept
          this.summary.extras.push(extra); // headline
          if (!this.expect(list, "array", ep)) continue; // must be an array
          for (const r of this.requirements(list, ep)) it.requirements.push({ ...r, extra }); // each requirement, with its extra
          (it.extras ??= []).push({ name: extra, normalized: norm, count: (list as { items: TomlValue[] }).items.length, line: list.line }); // the extra and its size
        } // extras
        break; // done
      } // optional-dependencies
      case "import-names": case "import-namespaces": { // PEP 794
        const arr = (v as { items: TomlValue[] }).items; // the names
        if (k === "import-namespaces" && arr.length === 0) this.add("import-namespaces-empty", "error", path, v.line); // CANNOT be empty
        arr.forEach((el, i) => { // each name
          if (el.t !== "string") { this.add("wrong-type", "error", `${path}[${i}]`, el.line, { want: "string", got: el.t }); return; } // not a string
          const semi = el.v.indexOf(";"); // an optional "; private"
          const nm = (semi < 0 ? el.v : el.v.slice(0, semi)).trim(); // the name
          const mod = semi < 0 ? "" : el.v.slice(semi + 1).trim(); // the modifier
          const okName = (k === "import-names" && nm === "" && semi < 0) || isDottedIdentifier(nm); // an identifier (import-names may hold an empty string)
          if (!okName || (semi >= 0 && mod !== "private")) this.add("import-name-invalid", "error", `${path}[${i}]`, el.line, { value: el.v }); // invalid
        }); // names
        const other = project.entries.get(k === "import-names" ? "import-namespaces" : "import-names"); // the other key
        if (k === "import-names" && other && other.t === "array") { // check overlap once
          const names = (arr.filter((x) => x.t === "string") as Array<{ v: string }>).map((x) => x.v.split(";")[0].trim()); // names
          for (const o of other.items) if (o.t === "string" && names.includes(o.v.split(";")[0].trim())) this.add("import-name-both", "error", path, v.line, { name: o.v.split(";")[0].trim() }); // MUST raise an error
        } // overlap
        break; // done
      } // import names
      case "dynamic": break; // handled before the loop
    } // switch
  } // projectKey

  /**
   * readme: a path or a table.
   * @param v the value
   * @param it the item
   */
  readme(v: TomlValue, it: Item): void {
    // A string is a path whose suffix gives the content type.
    const path = it.path; // shorthand
    if (v.t === "string") { // a path
      const lower = v.v.toLowerCase(); // suffixes compare case-insensitively
      const ct = lower.endsWith(".md") ? "text/markdown" : lower.endsWith(".rst") ? "text/x-rst" : ""; // the two suffixes
      it.readme = { kind: "file", file: v.v, contentType: ct, inferred: true }; // resolved
      if (!ct) this.add("readme-suffix", "error", path, v.line, { file: v.v }); // MUST raise an error (a tool MAY know more suffixes)
      return; // done
    } // string
    const t = v as TomlTable; // a table
    const file = t.entries.get("file"); // file
    const text = t.entries.get("text"); // text
    const ctv = t.entries.get("content-type"); // content-type
    if (file && text) this.add("readme-both", "error", path, t.line); // mutually exclusive
    if (!file && !text) this.add("readme-neither", "error", path, t.line); // nothing to describe
    for (const [kk, vv] of [["file", file], ["text", text], ["content-type", ctv]] as Array<[string, TomlValue | undefined]>) if (vv && vv.t !== "string") this.add("wrong-type", "error", `${path}.${kk}`, vv.line, { want: "string", got: vv.t }); // strings
    if (!ctv) { this.add("readme-content-type-missing", "error", path, t.line); } // MUST raise an error
    const ctText = ctv && ctv.t === "string" ? ctv.v : ""; // the content type
    it.readme = { kind: file ? "file" : "text", file: file && file.t === "string" ? file.v : "", contentType: ctText, inferred: false }; // resolved
    if (ctText) { // check it against core metadata
      const parts = ctText.split(";").map((x) => x.trim()); // type and parameters
      const base = parts[0].toLowerCase(); // type/subtype
      if (!["text/plain", "text/x-rst", "text/markdown"].includes(base)) this.add("readme-content-type-unsupported", "error", `${path}.content-type`, ctv!.line, { value: ctText }); // MUST raise an error
      for (const prm of parts.slice(1)) { // parameters
        const [pk, pv = ""] = prm.split("=").map((x) => x.trim()); // name and value
        if (pk.toLowerCase() === "charset" && pv.toUpperCase() !== "UTF-8") this.add("readme-charset", "warning", `${path}.content-type`, ctv!.line, { charset: pv }); // only UTF-8 is legal (tools MAY support others)
        if (pk.toLowerCase() === "variant" && base === "text/markdown" && pv !== "GFM" && pv !== "CommonMark") this.add("readme-variant", "note", `${path}.content-type`, ctv!.line, { variant: pv }); // assumed GFM
      } // parameters
    } // content type
  } // readme

  /**
   * license: an SPDX expression, or the deprecated table.
   * @param v the value
   * @param it the item
   * @param project the [project] table (for classifiers)
   */
  license(v: TomlValue, it: Item, project: TomlTable): void {
    // The string form is an SPDX expression.
    const path = it.path; // shorthand
    const cls = project.entries.get("classifiers"); // classifiers
    const hasLicenseClassifier = !!cls && cls.t === "array" && cls.items.some((x) => x.t === "string" && x.v.startsWith("License ::")); // License :: classifiers
    if (v.t === "string") { // an expression
      it.coreField = "License-Expression"; // the field
      const c = checkLicenseExpression(v.v); // the check
      it.license = c; // kept
      if (!c.valid) this.add("license-invalid", "error", path, v.line, { code: c.error?.code ?? "", token: c.error?.token ?? "" }); // invalid
      else { // valid
        if (c.canonical !== v.v) this.add("license-not-canonical", "note", path, v.line, { canonical: c.canonical }); // case normalization
        for (const d of c.deprecated) this.add("license-deprecated-id", "warning", path, v.line, { id: d }); // deprecated on the SPDX list
      } // valid
      if (hasLicenseClassifier) this.add("license-classifier-with-expression", "warning", path, v.line); // MAY raise an error
      return; // done
    } // string
    const t = v as TomlTable; // the legacy table
    it.coreField = "License"; // the old field
    this.add("license-table", "warning", path, t.line); // deprecated by PEP 639
    if (t.entries.has("file") && t.entries.has("text")) this.add("license-table-both", "error", path, t.line); // mutually exclusive
  } // license

  /**
   * authors or maintainers.
   * @param k which key
   * @param v the array
   * @param it the item
   */
  people(k: string, v: TomlValue, it: Item): void {
    // Each element is a table with name and/or email.
    const role = k === "authors" ? "Author" : "Maintainer"; // the core metadata field prefix
    it.people = []; // collected
    (v as { items: TomlValue[] }).items.forEach((el, i) => { // each person
      const p = `${it.path}[${i}]`; // its path
      if (el.t !== "table") { this.add("wrong-type", "error", p, el.line, { want: "table", got: el.t }); return; } // not a table
      const name = el.entries.get("name"); // name
      const email = el.entries.get("email"); // email
      if (!name && !email) this.add("person-empty", "error", p, el.line); // at least one key
      for (const [kk, vv] of el.entries) { // each key
        if (kk !== "name" && kk !== "email") this.add("person-unknown-key", "warning", `${p}.${kk}`, vv.line, { key: kk }); // only name and email
        else if (vv.t !== "string") this.add("wrong-type", "error", `${p}.${kk}`, vv.line, { want: "string", got: vv.t }); // strings
      } // keys
      const n = name && name.t === "string" ? name.v : ""; // the name
      const e = email && email.t === "string" ? email.v : ""; // the email
      if (n.includes(",")) this.add("person-name-comma", "error", `${p}.name`, name!.line, { name: n }); // MUST not contain commas
      if (email && email.t === "string" && !emailLooksValid(e)) this.add("person-email-invalid", "warning", `${p}.email`, email.line, { email: e }); // MUST be a valid email address (only the basic shape is checked here, so a warning)
      const field = e ? `${role}-email` : role; // where it goes
      it.people!.push({ name: n, email: e, field, line: el.line }); // kept
    }); // people
  } // people

  /**
   * One entry-point group (scripts, gui-scripts, or a group of entry-points).
   * @param t the table
   * @param path its path
   * @returns the entries
   */
  entryGroup(t: TomlTable, path: string): Array<{ name: string; value: string; ref: ObjectReference; line: number }> {
    // name = "module:object".
    const out: Array<{ name: string; value: string; ref: ObjectReference; line: number }> = []; // entries
    for (const [name, val] of t.entries) { // each entry
      const p = `${path}.${name}`; // its path
      if (val.t === "table") { this.add("entry-points-nested", "error", p, val.line, { name }); continue; } // one level only
      if (val.t !== "string") { this.add("wrong-type", "error", p, val.line, { want: "string", got: val.t }); continue; } // not a string
      const ref = parseObjectReference(val.v, true); // the object reference (spaces around ":" ignored)
      out.push({ name, value: val.v, ref, line: val.line }); // kept
      if (!ref.valid) this.add("entry-point-reference", "error", p, val.line, { value: val.v }); // not module or module:attr
      if (name.includes("=") || name.startsWith("[") || name !== name.trim()) this.add("entry-point-name", "error", p, val.line, { name }); // forbidden
      else if (!/^[\w.-]+$/.test(name)) this.add("entry-point-name", "warning", p, val.line, { name }); // not the recommended characters
    } // entries
    return out; // the entries
  } // entryGroup

  /**
   * [dependency-groups].
   * @param v the table
   */
  dependencyGroups(v: TomlValue): void {
    // Each key is a group; each value a list of requirements and includes.
    if (!this.expect(v, "table", "dependency-groups")) return; // wrong type
    const t = v as TomlTable; // the table
    const sec: Section = { id: "dependency-groups", name: "dependency-groups", present: true, line: t.line, items: [] }; // the section
    this.sections.push(sec); // listed
    const byNorm = new Map<string, string>(); // normalized to written
    const includes = new Map<string, string[]>(); // normalized group to normalized includes
    for (const [g, list] of t.entries) { // each group
      const path = `dependency-groups.${g}`; // its path
      const c = checkName(g); // a valid name
      if (!c.valid) this.add("group-name-invalid", "error", path, list.line, { group: g }); // invalid
      const norm = normalizeName(g); // normalized
      if (byNorm.has(norm)) this.add("group-duplicate", "warning", path, list.line, { group: g, other: byNorm.get(norm) ?? "" }); // SHOULD emit an error
      if (!byNorm.has(norm)) byNorm.set(norm, g); // the first spelling is kept
      this.summary.groups.push(g); // headline
      if (this.extras.has(norm)) this.add("group-matches-extra", "warning", path, list.line, { group: g }); // users are advised to avoid it
      if (!this.expect(list, "array", path)) continue; // must be an array
      const it = this.item(path, list, "dg.group"); // the item
      const inc: string[] = []; // includes
      it.requirements = []; // requirements
      (list as { items: TomlValue[] }).items.forEach((el, i) => { // each element
        const p = `${path}[${i}]`; // its path
        if (el.t === "table") { // an include
          const ig = el.entries.get("include-group"); // the target
          if (el.entries.size !== 1 || !ig || ig.t !== "string") { this.add("group-item-invalid", "warning", p, el.line); return; } // exactly one key, a string
          inc.push(normalizeName(ig.v)); // normalized
          return; // done
        } // include
        if (el.t !== "string") { this.add("group-item-invalid", "warning", p, el.line); return; } // neither
        const parse = parseRequirement(el.v); // a dependency specifier
        it.requirements!.push({ index: i, text: el.v, line: el.line, parse, extra: "" }); // kept
        if (!parse.ok) this.add("requirement-invalid", "error", p, el.line, { code: parse.error.code, at: parse.error.at + 1, clause: parse.versionClause }); // MUST be valid
      }); // elements
      it.group = { normalized: norm, includes: inc }; // the group
      if (!includes.has(norm)) includes.set(norm, inc); // for the graph (a duplicate group keeps the first one's includes)
      sec.items.push(it); // listed
    } // groups
    for (const [g, inc] of includes) for (const target of inc) if (!includes.has(target) && !byNorm.has(target)) this.add("group-include-unknown", "error", `dependency-groups.${byNorm.get(g) ?? g}`, t.entries.get(byNorm.get(g) ?? g)?.line ?? t.line, { target }); // no such group
    const state = new Map<string, number>(); // 1 visiting, 2 done
    /** Depth-first search for a cycle; returns the cycle path or null. */
    const visit = (g: string, stack: string[]): string[] | null => { // DFS
      if (state.get(g) === 2) return null; // done
      if (state.get(g) === 1) return [...stack.slice(stack.indexOf(g)), g]; // back to itself
      state.set(g, 1); // visiting
      for (const n of includes.get(g) ?? []) { if (!includes.has(n)) continue; const c = visit(n, [...stack, g]); if (c) return c; } // each include
      state.set(g, 2); // done
      return null; // no cycle
    }; // visit
    for (const g of includes.keys()) { const c = visit(g, []); if (c) { const name = byNorm.get(c[0]) ?? c[0]; this.add("group-cycle", "error", `dependency-groups.${name}`, t.entries.get(name)?.line ?? t.line, { cycle: c.join(" -> ") }); break; } } // MUST NOT include cycles (reported once)
  } // dependencyGroups

  /**
   * [tool].
   * @param v the table
   */
  tool(v: TomlValue): void {
    // One item per tool sub-table.
    if (!this.expect(v, "table", "tool")) return; // wrong type
    const t = v as TomlTable; // the table
    const sec: Section = { id: "tool", name: "tool", present: true, line: t.line, items: [] }; // the section
    this.sections.push(sec); // listed
    for (const [name, sub] of t.entries) { // each tool
      const path = `tool.${name}`; // its path
      this.summary.tools.push(name); // headline
      if (sub.t !== "table") { this.add("tool-not-table", "warning", path, sub.line, { name }); sec.items.push(this.item(path, sub, "tool.table")); continue; } // should be a sub-table
      const it = this.item(path, sub, "tool.table"); // the item
      it.keys = [...sub.entries].map(([k, vv]) => ({ key: k, type: vv.t === "array" && vv.aot ? "array-of-tables" : vv.t, line: vv.line })); // its keys
      sec.items.push(it); // listed
    } // tools
  } // tool
} // Explainer

// ---------------------------------------------------------------------------
// Entry points
// ---------------------------------------------------------------------------

/**
 * Explain and check a pyproject.toml.
 * @param input the file's text
 * @returns the explanation and the findings
 */
export function explainPyproject(input: string): PyprojectResult {
  // Bounds and empty input first.
  const empty: PyprojectResult = { status: "empty", toml: null, tomlError: null, sections: [], findings: [], counts: { error: 0, warning: 0, note: 0 }, summary: new Explainer().summary }; // nothing yet
  if (input.length > MAX_TOML_CHARS) return { ...empty, status: "too-long" }; // refused
  if (input.trim() === "") return empty; // nothing
  const parsed = parseToml(input); // TOML
  if (!parsed.ok) return { ...empty, status: "toml-error", tomlError: parsed.error, counts: { error: 1, warning: 0, note: 0 } }; // not TOML: the TOML error is the one error
  const ex = new Explainer(); // the explainer
  if (parsed.version === "1.1.0") ex.add("toml-1-1", "warning", "", parsed.features[0]?.line ?? 1, { features: [...new Set(parsed.features.map((f) => f.feature))].join(", "), line: parsed.features[0]?.line ?? 1 }); // newer syntax
  ex.run(parsed.root); // everything
  const order: Record<Severity, number> = { error: 0, warning: 1, note: 2 }; // severity order
  const findings = [...ex.findings].sort((a, b) => order[a.severity] - order[b.severity] || a.line - b.line); // errors first, then by line (stable)
  const counts = { error: 0, warning: 0, note: 0 }; // tallies
  for (const f of findings) counts[f.severity]++; // counted
  return { status: "ok", toml: { version: parsed.version, features: parsed.features, crlf: parsed.crlf }, tomlError: null, sections: ex.sections, findings, counts, summary: ex.summary }; // the answer
} // explainPyproject

/**
 * run: the registry-facing entry point (the file's text in, the explanation out).
 * @param input the pyproject.toml text
 * @returns the result
 */
export function run(input: string): PyprojectResult {
  // The same engine.
  return explainPyproject(input); // explained
} // run

export { MAX_TOML_CHARS }; // re-exported for the page
