// ============================================================================
// src/lib/tools/http-request-translator/compute.ts
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
// ============================================================================

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
  /** "urlencoded" | "form" | "raw" | "binary" */
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
  const out: string[] = [];
  let cur = "";
  let has = false;
  let i = 0;
  const n = cmd.length;
  while (i < n) {
    const c = cmd[i];
    if (c === "\\") {
      if (i + 1 < n && (cmd[i + 1] === "\n" || cmd[i + 1] === "\r")) {
        // line continuation: consume backslash + newline (and a following \n of \r\n)
        i += 2;
        if (cmd[i - 1] === "\r" && cmd[i] === "\n") i++;
        continue;
      }
      if (i + 1 < n) {
        cur += cmd[i + 1];
        has = true;
        i += 2;
        continue;
      }
      i++;
      continue;
    }
    if (c === "'") {
      i++;
      while (i < n && cmd[i] !== "'") {
        cur += cmd[i];
        i++;
      }
      i++; // closing quote
      has = true;
      continue;
    }
    if (c === '"') {
      i++;
      while (i < n && cmd[i] !== '"') {
        if (cmd[i] === "\\" && i + 1 < n && '"\\$`\n'.includes(cmd[i + 1])) {
          if (cmd[i + 1] === "\n") {
            i += 2;
            continue;
          }
          cur += cmd[i + 1];
          i += 2;
          continue;
        }
        cur += cmd[i];
        i++;
      }
      i++; // closing quote
      has = true;
      continue;
    }
    if (c === " " || c === "\t" || c === "\n" || c === "\r") {
      if (has) {
        out.push(cur);
        cur = "";
        has = false;
      }
      i++;
      continue;
    }
    cur += c;
    has = true;
    i++;
  }
  if (has) out.push(cur);
  return out;
}

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
};
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
  datas: { value: string; kind: "data" | "data-binary" | "data-urlencode" }[];
  forms: { name: string; value: string; isFile: boolean }[];
  user?: string;
  cookie?: string;
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
    }
  };

  while (i < tokens.length) {
    const tok = tokens[i++];
    if (tok.startsWith("--")) {
      // long flag, possibly --flag=value
      const eq = tok.indexOf("=");
      const name = (eq >= 0 ? tok.slice(2, eq) : tok.slice(2)).toLowerCase();
      const attached = eq >= 0 ? tok.slice(eq + 1) : undefined;
      if (name in LONG_VALUE) {
        const value = takeValue(attached, next);
        applyValueFlag(LONG_VALUE[name], "--" + name, value);
      } else if (name in LONG_BOOL) {
        const id = LONG_BOOL[name];
        r.flags.add(id);
        r.options.push({ id, raw: "--" + name });
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
        if (ch in SHORT_VALUE) {
          const rest = tok.slice(j + 1);
          const value = takeValue(rest.length ? rest : undefined, next);
          applyValueFlag(SHORT_VALUE[ch], "-" + ch, value);
          consumed = true;
          break;
        } else if (ch in SHORT_BOOL) {
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
function toHttpie(p: { method: string; url: string; headers: KV[]; body?: BodyView }): string {
  const parts = ["http", p.method, p.url];
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
}): string {
  const lines = ["import requests", ""];
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
  if (p.auth && p.auth.kind === "basic") args.push(`auth=(${pyStr(p.auth.user ?? "")}, ${pyStr(p.auth.token ?? "")})`);
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

  const { view: urlParts, normalized } = parseUrl(r.urlArg);

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
    const text = parts.join("&");
    if (!isGet) {
      const explicitCT = findHeader(r.headers, "content-type");
      body = {
        kind: r.datas.some((d) => d.kind === "data-binary") ? "binary" : "urlencoded",
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

  const headersForOutput = r.headers;

  const translations: Translations = {
    fetch: toFetch({ method, methodInferred, url: cleanUrl, headers: headersForOutput, body }),
    http: toHttp({ method, urlParts, headers: headersForOutput, body }),
    httpie: toHttpie({ method, url: cleanUrl, headers: headersForOutput, body }),
    python: toPython({ method, url: cleanUrl, headers: headersForOutput, body, auth }),
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
