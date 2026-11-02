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
import { say, plainText, engineError, type EngineText } from "../engine-text"; // sentences with ids (02/11/2026)
// PAGE LANGUAGE (02/11/2026): every summary, note, reference line and error is built as an EngineText (a stable id,
// the English as before, and its values). runLocalisable() returns them as such for the page (pack keys
// tools.exos-config-explainer.engine.<id>); run() returns plainText() of the same reading, so the API, the share spec
// and the golden vectors are unchanged. CATEGORY_LABEL keeps its strings (it is exported); the page looks the group
// labels up by category (cat.<category>).

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
/** The leading verb (create, configure, enable, ...). */
/** Plain-language explanation of the command. */
/** S is string in the API's reading and EngineText in the page's (runLocalisable). */
export interface ExosLine<S = string> {
  readonly raw: string;
  readonly verb: string;
  readonly category: ExosCategory;
  readonly summary: S; // a sentence
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

/** S is string in the API's reading and EngineText in the page's. */
export interface ExosNote<S = string> {
  readonly kind: "info" | "good" | "warn";
  readonly text: S; // a sentence
}

export type ExosMode = "reference" | "parse";

/** Reference material for empty input. */
/** The imperative verbs EXOS commands begin with. */
/** S is string in the API's reading and EngineText in the page's. */
export interface ExosResult<S = string> {
  readonly mode: ExosMode;
  readonly lines: readonly ExosLine<S>[]; // each command, explained
  readonly vlans: readonly ExosVlan[];
  readonly groups: readonly ExosGroup[];
  readonly notes: readonly ExosNote<S>[]; // each note
  readonly reference?: {
    readonly verbs: readonly { verb: string; explain: S }[]; // the verb glossary
    readonly note: S; // a sentence
  };
}
/** S is string in the API's reading and EngineText in the page's. */
export interface ToolRunResult<S = string> {
  readonly result: ExosResult<S>; // the reading
}
const VERBS: readonly { verb: string; explain: EngineText }[] = [
  { verb: "create", explain: say("verb.create", "Creates a new object (a VLAN, account, STP domain, and so on).") }, // create
  { verb: "configure", explain: say("verb.configure", "Sets a property on an existing object. The workhorse verb; often abbreviated to 'config'.") }, // configure
  { verb: "enable", explain: say("verb.enable", "Turns a feature or object on (routing, a port, sharing, a protocol).") }, // enable
  { verb: "disable", explain: say("verb.disable", "Turns a feature or object off.") }, // disable
  { verb: "delete", explain: say("verb.delete", "Removes an object.") }, // delete
  { verb: "unconfigure", explain: say("verb.unconfigure", "Resets part of the configuration to its default.") }, // unconfigure
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
function classify(line: string, vlans: Map<string, VlanAcc>): { category: ExosCategory; summary: EngineText } {
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
        summary: tag // with a tag, or untagged for now
          ? say("vlan.createTag", `Creates VLAN "${name}" with 802.1Q tag ${tag}.`, { name, tag }) // tagged
          : say("vlan.create", `Creates VLAN "${name}" (untagged until a tag is set).`, { name }), // untagged
      };
    }
    // configure vlan NAME tag N
    if (verb === "configure" && obj === "vlan" && t.includes("tag") && !t.includes("ports") && !t.includes("ipaddress")) {
      const name = toks[2] ?? "(unnamed)";
      const tag = toks[t.indexOf("tag") + 1];
      vlanOf(vlans, name).tag = tag;
      return { category: "vlan", summary: say("vlan.tag", `Sets VLAN "${name}" to 802.1Q tag ${tag}.`, { name, tag: String(tag) }) }; // a tag
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
        summary: tagged // tagged or untagged
          ? say("vlan.addTagged", `Adds port(s) ${plist} to VLAN "${name}" as tagged. Tagged ports carry the 802.1Q tag and can belong to many VLANs (a trunk).`, { plist, name }) // tagged
          : say("vlan.addUntagged", `Adds port(s) ${plist} to VLAN "${name}" as untagged. Untagged ports can belong to only one VLAN; they must first be removed from the Default VLAN.`, { plist, name }), // untagged
      };
    }
    // configure vlan NAME delete ports PORTS
    if (verb === "configure" && obj === "vlan" && t.includes("delete") && t.includes("ports")) {
      const name = toks[2] ?? "(unnamed)";
      const plist = portsAfter(toks, t.indexOf("ports") + 1, PORT_STOPWORDS);
      return { category: "vlan", summary: say("vlan.delete", `Removes port(s) ${plist} from VLAN "${name}".`, { plist, name }) }; // ports removed
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
        summary: say("vlan.ip", `Assigns IP address ${addr} to VLAN "${name}", making it a routed (Layer 3) interface. Routing between VLAN interfaces still needs "enable ipforwarding".`, { addr, name }), // an IP address
      };
    }
    const vname = toks[2] ?? ""; // the VLAN's name, if any
    return { category: "vlan", summary: say("vlan.other", `VLAN command for "${vname}".`, { vname }) }; // another VLAN command
  }

  // ---- Layer 3 / routing -------------------------------------------------
  if (obj === "ipforwarding") {
    const on = verb === "enable";
    return {
      category: "l3",
      summary: on
        ? say("l3.forwardOn", "Enables IP routing (forwarding) so the switch routes between its Layer 3 VLAN interfaces.") // routing on
        : say("l3.forwardOff", "Disables IP routing."), // routing off
    };
  }
  if (obj === "iproute") {
    if (t.includes("default")) {
      const gw = toks[toks.length - 1];
      return { category: "l3", summary: say("l3.default", `Adds a default route via next hop ${gw} (the gateway of last resort).`, { gw }) }; // a default route
    }
    if (t.includes("add")) {
      const route = line.replace(/^\S+\s+\S+\s+add\s+/i, ""); // the route as typed
      return { category: "l3", summary: say("l3.static", `Adds a static IP route: ${route}.`, { route }) }; // a static route
    }
    return { category: "l3", summary: say("l3.routes", "Static route configuration.") }; // other route commands
  }
  if (obj === "ospf" || obj === "bgp" || obj === "rip" || obj === "pim" || obj === "isis" || obj === "vrrp") {
    const proto = obj.toUpperCase(); // the protocol's name
    return { category: "l3", summary: say("l3.protocol", `${proto} routing/redundancy configuration.`, { proto }) }; // a routing protocol
  }

  // ---- Ports -------------------------------------------------------------
  if (obj === "ports") {
    const plist = portsAfter(toks, 2, new Set(["display-string", "auto", "speed", "duplex", "description-string"]));
    if (verb === "enable") return { category: "ports", summary: say("ports.enable", `Administratively enables port(s) ${plist}.`, { plist }) }; // enabled
    if (verb === "disable") return { category: "ports", summary: say("ports.disable", `Administratively disables (shuts) port(s) ${plist}.`, { plist }) }; // disabled
    if (t.includes("display-string") || t.includes("description-string")) {
      return { category: "ports", summary: say("ports.label", `Sets a text label on port(s) ${plist}.`, { plist }) }; // a label
    }
    if (t.includes("auto") || t.includes("speed") || t.includes("duplex")) {
      return { category: "ports", summary: say("ports.speed", `Sets speed/duplex/auto-negotiation on port(s) ${plist}.`, { plist }) }; // speed and duplex
    }
    return { category: "ports", summary: say("ports.other", `Port configuration for ${plist}.`, { plist }) }; // other port commands
  }

  // ---- Link aggregation (sharing = EXOS term for LAG) --------------------
  if (obj === "sharing") {
    if (verb === "enable") {
      const master = toks[2] ?? "";
      const grpIdx = t.indexOf("grouping");
      const members = grpIdx >= 0 ? portsAfter(toks, grpIdx + 1, new Set(["algorithm", "lacp", "dynamic"])) : "";
      const lacp = t.includes("lacp");
      let summary: EngineText; // the LAG's summary
      if (members) summary = lacp // with members: LACP or static
        ? say("lag.membersLacp", `Creates a link aggregation group (LAG) with master port ${master} and members ${members}, using LACP. In EXOS a LAG is called a "sharing" group and is referenced by its master port.`, { master, members }) // LACP
        : say("lag.membersStatic", `Creates a link aggregation group (LAG) with master port ${master} and members ${members} (static). In EXOS a LAG is called a "sharing" group and is referenced by its master port.`, { master, members }); // static
      else summary = lacp // without members: LACP or static
        ? say("lag.lacp", `Creates a link aggregation group (LAG) with master port ${master}, using LACP. In EXOS a LAG is called a "sharing" group and is referenced by its master port.`, { master }) // LACP
        : say("lag.static", `Creates a link aggregation group (LAG) with master port ${master} (static). In EXOS a LAG is called a "sharing" group and is referenced by its master port.`, { master }); // static
      return { category: "sharing", summary };
    }
    return { category: "sharing", summary: say("lag.other", "Link aggregation (sharing) configuration.") }; // other sharing commands
  }

  // ---- Spanning tree -----------------------------------------------------
  if (obj === "stpd" || obj === "mstp") {
    const domain = toks[2] ?? ""; // the domain's name
    if (verb === "create") return { category: "stp", summary: say("stp.create", `Creates spanning-tree domain "${domain}".`, { domain }) }; // a domain
    if (t.includes("add") && t.includes("vlan")) {
      return { category: "stp", summary: say("stp.addVlan", `Adds a VLAN (and its ports) to spanning-tree domain "${domain}".`, { domain }) }; // a VLAN in a domain
    }
    return { category: "stp", summary: say("stp.other", `Spanning-tree (STP/RSTP/MSTP) configuration for domain "${domain}".`, { domain }) }; // other STP commands
  }
  if (obj === "elrp" || obj === "eaps" || obj === "erps") {
    const proto = obj.toUpperCase(); // the protocol's name
    return { category: "stp", summary: say("stp.ring", `${proto} loop-protection / ring configuration.`, { proto }) }; // loop protection
  }

  // ---- Accounts and access ----------------------------------------------
  if (obj === "account" || obj === "failsafe-account") {
    if (verb === "create") {
      const role = toks[2] ?? "";
      const name = toks[3] ?? "";
      // ---- Management and services ------------------------------------------
      // ---- Security ----------------------------------------------------------
      // ---- Fallback ----------------------------------------------------------
      return {
        category: "account",
        summary: role // a role given, or the placeholder
          ? say("account.create", `Creates a local account "${name}" with role ${role} (EXOS roles are typically admin or user).`, { name, role }) // with a role
          : say("account.createNoRole", `Creates a local account "${name}" with role (role) (EXOS roles are typically admin or user).`, { name }), // the role missing
      };
    }
    return { category: "account", summary: say("account.other", "Local account / password configuration.") }; // other account commands
  }
  if (obj === "radius" || obj === "tacacs") {
    const proto = obj.toUpperCase(); // the protocol's name
    return { category: "account", summary: say("account.aaa", `${proto} authentication (AAA) configuration.`, { proto }) }; // AAA
  }
  if (obj === "ssh2" || obj === "telnet" || obj === "cli") {
    return { category: "account", summary: say("account.access", `Management access configuration (${obj}).`, { obj }) }; // management access
  }
  if (obj === "snmp") { const rest = line.replace(/^\S+\s+snmp\s+/i, ""); return { category: "mgmt", summary: say("mgmt.snmp", `SNMP configuration: ${rest}.`, { rest }) }; } // SNMP
  if (obj === "sntp-client" || obj === "ntp" || obj === "timezone") {
    return { category: "mgmt", summary: say("mgmt.time", "Time synchronization / time zone configuration.") }; // time
  }
  if (obj === "dns-client") return { category: "mgmt", summary: say("mgmt.dns", "DNS resolver (dns-client) configuration.") }; // DNS
  if (obj === "banner") return { category: "mgmt", summary: say("mgmt.banner", "Login/CLI banner text.") }; // banner
  if (obj === "syslog" || obj === "log") return { category: "mgmt", summary: say("mgmt.syslog", "Logging / syslog target configuration.") }; // logging
  if (obj === "lldp" || obj === "edp") { const proto = obj.toUpperCase(); return { category: "mgmt", summary: say("mgmt.discovery", `${proto} neighbor-discovery configuration.`, { proto }) }; } // neighbour discovery
  if (obj === "sflow" || obj === "ip-fix") return { category: "mgmt", summary: say("mgmt.flow", "Flow export / telemetry configuration.") }; // flow export
  if (obj === "idletimeout" || obj === "sys-name" || obj === "hostname") {
    return { category: "mgmt", summary: say("mgmt.identity", "System identity / session configuration.") }; // identity
  }
  if (obj === "access-list" || obj === "policy") {
    const acl = toks[2] ?? ""; // the ACL's name
    return { category: "security", summary: say("sec.acl", `ACL / policy configuration (${acl}).`, { acl }) }; // ACL
  }
  if (obj === "netlogin" || obj === "identity-management") {
    return { category: "security", summary: say("sec.nac", "Network login / identity (NAC) configuration.") }; // NAC
  }
  if (obj === "dos-protect" || obj === "ip-security") {
    return { category: "security", summary: say("sec.dos", "DoS / IP-security protection configuration.") }; // DoS
  }
  if (VERB_SET.has(verb)) {
    const target = toks.slice(1).join(" ") || say("other.object", "(object)"); // what the verb acts on
    return {
      category: "other",
      summary: verbSummary(verb, target), // the verb on its object
    };
  }
  return { category: "other", summary: say("other.unrecognised", "Unrecognised line (not a create/configure/enable/disable/delete/unconfigure command).") }; // not a command
}

