// ============================================================================
// src/lib/tools/curl-command-explainer/compute.ts
// ----------------------------------------------------------------------------
// Parse a curl command into one request model, then derive an explanation and
// translations (fetch, raw HTTP/1.1, HTTPie, Python requests) from it. Pure and
// local: nothing is ever sent, and no request is executed (zero egress, D-49).
// The command you paste is tokenized and decoded in the browser.
//
// Design: a single parse feeds everything. Because translating a curl command
// already requires understanding every flag, the "explain" view is the same
// model rendered with labels; the UI supplies those labels via i18n keys, so the
// engine emits stable ids (never English prose) for options and warnings.
//
// 2026-10-27: shareableCurl (part 8) makes the copy a "Share results" link
// carries, every credential replaced; tokenize now delegates to tokenizeWords,
// which keeps each character's position for that copy.
//
// 2026-11-01: every option curl gives an argument now takes it. Before, an
// option missing from the tables below was read as a switch, so its argument
// became the URL ("curl --oauth2-bearer TOKEN https://example.com" explained
// the host "TOKEN"). The list of value-taking options is curl's own (part 2a);
// -U/--proxy-user, -E/--cert, --oauth2-bearer and the other credential options
// are explained without showing their secret part, --oauth2-bearer is read as
// Bearer authentication, --json as a JSON body with its two headers, and
// --url-query as parameters added to the query, as the man page says.
// ============================================================================

import { SHARE_REDACTED, cookieEdits, findResidualSecret, headerEdits, isReplaceable, redactBody, shiftEdits, urlEdits, type Edit, type ResidualSecret } from "../http-message-decoder/http-secrets"; // the HTTP secrets rules of Share results

export interface KV {
  name: string;
  value: string;
}

export interface OptionView {
  /** Stable id the UI maps to an i18n explanation, e.g. "location", "insecure". */
  id: string;
  /** The flag exactly as written, e.g. "-L", "--max-time". */
  raw: string;
  /** A value for value-taking flags (user agent, proxy, timeout), else undefined. */
  value?: string;
}

export interface BodyView {
  /** "urlencoded" | "form" | "raw" | "binary" | "json" (--json, 2026-11-01) */
  kind: string;
  /** The assembled body text (for form: the multipart fields are in `fields`). */
  text: string;
  /** For -F/--form: the multipart fields. */
  fields?: { name: string; value: string; isFile: boolean }[];
  /** The Content-Type curl will actually send (explicit header, or curl's default). */
  contentType: string;
  /** True when the Content-Type was not set by the user but defaulted by curl. */
  contentTypeImplicit: boolean;
  /** True when the raw body parses as JSON (informational; curl still sends form CT by default). */
  looksJson: boolean;
}

export interface UrlView {
  scheme: string;
  host: string;
  port: string;
  path: string;
  query: KV[];
  userinfo: string; // "user:pass" embedded in the URL, if any (a warning)
}

export interface Translations {
  fetch: string;
  http: string;
  httpie: string;
  python: string;
}

export interface CurlParse {
  ok: boolean;
  /** i18n error id when ok === false: "empty" | "notCurl" | "noUrl". */
  errorId?: string;
  method: string;
  methodInferred: boolean;
  url: string;
  urlParts?: UrlView;
  headers: KV[];
  body?: BodyView;
  auth?: { kind: string; user?: string; token?: string };
  cookies?: string;
  options: OptionView[];
  /** Stable warning ids the UI maps to i18n, e.g. "insecureTls", "plaintextHttp". */
  warnings: string[];
  translations: Translations;
}

// ---------------------------------------------------------------------------
// 1. Shell tokenizer. Handles whitespace splitting, single quotes (literal),
//    double quotes (with \" \\ \$ \` escapes), backslash escaping, and line
//    continuations (backslash-newline). Good enough for the curl commands people
//    actually paste from docs, browsers' "Copy as cURL", and shells.
// ---------------------------------------------------------------------------
export function tokenize(cmd: string): string[] {
  // The words' values; tokenizeWords (below) is the one tokenizer, so the explanation and the share copy read the
  // command the same way (2026-10-27).
  return tokenizeWords(cmd).map((w) => w.value);
}

/** One shell word: its value, where it stands in the command, and where each of its characters came from. */
export interface ShellWord {
  /** The value, quotes and escapes removed. */
  value: string;
  /** Where the word starts in the command (its first character or opening quote). */
  start: number;
  /** Where it ends (exclusive). */
  end: number;
  /** For each character of the value, its index in the command (increasing). */
  at: number[];
}

/**
 * The shell tokenizer, keeping positions (2026-10-27, for the Share results copy). The rules are tokenize's, unchanged:
 * whitespace splits; single quotes are literal; double quotes take \" \\ \$ \` and a backslash-newline; a backslash
 * outside quotes escapes the next character; a backslash-newline continues the line.
 * @param cmd the command as pasted
 * @returns the words, in order
 */
export function tokenizeWords(cmd: string): ShellWord[] {
  const out: ShellWord[] = []; // the words
  let cur = ""; // the current word's value
  let at: number[] = []; // where its characters came from
  let has = false; // whether a word is open (an empty quoted word counts)
  let start = -1; // where it started
  let i = 0; // the position
  const n = cmd.length; // the length
  /** Mark the start of a word at the current position, once. */
  const begin = (): void => { if (start < 0) start = i; }; // the first character or quote
  while (i < n) { // each character
    const c = cmd[i]; // the character
    if (c === "\\") { // a backslash
      if (i + 1 < n && (cmd[i + 1] === "\n" || cmd[i + 1] === "\r")) { // a line continuation
        i += 2; // backslash and newline consumed
        if (cmd[i - 1] === "\r" && cmd[i] === "\n") i++; // and the LF of CR LF
        continue; // nothing added
      } // continuation
      if (i + 1 < n) { // an escaped character
        begin(); // a word starts here
        cur += cmd[i + 1]; // the character itself
        at.push(i + 1); // from here
        has = true; // a word is open
        i += 2; // both consumed
        continue; // next
      } // escaped
      i++; // a lone backslash at the end: dropped
      continue; // next
    } // backslash
    if (c === "'") { // single quotes: literal
      begin(); // a word starts here
      i++; // the opening quote
      while (i < n && cmd[i] !== "'") { cur += cmd[i]; at.push(i); i++; } // each literal character
      i++; // closing quote
      has = true; // a word is open (even an empty one)
      continue; // next
    } // single quotes
    if (c === '"') { // double quotes
      begin(); // a word starts here
      i++; // the opening quote
      while (i < n && cmd[i] !== '"') { // to the closing quote
        if (cmd[i] === "\\" && i + 1 < n && '"\\$`\n'.includes(cmd[i + 1])) { // an escape double quotes honour
          if (cmd[i + 1] === "\n") { i += 2; continue; } // a backslash-newline: nothing
          cur += cmd[i + 1]; // the escaped character
          at.push(i + 1); // from here
          i += 2; // both consumed
          continue; // next
        } // escape
        cur += cmd[i]; // a plain character
        at.push(i); // from here
        i++; // next
      } // while
      i++; // closing quote
      has = true; // a word is open
      continue; // next
    } // double quotes
    if (c === " " || c === "\t" || c === "\n" || c === "\r") { // whitespace ends a word
      if (has) { out.push({ value: cur, start, end: i, at }); cur = ""; at = []; has = false; start = -1; } // the word
      i++; // next
      continue; // next
    } // whitespace
    begin(); // a word starts here
    cur += c; // a plain character
    at.push(i); // from here
    has = true; // a word is open
    i++; // next
  } // while
  if (has) out.push({ value: cur, start, end: Math.min(i, n), at }); // the last word
  return out; // the words
} // tokenizeWords

