// ============================================================================
// src/lib/tools/public-suffix/compute.ts
// ----------------------------------------------------------------------------
// Public Suffix / registered-domain (eTLD+1) resolver.
//
// Given a hostname, this determines:
//   - the public suffix (eTLD)         -- the boundary under which anyone can
//                                          register, e.g. "com", "co.uk";
//   - the registered domain (eTLD+1)   -- the public suffix plus one label,
//                                          e.g. "example.com", "example.co.uk";
//   - which PSL section decided it      -- ICANN or PRIVATE.
//
// It implements the algorithm published at https://publicsuffix.org/list/ :
//   1. A hostname matches a rule if its labels equal the rule's labels; a "*"
//      label in a rule matches any single label.
//   2. If more than one rule matches, an exception rule (leading "!") wins;
//      otherwise the rule with the most labels wins.
//   3. If the prevailing rule is an exception, drop its leftmost label.
//   4. The public suffix is the set of labels matched by the prevailing rule.
//   5. If no rule matches, the prevailing rule is the implicit "*", so the
//      public suffix is the rightmost label.
//   6. The registered domain is the public suffix plus the next label to the
//      left (only if such a label exists).
//
// Everything is computed locally from the bundled list -- no network, no guess.
// The list is a point-in-time snapshot (see psl-data.ts); results reflect that
// snapshot, and the module is designed to be refreshed by regenerating the data.
// ============================================================================

import { PSL_ICANN, PSL_PRIVATE } from "./psl-data";

/** Shape returned by {@link run}. */
export interface PublicSuffixResult {
  /** The normalised host that was analysed (lowercased, punycode, no port/path). */
  input: string;
  /** What kind of input this is: a domain name, an IP address, or invalid. */
  kind: "domain" | "ipv4" | "ipv6" | "invalid";
  /** The public suffix (eTLD) under the full list, e.g. "co.uk"; null if N/A. */
  publicSuffix: string | null;
  /** The registered domain (eTLD+1), e.g. "example.co.uk"; null if the host is
   *  itself a public suffix or has no label above the suffix. */
  registrableDomain: string | null;
  /** Labels to the left of the registered domain, e.g. "www.api"; "" if none. */
  subdomain: string;
  /** Which section's rule prevailed: the browser-enforced ICANN boundary, or a
   *  vendor-delegated PRIVATE suffix (e.g. github.io, *.compute.amazonaws.com). */
  section: "icann" | "private";
  /** The prevailing PSL rule (e.g. "co.uk", "*.ck", "!www.ck", or "*"). */
  rule: string;
  /** True when the rule was an exception (leading "!") rule. */
  isException: boolean;
  /** True when the host is itself a public suffix (nothing is registrable above it). */
  hostIsPublicSuffix: boolean;
  /** When section === "private", the ICANN-only view (what cert rate limits and
   *  the browser same-site boundary use); otherwise null. */
  icann: { publicSuffix: string | null; registrableDomain: string | null } | null;
  /** Human-readable note for edge cases (IP addresses, wildcards, unknown TLDs). */
  note?: string;
}

// --- lazily parsed rule sets (parsed once, then memoised) -------------------
let _icann: Set<string> | null = null;
let _all: Set<string> | null = null;
let _private: Set<string> | null = null;

function icannSet(): Set<string> {
  if (!_icann) _icann = new Set(PSL_ICANN.split("\n").filter(Boolean));
  return _icann;
}
function privateSet(): Set<string> {
  if (!_private) _private = new Set(PSL_PRIVATE.split("\n").filter(Boolean));
  return _private;
}
function allSet(): Set<string> {
  if (!_all) {
    _all = new Set(icannSet());
    for (const r of privateSet()) _all.add(r);
  }
  return _all;
}

/** Outcome of running the PSL algorithm over one rule set. */
interface RuleMatch {
  /** Number of labels in the resulting public suffix. */
  publicSuffixLabelCount: number;
  /** The prevailing rule, as stored (e.g. "co.uk", "*.ck", "!www.ck", or "*"). */
  rule: string;
  isException: boolean;
}

/**
 * Find the prevailing rule for `labels` within `rules`, per the PSL algorithm.
 * `labels` are the host's labels, left to right (e.g. ["www","example","co","uk"]).
 */
function findRule(labels: string[], rules: Set<string>): RuleMatch {
  const n = labels.length;

  // Step 2 (part 1): exception rules win outright. An exception rule matches
  // when "!" + <some suffix of the host> is present. The public suffix then
  // excludes that suffix's leftmost label.
  for (let i = 0; i < n; i++) {
    const candidate = labels.slice(i).join(".");
    if (rules.has("!" + candidate)) {
      return { publicSuffixLabelCount: n - (i + 1), rule: "!" + candidate, isException: true };
    }
  }

  // Step 2 (part 2): otherwise the longest matching normal/wildcard rule wins.
  // Iterating i from 0 upward tests the longest candidate suffix first, so the
  // first hit is the longest match.
  for (let i = 0; i < n; i++) {
    const candidate = labels.slice(i).join(".");
    if (rules.has(candidate)) {
      return { publicSuffixLabelCount: n - i, rule: candidate, isException: false };
    }
    // Wildcard "*.parent" matches candidate == <label>.parent.
    const parent = labels.slice(i + 1).join(".");
    if (parent && rules.has("*." + parent)) {
      return { publicSuffixLabelCount: n - i, rule: "*." + parent, isException: false };
    }
  }

  // Step 5: no rule matched -> implicit "*", so the public suffix is the last label.
  return { publicSuffixLabelCount: 1, rule: "*", isException: false };
}

