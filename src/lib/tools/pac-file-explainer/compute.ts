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
import { say, plainText, engineError, type EngineText } from "../engine-text"; // sentences with ids (02/11/2026)
// PAGE LANGUAGE (02/11/2026): every explanation, lint, reference line and error is built as an EngineText (a stable
// id, the English as before, and its values). runLocalisable() returns them as such for the page (pack keys
// tools.pac-file-explainer.engine.<id>); run() returns plainText() of the same reading, so the API, the share spec
// and the golden vectors are unchanged.

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
  readonly explain: EngineText; // a sentence (02/11/2026)
}
const HELPER_SPECS: readonly HelperSpec[] = [
  { name: "isPlainHostName", dnsConsulting: false, explain: say("helper.isPlainHostName", "True when the host has no dots, i.e. an unqualified single-label name. The classic way to send intranet short names DIRECT.") }, // isPlainHostName
  { name: "dnsDomainIs", dnsConsulting: false, explain: say("helper.dnsDomainIs", "True when the host ends in the given domain suffix. Pure string comparison; no DNS.") }, // dnsDomainIs
  { name: "localHostOrDomainIs", dnsConsulting: false, explain: say("helper.localHostOrDomainIs", "True on an exact hostname match, or when only the unqualified name is given and it matches. Pure string comparison.") }, // localHostOrDomainIs
  { name: "isResolvable", dnsConsulting: true, explain: say("helper.isResolvable", "Tries to resolve the host and returns true on success. This consults DNS and can block; use it sparingly.") }, // isResolvable
  { name: "isInNet", dnsConsulting: true, explain: say("helper.isInNet", "True when the host's IP is in the given subnet (pattern + mask). If a hostname is passed, it is resolved via DNS first, so this can block.") }, // isInNet
  { name: "dnsResolve", dnsConsulting: true, explain: say("helper.dnsResolve", "Resolves a hostname to a dotted IP string. Consults DNS and can block.") }, // dnsResolve
  { name: "convert_addr", dnsConsulting: false, explain: say("helper.convert_addr", "Packs a dotted IPv4 address into a single 32-bit number. Pure arithmetic.") }, // convert_addr
  { name: "myIpAddress", dnsConsulting: false, explain: say("helper.myIpAddress", "Returns the machine's own IP. Unreliable on multi-homed hosts and may fall back to a loopback address like 127.0.0.1; treat its result with caution.") }, // myIpAddress
  { name: "dnsDomainLevels", dnsConsulting: false, explain: say("helper.dnsDomainLevels", "Returns the number of dots in the host. Pure string operation.") }, // dnsDomainLevels
  { name: "shExpMatch", dnsConsulting: false, explain: say("helper.shExpMatch", "Shell-glob match (* and ?, and [chars] in some browsers). This is NOT a regular expression; regex syntax will not work here.") }, // shExpMatch
  { name: "weekdayRange", dnsConsulting: false, explain: say("helper.weekdayRange", "True within a weekday range. Note that the bounds are ordered, so the order of the two days matters.") }, // weekdayRange
  { name: "dateRange", dnsConsulting: false, explain: say("helper.dateRange", "True within a date range. The bounds are ordered.") }, // dateRange
  { name: "timeRange", dnsConsulting: false, explain: say("helper.timeRange", "True within a time-of-day range. The bounds are ordered.") }, // timeRange
  { name: "myIpAddressEx", dnsConsulting: false, explain: say("helper.myIpAddressEx", "Microsoft IPv6 extension of myIpAddress; may return a semicolon-separated list of addresses. Supported by Chromium, not by Firefox.") }, // myIpAddressEx
  { name: "dnsResolveEx", dnsConsulting: true, explain: say("helper.dnsResolveEx", "Microsoft IPv6 extension of dnsResolve. Consults DNS; Chromium-only.") }, // dnsResolveEx
  { name: "isResolvableEx", dnsConsulting: true, explain: say("helper.isResolvableEx", "Microsoft IPv6 extension of isResolvable. Consults DNS; Chromium-only.") }, // isResolvableEx
  { name: "isInNetEx", dnsConsulting: true, explain: say("helper.isInNetEx", "Microsoft IPv6 extension of isInNet (CIDR prefix form). May consult DNS; Chromium-only.") }, // isInNetEx
  { name: "sortIpAddressList", dnsConsulting: false, explain: say("helper.sortIpAddressList", "Microsoft helper that sorts a list of IPs by preference. Pure; Chromium-only.") }, // sortIpAddressList
];

