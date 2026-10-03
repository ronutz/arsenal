#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-ptbr-diacritics.mjs - PORTUGUESE WITH ITS ACCENTS STRIPPED
// ----------------------------------------------------------------------------
// Fails the build when a pt-BR message contains a word that is never correct
// Portuguese without its accent: "nao" for "não", "configuracao" for
// "configuração"; or a grave accent where Portuguese never writes one:
// "pelàs" for "pelas".
//
// WHY THIS EXISTS (2026-10-02). CLAUDE.md has always said "proper native
// diacritics always". An audit that day found 158 pt-BR values - almost all
// glossary text, present since the repository's baseline commit - written with
// every accent stripped ("a comutacao foi uma melhoria de seguranca que ninguem
// vendeu como tal"), and the pt-BR label shown beside every founding year read
// "Ano de fundacao:". Every guard in the prebuild chain passed the whole time:
// ICU parsing, key parity and numeral checks are blind to a missing cedilla.
// The values were restored that day under a mechanical rule - stripping the
// accents from each corrected value had to reproduce the original exactly, so
// nothing but diacritics could change - and this guard keeps them restored.
//
// HOW IT DECIDES. Two kinds of evidence, each chosen so that a hit is an error
// and never a judgment call:
//   1. WORDS with no unaccented homograph in Portuguese - "nao", "voce",
//      "entao", "seguranca", "codigo", "padrao". Without its accent such a
//      word is not some other valid word; it is simply misspelt.
//   2. ENDINGS that are always accented - -ção/-ções, -são/-sões, -xão/-xões,
//      -ível/-íveis, -ável/-áveis. Unaccented, "-cao", "-coes", "-ivel" and
//      "-aveis" end no Portuguese word, which is how this rule found the one
//      value ("medicoes") that three word-list sweeps had missed.
//   3. A GRAVE ACCENT outside the crase. Portuguese writes the grave accent
//      only to mark the crase - à, às, àquele(s), àquela(s), àquilo - so on
//      any other word it is a typo or a foreign word. Added the same evening:
//      the audit's own sweep had fixed "pelàs" and "dàs" in some values and
//      missed one "pelàs" (glossary.entries.roadsec.context), found only when
//      the canon record was being checked against the pack. A class that a
//      careful sweep misses once is a class that needs a rule. Foreign names
//      written with their own grave accent (Ampère, Courrège, système D) are
//      declared below, one per value.
//
// WHAT IT DELIBERATELY DOES NOT FLAG, because a guard that cries wolf gets
// switched off:
//   * pairs only context can settle: e/é, a/à, esta/está, so/só, ha/há,
//     pais/país, and verbs whose noun twin carries the accent - valida
//     (validates) / válida, copia / cópia, publica / pública, pratica /
//     prática, gerencia / gerência, divida / dívida, mascara / máscara, maquina
//     / máquina, modulo / módulo. The 2026-10-02 audit read every such
//     occurrence in context; the verbs are correct as written.
//   * ALL-CAPS tokens, which are acronyms (HA, SO), and tokens carrying digits
//     or underscores (JA3, JA4, config keywords), which are not words.
//
// DECLARED EXCEPTIONS are keyed by message key AND word, carry their reason,
// and may only shrink; one that stops matching is reported as stale.
// ============================================================================

// File access for the message pack.
import fs from "node:fs";
// Path joining, so the guard runs from the repository root like its siblings.
import path from "node:path";

// The repository root: prebuild runs every guard from there.
const ROOT = process.cwd();
// The authored pt-BR pack; public/locales/pt-BR.json is a copy made from it.
const FILE = path.join(ROOT, "src", "i18n", "messages", "pt-BR.json");

// Words that are misspelt, never a different valid word, without their accent.
// Kept short and certain on purpose: every entry was checked against the pack
// before it was added, and a verb with an accented noun twin never belongs here.
const NEVER_UNACCENTED = new Set([
  "nao", "voce", "voces", "entao", "tambem", "ninguem", "alguem", "alem",
  "porem", "estao", "sera", "serao", "ja", "sao", "seguranca", "endereco",
  "enderecos", "servico", "servicos", "codigo", "codigos", "unico", "unica",
  "unicos", "unicas", "ultimo", "ultima", "ultimos", "ultimas", "proximo",
  "proxima", "proximos", "proximas", "tecnico", "tecnica", "tecnicos",
  "tecnicas", "historico", "historica", "basico", "basica", "rapido", "rapida",
  "facil", "faceis", "dificil", "dificeis", "automatico", "automatica",
  "automaticos", "automaticas", "memoria", "memorias", "padrao", "padroes",
]);

// Endings no unaccented Portuguese word has. `should` names the correct form
// for the failure message.
const ALWAYS_ACCENTED_ENDINGS = [
  { re: /[cx]ao$/, should: "-ção or -xão" },
  { re: /[cx]oes$/, should: "-ções or -xões" },
  { re: /[^s]sao$/, should: "-são" },
  { re: /ssao$/, should: "-ssão" },
  { re: /soes$/, should: "-sões" },
  { re: /ivel$/, should: "-ível" },
  { re: /iveis$/, should: "-íveis" },
  { re: /avel$/, should: "-ável" },
  { re: /aveis$/, should: "-áveis" },
];
// Ending rules apply only to words at least this long, so a short token that
// happens to end in "-cao" cannot trip them.
const MIN_ENDING_LENGTH = 5;

