// ============================================================================
// src/lib/tools/f5-irules-event-order/compute.ts
// ----------------------------------------------------------------------------
// F5 BIG-IP iRule event-order planner (arsenal-local, pure, deterministic).
//
// Given the profile stack on a Standard (full-proxy) virtual server — whether
// it has a client-SSL profile, an HTTP profile, a server-SSL profile, and a
// pool — this returns the order in which the common connection-processing iRule
// events fire, from CLIENT_ACCEPTED through CLIENT_CLOSED, plus the conditional
// events (data-collection and failure paths) and where they slot in.
//
// PURE: no I/O, no clock, no device contact. It is a model of documented F5
// behaviour, not a probe — same input always yields the same output. It never
// connects to a BIG-IP. Liftable into an open library later.
//
// Sources: F5 Clouddocs "Master List of iRule Events" and the per-event pages
// (CLIENT_ACCEPTED, HTTP_REQUEST, HTTP_REQUEST_SEND, HTTP_RESPONSE, LB_SELECTED,
// LB_FAILED, et al.); event ordering cross-checked against the DevCentral
// "iRule Event Order" codeshare capture.
// ============================================================================

const MAX_INPUT = 400;

export class EventOrderInputError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "EventOrderInputError";
    this.code = code;
  }
}

export interface VirtualConfig {
  fastL4: boolean; // FastL4 vs Standard full-proxy
  clientSsl: boolean;
  http: boolean;
  serverSsl: boolean;
  pool: boolean;
}

export type EventSide = "client" | "server" | "global";
export type EventTrigger = "automatic" | "collect" | "failure" | "conditional";

export interface IRuleEvent {
  name: string;
  side: EventSide;
  phase: string;
  fires: string;
  trigger: EventTrigger;
  /** For conditional events: the automatic event it sits next to. */
  near?: string;
}

export interface EventOrderResult {
  config: VirtualConfig;
  events: IRuleEvent[]; // automatic events that fire, in order
  conditional: IRuleEvent[]; // gated events (collect / failure / 100-continue)
  notes: { level: "info" | "warn"; text: string }[];
}

interface EventDef extends IRuleEvent {
  enabled: (c: VirtualConfig) => boolean;
}

// The canonical ordered sequence of automatic connection-processing events.
const AUTOMATIC: EventDef[] = [
  {
    name: "CLIENT_ACCEPTED",
    side: "client",
    phase: "Connection setup",
    fires: "A client connection is established. On a Standard virtual server this is when the TCP three-way handshake completes; on FastL4 it fires on the initial SYN.",
    trigger: "automatic",
    enabled: () => true,
  },
  {
    name: "CLIENTSSL_CLIENTHELLO",
    side: "client",
    phase: "Client-side TLS",
    fires: "The client's TLS ClientHello has been received, before the handshake is processed. Useful for SNI-based decisions.",
    trigger: "automatic",
    enabled: (c) => c.clientSsl,
  },
  {
    name: "CLIENTSSL_HANDSHAKE",
    side: "client",
    phase: "Client-side TLS",
    fires: "The client-side TLS handshake has completed successfully.",
    trigger: "automatic",
    enabled: (c) => c.clientSsl,
  },
  {
    name: "HTTP_REQUEST",
    side: "client",
    phase: "Request",
    fires: "The system has fully parsed the complete client HTTP request headers.",
    trigger: "automatic",
    enabled: (c) => c.http,
  },
  {
    name: "LB_SELECTED",
    side: "global",
    phase: "Load balancing",
    fires: "The system has selected a pool member for the connection.",
    trigger: "automatic",
    enabled: (c) => c.pool,
  },
  {
    name: "SERVER_CONNECTED",
    side: "server",
    phase: "Server-side setup",
    fires: "The server-side connection to the selected pool member has been established.",
    trigger: "automatic",
    enabled: (c) => c.pool,
  },
  {
    name: "SERVERSSL_HANDSHAKE",
    side: "server",
    phase: "Server-side TLS",
    fires: "The server-side TLS handshake has completed successfully.",
    trigger: "automatic",
    enabled: (c) => c.pool && c.serverSsl,
  },
  {
    name: "HTTP_REQUEST_SEND",
    side: "server",
    phase: "Send to server",
    fires: "Immediately before the HTTP request is sent to the server-side TCP stack. Runs in the server-side context.",
    trigger: "automatic",
    enabled: (c) => c.pool && c.http,
  },
  {
    name: "HTTP_RESPONSE",
    side: "client",
    phase: "Response",
    fires: "The system has parsed all of the response status and header lines from the server response.",
    trigger: "automatic",
    enabled: (c) => c.pool && c.http,
  },
  {
    name: "SERVER_CLOSED",
    side: "server",
    phase: "Teardown",
    fires: "The server-side connection has been closed.",
    trigger: "automatic",
    enabled: (c) => c.pool,
  },
  {
    name: "CLIENT_CLOSED",
    side: "client",
    phase: "Teardown",
    fires: "The client-side connection has been closed.",
    trigger: "automatic",
    enabled: () => true,
  },
];

