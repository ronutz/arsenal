// ============================================================================
// src/lib/tools/f5-irules-command-context/compute.ts
// ----------------------------------------------------------------------------
// READS AN iRULE THE WAY THE REFERENCE WOULD. Paste an iRule and every
// `when` block renders with: the event's identity in F5's own one-liner
// (curated from the Master List of iRule Events on clouddocs, module and
// reference link included), the commands the block uses, each with its
// module context and a direct link to its reference page, the evaluation-
// order analysis for multi-block rules (the priority command's documented
// rules: values 0-1000, default 500, lower runs first, insertion order
// breaks ties), and a CMP audit built strictly from the CMP Compatibility
// page: global ($::) variables demote the virtual server from CMP (the
// validator catches the Global keyword as of v10), static:: variables are
// the documented CMP-compatible alternative for shared statics, keys
// generated in RULE_INIT are per-TMM (cross-TMM decryption fails), and
// statistics profiles count per TMM instance.
//
// Honesty note, deliberately engineered in: per-command event-validity
// lists live on each command's own reference page and vary by version.
// This tool inventories the commands and links each page rather than
// reproducing validity tables it has not verified; the event cards and the
// CMP audit are the verified layers.
//
// Sources: clouddocs Master List of iRule Events (identities verbatim),
// the priority command reference (evaluation order), the CMP Compatibility
// page (every demotion claim), the Master List of iRule Commands (module
// naming), all accessed 2026-07-03.
// ============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EventInfo {
  name: string;
  module: string;
  /** F5's one-line description from the Master List, condensed faithfully. */
  description: string;
  url: string;
}

export interface CommandUse {
  name: string;
  module: string | null; // "HTTP" for HTTP::header; null for bare commands
  count: number;
  url: string;
}

export interface WhenBlock {
  event: string;
  info: EventInfo | null; // null = outside the curated table
  priority: number; // explicit or the documented default 500
  priorityExplicit: boolean;
  line: number;
  commands: CommandUse[];
  cmpFindings: string[];
  notes: string[];
}

export interface IRulesContextResult {
  ok: boolean;
  mode: "rule" | "event" | "catalog";
  blocks?: WhenBlock[];
  orderAnalysis?: string[];
  event?: EventInfo;
  catalog?: { module: string; events: EventInfo[] }[];
  ruleFindings: string[]; // rule-wide CMP + hygiene findings
  notes: string[];
}

export type ToolRunResult = IRulesContextResult;

// ---------------------------------------------------------------------------
// THE CURATED EVENT TABLE - identities from the Master List of iRule Events
// (clouddocs), condensed faithfully; module grouping and URLs as published.
// LTM-scope modules curated for v1; events outside the table still parse
// and are flagged, never guessed at.
// ---------------------------------------------------------------------------

const U = (n: string) => `https://clouddocs.f5.com/api/irules/${n}.html`;
const E = (name: string, module: string, description: string): EventInfo => ({ name, module, description, url: U(name) });

