// ============================================================================
// src/lib/tools/iquery-protocol-explainer/compute.ts
// ----------------------------------------------------------------------------
// F5 BIG-IP DNS (GTM) iQUERY PROTOCOL EXPLAINER + iqdump/log DECODER
// (arsenal-local, pure, deterministic).
//
// iQuery is F5's proprietary protocol that BIG-IP DNS (formerly GTM) uses to
// talk to the big3d agent on itself and on every other BIG-IP it knows about.
// This tool does three things, all offline:
//   1. Decodes pasted `iqdump` output  -> reads back the header comment lines
//      (local hostname, the big3d peer and port, the sync group, timestamp)
//      and the <xml_connection> stanza fields (version, big3d build,
//      connection_id, and other simple fields), and explains each.
//   2. Decodes pasted `/var/log/gtm` lines -> the big3d connection
//      state-change / SNMP_TRAP box green<->red messages that report iQuery
//      mesh health.
//   3. Explains a TOPIC on request (mesh, port, trust, iqdump, metrics,
//      gtmd, big3d, vlan) or lists the topics when asked.
//
// SCOPE. A structure explainer and field decoder, not a live probe: it never
// opens a socket, never runs iqdump, never fetches. Same input always yields
// the same output (D-49). It reads the shape of iqdump/log text; it does not
// validate an entire iQuery exchange.
//
// GROUNDING (see index.ts `sources`). Every fact below is from F5's own docs:
//   - "The gtmd agent on BIG-IP DNS uses the iQuery protocol to communicate
//     with the local big3d agent, and the big3d agents installed on other
//     BIG-IP systems." (GTM/DNS Concepts & Implementations manuals)
//   - "BIG-IP systems use an XML protocol named iQuery ... using gzip
//     compression." and "iqdump is a command you can use to view the data
//     transmitted between systems using iQuery." (GTM Concepts)
//   - TCP port 4353; big3d listens on 4353 on all self IPs and the management
//     IP; long-lived connections = the "iQuery mesh"; SSL-encrypted with
//     certificate-based authentication. (K14707; LTM-DNS Operations Guide)
//   - Trust is bootstrapped by bigip_add / big3d_install / gtm_add, which
//     exchange SSL certificates; those scripts need SSH (port 22). (K13312)
//   - iQuery carries availability status + load-balancing metrics for objects
//     such as virtual servers; probes must follow the same network path as
//     DNS clients. (K14707)
//   - Real iqdump output shape (K000139663): the `<!-- ... -->` header comments
//     Local hostname / Connected to big3d at <ip>:4353 / Subscribing to
//     syncgroup: <name> / <timestamp>, then `<xml_connection>` with
//     <version>, <big3d>, <connection_id>.
//   - iqdump syntax `iqdump <ip> <syncgroup>` (group optional), `-s` switch
//     for a non-default sync group; runs until Ctrl-C; tmsh equivalent is
//     `tmsh show /gtm iquery all`. (LTM-DNS Operations Guide; field reports)
//   - iQuery is sent only on the VLAN on which the system receives incoming
//     messages. (GTM Concepts)
//   - Link Controller module was removed in BIG-IP 21.0.0. (K13312 note)
// ============================================================================

const MAX_INPUT = 200_000; // iqdump/log text is small; this is a generous cap

// ---- Result model ----------------------------------------------------------

/** Which of the three things the engine did with this input. */
export type IqueryMode = "iqdump" | "log" | "topic" | "topics-index";

/** A decoded field with the raw value and a plain-language explanation. */
export interface DecodedField {
  /** The field label as it appears (e.g. "version", "Connected to big3d at"). */
  label: string;
  /** The raw value read from the input. */
  value: string;
  /** What it means, grounded in F5 docs. */
  explain: string;
}

/** A deterministic observation or caution about the decoded input. */
export interface IqueryNote {
  kind: "info" | "good" | "warn";
  text: string;
}

/** One explained topic (also used to render the topic index). */
export interface TopicInfo {
  id: TopicId;
  title: string;
  body: string;
}

export type TopicId =
  | "overview"
  | "mesh"
  | "port"
  | "trust"
  | "iqdump"
  | "metrics"
  | "gtmd"
  | "big3d"
  | "vlan";

export interface IqueryResult {
  ok: boolean;
  mode: IqueryMode;
  /** Human title for the rendered card (e.g. "iqdump connection to 10.10.10.10"). */
  title: string;
  /** For mode "iqdump"/"log": the decoded header/stanza/log fields, in order. */
  fields: DecodedField[];
  /** For mode "topic": the explained topic. For "topics-index": empty. */
  topic?: TopicInfo;
  /** For "topics-index": the full list to render as buttons/rows. */
  topics?: TopicInfo[];
  /** Deterministic observations and cautions. */
  notes: IqueryNote[];
}

