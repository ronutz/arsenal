// ============================================================================
// src/lib/tools/wheel-filename-explainer/index.ts
// ----------------------------------------------------------------------------
// Public surface + the D-49 declarative manifest for the wheel filename & PEP
// 440 version explainer: a wheel or sdist file name taken apart (name, version,
// build tag, every compatibility tag and what it requires, an optional check
// against a described interpreter and system), and PEP 440 versions parsed,
// normalized, sorted and matched against a specifier set.
//
// Every source below was downloaded with curl on 2026-10-27 (generic
// User-Agent, no-cache headers, a cache-busting query) and answered HTTP 200;
// the files and the status log are in the build's work folder.
// ============================================================================

import { run, type WheelExplainResult } from "./compute"; // the engine
import { GOLDEN_VECTOR_SET_ID, VERSION_VECTORS, VERSION_REJECT_VECTORS, ORDER_VECTORS, SPEC_VECTORS, SPEC_REJECT_VECTORS, FILE_VECTORS, TARGET_VECTORS, API_EXAMPLE } from "./golden-vectors"; // the vectors

// The engine, re-exported for the component and the registry.
export { run, explainFilename, explainVersions, checkTarget, looksLikeFilename, lastSegment, MAX_INPUT_CHARS, MAX_VERSIONS, MAX_EXPANDED } from "./compute"; // values
export type { WheelExplainResult, FilenameReading, VersionsReading, VersionEntry, ExpandedTag, Finding, FindingCode } from "./compute"; // types
export { parseVersion, compareVersions, parseSpecifierSet, selectVersions, MAX_VERSION_CHARS, MAX_SPECIFIER_CHARS } from "./pep440"; // PEP 440
export type { Pep440Version, VersionNote, VersionError, VersionErrorCode, SpecClause, SpecErrorCode, SpecifierSetParse, Selection } from "./pep440"; // PEP 440 types
export { targetTags, targetPlatforms, matchTarget, PYPY_RELEASE, MAC_MULTI_ARCH } from "./tags"; // tags
export type { Target, TargetMatch, InterpreterRule, ImpossibleReason, PythonTag, AbiTag, PlatformTag } from "./tags"; // tag types
export { EXAMPLE_FILENAME, EXAMPLE_TARGET, EXAMPLE_VERSIONS, EXAMPLE_SPECIFIER } from "./example"; // the page's Example
// The vectors, re-exported by the conventional names.
export { GOLDEN_VECTOR_SET_ID, VERSION_VECTORS, FILE_VECTORS, TARGET_VECTORS, SPEC_VECTORS, API_EXAMPLE, verifyVectors } from "./golden-vectors"; // vectors and their runner

