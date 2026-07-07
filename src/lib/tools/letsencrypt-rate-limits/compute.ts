// ============================================================================
// src/lib/tools/letsencrypt-rate-limits/compute.ts
// ----------------------------------------------------------------------------
// Let's Encrypt rate-limit planner.
//
// Given the set of hostnames you intend to put on certificates, this groups
// them by REGISTERED DOMAIN (eTLD+1) -- the unit Let's Encrypt counts against
// for its per-domain issuance limit -- and works out how they map onto the
// concrete limits: how few certificates they need (up to 100 names each), where
// a wildcard would collapse several subdomains, and whether a naive one-cert-
// per-name approach would blow the 50-per-registered-domain-per-week limit.
//
// The registered-domain grouping is delegated to the Public Suffix List engine
// (../public-suffix), so it is correct for multi-label eTLDs (co.uk, com.br)
// rather than guessed from the last two labels. The limit numbers below are a
// DATED, SOURCED snapshot of https://letsencrypt.org/docs/rate-limits/ and the
// Integration Guide (see LE_LIMITS); they change over time, so the tool shows
// the date and links the source rather than pretending to be authoritative.
// Everything runs locally; no network, no secrets.
// ============================================================================

import { run as resolveDomain } from "../public-suffix";

/**
 * Concrete Let's Encrypt production limits, as documented on
 * https://letsencrypt.org/docs/rate-limits/ and the Integration Guide.
 * Snapshot date is when these were last verified against the source; the tool
 * surfaces both so a stale value is obvious. These are the mechanism's steady-
 * state ceilings (it is a token bucket that refills over time).
 */
export const LE_LIMITS = Object.freeze({
  /** New certificates per registered domain, per 7 days (global across accounts). */
  certsPerRegisteredDomainPerWeek: 50,
  /** New orders per account, per 3 hours. */
  ordersPerAccountPer3h: 300,
  /** New certificates for the same exact set of identifiers, per 7 days. */
  certsPerExactSetPerWeek: 5,
  /** Maximum identifiers (DNS names or IPs) on a single certificate. */
  maxNamesPerCert: 100,
  /** Authorization failures per identifier per account, per hour. */
  authFailuresPerHour: 5,
  /** When these numbers were last checked against the source. */
  snapshotDate: "2026-07-07",
  sourceUrl: "https://letsencrypt.org/docs/rate-limits/",
});

/** One registered-domain group in the plan. */
export interface LeDomainGroup {
  /** The registered domain (eTLD+1) all these names count against. */
  registeredDomain: string;
  /** The intended hostnames that fall under it (sorted, de-duplicated). */
  names: string[];
  /** How many names -- i.e. how much of the 50/week budget one-per-name would cost. */
  count: number;
  /** Fewest certificates needed if names are packed up to 100 per certificate. */
  minCertificates: number;
  /** True when count exceeds the 50-per-registered-domain-per-week limit. */
  exceedsWeeklyIfOneCertPerName: boolean;
  /** Parents under which >=2 direct subdomains appear, so "*.parent" would cover them. */
  wildcardCandidates: string[];
}

/** Full planner result. */
export interface LeRateLimitResult {
  /** Per-registered-domain groups, most names first. */
  groups: LeDomainGroup[];
  /** IP-address inputs, which use their own unit (exact IPv4 / containing IPv6 /64). */
  ipAddresses: { ipv4: string[]; ipv6: string[] };
  /** Inputs that were not valid hostnames or IPs. */
  invalid: string[];
  /** Total distinct intended hostnames across all groups. */
  totalNames: number;
  /** Number of distinct registered domains involved. */
  registeredDomainCount: number;
  /** Fewest certificates overall if names are packed (sum over groups). */
  minCertificatesTotal: number;
  /** True if any single registered domain would exceed 50/week one-cert-per-name. */
  anyDomainExceedsWeekly: boolean;
  /** The dated, sourced limit snapshot used. */
  limits: typeof LE_LIMITS;
}

/** Split raw input into candidate hostnames (newline / comma / whitespace separated). */
function splitInput(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Plan Let's Encrypt issuance for a set of intended certificate names.
 * @param input `{ names }` a string of hostnames separated by newlines, commas,
 *              or spaces. A leading "*." on any name is handled by the resolver.
 */
export async function run(input: { names: string }): Promise<LeRateLimitResult> {
  const raw = (input?.names ?? "").toString();
  const candidates = Array.from(new Set(splitInput(raw)));

  const byDomain = new Map<string, Set<string>>();
  const ipv4: string[] = [];
  const ipv6: string[] = [];
  const invalid: string[] = [];

  for (const name of candidates) {
    const r = await resolveDomain({ host: name });
    if (r.kind === "ipv4") {
      ipv4.push(r.input);
    } else if (r.kind === "ipv6") {
      ipv6.push(r.input);
    } else if (r.kind === "domain" && r.registrableDomain) {
      const key = r.registrableDomain;
      if (!byDomain.has(key)) byDomain.set(key, new Set());
      // Store the normalised host from the resolver (lowercased, punycode).
      byDomain.get(key)!.add(r.input);
    } else {
      // A bare public suffix (e.g. "co.uk") or an unparseable input.
      invalid.push(name);
    }
  }

  const groups: LeDomainGroup[] = [];
  for (const [registeredDomain, nameSet] of byDomain) {
    const names = Array.from(nameSet).sort();
    const count = names.length;

    // Wildcard candidates: parents with >=2 DIRECT children (single label under
    // the parent), which a single "*.parent" certificate name would cover.
    const directChildrenByParent = new Map<string, number>();
    for (const n of names) {
      const labels = n.split(".");
      // The parent is everything after the first label; a direct child has the
      // parent exactly one label shorter than the child.
      if (labels.length >= 2) {
        const parent = labels.slice(1).join(".");
        directChildrenByParent.set(parent, (directChildrenByParent.get(parent) ?? 0) + 1);
      }
    }
    const wildcardCandidates = Array.from(directChildrenByParent.entries())
      .filter(([, c]) => c >= 2)
      .map(([parent]) => `*.${parent}`)
      .sort();

    groups.push({
      registeredDomain,
      names,
      count,
      minCertificates: Math.ceil(count / LE_LIMITS.maxNamesPerCert),
      exceedsWeeklyIfOneCertPerName: count > LE_LIMITS.certsPerRegisteredDomainPerWeek,
      wildcardCandidates,
    });
  }

  // Most names first, then alphabetical for stable output.
  groups.sort((a, b) => b.count - a.count || a.registeredDomain.localeCompare(b.registeredDomain));

  const totalNames = groups.reduce((s, g) => s + g.count, 0);
  const minCertificatesTotal = groups.reduce((s, g) => s + g.minCertificates, 0);

  return {
    groups,
    ipAddresses: { ipv4: ipv4.sort(), ipv6: ipv6.sort() },
    invalid: invalid.sort(),
    totalNames,
    registeredDomainCount: groups.length,
    minCertificatesTotal,
    anyDomainExceedsWeekly: groups.some((g) => g.exceedsWeeklyIfOneCertPerName),
    limits: LE_LIMITS,
  };
}
