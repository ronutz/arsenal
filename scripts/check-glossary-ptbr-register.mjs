// ============================================================================
// scripts/check-glossary-ptbr-register.mjs
// ----------------------------------------------------------------------------
// The pt-BR glossary keeps the house register: technical jargon stays in English
// (frame, header, hop, resolver, load balancer, handshake, timeout, flag...), as
// the NetFun II articles write it. On 2026-10-19 (PRIME's GO, 16:50) a sweep
// rewrote 249 fields in 187 entries that used the forbidden Portuguese
// renderings. This guard keeps the glossary from drifting back: it fails on any
// forbidden rendering in a pt-BR glossary value, except the declared cases below,
// where the word is used in another sense (a jump in code, a kanban board, a
// real-estate tenant...) or as an allowed gloss in parentheses after the English
// term. A declaration that no longer matches anything is stale and also fails,
// so the list can only shrink with the text.
// ============================================================================
import { readFileSync } from "node:fs"; // the pack is read as text

// The tag every output line carries.
const TAG = "[check-glossary-ptbr-register]";
// The forbidden renderings, as whole words, case-insensitive (singular and plural).
const FORBIDDEN = new RegExp(
  // Each alternative is one rendering from the writing brief's Portuguese section.
  "\\b(quadros?|cabeçalhos?|saltos?|gateway padrão|resolvedor(?:es)?|balanceador(?:es)? de carga|aperto de mão|" +
    // The second half of the list.
    "comutador(?:es)?|carimbos? de tempo|pontos? de extremidade|conjuntos? de cifras|soquetes?|inquilinos?|" +
    // The third half of the list (calques included).
    "farejador(?:es)?|tempo limite|sinalizador(?:es)?|laços? de roteamento|homem no meio|solução de problemas|" +
    // "laço/laços" in any loop sense (program, switching, feedback): PRIME 2026-10-19 17:11, '"laço" should be loop!!'.
    // A bond between people ("laços familiares") is another sense and goes into DECLARED with its reason.
    "laços?)\\b",
  // Global, case-insensitive, Unicode.
  "giu",
);
// Declared exceptions: "slug|word in lower case" -> the reason the word is used in another sense.
const DECLARED = new Map([
  ["ada-lovelace|salto", "a conceptual leap, not a network hop"],
  ["archive-formats|quadros", "video frame rate (taxa de quadros)"],
  ["carrier-hotel|inquilinos", "real-estate tenants of a building"],
  ["darpa|quadro", "permanent staff (quadro permanente)"],
  ["goto-considered-harmful|salto", "a jump in code"],
  ["goto-considered-harmful|saltos", "jumps in code"],
  ["jude-milhon|quadro", "a bulletin board (quadro de avisos)"],
  ["kanban|quadro", "the kanban board"],
  ["lb|balanceador de carga", "allowed gloss in parentheses after 'load balancer'"],
  ["marco-civil-da-internet|quadro", "a framework law (lei-quadro)"],
  ["meet-me-room|inquilino", "a colocation tenant renting space"],
  ["newedge|quadro", "ordinary sense: a picture of the situation"],
  ["norad|quadro", "ordinary sense: a display board"],
  ["off-by-one|quadro", "ordinary sense"],
  ["peering|aperto de mão", "a handshake deal between people"],
  ["propagation|saltos", "ionospheric radio hops"],
  ["rack|quadro", "the physical 19-inch frame"],
  ["separation-of-duties|quadro", "ordinary sense: staff"],
  ["sfp|soquete", "the physical receptacle"],
  ["single-pane-of-glass|quadros", "ordinary sense: panels"],
  ["spaghetti-code|saltos", "goto jumps in code"],
  ["the-first-emoticon|quadro", "a bulletin board"],
  ["the-first-spam|quadro", "a bulletin board"],
  ["the-konami-code|aperto de mão", "a cultural greeting"],
]);

// The pt-BR pack and its glossary entries.
const entries = JSON.parse(readFileSync("src/i18n/messages/pt-BR.json", "utf8"))?.glossary?.entries ?? {};
// Undeclared hits, and the declarations actually used.
const failures = [];
const used = new Set();
// Each entry, each text field.
for (const [slug, entry] of Object.entries(entries)) {
  // Only objects carry prose.
  if (typeof entry !== "object" || entry === null) continue;
  for (const field of ["def", "context", "depth"]) {
    // The field's text, or nothing.
    const text = typeof entry[field] === "string" ? entry[field] : "";
    // Every forbidden word in it.
    for (const m of text.matchAll(FORBIDDEN)) {
      // The declaration key for this slug and word.
      const key = `${slug}|${m[0].toLowerCase()}`;
      // Declared: remember it was used; otherwise a failure with its context.
      if (DECLARED.has(key)) used.add(key);
      else failures.push(`"${slug}".${field}: "${m[0]}" in "...${text.slice(Math.max(0, m.index - 40), m.index + m[0].length + 30)}..."`);
    }
  }
}
// Declarations nothing matched any more are stale.
for (const key of DECLARED.keys()) if (!used.has(key)) failures.push(`stale declaration "${key}": remove it from DECLARED`);
// Report.
if (failures.length) {
  // Every failure on its own line, with the remedy.
  console.error(`${TAG} FAIL: ${failures.length} problem(s). Keep the jargon in English (frame, header, hop, resolver, load balancer...), as the NetFun II articles do, or declare a different sense here with its reason.`);
  for (const f of failures) console.error(`  - ${f}`);
  // A red guard stops the build.
  process.exit(1);
}
// Green.
console.log(`${TAG} OK: ${Object.keys(entries).length} pt-BR glossary entries; no forbidden rendering outside ${DECLARED.size} declared different senses.`);
