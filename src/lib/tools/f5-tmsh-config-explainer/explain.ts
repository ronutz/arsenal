// ============================================================================
// src/lib/tools/f5-tmsh-config-explainer/explain.ts
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
//
// PAGE LANGUAGE (2026-11-02, batch H6): every text this layer writes is
// returned as an EngineText (../engine-text.ts) by explainConfigLocalisable()
// and explainObjectLocalisable(): the knowledge base's texts carry catalogue
// ids (type.<type>.summary and type.<type>.field.<key>, the type's key made
// key-safe by keySegment(), e.g. type.ltm_virtual.summary;
// scripts/check-engine-catalogue.mts keeps the en pack equal to TYPES), the
// observations, the summary of an unknown type, the two block-summary words
// and the parser's message (by the id the parser gives it) carry their own
// ids. explainConfig() and explainObject() return plainText() of the same
// readings, so the API and the golden vectors are unchanged byte for byte.
// ============================================================================

import { type ConfigNode, type ParseResult, asTopLevel, asKeyValue } from "./compute";
import { say, plainText, keySegment, type EngineText } from "../engine-text"; // sentences with ids (2026-11-02)

/** One field of an object. S is string in the API's reading, EngineText in the page's. */
export interface FieldExplain<S = string> {
  key: string;
  /** The value as written, or for a nested block a summary of it (two of whose forms are sentences). */
  value: string | S;
  /** Plain-English note about this field, when the type is known. */
  note?: S;
  /** True when the field opened a nested block (value summarizes it). */
  block?: boolean;
}

/** One object, explained. S as above. */
export interface ObjectExplain<S = string> {
  type: string;
  name: string;
  known: boolean;
  summary: S;
  fields: FieldExplain<S>[];
  notes: S[]; // operational / security observations
  isIRule: boolean;
  verbatim?: string;
  line: number;
}

/** A whole configuration, explained. S as above. */
export interface ExplainResult<S = string> {
  ok: boolean;
  objects: ObjectExplain<S>[];
  error?: { message: string | S; line?: number };
  counts: Record<string, number>; // type -> count
}

interface TypeDef {
  summary: string;
  fields: Record<string, string>;
}