export type ToolRunResult = IqueryResult;

// ---- The sourced knowledge base (topics) -----------------------------------
// Every string here traces to a source cited in index.ts. Kept as data so the
// same text drives both the topic picker and the field explanations.

export const TOPICS: Record<TopicId, TopicInfo> = {
  overview: {
    id: "overview",
    title: "What iQuery is",
    body:
      "iQuery is F5's proprietary, XML-based protocol (sent gzip-compressed) that BIG-IP DNS " +
      "(formerly GTM) uses to communicate with other BIG-IP systems. The gtmd agent on BIG-IP DNS " +
      "connects to the big3d agent on itself and on every BIG-IP defined in its configuration, to " +
      "learn object availability, gather load-balancing metrics, exchange sync-group state, and " +
      "carry configuration synchronization. It is not a client protocol like DNS; it is the " +
      "control-plane conversation between BIG-IP devices.",
  },
  mesh: {
    id: "mesh",
    title: "The iQuery mesh",
    body:
      "The set of long-lived iQuery connections among BIG-IP DNS devices and between BIG-IP DNS and " +
      "BIG-IP LTM devices is called the iQuery mesh. All BIG-IP DNS devices are iQuery clients: each " +
      "one's gtmd connects to the big3d on every BIG-IP server in the configuration. A device closer " +
      "to a monitor target is elected to run the probe and shares the result across the mesh, so a " +
      "unified view matters: if devices are not all connected to the same peers, monitor " +
      "responsibility can disagree and objects can flap (marked down then up repeatedly).",
  },
  port: {
    id: "port",
    title: "TCP port 4353",
    body:
      "iQuery runs over TCP port 4353. big3d listens on 4353 on all self IPs and on the management IP. " +
      "For the mesh to form, port 4353 must be open through any firewall between the BIG-IP DNS, LTM, " +
      "and (pre-21.0) Link Controller devices in the sync group. The setup scripts that establish " +
      "trust additionally need SSH (port 22) open to the target devices.",
  },
  trust: {
    id: "trust",
    title: "SSL trust and the setup scripts",
    body:
      "iQuery communication is encrypted with SSL, and the devices authenticate each other with " +
      "certificate-based authentication; they must exchange certificates and share a configuration " +
      "sync group before they can share data. Trust is bootstrapped from the CLI with bigip_add " +
      "(same-version BIG-IP peers), big3d_install (upgrades big3d on older peers), or gtm_add (joins " +
      "an existing DNS sync group). Each exchanges SSL certificates over SSH. With a third-party CA, " +
      "the mesh can also trust a shared root placed under /config/gtm/server.crt and " +
      "/config/big3d/client.crt without running those scripts.",
  },
  iqdump: {
    id: "iqdump",
    title: "The iqdump command",
    body:
      "iqdump lets you view the raw iQuery data between systems and check the path plus SSL " +
      "authentication from a BIG-IP DNS to another mesh device. Syntax: iqdump <ip> <syncgroup> " +
      "(the sync-group name is optional; use the -s switch to name a non-default group). It streams " +
      "until you press Ctrl-C. The remote software version is reported in the version XML stanza. If " +
      "the path or SSL auth is broken, iqdump fails and reports an error. The tmsh equivalent is " +
      "`tmsh show /gtm iquery all`, and DNS > GSLB > Servers shows each server's iQuery status.",
  },
  metrics: {
    id: "metrics",
    title: "What iQuery carries (availability + metrics)",
    body:
      "BIG-IP DNS uses iQuery to determine the availability status of objects (such as a virtual " +
      "server on a remote BIG-IP) and to gather the load-balancing metrics that dynamic GSLB methods " +
      "need. Because DNS must answer as clients see the network, iQuery probes have to follow the " +
      "same network path as DNS clients; otherwise BIG-IP DNS can return an answer that is healthy " +
      "on a private path but wrong for real clients. A common mismatch: a virtual server shows " +
      "offline (red) on BIG-IP DNS but available (green) on the LTM because the virtual-server names " +
      "on the two systems do not match.",
  },
  gtmd: {
    id: "gtmd",
    title: "The gtmd agent",
    body:
      "gtmd is the BIG-IP DNS process that drives GSLB. It opens the iQuery connections, monitors " +
      "both the availability of BIG-IP systems and the integrity of the network paths between the " +
      "systems hosting a domain and the LDNS servers that resolve it, and writes connection-status " +
      "changes to /var/log/gtm. When a big3d connection is established or lost, gtmd logs it (and can " +
      "raise an SNMP trap on a box state change).",
  },
  big3d: {
    id: "big3d",
    title: "The big3d agent",
    body:
      "big3d is the agent that answers iQuery. It runs on BIG-IP DNS and on the LTM (and pre-21.0 " +
      "Link Controller) systems that DNS probes, listening on TCP 4353 on all self IPs and the " +
      "management IP. It performs the monitor probes and returns availability and metric data to " +
      "gtmd. Its version must be the same as, or newer than, the BIG-IP DNS software; big3d_install " +
      "upgrades it on older peers so the whole mesh is compatible.",
  },
  vlan: {
    id: "vlan",
    title: "iQuery and VLANs",
    body:
      "A BIG-IP system sends iQuery communications only on the VLAN on which it receives incoming " +
      "iQuery messages. This is why the self IP addresses you assign to a server object matter: gtmd " +
      "attempts an iQuery connection to every self IP listed for a BIG-IP-type server, and the path " +
      "those addresses take determines which VLAN carries the traffic. Using a single, well-chosen " +
      "self IP per server keeps the path predictable; extra IPs add paths and complexity.",
  },
};

