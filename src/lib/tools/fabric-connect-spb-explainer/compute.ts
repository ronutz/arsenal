// ============================================================================
// src/lib/tools/fabric-connect-spb-explainer/compute.ts
// ----------------------------------------------------------------------------
// FABRIC CONNECT / SPB EXPLAINER - the pure engine.
//
// WHY THIS TOOL EXISTS. Shortest Path Bridging is Extreme's signature
// technology and one of the least-tooled subjects in networking. A learner
// meets I-SID, B-VLAN, B-MAC, BEB, BCB, L2VSN and L3VSN in the same paragraph
// and has no way to sort which is a service, which is transport, and which is a
// role a switch plays.
//
// The vocabulary is the difficulty. Once the words are sorted the technology is
// simpler than what it replaces, which is the argument SPB has always made and
// rarely gets to demonstrate.
//
// THE ONE FACT THAT REORIENTS PEOPLE:
//
//   A B-VLAN is not a VLAN. It does not flood unknown, broadcast or multicast
//   traffic. It forwards only on B-MAC tables that IS-IS has provisioned from
//   shortest-path trees. There is no spanning tree, and nothing is blocked.
//
// Everything else follows from that. Sources: IEEE 802.1aq, RFC 6329, and
// Extreme's own Fabric Connect configuration guides.
//
// SCOPE. This explains identifiers and structure. It contacts no device, reads
// no configuration file, and computes no topology - it cannot know your
// fabric, only what your numbers mean inside one.
//
// PAGE LANGUAGE (02/11/2026): every fact label and explanation, note, warning
// and error is built as an EngineText (src/lib/tools/engine-text.ts): a stable
// id, the English as before, and its values. explainSpbLocalisable() returns
// them as such for the page (pack keys tools.fabric-connect-spb-explainer.engine.<id>);
// explainSpb() and run() return plainText() of the same reading, so the API,
// the share spec and the golden vectors are unchanged.
// ============================================================================

import { say, plainText, withEngineText, type EngineText } from "../engine-text"; // sentences with ids (02/11/2026)

/** What the operator is asking about. */
export interface SpbInput {
  /** The 24-bit service identifier. */
  isid?: number;
  /** Which kind of service this I-SID carries. */
  service?: "l2vsn" | "l3vsn" | "multicast" | "unknown";
  /** The configured backbone VLAN pair. Defaults to Extreme's 4051/4052. */
  primaryBvlan?: number;
  secondaryBvlan?: number;
  /** SPB nickname in x.xx.xx form. */
  nickname?: string;
  /** The role this switch plays. */
  role?: "beb" | "bcb";
}

/** S is string in the API's reading and EngineText in the page's (explainSpbLocalisable). */
export interface SpbFact<S = string> {
  label: S; // the fact's label
  value: string;
  explain: S; // a sentence
}
/** S is string in the API's reading and EngineText in the page's. */
export interface SpbResult<S = string> {
  facts: SpbFact<S>[]; // each fact
  notes: S[]; // each a sentence
  warnings: S[]; // each a sentence
}

export class SpbInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SpbInputError";
  }
}

/** The I-SID range defined by 802.1ah: 24 bits, with low values reserved. */
const ISID_MIN = 1;
const ISID_MAX = 16777215;

/** Explain a Fabric Connect / SPB configuration fragment. */
export function explainSpb(input: SpbInput): SpbResult {
  return plainText(explainSpbLocalisable(input)); // the same reading, as English (the API's and the vectors')
} // explainSpb

/**
 * An input error that carries its sentence, so the page can show it in its own language.
 * @param m the sentence
 * @returns the error to throw (class and message as before)
 */
function inputError(m: EngineText): SpbInputError {
  return withEngineText(new SpbInputError(m.text), m); // the same class and message, plus the sentence
} // inputError

