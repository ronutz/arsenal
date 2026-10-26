// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/ipv6-host-configuration-sources/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the IPv6 host configuration lab (set 2026-10-26a). The
// three marked "checked" were run in the original interactive model on
// 2026-10-26 and agree; the one marked "corrected" is where the original said
// a host with stateless DHCPv6 gets no DNS servers, which RFC 9915 section 5.1
// contradicts. Reject vectors pin the stable error code. verifyVectors() runs
// them all; scripts/run-golden-vectors runs it at prebuild and fails the build
// on drift.
// ============================================================================

import { compute, Ipv6HostError, type Ipv6HostErrorCode, type Ipv6HostInput, type Ipv6HostResult } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "ipv6-host-configuration-sources/2026-10-26a";

/** A case the model must answer exactly so (every listed field compared). */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings. */
  input: Ipv6HostInput;
  /** The fields of the result that must match. */
  expect: Partial<Omit<Ipv6HostResult, "addresses">> & { addressCount?: number };
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings outside the lab's range (cast, as the interface could never send them). */
  input: Ipv6HostInput;
  /** The code the refusal must carry. */
  code: Ipv6HostErrorCode;
}

/** The accept cases. */
export const IPV6_HOST_VECTORS: readonly AcceptVector[] = Object.freeze([
  // Checked: no RA, stateful DHCPv6; a global /128 and DNS, but no default route.
  { id: "no-ra-stateful", input: { ra: false, defaultRouter: true, prefixLength: "64", aFlag: true, rdnss: false, dhcpv6: "stateful" }, expect: { slaac: false, slaacBlocked: "no-ra", dhcpv6Address: true, defaultRoute: false, dns: "dhcpv6", reach: "on-link", addressCount: 2 } },
  // Checked: Router Lifetime 0; SLAAC still runs and RDNSS still counts, but there is no default route.
  { id: "lifetime-zero", input: { ra: true, defaultRouter: false, prefixLength: "64", aFlag: true, rdnss: true, dhcpv6: "none" }, expect: { slaac: true, defaultRoute: false, dns: "rdnss", reach: "on-link" } },
  // Checked: a /60 in the PIO; SLAAC ignores it, the default route stays.
  { id: "prefix-60", input: { ra: true, defaultRouter: true, prefixLength: "60", aFlag: true, rdnss: true, dhcpv6: "none" }, expect: { slaac: false, slaacBlocked: "prefix-length", defaultRoute: true, reach: "link-only", addressCount: 1 } },
  // Corrected: SLAAC plus stateless DHCPv6 and no RDNSS; DNS comes from DHCPv6 with no DHCPv6 address.
  { id: "stateless-dns", input: { ra: true, defaultRouter: true, prefixLength: "64", aFlag: true, rdnss: false, dhcpv6: "stateless" }, expect: { slaac: true, dhcpv6Address: false, defaultRoute: true, dns: "dhcpv6", reach: "by-name", addressCount: 2 } },
  // The opening state: SLAAC and RDNSS, ready by name.
  { id: "slaac-rdnss", input: { ra: true, defaultRouter: true, prefixLength: "64", aFlag: true, rdnss: true, dhcpv6: "none" }, expect: { slaac: true, dns: "rdnss", rdnssOverridden: false, reach: "by-name" } },
  // Both RDNSS and DHCPv6: DHCPv6 takes precedence.
  { id: "dhcpv6-precedence", input: { ra: true, defaultRouter: true, prefixLength: "64", aFlag: true, rdnss: true, dhcpv6: "stateless" }, expect: { dns: "dhcpv6", rdnssOverridden: true } },
  // A flag clear and no DHCPv6: link-local only.
  { id: "a-flag-clear", input: { ra: true, defaultRouter: true, prefixLength: "64", aFlag: false, rdnss: true, dhcpv6: "none" }, expect: { slaac: false, slaacBlocked: "a-flag", reach: "link-only", addressCount: 1 } },
  // A flag clear with stateful DHCPv6: the address from DHCPv6, the route from the RA.
  { id: "managed-only", input: { ra: true, defaultRouter: true, prefixLength: "64", aFlag: false, rdnss: false, dhcpv6: "stateful" }, expect: { slaac: false, dhcpv6Address: true, defaultRoute: true, dns: "dhcpv6", reach: "by-name", addressCount: 2 } },
  // SLAAC and a route, but no DNS from anywhere: reachable by address only.
  { id: "no-dns", input: { ra: true, defaultRouter: true, prefixLength: "64", aFlag: true, rdnss: false, dhcpv6: "none" }, expect: { dns: "none", reach: "by-address" } },
  // SLAAC and stateful DHCPv6 together: three addresses.
  { id: "both-addresses", input: { ra: true, defaultRouter: true, prefixLength: "64", aFlag: true, rdnss: false, dhcpv6: "stateful" }, expect: { slaac: true, dhcpv6Address: true, addressCount: 3 } },
]);

/** The reject cases. */
export const IPV6_HOST_REJECTS: readonly RejectVector[] = Object.freeze([
  // A DHCPv6 mode the select cannot produce.
  { id: "bad-choice", input: { ra: true, defaultRouter: true, prefixLength: "64", aFlag: true, rdnss: true, dhcpv6: "pd" as unknown as "none" }, code: "bad-choice" },
]);

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // Each accept case: compute and compare every expected field.
  for (const v of IPV6_HOST_VECTORS) {
    // The model's answer.
    const got = compute(v.input);
    // Each expected field in turn.
    for (const [k, want] of Object.entries(v.expect)) {
      // The answer's value for that field (the address count is derived).
      const have = k === "addressCount" ? got.addresses.length : got[k as keyof Ipv6HostResult];
      // A difference is a failure naming the case and the field.
      if (have !== want) failures.push(`${v.id}: ${k} is ${String(have)}, expected ${String(want)}`);
    }
  }
  // Each reject case: it must throw with the right code.
  for (const r of IPV6_HOST_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof Ipv6HostError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report in the shape the runner reads.
  const total = IPV6_HOST_VECTORS.length + IPV6_HOST_REJECTS.length;
  // Passed is everything that did not fail (floored at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