/** One proxy directive parsed from a return string. */
/** S is string in the API's reading and EngineText in the page's (runLocalisable). */
export interface PacDirective<S = string> {
  /** The full return string as written, e.g. PROXY p:8080; DIRECT. */
  readonly raw: string;
  /** The individual semicolon-separated parts, each explained. */
  readonly parts: readonly PacDirectivePart<S>[]; // each part, explained
  /** True when the string has more than one part (failover chain). */
  readonly failover: boolean;
}

/** S is string in the API's reading and EngineText in the page's. */
export interface PacDirectivePart<S = string> {
  readonly keyword: string;
  readonly endpoint?: string;
  readonly explain: S; // a sentence
  /** True when the keyword is not a recognized PAC directive. */
  readonly unknown: boolean;
}

/** One helper function found in the file. */
/** S is string in the API's reading and EngineText in the page's. */
export interface PacHelper<S = string> {
  readonly name: string;
  readonly count: number;
  readonly dnsConsulting: boolean;
  readonly explain: S; // a sentence
}

/** A structural or correctness finding. */
/** S is string in the API's reading and EngineText in the page's. */
export interface PacLint<S = string> {
  readonly kind: "info" | "good" | "warn" | "error";
  readonly text: S; // a sentence
}

/** The structural summary. */
export interface PacStructure {
  readonly hasEntryPoint: boolean;
  readonly bracesBalanced: boolean;
  readonly parensBalanced: boolean;
  readonly returnCount: number;
}

export type PacMode = "reference" | "parse";

/** S is string in the API's reading and EngineText in the page's. */
export interface PacResult<S = string> {
  readonly mode: PacMode;
  readonly structure: PacStructure;
  readonly directives: readonly PacDirective<S>[]; // each return string
  readonly helpers: readonly PacHelper<S>[]; // each helper used
  readonly lints: readonly PacLint<S>[]; // each finding
  /** True when the file looks like a Netskope Cloud Explicit Proxy PAC. */
  readonly netskope: boolean;
  /** Reference material for empty input. */
  readonly reference?: {
    readonly directives: readonly { keyword: string; explain: S }[]; // the grammar
    readonly helpers: readonly { name: string; explain: S }[]; // the helpers
  };
}

