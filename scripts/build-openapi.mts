// ============================================================================
// scripts/build-openapi.mts
// ----------------------------------------------------------------------------
// Generates public/openapi.yaml AND public/openapi.json from:
//   - scripts/openapi.base.yaml : the hand-authored base (info, servers, shared
//     component schemas, and the one rich, fully-specified /cidr operation).
//   - src/lib/tools/registry.ts : the single source of truth for which tools are
//     exposed over the API (API_TOOLS). One operation is generated per tool.
//   - src/content/catalogue/catalogue.ts : the tool family (for the tag) and the
//     authoritative "built" list (for the parity check).
//   - src/i18n/messages/en.json : each tool's name and blurb (summary/description).
//   - each tool's manifest : the input example.
//
// WHY THIS EXISTS (D-72): the API used to document only /cidr while the toolbox
// grew to dozens of tools, because both the Worker route and this spec were
// hand-maintained and silently fell behind. Now the Worker (worker/index.ts) and
// this generator read the SAME registry, so served and documented endpoints
// cannot drift. And this script FAILS THE BUILD if any tool marked "built" in the
// catalogue is not in the registry (or vice versa), so a new tool cannot ship
// without an API endpoint and a doc entry.
//
// Runs under tsx as part of the npm `prebuild` step, before every `next build`.
// ============================================================================

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import yaml from "js-yaml";
import { API_TOOLS, API_EXCLUDED } from "../src/lib/tools/registry";
import { CATALOGUE } from "../src/content/catalogue/catalogue";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

// ---- 1. Load the hand-authored base (info, servers, components, /cidr). ------
// deno-lint-ignore no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const spec = yaml.load(readFileSync(join(here, "openapi.base.yaml"), "utf8")) as any;

// ---- 2. i18n names + blurbs. -------------------------------------------------
const en = JSON.parse(readFileSync(join(root, "src", "i18n", "messages", "en.json"), "utf8"));

// ---- 3. Family + specs per slug (catalogue is authoritative). ----------------
const familyOf = new Map<string, string>();
const specsOf = new Map<string, string[]>();
for (const t of CATALOGUE) {
  familyOf.set(t.slug, t.family);
  if (t.specs) specsOf.set(t.slug, t.specs);
}

// ---- 4. ENFORCEMENT (D-72): every built tool is exposed OR explicitly excluded.
const builtSlugs = new Set(CATALOGUE.filter((t) => t.status === "live").map((t) => t.slug));
const apiSlugs = new Set(API_TOOLS.map((t) => t.slug));
const excludedSlugs = new Set(Object.keys(API_EXCLUDED));
const covered = new Set([...apiSlugs, ...excludedSlugs]);
const builtNotCovered = [...builtSlugs].filter((s) => !covered.has(s));
const exposedNotBuilt = [...apiSlugs].filter((s) => !builtSlugs.has(s));
const excludedNotBuilt = [...excludedSlugs].filter((s) => !builtSlugs.has(s));
const both = [...apiSlugs].filter((s) => excludedSlugs.has(s));
if (builtNotCovered.length || exposedNotBuilt.length || excludedNotBuilt.length || both.length) {
  console.error("[build-openapi] API PARITY CHECK FAILED (D-72):");
  if (builtNotCovered.length)
    console.error(
      "  Built tools with no API decision (add to API_TOOLS or API_EXCLUDED in registry.ts):\n    " +
        builtNotCovered.join(", "),
    );
  if (exposedNotBuilt.length)
    console.error("  In the registry but not marked 'live' in the catalogue:\n    " + exposedNotBuilt.join(", "));
  if (excludedNotBuilt.length)
    console.error("  In API_EXCLUDED but not marked 'live' in the catalogue:\n    " + excludedNotBuilt.join(", "));
  if (both.length) console.error("  Listed as BOTH exposed and excluded (pick one):\n    " + both.join(", "));
  process.exit(1);
}

// ---- 5. Pull the input example + declared family from each tool's manifest. --
interface ManifestMeta {
  example?: string;
  toolFamily?: string;
}
async function manifestMeta(slug: string): Promise<ManifestMeta> {
  try {
    const m = await import(`../src/lib/tools/${slug}/index.ts`);
    const ex = m.manifest?.inputDetectors?.[0]?.example;
    return {
      example: typeof ex === "string" ? ex : undefined,
      toolFamily: m.manifest?.toolFamily,
    };
  } catch {
    return {};
  }
}

// Accumulates any tool whose manifest toolFamily disagrees with its catalogue
// family. Checked after the loop; a mismatch fails the build (D-73), so the two
// family systems stay in lockstep and the API tags stay canonical.
const familyMismatches: string[] = [];

