// ============================================================================
// src/lib/tools/curl-command-builder/golden-vectors.ts
// ----------------------------------------------------------------------------
// Locked cases: each structured input has an exact expected single-line
// command (byte-identical - the assembler's canonical flag order is part of
// the contract) plus expected warnings. verifyVectors() runs them all.
//
// 2026-10-27: share vectors added (SHARE_VECTORS, the copy of the form a Share
// results link carries, made by shareableBuilderState), so the set id moved
// from "curl-command-builder/2026-07-07" (scripts/api-sync.json records it; the
// re-check is in the wave's notes).
// ============================================================================

import { buildCurl, PROTOCOL_MAP, shareableBuilderState, type BuildResult, type BuilderState } from "./compute";

export const SET_ID = "curl-command-builder/2026-10-27";

interface Vector {
  name: string;
  input: BuilderState;
  check: (r: ReturnType<typeof buildCurl>) => string | null; // null = pass
}

export const VECTORS: Vector[] = [
  {
    name: "https-post-json",
    input: {
      protocol: "https", host: "api.example.com", path: "/v1/users", method: "POST",
      headers: [{ name: "Content-Type", value: "application/json" }],
      data: '{"name":"Alice"}',
    },
    check: (r) =>
      !r.ok ? "should build"
      : r.command !== `curl -H 'Content-Type: application/json' -d '{"name":"Alice"}' https://api.example.com/v1/users` ? "command mismatch: " + r.command
      : r.warnings.length !== 0 ? "no warnings expected"
      : null,
  },
  {
    name: "post-inferred-no-X",
    input: { protocol: "https", host: "x.io", method: "POST", data: "a=1" },
    check: (r) =>
      !r.ok ? "should build"
      // -d implies POST, so -X POST must NOT be emitted; and no Content-Type
      // header means the form-encoded-default warning fires.
      : r.command !== "curl -d a=1 https://x.io" ? "command mismatch: " + r.command
      : !r.warnings.includes("dataDefaultCt") ? "dataDefaultCt warning expected"
      : null,
  },
  {
    name: "insecure-flag-warns",
    input: { protocol: "https", host: "self-signed.local", insecure: true },
    check: (r) =>
      !r.ok ? "should build"
      : r.command !== "curl -k https://self-signed.local" ? "command mismatch: " + r.command
      : !r.warnings.includes("insecure") ? "insecure warning expected"
      : null,
  },
  {
    name: "ftp-download-remote-name",
    input: { protocol: "ftp", host: "ftp.example.com", path: "/pub/report.pdf", user: "anonymous", output: "remoteName" },
    check: (r) =>
      !r.ok ? "should build"
      : r.command !== "curl -u anonymous -O ftp://ftp.example.com/pub/report.pdf" ? "command mismatch: " + r.command
      : !r.warnings.includes("cleartext") ? "cleartext warning expected on ftp"
      : null,
  },
  {
    name: "sftp-upload",
    input: { protocol: "sftp", host: "files.example.com", path: "/inbox/", user: "alice", pass: "s3cret", upload: "notes.txt" },
    check: (r) =>
      !r.ok ? "should build"
      : r.command !== "curl -u alice:s3cret -T notes.txt sftp://files.example.com/inbox/" ? "command mismatch: " + r.command
      : !r.warnings.includes("passOnCli") ? "passOnCli warning expected"
      : null,
  },
  {
    name: "smtp-send-mail",
    input: { protocol: "smtp", host: "mail.example.com", mailFrom: "alice@example.com", mailRcpt: ["bob@example.com"], upload: "message.eml" },
    check: (r) =>
      !r.ok ? "should build"
      : r.command !== "curl -T message.eml --mail-from alice@example.com --mail-rcpt bob@example.com smtp://mail.example.com" ? "command mismatch: " + r.command
      // Cleartext SMTP carrying content: both nudges fire.
      : !r.warnings.includes("considerSslReqd") ? "considerSslReqd expected"
      : !r.warnings.includes("cleartext") ? "cleartext expected"
      : null,
  },
  {
    name: "mqtt-publish",
    input: { protocol: "mqtt", host: "broker.example.com", path: "/sensors/temp", data: "21.5" },
    check: (r) =>
      !r.ok ? "should build"
      : r.command !== "curl -d 21.5 mqtt://broker.example.com/sensors/temp" ? "command mismatch: " + r.command
      : null,
  },
  {
    name: "imaps-mailbox-nonstandard-port",
    input: { protocol: "imaps", host: "mail.example.com", port: "9993", path: "/INBOX", user: "alice" },
    check: (r) =>
      !r.ok ? "should build"
      : r.command !== "curl -u alice imaps://mail.example.com:9993/INBOX" ? "command mismatch: " + r.command
      : null,
  },
  {
    name: "file-url",
    input: { protocol: "file", path: "/etc/hosts" },
    check: (r) =>
      !r.ok ? "should build"
      : r.command !== "curl file:///etc/hosts" ? "command mismatch: " + r.command
      : r.warnings.length !== 0 ? "file should not warn"
      : null,
  },
  {
    name: "escaping-and-order",
    input: {
      protocol: "https", host: "api.example.com", path: "/q", method: "PUT",
      headers: [{ name: "X-Note", value: "it's here" }],
      verbose: true, followRedirects: true, maxTime: "30",
    },
    check: (r) =>
      !r.ok ? "should build"
      // Canonical order: -X, -H, --max-time, -L, -v, URL; single-quote escape
      // of the apostrophe uses the '\'' sequence.
      : r.command !== `curl -X PUT -H 'X-Note: it'\\''s here' --max-time 30 -L -v https://api.example.com/q` ? "command mismatch: " + r.command
      : null,
  },
  {
    name: "missing-host-fails",
    input: { protocol: "https" },
    check: (r) => (r.ok ? "must fail without host" : r.errorId !== "host" ? "errorId should be host" : null),
  },
];

