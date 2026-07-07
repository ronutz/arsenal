// ============================================================================
// src/lib/tools/exos-config-explainer/compute.ts
// ----------------------------------------------------------------------------
// EXTREMEXOS (EXOS / "Switch Engine") CONFIG EXPLAINER.
//
// Paste an ExtremeXOS configuration (or a few CLI lines) and this reads it
// back: a plain-English explanation of each command, an aggregated VLAN /
// structure summary, and the commands grouped by category (VLANs, ports,
// Layer 3, link aggregation, spanning tree, accounts, management, security).
//
// EXOS is distinctive: unlike Cisco IOS or FortiOS, it has no interface
// sub-modes. It is a flat, imperative command set - every line begins with a
// verb (create, configure, enable, disable, delete, unconfigure) acting on a
// named object. That shape is exactly what makes a line-by-line explainer
// useful, and it is what this engine models.
//
// Pure and deterministic (D-49). It parses text lexically; it never connects
// to a switch, never runs a command, never fetches. Clean-room from the
// ExtremeXOS Command Reference (see index.ts sources). run() throws on
// oversized input (the worker-compatible contract).
// ============================================================================

/** Input ceiling; a pasted switch config can be large, so this is generous. */
const MAX_INPUT = 40000;

/** The category a command is grouped under in the structure tree. */
export type ExosCategory =
  | "vlan"
  | "ports"
  | "l3"
  | "sharing"
  | "stp"
  | "account"
  | "mgmt"
  | "security"
  | "other";

/** Human labels for the categories (English, by design). */
export const CATEGORY_LABEL: Record<ExosCategory, string> = {
  vlan: "VLANs",
  ports: "Ports",
  l3: "Layer 3 and routing",
  sharing: "Link aggregation (sharing)",
  stp: "Spanning tree and loop protection",
  account: "Accounts and access",
  mgmt: "Management and services",
  security: "Security",
  other: "Other",
};

/** One explained command line. */
export interface ExosLine {
  readonly raw: string;
  /** The leading verb (create, configure, enable, ...). */
  readonly verb: string;
  readonly category: ExosCategory;
  /** Plain-language explanation of the command. */
  readonly summary: string;
}

/** An aggregated view of one VLAN, assembled across several commands. */
export interface ExosVlan {
  readonly name: string;
  readonly tag?: string;
  readonly taggedPorts: readonly string[];
  readonly untaggedPorts: readonly string[];
  readonly ipAddresses: readonly string[];
}

/** Commands grouped under one category. */
export interface ExosGroup {
  readonly category: ExosCategory;
  readonly label: string;
  readonly commands: readonly string[];
}

export interface ExosNote {
  readonly kind: "info" | "good" | "warn";
  readonly text: string;
}

export type ExosMode = "reference" | "parse";

export interface ExosResult {
  readonly mode: ExosMode;
  readonly lines: readonly ExosLine[];
  readonly vlans: readonly ExosVlan[];
  readonly groups: readonly ExosGroup[];
  readonly notes: readonly ExosNote[];
  /** Reference material for empty input. */
  readonly reference?: {
    readonly verbs: readonly { verb: string; explain: string }[];
    readonly note: string;
  };
}

export interface ToolRunResult {
  readonly result: ExosResult;
}

/** The imperative verbs EXOS commands begin with. */
const VERBS: readonly { verb: string; explain: string }[] = [
  { verb: "create", explain: "Creates a new object (a VLAN, account, STP domain, and so on)." },
  { verb: "configure", explain: "Sets a property on an existing object. The workhorse verb; often abbreviated to 'config'." },
  { verb: "enable", explain: "Turns a feature or object on (routing, a port, sharing, a protocol)." },
  { verb: "disable", explain: "Turns a feature or object off." },
  { verb: "delete", explain: "Removes an object." },
  { verb: "unconfigure", explain: "Resets part of the configuration to its default." },
];
const VERB_SET = new Set(VERBS.map((v) => v.verb));

/** A working accumulator for one VLAN while parsing. */
interface VlanAcc {
  name: string;
  tag?: string;
  tagged: string[];
  untagged: string[];
  ips: string[];
}

