// ============================================================================
// src/lib/tools/fortigate-policy-match-order/compute.ts
// ----------------------------------------------------------------------------
// FORTIGATE POLICY MATCH-ORDER EXPLAINER - the pure engine.
//
// THE QUESTION IT ANSWERS. "Why didn't my rule fire?" is the most common
// firewall question there is, and on a FortiGate it almost always has the same
// answer: something above it matched first. The list is evaluated top to
// bottom, the first match wins, and evaluation stops - so a policy that looks
// correct in isolation can be unreachable because of a broader one three rows
// up.
//
// This takes an ordered policy list and, optionally, a packet, and says which
// policy wins and which policies can never win at all.
//
// *** THE MISCONCEPTION IT EXISTS TO CORRECT ***
//
//   THE POLICY ID IS NOT THE EVALUATION ORDER. It is an identifier, assigned
//   when the policy was created and stable thereafter. Policy 3 can sit below
//   policy 47. Evaluation follows the SEQUENCE - the order of the rows - and
//   the GUI's "By Sequence" view exists precisely because the ID does not tell
//   you that.
//
// Plenty of otherwise-reasonable material online says FortiGate evaluates "in
// ascending order of sequence number" in a way that reads as though the ID were
// the position. It is not, and an engineer who believes it will reorder
// nothing while renumbering everything.
//
// TWO MORE THINGS THE DOCUMENTATION SAYS AND PEOPLE MISS, both encoded here:
//
//   - EACH DIRECTION NEEDS ITS OWN POLICY. Traffic from A to B being permitted
//     says nothing about B to A. Fortinet states this plainly and it still
//     surprises people every week.
//   - POLICIES WITH A VIP APPLIED ARE MATCHED DIFFERENTLY and take priority
//     over ordinary policies. To deny a source that would otherwise reach a
//     VIP, the deny policy must carry `match-vip` and sit above it. New deny
//     policies have match-vip enabled by default; an ACCEPT policy cannot have
//     it at all.
//
// SCOPE. This reasons about the list you give it. It does not read a device,
// does not know your address objects, and treats a named object as an opaque
// token unless it is `all`/`any`.
// ============================================================================

export interface Policy {
  /** The policy ID as configured. NOT the position. */
  id: string;
  name?: string;
  srcintf: string;
  dstintf: string;
  srcaddr: string;
  dstaddr: string;
  service: string;
  action: "accept" | "deny";
  /** A VIP applied to this policy changes how it is matched. */
  vip?: boolean;
  /** `match-vip` on a deny policy, which lets it beat a VIP policy below. */
  matchVip?: boolean;
  disabled?: boolean;
}

export interface Packet {
  srcintf: string;
  dstintf: string;
  src: string;
  dst: string;
  service: string;
}

export interface MatchStep {
  position: number;
  policyId: string;
  matched: boolean;
  /** Why it matched, or the first field that ruled it out. */
  reason: string;
}

export interface ShadowFinding {
  /** The policy that can never be reached. */
  policyId: string;
  position: number;
  /** The earlier policy that covers it. */
  shadowedBy: string;
  why: string;
}

export interface PolicyAnalysis {
  steps: MatchStep[];
  /** The winning policy, or undefined when the packet falls to implicit deny. */
  winner?: Policy;
  implicitDeny: boolean;
  shadowed: ShadowFinding[];
  notes: string[];
  warnings: string[];
}

export class PolicyInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PolicyInputError";
  }
}

const ANY = new Set(["any", "all", "*", ""]);
const isAny = (v: string) => ANY.has(v.trim().toLowerCase());

/** Does a policy field cover a packet value? */
function covers(field: string, value: string): boolean {
  if (isAny(field)) return true;
  const parts = field.split(/[\s,]+/).filter(Boolean).map((x) => x.toLowerCase());
  return parts.includes(value.trim().toLowerCase());
}

/** Does policy A's field cover everything policy B's field covers? */
function fieldSupersedes(a: string, b: string): boolean {
  if (isAny(a)) return true;
  if (isAny(b)) return false;
  const A = new Set(a.split(/[\s,]+/).filter(Boolean).map((x) => x.toLowerCase()));
  const B = b.split(/[\s,]+/).filter(Boolean).map((x) => x.toLowerCase());
  return B.every((x) => A.has(x));
}

