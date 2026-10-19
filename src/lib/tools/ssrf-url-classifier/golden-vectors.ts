// ============================================================================
// src/lib/tools/ssrf-url-classifier/golden-vectors.ts
// ----------------------------------------------------------------------------
// Frozen input/expectation pairs that pin the classifier's behavior. Each
// vector runs the real engine and asserts on the fields that matter for that
// case (category, decoded address, obfuscation form, risk, or a flag). The set
// id is date-stamped so a regression is traceable to the day the contract was
// fixed. verifyVectors() powers the tool's __selftest and the build guard.
// ============================================================================

import { classifyUrl, type SsrfResult } from "./compute";

// Bumped 2026-10-19 (was "ssrf-url-classifier/2026-07-01"): the IPv6 rules now parse the address,
// decode IPv4-in-IPv6 embeddings and name the IANA special-purpose rows; 30 vectors were added
// below (56 in all) and none of the 26 earlier vectors changed.
// Bumped again 2026-10-19b (was "ssrf-url-classifier/2026-10-19"): every row of both IANA
// special-purpose registries is a table row, IPv4-compatible and Teredo are decoded, and the
// anycast service addresses are flagged; the vectors added at the end pin each of those, and the
// 56 earlier vectors are unchanged and still pass.
export const SET_ID = "ssrf-url-classifier/2026-10-19b"; // the dated set id the manifest points at (bumped 2026-10-19b)

interface Vector {
  name: string;
  input: string;
  check: (r: SsrfResult) => boolean;
}