export const EVENTS: readonly EventInfo[] = Object.freeze([
  // ---- GLOBAL ----------------------------------------------------------------
  E("RULE_INIT", "GLOBAL", "Triggered when an iRule is added or is modified."),
  E("FLOW_INIT", "GLOBAL", "Triggered once for TCP and unique UDP/IP flows, after packet filters."),
  E("LB_SELECTED", "GLOBAL", "Triggered when the system selects a pool member."),
  E("LB_FAILED", "GLOBAL", "Triggered when the system fails to select a pool or a pool member, or when a selected resource is unreachable."),
  E("LB_QUEUED", "LB", "Serverside event triggered when a connection limit is hit at the pool or pool member level."),
  E("PERSIST_DOWN", "GLOBAL", "Triggered when persistence dictates that a connection would be sent to a pool, pool member, or node which has been marked down."),
  E("SA_PICKED", "GLOBAL", "Triggered after source translation is completed."),
  E("NAME_RESOLVED", "GLOBAL", "Triggered after a NAME::lookup command has been issued and a response has been received."),
  E("SERVER_INIT", "GLOBAL", "Triggered when BIG-IP has been configured to collect options and the serverside TCP SYN is sent."),
  // ---- connection lifecycle (TCP/IP/UDP/SCTP) ---------------------------------
  E("CLIENT_ACCEPTED", "TCP", "Triggered when a client has established a connection."),
  E("CLIENT_CLOSED", "TCP", "Fired at the end of any client connection, regardless of protocol."),
  E("CLIENT_DATA", "TCP", 'Triggered each time new data is received from the client while the connection is in "collect" state.'),
  E("SERVER_CONNECTED", "TCP", "Triggered when a connection has been established with the target node."),
  E("SERVER_CLOSED", "TCP", "Triggered when the server side connection closes."),
  E("SERVER_DATA", "TCP", "Triggered when new data is received from the target node after TCP::collect has been issued."),
  E("USER_REQUEST", "TCP", "Triggered by the TCP::notify request command."),
  E("USER_RESPONSE", "TCP", "Triggered by the TCP::notify response command."),
  // ---- HTTP --------------------------------------------------------------------
  E("HTTP_REQUEST", "HTTP", "Triggered when the system fully parses the complete client HTTP request headers."),
  E("HTTP_REQUEST_DATA", "HTTP", "Triggered when an HTTP::collect command has collected the specified amount of request data."),
  E("HTTP_REQUEST_SEND", "HTTP", "Triggered immediately before an HTTP request is sent to the server-side TCP stack."),
  E("HTTP_REQUEST_RELEASE", "HTTP", "Triggered when the system is about to release HTTP data on the serverside of the connection."),
  E("HTTP_RESPONSE", "HTTP", "Triggered when the system parses all of the response status and header lines from the server response."),
  E("HTTP_RESPONSE_DATA", "HTTP", "Triggered when an HTTP::collect command has collected the specified amount of response data."),
  E("HTTP_RESPONSE_CONTINUE", "HTTP", "Triggered whenever the system receives a 100 Continue response from the server."),
  E("HTTP_RESPONSE_RELEASE", "HTTP", "Triggered when the system is about to release HTTP data on the clientside of the connection."),
  E("HTTP_REJECT", "HTTP", "Triggered when HTTP aborts the connection."),
  E("HTTP_DISABLED", "HTTP", "Triggered when HTTP is disabled."),
  E("HTTP_PROXY_REQUEST", "HTTP", "Triggered when a virtual server has proxy-mode explicit."),
  E("HTTP_PROXY_RESPONSE", "HTTP", "Triggered when the response from the remote HTTP proxy is received."),
  E("HTTP_PROXY_CONNECT", "HTTP", "Triggered when proxy chaining via use of the HTTP proxy connect profile."),
  // ---- SSL ---------------------------------------------------------------------
  E("CLIENTSSL_CLIENTHELLO", "SSL", "Triggered when the system has received the client's SSL ClientHello message."),
  E("CLIENTSSL_HANDSHAKE", "SSL", "Triggered when a client-side SSL handshake is completed."),
  E("CLIENTSSL_CLIENTCERT", "SSL", "Triggered when the system adds an SSL client certificate to the client certificate chain."),
  E("CLIENTSSL_DATA", "SSL", 'Triggered each time new SSL data is received from the client while the connection is in "collect" state.'),
  E("CLIENTSSL_PASSTHROUGH", "SSL", "Triggered when SSL receives plaintext data and enters passthrough mode."),
  E("CLIENTSSL_SERVERHELLO_SEND", "SSL", "Triggered when the system is about to send its SSL ServerHello message on the clientside connection."),
  E("SERVERSSL_CLIENTHELLO_SEND", "SSL", "Triggered when the system is about to send its SSL ClientHello message."),
  E("SERVERSSL_HANDSHAKE", "SSL", "Triggered when a server-side SSL handshake is completed."),
  E("SERVERSSL_SERVERHELLO", "SSL", "Triggered when the system has received the server's SSL ServerHello message."),
  E("SERVERSSL_SERVERCERT", "SSL", "Triggered when the system finishes the server certificate verification."),
  E("SERVERSSL_DATA", "SSL", "Triggered when new SSL data is received from the target node after SSL::collect has been issued."),
  // ---- DNS / GTM ------------------------------------------------------------------
  E("DNS_REQUEST", "DNS", "Triggered when the system receives a DNS request."),
  E("DNS_RESPONSE", "DNS", "Triggered when the system responds to a DNS request."),
  // ---- content -----------------------------------------------------------------------
  E("CACHE_REQUEST", "CACHE", "Triggered when the system receives a request for a cached object."),
  E("CACHE_RESPONSE", "CACHE", "Triggered immediately prior to sending a cache response."),
  E("STREAM_MATCHED", "STREAM", "Triggered when a stream expression matches."),
  E("HTML_TAG_MATCHED", "HTML", "Raised when an HTML tag is encountered."),
  E("HTML_COMMENT_MATCHED", "HTML", "Raised when an HTML comment is encountered."),
  // ---- SIP ----------------------------------------------------------------------------
  E("SIP_REQUEST", "SIP", "Triggered when the system fully parses a complete client SIP request header."),
  E("SIP_RESPONSE", "SIP", "Triggered when a SIP response is received from the server."),
  // ---- WebSocket -------------------------------------------------------------------------
  E("WS_REQUEST", "WS", "Raised when certain headers are present in the client request."),
  E("WS_RESPONSE", "WS", "Raised when certain headers are present in the server response."),
  E("WS_CLIENT_FRAME", "WS", "Raised to indicate the start of a WebSocket frame received from the client."),
  E("WS_SERVER_FRAME", "WS", "Raised to indicate the start of a WebSocket frame received from the server."),
]);

