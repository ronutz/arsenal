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
// plain sentences. Reference tool slugs in `tools` when relevant.
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
  /** Optional tool slugs this entry concerns (linked on the page). */
  tools?: string[];
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
    date: "2026-07-03",
    time: "09:19",
    kind: "content",
    title: "Funding transparency, updated",
    body:
      "The On building new tools section on the contribute page now tells the whole story: the three CONCORD seats (ANVIL on Claude, SCOUT on ChatGPT Plus, PRISM on Google AI Pro), the Cloudflare Workers plan, and the yearly domain fees, roughly USD 150 to 250 a month all in, with a link to the colophon for how the seats work. Buy Me a Coffee contributions go to that toolchain and nothing else.",
  },
  {
    date: "2026-07-03",
    time: "09:00",
    kind: "feature",
    title: "F5 hub, easy to find",
    body:
      "Hub discoverability now lives on top of the Tools and Learn listings: a small pill on each page links straight to the F5 hub, keeping the header a simple four-item bar. The pills are generated from the same populated-vendor rule as the hub itself, so Fortinet, Netskope, and Extreme Networks will appear there automatically the day their first tools ship.",
  },
  {
    date: "2026-07-03",
    time: "08:43",
    kind: "feature",
    title: "Vendor hub pages",
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
      "The CSR decoder's interface — input labels, result cards, the requested-extension and attribute labels, and the error messages — is now translated across all 16 locales (40 strings each), so the tool reads natively instead of falling back to English.",
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
      "The planner's interface — input labels, result cards, the SC-081v3 schedule table, the projection, and the guidance notes — is now translated across all 16 locales (44 strings each), so the tool reads natively instead of falling back to English.",
  },
  // ---- 2026-06-30 : planner articles in pt-BR ------------------------------
  {
    date: "2026-06-30",
    time: "00:58",
    kind: "i18n",
    title: "Planner Learn articles now in Brazilian Portuguese",
    tools: ["cert-renewal-planner"],
    body:
      "The five certificate renewal planner articles — the 47-day schedule, validity windows, DCV/SII reuse, renewing with ACME and ARI, and public vs private PKI — are now translated to Brazilian Portuguese, bringing pt-BR to parity with English for this set.",
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
    body: "Decoding a client-ssl or server-ssl profile now draws the BIG-IP SSL data path — client, BIG-IP, pool member — and lights up the TLS leg the profile actually governs: a client-ssl profile on the client-side leg it terminates, a server-ssl profile on the server-side leg it initiates, with the profile named on that leg. The note spells out the offload-versus-re-encrypt consequence. This closes the Tier 1 SVG retrofits. Vector, theme-aware, parsed entirely in the browser.",
    tools: ["f5-ssl-profile-explainer"],
  },

  // ---- 2026-06-29 : ipv6 address-structure strip ---------------------------
  {
    date: "2026-06-29",
    time: "15:02",
    kind: "feature",
    title: "IPv6 tool now shows the address structure",
    body: "Decoding an IPv6 address now draws its 128 bits as eight hextet cells over a 0-128 bit ruler, with the prefix boundary drawn at the actual /N — shading the network prefix apart from the host portion, and naming the 64-bit interface identifier when the split lands on /64. With no prefix supplied, a dashed line marks the conventional /64 boundary instead. The fourth of the Tier 1/2 SVG retrofits, and the right shape for 128 bits where a per-bit grid would not fit. Vector, theme-aware, all in the browser.",
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
    body: "Decoding a certificate now draws a small chain-of-trust diagram — root CA, intermediate CA, end-entity — and highlights where the pasted certificate sits: a self-signed certificate lights up the root, a CA certificate the intermediate, and an ordinary certificate the leaf, with its subject and issuer named and the self-signed case called out. The second of the Tier 1/2 SVG retrofits. Vector and theme-aware; the certificate never leaves the browser.",
    tools: ["x509"],
  },

  // ---- 2026-06-29 : PKCE flow diagram --------------------------------------
  {
    date: "2026-06-29",
    time: "13:45",
    kind: "feature",
    title: "PKCE tool now shows the flow as a diagram",
    body: "The PKCE generator gains an inline sequence diagram of the S256 authorization-code flow — generate a code_verifier, derive the code_challenge, carry it on the /authorize request, get an authorization code, send the verifier on the /token request, and have the server re-derive and compare before issuing tokens — colour-coded by who acts (app vs authorization server). It is the first of the Tier 1/2 SVG retrofits across existing tools. Vector and theme-aware; nothing about the tool leaves the browser.",
    tools: ["pkce"],
  },

  // ---- 2026-06-29 : iRule event order --------------------------------------
  {
    date: "2026-06-29",
    time: "12:16",
    kind: "tool",
    title: "iRule event order is live",
    body: "Toggle the profile stack on a BIG-IP virtual server — client-SSL, HTTP, server-SSL, pool, or FastL4 — and see the order the common iRule events fire, from CLIENT_ACCEPTED through CLIENT_CLOSED, as a color-coded timeline (the toolbox's first inline diagram) and an ordered list, with the conditional events (TCP/HTTP collect, LB failure, 100 Continue) called out and where each one slots in. The sequence is pinned to F5 Clouddocs and the DevCentral event-order capture. Five Learn articles ship alongside it. It is a model of documented behaviour that runs entirely in the browser and never contacts a device.",
    tools: ["f5-irules-event-order"],
  },

  // ---- 2026-06-29 : Unix time converter ------------------------------------
  {
    date: "2026-06-29",
    time: "11:28",
    kind: "tool",
    title: "Unix time converter is live",
    body: "Paste a Unix timestamp — the unit (seconds, milliseconds, microseconds, or nanoseconds) is read from its magnitude and stated back to you — or an ISO-8601 date, and get the instant in every common form: the UTC calendar breakdown with weekday and day-of-year, ISO 8601, RFC 3339, the HTTP date, and the timestamp in all four units. Negative timestamps and the Year 2038 boundary are flagged. Five Learn articles ship alongside it. The conversion is pure date math that runs entirely in the browser; a Now button and a relative-to-your-clock line are the only parts that read the wall clock.",
    tools: ["epoch"],
  },

  // ---- 2026-06-29 : F5 SSL profile explainer -------------------------------
  {
    date: "2026-06-29",
    time: "10:32",
    kind: "tool",
    title: "F5 SSL profile explainer is live",
    body: "Paste a tmsh client-ssl or server-ssl profile and get its role, the TLS protocol matrix derived from the options field (which version each no- flag permits or blocks), and a 🟢/🟡/🟠/🔴 security read covering chain building, renegotiation, SNI, OCSP stapling, and mutual-TLS validation — each setting explained. Five Learn articles ship alongside it. Parsing runs entirely in the browser; it never contacts a device.",
    tools: ["f5-ssl-profile-explainer"],
  },

  // ---- 2026-06-29 : Licensing copy + F5 iControl roadmap ------------------
  {
    date: "2026-06-29",
    time: "08:42",
    kind: "content",
    title: "Licensing and colophon copy updated across all locales",
    body: "The license, colophon, and API copy were reworded in every live language to match how things work now: each tool is self-contained and runs entirely in the browser, with no upstream engine imported at runtime. The determinism and privacy guarantees are unchanged.",
  },
  {
    date: "2026-06-29",
    time: "08:44",
    kind: "feature",
    title: "Two F5 iControl REST tools on the roadmap",
    body: "Queued an iControl REST path explainer — which decodes /mgmt/tm/... URLs, the tilde-encoded ~partition~ paths, and the query options, and shows the matching tmsh path — and an iControl REST stats decoder that flattens F5's deeply nested stats JSON into readable key-values. Both are offline and never contact a device.",
  },

  // ---- 2026-06-29 : CIDR self-contained + Expect roadmap -------------------
  {
    date: "2026-06-29",
    time: "08:22",
    kind: "infra",
    title: "CIDR is now self-contained",
    body: "The CIDR tool was the last piece still calling an external compute package; its single-subnet analysis (cidrAnalyze) has been brought in-house, with output verified byte-for-byte against what it replaced. The site no longer depends on any external engine at runtime.",
  },
  {
    date: "2026-06-29",
    time: "08:24",
    kind: "feature",
    title: "Two Expect (Tcl) tools on the roadmap",
    body: "Queued an Expect script explainer — which breaks down spawn, expect, send, and timeout blocks and flags pitfalls like hardcoded credentials and a missing timeout — and an Expect pattern tester for the glob, -re, and -ex match modes. Both are static and offline; neither runs a script.",
  },

  // ---- 2026-06-29 : Regex toolkit ------------------------------------------
  {
    date: "2026-06-29",
    time: "08:05",
    kind: "tool",
    title: "New tool: Regex Toolkit",
    body: "Compile, test, and explain JavaScript regular expressions in one place: live matches with positional and named capture groups highlighted, a plain-language token breakdown of what the pattern does, and a static check that warns before a catastrophic-backtracking (ReDoS) pattern runs against your text — so a single keystroke cannot freeze the page. Ships with three Learn articles. Everything runs in the browser.",
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
    body: "Four logging and SIEM tools were added to the roadmap: a CEF decoder (ArcSight), a Splunk HEC event explainer, a LEEF decoder (QRadar) in a new logging category, and an F5 high-speed logging and log-profile explainer.",
  },

  // ---- 2026-06-29 : roadmap expansion --------------------------------------
  {
    date: "2026-06-29",
    time: "06:23",
    kind: "feature",
    title: "Roadmap expanded with syslog, API, and cloud-native tools",
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