/** Split a line into whitespace tokens, keeping commas attached (port lists). */
function tokens(line: string): string[] {
  return line.trim().split(/\s+/);
}

/** Lowercase a token for keyword comparison. */
function lc(s: string): string {
  return (s || "").toLowerCase();
}

/**
 * Pull the port list out of a token array starting after the "ports" keyword,
 * up to the next known keyword (tagged/untagged/stpd/...). EXOS port lists can
 * contain commas and ranges (1:1, 1:2, 1:3-1:6), so we join the collected
 * tokens back with spaces and normalize.
 */
function portsAfter(toks: string[], startIdx: number, stopWords: Set<string>): string {
  const collected: string[] = [];
  for (let i = startIdx; i < toks.length; i++) {
    if (stopWords.has(lc(toks[i]))) break;
    collected.push(toks[i]);
  }
  return collected.join(" ").replace(/\s*,\s*/g, ", ").trim();
}

const PORT_STOPWORDS = new Set(["tagged", "untagged", "stpd", "dot1d", "emistp", "pvst-plus"]);

/** Get or create the VLAN accumulator for a name. */
function vlanOf(map: Map<string, VlanAcc>, name: string): VlanAcc {
  let v = map.get(name);
  if (!v) {
    v = { name, tagged: [], untagged: [], ips: [] };
    map.set(name, v);
  }
  return v;
}

/**
 * Classify and explain a single command line. Returns the category and a
 * plain-language summary, and updates the VLAN accumulator when relevant.
 * Grounded in the ExtremeXOS Command Reference command grammar.
 */
