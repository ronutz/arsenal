// ============================================================================
// src/content/changelog/changelog.ts
// ----------------------------------------------------------------------------
// THE CHANGELOG - a dated record of major changes to ronutz.com: new tools,
// new Learn articles, and significant features or infrastructure changes.
//
// This is the single source of truth for the /changelog page. It is maintained
// in ENGLISH ONLY and rendered the same in every locale.
//
// TO ADD AN ENTRY: prepend a new object to the top of CHANGELOG (the array is
// kept newest-first). Use an ISO date ("YYYY-MM-DD"); an optional `time` may be
// added for same-day ordering. Keep `title` short and `body` to one to three
// plain sentences. Link the entry to whatever it describes: `tools` for tool
// slugs, `articles` for Learn article slugs, and `links` for any other feature
// or page (label + locale-agnostic href). Everything an entry announces should
// be reachable from it.
//
// Dates reflect the day a change shipped. Where several tools shipped on the
// same day, they are listed in the order they were built.
// ============================================================================

export type ChangelogKind = "launch" | "tool" | "feature" | "i18n" | "content" | "infra";

export interface ChangelogEntry {
  /** ISO date, "YYYY-MM-DD". */
  date: string;
  /** Optional "HH:MM" for ordering several entries on the same day. */
  time?: string;
  kind: ChangelogKind;
  title: string;
  body: string;
  /** Optional tool slugs this entry concerns (linked to /tools/<slug>). */
  tools?: string[];
  /** Optional Learn article slugs this entry concerns (linked to /learn/<slug>). */
  articles?: string[];
  /** Optional labeled links to features or pages this entry concerns
   *  (e.g. { label: "Disclaimer page", href: "/disclaimer" }). Locale-agnostic
   *  hrefs; the i18n Link prefixes the active locale. */
  links?: { label: string; href: string }[];
}

/** Human label for each kind, shown as a badge. */
export const KIND_LABEL: Record<ChangelogKind, string> = {
  launch: "Launch",
  tool: "New tool",
  feature: "Feature",
  i18n: "Localization",
  content: "Content",
  infra: "Infrastructure",
};

