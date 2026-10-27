// ============================================================================
// src/lib/dev-out/doh-lookup/tables.ts
// ----------------------------------------------------------------------------
// THE NUMBERS A DNS MESSAGE CARRIES, AND THEIR NAMES, for the DNS-over-HTTPS
// lookup (/dev/out/doh-lookup, 2026-10-27). Every table below was generated
// from IANA's own registry files, downloaded and read on 2026-10-27, by a
// script that copies value and name verbatim (no hand typing):
//   - Domain Name System (DNS) Parameters, file updated 2026-10-16
//     (https://www.iana.org/assignments/dns-parameters/dns-parameters.xml):
//     "Resource Record (RR) TYPEs", "DNS RCODEs", "DNS OpCodes", "DNS
//     CLASSes", "DNS EDNS0 Option Codes (OPT)", "Extended DNS Error Codes";
//   - DNSSEC Algorithm Numbers, file updated 2026-08-10
//     (https://www.iana.org/assignments/dns-sec-alg-numbers/), the Mnemonic
//     column;
//   - DS RR Type Digest Algorithms, file updated 2026-01-13
//     (https://www.iana.org/assignments/ds-rr-types/);
//   - DNS SVCB Service Parameter Keys, file updated 2026-06-25
//     (https://www.iana.org/assignments/dns-svcb/).
// Values a registry lists as Reserved, Unassigned or as a range are left out:
// a number with no entry here is printed in the generic form RFC 3597 section
// 5 defines (TYPE<n>, CLASS<n>) or as a plain number.
//
// PRIME DIRECTIVE (D-19): every line commented.
// ============================================================================

/** When the registries behind these tables were downloaded and read. */
export const IANA_SNAPSHOT = Object.freeze({
  // The day of the download.
  accessed: "2026-10-27",
  // The "updated" date printed in the DNS Parameters registry file that day.
  dnsParametersUpdated: "2026-10-16",
});

/** RR TYPE mnemonics by number (IANA, "Resource Record (RR) TYPEs"; single values with a mnemonic only). */
export const RR_TYPE_NAMES: Readonly<Record<number, string>> = Object.freeze({
  // RFC 1035 types.
  1: "A", 2: "NS", 3: "MD", 4: "MF", 5: "CNAME", 6: "SOA", 7: "MB", 8: "MG", 9: "MR", 10: "NULL", 11: "WKS",
  // RFC 1035 and later informational types.
  12: "PTR", 13: "HINFO", 14: "MINFO", 15: "MX", 16: "TXT", 17: "RP", 18: "AFSDB", 19: "X25", 20: "ISDN", 21: "RT",
  // Address and location types of the 1990s.
  22: "NSAP", 23: "NSAP-PTR", 24: "SIG", 25: "KEY", 26: "PX", 27: "GPOS", 28: "AAAA", 29: "LOC", 30: "NXT", 31: "EID", 32: "NIMLOC",
  // Services, certificates and the EDNS pseudo-type.
  33: "SRV", 34: "ATMA", 35: "NAPTR", 36: "KX", 37: "CERT", 38: "A6", 39: "DNAME", 40: "SINK", 41: "OPT", 42: "APL",
  // The DNSSEC family and its neighbours.
  43: "DS", 44: "SSHFP", 45: "IPSECKEY", 46: "RRSIG", 47: "NSEC", 48: "DNSKEY", 49: "DHCID", 50: "NSEC3",
  // More DNSSEC-era and later types.
  51: "NSEC3PARAM", 52: "TLSA", 53: "SMIMEA", 54: "DELEGPARAM", 55: "HIP", 56: "NINFO", 57: "RKEY", 58: "TALINK",
  // Child synchronisation, keys and service bindings.
  59: "CDS", 60: "CDNSKEY", 61: "OPENPGPKEY", 62: "CSYNC", 63: "ZONEMD", 64: "SVCB", 65: "HTTPS", 66: "DSYNC",
  // Recent assignments.
  67: "HHIT", 68: "BRID", 69: "UNECE", 70: "ISO",
  // The 99-109 block.
  99: "SPF", 100: "UINFO", 101: "UID", 102: "GID", 103: "UNSPEC", 104: "NID", 105: "L32", 106: "L64", 107: "LP",
  // EUI addresses.
  108: "EUI48", 109: "EUI64",
  // The Compact Denial of Existence meta-type (RFC 9824).
  128: "NXNAME",
  // Meta-types and query types.
  249: "TKEY", 250: "TSIG", 251: "IXFR", 252: "AXFR", 253: "MAILB", 254: "MAILA", 255: "*",
  // Types above 255.
  256: "URI", 257: "CAA", 258: "AVC", 259: "DOA", 260: "AMTRELAY", 261: "RESINFO", 262: "WALLET", 263: "CLA",
  // The last of the 256 block.
  264: "IPN",
  // The two types in the 32768 block, and the value the registry lists at 61440.
  32768: "TA", 32769: "DLV", 61440: "DELEG",
});

