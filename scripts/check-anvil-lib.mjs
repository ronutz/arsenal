#!/usr/bin/env node
/**
 * check-anvil-lib.mjs  (guard 47, added 2026-09-06)
 *
 * Runs the self-test inside scripts/anvil_lib.py. That library is the only
 * sanctioned way to locate, measure, or edit content entries; its self-test
 * encodes every locator failure that slipped past the guards in the session
 * that produced it. If the library breaks, every edit built on it is suspect,
 * so the library is tested on every build like any other guard.
 */
import { spawnSync } from "node:child_process";

const r = spawnSync("python3", ["scripts/anvil_lib.py"], { encoding: "utf8" });
process.stdout.write(r.stdout || "");
if (r.status !== 0) {
  process.stderr.write(r.stderr || "");
  console.error("\n[check-anvil-lib] FAIL: the content library's invariants do not hold.\n");
  process.exit(1);
}
