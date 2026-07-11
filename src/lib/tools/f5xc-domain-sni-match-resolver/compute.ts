// ============================================================================
// src/lib/tools/f5xc-domain-sni-match-resolver/compute.ts
// ----------------------------------------------------------------------------
// Resolves which F5 Distributed Cloud (XC) HTTP load balancer wins a given
// hostname, across one or more LBs' domain lists. Pure, offline.
//
// Verified 2026-07-11 against F5's load-balancing/mesh concept doc and the
// DevCentral "Listener Logic" article:
//   - Among LBs sharing an IP+Port (advertise policy), XC picks the MOST
//     SPECIFIC domain match. An exact FQDN beats a wildcard.
//   - The hostname comes from SNI (HTTPS) or the Host header (HTTP).
//   - A wildcard `*.foo.com` is a suffix match for subdomains; it does NOT
//     cover the apex `foo.com`. A wildcard TLS cert covers a single label.
//   - One LB per advertise policy may be the Default LB, catching anything not
//     matched by a more specific domain (HTTPS only).
//   - F5 warns: do not add both a wildcard (`*.example.com`) and the apex
//     (`example.com`) if using an automatic certificate for different LBs.
// Precedence encoded: exact > longest-suffix wildcard > default > no match.
// ============================================================================

export interface LB {
  name: string;
  domains: string[];
  default?: boolean; // marked as the Default LB for this advertise policy
}

export type MatchType = "exact" | "wildcard" | "default";

export interface MatchCandidate {
  lbName: string;
  domain: string;
  matchType: MatchType;
  specificity: number;
  extraLabels: number; // labels between hostname and the wildcard base (>1 = cert caveat)
}

export interface Warning {
  code: string;
  params: Record<string, string>;
}

export interface ResolveResult {
  ok: boolean;
  error?: string;
  hostname: string;
  winner: MatchCandidate | null;
  runnerUp: MatchCandidate | null;
  resolution: "exact" | "wildcard" | "default" | "none";
  warnings: Warning[];
}

/** Split "host:port" -> [host, port?]. */
function splitPort(s: string): [string, string | undefined] {
  const i = s.lastIndexOf(":");
  if (i > 0 && /^\d+$/.test(s.slice(i + 1))) return [s.slice(0, i), s.slice(i + 1)];
  return [s, undefined];
}

function labelCount(s: string): number {
  return s.split(".").filter(Boolean).length;
}

/** Match one domain entry against a hostname; null if no match. */
function matchDomain(domainRaw: string, hostRaw: string): Omit<MatchCandidate, "lbName"> | null {
  const domain = domainRaw.trim().toLowerCase();
  const host = hostRaw.trim().toLowerCase().replace(/\.$/, "");
  const [dHost, dPort] = splitPort(domain);
  const [hHost, hPort] = splitPort(host);

  // port must match when the domain specifies one
  if (dPort !== undefined && dPort !== hPort) return null;

  if (dHost.startsWith("*.")) {
    const base = dHost.slice(1); // ".foo.com"
    if (hHost.endsWith(base) && hHost.length > base.length) {
      const prefix = hHost.slice(0, hHost.length - base.length); // labels before .foo.com
      const extraLabels = labelCount(prefix); // 1 for a normal subdomain
      // longer suffix (more labels in base) = more specific wildcard
      return { domain: domainRaw.trim(), matchType: "wildcard", specificity: 50 + labelCount(base), extraLabels };
    }
    return null;
  }

  // exact match
  if (dHost === hHost) return { domain: domainRaw.trim(), matchType: "exact", specificity: 1000 + labelCount(dHost), extraLabels: 0 };
  return null;
}

export function resolve(lbs: LB[], hostnameRaw: string): ResolveResult {
  const hostname = hostnameRaw.trim();
  const base: ResolveResult = { ok: true, hostname, winner: null, runnerUp: null, resolution: "none", warnings: [] };
  if (hostname === "") return { ...base, ok: false, error: "Enter a test hostname." };

  // gather candidates
  const candidates: MatchCandidate[] = [];
  for (const lb of lbs) {
    for (const d of lb.domains) {
      const m = matchDomain(d, hostname);
      if (m) candidates.push({ lbName: lb.name, ...m });
    }
  }
  candidates.sort((a, b) => b.specificity - a.specificity);

  const warnings: Warning[] = [];

  // structural warnings independent of the hostname
  const exactOwners = new Map<string, Set<string>>();
  const apexSet = new Set<string>();
  const wildcardBases = new Set<string>();
  const defaults: string[] = [];
  for (const lb of lbs) {
    if (lb.default) defaults.push(lb.name);
    for (const d of lb.domains) {
      const [dHost] = splitPort(d.trim().toLowerCase());
      if (dHost.startsWith("*.")) wildcardBases.add(dHost.slice(2));
      else {
        apexSet.add(dHost);
        if (!exactOwners.has(dHost)) exactOwners.set(dHost, new Set());
        exactOwners.get(dHost)!.add(lb.name);
      }
    }
  }
  for (const [d, owners] of exactOwners) {
    if (owners.size > 1) warnings.push({ code: "dup-exact", params: { domain: d, lbs: [...owners].join(", ") } });
  }
  for (const b of wildcardBases) {
    if (apexSet.has(b)) warnings.push({ code: "auto-cert-conflict", params: { base: b } });
  }
  if (defaults.length > 1) warnings.push({ code: "multi-default", params: { lbs: defaults.join(", ") } });

  if (candidates.length === 0) {
    const def = lbs.find((l) => l.default);
    if (def) {
      const winner: MatchCandidate = { lbName: def.name, domain: "(default)", matchType: "default", specificity: 0, extraLabels: 0 };
      return { ...base, winner, resolution: "default", warnings };
    }
    return { ...base, resolution: "none", warnings };
  }

  const winner = candidates[0];
  const runnerUp = candidates[1] ?? null;
  if (runnerUp && runnerUp.specificity === winner.specificity && runnerUp.lbName !== winner.lbName) {
    warnings.push({ code: "ambiguity", params: { host: hostname, a: winner.lbName, b: runnerUp.lbName } });
  }
  if (winner.matchType === "wildcard" && winner.extraLabels > 1) {
    warnings.push({ code: "wildcard-cert-multilabel", params: { host: hostname, domain: winner.domain } });
  }

  return { ...base, winner, runnerUp, resolution: winner.matchType, warnings };
}

/** D-49 run entrypoint: JSON string of { hostname, loadBalancers }. */
export function run(input: string): ResolveResult {
  const fail = (error: string): ResolveResult => ({ ok: false, error, hostname: "", winner: null, runnerUp: null, resolution: "none", warnings: [] });
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    return fail('Provide JSON: { "hostname": "app.example.com", "loadBalancers": [{ "name": "lb1", "domains": ["*.example.com"] }] }');
  }
  const p = (parsed ?? {}) as Record<string, unknown>;
  const hostname = typeof p.hostname === "string" ? p.hostname : "";
  const rawLbs = Array.isArray(p.loadBalancers) ? p.loadBalancers : Array.isArray(parsed) ? (parsed as unknown[]) : [];
  const lbs: LB[] = rawLbs
    .filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null)
    .map((x) => ({
      name: typeof x.name === "string" ? x.name : "(unnamed)",
      domains: Array.isArray(x.domains) ? x.domains.filter((d): d is string => typeof d === "string") : [],
      default: x.default === true,
    }));
  return resolve(lbs, hostname);
}