// ---------------------------------------------------------------------------
// 2. Flag tables. Which long/short flags take a value, and the id we surface.
// ---------------------------------------------------------------------------
// Long flags that consume the next token as a value -> canonical handling key.
const LONG_VALUE: Record<string, string> = {
  request: "method",
  header: "header",
  data: "data",
  "data-raw": "data",
  "data-ascii": "data",
  "data-binary": "data-binary",
  "data-urlencode": "data-urlencode",
  form: "form",
  "form-string": "form-string",
  user: "user",
  cookie: "cookie",
  "user-agent": "user-agent",
  referer: "referer",
  proxy: "proxy",
  url: "url",
  output: "output",
  "max-time": "max-time",
  "connect-timeout": "connect-timeout",
  range: "range",
  retry: "retry",
  // 2026-11-01: the credential options and the options whose value shapes the request (the man page's argument in
  // angle brackets, read 2026-11-01 at https://curl.se/docs/manpage.html).
  "proxy-user": "proxy-user", // -U <user:password>: the proxy's credentials
  "oauth2-bearer": "oauth2-bearer", // <token>: Bearer authentication (RFC 6750)
  cert: "cert", // -E <certificate[:password]>: a client certificate
  "proxy-cert": "proxy-cert", // <cert[:passwd]>: the HTTPS proxy's client certificate
  pass: "pass", // <phrase>: a private key's passphrase
  "proxy-pass": "proxy-pass", // <phrase>: the proxy key's passphrase
  tlspassword: "tlspassword", // <string>: TLS-SRP (deprecated, no effect since 8.22.0)
  "proxy-tlspassword": "proxy-tlspassword", // <string>: the same for the proxy
  "httpsig-key": "httpsig-key", // <key/file>: an RFC 9421 signing key (experimental)
  "ftp-account": "ftp-account", // <data>: FTP account data sent with ACCT
  json: "json", // <data>: a JSON body, with Content-Type and Accept
  "url-query": "url-query", // <data>: added to the URL's query
  "proxy-header": "proxy-header", // <header/@file>: a header for the proxy only
  variable: "variable", // <[%]name=text/@file>: a variable for --expand- options
};

/**
 * 2a. Every long option curl gives an argument (2026-11-01): curl's own option table, the "aliases" array of
 * src/tool_getparam.c (types ARG_STRG, ARG_FILE, ARG_SECS and ARG_UNUM), read 2026-11-01 at
 * https://raw.githubusercontent.com/curl/curl/master/src/tool_getparam.c and checked against the man page's headers
 * (https://curl.se/docs/manpage.html, the same day: each one shows an argument in angle brackets). "help" is left out:
 * its argument is optional ("Provide help for the subject given as an optional argument").
 */
const CURL_VALUE_LONG: ReadonlySet<string> = new Set([
  "abstract-unix-socket", "alt-svc", "aws-sigv4", "cacert", "capath", "cert", "cert-type", "ciphers", "config", // a to c
  "connect-timeout", "connect-to", "continue-at", "cookie", "cookie-jar", "create-file-mode", "crlfile", "curves", // c
  "data", "data-ascii", "data-binary", "data-raw", "data-urlencode", "delegation", "dns-interface", "dns-ipv4-addr", // d
  "dns-ipv6-addr", "dns-servers", "doh-url", "dump-header", "ech", "egd-file", "engine", "etag-compare", "etag-save", // d to e
  "expect100-timeout", "form", "form-string", "ftp-account", "ftp-alternative-to-user", "ftp-method", "ftp-port", // e to f
  "ftp-ssl-ccc-mode", "happy-eyeballs-timeout-ms", "haproxy-clientip", "header", "hostpubmd5", "hostpubsha256", "hsts", // f to h
  "httpsig-algo", "httpsig-headers", "httpsig-key", "httpsig-keyid", "interface", "ip-tos", "ipfs-gateway", "json", // h to j
  "keepalive-cnt", "keepalive-time", "key", "key-type", "knownhosts", "krb", "krb4", "libcurl", "limit-rate", // k to l
  "local-port", "login-options", "mail-auth", "mail-from", "mail-rcpt", "max-filesize", "max-redirs", "max-time", // l to m
  "netrc-file", "noproxy", "oauth2-bearer", "output", "output-dir", "parallel-max", "parallel-max-host", "pass", // n to p
  "pinnedpubkey", "preproxy", "proto", "proto-default", "proto-redir", "proxy", "proxy-cacert", "proxy-capath", // p
  "proxy-cert", "proxy-cert-type", "proxy-ciphers", "proxy-crlfile", "proxy-header", "proxy-key", "proxy-key-type", // proxy
  "proxy-pass", "proxy-pinnedpubkey", "proxy-service-name", "proxy-tls13-ciphers", "proxy-tlsauthtype", // proxy
  "proxy-tlspassword", "proxy-tlsuser", "proxy-user", "proxy1.0", "pubkey", "quote", "random-file", "range", "rate", // p to r
  "referer", "request", "request-target", "resolve", "retry", "retry-delay", "retry-max-time", "sasl-authzid", // r to s
  "service-name", "sigalgs", "socks4", "socks4a", "socks5", "socks5-gssapi-service", "socks5-hostname", "speed-limit", // s
  "speed-time", "ssl-sessions", "stderr", "telnet-option", "tftp-blksize", "time-cond", "tls-max", "tls13-ciphers", // s to t
  "tlsauthtype", "tlspassword", "tlsuser", "trace", "trace-ascii", "trace-config", "unix-socket", "upload-file", // t to u
  "upload-flags", "url", "url-query", "user", "user-agent", "variable", "vlan-priority", "write-out", // u to w
]); // 150 options

/** The short letters of those options that take an argument (the same table; "h" is help's, left out). */
const CURL_VALUE_SHORT: ReadonlySet<string> = new Set("ACDEFHKPQTUXYbcdemortuwxyz".split("")); // one letter each

/**
 * Whether a long option takes an argument: one of curl's, or one of those written with the "--expand-" prefix (the
 * man page's --variable: "a later command line option when that option name is prefixed with "--expand-"").
 * @param name the option's name, without the dashes, lower-cased
 * @returns true when curl reads the next word (or the attached part) as its argument
 */
function takesValueLong(name: string): boolean {
  if (CURL_VALUE_LONG.has(name)) return true; // one of curl's
  return name.startsWith("expand-") && CURL_VALUE_LONG.has(name.slice(7)); // an expanded one
} // takesValueLong

/**
 * Where the password of "certificate[:password]" starts (-E, --cert, --proxy-cert): after the first ":" not written as
 * "\:" (the man page: "you must escape the character ":" as "\:" so that it is not recognized as the password
 * delimiter"); a Windows drive letter's colon is skipped, and a "pkcs11:" URI has no password part.
 * @param v the option's value
 * @returns the delimiter's index, or -1 when there is no password part
 */
function certPasswordAt(v: string): number {
  if (/^pkcs11:/i.test(v)) return -1; // a PKCS#11 URI (RFC 7512)
  for (let i = /^[A-Za-z]:[\\/]/.test(v) ? 2 : 0; i < v.length; i++) { // from after a drive letter
    if (v[i] === "\\") { i++; continue; } // an escaped character
    if (v[i] === ":") return i; // the delimiter
  } // for
  return -1; // none
} // certPasswordAt

