// ============================================================================
// src/lib/tools/tmsh-config-explainer/explain.ts
// ----------------------------------------------------------------------------
// THE SEMANTIC LAYER over the bigip.conf parse tree.
//
// A knowledge base of the common BIG-IP object types (virtual servers, pools,
// nodes, monitors, profiles, persistence, SNAT, self IPs, VLANs, routes) maps
// each type to a plain-English summary and per-field notes, and a small set of
// operational and security observations. Field names and semantics are taken
// from the F5 tmsh reference (clouddocs.f5.com/cli/tmsh-reference).
//
// Anything not in the knowledge base still parses and displays; it is simply
// shown without annotation, and flagged as not yet explained.
//
// Pure and offline. No judgement about whether a config is "good"; the notes
// point out facts an operator would want to notice, not opinions.
// ============================================================================

import { type ConfigNode, type ParseResult, asTopLevel, asKeyValue } from "./compute";

export interface FieldExplain {
  key: string;
  value: string;
  /** Plain-English note about this field, when the type is known. */
  note?: string;
  /** True when the field opened a nested block (value summarizes it). */
  block?: boolean;
}

export interface ObjectExplain {
  type: string;
  name: string;
  known: boolean;
  summary: string;
  fields: FieldExplain[];
  notes: string[]; // operational / security observations
  isIRule: boolean;
  verbatim?: string;
  line: number;
}

export interface ExplainResult {
  ok: boolean;
  objects: ObjectExplain[];
  error?: { message: string; line?: number };
  counts: Record<string, number>; // type -> count
}

interface TypeDef {
  summary: string;
  fields: Record<string, string>;
}

