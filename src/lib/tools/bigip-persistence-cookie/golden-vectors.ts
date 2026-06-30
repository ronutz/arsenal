// ============================================================================
// src/lib/tools/bigip-persistence-cookie/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden + reject vectors for the BIG-IP persistence cookie decoder. The golden
// inputs are the canonical examples from F5 K6917 and the drwetter reference
// implementation, whose decoded values are independently verifiable, plus a
// constructed public-IPv4 and a ULA-IPv6 case to exercise the classifier.
// verifyVectors() runs the set; the build and dev-time check call it.
// ============================================================================

import { decodeBigipCookie, encodeBigipCookie, BigipParseError, BigipEncodeError, type BigipParseErrorCode, type BigipEncodeErrorCode, type BigipFormat } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "bigip-cookie-golden-v1";

interface GoldenExpect {
  format: BigipFormat;
  endpoint?: string;
  address?: string;
  port?: number;
  routeDomain?: number;
  addressType?: "ipv4" | "ipv6";
  isInternal?: boolean;
  cookieName?: string;
  requiredReasons?: string[];
  forbiddenReasons?: string[];
}

export interface BigipGoldenVector {
  id: string;
  description: string;
  input: string;
  expect: GoldenExpect;
}

export interface BigipRejectVector {
  id: string;
  description: string;
  input: string;
  expectCode: BigipParseErrorCode;
}

export const BIGIP_GOLDEN_VECTORS: BigipGoldenVector[] = [
  {
    id: "ipv4-private-80",
    description: "Default IPv4, RFC1918 member, port 80 (the canonical 10.1.1.100:80)",
    input: "1677787402.20480.0000",
    expect: {
      format: "ipv4",
      endpoint: "10.1.1.100:80",
      address: "10.1.1.100",
      port: 80,
      addressType: "ipv4",
      isInternal: true,
      requiredReasons: ["INFO_DISCLOSURE", "INTERNAL_ADDRESS"],
      forbiddenReasons: ["ENCRYPTED", "ROUTE_DOMAIN"],
    },
  },
  {
    id: "ipv4-private-8080",
    description: "Default IPv4, port 8080 (byte-swapped field 36895)",
    input: "1677787402.36895.0000",
    expect: { format: "ipv4", endpoint: "10.1.1.100:8080", port: 8080, isInternal: true },
  },
  {
    id: "ipv4-public-443",
    description: "Default IPv4, public address 203.0.113.5, port 443 (field 47873)",
    input: "91291851.47873.0000",
    expect: {
      format: "ipv4",
      endpoint: "203.0.113.5:443",
      address: "203.0.113.5",
      port: 443,
      isInternal: false,
      requiredReasons: ["INFO_DISCLOSURE"],
      forbiddenReasons: ["INTERNAL_ADDRESS"],
    },
  },
  {
    id: "ipv4-routedomain",
    description: "IPv4 in route domain 5 (rd5o...ffffc0000201o80 -> 192.0.2.1)",
    input: "rd5o00000000000000000000ffffc0000201o80",
    expect: {
      format: "ipv4-routedomain",
      endpoint: "192.0.2.1%5:80",
      address: "192.0.2.1",
      port: 80,
      routeDomain: 5,
      addressType: "ipv4",
      requiredReasons: ["INFO_DISCLOSURE", "ROUTE_DOMAIN"],
    },
  },
  {
    id: "ipv6",
    description: "IPv6 member (vi...0030.20480 -> [2001:112::30]:80)",
    input: "vi20010112000000000000000000000030.20480",
    expect: {
      format: "ipv6",
      endpoint: "[2001:112::30]:80",
      address: "2001:112::30",
      port: 80,
      addressType: "ipv6",
      isInternal: false,
    },
  },
  {
    id: "ipv6-routedomain",
    description: "IPv6 in route domain 3 (rd3o...0030o80)",
    input: "rd3o20010112000000000000000000000030o80",
    expect: {
      format: "ipv6-routedomain",
      endpoint: "[2001:112::30%3]:80",
      address: "2001:112::30",
      port: 80,
      routeDomain: 3,
      addressType: "ipv6",
      requiredReasons: ["INFO_DISCLOSURE", "ROUTE_DOMAIN"],
    },
  },
  {
    id: "ipv6-ula",
    description: "IPv6 ULA member exercises the internal classifier (fd12:.../80)",
    input: "vifd123456789a00010000000000000001.20480",
    expect: {
      format: "ipv6",
      address: "fd12:3456:789a:1::1",
      port: 80,
      addressType: "ipv6",
      isInternal: true,
      requiredReasons: ["INFO_DISCLOSURE", "INTERNAL_ADDRESS"],
    },
  },
  {
    id: "named-cookie",
    description: "A full name=value pair: the pool name is captured, the value decoded",
    input: "BIGipServerWEB=1677787402.20480.0000",
    expect: { format: "ipv4", endpoint: "10.1.1.100:80", cookieName: "BIGipServerWEB" },
  },
  {
    id: "encrypted",
    description: "AES-encrypted cookie cannot be decoded without the key",
    input: "!VPyexJn/769hVyb9FVTnmPYOSADbxpddXoz+VcGjdpv7+MdiHxdFdc7OgVGeKLfKY/RlKPU7JJYcHwA=",
    expect: { format: "encrypted", requiredReasons: ["ENCRYPTED"], forbiddenReasons: ["INFO_DISCLOSURE"] },
  },
];

