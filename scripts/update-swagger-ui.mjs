// ============================================================================
// scripts/update-swagger-ui.mjs
// ----------------------------------------------------------------------------
// MANUAL helper. This is deliberately NOT part of build/prebuild: it is run by
// hand, only when you want to refresh the vendored Swagger UI assets that the
// /api page serves from public/vendor/swagger-ui/.
//
// Background: swagger-ui-dist is intentionally NOT a project dependency. The two
// built files we serve (swagger-ui-bundle.js, swagger-ui.css) are committed under
// public/vendor/swagger-ui/, so the build and `next dev` never depend on the
// package being installed. To update them, this script:
//   1. backs up package.json + package-lock.json,
//   2. installs swagger-ui-dist into node_modules ONLY (npm --no-save),
//   3. copies the two files into public/vendor/swagger-ui/,
//   4. restores the manifests byte-for-byte (guard against npm-version quirks),
//   5. prunes the temporary install (unless --keep).
// Net effect: only the two vendored files change. package.json / package-lock.json
// are left exactly as they were.
//
// Usage:
//   node scripts/update-swagger-ui.mjs            refresh to the latest release
//   node scripts/update-swagger-ui.mjs 5.32.8     pin a specific version
//   node scripts/update-swagger-ui.mjs --keep     leave swagger-ui-dist installed
//   npm run update-swagger-ui -- 5.32.8           same, via the npm alias
//
// Afterwards, review and commit, e.g.:
//   git add public/vendor/swagger-ui
//   git commit -m "chore: refresh vendored Swagger UI"
// ============================================================================

import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  existsSync,
  mkdirSync,
  copyFileSync,
  readFileSync,
  writeFileSync,
  statSync,
} from "node:fs";
import path from "node:path";

const TAG = "[update-swagger-ui]";
const log = (m) => console.log(`${TAG} ${m}`);
const fail = (m) => {
  console.error(`${TAG} ERROR: ${m}`);
  process.exit(1);
};

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC_PKG = path.join(ROOT, "node_modules", "swagger-ui-dist");
const DEST = path.join(ROOT, "public", "vendor", "swagger-ui");
const PKG_JSON = path.join(ROOT, "package.json");
const PKG_LOCK = path.join(ROOT, "package-lock.json");
const FILES = ["swagger-ui-bundle.js", "swagger-ui.css"];

// ---- parse + validate args -------------------------------------------------
const args = process.argv.slice(2);
const keep = args.includes("--keep");
const version = args.find((a) => !a.startsWith("--")) || "latest";

// Only allow safe version/tag characters (no shell metacharacters): this string
// is interpolated into the npm command below, so we keep it strict.
if (!/^[\w.\-^~]+$/.test(version)) {
  fail(`invalid version or dist-tag: "${version}"`);
}

// Run npm via the platform shell (npm resolves to npm.cmd on Windows). The
// command is a fixed template; the only variable, `version`, is validated above.
function npm(subcommand) {
  execSync(`npm ${subcommand} --no-audit --no-fund`, {
    cwd: ROOT,
    stdio: "inherit",
  });
}

// ---- back up the manifests so we can guarantee zero churn ------------------
const pkgJsonBackup = readFileSync(PKG_JSON);
const pkgLockBackup = existsSync(PKG_LOCK) ? readFileSync(PKG_LOCK) : null;
function restoreManifests() {
  writeFileSync(PKG_JSON, pkgJsonBackup);
  if (pkgLockBackup) writeFileSync(PKG_LOCK, pkgLockBackup);
}

// ---- do the work, always cleaning up afterwards ----------------------------
let failure = null;
try {
  log(`installing swagger-ui-dist@${version} into node_modules (temporary)...`);
  npm(`install --no-save swagger-ui-dist@${version}`);

  for (const f of FILES) {
    if (!existsSync(path.join(SRC_PKG, f))) {
      throw new Error(
        `${f} not found in swagger-ui-dist (unexpected package layout)`,
      );
    }
  }

  if (!existsSync(DEST)) mkdirSync(DEST, { recursive: true });

  log(`copying ${FILES.length} file(s) to public/vendor/swagger-ui/ ...`);
  for (const f of FILES) {
    copyFileSync(path.join(SRC_PKG, f), path.join(DEST, f));
    const kb = (statSync(path.join(DEST, f)).size / 1024).toFixed(0);
    log(`  ${f}  (${kb} KB)`);
  }

  let installed = "(unknown)";
  try {
    installed = JSON.parse(
      readFileSync(path.join(SRC_PKG, "package.json"), "utf8"),
    ).version;
  } catch {
    /* ignore: version read is informational only */
  }
  log(`copied Swagger UI version ${installed}.`);
} catch (e) {
  failure = e;
} finally {
  // Always restore the manifests exactly as they were...
  restoreManifests();
  // ...and remove the temporary install unless the caller wants to keep it.
  if (!keep) {
    log("pruning the temporary swagger-ui-dist install...");
    try {
      npm("prune");
    } catch {
      log("note: `npm prune` did not finish; you can run it yourself if needed.");
    }
  } else {
    log("left swagger-ui-dist installed (--keep). Manifests are unchanged.");
  }
}

if (failure) {
  fail(failure.message || String(failure));
}

console.log("");
log("done. Review and commit the refreshed files:");
console.log("  git add public/vendor/swagger-ui");
console.log('  git commit -m "chore: refresh vendored Swagger UI"');
