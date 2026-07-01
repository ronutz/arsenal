// ============================================================================
// src/config/toolProvenance.ts
// ----------------------------------------------------------------------------
// TOOL PROVENANCE — per-tool "Credits & Sources".
//
// For each tool, this records WHERE its logic and authority come from: the
// standards or algorithms it implements, the data sources it draws on, and any
// references worth citing. Showing this builds trust ("compute, never guess" is
// verifiable) and credits the work the tool rests on. It is a provenance panel,
// not a funding ask.
//
// Gated by the `toolProvenance` feature flag (currently ON; it is informational
// and costs nothing). Data-driven: a tool with no provenance entry simply shows
// no panel. Populated per tool as the tool surface grows.
// ============================================================================

export interface ProvenanceSource {
  /** Label, e.g. "RFC 4632" or "IANA IPv4 registry". */
  label: string;
  /** Optional link to the source. */
  url?: string;
  /** Optional one-line note on how it is used. */
  note?: string;
}

export interface ToolProvenance {
  /** What the tool computes from / implements (plain language). */
  basis: string;
  /** Standards, algorithms, and data sources. */
  sources: ProvenanceSource[];
}

// ----------------------------------------------------------------------------
// Provenance by tool id. Add tools here as they ship. Example below is the CIDR
// / subnet tool (the live one), with real, citable standards.
// ----------------------------------------------------------------------------
const PROVENANCE: Record<string, ToolProvenance> = {
  "dig-output-explainer": {
    basis:
      "The breakdown is parsed entirely in your browser from the dig output you paste. Nothing is resolved and nothing is sent anywhere; the parser only reads the text and labels each part against the DNS message format.",
    sources: [
      { label: "RFC 1035", url: "https://www.rfc-editor.org/rfc/rfc1035", note: "DNS message format, header, and the classic record types" },
      { label: "RFC 6891", url: "https://www.rfc-editor.org/rfc/rfc6891", note: "EDNS(0): the OPT pseudo-section, UDP payload size, and the DO flag" },
      { label: "RFC 2308", url: "https://www.rfc-editor.org/rfc/rfc2308", note: "Negative caching: how NXDOMAIN and NODATA TTLs come from the SOA" },
      { label: "RFC 4034", url: "https://www.rfc-editor.org/rfc/rfc4034", note: "DNSSEC records: RRSIG, DNSKEY, DS, NSEC" },
      { label: "RFC 8499", url: "https://www.rfc-editor.org/rfc/rfc8499", note: "DNS terminology used throughout the explanations" },
    ],
  },
  "nslookup-output-explainer": {
    basis:
      "The breakdown is parsed entirely in your browser from the nslookup output you paste. Nothing is resolved and nothing is sent anywhere; the parser only reads the text and labels each part against the DNS message format and nslookup's own output conventions.",
    sources: [
      { label: "RFC 1035", url: "https://www.rfc-editor.org/rfc/rfc1035", note: "DNS message format and the classic record types" },
      { label: "RFC 2308", url: "https://www.rfc-editor.org/rfc/rfc2308", note: "Negative caching: NXDOMAIN and NODATA, and the SOA minimum" },
      { label: "RFC 2782", url: "https://www.rfc-editor.org/rfc/rfc2782", note: "SRV records: priority, weight, port, and target" },
      { label: "RFC 8499", url: "https://www.rfc-editor.org/rfc/rfc8499", note: "DNS terminology, including authoritative vs non-authoritative" },
    ],
  },
  "xml-decoder": {
    basis:
      "The structure is parsed entirely in your browser from the XML you paste. The parser is a text tokenizer that never resolves an entity, never dereferences a SYSTEM or PUBLIC identifier, and never fetches anything; external entities are reported as the literal reference they declare, not their contents. Every part is labelled against the XML 1.0 grammar and the Namespaces in XML rules, and the security analysis flags the entity attack surface without exercising it.",
    sources: [
      { label: "W3C XML 1.0", url: "https://www.w3.org/TR/xml/", note: "The XML 1.0 grammar: declaration, elements, attributes, DOCTYPE, entities, CDATA" },
      { label: "W3C Namespaces in XML 1.0", url: "https://www.w3.org/TR/xml-names/", note: "Namespace prefixes, the default namespace, and prefix resolution" },
      { label: "OWASP XXE Prevention Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html", note: "External entities, parameter entities, and entity expansion as attack vectors" },
    ],
  },
  "f5xc-service-policy-explainer": {
    basis:
      "The policy is parsed entirely in your browser from the JSON you paste. The engine reads the spec against the published ves.io.schema.service_policy shape: it resolves the server choice and the rule choice, and for a rule_list it walks each rule's action and predicates, rendering every matcher with its exact, regex, prefix, and suffix values and its and/or logic. It never fetches anything and never evaluates the policy against live traffic; case-sensitivity and inversion are read straight from the matcher fields and their transformers.",
    sources: [
      { label: "F5 Distributed Cloud API: ves.io.schema.service_policy", url: "https://docs.cloud.f5.com/docs-v2/api/service-policy", note: "The service_policy object: server choice, rule choice, allow_list, deny_list, rule_list" },
      { label: "F5 Distributed Cloud API: ves.io.schema.service_policy_rule", url: "https://docs.cloud.f5.com/docs-v2/api/service-policy-rule", note: "The rule spec: action, predicates, matchers, transformers, and expiration" },
      { label: "F5 Distributed Cloud: Service Policy how-to", url: "https://docs.cloud.f5.com/docs-v2/multi-cloud-app-connect/how-to/app-security/service-policy", note: "Creating and applying service policies, rule combining, and default deny" },
    ],
  },
  "cvss-vector-decoder": {
    basis:
      "The score is computed entirely in your browser from the vector you paste. The math is implemented directly from the FIRST.org CVSS v3.1 specification: the Impact and Exploitability sub-scores, the Base score, and, when those metrics are present, the Temporal and Environmental scores, using the specification's floating-point-safe Roundup. It looks nothing up and fetches nothing. The implementation is validated against officially published reference scores, so a canonical unauthenticated remote code execution scores 9.8, a scope change pushes it to 10.0, and a reflected cross-site scripting vector scores 6.1.",
    sources: [
      { label: "FIRST.org: CVSS v3.1 Specification Document", url: "https://www.first.org/cvss/v3.1/specification-document", note: "Metric definitions and weights, the Section 7 scoring formulas, and the Appendix A Roundup" },
      { label: "FIRST.org: CVSS v3.1 Calculator", url: "https://www.first.org/cvss/calculator/3.1", note: "The reference calculator the scores are checked against" },
      { label: "NVD: CVSS v3.1 Equations", url: "https://nvd.nist.gov/vuln-metrics/cvss/v3-calculator/v31/equations", note: "The base and environmental equations as published by NVD" },
    ],
  },
  cidr: {
    basis:
      "All results are computed locally from the address and prefix you enter, using standard IPv4 addressing arithmetic. Nothing is looked up remotely and nothing is sent anywhere.",
    sources: [
      {
        label: "RFC 4632 (CIDR)",
        url: "https://www.rfc-editor.org/rfc/rfc4632",
        note: "Classless Inter-Domain Routing address aggregation",
      },
      {
        label: "RFC 1918",
        url: "https://www.rfc-editor.org/rfc/rfc1918",
        note: "Private address ranges",
      },
      {
        label: "RFC 791 (IPv4)",
        url: "https://www.rfc-editor.org/rfc/rfc791",
        note: "The Internet Protocol",
      },
    ],
  },
  cipher: {
    basis:
      'All results are computed locally from the cipher suite you enter. The code points, names, and the IANA "Recommended" and DTLS-OK flags come from a bundled snapshot of the IANA TLS Cipher Suite registry; the structural breakdown (key exchange, authentication, cipher, mode, MAC) and the security read-out are derived in your browser. Nothing is looked up remotely.',
    sources: [
      {
        label: "IANA TLS Cipher Suites registry",
        url: "https://www.iana.org/assignments/tls-parameters/tls-parameters.xhtml#tls-parameters-4",
        note: "Authoritative code points, names, and the Recommended / DTLS-OK flags",
      },
      {
        label: "RFC 8446 (TLS 1.3)",
        url: "https://www.rfc-editor.org/rfc/rfc8446",
        note: "TLS 1.3 cipher-suite form (symmetric cipher and hash only)",
      },
      {
        label: "RFC 8447",
        url: "https://www.rfc-editor.org/rfc/rfc8447",
        note: 'Meaning of the "Recommended" column (Y / N / D)',
      },
      {
        label: "RFC 7465",
        url: "https://www.rfc-editor.org/rfc/rfc7465",
        note: "RC4 prohibited for TLS",
      },
      {
        label: "RFC 8429",
        url: "https://www.rfc-editor.org/rfc/rfc8429",
        note: "3DES and IDEA deprecated for TLS",
      },
      {
        label: "ciphersuite.info",
        url: "https://ciphersuite.info/",
        note: "OpenSSL and GnuTLS cross-names",
      },
    ],
  },
  "bigip-tcpdump-builder": {
    basis:
      "The command is assembled in your browser from the options you choose, following F5's documented BIG-IP tcpdump syntax. Nothing is captured, run, or sent anywhere. The tool only formats a string for you to run yourself on your own BIG-IP.",
    sources: [
      {
        label: "F5 K411",
        url: "https://my.f5.com/manage/s/article/K411",
        note: "BIG-IP tcpdump options, the 0.0 interface, snaplen, filters, and file output",
      },
      {
        label: "F5 K13637",
        url: "https://my.f5.com/manage/s/article/K13637",
        note: "The :n / :nn / :nnn TMM detail suffix and the :p both-sides modifier",
      },
    ],
  },
};

/** Provenance for a tool id, or null if none recorded. */
export function provenanceFor(toolId: string): ToolProvenance | null {
  return PROVENANCE[toolId] ?? null;
}
