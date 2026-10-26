// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0
// ============================================================================
// scripts/check-learn-labs.mjs
// ----------------------------------------------------------------------------
// BUILD GUARD for the Learn labs (2026-10-26; PRIME 15:20: the interactive
// guides' useful parts merged into the articles, with an "Interactive" marker on
// the Learn index and the series rails so learners can find every lab).
//
// A lab is written into an article as <Lab id="<id>" /> and lives in four
// places: the registry (src/content/learn/labs.ts), the loader that maps its id
// to its component (src/components/learn/labs/LabLoader.tsx), its model and
// vectors (src/lib/labs/<id>/), and its words (learnLabs.<id> in the en and
// pt-BR packs). The marker is derived from the article bodies, so a lab that is
// registered but not embedded, or embedded in one language only, would make the
// marker and the page disagree. This guard keeps the four places and the
// articles in step. It fails the build when:
//   1. a <Lab ...> tag in an article is not exactly <Lab id="<id>" />;
//   2. an article embeds an id the registry does not hold;
//   3. a registered lab is not embedded in every article its entry names, in
//      English AND in Portuguese, or an article embeds a lab whose entry does
//      not name it;
//   4. the English and Portuguese editions of an article embed different labs;
//   5. the registry and the loader name different ids, or a loader import points
//      at a component file that does not exist;
//   6. a lab has no compute.ts, or its golden-vectors.ts lacks a dated
//      GOLDEN_VECTOR_SET_ID or verifyVectors (scripts/run-golden-vectors.mts runs
//      them; this only checks that they are there to be run);
//   7. a lab's words are missing title, lede or scope in either pack, or the two
//      packs carry different keys for it; or the shared frame's words differ;
//   8. a lab's component reads any namespace other than its own and the frame's
//      (src/components/learn/Lab.tsx slices exactly those two into the page).
// Plain node, text-based, like the other content guards.
// ============================================================================
import fs from "node:fs";
import path from "node:path";

// The repository root (prebuild runs from there).
const ROOT = process.cwd();
// The tag this guard's lines carry.
const TAG = "[check-learn-labs]";
// Every failure, one sentence each.
const errors = [];

// ---- the registry ------------------------------------------------------------
// The registry's text.
const reg = fs.readFileSync(path.join(ROOT, "src/content/learn/labs.ts"), "utf8");
// Its array, cut at the declaration.
const regBody = reg.slice(reg.indexOf("export const LEARN_LABS"));
// Every entry: { id: "...", articles: [...] }.
const labs = [...regBody.matchAll(/\{\s*id:\s*"([^"]+)",\s*articles:\s*\[([^\]]*)\]\s*\}/g)].map((m) => ({
  // The id.
  id: m[1],
  // The articles, unquoted.
  articles: [...m[2].matchAll(/"([^"]+)"/g)].map((a) => a[1]),
}));
// The ids alone.
const ids = new Set(labs.map((l) => l.id));
// Duplicated ids are a registry error.
if (ids.size !== labs.length) errors.push("src/content/learn/labs.ts holds the same lab id twice.");

// ---- the loader --------------------------------------------------------------
// The loader's text.
const loaderPath = path.join(ROOT, "src/components/learn/labs/LabLoader.tsx");
// Read once.
const loader = fs.readFileSync(loaderPath, "utf8");
// Every line "id": dynamic(() => import("./Component")).
const loaded = [...loader.matchAll(/"([a-z0-9-]+)":\s*dynamic\(\(\)\s*=>\s*import\("\.\/([A-Za-z0-9]+)"\)\)/g)].map((m) => ({ id: m[1], comp: m[2] }));
// Same ids both ways.
for (const l of loaded) if (!ids.has(l.id)) errors.push(`LabLoader maps "${l.id}", which the registry does not hold.`);
// And the other way.
for (const id of ids) if (!loaded.some((l) => l.id === id)) errors.push(`Lab "${id}" is registered but LabLoader does not map it.`);

