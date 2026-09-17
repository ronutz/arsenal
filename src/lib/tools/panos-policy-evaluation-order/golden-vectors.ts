// ============================================================================
// src/lib/tools/panos-policy-evaluation-order/golden-vectors.ts
// ----------------------------------------------------------------------------
// Vectors for the PAN-OS / Prisma Access evaluation-order engine.
//
// Unlike the DHCP option 43 tool, these cannot be lifted verbatim from a vendor
// page: Palo Alto documents the RULES of evaluation rather than worked
// examples with expected outputs. So each vector below is a minimal case
// constructed to test one DOCUMENTED CLAIM, and each names the claim and its
// source. That is the honest version of a golden set when the vendor publishes
// a specification instead of examples.
//
// The claims under test, all from docs.paloaltonetworks.com:
//
//  1. Layer order is shared-pre, dg-pre, local, dg-post, shared-post.
//     "A firewall evaluates policy rules by layer (shared, device group, and
//      local) and by type (pre-rules, post-rules, and default rules) in the
//      following order from top to bottom" - Device Groups.
//  2. Local rules sit BETWEEN pre and post rules.
//     "Local firewall rules display between the pre-rules and post-rules."
//  3. First match wins and evaluation stops.
//     "the firewall executes the rule's action ... and doesn't compare the
//      traffic to any other rules" - Security Policy Rulebase Best Practices.
//  4. The defaults are asymmetric: intrazone-default allows, interzone-default
//     denies. - Security Policy Rule Best Practices.
//  5. A broad rule above a specific one shadows it.
//     "Shadowing is when a broad rule that includes the same matching criteria
//      as a more specific rule is placed higher in the rulebase" - same source.
// ============================================================================

import { run, PanosPolicyError, type PanosErrorCode } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "panos-policy-evaluation-order-golden-v1";

interface Vector {
  name: string;
  claim: string;
  rules: string;
  traffic?: Parameters<typeof run>[0]["traffic"];
  expect: {
    decisionRule?: string;
    action?: string;
    byDefault?: boolean;
    shadowedCount?: number;
    firstShadowedName?: string;
    crossesLayer?: boolean;
  };
}

const TRUST_TO_UNTRUST = {
  fromZone: "trust",
  toZone: "untrust",
  source: "10.0.0.5",
  destination: "203.0.113.10",
  application: "web-browsing",
  service: "application-default",
  user: "any",
};

export const PANOS_GOLDEN_VECTORS: readonly Vector[] = [
  {
    name: "shared pre-rule beats a local rule",
    claim: "Claim 1 and 2: shared pre-rules evaluate before local rules",
    rules: [
      "local      | allow-web  | allow | from=trust to=untrust app=web-browsing",
      "shared-pre | block-web  | deny  | from=trust to=untrust app=web-browsing",
    ].join("\n"),
    traffic: TRUST_TO_UNTRUST,
    expect: { decisionRule: "block-web", action: "deny", byDefault: false },
  },
  {
    name: "device group pre-rule beats a local rule",
    claim: "Claim 1: dg-pre evaluates before local",
    rules: [
      "local  | allow-web | allow | from=trust to=untrust app=web-browsing",
      "dg-pre | block-web | deny  | from=trust to=untrust app=web-browsing",
    ].join("\n"),
    traffic: TRUST_TO_UNTRUST,
    expect: { decisionRule: "block-web", action: "deny" },
  },
  {
    name: "a local rule beats a device group post-rule",
    claim: "Claim 2: local rules sit ABOVE post-rules",
    rules: [
      "dg-post | block-web | deny  | from=trust to=untrust app=web-browsing",
      "local   | allow-web | allow | from=trust to=untrust app=web-browsing",
    ].join("\n"),
    traffic: TRUST_TO_UNTRUST,
    expect: { decisionRule: "allow-web", action: "allow" },
  },
  {
    name: "device group post-rule beats a shared post-rule",
    claim: "Claim 1: dg-post evaluates before shared-post",
    rules: [
      "shared-post | deny-all  | deny  | from=any to=any",
      "dg-post     | allow-web | allow | from=trust to=untrust app=web-browsing",
    ].join("\n"),
    traffic: TRUST_TO_UNTRUST,
    expect: { decisionRule: "allow-web", action: "allow" },
  },
  {
    name: "first match within a layer wins",
    claim: "Claim 3: evaluation stops at the first match",
    rules: [
      "local | first  | deny  | from=trust to=untrust app=web-browsing",
      "local | second | allow | from=trust to=untrust app=web-browsing",
    ].join("\n"),
    traffic: TRUST_TO_UNTRUST,
    expect: { decisionRule: "first", action: "deny" },
  },
  {
    name: "no match between zones falls to interzone-default deny",
    claim: "Claim 4: interzone-default denies",
    rules: "local | ssh-only | allow | from=trust to=untrust app=ssh",
    traffic: TRUST_TO_UNTRUST,
    expect: { decisionRule: "interzone-default", action: "deny", byDefault: true },
  },
  {
    name: "no match within one zone falls to intrazone-default ALLOW",
    claim: "Claim 4: the defaults are asymmetric",
    rules: "local | ssh-only | allow | from=trust to=untrust app=ssh",
    traffic: { ...TRUST_TO_UNTRUST, toZone: "trust", destination: "10.0.0.9" },
    expect: { decisionRule: "intrazone-default", action: "allow", byDefault: true },
  },
  {
    name: "a broad rule above a specific one shadows it",
    claim: "Claim 5: shadowing",
    rules: [
      "local | allow-any-web | allow | from=trust to=untrust app=any",
      "local | block-tor     | deny  | from=trust to=untrust app=tor",
    ].join("\n"),
    expect: { shadowedCount: 1, firstShadowedName: "block-tor", crossesLayer: false },
  },
  {
    name: "shadowing across layers is flagged as crossing",
    claim: "Claim 5 combined with claim 1: the hard case in a Panorama estate",
    rules: [
      "shared-pre | permit-everything | allow | from=any to=any",
      "local      | careful-rule      | deny  | from=trust to=untrust app=tor",
    ].join("\n"),
    expect: { shadowedCount: 1, firstShadowedName: "careful-rule", crossesLayer: true },
  },
  {
    name: "a specific rule above a broad one is NOT shadowed",
    claim: "Claim 5 inverted: correct ordering produces no finding",
    rules: [
      "local | block-tor     | deny  | from=trust to=untrust app=tor",
      "local | allow-any-web | allow | from=trust to=untrust app=any",
    ].join("\n"),
    expect: { shadowedCount: 0 },
  },
];

