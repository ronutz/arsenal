#!/usr/bin/env node
/**
 * GUARD 45 - check-authorization-claims
 *
 * PRIME's ruling, 2026-09-04: "There should be NO 'working towards' mention
 * anywhere. Don't say I do, and don't say I don't."
 *
 * WHY A GUARD AND NOT A NOTE
 * --------------------------
 * The site had one sentence saying Ping Identity and Zscaler were platforms
 * "I am working towards, not ones I teach". It was written to be scrupulous -
 * it was a disclaimer, not a boast - and it was still wrong, because the
 * correct posture is to make no statement in either direction. A denial is a
 * statement about the relationship just as much as a claim is, and it invites
 * exactly the question it was trying to close.
 *
 * That distinction is easy to lose months from now while writing an unrelated
 * paragraph, which is what a guard is for.
 *
 * WHAT IT CHECKS
 * --------------
 * For the vendors in RESTRICTED, fail if the vendor name appears within
 * PROXIMITY characters of teaching/delivery/authorization vocabulary - in
 * either direction, affirmative or negative. Naming these vendors in technical
 * prose is fine and expected: the glossary explains their products, the tools
 * operate on their concepts, and the standing rule is that naming a vendor is
 * not claiming a relationship with it. What is not fine is placing the name
 * next to a word about instructing.
 *
 * TWO BLIND SPOTS FOUND IN USE (2026-09-04) AND CLOSED HERE
 * ---------------------------------------------------------
 * The first version only compared a vendor name against claim vocabulary
 * WITHIN a single string. It therefore missed `about.platforms`, where the
 * heading said "The platforms, taught in depth", a sibling key said "Being an
 * authorized instructor for these vendors", and further siblings named Ping
 * Identity and Zscaler. Three separate strings, one claim, invisible to a
 * per-string check. Structure carries meaning that individual values do not,
 * so the guard now also fails when a claim-bearing key has sibling keys naming
 * a restricted vendor.
 *
 * The second: it read only the message packs. Prose in MDX articles was never
 * examined. Both content sources are now scanned.
 *
 * Worth recording that those keys were never rendered - the About component
 * enumerates four platforms explicitly - but they were still published in
 * out/locales/*.json. An unused key is not a harmless key.
 *
 * TO CHANGE THE POSTURE
 * ---------------------
 * If an authorization is genuinely obtained, remove the vendor from RESTRICTED
 * in the same change that adds the claim. The list is the record of what may
 * not be asserted, so editing it should be a deliberate act with a reason.
 */

import fs from "node:fs";

const LOCALE_FILES = ["src/i18n/messages/en.json", "src/i18n/messages/pt-BR.json"];

// Vendors whose products this site documents but whose instruction is not to
// be characterised, in either direction.
const RESTRICTED = ["ping identity", "pingfederate", "zscaler"];

// Vocabulary that turns a mention into a statement about the relationship.
// Both languages, and deliberately including the negative forms: "not ones I
// teach" is exactly as much a statement as "ones I teach".
const RELATIONSHIP = [
  "i teach", "i deliver", "i instruct", "i am authorized", "i'm authorized",
  "authorized instructor", "authorised instructor", "certified trainer",
  "platforms i", "working towards", "working toward", "not ones i",
  "eu ministro", "eu ensino", "instrutor autorizado", "estou avançando",
  "plataformas que eu", "plataformas em que",
  // Forward-looking forms. "certifications ... as they land" says the same
  // thing as "working towards" while sounding like a housekeeping note.
  "as they land", "as they arrive", "will be recorded", "once earned",
  "when i earn", "à medida que chegarem", "quando eu obtiver", "serão registradas",
];

const PROXIMITY = 220;

// --- VENDOR-INDEPENDENT ASPIRATION CHECK -----------------------------------
// PRIME, 2026-09-04: "no 'working towards' mention anywhere". The first version
// of this guard scoped that to the restricted vendors and therefore missed
// "Studying toward CCSA and CCSE" on the Check Point page - the same statement
// about a vendor that happens not to be on the list. The rule is about the
// KIND of statement, not the vendor, so this check applies to all public copy.
const ASPIRATION = [
  "studying toward", "studying towards", "working toward", "working towards",
  "certifications will be recorded", "as they land; ",
  "estudando para c", "trabalhando para obter", "serão registradas na página",
];

const problems = [];