// Boolean long flags -> option id.
const LONG_BOOL: Record<string, string> = {
  location: "location",
  "location-trusted": "location",
  insecure: "insecure",
  compressed: "compressed",
  head: "head",
  get: "get",
  include: "include",
  silent: "silent",
  verbose: "verbose",
  fail: "fail",
  "http1.1": "http1",
  "http1.0": "http10",
  http2: "http2",
  "remote-name": "remote-name",
};
// Short flags that take a value.
const SHORT_VALUE: Record<string, string> = {
  X: "method",
  H: "header",
  d: "data",
  F: "form",
  u: "user",
  b: "cookie",
  A: "user-agent",
  e: "referer",
  x: "proxy",
  o: "output",
  m: "max-time",
  r: "range",
  U: "proxy-user", // -U, --proxy-user (2026-11-01)
  E: "cert", // -E, --cert (2026-11-01)
};
// Boolean short flags -> option id (I and G influence method; handled specially).
const SHORT_BOOL: Record<string, string> = {
  L: "location",
  k: "insecure",
  I: "head",
  G: "get",
  i: "include",
  s: "silent",
  v: "verbose",
  O: "remote-name",
  f: "fail",
};

interface RawParse {
  method?: string;
  urlArg?: string;
  headers: KV[];
  datas: { value: string; kind: "data" | "data-binary" | "data-urlencode" | "json" }[];
  forms: { name: string; value: string; isFile: boolean }[];
  user?: string;
  cookie?: string;
  /** --oauth2-bearer's token, the last one given (2026-11-01). */
  bearer?: string;
  /** --url-query's arguments, in order (2026-11-01). */
  queries: string[];
  options: OptionView[];
  flags: Set<string>; // option ids seen (for method inference / warnings)
  unknown: string[];
}

// ---------------------------------------------------------------------------
// 3. curl getopt: walk tokens, fill the raw parse.
// ---------------------------------------------------------------------------
function parseTokens(tokens: string[]): RawParse {
  const r: RawParse = {
    headers: [],
    datas: [],
    forms: [],
    queries: [], // --url-query's arguments (2026-11-01)
    options: [],
    flags: new Set(),
    unknown: [],
  };
  let i = 0;
  // skip a leading "curl" (or "$ curl", "curl.exe")
  if (i < tokens.length && /^\$?$/.test(tokens[i])) i++;
  if (i < tokens.length && /^curl(\.exe)?$/i.test(tokens[i])) i++;

  const takeValue = (attached: string | undefined, consumeNext: () => string | undefined): string => {
    if (attached !== undefined && attached !== "") return attached;
    return consumeNext() ?? "";
  };
  const next = (): string | undefined => (i < tokens.length ? tokens[i++] : undefined);

  const applyValueFlag = (key: string, raw: string, value: string) => {
    switch (key) {
      case "method":
        r.method = value.toUpperCase();
        break;
      case "header": {
        const idx = value.indexOf(":");
        if (idx >= 0) r.headers.push({ name: value.slice(0, idx).trim(), value: value.slice(idx + 1).trim() });
        else r.headers.push({ name: value.trim(), value: "" });
        break;
      }
      case "data":
        r.datas.push({ value, kind: "data" });
        break;
      case "data-binary":
        r.datas.push({ value, kind: "data-binary" });
        break;
      case "data-urlencode":
        r.datas.push({ value, kind: "data-urlencode" });
        break;
      case "form":
      case "form-string": {
        const idx = value.indexOf("=");
        const name = idx >= 0 ? value.slice(0, idx) : value;
        const v = idx >= 0 ? value.slice(idx + 1) : "";
        const isFile = key === "form" && v.startsWith("@");
        r.forms.push({ name, value: isFile ? v.slice(1) : v, isFile });
        break;
      }
      case "user":
        r.user = value;
        break;
      case "cookie":
        r.cookie = value;
        break;
      case "url":
        r.urlArg = value;
        break;
      case "user-agent":
        r.options.push({ id: "user-agent", raw, value });
        break;
      case "referer":
        r.options.push({ id: "referer", raw, value });
        break;
      case "proxy":
        r.options.push({ id: "proxy", raw, value });
        break;
      case "output":
        r.options.push({ id: "output", raw, value });
        break;
      case "max-time":
        r.options.push({ id: "max-time", raw, value });
        break;
      case "connect-timeout":
        r.options.push({ id: "connect-timeout", raw, value });
        break;
      case "range":
        r.options.push({ id: "range", raw, value });
        break;
      case "retry":
        r.options.push({ id: "retry", raw, value });
        break;
      // 2026-11-01: the credential options are explained without their secret part (the page shows the user of -u,
      // never its password, and the same holds here).
      case "proxy-user": { // user:password, split on the first colon (the man page)
        const c = value.indexOf(":"); // the colon
        const user = c >= 0 ? value.slice(0, c) : value; // the user
        r.options.push({ id: "proxy-user", raw, value: user || undefined }); // the user only ("-U :" has none)
        break;
      }
      case "cert":
      case "proxy-cert": { // certificate[:password]
        const c = certPasswordAt(value); // where a password would start
        r.options.push({ id: key, raw, value: c >= 0 ? value.slice(0, c) : value }); // the certificate only
        break;
      }
      case "oauth2-bearer": // the token: Bearer authentication, not shown
        if (value !== "") r.bearer = value; // curl refuses a blank token; the last one given is used
        r.options.push({ id: "oauth2-bearer", raw }); // explained, value not shown
        break;
      case "pass":
      case "proxy-pass":
      case "tlspassword":
      case "proxy-tlspassword":
      case "httpsig-key":
      case "ftp-account": // a passphrase, a password, a key or account data: explained, never shown
        r.options.push({ id: key, raw }); // the option alone
        break;
      case "json": // --json: --data-binary plus two headers (the man page); the headers are added after the walk
        r.datas.push({ value, kind: "json" }); // a JSON piece
        break;
      case "url-query": // added to the URL's query after the walk
        r.queries.push(value); // in order
        r.options.push({ id: "url-query", raw, value }); // explained, with what it adds
        break;
      case "proxy-header": // a header for the proxy only
      case "variable": // a variable for --expand- options
        r.options.push({ id: key, raw, value }); // explained, as written
        break;
      case "other": // any other option curl gives an argument
        r.options.push({ id: "other", raw, value }); // named, with its argument
        break;
    }
  };

  while (i < tokens.length) {
    const tok = tokens[i++];
    if (tok.startsWith("--")) {
      // long flag, possibly --flag=value
      const eq = tok.indexOf("=");
      const name = (eq >= 0 ? tok.slice(2, eq) : tok.slice(2)).toLowerCase();
      const attached = eq >= 0 ? tok.slice(eq + 1) : undefined;
      const handling = own(LONG_VALUE, name); // an option explained here (own keys only: "--constructor" is no option)
      if (handling !== undefined) {
        const value = takeValue(attached, next);
        applyValueFlag(handling, "--" + name, value);
      } else if (own(LONG_BOOL, name) !== undefined) {
        const id = LONG_BOOL[name];
        r.flags.add(id);
        r.options.push({ id, raw: "--" + name });
      } else if (takesValueLong(name)) { // any other option curl gives an argument (2026-11-01): it takes its value
        applyValueFlag("other", "--" + name, takeValue(attached, next)); // named, with the argument
      } else {
        r.unknown.push(tok);
        r.options.push({ id: "unknown", raw: tok });
      }
      continue;
    }
    if (tok.startsWith("-") && tok.length > 1) {
      // one or more short flags in a cluster; a value-flag consumes the rest.
      let j = 1;
      let consumed = false;
      while (j < tok.length) {
        const ch = tok[j];
        const handling = own(SHORT_VALUE, ch); // a letter explained here
        if (handling !== undefined || CURL_VALUE_SHORT.has(ch)) { // explained, or any other letter curl gives an argument (2026-11-01)
          const rest = tok.slice(j + 1);
          const value = takeValue(rest.length ? rest : undefined, next);
          applyValueFlag(handling ?? "other", "-" + ch, value);
          consumed = true;
          break;
        } else if (own(SHORT_BOOL, ch) !== undefined) {
          const id = SHORT_BOOL[ch];
          r.flags.add(id);
          r.options.push({ id, raw: "-" + ch });
          j++;
        } else {
          r.unknown.push("-" + ch);
          r.options.push({ id: "unknown", raw: "-" + ch });
          j++;
        }
      }
      void consumed;
      continue;
    }
    // positional: the URL (first one wins; later bare args are extra URLs, ignored)
    if (r.urlArg === undefined) r.urlArg = tok;
  }
  return r;
}

