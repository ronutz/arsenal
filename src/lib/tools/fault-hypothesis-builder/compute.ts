// ============================================================================
// src/lib/tools/fault-hypothesis-builder/compute.ts
// ----------------------------------------------------------------------------
// FAULT HYPOTHESIS BUILDER - the Operations & Fieldcraft pilot (D-86).
//
// WHAT IT IS: an advisory, evidence-structuring engine. You describe a fault
// through a small structured form (quick mode); a fixed, original rule set
// (D-18: original by construction) fires deterministically and produces
// RANKED HYPOTHESES TO TEST - each with the evidence worth collecting, the
// signals that would support it, and the signals that would weaken it - plus
// quality warnings about the input itself and an exportable worksheet.
//
// WHAT IT IS NOT (D-86 §3.5 guardrails, binding): it does not diagnose, does
// not claim root cause, does not remediate, makes no network calls, asks for
// no credentials or secrets, and replaces neither vendor TAC nor change
// approval. The language discipline (D-86 §3.2) is enforced down to the
// strings in this file: "hypothesis to test", "evidence", "supports",
// "weakens" - never "root cause found".
//
// DETERMINISM & VERIFICATION (D-86 §3.1 - THE PILOT'S RULING): classic
// golden vectors (known-correct outputs) do not map to advisory output;
// there is no "correct" hypothesis set. The engine is nonetheless FULLY
// deterministic: same structured input -> same rules fire, same points, same
// ranking, same warnings. The verification model is therefore RULE-FIRING
// SNAPSHOT VECTORS: for a given input, assert exactly which rules fire, the
// exact ranked hypothesis order, and the exact warning set. The D-49
// manifest carries this as `verificationModel: "rule-firing-snapshot"`;
// tools without the field default to classic golden vectors. This ruling is
// recorded for the whole cluster.
//
// I18N NOTE: hypothesis/evidence text is canonical English from the engine
// (vector-pinned), like the site's other deep technical outputs; all form
// chrome is localized. Recorded in the wrap.
// ============================================================================

import type {
  EvidenceItem,
  Hypothesis,
  QualityWarning,
  SignalStrength,
  ExportArtifact,
} from "@/lib/fieldcraft/schema";
import { artifactToMarkdown } from "@/lib/fieldcraft/markdown";

// ----------------------------------------------------------------------------
// Input model (quick mode). Every field is a closed enum so rule firing is
// deterministic; free text lives only in `notes` and flows ONLY to the
// export artifact, never into rule matching.
// ----------------------------------------------------------------------------

export type Symptom =
  | "total-outage"
  | "intermittent"
  | "slow"
  | "errors-for-some"
  | "auth-failures"
  | "cannot-reach-new-service";

export type Scope = "one-user" | "some-users" | "one-site" | "one-app" | "everyone";

export type Change =
  | "nothing-known"
  | "config-change"
  | "software-deploy"
  | "network-change"
  | "cert-or-key"
  | "capacity-growth"
  | "provider-maintenance";

export type Timing = "constant" | "intermittent-random" | "time-of-day" | "since-change";

export type Clue =
  | "dns-fails"
  | "works-by-ip-not-name"
  | "tls-errors"
  | "tcp-connects-but-app-errors"
  | "timeouts"
  | "slow-only-large-transfers"
  | "one-path-works-other-not"
  | "http-5xx"
  | "http-4xx-auth";

export type PresetId = "generic" | "load-balancer" | "dns" | "tls-pki";

export interface FhbNotes {
  summary?: string;
  impact?: string;
  alreadyTried?: string;
}

export interface FhbInput {
  symptom: Symptom;
  scope: Scope;
  changed: Change[];
  timing: Timing;
  clues: Clue[];
  preset: PresetId;
  /** Free text; artifact-only by design (kept out of rule matching). */
  notes?: FhbNotes;
}

export interface FhbResult {
  hypotheses: Hypothesis[];
  warnings: QualityWarning[];
  /** Every rule that fired, in registry order - the "Why this result?" feed. */
  firedRuleIds: string[];
  presetUsed: PresetId;
  artifact: ExportArtifact;
}

export class FhbError extends Error {
  code: "empty" | "format";
  constructor(code: "empty" | "format", message?: string) {
    super(message ?? code);
    this.name = "FhbError";
    this.code = code;
  }
}

// ----------------------------------------------------------------------------
// Hypothesis registry - the fault DOMAINS the rules can point at. Titles are
// domains to investigate, never verdicts.
// ----------------------------------------------------------------------------

