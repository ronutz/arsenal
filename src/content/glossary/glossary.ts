// ============================================================================
// src/content/glossary/glossary.ts
// ----------------------------------------------------------------------------
// THE GLOSSARY REGISTRY (per glossary-design-spec-v1, ratified 2026-07-08).
//
// Same discipline as catalogue.ts: this file holds the STRUCTURAL, language-
// neutral data for every glossary entry - slug, headword, kind, domain tags,
// expansion, aliases, cross-links, sources, disputed flag. The authored PROSE
// (the `def` one-liner and the `context` paragraph) lives in the `glossary`
// i18n namespace, authored en + native pt-BR (D-18), other locales EN-fallback.
//
// TWO AXES (spec §2):
//   - domain (MULTI-tag): primary homes only, <= 4 tags. Jargon has real dual
//     citizenship ("WAF" is networking + security), but over-tagging kills the
//     filter, so tag where a term genuinely lives, not everywhere it is uttered.
//   - kind (SINGLE): most-specific-wins - lore > expression > jargon > acronym
//     > term. "SNAFU" is lore (its story dominates) with an `expansion`, not
//     `acronym`; "TLS" is acronym with an `expansion`. The formal spelled-out
//     fact lives in `expansion` so it never fights the semantic kind.
//
// HEADWORD LANGUAGE (spec §3): the headword stays in its ORIGINAL language in
// every locale ("yak shaving" is never translated to a pt-BR term). Only
// def/context are localized. That is why headword is a plain string here, not
// an i18n key.
//
// LORE ACCURACY (spec §4): every `kind: lore` entry is fact-checked, cites its
// primary source in `sources`, and marks anything apocryphal with
// `disputed: true` plus the correction in its `context`. The site's whole
// promise is "compute, never guess" - the glossary cannot repeat myths as fact.
//
// DARKWEB FRAMING (spec §4): `darkweb`-domain entries are protective /
// educational / journalistic only - name the concept, never operational how-to,
// never a marketplace, never sourcing.
// ============================================================================

/** The single-select register/form axis (spec §2). */
export type GlossaryKind = "term" | "acronym" | "expression" | "jargon" | "lore";

/** The multi-tag domain axis (spec §2). Eleven domains. */
export type GlossaryDomain =
  | "enterprise-networking"
  | "cyber-security"
  | "crypto"
  | "cloud"
  | "grc"
  | "privacy"
  | "hacking"
  | "darkweb"
  | "ops-culture"
  | "web-development"
  | "programming";

/** A primary source citation (esp. required for lore). */
export interface GlossarySource {
  /** e.g. "RFC 3092", "The Jargon File", "Parkinson, 1957". */
  label: string;
  /** Primary-source URL where one exists. */
  href?: string;
}

/** One glossary entry - structural data only; prose is in i18n. */
export interface GlossaryEntry {
  /** Stable id; the /glossary/<slug> address. Must avoid vendor keys. */
  slug: string;
  /** Displayed term. STAYS in its original language across all locales. */
  headword: string;
  /** Single kind, precedence lore>expression>jargon>acronym>term. */
  kind: GlossaryKind;
  /** Multi-tag domains, primary homes only, <= 4 (enforced by check-glossary). */
  domains: GlossaryDomain[];

  /** Acronym/coinage spelled out. Any kind may use it. */
  expansion?: string;
  /** Alternate spellings/names/expansions - powers search + the omnibox. */
  aliases?: string[];
  /** Tool slugs this term links to (the site thesis in a hyperlink). */
  relatedTools?: string[];
  /** Learn article slugs. */
  relatedArticles?: string[];
  /** Other glossary slugs (salt -> nonce -> IV). */
  relatedTerms?: string[];

  /** Primary source(s). Required for lore (checked by check-glossary). */
  sources?: GlossarySource[];
  /** True -> render a "disputed / apocryphal origin" marker; correct in context. */
  disputed?: boolean;
}

// ============================================================================
// THE ENTRIES.
// Batch 1 (this checkpoint): ~75 entries, weighted to lore / hacking / darkweb
// per PRIME, with solid enterprise-networking / cyber-security / crypto / cloud
// coverage. Batch 2 (next checkpoint) fills to ~150 across all domains.
//
// Ordering here is by domain cluster for authoring legibility only; the index
// sorts by headword A->Z and by the domain/kind filters at render time.
// ============================================================================