// ---- the packs ---------------------------------------------------------------
/** The flattened keys under a dotted prefix of a pack, as a sorted list. */
function keysUnder(pack, prefix) {
  // Walk down the prefix.
  let node = pack;
  // Each part of the dotted path.
  for (const part of prefix.split(".")) node = node && typeof node === "object" ? node[part] : undefined;
  // Nothing there: no keys.
  if (!node || typeof node !== "object") return [];
  // The leaves, dotted relative to the prefix.
  const out = [];
  // Depth-first.
  const walk = (n, p) => {
    // Each child.
    for (const [k, v] of Object.entries(n)) {
      // Objects recurse, strings are leaves.
      if (v && typeof v === "object") walk(v, p ? `${p}.${k}` : k);
      else out.push(p ? `${p}.${k}` : k);
    }
  };
  // From the prefix node.
  walk(node, "");
  // Sorted, for comparison.
  return out.sort();
}
// The two authored packs.
const packs = Object.fromEntries(["en", "pt-BR"].map((l) => [l, JSON.parse(fs.readFileSync(path.join(ROOT, "src/i18n/messages", `${l}.json`), "utf8"))]));
// The frame's words must be the same keys in both packs.
const shellEn = keysUnder(packs.en, "learnLabs.shell");
// And present at all.
if (!shellEn.length) errors.push("learnLabs.shell is missing from the English pack.");
// Parity with Portuguese.
if (shellEn.join() !== keysUnder(packs["pt-BR"], "learnLabs.shell").join()) errors.push("learnLabs.shell carries different keys in en and pt-BR.");

