#!/usr/bin/env tsx
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0
// ============================================================================
// check-wasm-engines — THE ENGINE THE PAGE DESCRIBES IS THE ENGINE IT SHIPS.
// ----------------------------------------------------------------------------
// PREBUILD guard and copier for the WebAssembly tools (python-playground; jq
// follows the same pattern). Three jobs, in this order, each a hard stop:
//
//   1. VERIFY. node_modules/pyodide is the version the generated engine file
//      names, and every browser file has exactly the size and SHA-256 the file
//      records. A mismatch means someone upgraded the package without running
//      `npm run gen-wasm-engine`, or the registry served a different artefact;
//      either way the page would state figures that are not true of the bytes
//      it serves, so the build stops and says which file moved.
//   2. COPY. The five browser files go to public/wasm/pyodide/<version>/, the
//      path the engine record names, so `next build` ships them as static
//      assets. public/wasm/ is in .gitignore (decision 5 of the WebAssembly
//      proposal, ratified 2026-10-04): the repository holds the pinned version
//      and the digests, not 13 MB of someone else's binaries; CI reproduces the
//      copy from the lockfile-pinned package on every build. Files already in
//      place with the right digest are left alone.
//   3. RE-MEASURE. Every example program runs through the real engine under
//      Node, with stdout, stderr and stdin wired exactly as the browser worker
//      wires them, and the output is compared byte for byte with the engine
//      vectors in golden-vectors.ts. An engine upgrade that changes an
//      example's output fails the build here, which is the point: the change
//      is looked at on purpose instead of being discovered by a reader.
//
// It runs after run-golden-vectors in the prebuild chain, so the pure vectors
// have already passed when the engine is loaded (about three seconds).
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

/** Repository root. */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TAG = "[check-wasm-engines]";

/** The generated record and the vectors, imported from the tool itself. */
const { ENGINE } = (await import(pathToFileURL(path.join(ROOT, "src/lib/tools/python-playground/engine.ts")).href)) as typeof import("../src/lib/tools/python-playground/engine");
const { EXAMPLES } = (await import(pathToFileURL(path.join(ROOT, "src/lib/tools/python-playground/compute.ts")).href)) as typeof import("../src/lib/tools/python-playground/compute");
const { ENGINE_VECTORS } = (await import(pathToFileURL(path.join(ROOT, "src/lib/tools/python-playground/golden-vectors.ts")).href)) as typeof import("../src/lib/tools/python-playground/golden-vectors");

