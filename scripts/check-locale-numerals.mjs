#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-locale-numerals.mjs — THE SIXTEENTH GUARD
// ----------------------------------------------------------------------------
// Fails the build when a translated string asserts a NUMBER that the English
// source does not.
//
// WHY THIS EXISTS (2026-07-28, PRIME). The site grew from four vendor families
// to eight. The English copy was corrected. Fourteen locale packs were not,
// because they carry their own translation of those strings rather than
// falling back to English - so nine keys went on claiming "four platforms" in
// up to fourteen languages, for months, on the home page, the about page and
// the training page.
//
// Every one of the fifteen existing guards passed the whole time. Locale
// parity was green, because the keys were all present. ICU parsing was green,
// because the strings were well formed. Nothing checks whether a translation
// still MEANS what the English means, and nothing can in general - but a
// number is the one part of meaning that survives translation intact, which
// makes it checkable.
//
// HOW IT WORKS — AND WHAT THE FIRST VERSION GOT WRONG
// The obvious rule is "fail when a locale asserts a number the English does
// not". That rule produced 190 hits on a clean repository, nearly all false:
// Italian "sei" is both SIX and the verb ARE; French "les deux dates" means
// BOTH dates, not two of something; Turkish "on" is TEN and Danish "to" is
// TWO, and both collide with ordinary words. A guard that cries wolf 190
// times gets switched off, which is worse than no guard.
//
// So the rule is narrowed to CONTRADICTION: fail only when the English
// asserts a quantity and the locale asserts a DIFFERENT one. A homograph in
// prose the English gives no number for is ignored, because it carries no
// signal.
//
// BE HONEST ABOUT THE LIMIT: this narrowed rule would NOT have caught the bug
// that prompted it, because the corrected English said "the platforms" with no
// number at all while the locales said "four". Nothing general catches that -
// it needs the English to state the count. Which is the practical lesson: when
// a public claim is a QUANTITY, write the quantity in the English, so every
// translation of it becomes checkable.
//
// DELIBERATE LIMITS, so the guard stays trustworthy rather than noisy:
//   * only 3-9 are checked. TEN is excluded too: Turkish "on yil" is a
//     DECADE, and ten is the value most often reached idiomatically in prose. Zero and one appear too often in ordinary prose
//     to be a signal, and TWO is worse than useless: English "both" becomes a
//     numeral in every Romance language ("os dois lados", "les deux dates",
//     "i due"), so checking 2 flags correct translations by the dozen.
//   * digits in the English count as assertions, so "8 vendors" licenses a
//     locale to spell it out.
//   * a locale numeral is ignored when the English asserts the SAME value,
//     however written.
//   * CHINESE IS EXCLUDED ENTIRELY. CJK has no word boundaries, and its
//     numerals live inside ordinary compounds: eight is in the word for OCTET
//     and six is in the word for HEXADECIMAL, so every tool description that
//     mentions either was flagged. A check that cannot be made accurate for a
//     language should not be run against it and reported as a finding.
//   * word boundaries are mandatory. An early version of this check flagged
//     Filipino for "apat" (four) inside "tapat" (honest), which is exactly the
//     kind of false positive that gets a guard switched off.
// ============================================================================

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIR = "src/i18n/messages";

/** Number words 2-10 per locale, including the inflected forms that occur. */
const NUMERALS = {
  en: { 2: ["two"], 3: ["three"], 4: ["four"], 5: ["five"], 6: ["six"], 7: ["seven"], 8: ["eight"], 9: ["nine"], 10: ["ten"] },
  da: { 2: ["to"], 3: ["tre"], 4: ["fire"], 5: ["fem"], 6: ["seks"], 7: ["syv"], 8: ["otte"], 9: ["ni"], 10: ["ti"] },
  de: { 2: ["zwei"], 3: ["drei"], 4: ["vier"], 5: ["fünf"], 6: ["sechs"], 7: ["sieben"], 8: ["acht"], 9: ["neun"], 10: ["zehn"] },
  es: { 2: ["dos"], 3: ["tres"], 4: ["cuatro"], 5: ["cinco"], 6: ["seis"], 7: ["siete"], 8: ["ocho"], 9: ["nueve"], 10: ["diez"] },
  fil: { 2: ["dalawa", "dalawang"], 3: ["tatlo", "tatlong"], 4: ["apat"], 5: ["lima", "limang"], 6: ["anim"], 7: ["pito", "pitong"], 8: ["walo", "walong"], 9: ["siyam"], 10: ["sampu"] },
  fr: { 2: ["deux"], 3: ["trois"], 4: ["quatre"], 5: ["cinq"], 6: ["six"], 7: ["sept"], 8: ["huit"], 9: ["neuf"], 10: ["dix"] },
  it: { 2: ["due"], 3: ["tre"], 4: ["quattro"], 5: ["cinque"], 6: ["sei"], 7: ["sette"], 8: ["otto"], 9: ["nove"], 10: ["dieci"] },
  ms: { 2: ["dua"], 3: ["tiga"], 4: ["empat"], 5: ["lima"], 6: ["enam"], 7: ["tujuh"], 8: ["lapan"], 9: ["sembilan"], 10: ["sepuluh"] },
  nb: { 2: ["to"], 3: ["tre"], 4: ["fire"], 5: ["fem"], 6: ["seks"], 7: ["sju"], 8: ["åtte"], 9: ["ni"], 10: ["ti"] },
  nl: { 2: ["twee"], 3: ["drie"], 4: ["vier"], 5: ["vijf"], 6: ["zes"], 7: ["zeven"], 8: ["acht"], 9: ["negen"], 10: ["tien"] },
  pl: { 2: ["dwa", "dwie", "dwóch"], 3: ["trzy", "trzech"], 4: ["cztery", "czterech", "czterema"], 5: ["pięć", "pięciu"], 6: ["sześć"], 7: ["siedem"], 8: ["osiem", "ośmiu"], 9: ["dziewięć"], 10: ["dziesięć"] },
  "pt-BR": { 2: ["dois", "duas"], 3: ["três"], 4: ["quatro"], 5: ["cinco"], 6: ["seis"], 7: ["sete"], 8: ["oito"], 9: ["nove"], 10: ["dez"] },
  ru: { 2: ["два", "две", "двух"], 3: ["три", "трёх", "трех"], 4: ["четыре", "четырёх", "четырех", "четырьмя"], 5: ["пять", "пяти"], 6: ["шесть"], 7: ["семь"], 8: ["восемь", "восьми"], 9: ["девять"], 10: ["десять"] },
  sv: { 2: ["två"], 3: ["tre"], 4: ["fyra"], 5: ["fem"], 6: ["sex"], 7: ["sju"], 8: ["åtta"], 9: ["nio"], 10: ["tio"] },
  tr: { 2: ["iki"], 3: ["üç"], 4: ["dört"], 5: ["beş"], 6: ["altı"], 7: ["yedi"], 8: ["sekiz"], 9: ["dokuz"], 10: ["on"] },
  "zh-Hans": { 2: ["两", "二"], 3: ["三"], 4: ["四"], 5: ["五"], 6: ["六"], 7: ["七"], 8: ["八"], 9: ["九"], 10: ["十"] },
};

