// ============================================================================
// src/lib/tools/http-message-decoder/compute.ts
// ----------------------------------------------------------------------------
// THE HTTP MESSAGE DECODER: the pure engine (rank 8 of the 2026-10 campaign).
//
// Paste a raw HTTP/1.1 request or response, the way a capture, a proxy log, a
// curl -v trace or an RFC example gives it, and read it decoded: the request
// line (method, target and its form, version) or the status line (version,
// code, the registry's reason phrase beside the one sent), every field parsed
// and filed under the part of the specification that defines it, the framing
// decision RFC 9112 makes for the body (which of its eight rules applies, what
// Content-Length declares, whether Transfer-Encoding overrides it, the chunks
// decoded one by one with their sizes and trailers), and the credentials and
// cookies the message carries, surfaced and masked so the page shows what is
// there without reprinting a secret.
//
// It is the decode-only half of an interception proxy's inspector. It never
// sends, replays, tampers or fuzzes (D-53); nothing leaves the browser.
//
// FACTS. The rules quote RFC 9112 (HTTP/1.1: message syntax, request line,
// status line, field syntax, obsolete line folding, Transfer-Encoding,
// Content-Length, the eight message-body-length rules of Section 6.3, chunked
// transfer coding and its decoding algorithm), RFC 9110 (HTTP Semantics: field
// names case-insensitive, combining field lines, CR/LF/NUL in values, the three
// HTTP-date formats, Host, Connection, Content-Length, safe and idempotent
// methods, authentication schemes, status code classes), RFC 9111 for the
// caching fields, the IANA field-name and status-code registries, the cookie
// draft rfc6265bis-22 (Set-Cookie syntax, the __Secure- and __Host- prefixes,
// SameSite's default, Max-Age over Expires), RFC 7617 (Basic) and RFC 6648
// (the X- prefix), all read 2026-10-05. The manifest carries the citations.
// ============================================================================

import { METHOD_TABLE, type MethodProperties } from "@/lib/tools/http-methods-comparison/compute";
import { lookupField, type FieldGroup, type FieldStatus } from "./registry-fields";
import { lookupStatus } from "./registry-status";

/** The input: one raw message. */
export interface HttpMessageInput {
  /** The message as pasted. */
  message: string;
}

/** The upper bound on the input, so a pasted capture cannot stall the page. */
export const MESSAGE_MAX_CHARS = 262144;

/** How serious a finding is. */
export type Severity = "error" | "warning" | "info";

/** One finding against a rule. */
export interface HttpFinding {
  /** H1 to H26. */
  rule: string;
  /** How serious. */
  severity: Severity;
  /** 1-based line of the message the finding points at (1 is the start line). */
  line: number;
  /** The trimmed source line. */
  snippet: string;
  /** Details for the message; `what` picks the variant of the rule's sentence when the rule has several. */
  params?: Record<string, string | number>;
}

/** The form of a request target (RFC 9112 Section 3.2). */
export type TargetForm = "origin" | "absolute" | "authority" | "asterisk" | "invalid";

/** The decoded request line. */
export interface RequestLine {
  /** The method as written. */
  method: string;
  /** The method's properties from the methods table, when it is a known method. */
  known: MethodProperties | null;
  /** The request target as written. */
  target: string;
  /** Its form. */
  targetForm: TargetForm;
  /** The HTTP version as written ("" when absent, which reads as HTTP/0.9-style). */
  version: string;
  /** The version's major.minor, when it parses. */
  versionNumber: string | null;
  /** The absolute URL assembled from the target and Host, when both allow it. */
  url: string | null;
}

/** The decoded status line. */
export interface StatusLine {
  /** The HTTP version as written. */
  version: string;
  /** The code as written. */
  codeText: string;
  /** The code as a number, or null when not three digits. */
  code: number | null;
  /** The class digit (1 to 5), or null. */
  klass: number | null;
  /** The reason phrase as written (may be empty). */
  reason: string;
  /** The registry's description for the code, or null when unassigned. */
  registryReason: string | null;
  /** The registry's reference for the code, or null. */
  registryReference: string | null;
}

/** One field line, parsed. */
export interface FieldLine {
  /** The name as written. */
  name: string;
  /** The name in the registry's casing, or as written when unregistered. */
  canonical: string;
  /** The value, outer whitespace trimmed, folded lines joined with one space. */
  value: string;
  /** 1-based line of the field. */
  line: number;
  /** The registry's status, or "unregistered". */
  status: FieldStatus | "unregistered";
  /** The registry's reference, or null. */
  reference: string | null;
  /** The editorial group (unregistered names go to "unregistered"). */
  group: FieldGroup | "unregistered";
  /** Whether the name carries the X- prefix RFC 6648 deprecates. */
  xPrefixed: boolean;
  /** Whether the line was folded (obs-fold) onto following lines. */
  folded: boolean;
  /** Whether whitespace preceded the colon. */
  spaceBeforeColon: boolean;
}

/** One decoded chunk of a chunked body. */
export interface Chunk {
  /** 1-based line of the chunk-size line. */
  line: number;
  /** The size as written (hex). */
  sizeHex: string;
  /** The size in octets. */
  size: number;
  /** The chunk extensions as written (after the ';'), or "". */
  ext: string;
  /** The first 80 characters of the chunk data, control characters made visible. */
  preview: string;
  /** Whether the data present is shorter than the size says. */
  truncated: boolean;
}

/** The chunked decode. */
export interface ChunkedDecode {
  /** The chunks in order (the last-chunk of size 0 is not listed). */
  chunks: Chunk[];
  /** Whether the last-chunk (size 0) was found. */
  lastChunk: boolean;
  /** The trailer fields after the last chunk. */
  trailers: { name: string; value: string }[];
  /** The decoded content length in octets. */
  decodedLength: number;
  /** The first 400 characters of the decoded content, control characters made visible. */
  contentPreview: string;
  /** The error that stopped decoding, as a message id with its line, or null. */
  error: { what: "bad-size" | "truncated" | "missing-crlf" | "no-last-chunk"; line: number } | null;
  /** Octets left after the chunked body ended (the empty line after the trailers): the start of the next message, to a recipient. */
  leftover: number;
  /** The first 80 characters of that leftover, control characters made visible. */
  leftoverPreview: string;
}