// ---------------------------------------------------------------------------
// 4. URL parsing (tolerant; adds https:// when the scheme is missing, the way
//    curl does, and pulls out embedded credentials as a warning).
// ---------------------------------------------------------------------------
function parseUrl(raw: string): { view: UrlView; normalized: string } {
  let s = raw.trim();
  let scheme = "https";
  const m = s.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):\/\//);
  if (m) {
    scheme = m[1].toLowerCase();
    s = s.slice(m[0].length);
  }
  // userinfo@host
  let userinfo = "";
  const at = s.indexOf("@");
  const slash = s.indexOf("/");
  if (at >= 0 && (slash === -1 || at < slash)) {
    userinfo = s.slice(0, at);
    s = s.slice(at + 1);
  }
  // host[:port]/path?query#frag
  let rest = "";
  const pi = s.search(/[/?#]/);
  let authority = s;
  if (pi >= 0) {
    authority = s.slice(0, pi);
    rest = s.slice(pi);
  }
  let host = authority;
  let port = "";
  // IPv6 literal [::1]:port
  const v6 = authority.match(/^\[([^\]]+)\](?::(\d+))?$/);
  if (v6) {
    host = "[" + v6[1] + "]";
    port = v6[2] ?? "";
  } else {
    const ci = authority.lastIndexOf(":");
    if (ci >= 0 && /^\d+$/.test(authority.slice(ci + 1))) {
      host = authority.slice(0, ci);
      port = authority.slice(ci + 1);
    }
  }
  let path = "/";
  const query: KV[] = [];
  const hashIdx = rest.indexOf("#");
  if (hashIdx >= 0) rest = rest.slice(0, hashIdx);
  const qIdx = rest.indexOf("?");
  if (qIdx >= 0) {
    path = rest.slice(0, qIdx) || "/";
    const qs = rest.slice(qIdx + 1);
    for (const pair of qs.split("&")) {
      if (!pair) continue;
      const ei = pair.indexOf("=");
      const name = ei >= 0 ? pair.slice(0, ei) : pair;
      const value = ei >= 0 ? pair.slice(ei + 1) : "";
      query.push({ name: safeDecode(name), value: safeDecode(value) });
    }
  } else {
    path = rest || "/";
  }
  const normalized =
    scheme + "://" + (userinfo ? userinfo + "@" : "") + host + (port ? ":" + port : "") + path + (query.length ? "?" + rawQuery(rest) : "");
  return { view: { scheme, host, port, path, query, userinfo }, normalized };
}
function rawQuery(rest: string): string {
  const qIdx = rest.indexOf("?");
  if (qIdx < 0) return "";
  let q = rest.slice(qIdx + 1);
  const h = q.indexOf("#");
  if (h >= 0) q = q.slice(0, h);
  return q;
}
function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s.replace(/\+/g, " "));
  } catch {
    return s;
  }
}

/**
 * Percent-encode as curl_easy_escape does (2026-11-01): every octet of the UTF-8 form except the unreserved ALPHA,
 * DIGIT, "-", ".", "_" and "~" (RFC 3986 section 2.3) becomes %XX; then, as curl's data_urlencode does
 * (src/tool_getparam.c, read 2026-11-01), "%20" becomes "+".
 * @param s the text
 * @returns the encoded text
 */
function curlEscape(s: string): string {
  let out = ""; // the result
  for (const b of new TextEncoder().encode(s)) { // each octet
    const c = String.fromCharCode(b); // as a character
    out += /[A-Za-z0-9._~-]/.test(c) ? c : "%" + b.toString(16).toUpperCase().padStart(2, "0"); // kept or escaped
  } // for
  return out.replace(/%20/g, "+"); // replace_url_encoded_space_by_plus
} // curlEscape

/**
 * What one --url-query argument adds to the query (2026-11-01), by the man page ("The syntax is identical to that used
 * for --data-urlencode with one extension: If the argument starts with a '+' (plus), the rest of the string is provided
 * as-is unencoded") and curl's data_urlencode: "name=content" gives name=, then the content encoded; "=content" and a
 * bare "content" give the content encoded; "name@file" and "@file" read a file.
 * @param arg the argument as written
 * @returns the text appended, or null when it comes from a file
 */
function urlQueryPiece(arg: string): string | null {
  if (arg.startsWith("+")) return arg.slice(1); // as-is
  const eq = arg.indexOf("="); // name=content
  if (eq < 0 && arg.includes("@")) return null; // name@file or @file: a file this page cannot read
  if (eq < 0) return curlEscape(arg); // content alone
  return (eq > 0 ? arg.slice(0, eq) + "=" : "") + curlEscape(arg.slice(eq + 1)); // "=" only with a name
} // urlQueryPiece

// ---------------------------------------------------------------------------
// 5. Body assembly + Content-Type resolution.
// ---------------------------------------------------------------------------
function findHeader(headers: KV[], name: string): string | undefined {
  const low = name.toLowerCase();
  for (const h of headers) if (h.name.toLowerCase() === low) return h.value;
  return undefined;
}
function looksLikeJson(s: string): boolean {
  const t = s.trim();
  if (!(t.startsWith("{") || t.startsWith("["))) return false;
  try {
    JSON.parse(t);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// 6. Translations.
// ---------------------------------------------------------------------------
function q(s: string): string {
  // single-quote for JS/Python string literals, escaping embedded quotes
  return "'" + s.replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
}
function toFetch(p: {
  method: string;
  methodInferred: boolean;
  url: string;
  headers: KV[];
  body?: BodyView;
}): string {
  const lines: string[] = [];
  const opts: string[] = [];
  if (p.method !== "GET") opts.push(`  method: ${q(p.method)},`);
  const hdrs = [...p.headers];
  if (p.body && p.body.contentTypeImplicit && !findHeader(hdrs, "content-type")) {
    hdrs.push({ name: "Content-Type", value: p.body.contentType });
  }
  if (hdrs.length) {
    opts.push("  headers: {");
    for (const h of hdrs) opts.push(`    ${q(h.name)}: ${q(h.value)},`);
    opts.push("  },");
  }
  if (p.body) {
    if (p.body.kind === "form") {
      opts.push("  body: form, // FormData, assembled below");
    } else {
      opts.push(`  body: ${q(p.body.text)},`);
    }
  }
  if (p.body && p.body.kind === "form") {
    lines.push("const form = new FormData();");
    for (const f of p.body.fields ?? [])
      lines.push(f.isFile ? `// form.append(${q(f.name)}, file); // was @${f.value}` : `form.append(${q(f.name)}, ${q(f.value)});`);
  }
  lines.push(`await fetch(${q(p.url)}${opts.length ? ", {\n" + opts.join("\n") + "\n}" : ""});`);
  return lines.join("\n");
}
function toHttp(p: {
  method: string;
  urlParts?: UrlView;
  headers: KV[];
  body?: BodyView;
}): string {
  const up = p.urlParts;
  const target = up ? up.path + (up.query.length ? "?" + up.query.map((kv) => enc(kv.name) + "=" + enc(kv.value)).join("&") : "") : "/";
  const lines: string[] = [`${p.method} ${target} HTTP/1.1`];
  if (up) lines.push(`Host: ${up.host}${up.port ? ":" + up.port : ""}`);
  const hdrs = [...p.headers];
  if (p.body && p.body.contentTypeImplicit && !findHeader(hdrs, "content-type")) hdrs.push({ name: "Content-Type", value: p.body.contentType });
  for (const h of hdrs) lines.push(`${h.name}: ${h.value}`);
  if (p.body && p.body.kind !== "form") lines.push(`Content-Length: ${byteLen(p.body.text)}`);
  lines.push("");
  if (p.body) lines.push(p.body.kind === "form" ? "(multipart/form-data body)" : p.body.text);
  return lines.join("\n");
}
function enc(s: string): string {
  return encodeURIComponent(s);
}
function byteLen(s: string): number {
  // UTF-8 byte length
  let bytes = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 0x80) bytes += 1;
    else if (c < 0x800) bytes += 2;
    else if (c >= 0xd800 && c <= 0xdbff) {
      bytes += 4;
      i++;
    } else bytes += 3;
  }
  return bytes;
}
function toHttpie(p: { method: string; url: string; headers: KV[]; body?: BodyView; auth?: { type: "basic" | "digest"; user: string } }): string {
  const parts = ["http", p.method, p.url];
  // -u as HTTPie's own -a user:password (HTTPie's default auth type is basic; with the username only it prompts for the
  // password, as curl does), and -A digest for curl's --digest, before the method as HTTPie's documentation writes them
  // (01/11/2026).
  if (p.auth) parts.splice(1, 0, ...(p.auth.type === "digest" ? ["-A", "digest"] : []), "-a", shellQuote(p.auth.user)); // http [-A digest] -a user:pass METHOD URL
  for (const h of p.headers) parts.push(`${h.name}:${shellQuote(h.value)}`);
  let cmd = parts.join(" ");
  if (p.body) {
    if (p.body.kind === "form" && p.body.fields) {
      const f = p.body.fields.map((x) => `${x.name}=${shellQuote(x.isFile ? "@" + x.value : x.value)}`).join(" ");
      cmd = `http --form ${p.method} ${p.url} ` + p.headers.map((h) => `${h.name}:${shellQuote(h.value)}`).join(" ") + " " + f;
    } else if (p.body.looksJson) {
      cmd = `echo ${shellQuote(p.body.text)} | ` + cmd;
    } else {
      cmd = `echo ${shellQuote(p.body.text)} | ` + cmd;
    }
  }
  return cmd.replace(/\s+/g, " ").trim();
}
/** The other authentication methods curl can be asked for, which send no Basic field up front. */
const NOT_BASIC = new Set(["--digest", "--ntlm", "--ntlm-wb", "--negotiate", "--anyauth", "--aws-sigv4"]); // by option name

