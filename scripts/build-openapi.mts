// ============================================================================
// scripts/build-openapi.mts
// ----------------------------------------------------------------------------
// Generates public/openapi.yaml AND public/openapi.json from:
//   - scripts/openapi.base.yaml : the hand-authored base (info, servers, shared
//     component schemas, and the rich, fully-specified operations: /cidr since
//     the start, and since 2026-10-19 every tool whose request and response
//     fields are written out field by field; see HAND-AUTHORED below).
//   - scripts/api-sync.json : the golden-vector set id each API tool's contract
//     was last synced with (2026-10-19); stamped on every operation as
//     x-golden-vector-set and checked by scripts/check-api-sync.mjs.
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
// HAND-AUTHORED OPERATIONS (generalised 2026-10-19 from the single /cidr case):
// a path written in openapi.base.yaml is kept as written and no generic
// operation is generated for that slug. Every hand-authored path must name a
// tool in API_TOOLS (no vaporware), and every example in it that carries an
// `x-request` is RE-RUN through that tool's API entry point here: a 200 example
// must equal the result byte for byte (as JSON), a 400 example must equal the
// error the Worker would return. A drifted example fails the build, so the
// published examples cannot disagree with the engine.
//
// Runs under tsx as part of the npm `prebuild` step, before every `next build`.
// ============================================================================

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import * as yaml from "js-yaml";
import { API_TOOLS, API_EXCLUDED, API_TOOL_MAP } from "../src/lib/tools/registry"; // API_TOOL_MAP re-runs the examples (2026-10-19)
import { isDeepStrictEqual } from "node:util"; // compares an example with the engine's result (2026-10-19)
import { CATALOGUE } from "../src/content/catalogue/catalogue";
// The processing switch (src/config/apiSurface.ts): when it is off, the Worker answers every /api/* request with
// 404 api_not_served, and the document must say so (production audit of 2026-10-15, F04: the published contract
// described a "Production edge" server that answered nothing).
import { isApiProcessingEnabled } from "../src/config/apiSurface";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

// ---- 1. Load the hand-authored base (info, servers, components, /cidr). ------
// deno-lint-ignore no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const spec = yaml.load(readFileSync(join(here, "openapi.base.yaml"), "utf8")) as any;