// ---- 6. Tag bookkeeping (preserve base tag descriptions, add new families). --
const tagSet = new Set<string>((spec.tags ?? []).map((t: { name: string }) => t.name));

// ---- 7. Generate a GET + POST operation per tool (cidr stays hand-authored). -
const paths: Record<string, unknown> = spec.paths ?? {};
for (const tool of API_TOOLS) {
  if (tool.slug === "cidr") continue; // rich, hand-authored in the base

  const t = en.tools?.[tool.slug] ?? {};
  const name: string = t.name ?? tool.slug;
  const blurb: string = String(t.blurb ?? "").replace(/\s+/g, " ").trim();
  const family = familyOf.get(tool.slug) ?? "Tools";
  tagSet.add(family);
  const specs = specsOf.get(tool.slug) ?? [];
  const meta = await manifestMeta(tool.slug);
  const example = meta.example;
  if (meta.toolFamily && meta.toolFamily !== family) {
    familyMismatches.push(
      `${tool.slug}: manifest toolFamily "${meta.toolFamily}" != catalogue family "${family}"`,
    );
  }
  const opId = "run_" + tool.slug.replace(/-/g, "_");

  const description = [
    blurb,
    tool.structured
      ? "The input is a JSON object: send it as the request body (POST) or as a JSON string (?input=)."
      : "",
    specs.length ? `Standards: ${specs.join(", ")}.` : "",
    "Stateless and side-effect-free: the same input always yields the same result, and nothing is stored or logged.",
  ]
    .filter(Boolean)
    .join(" ");

  const inputSchema: Record<string, unknown> = {
    type: "string",
    ...(example ? { examples: [example] } : {}),
  };

  const okResponse = {
    description: "The computed result.",
    content: { "application/json": { schema: { $ref: "#/components/schemas/ToolResult" } } },
  };
  const errResponse = {
    description: "The input is missing or could not be processed.",
    content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
  };

  paths["/" + tool.slug] = {
    get: {
      tags: [family],
      operationId: opId,
      summary: name,
      description,
      parameters: [
        {
          name: "input",
          in: "query",
          required: true,
          description: tool.structured ? "The tool input, as a JSON string." : "The tool input.",
          schema: inputSchema,
        },
      ],
      responses: { "200": okResponse, "400": errResponse },
    },
    post: {
      tags: [family],
      operationId: opId + "_post",
      summary: `${name} (POST)`,
      description,
      requestBody: {
        required: true,
        description: tool.structured ? "The tool input as a JSON object." : "The tool input as text.",
        content: tool.structured
          ? { "application/json": { schema: { type: "object", additionalProperties: true } } }
          : { "text/plain": { schema: { type: "string", ...(example ? { examples: [example] } : {}) } } },
      },
      responses: { "200": okResponse, "400": errResponse },
    },
  };
}

// ---- Family taxonomy enforcement (D-73). -------------------------------------
if (familyMismatches.length) {
  console.error(
    "[build-openapi] FAMILY TAXONOMY CHECK FAILED (D-73): every tool's manifest toolFamily\n" +
      "must equal its catalogue family (the single canonical family list in catalogue.ts):",
  );
  for (const m of familyMismatches) console.error("  " + m);
  process.exit(1);
}

// Deterministic path order (keeps diffs clean); /cidr and the rest sort by slug.
spec.paths = Object.fromEntries(
  Object.entries(paths).sort(([a], [b]) => a.localeCompare(b)),
);

// Rebuild the tag list: keep any hand-authored descriptions, add the rest.
const baseTags = new Map<string, { name: string; description?: string }>(
  (spec.tags ?? []).map((t: { name: string; description?: string }) => [t.name, t]),
);
spec.tags = [...tagSet].sort().map((name) => baseTags.get(name) ?? { name });

// ---- 8. Write both artifacts. ------------------------------------------------
writeFileSync(join(root, "public", "openapi.json"), JSON.stringify(spec, null, 2) + "\n", "utf8");
writeFileSync(
  join(root, "public", "openapi.yaml"),
  yaml.dump(spec, { lineWidth: 100, noRefs: true, sortKeys: false }),
  "utf8",
);

const opCount = Object.values(spec.paths).reduce(
  (n: number, methods) => n + Object.keys(methods as object).length,
  0,
);
console.log(
  `[build-openapi] generated public/openapi.{yaml,json} — ${spec.info?.title} v${spec.info?.version}: ` +
    `${Object.keys(spec.paths).length} paths, ${opCount} operations, ${apiSlugs.size} tools (parity OK).`,
);