/** RR class names (IANA, "DNS CLASSes"), in the short form dig prints. */
export const CLASS_NAMES: Readonly<Record<number, string>> = Object.freeze({
  // Internet, the class every query here uses.
  1: "IN",
  // Chaos and Hesiod.
  3: "CH", 4: "HS",
  // The two query-only classes.
  254: "NONE", 255: "ANY",
});

/** OpCode names (IANA, "DNS OpCodes"); IQuery is obsolete (RFC 3425). */
export const OPCODE_NAMES: Readonly<Record<number, string>> = Object.freeze({
  // The standard query, the only one this tool sends.
  0: "QUERY",
  // The obsolete inverse query and the status request.
  1: "IQUERY", 2: "STATUS",
  // Notify, update and DNS Stateful Operations.
  4: "NOTIFY", 5: "UPDATE", 6: "DSO",
});

/**
 * RCODE names (IANA, "DNS RCODEs"), upper-cased as dig prints them. Value 16 is listed twice by IANA, BADVERS (RFC
 * 6891, in an OPT record) and BADSIG (RFC 8945, in a TSIG record); this tool sends no TSIG, so 16 reads BADVERS.
 */
export const RCODE_NAMES: Readonly<Record<number, string>> = Object.freeze({
  // RFC 1035.
  0: "NOERROR", 1: "FORMERR", 2: "SERVFAIL", 3: "NXDOMAIN", 4: "NOTIMP", 5: "REFUSED",
  // RFC 2136 (dynamic update) and RFC 8490 (DSO).
  6: "YXDOMAIN", 7: "YXRRSET", 8: "NXRRSET", 9: "NOTAUTH", 10: "NOTZONE", 11: "DSOTYPENI",
  // Extended RCODEs, reachable only through an OPT record's upper eight bits (RFC 6891 section 6.1.3).
  16: "BADVERS", 17: "BADKEY", 18: "BADTIME", 19: "BADMODE", 20: "BADNAME", 21: "BADALG", 22: "BADTRUNC",
  // RFC 7873.
  23: "BADCOOKIE",
});

/** EDNS(0) option names (IANA, "DNS EDNS0 Option Codes (OPT)"). */
export const EDNS_OPTION_NAMES: Readonly<Record<number, string>> = Object.freeze({
  // Long-lived queries, update lease, name server identifier.
  1: "LLQ", 2: "Update Lease", 3: "NSID",
  // Algorithm understanding signals (RFC 6975).
  5: "DAU", 6: "DHU", 7: "N3U",
  // Client subnet, expire, cookies, keepalive, padding.
  8: "edns-client-subnet", 9: "EDNS EXPIRE", 10: "COOKIE", 11: "edns-tcp-keepalive", 12: "Padding",
  // Chain, key tag, extended errors.
  13: "CHAIN", 14: "edns-key-tag", 15: "Extended DNS Error",
  // Client and server tags, report channel, zone version.
  16: "EDNS-Client-Tag", 17: "EDNS-Server-Tag", 18: "Report-Channel", 19: "ZONEVERSION",
  // Multiple query types.
  20: "MQTYPE-Query", 21: "MQTYPE-Response",
  // Filtering and structured errors.
  22: "EDE-EXTRA-TEXT-LANGUAGE", 23: "FILTERING-CONTACT", 24: "FILTERING-ORGANIZATION", 25: "FILTERING-DB",
  // Structured DNS Error.
  26: "Structured DNS Error",
  // Two vendor values in the registry.
  20292: "Umbrella Ident", 26946: "DeviceID",
});

