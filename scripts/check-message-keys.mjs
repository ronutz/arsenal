// ============================================================================
// scripts/check-message-keys.mjs
// ----------------------------------------------------------------------------
// EVERY STATIC t("...") KEY MUST EXIST IN THE ENGLISH PACK.
//
// WHY THIS EXISTS: on 2026-08-09 the `practice.stance` message object was deleted
// with PRIME's ruling, and one caller was missed — `t("stance.count")` in the
// /practice part index. The build succeeded, `check-message-parity` passed
// (en and pt-BR agreed: the key was absent from BOTH), and the page shipped
// rendering the literal string "practice.stance.count" six times.
//
// Parity checks that the packs agree with each other. NOTHING checked that the
// code's demands are met by the packs, so a key deleted from every locale at once
// is invisible to parity by construction — the exact shape of this failure.
//
// SCOPE, STATED HONESTLY: only STATIC string literals are resolvable. A call like
// t(`parts.${part}.title`) is dynamic and is skipped, because the key is not known
// until render. Those are counted and reported so the number is visible rather
// than implied — a guard that silently ignores half its subject is the failure
// mode this whole session kept finding.
//
// Namespaces come from useTranslations("x") / getTranslations("x"), which is how
// next-intl scopes t() in this codebase.
// ============================================================================

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const pack = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src", "i18n", "messages", "en.json"), "utf8"),
);

/** Resolve "a.b.c" against the pack. */
function has(dotted) {
  let node = pack;
  for (const part of dotted.split(".")) {
    if (node == null || typeof node !== "object" || !(part in node)) return false;
    node = node[part];
  }
  return typeof node === "string" || typeof node === "object";
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(e.name)) out.push(p);
  }
  return out;
}

const files = walk(path.join(ROOT, "src", "app")).concat(
  walk(path.join(ROOT, "src", "components")),
);

const problems = [];
let checked = 0;
let dynamic = 0;

for (const file of files) {
  const src = fs.readFileSync(file, "utf8");

  // The namespace a file's t() is bound to. Files may declare more than one;
  // every candidate is tried and the key passes if ANY namespace resolves it,
  // which keeps the guard conservative rather than noisy.
  const namespaces = [
    ...src.matchAll(/(?:useTranslations|getTranslations)\(\s*["'`]([^"'`]+)["'`]\s*\)/g),
  ].map((m) => m[1]);
  if (namespaces.length === 0) continue;

  for (const m of src.matchAll(/\bt\(\s*(["'`])([^"'`$]*?)\1(\s*[+,)])?/g)) {
    const key = m[2];
    if (!key) continue;
    // Concatenated keys — t("warn." + code) — are dynamic: the literal here is a
    // PREFIX, not a key. A trailing dot is the reliable signal, and so is a "+"
    // immediately after the closing quote. Both are counted as dynamic rather
    // than reported, because flagging them would be the guard being wrong about
    // its own scope.
    if (key.endsWith(".") || (m[3] ?? "").trim().startsWith("+")) {
      dynamic += 1;
      continue;
    }
    checked += 1;
    if (!namespaces.some((ns) => has(`${ns}.${key}`))) {
      problems.push(
        `${path.relative(ROOT, file)}: t("${key}") does not resolve under ${namespaces
          .map((n) => `"${n}"`)
          .join(" or ")}.`,
      );
    }
  }

  // Template-literal keys cannot be resolved statically either.
  dynamic += [...src.matchAll(/\bt\(\s*`[^`]*\$\{/g)].length;
}

if (checked < 100) {
  console.error(
    `\n[check-message-keys] FAIL: only ${checked} static t() key(s) found across ` +
      `${files.length} files.\n  The extraction stopped matching. Fix the parse rather than ` +
      `lowering this floor — a guard whose input comes back empty reports success ` +
      `for a check it never ran.\n`,
  );
  process.exit(1);
}

if (problems.length) {
  console.error("\n[check-message-keys] FAIL:\n");
  for (const p of problems) console.error(`  - ${p}`);
  console.error("");
  process.exit(1);
}

console.log(
  `[check-message-keys] OK: ${checked} static t() key(s) resolve in en.json ` +
    `(${dynamic} dynamic template key(s) not statically checkable).`,
);
