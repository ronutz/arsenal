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
    date: "2026-07-05",
    time: "16:07",
    kind: "feature",
    title: "Customizable shortcuts, a settings page, ten boss-key screens, and a motion switch",
    body:
      "A big pass over the site's keyboard shortcuts and the /dev/fun corner. Shortcuts are now user-configurable: a new Settings page (linked in the footer) lets you rebind any shortcut key, with the choice saved on your device; press ? anywhere for a live cheat-sheet of the current bindings. New shortcuts were added alongside the originals: s opens search, / focuses it, h goes home, ? opens the cheat-sheet, and 1 to 5 jump to five go-to tools (CIDR, Base64, JWT, JSON to YAML, and the F5 hub). Language is now a saved preference too: a return visit to the site's home takes you to your preferred language, while any explicit /en/ or /pt-BR/ link is always honored as-is. The boss key grew from two disguises to ten period-accurate ones (Lotus 1-2-3, WordStar, VisiCalc, Norton Utilities, WordPerfect 5.1, dBASE III+, Turbo Pascal, the Windows blue screen, Norton Commander, and a Commodore 64 that types a program by itself), shuffled so you see them all before any repeats; while one is up, the left and right arrows browse the rest, and Esc dismisses. A new Boss-Key Screens gallery in /dev/fun lets you browse them by name, thumbnail, and a short note, and open any one fullscreen. Finally, the Mega Brain console got a motion switch in its title bar for anyone who prefers less movement (its explanatory banners now also hold still while the console shakes), complementing the system reduced-motion setting the site already respects.",
  },
  {
    date: "2026-07-05",
    time: "13:54",
    kind: "feature",
    title: "Site-wide keyboard shortcuts, and a Mega Brain console tune-up",
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
    body:
      "A new colophon section, echoed in one paragraph on the roadmap, spells out the hard limits this site lives under: a Cloudflare Worker version carries at most 20,000 static files on the free plan and 100,000 on the paid plan (raised five-fold in September 2025, deployable only with Wrangler 4.34 or newer), no file over 25 MiB, and static-asset requests free and unlimited. Against that, the site's own arithmetic: about three files per rendered page across sixteen languages, roughly fifty files per tool and a hundred per tool-with-article pack, a little over eighteen thousand files today, and a mapped expansion path, route-sharded Workers, then object storage, should the toolbox ever outgrow one Worker.",
  },
  {
    date: "2026-07-04",
    time: "02:14",
    kind: "feature",
    title: "Every tool now has an Example button (D-83 retrofit complete)",
    body:
      "The Example and Clear buttons that newer tools shipped with are now on every tool, all 54 of them. The 31 retrofitted tools each load a sample taken verbatim from their own golden test vectors, so every example provably works: the RFC 4231 HMAC test case, the RFC 7636 PKCE verifier from appendix B, the RFC 7517 example key set, the canonical jwt.io token, the classic BIG-IP persistence cookie from K6917, real tmsh stanzas, and more. Even the two form-style tools joined in their own way: the iRule event-order tool's Example applies the HTTPS re-encrypt preset, and the tcpdump builder's fills in the all-TMM interface, name-resolution-off, and a host-and-port filter. One click shows what each tool does; one click clears it.",
  },
  {
    date: "2026-07-03",
    time: "22:39",
    kind: "feature",
    title: "Vendor sub-categories, and generic categories go vendor-agnostic",
    body:
      "The taxonomy grew a level. Vendor hubs now group their tools and articles by ordered sub-categories: for F5, the ten pillars from LTM and iRules through TMOS, DNS/GTM, ASM, AFM, APM, SSL Orchestrator, automation, public cloud, and Distributed Cloud, with every tool assigned and articles inheriting their placement from the tools they relate to. Fortinet, Netskope, and Extreme Networks received source-grounded taxonomies of their own, built from each vendor's official product catalogue, twelve Fortinet sub-categories with the full A-to-Z product list assigned, ten Netskope One components, eight Extreme product families, ready for the day their first tools ship. And the generic categories on the Tools and Learn indexes are now exclusively vendor-agnostic: vendor content lives on its hub, one cross-vendor syslog article came home to networking, and the hub strip on top of each index is the way in.",
  },
  {
    date: "2026-07-03",
    time: "22:39",
    kind: "content",
    title: "Privacy page: why preferences live only on your device",
    body:
      "A new section on the privacy page explains what this site remembers and why. The theme choice is stored only in your browser's localStorage and applied before first paint; no cookie, no account, no server ever sees it, which is exactly why a private window, cleared site data, or another device starts you back at the default. Language is not stored at all, it lives in the URL, so a bookmarked address in your language keeps it. With no accounts and no tracking, preferences can only live where you can see and delete them.",
  },
  {
    date: "2026-07-03",
    time: "22:03",
    kind: "content",
    title: "Learn article: session variables, where APM keeps everything it learned",
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
    body:
      "The tools hub's eyebrow and headline both read Tools, breaking the pattern every other index page follows: a short eyebrow, a statement headline, a supporting lede. The headline is now the site's own thesis, tools that compute, never guess, in both languages, with the eyebrow keeping the short label and the existing lede staying as the supporting line.",
  },
  {
    date: "2026-07-03",
    time: "19:09",
    kind: "content",
    title: "Learn article: APM SSO methods and the blast radius",
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
    body:
      "The landing hero now uses the same title and lede scale as every other top-level page, the one page deliberately left out of the header standardization pending an explicit call - the reading-comfort scale won. The call-to-action row inherits the spacing the old subtitle carried, with no inline overrides. And the Tools index, which had the standard title but not the small cyan section marker the Learn, Changelog, and Roadmap pages carry, now opens with one: TOOLS above the tagline, translated like its siblings.",
  },
  {
    date: "2026-07-03",
    time: "16:34",
    kind: "content",
    title: "Learn article: CMP, the cores you paid for",
    body:
      "The article behind the new iRules pair, in English and Portuguese: one TMM per core, connections disaggregated across them, and demotion meaning every connection for a virtual serialized onto a single TMM. The demotion list per the CMP Compatibility page: global variables (validator catches them as of v10) with static:: as the documented cure, plus the two per-TMM traps that bite without demoting - RULE_INIT-generated keys and statistics profiles. Closes with the persistence timeline for the folklore, and the LTM-policy escape hatch for match-and-act logic that never needed Tcl.",
  },
  {
    date: "2026-07-03",
    time: "16:58",
    kind: "content",
    title: "Learn article: packet filters, the checkpoint before everything",
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
    body:
      "The build stamp in the footer's machine row now links here, to the changelog, since that is the natural question a build stamp raises. This page opens with a one-line pointer to the roadmap, separating what is planned from what has shipped. And the special-thanks line on the colophon now ends with a small monochromatic heart, as it always should have.",
  },
  {
    date: "2026-07-03",
    time: "14:47",
    kind: "content",
    title: "Certification record corrected against the certificate itself",
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
    body:
      "The funding story on the contribute page is the same text, now set for comfortable reading: a short intro, the three seats as a compact list, the infrastructure line, and the monthly total on its own line so the number is easy to find. Not a word changed in English or Portuguese, only the presentation.",
  },
  {
    date: "2026-07-03",
    time: "10:33",
    kind: "feature",
    title: "Clearer API error messages",
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