function classify(line: string, vlans: Map<string, VlanAcc>): { category: ExosCategory; summary: string } {
  const toks = tokens(line);
  const t = toks.map(lc);
  const verb = t[0] ?? "";
  const obj = t[1] ?? "";

  // ---- VLAN commands -----------------------------------------------------
  if (obj === "vlan" || (verb === "configure" && obj && !VERB_SET.has(obj) && looksLikeVlanConfig(t))) {
    // create vlan NAME [tag N]
    if (verb === "create" && obj === "vlan") {
      const name = toks[2] ?? "(unnamed)";
      const tagIdx = t.indexOf("tag");
      const tag = tagIdx >= 0 ? toks[tagIdx + 1] : undefined;
      const acc = vlanOf(vlans, name);
      if (tag) acc.tag = tag;
      return {
        category: "vlan",
        summary: `Creates VLAN "${name}"${tag ? ` with 802.1Q tag ${tag}` : " (untagged until a tag is set)"}.`,
      };
    }
    // configure vlan NAME tag N
    if (verb === "configure" && obj === "vlan" && t.includes("tag") && !t.includes("ports") && !t.includes("ipaddress")) {
      const name = toks[2] ?? "(unnamed)";
      const tag = toks[t.indexOf("tag") + 1];
      vlanOf(vlans, name).tag = tag;
      return { category: "vlan", summary: `Sets VLAN "${name}" to 802.1Q tag ${tag}.` };
    }
    // configure vlan NAME add ports PORTS [tagged|untagged]
    if (verb === "configure" && obj === "vlan" && t.includes("add") && t.includes("ports")) {
      const name = toks[2] ?? "(unnamed)";
      const portsIdx = t.indexOf("ports") + 1;
      const plist = portsAfter(toks, portsIdx, PORT_STOPWORDS);
      const tagged = t.includes("tagged");
      const untagged = t.includes("untagged");
      const acc = vlanOf(vlans, name);
      if (tagged) acc.tagged.push(plist);
      else acc.untagged.push(plist); // EXOS default for add ports is untagged
      const mode = tagged ? "tagged" : "untagged";
      return {
        category: "vlan",
        summary: `Adds port(s) ${plist} to VLAN "${name}" as ${mode}. ${
          tagged
            ? "Tagged ports carry the 802.1Q tag and can belong to many VLANs (a trunk)."
            : "Untagged ports can belong to only one VLAN; they must first be removed from the Default VLAN."
        }`,
      };
    }
    // configure vlan NAME delete ports PORTS
    if (verb === "configure" && obj === "vlan" && t.includes("delete") && t.includes("ports")) {
      const name = toks[2] ?? "(unnamed)";
      const plist = portsAfter(toks, t.indexOf("ports") + 1, PORT_STOPWORDS);
      return { category: "vlan", summary: `Removes port(s) ${plist} from VLAN "${name}".` };
    }
    // configure vlan NAME ipaddress IP[/MASK]
    if (verb === "configure" && obj === "vlan" && t.includes("ipaddress")) {
      const name = toks[2] ?? "(unnamed)";
      const ip = toks[t.indexOf("ipaddress") + 1] ?? "";
      const mask = toks[t.indexOf("ipaddress") + 2];
      const addr = mask && !mask.includes("/") && /^\d/.test(mask) ? `${ip} ${mask}` : ip;
      vlanOf(vlans, name).ips.push(addr);
      return {
        category: "l3",
        summary: `Assigns IP address ${addr} to VLAN "${name}", making it a routed (Layer 3) interface. Routing between VLAN interfaces still needs "enable ipforwarding".`,
      };
    }
    return { category: "vlan", summary: `VLAN command for "${toks[2] ?? ""}".` };
  }

  // ---- Layer 3 / routing -------------------------------------------------
  if (obj === "ipforwarding") {
    const on = verb === "enable";
    return {
      category: "l3",
      summary: on
        ? "Enables IP routing (forwarding) so the switch routes between its Layer 3 VLAN interfaces."
        : "Disables IP routing.",
    };
  }
  if (obj === "iproute") {
    if (t.includes("default")) {
      const gw = toks[toks.length - 1];
      return { category: "l3", summary: `Adds a default route via next hop ${gw} (the gateway of last resort).` };
    }
    if (t.includes("add")) {
      return { category: "l3", summary: `Adds a static IP route: ${line.replace(/^\S+\s+\S+\s+add\s+/i, "")}.` };
    }
    return { category: "l3", summary: "Static route configuration." };
  }
  if (obj === "ospf" || obj === "bgp" || obj === "rip" || obj === "pim" || obj === "isis" || obj === "vrrp") {
    return { category: "l3", summary: `${obj.toUpperCase()} routing/redundancy configuration.` };
  }

  // ---- Ports -------------------------------------------------------------
  if (obj === "ports") {
    const plist = portsAfter(toks, 2, new Set(["display-string", "auto", "speed", "duplex", "description-string"]));
    if (verb === "enable") return { category: "ports", summary: `Administratively enables port(s) ${plist}.` };
    if (verb === "disable") return { category: "ports", summary: `Administratively disables (shuts) port(s) ${plist}.` };
    if (t.includes("display-string") || t.includes("description-string")) {
      return { category: "ports", summary: `Sets a text label on port(s) ${plist}.` };
    }
    if (t.includes("auto") || t.includes("speed") || t.includes("duplex")) {
      return { category: "ports", summary: `Sets speed/duplex/auto-negotiation on port(s) ${plist}.` };
    }
    return { category: "ports", summary: `Port configuration for ${plist}.` };
  }

  // ---- Link aggregation (sharing = EXOS term for LAG) --------------------
  if (obj === "sharing") {
    if (verb === "enable") {
      const master = toks[2] ?? "";
      const grpIdx = t.indexOf("grouping");
      const members = grpIdx >= 0 ? portsAfter(toks, grpIdx + 1, new Set(["algorithm", "lacp", "dynamic"])) : "";
      const lacp = t.includes("lacp");
      return {
        category: "sharing",
        summary: `Creates a link aggregation group (LAG) with master port ${master}${members ? ` and members ${members}` : ""}${lacp ? ", using LACP" : " (static)"}. In EXOS a LAG is called a "sharing" group and is referenced by its master port.`,
      };
    }
    return { category: "sharing", summary: "Link aggregation (sharing) configuration." };
  }

  // ---- Spanning tree -----------------------------------------------------
  if (obj === "stpd" || obj === "mstp") {
    if (verb === "create") return { category: "stp", summary: `Creates spanning-tree domain "${toks[2] ?? ""}".` };
    if (t.includes("add") && t.includes("vlan")) {
      return { category: "stp", summary: `Adds a VLAN (and its ports) to spanning-tree domain "${toks[2] ?? ""}".` };
    }
    return { category: "stp", summary: `Spanning-tree (STP/RSTP/MSTP) configuration for domain "${toks[2] ?? ""}".` };
  }
  if (obj === "elrp" || obj === "eaps" || obj === "erps") {
    return { category: "stp", summary: `${obj.toUpperCase()} loop-protection / ring configuration.` };
  }

  // ---- Accounts and access ----------------------------------------------
  if (obj === "account" || obj === "failsafe-account") {
    if (verb === "create") {
      const role = toks[2] ?? "";
      const name = toks[3] ?? "";
      return {
        category: "account",
        summary: `Creates a local account "${name}" with role ${role || "(role)"} (EXOS roles are typically admin or user).`,
      };
    }
    return { category: "account", summary: "Local account / password configuration." };
  }
  if (obj === "radius" || obj === "tacacs") {
    return { category: "account", summary: `${obj.toUpperCase()} authentication (AAA) configuration.` };
  }
  if (obj === "ssh2" || obj === "telnet" || obj === "cli") {
    return { category: "account", summary: `Management access configuration (${obj}).` };
  }

  // ---- Management and services ------------------------------------------
  if (obj === "snmp") return { category: "mgmt", summary: `SNMP configuration: ${line.replace(/^\S+\s+snmp\s+/i, "")}.` };
  if (obj === "sntp-client" || obj === "ntp" || obj === "timezone") {
    return { category: "mgmt", summary: "Time synchronization / time zone configuration." };
  }
  if (obj === "dns-client") return { category: "mgmt", summary: "DNS resolver (dns-client) configuration." };
  if (obj === "banner") return { category: "mgmt", summary: "Login/CLI banner text." };
  if (obj === "syslog" || obj === "log") return { category: "mgmt", summary: "Logging / syslog target configuration." };
  if (obj === "lldp" || obj === "edp") return { category: "mgmt", summary: `${obj.toUpperCase()} neighbor-discovery configuration.` };
  if (obj === "sflow" || obj === "ip-fix") return { category: "mgmt", summary: "Flow export / telemetry configuration." };
  if (obj === "idletimeout" || obj === "sys-name" || obj === "hostname") {
    return { category: "mgmt", summary: "System identity / session configuration." };
  }

  // ---- Security ----------------------------------------------------------
  if (obj === "access-list" || obj === "policy") {
    return { category: "security", summary: `ACL / policy configuration (${toks[2] ?? ""}).` };
  }
  if (obj === "netlogin" || obj === "identity-management") {
    return { category: "security", summary: "Network login / identity (NAC) configuration." };
  }
  if (obj === "dos-protect" || obj === "ip-security") {
    return { category: "security", summary: "DoS / IP-security protection configuration." };
  }

  // ---- Fallback ----------------------------------------------------------
  if (VERB_SET.has(verb)) {
    return {
      category: "other",
      summary: `${verb.charAt(0).toUpperCase() + verb.slice(1)}s ${toks.slice(1).join(" ") || "(object)"}.`,
    };
  }
  return { category: "other", summary: "Unrecognized line (not a create/configure/enable/disable/delete/unconfigure command)." };
}