/** Heuristic: a "configure NAME ..." line that omits the optional vlan keyword. */
/**
 * A generic summary for a verb this tool has no specific reading for: "Creates x.", "Configures x."... One id per verb,
 * so the page can conjugate it in its own language; the English is the verb capitalised with an s, as before.
 * @param verb one of the six EXOS verbs
 * @param target what it acts on (the rest of the line), or the "(object)" placeholder
 * @returns the sentence
 */
function verbSummary(verb: string, target: string | EngineText): EngineText {
  switch (verb) {
    case "create": return say("other.create", `Creates ${target}.`, { target }); // create
    case "configure": return say("other.configure", `Configures ${target}.`, { target }); // configure
    case "enable": return say("other.enable", `Enables ${target}.`, { target }); // enable
    case "disable": return say("other.disable", `Disables ${target}.`, { target }); // disable
    case "delete": return say("other.delete", `Deletes ${target}.`, { target }); // delete
    default: return say("other.unconfigure", `Unconfigures ${target}.`, { target }); // unconfigure (the only other verb)
  }
} // verbSummary

function looksLikeVlanConfig(t: string[]): boolean {
  // configure NAME [add|delete] ports ... OR configure NAME ipaddress ... OR configure NAME tag ...
  return (
    t[0] === "configure" &&
    (t.includes("ports") || t.includes("ipaddress")) &&
    (t.includes("add") || t.includes("delete") || t.includes("ipaddress"))
  );
}