// Newest first.
export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "2026-07-21T17:21:35-03:00",
    kind: "tool",
    tools: ["zscaler-firewall-rule-order-simulator"],
    title: "ZIA firewall rule-order simulator",
    body: "Paste Firewall Filtering rules and a flow; watch ascending-order, first-match evaluation execute, with the deny-by-default Default rule catching fallthrough and pairwise shadow findings naming the rules that can never fire. Grounded in three pinned Zscaler Help pages; 14 golden vectors.",
  },
  {
    date: "2026-07-21T17:21:35-03:00",
    kind: "content",
    tools: [],
    title: "Zscaler wave 1b: the platform foundations, in en + pt-BR",
    body: "Seven Learn articles land the Zscaler program's core: the Zero Trust Exchange architecture, ZIA traffic forwarding methods, the three tunnel types with Zscaler's published capacity figures, Client Connector forwarding and app profiles, ZPA's App Connectors and Service Edges, ZIA TLS inspection policy and bypasses, and the Cloud Firewall's rule-order semantics - each depending on the fundamentals layer shipped first, per the fundamentals-first standing rule.",
  },
  {
    date: "2026-07-21T16:39:45-03:00",
    kind: "tool",
    tools: ["zscaler-tunnel-chooser"],
    title: "Zscaler Tunnel Chooser: GRE vs IPsec, sized from the vendor's own figures",
    body: "First native Zscaler tool. Six answers about a location - bandwidth, HA, static IP, encryption mandate, GRE support, endpoint NAT - return the deterministic tunnel recommendation with the minimum primary and backup counts, computed from Zscaler's published per-tunnel figures (GRE 1 Gbps, 250 Mbps under source NAT, IPsec 400 Mbps per source IP), every elimination step shown and sourced.",
    links: [
      { label: "Open the tool", href: "/tools/zscaler-tunnel-chooser" },
      { label: "GRE fundamentals", href: "/learn/gre-tunnels-fundamentals" },
    ],
  },
  {
    date: "2026-07-21T16:39:45-03:00",
    kind: "content",
    title: "The fundamentals layer opens the Zscaler program (R-8)",
    body: "Four vendor-neutral fundamentals articles land in English and Portuguese as the knowledge dependencies of the Zscaler wave: GRE tunnels, IPsec and IKE, tunnel overhead with MTU and MSS clamping, and how inline proxies authenticate users - the first program cut under the fundamentals-first coverage rule, with existing fundamentals linked rather than duplicated.",
    links: [
      { label: "GRE tunnels", href: "/learn/gre-tunnels-fundamentals" },
      { label: "IPsec and IKE", href: "/learn/ipsec-and-ike-fundamentals" },
      { label: "Tunnel overhead, MTU and MSS", href: "/learn/tunnel-overhead-mtu-and-mss" },
      { label: "Proxy user authentication", href: "/learn/proxy-user-authentication-methods" },
    ],
  },
  {
    date: "2026-07-21",
    time: "04:07",
    kind: "content",
    title: "Nine blueprints land: the six in-preparation F5 certifications go live with 133 verbatim objectives",
    body: "The six F5 certifications that entered the rail as in-preparation placeholders are now fully published study guides. PRIME relayed the official exam blueprint PDFs, and every objective and example bullet was transcribed verbatim - BIG-IP DNS Specialist (302) with 16 objectives mapped onto the GTM/DNS shelf, BIG-IP ASM Specialist (303) with 25 objectives mapped onto the Advanced WAF shelf, BIG-IP APM Specialist (304) with 30 objectives mapped onto the access-and-identity shelf, Security Solutions (401) with 17 and Cloud Solutions (402) with 29 objectives, and the four NGINX administrator exams (F5N1 through F5N4) with 16 objectives across management, configuration, and troubleshooting. Each guide carries the official exam facts fetched from the F5 Education Services catalog the same day: cost, time limit, passing score, delivery, and prerequisites. Where a blueprint publishes objectives without example bullets (401 and 402), the study notes stay empty by honesty, and two typos printed in the 402 source are preserved exactly as published. The certification registry now stands at 22 guides, 10 certifications, and 277 verbatim objectives.",
    links: [
      { label: "All certifications", href: "/certifications" },
      { label: "BIG-IP DNS Specialist (302)", href: "/certifications/f5-cts-dns-302" },
      { label: "BIG-IP ASM Specialist (303)", href: "/certifications/f5-cts-asm-303" },
      { label: "BIG-IP APM Specialist (304)", href: "/certifications/f5-cts-apm-304" },
    ],
  },
  {
    date: "2026-07-21",
    time: "02:51",
    kind: "feature",
    title: "The API page now teaches self-hosting: download, flip one switch, serve",
    body: "The API reference page gained the walkthrough it was missing: how to consume every tool as an API by running the toolbox yourself. The path is four steps and deliberately short - download the open-source repository, open src/config/apiSurface.ts and flip the single API_PROCESSING switch from 0 to 1, build and deploy to your own Cloudflare Workers account with the adapter already wired in, and call the endpoints now answered by your deployment on your domain. The same value drives both the Worker that serves and every badge in the interface, and it works in both directions - flip back to 0 and the surface returns to documented-but-not-served. Self-hosting plus a flip of a switch make it an API toolbox. The vendor hubs page also tightened its Red Education callout into the plain six-vendor list.",
    links: [
      { label: "The API page", href: "/api" },
      { label: "Vendor hubs", href: "/vendor-hubs" },
    ],
  },
  {
    date: "2026-07-21",
    time: "02:23",
    kind: "content",
    title: "The Zscaler ZDTA study guide arrives, six F5 certifications join the rail, and the Learn doors get their glow-up",
    body: "Three moves in one release. First: the Zscaler Digital Transformation Administrator (ZDTA) study guide is live - all forty-four scenario objectives transcribed verbatim from the official ZDTA study guide's expansive blueprint, grouped exactly as Zscaler presents them across the six weighted domains, with the official exam facts and both source documents linked. It is the site's first certification guide beyond F5. Second: six more F5 certifications enter the registry as the rail's roadmap - BIG-IP DNS (302), ASM (303), APM (304), Security Solutions (401), Cloud Solutions (402), and the four-exam NGINX administrator track - each with its official catalog page linked and an in-preparation badge until the blueprints land. Third: the Glossary and Study guides doors on the Learn index traded two long phrases for proper feature cards - type ornaments, per-card accent colors, and live count badges pulled straight from the registries.",
    links: [
      { label: "Zscaler ZDTA study guide", href: "/certifications/zscaler-zdta" },
      { label: "All certifications", href: "/certifications" },
      { label: "The Learn library", href: "/learn" },
    ],
  },
  {
    date: "2026-07-21",
    time: "01:59",
    kind: "content",
    title: "Eleven fundamentals and the F5 study guide: full coverage of the retired 101-201-301 blueprints",
    body: "A coverage audit of the four retired F5 blueprints against the article shelf found eleven true holes, and eleven rich articles now fill them in English and Portuguese: the OSI model in practice, switch-router-firewall roles, ARP and MAC addresses (gratuitous ARP and MAC masquerading included), routing tables and the default gateway, NAT, the DHCP lease lifecycle, ICMP with ping and traceroute, the TCP connection lifecycle, VPN fundamentals, and - on the F5 side - EUD hardware diagnostics and AVR analytics. With the holes closed, the BIG-IP reading path on the study guides page grew into the F5 study guide proper: sixty-three articles in teaching order spanning everything the retired 101, 201, 301A, and 301B blueprints listed, from fundamentals through administration to the LTM specialist craft, with a fourteen-tool practice bench. The vendor-neutral fundamentals are flagged in code for reuse: when reading paths arrive for the other vendors, the shared floor is already marked for cross-reference.",
    links: [
      { label: "The F5 study guide: BIG-IP end to end", href: "/study-guides" },
      { label: "The OSI model in practice", href: "/learn/osi-model-in-practice" },
      { label: "The TCP connection lifecycle", href: "/learn/tcp-connection-lifecycle" },
    ],
  },
  {
    date: "2026-07-21",
    time: "01:32",
    kind: "content",
    title: "Old blueprints against new: what 101, 201, 301A, and 301B taught that the modern F5 exams dropped",
    body: "Two comparison articles close the loop on the F5 certification rail. The retired blueprints - 101 Application Delivery Fundamentals, 201 TMOS Administration, and the 301A/301B LTM Specialist pair - were laid beside the current F5-CA and F5-CTS LTM blueprints, objective by objective. The verdicts differ by track: the new CA is the old 201 restructured, but it dropped the entire 101 fundamentals layer (OSI, subnetting, ARP, ICMP, TLS rationale, VPN) and 201's whole support-resources section (support tickets, EUD hardware diagnostics, the qkview-iHealth workflow, DevCentral and AskF5); the new LTM track is a faithful restructure whose entire meaningful delta is three items - serial failover, ssldump, and the roles-partitions-route-domains synthesis. Each article names what fell away, why it still matters on the job, and where this site covers it.",
    links: [
      { label: "From 101 and 201 to F5-CA", href: "/learn/f5-ca-vs-retired-101-201" },
      { label: "From 301A and 301B to the new LTM Specialist", href: "/learn/f5-cts-ltm-vs-retired-301a-301b" },
      { label: "Certifications hub", href: "/certifications" },
    ],
  },
  {
    date: "2026-07-21",
    time: "01:10",
    kind: "content",
    title: "Fourteen BIG-IP articles close every gap on the F5 study guides",
    body: "Hours after the F5-CA and F5-CTS LTM guides went live with twenty-three honest Article-coming markers, the articles arrived. Fourteen new pieces in English and Portuguese cover the ground the site had never taught: the high availability cluster (device trust, device groups, and traffic groups; failover states and operations; config sync), UCS archives, the /var/log map, management access and port lockdown, the DNS-NTP-SNMP-syslog service quartet, reading device status from LCD panel to netstat, route domains, vCMP, custom alerting, iApps and FAST templates, the interface-to-self-IP dependency chain, and the qkview-iHealth support workflow. Every one is wired into the guide objectives it teaches: both F5 certification tracks now carry zero gaps - all one hundred objectives hold study notes and at least one article on this site. The study guides page also got two touches: reading-path cards now carry their category color on the left border instead of uniform cyan, and the certification card grid that duplicated the certifications hub was retired in favor of a signpost - one canonical home.",
    links: [
      { label: "F5CAB4: Control Plane Administration, now gapless", href: "/certifications/f5-ca-control-plane-administration" },
      { label: "BIG-IP high availability concepts", href: "/learn/bigip-ha-concepts-device-trust-groups" },
      { label: "qkview and iHealth", href: "/learn/bigip-qkview-and-ihealth" },
    ],
  },
  {
    date: "2026-07-21",
    time: "00:53",
    kind: "content",
    title: "Fourteen BIG-IP articles close every gap on the F5 study guides",
    body: "Hours after the F5-CA and F5-CTS LTM guides went live with twenty-three honest article-coming markers, the articles arrived. Fourteen new pieces in the networking category cover the whole missing territory: the high availability cluster (device trust, device groups and traffic groups; failover states and network failover; config sync), UCS archives, the log files map, management access and port lockdown, the DNS/NTP/SNMP/syslog system services, reading device status from LCD to netstat, route domains, vCMP, custom alerting, iApps and FAST templates, the interface-to-self-IP dependency chain, and the qkview/iHealth support workflow - each written in English and Portuguese, each wired into the guide objectives it teaches. Both F5 guides now have zero gaps: all one hundred objectives across the three published certifications carry study notes and at least one article on this site.",
    links: [
      { label: "The F5-CA guides, now gapless", href: "/certifications/f5-ca-control-plane-administration" },
      { label: "BIG-IP high availability", href: "/learn/bigip-ha-concepts-device-trust-groups" },
      { label: "qkview and iHealth", href: "/learn/bigip-qkview-and-ihealth" },
    ],
  },
  {
    date: "2026-07-21",
    time: "00:07",
    kind: "content",
    title: "F5-CA and F5-CTS LTM study guides: eleven exams, one hundred objectives",
    body: "The certifications hub now maps both current F5 BIG-IP tracks in full, from the official blueprints PRIME relayed. The five F5 Certified Administrator exams (F5CAB1 through F5CAB5, blueprint F5-CAB.0425) and the six BIG-IP LTM Specialist beta exams (F5CTSLTM1-B through F5CTSLTM6-B, blueprint F5CTSLTM.032026.BETA, beta window open until July 31) are published with every objective transcribed verbatim, the blueprint's own example bullets serving as the What to know points, and each objective wired to the site tools and Learn articles that teach it - the licensing objective points at the Service Check Date tool, the packet-capture exams at the tcpdump pair and builder, the iRules exam at eleven iRule articles, the TLS exam at the cipher bench. Where the site has no coverage yet - UCS archives, HA and failover, vCMP, custom alerting, route domains, the log files shelf - the guide says an article is coming instead of padding.",
    links: [
      { label: "Certifications hub", href: "/certifications" },
      { label: "F5CAB1: Install, Initial Configuration, and Upgrade", href: "/certifications/f5-ca-install-config-upgrade" },
      { label: "F5CTSLTM6-B: Packet Capture/Troubleshooting - TLS/SSL", href: "/certifications/f5-cts-ltm-pcap-tls-ssl" },
    ],
  },
  {
    date: "2026-07-20",
    time: "23:19",
    kind: "content",
    title: "The knowledge beneath PingFederate: LDAP, Kerberos, SCIM, a reading path, and thirteen glossary terms",
    body: "A research pass over the PFP-001 dependency tree found the blueprint's own prerequisites uncovered: the exam assumes directory, Kerberos, and SCIM knowledge the site never taught. Three fundamentals articles fix that - the LDAP directory model behind every identity product, the ticket machinery that makes desktop SSO silent, and the provisioning standard that explains where accounts come from - each linked from the product articles and guide objectives that depend on them. A new reading path, PingFederate administration end to end, sequences the whole subject: fundamentals first, the ten product articles in teaching order, flows to close. And thirteen identity terms join the glossary - SCIM, Kerberos, SPNEGO, keytab, KDC, PCV, APC, policy tree, and friends - so the vocabulary now explains itself, underlined in place, throughout the wave.",
    links: [
      { label: "The reading path", href: "/study-guides" },
      { label: "LDAP fundamentals", href: "/learn/ldap-fundamentals" },
      { label: "Kerberos and SPNEGO", href: "/learn/kerberos-and-spnego" },
    ],
  },
  {
    date: "2026-07-20",
    time: "22:50",
    kind: "content",
    title: "PingFederate Learn wave: ten articles close every gap on the PFP-001 guide",
    body: "Hours after the Certified Professional - PingFederate study guide went live with fifteen honest article-coming markers, the articles arrived. Ten new pieces in the identity category - installation and initial setup, the upgrade playbook, the startup files tour, administrative access and RBAC, operational hygiene (license, notifications, configuration archive), the endpoints map, data stores, PCVs and the five adapters, the log files, and authentication policy trees - each written in English and Portuguese, each wired into the guide objective it teaches. The PFP-001 guide now has zero gaps: all twenty-four blueprint objectives carry study notes, at least one article on this site, and a pointer into the official documentation.",
    links: [
      { label: "The study guide, now gapless", href: "/certifications/ping-cp-pingfederate" },
      { label: "Authentication policy trees", href: "/learn/pingfederate-authentication-policies" },
      { label: "The log files", href: "/learn/pingfederate-log-files" },
    ],
  },
  {
    date: "2026-07-20",
    time: "22:00",
    kind: "content",
    title: "The first fully worked study guide: Certified Professional - PingFederate (PFP-001)",
    body: "The certifications section publishes its first complete guide. Every objective of the official PFP-001 blueprint - all four sections, twenty-four objectives, transcribed verbatim from Ping Identity's published exam study guide and live catalog - now carries study notes (the facts to know cold), links to the Learn articles and tools on this site that teach it, and a pointer into the official PingFederate documentation. The guide leads with the exam facts that matter when you book it: 70 multiple-choice items, 90 minutes, a 64% pass mark, PingFederate 12 or later. Where the site does not yet have an article for an objective, the guide says so honestly and that gap seeds the writing queue. As everywhere in this section: objectives map to learning resources, never to exam questions - study guides here help you learn the material, not shortcut the exam.",
    links: [
      { label: "Open the study guide", href: "/certifications/ping-cp-pingfederate" },
      { label: "Certifications hub", href: "/certifications" },
    ],
  },
  {
    date: "2026-07-20",
    time: "21:30",
    kind: "feature",
    title: "Glossary hints grow a third gear: first, all, or none",
    body: "The inline glossary hints - the dashed underlines that pop a definition on hover or tap - used to be a simple on/off. The switch in Settings is now a three-way choice: First underlines only the first mention of each term per page (the default, same behavior as before), All lights up every mention for readers who want the definition at hand wherever they meet the word, and None keeps prose completely plain. Under the hood every occurrence is now marked at build time and your choice decides which marks are active, instantly and without a reload, on Learn articles and tool docs alike. The preference stays on your device, like the theme.",
    links: [{ label: "Reading settings", href: "/settings" }],
  },
  {
    date: "2026-07-20",
    time: "19:00",
    kind: "tool",
    title: "New tool: HTTP methods comparison - starring QUERY, the first new method in 16 years",
    tools: ["http-methods-comparison"],
    body:
      "RFC 10008 (June 2026) gave HTTP its first new method since PATCH in 2010: QUERY, the safe, idempotent, cacheable read that carries a request body. The new tool holds the registry facts for 13 methods (the RFC 9110 nine, PATCH, and the WebDAV trio PROPFIND/REPORT/SEARCH): safe, idempotent, cacheable, body semantics, CORS safelist, HTML-form support, and the defining spec - ask for 'get vs query' or 'post vs query' and it names exactly which properties differ. Two companion Learn articles ship with it: a full QUERY explainer (why it exists, the body-in-the-cache-key model, Accept-Query discovery, the equivalent-resource escape hatch, and why 'safe' describes intent rather than payload) and the BIG-IP chapter (LTM's HTTP profile passes unknown methods by default, Advanced WAF blocks QUERY as an Illegal method until explicitly allowed and then keeps inspecting the body, iRules branching on HTTP::method need a post-June-2026 audit, and HTTP::query the command has nothing to do with QUERY the method). Glossary gains safe-method and http-query-method. All facts grounded in RFC 10008, the IANA registry, and F5's own DevCentral coverage, fetched 2026-07-20.",
    links: [
      { label: "Open the comparison", href: "/tools/http-methods-comparison" },
      { label: "The QUERY explainer", href: "/learn/http-query-method" },
      { label: "QUERY on BIG-IP", href: "/learn/bigip-http-query-method" },
    ],
  },
  {
    date: "2026-07-20",
    time: "18:30",
    kind: "content",
    title: "Glossary wave two: 58 more voices from the trenches",
    body: "The jargon and expression shelves get their second restock in two days, from 881 to 939 entries. New jargon leans into the carrier and datacenter world: looking glass, the default-free zone, full tables, carrier hotels and meet-me rooms, the middle mile, lit fiber, clean pipes, plus incast, brownouts, dark launches, tiger teams, pizza boxes, god boxes, frobnicate, and keep the lights on. New expressions bring the named wisdom: Segal's law (two watches, and the reason NTP exists), Zawinski's law, the Swiss cheese model, the XY problem, choose boring technology, security theater, compliance is not security, everything fails all the time, no plan survives contact, and the New Yorker's immortal dog who nobody knows about. Every entry defined and contextualized in English and Brazilian Portuguese, cross-linked into both waves.",
    links: [{ label: "Glossary", href: "/glossary" }],
  },
  {
    date: "2026-07-20",
    time: "18:00",
    kind: "tool",
    title: "New tool: MTU / MSS calculator, with a full jumbo frames explainer",
    tools: ["mtu-mss"],
    body:
      "The queue's rank-73 resident is live. Enter a link MTU plus your encapsulation stack (vxlan, gre, pppoe, 6in4, geneve, wireguard, vlan, qinq, mpls, or +N for a measured IPsec cost) and get the inner MTU and TCP MSS for IPv4 and IPv6, the Ethernet frame sizes, the underlay MTU an overlay needs, and the wire efficiency of this MTU against the 1500 and 9000 classics. The tool's core lesson is the split most explanations blur: encapsulations spend bytes inside the MTU and shrink the inner packet, while VLAN tags and MPLS labels ride on the frame and leave the IP MTU alone (that is where 1522-byte baby giants and 9216 switch headroom come from). All constants are RFC-fixed and cross-verified; 22 golden vectors pin the classics (GRE 1476, VXLAN 1450/1550, PPPoE 1492, WireGuard 1440/1420, 94.93% vs 99.14%). Alongside it: a complete Learn explainer on jumbo frames, from the 1980 economics of the 1500-byte limit to overlay headroom, PMTUD black holes, and the ping commands that prove a 9000-byte path end to end, plus upgraded glossary entries for jumbo frames and the new baby giant.",
    links: [
      { label: "Open the calculator", href: "/tools/mtu-mss" },
      { label: "Jumbo frames, explained", href: "/learn/jumbo-frames" },
    ],
  },
  {
    date: "2026-07-20",
    time: "17:00",
    kind: "content",
    title: "The glossary learns to talk shop: 66 new jargon and expression entries",
    body: "The two thinnest shelves of the glossary got a proper restock, from 814 to 880 entries. On the jargon side, the words engineers actually say: flapping, fat-finger, bufferbloat, microburst, elephant flows, goodput, gray failure, alarm storm, alert fatigue, tarpit, braindump, nuke and pave, magic smoke, flag day, forklift upgrade, SEV1, and friends. On the expression side, the sayings the trade lives by: it's always DNS, pcap or it didn't happen, check layer 1, fail open vs. fail closed, crunchy outside, chewy center, castle-and-moat, Schroedinger's backup, RAID is not a backup, the 3-2-1 rule, don't roll your own crypto, rough consensus and running code, the two generals problem, active-active vs. active-passive, and the demo gods. Every entry defined and given real context in English and Brazilian Portuguese, cross-linked where the ideas connect.",
    links: [{ label: "Glossary", href: "/glossary" }],
  },
  {
    date: "2026-07-19",
    time: "22:00",
    kind: "content",
    title: "The glossary grows past 800 entries, and terms light up inline",
    body: "Two threads land together. First, the glossary crossed from 605 to 814 entries: every acronym the site teaches now has a home, and a shelf of named vulnerabilities and backronyms joins the lore, from BEAST, POODLE, and CRIME through Heartbleed, Spectre, and Terrapin, each with a short definition and a fuller explanation in English and Brazilian Portuguese. Second, those definitions now come to you: in the Learn articles and every tool's documentation, the first mention of a term on a page carries a subtle dashed underline, and hovering or tapping it shows a quick definition without leaving the page, with a link to the full glossary entry. The underlines are first-occurrence only, so the prose stays clean, and if you would rather not see them there is an off switch under Settings, in the new Reading section.",
    links: [{ label: "Glossary", href: "/glossary" }],
  },
  {
    date: "2026-07-19",
    time: "20:00",
    kind: "tool",
    title: "BIG-IP DNS (GTM) GSLB simulator: watch a wide IP pick a pool, then a server",
    body: "The global-tier companion to the LTM load balancing simulator. BIG-IP DNS load balancing is two-tier - a wide IP first selects a pool, then the pool selects a virtual server - and this tool models both. Configure pools (each with a ratio, a region tag, an up/down state, and a member-selection method) and their members, set the wide-IP pool method, a client region, and a request count N, and see how the next N DNS name-resolution requests resolve: pool by pool, then member by member. The static methods are simulated deterministically at both tiers - Round Robin, Ratio, Global Availability (first available in list order), and Topology (highest region-match score wins, ties round-robin). The dynamic methods that need live big3d metrics - QoS, completion rate, round-trip time, fewest hops, kbps, packet rate, VS score, least connections, CPU - are explained honestly rather than faked. Grounded in F5 BIG-IP DNS documentation, with a paired Learn article in English and Brazilian Portuguese on the two-tier decision.",
    tools: ["bigip-dns-gslb-simulator"],
  },
  {
    date: "2026-07-19",
    time: "18:00",
    kind: "tool",
    title: "Three passive-fingerprint explainers: p0f, User-Agent, header order",
    body: "A new trio decodes the signatures you emit before a byte of application data flows - the honest core of the privacy thesis. The p0f signature explainer decodes a v3 SYN fingerprint (ver:ittl:olen:mss:wsize,scale:olayout:quirks:pclass) into all eight fields and matches the shape to documented OS stacks; the TTL-versus-User-Agent mismatch it surfaces is the classic proxy tell. The User-Agent entropy analyzer breaks a pasted UA into its identifying tokens, estimates the distinguishing bits each contributes, and explains the Client Hints migration that froze the string. The HTTP header-order fingerprint reads a request header block and classifies the client by header sequence alone - the passive-HTTP analog of JA3, and how a Chrome UA wearing curl's header order gets caught. All three are decode-and-explain only: you paste a signature you already hold, nothing is read from your browser, nothing is sent. A paired Learn article ships in English and Brazilian Portuguese.",
    tools: ["p0f-signature-explainer", "user-agent-entropy-analyzer", "http-header-order-fingerprint"],
  },
  {
    date: "2026-07-19",
    time: "14:00",
    kind: "content",
    title: "The glossary grows from 353 to 605 entries",
    body: "The largest single expansion of the glossary: 252 new entries across six working fields - network engineering (VLAN, OSPF, spanning tree, VXLAN, BFD), the ISP technician's world (GPON, OTDR, optical budget, CGNAT, truck roll), IT support (ITIL, golden image, percussive maintenance, layer 8), cloud network engineering (VPC, transit gateway, cold-potato routing, egress cost), cloud security (shared responsibility, IMDS, SSRF, envelope encryption, canary tokens), and privacy - with the LGPD, the ANPD, Schrems II, and differential privacy taking their places. Two new domain filters arrive with the content: ISP & telecom and IT support. And a new shelf of thirteen sourced myths joins the lore: NAT is not a firewall, incognito is not anonymity, the padlock is not safety, deleted is not erased - each one disputed, each one cited. Every entry authored natively in English and Brazilian Portuguese.",
  },
  {
    date: "2026-07-18",
    time: "16:30",
    kind: "feature",
    title: "The Global Cat Distribution System opens for tracking",
    body: "The /dev/fun shelf gains its fourth toy: a tracking console for the internet's most reliable logistics network - stray cats assigning themselves to humans. Enter your name, read your delivery manifest: unit, coat, temperament, delivery vector (doorstep during rain remains the classic route), and the six-step status timeline. Assignments are deterministic - the same name always receives the same cat, which is not a bug but destiny. Fully native in English and Brazilian Portuguese: o Sistema escolheu voc\u00ea.",
  },
  {
    date: "2026-07-18",
    time: "16:00",
    kind: "tool",
    title: "Four tools: Roman numerals, the Greek alphabet, and exact time",
    body: "The Identifiers & time family grows around the Unix time converter, and Text & utilities gains an alphabet. The Roman numerals converter builds the canonical subtractive form place by place, accepts historical additive spellings like IIII with an explanation, and refuses IL with the rule it breaks. The Greek alphabet explainer transliterates both directions and carries the full 24-letter table, from \u03bc micro to \u03a9 ohms. The time calculator does exact duration arithmetic - and honestly refuses 'plus one month', a calendar unit with no single length. The multi-time-zone meeting planner reads one instant in every attendee's IANA zone, flags working hours and the Tokyo-joins-tomorrow date shift. Forty-two golden vectors across the four; three companion articles in English and Brazilian Portuguese.",
    tools: ["roman-numerals", "greek-alphabet", "time-calculator", "timezone-meeting-planner"],
  },
  {
    date: "2026-07-18",
    time: "15:00",
    kind: "i18n",
    title: "Meeting Bingo speaks seven languages",
    body: "Every meeting type on the card - all thirteen, from the video call to the marketing review - is now natively authored in English, Brazilian Portuguese, Spanish, German, Italian, French, and Dutch. Not translations: each language's own meeting liturgy, ninety-one pools and more than two thousand three hundred phrases in all. The Italian war room knows \u00e8 sempre il DNS, the French one c'est toujours le DNS, the Dutch strategy meeting has its stip op de horizon, and the academic quarter-hour arrives in every language that observes it.",
  },
  {
    date: "2026-07-18",
    time: "13:30",
    kind: "feature",
    title: "Meeting Bingo: the profession pack",
    body: "Four new meeting types join the card deck: the tax and legal review, civil works and public infrastructure, the HR meeting, and the marketing review. Each pool is authored natively in English, Brazilian Portuguese, Spanish, and German - real utterances from each language's own meeting culture, not translations - twenty-six per pool, four hundred and sixteen phrases in all. Salvo melhor ju\u00edzo, vorbehaltlich der Pr\u00fcfung, sin perjuicio de lo anterior: bingo.",
  },
  {
    date: "2026-07-18",
    time: "12:00",
    kind: "feature",
    title: "Study guides: reading paths and blueprint guides, one door",
    body: "The sitemap's Study guides link now opens a real page. Five curated reading paths walk the Learn library in teaching order - BIG-IP fundamentals, modern identity from the token up, TLS from zero, HTTP told forward, and regular expressions done properly - each an ordered syllabus of articles with the tools to practice on, titles resolved live so nothing can go stale. Below them, the certification study guides render as the same cards the certifications hub uses, blueprint-mapped and honestly badged while in preparation. A new build guard keeps every path's articles and tools verified on every build, and the Learn library links across.",
  },
  {
    date: "2026-07-18",
    time: "11:30",
    kind: "feature",
    title: "The identity category returns",
    body: "A quiet regression, found and fixed: tagging the open-standard identity tools - the JWT decoder, PKCE, OIDC, TOTP/HOTP, SAML, and JWKS explainers - for the Ping Identity hub had made every consumer treat them as vendor-specific, which erased the identity category from the tools grid, the Learn library, and the category pages, taking twenty-one standards articles with it. The registry now distinguishes vendor-owned tools from vendor-affiliated open standards, so identity is back everywhere it belongs and the hub keeps its tools. The category short-link also now lands: /category/network permanently redirects to the canonical networking page in every language.",
    tools: ["jwt", "pkce", "oidc", "totp-hotp", "saml-decoder", "jwks-explainer"],
  },
  {
    date: "2026-07-18",
    time: "10:00",
    kind: "content",
    title: "The clones get their lineage",
    body: "The pre-1996 story now names both machines' ancestry precisely: the Microdigital TK-82C as a Brazilian clone of Sinclair's ZX81, and the TK90X as a clone of the ZX Spectrum 48K - the two ends of Brazil's market-reserve micro era, in one sentence. In English and Brazilian Portuguese.",
  },
  {
    date: "2026-07-18",
    time: "00:30",
    kind: "feature",
    title: "The BOFH moves up",
    body: "On the 404 page, the Bastard Operator From Hell now delivers his ruling directly under the Guru Meditation, with the faux log of famous errors - 418 I'm a teapot, PC LOAD LETTER and friends - following below. Same cast, better billing.",
  },
  {
    date: "2026-07-18",
    time: "00:15",
    kind: "content",
    title: "Four small doors closed",
    body: "A tidy batch: the Cipher Suite Anatomy article now closes, in all sixteen languages, by pointing at both Illustrated walkthroughs - TLS 1.2 for the long bundled names, TLS 1.3 for the short modern ones; the cipher suite decoder's references gain RFC 9846, the December 2025 revision of TLS 1.3 that obsoletes RFC 8446 with the suite form unchanged; and the pre-1996 field guide gains two entries the story had been using without defining - SLIP & PPP, the encapsulations that put a dial-up line truly on the internet, and NCSA Mosaic, the 1993 browser that gave the text-only internet a face. In English and Brazilian Portuguese, with the article line native in every locale.",
    tools: ["cipher"],
    articles: ["cipher-suite-anatomy"],
  },
  {
    date: "2026-07-17",
    time: "23:59",
    kind: "content",
    title: "Curiosity and awe - the story's first teacher",
    body: "The pre-1996 narrative grows from six movements to seven, and the new one comes first: his grandmother, who crossed an ocean from Germany to Brazil, and who talked with the boy from his earliest age about the garden of her house - small insects and earthworms, flowers and weeds, tomatoes, carrots, and strawberries - and about the night sky full of stars, the vastness of the Universe, and the human consciousness there to behold it. The iPhone flash-forward also gains the dream's original shape: a bulky 386DX40, a 14-inch CRT monitor, a modem, and a phone line - the knowledge of the whole world, later made possible anywhere, in the palm of the hand. In English and Brazilian Portuguese.",
  },
  {
    date: "2026-07-17",
    time: "23:55",
    kind: "content",
    title: "The timeline now begins in 1975",
    body: "The pre-1996 story's timeline gains its true opening beat: S\u00e3o Paulo, 1975 - a Brazilian father, civil engineer, grandson of Portuguese, Italian, and Arab immigrants; a German-born mother, a Bachelor of Fine Arts who came to Brazil at twelve; and a maternal grandmother who taught a boy to look at the universe and at nature with curiosity and awe. Had computers not claimed him, the scientist's way was waiting. In English and Brazilian Portuguese.",
  },
  {
    date: "2026-07-17",
    time: "23:45",
    kind: "content",
    title: "Thanks, aandrade",
    body: "The academic-internet chapter of the pre-1996 story gains its missing character: aandrade, the account on the UNIX servers of USP - the Universidade de S\u00e3o Paulo - whose access, as was the custom among early-nineties enthusiasts, passed from hand to hand and quietly opened one of the first doors to the world for a whole generation of young explorers. Three decades late, the page now says thank you. In English and Brazilian Portuguese.",
  },
  {
    date: "2026-07-17",
    time: "23:30",
    kind: "feature",
    title: "Red Education booking up top, and a slower Guru",
    body: "The Red Education page now opens with the same book-instructor-led-training block that closes it, so a visitor can act before reading, and the on-site catalog button now says what it means: see the courses taught by Rodolfo. On the 404 page the Guru Meditation alerts linger 2.5 times longer between rotations, the teapot line now wears its full protocol - HTCPCP/1.0 - with RFC 2324 linked to the IETF datatracker, the Amiga failure line escalated to a two-line critical emergency, and three of the retro lines dropped a font size for composure.",
  },
  {
    date: "2026-07-17",
    time: "23:00",
    kind: "content",
    title: "New article: HTTP/0.9 to HTTP/3",
    body: "Five versions of the web's protocol in one telling: the 1991 one-line GET, the headers of HTTP/1.0, the persistent connections and Host header of HTTP/1.1, HTTP/2's binary multiplexing and its leftover TCP head-of-line blocking, and HTTP/3 moving the whole thing onto QUIC. Closes with the 2022 reorganization that split HTTP semantics (RFC 9110) and caching (RFC 9111) from the per-version wire syntax (RFC 9112 to 9114) - every RFC number live-verified against the IETF HTTP Working Group's own listing. In English and Brazilian Portuguese.",
    articles: ["http-versions-09-to-3"],
  },
  {
    date: "2026-07-17",
    time: "22:00",
    kind: "content",
    title: "New article: TLS 1.2 vs TLS 1.3 vs DTLS vs QUIC",
    body: "One handshake family, four shapes: TLS 1.2's flexible-but-sharp workhorse, TLS 1.3's subtractions (now revised as RFC 9846, December 2025, which obsoletes RFC 8446), DTLS carrying the same guarantees over datagrams, and QUIC absorbing the TLS 1.3 handshake into the transport itself. Ends with a field guide to telling them apart on the wire and pointers to Michael Driscoll's Illustrated byte-by-byte walkthroughs of all four. In English and Brazilian Portuguese.",
    articles: ["tls12-tls13-dtls-quic"],
  },
  {
    date: "2026-07-17",
    time: "21:00",
    kind: "content",
    title: "Reference shelves: regex and the Illustrated TLS series",
    body: "The regex tool's References grow by six notoriously good resources - regex101, RegExr, RexEgg, Regular-Expressions.info, RegexOne, and RegexLearn - and the cipher suite decoder now points at The Illustrated TLS 1.2 and TLS 1.3 Connections, the byte-by-byte annotated handshakes. The TLS 1.3 cipher suites article closes with the same Illustrated TLS 1.3 pointer in all sixteen languages, joined by the F5 TLS 1.3 vs 1.2 and hybrid key exchange articles.",
    tools: ["regex", "cipher"],
    articles: ["tls13-cipher-suites"],
  },
  {
    date: "2026-07-17",
    time: "20:00",
    kind: "content",
    title: "RCA, spelled out - and a habit adopted",
    body: "The Incident Timeline & RCA Builder now opens by teaching its own name: both the tool page and its documentation begin by expanding RCA as root cause analysis before using the acronym again, in English and Brazilian Portuguese. Behind the fix sits a standing editorial rule adopted today: this is a learning site, so every acronym gets spelled out the first time it appears on a page.",
    tools: ["incident-timeline-rca-builder"],
  },
  {
    date: "2026-07-17",
    time: "18:00",
    kind: "content",
    title: "Pre-1996: the record corrected, and a dream kept",
    body: "Three refinements from the source. The academic internet moves to 1991, where it actually happened — the university shell account over a modem — and 1993 earns its own beat: a program compiled on that shell account turned the dial-up session itself into a SLIP/PPP tunnel, and through it NCSA Mosaic opened the first glimpse of the World Wide Web. The phreaking movement gains its flash-forward: the payphone-modem dream of 1990, recognized seventeen years later in a jailbroken first-generation iPhone running community-made apps. And the Brazilian Portuguese telling of the father thread now carries the author's own ratified wording.",
    links: [{ label: "Read the chapter", href: "/about/history/pre-1996" }],
  },
  {
    date: "2026-07-17",
    time: "16:00",
    kind: "content",
    title: "Pre-1996: the father at the root",
    body: "The origin story now starts where it truly did. The ham-radio movement is reframed around Rodolfo's father — an engineer and avid amateur operator whose call sign and QSL cards were the first proof that a signal could cross the world — and the national-micros movement opens a scene earlier, with a nine-year-old watching him load a cassette program onto the family television before the watching turned into doing. The timeline beats for the 1984 TK-82C and the amateur-radio years follow suit. Authored natively in English and Brazilian Portuguese.",
    links: [{ label: "Read the chapter", href: "/about/history/pre-1996" }],
  },
  {
    date: "2026-07-17",
    time: "14:00",
    kind: "content",
    title: "Pre-1996 correction, and a vendor-hub polish",
    body: "Two fixes. The pre-1996 phreaking passage is corrected on the record: blue-boxing was not a dream but a working doorway - operator trunks seized by the network's own 2600 Hz signaling, reaching the European scene boards - and war-dialing turned up corporate PBXs that could hand out an outside line, deliberately left alone because those calls would bill a real company, unlike an operator trunk that billed no one. Only the modem-into-a-payphone scheme stayed a dream; a war-dialing entry joins the field guide. Separately, on every vendor hub the story call-out now has room to breathe between the breadcrumb and the title, and the tool and article card titles were brought down to sit under their section headings instead of towering over them.",
  },
  {
    date: "2026-07-17",
    time: "12:00",
    kind: "content",
    title: "The pre-1996 story, told in full",
    body: "The origin chapter at /about/history/pre-1996 is rebuilt from a flat summary into a proper telling: a dated timeline from the 1984 Microdigital TK-82C to the 1995 first role, a six-movement narrative (ham radio and QSL cards, the national micros, the bulletin-board and FidoNet years, the phreaking scene of the orelhao and the blue-box dreams, the 1993 academic internet, and the turn from hobby to trade), and a field guide of eleven era terms for readers who arrived after it - two of them, phreaking and the blue box, opening into the glossary's phone-phreaking lineage. Authored natively in English and Brazilian Portuguese.",
  },
  {
    date: "2026-07-17",
    time: "10:00",
    kind: "content",
    title: "Wave 7: the roster completes",
    body: "Four final entries close the encyclopedia's planned roster. The access & home fleet consolidates Netgear, TP-Link, Zyxel, Asus & Askey, and Allied Telesis - the boxes everyone actually owns, the first hop of most packets on Earth. WatchGuard tells the red Firebox that turned security from a project into an object. A10 & Kemp pair the ADC challengers that kept the load-balancing leaders honest. And Datacom closes it at home: Brazil's networking manufacturer, its own gear on its own OS from Rio Grande do Sul, the existence proof that network sovereignty is buildable. The encyclopedia stands at 66 partner profiles - 16 pioneers, 15 partners, 6 contemporaries, and the wider lineage entries.",
  },
  {
    date: "2026-07-17",
    time: "08:00",
    kind: "content",
    title: "Arista enriched, headings tamed, copy sharpened",
    body: "The Arista profile absorbs its full corporate history - Granite Systems sold to Cisco before the founders attacked their acquirer on purpose, the low-latency beachhead, the ITC years answered with software workarounds, the cloud titans, and the 800G Ethernet-for-AI fight. The career-record and history index pages stop rendering their ledes inside the h1 (a paragraph in heading clothing - reading comfort over spectacle), and the Zscaler chapter drops its site-meta framing for substance: the thesis that the perimeter would dissolve, and the exchange built to replace it.",
  },
  {
    date: "2026-07-17",
    time: "06:00",
    kind: "content",
    title: "The protocol pioneers: DNS & BIND, HTTP & Gopher",
    body: "PRIME reopens the pioneer roster for the stories underneath every other story: DNS & BIND (the text file that collapsed, Mockapetris's 1983 delegation-and-caching design, Berkeley's reference implementation, the Kaminsky patch, the signed root, and Dyn day) and HTTP & Gopher (two futures shipped in 1991, one spring of licensing decided between them - Minnesota asked for fees, CERN gave the web away - and HTTP's forty-year arc from a one-line GET to QUIC). Pioneers now sixteen; the encyclopedia reaches 62 partner profiles.",
  },
  {
    date: "2026-07-17",
    time: "05:00",
    kind: "content",
    title: "Pioneer wave 6: the last two pioneers - and the contemporaries arrive",
    body: "ZTE (China's other giant, and the 2018 denial-order lesson every supply-chain assessment cites) and Fluke (the meters and certifiers in every field bag, with the 2015 three-way split told straight) close the pioneer roster at fourteen. Below them a new section opens: the contemporaries - modern-era companies still writing their chapters - beginning with Nvidia (the GPU company that runs the fabric) and Ubiquiti (enterprise features at prosumer prices). The encyclopedia reaches 60 partner profiles.",
  },
  {
    date: "2026-07-16",
    time: "20:00",
    kind: "content",
    title: "Pioneer wave 5: the web, the wavelengths, and the checkpoints",
    body: "Six more pioneer entries: NCSA (the campus lab whose Mosaic made the web visible and whose orphaned httpd patches became Apache), Ciena (the first commercial DWDM deployment and the optical layer's compounding pure-play), the Sniffer lineage as one bloodline (Network General through Dolch, Network Associates, and Arbor to NetScout), Blue Coat and Packeteer (the checkpoint companies - the proxy as a security platform and traffic shaping as a category), Cyclades, Avocent and Vertiv (the Brazilian-founded out-of-band pioneer and the physical layer of uptime, with the honorable Pouzin CYCLADES footnote), and Dell and Force10 (the direct model and the 10GbE fabric inside it). The encyclopedia reaches 56 partner profiles.",
  },
  {
    date: "2026-07-16",
    time: "19:00",
    kind: "content",
    title: "Pioneer wave 4: the deepest roots",
    body: "Six entries join the industry pioneers, led by the heaviest page on the site: Bell Labs, Lucent and Alcatel - the transistor, information theory, Unix, and ten Nobel Prizes, spun, merged, and carried into Nokia. Alongside it: Intel and AMD as one entry (Fairchild's children and the x86 rivalry, with the AMD64 irony told straight), RAND (where Paul Baran imagined packet switching), Toshiba (the company that gave the world flash memory and the mass-market laptop), Hitachi (the industrial giant whose storage lineage runs through every SAN), and Bull (Europe's computing champion, from punch-card wars to the continent's first exascale machine).",
  },
  {
    date: "2026-07-16",
    time: "18:00",
    kind: "tool",
    title: "The 100th tool closes wave A: the Snapshot Comparator",
    tools: ["health-snapshot-comparator"],
    body: "Tool 7 of the Operations & Fieldcraft family - and the site's hundredth tool. The name is honest by construction: you declare the states, the tool gates the conclusion. Seven selections produce a tiered comparison report: baseline quality, a 14-dimension snapshot catalog with churn classes, delta-interpretation guidance with supports and weakens per dimension, validation-completeness gaps, and the continue / observe / investigate / hold-rollback-ready gate with explicit tier conditions. A from-memory baseline caps the verdict; an immediate window caps it; a rollback decision with any evidence gap keeps the rollback armed; and no change is ever labeled successful on green components alone. Thirteen snapshot vectors pin the verdict itself. Paired Learn article: Baselines Before You Need Them, closing the fieldcraft 'before' trilogy, in English and Portuguese.",
  },
  {
    date: "2026-07-16",
    time: "17:00",
    kind: "tool",
    title: "Flow Path Reasoner - the map before the troubleshooting",
    tools: ["flow-path-reasoner"],
    body: "Tool 11 of the Operations & Fieldcraft family, and wave A's second: the senior skill is refusing to troubleshoot until the path is understood. Seven selections build a canonical hop map - rendered as a diagram with transformation and TLS markers - plus the resolution and identity side-flows, TLS segments, address-rewrite points, evidence points, and ranked failure-domain candidates with supports and weakens. Unknowns stay visibly unknown, and the map says out loud that it is a proposed model, never discovered topology. Thirteen rule-firing snapshot vectors pin the registry, including the hop-chain construction itself. Paired Learn article: Map the Path Before You Troubleshoot, in English and Portuguese.",
  },
  {
    date: "2026-07-16",
    time: "16:00",
    kind: "feature",
    title: "Vendor pages: the genealogy diagram grows up",
    body: "The corporate-lineage diagram now wraps node labels and notes to their boxes with dynamically sized slots, so long entries - the Ping and ForgeRock bloodlines were the worst offenders - no longer bleed across columns or vanish over borders. The Ping Identity and Zscaler pages close on retitled hub sections in the same voice as their siblings, and the vendor-hubs cards now run in chronological teaching order: F5, Extreme, Fortinet, Netskope, Ping, Zscaler.",
  },
  {
    date: "2026-07-16",
    time: "15:00",
    kind: "tool",
    title: "Packet Capture Plan Builder - fieldcraft wave A opens",
    tools: ["packet-capture-plan-builder"],
    body: "Tool 6 of the Operations & Fieldcraft family. Command builders answer how to capture; this one answers WHERE, WHY, and WHAT IT WOULD MEAN: describe the path and the symptom in seven structured fields and a 35-rule original registry designs a phased capture plan - ranked points on 13 named boundaries with vendor-neutral filter templates, expected observations, an interpretation matrix with supports and weakens decided before collection, and sync/authorization discipline. It plans captures; it never ingests them. Thirteen rule-firing snapshot vectors pin the registry. Paired Learn article: Capture Points Before Packets, in English and Portuguese.",
  },
  {
    date: "2026-07-16",
    time: "13:00",
    kind: "content",
    title: "Pioneer wave three: the deep bench",
    body: "Marconi, Wang Laboratories, Tandem Computers, Banyan Systems, Fujitsu, and NEC complete the pioneer shelf. Marconi carries both radio's birth and telecom's starkest bubble collapse; Banyan's StreetTalk shipped the global directory a decade before Active Directory and pairs with the Novell page; Tandem's NonStop architecture from 1976 still clears the world's card swipes as HPE NonStop; and NEC's 1977 C&C vision named the computers-and-communications convergence this whole site lives inside.",
  },
  {
    date: "2026-07-16",
    time: "12:00",
    kind: "feature",
    title: "The WebSerial console learns to type",
    body: "Interactive terminal mode: toggle it on, click the console, and every keystroke goes to the wire the way a real terminal sends it - printables as-is, Enter as the configured line ending, Backspace as 0x7F, Tab, Esc, arrows as ANSI sequences, and Ctrl combinations as control bytes (Ctrl-C still copies when text is selected; Ctrl-V pastes straight to the device). Pagers, device menus, and password prompts now work as they should. Line mode remains the default.",
  },
  {
    date: "2026-07-16",
    time: "11:00",
    kind: "content",
    title: "Pioneer wave two: six more giants",
    body: "3Com, Compaq, Netscape, Motorola, Unisys, and Data General join the industry lineages. 3Com completes the Ethernet story the Xerox page begins; Netscape is where SSL, JavaScript, and the cookie were invented - this site's daily subject matter; Unisys carries computing's two oldest bloodlines, the 1886 Burroughs adding machine and ENIAC's own engineers; and Data General brings the Soul of a New Machine. The distribution career chapter also widened to 2015 to 2019, spanning both the Westcon-Comstor and ScanSource years.",
  },
  {
    date: "2026-07-16",
    time: "09:00",
    kind: "feature",
    title: "The WebSerial console grows up",
    body: "The serial console moved to its proper address, web-serial-console (a redirect waits at the old slug), and gained a real terminal feature set: free resizing from the lower-right corner, a fullscreen mode with the controls overlayed at the top of the console window, real-time logging straight to a file on disk through the File System Access API, and a two-tier scrollback - the screen renders a bounded window for speed while the full session is archived in memory, so Copy and Save always export everything since connect. The baud ladder now runs the full standard range from 1200 to 921600, a preset list adopted from the minimal webserialconsole.com reference.",
  },
  {
    date: "2026-07-16",
    time: "08:00",
    kind: "content",
    title: "Twelve pioneer giants join the industry lineages",
    body: "Sun Microsystems, Silicon Graphics, Xerox, DEC, Nokia, Ericsson, Huawei, Siemens, Novell, Oracle, IBM, and SAP - the founders of the industry itself - each get the full lineage treatment on the Industry page: founding stories, timelines, and where every bloodline ended up, from Xerox PARC's 1973 Ethernet memo to Oracle's 2025 co-CEO handover, verified against SEC filings where the facts are recent.",
  },
  {
    date: "2026-07-16",
    time: "07:30",
    kind: "feature",
    title: "Two pages, two jobs: the career record and the industry encyclopedia",
    body: "The vendors index and the Industry hub used to render the same three grids twice. Now each has one job: the career record (under About) tells the fourteen chapters of a career since 1996, with one pointer to the wider family tree; the Industry page is the encyclopedia - partners and pioneers as full cards, with the career reduced to a slim chronological strip whose pages carry the Rodolfo's chapter markers. Nothing moved URLs; everything gained a clear address.",
  },
  {
    date: "2026-07-16",
    time: "07:00",
    kind: "feature",
    title: "A human sitemap, and two ambient rooms",
    body: "The footer's machine row now ends with a human-readable sitemap: every section of the site on one curated page, with the live tool count and a door to the XML version. And two new keyboard shortcuts join the set: G opens the green room and R the red room - full-screen solid-color utility screens, ambient light and night-vision respectively, any key or click to leave. Both are rebindable like every other key.",
  },
  {
    date: "2026-07-16",
    time: "05:00",
    kind: "feature",
    title: "Rodolfo's chapter markers on every vendor timeline",
    body: "Every corporate timeline of a vendor from the career record now carries an explicit, visually marked entry for Rodolfo's own involvement - an accent edge and a small chip reading Rodolfo's chapter - so the personal connection is findable inside any company history at a glance. Seventeen markers across sixteen profiles, from Cabletron in 1996 to the Zscaler authorization in 2026, including the Juniper years on the HPE, Juniper, and Aruba lineage page and the distribution-side chapters on the McAfee, FireEye, and Trellix page.",
  },
  {
    date: "2026-07-16",
    time: "01:30",
    kind: "content",
    title: "Ten partner lineages, the Pulse Secure chapter, and a footer with one job",
    body: "The remaining Red Education partner catalog gets the full lineage treatment: Check Point, CyberArk, Riverbed, Symantec, Avaya, Arista, Nutanix, Red Hat, Paessler, and MobileIron each carry founding stories, timelines, and genealogy on their partner pages - including CyberArk's February 2026 close into Palo Alto Networks, the largest deal in security history. Pulse Secure joins the career record as its own chapter (the Westcon distribution years), tracing the Neoteris to NetScreen to Juniper to Siris to Ivanti bloodline. The Buy Me a Coffee link moved from the footer to the contribute page, where the support pitch lives; the footer line now belongs to Red Education alone - and the Red Education page records that the two newest instructor authorizations flow through the same house.",
  },
  {
    date: "2026-07-15",
    time: "23:45",
    kind: "content",
    title: "Ping Identity and Zscaler join the instructor portfolio",
    body: "The instructor authorizations for Ping Identity and Zscaler are cleared, and the site now says so: the two career pages retire their not-authorized disclaimers, the About page's authorization list adds both vendors, and the partner-page and vendor-hub copy names them. Course catalogs for the two newest vendors will appear under Training as they are scheduled; until then the 28-course portfolio remains the established platforms.",
  },
  {
    date: "2026-07-15",
    time: "23:30",
    kind: "feature",
    title: "Fortinet Red replaces the orange dot",
    body: "Fortinet's vendor color across the site - the hub-strip dot, vendor cards, filter chips, and the admin chip and tag tints - is now Fortinet Red, PMS 485C (#DA291C), the official brand red from Fortinet's own brand guidelines, replacing the interim orange of 2026-07-08. Chip text uses a lightened tint of the same red for dark-canvas legibility. The FortiGate-inspired theme set is deliberately untouched: those seven palettes are homages to FortiOS's own GUI themes (Penumbra's amber nods to Eclipse; Kevlar already carries the set's red), not vendor identity marks.",
  },
  {
    date: "2026-07-11",
    time: "14:00",
    kind: "tool",
    title: "JA3 / JA3N passive TLS fingerprint",
    body: "A passive TLS client fingerprint calculator, and the on-ramp toward the SSE and identity hubs (tagged, like the JA4 decoder, to the Zscaler and Ping vendors). Paste a JA3 string - the five ClientHello fields (TLS version, ciphers, extensions, elliptic curves, point formats) - and it recomputes the JA3 MD5, computes the permutation-stable JA3N (extensions sorted), decodes each field with counts, and flags GREASE values (RFC 8701), which it strips before hashing. It marks whether the extensions were in order (the source of Chrome/Firefox JA3 churn) and explains why JA3N or JA4 is more stable. Follows Salesforce's original construction exactly and is pinned to two of Salesforce's own published string-to-hash vectors; the GREASE-invariance and JA3N-stability tests reproduce the canonical hash from grease-injected and permuted inputs. Reuses the existing browser MD5 helper - no new crypto. Vectors 16/16, en + pt-BR, with a companion Learn article on passive TLS fingerprinting that bridges to secure web gateways and adaptive authentication.",
    tools: ["ja3-tls-fingerprint"],
  },
  {
    date: "2026-07-11",
    time: "13:15",
    kind: "tool",
    title: "BIG-IP LTM load balancing simulator",
    body: "The BIG-IP counterpart to the F5XC LB algorithm chooser, and the answer to \"where do the next N requests go?\" Configure pool members - each with a member ratio, a node and node ratio, a priority group, and existing persistence records - pick a load balancing method and a request count, and see the per-member distribution with active/standby marking. It simulates the deterministic methods: Round Robin, Ratio (member and node), Least Connections (member and node), Weighted Least Connections, and Least Sessions (which uses the persistence-record count as its metric). Ratio is handled as a true weighted round-robin cycle (3:2:1:1 over 7 requests = exactly 3,2,1,1), and priority group activation confines traffic to the highest group until it falls below the minimum-available threshold. The dynamic methods - Fastest, Observed, Predictive, Dynamic Ratio - are offered but explained rather than faked, because they decide from live runtime metrics that are not part of a pool's configuration. Two honesty notes surface in the tool: Least Connections is modeled from a fresh connection table (no current-connection input) so it starts even, and Least Sessions falls back to Round Robin under cookie persistence. Vectors 17/17, en + pt-BR, with a companion Learn article. Grounded in F5 LTM documentation.",
    tools: ["bigip-ltm-lb-simulator"],
  },
  {
    date: "2026-07-11",
    time: "12:30",
    kind: "tool",
    title: "F5XC API path explainer",
    body: "A wave-3 tool built around the artifact XC API Protection actually works with: the OpenAPI / Swagger spec. Paste an OpenAPI 2.0 or 3.0.x specification - the kind you import to define an API definition, or the one API Discovery generates and lets you download - and it lists every path and operation with its method, parameters (name, location, required), request body content types, response codes, and effective authentication. It resolves local $ref parameters, summarizes the inventory (paths, operations, unauthenticated, object-level, deprecated), lists the defined security schemes, and flags unauthenticated operations (Broken Authentication) and object-level path-parameter endpoints (Broken Object Level Authorization). Authentication is resolved the way the spec defines it: per-operation security overrides the global default, and an empty security list is an explicit public opt-out. Grounded in the OpenAPI standard and the OWASP API Security Top 10; vectors 22/22, en + pt-BR, with a companion Learn article on the spec as XC's API inventory.",
    tools: ["f5xc-api-path-explainer"],
  },
  {
    date: "2026-07-11",
    time: "11:45",
    kind: "tool",
    title: "F5XC object linter",
    body: "The first F5 Distributed Cloud wave-3 tool. Paste an origin_pool, http_loadbalancer, or app_firewall (WAF) object and it flags risky or surprising settings, each with a severity (high / warn / info, most serious first) and a grounded explanation. Origin-pool rules: TLS to origin with server verification skipped, SNI disabled, cleartext to origin, no health check, single origin. Load-balancer rules: no WAF attached, plain-HTTP listener, HTTPS without an HTTP-to-HTTPS redirect, a route that disables the WAF, a catch-all route that shadows later routes under first-match, and a wildcard mixed with its apex. WAF rules: monitoring mode (detects but does not block), disabled threat campaigns. It reuses schema knowledge already verified for this family and introduces no new schema; findings are structured codes + params so the compute stays language-free. Vectors 25/25, en + pt-BR, with a companion Learn article on config hazards.",
    tools: ["f5xc-object-linter"],
  },
  {
    date: "2026-07-11",
    time: "11:00",
    kind: "tool",
    title: "F5XC security event explainer",
    body: "The third and final F5 Distributed Cloud wave-2 tool, and the piece that turns the service-policy explainer into a triage set. Paste a security event - WAF, Bot Defense, Service Policy, or API - and it decodes the type (from sec_event_type), the action taken and the recommended action, a plain disposition (blocked / reported / allowed), the request context (method, host, path, source IP, load balancer and type, namespace, request id), and the specific reason it fired: WAF signatures (id, name, accuracy, attack type) and violations and attack types, the bot verdict (insight, automation type, recommendation), the matched service policy and rule, or the API OpenAPI validation and policy hits. It reads through the Sekoia-style { message } log envelope and infers the type when the tag is absent. Field names verified against F5's Security Events Reference (2026-07-01); defensive decode, vectors 25/25, en + pt-BR, with a companion Learn article on reading events.",
    tools: ["f5xc-security-event-explainer"],
  },
  {
    date: "2026-07-11",
    time: "10:15",
    kind: "tool",
    title: "F5XC domain / SNI match resolver",
    body: "Wave-2 tool number two. Paste the domain lists of one or more F5XC HTTP load balancers and a test hostname, and it resolves which load balancer and domain entry wins. XC picks the most specific match among load balancers sharing an advertise policy (IP + port) - an exact FQDN beats a wildcard - and the hostname comes from SNI on HTTPS or the Host header on HTTP. It shows wildcard vs apex semantics (a wildcard is a suffix match that does not cover the apex, and a wildcard cert covers a single label), names the runner-up, and flags the hazards: the wildcard+apex auto-cert conflict, duplicate exact domains, more than one Default LB per advertise policy, ambiguous ties, and multi-label wildcard-cert mismatches. Structured warning codes keep the compute language-free; vectors 18/18, en + pt-BR, with a companion Learn article on listener logic.",
    tools: ["f5xc-domain-sni-match-resolver"],
  },
  {
    date: "2026-07-11",
    time: "09:30",
    kind: "tool",
    title: "F5XC origin pool explainer",
    body: "The first F5 Distributed Cloud wave-2 tool. Paste an origin_pool spec and it decodes every origin server's type and address (public IP/DNS, IP/DNS on given sites with a site locator, K8s, Consul, virtual-network, custom endpoint) and labels, the pool port (explicit / same-as-endpoint / automatic - 443 with TLS, else 80), the load-balancing algorithm and endpoint selection, health-check references, and the TLS-to-origin block: security level (reusing the TLS security-level mapper's data, so High is min TLS 1.2), SNI mode, server verification, and mTLS - with a warning when origin-server verification is skipped. It also notes that weights and priorities are not on the servers; they live on the pool reference in a route. Defensive decode, vectors 28/28, en + pt-BR, with a companion Learn article.",
    tools: ["f5xc-origin-pool-explainer"],
  },
  {
    date: "2026-07-11",
    time: "08:30",
    kind: "tool",
    title: "F5XC load-balancing algorithm chooser",
    body: "The fifth and final F5 Distributed Cloud wave-1 tool. A short questionnaire (does the session need to stick? by source IP, cookie, or a custom header? is the pool dynamic?) recommends an XC origin-pool algorithm - Round Robin, Least Active Request, Random, Source IP Stickiness, Cookie Based Stickiness, Ring Hash, or Load Balancer Override - with the BIG-IP equivalent, the caveats that fit the answers, and where to set it. It teaches the XC model that trips up BIG-IP people: the consistent-hashing algorithms ARE the persistence method, there is no separate persistence profile, and the non-hash algorithms do not persist. Grounded in F5's Create HTTP LB guide and the DevCentral Ring Hash and persistence articles. Vectors 13/13, en + pt-BR, with a companion Learn article. Wave 1 complete.",
    tools: ["f5xc-lb-algorithm-chooser"],
  },
  {
    date: "2026-07-11",
    time: "07:30",
    kind: "tool",
    title: "F5XC HTTP LB route explainer",
    body: "The fourth F5 Distributed Cloud wave tool. Paste an http_loadbalancer spec (or just its routes array) and each route is decoded in evaluation order: type (simple / redirect / direct-response / custom), the match (HTTP method, path as prefix / exact / regex, header and query conditions), the action (origin pools with weights, redirect target, or direct-response code), path rewrites and request/response header mutations, host-rewrite override, and the per-route WAF attachment (inherit / app firewall / disabled). A first-match simulator predicts which route a test method + path would hit, and the tool warns when a catch-all route shadows more specific routes below it - because XC evaluates routes first-match, top to bottom. Defensive decode: it renders recognized keys and flags the rest. Vectors 23/23, en + pt-BR, with a companion Learn article.",
    tools: ["f5xc-http-lb-route-explainer"],
  },
  {
    date: "2026-07-11",
    time: "06:30",
    kind: "tool",
    title: "F5XC CE egress checklist & verifier",
    body: "The third F5 Distributed Cloud wave tool, built to never rot. Paste F5's published Customer Edge IP/domain reference file and it parses it into a purpose-organized, site-type-filtered allowlist (registration, Regional Edge connectivity, F5 domains, reputation/classification feeds, container registries, DNS, NTP), plus the port/protocol matrix, optional site-to-site rules (SMG, DC-CG, multi-node, Cloud Connect), a copyable firewall-request text, and a curl-host verification script. It parses what you paste rather than shipping a hardcoded list, and always shows a provenance line. The port matrix and SMG/DC-CG rules are transcribed from F5's CE firewall reference. Vectors 24/24, en + pt-BR, with a companion Learn article on the CE registration flow.",
    tools: ["f5xc-ce-egress-checklist"],
  },
  {
    date: "2026-07-11",
    time: "05:30",
    kind: "tool",
    title: "F5XC TLS security-level cipher mapper",
    body: "The second F5 Distributed Cloud wave tool. Pick a TLS security level (High, Medium, Low) to see its exact min/max TLS versions and full cipher list - each suite annotated with key exchange, forward secrecy, and strength - or paste a cipher suite (IANA or OpenSSL form) or a whole scanner line to see which levels include it. The cipher table is transcribed verbatim from F5's TLS Reference: Default is the High level (min TLS 1.2), Medium and Low are min TLS 1.0, all max TLS 1.3, and the lists are cumulative. It answers the two field questions by name: why a scanner reports TLS 1.0/1.1 (Medium/Low, K000148226) and why it flags weak ciphers (Low's static-RSA suites, K000148079). Vectors 12/12, en + pt-BR, with a companion Learn article.",
    tools: ["f5xc-tls-security-level-mapper"],
  },
  {
    date: "2026-07-11",
    time: "04:45",
    kind: "tool",
    title: "F5XC rate-limit calculator",
    body: "The first tool of the F5 Distributed Cloud wave: enter a rate-limiter configuration (Number, Per Period, Periods, Burst Multiplier, Mitigation) and see its effective rate with per-second/minute/hour equivalents (reproducing F5's own equivalence math where [1, Seconds, 60] equals [1, Minutes, 1]), the burst ceiling, and the exact leaky-bucket behavior: when 429s start, why Mitigation Disabled is not a bypass, how a Block lockout holds until its timer expires, and the distributed-counting overshoot caveat. Grounded in F5 documentation and KBs (K000161473, K000146642, K000157944), computed in the browser, with a companion Learn article.",
    tools: ["f5xc-rate-limit-calculator"],
  },
  {
    date: "2026-07-11",
    time: "03:45",
    kind: "tool",
    title: "VOSS / EXOS command translator",
    body: "A reference translator lays common fabric tasks side by side in VOSS (Fabric Connect / SPBM) and EXOS, and is explicit where EXOS has no equivalent, because EXOS does not run SPBM: it joins a fabric as a Fabric Attach edge and the VOSS FA Server provisions the I-SID. Search the mapping table by task or command fragment. Grounded in Extreme VOSS and EXOS documentation, and deliberately a reference rather than a config generator. It completes the VOSS series alongside the five VOSS Learn articles.",
    tools: ["voss-exos-translator"],
  },
  {
    date: "2026-07-11",
    time: "01:45",
    kind: "tool",
    title: "VOSS fabric identifier decoder",
    body: "A new tool decodes an Extreme SPBM / Fabric Connect identifier, auto-detecting by shape: a 24-bit I-SID (with range validation and a note for the Fabric Attach network I-SID 16777001), a 20-bit nickname in X.XX.XX form converted to and from its integer value, or a system-id / B-MAC with its universal/local and individual/group bits read from the first octet. Grounded in Extreme VOSS documentation and computed entirely in the browser. It ships with a companion Learn article on the I-SID and Layer 2 / Layer 3 VSNs, the first of a VOSS series.",
    tools: ["voss-fabric-id"],
  },
  {
    date: "2026-07-10",
    time: "21:30",
    kind: "tool",
    title: "OUI / MAC vendor lookup",
    body: "A new tool resolves the manufacturer behind a MAC address from the IEEE MA-L (OUI) registry, embedded as a point-in-time snapshot of roughly 40,000 assignments, and reads the two significant bits of the first octet: unicast versus multicast, and universally versus locally administered. It accepts colon, hyphen, Cisco dotted, and unseparated forms, and a bare OUI, and reports a locally administered or randomized address honestly as having no vendor rather than inventing one. The snapshot lazy-loads on the first lookup, so nothing leaves the browser.",
    tools: ["oui-lookup"],
  },
  {
    date: "2026-07-10",
    time: "20:30",
    kind: "tool",
    title: "JA4 / JA3 TLS fingerprint decoder",
    body: "A new tool decodes a JA4 TLS client fingerprint into its transport, TLS version, SNI, cipher and extension counts, and ALPN, or computes the hashed JA4 from raw ClientHello values. It also handles JA3, the predecessor, computing its MD5 and breaking out its fields. Both JA4 and JA3 are BSD 3-Clause; the hash sections are shown as one-way, and GREASE is filtered. Verified byte-exact against the FoxIO and Salesforce specifications, and everything runs in the browser.",
    tools: ["ja4-fingerprint-decoder"],
  },
  {
    date: "2026-07-08",
    time: "23:55",
    kind: "feature",
    title: "The Glossary went live",
    body: "A new Glossary launched at /glossary: 151 entries covering the field's terms, acronyms, expressions, jargon, and lore, each defined in English and Brazilian Portuguese and filterable by domain, kind, and free-text search. Lore entries are fact-checked and cite primary sources, and many terms link straight to the tool that computes them.",
    links: [{ label: "Open the Glossary", href: "/glossary" }],
  },
  {
    date: "2026-07-08",
    time: "22:30",
    kind: "feature",
    title: "Press \".\" for what this page can do",
    body: "A new page-context panel puts each page's special actions one keystroke away. Press the period key anywhere (outside a text field) and a panel lists what the current page offers. On any tool page it opens that tool's full documentation - the man page - inline, without leaving the page. On a vendor hub it shows a hub map that jumps straight to any tool-family section. On the Mega Brain screen it explains what each of its controls does. Pages that have nothing special to offer leave the key alone, so it never gets in the way. Escape or a click outside closes the panel.",
    links: [{ label: "Try it on the F5 hub", href: "/f5" }],
  },
  {
    date: "2026-07-08",
    time: "19:45",
    kind: "tool",
    title: "The Operations & Fieldcraft cluster completes: three tools ship together",
    body: "The fieldcraft family reaches its full five, with three siblings shipped in one batch on the shared foundation the Fault Hypothesis Builder pilot established. The Incident Timeline & RCA Builder orders an incident's events, derives the milestone spans, and structures candidate contributing factors with the evidence that would confirm or rule out each - and it never names a root cause: a factor is echoed confirmed only when you mark it, always attributed to you, an invariant checked by the build itself. The Change Blast-Radius Mapper maps a change as concentric tiers (target, co-located, downstream, human) populated with what could be affected, plus severity-tagged risks and containment measures; it maps what could be affected, never asserts what will break. The TAC Escalation Packet Builder assembles a complete vendor-support packet and a checklist of the artifacts still to collect before opening the case, dropping what you already have; it structures the hand-off, it does not open a case. All three run entirely in the browser, each verified by rule-firing snapshot vectors (twelve, eleven, and twelve), each with a Why-panel and a one-click Markdown export. That is thirty-five vectors across three tools, and four tools now sharing one foundation with no changes to it.",
    tools: ["incident-timeline-rca-builder", "change-blast-radius-mapper", "tac-escalation-packet-builder"],
    articles: ["root-cause-is-a-verb-not-a-noun", "blast-radius-thinking-before-you-change-anything", "tac-cases-that-get-triaged-fast"],
    links: [
      { label: "Incident Timeline & RCA Builder", href: "/tools/incident-timeline-rca-builder" },
      { label: "Change Blast-Radius Mapper", href: "/tools/change-blast-radius-mapper" },
      { label: "TAC Escalation Packet Builder", href: "/tools/tac-escalation-packet-builder" },
    ],
  },
  {
    date: "2026-07-08",
    time: "18:20",
    kind: "tool",
    title: "Change Window Runbook Builder: the fieldcraft cluster's second tool",
    body: "The Operations & Fieldcraft family gains its second member, built on the shared foundation the Fault Hypothesis Builder pilot established. Describe a planned change through six structured fields - change type, environment, blast radius, reversibility, the window, and the safeguards already in place - and a fixed, original 22-rule registry assembles an ordered runbook across six phases: pre-flight, approvals and comms, execution, verification, rollback triggers and back-out, and close-out. It surfaces the risks the plan carries (a one-way change, a broad blast radius, a business-hours window on a critical system) and readiness cautions about the input itself (no backup marked, rollback untested, monitoring not ready). Five domain presets flavor the commands. It structures and sequences, it never approves or executes: the runbook is a proposal to review and adapt, with a Why-panel exposing every fired rule, and a one-click Markdown export for the change ticket. Verified by rule-firing snapshot vectors, the same model the pilot set.",
    tools: ["change-window-runbook-builder"],
    articles: ["change-windows-that-do-not-become-incidents"],
    links: [{ label: "Change Window Runbook Builder", href: "/tools/change-window-runbook-builder" }],
  },
  {
    date: "2026-07-08",
    time: "17:30",
    kind: "feature",
    title: "Collapsible navigation, and the rooms become categories",
    body: "Two index-page navigators are now tidier. The \"Jump to\" section list is collapsed by default behind a single header you can expand - a native disclosure that needs no JavaScript and works from the keyboard - on the tools and Learn indexes, the vendor hubs, and the boss-screens viewer. The \"Show\" filter keeps All and None always visible, with the per-category chips tucked behind a small expander so the common actions stay one click away and the granular ones are there when you want them. And on the tools index, the green room and the red room are no longer quiet footnotes: each is now its own category section with a single explainer card, tinted in that room's own color, leading to its index.",
    links: [
      { label: "Tools", href: "/tools" },
      { label: "The green room", href: "/dev/other" },
      { label: "The red room", href: "/dev/out" },
    ],
  },
  {
    date: "2026-07-08",
    time: "15:40",
    kind: "tool",
    title: "The green room opens: four tools off the catalogue",
    body: "The residual room at /dev/other now has residents - tools whose shapes the catalogue cannot hold yet, for reasons other than reaching the network. A PCAP analyzer reads a capture file entirely in your browser (nothing uploaded) and reports an L2-L4 summary, conversations, top talkers, and anomaly flags. A WebSerial console turns a Chromium browser into a serial terminal for console cables. A self-fingerprint inspector shows the browser and device signals a tracker could read, computed only for you. And a subnetting drill trainer generates randomized CIDR practice with a streak your browser remembers, reusing the site's own CIDR engine for the math. Each states on its own page why it lives off the catalogue.",
    links: [
      { label: "The green room", href: "/dev/other" },
    ],
  },
  {
    date: "2026-07-08",
    time: "14:05",
    kind: "feature",
    title: "List view rebuilt in catalogue anatomy",
    body: "The list mode on the tools and Learn indexes is no longer a flattened card: it is now a proper catalogue table per section - tool, badges, posture, and standards anchors for tools; article, topic, and summary for Learn - in the same anatomy as the internal build catalogue. Cards remain the default; the toggle and its remembered preference are unchanged.",
    links: [
      { label: "Tools", href: "/tools" },
      { label: "Learn", href: "/learn" },
    ],
  },
  {
    date: "2026-07-08",
    time: "13:10",
    kind: "tool",
    title: "ASN lookup joins the red room",
    body: "The second /dev/out resident. Type an AS number and the deterministic layers answer what they can before any egress: special-purpose ASNs (AS0, AS112, AS_TRANS, documentation and private ranges, the reserved ends) are explained locally with their RFC and never leave the browser, bootstrap gaps are reported as unallocated, and real numbers are fetched browser-direct from the owning RIR on an explicit Ask - including following NIR redirects honestly (Brazilian ASNs answer from Registro.br) and naming who actually answered. RIPE-region numbers fail honestly with the exact curl to run instead.",
    links: [
      { label: "ASN lookup", href: "/dev/out/asn-lookup" },
      { label: "/dev/out", href: "/dev/out" },
    ],
  },
  {
    date: "2026-07-08",
    time: "12:10",
    kind: "feature",
    title: "The developer wing completes its color triad: /dev/out in red",
    body: "Network-egress tools now live in /dev/out, the red room, which inherits the explicit-egress rules and the RDAP lookup; /dev/other, the green room, is reserved for tools whose shapes the catalogue cannot hold yet, for reasons other than egress. Blue mothership, green for the odd shapes, red for the room where packets leave. Old RDAP links redirect.",
    links: [
      { label: "/dev/out", href: "/dev/out" },
      { label: "/dev/other", href: "/dev/other" },
      { label: "RDAP lookup", href: "/dev/out/rdap-lookup" },
    ],
  },
  {
    date: "2026-07-08",
    time: "11:05",
    kind: "tool",
    title: "Operations & Fieldcraft opens with the Fault Hypothesis Builder",
    body: "A new tool family for operational judgment, piloted end-to-end per D-86. Describe a fault in six structured fields and 25 deterministic rules rank hypotheses to test across 13 fault domains, each with evidence to collect and the signals that would support or weaken it, plus an exportable Markdown worksheet. It structures, it never diagnoses; the verification model is rule-firing snapshot vectors, pinned in CI. A paired method article covers hypothesis-driven fault isolation, and four follow-on fieldcraft tools are admitted to the queue pending the post-pilot review.",
    tools: ["fault-hypothesis-builder"],
    articles: ["fault-isolation-first-hour"],
  },
  {
    date: "2026-07-08",
    time: "09:10",
    kind: "feature",
    title: "The developer wing gets an index, and a green room opens: /dev, /dev/fun, /dev/other",
    body:
      "/dev-fun moved to its canonical home at /dev/fun (old URLs 301), a small /dev index now fronts the wing, and a new room opened: /dev/other, for tools that ask the live internet instead of computing locally. The room is marked by a deep-green background (the site palette hue-rotated, same darkness) and a visible notice stating exactly how it differs: input leaves the browser only when you press Ask, it goes browser-direct to the official registry (never to ronutz.com servers), and live answers carry no golden-vector guarantee. First resident: RDAP lookup, WHOIS the modern way — domain, IP, or AS number routed deterministically via vendored IANA bootstrap snapshots (RFC 9224), with the registry named before anything is sent, 15 golden vectors on the deterministic layers, and honest curl fallbacks where registries do not allow browser queries. The tools index gained a green door after the last tool.",
    links: [
      { label: "/dev", href: "/dev" },
      { label: "/dev/other", href: "/dev/other" },
      { label: "RDAP lookup", href: "/dev/out/rdap-lookup" },
    ],
  },
  {
    date: "2026-07-08",
    time: "07:20",
    kind: "tool",
    title: "BigD calculator learns the platform-to-hyperthreading map",
    tools: ["f5-bigd-thread-calculator"],
    body:
      "Type the platform instead of guessing the formula: per F5's own platform documentation, rSeries splits down the middle (r5000/r10000/r12000 hyperthreaded, two vCPUs per core; r2000/r4000 physical cores only), VELOS tenants run on hyperthreads (HT-Split per K15003), iSeries and VIPRION count hyperthreads in F5's sizing language but cannot run 21.x (shown as context with that caveat), and Virtual Edition depends on the host (check lscpu). \"8 r10900\" now selects the hyperthreaded formula, \"16 r4800\" the normal one; an explicit ht/normal word still overrides the platform default. Golden vectors grew from 13 to 23; the platform map is sourced from the rSeries/VELOS clouddocs pages and K15003, fetched 2026-07-08.",
    links: [
      { label: "Open the calculator", href: "/tools/f5-bigd-thread-calculator" },
      { label: "The 21.x ops story", href: "/learn/bigip-inplace-upgrade-and-64bit" },
    ],
  },
  {
    date: "2026-07-08",
    time: "05:55",
    kind: "content",
    title: "Five Learn articles complete the BIG-IP 21.x pack",
    body:
      "The 21.x series is now whole. New today, en + pt-BR: the ops story (in-place upgrade with Dry Run and its two honest limits, the 64-bit control plane, the OOM ladder, MCPD worker threads, iControl REST rate limits, UCS platform-migrate validate); WAF over QUIC (HTTP/3 protection with its four stated limits, OpenAPI 3.1, Splunk key-value Extended); DNS as a policy engine (multi-RPZ: 65,535 zones, precedence, TSIG HMAC-SHA-512, the full action set, per-FQDN walled gardens); F5OS 2.0 from the tenant's seat (cloud-init with DO/AS3, per-port UDP RRDAG fine print, Q-in-Q on VELOS); and access & identity (RFC 7591 DCR, native system-browser SAML, Access IPsec constraints, ES13, ARM64). Grounded verbatim in F5's 21.1.0 and 21.0.0 release notes, the 21.1 GA announcement, and K4309 / K60235402 / K86001294, fetched 2026-07-08.",
    links: [
      { label: "The 21.x ops story", href: "/learn/bigip-inplace-upgrade-and-64bit" },
      { label: "WAF over QUIC", href: "/learn/bigip-http3-waf" },
      { label: "Multi-RPZ", href: "/learn/bigip-dns-multi-rpz" },
      { label: "F5OS 2.0", href: "/learn/f5os-2-0-whats-new" },
      { label: "Access & identity", href: "/learn/bigip-21x-access-identity" },
    ],
  },
  {
    date: "2026-07-08",
    time: "05:50",
    kind: "tool",
    title: "New tool: BigD thread calculator",
    tools: ["f5-bigd-thread-calculator"],
    body:
      "BIG-IP 21.1 rebuilt bigd as a multi-threaded single instance serving up to 15,000 control-plane monitors, and documented the automatic thread count: (vCPUs \u00d7 6) \u00f7 10 on hyperthreaded systems, (vCPUs \u00f7 2) \u2212 1 on normal ones, with bigd.numprocs as a manual override capped at the vCPU count (0 = automatic). The calculator encodes both formulas verbatim, shows the exact value and its whole-thread floor when the arithmetic lands on a fraction (F5 states no rounding rule, so the tool says so instead of guessing), and surfaces the override cap and the monitor ceiling. 13 golden vectors; formulas re-verified against F5 techdocs 21.1.0 on 2026-07-08. Pairs with the new ops article.",
    links: [
      { label: "Open the calculator", href: "/tools/f5-bigd-thread-calculator" },
      { label: "The 21.x ops story", href: "/learn/bigip-inplace-upgrade-and-64bit" },
    ],
  },
  {
    // ViewToggle island (data-view on <main>, CSS-only re-flow) + the Fortinet
    // hub dot recolor requested by PRIME the same day.
    date: "2026-07-08",
    time: "04:30",
    kind: "feature",
    title: "List view for the Tools and Learn indexes and the vendor hubs",
    links: [
      { label: "Tools", href: "/tools" },
      { label: "Learn", href: "/learn" },
    ],
    body:
      "Both indexes and the four vendor hubs now offer two densities. Cards remains the default; the new List view re-flows the very same entries into compact catalogue-style rows, name, a one-line summary, and the category and vendor chips, for fast scanning of a long index. The choice sits next to the category filter, is remembered on your device (per index, and once for all hubs), and needs no page reload; with JavaScript off the pages simply stay on cards. Also in this update: the Fortinet dot on the vendor hub strip and chips is now orange, keeping it clearly distinct from F5's red at dot size.",
  },
  {
    // PKG-BIGIP21 step (b): the two marquee deep-dives following the flagship.
    // Facts re-confirmed 2026-07-08 against techdocs 21.1.0 New Features, the
    // F5 21.1 GA blog, DevCentral what's-new-21.1, and the 21.0 LTM profiles
    // manual (Model Context Protocol on BIG-IP).
    date: "2026-07-08",
    time: "03:40",
    kind: "content",
    title: "Two BIG-IP 21.x deep-dives: AI/MCP, and post-quantum TLS",
    links: [
      { label: "AI and MCP", href: "/learn/bigip-ai-mcp" },
      { label: "Post-quantum TLS", href: "/learn/bigip-post-quantum-tls" },
    ],
    body:
      "The two marquee themes of the 21.x line, each in full. AI Traffic on BIG-IP walks MCP from the 21.0 foundation (HTTP, JSON, and SSE profiles, iRule-based session pinning, S3 integrations for AI workloads) to 21.1's native aimcp persistence profile, where TMM hands the client a wrapped and encrypted Mcp-Session-ID, and the Advanced WAF MCP Protection Policy template aimed at the OWASP MCP Top 10, with the caveat that matters: SSE streaming responses bypass response-side inspection. Post-Quantum TLS traces the ML-KEM hybrid lineage from X25519MLKEM768 in the 17.5 era to 21.1's SecP256r1MLKEM768 and SecP384r1MLKEM1024 on both client and server side per FIPS 203, plus X25519 hardware acceleration via Intel QAT on by default, TLS 1.3 and DTLS 1.2 parent-profile defaults, the OCSP nonce, C3D enhancements, and a rollout plan that breaks no legacy client. In English and Portuguese, verified against F5's release notes, manuals, and launch announcements.",
  },
  {
    // Completes the seven queued BIG-IP fundamentals articles (six shipped
    // 2026-07-03); precedence chain verified against F5 K14510 via K28650431,
    // the DNS Services manual (DNS Express + Caching chapters), and K13850558.
    date: "2026-07-08",
    time: "02:45",
    kind: "content",
    title: "New Learn article: the BIG-IP DNS request processing order",
    links: [{ label: "Read it", href: "/learn/bigip-dns-request-processing-order" }],
    body:
      "One query, six answering machines: what actually answers a DNS query arriving at a BIG-IP listener, in F5's documented precedence, iRules first, then DNSSEC processing, the GSLB wide IP match, DNS Express, the DNS cache, the local BIND server, and finally an LTM pool, with the self-IP port 53 edge case at the very end. Covers the responders-versus-resolvers split, the Unhandled Query Action choices, the three DNS cache types, F5's pool-over-BIND recommendation, and the Rapid Response mode that silently removes BIND from the line. In English and Portuguese, grounded in F5 K14510 and K28650431, the BIG-IP DNS Services manual, and K13850558.",
  },
  {
    // curl command builder: 27-protocol coverage, per-protocol explainer
    // panels driven by the same table as the assembler, canonical flag order,
    // 11 golden vectors. Inverse of http-request-translator.
    date: "2026-07-07",
    time: "20:30",
    kind: "tool",
    title: "New tool: curl command builder",
    tools: ["curl-command-builder"],
    body:
      "Pick any of the 27 protocols curl speaks, from HTTPS and SFTP to MQTT, IMAP, and DICT, fill in protocol-aware fields, and get the exact command assembled in one canonical flag order with every flag explained. Per-protocol explainer panels show what each protocol is, its default port, and its TLS posture. Warns on -k, on cleartext protocols, on passwords placed on the command line, and on curl's form-encoded -d default. The inverse of the HTTP request translator. Local and offline; nothing is executed.",
  },
  {
    // BIG-IP 21.x flagship overview article (en + pt-BR native), opening the
    // PKG-BIGIP21 pack: version-numbering story, platform/lifecycle rules, and
    // a themed tour of 21.0 + 21.1. Verified against F5 primary sources.
    date: "2026-07-07",
    time: "14:20",
    kind: "content",
    title: "BIG-IP 21.x: the flagship overview",
    body:
      "Why TMOS jumped from 17.x straight to 21, what 21.0.0 and 21.1.0 actually deliver (MCP-aware AI traffic, post-quantum TLS, in-place upgrade, 64-bit control plane, HTTP/3 WAF, multi-RPZ), and the platform and lifecycle rules to check first. First piece of the BIG-IP 21.x pack; deep dives follow.",
    articles: ["bigip-21x-whats-new"],
  },
  {
    date: "2026-07-07",
    time: "15:00",
    kind: "tool",
    title: "F5 release cadence calendar",
    body:
      "On 6 July 2026 F5 moved from a quarterly to a monthly security release cadence: hardened software releases on the third Wednesday of every month starting 15 July, and security notifications one month later starting 19 August (covering the July release). This tool turns that schedule into concrete dates. Pick a start date, which defaults to today, and it lists the upcoming hardened releases and security notifications and tells you the next of each. Because F5's own anchor dates line up to third Wednesdays, each third Wednesday carries both that month's release and the previous month's notification, and the tool makes that plannable in advance. Verified against F5's two published anchors; local date arithmetic, nothing leaves the browser. Ships with a companion Learn article explaining exactly what changed, why F5 says it changed, what stays the same, and what it means for how you patch.",
    tools: ["f5-release-cadence-calendar"],
    articles: ["f5-monthly-release-cadence"],
  },
  {
    date: "2026-07-07",
    time: "10:15",
    kind: "tool",
    title: "iRules performance linter",
    articles: ["irules-cmp-and-static-namespace"],
    body:
      "Paste an iRule and it flags a small, high-confidence set of anti-patterns straight from F5's own documentation, line by line. The flagship finding is the global-namespace variable ($::x, set ::x, the global keyword): F5's validator catches it from v10 and demotes the virtual server to a single TMM instance (CMP demotion), globals have been deprecated since v10, and the old $::datagroup form raises a runtime error and resets the client on v11 and later. It also warns on unbraced expr (which the bytecode compiler cannot optimize) and notes deprecated matchclass/findclass and costly regexp/regsub. It deliberately does not cry wolf: static::, class match, braced expr, and persistence/tables/session (all CMP-safe on modern versions) pass clean, and comments are skipped. Each finding carries a severity, the offending token, why it matters, and the fix. Ships with a companion Learn article on CMP and the static:: namespace, and points at the runtime calculator for real measurement. Local scan; nothing leaves the browser.",
    tools: ["f5-irules-performance-linter"],
  },
  {
    date: "2026-07-07",
    time: "06:45",
    kind: "tool",
    title: "iRules runtime calculator",
    articles: ["irules-performance-and-timing"],
    body:
      "A browser version of DevCentral's long-standing iRules Runtime Calculator spreadsheet. Paste the timing statistics from tmsh show ltm rule, give it your platform's clock speed and core count, and it converts CPU cycles into real runtime: the average microseconds each event costs, the total cycles per request, the CPU percentage a single request consumes, and the maximum requests per second the rule can sustain, both across all cores and demoted to a single core. It reads the Cycles (min, avg, max) output, uses the average and discards the compile-inflated maximum exactly as F5 advises, and reproduces F5's own published worked example to the digit. Ships with a companion Learn article on how iRules execute (a Tcl interpreter compiling to bytecode inside TMM), what timing measures, and why average is the number that matters. Local arithmetic; nothing leaves the browser.",
    tools: ["f5-irules-runtime-calculator"],
  },
  {
    date: "2026-07-07",
    time: "05:35",
    kind: "content",
    title: "Vendor ACME companions: BIG-IP and FortiGate",
    articles: ["bigip-acme-certificate-automation", "fortigate-acme-certificate-automation"],
    body:
      "Two vendor Learn articles on certificate automation. The F5 BIG-IP article covers the native ACMEv2 client added in BIG-IP 21.1.0, which handles provisioning, renewal, and deployment for any ACMEv2 CA (Let's Encrypt, ZeroSSL, DigiCert, Buypass, Google Trust Services, SSL.com) through Certificate Order Management, alongside the dehydrated-based DevCentral solutions that preceded it, BIG-IQ's centralized Let's Encrypt CA management profile, and Ansible-driven issuance. The FortiGate article covers FortiOS's built-in ACME client for the appliance's own management certificate: its public-IP and FQDN requirements, the single-name SAN constraint (no wildcards, no multiple SANs), and the TLS-ALPN-01 and HTTP-01 challenges by FortiOS version. Both link the certificate cluster (rate-limit planner, x509 decoder, renewal planner, dns-01) and contrast the two native clients. Every vendor claim was checked against the vendor's own documentation, including F5's 21.1.0 release notes and Fortinet's per-version admin guides. English and Portuguese, other locales served by English fallback.",
  },
  {
    date: "2026-07-07",
    time: "05:10",
    kind: "tool",
    title: "Let's Encrypt rate-limit planner",
    articles: ["acme-protocol"],
    body: "Paste the hostnames you plan to certify and see how they map onto Let's Encrypt's limits. It groups names by registered domain (eTLD+1) using the Public Suffix List, shows the fewest certificates you need by packing up to 100 names each, points out where a wildcard would collapse subdomains, and warns if issuing one certificate per name would exceed the 50-per-registered-domain-per-week limit. The concrete limits are shown with their snapshot date and source link, and it notes that ARI-coordinated renewals are exempt from all limits. Builds directly on the registered-domain resolver; runs entirely locally.",
    tools: ["letsencrypt-rate-limits"],
  },
  {
    date: "2026-07-07",
    time: "04:20",
    kind: "tool",
    title: "Registered domain (eTLD+1) resolver",
    body: "Find the public suffix and registered domain for any hostname. Paste a name and it returns the eTLD (e.g. co.uk), the registered domain (e.g. example.co.uk), the subdomain, and which section of the Public Suffix List decided it. It implements the full PSL algorithm, including wildcard and exception rules, and when a PRIVATE-section rule wins (like github.io) it also shows the ICANN-only view. This is the exact boundary certificate rate limits, cookies, and same-site checks rely on. Runs locally against a bundled, dated snapshot of the list; verified against the PSL algorithm test vectors. Ships with a companion article on public suffixes and eTLD+1.",
    tools: ["public-suffix"],
  },
  {
    date: "2026-07-07",
    time: "03:26",
    kind: "tool",
    title: "ACME dns-01 TXT computer",
    articles: ["acme-protocol"],
    body: "Compute the TXT record that passes an ACME dns-01 challenge. Paste the challenge token and your ACME account key (a public JWK, or its thumbprint) and it returns the _acme-challenge record name, the value to publish, and the key authorization and RFC 7638 thumbprint it was derived from. Only the key's public members are used and the key is never echoed; the SHA-256 runs locally via Web Crypto, verified against the RFC 7638 known-answer test. Ships with a new ACME protocol article explaining the whole issuance flow.",
    tools: ["acme-dns01"],
  },
  {
    date: "2026-07-06",
    time: "23:42",
    kind: "tool",
    title: "ExtremeXOS config explainer",
    articles: ["how-extremexos-config-is-structured"],
    body: "Paste an ExtremeXOS (EXOS / Switch Engine) configuration and it explains each command in plain English, summarizes the VLANs with their tags and tagged/untagged ports and IP addresses, and groups the commands by category. First Extreme Networks tool, so the Extreme hub is now live.",
    tools: ["exos-config-explainer"],
  },
  {
    date: "2026-07-06",
    time: "23:05",
    kind: "tool",
    title: "PAC file explainer and validator",
    articles: ["how-a-pac-file-chooses-a-proxy"],
    body: "Paste a Proxy Auto-Config file and it reads back the proxy directives it returns, the helper functions it uses (with the DNS-consulting ones flagged), structural and correctness lints, and whether it is a Netskope Cloud Explicit Proxy steering file. It never evaluates the file. First Netskope tool, so the Netskope hub is now live.",
    tools: ["pac-file-explainer"],
  },
  {
    date: "2026-07-06",
    time: "23:00",
    kind: "tool",
    title: "FortiOS packet sniffer builder",
    articles: ["reading-a-fortigate-sniffer-trace"],
    body: "Build a FortiGate diagnose sniffer packet command from parts, or paste one to have every argument explained: interface, filter, verbosity 1-6, count, and timestamp format, with the common traps flagged. First Fortinet tool, so the Fortinet hub is now live.",
    tools: ["fortios-sniffer-builder"],
  },
  {
    date: "2026-07-06",
    time: "22:40",
    kind: "feature",
    title: "Two more Boss-Key Screens: MS-DOS Defrag and Copy II PC",
    links: [{ label: "Boss-screens gallery", href: "/dev/fun/boss-screens" }],
    body: "The Boss-Key Screen gallery gains two animated DOS disk utilities: the MS-DOS 6 defragmenter with its cyan block map, and Central Point's Copy II PC copying a floppy track by track. Both animate with CSS only and respect reduced-motion.",
  },
  {
    date: "2026-07-06",
    time: "22:20",
    kind: "feature",
    title: "Disclaimer and limitation-of-liability page",
    links: [{ label: "Disclaimer page", href: "/disclaimer" }],
    body: "A new plain-language disclaimer sets out that everything on the site is provided as is, built from public information, for use at your own risk, with no warranty and no liability, and that security is best-effort. Linked from the footer next to the license and privacy notices.",
  },
  {
    date: "2026-07-06",
    time: "21:32",
    kind: "content",
    title: "New Learn articles: proxies, TLS interception, and SAML proxying",
    articles: ["http-proxy-forward-and-reverse", "ssl-forward-proxy-interception", "saml-proxy-explained"],
    body:
      "A batch of ten articles on the proxy family. Five vendor-agnostic explainers cover the TCP proxy at Layer 4, HTTP proxies (forward vs reverse, explicit vs transparent), inbound TLS at a reverse proxy (offload, bridging, passthrough), the SSL forward proxy that intercepts outbound TLS, and the SAML proxy that inserts an identity layer into a session. Five vendor companions map those concepts onto real products: F5 SSL Orchestrator topologies, F5 BIG-IP APM as a SAML SP/IdP, enforcing forward secrecy on F5, FortiGate certificate vs deep SSL inspection, and Netskope cloud forward proxy with inline TLS decryption. Perfect forward secrecy and the F5 client-SSL/server-SSL profile split were already covered by existing explainers, which the new articles link to rather than duplicate. Every vendor claim was checked against the vendor's own documentation. English and Portuguese, with the other locales served by English fallback.",
  },
  {
    date: "2026-07-06",
    time: "20:52",
    kind: "feature",
    title: "Boss-screens viewer: grouped, with a jump navigator",
    links: [{ label: "Boss-screens gallery", href: "/dev/fun/boss-screens" }],
    body:
      "The boss-key screen gallery on /dev/fun now organizes its 76 screens into six families, home computers, PC hardware and POST, DOS software, operating systems and servers, online services and BBSes, and network analysis, each in its own labelled section. A jump navigator sits on top, the same category-nav pattern used by the Tools and Learn indexes, so you can skip straight to a family instead of scrolling one long grid. Group labels are localized (English and Portuguese, other locales via English fallback); the cards, thumbnails, and fullscreen overlay are unchanged.",
  },
  {
    date: "2026-07-06",
    time: "20:01",
    kind: "content",
    title: "New Learn articles: post-quantum cryptography",
    articles: ["nist-pqc-standards"],
    body:
      "Three new articles in the transport track cover the post-quantum transition end to end. The first explains what a quantum computer would actually break (Shor against RSA/DH/ECC, Grover only halving symmetric strength) and why harvest-now-decrypt-later makes it a present concern. The second walks the finalized NIST standards, FIPS 203 ML-KEM for key establishment and FIPS 204 ML-DSA and FIPS 205 SLH-DSA for signatures, plus the HQC and FN-DSA backups still in the pipeline. The third is the practical one: how hybrid key exchange (X25519MLKEM768) puts post-quantum crypto on the TLS 1.3 wire today, the ClientHello size problem it creates for middleboxes and load balancers, and where browser and server deployment stands. Grounded in NIST CSRC, the IETF drafts, and current deployment reporting; English and Portuguese.",
  },
  {
    date: "2026-07-06",
    time: "19:29",
    kind: "tool",
    title: "New tool: F5 iQuery protocol explainer",
    articles: ["how-iquery-connects-bigip-dns"],
    body:
      "A new F5 BIG-IP DNS (GTM) tool that decodes iqdump output and /var/log/gtm iQuery messages, and explains the iQuery architecture on request. Paste iqdump and it reads back the header comments and the <xml_connection> stanza (the big3d peer on TCP 4353, the sync group, version, connection_id); paste a gtm log and it decodes the box green-to-red state changes; or pick a topic (mesh, port 4353, SSL trust, iqdump, metrics, gtmd, big3d, VLAN) for a plain-language explanation. Decode-only and fully local, grounded in F5's BIG-IP DNS/GTM manuals and K-articles, with the example taken from a real iqdump sample F5 published. Ships with a paired Learn article in English and Portuguese.",
    tools: ["iquery-protocol-explainer"],
  },
  {
    date: "2026-07-06",
    time: "18:26",
    kind: "feature",
    title: "Keyboard shortcut: press F for the dev-fun index",
    links: [{ label: "dev-fun index", href: "/dev/fun" }],
    body:
      "The site-wide keyboard shortcuts gain F, which jumps to the dev-fun landing page (joining B for the boss key, M for the Mega Brain console, and Z for Buzzword Bingo). Like every shortcut it is rebindable in Settings and inert while you are typing in a field. Separately, the PCBoard boss screen now shows a handle at its login prompt, matching how PCBoard boards actually identified callers.",
  },
  {
    date: "2026-07-06",
    time: "16:13",
    kind: "content",
    title: "The Sniffer learns to decode: eight famous captures in the three-pane view",
    tools: ["f5-bigip-tcpdump-builder"],
    body:
      "The Network General Sniffer screen gains eight companion decodes rendered in its authentic three-pane analysis view (summary, detail, and hex): an HTTP 420 Enhance Your Calm response, the ILOVEYOU mail envelope, and the Morris Worm, Stuxnet, Conficker, Mirai, WannaCry, and NotPetya. HTTP 420 and ILOVEYOU show their real, benign application-layer artifacts in full; the six network worms are shown at the header level only (ports, protocol, CVE, date) with a clear payload-omitted marker, so no exploit or shellcode bytes appear. Every on-screen string is grounded in a cited source, from CISA and CAIDA to Microsoft and the Twitter API record.",
  },
  {
    date: "2026-07-06",
    time: "15:41",
    kind: "content",
    title: "Two professional tools close out the boss-screen set",
    links: [{ label: "Boss-screens gallery", href: "/dev/fun/boss-screens" }],
    body:
      "The retro collection reaches 68 with the pro tools that ran the network room: the Network General Sniffer, the DOS protocol analyzer that named the whole category and whose menu here is taken verbatim from a Sniffer v4.4 tutorial, and the VMware ESXi 6.7 DCUI, the bare-metal hypervisor's yellow-and-grey console with its F2-to-configure, F12-to-shut-down legend. Both were checked against period sources, from the Sniffer's own manual description to VMware's release records.",
  },
  {
    date: "2026-07-06",
    time: "15:23",
    kind: "content",
    title: "The 128K Spectrum family: +2A and +3 join, and the 128 menu is corrected",
    links: [{ label: "Boss-screens gallery", href: "/dev/fun/boss-screens" }],
    body:
      "The ZX Spectrum 128 boot menu was fixed to show the machine's real options (Tape Loader, 128 BASIC, Calculator, 48 BASIC) with no spurious copyright line, and two new screens join it: the Amstrad-era ZX Spectrum +2A and +3, both showing the shared +3 ROM menu (Loader, +3 BASIC, Calculator, 48 BASIC) and the (c)1982, 1986, 1987 Amstrad Plc. line, matched against a real-hardware photo and the official +3 manual.",
  },
  {
    date: "2026-07-06",
    time: "14:58",
    kind: "content",
    title: "TK90X and TK95 boot screens corrected against real hardware",
    links: [{ label: "Boss-screens gallery", href: "/dev/fun/boss-screens" }],
    body:
      "Photographs of real Microdigital hardware corrected two things on these boot screens. Both machines show an eight-colour test bar (the ZX Spectrum bright palette) that was missing before: the TK90X a thin horizontal bar, the TK95 a taller field of vertical colour bands. The TK95's boot line was also fixed to read Microdigital TK95, its actual name, replacing a line taken from a mislabelled Spanish-variant ROM dump. A reminder that a ROM dump is only good evidence when it is the right ROM.",
  },
  {
    date: "2026-07-06",
    time: "14:45",
    kind: "content",
    title: "The GUI and online era arrives: six more boss screens",
    links: [{ label: "Boss-screens gallery", href: "/dev/fun/boss-screens" }],
    body:
      "The retro collection reaches 64 with the interfaces that carried computing from the command line into the graphical, networked age: Windows for Workgroups 3.11 Program Manager, the OS/2 Warp Workplace Shell desktop, the classic Macintosh Finder with its Trash, NCSA Mosaic opening the web, and the two services that first put millions online, CompuServe with its numbered menu and AOL with its Welcome screen. Framing facts were checked against period sources, from IBM and Microsoft histories to NCSA's own account of Mosaic.",
  },
  {
    date: "2026-07-06",
    time: "14:26",
    kind: "content",
    title: "TK90X and TK95 boot screens: the rainbow stripes are gone",
    links: [{ label: "Boss-screens gallery", href: "/dev/fun/boss-screens" }],
    body:
      "The Microdigital TK90X and TK95 retro screens were showing four colour bars that the real machines never display at power-on: those stripes belong to the Spectrum's logo and case motif, not the boot screen, which is plain black text on a paper-white background. Both now boot the way the hardware does, to a blank white screen with only the copyright line at the bottom (TK90X - Color Computer and TK Color Computer), verified byte-for-byte against ROM dumps and a real-hardware boot video.",
  },
  {
    date: "2026-07-06",
    time: "13:55",
    kind: "content",
    title: "Ten DOS-era workhorses join the boss screens",
    links: [{ label: "Boss-screens gallery", href: "/dev/fun/boss-screens" }],
    body:
      "The retro screen collection jumps to 58 with the software that ran offices and small businesses: XTreePro and XTreeGold, dBASE II at its dot prompt, a Clipper Summer '87 compile with its preserved copyright banner, Borland SideKick popping over a DOS session, MultiMate Advantage, Professional Write, Harvard Graphics, Microsoft Works, and Ami Pro, the first fully functional Windows word processor. Every dated fact was checked against period sources, from the XTree fan archive's command list to Microsoft's own history pages.",
  },
  {
    date: "2026-07-06",
    time: "13:24",
    kind: "content",
    title: "Three BBS screens, and the TK90X and TK95 set right",
    links: [{ label: "Boss-screens gallery", href: "/dev/fun/boss-screens" }],
    body:
      "The retro screen collection reaches 48 with the other side of the modem: RemoteAccess waiting for a caller on the sysop's console, Oblivion/2's scene-styled front door, and Telegard's classic main menu. The TK90X and TK95 boot screens were also corrected: the real machines boot to their own names (TK90X - Color Computer and TK Color Computer), verified character by character against ROM dumps and real-hardware video, replacing an inaccurate Sinclair-style line.",
  },
  {
    date: "2026-07-06",
    time: "12:34",
    kind: "content",
    title: "Three deep-cut boss screens: NetWare, PCBoard, and Videotexto",
    links: [{ label: "Boss-screens gallery", href: "/dev/fun/boss-screens" }],
    body:
      "The retro screen collection grows to 45 with three long-requested additions: the Novell NetWare 3.12 console running MONITOR.NLM (its utilization figure ticking about once a second, the way the real screen refreshed), a PCBoard BBS session dialing Clark Development's own Salt Air support board at 2400 bps, and the TELESP Videotexto index painting line by line the way Brazil's 1982 videotex service did over a 1200/75 bps modem link.",
  },
  {
    date: "2026-07-06",
    time: "05:10",
    kind: "content",
    title: "Two more retro boot screens, and a fix to a third",
    links: [{ label: "Boss-screens gallery", href: "/dev/fun/boss-screens" }],
    body:
      "The hidden retro boot-screen collection gains the Microdigital TK-82C (a ZX81 clone, the machine this site's author first learned to program on) and the TK95 (the TK90X's Spectrum-clone successor), bringing the set to 42. The ZX81 and TK-82C screens now type a first line by themselves, the way those machines did. The TK90X screen was corrected: its ROM replaced the copyright symbol with a Greek delta, so its boot line now reads accurately. The screens in the viewer are also listed in alphabetical order.",
  },
  {
    date: "2026-07-06",
    time: "04:30",
    kind: "infra",
    title: "Pinned to the framework version the site builds cleanly on",
    body:
      "The framework was briefly moved up a major version, which changed how the site is turned into static files at build time: it began emitting several extra bookkeeping files per page, and across thousands of pages in sixteen languages that overflowed the build machine's disk before the export could finish. Since the site is a purely static export that gains nothing from the newer version's server-oriented features, it is now pinned back to the previous major version, which produces far fewer build artifacts and completes the export well within the available space. Everything the site does is unchanged; this only affects how it is built.",
  },
  {
    date: "2026-07-06",
    time: "03:20",
    kind: "content",
    title: "Boss-key screens now hold a proper 4:3 monitor shape",
    links: [{ label: "Boss-screens gallery", href: "/dev/fun/boss-screens" }],
    body:
      "The retro boss-key screens are now framed like the CRT and TV displays these machines actually used, a 4:3 monitor that scales to fit the window and centers with letterboxing, rather than stretching. Previously each screen filled the full window height while its width followed its content, so a screen with only a line or two (a ZX Spectrum copyright line, an MSX prompt) became a tall, narrow strip, while a wide two-panel layout like Norton Utilities happened to look right. Every screen now shares the same correct proportions on any window size, from an ultrawide monitor to a phone.",
  },
  {
    date: "2026-07-05",
    time: "22:18",
    kind: "feature",
    title: "A user guide that stays current with the toolbox",
    links: [{ label: "User guide", href: "/guide" }],
    body:
      "There is now a Site User Guide at /guide, linked from the footer. It has four parts: an at-a-glance datasheet, a full tool reference grouped by category, suggested-usage recipes that map a common task to the tools that do it, and a short manual covering how to run a tool, privacy, the API, languages, and offline use. The datasheet figures and the tool reference are generated from the site's own sources at build time, so they always match what is published; a build guard additionally fails if a recipe ever points at a tool that no longer exists. English and Portuguese are authored directly; other locales fall back per key.",
  },
  {
    date: "2026-07-05",
    time: "21:37",
    kind: "feature",
    title: "A single switch turns the API on or off, and the pills follow it",
    links: [{ label: "Settings", href: "/settings" }],
    body:
      "Whether the API is served is now controlled by one value in one file (API_PROCESSING in the API surface config): 0 keeps it documented but not served, 1 turns on local processing, where the same-origin worker answers each endpoint with the in-house engines. Both the worker and the interface read that one value, so they can never disagree: while it is off, every /api/v1 request returns an honest 404, and every API pill and badge shows a neutral grey state with 'documented, not served' wording; flip it to 1 and the same pills turn green with 'served locally' wording, on each tool page and on the API page. The switch ships in the off position. A repository link was also added to the License page and the footer. English and Portuguese ship together; other locales fall back per key.",
  },
  {
    date: "2026-07-05",
    time: "21:32",
    kind: "infra",
    title: "A proper multilingual sitemap, with hreflang for every language",
    body:
      "The site now generates sitemap.xml at build time, listing every page with an hreflang alternate for each of the sixteen live languages plus an x-default, so search engines understand which URLs are translations of one another. It is derived from the built pages, so it stays current automatically as pages are added or removed. robots.txt now points at it. This complements the per-page canonical links added earlier.",
  },
  {
    date: "2026-07-05",
    time: "21:07",
    kind: "launch",
    title: "ronutz.com is now open source: Apache-2.0 for code, CC BY 4.0 for content",
    links: [{ label: "License", href: "/license" }],
    body:
      "The project is now open source. The application code is licensed under the Apache License 2.0, and the written content, including every Learn article and all the tool copy, under Creative Commons Attribution 4.0 (CC BY 4.0). Both licenses require attribution, so anyone reusing the code or the content must credit the source, and ronutz.com stays the canonical, maintained home. The License page now describes the open terms, the footer badges are live, and the repository carries the full LICENSE, a content license, and the third-party NOTICE. Each page also now declares its own canonical URL, so a copy rehosted elsewhere still points search engines back here. English and Portuguese ship together; other locales fall back per key.",
  },
  {
    date: "2026-07-05",
    time: "20:39",
    kind: "feature",
    title: "Open-source and licensing badges, on the way to opening the code",
    links: [{ label: "License", href: "/license" }],
    body:
      "The License page and the footer now carry a set of hand-drawn, self-hosted badges that declare how the project will be licensed once it is opened: Open Source, the code under the Apache License 2.0, and the content under Creative Commons Attribution 4.0 (CC BY 4.0), which requires anyone reusing it to credit the source. The badges are inline SVG that theme with the rest of the site and load no external assets, in keeping with the privacy stance; the Apache mark is a plain SPDX label rather than the Apache Foundation's feather, and the Creative Commons glyphs are the marks CC publishes for exactly this purpose. On the License page they are framed as the planned terms, since the project is still proprietary today; the footer cluster links through to the full terms. English and Portuguese ship together; other locales fall back per key.",
  },
  {
    date: "2026-07-05",
    time: "20:22",
    kind: "feature",
    title: "Every API-capable tool now shows its endpoint URL, linked to the spec",
    links: [{ label: "API reference", href: "/api" }],
    body:
      "Each tool that has an HTTP API endpoint now displays that endpoint on its page, for example GET https://ronutz.com/api/v1/cidr, as a link that opens the API reference's Swagger UI view, deep-linked to that tool's operation. The endpoint URLs and their operation anchors are read from the generated OpenAPI spec at build time, so they are always correct, including hand-authored operations whose identifiers differ from the tool slug. The label is honest: the endpoint is documented, not served, and the link opens the specification rather than making a live call. Tools without an API endpoint show nothing. English and Portuguese ship together; other locales fall back per key.",
  },
  {
    date: "2026-07-05",
    time: "19:49",
    kind: "feature",
    title: "The API reference is now public, documented but deliberately not served",
    links: [{ label: "API reference", href: "/api" }],
    body:
      "The tools API now has a visible home, linked from the footer next to the build stamp. Every tool is built to run as a small, deterministic HTTP API, and the full OpenAPI 3.1 contract is published and browsable, both in an on-brand reference and in a standard Swagger UI view. The page is honest about one thing up front: the API is implemented and documented, but this site does not serve it, because a public API bills for compute on every call in ways a single maintainer cannot cap safely, and the site is meant to stay free and predictable to run. In keeping with that, both reference views are now inert: Swagger UI's try-it-out controls are removed, and the on-brand explorer builds the exact request URL you would call but sends nothing. The engine is open, so anyone who needs the API today can run it themselves. English and Portuguese ship together; other locales fall back per key.",
  },
  {
    date: "2026-07-05",
    time: "19:24",
    kind: "feature",
    title: "A 'what this page needs' pill on the CIDR tool (proof of concept)",
    body:
      "A new capability row is being trialled on the CIDR calculator before a wider rollout. It states, up front, what your browser needs for the tool to be fully functional: a 'Runs in your browser' pill notes that the tool computes entirely on your device (so nothing you type is sent anywhere) and therefore needs JavaScript, and an 'API-ready' pill marks that this tool is also built to work over an HTTP API, with a clear note that the API is not switched on yet. With JavaScript disabled, a short note now explains the reduced-function version honestly: the page's explanation, the Markdown reference, the Learn article, and the sources all still render server-side; only the live calculator needs JavaScript. English and Portuguese ship together; other locales fall back per key.",
    tools: ["cidr"],
  },
  {
    date: "2026-07-05",
    time: "19:00",
    kind: "feature",
    title: "Full Apple coverage: the Apple I, the original Apple II, and the Macintosh (Happy Mac)",
    links: [{ label: "Boss-screens gallery", href: "/dev/fun/boss-screens" }],
    body:
      "The boss-key gallery now covers Apple's iconic early machines end to end, each checked against original documentation. New: the Apple I (1976), where Wozniak's 256-byte WozMon prints a backslash and a blinking cursor after Reset; the original Apple II (1977), which has no autostart ROM and comes up in the machine-language monitor at a * prompt (Ctrl-B enters Integer BASIC and its > prompt); and the Macintosh 128K (1984), with Susan Kare's friendly boot, a blinking floppy-with-a-question-mark that resolves into the smiling Happy Mac and Welcome to Macintosh. The existing //e screen was also corrected: it now shows the enhanced //e's Apple //e banner, which keeps it visually distinct from the Apple ][+ screen. Together with the II+, //c, and IIgs added earlier, that is seven Apple screens; the gallery now holds forty in all.",
  },
  {
    date: "2026-07-05",
    time: "18:15",
    kind: "feature",
    title: "Nine more boot screens: Apple ][+, //c, IIgs, Atari 800XL, TI-99/4A, MSX turbo R, and Brazilian clones",
    links: [{ label: "Boss-screens gallery", href: "/dev/fun/boss-screens" }],
    body:
      "The boss-key gallery in /dev/fun grew by nine period-accurate boot screens, each checked against original documentation. New this round: the Apple ][+ (the plain Apple ][ banner and ] prompt), the Apple //c (Apple //c, then Check Disk Drive with no disk in the drive), the Apple IIgs (its Check Startup Device screen with the colour Apple logo sliding side to side), the Atari 800XL (deep blue Atari BASIC READY), the TI-99/4A (the cyan TEXAS INSTRUMENTS HOME COMPUTER title, press any key to begin), and the MSX turbo R (the logo assembling from the sides into MSX BASIC 4.0). Three are Brazilian machines from the market-reserve years: the Prologica CP-300 (the compact, disk-less TRS-80 Model III clone that boots straight to cassette BASIC), the Prologica CP-400 (the TRS-80 Color clone, a CoCo 2 running Extended Color BASIC), and the Unitron AP II (the faithful Apple II Plus clone with a Portuguese ROM). They join the existing screens in the same shuffled rotation (you see them all before any repeats), browse left and right while one is up, and Esc dismisses; all animations respect the reduced-motion setting.",
  },
  {
    date: "2026-07-05",
    time: "16:07",
    kind: "feature",
    title: "Customizable shortcuts, a settings page, ten boss-key screens, and a motion switch",
    links: [{ label: "Boss-screens gallery", href: "/dev/fun/boss-screens" }],
    body:
      "A big pass over the site's keyboard shortcuts and the /dev/fun corner. Shortcuts are now user-configurable: a new Settings page (linked in the footer) lets you rebind any shortcut key, with the choice saved on your device; press ? anywhere for a live cheat-sheet of the current bindings. New shortcuts were added alongside the originals: s opens search, / focuses it, h goes home, ? opens the cheat-sheet, and 1 to 5 jump to five go-to tools (CIDR, Base64, JWT, JSON to YAML, and the F5 hub). Language is now a saved preference too: a return visit to the site's home takes you to your preferred language, while any explicit /en/ or /pt-BR/ link is always honored as-is. The boss key grew from two disguises to ten period-accurate ones (Lotus 1-2-3, WordStar, VisiCalc, Norton Utilities, WordPerfect 5.1, dBASE III+, Turbo Pascal, the Windows blue screen, Norton Commander, and a Commodore 64 that types a program by itself), shuffled so you see them all before any repeats; while one is up, the left and right arrows browse the rest, and Esc dismisses. A new Boss-Key Screens gallery in /dev/fun lets you browse them by name, thumbnail, and a short note, and open any one fullscreen. Finally, the Mega Brain console got a motion switch in its title bar for anyone who prefers less movement (its explanatory banners now also hold still while the console shakes), complementing the system reduced-motion setting the site already respects.",
  },
  {
    date: "2026-07-05",
    time: "13:54",
    kind: "feature",
    title: "Site-wide keyboard shortcuts, and a Mega Brain console tune-up",
    links: [{ label: "Mega Brain console", href: "/dev/fun/mega-brain" }],
    body:
      "New single-key shortcuts on every page: b for the boss key (hide the page behind a 1980s work app until any key or click), t for the Tools index, l for the Learn index, m for the Mega Brain console, and z for Buzzword Bingo. They stay completely inert while you are typing (a focused text field, paste box, or search input keeps its keys) and when a modifier is held (so Ctrl+T and the like are never shadowed); they run entirely in the browser with no tracking, and are documented on the privacy and site-behavior page. Alongside that, the Mega Brain console got a tune-up: the FULL POWER and STOP controls moved into the window title bar as pills (FULL POWER a fixed-pink lightning pill, STOP a red octagonal emergency-stop button), the Mano Deyvin tribute overlay now dismisses on a click anywhere (fixing a mispointing cue and the sense that a timer was blocking it), and the /dev/fun label in the console frame is now a link back to the /dev/fun index, with a matching link added to Buzzword Bingo.",
  },
  {
    date: "2026-07-05",
    time: "13:10",
    kind: "tool",
    title: "New tool: Telemetry Streaming (TS) explainer",
    body:
      "The third F5 Automation Toolchain explainer, completing the AS3 / DO / TS set. Paste the JSON you POST to /mgmt/shared/telemetry/declare and it reads it back: it confirms the top-level Telemetry class, reads the optional Controls (logLevel, debug, the beta memoryMonitor), and walks every named class-object grouped by its role in the telemetry pipeline rather than by onboarding order. Data sources produce telemetry (a Telemetry_System with its systemPoller or iHealthPoller, a standalone Telemetry_System_Poller pulling from another BIG-IP, or a Telemetry_Listener ingesting events on TCP+UDP port 6514); consumers forward it out (Telemetry_Consumer push consumers with the full type catalogue: Splunk, Azure, AWS CloudWatch/S3, Graphite, Kafka, ElasticSearch, DataDog, Generic HTTP, OpenTelemetry and more, or Telemetry_Pull_Consumer pull consumers like Prometheus); and Telemetry_Namespace and Telemetry_Endpoints support the rest. The headline check is pipeline completeness: it flags a declaration that is valid but does nothing, consumers with no source, sources with no consumer, a Telemetry_System missing its systemPoller (the troubleshooting-doc gotcha), a Consumer missing its type, and it counts namespace-internal sources and consumers so a namespaced declaration is not falsely flagged. Where AS3 and DO configure the box, TS observes it. Grounded in F5 TS docs (clouddocs, TS 1.41-1.42); note TS is in maintenance mode per F5, still supported, no deprecation planned. Decode-only, nothing leaves the browser.",
    tools: ["telemetry-streaming-explainer"],
  },
  {
    date: "2026-07-05",
    time: "13:10",
    kind: "content",
    title: "Learn article: Telemetry Streaming, the extension that observes",
    articles: ["bigip-telemetry-streaming-ts"],
    body:
      "The companion to the new explainer, in English and Portuguese. It places TS in the toolchain by what it does differently: AS3 and DO configure the BIG-IP, TS observes it, aggregating, normalizing, and forwarding stats and events to a consumer. It walks the flat Telemetry-class model (no tenant, no Common, unlike DO), the three object roles (sources produce, consumers forward, namespaces and endpoints support), the long push/pull consumer catalogue, and the failure that passes schema validation: an incomplete pipeline with a source but no consumer or a consumer but no source, including the Telemetry_System-without-systemPoller trap and the namespace-scoping subtlety. States plainly that F5 has placed TS in maintenance mode. Cross-linked to the DO and AS3 articles and the new tool.",
  },
  {
    date: "2026-07-05",
    time: "10:30",
    kind: "tool",
    title: "New tool: DO declaration explainer + validator",
    body:
      "The sibling of the AS3 explainer, for the other half of the F5 Automation Toolchain. Paste the JSON you POST to /mgmt/shared/declarative-onboarding and it reads it back: whether it is a DO request wrapper (class DO, as sent to a BIG-IQ with a targetHost) or a bare Device declaration, the top-level options (schemaVersion, async, webhook, label), and the one tenant a DO declaration is allowed, which the schema requires be named Common. It walks that tenant's class-objects grouped by the phase DO effectively onboards them in: licensing and provisioning first because they gate the modules, then system identity (hostname, DNS, NTP, users), then networking (VLANs, self IPs, routes), then the clustering that joins a box to its peers. Every class is named and explained from F5's schema reference. It also flags the documented gotchas that bite in production: a hostname set on both Common and a System class (mutually exclusive), a self IP with no allowService (DO 1.36 changed that default from `default` to `none`, so it now locks down), a root user missing its oldPassword, and async:true returning a 202 you poll with GET. A structure explainer and sanity checker, not the full JSON-Schema validator; grounded in F5 DO docs (clouddocs, DO 1.47.0), decode-only, nothing leaves the browser.",
    tools: ["do-explainer-validator"],
  },
  {
    date: "2026-07-05",
    time: "10:30",
    kind: "content",
    title: "Learn article: Declarative Onboarding, the L1-L3 half",
    articles: ["bigip-declarative-onboarding-do"],
    body:
      "The companion to the new explainer, in English and Portuguese. It draws the line that makes the whole toolchain click: AS3 configures the L4-L7 application services on a box already on the network, and DO does the L1-L3 onboarding that gets it there, licensing, provisioning, DNS and NTP, VLANs and self IPs and routes, users, and clustering. It walks the one-Device-one-Common-tenant model and why DO is stricter than AS3 about the tenant name, the async-returns-202 contract, the classes in the order onboarding actually happens, and the three version-specific traps the docs bury: the hostname mutual-exclusion, the DO 1.36 allowService default flip to none, and the root oldPassword requirement. Cross-linked to the AS3 anatomy article and the new tool.",
  },
  {
    date: "2026-07-04",
    time: "11:39",
    kind: "tool",
    title: "New: AWAF policy-diff hole checker (FP set complete)",
    body:
      "Paste a before and an after declarative WAF policy and it classifies every security-relevant change as a relaxation or a tightening, then answers the question that matters after tuning: did this open a hole? It separates relaxations that widen protection beyond a single entity (switching to Transparent, disabling a violation or evasion, Data Guard off, trusting X-Forwarded-For, moving signatures to staging, or adding a wildcard entity) from a properly-scoped single-entity allow (adding one URL or parameter, the normal false-positive fix). The verdict is opened-hole if any policy-wide relaxation is present, scoped-only if the widenings stay entity-scoped, or tightened-only. This completes the four-tool false-positive set (request-log triage, learning-suggestion interpreter, signature accuracy/risk, and now policy-diff). Field paths validated against F5's declarative WAF policy schema; decode-only, nothing leaves the browser.",
    tools: ["f5-awaf-policy-diff"],
  },
  {
    date: "2026-07-04",
    time: "11:14",
    kind: "tool",
    title: "New: AWAF signature accuracy/risk interpreter",
    body:
      "Reframed from a per-signature-ID lookup (not feasible or honest given F5's proprietary signature set): it reads the two properties F5 publishes for every attack signature, its Accuracy and its Risk, plus whether it applies to your systems and whether it is enforced. F5 defines accuracy as false-positive susceptibility, so low accuracy means a high false-positive likelihood, medium some, high low; risk is the damage a real match would do. It places the signature in the accuracy-by-risk quadrant and gives the tuning move: low/low is the prime relax candidate, low accuracy plus high risk is false-positive-prone but dangerous so investigate first, high/high is a reliable high-stakes block you do not relax. It flags signatures for systems not in your stack as pure noise and surfaces accuracy as a lever: a signature set weighted toward higher-accuracy signatures produces fewer false positives. Tool 3 of the four false-positive follow-ons. Grounded in F5's attack-signature docs; deterministic, nothing leaves the browser.",
    tools: ["f5-awaf-signature-accuracy-risk"],
  },
  {
    date: "2026-07-04",
    time: "10:35",
    kind: "tool",
    title: "New: AWAF learning-suggestion interpreter",
    body:
      "Ties the poisoning estimator and the false-positive triage together. Characterise a Traffic Learning suggestion (its action, its learning score, the violation rating, the learning mode, and the source trust) and it says whether accepting it loosens the policy (add an allowed entity, allow a meta-character, relax an attribute, disable a violation or signature) or tightens it (remove a wildcard, enforce a staged entity, make an attribute more specific), whether a loosening is a genuine false-positive fix or a security relaxation (by rating: 1-2 fix, 3 investigate, 4-5 relaxing an attack), and whether Automatic learning is about to enforce it. It flags the poisoning vector: Automatic mode, a relaxing loosening, untrusted traffic, and a climbing learning score, which rises as the violation rating falls, so low-rated suggestions auto-accept fastest. This is tool 2 of the four false-positive follow-ons. Grounded in F5 K03513854 and the ASM learning docs; deterministic, nothing leaves the browser.",
    tools: ["f5-awaf-learning-suggestion-interpreter"],
  },
  {
    date: "2026-07-04",
    time: "09:31",
    kind: "tool",
    title: "New: AWAF request-log triage",
    body:
      "Paste an ASM request-log entry, the syslog key-value line or the CEF line you see in your SIEM, and it extracts the policy, the support ID for log correlation, the request status, the violation rating, the client IP, method, and URI, classifies each violation into a triage category, and gives F5's rating-based verdict (4-5 likely attack, 3 investigate, 1-2 likely false positive), then bridges to the false-positive triage tool for the per-violation fix. It handles both the legacy key-value format and CEF. Note on honesty: it does not decode the support-ID number, because that number is an opaque correlation reference and does not carry the violations, the log line does. This is the first of the four false-positive follow-on tools. Grounded in F5's ASM logging-field and reporting docs; decode-only, nothing leaves the browser.",
    tools: ["f5-awaf-request-log-triage"],
  },
  {
    date: "2026-07-04",
    time: "08:44",
    kind: "tool",
    title: "New: AWAF false-positive triage",
    body:
      "The flip side of the poisoning estimator: it helps you relax a genuine Advanced WAF false positive correctly, with scope, and stop before relaxing a real attack. Pick a violation category, its average violation rating, and whether it is enforced, staged, or transparent, and it returns F5's rating-based verdict: ratings 1 and 2 are likely false positives you can accept if confirmed, rating 3 must be investigated, and ratings 4 and 5 block even with Block flags off, so you clear the suggestion without relaxing. It gives the scoped remediation for that category (disable a signature on one URL or parameter, add an allowed entity, add the meta-character to that entity's set, attach an XML/JSON profile, mark a file-upload parameter, or enable Potential False Positive Detection), never a policy-wide disable, and always restates the discipline: relax only where a false positive occurred, never where a real attack caused the violation. A companion Learn article covers the workflow. Grounded in F5 K70544352 and the ASM violation-rating and learning docs; deterministic, nothing leaves the browser.",
    tools: ["f5-awaf-false-positive-triage"],
  },
  {
    date: "2026-07-04",
    time: "08:38",
    kind: "tool",
    title: "New: AS3 declaration explainer",
    body:
      "Paste the JSON you POST to /mgmt/shared/appsvcs/declare and this reads it back: whether it is a full AS3 request (class AS3, with action and persist) or an ADC-only declaration (class ADC), the schemaVersion and metadata, and the Tenant to Application to resource tree with every class named and explained, from Service_HTTP and Service_HTTPS through Pool, Monitor, TLS_Server, Certificate, WAF_Policy, and iRule. It also checks the structural rules F5 documents: a top-level AS3 or ADC class, a schemaVersion, at least one Tenant containing an Application containing a resource, and the template and service-class matching rule (http/https/tcp/udp/l4 require a matching Service_* named service), plus reserved-name and 1-to-64 alphanumeric name checks. It lights up the Automation sub-category on the F5 hub as its first tenant. A companion Learn article walks the anatomy of a declaration. A structure explainer and sanity checker, not a full schema validator; grounded in F5's AS3 docs, decode-only, nothing leaves the browser.",
    tools: ["as3-explainer-validator"],
  },
  {
    date: "2026-07-04",
    time: "07:35",
    kind: "tool",
    title: "New: AWAF automatic-learning poisoning estimator",
    body:
      "A deterministic calculator for a question every WAF instructor gets: how many requests does an attacker need to drill a hole through your BIG-IP Advanced WAF policy when the Policy Builder is left in Automatic learning against untrusted traffic? In Automatic mode a suggestion that reaches a 100% learning score is auto-accepted and enforced, and the Loosen stage can disable violations and widen entities. Enter your policy's Loosen thresholds (different sources, sessions, time spread; F5 default 10 untrusted sources) and the target manipulation's violation rating, plus the attacker's distinct source IPs and per-source rate, and it computes the minimum sources, requests, and elapsed time to force one automatic relaxation. It gates hard on the documented rules that make it impossible: Manual or Disabled learning, rating-5 unlearnable violations, and loosening restricted to trusted traffic, and it surfaces the five hardening levers. A companion Learn article, 'Automatic Learning in Production: How an Attacker Poisons a WAF Policy', explains the mechanism. Grounded in F5 K000134503 and the ASM learning manuals; nothing is fetched or sent.",
    tools: ["f5-awaf-learning-poisoning-estimator"],
  },
  {
    date: "2026-07-04",
    time: "03:43",
    kind: "content",
    title: "F5 hub: dedicated iRules category, corrected tags, standardized names",
    links: [{ label: "F5 hub", href: "/f5" }],
    body:
      "The F5 hub got a taxonomy and naming pass. iRules is now its own category with a dedicated heading, split out from LTM, so iRule tools and articles group together on their own. The BIG-IP persistence-cookie decoder, which was mis-tagged Security & WAF, now correctly reads Networking. The platform divider is standardized to 'TMOS · F5OS · Platforms', and six F5 tool names were polished for consistency: sentence case throughout, 'F5XC' rather than 'F5 XC', 'iRules' spelled consistently, and cleaner separators, aligned across the hub and the catalogue in both English and Portuguese.",
  },
  {
    date: "2026-07-04",
    time: "03:04",
    kind: "tool",
    title: "New: AWAF evasion-technique explainer",
    body:
      "The decode side of 'evasion technique detected' (VIOL_EVASION), grounded verbatim in F5's K7929 and the current BIG-IP ASM 17.5 violation chapter. Type a sub-violation name or 'evasions' and get F5's own eight sub-violations explained, Microsoft %u decoding, Apache whitespace, Bad unescape, Bare byte decoding, Directory traversals, IIS backslashes, IIS Unicode codepoints, and Multiple decoding, each with its default (all enabled) and the encoding trick it catches. Or paste the evasions block of a declarative policy to read each one back as enabled or disabled, with the Multiple-decoding pass count surfaced and bounds-checked against the schema's 2-to-5 range. It bridges to the Base64 and Percent codec tools that perform the very same decode operations, the encode/decode complement asked for, since several evasions are exactly the %u, bare-byte, and repeated percent-decoding those tools already do. A companion Learn article, 'Evasion Techniques: How Advanced WAF Normalizes Around Attacker Encoding', explains the whole class. Decode-only; nothing leaves the browser.",
    tools: ["f5-awaf-evasion-explainer"],
  },
  {
    date: "2026-07-04",
    time: "02:36",
    kind: "content",
    title: "The colophon now states the hosting ceiling, honestly",
    links: [{ label: "Colophon", href: "/colophon" }],
    body:
      "A new colophon section, echoed in one paragraph on the roadmap, spells out the hard limits this site lives under: a Cloudflare Worker version carries at most 20,000 static files on the free plan and 100,000 on the paid plan (raised five-fold in September 2025, deployable only with Wrangler 4.34 or newer), no file over 25 MiB, and static-asset requests free and unlimited. Against that, the site's own arithmetic: about three files per rendered page across sixteen languages, roughly fifty files per tool and a hundred per tool-with-article pack, a little over eighteen thousand files today, and a mapped expansion path, route-sharded Workers, then object storage, should the toolbox ever outgrow one Worker.",
  },
  {
    date: "2026-07-04",
    time: "02:14",
    kind: "feature",
    title: "Every tool now has an Example button (D-83 retrofit complete)",
    links: [{ label: "All tools", href: "/tools" }],
    body:
      "The Example and Clear buttons that newer tools shipped with are now on every tool, all 54 of them. The 31 retrofitted tools each load a sample taken verbatim from their own golden test vectors, so every example provably works: the RFC 4231 HMAC test case, the RFC 7636 PKCE verifier from appendix B, the RFC 7517 example key set, the canonical jwt.io token, the classic BIG-IP persistence cookie from K6917, real tmsh stanzas, and more. Even the two form-style tools joined in their own way: the iRule event-order tool's Example applies the HTTPS re-encrypt preset, and the tcpdump builder's fills in the all-TMM interface, name-resolution-off, and a host-and-port filter. One click shows what each tool does; one click clears it.",
  },
  {
    date: "2026-07-03",
    time: "22:39",
    kind: "feature",
    title: "Vendor sub-categories, and generic categories go vendor-agnostic",
    links: [{ label: "All tools", href: "/tools" }],
    body:
      "The taxonomy grew a level. Vendor hubs now group their tools and articles by ordered sub-categories: for F5, the ten pillars from LTM and iRules through TMOS, DNS/GTM, ASM, AFM, APM, SSL Orchestrator, automation, public cloud, and Distributed Cloud, with every tool assigned and articles inheriting their placement from the tools they relate to. Fortinet, Netskope, and Extreme Networks received source-grounded taxonomies of their own, built from each vendor's official product catalogue, twelve Fortinet sub-categories with the full A-to-Z product list assigned, ten Netskope One components, eight Extreme product families, ready for the day their first tools ship. And the generic categories on the Tools and Learn indexes are now exclusively vendor-agnostic: vendor content lives on its hub, one cross-vendor syslog article came home to networking, and the hub strip on top of each index is the way in.",
  },
  {
    date: "2026-07-03",
    time: "22:39",
    kind: "content",
    title: "Privacy page: why preferences live only on your device",
    links: [{ label: "Privacy page", href: "/privacy" }],
    body:
      "A new section on the privacy page explains what this site remembers and why. The theme choice is stored only in your browser's localStorage and applied before first paint; no cookie, no account, no server ever sees it, which is exactly why a private window, cleared site data, or another device starts you back at the default. Language is not stored at all, it lives in the URL, so a bookmarked address in your language keeps it. With no accounts and no tracking, preferences can only live where you can see and delete them.",
  },
  {
    date: "2026-07-03",
    time: "22:03",
    kind: "content",
    title: "Learn article: session variables, where APM keeps everything it learned",
    articles: ["bigip-apm-session-variables"],
    body:
      "The companion to the new reference, in English and Portuguese, and the closing of the APM cluster the SSO article opened: the naming anatomy from the manual's own figure and why the names are templates, the three official read syntaxes with the chapter's own OTP percent-expansion as proof text, the secure contract in F5's own lab wording and the silent empty read it produces on a bare mcget of a password, the plumbing pair every SSO method ultimately reads, session.custom's auto-container behavior, and the two debug surfaces, the active-sessions-only report with its message-box pause trick and sessiondump from the CLI. The SSO methods article's closing line now links the live reference.",
  },
  {
    date: "2026-07-03",
    time: "22:01",
    kind: "tool",
    tools: ["f5-apm-session-variable-reference"],
    title: "New tool: APM session-variable reference",
    body:
      "The Session Variables chapter, vendored and made pattern-aware. Paste session.ad.last.attr.memberOf and it resolves against the chapter's own dollar-name templates with the bindings shown, because each retrieved attribute becomes its own variable, the chapter's rule. Families run from policy results through the client and AAA sets to the full session.ssl.cert family, endpoint checks with the always-zero hd.state quirk flagged, OTP with the chapter's own percent-expansion example, and the logon and SSO plumbing rows the SSO methods read. Expressions parse across the three official syntaxes, percent expansion, mcget inside expr branch rules, and access::session data get and set, with the secure audit riding along in F5's own wording: encrypted in the session db, hidden from reports and logs, minus-secure required on both read paths. The one-click Example is the classic empty-value trap, a bare mcget on the logon password, and the tool names exactly what comes back: nothing.",
  },
  {
    date: "2026-07-03",
    time: "19:50",
    kind: "content",
    title: "Learn article: living TCP, frozen TCP, and the two fast paths",
    articles: ["tcp-proxy-layer-4"],
    body:
      "The companion to the new explainer, in English and Portuguese: the day the tcp family started living, told in the 13.0 announcement's own words, updated versions of the -optimized trio, progressive for the very latest features, five read-only living profiles tuned through child profiles with the custom flag pinning settings against future pushes, and the frozen legacy trio that still ships. FastL4 as the profile that is not a proxy, the PVA packet path, the loose pair for asymmetric routing, and the late-binding FIX trick. FastHTTP as the narrow case whose qualification is a checklist, every criterion a disqualifier read backwards, with K8024 as the reading you do before deploying, not after.",
  },
  {
    date: "2026-07-03",
    time: "19:48",
    kind: "tool",
    tools: ["f5-l4-profile-explainer"],
    title: "New tool: LTM L4 protocol profile explainer",
    body:
      "The protocol-profile decision, told the way F5's own sources tell it. The tcp family's living-versus-legacy split from the 13.0 announcement verbatim: f5-tcp-wan, lan, and mobile as the updated versions of the -optimized trio, f5-tcp-progressive as the general-use profile carrying the very latest features, all five living profiles continually updated and read-only, tuned through child profiles, while the frozen legacy names still ship for configurations that depend on them. FastL4 as the not-a-proxy: the PVA hardware packet path for Performance and Forwarding virtual servers, the ops guide's little-or-no-processing when-clause, the loose-initialization and loose-close pair for asymmetric routing with their man-page defaults, and the late-binding FIX offload. FastHTTP as the narrow case: TCP Express, HTTP, and OneConnect combined, with the complete when-to-use criteria list, the basic-iRule event trio, and K8024 named as required pre-deployment reading. The one-click Example opens FastL4, the card with the most decisions on it.",
  },
  {
    date: "2026-07-03",
    time: "19:31",
    kind: "feature",
    title: "Tools index hero: the thesis takes the headline",
    links: [{ label: "All tools", href: "/tools" }],
    body:
      "The tools hub's eyebrow and headline both read Tools, breaking the pattern every other index page follows: a short eyebrow, a statement headline, a supporting lede. The headline is now the site's own thesis, tools that compute, never guess, in both languages, with the eyebrow keeping the short label and the existing lede staying as the supporting line.",
  },
  {
    date: "2026-07-03",
    time: "19:09",
    kind: "content",
    title: "Learn article: APM SSO methods and the blast radius",
    articles: ["bigip-apm-sso-methods"],
    body:
      "The companion to the new explainer, in English and Portuguese: the eight methods and the asymmetry the chapter states up front, a broken non-form object can dim SSO for the whole session while the two form methods stay standing. What each method actually moves, from Basic's base64 header to NTLMv2's single-header quirk, the Kerberos prerequisite checklist with the no-keytab line and the federate-in-front-delegate-in-back pattern, the Forms - Client Initiated password token that keeps the credential out of the page, and the session-variable plumbing underneath all eight, with the variable reference named as this cluster's next tool.",
  },
  {
    date: "2026-07-03",
    time: "19:07",
    kind: "tool",
    tools: ["f5-apm-sso-explainer"],
    title: "New tool: APM SSO method explainer",
    body:
      "The eight methods the Single Sign-On Methods chapter defines, each rendered with its mechanism, its credentials plumbing, its prerequisites, and the verdict that decides outages: the chapter's own blast-radius paragraph, a misconfigured SSO object for HTTP Basic, NTLM, Kerberos, OAuth Bearer, or SAML can disable SSO for every method in that user's session, and the two form methods are the only exempt ones. The Kerberos card ships the full constrained-delegation prerequisite list, delegation account per realm, SPN-format account name, uppercase realm, multi-realm RBCD, and the line worth framing, APM Kerberos SSO does not need or use a keytab file. NTLMv2 carries its documented single-WWW-Authenticate quirk, and Forms - Client Initiated its password-token indirection, the real password never sits in the page.",
  },
  {
    date: "2026-07-03",
    time: "18:43",
    kind: "content",
    title: "Learn article: AFM contexts, accept as a ticket",
    articles: ["bigip-afm-contexts-and-rule-processing"],
    body:
      "The companion to the new explainer, in English and Portuguese: the fixed context order with the management port apart, the manual's processed-again-at-the-next-context sentence that makes accept a ticket to the next checkpoint rather than through the building, accept-decisively as the one yes that ends the walk, the bluntly worded ICMP restriction at edge contexts, staging as the honest rehearsal, the system's own redundant-and-conflicting definitions including the accept-versus-accept-decisively surprise, and the ADC-versus-Firewall default-action split with the fail-open-versus-fail-closed stakes named.",
  },
  {
    date: "2026-07-03",
    time: "18:41",
    kind: "tool",
    tools: ["f5-afm-rule-context"],
    title: "New tool: AFM rule-context & match explainer",
    body:
      "Paste contexts, policies, and a packet, and the walk runs in the manual's own order: global, route domain, then the virtual server or self IP, with management port rules processed separately. The semantics that decide real outcomes are all here: a matching rule's action applies and the traffic is processed again at the next context, so accept is a ticket to the next checkpoint and only accept-decisively ends the walk with a yes; the one-click Example is a global accept-decisively trumping a virtual-server drop that never sees the packet. ICMP rules at edge contexts are skipped with the manual's ignored note, staged policies log without enforcing, rule-lists expand in place, and criteria the tool cannot evaluate stop the walk honestly. A lone policy gets the audit the system itself defines: redundant and conflicting rules, including accept versus accept-decisively counting as conflicting.",
  },
  {
    date: "2026-07-03",
    time: "18:21",
    kind: "content",
    title: "Learn article: OneConnect, reuse as a grouping problem",
    articles: ["bigip-oneconnect-connection-reuse"],
    body:
      "The companion to the new explainer, in English and Portuguese: the source mask's two documented poles and the subnet-style grouping between them, the naming drift (Source Mask, Source Prefix Length, source-mask), and the sentence both K articles state that decides real outcomes: SNAT translates first, the mask sees only the translated address, so one SNAT address means one reuse group however narrow the mask. Plus the pool lifecycle defaults, the per-TMM division and the Current Idle statistic's real meaning from F5's own lab, and the strict limit the manual itself recommends against.",
  },
  {
    date: "2026-07-03",
    time: "18:19",
    kind: "tool",
    tools: ["f5-oneconnect-source-mask"],
    title: "New tool: OneConnect source-mask explainer",
    body:
      "Paste a one-connect profile and every option renders with the v17 man page's own semantics, defaults filled in explicitly, from the 0.0.0.0 mask that shares reused connections across all clients to the strict limit the manual itself calls not recommended. Or run the mask simulation: real client IPs, a mask, and optionally a SNAT address, which demonstrates the ordering K7208 and K5911 both state, translation first, mask second, so one SNAT address collapses every client into a single reuse group however narrow the mask. Rounded out with the statistics honesty from F5's own lab article: max-size divides per TMM, and Current Idle counts idle connections whether or not they are eligible for reuse.",
  },
  {
    date: "2026-07-03",
    time: "17:45",
    kind: "i18n",
    title: "Full i18n pass: the last hardcoded strings",
    body:
      "A three-pass audit of every page and component (line-level text, multi-line prose, and metadata) found the stragglers and moved them into the message system: the Learn hub's entire hero (section marker, title, and tagline were hardcoded English on all sixteen locales), the Read links and Read-next block on articles, the primary navigation's screen-reader label, and the changelog and roadmap meta descriptions. Portuguese ships alongside English as always; the remaining locales fall back per key. Protocol samples inside tools (dig headers, tmsh literals, example XML) stay English on purpose, because they are syntax, not copy.",
  },
  {
    date: "2026-07-03",
    time: "17:23",
    kind: "feature",
    title: "Homepage joins the page-hero standard; Tools index gets its eyebrow",
    links: [{ label: "Home", href: "/" }],
    body:
      "The landing hero now uses the same title and lede scale as every other top-level page, the one page deliberately left out of the header standardization pending an explicit call - the reading-comfort scale won. The call-to-action row inherits the spacing the old subtitle carried, with no inline overrides. And the Tools index, which had the standard title but not the small cyan section marker the Learn, Changelog, and Roadmap pages carry, now opens with one: TOOLS above the tagline, translated like its siblings.",
  },
  {
    date: "2026-07-03",
    time: "16:34",
    kind: "content",
    title: "Learn article: CMP, the cores you paid for",
    articles: ["bigip-cmp-clustered-multiprocessing"],
    body:
      "The article behind the new iRules pair, in English and Portuguese: one TMM per core, connections disaggregated across them, and demotion meaning every connection for a virtual serialized onto a single TMM. The demotion list per the CMP Compatibility page: global variables (validator catches them as of v10) with static:: as the documented cure, plus the two per-TMM traps that bite without demoting - RULE_INIT-generated keys and statistics profiles. Closes with the persistence timeline for the folklore, and the LTM-policy escape hatch for match-and-act logic that never needed Tcl.",
  },
  {
    date: "2026-07-03",
    time: "16:58",
    kind: "content",
    title: "Learn article: packet filters, the checkpoint before everything",
    articles: ["bigip-packet-filters"],
    body:
      "The rich companion to the new tool, in English and Portuguese: one global list in ascending order, first terminal match wins, continue as the only action that lets a packet touch two rules, and an empty expression matching everything. Then the part that decides real outcomes: the master switch ships disabled and off means allow-all, trusted exemptions outrank every rule and cannot be overridden, ARP and four important ICMP types walk past by default, established connections are invisible to the filter unless you enable the option F5 itself says rarely helps, and the management port never meets any of it. Closes with the chapter's own prose-versus-tables wording inversion as a careful-reading note, and the v16 security packet-filter policy name collision.",
  },
  {
    date: "2026-07-03",
    time: "16:56",
    kind: "tool",
    tools: ["f5-packet-filter-explainer"],
    title: "New tool: BIG-IP packet-filter explainer",
    body:
      "The layer that runs before almost everything else, walked with the man page's own semantics: a single global list, lowest order first (the reference's worked 500/100/300/200/201 sequence is a golden vector), unique orders enforced, evaluation stopping on accept, discard, or reject, continue as the only non-terminal action, and an empty rule expression matching ALL packets, with VLAN-scope-aware shadow detection. Add a sim: line and an honest three-state BPF-subset simulator answers which rule matches, stopping the walk rather than guessing when an expression leaves the evaluated subset. The context panel carries what the chapter says always applies: the master switch is disabled by default and off means all traffic allowed, trusted exemptions precede rules and cannot be overridden, ARP and the important ICMP types are exempt by default, established connections are not filtered by default, and the management interface is untouched by any of it.",
  },
  {
    date: "2026-07-03",
    time: "16:32",
    kind: "tool",
    tools: ["f5-irules-command-context", "f5-irules-vs-ltm-policy"],
    title: "Two new tools: the iRules CMP pair",
    body:
      "The command/context explainer reads an iRule the way the reference would: every when block with the event's own Master List one-liner, commands inventoried with direct links to their reference pages, the documented priority evaluation order, and a CMP audit sourced line by line to the CMP Compatibility page - global variables demote the virtual server to a single TMM (the validator catches them as of v10), static:: is the documented cure, RULE_INIT-generated keys are per-TMM, statistics profiles count per TMM. Its sibling classifies each block against LTM policies with three honest verdicts: policy-expressible with a migration sketch in the grammar the vendor's own examples demonstrate, verify-on-version for constructs the verified sources did not show, or iRule-required with the blockers named. Both link per-command validity pages rather than reproducing tables they have not verified.",
  },
  {
    date: "2026-07-03",
    time: "15:49",
    kind: "content",
    title: "Two Learn articles: SYN flood protection, and connection eviction policies",
    body:
      "The DoS-vector explainer's article pair, in English and Portuguese. SYN Flood Protection walks the cookie mechanics per K14779, the LTM threshold map and per-VLAN hardware mode, the AFM tcp-half-open vector's documented precedence over the LTM global SYN cookie, and the mitigation-below-detection arrangement that drops traffic with no attack log. Connection Eviction Policies covers the K15738 lineage from the adaptive reaper, the watermark semantics that change meaning with the attachment context, the strategies the manual honestly calls statistical and opportunistic, and the slow-flow monitor-first pattern. Both grounded in the F5 references fetched this session.",
  },
  {
    date: "2026-07-03",
    time: "15:36",
    kind: "tool",
    tools: ["f5-dos-vector-explainer"],
    title: "New tool: AFM DoS-vector explainer",
    body:
      "Paste security dos device-config or profile stanzas and every vector renders with F5's own one-line identity (the full 105-entry reference table, sys-db tunables included), the threshold mechanics spelled out - detection compares a 1-minute average against an absolute value or a learned 1-hour baseline, and the internal rate limit runs in hardware where the platform has it - and deterministic cross-checks: the mitigation-below-detection inversion that drops traffic with no attack log, automatic-mode semantics, policing with detection disabled, bad-actor wiring, and the tcp-half-open SYN-cookie interplay. Defensive configuration only; the tool never generates traffic.",
  },
  {
    date: "2026-07-03",
    time: "14:47",
    kind: "feature",
    title: "Three small touches: the stamp, the roadmap pointer, and a heart",
    links: [{ label: "Roadmap", href: "/roadmap" }],
    body:
      "The build stamp in the footer's machine row now links here, to the changelog, since that is the natural question a build stamp raises. This page opens with a one-line pointer to the roadmap, separating what is planned from what has shipped. And the special-thanks line on the colophon now ends with a small monochromatic heart, as it always should have.",
  },
  {
    date: "2026-07-03",
    time: "14:47",
    kind: "content",
    title: "Certification record corrected against the certificate itself",
    links: [{ label: "Certifications", href: "/certifications" }],
    body:
      "The Extreme Networks switching credential listed as Certified Administrator (2026) is, per the certificate document now hosted alongside it, the Extreme Certified Associate, issued August 2023 with no expiry. The entry was corrected to match the document and the certificate PDF is served with it.",
  },
  {
    date: "2026-07-03",
    time: "13:36",
    kind: "feature",
    title: "Calmer page headers across the site",
    body:
      "Every top-level page now opens with the same header format the Learn page pioneered: titles cap at a comfortable 2.75rem instead of the 3 to 4.5rem the section pages used to run, and the intro line reads at body-text scale. One shared style now carries the look, replacing three copies of an inline override and eight page-specific variants. The homepage landing hero keeps its own scale on purpose.",
  },
  {
    date: "2026-07-03",
    time: "12:57",
    kind: "content",
    title: "Two new Learn articles: the GSLB chain and the topology sort",
    body:
      "BIG-IP DNS Load Balancing: the Wide IP, the Pool, and the Three-Step Chain covers both decision tiers and the chain rules people trip over: the alternate can only be static, the fallback ignores availability on purpose, and None cascades all the way to a BIND aggregate. GTM Topology Records: Longest Match Is a Sort, Not the Pick walks the record anatomy, the verified sorting ladder, and the scoring model with shadowing, including the worked example the scorer loads as its one-click demo. Both in English and Portuguese, grounded in the tmsh references, the Load Balancing manual, and K10721.",
  },
  {
    date: "2026-07-03",
    time: "12:54",
    kind: "tool",
    tools: ["f5-gslb-decision-flow"],
    title: "New tool: GSLB decision-flow explainer",
    body:
      "Paste gtm wideip and gtm pool stanzas and the two-tier BIG-IP DNS decision renders as it really runs: pool selection at the wide IP, then each pool's preferred, alternate and fallback chain in F5's own terms, with the grammar validated per tier, the fallback-ignores-availability rule stated on every resolved chain, and the manual's cross-checks applied, from Fallback IP wiring to the topology-at-both-tiers warning. A method name explains one method; the word methods lists both catalogues.",
  },
  {
    date: "2026-07-03",
    time: "12:54",
    kind: "tool",
    tools: ["f5-topology-longest-match"],
    title: "New tool: GTM topology longest-match scorer",
    body:
      "Longest Match is a sort, not the pick, and this tool computes it the way BIG-IP DNS does: the records sort by source statement, destination statement and weight, then the scoring walk assigns each candidate its score from the first matching record, shadowing the rest. Paste topology records and a source line to see the sorted list with per-record rationale, which record scored which candidate, and why a heavy wildcard really can beat a light /32.",
  },
  {
    date: "2026-07-03",
    time: "12:35",
    kind: "infra",
    tools: ["f5xc-service-policy-explainer", "f5-bigip-license-explainer", "f5-awaf-declarative-policy-explainer"],
    title: "Paste boxes now wrap long lines",
    body:
      "The input boxes on the F5XC service-policy explainer, the BIG-IP license explainer, and the Advanced WAF policy explainer were using the terminal-output text style, which never wraps: a long pasted line ran off the right edge behind a scrollbar. They now use the same wrapping paste-box style as every other tool. The dig and nslookup explainers keep the non-wrapping style on purpose, since aligned terminal output is the point there.",
  },
  {
    date: "2026-07-03",
    time: "12:09",
    kind: "infra",
    title: "robots.txt now exists",
    body:
      "The footer's machine-readable row has linked robots.txt since the row shipped, but the file itself was never created, so the URL answered 404. It now serves a plain allow-all policy and points crawlers at llms.txt, the full machine-readable index.",
  },
  {
    date: "2026-07-03",
    time: "11:43",
    kind: "tool",
    tools: ["f5-lb-method-chooser"],
    title: "New tool: LB-method chooser",
    body:
      "Paste an ltm pool and get its load-balancing method explained in F5's own terms, with cross-checks against the rest of the pool: ratio weights the mode ignores, missing connection limits that weighted modes require, slow-ramp pairing, priority-group activation, and the ignore-persisted-weight scope. Covers all 19 documented modes, takes a bare method name or the word methods for the full catalogue, and answers two questions with a sourced recommendation. Grounded in the tmsh ltm pool reference, K42275060, and K6406. Runs entirely in the browser.",
  },
  {
    date: "2026-07-03",
    time: "11:43",
    kind: "content",
    title: "Two new Learn articles: load-balancing methods and virtual server types",
    body:
      "BIG-IP Load-Balancing Methods, and What Each One Weighs walks the 19 modes along the two axes that organize them, static or dynamic and member or node, including the ratio rule from K6406 that explains half the field surprises. BIG-IP Virtual Server Types, and What Each One Actually Does covers Standard through Reject and the specialists, from the full-proxy handshake to the FastL4 packet path, grounded in K93100324 and K8082. Both in English and Portuguese.",
  },
  {
    date: "2026-07-03",
    time: "10:35",
    kind: "content",
    title: "On building new tools, easier to read",
    links: [{ label: "Contributing a tool", href: "/contribute/tools" }],
    body:
      "The funding story on the contribute page is the same text, now set for comfortable reading: a short intro, the three seats as a compact list, the infrastructure line, and the monthly total on its own line so the number is easy to find. Not a word changed in English or Portuguese, only the presentation.",
  },
  {
    date: "2026-07-03",
    time: "10:33",
    kind: "feature",
    title: "Clearer API error messages",
    links: [{ label: "API reference", href: "/api" }],
    body:
      "When a tools API call fails validation, the error now tells you something useful. Deliberate validation messages from the tool engines pass through unchanged, while internal runtime errors, like a missing field in a JSON body, map to a stable hint that points at the request schema in openapi.json instead of leaking implementation details.",
  },
  {
    date: "2026-07-03",
    time: "10:31",
    kind: "infra",
    title: "Permanent redirects for locale-less URLs",
    body:
      "Bare URLs without a language prefix, like /f5 or /colophon, now answer with a permanent 301 to their English page instead of a temporary 302. The site ships English as its default and performs no header-based language negotiation, so the target never varies and search engines can safely consolidate on the localized address. Deep links keep working exactly as before.",
  },
  {
    date: "2026-07-03",
    time: "09:19",
    kind: "content",
    title: "Funding transparency, updated",
    links: [{ label: "Colophon", href: "/colophon" }],
    body:
      "The On building new tools section on the contribute page now tells the whole story: the three CONCORD seats (ANVIL on Claude, SCOUT on ChatGPT Plus, PRISM on Google AI Pro), the Cloudflare Workers plan, and the yearly domain fees, roughly USD 150 to 250 a month all in, with a link to the colophon for how the seats work. Buy Me a Coffee contributions go to that toolchain and nothing else.",
  },
  {
    date: "2026-07-03",
    time: "09:00",
    kind: "feature",
    title: "F5 hub, easy to find",
    links: [{ label: "F5 hub", href: "/f5" }],
    body:
      "Hub discoverability now lives on top of the Tools and Learn listings: a small pill on each page links straight to the F5 hub, keeping the header a simple four-item bar. The pills are generated from the same populated-vendor rule as the hub itself, so Fortinet, Netskope, and Extreme Networks will appear there automatically the day their first tools ship.",
  },
  {
    date: "2026-07-03",
    time: "08:43",
    kind: "feature",
    title: "Vendor hub pages",
    links: [{ label: "F5 hub", href: "/f5" }],
    body:
      "ronutz.com/f5 is live: one page gathering every F5 tool, grouped by family, followed by every F5 article. The bare /f5 address permanently redirects to the English hub, and /tools/f5 and /learn/f5 land on the hub's anchored sections in every language. Fortinet, Netskope, and Extreme Networks hubs materialize automatically when their first tools ship; until then their addresses redirect to the tools index. A new build guard keeps the vendor namespace safe: no tool, article, or page may ever take a vendor name as its address.",
  },
  {
    date: "2026-07-03",
    time: "07:48",
    kind: "feature",
    title: "Five F5 tools renamed with permanent redirects",
    tools: ["f5-bigip-persistence-cookie", "f5-bigip-tcpdump-builder", "f5-irules-event-order", "f5-tmsh-config-explainer", "f5-persistence-method-explainer"],
    body:
      "The BIG-IP persistence cookie decoder, tcpdump builder, iRules event order, tmsh config explainer, and persistence method explainer now carry the f5- vendor prefix in their URLs, matching the rest of the F5 family. Every old address answers with a permanent redirect: page and .md URLs via static 301 rules in all sixteen languages, and old API slugs via a 308 from the worker so request method and body are preserved. The old names also remain as OMNIBOX aliases, so pasting or typing them still lands on the right tool.",
  },
  {
    date: "2026-07-03",
    time: "06:59",
    kind: "tool",
    title: "New tool: F5 BIG-IP license explainer",
    tools: ["f5-bigip-license-explainer"],
    body:
      "Paste your /config/bigip.license, the full file or any fragment, and read it in plain language: whether it is BIG-IQ managed or licensed directly, the licensing dates with the K7727 upgrade verdict, the Registration Key and platform, active and optional modules with their per-module keys, Exclusive_version, Deny_version and Exclusive_Platform constraints, and every feature token. Key and signature values are never displayed, and nothing leaves the browser. The line grammar is grounded in two real, sanitized lab license files (one BIG-IQ managed, one direct) and in F5 K000160443, K7727, K3782, K7752, K42091606 and K02011230, verified against 5 golden vectors.",
  },
  {
    date: "2026-07-03",
    time: "05:57",
    kind: "tool",
    title: "F5 service check date now reads pasted licenses and tmsh output",
    tools: ["f5-service-check-date"],
    body:
      "Paste your /config/bigip.license contents, any fragment of it, or the output of tmsh show sys license, and the tool picks out the service check date and answers the same upgrade-eligibility question, echoing the matched line for confirmation. Both published line forms are recognized: the file form (Service check date : 20151008, with flexible colon spacing) and the tmsh form (Service Check Date 2016/08/18). Quick manual entry is unchanged and remains the primary path. Grounded in F5 K3782 and K000160443 plus F5's published upgrade checklist, verified against 6 new golden vectors (20 total).",
  },
  {
    date: "2026-07-03",
    time: "04:50",
    kind: "feature",
    title: "Sticky vendor filter, back-to-top, and a tidier footer",
    links: [{ label: "All tools", href: "/tools" }],
    body:
      "Browsing the long lists is easier: the vendor filter on the tools and Learn indexes now stays pinned below the header while you scroll, and a small corner button returns you to the top once you are more than a screen down. The footer is consolidated too: its utility links now sit in three compact rows with dimmed separators, and the machine-readable row (llms.txt, robots.txt, feed.xml) now sits at the very end just above the build stamp, in smaller monospace, so the three read as the quiet file endpoints they are.",
  },
  {
    date: "2026-07-02",
    time: "16:45",
    kind: "tool",
    title: "New tool: F5 Advanced WAF declarative-policy explainer",
    tools: ["f5-awaf-declarative-policy-explainer"],
    body:
      "Paste a BIG-IP Advanced WAF (ASM) declarative policy (JSON) and get a section-by-section, plain-language reading grounded in F5's published schema, with security callouts that read the values: transparent enforcement means monitor-only, plus signature staging, X-Forwarded-For trust, Data Guard off, and cookies missing Secure or HttpOnly. Covers about 55 policy sections and honors the template-delta rule (an absent section means template default, not disabled). Decode-only, grounded in the F5 v17.1 declarative-policy schema (published versions v16.0 to v17.5), verified against 6 golden vectors built from F5's own example policies, with four Learn articles in English and Portuguese.",
  },
  {
    date: "2026-07-02",
    time: "11:14",
    kind: "tool",
    title: "New tool: F5 service check date",
    tools: ["f5-service-check-date"],
    body:
      "Enter a BIG-IP version for the minimum service check date its license must carry, or enter a service check date for the newest version you can upgrade to and the newer branches you cannot reach yet. It encodes F5's published License Check Date table (K7727) and does the comparison entirely in the browser, with no clock and no network. Grounded in F5 K7727 and K8986, verified against 14 golden vectors, with three Learn articles in English and Portuguese.",
  },
  {
    date: "2026-07-01",
    time: "16:05",
    kind: "tool",
    title: "New tool: SSRF URL classifier",
    tools: ["ssrf-url-classifier"],
    body:
      "Paste a URL and see where it actually points: loopback, private (RFC 1918), link-local, cloud metadata (169.254.169.254 and the IPv6 and vendor equivalents), CGNAT, reserved, or public, with an SSRF risk level and plain-language reasons. It decodes the IP-obfuscation tricks that hide an internal address from a naive filter (decimal, octal, hex, short-form, and IPv4-mapped IPv6) and flags dangerous non-HTTP schemes and embedded credentials. It classifies purely from the string and never resolves DNS or issues the request (D-53). Grounded in RFC 1918/3927/6598/3986 and the OWASP SSRF cheat sheet, verified against 26 golden vectors, with six Learn articles in English and Portuguese.",
  },
  {
    date: "2026-07-01",
    time: "16:00",
    kind: "feature",
    title: "Public roadmap page",
    links: [{ label: "Roadmap", href: "/roadmap" }],
    body:
      "A public roadmap at /roadmap, generated from the live build catalogue so it is always current: every planned tool grouped by family, plus a running count of what has already shipped. Linked from the footer and the Share-an-idea page so proposals can check what is already planned and avoid duplicates.",
  },
  {
    date: "2026-07-01",
    time: "15:57",
    kind: "feature",
    title: "Footer shows a last-modified timestamp",
    body:
      "The footer now shows a Last modified date and time, in UTC, written on every build so the site's currency is always visible at a glance.",
  },
  {
    date: "2026-07-01",
    time: "15:40",
    kind: "feature",
    title: "Navigation and credibility restructure",
    links: [{ label: "About", href: "/about" }],
    body:
      "The main navigation now leads with what you use (Tools and Learn) alongside About, Training, and Contact. Certifications and Endorsements moved out of the top bar and now lead the About page as featured cards, and the Training page opens with the instructor and links to those credentials, so the professional showcase is cleanly separate from the tools.",
  },
  {
    date: "2026-07-01",
    time: "14:00",
    kind: "tool",
    title: "New tool: hash preimage finder",
    tools: ["hash-preimage-finder"],
    body:
      "Paste an MD5, SHA-1, or SHA-256 hash, choose an alphabet and length, and watch a bounded local brute-force search either recover a weak input in milliseconds or run out of keyspace on anything with real entropy. No dictionary, no wordlist, no precomputed table: pure local enumeration and hashing, capped so it only ever recovers trivially weak inputs. A teaching tool for why fast, unsalted hashes fail, pairing every result with the defenses (salting, slow KDFs, and algorithm choice). MD5, SHA-1, and SHA-256 are verified against published test vectors, and it runs only in the browser.",
  },
  {
    date: "2026-07-01",
    time: "13:30",
    kind: "feature",
    title: "Every tool now has an HTTP API endpoint",
    links: [{ label: "API reference", href: "/api" }],
    body:
      "Every deterministic tool is now reachable over a simple HTTP API at /api/v1/&lt;tool&gt;, driven by a single registry so the API and its published OpenAPI specification stay in lockstep with the toolbox as tools are added. Capabilities that would be abused as an unbounded search on shared infrastructure are explicitly excluded and remain browser-only. The API reference page lists what is available.",
  },
  {
    date: "2026-07-01",
    time: "12:00",
    kind: "tool",
    title: "New tool: HTTP request translator",
    tools: ["http-request-translator"],
    body:
      "Paste a curl command and get it both explained (method, URL, every header, the body with its real Content-Type, auth, cookies, and each flag) and translated to fetch, a raw HTTP/1.1 request, HTTPie, and Python requests. A single local parse drives both views. It gets curl's -d Content-Type default right (form-encoded, not JSON) and warns on --insecure, plaintext http, and credentials in the URL. Local and offline.",
  },
  {
    date: "2026-07-01",
    time: "11:30",
    kind: "tool",
    title: "New tool: CVSS vector decoder",
    tools: ["cvss-vector-decoder"],
    body:
      "Paste a CVSS v3.1 vector and get the Base score computed and mapped to None through Critical, with Temporal and Environmental scores when those metrics are present and every metric spelled out. Pure scoring math implemented from the FIRST.org specification and validated against officially published reference scores. Local and offline.",
  },
  {
    date: "2026-07-01",
    time: "11:00",
    kind: "tool",
    title: "New tool: F5XC service policy explainer",
    tools: ["f5xc-service-policy-explainer"],
    body:
      "Decode an F5 Distributed Cloud service policy and get its rules explained in evaluation order: the match criteria, the action, and the first-match logic that determines allow or deny. Decode-only and offline.",
  },
  {
    date: "2026-07-01",
    time: "10:30",
    kind: "tool",
    title: "New tool: nslookup output explainer",
    tools: ["nslookup-output-explainer"],
    body:
      "Paste nslookup output and get it explained: the server and port queried, whether the answer is authoritative, each record returned, and the common warnings. A companion to the dig output explainer. Local and offline.",
  },
  {
    date: "2026-07-01",
    time: "10:00",
    kind: "tool",
    title: "New tool: XML decoder",
    tools: ["xml-decoder"],
    body:
      "Paste XML and get a structural tree view plus a security analysis: entities are surfaced and the parser is XXE-safe, flagging external-entity and billion-laughs patterns without ever resolving them. Decode-only and offline.",
  },
  {
    date: "2026-06-30",
    time: "05:30",
    kind: "tool",
    title: "New tool: dig output explainer",
    tools: ["dig-output-explainer"],
    body:
      "Paste dig output and get every section explained: the header and flags, the question, and each answer, authority, and additional record, along with the query timing. Local and offline.",
  },
  {
    date: "2026-06-30",
    time: "05:20",
    kind: "tool",
    title: "New tool: text diff",
    tools: ["diff"],
    body:
      "Compare two blocks of text and get a line-by-line diff with additions, removals, and unchanged context. Runs entirely in the browser; nothing is uploaded.",
  },
  {
    date: "2026-06-30",
    time: "05:10",
    kind: "tool",
    title: "New tool: TOTP / HOTP",
    tools: ["totp-hotp"],
    body:
      "Generate and verify TOTP and HOTP one-time codes (RFC 6238 and RFC 4226) from a shared secret, with the time step, counter, and digit count shown. Golden-vector tested; local and offline.",
  },
  {
    date: "2026-06-30",
    time: "05:00",
    kind: "tool",
    title: "New tool: BIG-IP tcpdump builder",
    tools: ["f5-bigip-tcpdump-builder"],
    body:
      "Build a correct F5 BIG-IP tcpdump command from a plain description: the right interface syntax (including the :nnn peer-flow form), host and port filters, and capture options, with each part explained. Local and offline.",
  },
  // ---- 2026-06-30 : static pages reach full locale parity -------------------
  {
    date: "2026-06-30",
    kind: "i18n",
    title: "Remaining static pages fully localized",
    body:
      "The Share-an-idea feedback page, plus the last English-fallback paragraphs on the colophon, API, and license pages, are now translated across all sixteen languages, bringing every non-article static page to full locale parity. The feedback page now explicitly invites bugs, mistakes, and inaccuracies.",
  },
  // ---- 2026-06-30 : syslog pri decomposition diagram -----------------------
  {
    date: "2026-06-30",
    kind: "content",
    title: "Decomposition diagram added to the syslog PRI decoder",
    tools: ["syslog-pri-decoder"],
    body:
      "The syslog PRI decoder now shows how a single PRI integer splits into its two fields - dividing by 8 gives the facility and the remainder gives the severity - with the worked example of PRI 134.",
  },
  // ---- 2026-06-30 : hmac construction diagram ------------------------------
  {
    date: "2026-06-30",
    kind: "content",
    title: "Construction diagram added to the HMAC generator",
    tools: ["hmac"],
    body:
      "The HMAC generator now shows the two-pass construction - the key XORed with an inner pad around the message and hashed, then XORed with an outer pad around that result and hashed again - the structure that makes HMAC resistant to length-extension.",
  },
  // ---- 2026-06-30 : jwks key-matching diagram ------------------------------
  {
    date: "2026-06-30",
    kind: "content",
    title: "Key-matching diagram added to the JWKS explainer",
    tools: ["jwks-explainer"],
    body:
      "The JWKS explainer now shows how a verifier selects a key - a JWT header's kid is matched against the keys in the set, picking the one with the same kid to check the signature.",
  },
  // ---- 2026-06-30 : jwt anatomy diagram ------------------------------------
  {
    date: "2026-06-30",
    kind: "content",
    title: "Anatomy diagram added to the JWT decoder",
    tools: ["jwt"],
    body:
      "The JWT decoder now shows the token's three base64url segments - header, payload, and signature - colour-coded and joined by dots, with the header and payload bracketed as the signing input that the signature is computed over.",
  },
  // ---- 2026-06-30 : saml flow diagram --------------------------------------
  {
    date: "2026-06-30",
    kind: "content",
    title: "Flow diagram added to the SAML decoder",
    tools: ["saml-decoder"],
    body:
      "The SAML decoder now shows the SP-initiated web-browser SSO round trip - the AuthnRequest, the redirect to the identity provider, authentication, the signed assertion, and the POST back to the service provider - so a decoded message can be placed in the wider flow.",
  },
  // ---- 2026-06-30 : oidc fully localized -----------------------------------
  {
    date: "2026-06-30",
    time: "05:50",
    kind: "i18n",
    title: "OIDC tool now fully localized in all 16 locales",
    tools: ["oidc"],
    body:
      "The OIDC decoder's entire interface - input labels, badges, panels, claim categories and field labels, the assessment reasons, and the authorization-code flow diagram - is now translated across all 16 locales.",
  },
  // ---- 2026-06-30 : oidc flow diagram --------------------------------------
  {
    date: "2026-06-30",
    time: "04:35",
    kind: "content",
    title: "oidc: authorization-code flow diagram",
    tools: ["oidc"],
    body:
      "The OIDC tool now shows a theme-aware diagram of the OpenID Connect authorization-code flow, from the authorization request through token exchange, ID token validation against the JWKS, and the optional UserInfo call. Each step names the same discovery-document endpoint the decoder reports.",
  },
  // ---- 2026-06-30 : cipher PQ groups localized -----------------------------
  {
    date: "2026-06-30",
    time: "04:20",
    kind: "i18n",
    title: "cipher key-exchange groups panel now in all 16 locales",
    tools: ["cipher"],
    body:
      "The post-quantum key-exchange groups reference is now translated across all 16 locales, so its labels and explanations read natively instead of falling back to English.",
  },
  // ---- 2026-06-30 : cipher PQ key-exchange groups --------------------------
  {
    date: "2026-06-30",
    time: "04:05",
    kind: "feature",
    title: "cipher: post-quantum key-exchange groups reference",
    tools: ["cipher"],
    body:
      "The cipher tool now includes a reference for the TLS supported_groups - the key-agreement groups negotiated separately from the cipher suite - with the post-quantum ML-KEM hybrids featured. X25519MLKEM768 (0x11EC), SecP256r1MLKEM768, and SecP384r1MLKEM1024 are shown alongside the classical ECDHE and finite-field groups, each flagged by type, post-quantum status, and recommended/obsolete state. Backed by a golden-vector-tested name and code-point decoder.",
  },
  // ---- 2026-06-30 : x509 SCT panel localized -------------------------------
  {
    date: "2026-06-30",
    time: "03:40",
    kind: "i18n",
    title: "x509 Certificate Transparency panel now in all 16 locales",
    tools: ["x509"],
    body:
      "The SCT panel's labels and explanatory text are now translated across all 16 locales, so embedded Certificate Transparency timestamps read natively instead of falling back to English.",
  },
  // ---- 2026-06-30 : x509 SCT decode ----------------------------------------
  {
    date: "2026-06-30",
    time: "03:20",
    kind: "feature",
    title: "x509: decode embedded Certificate Transparency SCTs",
    tools: ["x509"],
    body:
      "The X.509 decoder now decodes the signedCertificateTimestampList extension (RFC 6962) instead of just naming it: each embedded SCT's version, log ID, logged-at timestamp, and signature algorithm are shown. Structural decode only - the SCT signatures are not verified, which would need the CT log's public key. Golden-vector tested against hand-built SCT lists and validated end-to-end against a certificate carrying the extension.",
  },
  // ---- 2026-06-30 : CSR decoder UI localized (16 locales) ------------------
  {
    date: "2026-06-30",
    time: "02:30",
    kind: "i18n",
    title: "CSR decoder UI now in all 16 locales",
    tools: ["csr-decoder"],
    body:
      "The CSR decoder's interface (input labels, result cards, the requested-extension and attribute labels, and the error messages) is now translated across all 16 locales (40 strings each), so the tool reads natively instead of falling back to English.",
  },
  // ---- 2026-06-30 : CSR decoder launch -------------------------------------
  {
    date: "2026-06-30",
    time: "02:10",
    kind: "tool",
    title: "New tool: CSR decoder",
    tools: ["csr-decoder"],
    body:
      "Decode a PKCS#10 certificate signing request (RFC 2986) entirely in the browser: subject, public key, requested SANs and extensions, the legacy challenge-password and unstructured-name attributes, and the self-signature. A CSR is a request, not a certificate, so there are no validity dates, serial, or issuer to read. Deterministic, golden-vector tested against OpenSSL-generated RSA, EC and Ed25519 requests, and never uploaded.",
  },
  // ---- 2026-06-30 : planner UI localized (16 locales) ----------------------
  {
    date: "2026-06-30",
    time: "01:30",
    kind: "i18n",
    title: "Certificate renewal planner UI now in all 16 locales",
    tools: ["cert-renewal-planner"],
    body:
      "The planner's interface (input labels, result cards, the SC-081v3 schedule table, the projection, and the guidance notes) is now translated across all 16 locales (44 strings each), so the tool reads natively instead of falling back to English.",
  },
  // ---- 2026-06-30 : planner articles in pt-BR ------------------------------
  {
    date: "2026-06-30",
    time: "00:58",
    kind: "i18n",
    title: "Planner Learn articles now in Brazilian Portuguese",
    tools: ["cert-renewal-planner"],
    body:
      "The five certificate renewal planner articles (the 47-day schedule, validity windows, DCV/SII reuse, renewing with ACME and ARI, and public vs private PKI) are now translated to Brazilian Portuguese, bringing pt-BR to parity with English for this set.",
  },
  // ---- 2026-06-30 : planner Learn articles ---------------------------------
  {
    date: "2026-06-30",
    time: "00:40",
    kind: "content",
    title: "Learn: five articles on certificate lifetimes and renewal",
    tools: ["cert-renewal-planner"],
    body:
      "Five new Learn articles back the certificate renewal planner: the CA/Browser Forum path to 47-day certificates, how validity windows and renewal lead time work, the shrinking DCV and SII validation-reuse periods, renewing on time with ACME and ARI, and why the rules bind public TLS but not private PKI. English first; other locales follow.",
  },
  // ---- 2026-06-29 : certificate renewal planner ----------------------------
  {
    date: "2026-06-29",
    time: "16:55",
    kind: "tool",
    title: "New tool: certificate renewal planner",
    tools: ["cert-renewal-planner"],
    body:
      "The first of a certificate-lifecycle set. Enter a TLS certificate's issue and expiry dates to see its validity length, whether that length fits the CA/Browser Forum SC-081v3 schedule (the 398 -> 200 -> 100 -> 47-day reduction running to 2029), the renewal cadence it implies and how that escalates at every future cap, the domain and identity validation-reuse windows for its issuance era, and a recommended renew-by date. All offline, in your browser; publicly trusted TLS certificates only.",
  },
  // ---- 2026-06-29 : SSL profile data-path diagram --------------------------
  {
    date: "2026-06-29",
    time: "15:18",
    kind: "feature",
    title: "SSL profile explainer now shows the data path",
    body: "Decoding a client-ssl or server-ssl profile now draws the BIG-IP SSL data path (client, BIG-IP, pool member) and lights up the TLS leg the profile actually governs: a client-ssl profile on the client-side leg it terminates, a server-ssl profile on the server-side leg it initiates, with the profile named on that leg. The note spells out the offload-versus-re-encrypt consequence. This closes the Tier 1 SVG retrofits. Vector, theme-aware, parsed entirely in the browser.",
    tools: ["f5-ssl-profile-explainer"],
  },

  // ---- 2026-06-29 : ipv6 address-structure strip ---------------------------
  {
    date: "2026-06-29",
    time: "15:02",
    kind: "feature",
    title: "IPv6 tool now shows the address structure",
    body: "Decoding an IPv6 address now draws its 128 bits as eight hextet cells over a 0-128 bit ruler, with the prefix boundary drawn at the actual /N, shading the network prefix apart from the host portion and naming the 64-bit interface identifier when the split lands on /64. With no prefix supplied, a dashed line marks the conventional /64 boundary instead. The fourth of the Tier 1/2 SVG retrofits, and the right shape for 128 bits where a per-bit grid would not fit. Vector, theme-aware, all in the browser.",
    tools: ["ipv6"],
  },

  // ---- 2026-06-29 : cidr address-range strip -------------------------------
  {
    date: "2026-06-29",
    time: "14:40",
    kind: "feature",
    title: "CIDR analyzer now shows the address layout",
    body: "Alongside the binary bit-grid, a subnet now gets an address-layout strip: the network address and the broadcast address as reserved cells at each end, with the usable-host span shaded between them and the first/last host range named. A /31 or /32 collapses to a single all-usable bar, since RFC 3021 reserves neither network nor broadcast there. The third of the Tier 1/2 SVG retrofits. Vector, theme-aware, computed entirely in the browser.",
    tools: ["cidr"],
  },

  // ---- 2026-06-29 : x509 chain-of-trust diagram ----------------------------
  {
    date: "2026-06-29",
    time: "14:18",
    kind: "feature",
    title: "x509 tool now shows the chain of trust",
    body: "Decoding a certificate now draws a small chain-of-trust diagram (root CA, intermediate CA, end-entity) and highlights where the pasted certificate sits: a self-signed certificate lights up the root, a CA certificate the intermediate, and an ordinary certificate the leaf, with its subject and issuer named and the self-signed case called out. The second of the Tier 1/2 SVG retrofits. Vector and theme-aware; the certificate never leaves the browser.",
    tools: ["x509"],
  },

  // ---- 2026-06-29 : PKCE flow diagram --------------------------------------
  {
    date: "2026-06-29",
    time: "13:45",
    kind: "feature",
    title: "PKCE tool now shows the flow as a diagram",
    body: "The PKCE generator gains an inline sequence diagram of the S256 authorization-code flow (generate a code_verifier, derive the code_challenge, carry it on the /authorize request, get an authorization code, send the verifier on the /token request, and have the server re-derive and compare before issuing tokens), colour-coded by who acts (app vs authorization server). It is the first of the Tier 1/2 SVG retrofits across existing tools. Vector and theme-aware; nothing about the tool leaves the browser.",
    tools: ["pkce"],
  },

  // ---- 2026-06-29 : iRule event order --------------------------------------
  {
    date: "2026-06-29",
    time: "12:16",
    kind: "tool",
    title: "iRule event order is live",
    body: "Toggle the profile stack on a BIG-IP virtual server (client-SSL, HTTP, server-SSL, pool, or FastL4) and see the order the common iRule events fire, from CLIENT_ACCEPTED through CLIENT_CLOSED, as a color-coded timeline (the toolbox's first inline diagram) and an ordered list, with the conditional events (TCP/HTTP collect, LB failure, 100 Continue) called out and where each one slots in. The sequence is pinned to F5 Clouddocs and the DevCentral event-order capture. Five Learn articles ship alongside it. It is a model of documented behaviour that runs entirely in the browser and never contacts a device.",
    tools: ["f5-irules-event-order"],
  },

  // ---- 2026-06-29 : Unix time converter ------------------------------------
  {
    date: "2026-06-29",
    time: "11:28",
    kind: "tool",
    title: "Unix time converter is live",
    body: "Paste a Unix timestamp, whose unit (seconds, milliseconds, microseconds, or nanoseconds) is read from its magnitude and stated back to you, or an ISO-8601 date, and get the instant in every common form: the UTC calendar breakdown with weekday and day-of-year, ISO 8601, RFC 3339, the HTTP date, and the timestamp in all four units. Negative timestamps and the Year 2038 boundary are flagged. Five Learn articles ship alongside it. The conversion is pure date math that runs entirely in the browser; a Now button and a relative-to-your-clock line are the only parts that read the wall clock.",
    tools: ["epoch"],
  },

  // ---- 2026-06-29 : F5 SSL profile explainer -------------------------------
  {
    date: "2026-06-29",
    time: "10:32",
    kind: "tool",
    title: "F5 SSL profile explainer is live",
    body: "Paste a tmsh client-ssl or server-ssl profile and get its role, the TLS protocol matrix derived from the options field (which version each no- flag permits or blocks), and a 🟢/🟡/🟠/🔴 security read covering chain building, renegotiation, SNI, OCSP stapling, and mutual-TLS validation, with each setting explained. Five Learn articles ship alongside it. Parsing runs entirely in the browser; it never contacts a device.",
    tools: ["f5-ssl-profile-explainer"],
  },

  // ---- 2026-06-29 : Licensing copy + F5 iControl roadmap ------------------
  {
    date: "2026-06-29",
    time: "08:42",
    kind: "content",
    title: "Licensing and colophon copy updated across all locales",
    links: [{ label: "License", href: "/license" }, { label: "Colophon", href: "/colophon" }],
    body: "The license, colophon, and API copy were reworded in every live language to match how things work now: each tool is self-contained and runs entirely in the browser, with no upstream engine imported at runtime. The determinism and privacy guarantees are unchanged.",
  },
  {
    date: "2026-06-29",
    time: "08:44",
    kind: "feature",
    title: "Two F5 iControl REST tools on the roadmap",
    links: [{ label: "Roadmap", href: "/roadmap" }],
    body: "Queued an iControl REST path explainer that decodes /mgmt/tm/... URLs, the tilde-encoded ~partition~ paths, and the query options and shows the matching tmsh path, and an iControl REST stats decoder that flattens F5's deeply nested stats JSON into readable key-values. Both are offline and never contact a device.",
  },

  // ---- 2026-06-29 : CIDR self-contained + Expect roadmap -------------------
  {
    date: "2026-06-29",
    time: "08:22",
    kind: "infra",
    title: "CIDR is now self-contained",
    tools: ["cidr"],
    body: "The CIDR tool was the last piece still calling an external compute package; its single-subnet analysis (cidrAnalyze) has been brought in-house, with output verified byte-for-byte against what it replaced. The site no longer depends on any external engine at runtime.",
  },
  {
    date: "2026-06-29",
    time: "08:24",
    kind: "feature",
    title: "Two Expect (Tcl) tools on the roadmap",
    links: [{ label: "Roadmap", href: "/roadmap" }],
    body: "Queued an Expect script explainer that breaks down spawn, expect, send, and timeout blocks and flags pitfalls like hardcoded credentials and a missing timeout, and an Expect pattern tester for the glob, -re, and -ex match modes. Both are static and offline; neither runs a script.",
  },

  // ---- 2026-06-29 : Regex toolkit ------------------------------------------
  {
    date: "2026-06-29",
    time: "08:05",
    kind: "tool",
    title: "New tool: Regex Toolkit",
    body: "Compile, test, and explain JavaScript regular expressions in one place: live matches with positional and named capture groups highlighted, a plain-language token breakdown of what the pattern does, and a static check that warns before a catastrophic-backtracking (ReDoS) pattern runs against your text, so that a single keystroke cannot freeze the page. Ships with three Learn articles. Everything runs in the browser.",
    tools: ["regex"],
  },

  // ---- 2026-06-29 : CIDR visualization + F5 trailer roadmap ----------------
  {
    date: "2026-06-29",
    time: "07:40",
    kind: "feature",
    title: "CIDR tool: octet bit visualization and a netmask slider",
    body: "The subnet mode now draws the address as 32 bits across its four octets, showing the binary and decimal value of each octet and highlighting the network bits apart from the host bits. A prefix-length slider lets you drag the mask from /0 to /32 and watch the split move.",
    tools: ["cidr"],
  },
  {
    date: "2026-06-29",
    time: "07:38",
    kind: "feature",
    title: "F5 packet-trailer tools added to the roadmap",
    links: [{ label: "Roadmap", href: "/roadmap" }],
    body: "Two tools derived from the Wireshark f5ethtrailer dissector were added to the roadmap: an F5 Ethernet trailer decoder (Low, Medium, and High details: ingress, slot, TMM, VIP, flow and peer IDs, RST cause, peer info; it ignores the TLS keylog provider) and an F5 TCP RST cause explainer.",
  },

  // ---- 2026-06-29 : JWKS explainer -----------------------------------------
  {
    date: "2026-06-29",
    time: "07:20",
    kind: "tool",
    title: "JWKS explainer and key matcher",
    body: "A new tool that breaks down a JSON Web Key Set: it explains every key (type, use, algorithm, size), flags any private or symmetric key material that should never appear in a published set, and matches a JWT to its key by kid. It completes the JWT and OIDC verification story and never fetches a jwks_uri. Shipped with three Learn articles.",
    tools: ["jwks-explainer"],
  },

  // ---- 2026-06-29 : syslog PRI tool + SIEM formats added -------------------
  {
    date: "2026-06-29",
    time: "06:31",
    kind: "tool",
    title: "Syslog PRI decoder and encoder",
    body: "A new tool that decodes a syslog PRI value (such as 134) into its facility and severity, or encodes a facility and severity back into a PRI and its on-the-wire form. It notes the common network-device facility defaults (FortiGate local7, Cisco ASA local4, F5 BIG-IP local0). Shipped with three Learn articles.",
    tools: ["syslog-pri-decoder"],
  },
  {
    date: "2026-06-29",
    time: "06:30",
    kind: "feature",
    title: "SIEM event formats added to the roadmap",
    links: [{ label: "Roadmap", href: "/roadmap" }],
    body: "Four logging and SIEM tools were added to the roadmap: a CEF decoder (ArcSight), a Splunk HEC event explainer, a LEEF decoder (QRadar) in a new logging category, and an F5 high-speed logging and log-profile explainer.",
  },

  // ---- 2026-06-29 : roadmap expansion --------------------------------------
  {
    date: "2026-06-29",
    time: "06:23",
    kind: "feature",
    title: "Roadmap expanded with syslog, API, and cloud-native tools",
    links: [{ label: "Roadmap", href: "/roadmap" }],
    body: "Nine tools were added to the roadmap. Two syslog tools (a PRI decoder and encoder, and a full RFC 5424 / RFC 3164 message parser) and four API tools (a JWKS explainer and key matcher, a CORS preflight explainer, a webhook signature verifier, and an OpenAPI explainer) were ranked by value. A cloud-native set (Kubernetes NetworkPolicy, RBAC, and kubeconfig explainers) was added in a new category at the end of the queue.",
  },

  // ---- 2026-06-29 : the ranked tool sprint (ten tools in one day) ----------
  {
    date: "2026-06-29",
    time: "05:46",
    kind: "tool",
    title: "F5 cipher-string explainer",
    body: "A new tool that parses an F5 BIG-IP cipher string, explains every keyword and operator, and flags weak or deprecated choices alongside forward secrecy. It recognizes the pre-built rules (f5-default, f5-secure, f5-ecc). It deliberately does not reproduce the exact per-TMOS ordered suite list, which depends on the platform version. Shipped with three Learn articles.",
    tools: ["f5-cipher-string-expander"],
  },
  {
    date: "2026-06-29",
    time: "05:33",
    kind: "tool",
    title: "Persistence-method explainer",
    body: "A new tool that reads BIG-IP persistence profiles and virtual servers, explains each method (cookie, source-address, SSL, universal, hash, and more) with its real failure modes, and resolves each virtual's primary and fallback persistence chain. It reuses the tmsh parser and pairs with the persistence cookie decoder. Shipped with three Learn articles.",
    tools: ["f5-persistence-method-explainer"],
  },
  {
    date: "2026-06-29",
    time: "05:00",
    kind: "tool",
    title: "tmsh config explainer",
    body: "A new tool that parses a BIG-IP bigip.conf snippet and explains its objects, virtual servers, pools, monitors, profiles, and iRules, in plain English. Shipped with three Learn articles.",
    tools: ["f5-tmsh-config-explainer"],
  },
  {
    date: "2026-06-29",
    time: "04:00",
    kind: "tool",
    title: "JSON / YAML converter",
    body: "A new tool that converts between JSON and YAML in the browser, flagging dropped comments, expanded anchors, and number-precision limits. Useful for moving between F5 AS3/DO (JSON) and Kubernetes, Ansible, or CI (YAML). Shipped with three Learn articles.",
    tools: ["json-yaml-convert"],
  },
  {
    date: "2026-06-29",
    time: "03:30",
    kind: "tool",
    title: "JSON formatter and inspector",
    body: "A new tool that formats and validates JSON with precise error locations, structural statistics, and duplicate-key detection. Shipped with three Learn articles.",
    tools: ["json-formatter"],
  },
  {
    date: "2026-06-29",
    time: "03:00",
    kind: "tool",
    title: "URL inspector",
    body: "A new tool that parses a URL into its components, decodes query and path encoding, and explains each part, introducing the new HTTP and web tool category. Shipped with three Learn articles.",
    tools: ["url-inspector"],
  },
  {
    date: "2026-06-29",
    time: "02:30",
    kind: "tool",
    title: "BIG-IP persistence cookie decoder",
    body: "A new tool that decodes F5 BIG-IP persistence cookies across all four encoding formats, detects encrypted cookies, and can also encode a cookie from a pool member. Shipped with Learn articles.",
    tools: ["f5-bigip-persistence-cookie"],
  },
  {
    date: "2026-06-29",
    time: "02:00",
    kind: "tool",
    title: "OIDC decoder",
    body: "A new tool that decodes OpenID Connect ID tokens (reusing the JWT engine) and .well-known/openid-configuration documents, flagging missing claims, the none algorithm, and PKCE method. It never calls the jwks_uri. Shipped with Learn articles.",
    tools: ["oidc"],
  },
  {
    date: "2026-06-29",
    time: "01:30",
    kind: "tool",
    title: "SAML decoder",
    body: "A new tool that decodes and explains SAML assertions and metadata using an XXE-hardened XML parser, with the mandatory external-entity rejection. Shipped with Learn articles.",
    tools: ["saml-decoder"],
  },
  {
    date: "2026-06-29",
    time: "01:00",
    kind: "tool",
    title: "Security headers analyzer",
    body: "A new tool that analyzes HTTP security response headers across 25 headers with detailed reason codes, the first tool of the ranked build sprint. Shipped with five Learn articles.",
    tools: ["secure-headers"],
  },

  // ---- 2026-06-28 : catalogue, ranking, search, and two rebuilds -----------
  {
    date: "2026-06-28",
    time: "11:00",
    kind: "feature",
    title: "Tool roadmap ranked and catalogue reorganized",
    links: [{ label: "Roadmap", href: "/roadmap" }],
    body: "The full tool roadmap was ranked end to end and persisted into the catalogue. The tools index was reorganized to list tools alphabetically, with Learn articles in a curated reading order.",
  },
  {
    date: "2026-06-28",
    time: "10:30",
    kind: "feature",
    title: "Search upgraded with result badges",
    body: "Site search moved from grouped results to pure relevance ranking, and now labels each result as a tool, an article, or a page.",
  },
  {
    date: "2026-06-28",
    time: "06:00",
    kind: "tool",
    title: "base64 rebuilt as a unified codec",
    body: "The base64 tool was rebuilt into a single codec covering base64, base64url, base32, base16/hex, and percent-encoding, with four new Learn articles.",
    tools: ["base64"],
  },
  {
    date: "2026-06-28",
    time: "02:30",
    kind: "tool",
    title: "CIDR tool rebuilt",
    body: "The CIDR tool was rebuilt and moved to its own canonical page, with new Learn articles.",
    tools: ["cidr"],
  },
  {
    date: "2026-06-28",
    time: "01:00",
    kind: "infra",
    title: "Locale scaffolding expanded",
    body: "Additional locales were scaffolded, bringing the total to 42, including right-to-left layout support for the relevant scripts.",
  },

  // ---- 2026-06-25 : localization program -----------------------------------
  {
    date: "2026-06-25",
    kind: "i18n",
    title: "Sixteen languages completed",
    body: "Full message packs were completed across all sixteen live locales. A machine-translation notice and a Contribute page were added, with downloadable language packs for community review.",
  },

  // ---- 2026-06-24 : launch -------------------------------------------------
  {
    date: "2026-06-24",
    time: "20:00",
    kind: "launch",
    title: "ronutz.com went live",
    body: "The site launched on Cloudflare Workers with ten client-side tools (JWT, PKCE, X.509, cipher-suite, IPv6, CIDR, base64, hash, HMAC, and UUID), the Learn article system, Pagefind search, an eight-theme switcher, and the full About, Certifications, and Training sections. Every tool runs entirely in the browser with no telemetry.",
    tools: ["jwt", "pkce", "x509", "cipher", "ipv6", "cidr", "base64", "hash", "hmac", "uuid"],
  },
];
