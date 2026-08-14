// ============================================================================
// GOLDEN VECTORS for the FortiOS CLI config explainer.
//
// The behaviours that must not drift: set on a list field WARNS, append does
// not, edit is described as create-or-enter, end commits while next does not,
// and an unbalanced block is reported rather than quietly accepted.
// ============================================================================

import { decodeConfig } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "fortios-cli-config-explainer/2026-08-14";

const POLICY = `config firewall policy
    edit 10
        set name "allow-web"
        set srcintf "port1"
        set dstintf "port2"
        set srcaddr "internal-net"
        set dstaddr "all"
        set service "HTTPS"
        set action accept
    next
end`;

const APPEND_FORM = `config firewall policy
    edit 10
        append srcaddr "branch-net"
    next
end`;

const UNBALANCED = `config firewall policy
    edit 10
        set action accept`;

export interface ConfigVector {
  name: string;
  input: string;
  expect: {
    balanced?: boolean;
    warns?: boolean;
    warnContains?: string;
    explainContains?: [number, string];
    noteContains?: string;
    maxDepth?: number;
    throws?: boolean;
  };
}

export const CONFIG_VECTORS: readonly ConfigVector[] = Object.freeze([
  {
    name: "a well-formed policy block is balanced",
    input: POLICY,
    expect: { balanced: true, maxDepth: 2 },
  },
  {
    name: "*** set on a LIST FIELD warns that it replaces ***",
    input: POLICY,
    expect: { warnContains: "replaces every value in srcaddr" },
  },
  {
    name: "*** append does NOT warn - it is the safe form ***",
    input: APPEND_FORM,
    expect: { warns: false },
  },
  {
    name: "set on a NON-list field does not warn",
    input: `config system global\n    set hostname "fw01"\nend`,
    expect: { warns: false },
  },
  {
    name: "edit is described as create-or-enter",
    input: POLICY,
    expect: { explainContains: [2, "CREATES IT if it does not already exist"] },
  },
  {
    name: "next stays in the table and does not commit",
    input: POLICY,
    expect: { explainContains: [10, "STAYS IN THE TABLE"] },
  },
  {
    name: "*** end is what COMMITS ***",
    input: POLICY,
    expect: { explainContains: [11, "COMMITS"] },
  },
  {
    name: "an unbalanced block is reported",
    input: UNBALANCED,
    expect: { balanced: false, warnContains: "opened and never closed" },
  },
  {
    name: "and it is told nothing was committed",
    input: UNBALANCED,
    expect: { noteContains: "Nothing here has been committed" },
  },
  {
    name: "purge warns about its scope",
    input: `config firewall address\n    purge\nend`,
    expect: { warnContains: "removes every entry in the table" },
  },
  {
    name: "abort is explained as the discard path",
    input: `config firewall policy\n    edit 10\n        set action deny\n    abort`,
    expect: { explainContains: [4, "DISCARDING"] },
  },
  {
    name: "the next-versus-end note is always given",
    input: POLICY,
    expect: { noteContains: "next and end are not interchangeable" },
  },
  {
    name: "the show-versus-show-full note is always given",
    input: POLICY,
    expect: { noteContains: "may simply be at its default" },
  },
  {
    name: "text with no FortiOS verbs throws",
    input: "hello world\nthis is not a config",
    expect: { throws: true },
  },
  {
    name: "empty input throws",
    input: "   ",
    expect: { throws: true },
  },
]);

/** Run every vector. Returns the failures, empty when all pass. */
export function verifyVectors(): string[] {
  const f: string[] = [];
  for (const v of CONFIG_VECTORS) {
    let d;
    try {
      d = decodeConfig(v.input);
      if (v.expect.throws) { f.push(`${v.name}: expected a throw`); continue; }
    } catch (e) {
      if (!v.expect.throws) f.push(`${v.name}: threw ${(e as Error).message}`);
      continue;
    }
    const e = v.expect;
    if (e.balanced !== undefined && d.balanced !== e.balanced) f.push(`${v.name}: balanced ${d.balanced} != ${e.balanced}`);
    if (e.warns !== undefined && (d.warnings.length > 0) !== e.warns) f.push(`${v.name}: warnings ${d.warnings.length}, expected warns=${e.warns}`);
    if (e.warnContains && !d.warnings.some((w) => w.includes(e.warnContains!))) f.push(`${v.name}: no warning containing "${e.warnContains}"`);
    if (e.noteContains && !d.notes.some((n) => n.includes(e.noteContains!))) f.push(`${v.name}: no note containing "${e.noteContains}"`);
    if (e.maxDepth !== undefined) {
      const max = Math.max(...d.lines.map((l) => l.depth));
      if (max !== e.maxDepth) f.push(`${v.name}: max depth ${max} != ${e.maxDepth}`);
    }
    if (e.explainContains) {
      const [ln, frag] = e.explainContains;
      const hit = d.lines.find((l) => l.line === ln);
      if (!hit) f.push(`${v.name}: no line ${ln}`);
      else if (!hit.explain.includes(frag)) f.push(`${v.name}: line ${ln} explanation lacks "${frag}"`);
    }
  }
  return f;
}
