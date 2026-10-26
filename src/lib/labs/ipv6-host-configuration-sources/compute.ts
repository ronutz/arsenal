// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/ipv6-host-configuration-sources/compute.ts
// ----------------------------------------------------------------------------
// THE IPv6 HOST CONFIGURATION LAB'S MODEL (2026-10-26), the interactive
// companion of the article "How IPv6 hosts get addresses: SLAAC and DHCPv6". One host whose
// DHCPv6 client is running joins a link. The reader sets what the router
// advertises (whether it sends Router Advertisements at all, its Router
// Lifetime, the prefix's length and A flag, an RDNSS option) and what a DHCPv6
// server offers (nothing, stateless configuration, or addresses as well), and
// the model says which addresses the host ends up with, whether it has a
// default route, where its DNS servers come from, and what that leaves it
// able to reach.
//
// The rules are the article's, each with its source there:
//   - Every interface forms a link-local address in fe80::/64 (RFC 4862, 5.3).
//   - SLAAC uses a Prefix Information option only if its A flag is set and the
//     prefix length plus the 64-bit interface identifier makes 128 bits, so on
//     Ethernet only a /64 yields an address (RFC 4862, 5.5.3; RFC 2464, 4).
//   - A Router Lifetime of 0 means the sender is not a default router
//     (RFC 4861, 4.2), and "the only mechanism to configure the default
//     router's address automatically is the one using Router Advertisements"
//     (RFC 4862, 5.5.2): DHCPv6 never gives a default route.
//   - Stateful DHCPv6 leases addresses in an IA_NA (RFC 9915, 4.2), each a
//     /128 with no implicit prefix (18.2.10.1). Stateless DHCPv6, an
//     Information-request, gives options such as DNS without any address
//     (5.1). Either way the DNS servers arrive as option 23 (RFC 3646).
//   - The RA's RDNSS option carries DNS servers too (RFC 8106, 5.1); its
//     lifetime is its own, so a Router Lifetime of 0 does not remove it, and
//     "the DNS information from DHCP takes precedence over that from RAs"
//     (5.3.1).
// The original interactive model gave no DNS servers from DHCPv6 unless the
// host also leased an address; stateless DHCPv6 is exactly the case where it
// does, so this model corrects that.
// What the model leaves out (the lab's scope note): when an operating system
// decides to start DHCPv6 (the M and O flags only signal), Duplicate Address
// Detection, temporary and RFC 7217 addresses, lifetimes and their expiry,
// prefix delegation, and on-link determination beyond the default route.
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** The prefix length the Prefix Information option carries. */
export type PrefixLength = "64" | "60";
/** Every value the prefix control can take. */
export const PREFIX_LENGTHS: readonly PrefixLength[] = ["64", "60"];
/** What a DHCPv6 server offers. */
export type Dhcpv6 = "none" | "stateless" | "stateful";
/** Every value the DHCPv6 control can take. */
export const DHCPV6_MODES: readonly Dhcpv6[] = ["none", "stateless", "stateful"];

/** The link-local address the lab's host forms (from the article's EUI-64 example). */
export const LINK_LOCAL = "fe80::3656:78ff:fe9a:bcde";
/** The SLAAC address on the advertised /64. */
export const SLAAC_ADDRESS = "2001:db8:cafe:1:3656:78ff:fe9a:bcde/64";
/** The address a stateful DHCPv6 server leases. */
export const DHCPV6_ADDRESS = "2001:db8:cafe:1::200/128";

/** The reader's settings. */
export interface Ipv6HostInput {
  /** True when a router sends Router Advertisements on the link. */
  ra: boolean;
  /** True when the RA's Router Lifetime is above 0 (1800 s); false when it is 0. */
  defaultRouter: boolean;
  /** The PIO's prefix length. */
  prefixLength: PrefixLength;
  /** The PIO's A (autonomous) flag. */
  aFlag: boolean;
  /** True when the RA carries an RDNSS option. */
  rdnss: boolean;
  /** What the DHCPv6 server offers. */
  dhcpv6: Dhcpv6;
}

/** Where the DNS servers came from. */
export type DnsSource = "dhcpv6" | "rdnss" | "none";
/** What the host can reach. */
export type Reach = "link-only" | "on-link" | "by-address" | "by-name";