interface HypothesisDef {
  id: string;
  title: string;
  rationale: string;
  supports: string[];
  weakens: string[];
  /** Evidence, with optional per-preset command flavoring. */
  evidence: (preset: PresetId) => EvidenceItem[];
}

/** Preset-flavored command hint helper: returns the flavored command when the
 *  active preset has one, otherwise the generic (or none). Vendor names are
 *  nominative (D-27); no preset implies training authorization (naming rule). */
function cmd(preset: PresetId, flavored: Partial<Record<PresetId, string>>, generic?: string): string | undefined {
  return flavored[preset] ?? generic;
}

const HYPOTHESES: HypothesisDef[] = [
  {
    id: "H-CHANGE-REGRESSION",
    title: "Regression from the recent change",
    rationale:
      "Onset aligned with a known change is the strongest single signal in fault isolation: the change is a hypothesis to test first, not a culprit to assume.",
    supports: [
      "Fault onset timestamp matches the change record within minutes",
      "Rolling the change back in a test path clears the symptom",
      "Only surfaces touched by the change are affected",
    ],
    weakens: [
      "Log evidence shows the symptom predates the change",
      "Unchanged, unrelated systems show the same symptom",
    ],
    evidence: (p) => [
      { id: "E-CHG-1", action: "Pull the exact change record: what was changed, where, and the precise timestamps." },
      {
        id: "E-CHG-2",
        action: "Diff the changed configuration against the last known-good version.",
        command: cmd(p, { "load-balancer": "tmsh show sys config-diff (or compare UCS archives)" }, "diff against your config backup / git history"),
      },
      { id: "E-CHG-3", action: "Establish first-error time from logs and compare it to the change window, not to when users reported." },
      { id: "E-CHG-4", action: "If a safe rollback path exists, test the rollback in a maintenance window rather than debating it." },
    ],
  },
  {
    id: "H-DNS-RESOLUTION",
    title: "Name-resolution path",
    rationale:
      "When a service works by IP but not by name, or lookups fail outright, the resolution chain (client resolver, forwarder, authoritative, record content, TTL) is the domain to test before anything else.",
    supports: [
      "Direct-to-IP access works while the name fails",
      "dig against the configured resolver and the authoritative server disagree",
      "Failures correlate with a recent zone or record change, or a TTL expiry",
    ],
    weakens: ["Access by IP fails identically", "Resolution returns correct, fresh records from every vantage point"],
    evidence: (p) => [
      {
        id: "E-DNS-1",
        action: "Resolve the name against the client's configured resolver AND directly against an authoritative server; compare answers and TTLs.",
        command: cmd(p, { dns: "dig @<resolver> <name> +ttlunits; dig @<authoritative> <name> +norecurse" }, "dig / nslookup against both"),
      },
      { id: "E-DNS-2", action: "Check when the record last changed and whether the failure window matches a TTL expiry after that change." },
      {
        id: "E-DNS-3",
        action: "Verify the resolver itself is reachable and answering from the affected client network.",
        command: cmd(p, { "load-balancer": "if a GSLB/wide-IP answers this name, check pool member availability and last resort behavior" }),
      },
    ],
  },
  {
    id: "H-TLS-PKI",
    title: "TLS handshake and certificate chain",
    rationale:
      "TLS failures cluster around a small set of testable causes: expiry, incomplete chain, name mismatch, protocol/cipher mismatch, and - on terminating proxies - a client-side leg that differs from the server-side leg.",
    supports: [
      "openssl s_client shows expiry, chain, or SAN problems directly",
      "Failures began at a certificate's notAfter instant with no other change",
      "Only clients enforcing newer/older protocol versions fail",
    ],
    weakens: ["Plain-TCP or cleartext checks to the same endpoint also fail", "Handshake completes cleanly from every client profile"],
    evidence: (p) => [
      {
        id: "E-TLS-1",
        action: "Run a raw handshake against the affected endpoint and read the verdict: expiry, chain completeness, SAN match, negotiated protocol and cipher.",
        command: cmd(p, { "tls-pki": "openssl s_client -connect host:443 -servername host -showcerts", "load-balancer": "openssl s_client to the virtual server AND to a pool member - the two TLS legs are separate" }, "openssl s_client -connect host:443 -servername host"),
      },
      { id: "E-TLS-2", action: "Check certificate notBefore/notAfter against the fault onset time; certificates expire without any change being made." },
      {
        id: "E-TLS-3",
        action: "Confirm which side terminated: client-facing certificate vs backend re-encryption use different material and fail independently.",
        command: cmd(p, { "load-balancer": "compare client-ssl and server-ssl profile chains and options" }),
      },
    ],
  },
  {
    id: "H-CAPACITY-SATURATION",
    title: "Capacity or saturation ceiling",
    rationale:
      "Slowness that tracks load - time of day, growth trend, or an event - points at a saturated resource: link, CPU, memory, connection table, or a queue in between.",
    supports: [
      "Utilization graphs at the incident hour sit at or near a ceiling",
      "Symptom intensity tracks traffic volume",
      "Connection counts or queue drops climb with the symptom",
    ],
    weakens: ["Resources sit far below limits during the symptom window", "Symptom occurs equally at negligible load"],
    evidence: (p) => [
      { id: "E-CAP-1", action: "Compare interface, CPU, memory, and connection-count graphs at the incident hour against the same hour on a known-good day." },
      {
        id: "E-CAP-2",
        action: "Look for drops, retransmits, or queue growth on the path devices during the window.",
        command: cmd(p, { "load-balancer": "tmsh show sys performance; tmsh show ltm virtual <vs> - watch conns and drops" }),
      },
      { id: "E-CAP-3", action: "Check whether a growth event (new site, campaign, batch job) coincides with symptom onset." },
    ],
  },
  {
    id: "H-PATH-MTU",
    title: "Path MTU / fragmentation behavior",
    rationale:
      "Small transactions succeeding while large transfers hang is the classic MTU signature, usually introduced by a tunnel, VPN, or encapsulation added somewhere on the path.",
    supports: [
      "Pings with DF set succeed at 1400 bytes and fail near 1500",
      "A tunnel or overlay was recently introduced on the path",
      "TCP sessions establish, then stall on the first large segment",
    ],
    weakens: ["Transfers fail regardless of size", "Full-size DF probes traverse the path cleanly"],
    evidence: () => [
      { id: "E-MTU-1", action: "Probe the path with do-not-fragment pings at increasing sizes to find the largest that passes.", command: "ping -M do -s 1472 <host> (Linux) / ping -f -l 1472 (Windows), then step down" },
      { id: "E-MTU-2", action: "Trace the path and list every tunnel, VPN, or encapsulation layer on it; check each hop's MTU." },
      { id: "E-MTU-3", action: "Verify whether ICMP 'fragmentation needed' is being filtered anywhere on the path - PMTUD depends on it arriving." },
    ],
  },
  {
    id: "H-CLIENT-LOCAL",
    title: "Client-local environment",
    rationale:
      "A single affected user makes the client environment - its resolver, proxy, cache, security agent, or network segment - the cheapest domain to eliminate first.",
    supports: ["A second machine on the same network reproduces cleanly", "The same user succeeds from a different machine or network"],
    weakens: ["Multiple independent clients on different networks show the same failure"],
    evidence: () => [
      { id: "E-CLI-1", action: "Reproduce from a second machine and from a different network (e.g. a phone hotspot); note which combination fails." },
      { id: "E-CLI-2", action: "Compare the affected client's resolver, proxy, and VPN settings against a working client's." },
      { id: "E-CLI-3", action: "Temporarily rule the endpoint security stack in or out in line with your organization's policy." },
    ],
  },
  {
    id: "H-SHARED-DEPENDENCY",
    title: "Shared upstream dependency",
    rationale:
      "When everyone is affected at once, the fault domain is whatever everyone shares: a core device, a circuit, a provider, an identity provider, or a common backend.",
    supports: [
      "Independent services with only the shared element in common fail together",
      "Provider or platform status reporting matches the window",
      "The shared device's own health or logs mark the onset",
    ],
    weakens: ["Paths bypassing the suspected shared element fail identically"],
    evidence: () => [
      { id: "E-SHD-1", action: "List what every affected service actually shares (device, circuit, provider, IdP, database) - draw it, don't assume it." },
      { id: "E-SHD-2", action: "Check provider/platform status pages and maintenance notices for the exact window." },
      { id: "E-SHD-3", action: "Test one path that deliberately bypasses the suspected shared element." },
    ],
  },
  {
    id: "H-ASYMMETRIC-PATH",
    title: "Asymmetric path or policy divergence",
    rationale:
      "One path working while another fails points at divergence between them: routing asymmetry, an ECMP hash bucket, a policy or NAT rule on one leg, or a stateful device seeing only half the flow.",
    supports: [
      "Traceroutes in each direction take different paths",
      "Failures map to one ECMP member or one firewall of a pair",
      "A stateful device logs half-open or out-of-state drops",
    ],
    weakens: ["Both directions traverse identical, healthy paths"],
    evidence: () => [
      { id: "E-ASY-1", action: "Trace the path in BOTH directions and overlay them; asymmetry itself is normal, asymmetry through stateful devices is the suspect." },
      { id: "E-ASY-2", action: "Compare policy/NAT rules on the diverging legs; look for the flow in each device's session table." },
      { id: "E-ASY-3", action: "If ECMP is in play, pin a test flow to each member (vary source port) and map which member fails." },
    ],
  },
  {
    id: "H-IDENTITY-CHAIN",
    title: "Identity and token chain",
    rationale:
      "Authentication failures usually live in the chain, not the app: the IdP, clock skew breaking token validation, expired signing material, or an audience/issuer mismatch after a change.",
    supports: [
      "IdP status or logs mark errors in the window",
      "Validator clock skew exceeds token tolerance",
      "Tokens inspected show wrong audience/issuer or expired signing keys",
    ],
    weakens: ["Tokens validate cleanly end-to-end and the same credentials work on a sibling app"],
    evidence: (p) => [
      { id: "E-IDN-1", action: "Check the identity provider's status and its logs for the affected window and client set." },
      { id: "E-IDN-2", action: "Compare NTP-synced time on every token validator; skew beyond the allowed window silently invalidates good tokens." },
      {
        id: "E-IDN-3",
        action: "Decode a failing token and verify audience, issuer, expiry, and the signing key id against current metadata.",
        command: cmd(p, { "load-balancer": "if an access policy fronts the app, read its per-session logs for the failing branch" }),
      },
    ],
  },
  {
    id: "H-PARTIAL-BACKEND",
    title: "One unhealthy member behind a balanced service",
    rationale:
      "Intermittent failures hitting some users while others sail through is the signature of one bad member in a pool or ECMP set: whoever hashes to it, hurts.",
    supports: [
      "Failures correlate to one specific member when per-member stats are read",
      "Draining the suspect member clears the symptom",
      "Health monitors flap on exactly one member",
    ],
    weakens: ["Per-member error rates are uniform", "Symptom persists with the suspect member drained"],
    evidence: (p) => [
      {
        id: "E-PBK-1",
        action: "Read per-member health and error counters, not the aggregate; averages hide one bad member.",
        command: cmd(p, { "load-balancer": "tmsh show ltm pool <pool> members - status, cur conns, total fails per member" }),
      },
      { id: "E-PBK-2", action: "Correlate failing user sessions to the specific member that served them (persistence records, logs, response headers)." },
      { id: "E-PBK-3", action: "Drain the suspect member and watch the error rate; a controlled drain is evidence, not remediation." },
    ],
  },
  {
    id: "H-APP-BACKEND",
    title: "Application or backend dependency",
    rationale:
      "Transport succeeding while the application errors moves the domain up the stack: the app process, its configuration, or a dependency behind it (database, queue, downstream API).",
    supports: [
      "Application logs at the serving member show errors matching the window",
      "Bypassing the intermediary and hitting a member directly reproduces the error",
      "A dependency (DB, queue, API) reports degradation in the window",
    ],
    weakens: ["Direct-to-member requests succeed while only the fronted path fails (suspect the intermediary instead)"],
    evidence: (p) => [
      { id: "E-APP-1", action: "Read the application's own logs on the members that served failing requests, at the failure timestamps." },
      {
        id: "E-APP-2",
        action: "Reproduce against a backend member directly, bypassing the fronting layer, and compare.",
        command: cmd(p, { "load-balancer": "curl to the member IP:port with the Host header set - isolates app vs LB" }),
      },
      { id: "E-APP-3", action: "Check the health of the app's own dependencies (database, cache, queue, downstream APIs) for the same window." },
    ],
  },
  {
    id: "H-PROVISIONING-GAP",
    title: "Incomplete provisioning of the new path",
    rationale:
      "A brand-new service that has never worked is a provisioning checklist, not a fault: some link in DNS, addressing, routing advertisement, firewall policy, certificate, or health-check config was never completed.",
    supports: [
      "The service has never worked from the affected vantage point",
      "A checklist walk finds a concrete missing element",
      "It works from one network segment but was never opened from another",
    ],
    weakens: ["The service demonstrably worked before from the same vantage point (then this is a change/regression question instead)"],
    evidence: (p) => [
      { id: "E-PRV-1", action: "Walk the path end to end in order: name resolves -> address routes -> firewall permits -> service listens -> TLS presents -> health checks pass. Stop at the first broken link." },
      {
        id: "E-PRV-2",
        action: "Verify the request actually arrives at the service (packet capture or connection logs at the destination).",
        command: cmd(p, { "load-balancer": "check the virtual server's stats for the test's packets; zero conns means it never arrived" }),
      },
      { id: "E-PRV-3", action: "Compare against a working sibling service's provisioning as a reference checklist." },
    ],
  },
  {
    id: "H-EXTERNAL-PROVIDER",
    title: "External provider or maintenance window",
    rationale:
      "Provider maintenance - announced or otherwise - is a fault domain you verify against their record, not against your own configuration.",
    supports: [
      "Provider status page or maintenance calendar matches the window",
      "Circuits or services from the same provider degrade together",
    ],
    weakens: ["Provider confirms clean health and paths avoiding them fail identically"],
    evidence: () => [
      { id: "E-EXT-1", action: "Pull the provider's status history and maintenance calendar for the exact window; open a ticket referencing your circuit/service IDs." },
      { id: "E-EXT-2", action: "Correlate: do OTHER services from the same provider show the same degradation shape?" },
    ],
  },
];

