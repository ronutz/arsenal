#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-local-claims.mjs - "EVERY TOOL IS LOCAL" WHERE ONE ROOM IS NOT
// ----------------------------------------------------------------------------
// The site is local-first, not local-only. The catalogue (the main floor) and
// the green room compute in the browser; the red room (/dev/out) holds the few
// tools whose whole job is to ask a live official service, and they send a
// query only when the reader presses Ask. A sentence that says every tool, all
// the tools or everything runs in the browser is therefore false unless it is
// scoped: to the catalogue, the main floor, one tool, or with the red room named
// as the exception.
//
// WHY THIS EXISTS (row 62, PRIME 2026-10-07 09:47, adopting SCOUT's re-run of
// 09:03): the Tools page said "Nothing you type is sent anywhere" one sentence
// before saying the red room sends input out; the home page, the guide, the
// colophon, the privacy page and the contribute page said the same thing in
// their own words. The wording was fixed in one batch; this guard keeps a new
// universal claim from coming back, in English and in Portuguese.
//
// WHAT IT READS: every string of the English and Portuguese packs, except the
// places where a locality claim is about one tool or about a room's own tools:
// a tool's own keys (tools.<tool id>.*), the two rooms' pages (devOther, devOut),
// the per-tool requirement notes (toolRequirements) and the glossary (where
// "the key never leaves the device" is about passkeys, not about this site).
//
// WHAT FAILS: a clause (no full stop, colon or semicolon inside it) that joins a
// universal subject ("every tool", "all tools", "the tools on this site",
// "everything"; "toda ferramenta", "todas as ferramentas", "as ferramentas
// deste site", "tudo") to a locality word (browser, local, device, machine,
// sends nothing, leaves; navegador, local, dispositivo, máquina, não envia, sai)
// in a value that never scopes it (catalogue, main floor, green room, red room,
// this tool; catálogo, andar principal, sala verde, sala vermelha, esta
// ferramenta). DECLARED holds the exceptions, each with its reason.
// ============================================================================

// File access for the packs.
import fs from "node:fs";
// Path joining, so the guard runs from the repository root like its siblings.
import path from "node:path";

// The repository root: prebuild runs every guard from there.
const ROOT = process.cwd();

// The tool ids, read from the registry's id fields, so a tool's own keys are recognised.
const REGISTRY = fs.readFileSync(path.join(ROOT, "src", "config", "tools.ts"), "utf8");
const TOOL_IDS = new Set([...REGISTRY.matchAll(/\bid:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]));

// The patterns, per language: a universal subject and a locality word in one clause, and the words that scope a claim.
const RULES = {
  en: {
    universal: /\b(every tool|all (?:the )?tools|the tools on this site|the tools here|everything)\b[^.;:]*\b(browser|locally|local|your device|your machine|sends? nothing|leaves? (?:your|the) (?:browser|device|machine|page))\b/i,
    scope: /(catalogue|main floor|green room|red room|this tool)/i,
  },
  "pt-BR": {
    universal: /\b(toda ferramenta|todas as ferramentas|as ferramentas deste site|as ferramentas daqui|tudo)\b[^.;:]*\b(navegador|localmente|local|seu dispositivo|sua máquina|não envia|saem? do seu (?:navegador|dispositivo))\b/i,
    scope: /(catálogo|andar principal|sala verde|sala vermelha|esta ferramenta)/i,
  },
};

// Exceptions, keyed by pack and message key, each with its reason; they may only shrink.
const DECLARED = new Map([
  // The settings page: it speaks of the reader's preferences, which are kept in this browser and nowhere else.
  ["en:settings_page.lede", "About the settings, stored on the device; true as written."],
  ["pt-BR:settings_page.lede", "Sobre as preferências, guardadas no dispositivo; verdadeiro como está."],
  // The API page, when local processing is on: it offers the browser tools as the way to keep everything local.
  ["en:api.servedOnBody", "A choice offered to the reader, not a claim about every tool; true as written."],
  ["pt-BR:api.servedOnBody", "Uma escolha oferecida ao leitor, não uma afirmação sobre toda ferramenta; verdadeiro como está."],
]);
// The declarations that matched, for the stale check.
const seen = new Set();

/** Whether a key is one of the places this guard leaves alone (see the header). */
function exempt(key) {
  // The first two segments of the key.
  const [ns, second] = key.split(".");
  // A tool's own keys: its claim is about itself.
  if (ns === "tools" && TOOL_IDS.has(second)) return true;
  // The rooms' own pages, the per-tool requirement notes, the glossary.
  return ["devOther", "devOut", "toolRequirements", "glossary"].includes(ns);
}

// Every failure, one line each.
const failures = [];
// How many strings were read, for the report.
let read = 0;
for (const [loc, rule] of Object.entries(RULES)) {
  // The authored pack.
  const pack = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "i18n", "messages", `${loc}.json`), "utf8"));
  // Every string value with its dotted key.
  const walk = (node, keys) => {
    // An object: its children.
    if (node && typeof node === "object") for (const [k, v] of Object.entries(node)) walk(v, [...keys, k]);
    // A string: judged unless exempt.
    else if (typeof node === "string") {
      const key = keys.join(".");
      if (exempt(key)) return; // a tool's or a room's own claim
      read++; // counted for the report
      const m = node.match(rule.universal); // a universal locality claim, if any
      if (!m || rule.scope.test(node)) return; // none, or scoped in the same value
      const id = `${loc}:${key}`; // the declaration's key
      if (DECLARED.has(id)) {
        seen.add(id); // declared, with its reason
        return;
      }
      failures.push(`  - ${id}: "${m[0]}"`); // the clause that says too much
    }
  };
  walk(pack, []);
}
// A declaration that matched nothing must go.
for (const id of DECLARED.keys()) if (!seen.has(id)) failures.push(`  - DECLARED "${id}" no longer matches anything and must be removed.`);

// Any failure stops the build, with the clause and how to fix it.
if (failures.length) {
  console.error(`\n[check-local-claims] FAIL: ${failures.length} universal locality claim(s) without a scope:\n`);
  console.error(failures.join("\n"));
  console.error(
    `\n  The site is local-first, not local-only: the red room's tools ask a live service when you press Ask. ` +
      `Scope the sentence (the catalogue, the main floor, this tool) or name the red room as the exception; ` +
      `a sentence that is right as it stands goes into DECLARED with its reason.\n`
  );
  process.exit(1); // the build stops here
}
// The success line.
console.log(
  `[check-local-claims] OK: ${read} English and Portuguese string(s) read outside the tools' own and the rooms' own; ` +
    `no universal locality claim without its scope (the catalogue, the main floor, one tool, or the red room named). ` +
    `${DECLARED.size} declared exception(s), may only shrink. Since 2026-10-07 (row 62).`
);
