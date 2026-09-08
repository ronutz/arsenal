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
];

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

// glossary contexts, both locales
for (const loc of ["en", "pt-BR"]) {
  const j = JSON.parse(fs.readFileSync(path.join(ROOT, `src/i18n/messages/${loc}.json`), "utf8"));
  const entries = j.glossary?.entries ?? {};
  for (const [slug, e] of Object.entries(entries)) {
    for (const field of ["def", "context"]) {
      const text = e?.[field];
      if (typeof text !== "string") continue;
      for (const re of STANCE) {
        const h = text.match(re);
        if (h) hits.push(`${loc} glossary/${slug}: "${text.slice(Math.max(0, h.index - 50), h.index + 60)}"`);
      }
    }
  }
}

if (hits.length > BASELINE) {
  for (const h of hits) console.error("      " + h);
  console.error(`\n[check-no-site-narration] FAIL: ${hits.length} sentence(s) narrate the site (baseline ${BASELINE}). State the pattern, the fact, or the other entry - not the site's stance.\n`);
  process.exit(1);
}
console.log(`[check-no-site-narration] OK: no public prose narrates the site (partners.ts strings + glossary contexts, 2 locales).`);
