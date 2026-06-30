// ============================================================================
// src/lib/tools/persistence-method-explainer/compute.ts
// ----------------------------------------------------------------------------
// EXPLAINS BIG-IP LTM PERSISTENCE.
//
// Persistence keeps a client pinned to the same pool member across connections.
// BIG-IP offers several methods, each keying on something different and each
// failing in its own way. This tool takes a tmsh snippet (persistence profiles
// and/or virtual servers), reuses the tmsh parser, and explains:
//
//   * each persistence profile: the method, what it keys on, how it behaves,
//     its relevant fields, and the failure modes that bite in practice; and
//   * each virtual server's persistence chain: the primary method and the
//     fallback method used when the primary yields no record.
//
// It complements the BIG-IP persistence cookie decoder, which decodes the bytes
// inside a cookie value; this tool explains the method choice around it.
//
// Facts are taken from F5 documentation (K26898044, the LTM profiles reference,
// and the SSL administration guide). Pure and offline.
// ============================================================================

import { parseTmsh, asTopLevel, asKeyValue, type ConfigNode, type ParseResult } from "../tmsh-config-explainer/compute";

export interface FieldNote {
  key: string;
  value: string;
  note?: string;
  block?: boolean;
}

export interface MethodExplain {
  profileName: string;
  methodType: string; // cookie | source-addr | dest-addr | ssl | universal | hash | msrdp | sip
  known: boolean;
  label: string;
  keysOn: string;
  howItWorks: string;
  goodFor: string;
  fields: FieldNote[];
  caveats: string[];
  line: number;
}

export interface ChainStep {
  name: string;
  methodType: string;
  label: string;
  known: boolean;
}

export interface PersistChain {
  virtualName: string;
  line: number;
  primary?: ChainStep;
  fallback?: ChainStep;
  notes: string[];
}

export interface PersistResult {
  ok: boolean;
  methods: MethodExplain[];
  chains: PersistChain[];
  error?: { message: string; line?: number };
}

interface MethodDef {
  label: string;
  keysOn: string;
  howItWorks: string;
  goodFor: string;
  caveats: string[];
  fields: Record<string, string>;
}

