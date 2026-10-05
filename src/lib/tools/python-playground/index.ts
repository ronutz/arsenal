// ============================================================================
// src/lib/tools/python-playground/index.ts
// ----------------------------------------------------------------------------
// PYTHON PLAYGROUND: the self-describing {manifest, run, vectors} triple
// (D-49) for the site's first WebAssembly tool. Real CPython 3.14, compiled to
// WebAssembly by the Pyodide project, downloaded from this origin on the
// reader's say-so (13 MB, once) and run in a module Web Worker; nothing the
// reader types leaves the page. What this module owns is the deterministic
// harness around that engine: the preflight that reads a program and says what
// will not work here and why, the limits, the examples, and the record of the
// engine itself (engine.ts, generated from the pinned package).
//
// This is the tool the WebAssembly proposal of 2026-10-04 was written for and
// PRIME's "A yes to the five" ratified: the fuchsia WebAssembly pill, the
// consent-to-download button, API_EXCLUDED, packages off, engine files fetched
// at build from the pinned package with the digests committed.
// ============================================================================

import { preflight, SOURCES, type PlaygroundInput, type PreflightResult } from "./compute";
import { ENGINE } from "./engine";
import { GOLDEN_VECTOR_SET_ID, VECTORS } from "./golden-vectors";

// The compute layer's public types and values.
export type { PlaygroundInput, PreflightResult, Finding, FindingCode, Severity, ImportRef, ImportStatus, Stats, Example, Source } from "./compute";
export { preflight, LIMITS, EXAMPLES, EXAMPLE_ID, SOURCES } from "./compute";
// The engine record and the generated lists.
export { ENGINE, DISTRIBUTION_PACKAGES, STDLIB_MODULES, STDLIB_UNAVAILABLE } from "./engine";
export type { EngineFile } from "./engine";
// The vector sets and their runner.
export { GOLDEN_VECTOR_SET_ID, VECTORS, PREFLIGHT_VECTORS, ENGINE_VECTORS, verifyVectors, pin } from "./golden-vectors";

/** The D-49 declarative manifest. */
export const manifest = Object.freeze({
  // The family the tool is listed under (the catalogue uses the same name).
  toolFamily: "Python",
  // The slug.
  toolSlug: "python-playground",
  // Other names it answers to.
  canonicalAliases: ["python", "python-sandbox", "python-repl", "pyodide", "run-python", "python-online", "python-scratchpad"],
  // A program is typed, not pasted from somewhere recognisable; a shebang or an import line is the one honest detector.
  inputDetectors: [
    { kind: "regex", priority: 2, pattern: "^(?:#!/usr/bin/env python|#!/usr/bin/python|\\s*(?:import|from)\\s+[A-Za-z_][\\w.]*)", example: "import ipaddress\\nprint(list(ipaddress.ip_network('10.0.0.0/30').hosts()))" },
  ],
  // Runs in the browser, inside a WebAssembly engine (the pill says so).
  capabilityBadge: "wasm",
  // Local, but not our code: a third-party interpreter compiled to WebAssembly runs in a Worker on the reader's device.
  executionClass: ["wasmLocal"],
  // Nothing of this runs on a server, and the API does not execute programs (D-72: API_EXCLUDED with the reason).
  apiCapabilityClass: "browser-only",
  // The engine, as the guards and the explainer read it: generated from the pinned package, never typed.
  engine: {
    name: ENGINE.name,
    project: ENGINE.project,
    version: ENGINE.version,
    runtime: `Python ${ENGINE.python}`,
    licence: ENGINE.licence,
    bytesWire: ENGINE.bytesWire,
    files: ENGINE.files.map((f) => ({ name: f.name, bytes: f.bytes, sha256: f.sha256 })),
    publicPath: ENGINE.publicPath,
    source: ENGINE.links[1].url,
  },
  // The vector set: the preflight vectors run with every tool; the engine vectors run through the real engine at build.
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  // How hostile input is handled: the program is text until the reader presses Run; the preflight reads it with bounded, anchored expressions; the run happens in a Worker with no document, no network (the page policy allows this origin only), a 30 s wall clock and a Stop that terminates the Worker; output is capped.
  dangerousInputHandling: ["bounded-parse", "consent-before-download", "worker-isolated", "wall-clock-limit", "output-capped", "never-fetches", "no-server-execution"],
  // A program and its output may hold anything the reader typed: share with care.
  shareSafetyDefault: "caution",
  // The Learn articles written for it: how a WebAssembly tool works (shared with the later jq tool), and Python as a network engineer's calculator.
  learnLinks: ["learn/how-a-webassembly-tool-works", "learn/python-as-a-network-engineers-calculator"],
  // Tools that do by hand what the examples do in Python.
  relatedTools: ["cidr", "ipv6", "hmac", "bits-bytes", "syslog-pri-decoder"],
  // Sources, each read live on its access date.
  sources: SOURCES.map((s) => ({ ...s, status: "active" as const })),
  // Credits: the harness is this site's; the engine is the Pyodide project's.
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
    { handle: "pyodide", display_name: "The Pyodide project (CPython compiled to WebAssembly, MPL-2.0)", role: "engine", public: true },
  ],
});

/** run: the registry-facing entry point is the preflight; the interpreter itself runs only in the browser. */
export function run(input: PlaygroundInput): PreflightResult {
  // The deterministic part; the engine is not reachable from here on purpose.
  return preflight(input);
}

/** The vectors (the page's Example button uses the first example verbatim, D-83). */
export const goldenVectors = VECTORS;
