#!/usr/bin/env tsx
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// check-engine-sentences: EVERY SENTENCE AN ENGINE WRITES READS THE SAME
// THROUGH THE EN PACK, AND PT-BR HAS IT.
// ----------------------------------------------------------------------------
// WHY (2026-11-02, helper H8). Since 01/11/2026 an engine builds each sentence
// it writes as an EngineText (say("<id>", "<English>", args), in
// src/lib/tools/engine-text.ts), and the tool's page shows it through the
// message packs at tools.<slug>.engine.<id>, so the pt-BR page reads in
// Portuguese. The en pack carries the engine's English for every id, and the
// English page reads the pack too. Many ids are built at run time, and some of
// them are POSITIONS in a list: the HTTP status notes (code.<n>.note<i>), the
// OAuth flow chooser's reasons (why.<type>.0/.1), a health gate's reasons
// (gate.<rule>.reason<k>), a hypothesis's supports (hyp.<id>.supports<k>).
// Reorder such a list in the engine, or reword one of its sentences, without
// the packs, and both pages show the wrong sentence (or the old one) with
// every other guard green: the API and the golden vectors read the engine's
// English, never the packs. check-engine-catalogue (batch H5) rebuilds the
// catalogue constants of 12 tools; this guard covers what the engines actually
// emit, for every tool, from the inputs the tools' own golden vectors use. The
// localisation batches (L2, L3, L4, 01-02/11/2026) proved this property once
// with throwaway scripts; this makes it permanent.
//
// HOW IT SEES THE SENTENCES. Every tool's public function returns
// plainText(<its localisable reading>), and plainText() walks that reading
// asking `instanceof EngineText` of each value; a thrown engine error gets its
// sentence through withEngineText(), which assigns err.engineText. This guard
// installs two observers for the length of the run and changes no file:
//   1. EngineText[Symbol.hasInstance], so every EngineText plainText() meets
//      (that is, every sentence in what the API returns) is collected;
//   2. an accessor for engineText on Error.prototype, so the sentence attached
//      to a thrown error is collected when it is attached (the accessor then
//      stores it on the error as an ordinary property, as before).
// A sentence's arguments that are sentences themselves (or lists of them) are
// collected too. A self-test runs both paths first: if engine-text.ts ever
// stops using instanceof or [[Set]] there, the guard fails as BLIND rather
// than passing with nothing seen.
//
// WHAT IT RUNS. Every golden-vector set (verifyVectors) of every tool under
// src/lib/tools/<slug>/ whose engine reaches engine-text.ts through its
// imports (followed statically, relative and "@/" imports), plus the few
// SUPPLEMENTARY calls below (inputs the vectors do not reach, for positional
// lists). Sentences are attributed to the tool whose set produced them, which
// is the namespace its page reads.
//
// WHAT IT CHECKS, for each distinct sentence seen (id, English, arguments):
//   1. if the tool's page reads engine keys (a component that imports
//      engineTexts() and reads useTranslations("tools.<slug>")), en has
//      tools.<slug>.engine.<id>;
//   2. where en has the key, the message formatted the way the page formats it
//      (next-intl's own translator, engineTexts() of engine-text.ts, the
//      sentence's arguments substituted, nested sentences through the pack,
//      ICU quoting undone) equals the engine's English exactly: a reordered
//      list, a reworded sentence or a renamed argument lands here;
//   3. pt-BR has the key, and its message formats with the same arguments
//      without an error;
//   and, for every tool whose page reads engine keys:
//   4. every key under tools.<slug>.engine in en exists in pt-BR.
// A vector set that throws is a failure too (its sentences after the throw
// were never seen; run-golden-vectors says why it threw).
//
// WHAT IT DOES NOT SEE. Sentences on inputs no golden vector (and no
// supplementary call) reaches, and catalogue texts a page looks up by key
// without the engine emitting them (check-engine-catalogue covers those for
// its 12 tools). The OK line prints how many en engine keys the run reached.
//
// HOW TO CLEAR A FAILURE: when an engine's sentence or list changes on
// purpose, reword or move the en entries to match (same key, same English) and
// revise the pt-BR entries; never renumber a positional list in the engine
// alone. A new id needs its en and pt-BR entries in the same change.
//
// RUN TIME: about 4 s on the sandbox (88 tools, their 88 vector sets and
// the supplementary calls; measured 2026-11-02). Deterministic: sets run in path
// order, results are sorted, nothing depends on the clock or the network.
//
// Run: npx tsx scripts/check-engine-sentences.mts   (from the repository root;
//      add --report for one coverage line per tool)
// ============================================================================

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs"; // packs, sources, folders
import path from "node:path"; // paths
import { pathToFileURL } from "node:url"; // to import a module by path
import { performance } from "node:perf_hooks"; // the run time
import { createTranslator } from "use-intl/core"; // next-intl's own translator (next-intl depends on use-intl at its version)
import { EngineText, engineTexts, plainText, say, engineError, type EngineArg, type EngineTranslator } from "../src/lib/tools/engine-text.ts"; // the sentence class and the page's lookups

