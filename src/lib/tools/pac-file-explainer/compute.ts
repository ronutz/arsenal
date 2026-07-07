// ============================================================================
// src/lib/tools/pac-file-explainer/compute.ts
// ----------------------------------------------------------------------------
// PAC FILE EXPLAINER + VALIDATOR.
//
// Paste a Proxy Auto-Config file (the FindProxyForURL function) and this reads
// it back: the proxy directives it can return (DIRECT / PROXY / SOCKS / ...),
// the PAC helper functions it uses (isPlainHostName, dnsDomainIs, isInNet, ...)
// with the DNS-consulting ones flagged, a set of structural and correctness
// lints, and recognition of a Netskope Cloud Explicit Proxy steering file.
//
// CRITICAL: this NEVER evaluates the PAC JavaScript. It is a pure lexical and
// structural reader. It walks the text character by character to balance braces
// and parentheses (ignoring braces inside strings and comments), collects the
// string literals to find proxy directives, and counts helper-call names. It
// never calls eval, never runs the function, never opens a socket, never
// fetches. run() throws on oversized input (the worker-compatible contract).
//
// Grounded in the MDN PAC reference and the Netskope Explicit Proxy docs (see
// index.ts sources). Clean-room: our own model of the PAC grammar.
// ============================================================================

/** Input ceiling; real PAC files are a few KB, so this is generous. */
const MAX_INPUT = 20000;

/** The proxy directive keywords a PAC return string may contain. */
const DIRECTIVE_KEYWORDS = ["DIRECT", "PROXY", "SOCKS", "SOCKS4", "SOCKS5", "HTTP", "HTTPS"];

/**
 * The documented PAC helper functions, each with a plain-language explanation
 * and whether calling it forces a (blocking) DNS lookup. Taken from the MDN
 * PAC reference.
 */
interface HelperSpec {
  readonly name: string;
  readonly dnsConsulting: boolean;
  readonly explain: string;
}

const HELPER_SPECS: readonly HelperSpec[] = [
  { name: "isPlainHostName", dnsConsulting: false, explain: "True when the host has no dots, i.e. an unqualified single-label name. The classic way to send intranet short names DIRECT." },
  { name: "dnsDomainIs", dnsConsulting: false, explain: "True when the host ends in the given domain suffix. Pure string comparison; no DNS." },
  { name: "localHostOrDomainIs", dnsConsulting: false, explain: "True on an exact hostname match, or when only the unqualified name is given and it matches. Pure string comparison." },
  { name: "isResolvable", dnsConsulting: true, explain: "Tries to resolve the host and returns true on success. This consults DNS and can block; use it sparingly." },
  { name: "isInNet", dnsConsulting: true, explain: "True when the host's IP is in the given subnet (pattern + mask). If a hostname is passed, it is resolved via DNS first, so this can block." },
  { name: "dnsResolve", dnsConsulting: true, explain: "Resolves a hostname to a dotted IP string. Consults DNS and can block." },
  { name: "convert_addr", dnsConsulting: false, explain: "Packs a dotted IPv4 address into a single 32-bit number. Pure arithmetic." },
  { name: "myIpAddress", dnsConsulting: false, explain: "Returns the machine's own IP. Unreliable on multi-homed hosts and may fall back to a loopback address like 127.0.0.1; treat its result with caution." },
  { name: "dnsDomainLevels", dnsConsulting: false, explain: "Returns the number of dots in the host. Pure string operation." },
  { name: "shExpMatch", dnsConsulting: false, explain: "Shell-glob match (* and ?, and [chars] in some browsers). This is NOT a regular expression; regex syntax will not work here." },
  { name: "weekdayRange", dnsConsulting: false, explain: "True within a weekday range. Note that the bounds are ordered, so the order of the two days matters." },
  { name: "dateRange", dnsConsulting: false, explain: "True within a date range. The bounds are ordered." },
  { name: "timeRange", dnsConsulting: false, explain: "True within a time-of-day range. The bounds are ordered." },
  { name: "myIpAddressEx", dnsConsulting: false, explain: "Microsoft IPv6 extension of myIpAddress; may return a semicolon-separated list of addresses. Supported by Chromium, not by Firefox." },
  { name: "dnsResolveEx", dnsConsulting: true, explain: "Microsoft IPv6 extension of dnsResolve. Consults DNS; Chromium-only." },
  { name: "isResolvableEx", dnsConsulting: true, explain: "Microsoft IPv6 extension of isResolvable. Consults DNS; Chromium-only." },
  { name: "isInNetEx", dnsConsulting: true, explain: "Microsoft IPv6 extension of isInNet (CIDR prefix form). May consult DNS; Chromium-only." },
  { name: "sortIpAddressList", dnsConsulting: false, explain: "Microsoft helper that sorts a list of IPs by preference. Pure; Chromium-only." },
];

