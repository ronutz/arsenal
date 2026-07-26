// ============================================================================
// src/lib/tools/fortios-config-diff-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS.
//
// The two that carry the tool are opposites, and both must hold:
//   - a MOVE in an order-INSENSITIVE section is NOT a change (a line diff
//     would report it as a deletion plus an insertion)
//   - a MOVE in firewall policy IS a change (no setting differs, yet the
//     device behaves differently, and a line diff buries it)
// Getting either backwards would make the tool actively misleading.
// ============================================================================

import { run } from "./compute";

export const SET_ID = "fortios-config-diff-explainer/golden@1";

export interface DiffVector {
  readonly name: string;
  readonly input: string;
  /** Expected count per change kind. Kinds not listed must be absent. */
  readonly expect: Readonly<Record<string, number>>;
  readonly mustFind?: string;
}

const ADDR = (order: readonly string[]) =>
  `config firewall address\n${order.map((n) => `    edit "${n}"\n        set subnet 10.0.0.0 255.0.0.0\n    next`).join("\n")}\nend`;

const POL = (order: readonly string[]) =>
  `config firewall policy\n${order.map((n) => `    edit ${n}\n        set srcintf "port1"\n        set action accept\n    next`).join("\n")}\nend`;

const RAW: readonly DiffVector[] = [
  {
    // A line diff would call this a deletion and an insertion. It is neither.
    name: "reordering an order-INSENSITIVE section is not a change",
    input: `${ADDR(["LAN", "DMZ"])}\n---\n${ADDR(["DMZ", "LAN"])}`,
    expect: {},
    mustFind: "No structural differences",
  },
  {
    // No setting differs and the device behaves differently. This is the edit
    // reviewers miss.
    name: "reordering firewall policy IS a change",
    input: `${POL(["1", "2"])}\n---\n${POL(["2", "1"])}`,
    expect: { "object-moved": 1 },
    mustFind: "ORDER CHANGED",
  },
  {
    name: "a changed setting is reported with old and new values",
    input: `config firewall address
    edit "LAN"
        set subnet 10.1.0.0 255.255.0.0
    next
end
---
config firewall address
    edit "LAN"
        set subnet 10.2.0.0 255.255.0.0
    next
end`,
    expect: { "object-changed": 1 },
  },
  {
    name: "added and removed objects are distinguished",
    input: `${ADDR(["LAN", "OLD"])}\n---\n${ADDR(["LAN", "NEW"])}`,
    expect: { "object-added": 1, "object-removed": 1 },
  },
  {
    name: "a whole new section is reported once, not per object",
    input: `${ADDR(["LAN"])}\n---\n${ADDR(["LAN"])}\n${POL(["1", "2"])}`,
    expect: { "section-added": 1 },
  },
  {
    // Identical input must be silent. A diff tool that finds phantom changes
    // is untrustworthy on the ones that matter.
    name: "identical configurations report nothing",
    input: `${POL(["1", "2"])}\n---\n${POL(["1", "2"])}`,
    expect: {},
    mustFind: "No structural differences",
  },
  {
    name: "BEFORE/AFTER labels work as a separator",
    input: `BEFORE:\n${ADDR(["LAN"])}\nAFTER:\n${ADDR(["LAN", "DMZ"])}`,
    expect: { "object-added": 1 },
  },
  {
    name: "empty input yields the reference card",
    input: "",
    expect: {},
  },
  {
    name: "input with no separator warns rather than throwing",
    input: ADDR(["LAN"]),
    expect: {},
  },
];

export const VECTORS: readonly DiffVector[] = Object.freeze(RAW);

export function verifyVectors(): { ok: true; count: number } {
  for (const v of VECTORS) {
    const { result } = run(v.input);
    const got = result.counts;
    for (const [k, n] of Object.entries(v.expect)) {
      if ((got[k] ?? 0) !== n) {
        throw new Error(`[${SET_ID}] "${v.name}": expected ${n} ${k}, got ${got[k] ?? 0}`);
      }
    }
    for (const k of Object.keys(got)) {
      if (!(k in v.expect)) {
        throw new Error(`[${SET_ID}] "${v.name}": unexpected change kind "${k}" (${got[k]})`);
      }
    }
    if (v.mustFind) {
      const all = [...result.changes.map((c) => c.detail), ...result.notes].join(" | ");
      if (!all.includes(v.mustFind)) {
        throw new Error(`[${SET_ID}] "${v.name}": missing "${v.mustFind}". Got: ${all}`);
      }
    }
  }
  return { ok: true, count: VECTORS.length };
}