// --- MDX prose -------------------------------------------------------------
// Same per-string proximity rule, applied to article bodies.
const mdxDirs = ["src/content/learn/en", "src/content/learn/pt-BR"];
for (const dir of mdxDirs) {
  if (!fs.existsSync(dir)) continue;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith(".mdx")) continue;
    const text = fs.readFileSync(`${dir}/${name}`, "utf8");
    const low = text.toLowerCase();
    for (const vendor of RESTRICTED) {
      let at = low.indexOf(vendor);
      while (at !== -1) {
        const window = low.slice(
          Math.max(0, at - PROXIMITY),
          at + vendor.length + PROXIMITY
        );
        const hit = RELATIONSHIP.find((w) => window.includes(w));
        if (hit) {
          problems.push({
            file: dir,
            path: name,
            vendor,
            phrase: hit,
            text: text.slice(Math.max(0, at - 90), at + 100).replace(/\n/g, " "),
          });
          break;
        }
        at = low.indexOf(vendor, at + 1);
      }
    }
  }
}

for (const file of LOCALE_FILES) {
  if (!fs.existsSync(file)) continue;
  const data = JSON.parse(fs.readFileSync(file, "utf8"));

  const walk = (node, path) => {
    if (node && typeof node === "object") {
      // SIBLING RULE: a claim in one key indicts restricted vendors named in
      // any sibling key. This is how a list reads on the page - the heading
      // and the items are one statement, whatever the data shape says.
      const strings = Object.entries(node).filter(([, v]) => typeof v === "string");
      const claim = strings.find(([, v]) =>
        RELATIONSHIP.some((w) => v.toLowerCase().includes(w))
      );
      if (claim) {
        for (const [k, v] of strings) {
          if (k === claim[0]) continue;
          const vendor = RESTRICTED.find((r) => v.toLowerCase().includes(r));
          if (vendor) {
            problems.push({
              file,
              path: `${path}.${k} (sibling of ${claim[0]})`,
              vendor,
              phrase: `sibling claim: "${claim[1].slice(0, 60)}..."`,
              text: v.slice(0, 150),
            });
          }
        }
      }
      for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k);
      return;
    }
    if (typeof node !== "string") return;
    const low = node.toLowerCase();
    for (const vendor of RESTRICTED) {
      let at = low.indexOf(vendor);
      while (at !== -1) {
        const from = Math.max(0, at - PROXIMITY);
        const window = low.slice(from, at + vendor.length + PROXIMITY);
        const hit = RELATIONSHIP.find((w) => window.includes(w));
        if (hit) {
          problems.push({ file, path, vendor, phrase: hit, text: node.slice(0, 190) });
          break;
        }
        at = low.indexOf(vendor, at + 1);
      }
    }
  };
  walk(data, "");
}

for (const file of LOCALE_FILES) {
  if (!fs.existsSync(file)) continue;
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const walk = (node, path) => {
    if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k);
      return;
    }
    if (typeof node !== "string") return;
    const low = node.toLowerCase();
    // Only first-person aspiration counts. "study guides for people working
    // toward a certification" is about the READER and is exactly the sort of
    // sentence this site should keep; the rule is about statements PRIME makes
    // regarding his own trajectory.
    const FIRST_PERSON = /\b(i|i'm|i am|my|me|eu|meu|minha|estou)\b/i;
    const hit = ASPIRATION.find((w) => {
      const at = low.indexOf(w);
      if (at === -1) return false;
      const around = node.slice(Math.max(0, at - 110), at + w.length + 110);
      return FIRST_PERSON.test(around);
    });
    if (hit) {
      problems.push({
        file, path, vendor: "(any)", phrase: `aspiration: "${hit}"`,
        text: node.slice(0, 170),
      });
    }
  };
  walk(data, "");
}

if (problems.length) {
  console.error("\n[check-authorization-claims] FAIL:\n");
  console.error(
    `  ${problems.length} passage(s) characterise a relationship with a vendor whose`
  );
  console.error("  instruction must not be described, affirmatively or negatively.\n");
  for (const p of problems) {
    console.error(`    ${p.path}`);
    console.error(`      vendor: ${p.vendor}   trigger: "${p.phrase}"`);
    console.error(`      ${p.text}\n`);
  }
  console.error("  Name the vendor's technology freely; say nothing about teaching it.\n");
  process.exit(1);
}

console.log(
  `[check-authorization-claims] OK: no relationship claims for ${RESTRICTED.length} restricted vendor(s).`
);