// ----------------------------------------------------------------------------
// Rule registry. Each rule is a pure predicate over FhbInput plus a scored
// contribution to one hypothesis. Registry ORDER is the deterministic
// tie-break and the "Why this result?" narrative order.
// ----------------------------------------------------------------------------

interface Rule {
  id: string;
  when: (i: FhbInput) => boolean;
  hypothesis: string;
  points: number;
  because: string;
}

const RULES: Rule[] = [
  // --- Change alignment (the king signal) ---
  {
    id: "R-CHG-ALIGN",
    // Internal changes only: provider maintenance aligns to H-EXTERNAL-PROVIDER
    // via R-EXT-ALIGN instead (it is the provider's change, not ours to diff).
    when: (i) =>
      i.timing === "since-change" &&
      i.changed.some((c) => ["config-change", "software-deploy", "network-change", "cert-or-key"].includes(c)),
    hypothesis: "H-CHANGE-REGRESSION",
    points: 45,
    because: "Onset is reported as 'since a change' and an internal change is on record - alignment of the two is the strongest isolation signal.",
  },
  {
    id: "R-CHG-PRESENT",
    when: (i) => i.timing !== "since-change" && i.changed.some((c) => ["config-change", "software-deploy", "network-change"].includes(c)),
    hypothesis: "H-CHANGE-REGRESSION",
    points: 20,
    because: "A config/software/network change is on record even though onset wasn't reported as change-aligned - worth testing the timeline before dismissing it.",
  },
  {
    id: "R-CHG-DEPLOY-5XX",
    when: (i) => i.changed.includes("software-deploy") && i.clues.includes("http-5xx"),
    hypothesis: "H-CHANGE-REGRESSION",
    points: 15,
    because: "Server-side 5xx after a software deploy reinforces the regression hypothesis specifically at the application layer.",
  },
  // --- DNS ---
  {
    id: "R-DNS-BYNAME",
    when: (i) => i.clues.includes("works-by-ip-not-name"),
    hypothesis: "H-DNS-RESOLUTION",
    points: 45,
    because: "Working by IP while failing by name isolates the fault to the resolution path almost by definition.",
  },
  {
    id: "R-DNS-FAILS",
    when: (i) => i.clues.includes("dns-fails"),
    hypothesis: "H-DNS-RESOLUTION",
    points: 35,
    because: "Observed lookup failures put the resolution chain directly in scope.",
  },
  // --- TLS ---
  {
    id: "R-TLS-ERRORS",
    when: (i) => i.clues.includes("tls-errors"),
    hypothesis: "H-TLS-PKI",
    points: 40,
    because: "Handshake errors are observed - the TLS/PKI domain must be tested directly.",
  },
  {
    id: "R-TLS-CERTCHANGE",
    when: (i) => i.changed.includes("cert-or-key"),
    hypothesis: "H-TLS-PKI",
    points: 30,
    because: "Certificate or key material changed recently; the TLS legs touched by it are a primary test target.",
  },
  {
    id: "R-TLS-SILENT-EXPIRY",
    when: (i) => i.clues.includes("tls-errors") && i.changed.length === 1 && i.changed[0] === "nothing-known",
    hypothesis: "H-TLS-PKI",
    points: 10,
    because: "TLS errors with 'nothing changed' fits the silent-expiry pattern: certificates expire without anyone changing anything.",
  },
  // --- Capacity ---
  {
    id: "R-CAP-TOD",
    when: (i) => i.symptom === "slow" && i.timing === "time-of-day",
    hypothesis: "H-CAPACITY-SATURATION",
    points: 35,
    because: "Slowness tracking time of day is the load-following signature of a saturated resource.",
  },
  {
    id: "R-CAP-GROWTH",
    when: (i) => i.changed.includes("capacity-growth"),
    hypothesis: "H-CAPACITY-SATURATION",
    points: 25,
    because: "A known growth event moves capacity ceilings into scope on its own.",
  },
  // --- MTU ---
  {
    id: "R-MTU-LARGE",
    when: (i) => i.clues.includes("slow-only-large-transfers"),
    hypothesis: "H-PATH-MTU",
    points: 45,
    because: "Size-dependent failure (small OK, large stalls) is the classic path-MTU signature.",
  },
  {
    id: "R-MTU-NETCHANGE",
    when: (i) => i.clues.includes("slow-only-large-transfers") && i.changed.includes("network-change"),
    hypothesis: "H-PATH-MTU",
    points: 15,
    because: "A network change alongside size-dependent failure suggests a new tunnel/encapsulation on the path.",
  },
  // --- Scope-driven ---
  {
    id: "R-SCOPE-ONEUSER",
    when: (i) => i.scope === "one-user",
    hypothesis: "H-CLIENT-LOCAL",
    points: 30,
    because: "A single affected user makes the client environment the cheapest domain to eliminate first.",
  },
  {
    id: "R-SCOPE-EVERYONE",
    when: (i) => i.scope === "everyone" && i.symptom === "total-outage",
    hypothesis: "H-SHARED-DEPENDENCY",
    points: 40,
    because: "Everyone down at once points at whatever everyone shares.",
  },
  {
    id: "R-SCOPE-SITE",
    when: (i) => i.scope === "one-site",
    hypothesis: "H-SHARED-DEPENDENCY",
    points: 25,
    because: "One whole site affected points at that site's shared elements: its uplink, its edge devices, its local services.",
  },
  // --- Path asymmetry ---
  {
    id: "R-ASYM-PATH",
    when: (i) => i.clues.includes("one-path-works-other-not"),
    hypothesis: "H-ASYMMETRIC-PATH",
    points: 40,
    because: "Divergent behavior between two paths is observed - test the divergence itself.",
  },
  // --- Identity ---
  {
    id: "R-AUTH-SYMPTOM",
    when: (i) => i.symptom === "auth-failures" || i.clues.includes("http-4xx-auth"),
    hypothesis: "H-IDENTITY-CHAIN",
    points: 40,
    because: "Authentication-shaped failures put the identity chain (IdP, clocks, tokens, signing material) in primary scope.",
  },
  // --- Partial backend ---
  {
    id: "R-PARTIAL-INTERMIT",
    when: (i) => (i.symptom === "intermittent" || i.symptom === "errors-for-some") && (i.scope === "some-users" || i.scope === "one-app"),
    hypothesis: "H-PARTIAL-BACKEND",
    points: 35,
    because: "Some users failing while others succeed on the same service is the one-bad-member signature behind a balanced pool.",
  },
  {
    id: "R-PARTIAL-5XX",
    when: (i) => i.clues.includes("http-5xx") && i.symptom !== "total-outage",
    hypothesis: "H-PARTIAL-BACKEND",
    points: 15,
    because: "Partial 5xx (not a full outage) is consistent with a subset of members erroring.",
  },
  // --- App/backend ---
  {
    id: "R-APP-TCPOK",
    when: (i) => i.clues.includes("tcp-connects-but-app-errors"),
    hypothesis: "H-APP-BACKEND",
    points: 40,
    because: "Transport succeeds and the application errors - the domain moves up the stack to the app and its dependencies.",
  },
  {
    id: "R-APP-5XX",
    when: (i) => i.clues.includes("http-5xx"),
    hypothesis: "H-APP-BACKEND",
    points: 20,
    because: "5xx is the server side declaring its own failure; the serving app's logs are primary evidence.",
  },
  // --- New service ---
  {
    id: "R-NEWSVC",
    when: (i) => i.symptom === "cannot-reach-new-service",
    hypothesis: "H-PROVISIONING-GAP",
    points: 50,
    because: "A service that has never worked is a provisioning walk, not a regression hunt.",
  },
  // --- Provider ---
  {
    id: "R-PROVIDER-MAINT",
    when: (i) => i.changed.includes("provider-maintenance"),
    hypothesis: "H-EXTERNAL-PROVIDER",
    points: 35,
    because: "Known provider maintenance in the window must be verified against their record before deeper internal digging.",
  },
  {
    id: "R-EXT-ALIGN",
    when: (i) => i.timing === "since-change" && i.changed.includes("provider-maintenance"),
    hypothesis: "H-EXTERNAL-PROVIDER",
    points: 15,
    because: "Onset aligned with the provider's maintenance window strengthens the case for verifying their record first.",
  },
  {
    id: "R-PROVIDER-TIMEOUTS-SITE",
    when: (i) => i.clues.includes("timeouts") && i.scope === "one-site",
    hypothesis: "H-EXTERNAL-PROVIDER",
    points: 15,
    because: "Site-wide timeouts are consistent with that site's upstream circuit or provider path degrading.",
  },
];

