// ============================================================================
// scripts/check-worker-types.mjs
// ----------------------------------------------------------------------------
// BUILD GUARD: the Cloudflare Worker must type-check.
//
// WHY: the root tsconfig.json excludes worker/ on purpose, so Next.js's type
// check never sees Workers-runtime globals it cannot resolve. The side effect,
// undetected until 2026-09-09, was that NOTHING type-checked the Worker. On
// that day an identifier referenced in worker/stats.ts (REFERRER_SINCE) had
// never been declared anywhere; `tsc --noEmit` reported zero errors; the code
// shipped; the two public endpoints that used it threw ReferenceError at
// runtime; and a bare catch reported that as a 502 "upstream_unavailable" -
// blaming Cloudflare for an exception in our own file. This guard is the
// check that would have failed the build instead.
//
// The first run also found a second member of the same class in shared tool
// code the Worker imports (a Node `Buffer` fallback on a target where Buffer
// is undeclared) and a runtime-types quirk around TextDecoder options. Both
// were fixed the same day. Expect this guard to keep earning its place: the
// Worker imports from src/lib and src/config, so it type-checks the shared
// code against the Workers runtime as well as against the browser.
//
// WHAT IT DOES:
//   1. Regenerates worker/worker-configuration.d.ts with `wrangler types`.
//      Those are the Workers runtime declarations (Request, Response,
//      AnalyticsEngineDataset, Fetcher, ...) plus an Env interface derived
//      from the bindings in wrangler.jsonc. Regenerating on every run means
//      a binding added to wrangler.jsonc is typed immediately and the file
//      can never be stale. It is git-ignored for that reason.
//   2. Runs `tsc -p tsconfig.worker.json --noEmit`. That config includes
//      worker/**/*.ts only, resolves the "@/" alias to src/, uses lib ES2022
//      with NO @types/node (the Worker runs on workerd, not Node), and picks
//      up the generated declarations because they live inside worker/.
//
// WHY THE GENERATED FILE LIVES INSIDE worker/: when it sat at the repo root it
// matched the root tsconfig's **/*.ts include and workerd's stricter globals
// (a json() that returns unknown, among others) broke nine unrelated Next.js
// components. Inside worker/ it is excluded from the root check and included
// in this one, which is exactly the split the two configs exist to make.
//
// Exit non-zero on any type error, with tsc's own output, so the failure
// names the file and line. No baseline, no allow-list: the Worker is small
// and it should be clean.
// ============================================================================

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TYPES = path.join(ROOT, "worker", "worker-configuration.d.ts");
const TAG = "[check-worker-types]";

// npx resolves to the local wrangler and tsc under node_modules/.bin; on
// Windows the shim is npx.cmd, hence the platform switch.
const NPX = process.platform === "win32" ? "npx.cmd" : "npx";

// --- 1. Regenerate the runtime types ---------------------------------------
try {
  execFileSync(NPX, ["wrangler", "types", TYPES], {
    cwd: ROOT,
    stdio: ["ignore", "ignore", "pipe"],
    timeout: 120_000,
  });
} catch (err) {
  console.error(`\n${TAG} FAIL: could not regenerate ${path.relative(ROOT, TYPES)} with wrangler types.\n`);
  if (err?.stderr) console.error(String(err.stderr));
  process.exit(1);
}
if (!existsSync(TYPES)) {
  console.error(`\n${TAG} FAIL: wrangler types ran but ${path.relative(ROOT, TYPES)} is missing.\n`);
  process.exit(1);
}

// --- 2. Type-check the Worker against them --------------------------------
const tsc = spawnSync(NPX, ["tsc", "-p", "tsconfig.worker.json", "--noEmit", "--pretty", "false"], {
  cwd: ROOT,
  encoding: "utf8",
  timeout: 300_000,
});
const out = `${tsc.stdout ?? ""}${tsc.stderr ?? ""}`;
const errors = out.split("\n").filter((l) => /error TS\d+/.test(l));

if (tsc.status !== 0 || errors.length) {
  console.error(`\n${TAG} FAIL: ${errors.length} type error(s) in the Worker (tsconfig.worker.json):\n`);
  for (const l of errors) console.error(`  ${l}`);
  console.error(
    `\n  The Worker is type-checked separately from Next.js because the root\n` +
      `  tsconfig excludes worker/. An undeclared identifier here ships as a\n` +
      `  runtime ReferenceError on Cloudflare - see this script's header.\n`
  );
  process.exit(1);
}

console.log(`${TAG} OK: Worker type-checks clean against regenerated runtime types.`);
