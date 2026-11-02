// ============================================================================
// src/config/toolProvenance.ts
// ----------------------------------------------------------------------------
// TOOL PROVENANCE: per-tool "Credits & sources".
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
//
// STRUCTURE HERE, WORDS IN THE PACKS (2026-11-02, batch H5). Until then the
// panel was English on every locale: about 117 English sentences on the pt-BR
// pages (measured 2026-11-01). It now follows the house pattern of
// src/content/materials/materials.ts and src/content/study-guides/reading-paths.ts:
// this file keeps the structure a guard can check (each source's stable key,
// its label as written, its URL, the vendor-docs mark), and the words live in
// the message packs, authored en + pt-BR, English fallback elsewhere:
//
//   toolProvenance.<tool>.basis                what the tool computes from
//   toolProvenance.<tool>.sources.<key>.note   what the tool takes from a source
//   toolProvenance.<tool>.sources.<key>.label  a label that is our own description
//
// A label that is a document's published title (an RFC's title, an F5 article
// number, a manual page name) is a proper name: it stays here as published and
// reads the same on every page (marked lang="en" on pages in other languages).
// A label that is our own description of a source ("RFC 1812, section
// 5.2.4.3") carries ownLabel, and its words are in the packs; it also stays
// here as written, because the citation audits read a label and its url
// together (scripts/check-placeholder-sources.mjs, audit-source-liveness.mjs).
//
// Keys, never positions: reordering, adding or removing a source moves no words.
// The guard scripts/check-source-words.mts fails the build when an entry's
// words are missing from either pack, when a pack holds words for a source or a
// tool this file does not have, or when an own label's English in the en pack
// differs from the label written here.
// ============================================================================

/** One source behind a tool: its key, its label as written, and its link. */
export interface ProvenanceSource {
  /** Stable key within the tool (lowercase letters, digits, hyphens); its words are at toolProvenance.<tool>.sources.<key>. */
  key: string;
  /** The label as written: the document's published title, or with ownLabel our own English description of it. */
  label: string;
  /** Set when the label is our own description rather than a published title: its words are in the packs (sources.<key>.label). */
  ownLabel?: true;
  /** Optional link to the source. */
  url?: string;
}

/** One tool's provenance: its sources and the vendor-docs mark. Its basis and notes are in the packs. */
export interface ToolProvenance {
  /** Standards, algorithms, and data sources, in the order the panel lists them. */
  sources: ProvenanceSource[];
  /**
   * If set, the panel shows a standard notice that this tool is built from vendor
   * documentation (which changes with each release) rather than a fixed standard,
   * and that production use should verify against the vendor's own docs. Set on
   * the vendor-doc tools (the F5 family); omitted for standards-based tools.
   */
  disclaimer?: "vendor-docs";
}

/** One source as the panel shows it, in the page's language. */
export interface ProvenanceSourceView {
  /** The label: the published title as published, or our own description in the page's language. */
  label: string;
  /** "en" when the label is a published (English) title shown on a page in another language. */
  labelLang?: "en";
  /** Optional link to the source. */
  url?: string;
  /** What the tool takes from the source, in the page's language. */
  note: string;
}

/** A tool's panel as the page shows it, in the page's language. */
export interface ProvenanceView {
  /** What the tool computes from / implements (plain language). */
  basis: string;
  /** The sources, in order. */
  sources: ProvenanceSourceView[];
  /** The vendor-docs mark, as in the registry. */
  disclaimer?: "vendor-docs";
}

/** What the page's translator offers (next-intl's getTranslations("toolProvenance") result satisfies it). */
export interface ProvenanceTranslator {
  /** The message at a key under toolProvenance. */
  (key: string): string;
}