// ----------------------------------------------------------------------------
// Quality warnings - about the INPUT, not the world.
// ----------------------------------------------------------------------------

function computeWarnings(i: FhbInput, fired: Rule[]): QualityWarning[] {
  const w: QualityWarning[] = [];
  if (i.changed.includes("nothing-known")) {
    w.push({
      id: "W-NOCHANGE",
      message:
        "'Nothing changed' is a hypothesis, not a fact. Verify it against the change record, deployment logs, and provider maintenance calendars before trusting it - most faults follow a change somebody didn't mention.",
    });
  }
  if (i.scope === "everyone" && i.symptom !== "total-outage" && fired.some((r) => r.hypothesis === "H-CLIENT-LOCAL")) {
    w.push({
      id: "W-SCOPE-TENSION",
      message: "Scope 'everyone' with client-local signals is contradictory - re-verify the true scope before spending evidence effort.",
    });
  }
  if (i.clues.length === 0) {
    w.push({
      id: "W-SPARSE-CLUES",
      message:
        "No layer clues selected. The ranking below leans on scope/timing alone; two minutes spent gathering one concrete observation (does it work by IP? does TLS handshake?) will sharpen it considerably.",
    });
  }
  if (i.scope === "one-user" && i.symptom === "total-outage") {
    w.push({
      id: "W-OUTAGE-ONEUSER",
      message: "'Total outage' scoped to one user usually means 'total for that user' - confirm whether anyone else is affected before treating it as an outage.",
    });
  }
  return w;
}