/** Where the package sits and where the browser files go. */
const PKG = path.join(ROOT, "node_modules", ENGINE.npmPackage);
const DEST = path.join(ROOT, "public", ENGINE.publicPath.replace(/^\//, ""));

/** SHA-256 of a file, lower-case hex. */
const sha256 = (file: string) => createHash("sha256").update(fs.readFileSync(file)).digest("hex");

const problems: string[] = [];

// ---- 1. Verify the package against the generated record.
if (!fs.existsSync(path.join(PKG, "package.json"))) {
  console.error(`${TAG} FAIL: ${path.relative(ROOT, PKG)} is missing. Run npm ci.`);
  process.exit(1);
}
const installed = (JSON.parse(fs.readFileSync(path.join(PKG, "package.json"), "utf8")) as { version: string }).version;
if (installed !== ENGINE.version) {
  problems.push(`node_modules has ${ENGINE.npmPackage} ${installed}; engine.ts was generated from ${ENGINE.version}. Run \`npm run gen-wasm-engine\` after a deliberate upgrade and review the diff.`);
}
for (const f of ENGINE.files) {
  const src = path.join(PKG, f.name);
  if (!fs.existsSync(src)) {
    problems.push(`${f.name}: missing from the package`);
    continue;
  }
  const bytes = fs.statSync(src).size;
  const digest = sha256(src);
  if (bytes !== f.bytes || digest !== f.sha256) {
    problems.push(`${f.name}: package has ${bytes} bytes sha256 ${digest.slice(0, 16)}..., engine.ts records ${f.bytes} bytes sha256 ${f.sha256.slice(0, 16)}...`);
  }
}
if (problems.length) {
  console.error(`${TAG} FAIL: the engine on disk is not the engine the page describes:\n  - ${problems.join("\n  - ")}`);
  process.exit(1);
}

// ---- 2. Copy the browser files into public/ (only what is missing or different).
fs.mkdirSync(DEST, { recursive: true });
let copied = 0;
for (const f of ENGINE.files) {
  const dst = path.join(DEST, f.name);
  // Same digest already in place: nothing to do, and the mtime stays stable for the exporter.
  if (fs.existsSync(dst) && fs.statSync(dst).size === f.bytes && sha256(dst) === f.sha256) continue;
  fs.copyFileSync(path.join(PKG, f.name), dst);
  copied++;
}
// Anything else under the destination is stale (a previous version's files, say) and would ship: refuse rather than guess.
const stray = fs.readdirSync(DEST).filter((n) => !ENGINE.files.some((f) => f.name === n));
if (stray.length) {
  console.error(`${TAG} FAIL: ${path.relative(ROOT, DEST)} holds files the engine record does not name: ${stray.join(", ")}. Remove them.`);
  process.exit(1);
}
// A sibling version directory means two engines would ship; the record names exactly one.
const versions = fs.readdirSync(path.dirname(DEST)).filter((n) => n !== ENGINE.version);
if (versions.length) {
  console.error(`${TAG} FAIL: public/wasm/${ENGINE.npmPackage}/ holds other version(s): ${versions.join(", ")}. Only ${ENGINE.version} ships; remove the rest.`);
  process.exit(1);
}

// ---- 3. Re-measure the examples through the real engine.
const { loadPyodide } = (await import(pathToFileURL(path.join(PKG, "pyodide.mjs")).href)) as {
  loadPyodide: (o: { indexURL: string }) => Promise<{
    runPython: (code: string) => unknown;
    runPythonAsync: (code: string) => Promise<unknown>;
    setStdout: (o: { write: (b: Uint8Array) => number }) => void;
    setStderr: (o: { write: (b: Uint8Array) => number }) => void;
    setStdin: (o: { stdin: () => string | null; autoEOF: boolean }) => void;
  }>;
};
const py = await loadPyodide({ indexURL: PKG + path.sep });
const dec = new TextDecoder();
const reprFn = py.runPython("repr") as (v: unknown) => unknown;
const drift: string[] = [];
for (const ex of EXAMPLES) {
  const vec = ENGINE_VECTORS.find((v) => v.id === ex.id);
  if (!vec) {
    drift.push(`${ex.id}: no engine vector recorded (regenerate golden-vectors.ts)`);
    continue;
  }
  // The capture mirrors public/workers/python-playground.worker.mjs: byte-exact streams, one stdin line per call.
  let out = "";
  let err = "";
  py.setStdout({ write: (b) => { out += dec.decode(b, { stream: true }); return b.length; } });
  py.setStderr({ write: (b) => { err += dec.decode(b, { stream: true }); return b.length; } });
  const lines = (ex.stdin ?? "").split("\n");
  if (lines.length && lines[lines.length - 1] === "") lines.pop();
  py.setStdin({ stdin: () => (lines.length ? (lines.shift() as string) : null), autoEOF: true });
  let result: string | null = null;
  try {
    const value = await py.runPythonAsync(ex.code);
    if (value !== undefined) {
      result = String(reprFn(value));
      const v = value as { destroy?: () => void };
      if (v && typeof v.destroy === "function") v.destroy();
    }
  } catch (e) {
    drift.push(`${ex.id}: the engine raised ${(e as Error).name}: ${String((e as Error).message).trim().split("\n").pop()}`);
    continue;
  }
  if (out !== vec.stdout) drift.push(`${ex.id}: stdout differs\n      expected ${JSON.stringify(vec.stdout).slice(0, 160)}\n      got      ${JSON.stringify(out).slice(0, 160)}`);
  if (err !== vec.stderr) drift.push(`${ex.id}: stderr differs (expected ${JSON.stringify(vec.stderr).slice(0, 80)}, got ${JSON.stringify(err).slice(0, 80)})`);
  if (result !== vec.result) drift.push(`${ex.id}: result differs (expected ${JSON.stringify(vec.result)}, got ${JSON.stringify(result)})`);
}
for (const vec of ENGINE_VECTORS) {
  if (!EXAMPLES.some((e) => e.id === vec.id)) drift.push(`${vec.id}: an engine vector with no example behind it`);
}
if (drift.length) {
  console.error(`${TAG} FAIL: ${drift.length} example(s) no longer produce their recorded output under ${ENGINE.name} ${ENGINE.version}:\n  - ${drift.join("\n  - ")}\n  If the change is intended (an engine upgrade), regenerate golden-vectors.ts and review the diff.`);
  process.exit(1);
}

const mb = (ENGINE.bytesWire / 1e6).toFixed(2);
console.log(`${TAG} OK: ${ENGINE.name} ${ENGINE.version} (Python ${ENGINE.python}) matches engine.ts: ${ENGINE.files.length} files, ${mb} MB, digests verified; ${copied} copied to ${path.relative(ROOT, DEST)}; ${EXAMPLES.length} example(s) re-measured byte-exact.`);
