// ============================================================================
// src/lib/tools/pyproject-toml-explainer/index.ts
// ----------------------------------------------------------------------------
// Public surface + the D-49 declarative manifest for the pyproject.toml
// explainer: the file read with the site's own TOML parser (1.0.0, and 1.1.0
// with a warning), explained table by table and key by key, and checked
// against the pyproject.toml, core metadata, dependency specifier, version
// specifier, entry points, glob pattern, license expression and dependency
// groups specifications, each finding labelled error (MUST), warning (SHOULD)
// or note.
//
// Every source below was downloaded with curl on 2026-10-27 (generic
// User-Agent, no-cache headers, a cache-busting query) and answered HTTP 200;
// the files and the status log are in the build's work folder.
// ============================================================================

import { run, type PyprojectResult } from "./compute"; // the engine
import { GOLDEN_VECTOR_SET_ID, TOML_VECTORS, REQUIREMENT_VECTORS, LICENSE_VECTORS, EXPLAIN_VECTORS, API_EXAMPLE } from "./golden-vectors"; // the vectors

// The engine, re-exported for the component and the registry.
export { run, explainPyproject, display, normalizeUrlLabel, globProblem, urlIssue, PROJECT_KEYS, EXTENSIBLE_KEYS, WELL_KNOWN_URLS, MAX_TOML_CHARS } from "./compute"; // values
export type { PyprojectResult, Section, Item, Finding, FindingCode, Severity, KnownKey, RequirementItem } from "./compute"; // types
export { parseToml, MAX_TOML_DEPTH } from "./toml"; // TOML
export type { TomlValue, TomlTable, TomlError, TomlErrorCode, Toml11Feature, TomlVersion } from "./toml"; // TOML types
export { parseRequirement, markerToString, FIELD_TYPE } from "./pep508"; // dependency specifiers
export type { Requirement, RequirementParse, RequirementErrorCode, MarkerNode, MarkerOperand, MarkerFinding, MarkerFindingCode } from "./pep508"; // their types
export { checkLicenseExpression } from "./license"; // license expressions
export type { LicenseCheck, LicenseErrorCode } from "./license"; // their types
export { SPDX_LIST_VERSION, SPDX_LIST_DATE } from "./spdx"; // the SPDX list
export { EXAMPLE_PYPROJECT } from "./example"; // the page's Example
// The vectors, re-exported by the conventional names.
export { GOLDEN_VECTOR_SET_ID, TOML_VECTORS, REQUIREMENT_VECTORS, LICENSE_VECTORS, EXPLAIN_VECTORS, API_EXAMPLE, verifyVectors } from "./golden-vectors"; // vectors and their runner