const T0 = performance.now(); // the start, for the run time
const ROOT = process.cwd(); // the repository root
const TOOLS = path.join(ROOT, "src/lib/tools"); // the tools' folders
const ENGINE_TEXT = path.join(TOOLS, "engine-text.ts"); // the helper every sentence comes from

/** A message pack, as loaded (nested objects of strings). */
type Pack = Record<string, unknown>; // nested JSON
const load = (loc: string): Pack => JSON.parse(readFileSync(path.join(ROOT, `src/i18n/messages/${loc}.json`), "utf8")) as Pack; // a pack
const PACKS: Record<"en" | "pt-BR", Pack> = { en: load("en"), "pt-BR": load("pt-BR") }; // the two authored packs

// ---------------------------------------------------------------------------
// SUPPLEMENTARY CALLS. Inputs the golden vectors do not reach, so that every
// position of a positional list is compared (and, for a page that asks its
// engine for sentences directly, every sentence it can ask for). Each call is
// made with the observers on and its result is passed through plainText()
// (already plain for a public function; the way a function that returns
// sentences directly gets seen). Add an entry when a tool's vectors do not
// reach one of its positional lists.
// ---------------------------------------------------------------------------

/** An engine module, as imported (its exports by name). */
type EngineModule = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any -- each engine's own exports

/** One tool's supplementary calls. */
interface Supplement {
  /** The tool (its folder under src/lib/tools, the namespace its page reads). */
  slug: string;
  /** The engine file in that folder whose exports the calls use. */
  file: string;
  /** The exports the calls use (checked first, so a rename fails here with a clear message). */
  uses: string[];
  /** The calls, each a function of the module, called with the observers on. */
  calls: (m: EngineModule) => (() => unknown)[];
}

/** The supplementary calls, by tool. */
const SUPPLEMENTS: Supplement[] = [
  { // every HTTP status code 100-599, twenty per call (the explainer's cap): every code.<n>.meaning and code.<n>.note<i>
    slug: "http-status-code-explainer", file: "compute.ts", uses: ["run"], // the public function
    calls: (m) => Array.from({ length: 25 }, (_, k) => () => m.run(Array.from({ length: 20 }, (_, i) => String(100 + k * 20 + i)).join(" "))), // 25 calls
  },
  { // every combination of the OAuth flow chooser's three answers: every why.<type>.<i>, name, note and warning
    slug: "oauth-flow-chooser", file: "compute.ts", uses: ["choose"], // the public function
    calls: (m) => ["server-web", "spa", "native", "service", "device"].flatMap((appType) => [false, true].flatMap((wantsIdentity) => [false, true].map((needsOffline) => () => m.choose({ appType, wantsIdentity, needsOffline })))), // 20 calls
  },
  { // the log-level mapper's page asks its engine for each rung's description and each ladder's caveat (no vector does)
    slug: "log-level-mapper", file: "compute.ts", uses: ["LADDERS", "rungDescription", "ladderCaveat"], // the ladders and the two lookups
    calls: (m) => (m.LADDERS as { key: string; rungs: unknown[] }[]).flatMap((l) => [() => m.ladderCaveat(l), ...l.rungs.map((r) => () => m.rungDescription(l.key, r))]), // every caveat and rung
  },
];

// ---------------------------------------------------------------------------
// THE OBSERVERS (see "HOW IT SEES THE SENTENCES" above).
// ---------------------------------------------------------------------------

