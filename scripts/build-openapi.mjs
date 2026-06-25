// ============================================================================
// scripts/build-openapi.mjs
// ----------------------------------------------------------------------------
// Generates public/openapi.json from public/openapi.yaml.
//
// WHY: public/openapi.yaml is the human-authored, commented source of truth (and
// the file the stock Swagger UI view loads). The on-brand /api reference page
// fetches JSON instead (no client-side YAML parser, and same-origin fetch is
// allowed by the site CSP's connect-src 'self'). Generating one from the other
// at build time keeps them from drifting.
//
// Wired as part of the npm `prebuild` step, so it runs before every `next build`.
// ============================================================================

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import yaml from "js-yaml";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const src = join(root, "public", "openapi.yaml");
const out = join(root, "public", "openapi.json");

const spec = yaml.load(readFileSync(src, "utf8"));

// Pretty-printed with a trailing newline, so diffs stay clean.
writeFileSync(out, JSON.stringify(spec, null, 2) + "\n", "utf8");

const opCount = Object.values(spec.paths ?? {}).reduce(
  (n, methods) => n + Object.keys(methods).length,
  0,
);
console.log(
  `[build-openapi] wrote public/openapi.json (${spec.info?.title} v${spec.info?.version}, ${opCount} operation(s))`,
);
