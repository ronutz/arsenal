// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/checkpoint-nat-proxy-arp/compute.ts
// ----------------------------------------------------------------------------
// THE CHECK POINT NAT BLACK-HOLE PREDICTOR.
//
// Answers one question that costs people an afternoon roughly once per career:
// the NAT is configured, the policy installed cleanly, the server is healthy,
// and nothing arrives. Why.
//
// The usual answer is Layer 2. If the translated address sits inside a subnet
// the gateway is directly connected to, then some device is going to ARP for
// it, and unless the gateway answers that ARP the traffic never reaches the
// firewall at all - so no amount of reading the NAT rule base will explain it.
//
// THE RULE, which is what this computes:
//   * AUTOMATIC NAT adds the proxy ARP itself at policy install, provided
//     "Automatic ARP configuration" is on in Global Properties.
//   * MANUAL NAT DOES NOT. It never has. The administrator adds the entry.
//   * Neither matters if the translated address is NOT in a connected subnet -
//     in that case something upstream must ROUTE it to the gateway, and proxy
//     ARP is the wrong thing to be looking at.
//
// *** WHAT THIS TOOL DELIBERATELY DOES NOT DO ***
// It does not rank the NAT rule base. Published sources contradict each other
// on whether manual rules are evaluated before or after the automatic ones -
// one vendor-adjacent guide states manual first, another states automatic
// tiers first, and Check Point's own administration guide describes the two
// kinds being "enforced differently" without settling the order.
//
// Building an evaluator would mean picking a side and presenting a guess as a
// computation. The proxy-ARP behaviour, by contrast, is stated consistently
// everywhere and is what actually black-holes traffic. So that is what this
// answers, and the ordering question is described in the docs as open rather
// than silently resolved.
// ============================================================================

export type NatMethod = "automatic" | "manual";
export type NatType = "static" | "hide";

export interface NatScenario {
  method: NatMethod;
  type: NatType;
  /** The translated (public-facing) address. */
  natIp: string;
  /** The gateway interface that faces the source of the traffic. */
  gatewayIp: string;
  /** Prefix length of that interface's subnet. */
  gatewayPrefix: number;
  /** Global Properties: "Automatic ARP configuration". Default on. */
  automaticArpConfiguration: boolean;
}

export interface NatVerdict {
  /** Will traffic to natIp reach the gateway at layer 2? */
  willArrive: boolean;
  /** Is an ARP answer needed at all for this address? */
  proxyArpRequired: boolean;
  /** Will Check Point provide it without being asked? */
  proxyArpAutomatic: boolean;
  /** Ordered reasoning. */
  steps: { check: string; result: string }[];
  /** What to do, when something must be done. */
  remedy: string | null;
  findings: string[];
  scenario: NatScenario;
  /** The connected-subnet arithmetic, shown. */
  workings: { network: string; broadcast: string; sameSubnet: boolean };
}

export class NatParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NatParseError";
  }
}

/** Parse dotted-quad IPv4 to a 32-bit unsigned value. */
function toInt(ip: string): number {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) throw new NatParseError(`"${ip.trim()}" is not an IPv4 address.`);
  let v = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) throw new NatParseError(`"${ip.trim()}" is not an IPv4 address.`);
    const n = Number(p);
    if (n > 255) throw new NatParseError(`"${ip.trim()}" has an octet above 255.`);
    v = (v << 8) | n;
  }
  return v >>> 0;
}