// ----------------------------------------------------------------------------
// Scoring, ranking, artifact
// ----------------------------------------------------------------------------

function signalBand(score: number): SignalStrength {
  if (score >= 60) return "strong";
  if (score >= 30) return "moderate";
  return "weak";
}

const VALID: Record<string, readonly string[]> = {
  symptom: ["total-outage", "intermittent", "slow", "errors-for-some", "auth-failures", "cannot-reach-new-service"],
  scope: ["one-user", "some-users", "one-site", "one-app", "everyone"],
  timing: ["constant", "intermittent-random", "time-of-day", "since-change"],
  preset: ["generic", "load-balancer", "dns", "tls-pki"],
  changed: ["nothing-known", "config-change", "software-deploy", "network-change", "cert-or-key", "capacity-growth", "provider-maintenance"],
  clues: ["dns-fails", "works-by-ip-not-name", "tls-errors", "tcp-connects-but-app-errors", "timeouts", "slow-only-large-transfers", "one-path-works-other-not", "http-5xx", "http-4xx-auth"],
};

/** Validate a structured input (also the API-parity JSON gate). Throws
 *  FhbError("format") with the offending field named - never guesses. */
export function validateInput(raw: unknown): FhbInput {
  const i = raw as Partial<FhbInput>;
  if (!i || typeof i !== "object") throw new FhbError("format", "input must be an object");
  for (const f of ["symptom", "scope", "timing", "preset"] as const) {
    if (typeof i[f] !== "string" || !VALID[f].includes(i[f] as string)) {
      throw new FhbError("format", `invalid ${f}`);
    }
  }
  for (const f of ["changed", "clues"] as const) {
    const arr = i[f];
    if (!Array.isArray(arr) || arr.some((v) => !VALID[f].includes(v as string))) {
      throw new FhbError("format", `invalid ${f}`);
    }
  }
  if ((i.changed as string[]).length === 0) throw new FhbError("format", "changed must not be empty (use nothing-known)");
  return i as FhbInput;
}