// -- The knowledge base -------------------------------------------------------
// Exact type keys first; family prefixes (one or two words) act as fallbacks.
const TYPES: Record<string, TypeDef> = {
  "ltm virtual": {
    summary: "A virtual server: the listening IP and port that clients connect to, and the front door that ties together a pool, profiles, persistence, and iRules.",
    fields: {
      destination: "The IP address and port the virtual server listens on (the virtual address plus service).",
      mask: "The netmask applied to the destination, defining whether this is a host or network virtual server.",
      pool: "The default pool of backend members this virtual sends traffic to.",
      "ip-protocol": "The L4 protocol the virtual accepts (tcp, udp, or sctp).",
      profiles: "The profiles attached to the virtual; these decide the L4/L7 behavior (TCP, HTTP, SSL, OneConnect, and so on).",
      rules: "The iRules attached to the virtual, run in order on connection events.",
      persist: "The persistence profile that keeps a client pinned to the same pool member.",
      "fallback-persistence": "The persistence method used when the primary method has no match.",
      "source-address-translation": "How the source IP is translated toward the backend (automap, a SNAT pool, or none).",
      "translate-address": "Whether the destination address is translated to a pool member (enabled) or passed through.",
      "translate-port": "Whether the destination port is translated to the pool member's port.",
      source: "The client source address range the virtual will accept (0.0.0.0/0 means any).",
      vlans: "The VLANs the virtual listens on, when restricted.",
      "vlans-enabled": "Marks the listed VLANs as the only ones the virtual accepts traffic from.",
      "vlans-disabled": "Marks the listed VLANs as excluded; the virtual accepts all others.",
      "connection-limit": "The maximum concurrent connections; 0 means unlimited.",
      "auth-pam-idle-timeout": "Idle timeout for PAM authentication, when used.",
      description: "A free-text description of the object.",
      "security-log-profiles": "The security logging profiles attached to this virtual.",
      "fw-enforced-policy": "An AFM firewall policy enforced on this virtual.",
    },
  },
  "ltm pool": {
    summary: "A pool: a group of backend members that the virtual server load-balances across, with a health monitor deciding which members are eligible.",
    fields: {
      members: "The backend members (address and port) in the pool.",
      monitor: "The health monitor (or monitor rule) that marks members up or down.",
      "load-balancing-mode": "The algorithm used to pick a member (round-robin, least-connections-member, ratio, and so on).",
      "slow-ramp-time": "Seconds over which a newly available member is eased back into rotation.",
      "service-down-action": "What to do with connections when the chosen member is down (none, reset, reselect, drop).",
      "allow-nat": "Whether NAT connections are allowed to pool members.",
      "allow-snat": "Whether SNAT connections are allowed to pool members.",
      "reselect-tries": "How many times to try another member when one fails.",
      "min-active-members": "The minimum number of up members before the pool itself is considered down.",
      description: "A free-text description of the object.",
    },
  },
  "ltm node": {
    summary: "A node: a backend host by IP address, independent of port. Pool members reference nodes, and a node monitor can mark the whole host up or down.",
    fields: {
      address: "The IP address of the backend host.",
      monitor: "The health monitor applied at the node (host) level.",
      session: "Administrative state controlling whether the node accepts new connections (user-enabled or user-disabled).",
      ratio: "The ratio weight used by ratio load-balancing modes.",
      "connection-limit": "The maximum concurrent connections to this node; 0 means unlimited.",
      description: "A free-text description of the object.",
    },
  },
  "ltm monitor": {
    summary: "A health monitor: the probe BIG-IP uses to decide whether a pool member or node is available.",
    fields: {
      send: "The request string the monitor sends to the member.",
      recv: "The response string the monitor expects to mark a member up.",
      "recv-disable": "A response string that marks a member as disabled rather than down.",
      interval: "Seconds between probes.",
      timeout: "Seconds without a successful probe before the member is marked down.",
      destination: "The address and port probed; '*:*' means the member's own address and port.",
      "time-until-up": "Seconds a member must stay healthy before being marked up.",
      cipherlist: "The cipher list used by an HTTPS monitor.",
      username: "The username an authenticated monitor sends.",
    },
  },
  "ltm profile": {
    summary: "A profile: a reusable bundle of protocol or feature settings (TCP, HTTP, SSL, OneConnect, FastL4, and so on) that a virtual server attaches to shape traffic.",
    fields: {
      "defaults-from": "The parent profile this one inherits its unset settings from.",
      cert: "The certificate presented (SSL profiles).",
      key: "The private key paired with the certificate (SSL profiles).",
      "cert-key-chain": "The certificate, key, and chain bundle used by an SSL profile.",
      ciphers: "The cipher string or group governing which TLS ciphers are offered or accepted.",
      "cipher-group": "A named cipher group governing TLS cipher selection.",
      options: "Protocol options toggled on the profile (for SSL, things like no-tlsv1.1).",
      "server-name": "The SNI server name for a server-side SSL profile.",
      "sni-default": "Whether this SSL profile is the default when no SNI matches.",
      "insert-xforwarded-for": "Whether an HTTP profile inserts the X-Forwarded-For header.",
      "idle-timeout": "Seconds of inactivity before a TCP connection is closed.",
      "source-mask": "The mask applied when OneConnect reuses server-side connections.",
      "redirect-rewrite": "How an HTTP profile rewrites redirects (none, all, matching, nodes).",
    },
  },
  "ltm persistence": {
    summary: "A persistence profile: the method BIG-IP uses to keep a given client pinned to the same pool member across connections.",
    fields: {
      "defaults-from": "The parent persistence profile this one inherits from.",
      "cookie-name": "The cookie name used by cookie persistence.",
      "cookie-encryption": "Whether the persistence cookie is encrypted (required, preferred, or disabled).",
      "expiration": "How long a persistence record is kept.",
      "match-across-services": "Whether persistence is shared across virtuals on the same address.",
      "match-across-virtuals": "Whether persistence is shared across different virtual addresses.",
      "hash-algorithm": "The hashing algorithm for hash persistence.",
      timeout: "Seconds a persistence record is kept after the last use.",
    },
  },
  "ltm rule": {
    summary: "An iRule: a Tcl program run on connection events (such as HTTP_REQUEST or CLIENT_ACCEPTED) to inspect and steer traffic. The body below is Tcl, not tmsh configuration, and is shown verbatim.",
    fields: {},
  },
  "ltm snatpool": {
    summary: "A SNAT pool: a set of translation addresses BIG-IP uses as the source when translating client connections toward the backend.",
    fields: {
      members: "The translation IP addresses in the SNAT pool.",
    },
  },
  "ltm snat": {
    summary: "A SNAT: maps client source addresses to a translation address or SNAT pool for outbound or inbound flows.",
    fields: {
      origins: "The client source addresses this SNAT applies to.",
      "source-port": "Whether the source port is preserved or changed.",
      translation: "The translation address used as the new source.",
      snatpool: "The SNAT pool providing translation addresses.",
    },
  },
  "ltm data-group": {
    summary: "A data group: a named list or map (of addresses, strings, or integers) that iRules and policies look up at runtime.",
    fields: {
      type: "The data-group value type (string, ip, or integer).",
      records: "The entries in the data group, optionally with associated data.",
    },
  },
  "net self": {
    summary: "A self IP: an address BIG-IP owns on a VLAN, used as the source for health checks and SNAT and as the gateway-facing interface for a subnet.",
    fields: {
      address: "The self IP address and prefix length.",
      vlan: "The VLAN this self IP lives on.",
      "allow-service": "Which services this self IP answers (default, all, none, or a specific list).",
      "traffic-group": "The traffic group that owns this self IP for HA failover (floating self IPs).",
    },
  },
  "net vlan": {
    summary: "A VLAN: a layer-2 broadcast domain on BIG-IP, carrying one or more tagged or untagged interfaces.",
    fields: {
      tag: "The 802.1Q VLAN tag.",
      interfaces: "The physical or trunk interfaces assigned to the VLAN, tagged or untagged.",
      mtu: "The maximum transmission unit for the VLAN.",
    },
  },
  "net route": {
    summary: "A static route: a destination network and the gateway or interface BIG-IP uses to reach it.",
    fields: {
      network: "The destination network and prefix (default means 0.0.0.0/0).",
      gw: "The next-hop gateway address.",
      interface: "The egress interface, when the route points at one instead of a gateway.",
    },
  },
  "net route-domain": {
    summary: "A route domain: an isolated routing table identified by an ID, letting overlapping address spaces coexist on one BIG-IP.",
    fields: {
      id: "The numeric route-domain identifier (appended to addresses as %id).",
      vlans: "The VLANs that belong to this route domain.",
    },
  },
};