const toIp = (v: number): string =>
  [(v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff].join(".");

/** Decide whether the translated address will ever reach the gateway. */
export function evaluateNat(scenario: NatScenario): NatVerdict {
  const { method, type, natIp, gatewayIp, gatewayPrefix, automaticArpConfiguration } = scenario;

  if (!Number.isInteger(gatewayPrefix) || gatewayPrefix < 0 || gatewayPrefix > 32) {
    throw new NatParseError(`A prefix length must be between 0 and 32; got ${gatewayPrefix}.`);
  }
  const nat = toInt(natIp);
  const gw = toInt(gatewayIp);
  const mask = gatewayPrefix === 0 ? 0 : (0xffffffff << (32 - gatewayPrefix)) >>> 0;
  const network = (gw & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const sameSubnet = ((nat & mask) >>> 0) === network;

  const steps: NatVerdict["steps"] = [];
  const findings: string[] = [];

  steps.push({
    check: "Is the translated address inside a subnet the gateway is connected to?",
    result: sameSubnet
      ? `Yes. ${natIp} falls inside ${toIp(network)}/${gatewayPrefix}, which is the interface at ${gatewayIp}. Something on that segment will ARP for it.`
      : `No. ${natIp} is outside ${toIp(network)}/${gatewayPrefix}. Nobody on this segment will ARP for it, so proxy ARP is not the question - an upstream device has to ROUTE it to the gateway.`,
  });

  // Hide NAT translates the SOURCE, so nothing is published to be reached.
  if (type === "hide") {
    steps.push({
      check: "Does this NAT publish an address for inbound traffic?",
      result:
        "No. Hide NAT translates the source of outbound connections. There is no inbound service to reach, so nothing needs to answer ARP on its behalf.",
    });
    findings.push(
      "If inbound connections were the goal, hide NAT is the wrong type: it is one-way by design. Static NAT is what publishes a host.",
    );
    return {
      willArrive: true,
      proxyArpRequired: false,
      proxyArpAutomatic: false,
      steps,
      remedy: null,
      findings,
      scenario,
      workings: { network: toIp(network), broadcast: toIp(broadcast), sameSubnet },
    };
  }

  if (!sameSubnet) {
    findings.push(
      "Check that the upstream router actually has a route for this address pointing at the gateway. A translated address outside every connected subnet reaches the firewall only because someone routed it there.",
    );
    return {
      willArrive: true,
      proxyArpRequired: false,
      proxyArpAutomatic: false,
      steps,
      remedy: null,
      findings,
      scenario,
      workings: { network: toIp(network), broadcast: toIp(broadcast), sameSubnet },
    };
  }

  // Same subnet + static NAT: an ARP answer is required. Who provides it?
  const automatic = method === "automatic" && automaticArpConfiguration;
  steps.push({
    check: "Who answers that ARP?",
    result:
      method === "automatic"
        ? automaticArpConfiguration
          ? "Automatic NAT adds the proxy ARP entry itself at policy install, because Automatic ARP configuration is enabled in Global Properties."
          : "This is automatic NAT, but Automatic ARP configuration is switched OFF in Global Properties - so nothing is created, and the entry has to be added by hand exactly as if the rule were manual."
        : "Nobody. MANUAL NAT DOES NOT CREATE PROXY ARP ENTRIES. This is the single most common reason a correct-looking manual NAT rule black-holes traffic.",
  });

  if (!automatic) {
    findings.push(
      "The policy will install cleanly and the rule base will look right. The failure is one layer below: the upstream router ARPs for the address, gets no answer, and the packet is never sent. A capture on the outside interface shows ARP requests with no reply - and no traffic at all in the firewall logs, because nothing ever arrived to be logged.",
    );
    if (method === "manual") {
      findings.push(
        "Check Global Properties has 'Merge manual proxy ARP configuration' enabled, or the automatic entries and your manual ones will not coexist.",
      );
    }
  }

  return {
    willArrive: automatic,
    proxyArpRequired: true,
    proxyArpAutomatic: automatic,
    steps,
    remedy: automatic
      ? null
      : `Add a proxy ARP entry for ${natIp} on the gateway, mapping it to the MAC of the interface at ${gatewayIp}, then reinstall policy. On Gaia this is the local.arp file under $FWDIR/conf, or the equivalent in the Gaia configuration.`,
    findings,
    scenario,
    workings: { network: toIp(network), broadcast: toIp(broadcast), sameSubnet },
  };
}