/** The model's answer. */
export interface Ipv6HostResult {
  /** The addresses the host holds, link-local first. */
  addresses: string[];
  /** True when SLAAC formed a global address. */
  slaac: boolean;
  /** Why SLAAC did not run, or "none" when it did. */
  slaacBlocked: "none" | "no-ra" | "a-flag" | "prefix-length";
  /** True when DHCPv6 leased an address. */
  dhcpv6Address: boolean;
  /** True when the host has a default route. */
  defaultRoute: boolean;
  /** Where its DNS servers came from. */
  dns: DnsSource;
  /** True when an RDNSS option was also offered but DHCPv6 took precedence. */
  rdnssOverridden: boolean;
  /** What that leaves the host able to reach. */
  reach: Reach;
}

/** The stable codes an invalid input is refused with. */
export type Ipv6HostErrorCode = "bad-choice";

/** An invalid input, refused with a stable code the interface can word. */
export class Ipv6HostError extends Error {
  /** The stable code. */
  readonly code: Ipv6HostErrorCode;
  /** Build the refusal with its code and an English message for logs. */
  constructor(code: Ipv6HostErrorCode, message: string) {
    // The message, for developers.
    super(message);
    // The code, for the interface.
    this.code = code;
  }
}

/** Compute the host's configuration from what the link offers. */
export function compute(input: Ipv6HostInput): Ipv6HostResult {
  // Every field comes from a select: anything else is a programming error.
  if ([input.ra, input.defaultRouter, input.aFlag, input.rdnss].some((b) => typeof b !== "boolean") || !PREFIX_LENGTHS.includes(input.prefixLength) || !DHCPV6_MODES.includes(input.dhcpv6)) throw new Ipv6HostError("bad-choice", "unknown setting");

  // SLAAC needs an RA, the A flag and a /64 (64 + 64 = 128 bits).
  const slaacBlocked = !input.ra ? "no-ra" : !input.aFlag ? "a-flag" : input.prefixLength !== "64" ? "prefix-length" : "none";
  // SLAAC ran when nothing blocked it.
  const slaac = slaacBlocked === "none";
  // Stateful DHCPv6 leases an address; stateless never does.
  const dhcpv6Address = input.dhcpv6 === "stateful";
  // The addresses: link-local always, then SLAAC, then DHCPv6.
  const addresses = [LINK_LOCAL, ...(slaac ? [SLAAC_ADDRESS] : []), ...(dhcpv6Address ? [DHCPV6_ADDRESS] : [])];
  // A default route only from an RA with a nonzero Router Lifetime.
  const defaultRoute = input.ra && input.defaultRouter;
  // RDNSS needs an RA to ride in; its lifetime is its own.
  const rdnssOffered = input.ra && input.rdnss;
  // DHCPv6 gives DNS in either mode, stateless included, and takes precedence over RDNSS.
  const dns: DnsSource = input.dhcpv6 !== "none" ? "dhcpv6" : rdnssOffered ? "rdnss" : "none";
  // Whether an RDNSS option was set aside.
  const rdnssOverridden = dns === "dhcpv6" && rdnssOffered;
  // A global address of any origin.
  const global = slaac || dhcpv6Address;
  // What that leaves: link-local only, on-link only, off-link by address, or off-link by name.
  const reach: Reach = !global ? "link-only" : !defaultRoute ? "on-link" : dns === "none" ? "by-address" : "by-name";
  // The full answer.
  return { addresses, slaac, slaacBlocked, dhcpv6Address, defaultRoute, dns, rdnssOverridden, reach };
}

/** The opening state: an RA with a /64, A set and RDNSS; no DHCPv6. Ready by name. */
export const DEFAULT_INPUT: Ipv6HostInput = { ra: true, defaultRouter: true, prefixLength: "64", aFlag: true, rdnss: true, dhcpv6: "none" };
/** The Example: SLAAC for the address, stateless DHCPv6 for DNS, no RDNSS. Ready by name, with no DHCPv6 address at all. */
export const EXAMPLE_INPUT: Ipv6HostInput = { ra: true, defaultRouter: true, prefixLength: "64", aFlag: true, rdnss: false, dhcpv6: "stateless" };
