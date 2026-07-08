// ============================================================================
// src/lib/tools/curl-command-builder/compute.ts
// ----------------------------------------------------------------------------
// CURL COMMAND BUILDER - the pure, local engine. Takes a structured selection
// (protocol + fields + options) and deterministically assembles the curl
// command, one annotated part per flag, plus safety warnings. The inverse of
// http-request-translator (which parses a pasted command).
//
// Protocol facts are grounded in curl.se ("How To Use", man page) and
// everything.curl.dev/protocols (retrieved 2026-07-07): curl currently speaks
// DICT, FILE, FTP, FTPS, GOPHER, GOPHERS, HTTP, HTTPS, IMAP, IMAPS, LDAP,
// LDAPS, MQTT, MQTTS, POP3, POP3S, RTSP, SCP, SFTP, SMB, SMBS, SMTP, SMTPS,
// TELNET, TFTP, WS and WSS - 27 schemes. The RTMP family exists only in
// build-dependent libcurl configurations and is deliberately not a target.
//
// Nothing is executed and nothing leaves the browser (D-49 localOnly).
// ============================================================================

/** One name/value pair (headers, form fields). */
export interface KV {
  name: string;
  value: string;
  /** Form fields only: value is a file path sent with @ (multipart upload). */
  isFile?: boolean;
}

/** The structured input the UI (or the API caller) provides. */
export interface BuilderState {
  /** Lowercase scheme key; one of the 27 in PROTOCOLS. */
  protocol: string;

  /** URL pieces. `host` is required for everything except file. `path` is
      protocol-flavored: URL path (HTTP), remote path (FTP/SFTP/SCP/TFTP/SMB),
      topic (MQTT), mailbox (IMAP), word (DICT), local path (FILE). */
  host?: string;
  port?: string;
  path?: string;

  // -- HTTP-flavored request shaping ---------------------------------------
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
  headers?: KV[];
  /** Raw request body (-d). `dataMode` picks the flag family. */
  data?: string;
  dataMode?: "raw" | "urlencode";
  /** Multipart form fields (-F). Mutually exclusive with `data`. */
  form?: KV[];

  // -- Credentials -----------------------------------------------------------
  user?: string;
  pass?: string;

  // -- Transfer direction ----------------------------------------------------
  /** Local file to upload with -T (FTP/SFTP/SCP/SMB/TFTP/HTTP PUT/SMTP body). */
  upload?: string;
  /** stdout (default) | remoteName (-O) | file (-o <name>). */
  output?: "stdout" | "remoteName" | "file";
  outputFile?: string;

  // -- Mail (SMTP) -------------------------------------------------------------
  mailFrom?: string;
  mailRcpt?: string[];

  // -- Common option toggles ---------------------------------------------------
  verbose?: boolean;
  silent?: boolean;
  include?: boolean;
  headOnly?: boolean;
  followRedirects?: boolean;
  insecure?: boolean;
  compressed?: boolean;
  listOnly?: boolean;
  httpVersion?: "" | "http1.1" | "http2" | "http3";
  connectTimeout?: string;
  maxTime?: string;
  retry?: string;
  proxy?: string;
  resolve?: string;
  cacert?: string;
  userAgent?: string;
  cookie?: string;
  cookieJar?: string;
}

/** One rendered command part: the flag, its (already escaped) value, and the
    i18n id explaining it, so the UI can teach every emitted flag. */
export interface CommandPart {
  flag: string;
  value?: string;
  explainId: string;
}

