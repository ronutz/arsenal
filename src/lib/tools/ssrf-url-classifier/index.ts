// ============================================================================
// src/lib/tools/ssrf-url-classifier/index.ts
// ----------------------------------------------------------------------------
// SSRF URL CLASSIFIER - a {manifest, run, vectors} triple. Paste a URL and the
// tool reports where it points (loopback, private, link-local, cloud metadata,
// CGNAT, reserved, or public), decodes the IP-obfuscation tricks that hide an
// internal address from a naive filter, and flags dangerous URL schemes and
// embedded credentials, with an SSRF risk level and plain-language reasons.
//
// It is a deterministic, pure function of the input string. It NEVER resolves
// DNS and NEVER issues the request (D-53): a bare hostname is reported as
// "resolves at runtime", the honest answer for a classifier that does not probe.
// Because it is a cheap, side-effect-free string transform, it is safe to expose
// over the HTTP API (recorded in registry.ts, D-72) as well as in the browser.
// ============================================================================

import { classifyUrl } from "./compute";
import { SET_ID, verifyVectors } from "./golden-vectors";

export { classifyUrl } from "./compute";
export type { HostCategory, RiskLevel, SsrfResult } from "./compute";
export { SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest for the ssrf-url-classifier tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Security & WAF",
  toolSlug: "ssrf-url-classifier",
  canonicalAliases: [
    "ssrf-checker",
    "ssrf-classifier",
    "url-destination-classifier",
    "internal-ip-checker",
    "metadata-endpoint-checker",
    "ip-obfuscation-decoder",
    "url-ssrf-risk",
  ],
  inputDetectors: [
    { kind: "regex", pattern: "^https?://", priority: 2, example: "http://169.254.169.254/latest/meta-data/" },
    { kind: "regex", pattern: "^(file|gopher|dict|ftp|ldap)://", priority: 3, example: "gopher://127.0.0.1:6379/_INFO" },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  // A cheap, deterministic, side-effect-free string transform: safe to expose
  // over the HTTP API as well as in the browser (recorded in registry.ts, D-72).
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: SET_ID,
  // The defining safety property: the classifier decides purely from the string
  // and never touches the network - no DNS, no fetch (D-53).
  dangerousInputHandling: ["never-resolves-dns", "never-fetches"],
  // A URL is not itself a secret, and nothing leaves the browser.
  shareSafetyDefault: "safe",

  // -- Teaching & provenance --
  learnLinks: [
    "learn/what-is-ssrf",
    "learn/private-vs-public-ip-ranges",
    "learn/ip-address-obfuscation-tricks",
    "learn/cloud-metadata-endpoints-and-ssrf",
    "learn/ssrf-defenses-allowlists",
    "learn/dangerous-url-schemes",
  ],
  sources: [
    { id: "rfc1918", label: "RFC 1918 - Address Allocation for Private Internets", url: "https://www.rfc-editor.org/rfc/rfc1918" },
    { id: "rfc3927", label: "RFC 3927 - Dynamic Configuration of IPv4 Link-Local Addresses", url: "https://www.rfc-editor.org/rfc/rfc3927" },
    { id: "rfc6598", label: "RFC 6598 - IANA-Reserved IPv4 Prefix for Shared Address Space (CGNAT)", url: "https://www.rfc-editor.org/rfc/rfc6598" },
    { id: "rfc3986", label: "RFC 3986 - Uniform Resource Identifier (URI): Generic Syntax", url: "https://www.rfc-editor.org/rfc/rfc3986" },
    { id: "owasp-ssrf", label: "OWASP - Server Side Request Forgery Prevention Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html" },
  ],
});

/** Tool entry point. Deterministic given the input URL; delegates to the pure,
 *  network-free classifier. */
export function run(input: string) {
  return classifyUrl(input);
}

// Surface verifyVectors on the manifest namespace for the test harness.
export const __selftest = verifyVectors;