/** A share vector: a form, the copy a link carries, how many values it replaces, and what must not be in it. */
export interface BuilderShareVector {
  /** The vector's name. */
  name: string;
  /** What it shows. */
  note: string;
  /** The form. */
  input: BuilderState;
  /** The copy (null for a refusal). */
  expect: BuilderState | null;
  /** How many values are replaced. */
  redacted: number;
  /** Strings the copy's command must not hold. */
  secrets: string[];
  /** For a refusal: the rule of the secret left in the copy's command. */
  residual?: "pem-private-key" | "jwt" | "url-password";
}

/** A proxy URL with a password, and its copy: constants, not fields (scripts/check-citation-fields reads a field that holds an http URL as a citation; these are an input and an expected output). */
const PROXY = "http://proxyuser:proxypass@proxy.example.com:3128"; // the input
/** Its copy. */
const PROXY_COPY = "http://proxyuser:REDACTED@proxy.example.com:3128"; // the expected output

/** The https Example (the page's Example button loads the protocol's own). */
const HTTPS_EXAMPLE: BuilderState = { protocol: "https", ...PROTOCOL_MAP.get("https")!.example }; // verbatim

/** The share vectors (2026-10-27). */
export const SHARE_VECTORS: readonly BuilderShareVector[] = Object.freeze([
  {
    name: "share-example",
    note: "The https Example holds no credential: the copy is the form",
    input: HTTPS_EXAMPLE,
    expect: HTTPS_EXAMPLE,
    redacted: 0,
    secrets: [],
  },
  {
    name: "share-every-credential",
    note: "The password field, Authorization's credentials, a secret-named header, every cookie value, a proxy password, a query token and a JSON password go; names, the user and Accept stay",
    input: {
      protocol: "https", host: "api.example.com", path: "/v1/me?access_token=mF_9.B5f-4.1JqM", user: "alice", pass: "s3cr3t",
      headers: [{ name: "Authorization", value: "Bearer tok_abc123" }, { name: "X-API-Key", value: "8f14e45fceea167a5a36dedd4bea2543" }, { name: "Accept", value: "application/json" }],
      cookie: "session=38afes7a8; theme=dark", proxy: PROXY, data: '{"username":"alice","password":"hunter2"}',
    },
    expect: {
      protocol: "https", host: "api.example.com", path: "/v1/me?access_token=REDACTED", user: "alice", pass: "REDACTED",
      headers: [{ name: "Authorization", value: "Bearer REDACTED" }, { name: "X-API-Key", value: "REDACTED" }, { name: "Accept", value: "application/json" }],
      cookie: "session=REDACTED; theme=REDACTED", proxy: PROXY_COPY, data: '{"username":"alice","password":"REDACTED"}',
    },
    redacted: 8,
    secrets: ["s3cr3t", "tok_abc123", "8f14e45fceea167a5a36dedd4bea2543", "38afes7a8", "proxypass", "mF_9.B5f-4.1JqM", "hunter2"],
  },
  {
    name: "share-form-fields",
    note: "A form field named like a secret (RFC 6749 2.3.1's client_secret) loses its value; a file field keeps its path",
    input: { protocol: "https", host: "auth.example.com", path: "/token", form: [{ name: "client_id", value: "s6BhdRkqt3" }, { name: "client_secret", value: "7Fjfp0ZBr1KtDRbnfVdmIw" }, { name: "key_file", value: "key.pem", isFile: true }] },
    expect: { protocol: "https", host: "auth.example.com", path: "/token", form: [{ name: "client_id", value: "s6BhdRkqt3" }, { name: "client_secret", value: "REDACTED" }, { name: "key_file", value: "key.pem", isFile: true }] },
    redacted: 1,
    secrets: ["7Fjfp0ZBr1KtDRbnfVdmIw"],
  },
  {
    name: "share-host-userinfo",
    note: "A password typed before the host (RFC 3986 3.2.1, as curl reads user:pass@host)",
    input: { protocol: "ftp", host: "alice:s3cr3t@ftp.example.com", path: "/pub/report.pdf", output: "remoteName" },
    expect: { protocol: "ftp", host: "alice:REDACTED@ftp.example.com", path: "/pub/report.pdf", output: "remoteName" },
    redacted: 1,
    secrets: ["s3cr3t"],
  },
  {
    name: "share-refused-token-in-path",
    note: "A JWT in the path has no name to be found by: the net finds it in the command, and no link is offered",
    input: { protocol: "https", host: "api.example.com", path: "/v1/sessions/eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.c2lnbmF0dXJl" },
    expect: null,
    redacted: 0,
    secrets: [],
    residual: "jwt",
  },
]);

