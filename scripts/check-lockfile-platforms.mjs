// ============================================================================
// scripts/check-lockfile-platforms.mjs
// ----------------------------------------------------------------------------
// BUILD GUARD: package-lock.json must remain cross-platform.
//
// INCIDENT (2026-07-10): a package-lock.json regenerated inside the Linux
// sandbox carried only Linux platform binaries in its optional-dependency
// blocks. `npm ci` on PRIME's Windows machine then failed with EUSAGE,
// blocking the break-glass local deploy during the Workers Builds outage.
// PRIME repaired it by running `npm install` locally (only additive
// cross-platform blocks appeared: @esbuild/*, @pagefind/*, @img/sharp-*,
// @emnapi/runtime, fsevents) and pushing the enriched lockfile to main.
//
// STANDING RULE (CLAUDE.md, Lockfile provenance): GitHub main is the
// authoritative source of package-lock.json. Sandboxes never delete or
// regenerate it; installs are `npm ci` only; dependency changes happen via
// targeted `npm install <pkg>@<version>` and are then re-verified.
//
// This guard enforces the rule at build time with four SENTINELS - one
// platform-specific package per ecosystem that a Linux-only regeneration is
// known to drop. If ANY sentinel is missing, the lockfile did not come from
// (or no longer matches) the authoritative cross-platform one, and the build
// stops before a stale lockfile can propagate through a zip/commit.
// ============================================================================

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// The four sentinels: win32 binaries for esbuild / sharp / pagefind, plus
// fsevents (darwin-only). Presence of all four is a strong signal the whole
// cross-platform optional-dependency set survived.
const SENTINELS = [
  '"node_modules/@esbuild/win32-x64"',
  '"node_modules/@img/sharp-win32-x64"',
  '"node_modules/@pagefind/windows-x64"',
  '"node_modules/fsevents"',
];

const lock = readFileSync(path.join(ROOT, "package-lock.json"), "utf8");
const missing = SENTINELS.filter((s) => !lock.includes(s));

if (missing.length) {
  console.error("[check-lockfile-platforms] FAILED - package-lock.json is not cross-platform:");
  for (const s of missing) console.error("  - missing sentinel " + s);
  console.error(
    "  REMEDY: the lockfile must come from GitHub main; regenerate only via " +
      "`npm install` (never delete the file), then re-verify these sentinels " +
      "and `npm ci --dry-run` before staging.",
  );
  process.exit(1);
}
console.log(
  `[check-lockfile-platforms] OK: all ${SENTINELS.length} cross-platform sentinels present in package-lock.json.`,
);
