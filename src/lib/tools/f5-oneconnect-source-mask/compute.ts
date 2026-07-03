// ============================================================================
// src/lib/tools/f5-oneconnect-source-mask/compute.ts
// ----------------------------------------------------------------------------
// EXPLAINS WHAT A OneConnect PROFILE WILL ACTUALLY DO. Three inputs:
//
//   1. A pasted `ltm profile one-connect` stanza: every option explained with
//      the v17 man page's own semantics and defaults filled in explicitly
//      (source-mask 0.0.0.0, max-age 86400, max-reuse 1000, max-size 10000,
//      limit-type none, idle-timeout-override disabled), plus the
//      observations that decide production behavior.
//   2. A mask simulation: `mask 255.255.255.0 ips 10.1.1.5 10.1.1.99 10.1.2.7
//      [snat 192.0.2.10]` renders the reuse groups the mask produces, and
//      with a snat address present, demonstrates the ordering both K7208 and
//      K5911 state: SNAT translation happens FIRST, the mask applies to the
//      TRANSLATED address, so a single SNAT address collapses every client
//      into one reuse group no matter how narrow the mask.
//   3. The word `settings` for the option catalogue.
//
// The mask semantics are the man page's own: 0.0.0.0 shares reused
// connections across ALL clients; a host mask (all 1s) shares only among
// connections from the same client IP. In between, the mask groups clients
// by the network bits it keeps, exactly like a subnet mask groups hosts.
//
// Two more sourced behaviors round out the audit: max-size counts the
// reuse pool but the pool is kept PER TMM (F5's own DevCentral lab shows a
// max-size of 4 yielding 2 slots on each of two TMMs), and the Current Idle
// statistic counts every idle server-side connection whether or not it is
// eligible for reuse, so it is not a reuse-pool gauge. The limit-type
// explanations, including the strict mode the manual itself calls not
// recommended, are condensed faithfully from the same page.
//
// Sources: the tmsh `ltm profile one-connect` reference v17 (grammar,
// defaults, option semantics, limit-type text, share-pools), F5 K7208 and
// K5911 (the SNAT-before-mask ordering, quoted in both), and F5 DevCentral
// "How OneConnect Profile's max-size works" (per-TMM pool division and the
// Current Idle statistic's real meaning), all accessed 2026-07-03.
// ============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SettingCard {
  key: string;
  value: string;
  isDefault: boolean;
  explanation: string;
}

export interface ReuseGroup {
  network: string; // the masked value, e.g. "10.1.1.0"
  members: string[];
}

export interface MaskSim {
  maskDotted: string;
  prefix: number | null; // null when the mask is non-contiguous
  snat?: string;
  groups: ReuseGroup[];
  observations: string[];
}

export interface OneConnectResult {
  ok: boolean;
  mode: "profile" | "mask" | "settings";
  profileName?: string;
  settings?: SettingCard[];
  sim?: MaskSim;
  catalog?: { key: string; def: string; explanation: string }[];
  observations: string[];
  notes: string[];
}

export type ToolRunResult = OneConnectResult;

// ---------------------------------------------------------------------------
// The option table - man-page semantics condensed faithfully, defaults exact.
// ---------------------------------------------------------------------------

const DEFAULTS: Record<string, string> = {
  "source-mask": "0.0.0.0",
  "max-age": "86400",
  "max-reuse": "1000",
  "max-size": "10000",
  "limit-type": "none",
  "idle-timeout-override": "disabled",
  "share-pools": "disabled",
  "defaults-from": "oneconnect",
};