export const BIGIP_REJECT_VECTORS: BigipRejectVector[] = [
  { id: "empty", description: "Empty input", input: "   ", expectCode: "empty" },
  { id: "garbage", description: "Not a BIG-IP cookie", input: "hello world", expectCode: "unrecognized" },
  { id: "wrong-suffix", description: "Default IPv4 shape but wrong trailing block", input: "1677787402.20480.1111", expectCode: "unrecognized" },
  { id: "short-ipv6", description: "vi prefix but not 32 hex", input: "vi2001.20480", expectCode: "unrecognized" },
  { id: "addr-overflow", description: "Address field exceeds 32 bits", input: "5000000000.20480.0000", expectCode: "unrecognized" },
];

export interface BigipEncodeVector {
  id: string;
  description: string;
  input: { address: string; port: number; routeDomain?: number };
  expectValue: string;
  expectFormat: BigipFormat;
}

export interface BigipEncodeRejectVector {
  id: string;
  description: string;
  input: { address: string; port: number; routeDomain?: number };
  expectCode: BigipEncodeErrorCode;
}

// Encode vectors: the produced value must equal the verified cookie, and
// decoding it must round-trip back to the same address and port.
export const BIGIP_ENCODE_VECTORS: BigipEncodeVector[] = [
  { id: "enc-ipv4", description: "10.1.1.100:80 -> default IPv4 cookie", input: { address: "10.1.1.100", port: 80 }, expectValue: "1677787402.20480.0000", expectFormat: "ipv4" },
  { id: "enc-ipv4-8080", description: "10.1.1.100:8080", input: { address: "10.1.1.100", port: 8080 }, expectValue: "1677787402.36895.0000", expectFormat: "ipv4" },
  { id: "enc-ipv4-public", description: "203.0.113.5:443", input: { address: "203.0.113.5", port: 443 }, expectValue: "91291851.47873.0000", expectFormat: "ipv4" },
  { id: "enc-ipv4-rd", description: "192.0.2.1:80 in route domain 5", input: { address: "192.0.2.1", port: 80, routeDomain: 5 }, expectValue: "rd5o00000000000000000000ffffc0000201o80", expectFormat: "ipv4-routedomain" },
  { id: "enc-ipv6", description: "[2001:112::30]:80", input: { address: "2001:112::30", port: 80 }, expectValue: "vi20010112000000000000000000000030.20480", expectFormat: "ipv6" },
  { id: "enc-ipv6-rd", description: "[2001:112::30]:80 in route domain 3", input: { address: "2001:112::30", port: 80, routeDomain: 3 }, expectValue: "rd3o20010112000000000000000000000030o80", expectFormat: "ipv6-routedomain" },
];