/** S is string in the API's reading and EngineText in the page's. */
export interface ToolRunResult<S = string> {
  readonly result: PacResult<S>; // the reading
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
function parseDirective(raw: string): PacDirective<EngineText> {
  const parts = raw
    .split(";")
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p): PacDirectivePart<EngineText> => {
      const m = p.match(/^(\S+)(?:\s+(.+))?$/);
      const kw = m ? m[1].toUpperCase() : p.toUpperCase();
      const endpoint = m && m[2] ? m[2].trim() : undefined;
      const known = DIRECTIVE_KEYWORDS.includes(kw);
      let explain: EngineText; // this part's explanation
      const at = endpoint ?? say("part.missing", "(missing host:port)"); // the endpoint, or the missing marker
      if (!known) {
        const keywords = DIRECTIVE_KEYWORDS.join(", "); // the valid keywords
        explain = say("part.unknown", `Not a recognized PAC directive keyword. A return string part must begin with one of ${keywords}.`, { keywords }); // not a keyword
      } else if (kw === "DIRECT") {
        explain = say("part.direct", "Connect straight to the destination with no proxy."); // DIRECT
      } else if (kw === "PROXY") {
        explain = say("part.proxy", `Send the request to the HTTP proxy at ${at}.`, { at }); // PROXY
      } else if (kw === "HTTP") {
        explain = say("part.http", `Send the request to the HTTP proxy at ${at} (newer keyword; Firefox-era addition).`, { at }); // HTTP
      } else if (kw === "HTTPS") {
        explain = say("part.https", `Send the request to the HTTPS (TLS) proxy at ${at} (newer keyword).`, { at }); // HTTPS
      } else if (kw === "SOCKS") {
        explain = say("part.socks", `Send the request through the SOCKS server at ${at}.`, { at }); // SOCKS
      } else {
        explain = say("part.socksN", `Send the request through the ${kw} server at ${at}.`, { kw, at }); // SOCKS4, SOCKS5
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
function referenceResult(): PacResult<EngineText> {
  return {
    mode: "reference",
    structure: { hasEntryPoint: false, bracesBalanced: true, parensBalanced: true, returnCount: 0 },
    directives: [],
    helpers: [],
    lints: [
      { kind: "info", text: say("ref.paste", "Paste a PAC file (a FindProxyForURL(url, host) function) to have its proxy directives, helper functions, and structure explained. This tool reads the file; it never runs it.") }, // what to paste
    ],
    netskope: false,
    reference: {
      directives: [
        { keyword: "DIRECT", explain: say("ref.direct", "Connect straight to the destination, no proxy.") }, // DIRECT
        { keyword: "PROXY host:port", explain: say("ref.proxy", "Use the given HTTP proxy.") }, // PROXY
        { keyword: "SOCKS host:port", explain: say("ref.socks", "Use the given SOCKS server.") }, // SOCKS
        { keyword: "HTTP / HTTPS / SOCKS4 / SOCKS5 host:port", explain: say("ref.newer", "Newer keywords for a specific proxy type. Semicolon-separated parts are tried left to right as failover.") }, // the newer keywords
      ],
      helpers: HELPER_SPECS.map((h) => ({ name: h.name, explain: h.explain })),
    },
  };
}

/** Parse a pasted PAC file. */
function parsePac(src: string): PacResult<EngineText> {
  const { braces, parens, strings, skeleton } = scan(src);

  // Structural checks.
  const hasEntryPoint = /\bFindProxyForURL\s*\(/.test(skeleton);
  const bracesBalanced = braces === 0;
  const parensBalanced = parens === 0;
  const returnCount = (skeleton.match(/\breturn\b/g) || []).length;

  // Directive extraction from string literals.
  const directives: PacDirective<EngineText>[] = []; // each return string, explained
  for (const s of strings) {
    if (looksLikeDirective(s)) directives.push(parseDirective(s));
  }

  // Helper census (scan the code skeleton for helper-name calls).
  const helpers: PacHelper<EngineText>[] = []; // each helper used
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
  const lints: PacLint<EngineText>[] = []; // each finding with its id
  if (!hasEntryPoint) {
    lints.push({ kind: "error", text: say("lint.noEntry", "No FindProxyForURL(url, host) function was found. A PAC file must define exactly this entry point; browsers call it for every request.") }); // no entry point
  } else {
    lints.push({ kind: "good", text: say("lint.entry", "FindProxyForURL(url, host) entry point is present.") }); // the entry point
  }
  if (!bracesBalanced) {
    const n = String(Math.abs(braces)); // how many
    lints.push({ kind: "error", text: braces > 0 // unclosed, or extra closing
      ? say("lint.bracesOpen", `Unbalanced curly braces (${n} unclosed). The function body will not parse.`, { n }) // unclosed
      : say("lint.bracesExtra", `Unbalanced curly braces (${n} extra closing). The function body will not parse.`, { n }) }); // extra
  }
  if (!parensBalanced) {
    const n = String(Math.abs(parens)); // how many
    lints.push({ kind: "error", text: parens > 0 // unclosed, or extra closing
      ? say("lint.parensOpen", `Unbalanced parentheses (${n} unclosed).`, { n }) // unclosed
      : say("lint.parensExtra", `Unbalanced parentheses (${n} extra closing).`, { n }) }); // extra
  }
  if (returnCount === 0) {
    lints.push({ kind: "warn", text: say("lint.noReturn", "No return statement was found. FindProxyForURL must return a proxy string (or null for no proxy).") }); // no return
  }

  // DIRECT fallback.
  const anyDirect = directives.some((d) => d.parts.some((p) => p.keyword === "DIRECT"));
  if (directives.length > 0 && !anyDirect) {
    lints.push({ kind: "warn", text: say("lint.noDirect", "No DIRECT appears in any return string. If every listed proxy is unreachable, the browser has no direct-connection fallback and may block traffic; a trailing DIRECT is the usual safety net.") }); // no DIRECT
  }

  // Unknown directive keywords.
  const unknownKw = new Set<string>();
  for (const d of directives) for (const p of d.parts) if (p.unknown) unknownKw.add(p.keyword);
  if (unknownKw.size > 0) {
    const found = Array.from(unknownKw).join(", "); // what was found
    lints.push({ kind: "warn", text: say("lint.unknownKeyword", `Return string(s) contain something that is not a PAC directive keyword: ${found}. Only DIRECT, PROXY, SOCKS, SOCKS4, SOCKS5, HTTP, and HTTPS are valid.`, { found }) }); // not keywords
  }

  // DNS-consulting helpers.
  const dnsHelpers = helpers.filter((h) => h.dnsConsulting).map((h) => h.name);
  if (dnsHelpers.length > 0) {
    const names = dnsHelpers.join(", "); // which helpers
    lints.push({ kind: "info", text: say("lint.dns", `Uses DNS-consulting helper(s): ${names}. These force a DNS lookup on every call and can block; MDN recommends ordering cheaper string checks (isPlainHostName, dnsDomainIs) first so DNS is only consulted when nothing else has decided.`, { names }) }); // DNS helpers
  }

  // shExpMatch is glob, not regex.
  if (helpers.some((h) => h.name === "shExpMatch")) {
    lints.push({ kind: "info", text: say("lint.shExp", "shExpMatch uses shell-glob wildcards (* and ?), not regular expressions. Patterns like .*\\.example\\.com will not behave as a regex here.") }); // globs, not regex
  }

  // myIpAddress reliability.
  if (helpers.some((h) => h.name === "myIpAddress")) {
    lints.push({ kind: "info", text: say("lint.myIp", "myIpAddress() can be unreliable: on multi-homed machines it may return an unexpected interface, and it can fall back to a loopback address such as 127.0.0.1.") }); // myIpAddress
  }

  // HTTPS path-stripping, if the file matches on the url (not just host).
  if (/\burl\b/.test(skeleton) && helpers.some((h) => h.name === "shExpMatch")) {
    lints.push({ kind: "info", text: say("lint.httpsPath", "Modern Chromium-based browsers strip the path and query from https:// URLs before calling the PAC, so matching on the path of an HTTPS URL (via the url argument) may not work as written.") }); // HTTPS paths stripped
  }

  // eval / dynamic code / network calls: unusual and risky in a PAC.
  if (/\beval\s*\(|\bnew\s+Function\s*\(|XMLHttpRequest|\bfetch\s*\(/.test(skeleton)) {
    lints.push({ kind: "warn", text: say("lint.dynamic", "The file appears to use eval, new Function, XMLHttpRequest, or fetch. A PAC file should be pure decision logic; dynamic code or network calls are unusual and a security and reliability concern.") }); // dynamic code
  }

  // alert() is debug-only.
  if (/\balert\s*\(/.test(skeleton)) {
    lints.push({ kind: "info", text: say("lint.alert", "alert() only writes to the browser console; it does not affect proxy selection and is a debugging aid.") }); // alert
  }

  // Netskope notes.
  if (netskope) {
    lints.push({ kind: "good", text: say("lint.netskope", "This looks like a Netskope Cloud Explicit Proxy steering file: it points traffic at a goskope.com explicit-proxy host, typically eproxy-<tenant>.goskope.com on port 8081. Bypasses (identity-provider hosts, plain hostnames) are returned DIRECT so they skip the proxy, and Netskope uses cookie surrogates for user identity. Replace the tenant placeholder with your real tenant and ensure the Netskope root CA is trusted for TLS inspection.") }); // Netskope
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
  return { result: parsePac(input) };
}
