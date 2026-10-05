#!/usr/bin/env tsx
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0
// ============================================================================
// gen-wasm-engine — THE ENGINE FACTS ARE GENERATED FROM THE PINNED PACKAGE.
// ----------------------------------------------------------------------------
// The WebAssembly tools (python-playground first; jq later) run a third-party
// interpreter compiled to WebAssembly. Everything the site says about that
// engine - its version, the Python it embeds, its licence, the exact files the
// browser downloads with their sizes and SHA-256 digests, which Python modules
// exist in the build and which packages the distribution knows about - is a
// fact about the pinned npm package, so it is READ from the package and written
// into a TypeScript module, never typed by hand (PROPOSTA-wasm-tools, decision
// 2 of section 2(a), ratified by PRIME 2026-10-04: "figures generated at build
// from the pinned package").
//
// WHAT IT WRITES: src/lib/tools/python-playground/engine.ts, a frozen ENGINE
// record plus three lists:
//   DISTRIBUTION_PACKAGES  the package names in the engine's own lock file
//                          (none of them ships here; the preflight uses the
//                          list to say "numpy exists for Pyodide but is not
//                          loaded in this version" instead of "unknown");
//   STDLIB_MODULES         sys.stdlib_module_names of the embedded Python;
//   STDLIB_UNAVAILABLE     the stdlib modules that fail to import in this
//                          WebAssembly build (tkinter, curses and the like),
//                          each with the error the engine raised, measured by
//                          importing every one of them in the real engine
//                          under Node.
//
// WHEN TO RUN: `npm run gen-wasm-engine` after `npm install pyodide@<new>`.
// The prebuild guard scripts/check-wasm-engines.mts fails the build when the
// generated file no longer matches node_modules, so an upgrade cannot ship
// with stale figures, and the diff of engine.ts is the review artefact.
//
// WHAT IS NOT PROBED: four novelty modules (antigravity opens a browser, this
// prints the Zen, __hello__ and __phello__ print a greeting). They are named
// in the generated file as skipped so the omission is visible.
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

/** Repository root (this file lives in scripts/). */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
/** Where the npm package sits after `npm ci`. */
const PKG = path.join(ROOT, "node_modules", "pyodide");
/** The generated module. */
const OUT = path.join(ROOT, "src", "lib", "tools", "python-playground", "engine.ts");
/** The five files a browser needs; everything else in the package is typings, maps, consoles. */
const BROWSER_FILES = ["pyodide.mjs", "pyodide.asm.mjs", "pyodide.asm.wasm", "python_stdlib.zip", "pyodide-lock.json"] as const;
/** Modules deliberately not imported by the probe (side effects, no diagnostic value). */
const NOVELTY = ["antigravity", "this", "__hello__", "__phello__"];

/** SHA-256 of a file, lower-case hex. */
function sha256(file: string): string {
  // Streaming is unnecessary at 10 MB; one read is fine.
  return createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

/** The package's own metadata. */
const pkgJson = JSON.parse(fs.readFileSync(path.join(PKG, "package.json"), "utf8")) as { version: string; license: string };
/** The engine's lock file: the Python it embeds and the packages it knows. */
const lock = JSON.parse(fs.readFileSync(path.join(PKG, "pyodide-lock.json"), "utf8")) as {
  info: { python: string; abi_version: string; platform: string; arch: string };
  packages: Record<string, { name: string }>;
};
/** The integrity the lockfile pins for the package, so the generated record can name it. */
const lockfile = JSON.parse(fs.readFileSync(path.join(ROOT, "package-lock.json"), "utf8")) as { packages: Record<string, { version: string; integrity?: string }> };
const pinned = lockfile.packages["node_modules/pyodide"];
if (!pinned || pinned.version !== pkgJson.version) {
  // The lockfile and node_modules disagree: npm ci was not run, or a stray install happened.
  console.error(`[gen-wasm-engine] FAIL: package-lock.json pins pyodide ${pinned?.version ?? "(absent)"} but node_modules has ${pkgJson.version}. Run npm ci.`);
  process.exit(1);
}

/** The browser files with their measured sizes and digests. */
const files = BROWSER_FILES.map((name) => {
  const p = path.join(PKG, name);
  return { name, bytes: fs.statSync(p).size, sha256: sha256(p) };
});
const bytesWire = files.reduce((n, f) => n + f.bytes, 0);

/** The distribution's package names, sorted for a stable diff. */
const distributionPackages = Object.values(lock.packages).map((p) => p.name).sort();

// ---- Probe the real engine under Node: stdlib names, and which fail to import.
console.log(`[gen-wasm-engine] loading Pyodide ${pkgJson.version} under Node to probe the standard library...`);
const { loadPyodide } = (await import(pathToFileURL(path.join(PKG, "pyodide.mjs")).href)) as { loadPyodide: (o: { indexURL: string }) => Promise<{ runPython: (code: string) => unknown; setStdout: (o: { batched: (s: string) => void }) => void; setStderr: (o: { batched: (s: string) => void }) => void }> };
const py = await loadPyodide({ indexURL: PKG + path.sep });
// Keep the probe's own output out of the generator's console.
py.setStdout({ batched: () => undefined });
py.setStderr({ batched: () => undefined });
const probe = py.runPython(`
import importlib, json, sys
skip = set(${JSON.stringify(NOVELTY)})
names = sorted(sys.stdlib_module_names)
failures = {}
for name in names:
    if name in skip:
        continue
    try:
        importlib.import_module(name)
    except BaseException as exc:  # a module may raise anything on import; record the type and first line
        failures[name] = type(exc).__name__ + ": " + str(exc).splitlines()[0][:160] if str(exc) else type(exc).__name__
json.dumps({"names": names, "version": sys.version.split()[0], "failures": failures})
`) as string;
const probed = JSON.parse(probe) as { names: string[]; version: string; failures: Record<string, string> };
if (probed.version !== lock.info.python) {
  // The lock file and the running interpreter must agree on the Python version.
  console.error(`[gen-wasm-engine] FAIL: pyodide-lock.json says python ${lock.info.python} but the engine reports ${probed.version}.`);
  process.exit(1);
}

/** Today's date in the author's zone (the canon and the changelog keep GMT-3 dates), for the record of when the figures were read. */
const today = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });

