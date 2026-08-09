// ============================================================================
// scripts/write-build-marker.mjs
// ----------------------------------------------------------------------------
// Records the tree that a build just verified. Wired as npm `postbuild`, so it
// runs ONLY when `next build` exited 0 — a marker written after a failed build
// would silently forgive the thing that failed.
//
// The marker is COMMITTED rather than gitignored, deliberately. It travels in
// the zip, so a session that receives a tree can tell whether that exact tree
// has been through a build, instead of assuming. That is provenance the boot
// handshake had no way to establish before.
//
// RE-STAMP AFTER GATE REMOVAL. `postbuild` fires while the three TEMP gates are
// still applied, so that marker describes the GATED tree, not the one that gets
// packaged. Removing the gates then reads as code drift. The packaging sequence
// therefore runs `npm run mark-verified` after the gates come out, so the marker
// describes exactly the tree in the zip. Found by running the counter rather
// than by reasoning about it: its first real report was a false positive.
//
// Blob hashes come from the git index, so `git add -A` must have run. The build
// wrap does that before packaging; if the index is stale the marker records the
// stale state, which build-debt will then report as debt rather than hide.
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MARKER = path.join(ROOT, ".build-verified.json");

execSync("git add -A", { cwd: ROOT, stdio: "ignore" });

const out = execSync("git ls-files -s", { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const files = {};
for (const line of out.split("\n")) {
  if (!line) continue;
  const [meta, file] = line.split("\t");
  const sha = meta.split(" ")[1];
  if (file && sha) files[file] = sha;
}

// The marker records its own hash slot as whatever it was BEFORE this write;
// that entry is therefore always one build stale and is excluded, so the marker
// can never report itself as debt.
delete files[".build-verified.json"];

const marker = {
  verifiedAt: new Date().toISOString(),
  fileCount: Object.keys(files).length,
  note: "Written by npm postbuild after a successful build. Compare with scripts/build-debt.mjs.",
  files,
};

fs.writeFileSync(MARKER, JSON.stringify(marker, null, 0) + "\n");
console.log(`[write-build-marker] verified ${marker.fileCount} files at ${marker.verifiedAt}`);