/** Flatten a message pack to dotted key -> string. */
function flatten(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, path, out);
    else if (typeof v === "string") out[path] = v;
  }
  return out;
}

/**
 * Which values 2-10 does this text assert?
 * CJK has no word boundaries, so those forms are matched directly; everything
 * else requires boundaries, because a numeral hiding inside a longer word is
 * the classic false positive.
 */
function assertedValues(text, locale) {
  const table = NUMERALS[locale];
  if (!table) return new Set();
  const found = new Set();
  const cjk = locale.startsWith("zh");
  for (const [value, words] of Object.entries(table)) {
    const n = Number(value);
    if (n < 3 || n > 9) continue; // see the notes on "both" and "decade" above
    for (const w of words) {
      const hit = cjk
        ? text.includes(w)
        : new RegExp(`(^|[^\\p{L}])${w}([^\\p{L}]|$)`, "iu").test(text);
      if (hit) {
        found.add(Number(value));
        break;
      }
    }
  }
  // Digits in any language assert their own value.
  for (const m of text.matchAll(/(^|[^\d])([3-9])([^\d]|$)/g)) found.add(Number(m[2]));
  return found;
}

const files = readdirSync(DIR).filter((f) => f.endsWith(".json"));
const en = flatten(JSON.parse(readFileSync(join(DIR, "en.json"), "utf8")));
const failures = [];
let compared = 0;

for (const file of files) {
  const locale = file.replace(/\.json$/, "");
  // See the note above: Chinese numerals sit inside ordinary compounds, so
  // this check cannot be made accurate for it.
  if (locale === "en" || locale.startsWith("zh") || !NUMERALS[locale]) continue;
  const pack = flatten(JSON.parse(readFileSync(join(DIR, file), "utf8")));
  for (const [key, value] of Object.entries(pack)) {
    const source = en[key];
    if (source === undefined) continue;
    compared += 1;
    const ours = assertedValues(source, "en");
    // Contradiction only: the English must itself assert a quantity for a
    // mismatch to mean anything. See the note above on why the broader rule
    // was abandoned.
    if (ours.size === 0) continue;
    const theirs = assertedValues(value, locale);
    if (theirs.size === 0) continue;
    const invented = [...theirs].filter((n) => !ours.has(n));
    if (invented.length) {
      failures.push(
        `  - ${locale} :: ${key} :: asserts ${invented.join(", ")} where English asserts ${
          ours.size ? [...ours].join(", ") : "no quantity"
        }\n      en: ${source.slice(0, 100)}\n      ${locale}: ${value.slice(0, 100)}`,
      );
    }
  }
}

if (failures.length) {
  console.error(
    `\n[check-locale-numerals] FAIL: ${failures.length} translated string(s) assert a quantity the English does not:\n`,
  );
  console.error(failures.slice(0, 40).join("\n"));
  if (failures.length > 40) console.error(`\n  ...and ${failures.length - 40} more.`);
  console.error(
    `\n  Fix the translation, or - if the English is what changed - update every locale that carries its own copy of that string.\n`,
  );
  process.exit(1);
}

console.log(
  `[check-locale-numerals] OK: ${compared} translated strings checked across ${
    files.length - 1
  } locale packs; none contradicts a quantity stated in the English.`,
);