export const GLOSSARY: GlossaryEntry[] = [
  // ---------------------------------------------------------------- LORE ----
  {
    slug: "the-first-bug",
    headword: "bug (the first computer bug)",
    kind: "lore",
    domains: ["programming", "ops-culture"],
    aliases: ["first bug", "computer moth", "debugging origin"],
    relatedTerms: ["debugging", "heisenbug"],
    disputed: true,
    sources: [
      { label: "National Museum of American History - the 1947 logbook" },
      { label: "Hopper / Harvard Mark II operations log, 1947-09-09" },
    ],
  },
  {
    slug: "foo-bar",
    headword: "foo / bar",
    kind: "lore",
    domains: ["programming"],
    aliases: ["foobar", "foo", "bar", "metasyntactic variable"],
    relatedTerms: ["baz", "the-jargon-file"],
    sources: [
      { label: "RFC 3092 - Etymology of \"Foo\"", href: "https://www.rfc-editor.org/rfc/rfc3092" },
    ],
  },
  {
    slug: "baz",
    headword: "baz",
    kind: "lore",
    domains: ["programming"],
    aliases: ["metasyntactic variable", "qux"],
    relatedTerms: ["foo-bar"],
    sources: [{ label: "RFC 3092", href: "https://www.rfc-editor.org/rfc/rfc3092" }],
  },
  {
    slug: "snafu",
    headword: "SNAFU",
    kind: "lore",
    domains: ["ops-culture"],
    expansion: "Situation Normal, All Fouled Up",
    aliases: ["snafu"],
    relatedTerms: ["fubar", "yak-shaving"],
    sources: [{ label: "US military slang, WWII" }],
  },
  {
    slug: "fubar",
    headword: "FUBAR",
    kind: "lore",
    domains: ["ops-culture", "programming"],
    expansion: "Fouled Up Beyond All Recognition",
    aliases: ["fubar"],
    relatedTerms: ["snafu", "foo-bar"],
    sources: [{ label: "US military slang, WWII" }],
  },
  {
    slug: "yak-shaving",
    headword: "yak shaving",
    kind: "lore",
    domains: ["programming", "ops-culture"],
    aliases: ["yak-shaving", "shaving the yak"],
    relatedTerms: ["bikeshedding", "rabbit-hole"],
    sources: [{ label: "MIT AI Lab / Carlin Vieri, 1990s" }],
  },
  {
    slug: "bikeshedding",
    headword: "bikeshedding",
    kind: "lore",
    domains: ["ops-culture", "programming"],
    expansion: "Parkinson's Law of Triviality",
    aliases: ["bike-shedding", "bike shed", "law of triviality"],
    relatedTerms: ["yak-shaving"],
    sources: [
      { label: "C. Northcote Parkinson, \"Parkinson's Law\", 1957" },
    ],
  },
  {
    slug: "the-story-of-mel",
    headword: "the Story of Mel",
    kind: "lore",
    domains: ["programming"],
    aliases: ["Mel", "Mel Kaye", "real programmer"],
    relatedTerms: ["the-jargon-file", "hack"],
    sources: [
      { label: "Ed Nather, Usenet, 1983" },
    ],
  },
  {
    slug: "five-hundred-mile-email",
    headword: "the 500-mile email",
    kind: "lore",
    domains: ["enterprise-networking", "ops-culture"],
    aliases: ["500 mile email", "500-mile email", "Trey Harris"],
    relatedTerms: ["heisenbug", "root-cause"],
    sources: [
      { label: "Trey Harris, sysadmin folklore, c. 1994 (published 2002)" },
    ],
  },
  {
    slug: "heisenbug",
    headword: "heisenbug",
    kind: "lore",
    domains: ["programming"],
    aliases: ["heisenbug", "heisenberg bug"],
    relatedTerms: ["the-first-bug", "bohrbug", "debugging"],
    sources: [{ label: "The Jargon File" }],
  },
  {
    slug: "bohrbug",
    headword: "bohrbug",
    kind: "lore",
    domains: ["programming"],
    aliases: ["bohrbug", "bohr bug"],
    relatedTerms: ["heisenbug"],
    sources: [{ label: "The Jargon File" }],
  },
  {
    slug: "the-jargon-file",
    headword: "the Jargon File",
    kind: "lore",
    domains: ["hacking", "programming"],
    aliases: ["jargon file", "hacker's dictionary", "hackers dictionary"],
    relatedTerms: ["hack", "the-story-of-mel"],
    sources: [
      { label: "The Jargon File (1975-), ed. Raymond et al." },
    ],
  },
  {
    slug: "cargo-cult-programming",
    headword: "cargo cult programming",
    kind: "lore",
    domains: ["programming", "ops-culture"],
    aliases: ["cargo cult", "cargo-cult"],
    relatedTerms: ["yak-shaving", "rubber-duck-debugging"],
    sources: [
      { label: "after Feynman's \"cargo cult science\", 1974" },
    ],
  },
  {
    slug: "rubber-duck-debugging",
    headword: "rubber duck debugging",
    kind: "lore",
    domains: ["programming"],
    aliases: ["rubber ducking", "rubberduck", "rubber-duck"],
    relatedTerms: ["debugging", "the-story-of-mel"],
    sources: [
      { label: "\"The Pragmatic Programmer\", Hunt & Thomas, 1999" },
    ],
  },
  {
    slug: "hack",
    headword: "hack",
    kind: "lore",
    domains: ["hacking", "programming"],
    aliases: ["hacking", "hacker", "kludge"],
    relatedTerms: ["the-jargon-file", "kludge", "hacker-hat-colors"],
    sources: [{ label: "Tech Model Railroad Club / MIT, from the 1950s" }],
  },
  {
    slug: "kludge",
    headword: "kludge",
    kind: "lore",
    domains: ["programming", "ops-culture"],
    aliases: ["kluge", "kludgy"],
    relatedTerms: ["hack", "technical-debt"],
    sources: [{ label: "The Jargon File" }],
  },
  {
    slug: "wizard",
    headword: "wizard",
    kind: "jargon",
    domains: ["programming", "ops-culture"],
    aliases: ["guru", "wizardry"],
    relatedTerms: ["the-story-of-mel", "hack"],
  },
  {
    slug: "grok",
    headword: "grok",
    kind: "expression",
    domains: ["programming", "hacking"],
    aliases: ["grokking"],
    sources: [{ label: "Robert A. Heinlein, \"Stranger in a Strange Land\", 1961" }],
  },
  {
    slug: "eating-your-own-dog-food",
    headword: "dogfooding",
    kind: "expression",
    domains: ["ops-culture", "programming"],
    aliases: ["dogfooding", "eat your own dog food", "dog food"],
    relatedTerms: ["shift-left"],
  },
  {
    slug: "rabbit-hole",
    headword: "rabbit hole",
    kind: "expression",
    domains: ["ops-culture", "programming"],
    aliases: ["rabbit-hole", "down the rabbit hole"],
    relatedTerms: ["yak-shaving"],
  },

  // ------------------------------------------------------------- HACKING ----
  {
    slug: "hacker-hat-colors",
    headword: "white / black / grey hat",
    kind: "jargon",
    domains: ["hacking", "cyber-security"],
    aliases: ["white hat", "black hat", "grey hat", "gray hat", "hat colors"],
    relatedTerms: ["hack", "pentest", "responsible-disclosure"],
  },
  {
    slug: "pentest",
    headword: "penetration test",
    kind: "term",
    domains: ["hacking", "cyber-security"],
    expansion: "penetration test",
    aliases: ["pentest", "pen test", "pen-testing", "ethical hacking"],
    relatedTerms: ["red-team", "blue-team", "cve"],
  },
  {
    slug: "red-team",
    headword: "red team",
    kind: "term",
    domains: ["cyber-security", "hacking"],
    aliases: ["red-team", "red teaming"],
    relatedTerms: ["blue-team", "purple-team", "pentest"],
  },
  {
    slug: "blue-team",
    headword: "blue team",
    kind: "term",
    domains: ["cyber-security", "ops-culture"],
    aliases: ["blue-team", "blue teaming", "defenders"],
    relatedTerms: ["red-team", "purple-team", "soc"],
  },
  {
    slug: "purple-team",
    headword: "purple team",
    kind: "term",
    domains: ["cyber-security"],
    aliases: ["purple-team", "purple teaming"],
    relatedTerms: ["red-team", "blue-team"],
  },
  {
    slug: "zero-day",
    headword: "zero-day",
    kind: "term",
    domains: ["cyber-security", "hacking"],
    aliases: ["0-day", "0day", "zero day", "zero-day exploit"],
    relatedTerms: ["cve", "exploit", "responsible-disclosure"],
  },
  {
    slug: "exploit",
    headword: "exploit",
    kind: "term",
    domains: ["cyber-security", "hacking"],
    aliases: ["exploitation", "weaponized exploit"],
    relatedTerms: ["zero-day", "payload", "cve"],
  },
  {
    slug: "payload",
    headword: "payload",
    kind: "term",
    domains: ["cyber-security", "hacking", "enterprise-networking"],
    aliases: ["malicious payload"],
    relatedTerms: ["exploit", "shellcode"],
  },
  {
    slug: "shellcode",
    headword: "shellcode",
    kind: "term",
    domains: ["hacking", "cyber-security"],
    aliases: ["shell code"],
    relatedTerms: ["payload", "exploit", "privilege-escalation"],
  },
  {
    slug: "privilege-escalation",
    headword: "privilege escalation",
    kind: "term",
    domains: ["cyber-security", "hacking"],
    aliases: ["privesc", "priv-esc", "escalation of privilege", "lateral movement"],
    relatedTerms: ["exploit", "lateral-movement"],
  },
  {
    slug: "lateral-movement",
    headword: "lateral movement",
    kind: "term",
    domains: ["cyber-security", "hacking"],
    aliases: ["pivoting", "east-west movement"],
    relatedTerms: ["privilege-escalation", "c2"],
  },
  {
    slug: "c2",
    headword: "C2",
    kind: "acronym",
    domains: ["cyber-security", "hacking"],
    expansion: "command and control",
    aliases: ["c2", "cnc", "c&c", "command and control"],
    relatedTerms: ["botnet", "beaconing", "lateral-movement"],
  },
  {
    slug: "beaconing",
    headword: "beaconing",
    kind: "jargon",
    domains: ["cyber-security", "hacking"],
    aliases: ["beacon", "callback"],
    relatedTerms: ["c2", "botnet"],
  },
  {
    slug: "botnet",
    headword: "botnet",
    kind: "term",
    domains: ["cyber-security", "hacking", "enterprise-networking"],
    aliases: ["bot net", "zombie network"],
    relatedTerms: ["c2", "ddos"],
  },
  {
    slug: "phishing",
    headword: "phishing",
    kind: "term",
    domains: ["cyber-security", "hacking"],
    aliases: ["spear phishing", "spear-phishing", "whaling"],
    relatedTerms: ["social-engineering", "smishing"],
  },
  {
    slug: "social-engineering",
    headword: "social engineering",
    kind: "term",
    domains: ["cyber-security", "hacking"],
    aliases: ["social-engineering", "pretexting"],
    relatedTerms: ["phishing", "opsec"],
  },
  {
    slug: "pwned",
    headword: "pwned",
    kind: "lore",
    domains: ["hacking", "cyber-security"],
    aliases: ["pwn", "owned", "pwnage"],
    relatedTerms: ["hack", "have-i-been-pwned"],
    sources: [{ label: "gaming / hacker slang, early 2000s" }],
  },
  {
    slug: "have-i-been-pwned",
    headword: "Have I Been Pwned",
    kind: "term",
    domains: ["cyber-security", "privacy"],
    expansion: "Have I Been Pwned (HIBP)",
    aliases: ["HIBP", "haveibeenpwned", "breach check"],
    relatedTerms: ["pwned", "credential-stuffing"],
  },
  {
    slug: "credential-stuffing",
    headword: "credential stuffing",
    kind: "term",
    domains: ["cyber-security"],
    aliases: ["credential-stuffing", "cred stuffing"],
    relatedTerms: ["have-i-been-pwned", "brute-force"],
  },
  {
    slug: "brute-force",
    headword: "brute force",
    kind: "term",
    domains: ["cyber-security", "crypto"],
    aliases: ["brute-force", "bruteforce", "dictionary attack"],
    relatedTerms: ["credential-stuffing", "rainbow-table"],
  },
  {
    slug: "rainbow-table",
    headword: "rainbow table",
    kind: "term",
    domains: ["crypto", "cyber-security"],
    aliases: ["rainbow-table"],
    relatedTerms: ["salt", "hash", "brute-force"],
  },
  {
    slug: "responsible-disclosure",
    headword: "responsible disclosure",
    kind: "term",
    domains: ["cyber-security", "grc"],
    aliases: ["coordinated disclosure", "responsible-disclosure", "CVD"],
    relatedTerms: ["zero-day", "cve", "bug-bounty"],
  },
  {
    slug: "bug-bounty",
    headword: "bug bounty",
    kind: "term",
    domains: ["cyber-security", "hacking"],
    aliases: ["bug-bounty", "vulnerability reward"],
    relatedTerms: ["responsible-disclosure", "pentest"],
  },

  // ------------------------------------------------------------- DARKWEB ----
  {
    slug: "onion-routing",
    headword: "onion routing",
    kind: "term",
    domains: ["darkweb", "privacy", "enterprise-networking"],
    aliases: ["onion-routing", "Tor", "the onion router"],
    relatedTerms: ["tor-relay", "opsec", "end-to-end-encryption"],
    sources: [{ label: "US Naval Research Laboratory, 1990s; Tor Project" }],
  },
  {
    slug: "tor-relay",
    headword: "Tor relay",
    kind: "term",
    domains: ["darkweb", "privacy", "enterprise-networking"],
    aliases: ["relay", "guard node", "exit node", "middle relay"],
    relatedTerms: ["onion-routing", "exit-node"],
  },
  {
    slug: "exit-node",
    headword: "exit node",
    kind: "term",
    domains: ["darkweb", "privacy"],
    aliases: ["exit-node", "exit relay"],
    relatedTerms: ["tor-relay", "onion-routing"],
  },
  {
    slug: "opsec",
    headword: "OPSEC",
    kind: "acronym",
    domains: ["darkweb", "cyber-security", "privacy"],
    expansion: "operations security",
    aliases: ["opsec", "operational security"],
    relatedTerms: ["social-engineering", "threat-model"],
  },
  {
    slug: "dead-drop",
    headword: "dead drop",
    kind: "term",
    domains: ["darkweb", "privacy"],
    aliases: ["dead-drop", "digital dead drop"],
    relatedTerms: ["opsec"],
  },
  {
    slug: "mixer",
    headword: "mixer (tumbler)",
    kind: "term",
    domains: ["darkweb", "crypto", "privacy"],
    aliases: ["tumbler", "coin mixer", "mixing service"],
    relatedTerms: ["chain-analysis"],
  },
  {
    slug: "chain-analysis",
    headword: "chain analysis",
    kind: "term",
    domains: ["darkweb", "crypto", "grc"],
    aliases: ["chain-analysis", "blockchain forensics", "on-chain analysis"],
    relatedTerms: ["mixer"],
  },
  {
    slug: "exit-scam",
    headword: "exit scam",
    kind: "term",
    domains: ["darkweb", "grc"],
    aliases: ["exit-scam", "rug pull", "rug-pull"],
    relatedTerms: ["mixer"],
  },

  // -------------------------------------------------- NETWORKING (core) -----
  {
    slug: "cidr",
    headword: "CIDR",
    kind: "acronym",
    domains: ["enterprise-networking"],
    expansion: "Classless Inter-Domain Routing",
    aliases: ["cidr", "slash notation", "prefix length"],
    relatedTools: ["cidr"],
    relatedTerms: ["subnet", "supernet"],
    sources: [{ label: "RFC 4632", href: "https://www.rfc-editor.org/rfc/rfc4632" }],
  },
  {
    slug: "subnet",
    headword: "subnet",
    kind: "term",
    domains: ["enterprise-networking"],
    aliases: ["subnetwork", "subnet mask"],
    relatedTools: ["cidr"],
    relatedTerms: ["cidr", "supernet", "vlsm"],
  },
  {
    slug: "supernet",
    headword: "supernet",
    kind: "term",
    domains: ["enterprise-networking"],
    aliases: ["supernetting", "route aggregation", "summarization"],
    relatedTerms: ["cidr", "subnet"],
  },
  {
    slug: "vlsm",
    headword: "VLSM",
    kind: "acronym",
    domains: ["enterprise-networking"],
    expansion: "Variable-Length Subnet Masking",
    aliases: ["vlsm"],
    relatedTerms: ["subnet", "cidr"],
  },
  {
    slug: "nat",
    headword: "NAT",
    kind: "acronym",
    domains: ["enterprise-networking"],
    expansion: "Network Address Translation",
    aliases: ["nat", "pat", "masquerade", "source nat", "snat", "dnat"],
    relatedTerms: ["cidr"],
    sources: [{ label: "RFC 2663", href: "https://www.rfc-editor.org/rfc/rfc2663" }],
  },
  {
    slug: "mtu",
    headword: "MTU",
    kind: "acronym",
    domains: ["enterprise-networking"],
    expansion: "Maximum Transmission Unit",
    aliases: ["mtu", "jumbo frame"],
    relatedTools: ["mtu-mss"],
    relatedTerms: ["mss", "path-mtu-discovery"],
  },
  {
    slug: "mss",
    headword: "MSS",
    kind: "acronym",
    domains: ["enterprise-networking"],
    expansion: "Maximum Segment Size",
    aliases: ["mss", "mss clamping"],
    relatedTools: ["mtu-mss"],
    relatedTerms: ["mtu", "path-mtu-discovery"],
  },
  {
    slug: "path-mtu-discovery",
    headword: "Path MTU Discovery",
    kind: "acronym",
    domains: ["enterprise-networking"],
    expansion: "Path MTU Discovery (PMTUD)",
    aliases: ["pmtud", "path mtu"],
    relatedTerms: ["mtu", "mss"],
    sources: [{ label: "RFC 1191", href: "https://www.rfc-editor.org/rfc/rfc1191" }],
  },
  {
    slug: "anycast",
    headword: "anycast",
    kind: "term",
    domains: ["enterprise-networking", "cloud"],
    aliases: ["any-cast"],
    relatedTerms: ["unicast", "bgp"],
  },
  {
    slug: "bgp",
    headword: "BGP",
    kind: "acronym",
    domains: ["enterprise-networking"],
    expansion: "Border Gateway Protocol",
    aliases: ["bgp", "autonomous system", "as-path"],
    relatedTerms: ["anycast", "rpki"],
    sources: [{ label: "RFC 4271", href: "https://www.rfc-editor.org/rfc/rfc4271" }],
  },
  {
    slug: "rpki",
    headword: "RPKI",
    kind: "acronym",
    domains: ["enterprise-networking", "cyber-security"],
    expansion: "Resource Public Key Infrastructure",
    aliases: ["rpki", "route origin validation", "roa"],
    relatedTerms: ["bgp"],
    sources: [{ label: "RFC 6480", href: "https://www.rfc-editor.org/rfc/rfc6480" }],
  },
  {
    slug: "waf",
    headword: "WAF",
    kind: "acronym",
    domains: ["enterprise-networking", "cyber-security"],
    expansion: "Web Application Firewall",
    aliases: ["waf", "web application firewall", "app firewall"],
    relatedTerms: ["owasp", "reverse-proxy"],
  },
  {
    slug: "reverse-proxy",
    headword: "reverse proxy",
    kind: "term",
    domains: ["enterprise-networking", "cloud"],
    aliases: ["reverse-proxy"],
    relatedTerms: ["waf", "load-balancing", "forward-proxy"],
  },
  {
    slug: "forward-proxy",
    headword: "forward proxy",
    kind: "term",
    domains: ["enterprise-networking", "privacy"],
    aliases: ["forward-proxy", "web proxy"],
    relatedTerms: ["reverse-proxy"],
  },
  {
    slug: "load-balancing",
    headword: "load balancing",
    kind: "term",
    domains: ["enterprise-networking", "cloud"],
    aliases: ["load-balancing", "load balancer", "SLB"],
    relatedTerms: ["reverse-proxy", "anycast"],
  },

  // ------------------------------------------------------- CRYPTO (core) ----
  {
    slug: "nonce",
    headword: "nonce",
    kind: "term",
    domains: ["crypto", "cyber-security"],
    expansion: "number used once",
    aliases: ["number used once", "cryptographic nonce"],
    relatedTerms: ["iv", "salt", "replay-attack"],
  },
  {
    slug: "salt",
    headword: "salt",
    kind: "term",
    domains: ["crypto", "cyber-security"],
    aliases: ["password salt", "salting"],
    relatedTerms: ["hash", "nonce", "rainbow-table", "pepper"],
  },
  {
    slug: "pepper",
    headword: "pepper",
    kind: "term",
    domains: ["crypto", "cyber-security"],
    aliases: ["secret salt", "peppering"],
    relatedTerms: ["salt", "hash"],
  },
  {
    slug: "iv",
    headword: "IV",
    kind: "acronym",
    domains: ["crypto"],
    expansion: "initialization vector",
    aliases: ["iv", "initialization vector", "initialisation vector"],
    relatedTerms: ["nonce", "salt"],
  },
  {
    slug: "hash",
    headword: "hash function",
    kind: "term",
    domains: ["crypto", "programming"],
    aliases: ["hash", "hashing", "digest", "message digest"],
    relatedTools: ["hash"],
    relatedTerms: ["salt", "hmac", "collision"],
  },
  {
    slug: "hmac",
    headword: "HMAC",
    kind: "acronym",
    domains: ["crypto"],
    expansion: "Hash-based Message Authentication Code",
    aliases: ["hmac"],
    relatedTerms: ["hash", "mac"],
    sources: [{ label: "RFC 2104", href: "https://www.rfc-editor.org/rfc/rfc2104" }],
  },
  {
    slug: "collision",
    headword: "hash collision",
    kind: "term",
    domains: ["crypto"],
    aliases: ["collision", "hash collision", "birthday attack"],
    relatedTerms: ["hash"],
  },
  {
    slug: "forward-secrecy",
    headword: "forward secrecy",
    kind: "term",
    domains: ["crypto", "cyber-security"],
    expansion: "Perfect Forward Secrecy (PFS)",
    aliases: ["pfs", "perfect forward secrecy", "forward-secrecy"],
    relatedTerms: ["tls", "ephemeral-key"],
  },
  {
    slug: "ephemeral-key",
    headword: "ephemeral key",
    kind: "term",
    domains: ["crypto"],
    aliases: ["ephemeral-key", "session key", "DHE", "ECDHE"],
    relatedTerms: ["forward-secrecy", "tls"],
  },
  {
    slug: "merkle-tree",
    headword: "Merkle tree",
    kind: "term",
    domains: ["crypto", "programming"],
    aliases: ["merkle-tree", "hash tree"],
    relatedTerms: ["hash"],
    sources: [{ label: "Ralph Merkle, 1979" }],
  },
  {
    slug: "end-to-end-encryption",
    headword: "end-to-end encryption",
    kind: "term",
    domains: ["crypto", "privacy", "cyber-security"],
    expansion: "end-to-end encryption (E2EE)",
    aliases: ["e2ee", "end-to-end", "end to end encryption"],
    relatedTerms: ["forward-secrecy", "tls"],
  },

  // -------------------------------------------------------- CLOUD (core) ----
  {
    slug: "kubernetes",
    headword: "Kubernetes",
    kind: "term",
    domains: ["cloud", "ops-culture"],
    expansion: "Kubernetes (K8s)",
    aliases: ["k8s", "kube", "kubernetes"],
    relatedTerms: ["sidecar", "control-plane", "pod"],
  },
  {
    slug: "pod",
    headword: "pod",
    kind: "term",
    domains: ["cloud"],
    aliases: ["k8s pod", "kubernetes pod"],
    relatedTerms: ["kubernetes", "sidecar"],
  },
  {
    slug: "sidecar",
    headword: "sidecar",
    kind: "term",
    domains: ["cloud", "enterprise-networking"],
    aliases: ["sidecar container", "sidecar proxy"],
    relatedTerms: ["kubernetes", "service-mesh"],
  },
  {
    slug: "service-mesh",
    headword: "service mesh",
    kind: "term",
    domains: ["cloud", "enterprise-networking"],
    aliases: ["service-mesh", "istio", "linkerd"],
    relatedTerms: ["sidecar", "control-plane"],
  },
  {
    slug: "control-plane",
    headword: "control plane",
    kind: "term",
    domains: ["cloud", "enterprise-networking"],
    aliases: ["control-plane", "data plane", "data-plane"],
    relatedTerms: ["kubernetes", "service-mesh"],
  },
  {
    slug: "noisy-neighbor",
    headword: "noisy neighbor",
    kind: "jargon",
    domains: ["cloud", "ops-culture"],
    aliases: ["noisy-neighbor", "noisy neighbour"],
    relatedTerms: ["blast-radius"],
  },
  {
    slug: "blast-radius",
    headword: "blast radius",
    kind: "jargon",
    domains: ["cloud", "ops-culture", "cyber-security"],
    aliases: ["blast-radius"],
    relatedTools: ["change-blast-radius-mapper"],
    relatedTerms: ["noisy-neighbor", "shift-left"],
  },
  {
    slug: "serverless",
    headword: "serverless",
    kind: "term",
    domains: ["cloud", "programming"],
    aliases: ["faas", "functions as a service", "lambda"],
    relatedTerms: ["control-plane"],
  },

  // -------------------------------------------------- OPS-CULTURE (core) ----
  {
    slug: "shift-left",
    headword: "shift-left",
    kind: "expression",
    domains: ["ops-culture", "cyber-security", "programming"],
    aliases: ["shift left", "shift-left security", "shift-left testing"],
    relatedTerms: ["blast-radius", "technical-debt", "devsecops"],
  },
  {
    slug: "devsecops",
    headword: "DevSecOps",
    kind: "term",
    domains: ["ops-culture", "cyber-security"],
    aliases: ["devsecops", "devops", "secops", "netops", "sre"],
    relatedTerms: ["shift-left", "toil"],
  },
  {
    slug: "technical-debt",
    headword: "technical debt",
    kind: "expression",
    domains: ["ops-culture", "programming"],
    aliases: ["tech debt", "technical-debt", "tech-debt"],
    relatedTerms: ["kludge", "shift-left"],
    sources: [{ label: "Ward Cunningham, 1992" }],
  },
  {
    slug: "toil",
    headword: "toil",
    kind: "jargon",
    domains: ["ops-culture"],
    aliases: ["operational toil"],
    relatedTerms: ["devsecops", "runbook"],
    sources: [{ label: "Google SRE Book" }],
  },
  {
    slug: "runbook",
    headword: "runbook",
    kind: "term",
    domains: ["ops-culture", "enterprise-networking"],
    aliases: ["run book", "playbook"],
    relatedTools: ["change-window-runbook-builder"],
    relatedTerms: ["toil", "root-cause"],
  },
  {
    slug: "root-cause",
    headword: "root cause",
    kind: "term",
    domains: ["ops-culture", "enterprise-networking"],
    expansion: "root cause analysis (RCA)",
    aliases: ["rca", "root-cause", "root cause analysis", "five whys"],
    relatedTools: ["incident-timeline-rca-builder", "fault-hypothesis-builder"],
    relatedArticles: ["root-cause-is-a-verb-not-a-noun"],
    relatedTerms: ["runbook", "five-hundred-mile-email"],
  },

  // ---------------------------------------------- SECURITY / GRC (core) -----
  {
    slug: "cve",
    headword: "CVE",
    kind: "acronym",
    domains: ["cyber-security", "grc"],
    expansion: "Common Vulnerabilities and Exposures",
    aliases: ["cve", "common vulnerabilities and exposures"],
    relatedTerms: ["cvss", "zero-day", "responsible-disclosure"],
  },
  {
    slug: "cvss",
    headword: "CVSS",
    kind: "acronym",
    domains: ["cyber-security", "grc"],
    expansion: "Common Vulnerability Scoring System",
    aliases: ["cvss", "cvss score", "base score"],
    relatedTerms: ["cve"],
  },
  {
    slug: "owasp",
    headword: "OWASP",
    kind: "acronym",
    domains: ["cyber-security", "web-development"],
    expansion: "Open Worldwide Application Security Project",
    aliases: ["owasp", "owasp top 10", "owasp top ten"],
    relatedTerms: ["waf", "xss", "sql-injection"],
  },
  {
    slug: "zero-trust",
    headword: "zero trust",
    kind: "term",
    domains: ["cyber-security", "enterprise-networking"],
    expansion: "Zero Trust Architecture (ZTA)",
    aliases: ["zero-trust", "zta", "never trust always verify", "ztna"],
    relatedTerms: ["least-privilege", "microsegmentation"],
  },
  {
    slug: "least-privilege",
    headword: "least privilege",
    kind: "term",
    domains: ["cyber-security", "grc"],
    expansion: "principle of least privilege (PoLP)",
    aliases: ["least-privilege", "polp", "principle of least privilege"],
    relatedTerms: ["zero-trust", "privilege-escalation"],
  },
  {
    slug: "threat-model",
    headword: "threat model",
    kind: "term",
    domains: ["cyber-security", "grc"],
    aliases: ["threat-model", "threat modeling", "STRIDE", "attack surface"],
    relatedTerms: ["opsec", "least-privilege"],
  },

  // --------------------------------------------------------- PRIVACY --------
  {
    slug: "pii",
    headword: "PII",
    kind: "acronym",
    domains: ["privacy", "grc"],
    expansion: "Personally Identifiable Information",
    aliases: ["pii", "personal data", "personally identifiable information"],
    relatedTerms: ["gdpr", "data-minimization"],
  },
  {
    slug: "gdpr",
    headword: "GDPR",
    kind: "acronym",
    domains: ["privacy", "grc"],
    expansion: "General Data Protection Regulation",
    aliases: ["gdpr", "lgpd", "data protection regulation"],
    relatedTerms: ["pii", "data-minimization"],
  },
  {
    slug: "data-minimization",
    headword: "data minimization",
    kind: "term",
    domains: ["privacy", "grc"],
    aliases: ["data-minimization", "data minimisation"],
    relatedTerms: ["pii", "gdpr"],
  },

  // ------------------------------------------ WEB-DEV / PROGRAMMING ----------
  {
    slug: "xss",
    headword: "XSS",
    kind: "acronym",
    domains: ["web-development", "cyber-security"],
    expansion: "Cross-Site Scripting",
    aliases: ["xss", "cross-site scripting", "cross site scripting"],
    relatedTerms: ["owasp", "csrf", "sql-injection"],
  },
  {
    slug: "csrf",
    headword: "CSRF",
    kind: "acronym",
    domains: ["web-development", "cyber-security"],
    expansion: "Cross-Site Request Forgery",
    aliases: ["csrf", "xsrf", "cross-site request forgery", "sea-surf"],
    relatedTerms: ["xss", "owasp"],
  },
  {
    slug: "sql-injection",
    headword: "SQL injection",
    kind: "term",
    domains: ["web-development", "cyber-security"],
    expansion: "SQL injection (SQLi)",
    aliases: ["sqli", "sql-injection", "sql injection"],
    relatedTerms: ["owasp", "xss"],
  },
  {
    slug: "idempotent",
    headword: "idempotent",
    kind: "term",
    domains: ["programming", "web-development"],
    aliases: ["idempotency", "idempotence"],
    relatedTerms: ["race-condition"],
  },
  {
    slug: "race-condition",
    headword: "race condition",
    kind: "term",
    domains: ["programming", "cyber-security"],
    aliases: ["race-condition", "TOCTOU", "data race"],
    relatedTerms: ["heisenbug", "idempotent"],
  },
  {
    slug: "regex",
    headword: "regex",
    kind: "term",
    domains: ["programming"],
    expansion: "regular expression",
    aliases: ["regexp", "regular expression", "regexes"],
    relatedTerms: ["redos"],
  },

  // ------------------------------ BATCH-1 CLOSERS (referenced above) --------
  {
    slug: "debugging",
    headword: "debugging",
    kind: "term",
    domains: ["programming", "ops-culture"],
    aliases: ["debug", "debugger"],
    relatedTerms: ["the-first-bug", "heisenbug", "rubber-duck-debugging"],
  },
  {
    slug: "tls",
    headword: "TLS",
    kind: "acronym",
    domains: ["crypto", "enterprise-networking", "cyber-security"],
    expansion: "Transport Layer Security",
    aliases: ["tls", "ssl", "https", "transport layer security"],
    relatedTools: ["cipher"],
    relatedArticles: ["cipher-suite-anatomy"],
    relatedTerms: ["forward-secrecy", "ephemeral-key", "cipher-suite"],
    sources: [{ label: "RFC 8446 (TLS 1.3)", href: "https://www.rfc-editor.org/rfc/rfc8446" }],
  },
  {
    slug: "cipher-suite",
    headword: "cipher suite",
    kind: "term",
    domains: ["crypto", "cyber-security"],
    aliases: ["cipher-suite", "ciphersuite"],
    relatedArticles: ["cipher-suite-anatomy"],
    relatedTerms: ["tls", "forward-secrecy"],
  },
  {
    slug: "soc",
    headword: "SOC",
    kind: "acronym",
    domains: ["cyber-security", "ops-culture"],
    expansion: "Security Operations Center",
    aliases: ["soc", "security operations center", "security operations centre", "SIEM"],
    relatedTerms: ["blue-team", "threat-model"],
  },
  {
    slug: "ddos",
    headword: "DDoS",
    kind: "acronym",
    domains: ["cyber-security", "enterprise-networking"],
    expansion: "Distributed Denial of Service",
    aliases: ["ddos", "dos", "denial of service", "volumetric attack"],
    relatedTerms: ["botnet", "c2"],
  },
  {
    slug: "smishing",
    headword: "smishing",
    kind: "term",
    domains: ["cyber-security", "hacking"],
    aliases: ["sms phishing", "vishing"],
    relatedTerms: ["phishing", "social-engineering"],
  },
  {
    slug: "unicast",
    headword: "unicast",
    kind: "term",
    domains: ["enterprise-networking"],
    aliases: ["multicast", "broadcast"],
    relatedTerms: ["anycast"],
  },
  {
    slug: "replay-attack",
    headword: "replay attack",
    kind: "term",
    domains: ["crypto", "cyber-security"],
    aliases: ["replay-attack", "replay"],
    relatedTerms: ["nonce", "iv"],
  },
  {
    slug: "mac",
    headword: "MAC (message authentication code)",
    kind: "acronym",
    domains: ["crypto"],
    expansion: "Message Authentication Code",
    aliases: ["mac", "message authentication code"],
    relatedTerms: ["hmac", "hash"],
  },
  {
    slug: "microsegmentation",
    headword: "microsegmentation",
    kind: "term",
    domains: ["cyber-security", "enterprise-networking", "cloud"],
    aliases: ["micro-segmentation", "micro segmentation"],
    relatedTerms: ["zero-trust", "least-privilege"],
  },
  {
    slug: "redos",
    headword: "ReDoS",
    kind: "acronym",
    domains: ["web-development", "cyber-security", "programming"],
    expansion: "Regular expression Denial of Service",
    aliases: ["redos", "catastrophic backtracking"],
    relatedTerms: ["regex", "ddos"],
  },
  {
    slug: "mac-address",
    headword: "MAC address",
    kind: "term",
    domains: ["enterprise-networking"],
    expansion: "Media Access Control address",
    aliases: ["mac address", "hardware address", "physical address", "OUI"],
    relatedTools: ["mac-oui"],
    relatedTerms: ["unicast"],
  },

  // ============================ BATCH 2 (top-up toward ~150) ================
  // ---- more lore ----
  {
    slug: "off-by-one",
    headword: "off-by-one error",
    kind: "lore",
    domains: ["programming"],
    aliases: ["off by one", "obo", "fencepost error", "fencepost"],
    relatedTerms: ["heisenbug", "regex"],
    sources: [{ label: "The Jargon File (\"fencepost error\")" }],
  },
  {
    slug: "there-are-two-hard-things",
    headword: "the two hard things",
    kind: "expression",
    domains: ["programming"],
    aliases: ["two hard problems", "cache invalidation and naming things", "phil karlton"],
    relatedTerms: ["off-by-one", "technical-debt"],
    sources: [{ label: "attributed to Phil Karlton" }],
  },
  {
    slug: "xkcd-workflow",
    headword: "\"is it worth the time?\"",
    kind: "expression",
    domains: ["ops-culture", "programming"],
    aliases: ["automation tradeoff", "xkcd 1205", "worth the time"],
    relatedTerms: ["toil", "yak-shaving"],
    sources: [{ label: "xkcd 1205, \"Is It Worth the Time?\"" }],
  },
  {
    slug: "leftpad",
    headword: "the left-pad incident",
    kind: "lore",
    domains: ["programming", "web-development", "ops-culture"],
    aliases: ["left-pad", "leftpad", "npm left-pad"],
    relatedTerms: ["technical-debt", "supply-chain-attack"],
    sources: [{ label: "npm / left-pad unpublish, March 2016" }],
  },
  {
    slug: "the-network-is-reliable",
    headword: "the fallacies of distributed computing",
    kind: "lore",
    domains: ["enterprise-networking", "cloud", "programming"],
    aliases: ["fallacies of distributed computing", "the network is reliable", "eight fallacies"],
    relatedTerms: ["five-hundred-mile-email", "race-condition"],
    sources: [{ label: "L. Peter Deutsch et al., Sun Microsystems, 1994-97" }],
  },

  // ---- more networking ----
  {
    slug: "dns",
    headword: "DNS",
    kind: "acronym",
    domains: ["enterprise-networking"],
    expansion: "Domain Name System",
    aliases: ["dns", "domain name system", "name resolution"],
    relatedTerms: ["anycast", "ttl", "dns-over-https"],
    sources: [{ label: "RFC 1034 / 1035", href: "https://www.rfc-editor.org/rfc/rfc1035" }],
  },
  {
    slug: "ttl",
    headword: "TTL",
    kind: "acronym",
    domains: ["enterprise-networking"],
    expansion: "Time To Live",
    aliases: ["ttl", "time to live", "hop limit"],
    relatedTerms: ["dns", "anycast"],
  },
  {
    slug: "dns-over-https",
    headword: "DNS over HTTPS",
    kind: "acronym",
    domains: ["enterprise-networking", "privacy"],
    expansion: "DNS over HTTPS (DoH)",
    aliases: ["doh", "dns over https", "dns over tls", "dot", "encrypted dns"],
    relatedTerms: ["dns", "tls"],
    sources: [{ label: "RFC 8484", href: "https://www.rfc-editor.org/rfc/rfc8484" }],
  },
  {
    slug: "three-way-handshake",
    headword: "TCP three-way handshake",
    kind: "term",
    domains: ["enterprise-networking"],
    aliases: ["3-way handshake", "syn syn-ack ack", "tcp handshake"],
    relatedTerms: ["mss", "syn-flood"],
  },
  {
    slug: "syn-flood",
    headword: "SYN flood",
    kind: "term",
    domains: ["enterprise-networking", "cyber-security"],
    aliases: ["syn-flood", "syn flood attack", "half-open"],
    relatedTerms: ["three-way-handshake", "ddos"],
  },
  {
    slug: "vpn",
    headword: "VPN",
    kind: "acronym",
    domains: ["enterprise-networking", "privacy"],
    expansion: "Virtual Private Network",
    aliases: ["vpn", "virtual private network", "tunnel"],
    relatedTerms: ["tls", "forward-proxy"],
  },
  {
    slug: "qos",
    headword: "QoS",
    kind: "acronym",
    domains: ["enterprise-networking"],
    expansion: "Quality of Service",
    aliases: ["qos", "quality of service", "traffic shaping", "diffserv"],
    relatedTerms: ["mtu"],
  },

  // ---- more crypto ----
  {
    slug: "public-key-cryptography",
    headword: "public-key cryptography",
    kind: "term",
    domains: ["crypto", "cyber-security"],
    expansion: "asymmetric cryptography",
    aliases: ["asymmetric encryption", "public key", "private key", "keypair"],
    relatedTerms: ["tls", "digital-signature", "pki"],
    sources: [{ label: "Diffie & Hellman, 1976" }],
  },
  {
    slug: "digital-signature",
    headword: "digital signature",
    kind: "term",
    domains: ["crypto", "cyber-security"],
    aliases: ["digital-signature", "signing", "sign and verify"],
    relatedTerms: ["public-key-cryptography", "hash", "pki"],
  },
  {
    slug: "pki",
    headword: "PKI",
    kind: "acronym",
    domains: ["crypto", "cyber-security", "enterprise-networking"],
    expansion: "Public Key Infrastructure",
    aliases: ["pki", "public key infrastructure", "certificate authority", "CA"],
    relatedTerms: ["public-key-cryptography", "digital-signature", "tls"],
  },
  {
    slug: "entropy",
    headword: "entropy",
    kind: "term",
    domains: ["crypto", "cyber-security"],
    aliases: ["randomness", "csprng", "key entropy"],
    relatedTerms: ["nonce", "brute-force"],
  },
  {
    slug: "post-quantum-cryptography",
    headword: "post-quantum cryptography",
    kind: "term",
    domains: ["crypto", "cyber-security"],
    expansion: "post-quantum cryptography (PQC)",
    aliases: ["pqc", "quantum-resistant", "quantum-safe", "harvest now decrypt later"],
    relatedArticles: ["quantum-threat-to-cryptography"],
    relatedTerms: ["public-key-cryptography", "forward-secrecy"],
  },

  // ---- more cloud / ops ----
  {
    slug: "idempotency-key",
    headword: "idempotency key",
    kind: "term",
    domains: ["cloud", "web-development"],
    aliases: ["idempotency-key", "idempotency token"],
    relatedTerms: ["idempotent", "nonce"],
  },
  {
    slug: "circuit-breaker",
    headword: "circuit breaker",
    kind: "term",
    domains: ["cloud", "programming"],
    aliases: ["circuit-breaker", "fail fast"],
    relatedTerms: ["blast-radius", "graceful-degradation"],
    sources: [{ label: "Michael Nygard, \"Release It!\", 2007" }],
  },
  {
    slug: "graceful-degradation",
    headword: "graceful degradation",
    kind: "term",
    domains: ["cloud", "ops-culture", "web-development"],
    aliases: ["graceful-degradation", "fail soft", "fallback"],
    relatedTerms: ["circuit-breaker", "blast-radius"],
  },
  {
    slug: "immutable-infrastructure",
    headword: "immutable infrastructure",
    kind: "term",
    domains: ["cloud", "ops-culture"],
    aliases: ["immutable-infrastructure", "cattle not pets", "phoenix server"],
    relatedTerms: ["infrastructure-as-code", "blast-radius"],
  },
  {
    slug: "infrastructure-as-code",
    headword: "infrastructure as code",
    kind: "term",
    domains: ["cloud", "ops-culture"],
    expansion: "infrastructure as code (IaC)",
    aliases: ["iac", "infrastructure-as-code", "terraform", "declarative infra"],
    relatedTerms: ["immutable-infrastructure", "control-plane"],
  },
  {
    slug: "observability",
    headword: "observability",
    kind: "term",
    domains: ["ops-culture", "cloud"],
    aliases: ["o11y", "logs metrics traces", "three pillars"],
    relatedTerms: ["toil", "root-cause"],
  },
  {
    slug: "slo",
    headword: "SLO",
    kind: "acronym",
    domains: ["ops-culture", "cloud"],
    expansion: "Service Level Objective",
    aliases: ["slo", "sla", "sli", "error budget", "service level"],
    relatedTerms: ["observability", "toil"],
  },

  // ---- more security / grc / privacy / web ----
  {
    slug: "mfa",
    headword: "MFA",
    kind: "acronym",
    domains: ["cyber-security", "privacy"],
    expansion: "Multi-Factor Authentication",
    aliases: ["mfa", "2fa", "two-factor", "multi-factor authentication", "totp"],
    relatedTerms: ["credential-stuffing", "phishing"],
  },
  {
    slug: "supply-chain-attack",
    headword: "supply-chain attack",
    kind: "term",
    domains: ["cyber-security", "grc"],
    aliases: ["supply-chain attack", "software supply chain", "dependency attack"],
    relatedTerms: ["leftpad", "zero-day"],
  },
  {
    slug: "defense-in-depth",
    headword: "defense in depth",
    kind: "term",
    domains: ["cyber-security", "grc"],
    aliases: ["defense-in-depth", "defence in depth", "layered security"],
    relatedTerms: ["least-privilege", "zero-trust"],
  },
  {
    slug: "cia-triad",
    headword: "CIA triad",
    kind: "term",
    domains: ["cyber-security", "grc"],
    expansion: "Confidentiality, Integrity, Availability",
    aliases: ["cia triad", "confidentiality integrity availability"],
    relatedTerms: ["threat-model", "defense-in-depth"],
  },
  {
    slug: "soc2",
    headword: "SOC 2",
    kind: "acronym",
    domains: ["grc", "cloud"],
    expansion: "System and Organization Controls 2",
    aliases: ["soc 2", "soc2", "service organization controls"],
    relatedTerms: ["cia-triad", "least-privilege"],
  },
  {
    slug: "cors",
    headword: "CORS",
    kind: "acronym",
    domains: ["web-development", "cyber-security"],
    expansion: "Cross-Origin Resource Sharing",
    aliases: ["cors", "cross-origin resource sharing", "same-origin policy"],
    relatedTerms: ["csrf", "xss"],
  },
  {
    slug: "csp",
    headword: "Content Security Policy",
    kind: "acronym",
    domains: ["web-development", "cyber-security"],
    expansion: "Content Security Policy (CSP)",
    aliases: ["csp", "content security policy"],
    relatedTerms: ["xss", "cors"],
  },
  {
    slug: "jwt",
    headword: "JWT",
    kind: "acronym",
    domains: ["web-development", "cyber-security", "crypto"],
    expansion: "JSON Web Token",
    aliases: ["jwt", "json web token", "jot", "bearer token"],
    relatedTools: ["jwt"],
    relatedTerms: ["digital-signature", "mfa"],
  },
  {
    slug: "oauth",
    headword: "OAuth",
    kind: "term",
    domains: ["web-development", "cyber-security", "privacy"],
    expansion: "OAuth 2.0",
    aliases: ["oauth", "oauth2", "oidc", "openid connect", "authorization code"],
    relatedTools: ["pkce"],
    relatedTerms: ["jwt", "mfa"],
  },
];