// -- The persistence knowledge base -------------------------------------------
const METHODS: Record<string, MethodDef> = {
  cookie: {
    label: "Cookie persistence",
    keysOn: "an HTTP cookie that encodes the chosen pool member",
    howItWorks:
      "BIG-IP ties the client to a pool member through an HTTP cookie. In Insert mode it adds the cookie to the response and reads it back on later requests, so no server-side persistence record is needed. In Rewrite mode the server emits a placeholder cookie that BIG-IP overwrites. In Passive mode the server itself sets the specially formatted cookie and BIG-IP only reads it. In Hash mode BIG-IP load-balances on a hash of a server-set cookie.",
    goodFor: "HTTP, or HTTPS that BIG-IP decrypts, where unique per-client identification is wanted without per-client state on the device.",
    caveats: [
      "Requires an HTTP profile on the virtual server; it cannot work on non-HTTP traffic or on HTTPS that is passed through undecrypted.",
      "It depends on the client accepting and returning cookies; a client that strips cookies will not persist, which is the classic reason to pair it with a source-address fallback.",
      "Insert mode stores the mapping in the client cookie, so it leaves no entry in the persistence table; do not expect to see it with show persistence records.",
    ],
    fields: {
      "cookie-name": "The cookie name BIG-IP inserts or reads. A default insert-mode name looks like BIGipServer<pool>.",
      method: "The cookie mode: insert, rewrite, passive, or hash.",
      "cookie-encryption": "Whether the cookie value is encrypted (required, preferred, or disabled). Encryption hides the encoded backend address.",
      "always-send": "Whether the cookie is re-sent on every response rather than only the first.",
      expiration: "The cookie lifetime; a session cookie lives only for the browser session.",
      "match-across-services": "For cookie profiles this applies to the Cookie Hash method only.",
    },
  },
  "source-addr": {
    label: "Source address affinity persistence",
    keysOn: "the client source IP address (with a configurable mask)",
    howItWorks:
      "BIG-IP records which pool member served a given client source address and sends later connections from that address to the same member. With the default mask of 255.255.255.255 each address gets its own record; a coarser mask groups a subnet into one record.",
    goodFor: "Any protocol, including non-HTTP, when clients have stable, distinct source addresses.",
    caveats: [
      "It breaks when many users share one address, as behind NAT, a proxy, or a VPN gateway: they all map to the same member and load distribution collapses.",
      "A mask of 255.255.255.255 creates one record per client address, which can grow the persistence table; a coarser mask trades precision for fewer records.",
      "A client whose source address changes mid-session loses persistence.",
    ],
    fields: {
      "match-across-services": "Share the record across virtuals that use the same virtual address.",
      "match-across-virtuals": "Share the record across virtuals with different virtual addresses.",
      "match-across-pools": "Allow a record to direct traffic to any pool that holds it (can override the virtual's pool).",
      timeout: "Seconds a record is kept after its last use.",
      "hash-algorithm": "How the source address is hashed when selecting a member.",
      mask: "The netmask applied to the source address; coarser masks group clients into shared records.",
    },
  },
  "dest-addr": {
    label: "Destination address affinity persistence",
    keysOn: "the destination IP address of the packet",
    howItWorks:
      "Also called sticky persistence, this sends all requests for a given destination address to the same pool member, regardless of which client sent them. It supports both TCP and UDP.",
    goodFor: "Load balancing caching or proxy servers, where sending the same destination to the same cache maximizes hit rate.",
    caveats: [
      "It persists by destination, not client, so it does not pin an individual user; it pins a target.",
      "As with source affinity, the mask decides how finely destinations are grouped into records.",
    ],
    fields: {
      timeout: "Seconds a record is kept after its last use.",
      mask: "The netmask applied to the destination address.",
      "match-across-services": "Share the record across virtuals using the same virtual address.",
    },
  },
  ssl: {
    label: "SSL persistence",
    keysOn: "the SSL/TLS session ID exchanged in the handshake",
    howItWorks:
      "BIG-IP observes the SSL session ID, which is sent in cleartext during the handshake, and maps it to the chosen pool member. When the client reconnects presenting the same session ID, BIG-IP returns it to the same member, even if the client's IP address has changed.",
    goodFor: "HTTPS that is not decrypted on BIG-IP, and other SSL-based services (FTPS, LDAPS, SMTPS, IMAPS), especially when clients have translated or changing IP addresses.",
    caveats: [
      "It works only with TLS 1.2 and earlier; TLS 1.3 made the session ID obsolete, so it cannot be relied on there.",
      "Even on TLS 1.2, modern clients may use other resumption mechanisms or not reuse the session ID consistently, which weakens it.",
      "A common design is SSL persistence as the primary with source-address affinity as the fallback for when no valid session ID is presented.",
    ],
    fields: {
      timeout: "Seconds a record is kept after its last use.",
      "match-across-services": "Share the record across virtuals using the same virtual address; member addresses must match across those virtuals.",
      "match-across-virtuals": "Share the record across virtuals with different virtual addresses.",
    },
  },
  universal: {
    label: "Universal persistence",
    keysOn: "any value extracted from the traffic by an iRule expression",
    howItWorks:
      "Universal persistence lets you persist on any sequence of bytes from a request or response, defined with an iRule (UIE) expression, such as a JSESSIONID, a custom header, or a field in the payload. The extracted value itself becomes the persistence key.",
    goodFor: "Stateful applications whose session identifier is not a cookie or an address, where you need full control over what to key on.",
    caveats: [
      "It requires an iRule (or a rule reference on the profile) to define the value; without one it has nothing to persist on.",
      "BIG-IP must be able to see the value, so for encrypted traffic it must terminate TLS first.",
    ],
    fields: {
      rule: "The iRule whose persist uie expression supplies the value to key on.",
      timeout: "Seconds a record is kept after its last use.",
      "match-across-services": "Share the record across virtuals using the same virtual address.",
      "match-across-virtuals": "Share the record across virtuals with different virtual addresses.",
    },
  },
  hash: {
    label: "Hash persistence",
    keysOn: "a hash of a chosen value, rather than the value itself",
    howItWorks:
      "Hash persistence works like universal persistence, except the persistence key is a hash of the data instead of the raw data. The hash can be built from values such as source IP, destination IP, and destination port, which spreads persistence more evenly across members.",
    goodFor: "Even distribution when keying on a value that would otherwise cluster, while still pinning each client consistently.",
    caveats: [
      "A hash is not guaranteed unique per session, so two distinct values can collide onto the same member.",
      "Like universal, custom hashing usually relies on an iRule to define the input.",
    ],
    fields: {
      rule: "The iRule that supplies the value to be hashed.",
      "hash-algorithm": "The algorithm used to hash the selected value.",
      timeout: "Seconds a record is kept after its last use.",
    },
  },
  msrdp: {
    label: "Microsoft RDP persistence",
    keysOn: "the Microsoft Remote Desktop Protocol session token",
    howItWorks: "BIG-IP tracks RDP sessions between client and server so a reconnecting client returns to the same session host.",
    goodFor: "Load balancing Remote Desktop session hosts.",
    caveats: ["It is specific to RDP and relies on the routing token; it has no meaning for other protocols."],
    fields: {
      timeout: "Seconds a record is kept after its last use.",
      "has-session-dir": "Whether a Session Directory or Broker is in use, which changes how the token is read.",
    },
  },
  sip: {
    label: "SIP persistence",
    keysOn: "a SIP header, by default the Call-ID",
    howItWorks: "BIG-IP persists SIP traffic by a SIP header value so all messages in a call reach the same server.",
    goodFor: "Load balancing SIP servers that process call signaling.",
    caveats: ["It applies to SIP signaling only and depends on a SIP profile being present."],
    fields: {
      "sip-info": "The SIP header used as the persistence key (Call-ID by default).",
      timeout: "Seconds a record is kept after its last use.",
    },
  },
};