/** The framing decision for the body (RFC 9112 Section 6.3). */
export interface Framing {
  /** Which of the eight rules applied (0 when the message type is unknown). */
  rule: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  /** Content-Length values as written, one per line and list element. */
  contentLengths: string[];
  /** The single Content-Length that applies, or null. */
  contentLength: number | null;
  /** Transfer-Encoding codings as written, lower-cased, in order. */
  transferCodings: string[];
  /** Whether chunked is the final coding. */
  chunkedFinal: boolean;
  /** The body as pasted, in octets (UTF-8). */
  bodyOctets: number;
  /** The chunked decode, when rule 4 applied with chunked final. */
  chunked: ChunkedDecode | null;
  /** How the body ends: by the empty line, by Content-Length, by the chunked coding, by connection close, or unknown. */
  delimiter: "none" | "content-length" | "chunked" | "close" | "unknown";
}

/** A credential the message carries, masked. */
export interface Credential {
  /** The field: Authorization or Proxy-Authorization. */
  field: string;
  /** The scheme as written. */
  scheme: string;
  /** For Basic: the user-id when the base64 decodes to user:password; the password is never returned. */
  userId: string | null;
  /** The token or parameters, masked except the first and last four characters. */
  masked: string;
  /** Whether the token is shaped like a JWT (three base64url parts). */
  jwtShaped: boolean;
  /** 1-based line. */
  line: number;
}

/** One cookie of a Cookie header. */
export interface CookiePair {
  /** The cookie name. */
  name: string;
  /** The value, masked except the first and last two characters. */
  masked: string;
  /** The value's length. */
  length: number;
}

/** One Set-Cookie line, parsed. */
export interface SetCookie {
  /** 1-based line. */
  line: number;
  /** The cookie name. */
  name: string;
  /** The value, masked. */
  masked: string;
  /** Attributes as written, name to value ("" for flags). */
  attributes: { name: string; value: string }[];
  /** The flags read. */
  secure: boolean;
  httpOnly: boolean;
  /** SameSite as written, or null. */
  sameSite: string | null;
  /** Whether Max-Age and Expires are both present (Max-Age wins). */
  bothAges: boolean;
  /** Prefix rules: "__Secure-" or "__Host-" when the name carries one, else null. */
  prefix: "__Secure-" | "__Host-" | null;
  /** Whether the prefix's requirements are met (null when no prefix). */
  prefixOk: boolean | null;
}

/** A hand-off to another tool on the site. */
export interface Handoff {
  /** What is handed off. */
  kind: "status" | "method" | "url" | "jwt" | "security-headers" | "cookies" | "replay";
  /** The tool slug. */
  tool: string;
  /** A value safe to carry in a query string (never a secret), or null. */
  input: string | null;
}

/** The result. */
export interface HttpMessageResult {
  /** request, response, or unknown when the start line fits neither. */
  kind: "request" | "response" | "unknown";
  /** The decoded request line, when a request. */
  request: RequestLine | null;
  /** The decoded status line, when a response. */
  response: StatusLine | null;
  /** The start line as written. */
  startLine: string;
  /** The fields in message order. */
  fields: FieldLine[];
  /** The fields grouped: group id to field indexes, groups in presentation order. */
  groups: { group: FieldGroup | "unregistered"; fields: number[] }[];
  /** The framing decision. */
  framing: Framing;
  /** Credentials found. */
  credentials: Credential[];
  /** Cookies sent (Cookie header). */
  cookies: CookiePair[];
  /** Cookies set (Set-Cookie lines). */
  setCookies: SetCookie[];
  /** Hand-offs to neighbouring tools. */
  handoffs: Handoff[];
  /** The findings, in line order. */
  findings: HttpFinding[];
  /** Counts by severity. */
  counts: { error: number; warning: number; info: number };
  /** Facts about the paste: line endings, lines, header count, body present. */
  facts: { lineEnding: "crlf" | "lf" | "mixed" | "none"; bareCr: number; lines: number; headerLines: number; leadingEmptyLines: number; bodyPresent: boolean };
}

/** The presentation order of the groups. */
const GROUP_ORDER: (FieldGroup | "unregistered")[] = ["framing", "routing", "message", "request-context", "response-context", "representation", "negotiation", "conditional", "range", "caching", "authentication", "cookies", "security-policy", "cors", "fetch-metadata", "websocket", "proxies", "webdav", "other-registered", "unregistered"];

/** Fields that are not comma lists: a second line of one is a defect, not a continuation (RFC 9110 Section 5.3 combines list fields only). */
const SINGLETON_FIELDS = new Set(["host", "content-length", "content-type", "content-location", "date", "expires", "last-modified", "etag", "location", "retry-after", "server", "user-agent", "referer", "from", "age", "authorization", "proxy-authorization", "content-range", "range", "if-range", "if-modified-since", "if-unmodified-since", "max-forwards", "expect", "origin", "strict-transport-security", "x-frame-options", "x-content-type-options", "referrer-policy"]);

/** Refuse an oversized message with a message the page can show. */
function limit(message: string): void {
  // The bound exists so a pasted capture cannot stall the page; the docs quote the number.
  if (message.length > MESSAGE_MAX_CHARS) throw new Error(`The message is longer than ${MESSAGE_MAX_CHARS} characters.`);
}

/** Control characters written back as escapes, so a value reads on a page. */
function visible(text: string): string {
  // Each control character (and DEL) becomes its escape.
  return text.replace(/[\x00-\x1f\x7f]/g, (c) => c === "\r" ? "\\r" : c === "\n" ? "\\n" : c === "\t" ? "\\t" : "\\x" + c.charCodeAt(0).toString(16).padStart(2, "0"));
}

/** Mask a secret, keeping a few characters at each end when it is long enough to stay unidentifiable. */
function maskSecret(text: string, keep: number): string {
  // Short secrets are fully masked.
  if (text.length <= keep * 2 + 2) return "•".repeat(Math.max(text.length, 4));
  // Ends kept, middle masked to a fixed width so the length leaks less.
  return `${text.slice(0, keep)}${"•".repeat(Math.min(text.length - keep * 2, 12))}${text.slice(-keep)}`;
}

/** UTF-8 octets of a string. */
function octets(text: string): number {
  // TextEncoder is available in browsers and Node alike.
  return new TextEncoder().encode(text).length;
}

/** Tcl-free: a token per RFC 9110 Section 5.6.2 (tchar). */
const TOKEN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

