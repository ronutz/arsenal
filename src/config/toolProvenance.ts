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
  /**
   * If set, the panel shows a standard notice that this tool is built from vendor
   * documentation (which changes with each release) rather than a fixed standard,
   * and that production use should verify against the vendor's own docs. Set on
   * the vendor-doc tools (the F5 family); omitted for standards-based tools.
   */
  disclaimer?: "vendor-docs";
}

// ----------------------------------------------------------------------------
// Provenance by tool id. Add tools here as they ship. Example below is the CIDR
// / subnet tool (the live one), with real, citable standards.
// ----------------------------------------------------------------------------
const PROVENANCE: Record<string, ToolProvenance> = {
  "f5-service-check-date": {
    basis:
      "The comparison runs entirely in your browser against a vendored copy of F5's License Check Date table. Enter a version and it returns the minimum service check date that version's license must carry; enter a service check date and it returns the newest version you can upgrade to and the newer branches you cannot reach yet; paste your /config/bigip.license contents or tmsh show sys license output and the service check date is extracted for the same answer. It is pure date arithmetic with no clock and no network: the version's License Check Date and the service check date are both inputs, so the same inputs always give the same answer.",
    sources: [
      { label: "F5 K7727", url: "https://my.f5.com/manage/s/article/K7727", note: "The License Check Date table, the Service Check Date definition, and the boot-time enforcement behaviour" },
      { label: "F5 K8986", url: "https://my.f5.com/manage/s/article/K8986", note: "The BIG-IP version schema that fixes the upgrade-vs-update boundary the check applies to" },
      { label: "F5 K3782", url: "https://my.f5.com/manage/s/article/K3782", note: "The tmsh show sys license field set and sample line forms the paste extractor accepts" },
      { label: "F5 K000160443", url: "https://my.f5.com/manage/s/article/K000160443", note: "Field-by-field meaning of the license output and the /config/bigip.license file location" },
    ],
    disclaimer: "vendor-docs",
  },
  "f5-bigip-license-explainer": {
    basis:
      "The decode runs entirely in your browser. Paste /config/bigip.license contents, the full file or any fragment, and it explains the license in plain language: whether it is managed by BIG-IQ or licensed directly, the licensing dates with the K7727 upgrade-eligibility verdict (computed over the same vendored table the F5 service check date tool uses), the Registration Key and platform, active and optional modules with their per-module keys, Exclusive_version, Deny_version and Exclusive_Platform constraints, and every feature token. It is decode-only: nothing is validated against a live system, nothing is transmitted, and key or signature values are never displayed, only their presence and length. The line grammar is grounded in two real, sanitized lab license files (BIG-IQ-managed and direct) and in the F5 articles below.",
    sources: [
      { label: "F5 K000160443", url: "https://my.f5.com/manage/s/article/K000160443", note: "Field-by-field meaning of the license fields and the /config/bigip.license location" },
      { label: "F5 K7727", url: "https://my.f5.com/manage/s/article/K7727", note: "The Service Check Date definition and the License Check Date table behind the upgrade verdict" },
      { label: "F5 K3782", url: "https://my.f5.com/manage/s/article/K3782", note: "The registration key shape and the license field set" },
      { label: "F5 K7752", url: "https://my.f5.com/manage/s/article/K7752", note: "The 27-character base registration key and the add-on key model" },
      { label: "F5 K42091606", url: "https://my.f5.com/manage/s/article/K42091606", note: "Exclusive_version fields define the permitted VE software range" },
      { label: "F5 K02011230", url: "https://my.f5.com/manage/s/article/K02011230", note: "Z100-family platform IDs belong to BIG-IP VE" },
      { label: "F5 K15643", url: "https://my.f5.com/manage/s/article/K15643", note: "Version Plus semantics behind the Exclusive_version ceiling" },
    ],
    disclaimer: "vendor-docs",
  },
  "f5-awaf-declarative-policy-explainer": {
    basis:
      "The decode runs entirely in your browser. Paste a declarative WAF policy JSON and it explains each recognized section in plain language, grounded in F5's published declarative-policy schema, and raises security callouts derived only from values the policy explicitly sets. It is decode-only: it never validates against a live BIG-IP, never evaluates the policy against traffic, and never fetches anything. It honors the template-delta rule, so an absent section is reported as the template default, never as disabled.",
    sources: [
      { label: "F5 BIG-IP WAF Declarative Policy (index)", url: "https://clouddocs.f5.com/products/waf-declarative-policy/", note: "The published schema versions: v16.0, v16.1, v17.0, v17.1, and v17.5" },
      { label: "F5 Declarative WAF v17.1 Schema", url: "https://clouddocs.f5.com/products/waf-declarative-policy/schema_v17_1.html", note: "The field structure and F5's own per-field descriptions; the latest version with a complete published schema" },
      { label: "F5 Declarative WAF v17.1 Schema Description", url: "https://clouddocs.f5.com/products/waf-declarative-policy/declarative_policy_v17_1.html", note: "F5's prose descriptions of each policy section" },
    ],
    disclaimer: "vendor-docs",
  },
  "dig-output-explainer": {
    basis:
      "The breakdown is parsed entirely in your browser from the dig output you paste. Nothing is resolved and nothing is sent anywhere; the parser only reads the text and labels each part against the DNS message format.",
    sources: [
      { label: "RFC 1035", url: "https://www.rfc-editor.org/rfc/rfc1035", note: "DNS message format, header, and the classic record types" },
      { label: "RFC 6891", url: "https://www.rfc-editor.org/rfc/rfc6891", note: "EDNS(0): the OPT pseudo-section, UDP payload size, and the DO flag" },
      { label: "RFC 2308", url: "https://www.rfc-editor.org/rfc/rfc2308", note: "Negative caching: the negative TTL is the minimum of the SOA record's TTL and its MINIMUM field (section 5)" }, // corrected 2026-10-19 to RFC 2308 section 5
      { label: "RFC 4034", url: "https://www.rfc-editor.org/rfc/rfc4034", note: "DNSSEC records: RRSIG, DNSKEY, DS, NSEC" },
      { label: "RFC 9499", url: "https://www.rfc-editor.org/rfc/rfc9499", note: "DNS terminology used throughout the explanations (March 2024; obsoletes RFC 8499)" }, // replaces RFC 8499 (2026-10-19)
      { label: "RFC 8490", url: "https://www.rfc-editor.org/rfc/rfc8490", note: "DNS Stateful Operations: opcode 6 (DSO) and RCODE 11 (DSOTYPENI), which dig 9.20 prints as RESERVED6 and RESERVED11" }, // the opcode and RCODE names the parser recovers (2026-10-19)
    ],
  },
  "nslookup-output-explainer": {
    basis:
      "The breakdown is parsed entirely in your browser from the nslookup output you paste. Nothing is resolved and nothing is sent anywhere; the parser only reads the text and labels each part against the DNS message format and nslookup's own output conventions.",
    sources: [
      { label: "RFC 1035", url: "https://www.rfc-editor.org/rfc/rfc1035", note: "DNS message format and the classic record types" },
      { label: "RFC 2308", url: "https://www.rfc-editor.org/rfc/rfc2308", note: "Negative caching: NXDOMAIN and NODATA, and the SOA minimum" },
      { label: "RFC 2782", url: "https://www.rfc-editor.org/rfc/rfc2782", note: "SRV records: priority, weight, port, and target" },
      { label: "RFC 2181", url: "https://www.rfc-editor.org/rfc/rfc2181", note: "Zone authority (section 6): which servers are authoritative for a name" }, // backs the non-authoritative wording (2026-10-19)
      { label: "RFC 9499", url: "https://www.rfc-editor.org/rfc/rfc9499", note: "DNS terminology, including authoritative vs non-authoritative (March 2024; obsoletes RFC 8499)" }, // replaces RFC 8499 (2026-10-19)
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
    disclaimer: "vendor-docs",
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
  "curl-command-explainer": {
    basis:
      "The command is tokenized and decoded entirely in your browser, the way a shell reads it: single and double quotes, backslash escapes, line continuations, clustered short flags (-sSL), and attached values (-XPOST). From the parsed request the tool derives both the explanation and every translation. It never sends the request or contacts the host (zero egress). Content-Type is resolved the way curl actually behaves, where -d defaults to application/x-www-form-urlencoded rather than JSON, which is a common source of confusion the tool flags.",
    sources: [
      { label: "curl: man page", url: "https://curl.se/docs/manpage.html", note: "The command options and their exact behavior" },
      { label: "RFC 9110: HTTP Semantics", url: "https://www.rfc-editor.org/rfc/rfc9110", note: "Methods, headers, and message semantics" },
      { label: "MDN: Using the Fetch API", url: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch", note: "The fetch translation target" },
      { label: "Requests: Quickstart", url: "https://requests.readthedocs.io/en/latest/user/quickstart/", note: "The Python translation target" },
    ],
  },
  cidr: {
    // Basis and sources brought in line with the engine on 2026-10-19 (API sync): the special-purpose classification,
    // the RFC 3021 /31 handling and the VLSM option, and the four modes the API now reaches.
    basis:
      "All results are computed locally from the blocks you enter, using standard IPv4 addressing arithmetic: one block's network, mask, host range and counts (a /31 counts two usable hosts, RFC 3021); variable-length subnets carved from a parent, largest block first, with the free space left as blocks; the minimal aggregate and single supernet of a list; and the overlaps and gaps among prefixes. The special-purpose classification compares a block with an embedded copy of the IANA IPv4 Special-Purpose Address Space registry, read on 2026-10-19, plus the multicast range 224.0.0.0/4; nothing is looked up remotely and nothing is sent anywhere. Behaviour is pinned by 26 golden vectors.",
    sources: [
      {
        label: "RFC 4632 (CIDR)",
        url: "https://www.rfc-editor.org/rfc/rfc4632",
        note: "Classless Inter-Domain Routing: prefix notation, block sizes and aggregation",
      },
      {
        label: "RFC 1122, section 3.2.1.3",
        url: "https://www.rfc-editor.org/rfc/rfc1122",
        note: "The network and broadcast addresses a /0 to /30 block reserves", // added 2026-10-19
      },
      {
        label: "RFC 3021",
        url: "https://www.rfc-editor.org/rfc/rfc3021",
        note: "31-bit prefixes on point-to-point links: both addresses are hosts", // added 2026-10-19
      },
      {
        label: "IANA IPv4 Special-Purpose Address Space",
        url: "https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry.xhtml",
        note: "Every row of the special-purpose classification, with its flags (registry updated 2025-10-09, read 2026-10-19)", // added 2026-10-19
      },
      {
        label: "RFC 6890",
        url: "https://www.rfc-editor.org/rfc/rfc6890",
        note: "Special-Purpose IP Address Registries: the registry's structure and flag columns (updated by RFC 8190)", // added 2026-10-19
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
        label: "RFC 9846 (TLS 1.3, current revision)",
        url: "https://www.rfc-editor.org/rfc/rfc9846",
        note: "The December 2025 revision of TLS 1.3, obsoleting RFC 8446; the cipher-suite form and the five suites carry over unchanged",
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
      {
        label: "The Illustrated TLS 1.2 Connection (Michael Driscoll)",
        url: "https://tls12.xargs.org/",
        note: "Byte-by-byte annotated TLS 1.2 handshake, showing the negotiated suite on the wire",
      },
      {
        label: "The Illustrated TLS 1.3 Connection (Michael Driscoll)",
        url: "https://tls13.xargs.org/",
        note: "Byte-by-byte annotated TLS 1.3 handshake, showing the short suite and separate key_share negotiation",
      },
    ],
  },
  "ssrf-url-classifier": {
    // basis rewritten 2026-10-19b: every IANA special-purpose row, IPv4-compatible and Teredo decoding, anycast flags, 113 vectors
    basis:
      "The classifier decides purely from the URL string and never touches the network: it does not resolve DNS and never issues the request (D-53). It extracts the host from the raw input (not from a normalizing URL parser, which would erase the obfuscation), decodes the inet_aton spellings of an IPv4 address (decimal, octal, hex, short-form), normalises every IPv6 spelling to its RFC 5952 form, and decodes the IPv4 address carried inside six IPv6 layouts: IPv4-mapped (::ffff:0:0/96), the deprecated IPv4-compatible ::a.b.c.d, NAT64 (64:ff9b::/96 and 64:ff9b:1::/48), 6to4 (2002::/16) and Teredo (2001::/32, whose server address and XOR-obfuscated client address are both shown, the more internal one deciding). Every one of the 25 IPv4 and 25 IPv6 rows of the IANA Special-Purpose Address Space registries (read 2026-10-19) is matched most specific first and rated by its own name and Globally Reachable flag: not globally reachable rates reserved unless the row is loopback, private, link-local or CGNAT; globally reachable rates public but is named, and the anycast service addresses (192.0.0.9, 192.0.0.10, 2001:1::1, 2001:1::2, 2001:1::3, and the 6a44 relay 192.88.99.2) are flagged as such. The cloud metadata addresses (169.254.169.254, metadata.google.internal, fd00:ec2::254, 100.100.100.200) outrank their covering rows. Dangerous non-HTTP schemes (file, gopher, dict, ftp, ldap, and similar) and embedded credentials are flagged. The range definitions come from the IANA registries and the RFCs they cite, the SSRF guidance from the OWASP SSRF prevention cheat sheet; behavior is pinned by 113 golden vectors.", // 56 before 2026-10-19b
    sources: [
      { label: "RFC 1918: Address Allocation for Private Internets", url: "https://www.rfc-editor.org/rfc/rfc1918", note: "private IPv4 ranges" },
      { label: "RFC 3927: Dynamic Configuration of IPv4 Link-Local Addresses", url: "https://www.rfc-editor.org/rfc/rfc3927", note: "169.254.0.0/16 link-local" },
      { label: "RFC 6598: IANA-Reserved IPv4 Prefix for Shared Address Space", url: "https://www.rfc-editor.org/rfc/rfc6598", note: "100.64.0.0/10 CGNAT" },
      { label: "RFC 3986: Uniform Resource Identifier (URI): Generic Syntax", url: "https://www.rfc-editor.org/rfc/rfc3986", note: "URL structure" },
      { label: "OWASP: Server Side Request Forgery Prevention Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html", note: "SSRF defenses" },
      { label: "IANA: IPv4 Special-Purpose Address Space", url: "https://www.iana.org/assignments/iana-ipv4-special-registry/", note: "all 25 rows, read 2026-10-19 (registry updated 2025-10-09)" }, // added 2026-10-19b
      { label: "IANA: IPv6 Special-Purpose Address Space", url: "https://www.iana.org/assignments/iana-ipv6-special-registry/", note: "all 25 rows, read 2026-10-19 (registry updated 2025-10-09)" }, // added 2026-10-19b
      { label: "RFC 4291: IP Version 6 Addressing Architecture", url: "https://www.rfc-editor.org/rfc/rfc4291", note: "text forms, IPv4-compatible and IPv4-mapped addresses" }, // added 2026-10-19b
      { label: "RFC 6052: IPv6 Addressing of IPv4/IPv6 Translators", url: "https://www.rfc-editor.org/rfc/rfc6052", note: "NAT64 address layouts" }, // added 2026-10-19b
      { label: "RFC 4380: Teredo", url: "https://www.rfc-editor.org/rfc/rfc4380", note: "Teredo address format and client obfuscation" }, // added 2026-10-19b
    ],
  },
  "hash-preimage-finder": {
    basis:
      "The search runs entirely in your browser: candidates are enumerated over the alphabet and length you choose, each one is hashed locally, and the first match is returned. There is no dictionary, no wordlist, and no precomputed table (unlike lookup services such as CrackStation), so nothing is stored and nothing is fetched. The MD5, SHA-1, and SHA-256 implementations are verified against their published test vectors. The keyspace is capped, so the tool only ever recovers trivially weak inputs, which is exactly the point: it demonstrates why fast, unsalted hashes fall for low-entropy secrets and hold for anything with real entropy, and it pairs every result with the defenses (salting, slow KDFs, algorithm choice).",
    sources: [
      { label: "RFC 1321: The MD5 Message-Digest Algorithm", url: "https://www.rfc-editor.org/rfc/rfc1321", note: "MD5 definition and test vectors" },
      { label: "RFC 3174: US Secure Hash Algorithm 1 (SHA1)", url: "https://www.rfc-editor.org/rfc/rfc3174", note: "SHA-1 definition and test vectors" },
      { label: "FIPS 180-4: Secure Hash Standard", url: "https://csrc.nist.gov/pubs/fips/180-4/upd1/final", note: "SHA-256 definition and test vectors" },
      { label: "OWASP: Password Storage Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html", note: "Why salting and slow KDFs are required" },
      { label: "NIST SP 800-63B: Digital Identity Guidelines", url: "https://pages.nist.gov/800-63-3/sp800-63b.html", note: "Authenticator and memorized-secret guidance" },
    ],
  },
  "f5-bigip-tcpdump-builder": {
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
    disclaimer: "vendor-docs",
  },
};

/** Provenance for a tool id, or null if none recorded. */
export function provenanceFor(toolId: string): ToolProvenance | null {
  return PROVENANCE[toolId] ?? null;
}