/**
 * run - fire the rule registry over a structured input and return ranked
 * hypotheses to test, quality warnings, the fired-rule trail, and the
 * exportable worksheet. Fully deterministic: registry order breaks ties.
 */
export function run(rawInput: FhbInput | unknown): FhbResult {
  const input = validateInput(rawInput);

  // 1. Fire rules in registry order.
  const fired = RULES.filter((r) => r.when(input));

  // 2. Accumulate scores per hypothesis, preserving first-fire order for ties.
  const scoreMap = new Map<string, { score: number; fired: Rule[] }>();
  for (const r of fired) {
    const cur = scoreMap.get(r.hypothesis) ?? { score: 0, fired: [] };
    cur.score += r.points;
    cur.fired.push(r);
    scoreMap.set(r.hypothesis, cur);
  }

  // 3. Materialize + rank (score desc; tie -> first-fired hypothesis first).
  const order = [...scoreMap.keys()];
  const hypotheses: Hypothesis[] = order
    .map((hid) => {
      const def = HYPOTHESES.find((h) => h.id === hid)!;
      const { score, fired: rs } = scoreMap.get(hid)!;
      return {
        id: def.id,
        title: def.title,
        rationale: def.rationale,
        score,
        signal: signalBand(score),
        evidence: def.evidence(input.preset),
        supports: def.supports,
        weakens: def.weakens,
        firedRules: rs.map((r) => ({ ruleId: r.id, points: r.points, because: r.because })),
      };
    })
    .sort((a, b) => b.score - a.score || order.indexOf(a.id) - order.indexOf(b.id));

  const warnings = computeWarnings(input, fired);

  // 4. The worksheet artifact (usable, not decorative).
  const situationLines = [
    `- Symptom: ${input.symptom}`,
    `- Scope: ${input.scope}`,
    `- Recent change: ${input.changed.join(", ")}`,
    `- Timing: ${input.timing}`,
    `- Observed clues: ${input.clues.length ? input.clues.join(", ") : "(none recorded)"}`,
  ];
  if (input.notes?.summary) situationLines.push(`- Summary: ${input.notes.summary}`);
  if (input.notes?.impact) situationLines.push(`- Impact: ${input.notes.impact}`);
  if (input.notes?.alreadyTried) situationLines.push(`- Already tried: ${input.notes.alreadyTried}`);

  const artifact: ExportArtifact = {
    kind: "fault-hypothesis-worksheet",
    title: "Fault hypothesis worksheet",
    sections: [
      ["Situation", situationLines.join("\n")],
      ...(warnings.length ? ([["Input cautions", warnings.map((w) => `- ${w.message}`).join("\n")]] as [string, string][]) : []),
      ...hypotheses.map((h, idx): [string, string] => [
        `Hypothesis ${idx + 1} (signal: ${h.signal}) - ${h.title}`,
        [
          h.rationale,
          "",
          "Evidence to collect:",
          ...h.evidence.map((e) => `- [ ] ${e.action}${e.command ? `\n      \`${e.command}\`` : ""}`),
          "",
          "Would support: " + h.supports.join("; "),
          "Would weaken: " + h.weakens.join("; "),
        ].join("\n"),
      ]),
      [
        "Method note",
        "This worksheet structures hypotheses to TEST, ranked by deterministic rules over the described situation. It is not a diagnosis; evidence decides. Generated locally in the browser - nothing was uploaded.",
      ],
    ],
  };

  return { hypotheses, warnings, firedRuleIds: fired.map((r) => r.id), presetUsed: input.preset, artifact };
}

/** API-parity entry (D-72): structured JSON string in, result out. */
export function runFromJson(json: string): FhbResult {
  const trimmed = json.trim();
  if (trimmed === "") throw new FhbError("empty");
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new FhbError("format", "input must be a JSON object (see the tool doc for the schema)");
  }
  return run(parsed);
}

export { artifactToMarkdown };
export const RULE_COUNT = RULES.length;
export const HYPOTHESIS_COUNT = HYPOTHESES.length;
