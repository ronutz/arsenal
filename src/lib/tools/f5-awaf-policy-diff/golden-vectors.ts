// ============================================================================
// src/lib/tools/f5-awaf-policy-diff/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors for the AWAF policy-diff hole checker. Each builds a before/
// after pair and pins the classification: enforcementMode to Transparent, a
// disabled evasion, a violation whose block flag drops, Data Guard off,
// trustXff on, signature staging on, and a wildcard entity are all POLICY-WIDE
// relaxations that "open a hole"; adding one specific entity is a SINGLE-ENTITY
// (scoped) widening; removals and re-enables are tightenings. Checks assert on
// the derived verdict and change classification.
// ============================================================================

import { diffPolicies, type DiffResult } from "./compute";

export const SET_ID = "f5-awaf-policy-diff-golden-v1";

interface Vector {
  readonly id: string;
  readonly description: string;
  readonly check: () => string | null;
}
function expect(cond: boolean, msg: string): string | null {
  return cond ? null : msg;
}
function has(r: DiffResult | null, kind: "relaxation" | "tightening", scope: "policy-wide" | "single-entity", label: string): boolean {
  return !!r && r.changes.some((c) => c.kind === kind && c.scope === scope && c.labelKey === label);
}

export const VECTORS: readonly Vector[] = [
  {
    id: "enforcement-to-transparent-opens-hole",
    description: "blocking -> transparent is a policy-wide relaxation and opens a hole",
    check: () => {
      const r = diffPolicies({ policy: { enforcementMode: "blocking" } }, { policy: { enforcementMode: "transparent" } });
      return (
        expect(r?.verdict === "opened-hole", `verdict=${r?.verdict}`) ??
        expect(has(r, "relaxation", "policy-wide", "enforcementToTransparent"), "missing enforcement relaxation") ??
        expect(r!.policyWideRelaxations === 1, `policyWide=${r!.policyWideRelaxations}`)
      );
    },
  },
  {
    id: "add-specific-url-is-scoped",
    description: "adding one specific allowed URL is a single-entity widening, not a hole",
    check: () => {
      const r = diffPolicies({ urls: [{ name: "/a" }] }, { urls: [{ name: "/a" }, { name: "/b" }] });
      return (
        expect(r?.verdict === "scoped-only", `verdict=${r?.verdict}`) ??
        expect(has(r, "relaxation", "single-entity", "entityAdded"), "missing scoped add") ??
        expect(r!.policyWideRelaxations === 0, "should be no policy-wide relaxations")
      );
    },
  },
  {
    id: "add-wildcard-url-opens-hole",
    description: "adding a wildcard URL widens beyond a single entity and opens a hole",
    check: () => {
      const r = diffPolicies({ urls: [{ name: "/a" }] }, { urls: [{ name: "/a" }, { name: "/api/*" }] });
      return (
        expect(r?.verdict === "opened-hole", `verdict=${r?.verdict}`) ??
        expect(has(r, "relaxation", "policy-wide", "wildcardAdded"), "missing wildcard relaxation")
      );
    },
  },
  {
    id: "disable-evasion-opens-hole",
    description: "disabling an evasion technique is a policy-wide relaxation",
    check: () => {
      const before = { policy: { "blocking-settings": { evasions: [{ description: "Directory traversals", enabled: true }] } } };
      const after = { policy: { "blocking-settings": { evasions: [{ description: "Directory traversals", enabled: false }] } } };
      const r = diffPolicies(before, after);
      return (
        expect(r?.verdict === "opened-hole", `verdict=${r?.verdict}`) ??
        expect(has(r, "relaxation", "policy-wide", "evasionDisabled"), "missing evasion relaxation")
      );
    },
  },
  {
    id: "violation-block-off-opens-hole",
    description: "a violation whose block flag drops to false is a policy-wide relaxation",
    check: () => {
      const before = { "blocking-settings": { violations: [{ name: "VIOL_ATTACK_SIGNATURE", block: true }] } };
      const after = { "blocking-settings": { violations: [{ name: "VIOL_ATTACK_SIGNATURE", block: false }] } };
      const r = diffPolicies(before, after);
      return (
        expect(r?.verdict === "opened-hole", `verdict=${r?.verdict}`) ??
        expect(has(r, "relaxation", "policy-wide", "violationBlockOff"), "missing violation relaxation")
      );
    },
  },
  {
    id: "data-guard-off-opens-hole",
    description: "turning Data Guard off is a policy-wide relaxation",
    check: () => {
      const r = diffPolicies({ "data-guard": { enabled: true } }, { "data-guard": { enabled: false } });
      return expect(r?.verdict === "opened-hole" && has(r, "relaxation", "policy-wide", "dataGuardOff"), `verdict=${r?.verdict}`);
    },
  },
  {
    id: "trust-xff-on-opens-hole",
    description: "trusting X-Forwarded-For is a policy-wide relaxation",
    check: () => {
      const r = diffPolicies({ general: { trustXff: false } }, { general: { trustXff: true } });
      return expect(r?.verdict === "opened-hole" && has(r, "relaxation", "policy-wide", "trustXffOn"), `verdict=${r?.verdict}`);
    },
  },
  {
    id: "signature-staging-on-opens-hole",
    description: "moving signatures to staging stops them blocking: policy-wide relaxation",
    check: () => {
      const r = diffPolicies({ "signature-settings": { signatureStaging: false } }, { "signature-settings": { signatureStaging: true } });
      return expect(r?.verdict === "opened-hole" && has(r, "relaxation", "policy-wide", "sigStagingOn"), `verdict=${r?.verdict}`);
    },
  },
  {
    id: "tightening-only",
    description: "transparent -> blocking and re-enabling Data Guard are tightenings",
    check: () => {
      const r = diffPolicies(
        { policy: { enforcementMode: "transparent", "data-guard": { enabled: false } } },
        { policy: { enforcementMode: "blocking", "data-guard": { enabled: true } } },
      );
      return (
        expect(r?.verdict === "tightened-only", `verdict=${r?.verdict}`) ??
        expect(r!.tightenings === 2, `tightenings=${r!.tightenings}`) ??
        expect(r!.policyWideRelaxations === 0, "no relaxations expected")
      );
    },
  },
  {
    id: "remove-specific-entity-tightens",
    description: "removing a specific allowed entity is a tightening",
    check: () => {
      const r = diffPolicies({ parameters: [{ name: "q" }, { name: "debug" }] }, { parameters: [{ name: "q" }] });
      return expect(r?.verdict === "tightened-only" && has(r, "tightening", "single-entity", "entityRemoved"), `verdict=${r?.verdict}`);
    },
  },
  {
    id: "no-change",
    description: "identical policies yield no change",
    check: () => {
      const p = { policy: { enforcementMode: "blocking", urls: [{ name: "/a" }] } };
      const r = diffPolicies(p, p);
      return expect(r?.verdict === "no-change" && r!.changes.length === 0, `verdict=${r?.verdict}`);
    },
  },
  {
    id: "mixed-scoped-add-plus-tighten-not-a-hole",
    description: "a scoped add plus a tightening is scoped-only, not a hole",
    check: () => {
      const before = { urls: [{ name: "/a" }], "data-guard": { enabled: false } };
      const after = { urls: [{ name: "/a" }, { name: "/b" }], "data-guard": { enabled: true } };
      const r = diffPolicies(before, after);
      return (
        expect(r?.verdict === "scoped-only", `verdict=${r?.verdict}`) ??
        expect(r!.policyWideRelaxations === 0, "no policy-wide relaxations") ??
        expect(r!.singleEntityRelaxations === 1 && r!.tightenings === 1, "expected 1 scoped relax + 1 tighten")
      );
    },
  },
  {
    id: "policy-wide-sorts-first",
    description: "a policy-wide high-concern relaxation sorts ahead of a scoped add",
    check: () => {
      const before = { policy: { enforcementMode: "blocking", urls: [{ name: "/a" }] } };
      const after = { policy: { enforcementMode: "transparent", urls: [{ name: "/a" }, { name: "/b" }] } };
      const r = diffPolicies(before, after);
      return expect(!!r && r.changes[0].scope === "policy-wide" && r.changes[0].concern === "high", "policy-wide high should sort first");
    },
  },
  {
    id: "non-object-returns-null",
    description: "non-policy input returns null rather than throwing",
    check: () => expect(diffPolicies("nope", 5) === null, "should return null for non-objects"),
  },
];

export function verifyVectors(): { ok: boolean; failures: string[] } {
  const failures: string[] = [];
  for (const v of VECTORS) {
    let msg: string | null;
    try {
      msg = v.check();
    } catch (e) {
      msg = e instanceof Error ? e.message : String(e);
    }
    if (msg) failures.push(`${v.id}: ${msg}`);
  }
  return { ok: failures.length === 0, failures };
}
