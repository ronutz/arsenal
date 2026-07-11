// ============================================================================
// src/lib/tools/f5xc-ce-egress-checklist/compute.ts
// ----------------------------------------------------------------------------
// F5 Distributed Cloud (XC) Customer Edge egress checklist & verifier generator.
// Pure logic, offline.
//
// ANTI-STALENESS BY DESIGN: the primary input is F5's own published plain-text
// file ("F5 Customer Edge IP Address and Domain Reference", downloadable for
// automation). The tool PARSES what you paste - it never ships a hardcoded
// allowlist that can rot. A provenance line always states what was parsed.
//
// The static port matrix and the site-to-site (SMG / DC-CG) rules are NOT in
// the file; they are transcribed from the reference document's tables
// (docs.cloud.f5.com/.../reference/ce-ip-dom-ref, last modified 2026-05-27;
// retrieved 2026-07-11). The CE-side curl-host verification command follows the
// documented CE serviceability method.
// ============================================================================

export type SiteType = "smsv2" | "legacy" | "both";
export type Scope = "smsv2" | "legacy" | "common";
export type EntryKind = "ip" | "cidr" | "domain" | "wildcard";

export interface Entry {
  value: string;
  kind: EntryKind;
  scope: Scope;
  purpose: string;
}

export interface Bucket {
  id: string;
  label: string;
  domains: string[];
  ips: string[];
}

export interface ParseResult {
  ok: boolean;
  error?: string;
  entries: Entry[];
  counts: { ip: number; cidr: number; domain: number; wildcard: number; total: number };
  lineCount: number;
}

// -- Purpose labels (ordered for display) --
export const PURPOSE_LABELS: Record<string, string> = {
  registration: "Registration & updates",
  "re-connectivity": "Regional Edge connectivity",
  "f5-domains": "F5 Distributed Cloud domains",
  feeds: "Reputation & URL-classification feeds",
  cdn: "Content delivery network",
  "dns-transfer": "Secondary DNS zone transfer",
  logging: "Global Log Receiver",
  health: "DNSLB health checks",
  bot: "Bot Defense",
  "data-intel": "Data Intelligence",
  dns: "Default DNS",
  ntp: "Default NTP",
  domains: "Egress domains",
  other: "Other",
};
const PURPOSE_ORDER = Object.keys(PURPOSE_LABELS);

// -- The static port/protocol matrix, verbatim from the reference tables. --
export interface PortRow {
  service: string;
  protocol: string;
  ports: string;
  note: string;
}
export const PORT_MATRIX: readonly PortRow[] = Object.freeze([
  { service: "Site registration & updates", protocol: "TCP", ports: "443", note: "To 159.60.141.140 (SMSv2) or the registration domains." },
  { service: "Regional Edge connectivity", protocol: "TCP", ports: "80, 443", note: "Per-region RE ranges." },
  { service: "Regional Edge connectivity", protocol: "UDP", ports: "4500, 123", note: "IPsec/UDP 4500 is optional - SSL tunneling to the global network is supported. Port 123 is the RE's NTP." },
  { service: "Default DNS (F5-provided)", protocol: "TCP/UDP", ports: "53", note: "8.8.8.8 / 8.8.4.4. Not required if you use custom DNS." },
  { service: "Default NTP (F5-provided)", protocol: "UDP", ports: "123", note: "216.239.35.0/4/8/12. Not required if you use custom NTP." },
  { service: "Local UI / API", protocol: "TCP", ports: "65500", note: "Reserved for local access, NOT an egress rule - block or allow as needed." },
]);

// -- Site-to-site and multi-node rules (optional), from the reference. --
export interface RuleBlock {
  id: string;
  label: string;
  lines: string[];
}
export const OPTIONAL_RULES: readonly RuleBlock[] = Object.freeze([
  {
    id: "multinode",
    label: "Multi-node site (3+ nodes)",
    lines: ["Allow all traffic between the nodes' SLO interfaces, in both directions (each per-NIC firewall must allow it)."],
  },
  {
    id: "smg",
    label: "Site Mesh Group (SMG) - IPsec between CEs",
    lines: [
      "UDP 500  - IKE (Phase 1)",
      "UDP 4500 - NAT-T (NAT traversal)",
      "IP protocol 50 - ESP (payload)",
      "Bidirectional: either CE may initiate, so allow both directions between all node pairs across the two sites.",
    ],
  },
  {
    id: "dccg",
    label: "DC Cluster Group (DC-CG) - IP-in-IP between CEs",
    lines: ["UDP 6080 - IP-in-IP, bidirectional between all node pairs across the two sites."],
  },
  {
    id: "cloudconnect",
    label: "Cloud Connect (AWS)",
    lines: ["IP protocol 47 (GRE), SLI interface outbound, to the Transit Gateway GRE address or CIDR."],
  },
]);

const RE_IP = /^\d{1,3}(?:\.\d{1,3}){3}$/;
const RE_CIDR = /^\d{1,3}(?:\.\d{1,3}){3}\/\d{1,2}$/;
const RE_WILDCARD = /^\*\.[a-z0-9.-]+\.[a-z]{2,}$/i;
const RE_DOMAIN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9-]+)*\.[a-z]{2,}$/i;

/** Map a heading's text to a purpose bucket (most specific first). Returns
 *  null when nothing matches, so a sub-heading inherits the current purpose. */