/** IMF-fixdate (RFC 9110 Section 5.6.7), the preferred HTTP-date format. */
const IMF_FIXDATE = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} \d{2}:\d{2}:\d{2} GMT$/;
/** The obsolete RFC 850 format. */
const RFC850_DATE = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), \d{2}-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{2} \d{2}:\d{2}:\d{2} GMT$/;
/** The obsolete asctime() format. */
const ASCTIME_DATE = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) [ \d]\d \d{2}:\d{2}:\d{2} \d{4}$/;
/** Fields whose value is an HTTP-date. */
const DATE_FIELDS = new Set(["date", "expires", "last-modified", "if-modified-since", "if-unmodified-since", "retry-after"]);

/** The form of a request target (RFC 9112 Section 3.2). */
function targetForm(target: string): TargetForm {
  // Server-wide OPTIONS.
  if (target === "*") return "asterisk";
  // Origin-form: an absolute path, optionally a query.
  if (target.startsWith("/")) return "origin";
  // Absolute-form: a scheme, a colon, two slashes.
  if (/^[A-Za-z][A-Za-z0-9+.-]*:\/\//.test(target)) return "absolute";
  // Authority-form: host:port, for CONNECT.
  if (/^[^\s/?#@]+:\d+$/.test(target)) return "authority";
  // Anything else is not a valid target.
  return "invalid";
}

/** Split the raw text into lines, recording the line-ending facts. */
function splitLines(raw: string): { lines: string[]; lineEnding: HttpMessageResult["facts"]["lineEnding"]; bareCr: number } {
  // Count the endings.
  const crlf = (raw.match(/\r\n/g) ?? []).length;
  // Bare LF: a LF not preceded by CR.
  const lf = (raw.match(/(^|[^\r])\n/g) ?? []).length;
  // Bare CR: a CR not followed by LF.
  const bareCr = (raw.match(/\r(?!\n)/g) ?? []).length;
  // The kind.
  const lineEnding = crlf > 0 && lf > 0 ? "mixed" : crlf > 0 ? "crlf" : lf > 0 ? "lf" : "none";
  // Split on either ending; a bare CR stays inside its line (made visible later).
  const lines = raw.split(/\r\n|\n/);
  // Done.
  return { lines, lineEnding, bareCr };
}

/** The engine. */
export function run(input: HttpMessageInput): HttpMessageResult {
  // The raw text.
  const raw = input.message ?? "";
  // Refuse the oversized.
  limit(raw);
  // The findings.
  const F: HttpFinding[] = [];
  // Add a finding.
  const finding = (rule: string, severity: Severity, line: number, snippet: string, params?: Record<string, string | number>) =>
    F.push({ rule, severity, line, snippet: visible(snippet.trim()).slice(0, 160), ...(params ? { params } : {}) });
  // Lines and endings.
  const { lines, lineEnding, bareCr } = splitLines(raw);
  // H28: LF alone as the line terminator (RFC 9112 Section 2.2: a recipient MAY recognize it; a sender uses CRLF).
  if (lineEnding === "lf") finding("H28", "info", 1, lines[0] ?? "", { what: "lf" });
  // H28: a mixture of CRLF and LF.
  else if (lineEnding === "mixed") finding("H28", "info", 1, lines[0] ?? "", { what: "mixed" });
  // H5: bare CR.
  if (bareCr > 0) {
    // The first line holding one.
    const at = lines.findIndex((l) => l.includes("\r"));
    // The finding.
    finding("H5", "warning", at + 1, lines[at] ?? "", { count: bareCr });
  }
  // Leading empty lines (RFC 9112 Section 2.2: a server SHOULD ignore at least one).
  let i = 0;
  // Skip them.
  while (i < lines.length && lines[i].trim() === "") i++;
  // Count.
  const leadingEmptyLines = i;
  // The start line.
  const startLine = lines[i] ?? "";
  // The 1-based line number of the start line.
  const startLineNo = i + 1;
  // Classify.
  let kind: HttpMessageResult["kind"] = "unknown";
  // The request line.
  let request: RequestLine | null = null;
  // The status line.
  let response: StatusLine | null = null;
  // A status line: HTTP-version SP status-code SP [ reason-phrase ].
  const statusMatch = /^(HTTP\/\d(?:\.\d)?)[ \t]+(\d{3})(?:[ \t]+(.*))?$/i.exec(startLine.replace(/\r/g, ""));
  // A looser status line (a non-3-digit code), still a response by shape.
  const statusLoose = !statusMatch ? /^(HTTP\/\S+)[ \t]+(\S+)(?:[ \t]+(.*))?$/i.exec(startLine.replace(/\r/g, "")) : null;
  // The request line: method SP target [SP version].
  const parts = startLine.replace(/\r/g, "").trim().split(/[ \t]+/);
  // Decide.
  if (statusMatch || statusLoose) {
    // A response.
    kind = "response";
    // The pieces.
    const m = (statusMatch ?? statusLoose)!;
    // The code.
    const code = /^\d{3}$/.test(m[2]) ? Number(m[2]) : null;
    // Its class.
    const klass = code !== null && code >= 100 && code <= 599 ? Math.floor(code / 100) : null;
    // The registry row.
    const reg = code !== null ? lookupStatus(code) : undefined;
    // The record.
    response = { version: m[1], codeText: m[2], code, klass, reason: (m[3] ?? "").trim(), registryReason: reg?.description ?? null, registryReference: reg?.reference ?? null };
    // H18: not a 3-digit code, or outside 100..599, or unassigned.
    if (code === null) finding("H18", "error", startLineNo, startLine, { what: "not-three-digits", code: m[2] });
    else if (klass === null) finding("H18", "error", startLineNo, startLine, { what: "out-of-range", code });
    else if (!reg) finding("H18", "warning", startLineNo, startLine, { what: "unassigned", code, klass });
    // H17: the reason phrase differs from the registry's recommendation, or is absent.
    if (reg && response.reason && response.reason.toLowerCase() !== reg.description.toLowerCase()) finding("H17", "info", startLineNo, startLine, { what: "differs", sent: response.reason, registry: reg.description });
    else if (reg && !response.reason) finding("H17", "info", startLineNo, startLine, { what: "absent", registry: reg.description });
    // H25: the version token.
    if (!/^HTTP\/\d\.\d$/.test(m[1])) finding("H25", "warning", startLineNo, startLine, { version: m[1] });
  } else if (parts.length >= 2 && TOKEN.test(parts[0]) && (parts.length >= 3 ? /^HTTP\//i.test(parts[2]) : targetForm(parts[1]) !== "invalid")) {
    // A request.
    kind = "request";
    // The method.
    const method = parts[0];
    // Known?
    const known = METHOD_TABLE.find((mm) => mm.id === method.toUpperCase()) ?? null;
    // The target.
    const target = parts[1];
    // Its form.
    const form = targetForm(target);
    // The version.
    const version = parts[2] ?? "";
    // major.minor when it parses.
    const vm = /^HTTP\/(\d)\.(\d)$/.exec(version);
    // The record (the URL is filled after the fields are read).
    request = { method, known, target, targetForm: form, version, versionNumber: vm ? `${vm[1]}.${vm[2]}` : version === "" ? "0.9" : null, url: null };
    // H16: an unknown method (a token, but not in the table) or a method in the wrong case.
    if (!known) finding("H16", "info", startLineNo, startLine, { what: "unknown", method });
    else if (method !== known.id) finding("H16", "warning", startLineNo, startLine, { what: "case", method, canonical: known.id });
    // H25: the version token: absent, or not HTTP/digit.digit.
    if (version === "") finding("H25", "warning", startLineNo, startLine, { version: "(none)" });
    else if (!vm) finding("H25", "warning", startLineNo, startLine, { version });
    // H24: the target form against the method.
    if (form === "invalid") finding("H24", "error", startLineNo, startLine, { what: "invalid", target });
    else if (form === "authority" && method.toUpperCase() !== "CONNECT") finding("H24", "warning", startLineNo, startLine, { what: "authority-not-connect", method });
    else if (form === "asterisk" && method.toUpperCase() !== "OPTIONS") finding("H24", "warning", startLineNo, startLine, { what: "asterisk-not-options", method });
    else if (method.toUpperCase() === "CONNECT" && form !== "authority") finding("H24", "warning", startLineNo, startLine, { what: "connect-not-authority", target });
    else if (form === "absolute") finding("H24", "info", startLineNo, startLine, { what: "absolute", target });
    // Extra words on the request line.
    if (parts.length > 3) finding("H1", "warning", startLineNo, startLine, { what: "extra-words", count: parts.length - 3 });
  } else {
    // Neither.
    kind = "unknown";
    // H1: the start line fits neither grammar.
    finding("H1", "error", startLineNo, startLine, { what: "unrecognised" });
  }
  // ---- Fields --------------------------------------------------------------
  const fields: FieldLine[] = [];
  // Where the header section ends (the index of the empty line), or the end.
  let headerEnd = lines.length;
  // Walk the field lines (none when the start line was not HTTP: the rest is not read as fields).
  let j = kind === "unknown" ? lines.length : i + 1;
  // Until the empty line.
  while (j < lines.length) {
    // The line, bare CR made part of the text.
    const l = lines[j];
    // The empty line ends the header section.
    if (l.trim() === "" && !l.includes("\r")) { headerEnd = j; break; }
    // A continuation line (obs-fold): starts with SP or HTAB.
    if (/^[ \t]/.test(l) && fields.length > 0) {
      // Append to the previous field with one space (RFC 9112 Section 5.2).
      const prev = fields[fields.length - 1];
      // Joined.
      prev.value = `${prev.value} ${l.trim()}`.trim();
      // Marked.
      prev.folded = true;
      // Next.
      j++;
      // Keep going.
      continue;
    }
    // name ":" OWS value OWS.
    const colon = l.indexOf(":");
    // No colon: not a field line.
    if (colon <= 0) {
      // H3 variant: a line that is not a field.
      finding("H3", "error", j + 1, l, { what: "no-colon" });
      // Next.
      j++;
      // Keep going.
      continue;
    }
    // The name as written and whether whitespace precedes the colon.
    const rawName = l.slice(0, colon);
    // Whitespace before the colon.
    const spaceBeforeColon = /\s$/.test(rawName);
    // Trimmed name.
    const name = rawName.trim();
    // The value.
    const value = l.slice(colon + 1).trim();
    // The registry row.
    const reg = lookupField(name);
    // The record.
    fields.push({ name, canonical: reg?.name ?? name, value, line: j + 1, status: reg?.status ?? "unregistered", reference: reg?.reference ?? null, group: reg?.group ?? "unregistered", xPrefixed: /^x-/i.test(name), folded: false, spaceBeforeColon });
    // H3: whitespace between the name and the colon (RFC 9112 Section 5: a server MUST reject with 400).
    if (spaceBeforeColon) finding("H3", "error", j + 1, l, { what: "space-before-colon", name });
    // H21: the name is not a token.
    if (!TOKEN.test(name)) finding("H21", "error", j + 1, l, { what: "name-not-token", name });
    // H21: NUL in the value (CR and LF cannot survive the split, a bare CR is H5).
    if (/\x00/.test(value)) finding("H21", "error", j + 1, l, { what: "nul-in-value", name });
    // Next.
    j++;
  }
  // The body: everything after the empty line, joined back with the line ending found.
  const bodyLines = headerEnd < lines.length ? lines.slice(headerEnd + 1) : [];
  // Rejoin with the ending the paste used (CRLF when any CRLF was seen).
  const eol = lineEnding === "crlf" || lineEnding === "mixed" ? "\r\n" : "\n";
  // The body text.
  const body = bodyLines.join(eol);
  // Whether a body is present.
  const bodyPresent = body.length > 0;
  // Octets.
  const bodyOctets = octets(body);
  // H4: obs-fold seen.
  for (const f of fields) if (f.folded) finding("H4", "warning", f.line, lines[f.line - 1] ?? "", { name: f.canonical });
  // ---- Per-field analysis --------------------------------------------------
  // Count by lower-cased name.
  const byName = new Map<string, FieldLine[]>();
  // Fill.
  for (const f of fields) {
    // The key.
    const k = f.name.toLowerCase();
    // Append.
    byName.set(k, [...(byName.get(k) ?? []), f]);
  }
  // A field's lines by name.
  const get = (n: string) => byName.get(n) ?? [];
  // H20: a singleton field repeated.
  for (const [k, list] of byName) if (list.length > 1 && SINGLETON_FIELDS.has(k) && k !== "host" && k !== "content-length") finding("H20", "warning", list[1].line, lines[list[1].line - 1] ?? "", { name: list[0].canonical, count: list.length });
  // H22: X- prefixed names (RFC 6648), once per message with the names listed.
  const xs = fields.filter((f) => f.xPrefixed && f.status === "unregistered");
  // One finding.
  if (xs.length > 0) finding("H22", "info", xs[0].line, lines[xs[0].line - 1] ?? "", { count: xs.length, names: xs.map((f) => f.name).join(", ") });
  // H23: deprecated or obsoleted fields.
  for (const f of fields) if (f.status === "deprecated" || f.status === "obsoleted") finding("H23", "info", f.line, lines[f.line - 1] ?? "", { name: f.canonical, status: f.status, reference: f.reference ?? "" });
  // H19: HTTP-date fields not in IMF-fixdate.
  for (const f of fields) {
    // Only date fields.
    if (!DATE_FIELDS.has(f.name.toLowerCase())) continue;
    // Retry-After may be a delay in seconds.
    if (f.name.toLowerCase() === "retry-after" && /^\d+$/.test(f.value)) continue;
    // The preferred format.
    if (IMF_FIXDATE.test(f.value)) continue;
    // An obsolete format a recipient must still accept.
    if (RFC850_DATE.test(f.value) || ASCTIME_DATE.test(f.value)) finding("H19", "info", f.line, lines[f.line - 1] ?? "", { what: "obsolete", name: f.canonical, format: RFC850_DATE.test(f.value) ? "RFC 850" : "asctime" });
    // Not an HTTP-date at all.
    else finding("H19", "warning", f.line, lines[f.line - 1] ?? "", { what: "invalid", name: f.canonical, value: f.value.slice(0, 60) });
  }
  // ---- Host (requests) -----------------------------------------------------
  if (request) {
    // Host lines.
    const hosts = get("host");
    // HTTP/1.1 requires exactly one.
    const is11 = request.versionNumber === "1.1";
    // H2: missing in HTTP/1.1.
    if (hosts.length === 0 && is11) finding("H2", "error", startLineNo, startLine, { what: "missing" });
    // H2: more than one, any version.
    else if (hosts.length > 1) finding("H2", "error", hosts[1].line, lines[hosts[1].line - 1] ?? "", { what: "duplicate", count: hosts.length });
    // The URL from target and Host.
    if (request.targetForm === "absolute") request.url = request.target;
    else if (request.targetForm === "origin" && hosts.length >= 1 && hosts[0].value) request.url = `http://${hosts[0].value}${request.target}`;
    // Host should be first (RFC 9110 Section 7.2, SHOULD).
    if (hosts.length === 1 && fields[0] && fields[0].name.toLowerCase() !== "host") finding("H2", "info", hosts[0].line, lines[hosts[0].line - 1] ?? "", { what: "not-first", position: fields.indexOf(hosts[0]) + 1 });
  }
  // ---- Framing (RFC 9112 Section 6.3) -------------------------------------
  // Content-Length values: every line, split on commas.
  const clLines = get("content-length");
  // Each element trimmed.
  const contentLengths = clLines.flatMap((f) => f.value.split(",").map((v) => v.trim()));
  // Transfer-Encoding codings.
  const teLines = get("transfer-encoding");
  // Lower-cased list.
  const transferCodings = teLines.flatMap((f) => f.value.split(",").map((v) => v.trim().toLowerCase()).filter(Boolean));
  // Chunked last?
  const chunkedFinal = transferCodings.length > 0 && transferCodings[transferCodings.length - 1] === "chunked";
  // The framing record, filled below.
  const framing: Framing = { rule: 0, contentLengths, contentLength: null, transferCodings, chunkedFinal, bodyOctets, chunked: null, delimiter: "unknown" };
  // The line to point framing findings at: the first TE or CL line, else the start line.
  const frameLine = teLines[0]?.line ?? clLines[0]?.line ?? startLineNo;
  // Its text.
  const frameText = lines[frameLine - 1] ?? startLine;
  // Validate Content-Length (RFC 9110 Section 8.6: 1*DIGIT; identical repeats MAY be collapsed).
  const clValid = contentLengths.length > 0 && contentLengths.every((v) => /^\d+$/.test(v));
  // All the same?
  const clSame = clValid && contentLengths.every((v) => v === contentLengths[0]);
  // The value when valid and consistent.
  if (clValid && clSame) framing.contentLength = Number(contentLengths[0]);
  // H7: invalid or inconsistent Content-Length.
  if (contentLengths.length > 0 && !clValid) finding("H7", "error", clLines[0].line, lines[clLines[0].line - 1] ?? "", { what: "invalid", values: contentLengths.join(", ") });
  else if (contentLengths.length > 1 && !clSame) finding("H7", "error", clLines[0].line, lines[clLines[0].line - 1] ?? "", { what: "differ", values: contentLengths.join(", ") });
  else if (contentLengths.length > 1 && clSame) finding("H7", "info", clLines[0].line, lines[clLines[0].line - 1] ?? "", { what: "repeated", value: contentLengths[0], count: contentLengths.length });
  // The version for the HTTP/1.0 rule.
  const versionNumber = request ? request.versionNumber : response ? (/^HTTP\/(\d\.\d)$/i.exec(response.version)?.[1] ?? null) : null;
  // H11: Transfer-Encoding in an HTTP/1.0 message.
  if (teLines.length > 0 && versionNumber === "1.0") finding("H11", "warning", teLines[0].line, lines[teLines[0].line - 1] ?? "", {});
  // Decide the rule.
  if (kind === "unknown") {
    // Nothing to decide.
    framing.rule = 0;
  } else if (response && response.klass !== null && (response.klass === 1 || response.code === 204 || response.code === 304)) {
    // Rule 1: terminated by the empty line, whatever the fields say.
    framing.rule = 1;
    // No body.
    framing.delimiter = "none";
    // H13: a body was pasted anyway.
    if (bodyPresent) finding("H13", "warning", headerEnd + 2, bodyLines[0] ?? "", { code: response.code ?? 0, octets: bodyOctets });
    // Content-Length or Transfer-Encoding present where RFC 9110 Section 8.6 forbids Content-Length.
    if (clLines.length > 0 && (response.klass === 1 || response.code === 204)) finding("H13", "info", clLines[0].line, lines[clLines[0].line - 1] ?? "", { what: "content-length-forbidden", code: response.code ?? 0 });
  } else if (teLines.length > 0) {
    // Rule 3 when both: Transfer-Encoding overrides Content-Length, and it is a smuggling signal.
    if (clLines.length > 0) {
      // Mark rule 3.
      framing.rule = 3;
      // H6: both present.
      finding("H6", "error", frameLine, frameText, { codings: transferCodings.join(", "), length: contentLengths.join(", ") });
    }
    // Rule 4: chunked final → decode; otherwise response reads to close, request is a 400.
    if (chunkedFinal) {
      // Rule 4 unless rule 3 already applied.
      if (framing.rule === 0) framing.rule = 4;
      // Delimited by the coding.
      framing.delimiter = "chunked";
      // Decode.
      framing.chunked = decodeChunked(bodyLines, headerEnd + 2, eol);
      // H10: a decode error.
      if (framing.chunked.error) finding("H10", "error", framing.chunked.error.line, lines[framing.chunked.error.line - 1] ?? "", { what: framing.chunked.error.what });
      // H10: octets after the end of the chunked body: to a recipient, the next message (the request-smuggling shape).
      if (framing.chunked.leftover > 0) finding("H10", "warning", headerEnd + 2, framing.chunked.leftoverPreview, { what: "leftover", octets: framing.chunked.leftover });
      // H9 info: other codings before chunked.
      if (transferCodings.length > 1) finding("H9", "info", teLines[0].line, lines[teLines[0].line - 1] ?? "", { what: "stacked", codings: transferCodings.slice(0, -1).join(", ") });
    } else if (request) {
      // Rule 4, request: cannot be framed; 400 and close.
      if (framing.rule === 0) framing.rule = 4;
      // Unknown.
      framing.delimiter = "unknown";
      // H9: chunked not final in a request.
      finding("H9", "error", teLines[0].line, lines[teLines[0].line - 1] ?? "", { what: "request-not-chunked", codings: transferCodings.join(", ") });
    } else {
      // Rule 4, response: read until the server closes.
      if (framing.rule === 0) framing.rule = 4;
      // Close-delimited.
      framing.delimiter = "close";
      // H9: a response with a non-chunked final coding.
      finding("H9", "info", teLines[0].line, lines[teLines[0].line - 1] ?? "", { what: "response-read-to-close", codings: transferCodings.join(", ") });
    }
  } else if (clLines.length > 0 && framing.contentLength === null) {
    // Rule 5: invalid Content-Length without Transfer-Encoding: unrecoverable.
    framing.rule = 5;
    // Unknown.
    framing.delimiter = "unknown";
  } else if (framing.contentLength !== null) {
    // Rule 6: Content-Length frames the body.
    framing.rule = 6;
    // Length-delimited.
    framing.delimiter = "content-length";
    // H8: the pasted body is shorter or longer than declared.
    if (bodyOctets < framing.contentLength) finding("H8", "warning", clLines[0].line, lines[clLines[0].line - 1] ?? "", { what: "shorter", declared: framing.contentLength, actual: bodyOctets });
    else if (bodyOctets > framing.contentLength) finding("H8", "warning", clLines[0].line, lines[clLines[0].line - 1] ?? "", { what: "longer", declared: framing.contentLength, actual: bodyOctets, extra: bodyOctets - framing.contentLength });
  } else if (request) {
    // Rule 7: a request with neither has no body.
    framing.rule = 7;
    // None.
    framing.delimiter = "none";
    // H12: a body was pasted anyway: a server reads zero octets and the rest as the next request.
    if (bodyPresent) finding("H12", "warning", headerEnd + 2, bodyLines[0] ?? "", { octets: bodyOctets });
    // H26: a method that defines a meaning for content, sent without Content-Length (RFC 9110 Section 8.6 SHOULD).
    else if (request.known && request.known.body === "expected") finding("H26", "info", startLineNo, startLine, { method: request.known.id });
  } else {
    // Rule 8: a response with neither is read until the connection closes.
    framing.rule = 8;
    // Close-delimited.
    framing.delimiter = "close";
  }
  // ---- Credentials ---------------------------------------------------------
  const credentials: Credential[] = [];
  // Authorization and Proxy-Authorization.
  for (const fieldName of ["authorization", "proxy-authorization"]) {
    // Each line.
    for (const f of get(fieldName)) {
      // scheme [ 1*SP ( token68 / #auth-param ) ].
      const m = /^(\S+)(?:\s+(.*))?$/.exec(f.value);
      // Nothing after the scheme.
      if (!m) continue;
      // The scheme as written.
      const scheme = m[1];
      // The rest.
      const rest = (m[2] ?? "").trim();
      // Basic: base64 of user-id:password (RFC 7617).
      let userId: string | null = null;
      // Decode Basic.
      if (scheme.toLowerCase() === "basic" && rest) {
        // Decode base64 safely (atob exists in browsers and in Node 16+).
        try {
          // The octets as text.
          const decoded = atob(rest.replace(/\s+/g, ""));
          // The first colon separates user-id and password (RFC 7617: a user-id cannot contain one).
          const c = decoded.indexOf(":");
          // The user-id.
          userId = c >= 0 ? decoded.slice(0, c) : decoded;
        } catch { userId = null; }
      }
      // JWT-shaped: three base64url parts, the first decoding to a JSON object starting with "{".
      const jwtShaped = /^[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]*$/.test(rest) && rest.startsWith("ey");
      // The record.
      credentials.push({ field: f.canonical, scheme, userId, masked: maskSecret(rest, 4), jwtShaped, line: f.line });
      // H14: credentials in the message.
      finding("H14", "warning", f.line, `${f.canonical}: ${scheme} ${maskSecret(rest, 4)}`, { what: scheme.toLowerCase() === "basic" ? "basic" : scheme.toLowerCase() === "bearer" ? (jwtShaped ? "bearer-jwt" : "bearer") : "other", scheme, userId: userId ?? "" });
    }
  }
  // ---- Cookies -------------------------------------------------------------
  const cookies: CookiePair[] = [];
  // Cookie: name=value; name=value.
  for (const f of get("cookie")) {
    // The pairs of this line.
    const here: CookiePair[] = [];
    // Each pair.
    for (const pair of f.value.split(";")) {
      // Trim.
      const p = pair.trim();
      // Skip empties.
      if (!p) continue;
      // Split on the first "=".
      const eq = p.indexOf("=");
      // Name and value.
      const name = eq >= 0 ? p.slice(0, eq).trim() : p;
      // The value.
      const val = eq >= 0 ? p.slice(eq + 1).trim() : "";
      // The record.
      here.push({ name, masked: maskSecret(val, 2), length: val.length });
    }
    // Keep them.
    cookies.push(...here);
    // H15: cookies sent (info, names listed, values masked in the snippet).
    finding("H15", "info", f.line, `Cookie: ${here.map((c) => `${c.name}=${c.masked}`).join("; ")}`, { what: "sent", count: here.length, names: here.map((c) => c.name).join(", ") });
  }
  // Set-Cookie lines.
  const setCookies: SetCookie[] = [];
  // Each one.
  for (const f of get("set-cookie")) {
    // cookie-pair *( ";" cookie-av ).
    const segs = f.value.split(";").map((s) => s.trim());
    // The pair.
    const first = segs[0] ?? "";
    // Split on the first "=".
    const eq = first.indexOf("=");
    // Name and value.
    const name = eq >= 0 ? first.slice(0, eq).trim() : first;
    // The value.
    const val = eq >= 0 ? first.slice(eq + 1).trim() : "";
    // The attributes.
    const attributes = segs.slice(1).filter(Boolean).map((s) => { const e = s.indexOf("="); return { name: e >= 0 ? s.slice(0, e).trim() : s, value: e >= 0 ? s.slice(e + 1).trim() : "" }; });
    // Look one up case-insensitively.
    const attr = (n: string) => attributes.find((a) => a.name.toLowerCase() === n);
    // Flags.
    const secure = !!attr("secure");
    // HttpOnly.
    const httpOnly = !!attr("httponly");
    // SameSite.
    const sameSite = attr("samesite")?.value ?? null;
    // Both ages.
    const bothAges = !!attr("max-age") && !!attr("expires");
    // The prefix (case-sensitive match, rfc6265bis Section 4.1.3).
    const prefix: SetCookie["prefix"] = name.startsWith("__Host-") ? "__Host-" : name.startsWith("__Secure-") ? "__Secure-" : null;
    // Its requirements.
    const prefixOk = prefix === null ? null : prefix === "__Secure-" ? secure : secure && attr("path")?.value === "/" && !attr("domain");
    // The record.
    setCookies.push({ line: f.line, name, masked: maskSecret(val, 2), attributes, secure, httpOnly, sameSite, bothAges, prefix, prefixOk });
    // H15 variants per cookie.
    if (prefix && prefixOk === false) finding("H15", "error", f.line, lines[f.line - 1] ?? "", { what: "prefix", name, prefix });
    // Missing Secure.
    if (!secure) finding("H15", "warning", f.line, lines[f.line - 1] ?? "", { what: "no-secure", name });
    // Missing HttpOnly.
    if (!httpOnly) finding("H15", "info", f.line, lines[f.line - 1] ?? "", { what: "no-httponly", name });
    // SameSite absent or not one of the three values: Lax by default.
    if (sameSite === null) finding("H15", "info", f.line, lines[f.line - 1] ?? "", { what: "no-samesite", name });
    else if (!/^(strict|lax|none)$/i.test(sameSite)) finding("H15", "warning", f.line, lines[f.line - 1] ?? "", { what: "samesite-unknown", name, value: sameSite });
    else if (sameSite.toLowerCase() === "none" && !secure) finding("H15", "warning", f.line, lines[f.line - 1] ?? "", { what: "none-without-secure", name });
    // Max-Age wins over Expires.
    if (bothAges) finding("H15", "info", f.line, lines[f.line - 1] ?? "", { what: "both-ages", name });
    // Expires not an HTTP-date.
    const exp = attr("expires")?.value;
    // Check it.
    if (exp && !IMF_FIXDATE.test(exp) && !RFC850_DATE.test(exp) && !ASCTIME_DATE.test(exp)) finding("H15", "warning", f.line, lines[f.line - 1] ?? "", { what: "expires-format", name, value: exp.slice(0, 60) });
  }
  // ---- Connection and Upgrade (information) --------------------------------
  for (const f of get("connection")) {
    // The options, case-insensitive.
    const opts = f.value.split(",").map((o) => o.trim()).filter(Boolean);
    // H27: what the connection header asks for.
    finding("H27", "info", f.line, lines[f.line - 1] ?? "", { what: opts.some((o) => o.toLowerCase() === "close") ? "close" : opts.some((o) => o.toLowerCase() === "keep-alive") ? "keep-alive" : opts.some((o) => o.toLowerCase() === "upgrade") ? "upgrade" : "other", options: opts.join(", ") });
  }
  // Expect: 100-continue.
  for (const f of get("expect")) if (/100-continue/i.test(f.value)) finding("H27", "info", f.line, lines[f.line - 1] ?? "", { what: "expect-continue", options: f.value });
  // ---- Groups ---------------------------------------------------------------
  const groups: HttpMessageResult["groups"] = [];
  // In presentation order.
  for (const g of GROUP_ORDER) {
    // The fields in this group.
    const idx = fields.map((f, k) => (f.group === g ? k : -1)).filter((k) => k >= 0);
    // Keep non-empty groups.
    if (idx.length) groups.push({ group: g, fields: idx });
  }
  // ---- Hand-offs ------------------------------------------------------------
  const handoffs: Handoff[] = [];
  // The status code to the status explainer.
  if (response && response.code !== null) handoffs.push({ kind: "status", tool: "http-status-code-explainer", input: String(response.code) });
  // The method to the methods comparison.
  if (request && request.known) handoffs.push({ kind: "method", tool: "http-methods-comparison", input: request.known.id });
  // The URL to the URL inspector (only when it carries no query, so no token travels in a link).
  if (request && request.url) handoffs.push({ kind: "url", tool: "url-inspector", input: request.url.includes("?") ? null : request.url });
  // A JWT to the JWT decoder (never in the link).
  if (credentials.some((c) => c.jwtShaped)) handoffs.push({ kind: "jwt", tool: "jwt", input: null });
  // Security headers to the secure-headers grader.
  if (response && fields.some((f) => f.group === "security-policy" || f.group === "cors")) handoffs.push({ kind: "security-headers", tool: "secure-headers", input: null });
  // Cookies to the cookie article's tools: the BIG-IP cookie decoder when a BIGipServer cookie is present.
  if ([...cookies.map((c) => c.name), ...setCookies.map((c) => c.name)].some((n) => /^BIGipServer/i.test(n))) handoffs.push({ kind: "cookies", tool: "f5-bigip-persistence-cookie", input: null });
  // A request to the translator (curl, fetch...).
  if (request) handoffs.push({ kind: "replay", tool: "http-request-translator", input: null });
  // ---- Done -----------------------------------------------------------------
  // Order the findings by line, then by rule, so the output is stable.
  F.sort((a, b) => a.line - b.line || a.rule.localeCompare(b.rule, "en", { numeric: true }));
  // Count by severity.
  const counts = { error: 0, warning: 0, info: 0 };
  // Tally.
  for (const f of F) counts[f.severity]++;
  // The result.
  return {
    kind, request, response, startLine: visible(startLine), fields, groups, framing, credentials, cookies, setCookies, handoffs,
    findings: F, counts,
    facts: { lineEnding, bareCr, lines: lines.length, headerLines: fields.length, leadingEmptyLines, bodyPresent },
  };
}

/**
 * Decode a chunked body (RFC 9112 Section 7.1.3): chunk-size [ chunk-ext ] CRLF chunk-data CRLF, repeated,
 * then the last-chunk (size 0), then trailer fields up to an empty line. `firstLine` is the 1-based line of the
 * body's first line, for the records. Chunk data is measured in UTF-8 octets, as the paste is text.
 */
function decodeChunked(bodyLines: string[], firstLine: number, eol: string): ChunkedDecode {
  // The result being built.
  const out: ChunkedDecode = { chunks: [], lastChunk: false, trailers: [], decodedLength: 0, contentPreview: "", error: null, leftover: 0, leftoverPreview: "" };
  // The decoded content.
  let content = "";
  // The body as one text, so chunk data may span lines.
  const text = bodyLines.join(eol);
  // Offset into the text.
  let pos = 0;
  // Line of the current position.
  const lineAt = (off: number) => firstLine + (text.slice(0, off).split(eol).length - 1);
  // Chunk by chunk.
  for (;;) {
    // The size line ends at the next line break.
    const nl = text.indexOf(eol, pos);
    // No line break at all: the size line is unterminated.
    const sizeLine = nl < 0 ? text.slice(pos) : text.slice(pos, nl);
    // Nothing left: the last-chunk never came.
    if (sizeLine.trim() === "" && nl < 0) { out.error = { what: "no-last-chunk", line: lineAt(pos) }; break; }
    // chunk-size [ ";" chunk-ext ].
    const m = /^([0-9A-Fa-f]+)\s*(;.*)?$/.exec(sizeLine.trim());
    // Not a size.
    if (!m) { out.error = { what: "bad-size", line: lineAt(pos) }; break; }
    // The size.
    const size = parseInt(m[1], 16);
    // The extensions.
    const ext = (m[2] ?? "").replace(/^;\s*/, "");
    // The last chunk.
    if (size === 0) {
      // Found.
      out.lastChunk = true;
      // Past the size line.
      pos = nl < 0 ? text.length : nl + eol.length;
      // Trailers until an empty line or the end.
      for (;;) {
        // The next line.
        const tnl = text.indexOf(eol, pos);
        // The line.
        const tl = tnl < 0 ? text.slice(pos) : text.slice(pos, tnl);
        // Done at the empty line (what follows it is the next message) or the end.
        if (tl.trim() === "") {
          // Whatever follows the empty line.
          const rest = tnl < 0 ? "" : text.slice(tnl + eol.length);
          // Record it.
          out.leftover = octets(rest);
          // A preview.
          out.leftoverPreview = visible(rest.slice(0, 80));
          // Done.
          break;
        }
        // name: value.
        const c = tl.indexOf(":");
        // Record.
        if (c > 0) out.trailers.push({ name: tl.slice(0, c).trim(), value: tl.slice(c + 1).trim() });
        // Advance; stop at the end.
        if (tnl < 0) break;
        // Next.
        pos = tnl + eol.length;
      }
      // Done.
      break;
    }
    // No data after the size line.
    if (nl < 0) { out.chunks.push({ line: lineAt(pos), sizeHex: m[1], size, ext, preview: "", truncated: true }); out.error = { what: "truncated", line: lineAt(pos) }; break; }
    // The data starts after the size line.
    const dataStart = nl + eol.length;
    // Take `size` octets of UTF-8: walk characters until the octet count is reached.
    let taken = 0;
    // Characters consumed.
    let k = dataStart;
    // Walk.
    while (k < text.length && taken < size) { taken += octets(text[k]); k++; }
    // The data.
    const data = text.slice(dataStart, k);
    // Short: the paste ends inside the chunk.
    const truncated = taken < size;
    // Record the chunk.
    out.chunks.push({ line: lineAt(pos), sizeHex: m[1], size, ext, preview: visible(data.slice(0, 80)), truncated });
    // Accumulate.
    content += data;
    // Length.
    out.decodedLength += taken;
    // Truncated: stop.
    if (truncated) { out.error = { what: "truncated", line: lineAt(pos) }; break; }
    // The CRLF after the data.
    if (text.slice(k, k + eol.length) !== eol) { out.error = { what: "missing-crlf", line: lineAt(k) }; break; }
    // Past it.
    pos = k + eol.length;
  }
  // The preview.
  out.contentPreview = visible(content.slice(0, 400));
  // Done.
  return out;
}

/** The rules, for the docs and the UI legend (the severity each carries by default). */
export const RULES: readonly { id: string; severity: Severity }[] = [
  { id: "H1", severity: "error" },
  { id: "H2", severity: "error" },
  { id: "H3", severity: "error" },
  { id: "H4", severity: "warning" },
  { id: "H5", severity: "warning" },
  { id: "H6", severity: "error" },
  { id: "H7", severity: "error" },
  { id: "H8", severity: "warning" },
  { id: "H9", severity: "error" },
  { id: "H10", severity: "error" },
  { id: "H11", severity: "warning" },
  { id: "H12", severity: "warning" },
  { id: "H13", severity: "warning" },
  { id: "H14", severity: "warning" },
  { id: "H15", severity: "info" },
  { id: "H16", severity: "info" },
  { id: "H17", severity: "info" },
  { id: "H18", severity: "error" },
  { id: "H19", severity: "info" },
  { id: "H20", severity: "warning" },
  { id: "H21", severity: "error" },
  { id: "H22", severity: "info" },
  { id: "H23", severity: "info" },
  { id: "H24", severity: "warning" },
  { id: "H25", severity: "warning" },
  { id: "H26", severity: "info" },
  { id: "H27", severity: "info" },
  { id: "H28", severity: "info" },
];
