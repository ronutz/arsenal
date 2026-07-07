// ============================================================================
// src/lib/tools/pac-file-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the PAC file explainer. Each vector pins an input to
// invariant parts of the parsed output, so a regression in the engine is caught
// by the build-time gate (verifyVectors, run by __selftest).
//
// The generic PAC inputs are the canonical examples from the MDN PAC reference
// (Example 1: isPlainHostName / dnsDomainIs -> DIRECT, else PROXY ...; DIRECT).
// The Netskope input follows the documented Cloud Explicit Proxy steering
// template (goskope.com explicit-proxy host on port 8081, DIRECT bypasses).
// Every vector is parsed lexically; the engine never evaluates the JavaScript.
// ============================================================================

import { run, type PacMode } from "./compute";

export const SET_ID = "pac-file-explainer/golden@1";

export interface PacVector {
  readonly name: string;
  readonly input: string;
  readonly mode: PacMode;
  /** Whether the structural entry point must be reported present. */
  readonly hasEntryPoint?: boolean;
  /** Whether Netskope recognition must fire. */
  readonly netskope?: boolean;
  /** A substring that must appear in some directive part endpoint. */
  readonly directiveEndpointIncludes?: string;
  /** A directive keyword that must appear in some parsed return string. */
  readonly directiveKeyword?: string;
  /** A helper that must be present in the census. */
  readonly helperName?: string;
  /** If set, that helper must be flagged as DNS-consulting (true/false). */
  readonly helperDnsConsulting?: boolean;
  /** A lint kind that must appear at least once. */
  readonly lintKind?: "info" | "good" | "warn" | "error";
  /** A substring that must appear in some lint text. */
  readonly lintIncludes?: string;
}

// The documented Netskope Cloud Explicit Proxy steering template.
const NETSKOPE_PAC = `function FindProxyForURL(url, host) {
  url = url.toLowerCase();
  host = host.toLowerCase();
  if (isPlainHostName(host)) {
    return "DIRECT";
  }
  if (shExpMatch(host, "*.login.microsoftonline.com")) {
    return "DIRECT";
  }
  if (url.substring(0, 5) == "http:" || url.substring(0, 6) == "https:") {
    return "PROXY eproxy-acme.goskope.com:8081";
  }
  return "DIRECT";
}`;

// MDN Example 1: proxy for everything except local hosts, with DIRECT fallback.
const MDN_EX1 = `function FindProxyForURL(url, host) {
  if (isPlainHostName(host) || dnsDomainIs(host, ".mozilla.org")) {
    return "DIRECT";
  }
  return "PROXY w3proxy.mozilla.org:8080; DIRECT";
}`;

// A file missing the entry point (a common paste mistake).
const NO_ENTRY = `function ChooseProxy(u, h) {
  if (isInNet(h, "10.0.0.0", "255.0.0.0")) {
    return "PROXY p.example.com:8080";
  }
}`;

// A DNS-heavy file (isResolvable + dnsResolve).
const DNS_HEAVY = `function FindProxyForURL(url, host) {
  if (isResolvable(host)) {
    return "DIRECT";
  }
  var ip = dnsResolve(host);
  return "PROXY proxy.example.com:8080; DIRECT";
}`;

// A file with a typo'd directive keyword inside a real return string.
const TYPO_KW = `function FindProxyForURL(url, host) {
  return "PROXY p.example.com:8080; SCOKS s.example.com:1080; DIRECT";
}`;

export const VECTORS: readonly PacVector[] = [
  {
    name: "empty input returns the reference",
    input: "",
    mode: "reference",
  },
  {
    name: "Netskope template is recognized, on port 8081",
    input: NETSKOPE_PAC,
    mode: "parse",
    hasEntryPoint: true,
    netskope: true,
    directiveEndpointIncludes: "goskope.com:8081",
    lintKind: "good",
  },
  {
    name: "MDN example 1 parses DIRECT and the proxy, with isPlainHostName",
    input: MDN_EX1,
    mode: "parse",
    hasEntryPoint: true,
    directiveKeyword: "PROXY",
    helperName: "isPlainHostName",
  },
  {
    name: "missing FindProxyForURL is an error",
    input: NO_ENTRY,
    mode: "parse",
    hasEntryPoint: false,
    lintKind: "error",
  },
  {
    name: "DNS-consulting helpers are flagged",
    input: DNS_HEAVY,
    mode: "parse",
    helperName: "dnsResolve",
    helperDnsConsulting: true,
    lintIncludes: "DNS-consulting",
  },
  {
    name: "typo'd directive keyword inside a return string is flagged",
    input: TYPO_KW,
    mode: "parse",
    directiveKeyword: "PROXY",
    lintIncludes: "not a PAC directive keyword",
  },
];

/** Run all vectors; throw on the first mismatch. Invoked by __selftest. */
export function verifyVectors(): void {
  for (const v of VECTORS) {
    const { result } = run(v.input);

    if (result.mode !== v.mode) {
      throw new Error(`[${SET_ID}] ${v.name}: mode ${result.mode} != ${v.mode}`);
    }

    if (v.hasEntryPoint !== undefined && result.structure.hasEntryPoint !== v.hasEntryPoint) {
      throw new Error(`[${SET_ID}] ${v.name}: hasEntryPoint ${result.structure.hasEntryPoint} != ${v.hasEntryPoint}`);
    }

    if (v.netskope !== undefined && result.netskope !== v.netskope) {
      throw new Error(`[${SET_ID}] ${v.name}: netskope ${result.netskope} != ${v.netskope}`);
    }

    if (v.directiveEndpointIncludes) {
      const hit = result.directives.some((d) => d.parts.some((p) => (p.endpoint ?? "").includes(v.directiveEndpointIncludes!)));
      if (!hit) throw new Error(`[${SET_ID}] ${v.name}: no directive endpoint includes "${v.directiveEndpointIncludes}"`);
    }

    if (v.directiveKeyword) {
      const hit = result.directives.some((d) => d.parts.some((p) => p.keyword === v.directiveKeyword));
      if (!hit) throw new Error(`[${SET_ID}] ${v.name}: no directive part with keyword "${v.directiveKeyword}"`);
    }

    if (v.helperName) {
      const h = result.helpers.find((x) => x.name === v.helperName);
      if (!h) throw new Error(`[${SET_ID}] ${v.name}: helper "${v.helperName}" not detected`);
      if (v.helperDnsConsulting !== undefined && h.dnsConsulting !== v.helperDnsConsulting) {
        throw new Error(`[${SET_ID}] ${v.name}: helper "${v.helperName}" dnsConsulting ${h.dnsConsulting} != ${v.helperDnsConsulting}`);
      }
    }

    if (v.lintKind && !result.lints.some((l) => l.kind === v.lintKind)) {
      throw new Error(`[${SET_ID}] ${v.name}: expected a "${v.lintKind}" lint, found none`);
    }

    if (v.lintIncludes && !result.lints.some((l) => l.text.includes(v.lintIncludes!))) {
      throw new Error(`[${SET_ID}] ${v.name}: no lint text includes "${v.lintIncludes}"`);
    }
  }
}