/** Build the empty-input reference. */
function referenceResult(): ExosResult<EngineText> {
  return {
    mode: "reference",
    lines: [],
    vlans: [],
    groups: [],
    notes: [
      { kind: "info", text: say("ref.paste", "Paste an ExtremeXOS (EXOS / Switch Engine) configuration to have each command explained, the VLANs summarised, and the commands grouped by category. This tool reads the config; it never touches a switch.") }, // what to paste
    ],
    reference: {
      verbs: VERBS.map((v) => ({ verb: v.verb, explain: v.explain })),
      note: say("ref.flat", "EXOS has no interface sub-modes. Every line is a self-contained command that begins with one of these verbs acting on a named object, which is why a config reads as a flat list rather than nested blocks."), // flat, not nested
    },
  };
}

/** Parse a pasted EXOS config. */
function parseConfig(src: string): ExosResult<EngineText> {
  const rawLines = src.split(/\r?\n/);
  const vlanMap = new Map<string, VlanAcc>();
  const lines: ExosLine<EngineText>[] = []; // each command, its summary with an id
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
  const notes: ExosNote<EngineText>[] = []; // each note with its id
  if (lines.length === 0) {
    notes.push({ kind: "warn", text: say("note.none", "No EXOS commands were recognised. Make sure this is an ExtremeXOS configuration (lines beginning with create, configure, enable, disable, delete, or unconfigure).") }); // nothing recognised
    return { mode: "parse", lines, vlans, groups, notes };
  }
  const count = String(lines.length), vcount = String(vlans.length); // the tallies
  notes.push({ kind: "good", text: vlans.length // lines and VLANs, or lines only
    ? say("note.readVlans", `Read ${count} command line(s) and ${vcount} VLAN(s).`, { count, vcount }) // with VLANs
    : say("note.read", `Read ${count} command line(s).`, { count }) }); // lines only

  // If nothing begins with an EXOS verb, this probably is not an EXOS config.
  const recognized = lines.filter((l) => VERB_SET.has(l.verb)).length;
  if (recognized === 0) {
    notes.push({ kind: "warn", text: say("note.noVerbs", "None of these lines begin with an EXOS verb (create, configure, enable, disable, delete, unconfigure). This may be a configuration for a different platform, such as Cisco IOS or VOSS.") }); // another platform
  }

  // Common structural observations.
  const hasL3 = byCategory.has("l3");
  const hasForwarding = lines.some((l) => /\bipforwarding\b/.test(l.raw) && l.verb === "enable");
  if (hasL3 && !hasForwarding && vlans.some((v) => v.ipAddresses.length > 0)) {
    notes.push({ kind: "warn", text: say("note.noForwarding", "One or more VLANs have IP addresses but no 'enable ipforwarding' command was seen. Without it, the switch will not route between those VLAN interfaces.") }); // no ipforwarding
  }
  const untaggedMultis = vlans.filter((v) => v.untaggedPorts.length > 1);
  if (untaggedMultis.length > 0) {
    notes.push({ kind: "info", text: say("note.untagged", "Remember that an untagged port can belong to only one VLAN. Adding an untagged port to a new VLAN requires first removing it from the Default VLAN.") }); // untagged ports
  }

  return { mode: "parse", lines, vlans, groups, notes };
}

/**
 * Entry point. Empty input returns the reference; anything else is parsed
 * line by line.
 */
export function run(input: string): ToolRunResult {
  return plainText(runLocalisable(input)); // the same reading, sentences as their English (the API's and the vectors')
} // run

/** The page's reading: the same as run(), with every sentence an EngineText (id, English, values). */
export function runLocalisable(input: string): ToolRunResult<EngineText> {
  if (typeof input !== "string") {
    throw engineError(say("err.notString", "Input must be a string.")); // not text
  }
  if (input.length > MAX_INPUT) {
    const chars = String(input.length), limit = String(MAX_INPUT); // the sizes
    throw engineError(say("err.tooLarge", `Input too large (${chars} chars; limit ${limit}).`, { chars, limit })); // too large
  }
  if (input.trim() === "") {
    return { result: referenceResult() };
  }
  return { result: parseConfig(input) };
}
