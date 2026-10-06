// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0
// ============================================================================
// scripts/check-archive-passthrough.mjs
// ----------------------------------------------------------------------------
// THE ARCHIVE OF THE EARLIER SITES MUST BYPASS THE LOCALE GATE.
//
// WHAT HAPPENED. The static clones of the 2004 and 2013 sites live under
// /archive/sites/<slug>/ with no locale segment, because the originals had none
// and their links are relative. The Worker (worker/index.ts) redirects every
// bare, non-localised, extensionless path to /en/..., which is right for the
// site's own pages and wrong for the archive: on 2026-10-05 PRIME found
// https://ronutz.com/en/archive/sites/ntz-com-br-2013/ answering 404, because
// /archive/sites/ntz-com-br-2013/ had been rewritten into that non-existent
// path. The local render checks never saw it: the preview server does not run
// the Worker.
//
// THE FIX, IN TWO PLACES. wrangler.jsonc excludes /archive/* from
// `run_worker_first`, so the assets layer answers directly; worker/index.ts
// carries the same exemption inside the gate as a second lock. This guard
// fails the build if either lock disappears, since nothing else can see it.
// ============================================================================
import { readFileSync } from "node:fs";

// The two files that hold the exemption, read as text (wrangler.jsonc carries
// comments, so it is not parsed as JSON here; the literal token is enough).
const wrangler = readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8");
const worker = readFileSync(new URL("../worker/index.ts", import.meta.url), "utf8");

// Each failure is one sentence a reader can act on.
const failures = [];

// Lock 1: the assets layer serves the archive without the Worker.
if (!/"!\/archive\/\*"/.test(wrangler)) {
  failures.push('wrangler.jsonc: `assets.run_worker_first` no longer excludes "!/archive/*".');
}

// Lock 2: the gate itself hands /archive/* to the assets binding.
if (!/url\.pathname\.startsWith\("\/archive\/"\)/.test(worker) || !/env\.ASSETS\.fetch\(request\)/.test(worker)) {
  failures.push("worker/index.ts: the /archive/ exemption before the locale gate is missing.");
}

// Lock 3 (2026-10-06): a locale-prefixed archive path, the address the bug handed every reader who met it,
// is sent back to the bare path rather than left as a 404. The branch tests the first segment against the
// locale registry and redirects permanently.
if (!/\/\^\\\/\(\[\^\/\]\+\)\\\/archive/.test(worker) || !/LOCALE_CODES\.includes\(archiveMatch\[1\]\)/.test(worker)) {
  failures.push("worker/index.ts: the /<locale>/archive/... -> /archive/... redirect before the locale gate is missing.");
}

if (failures.length) {
  console.error(`\n[check-archive-passthrough] FAIL: ${failures.length} lock(s) missing.\n`);
  for (const f of failures) console.error(`  - ${f}`);
  console.error("\n  The old-site clones have no locale segment; without both locks their index pages redirect to\n  a /en/archive/... path that does not exist (found live 2026-10-05).\n");
  process.exit(1);
}

console.log("[check-archive-passthrough] OK: /archive/* bypasses the Worker's locale gate (wrangler.jsonc and worker/index.ts); /<locale>/archive/... redirects to the bare path.");