let sink: EngineText[] | null = null; // where sentences go while a tool's calls run (null: not collecting)
const ordinaryInstanceOf = Function.prototype[Symbol.hasInstance]; // the language's own instanceof
Object.defineProperty(EngineText, Symbol.hasInstance, { // observer 1: every instanceof EngineText
  configurable: true, // removable at the end
  value(this: unknown, v: unknown): boolean { // the check plainText() asks of each value
    const is = ordinaryInstanceOf.call(this, v); // the ordinary answer
    if (is && sink) sink.push(v as EngineText); // a sentence in a reading: collected
    return is; // the answer is unchanged
  }, // value
}); // observer 1
Object.defineProperty(Error.prototype, "engineText", { // observer 2: a sentence attached to a thrown error
  configurable: true, // removable at the end
  get(): undefined { return undefined; }, // an error without a sentence reads as before
  set(this: Error, m: unknown) { // withEngineText() assigns it
    if (sink && ordinaryInstanceOf.call(EngineText, m)) sink.push(m as EngineText); // collected
    Object.defineProperty(this, "engineText", { value: m, writable: true, enumerable: true, configurable: true }); // stored on the error, as an ordinary assignment would
  }, // set
}); // observer 2

/** Remove both observers (the end of the run). */
function removeObservers(): void {
  delete (EngineText as unknown as Record<symbol, unknown>)[Symbol.hasInstance]; // instanceof as the language has it
  delete (Error.prototype as unknown as Record<string, unknown>).engineText; // errors as before
} // removeObservers

const problems: string[] = []; // every failure, as a line

/** Self-test: both paths must be seen, or the guard is blind and says so. */
function selfTest(): void {
  sink = []; // collecting
  plainText({ reading: [say("selftest.walk", "seen in a reading")] }); // path 1: a reading
  try { throw engineError(say("selftest.error", "seen on an error")); } catch { /* path 2: an error's sentence */ } // thrown and caught
  const ids = sink.map((m) => m.id).sort(); // what was seen
  sink = null; // stopped
  if (ids.join(",") !== "selftest.error,selftest.walk") problems.push(`BLIND: the observers saw [${ids.join(", ")}] instead of both self-test sentences: src/lib/tools/engine-text.ts no longer tests sentences with instanceof in plainText() or no longer assigns err.engineText; update this guard's observers to match.`); // fail loudly
} // selfTest
selfTest(); // before anything else

// ---------------------------------------------------------------------------
// WHICH TOOLS: engines that reach engine-text.ts, pages that read engine keys.
// ---------------------------------------------------------------------------

const importCache = new Map<string, string[]>(); // file -> the files it imports (resolved)

/**
 * The files a module imports, resolved (relative and "@/" specifiers only; packages are not followed).
 * @param file an absolute .ts or .tsx path
 * @returns the absolute paths it imports
 */
