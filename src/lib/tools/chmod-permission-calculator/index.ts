// ============================================================================
// src/lib/tools/chmod-permission-calculator/index.ts
// ----------------------------------------------------------------------------
// CHMOD PERMISSION CALCULATOR: the self-describing {manifest, run, vectors}
// triple (D-49).
//
// Read a file mode in any of its three spellings, octal ("4755"), ls string
// ("-rwsr-xr-x") or chmod symbolic clauses on a base ("g+s,o-rwx"), and get
// every other spelling back with the reading: which class may do what, what
// the three special bits mean for a file or a directory, the s/S and t/T
// letters as ls prints them, the chmod commands that reach the mode, the
// umask that would create it, a trace of each clause and the combinations
// worth a second look. POSIX.1-2024 chmod and ls, the GNU coreutils manual
// and chmod(1) from coreutils 9.11 are the sources, all read 2026-10-03.
// Local and deterministic: nothing leaves the browser, no file is touched.
// ============================================================================

import { run as compute, SOURCES, type ChmodInput, type ChmodResult } from "./compute";
import { GOLDEN_VECTOR_SET_ID, VECTORS } from "./golden-vectors";

// The compute layer's public types and helpers.
export type { ChmodInput, ChmodResult, Rwx, Special, Who, Kind, InputForm, ClauseStep, Source } from "./compute";
export { SOURCES, toOctal4, toSymbolic } from "./compute";
// The vector set and its runner.
export { GOLDEN_VECTOR_SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest. */
export const manifest = Object.freeze({
  // The family the tool is listed under (the catalogue uses the same name).
  toolFamily: "Text & utilities",
  // The slug.
  toolSlug: "chmod-permission-calculator",
  // Other names it answers to.
  canonicalAliases: ["chmod", "file-permissions", "unix-permissions", "octal-permissions", "umask"],
  // What pasted input it recognises (the example is a valid API body).
  inputDetectors: [
    { kind: "regex", priority: 2, pattern: "^[0-7]{3,4}$|^[-d]?[rwxsStT-]{9}$|^[ugoa]*[+=-][rwxXstugo]*(,[ugoa]*[+=-][rwxXstugo]*)*$", example: "{\"mode\":\"g+s,o-rwx\",\"base\":\"755\",\"kind\":\"directory\"}" },
  ],
  // Runs in the browser.
  capabilityBadge: "browser",
  // Nothing leaves the page.
  executionClass: ["localOnly"],
  // Where an API exists for it, it runs this same code.
  apiCapabilityClass: "local-equivalent",
  // The vector set.
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  // How hostile or oversized input is handled: every field is cut at 64 characters and parsed by hand.
  dangerousInputHandling: ["bounded-parse", "generated-code-only", "never-fetches"],
  // The default for share links.
  shareSafetyDefault: "fragment",
  // The Learn articles written for it.
  learnLinks: ["learn/file-modes-octal-symbolic-and-the-special-bits"],
  // Tools that teach the neighbouring ideas.
  relatedTools: ["cidr", "ascii-table", "cable-run-planner"],
  // Sources, each read live on its access date.
  sources: SOURCES.map((s) => ({ ...s, status: "active" as const })),
  // Credits.
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

/** run: the registry-facing entry point. */
export function run(input: ChmodInput): ChmodResult {
  // The compute layer does the work.
  return compute(input);
}

/** The vectors (the page's Example button uses one verbatim, D-83). */
export const goldenVectors = VECTORS;