/** Render a string array as a TypeScript literal, wrapped for readable diffs. */
function list(items: string[]): string {
  const lines: string[] = [];
  let cur = "";
  for (const it of items) {
    const tok = JSON.stringify(it) + ", ";
    if (cur.length + tok.length > 96) { lines.push("  " + cur.trimEnd()); cur = ""; }
    cur += tok;
  }
  if (cur) lines.push("  " + cur.trimEnd());
  return lines.join("\n");
}

const source = `// ============================================================================
// src/lib/tools/python-playground/engine.ts
// ----------------------------------------------------------------------------
// GENERATED by scripts/gen-wasm-engine.mts on ${today} from node_modules/pyodide
// ${pkgJson.version}. DO NOT EDIT BY HAND: run \`npm run gen-wasm-engine\` after a
// deliberate upgrade and review the diff. The prebuild guard
// scripts/check-wasm-engines.mts refuses a build whose node_modules disagree
// with this file, and copies the five browser files into public/wasm/ (which
// is not committed) only after their digests match.
//
// Every figure here is a fact about the pinned package: the version and
// licence from its package.json, the Python version, ABI and platform from its
// own pyodide-lock.json, the sizes and SHA-256 digests measured on the files,
// the standard-library module names and the import failures measured by
// importing every module in the real engine under Node.
// ============================================================================

/** One of the files the browser downloads on first use. */
export interface EngineFile {
  /** File name under publicPath. */
  name: string;
  /** Size in bytes as shipped (before any transfer compression). */
  bytes: number;
  /** SHA-256 of the file, lower-case hex. */
  sha256: string;
}

/** The engine: what runs, where it comes from, what it costs. */
export const ENGINE = Object.freeze({
  /** The interpreter's name as the pill shows it. */
  name: "Pyodide",
  /** Who compiles CPython to WebAssembly. */
  project: "the Pyodide project",
  /** The project's site and repository, under the url: key the citation liveness audit collects (check-citation-fields). */
  links: [
    { label: "Pyodide", url: "https://pyodide.org/" },
    { label: "pyodide/pyodide on GitHub", url: "https://github.com/pyodide/pyodide" },
  ] as readonly { label: string; url: string }[],
  /** The pinned npm package and its version. */
  npmPackage: "pyodide",
  version: ${JSON.stringify(pkgJson.version)},
  /** The lockfile's integrity for that package (npm verifies it on install). */
  npmIntegrity: ${JSON.stringify(pinned.integrity ?? "")},
  /** The Python the engine embeds, from its own lock file and confirmed by the running interpreter. */
  python: ${JSON.stringify(lock.info.python)},
  abi: ${JSON.stringify(lock.info.abi_version)},
  platform: ${JSON.stringify(lock.info.platform)},
  arch: ${JSON.stringify(lock.info.arch)},
  /** The licence the package declares (SPDX). */
  licence: ${JSON.stringify(pkgJson.license)},
  /** Where the files are served from on this site, versioned so a cache never mixes two engines. */
  publicPath: ${JSON.stringify(`/wasm/pyodide/${pkgJson.version}/`)},
  /** The files, in the order the loader fetches them. */
  files: [
${files.map((f) => `    { name: ${JSON.stringify(f.name)}, bytes: ${f.bytes}, sha256: ${JSON.stringify(f.sha256)} },`).join("\n")}
  ] as readonly EngineFile[],
  /** The sum of the file sizes: the first-use download before transfer compression. */
  bytesWire: ${bytesWire},
  /** How many packages the distribution's lock file lists; none of them ships here (decision 4). */
  packagesInDistribution: ${distributionPackages.length},
  /** Standard-library modules reported by the engine, and how many fail to import in this build. */
  stdlibModules: ${probed.names.length},
  stdlibUnavailable: ${Object.keys(probed.failures).length},
  /** The novelty modules the import probe skipped on purpose. */
  probeSkipped: ${JSON.stringify(NOVELTY)} as readonly string[],
  /** The date the figures were read from the package. */
  generatedAt: ${JSON.stringify(today)},
});

/** The package names in the engine's own lock file: available to Pyodide, not loaded in this version. */
export const DISTRIBUTION_PACKAGES: readonly string[] = [
${list(distributionPackages)}
];

/** sys.stdlib_module_names of the embedded Python. */
export const STDLIB_MODULES: readonly string[] = [
${list(probed.names)}
];

/** Standard-library modules that fail to import in this WebAssembly build, with the engine's own error. */
export const STDLIB_UNAVAILABLE: readonly { module: string; error: string }[] = [
${Object.entries(probed.failures).map(([m, e]) => `  { module: ${JSON.stringify(m)}, error: ${JSON.stringify(e)} },`).join("\n")}
];
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, source);
console.log(`[gen-wasm-engine] wrote ${path.relative(ROOT, OUT)}: pyodide ${pkgJson.version}, python ${lock.info.python}, ${files.length} files (${bytesWire} bytes), ${distributionPackages.length} distribution packages, ${probed.names.length} stdlib modules of which ${Object.keys(probed.failures).length} unavailable.`);