const EVENT_BY_NAME: ReadonlyMap<string, EventInfo> = new Map(EVENTS.map((e) => [e.name, e]));

/** Documented priority bounds and default, per the priority command page. */
export const PRIORITY_DEFAULT = 500;
const PRIORITY_MIN = 0;
const PRIORITY_MAX = 1000;

// Tcl / iRule noise words the command lexer should not report as commands.
const TCL_NOISE = new Set([
  "when", "if", "elseif", "else", "then", "set", "unset", "return", "switch",
  "default", "foreach", "for", "while", "break", "continue", "proc", "expr",
  "string", "regexp", "regsub", "scan", "format", "lindex", "llength", "lappend",
  "lsearch", "lsort", "split", "join", "incr", "catch", "array", "info", "not",
  "and", "or", "eq", "ne", "contains", "starts_with", "ends_with", "equals",
  "matches_regex", "priority", "list", "puts", "binary", "clock", "subst",
]);

// Bare (non-namespaced) iRule commands worth inventorying, with their pages.
const BARE_COMMANDS = new Set([
  "pool", "node", "snat", "snatpool", "persist", "discard", "drop", "reject",
  "forward", "virtual", "log", "table", "session", "event", "timing", "relate_client",
  "relate_server", "findclass", "matchclass", "class", "lasthop", "listen", "peer",
  "translate", "use", "members", "active_members", "whereis", "domain", "getfield",
  "findstr", "substr", "htonl", "htons", "ntohl", "ntohs", "crc32", "md5", "sha1",
  "sha256", "sha384", "sha512", "b64encode", "b64decode", "URI::decode",
]);

// ---------------------------------------------------------------------------
// The when-block parser: brace-balanced extraction of
//   when EVENT [priority N] { ... }
// Comments (#) are stripped line-wise before lexing so commented-out code
// neither creates blocks nor inflates command counts.
// ---------------------------------------------------------------------------

export interface RawBlock {
  event: string;
  priority: number;
  priorityExplicit: boolean;
  body: string;
  line: number;
}

export function stripComments(text: string): string {
  return text
    .split("\n")
    .map((l) => {
      const i = l.indexOf("#");
      return i >= 0 ? l.slice(0, i) : l;
    })
    .join("\n");
}