// The only Portuguese words that carry a grave accent: the crase contractions.
const CRASE = new Set(["à", "às", "àquele", "àquela", "àqueles", "àquelas", "àquilo"]);
// Any lower-case grave-accented vowel; tokens are lower-cased before the test.
const GRAVE = /[àèìòù]/;

// Declared exceptions, keyed "message.key|word". MAY ONLY SHRINK.
const DECLARED = new Map([
  [
    "glossary.entries.uucp.context|voce",
    "A hostname in the UUCP bang path the entry quotes (minhamaquina!maquinadeles!voce). Hostnames carry no accents.",
  ],
  [
    "glossary.entries.gts-gter.context|courrège",
    "Alberto Courrège Gomide, after whom the award this entry mentions is named: a surname keeps its own spelling.",
  ],
  [
    "glossary.entries.gambiarra.depth|système",
    "système D, the French expression the entry names alongside gambiarra, quoted in French.",
  ],
  [
    "glossary.entries.andre-marie-ampere.context|ampère",
    "André-Marie Ampère's surname, which keeps its French spelling.",
  ],
]);

// Parse the pack once.
const pack = JSON.parse(fs.readFileSync(FILE, "utf8"));
// Every finding, rendered for the failure report.
const failures = [];
// Declared exceptions that matched, for the stale check.
const declaredSeen = new Set();
// Totals for the summary line.
let valuesChecked = 0;
let wordsChecked = 0;

// Classify one lower-cased word: the reason it is wrong, or null if it is fine.
function verdict(word) {
  // A grave accent anywhere but the crase contractions.
  if (GRAVE.test(word) && !CRASE.has(word)) return "a grave accent belongs only to the crase (à, às, àquele, àquela, àquilo)";
  // An explicit never-unaccented word.
  if (NEVER_UNACCENTED.has(word)) return "this word is never written without its accent";
  // An always-accented ending, on words long enough for the rule to be meaningful.
  if (word.length >= MIN_ENDING_LENGTH) {
    const ending = ALWAYS_ACCENTED_ENDINGS.find((e) => e.re.test(word));
    if (ending) return `the ending should be ${ending.should}`;
  }
  // Anything else is either correct or a context-dependent pair this guard leaves alone.
  return null;
}

// Walk every string in the pack, carrying its dotted key for the report.
function walk(node, prefix) {
  for (const [k, v] of Object.entries(node)) {
    // Arrays contribute their numeric indexes, matching how the audit named keys.
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") {
      walk(v, key);
      continue;
    }
    if (typeof v !== "string") continue;
    valuesChecked += 1;
    // Tokens keep digits and underscores attached, so JA3 stays one token.
    for (const token of v.match(/[A-Za-zÀ-ÿ0-9_]+/g) ?? []) {
      // Only pure words: a token with a digit or underscore is code or a name.
      if (!/^[A-Za-zÀ-ÿ]+$/.test(token)) continue;
      // ALL-CAPS tokens longer than one letter are acronyms.
      if (token.length > 1 && token === token.toUpperCase()) continue;
      wordsChecked += 1;
      const word = token.toLowerCase();
      const why = verdict(word);
      if (!why) continue;
      // A declared exception passes, and is remembered for the stale check.
      const id = `${key}|${word}`;
      if (DECLARED.has(id)) {
        declaredSeen.add(id);
        continue;
      }
      // Otherwise report it with enough context to fix without searching.
      const at = v.indexOf(token);
      const context = v.slice(Math.max(0, at - 40), at + token.length + 40).replace(/\s+/g, " ");
      failures.push(`  - ${key} :: "${token}" - ${why}\n      ...${context}...`);
    }
  }
}

walk(pack, "");

// THE STALE HALF: a declaration that matched nothing has done its job.
for (const id of DECLARED.keys()) {
  if (!declaredSeen.has(id)) {
    failures.push(`  - DECLARED "${id}" no longer matches anything and must be removed.`);
  }
}

if (failures.length) {
  console.error(
    `\n[check-ptbr-diacritics] FAIL: ${failures.length} pt-BR word(s) with an accent missing or misplaced:\n`
  );
  console.error(failures.slice(0, 40).join("\n"));
  if (failures.length > 40) console.error(`\n  ...and ${failures.length - 40} more.`);
  console.error(
    `\n  Fix the accent in src/i18n/messages/pt-BR.json (public/locales is a copy). ` +
      `If the token is genuinely not Portuguese prose - a hostname, a quoted identifier, a foreign name - ` +
      `declare it in DECLARED with the reason.\n`
  );
  process.exit(1);
}

console.log(
  `[check-ptbr-diacritics] OK: ${valuesChecked} pt-BR value(s), ${wordsChecked} word(s); none written ` +
    `without an accent Portuguese requires (${NEVER_UNACCENTED.size} never-unaccented words, ` +
    `${ALWAYS_ACCENTED_ENDINGS.length} always-accented endings), and none with a grave accent outside the ` +
    `crase. ${DECLARED.size} declared exception(s), ` +
    `may only shrink. Enforced at zero since 2026-10-02, when 158 values written with their ` +
    `accents stripped were restored.`
);