/**
 * Whether the command asks curl for a method other than Basic.
 * @param r the parse
 * @returns true when --digest, --ntlm, --negotiate, --anyauth or --aws-sigv4 is given
 */
function otherAuthMethod(r: { unknown: string[]; options: { raw: string }[] }): boolean {
  return r.unknown.some((t) => NOT_BASIC.has(t.split("=")[0].toLowerCase())) || r.options.some((o) => NOT_BASIC.has(o.raw.toLowerCase())); // either list
} // otherAuthMethod

/**
 * The method curl was asked for with -u.
 * @param r the parse
 * @returns "digest" for --digest, "other" for NTLM, Negotiate, --anyauth or SigV4, else "basic" (curl's default)
 */
function curlAuthMethod(r: { unknown: string[]; options: { raw: string }[] }): "basic" | "digest" | "other" {
  const given = (n: string) => r.unknown.some((t) => t.split("=")[0].toLowerCase() === n) || r.options.some((o) => o.raw.toLowerCase() === n); // an option present
  if (given("--digest")) return "digest"; // Digest
  return otherAuthMethod(r) ? "other" : "basic"; // another method, or the default
} // curlAuthMethod

/**
 * The "Authorization: Basic" field curl sends for -u user:password, or none.
 * @param r the parse
 * @param authHeader an Authorization written with -H, if any
 * @returns the field in a list, or an empty list
 */
function basicAuthorization(r: { user?: string; bearer?: string; unknown: string[]; options: { raw: string }[] }, authHeader: string | undefined): KV[] {
  if (r.user === undefined || authHeader !== undefined || r.bearer !== undefined || otherAuthMethod(r)) return []; // not Basic, or set otherwise
  const ci = r.user.indexOf(":"); // curl splits on the first colon
  if (ci <= 0) return []; // no password (curl prompts) or no user (the ambient-user form "-u :")
  return [{ name: "Authorization", value: "Basic " + base64Utf8(r.user) }]; // RFC 7617: Base64 of user-pass
} // basicAuthorization

/**
 * HTTPie's -a (and -A) for -u, or undefined when neither Basic nor Digest applies. HTTPie's documentation (httpie.io/docs/
 * cli, read 2026-11-01): "-a username:password", "If you omit the password part of --auth, -a, HTTPie securely prompts
 * you for it", "--auth-type, -A ... basic, digest, bearer ... The default value is basic", "http -A digest -a
 * username:password".
 * @param r the parse
 * @param authHeader an Authorization written with -H, if any
 * @returns the auth type and "user:password" or "user", or undefined
 */
function httpieAuth(r: { user?: string; bearer?: string; unknown: string[]; options: { raw: string }[] }, authHeader: string | undefined): { type: "basic" | "digest"; user: string } | undefined {
  if (r.user === undefined || authHeader !== undefined || r.bearer !== undefined) return undefined; // no -u, or set otherwise
  if (r.user.startsWith(":")) return undefined; // the ambient-user form "-u :" has no HTTPie equivalent
  const digest = r.unknown.some((t) => t.toLowerCase() === "--digest") || r.options.some((o) => o.raw.toLowerCase() === "--digest"); // --digest given
  const others = [...NOT_BASIC].filter((n) => n !== "--digest"); // the methods HTTPie's -A does not take here
  const other = r.unknown.some((t) => others.includes(t.split("=")[0].toLowerCase())) || r.options.some((o) => others.includes(o.raw.toLowerCase())); // NTLM, Negotiate, any, SigV4
  if (other) return undefined; // no HTTPie equivalent in its core
  return { type: digest ? "digest" : "basic", user: r.user }; // HTTPie's own flags
} // httpieAuth

/**
 * Base64 (RFC 4648 section 4, with padding) of a string's UTF-8 bytes, without btoa (which takes Latin-1 only).
 * @param s the text
 * @returns its Base64
 */
function base64Utf8(s: string): string {
  const bytes = new TextEncoder().encode(s); // UTF-8
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"; // the alphabet
  let out = ""; // the result
  for (let i = 0; i < bytes.length; i += 3) { // three bytes at a time
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0); // 24 bits
    out += A[(n >> 18) & 63] + A[(n >> 12) & 63]; // the first two characters always
    out += i + 1 < bytes.length ? A[(n >> 6) & 63] : "="; // the third, or padding
    out += i + 2 < bytes.length ? A[n & 63] : "="; // the fourth, or padding
  } // three bytes at a time
  return out; // done
} // base64Utf8