/** Canonical JSON (sorted keys), so two forms compare by content. */
function canon(x: unknown): string {
  return JSON.stringify(x, (_k, v) => (v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.entries(v as Record<string, unknown>).filter(([, y]) => y !== undefined).sort(([a], [b]) => (a < b ? -1 : 1))) : v)); // keys sorted, undefined dropped
} // canon

/** What the receiving page reads, without the values the copy replaces: the flags in order and the warnings. */
function readingShape(r: BuildResult): string {
  return JSON.stringify([r.ok, r.errorId ?? null, r.parts.map((p) => [p.flag, p.explainId]), r.warnings]); // compact
} // readingShape

/** Runs every vector; returns error strings (empty array = all pass). */
export function verifyVectors(): string[] {
  const errors: string[] = [];
  for (const v of VECTORS) {
    const msg = v.check(buildCurl(v.input));
    if (msg) errors.push(v.name + ": " + msg);
  }
  // The share vectors: the copy, the count, no secret in its command, the same flags and warnings, a stable copy.
  for (const v of SHARE_VECTORS) {
    try {
      const out = shareableBuilderState(v.input); // the copy
      if (v.residual) { if (out.residual?.rule !== v.residual) errors.push(`${v.name}: residual ${out.residual?.rule ?? "none"} != ${v.residual}`); continue; } // a refusal
      if (out.residual) errors.push(`${v.name}: unexpected residual ${out.residual.rule}`); // nothing may be left
      if (canon(out.state) !== canon(v.expect)) errors.push(`${v.name}: copy ${canon(out.state)}`); // field for field
      if (out.redacted !== v.redacted) errors.push(`${v.name}: redacted ${out.redacted} != ${v.redacted}`); // the count
      const built = buildCurl(out.state); // the command the copy builds
      for (const secret of v.secrets) if (built.command.includes(secret) || canon(out.state).includes(secret)) errors.push(`${v.name}: the copy contains ${JSON.stringify(secret)}`); // never travels
      if (readingShape(buildCurl(v.input)) !== readingShape(built)) errors.push(`${v.name}: the copy builds different flags or warnings`); // the same command shape
      const again = shareableBuilderState(out.state); // the copy of the copy
      if (canon(again.state) !== canon(out.state) || again.redacted !== 0) errors.push(`${v.name}: the copy of the copy differs`); // stable
    } catch (e) {
      errors.push(`${v.name}: threw ${(e as Error).message}`); // a defect
    }
  }
  return errors;
}