export function parseWhenBlocks(text: string): { blocks: RawBlock[]; leftover: string } {
  const blocks: RawBlock[] = [];
  const re = /when\s+([A-Z][A-Z0-9_]+)(?:\s+priority\s+(\d+))?\s*\{/g;
  let m: RegExpExecArray | null;
  let consumedRanges: Array<[number, number]> = [];
  while ((m = re.exec(text)) !== null) {
    const start = m.index;
    // Balance braces from the opening one.
    let depth = 0;
    let i = start + m[0].length - 1; // at the '{'
    let end = -1;
    for (; i < text.length; i++) {
      if (text[i] === "{") depth++;
      else if (text[i] === "}") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end < 0) {
      // Unbalanced: take to EOF and let the caller note it.
      end = text.length - 1;
    }
    const line = text.slice(0, start).split("\n").length;
    blocks.push({
      event: m[1],
      priority: m[2] !== undefined ? Number.parseInt(m[2], 10) : PRIORITY_DEFAULT,
      priorityExplicit: m[2] !== undefined,
      body: text.slice(start + m[0].length, end),
      line,
    });
    consumedRanges.push([start, end + 1]);
    re.lastIndex = end + 1;
  }
  let leftover = "";
  let cursor = 0;
  for (const [s, e] of consumedRanges) {
    leftover += text.slice(cursor, s);
    cursor = e;
  }
  leftover += text.slice(cursor);
  return { blocks, leftover };
}

// ---------------------------------------------------------------------------
// The command lexer + the sourced CMP audit
// ---------------------------------------------------------------------------

function lexCommands(body: string): CommandUse[] {
  const found = new Map<string, CommandUse>();
  // Namespaced commands: MODULE::sub (module uppercase-ish, sub word chars).
  for (const m of body.matchAll(/\b([A-Z][A-Za-z0-9]*)::([a-zA-Z0-9_]+)\b/g)) {
    const name = `${m[1]}::${m[2]}`;
    if (m[1] === "static") continue; // static:: is a variable namespace, audited separately
    const key = name;
    const cur = found.get(key);
    if (cur) cur.count++;
    else found.set(key, { name, module: m[1], count: 1, url: U(`${m[1]}__${m[2]}`) });
  }
  // Bare commands at word boundaries.
  for (const m of body.matchAll(/(^|[\s;\[{])([a-z_][a-z0-9_]*)\b/gm)) {
    const word = m[2];
    if (TCL_NOISE.has(word) || !BARE_COMMANDS.has(word)) continue;
    const cur = found.get(word);
    if (cur) cur.count++;
    else found.set(word, { name: word, module: null, count: 1, url: U(word) });
  }
  return [...found.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function cmpAudit(body: string, event: string): string[] {
  const findings: string[] = [];
  // Global ($::name / set ::name) variables - the sourced demotion.
  const globals = new Set<string>();
  for (const m of body.matchAll(/(?:\$|set\s+|unset\s+|incr\s+|append\s+|lappend\s+)::([A-Za-z0-9_]+)/g)) {
    globals.add(m[1]);
  }
  // Filter static:: (captured as ':' boundary won't match 'static::x' here because
  // the pattern requires '::' immediately after $/set - 'set static::x' has 'static'
  // between; but '$static::x' would match '::x'? No: '$static::x' - the regex needs
  // '$::' adjacency, '$static::x' has '$s'. Safe.)
  if (globals.size > 0) {
    findings.push(
      `Global variables in use (${[...globals].map((g) => "::" + g).join(", ")}): per the CMP Compatibility page, global variables are not CMP-compatible, the validator catches the global form as of v10, and the virtual server is demoted from CMP, putting every connection for it on a single TMM. The documented alternative for shared static values is the static:: namespace.`,
    );
  }
  if (/\bstatic::[A-Za-z0-9_]+/.test(body)) {
    findings.push(
      "static:: variables in use: the CMP-compatible mechanism the compatibility page names for shared static values. Remember they are set at initialization, not shared mutable state.",
    );
  }
  if (event === "RULE_INIT" && /(CRYPTO::|AES::|key)/.test(body)) {
    findings.push(
      "Key material handled in RULE_INIT: the compatibility page warns that when keys are generated in RULE_INIT, every TMM gets its own key, so requests cannot be decrypted successfully across TMM instances. Derive or share keys in a CMP-aware way instead.",
    );
  }
  if (/\bSTATS::/.test(body)) {
    findings.push(
      "STATS:: usage: the compatibility page notes statistics profiles are not fully CMP-compatible; each TMM instance keeps a separate instance of the profile, with cumulative counts shown in the GUI and SNMP.",
    );
  }
  return findings;
}

// ---------------------------------------------------------------------------
// run()
// ---------------------------------------------------------------------------

export function run(input: string): IRulesContextResult {
  const text = (input ?? "").trim();

  if (!text) {
    throw new Error(
      'Paste an iRule (when EVENT { ... } blocks), a single event name (for example "HTTP_REQUEST"), or the word "events" for the curated catalogue.',
    );
  }

  if (/^(events|catalog|list)$/i.test(text)) {
    const modules = [...new Set(EVENTS.map((e) => e.module))];
    return {
      ok: true,
      mode: "catalog",
      catalog: modules.map((m) => ({ module: m, events: EVENTS.filter((e) => e.module === m) })),
      ruleFindings: [],
      notes: [
        "Identities condensed faithfully from the Master List of iRule Events on clouddocs; the curated set covers the LTM-scope modules. Events outside it still parse in rules and are flagged, never guessed at.",
      ],
    };
  }

  if (!text.includes("{") && /^[A-Z][A-Z0-9_]+$/.test(text)) {
    const info = EVENT_BY_NAME.get(text);
    if (info) return { ok: true, mode: "event", event: info, ruleFindings: [], notes: [] };
    throw new Error(`"${text}" is not in the curated event table. Type "events" to list it; the Master List on clouddocs is the full set.`);
  }

  const stripped = stripComments(text);
  const { blocks: raw, leftover } = parseWhenBlocks(stripped);
  if (raw.length === 0) {
    throw new Error('No "when EVENT { ... }" blocks found. Paste an iRule, an event name, or "events".');
  }

  const notes: string[] = [];
  if (/\bwhen\s+[a-z]/.test(leftover)) {
    notes.push("Something that looks like a lowercase when clause was skipped; iRule event names are uppercase.");
  }

  const blocks: WhenBlock[] = raw.map((b) => {
    const info = EVENT_BY_NAME.get(b.event) ?? null;
    const blockNotes: string[] = [];
    if (!info) {
      blockNotes.push(
        `"${b.event}" is outside this tool's curated event table (the LTM-scope modules of the Master List). It parses and its commands are inventoried; its identity line is on its reference page.`,
      );
    }
    if (b.priorityExplicit && (b.priority < PRIORITY_MIN || b.priority > PRIORITY_MAX)) {
      blockNotes.push(`priority ${b.priority} is outside the documented 0-1000 range.`);
    }
    return {
      event: b.event,
      info,
      priority: b.priority,
      priorityExplicit: b.priorityExplicit,
      line: b.line,
      commands: lexCommands(b.body),
      cmpFindings: cmpAudit(b.body, b.event),
      notes: blockNotes,
    };
  });

  // Evaluation-order analysis for events that appear more than once,
  // per the priority command's documented rules.
  const orderAnalysis: string[] = [];
  const byEvent = new Map<string, WhenBlock[]>();
  for (const b of blocks) {
    const arr = byEvent.get(b.event) ?? [];
    arr.push(b);
    byEvent.set(b.event, arr);
  }
  for (const [ev, arr] of byEvent) {
    if (arr.length < 2) continue;
    const ordered = [...arr].sort((a, b) => a.priority - b.priority || a.line - b.line);
    orderAnalysis.push(
      `${ev} appears ${arr.length} times. Per the priority reference (default 500, lower runs first, same priority runs in insertion order), the evaluation order here is: ${ordered
        .map((b) => `line ${b.line} (priority ${b.priority}${b.priorityExplicit ? "" : " default"})`)
        .join(" then ")}. Across multiple iRules on one virtual, same-priority blocks run in the order the rules are listed on the virtual.`,
    );
  }

  // Rule-wide findings.
  const ruleFindings: string[] = [];
  const anyGlobals = blocks.some((b) => b.cmpFindings.some((f) => f.startsWith("Global variables")));
  if (anyGlobals) {
    ruleFindings.push(
      "CMP verdict: this rule demotes its virtual server from clustered multiprocessing as written (global variables). Demotion means every connection for the virtual is handled by a single TMM; the fix the compatibility page names is static:: for shared statics, or the table/session commands' documented patterns for shared mutable state.",
    );
  }
  ruleFindings.push(
    "Per-command event validity lives on each command's reference page and varies by version; every command above links to its page rather than this tool reproducing validity tables it has not verified.",
  );

  return { ok: true, mode: "rule", blocks, orderAnalysis, ruleFindings, notes };
}

// Shared-parser aliases for sibling tools.
export { parseWhenBlocks as parseWhenBlocksShared, stripComments as stripCommentsShared };