// Built-in default persistence profile names map to their method.
const DEFAULT_PROFILE_METHOD: Record<string, string> = {
  cookie: "cookie",
  dest_addr: "dest-addr",
  source_addr: "source-addr",
  ssl: "ssl",
  universal: "universal",
  hash: "hash",
  msrdp: "msrdp",
  sip_info: "sip",
};

const METHOD_LABEL: Record<string, string> = Object.fromEntries(Object.entries(METHODS).map(([k, v]) => [k, v.label]));

/** Resolve a persistence profile node's method from its tmsh type path. */
function methodFromType(type: string): string | undefined {
  // type looks like "ltm persistence cookie" or "ltm persistence source-addr"
  const parts = type.split(" ");
  if (parts.length >= 3 && parts[0] === "ltm" && parts[1] === "persistence") {
    return parts.slice(2).join(" ");
  }
  return undefined;
}

function explainProfile(node: ConfigNode): MethodExplain {
  const { type, name } = asTopLevel(node);
  const methodType = methodFromType(type) ?? "";
  const def = METHODS[methodType];

  const fields: FieldNote[] = [];
  for (const child of node.children ?? []) {
    const key = child.tokens[0] ?? "";
    const isBlock = child.children !== undefined;
    const value = isBlock ? (child.children ?? []).map((k) => k.tokens[0]).filter(Boolean).join(", ") : asKeyValue(child).value;
    fields.push({ key, value, note: def?.fields[key], block: isBlock });
  }

  return {
    profileName: name,
    methodType,
    known: def !== undefined,
    label: def?.label ?? `Persistence profile (${methodType || "unrecognized type"})`,
    keysOn: def?.keysOn ?? "",
    howItWorks: def?.howItWorks ?? "This persistence type is not in the explainer's knowledge base yet, but its fields are shown below.",
    goodFor: def?.goodFor ?? "",
    fields,
    caveats: def?.caveats ?? [],
    line: node.line,
  };
}