const TOPIC_ORDER: TopicId[] = [
  "overview", "mesh", "port", "trust", "iqdump", "metrics", "gtmd", "big3d", "vlan",
];

// Keyword -> topic resolution for the topic picker / typed keywords.
// Order matters: specific topic words are tested BEFORE the generic "overview"
// catch-all, so "what is the iquery mesh" resolves to mesh, not overview.
const TOPIC_KEYWORDS: Array<{ re: RegExp; id: TopicId }> = [
  { re: /\bmesh\b/i, id: "mesh" },
  { re: /\b(port|4353|tcp)\b/i, id: "port" },
  { re: /\b(trust|ssl|cert|certificate|bigip_add|big3d_install|gtm_add)\b/i, id: "trust" },
  { re: /\b(iqdump|dump|command|cli|tmsh)\b/i, id: "iqdump" },
  { re: /\b(metric|metrics|availability|monitor|probe|health)\b/i, id: "metrics" },
  { re: /\bgtmd\b/i, id: "gtmd" },
  { re: /\bbig3d\b/i, id: "big3d" },
  { re: /\b(vlan|self ?ip|path)\b/i, id: "vlan" },
  // Generic last: only reached when no specific topic word matched.
  { re: /\b(overview|what is|intro|iquery)\b/i, id: "overview" },
];

// ---- Field explanations for decoded iqdump / xml_connection fields ---------
// The explanations are keyed by a normalized field name. Grounded in the real
// iqdump sample (K000139663) and the surrounding F5 docs.

function explainIqdumpHeader(label: string, value: string): string {
  const l = label.toLowerCase();
  if (l.startsWith("local hostname")) {
    return "The hostname of the BIG-IP DNS device you ran iqdump from (the iQuery client side of this connection).";
  }
  if (l.startsWith("connected to big3d at")) {
    const port = /:4353\b/.test(value) ? " on the standard iQuery port 4353" : "";
    const v6 = /::ffff:/.test(value) ? " The ::ffff: prefix is an IPv4 address shown in IPv4-mapped IPv6 form." : "";
    return `The address of the remote big3d agent this connection reached${port}. A successful line here means the TCP path and SSL authentication to that big3d are working.${v6}`;
  }
  if (l.startsWith("subscribing to syncgroup")) {
    const dflt = /\bdefault\b/i.test(value)
      ? " This is the default group name; if your sync group has a different name, iqdump needs the -s switch (or the name as an argument) to show that group's data."
      : "";
    return `The BIG-IP DNS synchronization group whose data this iqdump session is subscribing to.${dflt}`;
  }
  return "An iqdump header comment describing this session.";
}

function explainXmlField(name: string, value: string): string {
  const n = name.toLowerCase();
  switch (n) {
    case "version":
      return `The BIG-IP software version reported by the remote system in the version XML stanza (here ${value}). Use it to confirm the peer's version and that big3d is at least as new as this BIG-IP DNS.`;
    case "big3d":
      return `The big3d agent build string on the remote system. big3d must be the same version as, or newer than, the BIG-IP DNS software; big3d_install upgrades it on older peers.`;
    case "connection_id":
      return `An identifier for this specific iQuery connection instance. Useful as a handle when correlating a connection across logs and repeated iqdump runs.`;
    case "uptime":
      return `How long the remote system (or its process) has been up, as carried in the iQuery data.`;
    case "hostname":
      return `The hostname the remote system reports for itself inside the iQuery data.`;
    default:
      return `An iQuery XML field carried in this connection's data.`;
  }
}

