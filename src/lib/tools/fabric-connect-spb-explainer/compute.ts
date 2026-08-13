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
// ============================================================================

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

export interface SpbFact {
  label: string;
  value: string;
  explain: string;
}

export interface SpbResult {
  facts: SpbFact[];
  notes: string[];
  warnings: string[];
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
  const facts: SpbFact[] = [];
  const notes: string[] = [];
  const warnings: string[] = [];

  const primary = input.primaryBvlan ?? 4051;
  const secondary = input.secondaryBvlan ?? 4052;

  if (input.isid === undefined && !input.nickname && !input.role) {
    throw new SpbInputError("Give at least an I-SID, a nickname or a role to explain.");
  }

  // --- the I-SID ------------------------------------------------------------
  if (input.isid !== undefined) {
    const isid = Math.floor(input.isid);
    if (!Number.isFinite(isid) || isid < ISID_MIN || isid > ISID_MAX) {
      throw new SpbInputError(
        `An I-SID is a 24-bit value: ${ISID_MIN} to ${ISID_MAX}. "${input.isid}" is outside that range.`,
      );
    }

    facts.push({
      label: "I-SID",
      value: String(isid),
      explain:
        "The service identifier, carried in the 802.1ah backbone header. Twenty-four bits, so roughly sixteen million services against a VLAN tag's four thousand - which is the reason a fabric can give every service its own identifier rather than rationing them.",
    });

    // The parity rule: with two B-VLANs configured, I-SIDs are distributed
    // between them by the low bit, so the two shortest-path trees share the
    // load. This is the default behaviour and is worth stating as such.
    const carriedBy = isid % 2 === 0 ? secondary : primary;
    facts.push({
      label: "Carried on B-VLAN",
      value: String(carriedBy),
      explain:
        `Even I-SIDs are carried on one backbone VLAN and odd ones on the other, so the two shortest-path trees each carry roughly half the services. ${isid} is ${isid % 2 === 0 ? "even" : "odd"}, so it rides ${carriedBy}. This is the default distribution rather than a rule of the standard - a deployment can assign differently, and checking which tree a service is actually on is the first step when one service behaves differently from its neighbours.`,
    });

    const service = input.service ?? "unknown";
    const serviceExplain: Record<string, string> = {
      l2vsn:
        "A Layer 2 Virtual Services Network: this I-SID is associated with an edge VLAN. Two sites configure the same I-SID against their local VLAN and they are in the same broadcast domain, with nothing configured in between.",
      l3vsn:
        "A Layer 3 Virtual Services Network: this I-SID is associated with a VRF rather than a VLAN. It carries routed traffic for one routing instance across the fabric - the equivalent of an IP VPN, provisioned at the edge only.",
      multicast:
        "Multicast over SPB uses source-specific trees built by IS-IS. Enable it globally and turn on IGMP at the edge; there is no PIM, no rendezvous point and no multicast routing protocol to design.",
      unknown:
        "The service type was not given. An I-SID bound to a VLAN is a Layer 2 service; bound to a VRF it is a Layer 3 service. The number alone does not say which.",
    };
    facts.push({ label: "Service type", value: service, explain: serviceExplain[service] });

    if (isid < 4096) {
      notes.push(
        "Low I-SID values are legal but confusing in practice: a number that looks like a VLAN ID invites the assumption that it is one. Many deployments start their I-SIDs above 10000 deliberately, and several encode the VLAN into the I-SID - 20010 for VLAN 10, for instance - so the mapping is readable at a glance.",
      );
    }
  }

  // --- the B-VLANs ----------------------------------------------------------
  facts.push({
    label: "Backbone VLANs",
    value: `${primary} / ${secondary}`,
    explain:
      "The transport instance. A B-VLAN is NOT a VLAN in the usual sense: it does not flood unknown, broadcast or multicast traffic. It forwards only on B-MAC tables that IS-IS has provisioned from shortest-path trees, so there is no spanning tree and no blocked link.",
  });

  // --- the nickname ---------------------------------------------------------
  if (input.nickname) {
    const nk = input.nickname.trim();
    if (!/^[0-9a-fA-F]\.[0-9a-fA-F]{2}\.[0-9a-fA-F]{2}$/.test(nk)) {
      warnings.push(
        `"${nk}" is not in the x.xx.xx nickname form. A nickname is twenty bits written as three dotted groups, and it must be unique in the fabric - a duplicate is one of the few configuration errors here that breaks things far from where it was typed.`,
      );
    } else {
      facts.push({
        label: "SPB nickname",
        value: nk,
        explain:
          "A short unique identifier for this node, used in multicast addressing so that a tree can be named without carrying a full system identifier. Unique across the fabric, and unrelated to the IS-IS system id, which is separate and also unique.",
      });
    }
  }

  // --- the role -------------------------------------------------------------
  if (input.role) {
    facts.push({
      label: "Role",
      value: input.role === "beb" ? "Backbone Edge Bridge (BEB)" : "Backbone Core Bridge (BCB)",
      explain:
        input.role === "beb"
          ? "Services are provisioned here. A BEB is where a customer VLAN or VRF meets an I-SID, and where MAC-in-MAC encapsulation is added and removed."
          : "Nothing service-specific is configured here. A BCB forwards on B-MAC alone and never sees a customer MAC address. Adding a service to the fabric does not touch it at all - which is the operational claim SPB is actually making.",
    });
  }

  // --- the standing points --------------------------------------------------
  notes.push(
    "Provisioning happens at the edge only. Adding a service means configuring the two or more BEBs where it appears; every core bridge between them is untouched, because they forward on backbone MACs and know nothing about the service.",
  );
  notes.push(
    "The customer MAC is hidden. 802.1ah MAC-in-MAC encapsulation means core bridges learn backbone MACs only, so the core's forwarding table is sized by the number of fabric nodes rather than by the number of end stations.",
  );
  notes.push(
    "IS-IS here is a link-state protocol carrying Ethernet reachability rather than IP routes. It is the same protocol family used for IP routing, doing a different job, and 802.1aq currently defines only Level 1.",
  );

  if (primary === secondary) {
    warnings.push("The two backbone VLANs are the same value. The pair exists so that services can be distributed across two shortest-path trees; with one, there is nothing to distribute across.");
  }

  return { facts, notes, warnings };
}

/** Uniform entry point, matching the other tools in this repository. */
export function run(input: SpbInput): SpbResult {
  return explainSpb(input);
}
