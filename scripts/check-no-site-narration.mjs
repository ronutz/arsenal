#!/usr/bin/env node
/**
 * check-no-site-narration.mjs  (guard 48, added 2026-09-07)
 *
 * RULE-no-site-narration (canon, 2026-09-06): public entries name the pattern,
 * the fact, or the other entry - never the site's own habit, stance, restraint
 * or virtue. "The catalogue keeps finding..." narrates the site; "a recurring
 * pattern" states the thing. PRIME corrected this on /stats ("purely
 * self-reflective"), and the same construction then had to be removed by hand
 * from seventeen entries over two days. This guard locks the corpus at zero.
 *
 * What it reads: the string bodies in partners.ts (body/tagline/intro/note)
 * and every glossary `context` in en.json and pt-BR.json. Code comments are not
 * public prose and are skipped (the partners.ts scan only looks inside string
 * literals). POINTERS to other entries ("the Cisco entry records...", "several
 * people in this catalogue have received...") are allowed - they are
 * navigation; the patterns below are the STANCE forms only.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASELINE = 0;

const STANCE = [
  /\bthis (entry|catalogue|list|site|page) (can|keeps|meets|records|does not|does|has to|will)\b/i,
  /\b(the|this) catalogue('s)? (keeps|meets|does|records|returns)\b/i,
  /\bbelongs here\b/i,
  /\bis the reason it belongs\b/i,
  /\b(este|deste|o) catálogo (não para de|não julga|volta sempre|registra|encontra|consiga|consegue|pode|vai)\b/i,
  /\b(esta|este) (página|site|verbete) (não (resolve|julga)|vai|registra)\b/i,
  /\bpertence(m)? aqui\b/i,
  // The page as the SOURCE OF A HUMAN ACT, added 2026-09-28 on PRIME's ruling.
  // A page cannot sell, offer, write or deliver; a person does. Teaching verbs are
  // deliberately absent: "the methods taught on this site" describes a corpus and is
  // idiomatic. Locators and legal referents are untouched by this pattern because it
  // requires from/by, not on/in.
  /\b(sold|written|offered|delivered|provided|booked|authored|sells|writes|offers|delivers|provides)\s+(from|by)\s+th(is|e)\s+(page|site)\b/i,
  /\b(vendid[oa]|escrit[oa]|oferecid[oa]|entregue|contratad[oa])\s+(nesta|desta|por esta)\s+(página|site)\b/i,
];

// Message keys where a site self-reference is CORRECT, each with the reason.
// Added 2026-09-28 together with the scope widening, because the widening pointed
// patterns written for catalogue prose at legal, API and tool copy.
//
// Keyed by the dotted message path. A new key carrying a self-reference fails, which
// is the behaviour that matters; these nine are the ones that existed when the scan
// first reached them, and the list may only shrink.
const DECLARED_SELF_REFERENCE = new Map([
  ["privacy_page.title",
   "A privacy page's title has to name what the site does with the reader's data. The site IS the actor in that sentence and saying so is the point of the page."],
  ["privacy_page.short4",
   "A privacy disclosure has to state what the site keeps at the server. Removing the actor would make the disclosure false by omission."],
  ["api.lede",
   "A factual statement about hosting: the API is documented but this site does not serve it. The reader needs to know which host would answer, and that is not a stance about the site's habits."],
  ["devOther.fingerprint.metaTitle",
   "The self-fingerprint tool's page LITERALLY reads the visitor's browser. Here the page really is the agent, so naming it is precise rather than narration."],
  ["tools.extreme-switch-os-mapper.families.intro",
   "\"Anything not on this list keeps EXOS and VOSS\" is about the MAPPING TABLE the tool prints, and \"keeps\" is what the switches do with their OS names. The pattern matched the words, not the meaning."],
  ["changelog.roadmapNote",
   "Navigation, which this guard's docstring already allows: it tells a reader that the roadmap holds what is queued and the changelog holds what shipped. ARGUABLE - flagged to PRIME 2026-09-28 as a candidate for rewriting in the active voice."],
  ["people.metaDescription",
   "Navigation for a directory page: it says whom the page lists. ARGUABLE - flagged to PRIME 2026-09-28 alongside changelog.roadmapNote."],
]);

const hits = [];

// partners.ts: string literals only, so comments never count
const partners = fs.readFileSync(path.join(ROOT, "src/content/vendors/partners.ts"), "utf8");
for (const m of partners.matchAll(/"((?:[^"\\]|\\.)*)"/g)) {
  const text = m[1];
  if (text.length < 40) continue;
  for (const re of STANCE) {
    const h = text.match(re);
    if (h) hits.push(`partners.ts: "${text.slice(Math.max(0, h.index - 50), h.index + 60)}"`);
  }
}

// EVERY string in both message packs, not only the glossary.
//
// WHY THE WIDENING (2026-09-28). This scan used to read glossary def and context
// only. The advisory page's copy lives under advisory.* in the same file and was
// never looked at, which is how "Training is not sold from this page" survived long
// enough to be copied into a fifth entry. A guard that reads two fields of one
// namespace cannot claim to hold a corpus at zero.
for (const loc of ["en", "pt-BR"]) {
  const j = JSON.parse(fs.readFileSync(path.join(ROOT, `src/i18n/messages/${loc}.json`), "utf8"));
  /** Every string value in the pack, with its dotted key path. */
  const walk = (node, keyPath, out) => {
    if (typeof node === "string") out.push([keyPath, node]);
    else if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node)) walk(v, keyPath ? `${keyPath}.${k}` : k, out);
    }
    return out;
  };
  for (const [keyPath, text] of walk(j, "", [])) {
    {
      if (text.length < 40) continue;
      if (DECLARED_SELF_REFERENCE.has(keyPath)) continue;
      for (const re of STANCE) {
        const h = text.match(re);
        if (h) hits.push(`${loc} ${keyPath}: "${text.slice(Math.max(0, h.index - 50), h.index + 60)}"`);
      }
    }
  }
}

if (hits.length > BASELINE) {
  for (const h of hits) console.error("      " + h);
  console.error(`\n[check-no-site-narration] FAIL: ${hits.length} sentence(s) narrate the site (baseline ${BASELINE}). State the pattern, the fact, or the other entry - not the site's stance.\n`);
  process.exit(1);
}
console.log(`[check-no-site-narration] OK: no public prose narrates the site (partners.ts strings + EVERY string in both message packs since 2026-09-28; ${DECLARED_SELF_REFERENCE.size} key(s) declared with a reason)`);
