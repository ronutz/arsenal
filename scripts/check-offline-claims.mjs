#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-offline-claims.mjs - NO "WORKS OFFLINE" WITHOUT A SERVICE WORKER
// ----------------------------------------------------------------------------
// WHY THIS EXISTS (Round 1 batch B, B2, 2026-10-26). The production audit of
// 2026-10-19 asked the Guide and the Colophon to scope their local-first and
// offline statements to what is verified. Read against the code, the Guide
// said "The site is a progressive web app. Once you have visited it, your
// browser can keep it available ... they keep working without a connection",
// and the Colophon called the site "dependent on nothing at runtime". Neither
// held: no service worker is registered anywhere in the tree, so nothing keeps
// a page for offline use; a few tools fetch their engine or a data table from
// the site the first time they run; and a Worker stands in front of every page.
// The copy now says what is true (pages need the connection; a loaded catalogue
// tool's calculation makes no request). This guard keeps the old promise from
// coming back while the code cannot keep it.
//
// WHAT IT CHECKS. Whether the source registers a service worker
// (navigator.serviceWorker.register in src/ or public/). If it does, the guard
// passes: offline use becomes a claim the code can support, and the copy may
// be revised. If it does not, every string of the English and Portuguese packs
// is read, and a string fails when it promises offline availability or calls
// the site a progressive web app: "works offline", "keep(s) working offline",
// "without a connection" beside "keep working", "progressive web app", "dependent
// on nothing at runtime"; and their Portuguese twins. The negative statements
// the copy now makes ("not stored for offline use", "needs the connection")
// do not match. The glossary is skipped: it defines terms (a service worker, a
// progressive web app) and makes no claim about this site.
//
// SINCE 2026-10-26 (B2). Wired into prebuild.
// ============================================================================

// File access for the packs and the source tree.
import fs from "node:fs";
// Path joining, so the guard runs from the repository root like its siblings.
import path from "node:path";

// The repository root: prebuild runs every guard from there.
const ROOT = process.cwd();

/** Every file under a directory whose name ends in one of the extensions (node_modules never walked). */
function filesUnder(dir, exts) {
  // The result list.
  const out = [];
  // A directory that does not exist yields nothing.
  if (!fs.existsSync(dir)) return out;
  // Walk depth-first.
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    // The entry's full path.
    const full = path.join(dir, entry.name);
    // Dependencies and generated trees are not the site's own code.
    if (entry.isDirectory() && !["node_modules", ".next", "out"].includes(entry.name)) out.push(...filesUnder(full, exts));
    // A file with a wanted extension.
    else if (entry.isFile() && exts.some((e) => entry.name.endsWith(e))) out.push(full);
  }
  // Done.
  return out;
}

// Does any first-party code register a service worker? (Scripts under public/, components and pages under src/.)
const code = [...filesUnder(path.join(ROOT, "src"), [".ts", ".tsx", ".js", ".mjs"]), ...filesUnder(path.join(ROOT, "public"), [".js", ".mjs"])];
// The registering file, if any.
const registrar = code.find((f) => /navigator\.serviceWorker\s*\.\s*register\s*\(/.test(fs.readFileSync(f, "utf8")));
// With a service worker, offline behaviour is something the code can support: nothing to hold.
if (registrar) {
  console.log(`[check-offline-claims] OK: a service worker is registered (${path.relative(ROOT, registrar)}); offline claims are the copy's to scope.`);
  process.exit(0);
}

// The promises that need a service worker, per language.
const PROMISES = {
  en: /\b(works? offline|keeps? working offline|keep(?:s)? working without a connection|available offline|progressive web app|dependent on nothing at runtime)\b/i,
  "pt-BR": /\b(funciona(?:m)? offline|continua(?:m)? funcionando offline|continua(?:m)? funcionando sem conexão|disponíve(?:l|is) offline|progressive web app|sem depender de nada em tempo de execução)\b/i,
};

// Every failure, one line each.
const failures = [];
// How many strings were read, for the report.
let read = 0;
for (const [loc, re] of Object.entries(PROMISES)) {
  // The authored pack.
  const pack = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "i18n", "messages", `${loc}.json`), "utf8"));
  // Every string value with its dotted key.
  const walk = (node, keys) => {
    // An object: its children (the glossary is definitions, not claims about the site).
    if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node)) if (!(keys.length === 0 && k === "glossary")) walk(v, [...keys, k]);
    } else if (typeof node === "string") {
      read++; // counted for the report
      const m = node.match(re); // a promise the code cannot keep, if any
      if (m) failures.push(`  - ${loc}:${keys.join(".")}: "${m[0]}"`);
    }
  };
  walk(pack, []);
}

// Any failure stops the build, with what to do.
if (failures.length) {
  console.error(`\n[check-offline-claims] FAIL: ${failures.length} offline promise(s) with no service worker registered:\n`);
  console.error(failures.join("\n"));
  console.error(
    "\n  No first-party code calls navigator.serviceWorker.register, so no page is kept for offline use. Say what is true " +
      "(a page needs the connection; a loaded catalogue tool's calculation makes no request), or ship the service worker first.\n"
  );
  process.exit(1); // the build stops here
}
// The success line.
console.log(
  `[check-offline-claims] OK: no service worker is registered, and none of ${read} English and Portuguese string(s) ` +
    `outside the glossary promises offline use or a progressive web app. Since 2026-10-26 (B2).`
);
