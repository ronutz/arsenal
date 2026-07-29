// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// Vectors for the Check Point NAT black-hole predictor.
//
// They pin the one behaviour every source agrees on - automatic NAT creates
// the proxy ARP entry, manual NAT does not - plus the two cases that make the
// rule useful rather than trivial: automatic NAT that STILL fails because the
// global setting is off, and an address outside every connected subnet, where
// proxy ARP is the wrong thing to be looking at entirely.
// ============================================================================

import { evaluateNat, type NatScenario, type NatVerdict } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "checkpoint-nat-proxy-arp-golden-v1";

const BASE: NatScenario = {
  method: "manual",
  type: "static",
  natIp: "203.0.113.50",
  gatewayIp: "203.0.113.1",
  gatewayPrefix: 24,
  automaticArpConfiguration: true,
};

export interface NatVector {
  id: string;
  description: string;
  scenario: NatScenario;
  expectOk?: boolean;
  expectErrorIncludes?: string;
  expectArrives?: boolean;
  expectProxyArpRequired?: boolean;
  expectProxyArpAutomatic?: boolean;
  expectRemedy?: boolean;
  expectFindingIncludes?: string;
}

export const NAT_VECTORS: NatVector[] = [
  {
    id: "manual-static-same-subnet-black-holes",
    description:
      "The classic. A manual static NAT onto an address in the gateway's own subnet, with nothing to answer the ARP. Policy installs cleanly and no packet ever arrives.",
    scenario: { ...BASE },
    expectOk: true,
    expectArrives: false,
    expectProxyArpRequired: true,
    expectProxyArpAutomatic: false,
    expectRemedy: true,
    expectFindingIncludes: "no traffic at all in the firewall logs",
  },
  {
    id: "automatic-static-creates-the-entry",
    description: "The same NAT configured automatically: the entry is added at policy install.",
    scenario: { ...BASE, method: "automatic" },
    expectOk: true,
    expectArrives: true,
    expectProxyArpRequired: true,
    expectProxyArpAutomatic: true,
    expectRemedy: false,
  },
  {
    id: "automatic-but-global-arp-disabled",
    description:
      "The case that makes 'use automatic NAT' insufficient as advice: automatic rules create nothing when Automatic ARP configuration is switched off in Global Properties.",
    scenario: { ...BASE, method: "automatic", automaticArpConfiguration: false },
    expectOk: true,
    expectArrives: false,
    expectProxyArpRequired: true,
    expectProxyArpAutomatic: false,
    expectRemedy: true,
  },
  {
    id: "hide-nat-publishes-nothing",
    description:
      "Hide NAT translates the source of outbound connections, so there is no inbound address for anyone to ARP for.",
    scenario: { ...BASE, type: "hide" },
    expectOk: true,
    expectArrives: true,
    expectProxyArpRequired: false,
    expectFindingIncludes: "one-way by design",
  },
  {
    id: "off-subnet-is-a-routing-question",
    description:
      "A translated address outside every connected subnet is not an ARP problem. Something upstream has to route it, and looking at proxy ARP wastes the afternoon.",
    scenario: { ...BASE, natIp: "198.51.100.9" },
    expectOk: true,
    expectArrives: true,
    expectProxyArpRequired: false,
    expectFindingIncludes: "route for this address pointing at the gateway",
  },
  {
    id: "manual-static-off-subnet-still-fine",
    description: "Manual NAT off-subnet needs no proxy ARP either - the method is irrelevant there.",
    scenario: { ...BASE, method: "manual", natIp: "192.0.2.7" },
    expectOk: true,
    expectProxyArpRequired: false,
  },
  {
    id: "narrow-prefix-changes-the-answer",
    description:
      "The subnet arithmetic decides it: the same pair of addresses is same-subnet at /24 and off-subnet at /29.",
    scenario: { ...BASE, gatewayPrefix: 29 },
    expectOk: true,
    expectProxyArpRequired: false,
  },
  {
    id: "merge-manual-proxy-arp-flagged",
    description:
      "When the entry must be added by hand, the Global Properties setting that lets manual and automatic entries coexist is named.",
    scenario: { ...BASE },
    expectOk: true,
    expectFindingIncludes: "Merge manual proxy ARP configuration",
  },
  {
    id: "error-bad-ip",
    description: "An address that is not an address is named rather than guessed at.",
    scenario: { ...BASE, natIp: "203.0.113" },
    expectOk: false,
    expectErrorIncludes: "is not an IPv4 address",
  },
  {
    id: "error-octet-too-large",
    description: "A typo in an octet is caught.",
    scenario: { ...BASE, gatewayIp: "203.0.113.300" },
    expectOk: false,
    expectErrorIncludes: "octet above 255",
  },
  {
    id: "error-bad-prefix",
    description: "A prefix outside 0-32 is not a prefix.",
    scenario: { ...BASE, gatewayPrefix: 33 },
    expectOk: false,
    expectErrorIncludes: "between 0 and 32",
  },
];

/** Run every vector. Returns failures, empty when all pass. */
export function verifyVectors(): string[] {
  const failures: string[] = [];
  for (const v of NAT_VECTORS) {
    let r: NatVerdict | null = null;
    let error: string | null = null;
    try {
      r = evaluateNat(v.scenario);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
    if (v.expectOk === false) {
      if (!error) failures.push(`${v.id}: expected an error, got a result`);
      else if (v.expectErrorIncludes && !error.includes(v.expectErrorIncludes)) {
        failures.push(`${v.id}: error "${error}" does not mention "${v.expectErrorIncludes}"`);
      }
      continue;
    }
    if (error) {
      failures.push(`${v.id}: unexpected error "${error}"`);
      continue;
    }
    if (!r) {
      failures.push(`${v.id}: no result`);
      continue;
    }
    if (v.expectArrives !== undefined && r.willArrive !== v.expectArrives) {
      failures.push(`${v.id}: willArrive ${r.willArrive}, expected ${v.expectArrives}`);
    }
    if (v.expectProxyArpRequired !== undefined && r.proxyArpRequired !== v.expectProxyArpRequired) {
      failures.push(
        `${v.id}: proxyArpRequired ${r.proxyArpRequired}, expected ${v.expectProxyArpRequired}`,
      );
    }
    if (
      v.expectProxyArpAutomatic !== undefined &&
      r.proxyArpAutomatic !== v.expectProxyArpAutomatic
    ) {
      failures.push(
        `${v.id}: proxyArpAutomatic ${r.proxyArpAutomatic}, expected ${v.expectProxyArpAutomatic}`,
      );
    }
    if (v.expectRemedy !== undefined && Boolean(r.remedy) !== v.expectRemedy) {
      failures.push(`${v.id}: remedy ${Boolean(r.remedy)}, expected ${v.expectRemedy}`);
    }
    if (v.expectFindingIncludes && !r.findings.some((f) => f.includes(v.expectFindingIncludes!))) {
      failures.push(`${v.id}: no finding mentioning "${v.expectFindingIncludes}"`);
    }
  }
  return failures;
}