/** The D-49 declarative manifest. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Python", // must equal the catalogue family (D-73)
  toolSlug: "wheel-filename-explainer", // the route segment and API path
  canonicalAliases: [
    "wheel filename", // the obvious search
    "whl file name", // another spelling
    "compatibility tags", // what the tags are called
    "manylinux tag", // the tag people ask about most
    "pep 440 version", // the second mode
    "python version compare", // what people want to do with versions
  ],
  // A .whl file name (or the last segment of a URL to one). Anchored; [^\s/]+ then a fixed suffix: linear.
  inputDetectors: [
    {
      kind: "regex", // a pattern
      pattern: "^[^\\s/]+\\.whl$", // one token ending in .whl
      priority: 3, // unambiguous: nothing else on the site reads wheel names
      example: API_EXAMPLE, // golden vector FILE_VECTORS[0]; also the OpenAPI example
    },
    {
      kind: "regex", // a pattern
      pattern: "^[A-Za-z0-9_.]+-[0-9][A-Za-z0-9_.!+]*\\.tar\\.gz$", // name-version.tar.gz (classes exclude "-", so linear)
      priority: 6, // an sdist name: likely, but other tools read archives too
      example: "netcheck-0.1.0.tar.gz", // golden vector in FILE_VECTORS
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser", // runs client-side
  executionClass: ["localOnly"], // string scanning and comparisons; no network, no clock, no randomness
  apiCapabilityClass: "local-equivalent", // the API runs the same engine (a file name, or version mode)

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID, // the set id
  goldenVectorCount: VERSION_VECTORS.length + VERSION_REJECT_VECTORS.length + ORDER_VECTORS.length + SPEC_VECTORS.length + SPEC_REJECT_VECTORS.length + FILE_VECTORS.length + TARGET_VECTORS.length, // every row
  dangerousInputHandling: [
    "length-bound", // 20,000 characters in, 256 per version, 1,024 per specifier set, 500 versions
    "bounded-expansion", // at most 400 expanded tag triples explained (the rest counted)
    "redos-guard", // hand-written scanners; the few patterns are anchored single-class runs
    "never-fetches", // a URL is only cut to its last segment; nothing is downloaded
  ],
  shareSafetyDefault: "param", // file names and versions are not sensitive

  // -- Teaching & provenance --
  learnLinks: ["learn/python-environments-and-packaging"], // sdists, wheels, file names, PEP 440
  relatedTools: ["pyproject-toml-explainer", "python-playground"], // the project file, and Python itself
  sources: [
    { id: "ppug-bdist", label: "Python Packaging User Guide, Binary distribution format (the wheel file name convention, escaping, build tag)", type: "specification", url: "https://packaging.python.org/en/latest/specifications/binary-distribution-format/", access_date: "2026-10-27", scope: "the six file name parts; the build tag (starts with a digit, sorts as int then str, not for releases referenced externally); name escaping (normalized, '-' as '_', '.' and upper case accepted from older files); normalized versions", status: "active" },
    { id: "ppug-sdist", label: "Python Packaging User Guide, Source distribution format (file name, PEP 625)", type: "specification", url: "https://packaging.python.org/en/latest/specifications/source-distribution-format/", access_date: "2026-10-27", scope: "{name}-{version}.tar.gz; precisely one hyphen", status: "active" },
    { id: "ppug-tags", label: "Python Packaging User Guide, Platform compatibility tags", type: "specification", url: "https://packaging.python.org/en/latest/specifications/platform-compatibility-tags/", access_date: "2026-10-27", scope: "python, ABI and platform tags; manylinux, musllinux, macOS, Android and iOS tags; compressed tag sets; how installers use their tag list", status: "active" },
    { id: "ppug-names", label: "Python Packaging User Guide, Names and normalization", type: "specification", url: "https://packaging.python.org/en/latest/specifications/name-normalization/", access_date: "2026-10-27", scope: "the name format and the normalized form", status: "active" },
    { id: "ppug-versions", label: "Python Packaging User Guide, Version specifiers (originally PEP 440)", type: "specification", url: "https://packaging.python.org/en/latest/specifications/version-specifiers/", access_date: "2026-10-27", scope: "the version scheme, normalization, ordering, the eight operators, pre-release handling", status: "active" },
    { id: "pep-440", label: "PEP 440, Version Identification and Dependency Specification (Final)", type: "pep", url: "https://peps.python.org/pep-0440/", access_date: "2026-10-27", scope: "the original text of the version scheme", status: "active" },
    { id: "pep-427", label: "PEP 427, The Wheel Binary Package Format 1.0 (Final)", type: "pep", url: "https://peps.python.org/pep-0427/", access_date: "2026-10-27", scope: "the original text of the wheel format", status: "active" },
    { id: "pep-600", label: "PEP 600, Future 'manylinux' Platform Tags (Final)", type: "pep", url: "https://peps.python.org/pep-0600/", access_date: "2026-10-27", scope: "manylinux_x_y as a promise for glibc x.y or later; the legacy names as aliases", status: "active" },
    { id: "pep-656", label: "PEP 656, Platform Tag for Linux Distributions Using Musl (Final)", type: "pep", url: "https://peps.python.org/pep-0656/", access_date: "2026-10-27", scope: "musllinux_x_y_arch", status: "active" },
    { id: "pep-803", label: "PEP 803, 'abi3t': Stable ABI for Free-Threaded Builds (Final)", type: "pep", url: "https://peps.python.org/pep-0803/", access_date: "2026-10-27", scope: "the abi3t tag, abi3.abi3t wheels from cp315, installers allowing abi3t for free-threaded builds", status: "active" },
    { id: "py-capi-stable", label: "Python documentation (3.15), C API Stability: Stable Application Binary Interfaces", type: "documentation", url: "https://docs.python.org/3/c-api/stable.html", access_date: "2026-10-27", scope: "abi3 for builds that are not free-threaded, abi3t for free-threaded builds, Stable ABI 3.x compatible with 3.x and later", status: "active" },
    { id: "pep-3149", label: "PEP 3149, ABI version tagged .so files (Final)", type: "pep", url: "https://peps.python.org/pep-3149/", access_date: "2026-10-27", scope: "the d, m and u ABI flags", status: "active" },
    { id: "pep-703", label: "PEP 703, Making the Global Interpreter Lock Optional in CPython (Final)", type: "pep", url: "https://peps.python.org/pep-0703/", access_date: "2026-10-27", scope: "the t ABI flag of free-threaded builds", status: "active" },
    { id: "pep-783", label: "PEP 783, Emscripten Packaging (Accepted)", type: "pep", url: "https://peps.python.org/pep-0783/", access_date: "2026-10-27", scope: "pyemscripten_YEAR_PATCH_wasm32", status: "active" },
    { id: "packaging-tags", label: "packaging 26.3 documentation, Tags (the oracle for the golden vectors; pip 26.2 vendors packaging 26.2)", type: "documentation", url: "https://packaging.pypa.io/en/stable/tags.html", access_date: "2026-10-27", scope: "the order of the installer's tag list, the platform lists for Linux, macOS and Windows", status: "active" },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }, // the site's author
  ],
});

/**
 * runTool: the registry-facing entry point (a file name or URL, or versions and an optional specifier line).
 * @param input the text
 * @returns the result
 */
export function runTool(input: string): WheelExplainResult {
  // The same engine.
  return run(input); // explained
} // runTool

/** The file vectors, by the conventional name. */
export const goldenVectors = FILE_VECTORS; // re-exported