// ----------------------------------------------------------------------------
// Provenance by tool id. Add tools here as they ship, with their words in both
// packs (the guard says which keys are missing).
// ----------------------------------------------------------------------------
const PROVENANCE: Record<string, ToolProvenance> = {
  // tcpdump command and filter explainer (2026-10-27): the releases tcpdump.org offers (tcpdump 4.99.7; libpcap 1.10.7 stable, 1.11.0 testing), from their manual pages and tagged source.
  "tcpdump-filter-explainer": {
    sources: [
      { key: "tcpdump-org", label: "tcpdump.org, Latest Releases", url: "https://www.tcpdump.org/index.html" },
      { key: "tcpdump-1", label: "tcpdump(1) for tcpdump 4.99.7, tcpdump.org", ownLabel: true, url: "https://www.tcpdump.org/manpages/tcpdump.1-4.99.7.html" },
      { key: "pcap-filter-7", label: "pcap-filter(7) for libpcap 1.11.0, tcpdump.org", ownLabel: true, url: "https://www.tcpdump.org/manpages/libpcap-1.11.0/pcap-filter.7.html" },
      { key: "libpcap-source", label: "libpcap scanner.l, grammar.y.in, gencode.c and optimize.c at tags libpcap-1.10.7 and libpcap-1.11.0", ownLabel: true, url: "https://github.com/the-tcpdump-group/libpcap" },
      { key: "tcpdump-c", label: "tcpdump.c at tag tcpdump-4.99.7", ownLabel: true, url: "https://github.com/the-tcpdump-group/tcpdump/blob/tcpdump-4.99.7/tcpdump.c" },
      { key: "bison-precedence", label: "GNU Bison manual, How Precedence Works", ownLabel: true, url: "https://www.gnu.org/software/bison/manual/html_node/How-Precedence.html" },
    ],
  },
  // Routing table explainer (2026-10-19): field meanings from the commands' manuals, the lookup from RFC 1812.
  "routing-table-explainer": {
    sources: [
      { key: "ip-route", label: "ip-route(8), iproute2", url: "https://man7.org/linux/man-pages/man8/ip-route.8.html" },
      { key: "ip-rule", label: "ip-rule(8), iproute2", url: "https://man7.org/linux/man-pages/man8/ip-rule.8.html" },
      { key: "rtnetlink", label: "rtnetlink(7)", url: "https://man7.org/linux/man-pages/man7/rtnetlink.7.html" },
      { key: "net-tools", label: "route(8) and netstat(8), net-tools", ownLabel: true, url: "https://man7.org/linux/man-pages/man8/route.8.html" },
      { key: "freebsd-netstat", label: "netstat(1), FreeBSD 15.1", url: "https://man.freebsd.org/cgi/man.cgi?query=netstat&sektion=1" },
      { key: "apple-netstat", label: "netstat.1, Apple network_cmds", url: "https://github.com/apple-oss-distributions/network_cmds/blob/main/netstat.tproj/netstat.1" },
      { key: "ms-learn-route", label: "Microsoft Learn, route and The IP routing table", ownLabel: true, url: "https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2003/cc779122(v=ws.10)" },
      { key: "rfc1812", label: "RFC 1812, section 5.2.4.3", ownLabel: true, url: "https://www.rfc-editor.org/rfc/rfc1812.txt" },
    ],
  },
  // CGN port blocks: port blocks, deterministic mapping and MAP, from the RFCs that define them.
  "cgn-port-blocks": {
    sources: [
      { key: "rfc7422", label: "RFC 7422", url: "https://www.rfc-editor.org/rfc/rfc7422.txt" },
      { key: "rfc7768", label: "RFC 7768", url: "https://www.rfc-editor.org/rfc/rfc7768.txt" },
      { key: "rfc6888", label: "RFC 6888", url: "https://www.rfc-editor.org/rfc/rfc6888.txt" },
      { key: "rfc7597", label: "RFC 7597", url: "https://www.rfc-editor.org/rfc/rfc7597.txt" },
      { key: "rfc7599", label: "RFC 7599", url: "https://www.rfc-editor.org/rfc/rfc7599.txt" },
      { key: "rfc6269", label: "RFC 6269", url: "https://www.rfc-editor.org/rfc/rfc6269.txt" },
      { key: "rfc6302", label: "RFC 6302", url: "https://www.rfc-editor.org/rfc/rfc6302.txt" },
      { key: "rfc6335", label: "RFC 6335", url: "https://www.rfc-editor.org/rfc/rfc6335.txt" },
    ],
  },
  // BFD timers: added 2026-10-19 with the tool; every source downloaded that day (HTTP 200).
  "bfd-timers": {
    sources: [
      { key: "rfc5880", label: "RFC 5880 (BFD)", url: "https://www.rfc-editor.org/rfc/rfc5880.txt" },
      { key: "rfc5881", label: "RFC 5881 (BFD single hop)", url: "https://www.rfc-editor.org/rfc/rfc5881.txt" },
      { key: "rfc5883", label: "RFC 5883 (BFD multihop)", url: "https://www.rfc-editor.org/rfc/rfc5883.txt" },
      { key: "rfc7419", label: "RFC 7419 (Common Interval Support in BFD)", url: "https://www.rfc-editor.org/rfc/rfc7419.txt" },
      { key: "frr-bfdd", label: "FRRouting documentation, BFD (bfdd)", ownLabel: true, url: "https://docs.frrouting.org/en/latest/bfd.html" },
      { key: "junos-13-1", label: "Junos OS 13.1, bfd-liveness-detection (2013)", url: "https://juniper.net/documentation/en_US/junos13.1/topics/reference/configuration-statement/bfd-liveness-detection-edit-protocols-bgp.html" },
      { key: "iana-bfd", label: "IANA BFD Parameters", url: "https://www.iana.org/assignments/bfd-parameters/bfd-parameters.xhtml" },
    ],
  },
  // Route origin validation calculator (2026-10-19).
  "rpki-origin-validation": {
    sources: [
      { key: "rfc6811", label: "RFC 6811: BGP Prefix Origin Validation", url: "https://www.rfc-editor.org/rfc/rfc6811" },
      { key: "rfc9582", label: "RFC 9582: A Profile for Route Origin Authorizations (ROAs)", url: "https://www.rfc-editor.org/rfc/rfc9582" },
      { key: "rfc6483", label: "RFC 6483: Validation of Route Origination Using the Resource Certificate PKI and ROAs", url: "https://www.rfc-editor.org/rfc/rfc6483" },
      { key: "rfc7607", label: "RFC 7607: Codification of AS 0 Processing", url: "https://www.rfc-editor.org/rfc/rfc7607" },
      { key: "rfc9319", label: "RFC 9319: The Use of maxLength in the RPKI", url: "https://www.rfc-editor.org/rfc/rfc9319" },
      { key: "rfc8416", label: "RFC 8416: SLURM", url: "https://www.rfc-editor.org/rfc/rfc8416" },
      { key: "rfc5396", label: "RFC 5396: Textual Representation of AS Numbers", url: "https://www.rfc-editor.org/rfc/rfc5396" },
    ],
  },
  // F5 service check date: F5's License Check Date table and the articles around it.
  "f5-service-check-date": {
    sources: [
      { key: "k7727", label: "F5 K7727", url: "https://my.f5.com/manage/s/article/K7727" },
      { key: "k8986", label: "F5 K8986", url: "https://my.f5.com/manage/s/article/K8986" },
      { key: "k3782", label: "F5 K3782", url: "https://my.f5.com/manage/s/article/K3782" },
      { key: "k000160443", label: "F5 K000160443", url: "https://my.f5.com/manage/s/article/K000160443" },
    ],
    disclaimer: "vendor-docs",
  },
  // BIG-IP licence explainer: the licence file's fields, from F5's articles.
  "f5-bigip-license-explainer": {
    sources: [
      { key: "k000160443", label: "F5 K000160443", url: "https://my.f5.com/manage/s/article/K000160443" },
      { key: "k7727", label: "F5 K7727", url: "https://my.f5.com/manage/s/article/K7727" },
      { key: "k3782", label: "F5 K3782", url: "https://my.f5.com/manage/s/article/K3782" },
      { key: "k7752", label: "F5 K7752", url: "https://my.f5.com/manage/s/article/K7752" },
      { key: "k42091606", label: "F5 K42091606", url: "https://my.f5.com/manage/s/article/K42091606" },
      { key: "k02011230", label: "F5 K02011230", url: "https://my.f5.com/manage/s/article/K02011230" },
      { key: "k15643", label: "F5 K15643", url: "https://my.f5.com/manage/s/article/K15643" },
    ],
    disclaimer: "vendor-docs",
  },
  // Advanced WAF declarative policy explainer: F5's published schema.
  "f5-awaf-declarative-policy-explainer": {
    sources: [
      { key: "index", label: "F5 BIG-IP WAF Declarative Policy (index)", ownLabel: true, url: "https://clouddocs.f5.com/products/waf-declarative-policy/" },
      { key: "schema-v17-1", label: "F5 Declarative WAF v17.1 Schema", url: "https://clouddocs.f5.com/products/waf-declarative-policy/schema_v17_1.html" },
      { key: "description-v17-1", label: "F5 Declarative WAF v17.1 Schema Description", url: "https://clouddocs.f5.com/products/waf-declarative-policy/declarative_policy_v17_1.html" },
    ],
    disclaimer: "vendor-docs",
  },
  // dig output explainer: the DNS message format and its extensions.
  "dig-output-explainer": {
    sources: [
      { key: "rfc1035", label: "RFC 1035", url: "https://www.rfc-editor.org/rfc/rfc1035" },
      { key: "rfc6891", label: "RFC 6891", url: "https://www.rfc-editor.org/rfc/rfc6891" },
      { key: "rfc2308", label: "RFC 2308", url: "https://www.rfc-editor.org/rfc/rfc2308" }, // corrected 2026-10-19 to RFC 2308 section 5
      { key: "rfc4034", label: "RFC 4034", url: "https://www.rfc-editor.org/rfc/rfc4034" },
      { key: "rfc9499", label: "RFC 9499", url: "https://www.rfc-editor.org/rfc/rfc9499" }, // replaces RFC 8499 (2026-10-19)
      { key: "rfc8490", label: "RFC 8490", url: "https://www.rfc-editor.org/rfc/rfc8490" }, // the opcode and RCODE names the parser recovers (2026-10-19)
    ],
  },
  // openssl s_client explainer: OpenSSL 3.5 (the long-term-support release), its manuals and source.
  "openssl-s-client-explainer": {
    sources: [
      { key: "release-strategy", label: "OpenSSL Library, release strategy", url: "https://openssl-library.org/policies/releasestrat/" },
      { key: "s-client-1", label: "OpenSSL 3.5, openssl-s_client(1)", url: "https://docs.openssl.org/3.5/man1/openssl-s_client/" },
      { key: "store-ctx-get-error-3", label: "OpenSSL 3.5, X509_STORE_CTX_get_error(3)", url: "https://docs.openssl.org/3.5/man3/X509_STORE_CTX_get_error/" },
      { key: "verification-options-1", label: "OpenSSL 3.5, openssl-verification-options(1)", url: "https://docs.openssl.org/3.5/man1/openssl-verification-options/" },
      { key: "s-client-source", label: "OpenSSL source, tag openssl-3.5.9, apps/s_client.c", ownLabel: true, url: "https://github.com/openssl/openssl/blob/openssl-3.5.9/apps/s_client.c" },
      { key: "rfc9846", label: "RFC 9846: TLS 1.3", url: "https://www.rfc-editor.org/rfc/rfc9846" },
      { key: "rfc9325", label: "RFC 9325: Recommendations for Secure Use of TLS and DTLS", url: "https://www.rfc-editor.org/rfc/rfc9325" },
    ],
  },
  // nslookup output explainer: the DNS message format and nslookup's conventions.
  "nslookup-output-explainer": {
    sources: [
      { key: "rfc1035", label: "RFC 1035", url: "https://www.rfc-editor.org/rfc/rfc1035" },
      { key: "rfc2308", label: "RFC 2308", url: "https://www.rfc-editor.org/rfc/rfc2308" },
      { key: "rfc2782", label: "RFC 2782", url: "https://www.rfc-editor.org/rfc/rfc2782" },
      { key: "rfc2181", label: "RFC 2181", url: "https://www.rfc-editor.org/rfc/rfc2181" }, // backs the non-authoritative wording (2026-10-19)
      { key: "rfc9499", label: "RFC 9499", url: "https://www.rfc-editor.org/rfc/rfc9499" }, // replaces RFC 8499 (2026-10-19)
    ],
  },
  // XML decoder: the XML 1.0 grammar, namespaces, and the entity attack surface.
  "xml-decoder": {
    sources: [
      { key: "xml-1-0", label: "W3C XML 1.0", url: "https://www.w3.org/TR/xml/" },
      { key: "xml-names", label: "W3C Namespaces in XML 1.0", url: "https://www.w3.org/TR/xml-names/" },
      { key: "owasp-xxe", label: "OWASP XXE Prevention Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html" },
    ],
  },
  // XML formatter: added 2026-10-26 with the tool; every source downloaded that day (HTTP 200).
  "xml-formatter": {
    sources: [
      { key: "xml-1-0", label: "W3C XML 1.0 (Fifth Edition)", url: "https://www.w3.org/TR/xml/" },
      { key: "xml-c14n-1-1", label: "W3C Canonical XML 1.1", url: "https://www.w3.org/TR/xml-c14n/" },
      { key: "xmldsig-1-1", label: "W3C XML Signature 1.1", url: "https://www.w3.org/TR/xmldsig-core1/" },
      { key: "saml-core", label: "OASIS SAML 2.0 core", url: "https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf" },
    ],
  },
  // Code to image: added 2026-10-27 with the tool; every source downloaded that day (HTTP 200).
  "code-to-image": {
    sources: [
      { key: "wcag-2-2", label: "WCAG 2.2", url: "https://www.w3.org/TR/WCAG22/" },
      { key: "rfc7468", label: "RFC 7468", url: "https://www.rfc-editor.org/rfc/rfc7468" },
      { key: "http-auth", label: "RFC 9110, RFC 6750 and RFC 7617", ownLabel: true, url: "https://www.rfc-editor.org/rfc/rfc9110" },
      { key: "jwt", label: "RFC 7519 and RFC 7515", ownLabel: true, url: "https://www.rfc-editor.org/rfc/rfc7519" },
      { key: "svg-2-text", label: "SVG 2, Text", url: "https://www.w3.org/TR/SVG2/text.html" },
      { key: "ofl-1-1", label: "SIL Open Font License 1.1", url: "https://openfontlicense.org/open-font-license-official-text/" },
    ],
  },
  // Text encryption: added 2026-10-27 with the tool; every source downloaded on 2026-10-26 and again that day (HTTP 200, same content).
  "text-encryption": {
    sources: [
      { key: "sp800-38d", label: "NIST SP 800-38D", url: "https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf" },
      { key: "cavp-gcm", label: "NIST CAVP GCM test vectors", ownLabel: true, url: "https://csrc.nist.gov/CSRC/media/Projects/Cryptographic-Algorithm-Validation-Program/documents/mac/gcmtestvectors.zip" },
      { key: "pbkdf2", label: "RFC 8018 and RFC 7914", ownLabel: true, url: "https://www.rfc-editor.org/rfc/rfc8018" },
      { key: "owasp-password-storage", label: "OWASP Password Storage Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html" },
      { key: "sp800-132", label: "NIST SP 800-132", url: "https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf" },
      { key: "webcrypto", label: "W3C Web Cryptography API", url: "https://www.w3.org/TR/WebCryptoAPI/" },
      { key: "rfc8265", label: "RFC 8265", url: "https://www.rfc-editor.org/rfc/rfc8265" },
    ],
  },
  // Python traceback explainer: added 2026-10-27 with the tool; every source downloaded that day (HTTP 200).
  "python-traceback-explainer": {
    sources: [
      { key: "traceback-module", label: "Python documentation: traceback", url: "https://docs.python.org/3/library/traceback.html" },
      { key: "builtin-exceptions", label: "Python documentation: Built-in Exceptions", url: "https://docs.python.org/3/builtins/exceptions.html" },
      { key: "pep-657", label: "PEP 657", url: "https://peps.python.org/pep-0657/" },
      { key: "pep-654-678", label: "PEP 654 and PEP 678", ownLabel: true, url: "https://peps.python.org/pep-0654/" },
      { key: "pep-3134", label: "PEP 3134", url: "https://peps.python.org/pep-3134/" },
      { key: "python-versions", label: "Python Developer's Guide: Status of Python versions", url: "https://devguide.python.org/versions/" },
    ],
  },
  // pyproject.toml explainer: added 2026-10-27 with the tool; every source downloaded that day (HTTP 200).
  "pyproject-toml-explainer": {
    sources: [
      { key: "pyproject-spec", label: "Python Packaging User Guide: pyproject.toml specification", url: "https://packaging.python.org/en/latest/specifications/pyproject-toml/" },
      { key: "core-metadata", label: "Python Packaging User Guide: Core metadata 2.6", url: "https://packaging.python.org/en/latest/specifications/core-metadata/" },
      { key: "dependency-specifiers", label: "Python Packaging User Guide: Dependency specifiers", url: "https://packaging.python.org/en/latest/specifications/dependency-specifiers/" },
      { key: "dependency-groups", label: "Python Packaging User Guide: Dependency Groups", url: "https://packaging.python.org/en/latest/specifications/dependency-groups/" },
      { key: "spdx", label: "SPDX License List 3.29.0 and the SPDX 3.0.1 expression annex", ownLabel: true, url: "https://spdx.org/licenses/" },
      { key: "toml", label: "TOML v1.0.0 and v1.1.0", ownLabel: true, url: "https://toml.io/en/v1.0.0" },
    ],
  },
  // Wheel file name explainer: added 2026-10-27 with the tool; every source downloaded that day (HTTP 200).
  "wheel-filename-explainer": {
    sources: [
      { key: "binary-distribution-format", label: "Python Packaging User Guide: Binary distribution format", url: "https://packaging.python.org/en/latest/specifications/binary-distribution-format/" },
      { key: "platform-compatibility-tags", label: "Python Packaging User Guide: Platform compatibility tags", url: "https://packaging.python.org/en/latest/specifications/platform-compatibility-tags/" },
      { key: "version-specifiers", label: "Python Packaging User Guide: Version specifiers", url: "https://packaging.python.org/en/latest/specifications/version-specifiers/" },
      { key: "platform-peps", label: "PEP 600, PEP 656 and PEP 803", ownLabel: true, url: "https://peps.python.org/pep-0600/" },
      { key: "packaging-tags", label: "packaging 26.3: Tags", url: "https://packaging.pypa.io/en/stable/tags.html" },
    ],
  },
  // F5 Distributed Cloud service policy explainer: the published API schema and how-to.
  "f5xc-service-policy-explainer": {
    sources: [
      { key: "service-policy", label: "F5 Distributed Cloud API: ves.io.schema.service_policy", url: "https://docs.cloud.f5.com/docs-v2/api/service-policy" },
      { key: "service-policy-rule", label: "F5 Distributed Cloud API: ves.io.schema.service_policy_rule", url: "https://docs.cloud.f5.com/docs-v2/api/service-policy-rule" },
      { key: "service-policy-how-to", label: "F5 Distributed Cloud: Service Policy how-to", url: "https://docs.cloud.f5.com/docs-v2/multi-cloud-app-connect/how-to/app-security/service-policy" },
    ],
    disclaimer: "vendor-docs",
  },
  // CVSS vector decoder: the FIRST.org v3.1 specification and its reference calculator.
  "cvss-vector-decoder": {
    sources: [
      { key: "specification", label: "FIRST.org: CVSS v3.1 Specification Document", url: "https://www.first.org/cvss/v3.1/specification-document" },
      { key: "calculator", label: "FIRST.org: CVSS v3.1 Calculator", url: "https://www.first.org/cvss/calculator/3.1" },
      { key: "nvd-equations", label: "NVD: CVSS v3.1 Equations", url: "https://nvd.nist.gov/vuln-metrics/cvss/v3-calculator/v31/equations" },
    ],
  },
  // curl command explainer: curl's manual, HTTP semantics and the two translation targets.
  "curl-command-explainer": {
    sources: [
      { key: "curl-man", label: "curl: man page", url: "https://curl.se/docs/manpage.html" },
      { key: "rfc9110", label: "RFC 9110: HTTP Semantics", url: "https://www.rfc-editor.org/rfc/rfc9110" },
      { key: "mdn-fetch", label: "MDN: Using the Fetch API", url: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch" },
      { key: "requests-quickstart", label: "Requests: Quickstart", url: "https://requests.readthedocs.io/en/latest/user/quickstart/" },
    ],
  },
  // CIDR calculator. Basis and sources brought in line with the engine on 2026-10-19 (API sync): the special-purpose
  // classification, the RFC 3021 /31 handling and the VLSM option, and the four modes the API now reaches.
  cidr: {
    sources: [
      { key: "rfc4632", label: "RFC 4632 (CIDR)", url: "https://www.rfc-editor.org/rfc/rfc4632" },
      { key: "rfc1122", label: "RFC 1122, section 3.2.1.3", ownLabel: true, url: "https://www.rfc-editor.org/rfc/rfc1122" }, // added 2026-10-19
      { key: "rfc3021", label: "RFC 3021", url: "https://www.rfc-editor.org/rfc/rfc3021" }, // added 2026-10-19
      { key: "iana-ipv4-special", label: "IANA IPv4 Special-Purpose Address Space", url: "https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry.xhtml" }, // added 2026-10-19; re-read 2026-10-26 when the rows moved to src/lib/iana/special-purpose.ts (batch B, B10)
      { key: "rfc6890", label: "RFC 6890", url: "https://www.rfc-editor.org/rfc/rfc6890" }, // added 2026-10-19
      { key: "rfc1918", label: "RFC 1918", url: "https://www.rfc-editor.org/rfc/rfc1918" },
      { key: "rfc791", label: "RFC 791 (IPv4)", url: "https://www.rfc-editor.org/rfc/rfc791" },
    ],
  },
  // Cipher suite decoder: the IANA registry snapshot and the RFCs behind its flags.
  cipher: {
    sources: [
      { key: "iana-tls-cipher-suites", label: "IANA TLS Cipher Suites registry", ownLabel: true, url: "https://www.iana.org/assignments/tls-parameters/tls-parameters.xhtml#tls-parameters-4" },
      { key: "rfc8446", label: "RFC 8446 (TLS 1.3)", url: "https://www.rfc-editor.org/rfc/rfc8446" },
      { key: "rfc9846", label: "RFC 9846 (TLS 1.3, current revision)", ownLabel: true, url: "https://www.rfc-editor.org/rfc/rfc9846" },
      { key: "rfc8447", label: "RFC 8447", url: "https://www.rfc-editor.org/rfc/rfc8447" },
      { key: "rfc7465", label: "RFC 7465", url: "https://www.rfc-editor.org/rfc/rfc7465" },
      { key: "rfc8429", label: "RFC 8429", url: "https://www.rfc-editor.org/rfc/rfc8429" },
      { key: "ciphersuite-info", label: "ciphersuite.info", url: "https://ciphersuite.info/" },
      { key: "illustrated-tls12", label: "The Illustrated TLS 1.2 Connection (Michael Driscoll)", url: "https://tls12.xargs.org/" },
      { key: "illustrated-tls13", label: "The Illustrated TLS 1.3 Connection (Michael Driscoll)", url: "https://tls13.xargs.org/" },
    ],
  },
  // SSRF URL classifier. Basis (now in the packs) rewritten 2026-10-19b: every IANA special-purpose row, IPv4-compatible
  // and Teredo decoding, anycast flags, 113 vectors (56 before 2026-10-19b).
  "ssrf-url-classifier": {
    sources: [
      { key: "rfc1918", label: "RFC 1918: Address Allocation for Private Internets", url: "https://www.rfc-editor.org/rfc/rfc1918" },
      { key: "rfc3927", label: "RFC 3927: Dynamic Configuration of IPv4 Link-Local Addresses", url: "https://www.rfc-editor.org/rfc/rfc3927" },
      { key: "rfc6598", label: "RFC 6598: IANA-Reserved IPv4 Prefix for Shared Address Space", url: "https://www.rfc-editor.org/rfc/rfc6598" },
      { key: "rfc3986", label: "RFC 3986: Uniform Resource Identifier (URI): Generic Syntax", url: "https://www.rfc-editor.org/rfc/rfc3986" },
      { key: "owasp-ssrf", label: "OWASP: Server Side Request Forgery Prevention Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html" },
      { key: "iana-ipv4-special", label: "IANA: IPv4 Special-Purpose Address Space", url: "https://www.iana.org/assignments/iana-ipv4-special-registry/" }, // added 2026-10-19b; re-read 2026-10-26 (B10, shared table)
      { key: "iana-ipv6-special", label: "IANA: IPv6 Special-Purpose Address Space", url: "https://www.iana.org/assignments/iana-ipv6-special-registry/" }, // added 2026-10-19b; re-read 2026-10-26 (B10, shared table)
      { key: "rfc4291", label: "RFC 4291: IP Version 6 Addressing Architecture", url: "https://www.rfc-editor.org/rfc/rfc4291" }, // added 2026-10-19b
      { key: "rfc6052", label: "RFC 6052: IPv6 Addressing of IPv4/IPv6 Translators", url: "https://www.rfc-editor.org/rfc/rfc6052" }, // added 2026-10-19b
      { key: "rfc4380", label: "RFC 4380: Teredo", url: "https://www.rfc-editor.org/rfc/rfc4380" }, // added 2026-10-19b
    ],
  },
  // Hash preimage finder: the hash standards and the password-storage guidance.
  "hash-preimage-finder": {
    sources: [
      { key: "rfc1321", label: "RFC 1321: The MD5 Message-Digest Algorithm", url: "https://www.rfc-editor.org/rfc/rfc1321" },
      { key: "rfc3174", label: "RFC 3174: US Secure Hash Algorithm 1 (SHA1)", url: "https://www.rfc-editor.org/rfc/rfc3174" },
      { key: "fips-180-4", label: "FIPS 180-4: Secure Hash Standard", url: "https://csrc.nist.gov/pubs/fips/180-4/upd1/final" },
      { key: "owasp-password-storage", label: "OWASP: Password Storage Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html" },
      { key: "sp800-63b", label: "NIST SP 800-63B: Digital Identity Guidelines", url: "https://pages.nist.gov/800-63-3/sp800-63b.html" },
    ],
  },
  // BIG-IP tcpdump builder: F5's tcpdump articles.
  "f5-bigip-tcpdump-builder": {
    sources: [
      { key: "k411", label: "F5 K411", url: "https://my.f5.com/manage/s/article/K411" },
      { key: "k13637", label: "F5 K13637", url: "https://my.f5.com/manage/s/article/K13637" },
    ],
    disclaimer: "vendor-docs",
  },
};

/**
 * The structure of a tool's panel (keys, labels as written, URLs), with no words; the guard reads it.
 * @param toolId the tool's id (its slug)
 * @returns the registry entry, or null when the tool has no panel
 */
export function provenanceEntry(toolId: string): ToolProvenance | null {
  return PROVENANCE[toolId] ?? null; // the entry, or none
} // provenanceEntry

/**
 * Every tool id that has a panel, in registry order; the guard reads it.
 * @returns the ids
 */
export function provenanceToolIds(): string[] {
  return Object.keys(PROVENANCE); // in the order written
} // provenanceToolIds

/**
 * A tool's panel in the page's language: the basis and notes from the pack, own labels from the pack, published titles
 * as published (marked English on pages in other languages).
 * @param toolId the tool's id (its slug)
 * @param t the page's translator for the toolProvenance namespace
 * @param locale the page's locale, so a published English title on another page is marked lang="en"
 * @returns the panel's content, or null when the tool has no panel
 */
export function provenanceFor(toolId: string, t: ProvenanceTranslator, locale: string): ProvenanceView | null {
  const entry = PROVENANCE[toolId]; // the structure
  if (!entry) return null; // no panel for this tool
  const titleLang = locale === "en" ? undefined : ("en" as const); // published titles are English: marked on other pages
  return {
    basis: t(`${toolId}.basis`), // what the tool computes from
    sources: entry.sources.map((s) => ({
      label: s.ownLabel ? t(`${toolId}.sources.${s.key}.label`) : s.label, // our own words translated, a title as published
      ...(s.ownLabel || !titleLang ? {} : { labelLang: titleLang }), // the language mark, only where it differs from the page's
      url: s.url, // the link
      note: t(`${toolId}.sources.${s.key}.note`), // what the tool takes from it
    })), // each source
    disclaimer: entry.disclaimer, // the vendor-docs mark
  }; // the view
} // provenanceFor
