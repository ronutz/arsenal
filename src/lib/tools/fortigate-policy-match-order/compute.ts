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
//
// PAGE LANGUAGE (02/11/2026): every reason, finding, note, warning and error is
// built as an EngineText (src/lib/tools/engine-text.ts): a stable id, the
// English as before, and its values. analysePoliciesLocalisable() returns them
// as such for the page (pack keys tools.fortigate-policy-match-order.engine.<id>);
// analysePolicies() and run() return plainText() of the same reading, so the
// API, the share spec and the golden vectors are unchanged.
// ============================================================================

import { say, plainText, withEngineText, type EngineText } from "../engine-text"; // sentences with ids (02/11/2026)

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

/** S is string in the API's reading and EngineText in the page's (analysePoliciesLocalisable). */
export interface MatchStep<S = string> {
  position: number;
  policyId: string;
  matched: boolean;
  /** Why it matched, or the first field that ruled it out. */
  reason: S; // a sentence
}

/** S is string in the API's reading and EngineText in the page's. */
export interface ShadowFinding<S = string> {
  /** The policy that can never be reached. */
  policyId: string;
  position: number;
  /** The earlier policy that covers it. */
  shadowedBy: string;
  why: S; // a sentence
}

/** S is string in the API's reading and EngineText in the page's. */
export interface PolicyAnalysis<S = string> {
  steps: MatchStep<S>[]; // each policy reached
  /** The winning policy, or undefined when the packet falls to implicit deny. */
  winner?: Policy;
  implicitDeny: boolean;
  shadowed: ShadowFinding<S>[]; // each unreachable policy
  notes: S[]; // each a sentence
  warnings: S[]; // each a sentence
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
  return plainText(analysePoliciesLocalisable(policies, packet)); // the same reading, as English (the API's and the vectors')
} // analysePolicies

/** The page's reading: the same as analysePolicies(), with every sentence an EngineText (id, English, values). */
export function analysePoliciesLocalisable(policies: Policy[], packet?: Packet): PolicyAnalysis<EngineText> {
  if (!policies || policies.length === 0) {
    const m = say("err.noPolicies", "Give at least one policy. The list is the thing being reasoned about."); // nothing to reason about
    throw withEngineText(new PolicyInputError(m.text), m); // the same class and message, plus the sentence
  }
  const steps: MatchStep<EngineText>[] = []; // each step, its reason with an id
  const notes: EngineText[] = []; // each note with its id
  const warnings: EngineText[] = []; // each warning with its id
  let winner: Policy | undefined;

  // --- the packet walk ------------------------------------------------------
  if (packet) {
    for (let i = 0; i < policies.length; i++) {
      const p = policies[i];
      if (p.disabled) {
        steps.push({ position: i + 1, policyId: p.id, matched: false, reason: say("step.disabled", "Disabled, so it is skipped entirely - it is not a deny, it is absent.") }); // skipped
        continue;
      }
      const checks: [EngineText, boolean, string, string][] = [ // the field's name, whether it covers, the policy's value, the packet's
        [say("field.srcintf", "incoming interface"), covers(p.srcintf, packet.srcintf), p.srcintf, packet.srcintf], // incoming interface
        [say("field.dstintf", "outgoing interface"), covers(p.dstintf, packet.dstintf), p.dstintf, packet.dstintf], // outgoing interface
        [say("field.srcaddr", "source address"), covers(p.srcaddr, packet.src), p.srcaddr, packet.src], // source address
        [say("field.dstaddr", "destination address"), covers(p.dstaddr, packet.dst), p.dstaddr, packet.dst], // destination address
        [say("field.service", "service"), covers(p.service, packet.service), p.service, packet.service], // service
      ];
      const failed = checks.find(([, ok]) => !ok);
      if (failed) {
        const [field, , policyValue, packetValue] = failed; // the first field that does not cover the packet
        steps.push({
          position: i + 1,
          policyId: p.id,
          matched: false,
          reason: say("step.noMatch", `No match: the ${field} is "${policyValue}" and the packet has "${packetValue}".`, { field, policyValue, packetValue }), // no match
        });
        continue;
      }
      steps.push({
        position: i + 1,
        policyId: p.id,
        matched: true,
        reason: say("step.match", `MATCH. Every field covers the packet, so this policy decides the outcome and evaluation stops here - nothing below is consulted.`), // the match
      });
      winner = p;
      break;
    }
  }

  // --- shadow analysis: which policies can never be reached ----------------
  const shadowed: ShadowFinding<EngineText>[] = []; // each unreachable policy, with its reason
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
          why: say("shadow.why", `Policy ${earlier.id} at position ${j + 1} covers every field this one matches, and sits above it. Nothing can reach policy ${later.id}: any packet it would match is decided earlier.`, { earlier: earlier.id, position: String(j + 1), later: later.id }), // shadowed
        });
        break;
      }
    }
  }

  // --- the VIP rule --------------------------------------------------------
  const vipPolicies = policies.filter((p) => p.vip && !p.disabled);
  if (vipPolicies.length > 0) {
    const denyAbove = policies.filter((p) => p.action === "deny" && p.matchVip && !p.disabled);
    notes.push(say("note.vip", // VIP policies
      "A policy with a virtual IP applied is matched differently from an ordinary policy and takes priority over one. Ordering alone does not block a source from reaching a VIP.",
    ));
    if (denyAbove.length === 0) {
      warnings.push(say("warn.noMatchVip", // no deny with match-vip
        "There is a policy with a VIP and no deny policy carrying match-vip. To stop a specific source reaching that VIP, the deny policy needs match-vip enabled and must sit above it. New deny policies have match-vip on by default; an accept policy cannot have it at all.",
      ));
    }
  }
  for (const p of policies) {
    if (p.action === "accept" && p.matchVip) {
      warnings.push(say("warn.acceptMatchVip", `Policy ${p.id} is an accept policy with match-vip set. FortiOS does not permit that combination - match-vip applies to deny policies only.`, { id: p.id })); // an impossible combination
    }
  }

  // --- the standing points -------------------------------------------------
  notes.push(say("note.idNotPosition", // the ID is not the position
    "The policy ID is an identifier, not a position. Policy 3 can sit below policy 47, and renumbering changes nothing about evaluation order. The order of the rows is what matters, which is what the GUI's By Sequence view shows.",
  ));
  notes.push(say("note.direction", // each direction
    "Each direction needs its own policy. Traffic being permitted from A to B says nothing about B to A - Fortinet documents this plainly and it still catches people, because most communication is two-way and the policy list is not.",
  ));
  const implicitDeny = !!packet && !winner;
  if (implicitDeny) {
    notes.push(say("note.implicitDeny", // the implicit deny
      "Nothing matched, so the packet reaches the implicit deny: incoming any, source any, outgoing any, destination any, action deny. Its only editable setting is whether violations are logged - and turning that on is usually the fastest way to see what is actually arriving.",
    ));
  }
  if (policies.some((p) => isAny(p.srcintf) || isAny(p.dstintf))) {
    notes.push(say("note.pairView", // the Interface Pair View
      "A policy using any as an interface, or several interfaces at once, breaks the Interface Pair View - the GUI switches itself to By Sequence, because the policies can no longer be grouped by a single pair.",
    ));
  }

  return { steps, winner, implicitDeny, shadowed, notes, warnings };
}

/** Uniform entry point, matching the other tools in this repository. */
export function run(input: { policies: Policy[]; packet?: Packet }): PolicyAnalysis {
  return analysePolicies(input.policies, input.packet);
}