// Conditional events: gated on an iRule ::collect, a failure, or a 100-Continue.
const CONDITIONAL: EventDef[] = [
  {
    name: "CLIENT_DATA",
    side: "client",
    phase: "Request",
    fires: "After a TCP::collect on the client side has gathered the requested data. Common on raw TCP virtual servers with no HTTP profile.",
    trigger: "collect",
    near: "CLIENT_ACCEPTED",
    enabled: (c) => !c.http, // most relevant when there is no HTTP profile
  },
  {
    name: "HTTP_REQUEST_DATA",
    side: "client",
    phase: "Request",
    fires: "After an HTTP::collect has gathered the specified amount of request payload.",
    trigger: "collect",
    near: "HTTP_REQUEST",
    enabled: (c) => c.http,
  },
  {
    name: "LB_FAILED",
    side: "global",
    phase: "Load balancing",
    fires: "Instead of LB_SELECTED, when the system fails to select a pool or member, or the selected resource is unreachable.",
    trigger: "failure",
    near: "LB_SELECTED",
    enabled: (c) => c.pool,
  },
  {
    name: "SERVER_DATA",
    side: "server",
    phase: "Server-side setup",
    fires: "After a TCP::collect on the server side has gathered the requested data.",
    trigger: "collect",
    near: "SERVER_CONNECTED",
    enabled: (c) => c.pool && !c.http,
  },
  {
    name: "HTTP_RESPONSE_CONTINUE",
    side: "client",
    phase: "Response",
    fires: "Before HTTP_RESPONSE, whenever the server sends a 100 Continue interim response.",
    trigger: "conditional",
    near: "HTTP_RESPONSE",
    enabled: (c) => c.pool && c.http,
  },
  {
    name: "HTTP_RESPONSE_DATA",
    side: "client",
    phase: "Response",
    fires: "After an HTTP::collect has gathered the specified amount of response payload.",
    trigger: "collect",
    near: "HTTP_RESPONSE",
    enabled: (c) => c.pool && c.http,
  },
];

function strip(e: EventDef): IRuleEvent {
  const { enabled, ...rest } = e;
  void enabled;
  return rest;
}

export function planEventOrder(config: VirtualConfig): EventOrderResult {
  const notes: EventOrderResult["notes"] = [];

  if (config.fastL4) {
    notes.push({
      level: "warn",
      text: "FastL4 is a packet-based fast path, not a full TCP proxy. Most L7 and SSL events do not fire; CLIENT_ACCEPTED triggers on the initial SYN. This model shows the Standard (full-proxy) sequence — treat the HTTP and SSL rows as not applicable under FastL4.",
    });
  }
  if (config.serverSsl && !config.pool) {
    notes.push({
      level: "warn",
      text: "A server-SSL profile only takes effect once there is a server-side connection. With no pool, the server-side events (including SERVERSSL_HANDSHAKE) never fire.",
    });
  }
  if (config.http && !config.pool) {
    notes.push({
      level: "info",
      text: "With an HTTP profile but no pool, HTTP_REQUEST still fires (the request is parsed on the client side), but there is no server to forward to — typical of an iRule that answers directly with HTTP::respond.",
    });
  }
  if (config.serverSsl && !config.clientSsl) {
    notes.push({
      level: "info",
      text: "Server-SSL without client-SSL means the BIG-IP terminates plaintext from the client and initiates TLS to the pool — a less common 'encrypt on the way out' design.",
    });
  }
  notes.push({
    level: "info",
    text: "Within a single event, multiple iRules run by priority (default 500, lowest number first); the priority command overrides that. This ordering is across events, not within one.",
  });
  notes.push({
    level: "info",
    text: "Availability also depends on provisioning: module events (APM ACCESS_*, ASM/Advanced WAF, bot defense) only fire when that module is provisioned. And CLIENT_DATA, SERVER_DATA, HTTP_REQUEST_DATA, and HTTP_RESPONSE_DATA need an explicit TCP::collect or HTTP::collect first.",
  });

  const events = AUTOMATIC.filter((e) => e.enabled(config)).map(strip);
  const conditional = CONDITIONAL.filter((e) => e.enabled(config)).map(strip);

  return { config, events, conditional, notes };
}

const TOKEN_MAP: { match: RegExp; apply: (c: VirtualConfig) => void }[] = [
  { match: /^fastl4$/, apply: (c) => (c.fastL4 = true) },
  { match: /^standard$/, apply: (c) => (c.fastL4 = false) },
  { match: /^(client-?ssl|clientssl)$/, apply: (c) => (c.clientSsl = true) },
  { match: /^(server-?ssl|serverssl)$/, apply: (c) => (c.serverSsl = true) },
  { match: /^https$/, apply: (c) => ((c.clientSsl = true), (c.http = true)) },
  { match: /^http$/, apply: (c) => (c.http = true) },
  { match: /^(pool|lb|members?)$/, apply: (c) => (c.pool = true) },
];

/** Parse a shorthand profile stack like "https serverssl pool" into a config. */
export function parseProfileStack(input: string): VirtualConfig {
  if (input.length > MAX_INPUT) {
    throw new EventOrderInputError("tooLong", `input exceeds ${MAX_INPUT} characters`);
  }
  const config: VirtualConfig = {
    fastL4: false,
    clientSsl: false,
    http: false,
    serverSsl: false,
    pool: false,
  };
  const tokens = input
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean);
  if (tokens.length === 0) throw new EventOrderInputError("empty", "no profiles given");
  let matched = false;
  for (const tok of tokens) {
    for (const { match, apply } of TOKEN_MAP) {
      if (match.test(tok)) {
        apply(config);
        matched = true;
        break;
      }
    }
  }
  if (!matched) {
    throw new EventOrderInputError(
      "invalid",
      "no recognizable profiles (try: standard, clientssl, http, serverssl, pool)"
    );
  }
  return config;
}

/** Stable string entry point for golden vectors and the manifest run. */
export function run(input: string): EventOrderResult {
  return planEventOrder(parseProfileStack(input));
}
