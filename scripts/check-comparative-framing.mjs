// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0
// ============================================================================
// scripts/check-comparative-framing.mjs
// ----------------------------------------------------------------------------
// NO POSITIONING BY DIMINISHING OTHERS.
//
// PRIME's editorial direction, restated by the production audit of 2026-10-15
// (finding F17): credibility comes from the work and its evidence, never from
// a comparison that ranks the author, or the training partner, above other
// people or professions. The audit found four such phrases in production: the
// advisory page's "a claim many people can make", its "not technical enough"
// and "not independent enough", Era 3's "a presenter reading slides" and the
// training page's "rather than entering technology through the classroom".
// All were rewritten on 2026-10-18. This guard keeps them, and their shapes,
// from coming back in the two authored packs.
//
// TIGHT BY DESIGN. It matches a short list of phrases, not a theory of tone: a
// tone guard that reads intent produces false alarms and gets switched off. A
// phrase is added here with the finding that justified it, and never removed.
// ============================================================================
import fs from "node:fs";
import path from "node:path";

// The repository root: prebuild runs every guard from there.
const ROOT = process.cwd();

// The phrases, per pack, each with the finding that put it here.
const PHRASES = {
  en: [
    [/\bpresenter reading slides\b/i, "F17: Era 3 and the training page contrasted the teaching with other presenters"],
    [/\ba claim (?:many|most) people can make\b/i, "F17: the advisory page's opening ranked the author's experience against other people's"],
    [/\bnot technical enough\b/i, "F17: the advisory positioning described executive consulting by its shortcoming"],
    [/\bnot independent enough\b/i, "F17: the advisory positioning described engineering consulting by its shortcoming"],
    [/\brather than entering technology through the classroom\b/i, "F17: the training page contrasted the author's path with teachers'"],
    [/\bunlike (?:most|other) (?:instructors|trainers|consultants|advisors)\b/i, "F17: the shape of the same comparison"],
  ],
  "pt-BR": [
    [/\bapresentador lendo slides\b/i, "F17: Era 3 and the training page, Portuguese edition"],
    [/\balgo que muita gente pode alegar\b/i, "F17: the advisory page's opening, Portuguese edition"],
    [/\bnão é técnica o bastante\b/i, "F17: the advisory positioning, Portuguese edition"],
    [/\bnão é independente o bastante\b/i, "F17: the advisory positioning, Portuguese edition"],
    [/\bnão entrei na tecnologia pela sala de aula\b/i, "F17: the training page, Portuguese edition"],
    [/\bdiferente d[ea] (?:maioria|outros) (?:instrutores|consultores)\b/i, "F17: the shape of the same comparison"],
  ],
};

/** Every string value of a pack, with its dotted key. */
function* strings(node, prefix = "") {
  // Objects descend; strings yield.
  for (const [k, v] of Object.entries(node)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") yield [key, v];
    else if (v && typeof v === "object") yield* strings(v, key);
  }
}

// Each failure is one sentence a reader can act on.
const failures = [];
// Each pack.
for (const [loc, rules] of Object.entries(PHRASES)) {
  // The pack.
  const pack = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "i18n", "messages", `${loc}.json`), "utf8"));
  // Every string against every phrase.
  for (const [key, value] of strings(pack)) {
    for (const [re, why] of rules) {
      if (re.test(value)) failures.push(`${loc}:${key} matches ${re} (${why}).`);
    }
  }
}

// The verdict.
if (failures.length) {
  console.error("check-comparative-framing: FAIL");
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}
console.log(`check-comparative-framing: OK (${Object.values(PHRASES).reduce((n, r) => n + r.length, 0)} phrases, en and pt-BR clean)`);