/** The page's reading: the same as explainSpb(), with every sentence an EngineText (id, English, values). */
export function explainSpbLocalisable(input: SpbInput): SpbResult<EngineText> {
  const facts: SpbFact<EngineText>[] = []; // each fact, sentences with ids
  const notes: EngineText[] = []; // each note with its id
  const warnings: EngineText[] = []; // each warning with its id

  const primary = input.primaryBvlan ?? 4051;
  const secondary = input.secondaryBvlan ?? 4052;

  if (input.isid === undefined && !input.nickname && !input.role) {
    throw inputError(say("err.nothing", "Give at least an I-SID, a nickname or a role to explain.")); // nothing to explain
  }

  // --- the I-SID ------------------------------------------------------------
  if (input.isid !== undefined) {
    const isid = Math.floor(input.isid);
    if (!Number.isFinite(isid) || isid < ISID_MIN || isid > ISID_MAX) {
      throw inputError(say("err.range", // out of range
        `An I-SID is a 24-bit value: ${ISID_MIN} to ${ISID_MAX}. "${input.isid}" is outside that range.`, { min: String(ISID_MIN), max: String(ISID_MAX), isid: String(input.isid) },
      ));
    }

    facts.push({
      label: say("label.isid", "I-SID"), // the label
      value: String(isid),
      explain:
        say("fact.isid", "The service identifier, carried in the 802.1ah backbone header. Twenty-four bits, so roughly sixteen million services against a VLAN tag's four thousand - which is the reason a fabric can give every service its own identifier rather than rationing them."), // what an I-SID is
    });

    // The parity rule: with two B-VLANs configured, I-SIDs are distributed
    // between them by the low bit, so the two shortest-path trees share the
    // load. This is the default behaviour and is worth stating as such.
    const carriedBy = isid % 2 === 0 ? secondary : primary;
    facts.push({
      label: say("label.bvlan", "Carried on B-VLAN"), // the label
      value: String(carriedBy),
      explain: isid % 2 === 0 // even or odd
        ? say("fact.bvlanEven", `Even I-SIDs are carried on one backbone VLAN and odd ones on the other, so the two shortest-path trees each carry roughly half the services. ${isid} is even, so it rides ${carriedBy}. This is the default distribution rather than a rule of the standard - a deployment can assign differently, and checking which tree a service is actually on is the first step when one service behaves differently from its neighbours.`, { isid: String(isid), carriedBy: String(carriedBy) }) // even
        : say("fact.bvlanOdd", `Even I-SIDs are carried on one backbone VLAN and odd ones on the other, so the two shortest-path trees each carry roughly half the services. ${isid} is odd, so it rides ${carriedBy}. This is the default distribution rather than a rule of the standard - a deployment can assign differently, and checking which tree a service is actually on is the first step when one service behaves differently from its neighbours.`, { isid: String(isid), carriedBy: String(carriedBy) }), // odd
    });

    const service = input.service ?? "unknown";
    const serviceExplain: Record<string, EngineText> = {
      l2vsn:
        say("service.l2vsn", "A Layer 2 Virtual Services Network: this I-SID is associated with an edge VLAN. Two sites configure the same I-SID against their local VLAN and they are in the same broadcast domain, with nothing configured in between."), // L2 VSN
      l3vsn:
        say("service.l3vsn", "A Layer 3 Virtual Services Network: this I-SID is associated with a VRF rather than a VLAN. It carries routed traffic for one routing instance across the fabric - the equivalent of an IP VPN, provisioned at the edge only."), // L3 VSN
      multicast:
        say("service.multicast", "Multicast over SPB uses source-specific trees built by IS-IS. Enable it globally and turn on IGMP at the edge; there is no PIM, no rendezvous point and no multicast routing protocol to design."), // multicast
      unknown:
        say("service.unknown", "The service type was not given. An I-SID bound to a VLAN is a Layer 2 service; bound to a VRF it is a Layer 3 service. The number alone does not say which."), // not given
    };
    facts.push({ label: say("label.service", "Service type"), value: service, explain: serviceExplain[service] }); // the service

    if (isid < 4096) {
      notes.push(say("note.lowIsid", // low I-SIDs
        "Low I-SID values are legal but confusing in practice: a number that looks like a VLAN ID invites the assumption that it is one. Many deployments start their I-SIDs above 10000 deliberately, and several encode the VLAN into the I-SID - 20010 for VLAN 10, for instance - so the mapping is readable at a glance.",
      ));
    }
  }

  // --- the B-VLANs ----------------------------------------------------------
  facts.push({
    label: say("label.bvlans", "Backbone VLANs"), // the label
    value: `${primary} / ${secondary}`,
    explain:
      say("fact.bvlans", "The transport instance. A B-VLAN is NOT a VLAN in the usual sense: it does not flood unknown, broadcast or multicast traffic. It forwards only on B-MAC tables that IS-IS has provisioned from shortest-path trees, so there is no spanning tree and no blocked link."), // what a B-VLAN is
  });

  // --- the nickname ---------------------------------------------------------
  if (input.nickname) {
    const nk = input.nickname.trim();
    if (!/^[0-9a-fA-F]\.[0-9a-fA-F]{2}\.[0-9a-fA-F]{2}$/.test(nk)) {
      warnings.push(say("warn.nickname", // a malformed nickname
        `"${nk}" is not in the x.xx.xx nickname form. A nickname is twenty bits written as three dotted groups, and it must be unique in the fabric - a duplicate is one of the few configuration errors here that breaks things far from where it was typed.`, { nk },
      ));
    } else {
      facts.push({
        label: say("label.nickname", "SPB nickname"), // the label
        value: nk,
        explain:
          say("fact.nickname", "A short unique identifier for this node, used in multicast addressing so that a tree can be named without carrying a full system identifier. Unique across the fabric, and unrelated to the IS-IS system id, which is separate and also unique."), // what a nickname is
      });
    }
  }

  // --- the role -------------------------------------------------------------
  if (input.role) {
    facts.push({
      label: say("label.role", "Role"), // the label
      value: input.role === "beb" ? "Backbone Edge Bridge (BEB)" : "Backbone Core Bridge (BCB)",
      explain:
        input.role === "beb"
          ? say("fact.beb", "Services are provisioned here. A BEB is where a customer VLAN or VRF meets an I-SID, and where MAC-in-MAC encapsulation is added and removed.") // BEB
          : say("fact.bcb", "Nothing service-specific is configured here. A BCB forwards on B-MAC alone and never sees a customer MAC address. Adding a service to the fabric does not touch it at all - which is the operational claim SPB is actually making."), // BCB
    });
  }

  // --- the standing points --------------------------------------------------
  notes.push(say("note.edgeOnly", // edge provisioning
    "Provisioning happens at the edge only. Adding a service means configuring the two or more BEBs where it appears; every core bridge between them is untouched, because they forward on backbone MACs and know nothing about the service.",
  ));
  notes.push(say("note.macHidden", // MAC-in-MAC
    "The customer MAC is hidden. 802.1ah MAC-in-MAC encapsulation means core bridges learn backbone MACs only, so the core's forwarding table is sized by the number of fabric nodes rather than by the number of end stations.",
  ));
  notes.push(say("note.isis", // IS-IS's job here
    "IS-IS here is a link-state protocol carrying Ethernet reachability rather than IP routes. It is the same protocol family used for IP routing, doing a different job, and 802.1aq currently defines only Level 1.",
  ));
  if (primary === secondary) {
    warnings.push(say("warn.sameBvlan", "The two backbone VLANs are the same value. The pair exists so that services can be distributed across two shortest-path trees; with one, there is nothing to distribute across.")); // one tree only
  }

  return { facts, notes, warnings };
}

/** Uniform entry point, matching the other tools in this repository. */
export function run(input: SpbInput): SpbResult {
  return explainSpb(input);
}