function shellQuote(s: string): string {
  if (s === "") return "''";
  if (/^[A-Za-z0-9_./:@-]+$/.test(s)) return s;
  return "'" + s.replace(/'/g, "'\\''") + "'";
}
function toPython(p: {
  method: string;
  url: string;
  headers: KV[];
  body?: BodyView;
  auth?: { kind: string; user?: string; token?: string };
  /** The method curl was asked for with -u (01/11/2026): Basic by default, Digest with --digest, another otherwise. */
  authMethod?: "basic" | "digest" | "other";
}): string {
  const lines = ["import requests", ""];
  // requests has Basic (the auth=(user, pass) shorthand) and Digest (requests.auth.HTTPDigestAuth) built in; NTLM,
  // Kerberos and the rest live in separate packages (requests documentation, Authentication, read 2026-11-01).
  if (p.auth && p.auth.kind === "basic" && p.authMethod === "digest") lines.splice(1, 0, "from requests.auth import HTTPDigestAuth"); // Digest's class
  const args: string[] = [pyStr(p.url)];
  if (p.headers.length || (p.body && p.body.contentTypeImplicit)) {
    const hdrs = [...p.headers];
    if (p.body && p.body.contentTypeImplicit && !findHeader(hdrs, "content-type")) hdrs.push({ name: "Content-Type", value: p.body.contentType });
    args.push("headers={" + hdrs.map((h) => `${pyStr(h.name)}: ${pyStr(h.value)}`).join(", ") + "}");
  }
  if (p.body) {
    if (p.body.kind === "form" && p.body.fields) {
      const files = p.body.fields.filter((f) => f.isFile);
      const data = p.body.fields.filter((f) => !f.isFile);
      if (data.length) args.push("data={" + data.map((f) => `${pyStr(f.name)}: ${pyStr(f.value)}`).join(", ") + "}");
      if (files.length) args.push("files={" + files.map((f) => `${pyStr(f.name)}: open(${pyStr(f.value)}, 'rb')`).join(", ") + "}");
    } else if (p.body.looksJson) {
      args.push(`data=${pyStr(p.body.text)}`);
    } else {
      args.push(`data=${pyStr(p.body.text)}`);
    }
  }
  if (p.auth && p.auth.kind === "basic" && p.authMethod === "digest") args.push(`auth=HTTPDigestAuth(${pyStr(p.auth.user ?? "")}, ${pyStr(p.auth.token ?? "")})`); // --digest
  else if (p.auth && p.auth.kind === "basic" && p.authMethod === "other") lines.splice(lines.length - 1, 0, "# curl was asked for NTLM, Negotiate, any method or SigV4: requests needs a separate package for those"); // said, not guessed
  else if (p.auth && p.auth.kind === "basic") args.push(`auth=(${pyStr(p.auth.user ?? "")}, ${pyStr(p.auth.token ?? "")})`); // Basic, curl's default
  const fn = p.method.toLowerCase();
  const known = ["get", "post", "put", "delete", "patch", "head", "options"];
  if (known.includes(fn)) lines.push(`r = requests.${fn}(${args.join(", ")})`);
  else lines.push(`r = requests.request(${pyStr(p.method)}, ${args.join(", ")})`);
  return lines.join("\n");
}
function pyStr(s: string): string {
  return '"' + s.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
}

// ---------------------------------------------------------------------------
// 7. Top-level parse.
// ---------------------------------------------------------------------------
export function parseCurl(input: string): CurlParse {
  const empty: CurlParse = {
    ok: false,
    errorId: "empty",
    method: "GET",
    methodInferred: false,
    url: "",
    headers: [],
    options: [],
    warnings: [],
    translations: { fetch: "", http: "", httpie: "", python: "" },
  };
  if (!input || !input.trim()) return empty;

  const tokens = tokenize(input);
  if (tokens.length === 0) return empty;
  const looksCurl = /^\$?$/.test(tokens[0]) ? /^curl/i.test(tokens[1] ?? "") : /^curl/i.test(tokens[0]);
  if (!looksCurl) return { ...empty, errorId: "notCurl" };
  const r = parseTokens(tokens);

  if (r.urlArg === undefined) {
    return { ...empty, errorId: "noUrl" };
  }

  const { view: urlParts, normalized: parsedUrl } = parseUrl(r.urlArg);

  // -- --url-query (2026-11-01): each argument goes "to the end of the URL query part" (the man page), encoded as
  //    --data-urlencode encodes it unless it starts with "+"; a name@file or @file argument reads a file this page
  //    cannot see, so it is named in the options and left out of the URL.
  let normalized = parsedUrl; // the URL as curl will send it
  for (const q of r.queries) { // in order
    const piece = urlQueryPiece(q); // what curl appends, or null for a file
    if (piece === null || piece === "") continue; // nothing this page can add
    normalized += (normalized.includes("?") ? "&" : "?") + piece; // appended
    for (const pair of piece.split("&")) { // its parameters, as parseUrl reads a query
      if (!pair) continue; // an empty one
      const ei = pair.indexOf("="); // name = value
      urlParts.query.push({ name: safeDecode(ei >= 0 ? pair.slice(0, ei) : pair), value: ei >= 0 ? safeDecode(pair.slice(ei + 1)) : "" }); // decoded, as the URL's own
    } // pairs
  } // queries

  // -- --json (2026-11-01): "--json also implies json Content-Type: and Accept: headers - if they are not set with
  //    -H" (curl's src/tool_paramhlp.c, get_args, read 2026-11-01); they are sent, so they are listed.
  if (r.datas.some((d) => d.kind === "json")) { // a JSON body
    if (findHeader(r.headers, "content-type") === undefined) r.headers.push({ name: "Content-Type", value: "application/json" }); // unless set with -H
    if (findHeader(r.headers, "accept") === undefined) r.headers.push({ name: "Accept", value: "application/json" }); // unless set with -H
  } // json

  // -- Body assembly --
  let body: BodyView | undefined;
  const hasForm = r.forms.length > 0;
  const hasData = r.datas.length > 0;
  const isGet = r.flags.has("get");

  if (hasForm) {
    body = {
      kind: "form",
      text: "",
      fields: r.forms,
      contentType: findHeader(r.headers, "content-type") ?? "multipart/form-data",
      contentTypeImplicit: findHeader(r.headers, "content-type") === undefined,
      looksJson: false,
    };
  } else if (hasData) {
    // join multiple -d with & (curl behavior); --data-urlencode encodes name=value or value
    const parts = r.datas.map((d) => {
      if (d.kind === "data-urlencode") {
        const eq = d.value.indexOf("=");
        if (eq >= 0) return d.value.slice(0, eq) + "=" + encodeURIComponent(d.value.slice(eq + 1));
        return encodeURIComponent(d.value);
      }
      return d.value;
    });
    // The pieces joined as curl joins them (src/tool_getparam.c, set_data, read 2026-11-01): an "&" before each piece
    // when data is already there, "skip separator append for --json" (2026-11-01; before, every piece took an "&").
    let text = ""; // the body
    parts.forEach((piece, k) => { if (text.length > 0 && r.datas[k].kind !== "json") text += "&"; text += piece; }); // each piece
    if (!isGet) {
      const explicitCT = findHeader(r.headers, "content-type");
      body = {
        kind: r.datas.some((d) => d.kind === "json") ? "json" : r.datas.some((d) => d.kind === "data-binary") ? "binary" : "urlencoded", // --json first (2026-11-01)
        text,
        contentType: explicitCT ?? "application/x-www-form-urlencoded",
        contentTypeImplicit: explicitCT === undefined,
        looksJson: looksLikeJson(text),
      };
    } else {
      // -G moves the data into the query string; no body
      for (const part of text.split("&")) {
        if (!part) continue;
        const ei = part.indexOf("=");
        urlParts.query.push({
          name: ei >= 0 ? part.slice(0, ei) : part,
          value: ei >= 0 ? part.slice(ei + 1) : "",
        });
      }
    }
  }

  // -- Method inference --
  let method = r.method ?? "";
  let methodInferred = false;
  if (!method) {
    methodInferred = true;
    if (r.flags.has("head")) method = "HEAD";
    else if (isGet) method = "GET";
    else if (hasForm || (hasData && !isGet)) method = "POST";
    else method = "GET";
  }

  // -- Auth --
  let auth: CurlParse["auth"];
  if (r.user) {
    const ci = r.user.indexOf(":");
    auth = { kind: "basic", user: ci >= 0 ? r.user.slice(0, ci) : r.user, token: ci >= 0 ? r.user.slice(ci + 1) : "" };
  }
  // --oauth2-bearer (2026-11-01): curl sets "config->authtype |= CURLAUTH_BEARER" (src/tool_getparam.c, read
  // 2026-11-01), and -u sets no type, so Bearer is the authentication even with -u; an Authorization written with -H
  // still wins below, as curl's own header gives way to one set with -H.
  if (r.bearer !== undefined) auth = { kind: "bearer", token: r.bearer };
  const authHeader = findHeader(r.headers, "authorization");
  if (authHeader) {
    if (/^bearer\s+/i.test(authHeader)) auth = { kind: "bearer", token: authHeader.replace(/^bearer\s+/i, "") };
    else if (!auth) auth = { kind: "other", token: authHeader };
  }

  // -- Warnings --
  const warnings: string[] = [];
  if (r.flags.has("insecure")) warnings.push("insecureTls");
  if (urlParts.scheme === "http") warnings.push("plaintextHttp");
  if (urlParts.userinfo) warnings.push("credsInUrl");
  if (body && body.looksJson && body.contentTypeImplicit) warnings.push("jsonButFormCt");

  // -- Rebuild a clean URL (without embedded userinfo) for the translations --
  const cleanUrl =
    urlParts.scheme +
    "://" +
    urlParts.host +
    (urlParts.port ? ":" + urlParts.port : "") +
    urlParts.path +
    (urlParts.query.length ? "?" + urlParts.query.map((kv) => enc(kv.name) + "=" + enc(kv.value)).join("&") : "");

  // The translations carry the Authorization curl sends for --oauth2-bearer ("Bearer" and the token, RFC 6750 section
  // 2.1), unless one was written with -H (2026-11-01).
  const bearerHeader: KV[] = r.bearer !== undefined && authHeader === undefined ? [{ name: "Authorization", value: "Bearer " + r.bearer }] : []; // the field curl adds
  // And the one curl sends for -u (01/11/2026): Basic is curl's default method ("--basic ... This method is the default",
  // curl manual, curl.se/docs/manpage.html, read 2026-11-01), so -u user:password sends "Authorization: Basic" and the
  // Base64 of "user:password" (RFC 7617 section 2, the user-pass in UTF-8 as curl takes it from the command line). Not
  // when another method is chosen (--digest, --ntlm, --negotiate, --anyauth, --aws-sigv4: those answer a challenge or
  // sign the request, and send no such field up front), not when -H or --oauth2-bearer sets the Authorization, and not
  // when the password is missing: curl then prompts for it ("If you specify only the username, curl prompts for a
  // password"), and a translation cannot know it.
  const basicHeader: KV[] = basicAuthorization(r, authHeader); // the field, or none
  const headersForOutput = [...r.headers, ...bearerHeader, ...basicHeader]; // what the fetch and raw HTTP translations send

  const translations: Translations = {
    fetch: toFetch({ method, methodInferred, url: cleanUrl, headers: headersForOutput, body }),
    http: toHttp({ method, urlParts, headers: headersForOutput, body }),
    httpie: toHttpie({ method, url: cleanUrl, headers: [...r.headers, ...bearerHeader], body, auth: httpieAuth(r, authHeader) }), // HTTPie's own -a (and -A digest)
    python: toPython({ method, url: cleanUrl, headers: [...r.headers, ...bearerHeader], body, auth, authMethod: curlAuthMethod(r) }), // requests' own auth= for Basic and Digest
  };

  return {
    ok: true,
    method,
    methodInferred,
    url: normalized,
    urlParts,
    headers: r.headers,
    body,
    auth,
    cookies: r.cookie,
    options: r.options,
    warnings,
    translations,
  };
}

// ---------------------------------------------------------------------------
// 8. Share results (2026-10-27): the copy a link carries. A curl command
//    pasted while debugging an API often holds a credential (this
//    page's own Example sends "Authorization: Bearer ..."), so a link never
//    carries the command as typed: it carries this copy, in which each value
//    the curl man page (read 2026-10-27 and 2026-11-01) or an HTTP standard defines as a
//    secret is replaced by the word REDACTED, using the HTTP secrets rules of
//    src/lib/tools/http-message-decoder/http-secrets.ts:
//      -u/--user, -U/--proxy-user   "user:password": the password ("The
//                                    username and passwords are split up on
//                                    the first colon"); the user stays
//      --oauth2-bearer              the Bearer Token, whole (RFC 6750)
//      --pass, --proxy-pass         a private key's passphrase, whole
//      --tlspassword, --proxy-tlspassword  the TLS-SRP password, whole
//      -E/--cert, --proxy-cert      "certificate[:password]": the password
//                                    (the first ":" not escaped as "\:"; a
//                                    pkcs11: URI has none)
//      -H/--header, --proxy-header  by the field's name: Authorization and
//                                    Proxy-Authorization keep their scheme,
//                                    Cookie its names, X-API-Key and the like
//                                    go whole; a token in another value goes
//      -b/--cookie                  "NAME1=VALUE1; NAME2=VALUE2": every value
//                                    (a word without "=" is a file name)
//      -d and the --data family, --json, --url-query, --variable, -F
//                                   JSON members and name=value pairs whose
//                                    name holds a secret ("@file" reads a file
//                                    and stays)
//      the URL, --url, -x/--proxy, -e/--referer
//                                   the userinfo's password and the query's
//                                    and fragment's secret parameters
//      --httpsig-key, --ftp-account  a signing key or FTP account data, whole
//                                    (an "@file" key stays) (2026-11-01)
//      any other option curl gives an argument  read as a URL (a proxy, a
//                                    pre-proxy or a SOCKS host can carry
//                                    "user:password@"), as a positional word
//                                    was before 2026-11-01
//    Words are read with tokenizeWords and walked as parseTokens walks them,
//    so each value is found where the explainer finds it: since 2026-11-01 both
//    take the argument of every option curl gives one (takesValueLong,
//    CURL_VALUE_SHORT). A replacement is written into the command in
//    place, so the copy keeps the paste's quotes, line continuations and
//    spacing; a value written with escapes inside it is re-quoted whole
//    instead. The net (findResidualSecret) then looks for a private key, a
//    JWT or a URL password left anywhere (a token in a URL path): the page
//    offers no link while one is there.
// ---------------------------------------------------------------------------

/** How an option's value is read for secrets ("key": whole unless it names a file with "@", 2026-11-01). */
type SecretKind = "user" | "whole" | "key" | "cert" | "header" | "cookie" | "data" | "data-raw" | "form" | "url";

/** The kinds of the long options whose value can hold a secret; any other value-taking option's is read as a URL. */
const LONG_KIND: Readonly<Record<string, SecretKind>> = Object.freeze({
  user: "user", // user:password
  header: "header", // a field
  cookie: "cookie", // cookie data or a file
  data: "data", // a body
  "data-ascii": "data", // a body
  "data-binary": "data", // a body
  "data-urlencode": "data", // name=content
  "data-raw": "data-raw", // a body, "@" not special
  form: "form", // name=content
  "form-string": "form", // name=string
  url: "url", // the URL
  proxy: "url", // the proxy URL
  referer: "url", // a URL
  "proxy-user": "user", // -U user:password
  "oauth2-bearer": "whole", // the Bearer Token
  pass: "whole", // a private key's passphrase
  "proxy-pass": "whole", // the proxy's
  tlspassword: "whole", // TLS-SRP
  "proxy-tlspassword": "whole", // TLS-SRP for the proxy
  "httpsig-key": "key", // an RFC 9421 signing key, or "@file" (2026-11-01)
  "ftp-account": "whole", // FTP account data (2026-11-01)
  cert: "cert", // certificate[:password]
  "proxy-cert": "cert", // the proxy's
  json: "data", // a JSON body
  "url-query": "data", // name=value added to the query
  "proxy-header": "header", // a field for the proxy
  variable: "data", // name=text
}); // the options with a kind (2026-11-01: the former LONG_EXTRA folded in, since parseTokens now reads them all)

/** The kinds of the short options whose value can hold a secret; any other value-taking letter's is read as a URL. */
const SHORT_KIND: Readonly<Record<string, SecretKind>> = Object.freeze({ u: "user", H: "header", b: "cookie", d: "data", F: "form", x: "url", e: "url", U: "user", E: "cert" }); // -u -H -b -d -F -x -e -U -E

/** An own property of a table (never one of Object.prototype's). */
function own<T>(table: Readonly<Record<string, T>>, key: string): T | undefined {
  return Object.prototype.hasOwnProperty.call(table, key) ? table[key] : undefined; // the entry, or nothing
} // own

/**
 * The secrets of one option value.
 * @param kind how the value is read
 * @param v the value (a word's value, or what follows an attached flag)
 * @returns the edits on it
 */
function valueEdits(kind: SecretKind, v: string): Edit[] {
  switch (kind) {
    case "user": { // user:password, split on the first colon
      const c = v.indexOf(":"); // the colon
      return c >= 0 && isReplaceable(v.slice(c + 1)) ? [{ start: c + 1, end: v.length, with: SHARE_REDACTED }] : []; // the password
    } // user
    case "whole": return isReplaceable(v) ? [{ start: 0, end: v.length, with: SHARE_REDACTED }] : []; // all of it
    case "key": return !v.startsWith("@") && isReplaceable(v) ? [{ start: 0, end: v.length, with: SHARE_REDACTED }] : []; // a key, or "@file" kept
    case "cert": { // certificate[:password]
      const c = certPasswordAt(v); // the delimiter, as the explanation finds it (part 2a)
      return c >= 0 && isReplaceable(v.slice(c + 1)) ? [{ start: c + 1, end: v.length, with: SHARE_REDACTED }] : []; // the password
    } // cert
    case "header": { // Name: value
      if (v.startsWith("@")) return []; // a file of headers
      const c = v.indexOf(":"); // the colon
      return c > 0 ? shiftEdits(headerEdits(v.slice(0, c), v.slice(c + 1)), c + 1) : []; // by the field's name
    } // header
    case "cookie": return v.includes("=") ? cookieEdits(v, "word") : []; // cookie data, or a file name
    case "data": return v.startsWith("@") ? [] : redactBody(v, "word").edits; // a body, or a file
    case "data-raw": return redactBody(v, "word").edits; // "@" has no special meaning
    case "form": { // name=content
      const eq = v.indexOf("="); // the name ends here
      const content = eq >= 0 ? v.slice(eq + 1) : ""; // the content
      if (content.startsWith("@") || content.startsWith("<")) return []; // a file
      return redactBody(v, "word").edits; // a secret name's content, or members inside it
    } // form
    case "url": return urlEdits(v, { schemeless: true }); // curl takes "user:pass@host" without a scheme
  } // switch
} // valueEdits

/** The characters a replacement may hold to be written into any quoting in place (REDACTED, base64, a JWT header). */
const IN_PLACE = /^[A-Za-z0-9+/=._-]*$/; // nothing a shell reads specially

/**
 * Write a word's edits into the command: in place when each replaced stretch came from contiguous characters (no quote
 * or escape inside it), otherwise the whole word re-quoted.
 * @param w the word
 * @param edits edits on its value
 * @param out the command's edits, in order
 * @returns how many values were replaced
 */
function placeWord(w: ShellWord, edits: readonly Edit[], out: Edit[]): number {
  if (edits.length === 0) return 0; // nothing here
  const placed: Edit[] = []; // in place
  for (const e of edits) { // each replacement
    const a = w.at[e.start], b = w.at[e.end - 1]; // where its first and last characters came from
    if (e.end > e.start && b - a === e.end - 1 - e.start && IN_PLACE.test(e.with)) { placed.push({ start: a, end: b + 1, with: e.with }); continue; } // contiguous: in place
    out.push({ start: w.start, end: w.end, with: shellQuote(applyWordEdits(w.value, edits)) }); // otherwise the whole word, re-quoted
    return edits.length; // counted
  } // for
  out.push(...placed); // in place
  return edits.length; // counted
} // placeWord

/** Apply ordered edits to a word's value. */
function applyWordEdits(value: string, edits: readonly Edit[]): string {
  let s = "", at = 0; // the result and the position
  for (const e of edits) { s += value.slice(at, e.start) + e.with; at = e.end; } // each edit
  return s + value.slice(at); // the rest
} // applyWordEdits

/** The copy a Share results link carries. */
export interface ShareableCurl {
  /** The command with every credential replaced by REDACTED. */
  text: string;
  /** How many values were replaced. */
  redacted: number;
  /** A secret the rules could not place (a JWT in a URL path, a private key), or null. */
  residual: ResidualSecret | null;
}

/**
 * The copy of a curl command a Share results link carries.
 * @param input the command as pasted
 * @returns the copy, the count, and any secret left in it
 */
export function shareableCurl(input: string): ShareableCurl {
  const words = tokenizeWords(input); // the words, with positions
  const out: Edit[] = []; // the command's edits, in order
  let redacted = 0; // values replaced
  let k = 0; // the current word
  if (k < words.length && /^\$?$/.test(words[k].value)) k++; // a leading "$" prompt
  if (k < words.length && /^curl(\.exe)?$/i.test(words[k].value)) k++; // the program
  /** Read a value word (or the attached part of a flag word) by its kind. */
  const take = (kind: SecretKind | undefined, w: ShellWord | undefined, from: number): void => {
    if (!kind || !w) return; // nothing to read
    redacted += placeWord(w, shiftEdits(valueEdits(kind, w.value.slice(from)), from), out); // replaced and written
  }; // take
  while (k < words.length) { // each word, as parseTokens walks them
    const w = words[k++]; // the word
    const tok = w.value; // its value
    if (tok.startsWith("--")) { // a long option, possibly --name=value
      const eq = tok.indexOf("="); // an attached value
      const name = (eq >= 0 ? tok.slice(2, eq) : tok.slice(2)).toLowerCase(); // its name
      if (own(LONG_VALUE, name) === undefined && !takesValueLong(name)) continue; // a switch, or no option of curl's (as parseTokens reads it)
      const kind = own(LONG_KIND, name) ?? (name.startsWith("expand-") ? own(LONG_KIND, name.slice(7)) : undefined) ?? "url"; // what its value holds; any other option's as a URL
      if (eq >= 0 && eq + 1 < tok.length) take(kind, w, eq + 1); // attached
      else take(kind, words[k++], 0); // the next word (as parseTokens' takeValue)
      continue; // next word
    } // long
    if (tok.startsWith("-") && tok.length > 1) { // short options, possibly a cluster
      for (let j = 1; j < tok.length; j++) { // each letter
        const ch = tok[j]; // the letter
        if (own(SHORT_VALUE, ch) === undefined && !CURL_VALUE_SHORT.has(ch)) continue; // a switch (as parseTokens reads it)
        const kind = own(SHORT_KIND, ch) ?? "url"; // what its value holds; any other letter's as a URL
        if (j + 1 < tok.length) take(kind, w, j + 1); // the rest of the word is the value
        else take(kind, words[k++], 0); // the next word
        break; // a value ends the cluster
      } // for
      continue; // next word
    } // short
    take("url", w, 0); // a positional word: the URL, or a word curl reads as one
  } // while
  const text = applyWordEdits(input, out); // the copy (the edits are in word order, so in order)
  return { text, redacted, residual: findResidualSecret(text) }; // with the net
} // shareableCurl