/** Map a referenced profile name to a method, via defined profiles or built-in defaults. */
function resolveStep(name: string, definedMethods: Map<string, string>): ChainStep {
  const methodType = definedMethods.get(name) ?? DEFAULT_PROFILE_METHOD[name] ?? "";
  return {
    name,
    methodType,
    label: METHOD_LABEL[methodType] ?? "unrecognized method",
    known: methodType !== "",
  };
}

function explainVirtualChain(node: ConfigNode, definedMethods: Map<string, string>): PersistChain | null {
  const { name } = asTopLevel(node);
  const children = node.children ?? [];

  // persist { <profileName> { } } or persist { <profileName> }
  const persistNode = children.find((c) => c.tokens[0] === "persist");
  let primary: ChainStep | undefined;
  if (persistNode?.children && persistNode.children.length > 0) {
    primary = resolveStep(persistNode.children[0].tokens[0], definedMethods);
  } else if (persistNode && persistNode.tokens.length > 1) {
    primary = resolveStep(persistNode.tokens[1], definedMethods);
  }

  // fallback-persistence <profileName>
  const fbNode = children.find((c) => c.tokens[0] === "fallback-persistence");
  const fallback = fbNode ? resolveStep(asKeyValue(fbNode).value, definedMethods) : undefined;

  if (!primary && !fallback) return null;

  const notes: string[] = [];
  if (primary && fallback) {
    notes.push(`Primary persistence is ${primary.label.toLowerCase()}; when it yields no record, BIG-IP falls back to ${fallback.label.toLowerCase()}.`);
    if (primary.methodType && fallback.methodType && primary.methodType === fallback.methodType) {
      notes.push("The primary and fallback resolve to the same method, which defeats the purpose of a fallback; they should differ.");
    }
    if (primary.methodType === "ssl" && fallback.methodType === "source-addr") {
      notes.push("This is the recommended pairing for SSL persistence: source-address affinity catches clients that present no reusable session ID.");
    }
    if (primary.methodType === "cookie" && fallback.methodType === "source-addr") {
      notes.push("This is a common pairing: source-address affinity catches clients that refuse cookies.");
    }
  } else if (primary) {
    notes.push(`Primary persistence is ${primary.label.toLowerCase()} with no fallback configured; clients the primary cannot match are load-balanced normally.`);
  } else if (fallback) {
    notes.push("A fallback persistence is set but no primary persistence is configured on this virtual.");
  }

  return { virtualName: name, line: node.line, primary, fallback, notes };
}

// -- Top-level extraction -----------------------------------------------------
export function extractPersistence(parsed: ParseResult): PersistResult {
  const profiles: MethodExplain[] = [];
  const definedMethods = new Map<string, string>(); // profile name -> method type

  for (const node of parsed.nodes) {
    const { type, name } = asTopLevel(node);
    if (type.startsWith("ltm persistence")) {
      const m = explainProfile(node);
      profiles.push(m);
      if (m.methodType) definedMethods.set(name, m.methodType);
    }
  }

  const chains: PersistChain[] = [];
  for (const node of parsed.nodes) {
    const { type } = asTopLevel(node);
    if (type === "ltm virtual") {
      const chain = explainVirtualChain(node, definedMethods);
      if (chain) chains.push(chain);
    }
  }

  return { ok: parsed.ok, methods: profiles, chains, error: parsed.error };
}

/** run - parse a tmsh snippet and explain its persistence. Never throws. */
export function run(input: string): PersistResult {
  return extractPersistence(parseTmsh(input));
}
