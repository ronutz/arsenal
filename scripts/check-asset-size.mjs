// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-asset-size.mjs
// ----------------------------------------------------------------------------
// POSTBUILD GUARD: no file in out/ may exceed Cloudflare Workers' per-asset
// limit of 25 MiB.
//
// WHY. The deploy of 12/11/2026 (GitHub Actions, 23:43 UTC) built every page
// and passed every guard, then wrangler refused the upload: "Cloudflare Workers
// supports assets with sizes of up to 25 MiB. We found a file .../out/en/
// copy8825140637/index.html with a size of 31.9 MiB." The internal copy editor
// embedded all six live message packs in its page. No guard looked at single
// file sizes (check-page-weight skips that private route and measures pages,
// not every asset), so the failure showed only at the deploy step.
//
// WHAT IT DOES. Walks out/ and fails on any file over 25 MiB, naming each; it
// warns from 20 MiB so growth shows before it breaks the deploy.
// ============================================================================

import fs from "node:fs"; // the file system walk
import path from "node:path"; // paths
import { fileURLToPath } from "node:url"; // this file's own path

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."); // the repository root
const OUT = path.join(ROOT, "out"); // the static export
const MIB = 1024 * 1024; // one mebibyte in bytes
const LIMIT = 25 * MIB; // Cloudflare Workers' per-asset maximum
const WARN = 20 * MIB; // where growth is reported before it breaks the deploy

if (!fs.existsSync(OUT)) {
  console.error("[check-asset-size] FAIL: out/ does not exist; run the build first."); // nothing to check
  process.exit(1); // fail
}

const over = []; // files over the limit
const near = []; // files over the warning line
let files = 0; // files read
let biggest = { p: "", s: 0 }; // the largest file seen
const stack = [OUT]; // directories still to walk
while (stack.length) {
  const d = stack.pop(); // the next directory
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name); // the entry's path
    if (e.isDirectory()) { stack.push(p); continue; } // walk into it
    if (!e.isFile()) continue; // links and the like are not uploaded as files
    const s = fs.statSync(p).size; // its size
    files += 1; // one more file
    if (s > biggest.s) biggest = { p, s }; // the largest so far
    if (s > LIMIT) over.push([p, s]); // breaks the deploy
    else if (s > WARN) near.push([p, s]); // close to it
  }
}

const rel = (p) => path.relative(ROOT, p); // a path as the repo names it
const mib = (s) => `${(s / MIB).toFixed(1)} MiB`; // bytes as MiB
for (const [p, s] of near) console.warn(`[check-asset-size] WARN: ${rel(p)} is ${mib(s)} (limit 25 MiB).`); // growth to watch
if (over.length) {
  for (const [p, s] of over) console.error(`[check-asset-size] FAIL: ${rel(p)} is ${mib(s)}, over Cloudflare Workers' 25 MiB per-asset limit.`); // each offender
  process.exit(1); // fail: the deploy would be refused
}
console.log(`[check-asset-size] OK: ${files} file(s) in out/, none over 25 MiB (largest ${rel(biggest.p)}, ${mib(biggest.s)}).`); // pass
