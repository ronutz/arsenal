// ============================================================================
// scripts/check-tool-package.mjs   (PREBUILD)
// ----------------------------------------------------------------------------
// PRIME's rule, ratified 2026-09-16: a tool "build run" is not finished when the
// tool works. It is finished when the WHOLE PACKAGE ships with it.
//
// Four of the nine mandatory items already had guards - the registry entry
// (check-tools-registry), the docs (check-tool-docs), the Learn articles
// (check-tool-articles) and the API decision (build-openapi parity). The other
// five had none. They were complete across all 155 tools when this was written,
// but "complete today" and "cannot regress" are different properties, and only
// the second one survives a busy session.
//
// The specific near-miss that prompted it: the DHCP option 43 tool was built
// with `title` in its message bundle where the registry reads `name`.
// check-message-keys passed, because the key is looked up dynamically. Nothing
// caught it until the build itself emitted 27 MISSING_MESSAGE errors. This
// guard catches that class before a twelve-minute build starts.
//
// ---------------------------------------------------------------------------
// WHAT IS **NOT** IN THIS GUARD, AND WHY
//
// Keyboard SHORTCUTS (9 of 155) and guide RECIPES are DELIBERATELY EXCLUDED.
// Both files describe themselves as curated - shortcuts.ts is the
// "keyboard-shortcut registry + sysadmin policy", recipes.ts is "THE CURATED
// 'SUGGESTED USAGE' RECIPES". A command palette holding all 155 tools is a list,
// not a shortcut, and a curated set that contains everything is not curated.
//
// Enforcing them would degrade two working features to satisfy a checklist.
// They are named here so that a future reader who notices the gap finds the
// REASON rather than re-discovering the question.
// ============================================================================

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const registrySrc = read("src/config/tools.ts");
// Only tools marked available: a queued tool is allowed to be incomplete.
const slugs = [
  ...registrySrc.matchAll(/\{\s*id:\s*"([a-z0-9-]+)"[^}]*available:\s*true/g),
].map((m) => m[1]);

if (slugs.length < 50) {
  console.error(
    `[check-tool-package] FAIL: only ${slugs.length} available tools parsed from ` +
      `src/config/tools.ts - the file's shape has probably changed and this guard ` +
      `is no longer reading it correctly.`
  );
  process.exit(1);
}

const catalogue = read("src/content/catalogue/catalogue.ts");
const changelog = read("src/content/changelog/changelog.ts");
const apiRegistry = read("src/lib/tools/registry.ts");
const messages = {
  en: JSON.parse(read("src/i18n/messages/en.json")).tools ?? {},
  "pt-BR": JSON.parse(read("src/i18n/messages/pt-BR.json")).tools ?? {},
};

const problems = [];