// ---- each lab's files, words and namespaces ----------------------------------
for (const lab of labs) {
  // The model's folder.
  const dir = path.join(ROOT, "src/lib/labs", lab.id);
  // The model.
  if (!fs.existsSync(path.join(dir, "compute.ts"))) errors.push(`Lab "${lab.id}" has no src/lib/labs/${lab.id}/compute.ts.`);
  // The vectors.
  const gvPath = path.join(dir, "golden-vectors.ts");
  // Present, with a dated set id and the runner's entry point.
  if (!fs.existsSync(gvPath)) errors.push(`Lab "${lab.id}" has no golden-vectors.ts.`);
  else {
    // Its text.
    const gv = fs.readFileSync(gvPath, "utf8");
    // A dated set id: "<id>/YYYY-MM-DD" with an optional letter.
    if (!new RegExp(`GOLDEN_VECTOR_SET_ID\\s*=\\s*"${lab.id}/\\d{4}-\\d{2}-\\d{2}[a-z]?"`).test(gv)) errors.push(`Lab "${lab.id}": golden-vectors.ts needs GOLDEN_VECTOR_SET_ID = "${lab.id}/YYYY-MM-DD".`);
    // The runner's entry point.
    if (!/export\s+function\s+verifyVectors\b/.test(gv)) errors.push(`Lab "${lab.id}": golden-vectors.ts must export verifyVectors().`);
  }
  // Its words in both packs.
  const en = keysUnder(packs.en, `learnLabs.${lab.id}`);
  // The Portuguese keys.
  const pt = keysUnder(packs["pt-BR"], `learnLabs.${lab.id}`);
  // The three every lab must have.
  for (const k of ["title", "lede", "scope"]) {
    // In English.
    if (!en.includes(k)) errors.push(`Lab "${lab.id}": learnLabs.${lab.id}.${k} is missing in en.`);
    // In Portuguese.
    if (!pt.includes(k)) errors.push(`Lab "${lab.id}": learnLabs.${lab.id}.${k} is missing in pt-BR.`);
  }
  // The same keys in both.
  if (en.join() !== pt.join()) errors.push(`Lab "${lab.id}": en and pt-BR carry different keys (${en.filter((k) => !pt.includes(k)).concat(pt.filter((k) => !en.includes(k))).join(", ")}).`);
  // Its component, from the loader.
  const comp = loaded.find((l) => l.id === lab.id);
  // The component file must exist and read only its own and the frame's namespaces.
  if (comp) {
    // The component's path.
    const cp = path.join(ROOT, "src/components/learn/labs", `${comp.comp}.tsx`);
    // Missing file.
    if (!fs.existsSync(cp)) errors.push(`LabLoader imports ./${comp.comp} for "${lab.id}", which does not exist.`);
    else {
      // Every namespace it reads.
      const used = [...fs.readFileSync(cp, "utf8").matchAll(/useTranslations\("([^"]+)"\)/g)].map((m) => m[1]);
      // Only its own and the frame's.
      for (const ns of used) if (ns !== `learnLabs.${lab.id}` && ns !== "learnLabs.shell") errors.push(`${comp.comp}.tsx reads "${ns}"; a lab may read only learnLabs.${lab.id} and learnLabs.shell.`);
    }
  }
}

// ---- the articles ------------------------------------------------------------
/** The articles of a locale: slug (frontmatter, else file name) to body. */
function articles(locale) {
  // The folder.
  const dir = path.join(ROOT, "src/content/learn", locale);
  // Slug to body.
  const out = new Map();
  // Each MDX file.
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".mdx"))) {
    // Its text.
    const raw = fs.readFileSync(path.join(dir, f), "utf8");
    // The frontmatter slug, when declared.
    const slug = (raw.match(/^slug:\s*"?([^"\n]+)"?\s*$/m) || [])[1] || f.replace(/\.mdx$/, "");
    // The body after the frontmatter.
    out.set(slug.trim(), raw.replace(/^---[\s\S]*?\n---\n/, ""));
  }
  // Done.
  return out;
}
// Both authored locales.
const byLocale = { en: articles("en"), "pt-BR": articles("pt-BR") };
// The well-formed tag.
const TAG_RE = /<Lab\s+id="([a-z0-9]+(?:-[a-z0-9]+)*)"\s*\/>/g;
// Which labs each article embeds, per locale.
const embeds = { en: new Map(), "pt-BR": new Map() };
// Each locale, each article.
for (const [loc, map] of Object.entries(byLocale)) {
  // Each article's body.
  for (const [slug, body] of map) {
    // Every "<Lab" occurrence must be a well-formed tag.
    const all = (body.match(/<Lab\b/g) || []).length;
    // The well-formed ones.
    const good = [...body.matchAll(TAG_RE)].map((m) => m[1]);
    // A malformed tag is an error.
    if (all !== good.length) errors.push(`${loc}/${slug}.mdx: a <Lab> tag is not exactly <Lab id="<id>" />.`);
    // Unknown ids.
    for (const id of good) if (!ids.has(id)) errors.push(`${loc}/${slug}.mdx embeds <Lab id="${id}" />, which the registry does not hold.`);
    // Record what it embeds.
    if (good.length) embeds[loc].set(slug, [...new Set(good)].sort());
  }
}
// Registry against bodies, both ways and in both languages.
for (const lab of labs) {
  // Every named article embeds it in both languages.
  for (const slug of lab.articles) for (const loc of ["en", "pt-BR"]) if (!(embeds[loc].get(slug) || []).includes(lab.id)) errors.push(`Lab "${lab.id}" names ${slug}, but ${loc}/${slug}.mdx does not embed it.`);
}
// Every embedding is named by its lab's entry.
for (const loc of ["en", "pt-BR"]) for (const [slug, list] of embeds[loc]) for (const id of list) {
  // The entry for the id.
  const lab = labs.find((l) => l.id === id);
  // Named, or an error.
  if (lab && !lab.articles.includes(slug)) errors.push(`${loc}/${slug}.mdx embeds "${id}", but the lab's registry entry does not name ${slug}.`);
}
// The two editions of an article embed the same labs.
for (const [slug, list] of embeds.en) if ((embeds["pt-BR"].get(slug) || []).join() !== list.join()) errors.push(`${slug}: the English and Portuguese editions embed different labs.`);
// And a Portuguese-only embedding.
for (const [slug] of embeds["pt-BR"]) if (!embeds.en.has(slug)) errors.push(`${slug}: the Portuguese edition embeds a lab the English one does not.`);

// ---- verdict -----------------------------------------------------------------
if (errors.length) {
  // Every failure, then the exit.
  console.error(`${TAG} FAIL: ${errors.length} problem(s).`);
  // One per line.
  for (const e of errors) console.error(`${TAG}   - ${e}`);
  // Red build.
  process.exit(1);
}
// The pass line names what it checked.
console.log(`${TAG} OK: ${labs.length} lab(s), embedded in ${embeds.en.size} article(s) in en and pt-BR, registry, loader, vectors and words in step.`);