const EXPLAIN: Record<string, (v: string) => string> = {
  "source-mask": (v) => {
    if (v === "0.0.0.0")
      return "The manual's own words: a mask of 0.0.0.0 causes the system to share reused connections across all clients. Maximum reuse, zero client separation on the server side.";
    if (v === "255.255.255.255")
      return "A host mask (all 1s in binary): the system shares only those reused connections originating from the same client IP address. Per-client reuse pools.";
    return `The system applies this mask to the source address to determine reuse eligibility: clients whose addresses share the same masked value (${v}) form one reuse group, exactly like a subnet mask groups hosts.`;
  },
  "max-age": (v) =>
    `Maximum age, in seconds, of a connection in the reuse pool; older connections are removed from the pool. ${v} seconds${v === "86400" ? " (the default: one day)" : ""}.`,
  "max-reuse": (v) => `Maximum number of times a server connection can be reused before it is retired. ${v} reuses.`,
  "max-size": (v) =>
    `Maximum number of connections held in the reuse pool; when full, a finishing server connection simply closes instead of parking. ${v} connections. Note the pool lives per TMM: F5's own lab article shows the configured value dividing across TMM instances, so on a multi-core box each TMM keeps its share.`,
  "limit-type": (v) => {
    if (v === "strict")
      return "The manual's warning, condensed: the TCP connection limit is honored with no exceptions, so idle connections prevent NEW connections until they expire, even when they could have been reused. The page itself says this is not a recommended configuration except in very special cases with short expiration timeouts.";
    if (v === "idle")
      return "Idle connections are dropped as the TCP connection limit is reached; during the drop-and-establish overlap the limit may be briefly exceeded, per the manual.";
    return "The historical handling: simultaneous in-flight requests and responses count toward the connection limit, and there may be more TCP connections open than in-flight requests, particularly (the manual notes) with SNAT pools and narrow source masks.";
  },
  "idle-timeout-override": (v) =>
    v === "disabled"
      ? "Disabled (the default): idle flows follow the protocol profile's timeout."
      : `Overrides how long a connection may sit idle before its flow is eligible for deletion (${v}). Man-page quirk, flagged honestly: the SYNTAX block declares disabled|enabled while the description speaks of a number of seconds; real configurations carry an integer here.`,
  "share-pools": (v) =>
    v === "enabled"
      ? "Enabled: the manual's semantics verbatim in spirit, connections may be shared not only within a virtual server but among similar virtual servers (those differing only in destination address) that use the same OneConnect and internal network profiles."
      : "Disabled (the default): reuse stays within the virtual server.",
  "defaults-from": (v) => `Parent profile: inherits every unset value from ${v}.`,
  description: (v) => `Description: ${v}`,
  "app-service": (v) => `Owned by application service ${v}; strict-updates on the service would lock this profile.`,
};

const KNOWN_KEYS = new Set(Object.keys(EXPLAIN));

// ---------------------------------------------------------------------------
// IPv4 helpers
// ---------------------------------------------------------------------------