function importsOf(file: string): string[] {
  const hit = importCache.get(file); // seen before
  if (hit) return hit; // as resolved then
  const src = readFileSync(file, "utf8"); // its text
  const specs = [...src.matchAll(/(?:^|[\s;])(?:import|export)\s[^;]*?\sfrom\s*["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|^\s*import\s*["']([^"']+)["']/gm)].map((m) => m[1] ?? m[2] ?? m[3]); // every specifier
  const out: string[] = []; // resolved
  for (const spec of specs) { // each
    const base = spec.startsWith("@/") ? path.join(ROOT, "src", spec.slice(2)) : spec.startsWith(".") ? path.resolve(path.dirname(file), spec) : null; // ours, or a package
    if (!base) continue; // a package: not followed
    const found = [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")].find((p) => existsSync(p) && statSync(p).isFile()); // the file it names
    if (found) out.push(found); // followed
  } // specifiers
  importCache.set(file, out); // remembered
  return out; // done
} // importsOf

/**
 * Whether a module reaches engine-text.ts through its imports.
 * @param file the module
 * @returns true when engine-text.ts is in its import closure
 */
function reachesEngineText(file: string): boolean {
  const seen = new Set<string>([file]); // visited
  const queue = [file]; // to visit
  while (queue.length > 0) { // breadth first
    for (const next of importsOf(queue.shift()!)) { // its imports
      if (next === ENGINE_TEXT) return true; // reached
      if (!seen.has(next)) { seen.add(next); queue.push(next); } // further
    } // imports
  } // queue
  return false; // not reached
} // reachesEngineText

/**
 * Every .tsx file under a folder.
 * @param dir the folder
 * @param out the list being filled
 * @returns the list
 */
function tsxFiles(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) { // each entry
    const p = path.join(dir, e.name); // its path
    if (e.isDirectory()) tsxFiles(p, out); // deeper
    else if (e.name.endsWith(".tsx")) out.push(p); // a component or page
  } // entries
  return out; // filled
} // tsxFiles

/** The tools whose page reads engine keys: a component that imports engineTexts() and reads useTranslations("tools.<slug>"). */
const READS = new Set<string>(); // slugs
for (const file of [...tsxFiles(path.join(ROOT, "src/components")), ...tsxFiles(path.join(ROOT, "src/app"))]) { // every component and page
  const src = readFileSync(file, "utf8"); // its text
  if (!/import\s*\{[^}]*\bengineTexts\b[^}]*\}\s*from/.test(src)) continue; // does not read engine keys (a mention in a comment does not count)
  for (const m of src.matchAll(/useTranslations\(\s*["']tools\.([a-z0-9-]+)["']\s*\)/g)) READS.add(m[1]); // the namespace it reads
} // files

/** The tools to run: folder, and the files in it that define verifyVectors. */
const RUN: { slug: string; sets: string[] }[] = []; // in path order
for (const slug of readdirSync(TOOLS).sort()) { // each folder
  const dir = path.join(TOOLS, slug); // its path
  if (!statSync(dir).isDirectory()) continue; // a file (engine-text.ts itself)
  const files = readdirSync(dir).filter((f) => f.endsWith(".ts")).sort(); // its modules
  if (!files.some((f) => reachesEngineText(path.join(dir, f)))) continue; // writes no sentences
  const sets = files.filter((f) => /export\s+(?:async\s+)?function\s+verifyVectors\b/.test(readFileSync(path.join(dir, f), "utf8"))).map((f) => path.join(dir, f)); // its vector sets
  RUN.push({ slug, sets }); // to run
} // folders

// ---------------------------------------------------------------------------
// COLLECT: run each tool's vectors (and its supplementary calls) with the
// observers on.
// ---------------------------------------------------------------------------

/** Every sentence inside a value: the sentence and its arguments (nested sentences, list items, a list's separator). */
function expand(m: EngineText, acc: EngineText[]): void {
  acc.push(m); // the sentence
  for (const a of Object.values(m.args ?? {}) as EngineArg[]) { // its arguments
    if (typeof a === "string") continue; // plain text
    if (ordinaryInstanceOf.call(EngineText, a)) { expand(a as EngineText, acc); continue; } // a nested sentence
    const list = a as Exclude<EngineArg, string | EngineText>; // a list
    for (const item of list.items) expand(item, acc); // its items
    if (typeof list.sep !== "string") expand(list.sep, acc); // a separator the page translates
  } // arguments
} // expand

/** The English of an argument as the engine joins it (for the signature only). */
function englishOf(a: EngineArg): string {
  if (typeof a === "string") return a; // text
  if (ordinaryInstanceOf.call(EngineText, a)) return (a as EngineText).text; // a sentence
  const list = a as Exclude<EngineArg, string | EngineText>; // a list
  return list.items.map((i) => i.text).join(typeof list.sep === "string" ? list.sep : list.sep.text); // joined
} // englishOf

/** One distinct sentence per tool: id, English and arguments' English make it distinct. */
const seen = new Map<string, Map<string, EngineText>>(); // slug -> signature -> a sentence
let setsRun = 0, callsRun = 0; // tallies
for (const { slug, sets } of RUN) { // each tool
  const raw: EngineText[] = []; // what the observers saw
  for (const file of sets) { // each vector set
    let mod: { verifyVectors?: () => unknown }; // the set's module
    try { mod = (await import(pathToFileURL(file).href)) as typeof mod; } // loaded
    catch (e) { problems.push(`${slug}: ${path.relative(ROOT, file)} could not be imported (${(e instanceof Error ? e.message : String(e)).split("\n")[0].slice(0, 120)})`); continue; } // a finding, not a skip
    sink = raw; // collecting
    try { await mod.verifyVectors?.(); } // the vectors, as run-golden-vectors runs them
    catch (e) { problems.push(`${slug}: ${path.relative(ROOT, file)} threw (${(e instanceof Error ? e.message : String(e)).split("\n")[0].slice(0, 120)}); its sentences after the throw were not seen (run-golden-vectors says why)`); } // a failing set
    finally { sink = null; } // stopped
    setsRun += 1; // counted
  } // sets
  for (const s of SUPPLEMENTS.filter((x) => x.slug === slug)) { // its supplementary calls
    const mod = (await import(pathToFileURL(path.join(TOOLS, slug, s.file)).href)) as EngineModule; // the engine
    const gone = s.uses.filter((name) => mod[name] === undefined); // exports renamed or removed
    if (gone.length > 0) { problems.push(`${slug}: ${s.file} no longer exports ${gone.join(", ")}; update SUPPLEMENTS in this guard`); continue; } // a clear failure, not a silent skip
    for (const call of s.calls(mod)) { // each call
      sink = raw; // collecting
      try { plainText(await call()); } catch { /* an input error is a sentence too, collected by observer 2 */ } // called, its result walked
      finally { sink = null; } // stopped
      callsRun += 1; // counted
    } // calls
  } // supplements
  const flat: EngineText[] = []; // with nested sentences
  for (const m of new Set(raw)) expand(m, flat); // each object once, then its arguments
  const bySig = seen.get(slug) ?? new Map<string, EngineText>(); // this tool's distinct sentences
  for (const m of flat) { // each
    const sig = JSON.stringify([m.id, m.text, Object.entries(m.args ?? {}).map(([k, a]) => [k, englishOf(a)])]); // what makes it distinct
    if (!bySig.has(sig)) bySig.set(sig, m); // kept once
  } // sentences
  seen.set(slug, bySig); // recorded
} // tools
removeObservers(); // the language as it was

// ---------------------------------------------------------------------------
// CHECK, as the page formats.
// ---------------------------------------------------------------------------

/**
 * The flat view of a tool's engine messages in a pack: key under engine. -> message.
 * @param pack the pack
 * @param slug the tool
 * @returns the flat map
 */
function engineKeys(pack: Pack, slug: string): Map<string, string> {
  const out = new Map<string, string>(); // flat
  const walk = (node: unknown, prefix: string): void => { // depth first
    if (typeof node === "string") { out.set(prefix, node); return; } // a message
    if (node && typeof node === "object") for (const [k, v] of Object.entries(node)) walk(v, prefix ? `${prefix}.${k}` : k); // deeper
  }; // walk
  const tools = pack.tools as Record<string, Record<string, unknown>> | undefined; // the tools' namespace
  walk(tools?.[slug]?.engine, ""); // from engine.
  return out; // done
} // engineKeys

/**
 * A translator for one tool's namespace, as the page has it, with its errors collected.
 * @param locale the pack
 * @param slug the tool
 * @param errors where formatting errors go
 * @returns the translator
 */
function translator(locale: "en" | "pt-BR", slug: string, errors: string[]): EngineTranslator {
  return createTranslator({ locale, messages: PACKS[locale], namespace: `tools.${slug}`, onError: (e: Error) => { errors.push(e.message); } }) as unknown as EngineTranslator; // next-intl's formatter
} // translator

let compared = 0, reachedKeys = 0, enKeysTotal = 0; // tallies
const perTool: string[] = []; // one line per tool, for --report
const ids = new Set<string>(); // distinct (tool, id) seen
for (const [slug, bySig] of [...seen.entries()].sort(([a], [b]) => a.localeCompare(b))) { // each tool, in order
  const reads = READS.has(slug); // does its page read engine keys
  const en = engineKeys(PACKS.en, slug), pt = engineKeys(PACKS["pt-BR"], slug); // its keys in both packs
  const enErr: string[] = [], ptErr: string[] = []; // formatting errors
  const tEn = translator("en", slug, enErr), tPt = translator("pt-BR", slug, ptErr); // both translators
  const pageEn = engineTexts(tEn), pagePt = engineTexts(tPt); // the page's lookups
  const reached = new Set<string>(); // ids reached in this tool
  const told = new Set<string>(); // "<check> <id>" already reported (one line per id and check, not per instance)
  /** Report a problem once per id and check. */
  const tell = (check: string, id: string, line: string): void => { if (!told.has(`${check} ${id}`)) { told.add(`${check} ${id}`); problems.push(line); } }; // once
  const sorted = [...bySig.values()].sort((a, b) => (a.id === b.id ? a.text.localeCompare(b.text) : a.id.localeCompare(b.id))); // deterministic order
  for (const m of sorted) { // each distinct sentence
    reached.add(m.id); ids.add(`${slug}\u0000${m.id}`); // counted
    const key = `tools.${slug}.engine.${m.id}`; // its pack key
    if (!en.has(m.id)) { // 1: no en message
      if (reads) tell("1", m.id, `en: ${key} is missing (the engine emits it; its English: ${JSON.stringify(m.text.slice(0, 100))})`); // the page would fall back to the engine's English in every language
      continue; // nothing to compare
    } // 1
    compared += 1; // counted
    enErr.length = 0; // fresh
    const shown = pageEn.say(m); // 2: what the English page shows
    if (enErr.length > 0) tell("2f", m.id, `en: ${key} does not format with the engine's arguments (${enErr[0].slice(0, 140)})`); // a renamed or missing argument
    else if (shown !== m.text) tell("2", m.id, `en: ${key} does not say what the engine says (a reordered list, a reworded sentence, or a changed argument)\n      pack:   ${JSON.stringify(shown.slice(0, 160))}\n      engine: ${JSON.stringify(m.text.slice(0, 160))}`); // drifted
    if (!pt.has(m.id)) { if (reads) tell("3", m.id, `pt-BR: ${key} is missing (en has it)`); continue; } // 3: no pt-BR message
    ptErr.length = 0; // fresh
    pagePt.say(m); // 3: what the pt-BR page shows
    if (ptErr.length > 0) tell("3f", m.id, `pt-BR: ${key} does not format with the engine's arguments (${ptErr[0].slice(0, 140)})`); // a broken translation
  } // sentences
  const reachedHere = [...en.keys()].filter((k) => reached.has(k)).length; // the en keys this tool's run reached
  enKeysTotal += en.size; // every en engine key of the tools run
  reachedKeys += reachedHere; // those the run reached
  perTool.push(`  ${slug}: ${bySig.size} sentence(s), ${reached.size} id(s); ${reachedHere} of ${en.size} en engine key(s) reached${reads ? "" : "; its page does not read engine keys"}`); // for --report
} // tools

for (const slug of [...READS].sort()) { // 4: every tool whose page reads engine keys
  const en = engineKeys(PACKS.en, slug), pt = engineKeys(PACKS["pt-BR"], slug); // its keys
  for (const k of en.keys()) if (!pt.has(k)) problems.push(`pt-BR: tools.${slug}.engine.${k} is missing (en has it)`); // a translation dropped
} // tools

if (process.argv.includes("--report")) console.log(`[check-engine-sentences] per tool (coverage):\n${perTool.join("\n")}`); // coverage, on request
const unique = [...new Set(problems)]; // the same line from checks 3 and 4 counts once
const seconds = ((performance.now() - T0) / 1000).toFixed(1); // the run time
if (unique.length > 0) { // failed
  console.error(`\n[check-engine-sentences] FAIL: ${unique.length} problem(s) (${seconds} s)\n`); // headline
  for (const p of unique.slice(0, 40)) console.error(`  - ${p}`); // the first forty
  if (unique.length > 40) console.error(`  ... and ${unique.length - 40} more`); // the rest, counted
  process.exit(1); // a hard stop
} // reported
const sentences = [...seen.values()].reduce((n, m) => n + m.size, 0); // distinct sentences
console.log(`[check-engine-sentences] OK: ${RUN.length} tool(s) whose engines write sentences, ${setsRun} vector set(s) and ${callsRun} supplementary call(s) run; ${sentences} distinct sentence(s) under ${ids.size} id(s), ${compared} compared: the en pack says exactly what each engine says, and pt-BR has every key and formats it (${READS.size} page(s) read engine keys; the run reached ${reachedKeys} of the ${enKeysTotal} en engine keys of those ${RUN.length} tools, the rest being catalogue texts or inputs no vector reaches: --report lists them by tool; ${seconds} s).`); // the result