export const VECTORS: Vector[] = [
  // --- Obfuscated IPv4 forms all decode to loopback ---
  { name: "dotted loopback", input: "http://127.0.0.1/admin", check: (r) => r.category === "loopback" && r.canonicalIp === "127.0.0.1" && !r.obfuscated },
  { name: "decimal loopback", input: "http://2130706433/", check: (r) => r.category === "loopback" && r.canonicalIp === "127.0.0.1" && r.obfuscationForm === "decimal" },
  { name: "hex loopback", input: "http://0x7f000001/", check: (r) => r.category === "loopback" && r.canonicalIp === "127.0.0.1" && r.obfuscationForm === "hex" },
  { name: "octal loopback", input: "http://0177.0.0.1/", check: (r) => r.category === "loopback" && r.canonicalIp === "127.0.0.1" && r.obfuscationForm === "octal" },
  { name: "short-form loopback", input: "http://127.1/", check: (r) => r.category === "loopback" && r.canonicalIp === "127.0.0.1" && r.obfuscationForm === "short" },

  // --- Cloud metadata endpoints ---
  { name: "AWS/GCP IMDS v4", input: "http://169.254.169.254/latest/meta-data/", check: (r) => r.category === "cloud-metadata" && r.risk === "high" },
  { name: "Alibaba metadata", input: "http://100.100.100.200/", check: (r) => r.category === "cloud-metadata" },
  { name: "GCP metadata name", input: "http://metadata.google.internal/computeMetadata/v1/", check: (r) => r.category === "cloud-metadata" },
  { name: "AWS IMDSv6", input: "http://[fd00:ec2::254]/", check: (r) => r.category === "cloud-metadata" },

  // --- RFC 1918 private ---
  { name: "private 10/8", input: "http://10.0.0.5/", check: (r) => r.category === "private" && r.risk === "high" },
  { name: "private 172.16/12", input: "http://172.16.9.9/", check: (r) => r.category === "private" },
  { name: "private 192.168/16", input: "http://192.168.1.1/", check: (r) => r.category === "private" },

  // --- Other reserved / special ranges ---
  { name: "link-local", input: "http://169.254.1.1/", check: (r) => r.category === "link-local" },
  { name: "CGNAT medium risk", input: "http://100.72.0.1/", check: (r) => r.category === "cgnat" && r.risk === "medium" },
  { name: "TEST-NET reserved", input: "http://192.0.2.5/", check: (r) => r.category === "reserved" },

  // --- IPv6 ---
  { name: "IPv6 loopback", input: "http://[::1]/", check: (r) => r.category === "loopback" && r.ipVersion === 6 },
  { name: "IPv6 ULA private", input: "http://[fc00::1]/", check: (r) => r.category === "private" && r.ipVersion === 6 },
  { name: "IPv6 link-local", input: "http://[fe80::1]/", check: (r) => r.category === "link-local" },
  { name: "IPv4-mapped IPv6 loopback", input: "http://[::ffff:127.0.0.1]/", check: (r) => r.category === "loopback" && r.ipVersion === 6 },

  // --- Hostnames (no DNS performed) ---
  { name: "localhost", input: "http://localhost:8080/", check: (r) => r.category === "loopback" },
  { name: "internal suffix", input: "http://db.internal/", check: (r) => r.category === "internal-name" && r.risk === "high" },
  { name: "public hostname unresolved", input: "http://example.com/", check: (r) => r.category === "unresolved" && r.risk === "unknown" },
  { name: "public IP low risk", input: "http://8.8.8.8/", check: (r) => r.category === "public" && r.risk === "low" },

  // --- Auxiliary flags ---
  { name: "dangerous scheme file://", input: "file:///etc/passwd", check: (r) => r.schemeFlag === "file" && r.risk === "high" },
  { name: "dangerous scheme gopher://", input: "gopher://127.0.0.1:6379/_INFO", check: (r) => r.schemeFlag === "gopher" && r.category === "loopback" },
  { name: "embedded credentials", input: "http://user:pass@169.254.169.254/", check: (r) => r.hasUserinfo && r.category === "cloud-metadata" },

  // --- 2026-10-19: the ten addresses PRIME ruled on ("Fix all ten"), each with a canonical or
  // alternative spelling of the same address. Each check pins every field the fix introduced:
  // category, risk, the RFC 5952 canonical text, the decoded embedding and the IANA registry row.
  // Expected values come from the IANA Special-Purpose Address Space CSVs and the RFCs read that day.
  // 1. IPv4-mapped loopback (RFC 4291 section 2.5.5.2), as the WHATWG URL serializer writes it and in mixed notation.
  { name: "IPv4-mapped loopback, hex tail", input: "http://[::ffff:7f00:1]/", check: (r) => r.category === "loopback" && r.risk === "high" && r.canonicalIp === "::ffff:127.0.0.1" && r.embedding === "ipv4-mapped" && r.embeddedIpv4 === "127.0.0.1" && r.specialBlock?.prefix === "::ffff:0:0/96" }, // was public/low
  { name: "IPv4-mapped loopback, canonical mixed form", input: "http://[::ffff:127.0.0.1]/", check: (r) => r.category === "loopback" && r.risk === "high" && r.canonicalIp === "::ffff:127.0.0.1" && r.embedding === "ipv4-mapped" && r.embeddedIpv4 === "127.0.0.1" }, // same address
  // 2. Loopback ::1 in expanded and zero-padded spellings (RFC 4291 section 2.2).
  { name: "loopback, expanded ::1", input: "http://[0:0:0:0:0:0:0:1]/", check: (r) => r.category === "loopback" && r.risk === "high" && r.canonicalIp === "::1" && r.embedding === null && r.specialBlock?.name === "Loopback Address" }, // was public/low
  { name: "loopback, zero-padded ::1", input: "http://[0000:0000:0000:0000:0000:0000:0000:0001]/", check: (r) => r.category === "loopback" && r.canonicalIp === "::1" }, // same address
  // 3. NAT64 Well-Known Prefix carrying loopback (RFC 6052 section 2.2, /96 layout).
  { name: "NAT64 WKP loopback, hex tail", input: "http://[64:ff9b::7f00:1]/", check: (r) => r.category === "loopback" && r.risk === "high" && r.canonicalIp === "64:ff9b::127.0.0.1" && r.embedding === "nat64-wkp" && r.embeddedIpv4 === "127.0.0.1" && r.embeddingLayout === 96 && r.specialBlock?.prefix === "64:ff9b::/96" }, // was public/low
  { name: "NAT64 WKP loopback, canonical mixed form", input: "http://[64:ff9b::127.0.0.1]/", check: (r) => r.category === "loopback" && r.canonicalIp === "64:ff9b::127.0.0.1" && r.embedding === "nat64-wkp" }, // same address
  // 4. NAT64 Well-Known Prefix carrying the link-local metadata address 169.254.169.254.
  { name: "NAT64 WKP metadata, mixed form", input: "http://[64:ff9b::169.254.169.254]/", check: (r) => r.category === "cloud-metadata" && r.risk === "high" && r.canonicalIp === "64:ff9b::169.254.169.254" && r.embedding === "nat64-wkp" && r.embeddedIpv4 === "169.254.169.254" }, // was public/low
  { name: "NAT64 WKP metadata, hex tail", input: "http://[64:ff9b::a9fe:a9fe]/", check: (r) => r.category === "cloud-metadata" && r.canonicalIp === "64:ff9b::169.254.169.254" && r.embeddedIpv4 === "169.254.169.254" }, // same address
  // 5. 6to4 (RFC 3056 section 2): bits 16 to 47 carry 127.0.0.1.
  { name: "6to4 carrying loopback", input: "http://[2002:7f00:1::]/", check: (r) => r.category === "loopback" && r.risk === "high" && r.canonicalIp === "2002:7f00:1::" && r.embedding === "6to4" && r.embeddedIpv4 === "127.0.0.1" && r.embeddingLayout === null && r.specialBlock?.prefix === "2002::/16" }, // was public/low
  { name: "6to4 carrying loopback, full form", input: "http://[2002:7f00:0001:0:0:0:0:0]/", check: (r) => r.category === "loopback" && r.canonicalIp === "2002:7f00:1::" && r.embeddedIpv4 === "127.0.0.1" }, // same address
  // 6. Documentation 2001:db8::/32 (RFC 3849), not globally reachable per the IANA registry.
  { name: "documentation 2001:db8::/32", input: "http://[2001:db8::1]/", check: (r) => r.category === "reserved" && r.risk === "high" && r.canonicalIp === "2001:db8::1" && r.specialBlock?.prefix === "2001:db8::/32" && r.specialBlock?.name === "Documentation" && r.specialBlock?.globallyReachable === false }, // was public/low
  { name: "documentation 2001:db8::/32, full form", input: "http://[2001:0db8:0000:0000:0000:0000:0000:0001]/", check: (r) => r.category === "reserved" && r.canonicalIp === "2001:db8::1" }, // same address
  // 7. Documentation 3fff::/20 (RFC 9637).
  { name: "documentation 3fff::/20", input: "http://[3fff::1]/", check: (r) => r.category === "reserved" && r.risk === "high" && r.canonicalIp === "3fff::1" && r.specialBlock?.prefix === "3fff::/20" && r.specialBlock?.rfc === "RFC 9637" }, // was public/low
  { name: "documentation 3fff::/20, expanded", input: "http://[3fff:0:0:0:0:0:0:1]/", check: (r) => r.category === "reserved" && r.canonicalIp === "3fff::1" }, // same address
  // 8. Discard-only 100::/64 (RFC 6666).
  { name: "discard-only 100::/64", input: "http://[100::1]/", check: (r) => r.category === "reserved" && r.risk === "high" && r.canonicalIp === "100::1" && r.specialBlock?.name === "Discard-Only Address Block" }, // was public/low
  { name: "discard-only 100::/64, zero-padded", input: "http://[0100:0000:0000:0000::1]/", check: (r) => r.category === "reserved" && r.canonicalIp === "100::1" }, // same address
  // 9. 192.0.0.1, inside 192.0.0.0/29 "IPv4 Service Continuity Prefix" (RFC 7335) within 192.0.0.0/24.
  { name: "IETF protocol assignments 192.0.0.1", input: "http://192.0.0.1/", check: (r) => r.category === "reserved" && r.risk === "high" && r.canonicalIp === "192.0.0.1" && r.specialBlock?.prefix === "192.0.0.0/29" && r.specialBlock?.name === "IPv4 Service Continuity Prefix" }, // was public/low
  { name: "IETF protocol assignments 192.0.0.1, decimal", input: "http://3221225473/", check: (r) => r.category === "reserved" && r.canonicalIp === "192.0.0.1" && r.obfuscationForm === "decimal" }, // same address, obfuscated
  // 10. 192.0.0.170, "NAT64/DNS64 Discovery" (RFC 8880; RFC 7050 section 2.2), with its partner .171.
  { name: "NAT64/DNS64 discovery 192.0.0.170", input: "http://192.0.0.170/", check: (r) => r.category === "reserved" && r.risk === "high" && r.specialBlock?.name === "NAT64/DNS64 Discovery" && r.specialBlock?.globallyReachable === false }, // was public/low
  { name: "NAT64/DNS64 discovery 192.0.0.170, hex", input: "http://0xc00000aa/", check: (r) => r.category === "reserved" && r.canonicalIp === "192.0.0.170" && r.specialBlock?.name === "NAT64/DNS64 Discovery" }, // same address, obfuscated
  { name: "NAT64/DNS64 discovery 192.0.0.171", input: "http://192.0.0.171/", check: (r) => r.category === "reserved" && r.specialBlock?.name === "NAT64/DNS64 Discovery" }, // the second well-known address

  // --- 2026-10-19: the other rules the fix introduced ---
  { name: "local-use 64:ff9b:1::/48, /48 layout", input: "http://[64:ff9b:1:7f00:0:100::]/", check: (r) => r.category === "loopback" && r.embedding === "nat64-local" && r.embeddedIpv4 === "127.0.0.1" && r.embeddingLayout === 48 && r.specialBlock?.prefix === "64:ff9b:1::/48" }, // RFC 6052 /48: bits 48-63 and 72-87
  { name: "local-use 64:ff9b:1::/48, /96 layout metadata", input: "http://[64:ff9b:1::a9fe:a9fe]/", check: (r) => r.category === "cloud-metadata" && r.embeddedIpv4 === "169.254.169.254" && r.embeddingLayout === 96 }, // RFC 6052 /96: the low 32 bits
  { name: "local-use 64:ff9b:1::/48, public reading floored", input: "http://[64:ff9b:1::808:808]/", check: (r) => r.category === "reserved" && r.risk === "high" && r.embeddedIpv4 === "8.8.8.8" }, // the /48 is not globally reachable
  { name: "local-use 64:ff9b:1::/48, u octet set", input: "http://[64:ff9b:1:0:ff00::1]/", check: (r) => r.category === "reserved" && r.embedding === null && r.embeddedIpv4 === null }, // RFC 6052 section 2.2: bits 64-71 MUST be zero
  { name: "6to4 carrying the metadata address", input: "http://[2002:a9fe:a9fe::1]/", check: (r) => r.category === "cloud-metadata" && r.embedding === "6to4" && r.embeddedIpv4 === "169.254.169.254" }, // the bypass the fix closes
  { name: "NAT64 WKP carrying a public address", input: "http://[64:ff9b::808:808]/", check: (r) => r.category === "public" && r.risk === "low" && r.canonicalIp === "64:ff9b::8.8.8.8" && r.embedding === "nat64-wkp" }, // rated by what it carries, both ways
  { name: "PCP anycast 192.0.0.9 is globally reachable", input: "http://192.0.0.9/", check: (r) => r.category === "public" && r.specialBlock?.name === "Port Control Protocol Anycast" && r.specialBlock?.globallyReachable === true }, // the registry's more specific row wins
  { name: "AWS IMDSv6, expanded spelling", input: "http://[fd00:0ec2:0:0:0:0:0:254]/", check: (r) => r.category === "cloud-metadata" && r.canonicalIp === "fd00:ec2::254" }, // any spelling of the IMDSv6 address
  { name: "0x00fc is not ULA", input: "http://[fc::1]/", check: (r) => r.category !== "private" }, // fc::1 is 00fc::1, outside fc00::/7 (the old text test matched it)

  // --- 2026-10-19b (PRIME: "adopt the fullest, most complete, most accurate options") ---
  // Expected names, RFC columns and Globally Reachable values are the IANA CSVs read 2026-10-19
  // (registries updated 2025-10-09); embeddings follow RFC 4291 section 2.5.5.1 and RFC 4380 section 4.
  // The Example button (D-83) loads this first vector's input verbatim (SsrfUrlClassifierTool.tsx).
  { name: "decimal-encoded metadata URL (the Example button)", input: "http://2852039166/latest/meta-data/", check: (r) => r.category === "cloud-metadata" && r.risk === "high" && r.canonicalIp === "169.254.169.254" && r.obfuscationForm === "decimal" && r.path === "/latest/meta-data/" && r.specialBlock?.prefix === "169.254.0.0/16" && r.anycastService === false }, // 169*2^24 + 254*2^16 + 169*2^8 + 254
  // IPv4 registry: one vector per row the 2026-10-19 vectors did not already pin by name.
  { name: "IPv4 row 0.0.0.0/32", input: "http://0.0.0.0/", check: (r) => r.category === "reserved" && r.risk === "high" && r.specialBlock?.prefix === "0.0.0.0/32" && r.specialBlock?.name === '"This host on this network"' && r.specialBlock?.rfc === "RFC 1122, Section 3.2.1.3" && r.specialBlock?.globallyReachable === false }, // most specific row beats 0.0.0.0/8
  { name: "IPv4 row 0.0.0.0/8", input: "http://0.1.2.3/", check: (r) => r.category === "reserved" && r.specialBlock?.prefix === "0.0.0.0/8" && r.specialBlock?.name === '"This network"' && r.specialBlock?.rfc === "RFC 791, Section 3.2" }, // "this" network
  { name: "IPv4 row 10.0.0.0/8", input: "http://10.255.255.254/", check: (r) => r.category === "private" && r.specialBlock?.prefix === "10.0.0.0/8" && r.specialBlock?.name === "Private-Use" && r.specialBlock?.rfc === "RFC 1918" }, // RFC 1918
  { name: "IPv4 row 100.64.0.0/10", input: "http://100.127.255.254/", check: (r) => r.category === "cgnat" && r.risk === "medium" && r.specialBlock?.prefix === "100.64.0.0/10" && r.specialBlock?.name === "Shared Address Space" }, // last host of the /10
  { name: "IPv4 row 127.0.0.0/8", input: "http://127.255.255.254/", check: (r) => r.category === "loopback" && r.specialBlock?.prefix === "127.0.0.0/8" && r.specialBlock?.name === "Loopback" }, // anywhere in the /8
  { name: "IPv4 row 169.254.0.0/16", input: "http://169.254.0.1/", check: (r) => r.category === "link-local" && r.specialBlock?.prefix === "169.254.0.0/16" && r.specialBlock?.name === "Link Local" && r.specialBlock?.rfc === "RFC 3927" }, // link-local
  { name: "IPv4 row 172.16.0.0/12", input: "http://172.31.255.254/", check: (r) => r.category === "private" && r.specialBlock?.prefix === "172.16.0.0/12" && r.specialBlock?.name === "Private-Use" }, // last host of the /12
  { name: "IPv4 row 192.0.0.0/24 covering block", input: "http://192.0.0.200/", check: (r) => r.category === "reserved" && r.specialBlock?.prefix === "192.0.0.0/24" && r.specialBlock?.name === "IETF Protocol Assignments" && r.specialBlock?.rfc === "RFC 6890, Section 2.1" }, // no more specific row
  { name: "IPv4 row 192.0.0.8/32", input: "http://192.0.0.8/", check: (r) => r.category === "reserved" && r.specialBlock?.prefix === "192.0.0.8/32" && r.specialBlock?.name === "IPv4 dummy address" && r.specialBlock?.rfc === "RFC 7600" }, // dummy address
  { name: "IPv4 row 192.0.0.10/32, TURN anycast", input: "http://192.0.0.10/", check: (r) => r.category === "public" && r.risk === "low" && r.anycastService === true && r.specialBlock?.prefix === "192.0.0.10/32" && r.specialBlock?.name === "Traversal Using Relays around NAT Anycast" && r.specialBlock?.rfc === "RFC 8155" && r.specialBlock?.globallyReachable === true }, // anycast service, named
  { name: "PCP anycast 192.0.0.9, decimal, flagged as anycast service", input: "http://3221225481/", check: (r) => r.category === "public" && r.canonicalIp === "192.0.0.9" && r.obfuscationForm === "decimal" && r.anycastService === true && r.specialBlock?.rfc === "RFC 7723" }, // 3221225472 + 9
  { name: "IPv4 row 192.0.2.0/24", input: "http://192.0.2.254/", check: (r) => r.category === "reserved" && r.specialBlock?.prefix === "192.0.2.0/24" && r.specialBlock?.name === "Documentation (TEST-NET-1)" && r.specialBlock?.rfc === "RFC 5737" }, // TEST-NET-1
  { name: "IPv4 row 192.31.196.0/24, AS112-v4", input: "http://192.31.196.1/", check: (r) => r.category === "public" && r.risk === "low" && r.anycastService === false && r.specialBlock?.prefix === "192.31.196.0/24" && r.specialBlock?.name === "AS112-v4" && r.specialBlock?.rfc === "RFC 7535" && r.specialBlock?.globallyReachable === true }, // globally reachable, named
  { name: "IPv4 row 192.52.193.0/24, AMT", input: "http://192.52.193.1/", check: (r) => r.category === "public" && r.specialBlock?.prefix === "192.52.193.0/24" && r.specialBlock?.name === "AMT" && r.specialBlock?.rfc === "RFC 7450" && r.specialBlock?.globallyReachable === true }, // globally reachable, named
  { name: "IPv4 row 192.88.99.0/24, deprecated 6to4 relay anycast", input: "http://192.88.99.1/", check: (r) => r.category === "reserved" && r.risk === "high" && r.anycastService === false && r.specialBlock?.prefix === "192.88.99.0/24" && r.specialBlock?.name === "Deprecated (6to4 Relay Anycast)" && r.specialBlock?.rfc === "RFC 7526" && r.specialBlock?.globallyReachable === null }, // booleans removed by RFC 7526 section 7
  { name: "IPv4 row 192.88.99.2/32, 6a44-relay anycast", input: "http://192.88.99.2/", check: (r) => r.category === "reserved" && r.anycastService === true && r.specialBlock?.prefix === "192.88.99.2/32" && r.specialBlock?.name === "6a44-relay anycast address" && r.specialBlock?.rfc === "RFC 6751" && r.specialBlock?.globallyReachable === false }, // more specific than the deprecated /24
  { name: "IPv4 row 192.168.0.0/16", input: "http://192.168.255.254/", check: (r) => r.category === "private" && r.specialBlock?.prefix === "192.168.0.0/16" && r.specialBlock?.name === "Private-Use" }, // RFC 1918
  { name: "IPv4 row 192.175.48.0/24, AS112 direct delegation", input: "http://192.175.48.6/", check: (r) => r.category === "public" && r.specialBlock?.prefix === "192.175.48.0/24" && r.specialBlock?.name === "Direct Delegation AS112 Service" && r.specialBlock?.rfc === "RFC 7534" && r.specialBlock?.globallyReachable === true }, // BLACKHOLE-1.IANA.ORG
  { name: "IPv4 row 198.18.0.0/15", input: "http://198.19.255.254/", check: (r) => r.category === "reserved" && r.specialBlock?.prefix === "198.18.0.0/15" && r.specialBlock?.name === "Benchmarking" && r.specialBlock?.rfc === "RFC 2544" }, // last host of the /15
  { name: "IPv4 row 198.51.100.0/24", input: "http://198.51.100.7/", check: (r) => r.category === "reserved" && r.specialBlock?.prefix === "198.51.100.0/24" && r.specialBlock?.name === "Documentation (TEST-NET-2)" }, // TEST-NET-2
  { name: "IPv4 row 203.0.113.0/24", input: "http://203.0.113.9/", check: (r) => r.category === "reserved" && r.specialBlock?.prefix === "203.0.113.0/24" && r.specialBlock?.name === "Documentation (TEST-NET-3)" }, // TEST-NET-3
  { name: "IPv4 row 240.0.0.0/4", input: "http://240.0.0.1/", check: (r) => r.category === "reserved" && r.specialBlock?.prefix === "240.0.0.0/4" && r.specialBlock?.name === "Reserved" && r.specialBlock?.rfc === "RFC 1112, Section 4" }, // future use
  { name: "IPv4 row 255.255.255.255/32", input: "http://255.255.255.255/", check: (r) => r.category === "reserved" && r.specialBlock?.prefix === "255.255.255.255/32" && r.specialBlock?.name === "Limited Broadcast" && r.specialBlock?.rfc === "RFC 8190; RFC 919, Section 7" }, // beats 240.0.0.0/4
  { name: "Alibaba metadata keeps its Shared Address Space row", input: "http://100.100.100.200/latest/meta-data/", check: (r) => r.category === "cloud-metadata" && r.specialBlock?.prefix === "100.64.0.0/10" }, // metadata outranks the row's own category
  // IPv6 registry: one vector per row the 2026-10-19 vectors did not already pin by name, plus edges.
  { name: "IPv6 row ::/128", input: "http://[::]/", check: (r) => r.category === "reserved" && r.canonicalIp === "::" && r.specialBlock?.prefix === "::/128" && r.specialBlock?.name === "Unspecified Address" && r.embedding === null }, // unspecified
  { name: "IPv6 row 100:0:0:1::/64, dummy prefix", input: "http://[100:0:0:1::1]/", check: (r) => r.category === "reserved" && r.risk === "high" && r.canonicalIp === "100:0:0:1::1" && r.specialBlock?.prefix === "100:0:0:1::/64" && r.specialBlock?.name === "Dummy IPv6 Prefix" && r.specialBlock?.rfc === "RFC 9780" && r.specialBlock?.globallyReachable === false }, // RFC 9780
  { name: "IPv6 row 2001::/23 covering block", input: "http://[2001:5::1]/", check: (r) => r.category === "reserved" && r.specialBlock?.prefix === "2001::/23" && r.specialBlock?.name === "IETF Protocol Assignments" && r.specialBlock?.rfc === "RFC 2928" && r.specialBlock?.globallyReachable === false }, // footnote [1]
  { name: "IPv6 row 2001:1::1/128, PCP anycast", input: "http://[2001:1::1]/", check: (r) => r.category === "public" && r.risk === "low" && r.anycastService === true && r.specialBlock?.prefix === "2001:1::1/128" && r.specialBlock?.name === "Port Control Protocol Anycast" && r.specialBlock?.rfc === "RFC 7723" && r.specialBlock?.globallyReachable === true }, // anycast service, named
  { name: "IPv6 row 2001:1::2/128, TURN anycast", input: "http://[2001:1::2]/", check: (r) => r.category === "public" && r.anycastService === true && r.specialBlock?.prefix === "2001:1::2/128" && r.specialBlock?.name === "Traversal Using Relays around NAT Anycast" && r.specialBlock?.rfc === "RFC 8155" }, // anycast service, named
  { name: "IPv6 row 2001:1::3/128, DNS-SD SRP anycast", input: "http://[2001:0001:0000:0000:0000:0000:0000:0003]/", check: (r) => r.category === "public" && r.anycastService === true && r.canonicalIp === "2001:1::3" && r.specialBlock?.prefix === "2001:1::3/128" && r.specialBlock?.name === "DNS-SD Service Registration Protocol Anycast" && r.specialBlock?.rfc === "RFC 9665" }, // full spelling, same rating
  { name: "2001:1::4 is not an anycast row", input: "http://[2001:1::4]/", check: (r) => r.category === "reserved" && r.anycastService === false && r.specialBlock?.prefix === "2001::/23" }, // the /23 decides
  { name: "IPv6 row 2001:2::/48, benchmarking", input: "http://[2001:2::1]/", check: (r) => r.category === "reserved" && r.specialBlock?.prefix === "2001:2::/48" && r.specialBlock?.name === "Benchmarking" && r.specialBlock?.rfc === "RFC 5180; RFC Errata 1752" }, // erratum 1752 prefix
  { name: "2001:2:1::1 is outside the benchmarking /48", input: "http://[2001:2:1::1]/", check: (r) => r.category === "reserved" && r.specialBlock?.prefix === "2001::/23" }, // edge of the /48
  { name: "IPv6 row 2001:3::/32, AMT", input: "http://[2001:3::1]/", check: (r) => r.category === "public" && r.specialBlock?.prefix === "2001:3::/32" && r.specialBlock?.name === "AMT" && r.specialBlock?.globallyReachable === true }, // globally reachable, named
  { name: "IPv6 row 2001:4:112::/48, AS112-v6", input: "http://[2001:4:112::1]/", check: (r) => r.category === "public" && r.specialBlock?.prefix === "2001:4:112::/48" && r.specialBlock?.name === "AS112-v6" && r.specialBlock?.rfc === "RFC 7535" }, // BLACKHOLE.AS112.ARPA
  { name: "IPv6 row 2001:10::/28, deprecated ORCHID", input: "http://[2001:10::1]/", check: (r) => r.category === "reserved" && r.specialBlock?.prefix === "2001:10::/28" && r.specialBlock?.name === "Deprecated (previously ORCHID)" && r.specialBlock?.rfc === "RFC 4843" && r.specialBlock?.globallyReachable === null }, // no flags of its own
  { name: "IPv6 row 2001:20::/28, ORCHIDv2", input: "http://[2001:20::1]/", check: (r) => r.category === "public" && r.specialBlock?.prefix === "2001:20::/28" && r.specialBlock?.name === "ORCHIDv2" && r.specialBlock?.rfc === "RFC 7343" && r.specialBlock?.globallyReachable === true }, // globally reachable per the registry
  { name: "IPv6 row 2001:30::/28, DRIP DETs", input: "http://[2001:30::1]/", check: (r) => r.category === "public" && r.specialBlock?.prefix === "2001:30::/28" && r.specialBlock?.name === "Drone Remote ID Protocol Entity Tags (DETs) Prefix" && r.specialBlock?.rfc === "RFC 9374" }, // globally reachable per the registry
  { name: "2001:200::1 is outside 2001::/23", input: "http://[2001:200::1]/", check: (r) => r.category === "public" && r.specialBlock === null }, // first address past the /23
  { name: "IPv6 row 2620:4f:8000::/48, AS112 direct delegation", input: "http://[2620:4f:8000::6]/", check: (r) => r.category === "public" && r.specialBlock?.prefix === "2620:4f:8000::/48" && r.specialBlock?.name === "Direct Delegation AS112 Service" && r.specialBlock?.rfc === "RFC 7534" }, // BLACKHOLE-1.IANA.ORG
  { name: "IPv6 row 5f00::/16, SRv6 SIDs", input: "http://[5f00::1]/", check: (r) => r.category === "reserved" && r.risk === "high" && r.specialBlock?.prefix === "5f00::/16" && r.specialBlock?.name === "Segment Routing (SRv6) SIDs" && r.specialBlock?.rfc === "RFC 9602" && r.specialBlock?.globallyReachable === false }, // RFC 9602
  { name: "5eff::1 is outside 5f00::/16", input: "http://[5eff::1]/", check: (r) => r.category === "public" && r.specialBlock === null }, // just below the /16
  { name: "IPv6 row fc00::/7 named", input: "http://[fd12:3456::1]/", check: (r) => r.category === "private" && r.specialBlock?.prefix === "fc00::/7" && r.specialBlock?.name === "Unique-Local" && r.specialBlock?.rfc === "RFC 4193; RFC 8190" }, // ULA
  { name: "IPv6 row fe80::/10 named, last /10 piece", input: "http://[febf::1]/", check: (r) => r.category === "link-local" && r.specialBlock?.prefix === "fe80::/10" && r.specialBlock?.name === "Link-Local Unicast" }, // febf is still inside fe80::/10
  { name: "AWS IMDSv6 keeps its Unique-Local row", input: "http://[fd00:ec2::254]/latest/meta-data/", check: (r) => r.category === "cloud-metadata" && r.specialBlock?.prefix === "fc00::/7" }, // metadata outranks the row's own category
  // IPv4-compatible ::a.b.c.d (RFC 4291 section 2.5.5.1, deprecated): rated by the carried address.
  { name: "IPv4-compatible loopback, mixed form", input: "http://[::127.0.0.1]/", check: (r) => r.category === "loopback" && r.risk === "high" && r.canonicalIp === "::127.0.0.1" && r.embedding === "ipv4-compatible" && r.embeddedIpv4 === "127.0.0.1" && r.specialBlock === null && r.embeddedSpecialBlock?.prefix === "127.0.0.0/8" }, // was public/low
  { name: "IPv4-compatible loopback, hex tail", input: "http://[::7f00:1]/", check: (r) => r.category === "loopback" && r.canonicalIp === "::127.0.0.1" && r.embedding === "ipv4-compatible" }, // same address
  { name: "IPv4-compatible metadata", input: "http://[::a9fe:a9fe]/", check: (r) => r.category === "cloud-metadata" && r.embeddedIpv4 === "169.254.169.254" && r.embedding === "ipv4-compatible" }, // the IMDS address
  { name: "IPv4-compatible public, deprecation said", input: "http://[::8.8.8.8]/", check: (r) => r.category === "public" && r.risk === "low" && r.embedding === "ipv4-compatible" && r.reasons.some((x) => x.includes('"is now deprecated"')) }, // rated by what it carries, deprecation named
  { name: "IPv4-compatible ::2 carries 0.0.0.2", input: "http://[::2]/", check: (r) => r.category === "reserved" && r.canonicalIp === "::0.0.0.2" && r.embeddedSpecialBlock?.prefix === "0.0.0.0/8" }, // not :: or ::1
  // Teredo 2001::/32 (RFC 4380 section 4; RFC 5991): server bits 32-63, client XOR 0xFFFFFFFF in bits 96-127.
  { name: "Teredo, client carries loopback", input: "http://[2001:0:808:808:0:feae:80ff:fffe]/", check: (r) => r.category === "loopback" && r.risk === "high" && r.embedding === "teredo" && r.embeddedIpv4 === "127.0.0.1" && r.teredo?.serverIpv4 === "8.8.8.8" && r.teredo?.clientIpv4 === "127.0.0.1" && r.teredo?.clientPort === 337 && r.teredo?.flags === 0 && r.specialBlock?.prefix === "2001::/32" && r.specialBlock?.name === "TEREDO" && r.specialBlock?.globallyReachable === null }, // 0x7f000001 XOR 0xffffffff = 0x80fffffe
  { name: "Teredo, server is the metadata address", input: "http://[2001:0:a9fe:a9fe:8000:feae:fefd:fcfb]/", check: (r) => r.category === "cloud-metadata" && r.embeddedIpv4 === "169.254.169.254" && r.teredo?.serverIpv4 === "169.254.169.254" && r.teredo?.clientIpv4 === "1.2.3.4" && r.teredo?.flags === 0x8000 && r.embeddedSpecialBlock?.prefix === "169.254.0.0/16" }, // cone bit set
  { name: "Teredo, RFC 4380 obfuscation example, both public", input: "http://[2001:0:808:808:0:feae:fefd:fcfb]/", check: (r) => r.category === "public" && r.risk === "low" && r.embeddedIpv4 === "8.8.8.8" && r.teredo?.clientIpv4 === "1.2.3.4" && r.teredo?.clientPort === 337 }, // RFC 4380: port 337 and 1.2.3.4 obfuscate to FEAE FEFDFCFB; the server wins the tie
  { name: "Teredo, both internal, the more internal decides", input: "http://[2001:0:a00:1:0:feae:80ff:fffe]/", check: (r) => r.category === "loopback" && r.embeddedIpv4 === "127.0.0.1" && r.teredo?.serverIpv4 === "10.0.0.1" && r.reasons.some((x) => x.startsWith("the server address is internal-looking too")) }, // both shown
  // Embeddings carry the inner address's registry row and anycast flag.
  { name: "IPv4-mapped carries its inner registry row", input: "http://[::ffff:10.0.0.1]/", check: (r) => r.category === "private" && r.specialBlock?.prefix === "::ffff:0:0/96" && r.embeddedSpecialBlock?.prefix === "10.0.0.0/8" && r.embeddedSpecialBlock?.name === "Private-Use" }, // both rows
  { name: "NAT64 WKP carrying the PCP anycast address", input: "http://[64:ff9b::192.0.0.9]/", check: (r) => r.category === "public" && r.anycastService === true && r.embeddedSpecialBlock?.name === "Port Control Protocol Anycast" && r.specialBlock?.prefix === "64:ff9b::/96" }, // the anycast service is named through the embedding
];

export interface VectorReport {
  setId: string;
  passed: number;
  failed: number;
  failures: string[];
}

export function verifyVectors(): VectorReport {
  const failures: string[] = [];
  let passed = 0;
  for (const v of VECTORS) {
    let ok = false;
    try {
      ok = v.check(classifyUrl(v.input));
    } catch (e) {
      ok = false;
      failures.push(`${v.name}: threw ${(e as Error).message}`);
      continue;
    }
    if (ok) passed++;
    else failures.push(v.name);
  }
  return { setId: SET_ID, passed, failed: VECTORS.length - passed, failures };
}