for (const slug of slugs) {
  const miss = [];

  // 1-3. The module triple. A tool without golden vectors is a tool whose
  //      correctness nobody has asserted.
  const dir = path.join(root, "src/lib/tools", slug);
  if (!fs.existsSync(dir)) {
    miss.push("src/lib/tools/<slug>/ does not exist");
  } else {
    for (const f of ["compute.ts", "golden-vectors.ts", "index.ts"]) {
      if (!fs.existsSync(path.join(dir, f))) miss.push(`module file ${f}`);
    }
  }

  // 4. Catalogue entry - what /tools and the catalogue page render from.
  if (!catalogue.includes(`"${slug}"`)) miss.push("catalogue entry");

  // 5. Changelog entry - a tool that appeared without being announced.
  if (!changelog.includes(`"${slug}"`)) miss.push("changelog entry");

  // 6-7. name + blurb in BOTH authored locales. `name` specifically, because
  //      the registry reads .name and a bundle carrying .title instead fails
  //      only at render time.
  for (const loc of ["en", "pt-BR"]) {
    const entry = messages[loc][slug];
    if (!entry) {
      miss.push(`messages.tools["${slug}"] missing in ${loc}`);
      continue;
    }
    if (!entry.name) {
      miss.push(
        `tools.${slug}.name missing in ${loc}` +
          (entry.title ? ' — it has "title"; the registry reads "name"' : "")
      );
    }
    if (!entry.blurb) miss.push(`tools.${slug}.blurb missing in ${loc}`);
  }

  // 8. Tool docs in both locales (also covered by check-tool-docs; kept here so
  //    this guard reports a COMPLETE picture per tool rather than half of one).
  for (const loc of ["en", "pt-BR"]) {
    const p = path.join(root, "src/content/tool-docs", loc, `${slug}.md`);
    if (!fs.existsSync(p) || fs.readFileSync(p, "utf8").trim().length < 200) {
      miss.push(`tool doc ${loc} missing or too thin`);
    }
  }

  // 9. At least one Learn article in each authored locale, via relatedTools.
  for (const loc of ["en", "pt-BR"]) {
    const d = path.join(root, "src/content/learn", loc);
    const found = fs
      .readdirSync(d)
      .filter((f) => f.endsWith(".mdx"))
      .some((f) => {
        const src = fs.readFileSync(path.join(d, f), "utf8");
        const fm = /relatedTools:\s*\[([^\]]*)\]/.exec(src);
        return fm ? fm[1].includes(`"${slug}"`) : false;
      });
    if (!found) miss.push(`no Learn article in ${loc} with relatedTools ["${slug}"]`);
  }

  // 10. An explicit expose-or-exclude API decision.
  if (!apiRegistry.includes(`"${slug}"`)) {
    miss.push("no API decision (add to API_TOOLS or API_EXCLUDED)");
  }

  // 11. A WEBASSEMBLY tool (executionClass "wasmLocal", PROPOSTA-wasm-tools
  //     2026-10-04) ships three more things or does not ship: the generated
  //     engine record in its manifest (what runs, which version, which bytes),
  //     the always-visible explainer in its component, and the consent step
  //     (the button that names the download size). A reader must never meet a
  //     13.5 MB third-party download without those; this check makes forgetting
  //     them a build failure rather than a surprise. The registry's runtime
  //     flag, which draws the fuchsia pill, must agree with the class.
  const indexPath = path.join(dir, "index.ts");
  if (fs.existsSync(indexPath)) {
    const indexSrc = fs.readFileSync(indexPath, "utf8");
    const isWasm = /executionClass:\s*\[\s*"wasmLocal"/.test(indexSrc);
    const flagged = new RegExp(`id:\\s*"${slug}"[^}]*runtime:\\s*"wasm"`).test(registrySrc);
    if (isWasm) {
      if (!/\bengine:\s*\{/.test(indexSrc)) miss.push("wasmLocal tool without an `engine` block in its manifest");
      if (!flagged) miss.push("wasmLocal tool whose src/config/tools.ts entry lacks runtime: \"wasm\" (no pill would be drawn)");
      // The component: found by the page map's import for this slug.
      const pageMap = read("src/app/[locale]/tools/[slug]/page.tsx");
      const compMatch = new RegExp(`"${slug}":\\s*\\{\\s*Component:\\s*([A-Za-z0-9_]+)`).exec(pageMap);
      const compName = compMatch ? compMatch[1] : null;
      const compPath = compName ? path.join(root, "src/components", `${compName}.tsx`) : null;
      if (!compPath || !fs.existsSync(compPath)) {
        miss.push("wasmLocal tool whose component could not be found through the page map");
      } else {
        const comp = fs.readFileSync(compPath, "utf8");
        if (!/explainer/.test(comp)) miss.push("wasmLocal component without the always-visible explainer");
        if (!/loadButton|consent/.test(comp)) miss.push("wasmLocal component without the consent-to-download step");
      }
    } else if (flagged) {
      miss.push("runtime: \"wasm\" in src/config/tools.ts but executionClass is not wasmLocal");
    }
  }

  if (miss.length) problems.push({ slug, miss });
}

if (problems.length) {
  console.error(
    `[check-tool-package] FAIL: ${problems.length} tool(s) shipped without the ` +
      `whole package:\n`
  );
  for (const { slug, miss } of problems.slice(0, 10)) {
    console.error(`  ${slug}`);
    for (const m of miss) console.error(`    - ${m}`);
  }
  if (problems.length > 10) console.error(`  ... and ${problems.length - 10} more`);
  console.error(
    "\n  A tool build run is not done when the tool works. See the header of this\n" +
      "  script, including what is deliberately NOT enforced and why.\n"
  );
  process.exit(1);
}

console.log(
  `[check-tool-package] OK: all ${slugs.length} available tools carry the whole ` +
    `package — module triple, catalogue, changelog, name + blurb in en and pt-BR, ` +
    `docs in both locales, a Learn article in both locales, an API decision, and the engine record, explainer and consent step on every WebAssembly tool.`
);