export const BIGIP_ENCODE_REJECT_VECTORS: BigipEncodeRejectVector[] = [
  { id: "enc-bad-addr", description: "Invalid octet", input: { address: "999.1.1.1", port: 80 }, expectCode: "address" },
  { id: "enc-bad-port", description: "Port out of range", input: { address: "10.1.1.1", port: 70000 }, expectCode: "port" },
  { id: "enc-bad-rd", description: "Route domain out of range", input: { address: "10.1.1.1", port: 80, routeDomain: 99999 }, expectCode: "routedomain" },
];

/** Run all vectors. Returns a pass/fail summary with readable failures. */
export function verifyVectors(): { passed: number; failed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;

  for (const v of BIGIP_GOLDEN_VECTORS) {
    try {
      const r = decodeBigipCookie(v.input);
      const e = v.expect;
      const errs: string[] = [];
      const eq = (name: string, got: unknown, want: unknown) => {
        if (want !== undefined && got !== want) errs.push(`${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);
      };
      eq("format", r.format, e.format);
      eq("endpoint", r.endpoint, e.endpoint);
      eq("address", r.address, e.address);
      eq("port", r.port, e.port);
      eq("routeDomain", r.routeDomain, e.routeDomain);
      eq("addressType", r.addressType, e.addressType);
      eq("isInternal", r.isInternal, e.isInternal);
      eq("cookieName", r.cookieName, e.cookieName);
      const codes = new Set(r.reasons.map((x) => x.code));
      for (const code of e.requiredReasons ?? []) if (!codes.has(code)) errs.push(`missing reason ${code}`);
      for (const code of e.forbiddenReasons ?? []) if (codes.has(code)) errs.push(`unexpected reason ${code}`);
      if (errs.length) failures.push(`[${v.id}] ${errs.join("; ")}`);
      else passed++;
    } catch (err) {
      failures.push(`[${v.id}] threw ${err instanceof BigipParseError ? err.code : String(err)}`);
    }
  }

  for (const v of BIGIP_REJECT_VECTORS) {
    try {
      decodeBigipCookie(v.input);
      failures.push(`[${v.id}] expected reject ${v.expectCode} but decoded`);
    } catch (err) {
      if (err instanceof BigipParseError && err.code === v.expectCode) passed++;
      else failures.push(`[${v.id}] got ${err instanceof BigipParseError ? err.code : String(err)} want ${v.expectCode}`);
    }
  }

  for (const v of BIGIP_ENCODE_VECTORS) {
    try {
      const r = encodeBigipCookie(v.input);
      const errs: string[] = [];
      if (r.value !== v.expectValue) errs.push(`value: got ${r.value} want ${v.expectValue}`);
      if (r.format !== v.expectFormat) errs.push(`format: got ${r.format} want ${v.expectFormat}`);
      // round-trip: decoding the produced value must recover address + port
      try {
        const d = decodeBigipCookie(r.value);
        if (d.port !== v.input.port) errs.push(`round-trip port: got ${d.port} want ${v.input.port}`);
        if (v.input.routeDomain && d.routeDomain !== v.input.routeDomain) errs.push(`round-trip rd: got ${d.routeDomain} want ${v.input.routeDomain}`);
      } catch (err) {
        errs.push(`round-trip threw ${err instanceof BigipParseError ? err.code : String(err)}`);
      }
      if (errs.length) failures.push(`[${v.id}] ${errs.join("; ")}`);
      else passed++;
    } catch (err) {
      failures.push(`[${v.id}] encode threw ${err instanceof BigipEncodeError ? err.code : String(err)}`);
    }
  }

  for (const v of BIGIP_ENCODE_REJECT_VECTORS) {
    try {
      encodeBigipCookie(v.input);
      failures.push(`[${v.id}] expected encode reject ${v.expectCode} but succeeded`);
    } catch (err) {
      if (err instanceof BigipEncodeError && err.code === v.expectCode) passed++;
      else failures.push(`[${v.id}] got ${err instanceof BigipEncodeError ? err.code : String(err)} want ${v.expectCode}`);
    }
  }

  return { passed, failed: failures.length, failures };
}
