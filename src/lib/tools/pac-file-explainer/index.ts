// ============================================================================
// src/lib/tools/pac-file-explainer/index.ts
// ----------------------------------------------------------------------------
// PAC FILE EXPLAINER + VALIDATOR.
// A {manifest, run, vectors} triple. Paste a Proxy Auto-Config file and it
// reads back the proxy directives, the PAC helper functions (with the
// DNS-consulting ones flagged), a set of structural and correctness lints, and
// recognition of a Netskope Cloud Explicit Proxy steering file.
//
// Pure and deterministic (D-49). CRITICAL: it NEVER evaluates the PAC
// JavaScript; it is a lexical and structural reader only. It never runs the
// function, never opens a socket, never fetches. Clean-room from the MDN PAC
// reference and the Netskope Explicit Proxy documentation.
// ============================================================================

import { run } from "./compute";
import { SET_ID, verifyVectors } from "./golden-vectors";

export { run } from "./compute";
export type {
  PacResult, PacMode, PacStructure, PacDirective, PacDirectivePart,
  PacHelper, PacLint, ToolRunResult,
} from "./compute";
export { SET_ID, VECTORS, verifyVectors } from "./golden-vectors";
export type { PacVector } from "./golden-vectors";

/** The D-49 declarative manifest for the pac-file-explainer tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Netskope SSE / SASE",
  toolSlug: "pac-file-explainer",
  canonicalAliases: [
    "pac-explainer",
    "pac-validator",
    "findproxyforurl",
    "proxy-auto-config",
    "wpad-pac",
    "pac-parser",
  ],
  inputDetectors: [
    {
      // The PAC entry point is unmistakable.
      kind: "regex",
      pattern: "FindProxyForURL\\s*\\(",
      priority: 9,
      example: "function FindProxyForURL(url, host) { return \"DIRECT\"; }",
    },
    {
      // A Netskope explicit-proxy steering file.
      kind: "regex",
      pattern: "eproxy-|goskope\\.com",
      priority: 7,
      example: "return \"PROXY eproxy-acme.goskope.com:8081\";",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  goldenVectors: SET_ID,
  // The most important guarantee here: the PAC JS is never executed.
  dangerousInputHandling: ["never-evaluates", "bounded-parse", "never-fetches", "never-connects"],
  // A PAC can carry internal hostnames / a tenant id -> shareable fragment.
  shareSafetyDefault: "fragment",

  learnLinks: [
    "learn/how-a-pac-file-chooses-a-proxy",
  ],
  sources: [
    { id: "mdn-pac", label: "MDN Web Docs: Proxy Auto-Configuration (PAC) file (FindProxyForURL entry point; return-string grammar DIRECT/PROXY/SOCKS/HTTP/HTTPS with semicolon failover; helper functions; the DNS-consulting caveat for isInNet/isResolvable/dnsResolve; shExpMatch is shell-glob; https:// path stripping)", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Proxy_servers_and_tunneling/Proxy_Auto-Configuration_PAC_file" },
    { id: "wikipedia-pac", label: "Wikipedia: Proxy auto-config (PAC format history; the Microsoft IPv6 *Ex helper extensions; browser support notes)", url: "https://en.wikipedia.org/wiki/Proxy_auto-config" },
    { id: "netskope-explicit-proxy", label: "Netskope Knowledge Portal: Cloud Explicit Proxy (steering via a PAC to eproxy-<tenant>.goskope.com on port 8081; DIRECT bypasses for identity-provider hosts; cookie surrogates; root CA trust for TLS inspection)", url: "https://docs.netskope.com/en/explicit-proxy" },
  ],
});

/** Tool entry point. Deterministic; delegates to the pure engine. */
export { run as runTool };

export const __selftest = verifyVectors;