// ---- Input classification --------------------------------------------------

function isIqdump(text: string): boolean {
  // The real iqdump output is unmistakable: HTML-style comment headers and/or
  // the <xml_connection> element / a <version> stanza.
  return (
    /<!--\s*Connected to big3d at/i.test(text) ||
    /<!--\s*Local hostname:/i.test(text) ||
    /<xml_connection>/i.test(text) ||
    /<big3d>\s*big3d Version/i.test(text) ||
    /^\s*iqdump\s+\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/im.test(text)
  );
}

function isGtmLog(text: string): boolean {
  // /var/log/gtm lines: a gtmd[pid] tag, or the SNMP_TRAP box state change, or
  // the green<->red transition wording.
  return (
    /\bgtmd\[\d+\]/i.test(text) ||
    /SNMP_TRAP/i.test(text) ||
    /\bstate change\b.*\b(green|red)\b/i.test(text) ||
    /\bbig3d\b.*\b(connect|connection|lost|established)\b/i.test(text)
  );
}

// ---- Decoders --------------------------------------------------------------

function decodeIqdump(text: string): IqueryResult {
  const fields: DecodedField[] = [];
  const notes: IqueryNote[] = [];

  // Header comment lines: <!-- Label: value -->
  const headerRe = /<!--\s*([^:]+?):\s*(.*?)\s*-->/g;
  let peer = "";
  let syncgroup = "";
  let m: RegExpExecArray | null;
  while ((m = headerRe.exec(text)) !== null) {
    const label = m[1].trim();
    const value = m[2].trim();
    // A bare timestamp comment (no "Label: value") won't match this; that's ok.
    if (/^connected to big3d at$/i.test(label)) peer = value;
    if (/^subscribing to syncgroup$/i.test(label)) syncgroup = value;
    fields.push({ label, value, explain: explainIqdumpHeader(label, value) });
  }

  // A timestamp-only comment: <!-- Fri Apr 26 15:23:30 2024 -->
  const tsRe = /<!--\s*((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b[^>]*?)\s*-->/g;
  let tm: RegExpExecArray | null;
  while ((tm = tsRe.exec(text)) !== null) {
    fields.push({
      label: "timestamp",
      value: tm[1].trim(),
      explain: "When this iqdump session started. iqdump streams live until you press Ctrl-C, so this marks the beginning of the capture.",
    });
  }

  // Simple XML fields inside the connection stanza: <name>value</name>
  const xmlRe = /<([a-z0-9_]+)>\s*([^<]+?)\s*<\/\1>/gi;
  let x: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((x = xmlRe.exec(text)) !== null) {
    const name = x[1];
    if (name.toLowerCase() === "xml_connection") continue; // container, not a value
    const value = x[2].trim();
    const key = `${name}=${value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    fields.push({ label: name, value, explain: explainXmlField(name, value) });
  }

  // Observations.
  if (peer) {
    notes.push({
      kind: "good",
      text: `A big3d peer line is present (${peer}), so the TCP path to port 4353 and the SSL authentication to that big3d succeeded. If they had not, iqdump would have reported an error instead of a connection.`,
    });
  }
  if (/\bdefault\b/i.test(syncgroup)) {
    notes.push({
      kind: "info",
      text: `The sync group shown is "default". If your real sync group has a different name, add the -s switch (or pass the name) or iqdump will keep showing the default group and you may see no data for your objects.`,
    });
  }
  if (fields.length === 0) {
    notes.push({
      kind: "warn",
      text: "This looks like iqdump output but no header comments or XML fields were recognized. Paste the full output including the <!-- ... --> header lines and the <xml_connection> stanza.",
    });
  }
  notes.push({
    kind: "info",
    text: "iQuery is an XML protocol sent gzip-compressed over TCP 4353; iqdump shows it decompressed and in the clear so you can read the exchange.",
  });

  const title = peer
    ? `iqdump: connection to big3d at ${peer}`
    : "iqdump output";
  return { ok: true, mode: "iqdump", title, fields, notes };
}

function decodeGtmLog(text: string): IqueryResult {
  const fields: DecodedField[] = [];
  const notes: IqueryNote[] = [];

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    // Box state change: "... Box 10.14.20.209 state change green --> red"
    const state = line.match(/Box\s+(\S+)\s+state change\s+(\w+)\s*-->\s*(\w+)/i);
    if (state) {
      const [, box, from, to] = state;
      const down = /red|blue|down/i.test(to) && /green/i.test(from);
      fields.push({
        label: `Box ${box}`,
        value: `${from} --> ${to}`,
        explain:
          `gtmd logged an iQuery-mesh state change for the BIG-IP at ${box}: it went from ${from} to ${to}. ` +
          (down
            ? "green -> red means the box became unavailable over iQuery (lost big3d connection or failed monitoring); GSLB will stop trusting that box's objects."
            : "This is a state transition on the mesh; correlate with big3d connection logs to see why."),
      });
      notes.push({
        kind: down ? "warn" : "info",
        text: down
          ? `A box went green -> red: check the iQuery path to ${box} (TCP 4353, SSL trust) with iqdump, and confirm big3d there is running and version-compatible.`
          : `State transition for ${box} recorded.`,
      });
      continue;
    }
    // SNMP_TRAP tag without the explicit arrow.
    if (/SNMP_TRAP/i.test(line)) {
      fields.push({
        label: "SNMP_TRAP",
        value: line.replace(/^.*SNMP_TRAP:?\s*/i, "").trim() || line,
        explain: "gtmd raised an SNMP trap on an iQuery-mesh state change. The box named is the BIG-IP whose availability changed.",
      });
      continue;
    }
    // big3d connection established/lost.
    const conn = line.match(/big3d.*(established|connect(?:ed)?|lost)/i);
    if (conn) {
      const lost = /lost/i.test(conn[1]);
      fields.push({
        label: "big3d connection",
        value: conn[1],
        explain: lost
          ? "gtmd lost its iQuery connection to a big3d agent. Until it reconnects, that peer's object availability is unknown to this BIG-IP DNS."
          : "gtmd established (or re-established) an iQuery connection to a big3d agent; that peer's objects are now visible again.",
      });
      continue;
    }
  }

  if (fields.length === 0) {
    notes.push({
      kind: "warn",
      text: "This looks like a gtm log but no iQuery state-change or big3d-connection lines were recognized. Paste lines such as the SNMP_TRAP box state-change messages from /var/log/gtm.",
    });
  } else {
    notes.push({
      kind: "info",
      text: "/var/log/gtm records iQuery connection status: gtmd logs a message whenever a big3d connection is established or lost, and can raise an SNMP trap on a box state change.",
    });
  }

  return { ok: true, mode: "log", title: "/var/log/gtm iQuery messages", fields, notes };
}

// ---- Topic handling --------------------------------------------------------

function topicsIndex(): IqueryResult {
  return {
    ok: true,
    mode: "topics-index",
    title: "iQuery topics",
    fields: [],
    topics: TOPIC_ORDER.map((id) => TOPICS[id]),
    notes: [
      {
        kind: "info",
        text: "Pick a topic to explain, or paste iqdump output or /var/log/gtm lines to decode them. Everything is offline; nothing is sent anywhere.",
      },
    ],
  };
}

function explainTopic(id: TopicId): IqueryResult {
  return {
    ok: true,
    mode: "topic",
    title: TOPICS[id].title,
    fields: [],
    topic: TOPICS[id],
    notes: [],
  };
}

function resolveTopic(text: string): TopicId | null {
  const t = text.trim();
  // Exact topic id?
  if ((TOPIC_ORDER as string[]).includes(t.toLowerCase())) return t.toLowerCase() as TopicId;
  for (const { re, id } of TOPIC_KEYWORDS) {
    if (re.test(t)) return id;
  }
  return null;
}

// ---- Entry point -----------------------------------------------------------

export function run(input: string): IqueryResult {
  if (typeof input !== "string") {
    throw new Error("Input must be a string.");
  }
  if (input.length > MAX_INPUT) {
    throw new Error(`Input too large (${input.length} chars; limit ${MAX_INPUT}).`);
  }
  const text = input.trim();

  // Empty or an explicit request for the list -> the topic index.
  if (text === "" || /^(topics?|list|help|\?)$/i.test(text)) {
    return topicsIndex();
  }

  // Structured pastes win over keyword matching.
  if (isIqdump(text)) return decodeIqdump(text);
  if (isGtmLog(text)) return decodeGtmLog(text);

  // Otherwise treat it as a topic request.
  const id = resolveTopic(text);
  if (id) return explainTopic(id);

  // Unrecognized: return the index with a nudge (still ok:true, deterministic).
  const idx = topicsIndex();
  idx.notes = [
    {
      kind: "warn",
      text: `"${text.slice(0, 60)}" was not recognized as iqdump output, a gtm log line, or a known topic. Pick a topic below, or paste iqdump / /var/log/gtm text.`,
    },
    ...idx.notes,
  ];
  return idx;
}