function ip4ToInt(ip: string): number | null {
  const m = ip.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const parts = m.slice(1).map(Number);
  if (parts.some((p) => p > 255)) return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function intToIp4(n: number): string {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}

/** Returns prefix length for a contiguous mask, or null for non-contiguous. */
function maskPrefix(maskInt: number): number | null {
  const inv = ~maskInt >>> 0;
  // contiguous iff inv+1 is a power of two (all zeros then all ones pattern)
  if (((inv + 1) & inv) !== 0) return null;
  let p = 0;
  for (let i = 31; i >= 0; i--) if ((maskInt >>> i) & 1) p++; else break;
  return p;
}

function parseMaskToken(tok: string): { dotted: string; int: number } | null {
  const t = tok.trim().replace(/^\//, "");
  if (/^\d{1,2}$/.test(t)) {
    const p = Number(t);
    if (p < 0 || p > 32) return null;
    const int = p === 0 ? 0 : (0xffffffff << (32 - p)) >>> 0;
    return { dotted: intToIp4(int), int };
  }
  const int = ip4ToInt(t);
  if (int === null) return null;
  return { dotted: intToIp4(int), int };
}

// ---------------------------------------------------------------------------
// Flat-stanza parser (self-contained: a one-connect stanza is `key value`
// lines inside one brace level; keeping the parser local keeps this engine
// dependency-free).
// ---------------------------------------------------------------------------

function parseProfile(text: string): { name: string; kv: Record<string, string> } | null {
  const head = text.match(/ltm\s+profile\s+one-connect\s+(\S+)\s*\{/);
  if (!head) return null;
  const open = text.indexOf("{", head.index!);
  const close = text.lastIndexOf("}");
  if (open < 0 || close < open) return null;
  const body = text.slice(open + 1, close);
  const kv: Record<string, string> = {};
  for (const raw of body.split("\n")) {
    const line = raw.trim();
    if (!line || line === "}") continue;
    const m = line.match(/^(\S+)\s+(.+)$/);
    if (m) kv[m[1]] = m[2].trim();
  }
  return { name: head[1], kv };
}

// ---------------------------------------------------------------------------
// Observations
// ---------------------------------------------------------------------------

const SNAT_ORDER =
  "The ordering both K7208 and K5911 state: the system performs SNAT translation on the source address FIRST, then applies the OneConnect source mask to the TRANSLATED address to determine reuse eligibility. The mask never sees the client's real IP when SNAT is in play.";

function profileObservations(kv: Record<string, string>): string[] {
  const obs: string[] = [];
  const mask = kv["source-mask"] ?? DEFAULTS["source-mask"];
  const limit = kv["limit-type"] ?? DEFAULTS["limit-type"];

  if (!("source-mask" in kv)) {
    obs.push(
      "source-mask is unset, so the default 0.0.0.0 applies: reused connections are shared across ALL clients (the manual's own description of that value). If the application derives anything from the server-side connection's identity, requests from different clients will arrive over the same connection; the HTTP profile's X-Forwarded-For insertion is the standard companion.",
    );
  }
  obs.push(SNAT_ORDER);
  if (mask !== "0.0.0.0") {
    obs.push(
      "Reasoned implication of that ordering (not a quote): with a single SNAT address on the virtual, every client translates to the same source, so ANY mask, however narrow, yields exactly one reuse group. A narrow mask only separates clients when the translated addresses differ (SNAT pool, or no SNAT).",
    );
  }
  if (limit === "strict") {
    obs.push(
      "limit-type strict carries the manual's own warning: idle connections will prevent new TCP connections until they expire, even if they could otherwise be reused; not recommended except in very special cases with short expiration timeouts.",
    );
  }
  if (limit === "none") {
    obs.push(
      "limit-type none (the historical handling) counts in-flight requests toward pool-member connection limits, and the manual notes more TCP connections may be open than in-flight requests, particularly with SNAT pools and narrow source masks.",
    );
  }
  if ((kv["share-pools"] ?? DEFAULTS["share-pools"]) === "enabled") {
    obs.push(
      "share-pools enabled widens reuse beyond one virtual server: similar virtuals (differing only in destination address) that share this OneConnect and the same internal network profiles can hand connections to each other, per the manual.",
    );
  }
  obs.push(
    "Statistics honesty, from F5's own lab article: the Current Idle counter includes every idle server-side connection whether or not it is eligible for reuse under this mask, and max-size divides across TMM instances rather than being one global pool. Read `tmsh show ltm profile one-connect` with both in mind.",
  );
  return obs;
}

// ---------------------------------------------------------------------------
// run()
// ---------------------------------------------------------------------------

export function run(input: string): OneConnectResult {
  const text = (input ?? "").trim();
  if (!text) {
    throw new Error(
      'Paste an `ltm profile one-connect` stanza, a mask simulation ("mask 255.255.255.0 ips 10.1.1.5 10.1.1.99 10.1.2.7 [snat 192.0.2.10]"), or the word "settings".',
    );
  }

  // ---- settings catalogue --------------------------------------------------
  if (/^settings$/i.test(text)) {
    const catalog = ["source-mask", "max-age", "max-reuse", "max-size", "limit-type", "idle-timeout-override", "share-pools"].map((k) => ({
      key: k,
      def: DEFAULTS[k],
      explanation: EXPLAIN[k](DEFAULTS[k]),
    }));
    return { ok: true, mode: "settings", catalog, observations: [SNAT_ORDER], notes: ["Defaults and semantics from the tmsh reference v17."] };
  }

  // ---- mask simulation -------------------------------------------------------
  const simHead = text.match(/^mask\s+(\S+)(?:\s+ips\s+([\s\S]+?))?(?:\s+snat\s+(\S+))?$/i);
  if (simHead || (!text.includes("{") && parseMaskToken(text))) {
    const maskTok = simHead ? simHead[1] : text;
    const mask = parseMaskToken(maskTok);
    if (!mask) throw new Error(`"${maskTok}" is not a mask. Use dotted (255.255.255.0) or prefix (/24) form.`);
    const prefix = maskPrefix(mask.int);
    const ipsRaw = simHead?.[2]?.trim().split(/\s+/).filter(Boolean) ?? [];
    const snat = simHead?.[3];
    const observations: string[] = [];

    if (prefix === null) observations.push("Non-contiguous mask: the bitwise AND still applies, but this is a highly unusual configuration worth double-checking.");
    observations.push(EXPLAIN["source-mask"](mask.dotted));

    let effective = ipsRaw;
    if (snat) {
      const s = ip4ToInt(snat);
      if (s === null) throw new Error(`snat "${snat}" is not an IPv4 address.`);
      observations.push(SNAT_ORDER);
      observations.push(
        `With the single SNAT address ${snat}, every listed client translates to that one source before the mask is applied: the simulation below therefore shows ONE group regardless of the mask. That is the K7208/K5911 ordering doing exactly what it says.`,
      );
      effective = ipsRaw.map(() => snat);
    }

    const groupsMap = new Map<string, string[]>();
    for (let i = 0; i < effective.length; i++) {
      const n = ip4ToInt(effective[i]);
      if (n === null) throw new Error(`"${effective[i]}" is not an IPv4 address.`);
      const g = intToIp4((n & mask.int) >>> 0);
      const arr = groupsMap.get(g) ?? [];
      arr.push(ipsRaw[i] + (snat ? ` (as ${snat})` : ""));
      groupsMap.set(g, arr);
    }
    const groups: ReuseGroup[] = [...groupsMap.entries()].map(([network, members]) => ({ network, members }));
    if (ipsRaw.length >= 2 && !snat) {
      observations.push(
        groups.length === 1
          ? "All listed clients fall in the same reuse group: any of them may be handed an idle connection previously used by another."
          : `${groups.length} reuse groups: connections park and are reclaimed only within a group.`,
      );
    }
    return { ok: true, mode: "mask", sim: { maskDotted: mask.dotted, prefix, snat, groups, observations }, observations: [], notes: [] };
  }

  // ---- profile paste --------------------------------------------------------------
  const prof = parseProfile(text);
  if (!prof) {
    throw new Error('No `ltm profile one-connect NAME { ... }` stanza found, and the input is not a mask or "settings".');
  }
  const notes: string[] = [];
  const settings: SettingCard[] = [];
  const orderedKeys = ["source-mask", "max-size", "max-age", "max-reuse", "limit-type", "idle-timeout-override", "share-pools", "defaults-from", "description", "app-service"];
  for (const k of orderedKeys) {
    if (k in prof.kv || k in DEFAULTS) {
      const v = prof.kv[k] ?? DEFAULTS[k];
      settings.push({ key: k, value: v, isDefault: !(k in prof.kv), explanation: EXPLAIN[k](v) });
    }
  }
  for (const k of Object.keys(prof.kv)) {
    if (!KNOWN_KEYS.has(k)) notes.push(`"${k}" is outside this tool's curated option table; the man page is the reference.`);
  }
  return { ok: true, mode: "profile", profileName: prof.name, settings, observations: profileObservations(prof.kv), notes };
}
