// ============================================================================
// scripts/build-debt.mjs
// ----------------------------------------------------------------------------
// BUILD DEBT — what has changed since the last verified build (PRIME 2026-08-08).
//
// WHY: the amended cadence lets content-only turns skip the build. That trade is
// correct and it accrues a debt: pages whose RENDER nobody has verified. PRIME's
// ruling is that the debt must be COUNTED, REPORTED EVERY TURN, and that a build
// must be SUGGESTED when it is worth paying down.
//
// DERIVED, NOT MAINTAINED. A hand-kept counter is a second registry of a fact
// git already holds, and this repository has been bitten by that shape more than
// once (the 29-guard list, the two scroll-margin values, the README describing a
// recipe section that had been deleted). The marker records `git ls-files -s` —
// mode, BLOB HASH, path — at the moment a build succeeded. Debt is the set
// difference against the same command now.
//
// Blob hashes rather than timestamps: the sandbox is rebuilt from a zip every
// session, so mtimes are meaningless across boundaries. Content identity is not.
//
// INFORMATIONAL, NEVER A GATE. It always exits 0. A guard that blocked on debt
// would make the cadence rule unusable, and the judgement of when to spend ten
// minutes belongs to PRIME, not to a threshold.
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MARKER = path.join(ROOT, ".build-verified.json");

/** path -> blob hash, from the git index (what `git add -A` has staged). */
function indexNow() {
  const out = execSync("git ls-files -s", { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const map = {};
  for (const line of out.split("\n")) {
    if (!line) continue;
    // <mode> <sha> <stage>\t<path>
    const [meta, file] = line.split("\t");
    const sha = meta.split(" ")[1];
    if (file && sha) map[file] = sha;
  }
  return map;
}

/**
 * RISK CLASS decides whether a build is optional or mandatory. Content can wait;
 * anything that changes how pages are produced cannot, because the guards do not
 * execute the render path.
 */
function riskClass(file) {
  if (/^src\/content\/.*\.mdx$/.test(file)) return "content";
  if (/^src\/content\//.test(file)) return "content";
  if (/^src\/i18n\/messages\//.test(file)) return "content";
  return "code"; // components, routes, css, i18n plumbing, scripts, config
}

const now = indexNow();
let marker = null;
if (fs.existsSync(MARKER)) {
  try {
    marker = JSON.parse(fs.readFileSync(MARKER, "utf8"));
  } catch {
    marker = null;
  }
}

if (!marker || !marker.files) {
  console.log("[build-debt] UNKNOWN — no verified-build marker in this tree.");
  console.log("             Treat the tree as unverified: build before the next push.");
  process.exit(0);
}

const before = marker.files;
// The marker cannot be evidence about itself: its own blob changes every time it
// is written, so counting it would make every build leave one unit of permanent
// phantom debt.
delete now[".build-verified.json"];
delete before[".build-verified.json"];
const changed = [];
for (const [file, sha] of Object.entries(now)) {
  if (before[file] !== sha) changed.push(file);
}
for (const file of Object.keys(before)) {
  if (!(file in now)) changed.push(file);
}

const content = changed.filter((f) => riskClass(f) === "content");
const code = changed.filter((f) => riskClass(f) === "code");

// Practice/learn articles are counted as ITEMS (en + pt-BR are one article), because
// "how many things could a failed build be about" is the number that matters.
const articleSlugs = new Set(
  content.filter((f) => /\.mdx$/.test(f)).map((f) => f.replace(/^.*\/([^/]+)\.mdx$/, "$1")),
);

/**
 * MESSAGE NAMESPACES AS ITEMS (PRIME ratified 2026-08-09).
 *
 * A locale pack holds every page's copy in one file, so file-level counting is
 * blind twice over: page-copy edits produce no article slug, and a second edit
 * to the same pack does not raise the file count either. On 2026-08-09 three
 * copy changes across two pages read as "1 item" and the verdict was "OK to
 * continue" while three surfaces were unverified.
 *
 * A namespace is a page or a page area — the unit a reader notices and the unit
 * a failed build would point at. Deduplicated ACROSS LOCALES on purpose:
 * `advisory` changing in en and pt-BR is ONE surface, not two.
 */
function changedNamespaces() {
  const before = marker.messageNamespaces;
  if (!before) return null; // marker predates this field; report honestly rather than guess
  const changed = new Set();
  const dir = path.join(ROOT, "src", "i18n", "messages");
  if (!fs.existsSync(dir)) return changed;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".json")) continue;
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    } catch {
      continue;
    }
    const prior = before[f] ?? {};
    for (const [ns, value] of Object.entries(parsed)) {
      const h = createHash("sha1").update(JSON.stringify(value)).digest("hex");
      if (prior[ns] !== h) changed.add(ns);
    }
    for (const ns of Object.keys(prior)) if (!(ns in parsed)) changed.add(ns);
  }
  return changed;
}

const nsChanged = changedNamespaces();
const nsCount = nsChanged ? nsChanged.size : 0;
const itemCount = articleSlugs.size + nsCount;

if (changed.length === 0) {
  console.log(`[build-debt] 0 — tree matches the build verified ${marker.verifiedAt}.`);
  process.exit(0);
}

console.log(`[build-debt] ${changed.length} file(s) changed since the build verified ${marker.verifiedAt}.`);
console.log(`             content: ${content.length} file(s), ${itemCount} item(s)` +
  ` — ${articleSlugs.size} article(s), ${nsChanged === null ? "namespaces unknown (old marker)" : `${nsCount} copy namespace(s)`}`);
if (nsCount) console.log(`             namespaces: ${[...nsChanged].sort().join(", ")}`);
console.log(`             code:    ${code.length} file(s)`);

// THRESHOLDS. The governing idea is ATTRIBUTION, not risk tolerance: one
// unverified item means a failed build points straight at it; eight means
// bisecting. Build often enough that a failure still names its cause.
if (code.length > 0) {
  console.log("");
  console.log("  >> BUILD NOW. Code, routing, styling or i18n plumbing changed, and the");
  console.log("     guards do not execute the render path. This is not a judgement call.");
  for (const f of code.slice(0, 8)) console.log(`       - ${f}`);
  if (code.length > 8) console.log(`       … and ${code.length - 8} more`);
} else if (itemCount >= 7) {
  console.log("");
  console.log(`  >> BUILD RECOMMENDED. ${itemCount} unverified items: a failed build would`);
  console.log("     no longer point at a cause, and you would be bisecting your own work.");
} else if (itemCount >= 4) {
  console.log("");
  console.log(`  >> BUILD SOON. ${itemCount} unverified items; attribution is still good but`);
  console.log("     thinning. A good moment is after the next one or two.");
} else {
  console.log("");
  console.log(`  >> OK to continue. ${itemCount} unverified item(s); a failed build would`);
  console.log("     still name its cause.");
}
console.log("     ALWAYS build before a push, whatever this says.");
