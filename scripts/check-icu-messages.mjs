// ============================================================================
// scripts/check-icu-messages.mjs
// ----------------------------------------------------------------------------
// BUILD GUARD — every string in every locale pack must parse as a valid ICU
// message. The parser imported below is the same one next-intl uses at render
// time, so this check is exactly as strict as production.
//
// WHY: a malformed message does not fail the build on its own. next-intl logs
// INVALID_MESSAGE during prerender and silently renders a fallback key path
// instead of the string, so the damage ships. Found in the wild: the AWAF
// explainer's inputPlaceholder (a literal JSON example) rendered as
// "tools.f5-awaf-declarative-policy-explainer.inputPlaceholder" in all 16
// locales, because ICU read the JSON's braces as message arguments. This
// guard turns that silent degradation into a hard prebuild failure.
//
// EXCEPTION: the exact key paths in RAW_LITERAL_KEYS are rendered with
// t.raw() by their components (code/JSON sample literals, never ICU
// messages), so braces are legal there. The allowlist is exact full paths,
// not patterns, so every other key stays guarded.
// ============================================================================
import { readFileSync, readdirSync } from "node:fs";
import { parse } from "@formatjs/icu-messageformat-parser";

const DIR = "src/i18n/messages";

// Keys rendered via t.raw() (literal samples). Keep in sync with the
// components that consume them; add a key here only when its render site
// uses t.raw().
const RAW_LITERAL_KEYS = new Set([
  "tools.f5-awaf-declarative-policy-explainer.inputPlaceholder",
  "tools.f5-lb-method-chooser.inputPlaceholder", // tmsh pool sample: literal braces, rendered with t.raw()
  "tools.f5-gslb-decision-flow.inputPlaceholder", // gtm pool sample: literal braces, rendered with t.raw()
  "tools.f5-topology-longest-match.inputPlaceholder", // topology record sample: literal braces, rendered with t.raw()
  "tools.f5-dos-vector-explainer.inputPlaceholder", // dos device-config sample: literal braces, rendered with t.raw()
  "tools.f5-irules-command-context.inputPlaceholder", // iRule sample: literal braces, rendered with t.raw()
  "tools.f5-irules-vs-ltm-policy.inputPlaceholder", // iRule sample: literal braces, rendered with t.raw()
]);

const packs = readdirSync(DIR).filter((f) => f.endsWith(".json"));
const failures = [];
let checked = 0;
let skipped = 0;

for (const file of packs) {
  const pack = JSON.parse(readFileSync(`${DIR}/${file}`, "utf8"));
  const walk = (node, path) => {
    for (const [key, value] of Object.entries(node)) {
      const keyPath = path ? `${path}.${key}` : key;
      if (typeof value === "string") {
        if (RAW_LITERAL_KEYS.has(keyPath)) {
          skipped++;
          continue;
        }
        checked++;
        try {
          parse(value);
        } catch (err) {
          failures.push(`${file} :: ${keyPath} :: ${String(err?.message ?? err)}`);
        }
      } else if (value && typeof value === "object") {
        walk(value, keyPath);
      }
    }
  };
  walk(pack, "");
}

if (failures.length > 0) {
  console.error(`[check-icu-messages] FAIL: ${failures.length} message(s) do not parse as ICU:`);
  for (const f of failures) console.error(`  - ${f}`);
  console.error("  Fix the string, or render it with t.raw() and add its exact key to RAW_LITERAL_KEYS.");
  process.exit(1);
}
console.log(
  `[check-icu-messages] OK: ${checked} messages parse as ICU across ${packs.length} locale packs (${skipped} raw-literal keys skipped).`
);