// ---- Registry API (mirrors the catalogue/learn helper style) ---------------

/** All entries, sorted A->Z by headword (case-insensitive). */
export function getAllGlossaryEntries(): GlossaryEntry[] {
  return [...GLOSSARY].sort((a, b) =>
    a.headword.toLocaleLowerCase().localeCompare(b.headword.toLocaleLowerCase()),
  );
}

/** One entry by slug, or null. */
export function getGlossaryEntry(slug: string): GlossaryEntry | null {
  return GLOSSARY.find((e) => e.slug === slug) ?? null;
}

/** All slugs (for generateStaticParams). */
export function getAllGlossarySlugs(): string[] {
  return GLOSSARY.map((e) => e.slug);
}

/** Distinct domains present, in the canonical axis order. */
export function getGlossaryDomains(): GlossaryDomain[] {
  const order: GlossaryDomain[] = [
    "enterprise-networking", "cyber-security", "crypto", "cloud", "grc",
    "privacy", "hacking", "darkweb", "ops-culture", "web-development", "programming",
  ];
  const present = new Set(GLOSSARY.flatMap((e) => e.domains));
  return order.filter((d) => present.has(d));
}

/** All kinds, in precedence order. */
export function getGlossaryKinds(): GlossaryKind[] {
  return ["lore", "expression", "jargon", "acronym", "term"];
}

/** Resolve related glossary slugs to entries (for the entry page rail). */
export function getRelatedTerms(slug: string): GlossaryEntry[] {
  const entry = getGlossaryEntry(slug);
  if (!entry?.relatedTerms) return [];
  return entry.relatedTerms
    .map((s) => getGlossaryEntry(s))
    .filter((e): e is GlossaryEntry => e !== null);
}