/** One proxy directive parsed from a return string. */
export interface PacDirective {
  /** The full return string as written, e.g. PROXY p:8080; DIRECT. */
  readonly raw: string;
  /** The individual semicolon-separated parts, each explained. */
  readonly parts: readonly PacDirectivePart[];
  /** True when the string has more than one part (failover chain). */
  readonly failover: boolean;
}

export interface PacDirectivePart {
  readonly keyword: string;
  readonly endpoint?: string;
  readonly explain: string;
  /** True when the keyword is not a recognized PAC directive. */
  readonly unknown: boolean;
}

/** One helper function found in the file. */
export interface PacHelper {
  readonly name: string;
  readonly count: number;
  readonly dnsConsulting: boolean;
  readonly explain: string;
}

/** A structural or correctness finding. */
export interface PacLint {
  readonly kind: "info" | "good" | "warn" | "error";
  readonly text: string;
}

/** The structural summary. */
export interface PacStructure {
  readonly hasEntryPoint: boolean;
  readonly bracesBalanced: boolean;
  readonly parensBalanced: boolean;
  readonly returnCount: number;
}

export type PacMode = "reference" | "parse";

export interface PacResult {
  readonly mode: PacMode;
  readonly structure: PacStructure;
  readonly directives: readonly PacDirective[];
  readonly helpers: readonly PacHelper[];
  readonly lints: readonly PacLint[];
  /** True when the file looks like a Netskope Cloud Explicit Proxy PAC. */
  readonly netskope: boolean;
  /** Reference material for empty input. */
  readonly reference?: {
    readonly directives: readonly { keyword: string; explain: string }[];
    readonly helpers: readonly { name: string; explain: string }[];
  };
}

export interface ToolRunResult {
  readonly result: PacResult;
}

/**
 * Scan the source once, tracking string and comment state, to:
 *   - count braces and parens that are OUTSIDE strings/comments,
 *   - collect every string literal (for directive detection),
 *   - strip comments and string bodies into a "code skeleton" (for helper and
 *     keyword scanning without matching inside strings/comments).
 * This is a lexical scan only; it does not parse or execute the JavaScript.
 */
function scan(src: string): {
  braces: number;
  parens: number;
  strings: string[];
  skeleton: string;
} {
  let braces = 0;
  let parens = 0;
  const strings: string[] = [];
  let skeleton = "";

  let i = 0;
  const n = src.length;
  let inLine = false; // // comment
  let inBlock = false; // /* */ comment
  let quote = ""; // active string quote char
  let cur = ""; // current string contents

  while (i < n) {
    const c = src[i];
    const c2 = i + 1 < n ? src[i + 1] : "";

    if (inLine) {
      if (c === "\n") inLine = false;
      i++;
      continue;
    }
    if (inBlock) {
      if (c === "*" && c2 === "/") { inBlock = false; i += 2; continue; }
      i++;
      continue;
    }
    if (quote) {
      if (c === "\\") { cur += src.slice(i, i + 2); i += 2; continue; }
      if (c === quote) {
        strings.push(cur);
        cur = "";
        quote = "";
        i++;
        continue;
      }
      cur += c;
      i++;
      continue;
    }
    // Not in a string or comment.
    if (c === "/" && c2 === "/") { inLine = true; i += 2; continue; }
    if (c === "/" && c2 === "*") { inBlock = true; i += 2; continue; }
    if (c === '"' || c === "'" || c === "`") { quote = c; i++; continue; }
    if (c === "{") braces++;
    else if (c === "}") braces--;
    else if (c === "(") parens++;
    else if (c === ")") parens--;
    skeleton += c;
    i++;
  }

  return { braces, parens, strings, skeleton };
}

