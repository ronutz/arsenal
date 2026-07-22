// ============================================================================
// src/lib/tools/http-status-code-explainer/compute.ts
// ----------------------------------------------------------------------------
// THE HTTP STATUS CODE EXPLAINER ENGINE. Paste codes (bare "404", lists
// "301 302 307", or family queries "4xx") and get each one decoded: family,
// registered name, documented meaning, and the operational notes an
// engineer actually needs (which redirect preserves the method, why 401
// must carry WWW-Authenticate, how 502/503/504 triage differently). The
// registry below is grounded in RFC 9110's status catalogue plus the
// registered extensions cited in the manifest. Unknown-but-valid codes are
// not an error: the engine answers with the family fallback rule - the
// protocol's own forward-compatibility design - which is itself the
// teaching moment. Deterministic, bounded, local. (D-19 comments.)
// ============================================================================

export interface CodeExplanation {
  code: number;
  family: 1 | 2 | 3 | 4 | 5;
  familyName: string;
  name: string;
  meaning: string;
  notes: string[];
  /** True when the code is not in the registry and the family rule answered. */
  fallback: boolean;
}

export interface FamilyExplanation {
  family: 1 | 2 | 3 | 4 | 5;
  familyName: string;
  meaning: string;
}

export interface StatusExplainResult {
  codes: CodeExplanation[];
  families: FamilyExplanation[];
  notes: string[];
}

const FAMILY: Record<number, { name: string; meaning: string }> = {
  1: {
    name: "1xx Informational",
    meaning:
      "Interim responses before the final one: the request was received and the process continues. Clients must tolerate them and keep waiting for the real status.",
  },
  2: {
    name: "2xx Success",
    meaning: "The request was received, understood, and accepted - the outcome the client asked for happened.",
  },
  3: {
    name: "3xx Redirection",
    meaning:
      "Further action is needed to complete the request, usually at another location named in the Location header. Cache and method-preservation semantics differ per code - the family's whole subtlety.",
  },
  4: {
    name: "4xx Client Error",
    meaning:
      "The request itself is at fault - malformed, unauthorized, or aimed at something that is not there. Fix the request before retrying; blind retries will fail identically.",
  },
  5: {
    name: "5xx Server Error",
    meaning:
      "The server failed to fulfill an apparently valid request. The fault is on the serving side - which in incident triage points you at the stack, not the client.",
  },
};

