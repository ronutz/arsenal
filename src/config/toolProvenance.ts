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
  // tcpdump command and filter explainer (2026-10-27): the releases tcpdump.org offers (tcpdump 4.99.7; libpcap 1.10.7 stable, 1.11.0 testing), from their manual pages and tagged source.
  "tcpdump-filter-explainer": {
    basis:
      "The text you paste is parsed entirely in your browser: nothing is captured, run, resolved or sent. A command line is split into words as a POSIX shell would split it, then read option by option as the getopt_long of tcpdump 4.99.7 reads it. The filter is tokenized and parsed by our own code following libpcap's scanner and grammar, so defaults, the qualifier shorthand, precedence and the errors libpcap would report come out as libpcap produces them, for libpcap 1.10.7 and 1.11.0 alike, and where the two differ the explanation says which does what. Names are not looked up, so what a name resolves to, and what a link-layer type supports, are stated as unknown.",
    sources: [
      { label: "tcpdump.org, Latest Releases", url: "https://www.tcpdump.org/index.html", note: "tcpdump 4.99.7 and libpcap 1.10.7 stable, libpcap 1.11.0 testing; no support or end-of-life dates are published (read 2026-10-27)" },
      { label: "tcpdump(1) for tcpdump 4.99.7, tcpdump.org", url: "https://www.tcpdump.org/manpages/tcpdump.1-4.99.7.html", note: "Every option, the quoting advice and the TCP flag bits (read 2026-10-27)" },
      { label: "pcap-filter(7) for libpcap 1.11.0, tcpdump.org", url: "https://www.tcpdump.org/manpages/libpcap-1.11.0/pcap-filter.7.html", note: "The filter language: qualifiers and defaults, primitives, precedence, offsets, vlan and mpls, and what changed in which version (read 2026-10-27)" },
      { label: "libpcap scanner.l, grammar.y.in, gencode.c and optimize.c at tags libpcap-1.10.7 and libpcap-1.11.0", url: "https://github.com/the-tcpdump-group/libpcap", note: "Tokens, grouping and qualifier passing, and what each release's compiler refuses (read 2026-10-27)" },
      { label: "tcpdump.c at tag tcpdump-4.99.7", url: "https://github.com/the-tcpdump-group/tcpdump/blob/tcpdump-4.99.7/tcpdump.c", note: "Option letters, long options, argument parsing and bounds (read 2026-10-27)" },
      { label: "GNU Bison manual, How Precedence Works", url: "https://www.gnu.org/software/bison/manual/html_node/How-Precedence.html", note: "Why % and ^ group as they do (read 2026-10-27)" },
    ],
  },
  // Routing table explainer (2026-10-19): field meanings from the commands' manuals, the lookup from RFC 1812.
  "routing-table-explainer": {
    basis:
      "The parse runs entirely in your browser on the text you paste: nothing is sent anywhere, and no route is read from or written to any host. Each line is matched against the layout the command's manual documents, every route is reduced to the same fields (destination prefix, next hop, interface, metric, type, protocol, scope, source, table and flags), and the lookup applies basic match, longest match and the lowest metric, the pruning rules of RFC 1812, over the tables a default Linux policy consults. Anything not understood is shown as printed, never dropped.",
    sources: [
      { label: "ip-route(8), iproute2", url: "https://man7.org/linux/man-pages/man8/ip-route.8.html", note: "Route types, tables, and the via, dev, proto, scope, src, metric, onlink and pref fields (read 2026-10-19)" },
      { label: "ip-rule(8), iproute2", url: "https://man7.org/linux/man-pages/man8/ip-rule.8.html", note: "The three default rules: local, main, default, in that order" },
      { label: "rtnetlink(7)", url: "https://man7.org/linux/man-pages/man7/rtnetlink.7.html", note: "The type, protocol and scope values the kernel defines" },
      { label: "route(8) and netstat(8), net-tools", url: "https://man7.org/linux/man-pages/man8/route.8.html", note: "The Kernel IP routing table columns and the U H G R D M A C ! flags" },
      { label: "netstat(1), FreeBSD 15.1", url: "https://man.freebsd.org/cgi/man.cgi?query=netstat&sektion=1", note: "The BSD flag letters" },
      { label: "netstat.1, Apple network_cmds", url: "https://github.com/apple-oss-distributions/network_cmds/blob/main/netstat.tproj/netstat.1", note: "The macOS flag letters (C, c, I, i, m, r, W, Y, g)" },
      { label: "Microsoft Learn, route and The IP routing table", url: "https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2003/cc779122(v=ws.10)", note: "The route print columns and the lowest-metric rule; Active versus Persistent Routes from KB 2966111" },
      { label: "RFC 1812, section 5.2.4.3", url: "https://www.rfc-editor.org/rfc/rfc1812.txt", note: "Basic match, longest match, and the default route as the route of prefix length zero" },
    ],
  },
  "cgn-port-blocks": {
    basis:
      "Integer arithmetic run in your browser over the port field of a shared IPv4 address. Port blocks: the usable range (1024-65535 unless you change it) is cut into blocks and every subscriber's blocks are counted on one address, as RFC 6888's paired pooling requires; the log figures are RFC 7422's per-session numbers divided by the block size, the factor RFC 7768 gives. Deterministic mapping: RFC 7422 algorithm 0 (Sequential), step by step, forward and reverse, with the configuration record of its section 3. MAP: the port field A | PSID | j of RFC 7597 section 5.1, which MAP-T (RFC 7599) uses unchanged. Times are inputs; nothing reads a clock or the network.",
    sources: [
      { label: "RFC 7422", url: "https://www.rfc-editor.org/rfc/rfc7422.txt", note: "Deterministic mapping: variables, allocation steps, algorithm 0, the section 2.3 example and the section 3 record (read 2026-10-19)" },
      { label: "RFC 7768", url: "https://www.rfc-editor.org/rfc/rfc7768.txt", note: "Port blocks: one log per block, log generation reduced by the block size (read 2026-10-19)" },
      { label: "RFC 6888", url: "https://www.rfc-editor.org/rfc/rfc6888.txt", note: "Paired pooling (REQ-2), per-subscriber port limits (REQ-4), the 120-second quarantine (REQ-8) (read 2026-10-19)" },
      { label: "RFC 7597", url: "https://www.rfc-editor.org/rfc/rfc7597.txt", note: "The MAP port-mapping algorithm, section 5.1 and Appendices A and B (read 2026-10-19)" },
      { label: "RFC 7599", url: "https://www.rfc-editor.org/rfc/rfc7599.txt", note: "MAP-T uses RFC 7597's port mapping; erratum 5324 corrects its Example 5 PSID to 0x34 (read 2026-10-19)" },
      { label: "RFC 6269", url: "https://www.rfc-editor.org/rfc/rfc6269.txt", note: "Port allocation, traceability and the multiplicative factor (read 2026-10-19)" },
      { label: "RFC 6302", url: "https://www.rfc-editor.org/rfc/rfc6302.txt", note: "Servers log the source port and a UTC timestamp to the second (read 2026-10-19)" },
      { label: "RFC 6335", url: "https://www.rfc-editor.org/rfc/rfc6335.txt", note: "System Ports 0-1023, User Ports 1024-49151, Dynamic Ports 49152-65535 (read 2026-10-19)" },
    ],
  },
  "bfd-timers": {
    // Added 2026-10-19 with the tool; every source downloaded that day (HTTP 200).
    basis:
      "Everything is computed in your browser from the numbers you enter, by the rules of RFC 5880: in each direction the agreed transmit interval is the larger of the sender's Desired Min TX and the receiver's Required Min RX (sections 6.8.2 and 6.8.7), each interval is shortened by a random 0 to 25% (10 to 25% with a Detect Mult of 1), and the receiver's detection time is the sender's Detect Mult times that interval in Asynchronous mode, or its own Detect Mult times its own agreed transmit interval in Demand mode (section 6.8.4). While the session is not Up every Desired Min TX is raised to one second (section 6.8.3). Echo follows section 6.8.9 and RFC 5883 section 3; Common Intervals follow RFC 7419. Implementation floors are reported only where a vendor document states one. The packet decoder reads the RFC 5880 section 4.1 layout and applies the section 6.8.6 receive checks. Behaviour is pinned by 42 golden vectors.",
    sources: [
      { label: "RFC 5880 (BFD)", url: "https://www.rfc-editor.org/rfc/rfc5880.txt", note: "The packet fields, the timer negotiation, jitter, the detection time, the slow start, Demand mode, Echo and the receive checks" },
      { label: "RFC 5881 (BFD single hop)", url: "https://www.rfc-editor.org/rfc/rfc5881.txt", note: "UDP ports 3784 and 3785 and the TTL of 255" },
      { label: "RFC 5883 (BFD multihop)", url: "https://www.rfc-editor.org/rfc/rfc5883.txt", note: "UDP port 4784 and no Echo over multiple hops" },
      { label: "RFC 7419 (Common Interval Support in BFD)", url: "https://www.rfc-editor.org/rfc/rfc7419.txt", note: "The Common Interval set, the 10 s graceful-restart interval and adjustment towards larger intervals" },
      { label: "FRRouting documentation, BFD (bfdd)", url: "https://docs.frrouting.org/en/latest/bfd.html", note: "The 10 ms floor of receive-interval, transmit-interval and echo receive-interval, the defaults, and the worked examples the golden vectors reproduce" },
      { label: "Junos OS 13.1, bfd-liveness-detection (2013)", url: "https://juniper.net/documentation/en_US/junos13.1/topics/reference/configuration-statement/bfd-liveness-detection-edit-protocols-bgp.html", note: "The 1 to 255,000 ms range of minimum-interval in that release" },
      { label: "IANA BFD Parameters", url: "https://www.iana.org/assignments/bfd-parameters/bfd-parameters.xhtml", note: "Diagnostic code 9 and authentication types 6 to 8 the decoder names" },
    ],
  },
  // Route origin validation calculator (2026-10-19).
  "rpki-origin-validation": {
    basis:
      "The validation runs entirely in your browser on the route and the VRP list you supply: nothing is fetched from any RPKI repository, validator or route collector, so the verdict holds for that list only. It applies RFC 6811 section 2 word for word: a VRP covers the route when its prefix length is no longer than the route's and the two agree on every bit of the VRP's length, and matches when it also allows the route's length and names the route's origin; Valid means at least one VRP matches, Invalid that at least one covers and none matches, NotFound that none covers. AS 0 VRPs cover and never match (RFC 6811 section 2, RFC 6483 section 4), a route with origin AS 0 is refused as malformed (RFC 7607 section 2), and every VRP whose maxLength reaches past its own prefix is reported with the number of prefixes it authorises, the case RFC 9319 asks operators to avoid. Behaviour is pinned by 40 golden vectors.",
    sources: [
      { label: "RFC 6811: BGP Prefix Origin Validation", url: "https://www.rfc-editor.org/rfc/rfc6811", note: "Covered, Matched and the three states; NONE and AS 0 (section 2), read 2026-10-19" },
      { label: "RFC 9582: A Profile for Route Origin Authorizations (ROAs)", url: "https://www.rfc-editor.org/rfc/rfc9582", note: "maxLength's range and meaning (section 4.3.2.2) and the IPv6 example ROA (Appendix A); obsoletes RFC 6482, read 2026-10-19" },
      { label: "RFC 6483: Validation of Route Origination Using the Resource Certificate PKI and ROAs", url: "https://www.rfc-editor.org/rfc/rfc6483", note: "AS 0 ROAs as a disavowal of routing (section 4), read 2026-10-19" },
      { label: "RFC 7607: Codification of AS 0 Processing", url: "https://www.rfc-editor.org/rfc/rfc7607", note: "A route with AS 0 in its AS_PATH is malformed (section 2), read 2026-10-19" },
      { label: "RFC 9319: The Use of maxLength in the RPKI", url: "https://www.rfc-editor.org/rfc/rfc9319", note: "Minimal ROAs and the advice to avoid maxLength (section 5), read 2026-10-19" },
      { label: "RFC 8416: SLURM", url: "https://www.rfc-editor.org/rfc/rfc8416", note: "prefixAssertions as VRPs and the members a SLURM file may use (sections 3.1, 3.2, 3.4.1), read 2026-10-19" },
      { label: "RFC 5396: Textual Representation of AS Numbers", url: "https://www.rfc-editor.org/rfc/rfc5396", note: "asplain, asdot+ and asdot (section 2), read 2026-10-19" },
    ],
  },
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
  "openssl-s-client-explainer": {
    basis:
      "The explanation is read entirely in your browser from the command and the output you paste. Nothing is connected to, resolved or run; the engine reads the text against the manual pages of OpenSSL 3.5, the long-term-support release, and the layout s_client prints, as OpenSSL's own source writes it.",
    sources: [
      { label: "OpenSSL Library, release strategy", url: "https://openssl-library.org/policies/releasestrat/", note: "Why 3.5: supported until 2030-04-08, while 3.6 ends on 2026-11-01 (read 2026-10-27)" },
      { label: "OpenSSL 3.5, openssl-s_client(1)", url: "https://docs.openssl.org/3.5/man1/openssl-s_client/", note: "Every option and its default: SNI, -verify, -verify_return_error, -showcerts, -starttls (read 2026-10-27)" },
      { label: "OpenSSL 3.5, X509_STORE_CTX_get_error(3)", url: "https://docs.openssl.org/3.5/man3/X509_STORE_CTX_get_error/", note: "The verification codes behind Verify return code, as openssl-verify(1) points to them (read 2026-10-27)" },
      { label: "OpenSSL 3.5, openssl-verification-options(1)", url: "https://docs.openssl.org/3.5/man1/openssl-verification-options/", note: "Trust store options, -verify_hostname and the rest of the verification options (read 2026-10-27)" },
      { label: "OpenSSL source, tag openssl-3.5.9, apps/s_client.c", url: "https://github.com/openssl/openssl/blob/openssl-3.5.9/apps/s_client.c", note: "The layout of what s_client prints, read with apps/lib/s_cb.c, apps/lib/s_socket.c and ssl/ssl_txt.c (read 2026-10-27)" },
      { label: "RFC 9846: TLS 1.3", url: "https://www.rfc-editor.org/rfc/rfc9846", note: "Post-handshake tickets, the certificate list, the extended main secret (July 2026; read 2026-10-27)" },
      { label: "RFC 9325: Recommendations for Secure Use of TLS and DTLS", url: "https://www.rfc-editor.org/rfc/rfc9325", note: "The cipher suite and TLS 1.2 findings (read 2026-10-27)" },
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
  "xml-formatter": {
    // Added 2026-10-26 with the tool; every source downloaded that day (HTTP 200).
    basis:
      "The document is checked and formatted entirely in your browser. One pass reads it against the XML 1.0 (Fifth Edition) grammar and its well-formedness constraints and reports the first failure with its line and column. Nothing is expanded or fetched: references are copied as written and the DOCTYPE is kept as text. Formatting changes only the white space between child elements; mixed content, CDATA sections, comments, processing instructions, attribute values and anything under xml:space=\"preserve\" are copied as written, as section 2.10 asks. Behaviour is pinned by 62 golden vectors.",
    sources: [
      { label: "W3C XML 1.0 (Fifth Edition)", url: "https://www.w3.org/TR/xml/", note: "Well-formedness, white space handling and xml:space (2.10), mixed content (3.2.2), references and the entity constraints (4.1) (read 2026-10-26)" },
      { label: "W3C Canonical XML 1.1", url: "https://www.w3.org/TR/xml-c14n/", note: "White space in character content is retained, which is why a signed document must not be reformatted" },
      { label: "W3C XML Signature 1.1", url: "https://www.w3.org/TR/xmldsig-core1/", note: "Reference validation digests the transformed data and fails on any mismatch (section 3.2.1)" },
      { label: "OASIS SAML 2.0 core", url: "https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf", note: "Exclusive Canonicalization for SAML signatures (section 5.4.3), and the names used in the Example" },
    ],
  },
  "code-to-image": {
    // Added 2026-10-27 with the tool; every source downloaded that day (HTTP 200).
    basis:
      "The picture is made entirely in your browser. Each language is highlighted by a small scanner written from its own reference (POSIX.1-2024, Python 3.15, RFC 8259, YAML 1.2.2, Tcl 9.0, F5's TMSH Reference v17, FortiOS 7.6.8, Cisco IOS XE 17.x); nothing is parsed or run. Before anything is drawn, a secrets check looks for formats documented by their own standards and vendors (PEM private keys, Authorization headers, AWS access key IDs, JWTs, passwords in URLs, FortiOS ENC values, tmsh and Cisco password attributes, secret-looking assignments) and replaces each value with bullets unless you untick it. Both palettes meet WCAG 2.2's 4.5:1 for every text colour. Behaviour is pinned by 113 golden vectors.",
    sources: [
      { label: "WCAG 2.2", url: "https://www.w3.org/TR/WCAG22/", note: "Images of text (1.4.5), text alternatives (1.1.1), contrast for text and images of text (1.4.3) and the luminance and contrast formulas (read 2026-10-27)" },
      { label: "RFC 7468", url: "https://www.rfc-editor.org/rfc/rfc7468", note: "The PEM boundaries and the PRIVATE KEY and ENCRYPTED PRIVATE KEY labels" },
      { label: "RFC 9110, RFC 6750 and RFC 7617", url: "https://www.rfc-editor.org/rfc/rfc9110", note: "The Authorization field, Bearer tokens and Basic credentials" },
      { label: "RFC 7519 and RFC 7515", url: "https://www.rfc-editor.org/rfc/rfc7519", note: "JWTs as JWS or JWE compact serialisations, base64url, the required alg" },
      { label: "SVG 2, Text", url: "https://www.w3.org/TR/SVG2/text.html", note: "One x position per character, counted in code points, so the columns hold in any font" },
      { label: "SIL Open Font License 1.1", url: "https://openfontlicense.org/open-font-license-official-text/", note: "JetBrains Mono, named in the SVG and drawn in the PNG" },
    ],
  },
  "text-encryption": {
    // Added 2026-10-27 with the tool; every source downloaded on 2026-10-26 and again that day (HTTP 200, same content).
    basis:
      "Your text is encrypted and decrypted entirely in your browser, by its own Web Cryptography API; no cryptographic code is written in the page. The passphrase is prepared as RFC 8265 says (non-ASCII spaces become spaces, accents are composed), PBKDF2 with HMAC-SHA-256 and 600,000 iterations turns it and a random 16-byte salt into an AES-256 key, and AES-GCM seals the text with a random 12-byte IV and a 128-bit tag that also covers the string's header. Decryption gives the whole text or nothing. The salt and the IV are drawn by the page and passed to a pure engine, so its behaviour is pinned byte for byte by 78 golden vectors, including NIST's and RFC 7914's published known answers.",
    sources: [
      { label: "NIST SP 800-38D", url: "https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf", note: "AES-GCM: 96-bit IVs, the 128-bit tag, the plaintext or FAIL, IV uniqueness and the limit with random IVs (sections 5.2.1, 7.2, 8, 8.2.2, 8.3; read 2026-10-27)" },
      { label: "NIST CAVP GCM test vectors", url: "https://csrc.nist.gov/CSRC/media/Projects/Cryptographic-Algorithm-Validation-Program/documents/mac/gcmtestvectors.zip", note: "The AES-256 encryption and decryption known answers the engine is checked against" },
      { label: "RFC 8018 and RFC 7914", url: "https://www.rfc-editor.org/rfc/rfc8018", note: "PBKDF2 (section 5.2), and RFC 7914's PBKDF2-HMAC-SHA-256 test vectors (section 11)" },
      { label: "OWASP Password Storage Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html", note: "600,000 iterations for PBKDF2-HMAC-SHA256" },
      { label: "NIST SP 800-132", url: "https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf", note: "A random salt of at least 128 bits; iteration counts from 1,000 to 10,000,000; offline guessing" },
      { label: "W3C Web Cryptography API", url: "https://www.w3.org/TR/WebCryptoAPI/", note: "getRandomValues, AES-GCM, PBKDF2, the secure-context rule and the security considerations" },
      { label: "RFC 8265", url: "https://www.rfc-editor.org/rfc/rfc8265", note: "The OpaqueString profile's space mapping and normalisation (section 4.2.2)" },
    ],
  },
  "python-traceback-explainer": {
    // Added 2026-10-27 with the tool; every source downloaded that day (HTTP 200).
    basis:
      "The traceback is read entirely in your browser, line by line, against the format CPython 3.11 to 3.15 print: the frames, the ^ and ~ markers of PEP 657, the exception line, notes, SyntaxError locations, the two chaining banners and exception groups. Nothing is run. Each exception is looked up in a table of the built-in classes and the standard-library classes network scripts meet, whose class chains were printed by CPython 3.11.17, 3.12.3, 3.13.16 and 3.14.2 themselves. Behaviour is pinned by 111 golden vectors, whose expected structure was written from the exception objects, not from the parser.",
    sources: [
      { label: "Python documentation: traceback", url: "https://docs.python.org/3/library/traceback.html", note: "The layout of frames, the exception line, notes, chains and groups, and the group limits (read 2026-10-27, with the 3.11 to 3.14 editions)" },
      { label: "Python documentation: Built-in Exceptions", url: "https://docs.python.org/3/builtins/exceptions.html", note: "The class hierarchy and what each exception means" },
      { label: "PEP 657", url: "https://peps.python.org/pep-0657/", note: "Fine-grained error locations: the ^ and ~ markers" },
      { label: "PEP 654 and PEP 678", url: "https://peps.python.org/pep-0654/", note: "Exception groups, and notes added to exceptions" },
      { label: "PEP 3134", url: "https://peps.python.org/pep-3134/", note: "Exception chaining: __cause__, __context__ and the two banners" },
      { label: "Python Developer's Guide: Status of Python versions", url: "https://devguide.python.org/versions/", note: "3.11 to 3.15 supported; 3.10 end of life on 2026-10-01" },
    ],
  },
  "pyproject-toml-explainer": {
    // Added 2026-10-27 with the tool; every source downloaded that day (HTTP 200).
    basis:
      "The file is read entirely in your browser by the tool's own TOML parser (all of TOML 1.0.0, and TOML 1.1.0 with a warning), then explained key by key and checked against the packaging specifications. Each finding is an error when the specification says MUST or MUST NOT, a warning for SHOULD, MAY-refuse and deprecations, and a note otherwise. Nothing the file names is opened, fetched, installed or imported. Behaviour is pinned by 96 golden vectors whose TOML values come from Python's tomllib and tomli, and whose dependency and license verdicts come from packaging 26.3.",
    sources: [
      { label: "Python Packaging User Guide: pyproject.toml specification", url: "https://packaging.python.org/en/latest/specifications/pyproject-toml/", note: "The tables, every [project] key, dynamic and the PEP 808 list and table keys (read 2026-10-27)" },
      { label: "Python Packaging User Guide: Core metadata 2.6", url: "https://packaging.python.org/en/latest/specifications/core-metadata/", note: "Description-Content-Type, Project-URL, Provides-Extra, Import-Name" },
      { label: "Python Packaging User Guide: Dependency specifiers", url: "https://packaging.python.org/en/latest/specifications/dependency-specifiers/", note: "The grammar, environment markers and their field types" },
      { label: "Python Packaging User Guide: Dependency Groups", url: "https://packaging.python.org/en/latest/specifications/dependency-groups/", note: "Groups, includes and cycles (PEP 735)" },
      { label: "SPDX License List 3.29.0 and the SPDX 3.0.1 expression annex", url: "https://spdx.org/licenses/", note: "The identifiers, deprecations and expression grammar" },
      { label: "TOML v1.0.0 and v1.1.0", url: "https://toml.io/en/v1.0.0", note: "The language the parser implements; tomllib reads 1.1.0 only from Python 3.15" },
    ],
  },
  "wheel-filename-explainer": {
    // Added 2026-10-27 with the tool; every source downloaded that day (HTTP 200).
    basis:
      "The file name or the versions are read entirely in your browser, by string scanning and comparison; nothing is downloaded. The parts and tags follow the binary and source distribution formats and the platform compatibility tags specification; the interpreter check builds the installer's tag list as packaging 26.3 builds it. Versions and specifier sets follow the version specifiers specification. Behaviour is pinned by 134 golden vectors whose verdicts come from packaging 26.3.",
    sources: [
      { label: "Python Packaging User Guide: Binary distribution format", url: "https://packaging.python.org/en/latest/specifications/binary-distribution-format/", note: "The file name convention, escaping and the build tag (read 2026-10-27)" },
      { label: "Python Packaging User Guide: Platform compatibility tags", url: "https://packaging.python.org/en/latest/specifications/platform-compatibility-tags/", note: "Python, ABI and platform tags, compressed tag sets, how installers use them" },
      { label: "Python Packaging User Guide: Version specifiers", url: "https://packaging.python.org/en/latest/specifications/version-specifiers/", note: "The version scheme, normalization, ordering, operators and pre-releases (originally PEP 440)" },
      { label: "PEP 600, PEP 656 and PEP 803", url: "https://peps.python.org/pep-0600/", note: "manylinux_x_y, musllinux_x_y and abi3t" },
      { label: "packaging 26.3: Tags", url: "https://packaging.pypa.io/en/stable/tags.html", note: "The order of the installer's tag list" },
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
      "All results are computed locally from the blocks you enter, using standard IPv4 addressing arithmetic: one block's network, mask, host range and counts (a /31 counts two usable hosts, RFC 3021); variable-length subnets carved from a parent, largest block first, with the free space left as blocks; the minimal aggregate and single supernet of a list; and the overlaps and gaps among prefixes. The special-purpose classification compares a block with an embedded copy of the IANA IPv4 Special-Purpose Address Space registry, read on 2026-10-26 and shared with the SSRF URL classifier, plus the multicast range 224.0.0.0/4; nothing is looked up remotely and nothing is sent anywhere. Behaviour is pinned by 26 golden vectors.",
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
        note: "Every row of the special-purpose classification, with its flags (registry updated 2025-10-09, read 2026-10-26)", // added 2026-10-19; re-read 2026-10-26 when the rows moved to src/lib/iana/special-purpose.ts (batch B, B10)
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
      "The classifier decides purely from the URL string and never touches the network: it does not resolve DNS and never issues the request (D-53). It extracts the host from the raw input (not from a normalizing URL parser, which would erase the obfuscation), decodes the inet_aton spellings of an IPv4 address (decimal, octal, hex, short-form), normalises every IPv6 spelling to its RFC 5952 form, and decodes the IPv4 address carried inside six IPv6 layouts: IPv4-mapped (::ffff:0:0/96), the deprecated IPv4-compatible ::a.b.c.d, NAT64 (64:ff9b::/96 and 64:ff9b:1::/48), 6to4 (2002::/16) and Teredo (2001::/32, whose server address and XOR-obfuscated client address are both shown, the more internal one deciding). Every one of the 25 IPv4 and 25 IPv6 rows of the IANA Special-Purpose Address Space registries (read 2026-10-26; the CIDR calculator reads the same copy of the IPv4 rows) is matched most specific first and rated by its own name and Globally Reachable flag: not globally reachable rates reserved unless the row is loopback, private, link-local or CGNAT; globally reachable rates public but is named, and the anycast service addresses (192.0.0.9, 192.0.0.10, 2001:1::1, 2001:1::2, 2001:1::3, and the 6a44 relay 192.88.99.2) are flagged as such. The cloud metadata addresses (169.254.169.254, metadata.google.internal, fd00:ec2::254, 100.100.100.200) outrank their covering rows. Dangerous non-HTTP schemes (file, gopher, dict, ftp, ldap, and similar) and embedded credentials are flagged. The range definitions come from the IANA registries and the RFCs they cite, the SSRF guidance from the OWASP SSRF prevention cheat sheet; behavior is pinned by 113 golden vectors.", // 56 before 2026-10-19b
    sources: [
      { label: "RFC 1918: Address Allocation for Private Internets", url: "https://www.rfc-editor.org/rfc/rfc1918", note: "private IPv4 ranges" },
      { label: "RFC 3927: Dynamic Configuration of IPv4 Link-Local Addresses", url: "https://www.rfc-editor.org/rfc/rfc3927", note: "169.254.0.0/16 link-local" },
      { label: "RFC 6598: IANA-Reserved IPv4 Prefix for Shared Address Space", url: "https://www.rfc-editor.org/rfc/rfc6598", note: "100.64.0.0/10 CGNAT" },
      { label: "RFC 3986: Uniform Resource Identifier (URI): Generic Syntax", url: "https://www.rfc-editor.org/rfc/rfc3986", note: "URL structure" },
      { label: "OWASP: Server Side Request Forgery Prevention Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html", note: "SSRF defenses" },
      { label: "IANA: IPv4 Special-Purpose Address Space", url: "https://www.iana.org/assignments/iana-ipv4-special-registry/", note: "all 25 rows, read 2026-10-26 (registry updated 2025-10-09)" }, // added 2026-10-19b; re-read 2026-10-26 (B10, shared table)
      { label: "IANA: IPv6 Special-Purpose Address Space", url: "https://www.iana.org/assignments/iana-ipv6-special-registry/", note: "all 25 rows, read 2026-10-26 (registry updated 2025-10-09)" }, // added 2026-10-19b; re-read 2026-10-26 (B10, shared table)
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