export interface BuildResult {
  ok: boolean;
  errorId?: string;
  /** Single-line command (what the golden vectors assert). */
  command: string;
  /** Same command, pretty-printed with backslash continuations. */
  pretty: string;
  url: string;
  parts: CommandPart[];
  /** i18n warning ids, deterministic order. */
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Protocol capability table - the single source of truth. The UI's explainer
// panels and the assembler both read this, so tool text and behavior cannot
// drift apart.
// ---------------------------------------------------------------------------

export type PathKind = "urlpath" | "remotepath" | "topic" | "mailbox" | "word" | "localfile" | "share" | "none";

export interface ProtocolInfo {
  key: string;
  /** Display scheme, e.g. "https". */
  scheme: string;
  group: "web" | "transfer" | "mail" | "messaging" | "lookup";
  /** IANA-standard default port ("" for file). */
  port: string;
  /** cleartext | tls (implicit) | upgrade (STARTTLS-style via --ssl-reqd). */
  tls: "clear" | "tls" | "upgrade";
  pathKind: PathKind;
  supports: {
    method?: boolean;
    headers?: boolean;
    data?: boolean;
    form?: boolean;
    upload?: boolean;
    auth?: boolean;
    mail?: boolean;
    listOnly?: boolean;
    httpVersion?: boolean;
  };
  /** Loaded by the per-protocol Example button; merged over defaults. */
  example: Partial<BuilderState>;
}

/** All 27 protocols the current curl tool speaks (curl.se, 2026-07-07). */
export const PROTOCOLS: readonly ProtocolInfo[] = Object.freeze([
  // -- web ---------------------------------------------------------------
  { key: "http",    scheme: "http",    group: "web", port: "80",  tls: "clear", pathKind: "urlpath",
    supports: { method: true, headers: true, data: true, form: true, upload: true, auth: true, httpVersion: true },
    example: { host: "api.example.com", path: "/v1/users", method: "POST", data: '{"name":"Alice"}', headers: [{ name: "Content-Type", value: "application/json" }] } },
  { key: "https",   scheme: "https",   group: "web", port: "443", tls: "tls", pathKind: "urlpath",
    supports: { method: true, headers: true, data: true, form: true, upload: true, auth: true, httpVersion: true },
    example: { host: "api.example.com", path: "/v1/users", method: "POST", data: '{"name":"Alice"}', headers: [{ name: "Content-Type", value: "application/json" }], compressed: true } },
  { key: "ws",      scheme: "ws",      group: "web", port: "80",  tls: "clear", pathKind: "urlpath",
    supports: { headers: true, auth: true },
    example: { host: "echo.example.com", path: "/socket", include: true } },
  { key: "wss",     scheme: "wss",     group: "web", port: "443", tls: "tls", pathKind: "urlpath",
    supports: { headers: true, auth: true },
    example: { host: "echo.example.com", path: "/socket", include: true } },
  // -- transfer -----------------------------------------------------------
  { key: "ftp",     scheme: "ftp",     group: "transfer", port: "21",  tls: "upgrade", pathKind: "remotepath",
    supports: { upload: true, auth: true, listOnly: true },
    example: { host: "ftp.example.com", path: "/pub/report.pdf", user: "anonymous", output: "remoteName" } },
  { key: "ftps",    scheme: "ftps",    group: "transfer", port: "990", tls: "tls", pathKind: "remotepath",
    supports: { upload: true, auth: true, listOnly: true },
    example: { host: "ftp.example.com", path: "/inbox/", user: "alice", upload: "report.pdf" } },
  { key: "sftp",    scheme: "sftp",    group: "transfer", port: "22",  tls: "tls", pathKind: "remotepath",
    supports: { upload: true, auth: true },
    example: { host: "files.example.com", path: "/home/alice/notes.txt", user: "alice", output: "remoteName" } },
  { key: "scp",     scheme: "scp",     group: "transfer", port: "22",  tls: "tls", pathKind: "remotepath",
    supports: { upload: true, auth: true },
    example: { host: "files.example.com", path: "/home/alice/notes.txt", user: "alice", output: "file", outputFile: "notes.txt" } },
  { key: "tftp",    scheme: "tftp",    group: "transfer", port: "69",  tls: "clear", pathKind: "remotepath",
    supports: { upload: true },
    example: { host: "192.0.2.10", path: "/firmware.bin", output: "remoteName" } },
  { key: "smb",     scheme: "smb",     group: "transfer", port: "445", tls: "clear", pathKind: "share",
    supports: { upload: true, auth: true },
    example: { host: "fileserver", path: "/share/docs/plan.docx", user: "alice", output: "remoteName" } },
  { key: "smbs",    scheme: "smbs",    group: "transfer", port: "445", tls: "tls", pathKind: "share",
    supports: { upload: true, auth: true },
    example: { host: "fileserver", path: "/share/docs/plan.docx", user: "alice", output: "remoteName" } },
  { key: "file",    scheme: "file",    group: "transfer", port: "",    tls: "clear", pathKind: "localfile",
    supports: {},
    example: { path: "/etc/hosts" } },
  // -- mail ---------------------------------------------------------------
  { key: "smtp",    scheme: "smtp",    group: "mail", port: "25",  tls: "upgrade", pathKind: "none",
    supports: { auth: true, mail: true, upload: true },
    example: { host: "mail.example.com", mailFrom: "alice@example.com", mailRcpt: ["bob@example.com"], upload: "message.eml" } },
  { key: "smtps",   scheme: "smtps",   group: "mail", port: "465", tls: "tls", pathKind: "none",
    supports: { auth: true, mail: true, upload: true },
    example: { host: "mail.example.com", user: "alice", mailFrom: "alice@example.com", mailRcpt: ["bob@example.com"], upload: "message.eml" } },
  { key: "pop3",    scheme: "pop3",    group: "mail", port: "110", tls: "upgrade", pathKind: "none",
    supports: { auth: true, listOnly: true },
    example: { host: "mail.example.com", user: "alice", listOnly: true } },
  { key: "pop3s",   scheme: "pop3s",   group: "mail", port: "995", tls: "tls", pathKind: "none",
    supports: { auth: true, listOnly: true },
    example: { host: "mail.example.com", user: "alice", path: "/1" } },
  { key: "imap",    scheme: "imap",    group: "mail", port: "143", tls: "upgrade", pathKind: "mailbox",
    supports: { auth: true },
    example: { host: "mail.example.com", user: "alice", path: "/INBOX" } },
  { key: "imaps",   scheme: "imaps",   group: "mail", port: "993", tls: "tls", pathKind: "mailbox",
    supports: { auth: true },
    example: { host: "mail.example.com", user: "alice", path: "/INBOX;UID=1" } },
  // -- messaging -----------------------------------------------------------
  { key: "mqtt",    scheme: "mqtt",    group: "messaging", port: "1883", tls: "clear", pathKind: "topic",
    supports: { data: true },
    example: { host: "broker.example.com", path: "/sensors/temp", data: "21.5" } },
  { key: "mqtts",   scheme: "mqtts",   group: "messaging", port: "8883", tls: "tls", pathKind: "topic",
    supports: { data: true },
    example: { host: "broker.example.com", path: "/sensors/temp" } },
  // -- lookup & legacy -------------------------------------------------------
  { key: "ldap",    scheme: "ldap",    group: "lookup", port: "389", tls: "upgrade", pathKind: "urlpath",
    supports: { auth: true },
    example: { host: "ldap.example.com", path: "/dc=example,dc=com?cn?sub?(objectClass=person)" } },
  { key: "ldaps",   scheme: "ldaps",   group: "lookup", port: "636", tls: "tls", pathKind: "urlpath",
    supports: { auth: true },
    example: { host: "ldap.example.com", path: "/dc=example,dc=com?cn?sub?(objectClass=person)" } },
  { key: "dict",    scheme: "dict",    group: "lookup", port: "2628", tls: "clear", pathKind: "word",
    supports: {},
    example: { host: "dict.org", path: "/d:curl" } },
  { key: "gopher",  scheme: "gopher",  group: "lookup", port: "70",  tls: "clear", pathKind: "urlpath",
    supports: {},
    example: { host: "gopher.example.com", path: "/1/docs" } },
  { key: "gophers", scheme: "gophers", group: "lookup", port: "70",  tls: "tls", pathKind: "urlpath",
    supports: {},
    example: { host: "gopher.example.com", path: "/1/docs" } },
  { key: "rtsp",    scheme: "rtsp",    group: "lookup", port: "554", tls: "clear", pathKind: "urlpath",
    supports: { headers: true },
    example: { host: "media.example.com", path: "/stream1", output: "file", outputFile: "stream.bin" } },
  { key: "telnet",  scheme: "telnet",  group: "lookup", port: "23",  tls: "clear", pathKind: "none",
    supports: {},
    example: { host: "192.0.2.20", port: "7", verbose: true } },
]);

export const PROTOCOL_MAP: ReadonlyMap<string, ProtocolInfo> = new Map(PROTOCOLS.map((p) => [p.key, p]));

// ---------------------------------------------------------------------------
// Shell escaping - POSIX single-quote style, applied only when needed, so the
// output stays deterministic AND readable. A note about cmd.exe belongs in the
// UI copy, not in the escaping (the generated form targets POSIX shells).
// ---------------------------------------------------------------------------

const SAFE = /^[A-Za-z0-9_@%+=:,.\/\-{}\[\]]+$/;

/** Quote a value for a POSIX shell if it contains anything unsafe. */
export function shq(v: string): string {
  if (v.length > 0 && SAFE.test(v)) return v;
  return "'" + v.replace(/'/g, "'\\''") + "'";
}

// ---------------------------------------------------------------------------
// URL assembly - protocol-flavored, deterministic.
// ---------------------------------------------------------------------------

function buildUrl(p: ProtocolInfo, s: BuilderState): string | null {
  if (p.key === "file") {
    if (!s.path) return null;
    // file: URLs take an absolute path after the triple slash.
    return "file://" + (s.path.startsWith("/") ? "" : "/") + s.path;
  }
  if (!s.host) return null;
  const port = s.port && s.port !== p.port ? ":" + s.port : "";
  let path = s.path ?? "";
  if (path && !path.startsWith("/")) path = "/" + path;
  return p.scheme + "://" + s.host + port + path;
}

// ---------------------------------------------------------------------------
// The assembler. Flags are emitted in ONE canonical order so identical inputs
// always produce byte-identical commands (golden-vector requirement).
// ---------------------------------------------------------------------------

export function buildCurl(s: BuilderState): BuildResult {
  const fail = (errorId: string): BuildResult => ({ ok: false, errorId, command: "", pretty: "", url: "", parts: [], warnings: [] });

  const p = PROTOCOL_MAP.get(s.protocol);
  if (!p) return fail("protocol");
  const url = buildUrl(p, s);
  if (!url) return fail(p.key === "file" ? "path" : "host");

  const parts: CommandPart[] = [];
  const warnings: string[] = [];
  const add = (flag: string, explainId: string, value?: string) => parts.push({ flag, explainId, value });

  // 1. Request shaping ------------------------------------------------------
  if (s.headOnly && p.supports.method) {
    add("-I", "headOnly");
  } else if (s.method && s.method !== "GET" && p.supports.method) {
    // curl infers POST from -d/-F; only emit -X when it genuinely differs.
    const inferredPost = (s.data !== undefined || (s.form?.length ?? 0) > 0) && s.method === "POST";
    if (!inferredPost) add("-X", "method", s.method);
  }
  if (s.httpVersion && p.supports.httpVersion) {
    if (s.httpVersion === "http1.1") add("--http1.1", "httpVersion");
    if (s.httpVersion === "http2") add("--http2", "httpVersion");
    if (s.httpVersion === "http3") add("--http3", "httpVersion");
  }
  for (const h of s.headers ?? []) {
    if (p.supports.headers && h.name) add("-H", "header", h.name + ": " + h.value);
  }

  // 2. Credentials -----------------------------------------------------------
  if (s.user && p.supports.auth) {
    add("-u", "user", s.pass ? s.user + ":" + s.pass : s.user);
    if (s.pass) warnings.push("passOnCli");
  }

  // 3. Payload ----------------------------------------------------------------
  if (p.supports.data && s.data !== undefined && s.data !== "") {
    if (s.dataMode === "urlencode") add("--data-urlencode", "dataUrlencode", s.data);
    else add("-d", "data", s.data);
    if (p.group === "web" && !(s.headers ?? []).some((h) => h.name.toLowerCase() === "content-type")) {
      warnings.push("dataDefaultCt"); // curl -d defaults to application/x-www-form-urlencoded
    }
  }
  for (const f of s.form ?? []) {
    if (p.supports.form && f.name) add("-F", "form", f.name + "=" + (f.isFile ? "@" : "") + f.value);
  }
  if (s.upload && p.supports.upload) add("-T", "upload", s.upload);

  // 4. Mail envelope -------------------------------------------------------------
  if (p.supports.mail) {
    if (s.mailFrom) add("--mail-from", "mailFrom", s.mailFrom);
    for (const r of s.mailRcpt ?? []) if (r) add("--mail-rcpt", "mailRcpt", r);
  }

  // 5. Cookies / identity ----------------------------------------------------------
  if (s.cookie && p.group === "web") add("-b", "cookie", s.cookie);
  if (s.cookieJar && p.group === "web") add("-c", "cookieJar", s.cookieJar);
  if (s.userAgent && p.group === "web") add("-A", "userAgent", s.userAgent);

  // 6. Connection ---------------------------------------------------------------
  if (s.proxy) add("-x", "proxy", s.proxy);
  if (s.resolve) add("--resolve", "resolve", s.resolve);
  if (s.cacert) add("--cacert", "cacert", s.cacert);
  if (s.insecure) { add("-k", "insecure"); warnings.push("insecure"); }
  if (s.connectTimeout) add("--connect-timeout", "connectTimeout", s.connectTimeout);
  if (s.maxTime) add("--max-time", "maxTime", s.maxTime);
  if (s.retry) add("--retry", "retry", s.retry);
  if (p.tls === "upgrade" && !s.insecure && (s.user || s.upload || s.data)) {
    // Cleartext-by-default protocol carrying credentials or content: nudge
    // toward the STARTTLS upgrade curl offers on these protocols.
    warnings.push("considerSslReqd");
  }

  // 7. Behavior toggles --------------------------------------------------------
  if (s.followRedirects && p.group === "web") add("-L", "followRedirects");
  if (s.compressed && p.group === "web") add("--compressed", "compressed");
  if (s.listOnly && p.supports.listOnly) add("-l", "listOnly");

  // 8. Output --------------------------------------------------------------------
  if (s.output === "remoteName") add("-O", "outputRemote");
  if (s.output === "file" && s.outputFile) add("-o", "outputFile", s.outputFile);

  // 9. Verbosity ------------------------------------------------------------------
  if (s.include && p.group === "web" && !s.headOnly) add("-i", "include");
  if (s.verbose) add("-v", "verbose");
  if (s.silent) add("-s", "silent");

  // Cleartext warning: any scheme that does not start inside TLS. This
  // includes the "upgrade" (STARTTLS-style) protocols - they begin in
  // cleartext unless the transfer explicitly upgrades.
  if (p.tls !== "tls" && p.key !== "file") warnings.push("cleartext");
  if (p.key === "telnet") warnings.push("telnetInteractive");
  if (p.key === "smb" || p.key === "smbs") warnings.push("smbV1");

  // Render ---------------------------------------------------------------------
  const tokens: string[] = ["curl"];
  const prettyLines: string[] = ["curl"];
  for (const part of parts) {
    const seg = part.value !== undefined ? part.flag + " " + shq(part.value) : part.flag;
    tokens.push(seg);
    prettyLines.push("  " + seg);
  }
  tokens.push(shq(url));
  prettyLines.push("  " + shq(url));

  return {
    ok: true,
    command: tokens.join(" "),
    pretty: prettyLines.join(" \\\n"),
    url,
    parts,
    warnings,
  };
}