function purposeFor(h: string): string | null {
  const s = h.toLowerCase();
  if (s.includes("reputation")) return "feeds";
  if (s.includes("classification") || s.includes("webroot")) return "feeds";
  // DNS/NTP first: their headings read "Default DNS for Site Registration...".
  if (s.includes("default dns")) return "dns";
  if (s.includes("default ntp")) return "ntp";
  if (s.includes("regional edge") || s.includes("connecting to f5 distributed cloud regional")) return "re-connectivity";
  if (s.includes("registration")) return "registration";
  if (s.includes("content distribution") || s.includes("content delivery") || s.includes("cdn")) return "cdn";
  if (s.includes("secondary dns") || s.includes("zone transfer")) return "dns-transfer";
  if (s.includes("log receiver")) return "logging";
  if (s.includes("dnslb") || s.includes("health check")) return "health";
  if (s.includes("bot defense")) return "bot";
  if (s.includes("data intelligence") || s.includes("us region") || s.includes("eu region")) return "data-intel";
  if (s.includes("default dns")) return "dns";
  if (s.includes("default ntp")) return "ntp";
  if (s.includes("f5 domains") || s.includes("wildcard") || s.includes("fqdn")) return "f5-domains";
  if (s.includes("egress domain")) return "domains";
  return null;
}

/** Note-style comment lines that must not reset the section. */
function isNoteLine(h: string): boolean {
  return /-or-|use a|use the|please use|these are|not required|combines the|reserved for|potential to change/i.test(h);
}

function classify(tok: string): EntryKind | null {
  if (RE_CIDR.test(tok)) return "cidr";
  if (RE_IP.test(tok)) return "ip";
  if (RE_WILDCARD.test(tok)) return "wildcard";
  if (RE_DOMAIN.test(tok)) return "domain";
  return null;
}

export function parseCeFile(text: string): ParseResult {
  if (text.trim() === "") return { ok: false, error: "Paste F5's downloadable CE IP/domain reference file.", entries: [], counts: { ip: 0, cidr: 0, domain: 0, wildcard: 0, total: 0 }, lineCount: 0 };

  const lines = text.split(/\r?\n/);
  let scope: Scope = "common";
  let purpose = "other";
  const entries: Entry[] = [];
  const seen = new Set<string>();

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line === "") continue;

    if (line.startsWith("#")) {
      const headingText = line.replace(/^#+\s*/, "");
      if (isNoteLine(headingText)) continue; // instruction, not a section
      // scope-setting headings
      const hl = headingText.toLowerCase();
      if (hl.includes("secure mesh") && hl.includes("v2")) scope = "smsv2";
      else if (hl.includes("legacy")) scope = "legacy";
      else if (hl.includes("saas services") || hl.includes("bot defense") || hl.includes("data intelligence") || hl.includes("additional firewall")) scope = "common";
      const p = purposeFor(headingText);
      if (p) purpose = p; // otherwise inherit the current purpose
      continue;
    }

    // data line: may hold multiple tokens (e.g. "*.gcr.io gcr.io storage.googleapis.com")
    for (const tok of line.split(/\s+/)) {
      const kind = classify(tok);
      if (!kind) continue;
      const key = `${tok}|${scope}|${purpose}`;
      if (seen.has(key)) continue;
      seen.add(key);
      entries.push({ value: tok, kind, scope, purpose });
    }
  }

  const counts = {
    ip: entries.filter((e) => e.kind === "ip").length,
    cidr: entries.filter((e) => e.kind === "cidr").length,
    domain: entries.filter((e) => e.kind === "domain").length,
    wildcard: entries.filter((e) => e.kind === "wildcard").length,
    total: entries.length,
  };
  return { ok: true, entries, counts, lineCount: lines.filter((l) => l.trim() !== "").length };
}

/** True if an entry applies to the selected site type. */
function inScope(scope: Scope, site: SiteType): boolean {
  if (site === "both") return true;
  return scope === site || scope === "common";
}

export interface AllowlistResult {
  buckets: Bucket[];
  flatDomains: string[]; // domains + wildcards, deduped, sorted
  flatIps: string[]; // ips + cidrs, deduped, sorted
}

export function buildAllowlist(parse: ParseResult, site: SiteType): AllowlistResult {
  const scoped = parse.entries.filter((e) => inScope(e.scope, site));
  const byPurpose = new Map<string, { domains: Set<string>; ips: Set<string> }>();
  for (const e of scoped) {
    if (!byPurpose.has(e.purpose)) byPurpose.set(e.purpose, { domains: new Set(), ips: new Set() });
    const b = byPurpose.get(e.purpose)!;
    if (e.kind === "domain" || e.kind === "wildcard") b.domains.add(e.value);
    else b.ips.add(e.value);
  }
  const buckets: Bucket[] = PURPOSE_ORDER.filter((p) => byPurpose.has(p)).map((p) => {
    const b = byPurpose.get(p)!;
    return { id: p, label: PURPOSE_LABELS[p], domains: [...b.domains].sort(), ips: [...b.ips].sort() };
  });

  const allDomains = new Set<string>();
  const allIps = new Set<string>();
  for (const e of scoped) {
    if (e.kind === "domain" || e.kind === "wildcard") allDomains.add(e.value);
    else allIps.add(e.value);
  }
  return { buckets, flatDomains: [...allDomains].sort(), flatIps: [...allIps].sort() };
}

/** Generate a CE-side verification script (documented curl-host method). */
export function verifierScript(domains: string[]): string {
  const header = "# Run from a CE node serviceability shell. Each line should return an HTTP status.";
  const body = domains.map((d) => `curl-host -kL --connect-timeout 10 https://${d}`);
  return [header, ...body].join("\n");
}

/** D-49 run entrypoint: parse the pasted file (defaults to both site types). */
export function run(input: string) {
  const parse = parseCeFile(input);
  if (!parse.ok) return parse;
  const allow = buildAllowlist(parse, "both");
  return { ...parse, buckets: allow.buckets, flatDomains: allow.flatDomains, flatIps: allow.flatIps };
}
