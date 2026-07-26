// ============================================================================
// src/lib/tools/fortigate-ipsec-phase-mismatch-analyzer/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS.
//
// These pin the three FALSE POSITIVES the tool must not produce as hard as
// they pin the real faults, because a mismatch analyser that reports healthy
// configurations as broken is worse than no analyser:
//   - proposal lists that DIFFER but intersect       -> fine
//   - lifetimes that differ                          -> fine, shorter wins
//   - selectors that are mirrored (src vs dst)       -> fine, that is correct
// ============================================================================

import { run } from "./compute";

export const SET_ID = "fortigate-ipsec-phase-mismatch-analyzer/golden@1";

export interface IpsecVector {
  readonly name: string;
  readonly input: string;
  readonly failsAt: "phase1" | "phase2" | null;
  /** Substring required in the issue details. */
  readonly mustFind?: string;
  /** Substring that must NOT appear anywhere in the issues. */
  readonly mustNotFind?: string;
}

const HEALTHY = `peer: name=SiteA
phase1: version=ikev2, encryption=aes256, hash=sha256, dhgroup=14, auth=psk, lifetime=86400
phase2: encryption=aes256, hash=sha256, pfs=enable, dhgroup=14, lifetime=43200, src=10.1.0.0/16, dst=10.2.0.0/16

peer: name=SiteB
phase1: version=ikev2, encryption=aes256, hash=sha256, dhgroup=14, auth=psk, lifetime=86400
phase2: encryption=aes256, hash=sha256, pfs=enable, dhgroup=14, lifetime=43200, src=10.2.0.0/16, dst=10.1.0.0/16`;

export const VECTORS: readonly IpsecVector[] = Object.freeze([
  {
    name: "a correct mirrored tunnel reports no failure",
    input: HEALTHY,
    failsAt: null,
    mustFind: "mirrored correctly",
  },
  {
    // FALSE POSITIVE GUARD: differing lists that intersect are fine.
    name: "proposal lists that differ but intersect are not a fault",
    input: HEALTHY.replace(
      "phase1: version=ikev2, encryption=aes256, hash=sha256, dhgroup=14, auth=psk, lifetime=86400\nphase2: encryption=aes256, hash=sha256, pfs=enable, dhgroup=14, lifetime=43200, src=10.2.0.0/16",
      "phase1: version=ikev2, encryption=aes128 aes256, hash=sha1 sha256, dhgroup=5 14, auth=psk, lifetime=86400\nphase2: encryption=aes256, hash=sha256, pfs=enable, dhgroup=14, lifetime=43200, src=10.2.0.0/16",
    ),
    failsAt: null,
    mustFind: "not identical lists",
  },
  {
    // FALSE POSITIVE GUARD: lifetimes need not match.
    name: "differing lifetimes are informational, not fatal",
    input: HEALTHY.replace("lifetime=86400\nphase2: encryption=aes256, hash=sha256, pfs=enable, dhgroup=14, lifetime=43200, src=10.2.0.0/16",
                           "lifetime=28800\nphase2: encryption=aes256, hash=sha256, pfs=enable, dhgroup=14, lifetime=3600, src=10.2.0.0/16"),
    failsAt: null,
    mustFind: "shorter value wins",
  },
  {
    // Real phase 1 fault: no common encryption.
    name: "no common phase 1 encryption fails phase 1",
    input: HEALTHY.replace("phase1: version=ikev2, encryption=aes256, hash=sha256, dhgroup=14, auth=psk, lifetime=86400\nphase2: encryption=aes256, hash=sha256, pfs=enable, dhgroup=14, lifetime=43200, src=10.2.0.0/16",
                           "phase1: version=ikev2, encryption=3des, hash=sha256, dhgroup=14, auth=psk, lifetime=86400\nphase2: encryption=aes256, hash=sha256, pfs=enable, dhgroup=14, lifetime=43200, src=10.2.0.0/16"),
    failsAt: "phase1",
    mustFind: "No common encryption",
  },
  {
    // Real phase 2 fault: PFS on one side only.
    name: "PFS on one side only fails phase 2",
    input: HEALTHY.replace("pfs=enable, dhgroup=14, lifetime=43200, src=10.2.0.0/16", "pfs=disable, lifetime=43200, src=10.2.0.0/16"),
    failsAt: "phase2",
    mustFind: "does not usually say PFS",
  },
  {
    // Real phase 2 fault: subnet vs supernet is a mismatch, not an approximation.
    name: "a supernet on one side is a selector mismatch",
    input: HEALTHY.replace("src=10.2.0.0/16, dst=10.1.0.0/16", "src=10.2.0.0/16, dst=10.1.0.0/24"),
    failsAt: "phase2",
    mustFind: "not an approximation",
  },
  {
    // Phase 1 beats phase 2 in reporting order: if phase 1 fails, phase 2 is
    // never attempted, and saying otherwise sends people down the wrong path.
    name: "phase 1 failure takes precedence over a phase 2 failure",
    input: HEALTHY
      .replace("auth=psk, lifetime=86400\nphase2: encryption=aes256, hash=sha256, pfs=enable, dhgroup=14, lifetime=43200, src=10.2.0.0/16",
               "auth=rsa-signature, lifetime=86400\nphase2: encryption=aes256, hash=sha256, pfs=disable, lifetime=43200, src=10.2.0.0/16"),
    failsAt: "phase1",
    mustFind: "never attempted",
  },
  {
    name: "empty input yields the reference card",
    input: "",
    failsAt: null,
  },
  {
    name: "one peer only warns rather than throwing",
    input: "peer: name=Solo\nphase1: version=ikev2",
    failsAt: null,
  },
]);

export function verifyVectors(): { ok: true; count: number } {
  for (const v of VECTORS) {
    const { result } = run(v.input);
    if (result.failsAt !== v.failsAt) {
      throw new Error(`[${SET_ID}] "${v.name}": expected failsAt ${String(v.failsAt)}, got ${String(result.failsAt)}`);
    }
    const all = [...result.issues.map((i) => i.detail), result.verdict ?? ""].join(" | ");
    if (v.mustFind && !all.includes(v.mustFind)) {
      throw new Error(`[${SET_ID}] "${v.name}": missing "${v.mustFind}". Got: ${all}`);
    }
    if (v.mustNotFind && all.includes(v.mustNotFind)) {
      throw new Error(`[${SET_ID}] "${v.name}": wrongly contains "${v.mustNotFind}"`);
    }
  }
  return { ok: true, count: VECTORS.length };
}