// Family fallbacks: try the full type, then the first two words, then the first.
function lookupType(type: string): TypeDef | undefined {
  if (TYPES[type]) return TYPES[type];
  const parts = type.split(" ");
  if (parts.length >= 2) {
    const two = parts.slice(0, 2).join(" ");
    if (TYPES[two]) return TYPES[two];
  }
  return undefined;
}

function summarizeBlock(node: ConfigNode): string {
  const kids = node.children ?? [];
  if (kids.length === 0) return "(empty)";
  const render = (k: ConfigNode): string => {
    if (k.children !== undefined) return k.tokens[0] ?? "";
    const kv = asKeyValue(k);
    return kv.value ? `${kv.key} ${kv.value}` : kv.key;
  };
  const parts = kids.map(render).filter(Boolean);
  if (parts.length <= 6) return parts.join(", ");
  return `${parts.slice(0, 6).join(", ")}, and ${parts.length - 6} more`;
}

// -- Operational / security observations --------------------------------------
function observe(type: string, node: ConfigNode, fields: FieldExplain[]): string[] {
  const notes: string[] = [];
  const has = (k: string) => fields.some((f) => f.key === k);
  const valueOf = (k: string) => fields.find((f) => f.key === k)?.value ?? "";

  if (type === "ltm virtual") {
    const profilesNode = (node.children ?? []).find((c) => c.tokens[0] === "profiles");
    const profileNames = (profilesNode?.children ?? []).map((p) => p.tokens[0]);
    if (!profilesNode || profileNames.length === 0) {
      notes.push("No profiles are attached, so this virtual falls back to the FastL4 default and behaves as a pure L4 forwarder.");
    }
    const hasClientSsl = profileNames.some((p) => /ssl|clientssl/i.test(p));
    const dest = valueOf("destination");
    const looksTls = /:(443|https)\b/.test(dest);
    if (looksTls && !hasClientSsl) {
      notes.push("The destination port looks like HTTPS but no client-SSL profile is attached, so TLS is passed through to the backend rather than terminated here.");
    }
    const sat = (node.children ?? []).find((c) => c.tokens[0] === "source-address-translation");
    const satType = sat?.children?.find((c) => c.tokens[0] === "type");
    if (satType && asKeyValue(satType).value === "none") {
      notes.push("Source address translation is none, so pool members see the real client IP and must route return traffic back through this BIG-IP.");
    }
    if (!has("pool") && (!profilesNode || profileNames.length === 0)) {
      notes.push("There is no default pool; traffic is handled entirely by iRules, a policy, or forwarding.");
    }
  }

  if (type === "ltm pool") {
    const monitor = (node.children ?? []).find((c) => c.tokens[0] === "monitor");
    if (!monitor) notes.push("No health monitor is configured, so members are assumed always up and a failed member will still receive traffic.");
    const membersNode = (node.children ?? []).find((c) => c.tokens[0] === "members");
    const count = membersNode?.children?.length ?? 0;
    if (count === 1) notes.push("The pool has a single member, so it provides no redundancy.");
  }

  if (type.startsWith("ltm profile") && /client-ssl|clientssl|server-ssl|serverssl/.test(type)) {
    const opts = (node.children ?? []).find((c) => c.tokens[0] === "options");
    const optText = opts
      ? (opts.children && opts.children.length ? opts.children.map((c) => c.tokens.join(" ")).join(" ") : asKeyValue(opts).value).toLowerCase()
      : "";
    if (!/no-tlsv1\b|no-tlsv1\.0/.test(optText)) {
      notes.push("The SSL options do not explicitly disable TLS 1.0; confirm legacy protocol versions are turned off if policy requires it.");
    }
  }

  if (type === "net self") {
    const allow = (node.children ?? []).find((c) => c.tokens[0] === "allow-service");
    if (allow && /\ball\b/.test(asKeyValue(allow).value)) {
      notes.push("This self IP allows all services, which exposes management and protocol ports on this address; confirm that is intended.");
    }
  }

  return notes;
}