// -- The registry: code -> name, meaning, operational notes. Grounded in the
//    RFC 9110 catalogue plus the registered extensions in the manifest.
const CODES: Record<number, { name: string; meaning: string; notes?: string[] }> = {
  100: { name: "Continue", meaning: "Interim go-ahead: the server has the headers and the client should send the request body.", notes: ["Pairs with the Expect: 100-continue request header - the client waits for this before shipping a large body."] },
  101: { name: "Switching Protocols", meaning: "The server agrees to change protocols as the Upgrade header requested.", notes: ["This is how a WebSocket connection leaves HTTP/1.1."] },
  103: { name: "Early Hints", meaning: "Preliminary headers - typically Link preload hints - sent before the final response so the browser can start fetching dependencies.", notes: ["Defined in RFC 8297; the final status still follows."] },
  200: { name: "OK", meaning: "The request succeeded; the meaning of the payload depends on the method (GET returns the representation, POST returns the result)." },
  201: { name: "Created", meaning: "A new resource was created; its location typically arrives in the Location header." },
  202: { name: "Accepted", meaning: "The request was accepted for processing, but the processing has not completed - the async 'received, working on it'.", notes: ["There is no later callback in HTTP itself; the application supplies the way to check progress."] },
  204: { name: "No Content", meaning: "Success with deliberately no body - the response headers are the whole answer.", notes: ["Common for DELETE and for writes where returning the resource would be waste."] },
  206: { name: "Partial Content", meaning: "The response carries only the requested byte range(s).", notes: ["The engine of resumable downloads and video seeking; answers a Range request."] },
  301: { name: "Moved Permanently", meaning: "The resource lives at a new URI permanently; update references.", notes: ["Historically clients rewrote a redirected POST to GET - use 308 when the method must be preserved.", "Caches and search engines treat this as 'update your records'."] },
  302: { name: "Found", meaning: "Temporary redirect in its legacy form.", notes: ["Like 301, many clients historically switched the method to GET - 307 is the method-preserving temporary redirect."] },
  303: { name: "See Other", meaning: "Deliberately redirects to a different resource with GET - the post/redirect/get pattern's official verb switch.", notes: ["The one redirect where changing the method to GET is the point."] },
  304: { name: "Not Modified", meaning: "Not a redirect at all: the conditional request's payoff. The client's cached copy is still valid; no body is sent.", notes: ["Answers If-None-Match / If-Modified-Since - the cache revalidation handshake."] },
  307: { name: "Temporary Redirect", meaning: "Temporary redirect that preserves the request method and body.", notes: ["The unambiguous modern temporary redirect - a redirected POST stays a POST."] },
  308: { name: "Permanent Redirect", meaning: "Permanent redirect that preserves the request method and body.", notes: ["301's method-preserving sibling."] },
  400: { name: "Bad Request", meaning: "The server cannot or will not process the request due to a client-side error - the generic 'malformed'." },
  401: { name: "Unauthorized", meaning: "Really means unauthenticated: valid credentials are required and were absent or wrong.", notes: ["Must arrive with a WWW-Authenticate challenge - it is an invitation to present credentials.", "Contrast 403: there, identity may be known and the answer is still no."] },
  403: { name: "Forbidden", meaning: "The server understood the request and refuses to authorize it - authentication will not change the answer.", notes: ["401 asks for credentials; 403 rejects regardless of them."] },
  404: { name: "Not Found", meaning: "The target resource was not found - deliberately silent on whether it ever existed or is hidden.", notes: ["410 Gone is the version that asserts intentional permanent removal."] },
  405: { name: "Method Not Allowed", meaning: "The resource exists but not for this method.", notes: ["Must carry an Allow header listing the methods that are permitted."] },
  406: { name: "Not Acceptable", meaning: "Content negotiation failed: nothing the server has matches the request's Accept-* preferences." },
  408: { name: "Request Timeout", meaning: "The server gave up waiting for the client to finish sending the request." },
  409: { name: "Conflict", meaning: "The request conflicts with the current state of the resource - version conflicts and duplicate-creation collisions live here." },
  410: { name: "Gone", meaning: "The resource existed and was intentionally, permanently removed.", notes: ["Crawlers treat this as 'stop asking' - stronger than 404."] },
  411: { name: "Length Required", meaning: "The server insists on a Content-Length for this request." },
  412: { name: "Precondition Failed", meaning: "An If-* precondition (If-Match, If-Unmodified-Since) evaluated false - the optimistic-concurrency guard fired." },
  413: { name: "Content Too Large", meaning: "The request body exceeds what the server will process." },
  414: { name: "URI Too Long", meaning: "The request URI exceeds the server's limits - often a GET carrying what should have been a body." },
  415: { name: "Unsupported Media Type", meaning: "The body's Content-Type is one the server will not accept for this resource." },
  417: { name: "Expectation Failed", meaning: "The Expect header asked for something the server cannot meet." },
  418: { name: "I'm a teapot", meaning: "The famous April Fools code from the Hyper Text Coffee Pot Control Protocol (RFC 2324): a teapot, asked to brew coffee, declines.", notes: ["Registered whimsy; some real frameworks reserve it for refusing automated requests."] },
  421: { name: "Misdirected Request", meaning: "The request reached a server not configured to answer for that authority - a connection-reuse artifact of HTTP/2 era routing." },
  422: { name: "Unprocessable Content", meaning: "The syntax was fine; the semantics were not - well-formed input the server cannot act on.", notes: ["Promoted into the core catalogue by RFC 9110 after years as a WebDAV code."] },
  425: { name: "Too Early", meaning: "The server refuses to process a request that might be replayed (TLS early data)." },
  426: { name: "Upgrade Required", meaning: "The server refuses to proceed on this protocol; upgrade per the Upgrade header." },
  428: { name: "Precondition Required", meaning: "The server requires conditional requests here - send your If-Match - to prevent lost updates (RFC 6585)." },
  429: { name: "Too Many Requests", meaning: "Rate limiting's official voice: the client has sent too much in a window (RFC 6585).", notes: ["Ideally carries Retry-After telling the client when to come back."] },
  431: { name: "Request Header Fields Too Large", meaning: "Headers exceed the server's limits - one header or the total (RFC 6585)." },
  451: { name: "Unavailable For Legal Reasons", meaning: "Access denied for legal reasons - takedowns, court orders, geo-blocks (RFC 7725).", notes: ["The number is a deliberate Ray Bradbury citation."] },
  500: { name: "Internal Server Error", meaning: "The server's generic confession: something failed while handling an apparently valid request." },
  501: { name: "Not Implemented", meaning: "The server does not support the functionality required - typically an unrecognized method." },
  502: { name: "Bad Gateway", meaning: "An intermediary reached the upstream and received an invalid response or a refusal.", notes: ["Triage: the proxy is fine, the conversation with the backend is not - look at backend health and protocol mismatches."] },
  503: { name: "Service Unavailable", meaning: "The service is temporarily unable to handle the request - overload or maintenance.", notes: ["The honest maintenance code; ideally carries Retry-After.", "Triage: capacity and health of the service itself."] },
  504: { name: "Gateway Timeout", meaning: "An intermediary reached out and nobody answered in time.", notes: ["Triage: the backend or the path to it is slow or gone - timeouts, routing, resolution."] },
  505: { name: "HTTP Version Not Supported", meaning: "The server refuses this protocol version." },
  511: { name: "Network Authentication Required", meaning: "The network itself demands authentication first - the captive portal's status code (RFC 6585)." },
};

