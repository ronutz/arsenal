// ============================================================================
// scripts/check-client-messages.mjs
// ----------------------------------------------------------------------------
// BUILD GUARD for the A1 client-message slicing (ratified 2026-07-10).
//
// A1 stopped shipping the whole message pack to every page. The root provider
// now carries only GLOBAL_CLIENT_NAMESPACES (src/i18n/clientMessages.ts), and
// each route adds the namespace its client components need via a nested
// <MessageSlice namespaces={[...]}>. next-intl's default on a MISSING message
// in a production build is to log and return the key (NOT throw), so a route
// that forgets a namespace would ship broken text and pass the build. This
// guard makes that a HARD FAILURE instead.
//
// WHAT IT CHECKS (sound, per-slice):
//   For every page/layout under src/app, for every CLIENT component rendered
//   on it, the set of message namespaces that component's subtree consumes via
//   useTranslations("ns") must be covered by:
//       GLOBAL_CLIENT_NAMESPACES  UNION  (the namespaces on the MessageSlice
//       that textually wraps that component, if any).
//   A component wrapped in no slice must be covered by the global set alone.
//
// HOW:
//   1. Scan every .tsx: record "use client", its useTranslations("ns") literals,
//      and the capitalized component tags it renders.
//   2. neededNs(component) = transitive union of useTranslations namespaces over
//      the component and everything it renders (server components contribute no
//      useTranslations of their own - those are server-side getTranslations -
//      but pass through their client descendants' needs, e.g. Header -> the
//      theme/search chrome).
//   3. For each page, find the <MessageSlice> spans (balanced match) and their
//      namespaces; attribute each rendered component to the innermost slice
//      that contains it (or "global-only" if none); assert coverage.
//
// Plain node, text-based (same technique as the other guards). A tools.<slug>
// namespace is matched by prefix so a slice of ["tools.cidr"] covers a use of
// useTranslations("tools.cidr").
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");

// ---- read the global allowlist straight from the source of truth ----------
const clientMsg = fs.readFileSync(path.join(SRC, "i18n/clientMessages.ts"), "utf8");
const globalBlock = clientMsg.slice(clientMsg.indexOf("GLOBAL_CLIENT_NAMESPACES"));
const GLOBAL = [...globalBlock.slice(0, globalBlock.indexOf("]")).matchAll(/"([^"]+)"/g)].map((m) => m[1]);

// ---- 1. scan every .tsx ----------------------------------------------------
/** @type {Map<string, {client:boolean, ns:string[], refs:string[]}>} by component name */
const comps = new Map();
/** file path by component name (basename without .tsx), for src/components/* */
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith(".tsx")) {
      const src = fs.readFileSync(p, "utf8");
      const head = src.slice(0, 200);
      const client = head.includes('"use client"') || head.includes("'use client'");
      const ns = [...src.matchAll(/useTranslations\("([^"]+)"\)/g)].map((m) => m[1]);
      const refs = [...src.matchAll(/<([A-Z][A-Za-z0-9]+)/g)].map((m) => m[1]);
      const name = e.name.replace(/\.tsx$/, "");
      comps.set(name, { client, ns, refs, path: p });
    }
  }
}
walk(SRC);

// ---- 2. transitive needed-namespaces per component -------------------------
const needCache = new Map();
function neededNs(name, seen = new Set()) {
  if (needCache.has(name)) return needCache.get(name);
  if (seen.has(name)) return new Set(); // cycle guard
  seen.add(name);
  const c = comps.get(name);
  const out = new Set();
  if (!c) return out; // referenced tag we don't own (Link, next/*, etc.)
  for (const n of c.ns) out.add(n);
  for (const r of c.refs) for (const n of neededNs(r, seen)) out.add(n);
  needCache.set(name, out);
  return out;
}

// ---- coverage check: needed set ⊆ (global ∪ provided), with tools.* prefix --
function covered(needed, provided) {
  const missing = [];
  for (const n of needed) {
    const ok = provided.some((p) => p === n || (p.endsWith(".") ? n.startsWith(p) : false) || n === p);
    // tools.<slug> exact match is normal; also allow a provided "tools.<slug>"
    if (!ok) missing.push(n);
  }
  return missing;
}

// ---- balanced <MessageSlice ...> ... </MessageSlice> spans in a file --------
function sliceSpans(src) {
  const spans = [];
  const openRe = /<MessageSlice\b[^>]*namespaces=\{\[([^\]]*)\]\}[^>]*>/g;
  let m;
  while ((m = openRe.exec(src))) {
    const ns = [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
    // find the matching </MessageSlice> accounting for nesting
    let depth = 1;
    const scan = /<MessageSlice\b|<\/MessageSlice>/g;
    scan.lastIndex = openRe.lastIndex;
    let end = src.length;
    let s2;
    while ((s2 = scan.exec(src))) {
      if (s2[0] === "</MessageSlice>") {
        depth--;
        if (depth === 0) { end = s2.index; break; }
      } else depth++;
    }
    spans.push({ ns, start: openRe.lastIndex, end });
  }
  return spans;
}

// ---- 3. check every page/layout under src/app ------------------------------
const errors = [];
function checkAppFile(p) {
  const src = fs.readFileSync(p, "utf8");
  if (!src.includes("useTranslations") && !/<[A-Z]/.test(src) && !src.includes("MessageSlice")) return;
  const spans = sliceSpans(src);
  // Every capitalized tag usage with its index.
  for (const m of src.matchAll(/<([A-Z][A-Za-z0-9]+)/g)) {
    const name = m[1];
    if (name === "MessageSlice") continue;
    const c = comps.get(name);
    if (!c || !c.client) {
      // Not a client component we own: still recurse for client descendants
      // (e.g. Header is server but renders client chrome). Attribute by position.
    }
    const need = neededNs(name);
    if (need.size === 0) continue;
    // innermost slice containing this tag position
    const idx = m.index;
    const containing = spans.filter((s) => idx >= s.start && idx < s.end);
    const provided = [...GLOBAL];
    for (const s of containing) provided.push(...s.ns);
    const missing = covered(need, provided);
    if (missing.length) {
      errors.push({
        page: path.relative(ROOT, p),
        component: name,
        missing: [...new Set(missing)],
        inSlice: containing.length ? containing.map((s) => s.ns.join("+")).join(" > ") : "(none - global only)",
      });
    }
  }
}
function walkApp(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkApp(p);
    else if (e.name === "page.tsx" || e.name === "layout.tsx") checkAppFile(p);
  }
}
walkApp(path.join(SRC, "app"));

if (errors.length) {
  console.error("[check-client-messages] FAILED - client components missing their message namespace:");
  for (const e of errors.slice(0, 40)) {
    console.error(`  - ${e.page}: <${e.component}> needs [${e.missing.join(", ")}] but only has global${e.inSlice === "(none - global only)" ? "" : " + slice " + e.inSlice}`);
    console.error(`      FIX: wrap <${e.component}> in <MessageSlice namespaces={[${e.missing.map((n) => `"${n}"`).join(", ")}]}> or add to GLOBAL_CLIENT_NAMESPACES.`);
  }
  if (errors.length > 40) console.error(`  ... and ${errors.length - 40} more`);
  process.exit(1);
}
console.log(`[check-client-messages] OK: every client component's namespaces are provided (global set: ${GLOBAL.join(", ")}; ${comps.size} components scanned).`);