/** Extended DNS Error names (IANA, "Extended DNS Error Codes"; RFC 8914 and later). */
export const EDE_NAMES: Readonly<Record<number, string>> = Object.freeze({
  // RFC 8914, codes 0 to 9.
  0: "Other Error", 1: "Unsupported DNSKEY Algorithm", 2: "Unsupported DS Digest Type", 3: "Stale Answer",
  // Forgery, indeterminate and bogus.
  4: "Forged Answer", 5: "DNSSEC Indeterminate", 6: "DNSSEC Bogus", 7: "Signature Expired",
  // Signature timing and missing material.
  8: "Signature Not Yet Valid", 9: "DNSKEY Missing", 10: "RRSIGs Missing", 11: "No Zone Key Bit Set",
  // Denial and caching.
  12: "NSEC Missing", 13: "Cached Error", 14: "Not Ready", 15: "Blocked",
  // Policy outcomes.
  16: "Censored", 17: "Filtered", 18: "Prohibited", 19: "Stale NXDomain Answer",
  // Authority and reachability.
  20: "Not Authoritative", 21: "Not Supported", 22: "No Reachable Authority", 23: "Network Error",
  // Data and timing.
  24: "Invalid Data", 25: "Signature Expired before Valid", 26: "Too Early",
  // Later registrations.
  27: "Unsupported NSEC3 Iterations Value", 28: "Unable to conform to policy", 29: "Synthesized",
  // Query type, rate and quota.
  30: "Invalid Query Type", 31: "Rate Limited", 32: "Over Quota",
  // Trust anchors and delegation.
  33: "Negative Trust Anchor", 34: "New Delegation Only", 35: "Blocked by Upstream DNS Server",
});

/** DNSSEC algorithm mnemonics (IANA, "DNS Security Algorithm Numbers", Mnemonic column). */
export const DNSSEC_ALGORITHM_NAMES: Readonly<Record<number, string>> = Object.freeze({
  // Deletion signal and the early algorithms.
  0: "DELETE", 1: "RSAMD5", 2: "DH", 3: "DSA", 5: "RSASHA1", 6: "DSA-NSEC3-SHA1", 7: "RSASHA1-NSEC3-SHA1",
  // RSA with SHA-2.
  8: "RSASHA256", 10: "RSASHA512",
  // GOST and elliptic curves.
  12: "ECC-GOST", 13: "ECDSAP256SHA256", 14: "ECDSAP384SHA384", 15: "ED25519", 16: "ED448",
  // Recent assignments.
  17: "SM2SM3", 18: "MLDSA44", 23: "ECC-GOST12",
  // Indirect and private algorithms.
  252: "INDIRECT", 253: "PRIVATEDNS", 254: "PRIVATEOID",
});

/** DS digest algorithm names (IANA, "Digest Algorithms"). */
export const DS_DIGEST_NAMES: Readonly<Record<number, string>> = Object.freeze({
  // SHA-1 and SHA-256.
  1: "SHA-1", 2: "SHA-256",
  // GOST and SHA-384.
  3: "GOST R 34.11-94 (DEPRECATED)", 4: "SHA-384",
  // GOST 2012 and SM3.
  5: "GOST R 34.11-2012", 6: "SM3",
});

/** SVCB SvcParamKey names (IANA, "DNS SVCB Service Parameter Keys (SvcParamKeys)"). */
export const SVC_PARAM_KEY_NAMES: Readonly<Record<number, string>> = Object.freeze({
  // RFC 9460 keys.
  0: "mandatory", 1: "alpn", 2: "no-default-alpn", 3: "port", 4: "ipv4hint", 5: "ech", 6: "ipv6hint",
  // Later keys.
  7: "dohpath", 8: "ohttp", 9: "tls-supported-groups", 10: "docpath", 11: "pvd", 12: "oots",
});

/**
 * The type name as presented: the IANA mnemonic, or TYPE<n> for a number without one (RFC 3597 section 5).
 * @param type the 16-bit type number
 * @returns the mnemonic
 */
export function typeName(type: number): string {
  // The registry's mnemonic when there is one, the generic form otherwise.
  return RR_TYPE_NAMES[type] ?? `TYPE${type}`;
}

/**
 * The class name as presented: IN, CH, HS, NONE, ANY, or CLASS<n> (RFC 3597 section 5).
 * @param klass the 16-bit class number
 * @returns the name
 */
export function className(klass: number): string {
  // The registry's short name when there is one, the generic form otherwise.
  return CLASS_NAMES[klass] ?? `CLASS${klass}`;
}

/**
 * The RCODE name, or RCODE<n> for a number without one.
 * @param rcode the full 12-bit RCODE (header bits plus the OPT record's extension)
 * @returns the upper-case name
 */
export function rcodeName(rcode: number): string {
  // The registry's name when there is one.
  return RCODE_NAMES[rcode] ?? `RCODE${rcode}`;
}