// ---- 1b. The sync record (2026-10-19): slug -> golden-vector set id last synced. --------------------------------
// Read here only to stamp each operation; scripts/check-api-sync.mjs is the guard that compares it with the vectors.
const apiSync = JSON.parse(readFileSync(join(here, "api-sync.json"), "utf8")) as { tools: Record<string, string> }; // the record
// The slugs whose path is hand-authored in the base, before any generated path is added.
const handAuthored = new Set<string>(Object.keys(spec.paths ?? {}).map((p) => p.replace(/^\//, ""))); // e.g. "cidr"

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
// The tags the hand-authored operations use join the list too (2026-10-19), so a hand-authored tool whose family no
// generated tool shares still gets its tag entry.
for (const ops of Object.values((spec.paths ?? {}) as Record<string, Record<string, { tags?: string[] }>>)) for (const op of Object.values(ops)) for (const tag of op.tags ?? []) tagSet.add(tag); // every tag of every hand-authored operation

// ---- 7. Generate a GET + POST operation per tool (cidr stays hand-authored). -
const paths: Record<string, unknown> = spec.paths ?? {};
for (const tool of API_TOOLS) {
  if (handAuthored.has(tool.slug)) continue; // rich, hand-authored in the base (cidr and, since 2026-10-19, the synced tools)

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

// ---- 7a. Hand-authored operations: no vaporware, and every example re-run (2026-10-19). -------------------------
// The Worker's error mapping, repeated here so a 400 example is checked against what the edge would really return:
// an engine's own Error passes its message through; a native runtime error becomes one fixed hint (worker/index.ts).
function workerError(slug: string, err: unknown): { error: string; message: string } { // the 400 body for a thrown error
  // The native error types the Worker hides behind the fixed hint.
  const native = err instanceof TypeError || err instanceof SyntaxError || err instanceof RangeError || err instanceof ReferenceError || err instanceof URIError; // a runtime accident, not an engine refusal
  // The message the Worker would send.
  const message = err instanceof Error && !native ? err.message : `The request body is missing required fields or is not valid JSON for this tool. See the request schema for /api/v1/${slug} at https://ronutz.com/openapi.json.`;
  return { error: "invalid_input", message }; // the Worker's 400 body
} // workerError
const exampleFailures: string[] = []; // every drifted or unverifiable example
let examplesChecked = 0; // how many examples were re-run
for (const slug of handAuthored) { // each hand-authored path
  const tool = API_TOOL_MAP.get(slug); // the tool the path documents
  // A hand-authored path for a tool the API does not serve would be vaporware.
  if (!tool) { exampleFailures.push(`/${slug}: hand-authored in openapi.base.yaml but not in API_TOOLS`); continue; } // reported, next path
  // Every operation of the path (get, post), every response, every media type, every named example.
  for (const [method, op] of Object.entries(paths["/" + slug] as Record<string, any>)) { // get, post
    for (const [status, resp] of Object.entries((op.responses ?? {}) as Record<string, any>)) { // 200, 400
      for (const media of Object.values((resp.content ?? {}) as Record<string, any>)) { // application/json
        for (const [name, ex] of Object.entries((media.examples ?? {}) as Record<string, any>)) { // each named example
          const where = `/${slug} ${method} ${status} example "${name}"`; // for the failure text
          // An example without its request cannot be checked, so it is not allowed in a hand-authored operation.
          if (typeof ex["x-request"] !== "string") { exampleFailures.push(`${where}: no x-request, so it cannot be verified`); continue; } // reported, next example
          examplesChecked++; // counted
          let actual: unknown; // what the edge would return
          try { // run the request as the Worker would
            // A 200 example: the engine's result, through a JSON round trip as the Worker serialises it.
            const result = await tool.run(ex["x-request"]); // the same call the Worker makes
            actual = status === "200" ? JSON.parse(JSON.stringify(result)) : { unexpected: "the request succeeded" }; // a 400 example must fail
          } catch (err) { // the engine refused the request
            // A thrown error: the Worker's 400 body (a 200 example must not throw).
            actual = status === "400" ? workerError(slug, err) : { unexpected: `threw: ${(err as Error).message}` };
          } // ran
          // Byte-for-byte as JSON: field order is not compared, values and types are.
          if (!isDeepStrictEqual(actual, ex.value)) exampleFailures.push(`${where}: the documented value differs from the engine's\n      got: ${JSON.stringify(actual).slice(0, 600)}`); // a drifted example
        } // every example
      } // every media type
    } // every response
  } // every operation
} // every hand-authored path
// Any failure stops the build.
if (exampleFailures.length) { // at least one example drifted or is unverifiable
  console.error("[build-openapi] HAND-AUTHORED EXAMPLE CHECK FAILED (2026-10-19): an example no longer matches the engine:"); // headline
  for (const f of exampleFailures) console.error("  " + f); // each failure
  process.exit(1); // hard stop
} // examples verified

// ---- 7c. Stamp the sync record on every operation (2026-10-19). ------------------------------------------------
// x-golden-vector-set: the golden-vector set id this tool's contract was last checked against. A tool missing from
// the record gets no stamp, and scripts/check-api-sync.mjs reports it.
for (const [path, ops] of Object.entries(paths)) { // every path, generated or hand-authored
  const setId = apiSync.tools[path.replace(/^\//, "")]; // the recorded set id, if any
  if (typeof setId !== "string") continue; // reported by the guard, not here
  for (const op of Object.values(ops as Record<string, any>)) op["x-golden-vector-set"] = setId; // on get and post alike
} // stamped

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

// ---- 7b. Availability (audit F04). ---------------------------------------------
// The contract is published whether or not the edge serves it, so a reader can prepare against it. When the
// switch is off, the description opens with the fact, the server entry says it, and a vendor extension carries it
// as data. Nothing else in the document changes: the operations are the contract the edge will honour once on.
const served = isApiProcessingEnabled();
// The one-line statement, data and prose, kept identical so the two cannot drift.
const availability = served
  ? "served"
  : "documented, not served: the edge answers every /api/* request with HTTP 404 and the body {\"error\":\"api_not_served\"} until processing is switched on; the in-browser tools compute the same results";
// The vendor extension (x- prefixed keys are legal anywhere in OpenAPI 3.1).
spec.info["x-availability"] = availability;
// The prose, in front of the hand-authored description, only when the edge is not serving.
if (!served) {
  spec.info.description =
    "NOT SERVED AT PRESENT. This document is the contract of an API that is published for reading and not yet " +
    "switched on: every request to https://ronutz.com/api/* answers HTTP 404 with {\"error\":\"api_not_served\"}. " +
    "The in-browser tools at https://ronutz.com/en/tools/ compute every result below, locally.\n\n" +
    spec.info.description;
  // The server entry says the same, so a client that reads only the servers list is not misled.
  if (Array.isArray(spec.servers) && spec.servers[0]) {
    spec.servers[0].description = "Documented, not served: answers 404 api_not_served until processing is switched on";
    spec.servers[0]["x-availability"] = availability;
  }
}

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
    `${Object.keys(spec.paths).length} paths, ${opCount} operations, ${apiSlugs.size} tools (parity OK); ` +
    `${handAuthored.size} hand-authored path(s), ${examplesChecked} example(s) re-run and matching.`, // 2026-10-19
);
