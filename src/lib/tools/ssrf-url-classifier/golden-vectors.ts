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
export const SET_ID = "ssrf-url-classifier/2026-10-19"; // the dated set id the manifest points at

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