/** Parse tokens: bare codes and family queries; helpful, position-anchored errors. */
export function parseTokens(text: string): { codes: number[]; families: number[] } {
  const tokens = text.split(/[\s,;]+/).filter(Boolean);
  if (tokens.length === 0) throw new Error("Paste at least one status code (e.g. 404) or a family (e.g. 5xx).");
  if (tokens.length > 20) throw new Error(`That is ${tokens.length} tokens - this explainer caps at 20 per run.`);
  const codes: number[] = [];
  const families: number[] = [];
  tokens.forEach((tok, i) => {
    const fam = tok.toLowerCase().match(/^([1-5])xx$/);
    if (fam) {
      const f = Number(fam[1]);
      if (!families.includes(f)) families.push(f);
      return;
    }
    if (!/^\d{3}$/.test(tok))
      throw new Error(`Token ${i + 1} ("${tok}") is not a status code: expected three digits like 404, or a family like 4xx.`);
    const n = Number(tok);
    if (n < 100 || n > 599)
      throw new Error(`Token ${i + 1} ("${tok}") is outside the status range: HTTP status codes run 100-599.`);
    if (!codes.includes(n)) codes.push(n);
  });
  return { codes, families };
}

/** Explain every parsed code and family. */
export function run(text: string): StatusExplainResult {
  const { codes, families } = parseTokens(text);

  const codeOut: CodeExplanation[] = codes.map((code) => {
    const family = Math.floor(code / 100) as 1 | 2 | 3 | 4 | 5;
    const fam = FAMILY[family];
    const entry = CODES[code];
    if (entry) {
      return { code, family, familyName: fam.name, name: entry.name, meaning: entry.meaning, notes: entry.notes ?? [], fallback: false };
    }
    // -- The forward-compatibility rule, as an answer rather than an error:
    //    a client that does not recognize the code must treat it as the x00
    //    of its family. That design is why the registry could grow for
    //    decades without breaking old clients.
    return {
      code,
      family,
      familyName: fam.name,
      name: "Unrecognized in this registry",
      meaning: `${fam.meaning}`,
      notes: [
        `The protocol's own rule covers this: a client that does not understand ${code} must treat it as ${family}00 - the family defines the required behavior. That forward-compatibility design is why unknown codes never break old clients.`,
      ],
      fallback: true,
    };
  });

  const famOut: FamilyExplanation[] = families.map((f) => ({
    family: f as 1 | 2 | 3 | 4 | 5,
    familyName: FAMILY[f].name,
    meaning: FAMILY[f].meaning,
  }));

  const notes: string[] = [
    "The first digit names the family, and the family names the required behavior - which is why an unknown code's first digit is always enough to act on.",
  ];
  if (codeOut.some((c) => [502, 503, 504].includes(c.code)))
    notes.push("Incident triage on the 5xx proxy trio: 502 points at the backend conversation, 503 at the service's capacity or health, 504 at time - the backend or the path to it did not answer.");

  return { codes: codeOut, families: famOut, notes };
}