// -- The knowledge base -------------------------------------------------------
// Exact type keys first; family prefixes (one or two words) act as fallbacks.
// Exported (2026-11-02) for scripts/check-engine-catalogue.mts, which keeps the en pack equal to it.
export const TYPES: Record<string, TypeDef> = {
  "ltm virtual": {
    summary: "A virtual server: the listening IP and port that clients connect to, and the front door that ties together a pool, profiles, persistence, and iRules.",
    fields: {
      destination: "The IP address and port the virtual server listens on (the virtual address plus service).",
      mask: "The netmask applied to the destination, defining whether this is a host or network virtual server.",
      pool: "The default pool of backend members this virtual sends traffic to.",
      "ip-protocol": "The L4 protocol the virtual accepts (tcp, udp, or sctp).",
      profiles: "The profiles attached to the virtual; these decide the L4/L7 behaviour (TCP, HTTP, SSL, OneConnect, and so on).",
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
/**
 * The knowledge base's key for a type: the type itself, else its first two words, else none.
 * @param type the object's type path
 * @returns the key in TYPES, or undefined
 */
function lookupTypeKey(type: string): string | undefined {
  if (Object.hasOwn(TYPES, type)) return type; // exact (own entries only, 2026-11-02: "constructor" is not a type)
  const parts = type.split(" "); // its words
  if (parts.length >= 2) {
    const two = parts.slice(0, 2).join(" "); // the family
    if (Object.hasOwn(TYPES, two)) return two; // by family (own entries only)
  }
  return undefined; // not known
} // lookupTypeKey

/**
 * A one-line summary of a nested block: its entries, the first six, then how many more; "(empty)" when it has none.
 * @param node the block
 * @returns the summary: the entries as written, or one of the two sentences (pack keys engine.block.*)
 */
function summarizeBlock(node: ConfigNode): string | EngineText {
  const kids = node.children ?? [];
  if (kids.length === 0) return say("block.empty", "(empty)"); // pack key engine.block.empty
  const render = (k: ConfigNode): string => {
    if (k.children !== undefined) return k.tokens[0] ?? "";
    const kv = asKeyValue(k);
    return kv.value ? `${kv.key} ${kv.value}` : kv.key;
  };
  const parts = kids.map(render).filter(Boolean);
  if (parts.length <= 6) return parts.join(", ");
  const list = parts.slice(0, 6).join(", "); // the first six, as written
  return say("block.more", `${list}, and ${parts.length - 6} more`, { list, n: String(parts.length - 6) }); // pack key engine.block.more
}

// -- Operational / security observations --------------------------------------
function observe(type: string, node: ConfigNode, fields: FieldExplain<EngineText>[]): EngineText[] {
  const notes: EngineText[] = []; // in rule order
  const has = (k: string) => fields.some((f) => f.key === k);
  const valueOf = (k: string) => { const v = fields.find((f) => f.key === k)?.value; return v === undefined ? "" : typeof v === "string" ? v : v.text; }; // the value as the API reads it (a block summary sentence as its English, as before)

  if (type === "ltm virtual") {
    const profilesNode = (node.children ?? []).find((c) => c.tokens[0] === "profiles");
    const profileNames = (profilesNode?.children ?? []).map((p) => p.tokens[0]);
    if (!profilesNode || profileNames.length === 0) {
      notes.push(say("note.noProfiles", "No profiles are attached, so this virtual falls back to the FastL4 default and behaves as a pure L4 forwarder.")); // pack key engine.note.noProfiles
    }
    const hasClientSsl = profileNames.some((p) => /ssl|clientssl/i.test(p));
    const dest = valueOf("destination");
    const looksTls = /:(443|https)\b/.test(dest);
    if (looksTls && !hasClientSsl) {
      notes.push(say("note.tlsPassthrough", "The destination port looks like HTTPS but no client-SSL profile is attached, so TLS is passed through to the backend rather than terminated here.")); // pack key engine.note.tlsPassthrough
    }
    const sat = (node.children ?? []).find((c) => c.tokens[0] === "source-address-translation");
    const satType = sat?.children?.find((c) => c.tokens[0] === "type");
    if (satType && asKeyValue(satType).value === "none") {
      notes.push(say("note.snatNone", "Source address translation is none, so pool members see the real client IP and must route return traffic back through this BIG-IP.")); // pack key engine.note.snatNone
    }
    if (!has("pool") && (!profilesNode || profileNames.length === 0)) {
      notes.push(say("note.noPool", "There is no default pool; traffic is handled entirely by iRules, a policy, or forwarding.")); // pack key engine.note.noPool
    }
  }

  if (type === "ltm pool") {
    const monitor = (node.children ?? []).find((c) => c.tokens[0] === "monitor");
    if (!monitor) notes.push(say("note.noMonitor", "No health monitor is configured, so members are assumed always up and a failed member will still receive traffic.")); // pack key engine.note.noMonitor
    const membersNode = (node.children ?? []).find((c) => c.tokens[0] === "members");
    const count = membersNode?.children?.length ?? 0;
    if (count === 1) notes.push(say("note.singleMember", "The pool has a single member, so it provides no redundancy.")); // pack key engine.note.singleMember
  }

  if (type.startsWith("ltm profile") && /client-ssl|clientssl|server-ssl|serverssl/.test(type)) {
    const opts = (node.children ?? []).find((c) => c.tokens[0] === "options");
    const optText = opts
      ? (opts.children && opts.children.length ? opts.children.map((c) => c.tokens.join(" ")).join(" ") : asKeyValue(opts).value).toLowerCase()
      : "";
    if (!/no-tlsv1\b|no-tlsv1\.0/.test(optText)) {
      notes.push(say("note.tls10", "The SSL options do not explicitly disable TLS 1.0; confirm legacy protocol versions are turned off if policy requires it.")); // pack key engine.note.tls10
    }
  }

  if (type === "net self") {
    const allow = (node.children ?? []).find((c) => c.tokens[0] === "allow-service");
    if (allow && /\ball\b/.test(asKeyValue(allow).value)) {
      notes.push(say("note.selfAllowAll", "This self IP allows all services, which exposes management and protocol ports on this address; confirm that is intended.")); // pack key engine.note.selfAllowAll
    }
  }

  return notes;
}

// -- Explain one object -------------------------------------------------------
/**
 * One object, every text as its English (the public reading).
 * @param node a top-level node of the parse
 * @returns the object explained
 */
export function explainObject(node: ConfigNode): ObjectExplain {
  return plainText(explainObjectLocalisable(node)); // the same reading, sentences as their English
} // explainObject

/**
 * One object, every text an EngineText (the page's reading).
 * @param node a top-level node of the parse
 * @returns the object explained
 */
export function explainObjectLocalisable(node: ConfigNode): ObjectExplain<EngineText> {
  const { type, name } = asTopLevel(node);
  const typeKey = lookupTypeKey(type); // the knowledge base's key, when the type is known
  const def = typeKey !== undefined ? TYPES[typeKey] : undefined; // its entry
  const k = typeKey !== undefined ? `type.${keySegment(typeKey)}` : ""; // its pack key prefix (type.ltm_virtual...)
  const isIRule = type === "ltm rule";

  const fields: FieldExplain<EngineText>[] = []; // in paste order
  if (!isIRule) {
    for (const child of node.children ?? []) {
      const key = child.tokens[0] ?? "";
      const isBlock = child.children !== undefined;
      const value = isBlock ? summarizeBlock(child) : asKeyValue(child).value;
      const english = def && Object.hasOwn(def.fields, key) ? def.fields[key] : undefined; // the field's note; own entries only since 2026-11-02, so a field named like a prototype member has none
      const note = typeof english === "string" ? say(`${k}.field.${key}`, english) : english; // a known note as a catalogue sentence; anything else as it was
      fields.push({ key, value, note, block: isBlock });
    }
  }

  const notes = def ? observe(type, node, fields) : [];

  return {
    type,
    name,
    known: def !== undefined,
    summary: (def?.summary ?? null) !== null // the knowledge base's summary (as before: def?.summary ?? ...), or the not-yet-explained sentence (with the type, or without one)
      ? say(`${k}.summary`, def!.summary) // pack key engine.type.<type>.summary
      : type
        ? say("summary.unknown", `This is a ${type} object. The explainer does not have a description for this type yet, but its structure is shown below.`, { type }) // pack key engine.summary.unknown
        : say("summary.unknownNoType", "This is a configuration object. The explainer does not have a description for this type yet, but its structure is shown below."), // pack key engine.summary.unknownNoType
    fields,
    notes,
    isIRule,
    verbatim: node.verbatim,
    line: node.line,
  };
}

// -- Explain a whole config ---------------------------------------------------
/**
 * A whole parse, every text as its English (the public reading: the API's and the golden vectors').
 * @param parsed the parser's result
 * @returns the explanation
 */
export function explainConfig(parsed: ParseResult): ExplainResult {
  return plainText(explainConfigLocalisable(parsed)); // the same reading, sentences as their English
} // explainConfig

/**
 * A whole parse, every text an EngineText (the page's reading).
 * @param parsed the parser's result
 * @returns the explanation
 */
export function explainConfigLocalisable(parsed: ParseResult): ExplainResult<EngineText> {
  const objects = parsed.nodes.map(explainObjectLocalisable);
  const counts: Record<string, number> = Object.create(null) as Record<string, number>; // no prototype, so a type named "__proto__" is counted like any other (2026-11-02)
  for (const o of objects) counts[o.type || "(unknown)"] = (counts[o.type || "(unknown)"] ?? 0) + 1;
  // The parser's message as a sentence, by the id the parser gives it (pack keys engine.parser.*; same keys, same order as parsed.error).
  const error = parsed.error ? { ...parsed.error, message: parsed.errorId ? say(`parser.${parsed.errorId}`, parsed.error.message) : parsed.error.message } : undefined; // or none
  return { ok: parsed.ok, objects, error, counts };
}
