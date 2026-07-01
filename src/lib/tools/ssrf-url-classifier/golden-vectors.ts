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

export const SET_ID = "ssrf-url-classifier/2026-07-01";

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