/** Build the {publicSuffix, registrableDomain} pair from a match over `labels`. */
function toDomains(labels: string[], m: RuleMatch): {
  publicSuffix: string | null;
  registrableDomain: string | null;
} {
  const n = labels.length;
  const psCount = Math.min(m.publicSuffixLabelCount, n);
  const publicSuffix = psCount > 0 ? labels.slice(n - psCount).join(".") : null;
  // Registered domain needs one more label to the left of the public suffix.
  const registrableDomain = n > psCount ? labels.slice(n - psCount - 1).join(".") : null;
  return { publicSuffix, registrableDomain };
}

// --- input normalisation ----------------------------------------------------
const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

/**
 * Normalise raw user input to a bare, lowercased, punycode hostname. Uses the
 * URL parser so schemes, ports, paths and IDNs are handled uniformly; a leading
 * "*." wildcard label is stripped (and reported by the caller).
 */
function normalizeHost(raw: string): { host: string; wasWildcard: boolean } {
  let s = raw.trim();
  let wasWildcard = false;
  if (s.startsWith("*.")) {
    wasWildcard = true;
    s = s.slice(2);
  }
  try {
    const u = new URL(s.includes("://") ? s : "http://" + s);
    // hostname is already lowercased + punycoded; IPv6 arrives bracketed.
    let host = u.hostname.replace(/^\[/, "").replace(/\]$/, "").replace(/\.$/, "");
    return { host, wasWildcard };
  } catch {
    return { host: s.toLowerCase().replace(/\.$/, ""), wasWildcard };
  }
}

function isIpv4(host: string): boolean {
  const m = host.match(IPV4_RE);
  if (!m) return false;
  return m.slice(1).every((o) => Number(o) <= 255);
}

/**
 * Resolve the public suffix and registered domain for a hostname.
 * @param input An object with a `host` string (a hostname, optionally with a
 *              scheme/port/path or a leading "*." wildcard).
 */
export async function run(input: { host: string }): Promise<PublicSuffixResult> {
  const raw = (input?.host ?? "").toString();
  const { host, wasWildcard } = normalizeHost(raw);

  // Empty / clearly-not-a-host inputs.
  if (!host) {
    return {
      input: host, kind: "invalid", publicSuffix: null, registrableDomain: null,
      subdomain: "", section: "icann", rule: "*", isException: false,
      hostIsPublicSuffix: false, icann: null, note: "Enter a hostname such as www.example.co.uk.",
    };
  }

  // IP addresses are not domains. Report them plainly, with the cert-rate-limit
  // unit Let's Encrypt uses (exact IPv4 address; containing IPv6 /64).
  if (isIpv4(host)) {
    return {
      input: host, kind: "ipv4", publicSuffix: null, registrableDomain: null,
      subdomain: "", section: "icann", rule: "*", isException: false,
      hostIsPublicSuffix: false, icann: null,
      note: "This is an IPv4 address, not a domain. It has no public suffix; for certificate rate limits the unit is the exact address.",
    };
  }
  if (host.includes(":")) {
    return {
      input: host, kind: "ipv6", publicSuffix: null, registrableDomain: null,
      subdomain: "", section: "icann", rule: "*", isException: false,
      hostIsPublicSuffix: false, icann: null,
      note: "This is an IPv6 address, not a domain. It has no public suffix; for certificate rate limits the unit is the containing /64.",
    };
  }

  const labels = host.split(".");
  if (labels.some((l) => l.length === 0)) {
    return {
      input: host, kind: "invalid", publicSuffix: null, registrableDomain: null,
      subdomain: "", section: "icann", rule: "*", isException: false,
      hostIsPublicSuffix: false, icann: null, note: "That does not look like a valid hostname (empty label).",
    };
  }

  // Run the algorithm against the full list (ICANN + PRIVATE) for the primary
  // answer, and against ICANN-only so we can report both when a private rule wins.
  const mAll = findRule(labels, allSet());
  const all = toDomains(labels, mAll);
  const section: "icann" | "private" = privateSet().has(mAll.rule) ? "private" : "icann";

  let icann: PublicSuffixResult["icann"] = null;
  if (section === "private") {
    const mIcann = findRule(labels, icannSet());
    icann = toDomains(labels, mIcann);
  }

  const hostIsPublicSuffix = all.registrableDomain === null && all.publicSuffix === host;

  // Subdomain = labels left of the registered domain.
  let subdomain = "";
  if (all.registrableDomain) {
    const regLabels = all.registrableDomain.split(".").length;
    subdomain = labels.slice(0, labels.length - regLabels).join(".");
  }

  // Notes for the informative edge cases.
  let note: string | undefined;
  if (mAll.rule === "*") {
    note = "No rule matched, so the rightmost label is treated as the public suffix (unknown or unlisted TLD).";
  } else if (hostIsPublicSuffix) {
    note = "This host is itself a public suffix, so nothing is registrable at this exact name.";
  } else if (wasWildcard) {
    note = "Analysed the base name after the leading \"*.\" wildcard label.";
  }

  return {
    input: host,
    kind: "domain",
    publicSuffix: all.publicSuffix,
    registrableDomain: all.registrableDomain,
    subdomain,
    section,
    rule: mAll.rule,
    isException: mAll.isException,
    hostIsPublicSuffix,
    icann,
    ...(note ? { note } : {}),
  };
}