/** The D-49 declarative manifest. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Python", // must equal the catalogue family (D-73)
  toolSlug: "pyproject-toml-explainer", // the route segment and API path
  canonicalAliases: [
    "pyproject.toml", // the file
    "pyproject validator", // what people search for
    "build-system requires", // the table people ask about
    "project metadata", // the [project] table
    "pep 621", // the PEP
    "toml parser", // the format
  ],
  // A pyproject.toml starts (after comments and blank lines) with one of the specified tables. Anchored; the comment
  // run is (#[^\n]*\n\s*)* whose pieces start with "#", so it cannot overlap itself: linear.
  inputDetectors: [
    {
      kind: "regex", // a pattern
      pattern: "^\\s*(?:#[^\\n]*\\n\\s*)*\\[(?:build-system|project|dependency-groups|tool\\.[A-Za-z0-9_.-]+)\\]", // the first table header
      priority: 3, // these headers are pyproject.toml's own
      example: API_EXAMPLE, // golden vector EXPLAIN_VECTORS "minimal"; also the OpenAPI example
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser", // runs client-side
  executionClass: ["localOnly"], // a TOML parse and string checks; no network, no clock, no randomness
  apiCapabilityClass: "local-equivalent", // the API runs the same engine on the file's text

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID, // the set id
  goldenVectorCount: TOML_VECTORS.length + REQUIREMENT_VECTORS.length + LICENSE_VECTORS.length + EXPLAIN_VECTORS.length, // every row
  dangerousInputHandling: [
    "length-bound", // at most 500,000 characters
    "depth-guard", // at most 100 nested arrays and inline tables
    "bounded-parse", // hand-written scanners, one pass per value; no regular expression with nested quantifiers
    "redos-guard", // the few patterns are anchored single-class runs
    "never-fetches", // URLs, files named in readme and license-files, and build requirements are read as text only
    "never-executes", // the build back-end is named, never imported
  ],
  shareSafetyDefault: "fragment", // a project file can name private indexes, internal URLs and people

  // -- Teaching & provenance --
  learnLinks: ["learn/python-environments-and-packaging"], // pyproject.toml, wheels, PEP 440
  relatedTools: ["wheel-filename-explainer", "python-playground"], // file names and versions; Python itself
  sources: [
    { id: "ppug-pyproject", label: "Python Packaging User Guide, pyproject.toml specification", type: "specification", url: "https://packaging.python.org/en/latest/specifications/pyproject-toml/", access_date: "2026-10-27", scope: "the tables; [build-system]; every [project] key, its type, its core metadata field and its rules; dynamic and the extensible keys (PEP 808); [tool]", status: "active" },
    { id: "ppug-core-metadata", label: "Python Packaging User Guide, Core metadata specifications (version 2.6)", type: "specification", url: "https://packaging.python.org/en/latest/specifications/core-metadata/", access_date: "2026-10-27", scope: "Description-Content-Type, Project-URL (32-character labels), Provides-Extra, Import-Name, Dynamic", status: "active" },
    { id: "ppug-dependency-specifiers", label: "Python Packaging User Guide, Dependency specifiers (originally PEP 508)", type: "specification", url: "https://packaging.python.org/en/latest/specifications/dependency-specifiers/", access_date: "2026-10-27", scope: "the grammar, extras, environment markers, marker field types and comparison rules", status: "active" },
    { id: "ppug-version-specifiers", label: "Python Packaging User Guide, Version specifiers (originally PEP 440)", type: "specification", url: "https://packaging.python.org/en/latest/specifications/version-specifiers/", access_date: "2026-10-27", scope: "versions, the eight operators, direct references", status: "active" },
    { id: "ppug-names", label: "Python Packaging User Guide, Names and normalization", type: "specification", url: "https://packaging.python.org/en/latest/specifications/name-normalization/", access_date: "2026-10-27", scope: "the name format and its normalized form", status: "active" },
    { id: "ppug-entry-points", label: "Python Packaging User Guide, Entry points specification", type: "specification", url: "https://packaging.python.org/en/latest/specifications/entry-points/", access_date: "2026-10-27", scope: "object references, group and entry point names, console_scripts and gui_scripts", status: "active" },
    { id: "ppug-dependency-groups", label: "Python Packaging User Guide, Dependency Groups (originally PEP 735)", type: "specification", url: "https://packaging.python.org/en/latest/specifications/dependency-groups/", access_date: "2026-10-27", scope: "[dependency-groups], includes, cycles", status: "active" },
    { id: "ppug-well-known-urls", label: "Python Packaging User Guide, Well-known Project URLs in Metadata", type: "specification", url: "https://packaging.python.org/en/latest/specifications/well-known-project-urls/", access_date: "2026-10-27", scope: "label normalization and the well-known labels", status: "active" },
    { id: "ppug-glob", label: "Python Packaging User Guide, glob patterns", type: "specification", url: "https://packaging.python.org/en/latest/specifications/glob-patterns/", access_date: "2026-10-27", scope: "the patterns license-files accepts", status: "active" },
    { id: "ppug-license-expression", label: "Python Packaging User Guide, License Expression", type: "specification", url: "https://packaging.python.org/en/latest/specifications/license-expression/", access_date: "2026-10-27", scope: "SPDX identifiers and LicenseRef-", status: "active" },
    { id: "spdx-annex", label: "SPDX Specification 3.0.1, Annex: SPDX License Expressions", type: "specification", url: "https://spdx.github.io/spdx-spec/v3.0.1/annexes/spdx-license-expressions/", access_date: "2026-10-27", scope: "the expression grammar, operator precedence and case rules", status: "active" },
    { id: "spdx-list", label: "SPDX License List 3.29.0 of 2026-09-16 (licenses.json and exceptions.json)", type: "registry", url: "https://spdx.org/licenses/", access_date: "2026-10-27", scope: "the license and exception identifiers and which are deprecated", status: "active" },
    { id: "pep-517", label: "PEP 517, A build-system independent format for source trees (Final)", type: "pep", url: "https://peps.python.org/pep-0517/", access_date: "2026-10-27", scope: "build-backend, backend-path, the legacy setuptools behaviour", status: "active" },
    { id: "pep-621", label: "PEP 621, Storing project metadata in pyproject.toml (Final)", type: "pep", url: "https://peps.python.org/pep-0621/", access_date: "2026-10-27", scope: "the original [project] table", status: "active" },
    { id: "pep-518", label: "PEP 518, Specifying Minimum Build System Requirements for Python Projects (Final)", type: "pep", url: "https://peps.python.org/pep-0518/", access_date: "2026-10-27", scope: "the original [build-system] and [tool] tables", status: "active" },
    { id: "pep-808", label: "PEP 808, Including static values in dynamic metadata (Accepted)", type: "pep", url: "https://peps.python.org/pep-0808/", access_date: "2026-10-27", scope: "list and table keys both static and dynamic", status: "active" },
    { id: "pep-794", label: "PEP 794, Import Name Metadata (Accepted)", type: "pep", url: "https://peps.python.org/pep-0794/", access_date: "2026-10-27", scope: "import-names and import-namespaces", status: "active" },
    { id: "toml-1-0-0", label: "TOML v1.0.0 (toml.io) and its ABNF", type: "specification", url: "https://toml.io/en/v1.0.0", access_date: "2026-10-27", scope: "the whole language the parser implements", status: "active" },
    { id: "toml-1-1-0", label: "TOML v1.1.0 (toml.io), released 2025-12-18", type: "specification", url: "https://toml.io/en/v1.1.0", access_date: "2026-10-27", scope: "the four syntax additions the parser accepts with a warning", status: "active" },
    { id: "py-tomllib", label: "Python documentation (3.15), tomllib: TOML 1.1.0 from Python 3.15, 1.0.0 in 3.11 to 3.14", type: "documentation", url: "https://docs.python.org/3/library/tomllib.html", access_date: "2026-10-27", scope: "which Python versions read TOML 1.1.0", status: "active" },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }, // the site's author
  ],
});

/**
 * runTool: the registry-facing entry point (the file's text in, the explanation out).
 * @param input the pyproject.toml text
 * @returns the result
 */
export function runTool(input: string): PyprojectResult {
  // The same engine.
  return run(input); // explained
} // runTool

/** The explainer vectors, by the conventional name. */
export const goldenVectors = EXPLAIN_VECTORS; // re-exported