// -- Explain one object -------------------------------------------------------
export function explainObject(node: ConfigNode): ObjectExplain {
  const { type, name } = asTopLevel(node);
  const def = lookupType(type);
  const isIRule = type === "ltm rule";

  const fields: FieldExplain[] = [];
  if (!isIRule) {
    for (const child of node.children ?? []) {
      const key = child.tokens[0] ?? "";
      const isBlock = child.children !== undefined;
      const value = isBlock ? summarizeBlock(child) : asKeyValue(child).value;
      const note = def?.fields[key];
      fields.push({ key, value, note, block: isBlock });
    }
  }

  const notes = def ? observe(type, node, fields) : [];

  return {
    type,
    name,
    known: def !== undefined,
    summary: def?.summary ?? `This is a ${type || "configuration"} object. The explainer does not have a description for this type yet, but its structure is shown below.`,
    fields,
    notes,
    isIRule,
    verbatim: node.verbatim,
    line: node.line,
  };
}

// -- Explain a whole config ---------------------------------------------------
export function explainConfig(parsed: ParseResult): ExplainResult {
  const objects = parsed.nodes.map(explainObject);
  const counts: Record<string, number> = {};
  for (const o of objects) counts[o.type || "(unknown)"] = (counts[o.type || "(unknown)"] ?? 0) + 1;
  return { ok: parsed.ok, objects, error: parsed.error, counts };
}