/** Parse a single return string into its directive parts. */
function parseDirective(raw: string): PacDirective {
  const parts = raw
    .split(";")
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p): PacDirectivePart => {
      const m = p.match(/^(\S+)(?:\s+(.+))?$/);
      const kw = m ? m[1].toUpperCase() : p.toUpperCase();
      const endpoint = m && m[2] ? m[2].trim() : undefined;
      const known = DIRECTIVE_KEYWORDS.includes(kw);
      let explain: string;
      if (!known) {
        explain = `Not a recognized PAC directive keyword. A return string part must begin with one of ${DIRECTIVE_KEYWORDS.join(", ")}.`;
      } else if (kw === "DIRECT") {
        explain = "Connect straight to the destination with no proxy.";
      } else if (kw === "PROXY") {
        explain = `Send the request to the HTTP proxy at ${endpoint ?? "(missing host:port)"}.`;
      } else if (kw === "HTTP") {
        explain = `Send the request to the HTTP proxy at ${endpoint ?? "(missing host:port)"} (newer keyword; Firefox-era addition).`;
      } else if (kw === "HTTPS") {
        explain = `Send the request to the HTTPS (TLS) proxy at ${endpoint ?? "(missing host:port)"} (newer keyword).`;
      } else if (kw === "SOCKS") {
        explain = `Send the request through the SOCKS server at ${endpoint ?? "(missing host:port)"}.`;
      } else {
        explain = `Send the request through the ${kw} server at ${endpoint ?? "(missing host:port)"}.`;
      }
      return { keyword: kw, endpoint, explain, unknown: !known };
    });

  return { raw: raw.trim(), parts, failover: parts.length > 1 };
}

/** Does a string look like a proxy return string (starts with a directive)? */
function looksLikeDirective(s: string): boolean {
  const first = s.trim().split(/[\s;]/)[0]?.toUpperCase();
  return DIRECTIVE_KEYWORDS.includes(first ?? "");
}

/** Build the reference (empty-input) result. */
function referenceResult(): PacResult {
  return {
    mode: "reference",
    structure: { hasEntryPoint: false, bracesBalanced: true, parensBalanced: true, returnCount: 0 },
    directives: [],
    helpers: [],
    lints: [
      { kind: "info", text: "Paste a PAC file (a FindProxyForURL(url, host) function) to have its proxy directives, helper functions, and structure explained. This tool reads the file; it never runs it." },
    ],
    netskope: false,
    reference: {
      directives: [
        { keyword: "DIRECT", explain: "Connect straight to the destination, no proxy." },
        { keyword: "PROXY host:port", explain: "Use the given HTTP proxy." },
        { keyword: "SOCKS host:port", explain: "Use the given SOCKS server." },
        { keyword: "HTTP / HTTPS / SOCKS4 / SOCKS5 host:port", explain: "Newer keywords for a specific proxy type. Semicolon-separated parts are tried left to right as failover." },
      ],
      helpers: HELPER_SPECS.map((h) => ({ name: h.name, explain: h.explain })),
    },
  };
}