export const PANOS_REJECT_VECTORS: readonly {
  input: string;
  code: PanosErrorCode;
  why: string;
}[] = [
  { input: "", code: "empty", why: "no rules" },
  { input: "local | only-two-parts", code: "bad-rule", why: "missing action" },
  {
    input: "nonsense | r | allow | from=any",
    code: "bad-layer",
    why: "layer is not one of the five",
  },
  {
    input: "local | r | permit | from=any",
    code: "bad-action",
    why: "PAN-OS has no 'permit' action; that is another vendor's word",
  },
];

export function verifyVectors(): { passed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;

  for (const v of PANOS_GOLDEN_VECTORS) {
    try {
      const r = run({ rules: v.rules, traffic: v.traffic });
      let ok = true;
      const fail = (msg: string) => {
        failures.push(`${v.name}: ${msg}  [${v.claim}]`);
        ok = false;
      };
      if (v.expect.decisionRule !== undefined && r.decision?.ruleName !== v.expect.decisionRule) {
        fail(`decided "${r.decision?.ruleName}", expected "${v.expect.decisionRule}"`);
      }
      if (v.expect.action !== undefined && r.decision?.action !== v.expect.action) {
        fail(`action "${r.decision?.action}", expected "${v.expect.action}"`);
      }
      if (v.expect.byDefault !== undefined && r.decision?.byDefault !== v.expect.byDefault) {
        fail(`byDefault ${r.decision?.byDefault}, expected ${v.expect.byDefault}`);
      }
      if (v.expect.shadowedCount !== undefined && r.shadowed.length !== v.expect.shadowedCount) {
        fail(`${r.shadowed.length} shadow finding(s), expected ${v.expect.shadowedCount}`);
      }
      if (
        v.expect.firstShadowedName !== undefined &&
        r.shadowed[0]?.shadowedName !== v.expect.firstShadowedName
      ) {
        fail(`shadowed "${r.shadowed[0]?.shadowedName}", expected "${v.expect.firstShadowedName}"`);
      }
      if (
        v.expect.crossesLayer !== undefined &&
        r.shadowed[0]?.crossesLayer !== v.expect.crossesLayer
      ) {
        fail(`crossesLayer ${r.shadowed[0]?.crossesLayer}, expected ${v.expect.crossesLayer}`);
      }
      if (ok) passed++;
    } catch (e) {
      failures.push(`${v.name}: threw ${(e as Error).message}`);
    }
  }

  for (const v of PANOS_REJECT_VECTORS) {
    try {
      run({ rules: v.input });
      failures.push(`"${v.input}" was ACCEPTED but must be refused (${v.why})`);
    } catch (e) {
      if (e instanceof PanosPolicyError && e.code === v.code) passed++;
      else
        failures.push(
          `"${v.input}" refused with ${(e as PanosPolicyError).code ?? "?"}, expected ${v.code}`
        );
    }
  }

  return { passed, failures };
}
