// ============================================================================
// src/lib/tools/iquery-protocol-explainer/index.ts
// ----------------------------------------------------------------------------
// F5 BIG-IP DNS (GTM) iQUERY PROTOCOL EXPLAINER + iqdump/log DECODER.
// A {manifest, run, vectors} triple. Paste iqdump output or /var/log/gtm lines
// to decode them field by field, or ask for a topic (mesh, port 4353, trust,
// iqdump, metrics, gtmd, big3d, vlan) to have the iQuery architecture explained
// in F5's own terms.
//
// Pure and deterministic (D-49): a model of the iQuery protocol and its
// tooling, never a probe. It never opens a socket, never runs iqdump, never
// fetches. It reads the shape of iqdump/log text; it is not a full protocol
// validator.
// ============================================================================

import { run } from "./compute";
import { SET_ID, verifyVectors } from "./golden-vectors";

export { run, TOPICS } from "./compute";
export type {
  IqueryResult, IqueryMode, DecodedField, IqueryNote, TopicInfo, TopicId, ToolRunResult,
} from "./compute";
export { SET_ID, VECTORS, verifyVectors } from "./golden-vectors";
export type { IqueryVector } from "./golden-vectors";

/** The D-49 declarative manifest for the iquery-protocol-explainer tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "F5 GTM, AFM & APM",
  toolSlug: "iquery-protocol-explainer",
  canonicalAliases: [
    "iquery-explainer",
    "iquery-protocol",
    "iqdump-decoder",
    "gtm-iquery",
    "bigip-dns-iquery",
    "big3d-explainer",
  ],
  inputDetectors: [
    {
      // Real iqdump output: the big3d peer header comment is unmistakable.
      kind: "regex",
      pattern: "<!--\\s*Connected to big3d at",
      priority: 9,
      example: "<!-- Connected to big3d at: ::ffff:10.10.10.10:4353 -->",
    },
    {
      // The iQuery connection stanza.
      kind: "regex",
      pattern: "<xml_connection>",
      priority: 8,
      example: "<xml_connection>\n<version>16.1.3.3</version>",
    },
    {
      // A /var/log/gtm iQuery state-change line.
      kind: "regex",
      pattern: "SNMP_TRAP:\\s*Box\\b",
      priority: 7,
      example: "SNMP_TRAP: Box 10.14.20.209 state change green --> red",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  goldenVectors: SET_ID,
  dangerousInputHandling: ["bounded-parse", "never-evaluates", "never-fetches", "never-connects"],
  // iqdump output can carry internal hostnames / self IPs -> shareable fragment.
  shareSafetyDefault: "fragment",

  learnLinks: [
    "learn/gtm-load-balancing-methods",
    "learn/gtm-topology-records-and-longest-match",
  ],
  sources: [
    { id: "gtm-concepts-comms", label: "F5 BIG-IP GTM Concepts: Communications Between BIG-IP GTM and Other Systems (iQuery is an XML protocol using gzip compression; iqdump; VLAN rule; gtmd/big3d)", url: "https://techdocs.f5.com/kb/en-us/products/big-ip_gtm/manuals/product/gtm-concepts-11-5-0/2.html" },
    { id: "dns-integrate-ltm", label: "F5 BIG-IP DNS Implementations: Integrating BIG-IP DNS Into a Network with BIG-IP LTM Systems (gtmd uses iQuery to big3d; TCP 4353; big3d_install/bigip_add SSL trust)", url: "https://techdocs.f5.com/kb/en-us/products/big-ip-dns/manuals/product/bigip-dns-implementations-13-0-0/1.html" },
    { id: "k14707", label: "F5 K14707: Configuring BIG-IP DNS server objects behind a firewall NAT (iQuery over TCP 4353; probes follow the same path as DNS clients; bigip_add trust)", url: "https://my.f5.com/manage/s/article/K14707" },
    { id: "k13312", label: "F5 K13312: Overview of the BIG-IP DNS big3d_install, bigip_add, and gtm_add utilities (trust bootstrap; SSH port 22; Link Controller removed in 21.0.0)", url: "https://my.f5.com/manage/s/article/K13312" },
    { id: "k000139663", label: "F5 K000139663: DNS iQuery third party certificate validation (real iqdump output sample: header comments and the <xml_connection> stanza)", url: "https://my.f5.com/manage/s/article/K000139663" },
    { id: "ltm-dns-ops", label: "F5 BIG-IP LTM-DNS Operations Guide: BIG-IP DNS iQuery (iQuery mesh; SSL cert auth; iqdump syntax and version XML stanza; /var/log/gtm state-change messages)", url: "https://my.f5.com/manage/s/article/K13690" },
  ],
});

/** Tool entry point. Deterministic; delegates to the pure engine. */
export { run as runTool };

export const __selftest = verifyVectors;