/** Evaluate the list, and optionally a packet against it. */
export function analysePolicies(policies: Policy[], packet?: Packet): PolicyAnalysis {
  if (!policies || policies.length === 0) {
    throw new PolicyInputError("Give at least one policy. The list is the thing being reasoned about.");
  }

  const steps: MatchStep[] = [];
  const notes: string[] = [];
  const warnings: string[] = [];
  let winner: Policy | undefined;

  // --- the packet walk ------------------------------------------------------
  if (packet) {
    for (let i = 0; i < policies.length; i++) {
      const p = policies[i];
      if (p.disabled) {
        steps.push({ position: i + 1, policyId: p.id, matched: false, reason: "Disabled, so it is skipped entirely - it is not a deny, it is absent." });
        continue;
      }
      const checks: [string, boolean, string][] = [
        ["incoming interface", covers(p.srcintf, packet.srcintf), p.srcintf],
        ["outgoing interface", covers(p.dstintf, packet.dstintf), p.dstintf],
        ["source address", covers(p.srcaddr, packet.src), p.srcaddr],
        ["destination address", covers(p.dstaddr, packet.dst), p.dstaddr],
        ["service", covers(p.service, packet.service), p.service],
      ];
      const failed = checks.find(([, ok]) => !ok);
      if (failed) {
        steps.push({
          position: i + 1,
          policyId: p.id,
          matched: false,
          reason: `No match: the ${failed[0]} is "${failed[2]}" and the packet has "${
            failed[0].includes("incoming") ? packet.srcintf
            : failed[0].includes("outgoing") ? packet.dstintf
            : failed[0].includes("source") ? packet.src
            : failed[0].includes("destination") ? packet.dst
            : packet.service
          }".`,
        });
        continue;
      }
      steps.push({
        position: i + 1,
        policyId: p.id,
        matched: true,
        reason: `MATCH. Every field covers the packet, so this policy decides the outcome and evaluation stops here - nothing below is consulted.`,
      });
      winner = p;
      break;
    }
  }

  // --- shadow analysis: which policies can never be reached ----------------
  const shadowed: ShadowFinding[] = [];
  for (let i = 0; i < policies.length; i++) {
    const later = policies[i];
    if (later.disabled) continue;
    for (let j = 0; j < i; j++) {
      const earlier = policies[j];
      if (earlier.disabled) continue;
      const all =
        fieldSupersedes(earlier.srcintf, later.srcintf) &&
        fieldSupersedes(earlier.dstintf, later.dstintf) &&
        fieldSupersedes(earlier.srcaddr, later.srcaddr) &&
        fieldSupersedes(earlier.dstaddr, later.dstaddr) &&
        fieldSupersedes(earlier.service, later.service);
      if (all) {
        shadowed.push({
          policyId: later.id,
          position: i + 1,
          shadowedBy: earlier.id,
          why: `Policy ${earlier.id} at position ${j + 1} covers every field this one matches, and sits above it. Nothing can reach policy ${later.id}: any packet it would match is decided earlier.`,
        });
        break;
      }
    }
  }

  // --- the VIP rule --------------------------------------------------------
  const vipPolicies = policies.filter((p) => p.vip && !p.disabled);
  if (vipPolicies.length > 0) {
    const denyAbove = policies.filter((p) => p.action === "deny" && p.matchVip && !p.disabled);
    notes.push(
      "A policy with a virtual IP applied is matched differently from an ordinary policy and takes priority over one. Ordering alone does not block a source from reaching a VIP.",
    );
    if (denyAbove.length === 0) {
      warnings.push(
        "There is a policy with a VIP and no deny policy carrying match-vip. To stop a specific source reaching that VIP, the deny policy needs match-vip enabled and must sit above it. New deny policies have match-vip on by default; an accept policy cannot have it at all.",
      );
    }
  }
  for (const p of policies) {
    if (p.action === "accept" && p.matchVip) {
      warnings.push(`Policy ${p.id} is an accept policy with match-vip set. FortiOS does not permit that combination - match-vip applies to deny policies only.`);
    }
  }

  // --- the standing points -------------------------------------------------
  notes.push(
    "The policy ID is an identifier, not a position. Policy 3 can sit below policy 47, and renumbering changes nothing about evaluation order. The order of the rows is what matters, which is what the GUI's By Sequence view shows.",
  );
  notes.push(
    "Each direction needs its own policy. Traffic being permitted from A to B says nothing about B to A - Fortinet documents this plainly and it still catches people, because most communication is two-way and the policy list is not.",
  );
  const implicitDeny = !!packet && !winner;
  if (implicitDeny) {
    notes.push(
      "Nothing matched, so the packet reaches the implicit deny: incoming any, source any, outgoing any, destination any, action deny. Its only editable setting is whether violations are logged - and turning that on is usually the fastest way to see what is actually arriving.",
    );
  }
  if (policies.some((p) => isAny(p.srcintf) || isAny(p.dstintf))) {
    notes.push(
      "A policy using any as an interface, or several interfaces at once, breaks the Interface Pair View - the GUI switches itself to By Sequence, because the policies can no longer be grouped by a single pair.",
    );
  }

  return { steps, winner, implicitDeny, shadowed, notes, warnings };
}

/** Uniform entry point, matching the other tools in this repository. */
export function run(input: { policies: Policy[]; packet?: Packet }): PolicyAnalysis {
  return analysePolicies(input.policies, input.packet);
}
