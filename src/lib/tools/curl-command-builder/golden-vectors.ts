// ============================================================================
// src/lib/tools/curl-command-builder/golden-vectors.ts
// ----------------------------------------------------------------------------
// Locked cases: each structured input has an exact expected single-line
// command (byte-identical - the assembler's canonical flag order is part of
// the contract) plus expected warnings. verifyVectors() runs them all.
// ============================================================================

import { buildCurl, type BuilderState } from "./compute";

export const SET_ID = "curl-command-builder/2026-07-07";

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

/** Runs every vector; returns error strings (empty array = all pass). */
export function verifyVectors(): string[] {
  const errors: string[] = [];
  for (const v of VECTORS) {
    const msg = v.check(buildCurl(v.input));
    if (msg) errors.push(v.name + ": " + msg);
  }
  return errors;
}