/** Parse a pasted PAC file. */
function parsePac(src: string): PacResult {
  const { braces, parens, strings, skeleton } = scan(src);

  // Structural checks.
  const hasEntryPoint = /\bFindProxyForURL\s*\(/.test(skeleton);
  const bracesBalanced = braces === 0;
  const parensBalanced = parens === 0;
  const returnCount = (skeleton.match(/\breturn\b/g) || []).length;

  // Directive extraction from string literals.
  const directives: PacDirective[] = [];
  for (const s of strings) {
    if (looksLikeDirective(s)) directives.push(parseDirective(s));
  }

  // Helper census (scan the code skeleton for helper-name calls).
  const helpers: PacHelper[] = [];
  for (const spec of HELPER_SPECS) {
    const re = new RegExp(`\\b${spec.name}\\s*\\(`, "g");
    const count = (skeleton.match(re) || []).length;
    if (count > 0) {
      helpers.push({ name: spec.name, count, dnsConsulting: spec.dnsConsulting, explain: spec.explain });
    }
  }

  // Netskope Cloud Explicit Proxy recognition.
  const joined = strings.join("\n");
  const netskope = /goskope\.com|eproxy-|:8081\b/i.test(joined);

  // Lints.
  const lints: PacLint[] = [];

  if (!hasEntryPoint) {
    lints.push({ kind: "error", text: "No FindProxyForURL(url, host) function was found. A PAC file must define exactly this entry point; browsers call it for every request." });
  } else {
    lints.push({ kind: "good", text: "FindProxyForURL(url, host) entry point is present." });
  }
  if (!bracesBalanced) {
    lints.push({ kind: "error", text: `Unbalanced curly braces (${braces > 0 ? braces + " unclosed" : -braces + " extra closing"}). The function body will not parse.` });
  }
  if (!parensBalanced) {
    lints.push({ kind: "error", text: `Unbalanced parentheses (${parens > 0 ? parens + " unclosed" : -parens + " extra closing"}).` });
  }
  if (returnCount === 0) {
    lints.push({ kind: "warn", text: "No return statement was found. FindProxyForURL must return a proxy string (or null for no proxy)." });
  }

  // DIRECT fallback.
  const anyDirect = directives.some((d) => d.parts.some((p) => p.keyword === "DIRECT"));
  if (directives.length > 0 && !anyDirect) {
    lints.push({ kind: "warn", text: "No DIRECT appears in any return string. If every listed proxy is unreachable, the browser has no direct-connection fallback and may block traffic; a trailing DIRECT is the usual safety net." });
  }

  // Unknown directive keywords.
  const unknownKw = new Set<string>();
  for (const d of directives) for (const p of d.parts) if (p.unknown) unknownKw.add(p.keyword);
  if (unknownKw.size > 0) {
    lints.push({ kind: "warn", text: `Return string(s) contain something that is not a PAC directive keyword: ${Array.from(unknownKw).join(", ")}. Only DIRECT, PROXY, SOCKS, SOCKS4, SOCKS5, HTTP, and HTTPS are valid.` });
  }

  // DNS-consulting helpers.
  const dnsHelpers = helpers.filter((h) => h.dnsConsulting).map((h) => h.name);
  if (dnsHelpers.length > 0) {
    lints.push({ kind: "info", text: `Uses DNS-consulting helper(s): ${dnsHelpers.join(", ")}. These force a DNS lookup on every call and can block; MDN recommends ordering cheaper string checks (isPlainHostName, dnsDomainIs) first so DNS is only consulted when nothing else has decided.` });
  }

  // shExpMatch is glob, not regex.
  if (helpers.some((h) => h.name === "shExpMatch")) {
    lints.push({ kind: "info", text: "shExpMatch uses shell-glob wildcards (* and ?), not regular expressions. Patterns like .*\\.example\\.com will not behave as a regex here." });
  }

  // myIpAddress reliability.
  if (helpers.some((h) => h.name === "myIpAddress")) {
    lints.push({ kind: "info", text: "myIpAddress() can be unreliable: on multi-homed machines it may return an unexpected interface, and it can fall back to a loopback address such as 127.0.0.1." });
  }

  // HTTPS path-stripping, if the file matches on the url (not just host).
  if (/\burl\b/.test(skeleton) && helpers.some((h) => h.name === "shExpMatch")) {
    lints.push({ kind: "info", text: "Modern Chromium-based browsers strip the path and query from https:// URLs before calling the PAC, so matching on the path of an HTTPS URL (via the url argument) may not work as written." });
  }

  // eval / dynamic code / network calls: unusual and risky in a PAC.
  if (/\beval\s*\(|\bnew\s+Function\s*\(|XMLHttpRequest|\bfetch\s*\(/.test(skeleton)) {
    lints.push({ kind: "warn", text: "The file appears to use eval, new Function, XMLHttpRequest, or fetch. A PAC file should be pure decision logic; dynamic code or network calls are unusual and a security and reliability concern." });
  }

  // alert() is debug-only.
  if (/\balert\s*\(/.test(skeleton)) {
    lints.push({ kind: "info", text: "alert() only writes to the browser console; it does not affect proxy selection and is a debugging aid." });
  }

  // Netskope notes.
  if (netskope) {
    lints.push({ kind: "good", text: "This looks like a Netskope Cloud Explicit Proxy steering file: it points traffic at a goskope.com explicit-proxy host, typically eproxy-<tenant>.goskope.com on port 8081. Bypasses (identity-provider hosts, plain hostnames) are returned DIRECT so they skip the proxy, and Netskope uses cookie surrogates for user identity. Replace the tenant placeholder with your real tenant and ensure the Netskope root CA is trusted for TLS inspection." });
  }

  return {
    mode: "parse",
    structure: { hasEntryPoint, bracesBalanced, parensBalanced, returnCount },
    directives,
    helpers,
    lints,
    netskope,
  };
}

/**
 * Entry point. Empty input returns the reference; anything else is parsed
 * lexically (never evaluated).
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
  return { result: parsePac(input) };
}
