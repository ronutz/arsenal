// ============================================================================
// DNS & BIND - the internet's phone book and its reference implementation.
// Knowledge-based, dates well-documented (2026-07-17): HOSTS.TXT maintained
// at SRI-NIC (Feinler's group) collapses under growth; Mockapetris designs
// the DNS at USC ISI - RFC 882/883 November 1983 (first implementation
// JEEVES on TOPS-20), rewritten as RFC 1034/1035 November 1987, which still
// govern. MX record RFC 974 (Partridge, 1986). BIND written 1984 at UC
// Berkeley by grad students (Terry, Painter, Riggle, Zhou) under a DARPA
// grant for 4.3BSD; maintained by Kevin Dunlap (DEC), then Paul Vixie from
// 1988; Vixie co-founds ISC 1994 (with Rick Adams) as BIND's permanent home;
// BIND 9 ground-up rewrite 2000. Kaminsky cache-poisoning flaw + coordinated
// patch 2008 (CERT VU#800113). Root signed with DNSSEC July 15, 2010. Dyn
// Mirai DDoS October 21, 2016. DoT RFC 7858 (2016), DoH RFC 8484 (2018).
// All figures carry sourceNotes where a specific document anchors them.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const dnsBindProfile: VendorProfile = {
  slug: "dns-bind",
  foundings: [
    {
      company: "The Domain Name System (RFC 882/883)",
      year: 1983,
      place: "USC Information Sciences Institute, Marina del Rey, California",
      founders: ["Paul Mockapetris (design)", "Jon Postel (impetus and stewardship)"],
      story:
        "Before the DNS there was a text file. SRI's Network Information Center - Elizabeth Feinler's group - maintained HOSTS.TXT, the master list of every machine on the network, and every host FTP'd a fresh copy on faith. By the early 1980s the file, and the process, were visibly collapsing under growth. Jon Postel handed the problem of unifying the competing fixes to Paul Mockapetris, who came back with something more ambitious than asked for: a distributed, hierarchical, cached database in which authority is delegated along the names themselves. RFC 882 and 883 shipped in November 1983, with a first implementation called JEEVES on TOPS-20; the 1987 rewrite as RFC 1034 and 1035 refined the design into the documents that still govern every lookup made today.",
    },
    {
      company: "BIND (Berkeley Internet Name Domain)",
      year: 1984,
      place: "University of California, Berkeley",
      founders: ["Douglas Terry", "Mark Painter", "David Riggle", "Songnian Zhou"],
      story:
        "A protocol without an implementation is a paper; four Berkeley graduate students working under a DARPA grant made the DNS real for UNIX, writing the Berkeley Internet Name Domain for 4.3BSD. Stewardship passed through Kevin Dunlap at DEC and then, from 1988, to Paul Vixie - the same Vixie who wrote the cron most systems still run - who became the software's decades-long keeper and in 1994 co-founded the Internet Software Consortium to give it a permanent, vendor-neutral home. For long stretches of internet history the statement 'this network runs DNS' and the statement 'this network runs BIND' were, in practice, the same sentence.",
    },
  ],
  timeline: [
    { year: 1983, title: "Two RFCs replace a text file", detail: "RFC 882 and 883, November 1983: names become a delegated hierarchy, lookups become a distributed query protocol, and the JEEVES implementation on TOPS-20 proves it runs. The single point of failure that was HOSTS.TXT begins its retirement.", sourceNote: "RFC 882 / RFC 883, November 1983." },
    { year: 1986, title: "The MX record", detail: "Craig Partridge's RFC 974 decouples mail routing from host naming - a domain can receive mail without the mail machine carrying its name. The record type that made hosted email, and eventually cloud email, structurally possible.", sourceNote: "RFC 974, January 1986." },
    { year: 1987, title: "RFC 1034 / 1035", detail: "The rewrite that still governs: zones, delegation, caching with TTLs, the resource-record model. The wire format a resolver speaks today is recognizably the 1987 document - forty years of planetary growth on the same concepts.", sourceNote: "RFC 1034 / RFC 1035, November 1987." },
    { year: 1988, title: "Vixie takes the torch", detail: "Paul Vixie assumes BIND maintenance at DEC, and in 1994 co-founds the Internet Software Consortium as its permanent home - consortium-funded open infrastructure before that phrase existed. ISC also comes to operate F-root, one of the thirteen root-server identities." },
    { year: 2000, title: "BIND 9", detail: "A ground-up rewrite - funded by a coalition of vendors and DARPA money after the security troubles of the BIND 4/8 lineage - built for DNSSEC readiness, views, and the security posture the previous decade had shown to be necessary." },
    { year: 2008, title: "The Kaminsky flaw", detail: "Dan Kaminsky finds a practical cache-poisoning attack against the protocol itself. The response - a secretly coordinated, simultaneous multi-vendor patch introducing source-port randomization - becomes the template for synchronized industry-wide disclosure.", sourceNote: "CERT Vulnerability Note VU#800113, July 2008." },
    { year: 2010, title: "The root is signed", detail: "DNSSEC reaches the root zone on July 15, 2010, giving the hierarchy a cryptographic trust anchor and turning 'is this answer authentic' from a hope into a verifiable property - where the chain is deployed.", sourceNote: "ICANN / Verisign root-zone DNSSEC deployment record, July 15, 2010." },
    { year: 2016, title: "Dyn day", detail: "October 21, 2016: the Mirai botnet's DDoS against managed-DNS provider Dyn makes major sites unreachable for much of a day - the moment 'DNS is critical infrastructure' stopped being an engineer's sentence and became a headline.", sourceNote: "Dyn's public incident analysis and contemporaneous reporting, October 2016." },
    { year: 2018, title: "Encrypted resolution", detail: "DNS over TLS (RFC 7858, 2016) and DNS over HTTPS (RFC 8484, 2018) close the last-mile eavesdropping gap - and move resolver choice into browsers and operating systems, turning resolution policy into a live privacy and governance debate.", sourceNote: "RFC 7858 (2016) / RFC 8484 (2018)." },
  ],
  products: [
    { name: "The DNS itself", what: "A distributed, hierarchical, cached database: root to TLD to zone, authority delegated along the name, answers cached at the edge. The largest distributed system ever deployed, and the one every connection consults first." },
    { name: "BIND 4 / 8 / 9", what: "The reference implementation lineage - named, zone files, and from BIND 9 the views and DNSSEC machinery - the software 'running DNS' meant in practice for a quarter century." },
    { name: "The resource-record model", what: "A, AAAA, NS, SOA, MX, CNAME, TXT, SRV and their kin: an extensible typed-record design (stretched further by EDNS0 in 1999) that let a 1983 schema absorb every era since." },
  ],
  innovations: [
    { title: "Delegation as architecture", detail: "Authority is distributed along the name hierarchy itself - scaling is achieved by handing off, and no central operator is needed beyond the root. The design scaled from hundreds of hosts to billions without changing shape." },
    { title: "Caching with TTLs", detail: "Resolver caching made a planetary database feel instant, and the TTL became the knob every migration plan since has turned - the reason 'propagation' is a word network engineers use with a sigh." },
    { title: "The open reference implementation", detail: "BIND proved a standard succeeds when a funded-in-common, open implementation carries it - and later proved the monoculture caution too, answered by deliberate diversity: djbdns, NSD and Unbound, PowerDNS, Knot." },
  ],
  markets: [
    "Every internet transaction begins with a lookup: registries and registrars, ISP and public resolvers (the 8.8.8.8 and 1.1.1.1 era), enterprise DNS and global server load balancing - the GSLB and BIG-IP DNS material taught on this site stands directly on these foundations.",
  ],
  analyst: [
    "The DNS is the internet's most successful distributed system: forty-plus years, the same wire concepts, planetary scale - because the 1983 design got delegation and caching right the first time.",
    "BIND's arc is open-source infrastructure economics before the term existed: DARPA-seeded, university-born, consortium-funded - and its monoculture years are the standing argument for implementation diversity in critical software.",
    "This pairing is why the DNS tools on this site exist at all: dig decoding, GSLB decision flows, propagation arithmetic - all of it downstream of two RFCs Mockapetris wrote in 1983.",
  ],
};