/** Heuristic: a "configure NAME ..." line that omits the optional vlan keyword. */
function looksLikeVlanConfig(t: string[]): boolean {
  // configure NAME [add|delete] ports ... OR configure NAME ipaddress ... OR configure NAME tag ...
  return (
    t[0] === "configure" &&
    (t.includes("ports") || t.includes("ipaddress")) &&
    (t.includes("add") || t.includes("delete") || t.includes("ipaddress"))
  );
}

/** Build the empty-input reference. */
function referenceResult(): ExosResult {
  return {
    mode: "reference",
    lines: [],
    vlans: [],
    groups: [],
    notes: [
      { kind: "info", text: "Paste an ExtremeXOS (EXOS / Switch Engine) configuration to have each command explained, the VLANs summarized, and the commands grouped by category. This tool reads the config; it never touches a switch." },
    ],
    reference: {
      verbs: VERBS.map((v) => ({ verb: v.verb, explain: v.explain })),
      note: "EXOS has no interface sub-modes. Every line is a self-contained command that begins with one of these verbs acting on a named object, which is why a config reads as a flat list rather than nested blocks.",
    },
  };
}

/** Parse a pasted EXOS config. */
function parseConfig(src: string): ExosResult {
  const rawLines = src.split(/\r?\n/);
  const vlanMap = new Map<string, VlanAcc>();
  const lines: ExosLine[] = [];
  const byCategory = new Map<ExosCategory, string[]>();

  for (const raw of rawLines) {
    const line = raw.trim();
    if (line === "") continue;
    if (line.startsWith("#") || line.startsWith("!")) continue; // comments
    const { category, summary } = classify(line, vlanMap);
    const verb = lc(tokens(line)[0] ?? "");
    lines.push({ raw: line, verb, category, summary });
    if (!byCategory.has(category)) byCategory.set(category, []);
    byCategory.get(category)!.push(line);
  }

  // Aggregate VLANs (drop the accumulator's empty port-strings).
  const vlans: ExosVlan[] = Array.from(vlanMap.values())
    .map((v) => ({
      name: v.name,
      tag: v.tag,
      taggedPorts: v.tagged.filter((p) => p.length > 0),
      untaggedPorts: v.untagged.filter((p) => p.length > 0),
      ipAddresses: v.ips.filter((p) => p.length > 0),
    }))
    // Only surface VLANs that carry real information.
    .filter((v) => v.tag || v.taggedPorts.length || v.untaggedPorts.length || v.ipAddresses.length);

  // Category groups in a stable, meaningful order.
  const order: ExosCategory[] = ["vlan", "ports", "l3", "sharing", "stp", "account", "mgmt", "security", "other"];
  const groups: ExosGroup[] = order
    .filter((c) => byCategory.has(c))
    .map((c) => ({ category: c, label: CATEGORY_LABEL[c], commands: byCategory.get(c)! }));

  // Notes.
  const notes: ExosNote[] = [];
  if (lines.length === 0) {
    notes.push({ kind: "warn", text: "No EXOS commands were recognized. Make sure this is an ExtremeXOS configuration (lines beginning with create, configure, enable, disable, delete, or unconfigure)." });
    return { mode: "parse", lines, vlans, groups, notes };
  }
  notes.push({ kind: "good", text: `Read ${lines.length} command line(s)${vlans.length ? ` and ${vlans.length} VLAN(s)` : ""}.` });

  // If nothing begins with an EXOS verb, this probably is not an EXOS config.
  const recognized = lines.filter((l) => VERB_SET.has(l.verb)).length;
  if (recognized === 0) {
    notes.push({ kind: "warn", text: "None of these lines begin with an EXOS verb (create, configure, enable, disable, delete, unconfigure). This may be a configuration for a different platform, such as Cisco IOS or VOSS." });
  }

  // Common structural observations.
  const hasL3 = byCategory.has("l3");
  const hasForwarding = lines.some((l) => /\bipforwarding\b/.test(l.raw) && l.verb === "enable");
  if (hasL3 && !hasForwarding && vlans.some((v) => v.ipAddresses.length > 0)) {
    notes.push({ kind: "warn", text: "One or more VLANs have IP addresses but no 'enable ipforwarding' command was seen. Without it, the switch will not route between those VLAN interfaces." });
  }
  const untaggedMultis = vlans.filter((v) => v.untaggedPorts.length > 1);
  if (untaggedMultis.length > 0) {
    notes.push({ kind: "info", text: "Remember that an untagged port can belong to only one VLAN. Adding an untagged port to a new VLAN requires first removing it from the Default VLAN." });
  }

  return { mode: "parse", lines, vlans, groups, notes };
}

/**
 * Entry point. Empty input returns the reference; anything else is parsed
 * line by line.
 */
export function run(input: string): ToolRunResult {
  if (typeof input !== "string") {
    throw new Error("Input must be a string.");
  }
  if (input.length > MAX_INPUT) {
    throw new Error(`Input too large (${input.length} chars; limit ${MAX_INPUT}).`);
  }
  if (input.trim() === "") {
    return { result: referenceResult() };
  }
  return { result: parseConfig(input) };
}
