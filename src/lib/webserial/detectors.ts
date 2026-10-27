// ============================================================================
// src/lib/webserial/detectors.ts
// ----------------------------------------------------------------------------
// TOKEN DETECTORS for the WebSerial console (Tier 2). Pure and deterministic:
// scan a text buffer and surface recognizable tokens - PEM cert/CSR, URL,
// syslog PRI, MAC, IPv6, CIDR, IPv4, cipher suite, base64 - each mapped to the
// ARSENAL tool that decodes it. Used only by the console's "detected" side
// panel, so it never runs on the catalogue path.
//
// Strategy: the block/line shapes (PEM, URL, syslog PRI) are matched by regex
// over the whole text and consumed, so their contents are not re-flagged; the
// remainder is split into candidate tokens and each is classified by a strict
// validator. Order matters (MAC before IPv6, CIDR before IPv4), and base64 is
// last and deliberately conservative to avoid flagging plain hex.
//
// Golden vectors live in this file (verifyDetectors) and are exercised in the
// build check, per the ratified "vectors on the detectors" decision.
//
// 2026-10-27 (S4 cross-reference sweep): an openssl s_client report is a
// block shape too. A device's shell (a BIG-IP's bash, any Linux appliance) can
// run openssl s_client on the console; the block from its CONNECTED(...) line
// is handed to the openssl s_client explainer, cut before the session block so
// that the session's secrets never ride in an address. It is read from the
// original text and consumes nothing, so the certificate, the address and the
// cipher suite inside it are still offered to their own tools. And the runner
// scripts/run-golden-vectors.mts only calls functions named verifyVectors, so
// one now wraps verifyDetectors and the vectors really run at prebuild.
// ============================================================================

export type DetectorKind =
  | "cert"
  | "csr"
  | "url"
  | "mac"
  | "ipv6"
  | "cidr"
  | "ipv4"
  | "syslog-pri"
  | "cipher"
  | "base64"
  | "sclient"; // an openssl s_client report (2026-10-27)

export interface DetectedToken {
  kind: DetectorKind;
  value: string;
  toolSlug: string;
}

/** Which built tool decodes each token kind. */
const TOOL: Record<DetectorKind, string> = {
  cert: "x509",
  csr: "csr-decoder",
  url: "url-inspector",
  mac: "oui-lookup",
  ipv6: "cidr",
  cidr: "cidr",
  ipv4: "cidr",
  "syslog-pri": "syslog-pri-decoder",
  cipher: "cipher",
  base64: "base64",
  sclient: "openssl-s-client-explainer", // the report goes to the explainer's output box (2026-10-27)
};

// -- per-token validators ---------------------------------------------------

const MAC_RE = /^(?:[0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}$|^(?:[0-9a-fA-F]{4}\.){2}[0-9a-fA-F]{4}$/;
function isMac(t: string): boolean {
  return MAC_RE.test(t);
}

function isIpv4(t: string): boolean {
  const m = t.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  return m.slice(1, 5).every((o) => Number(o) <= 255);
}

/** Validate an IPv6 address, allowing a single :: compression. */
function isIpv6(t: string): boolean {
  if (!t.includes(":")) return false;
  if ((t.match(/::/g) || []).length > 1) return false;
  const hasDouble = t.includes("::");
  if (!hasDouble) {
    const groups = t.split(":");
    if (groups.length !== 8) return false;
    return groups.every((g) => /^[0-9a-fA-F]{1,4}$/.test(g));
  }
  const [headRaw, tailRaw] = t.split("::");
  const head = headRaw ? headRaw.split(":") : [];
  const tail = tailRaw ? tailRaw.split(":") : [];
  if (head.length + tail.length > 7) return false; // :: must cover at least one group
  return [...head, ...tail].every((g) => /^[0-9a-fA-F]{1,4}$/.test(g));
}

/** True if the token is address/prefix with a valid IPv4 or IPv6 base. */
function isCidr(t: string): boolean {
  const i = t.indexOf("/");
  if (i < 0) return false;
  const addr = t.slice(0, i);
  const pfx = t.slice(i + 1);
  if (!/^\d{1,3}$/.test(pfx)) return false;
  const p = Number(pfx);
  if (isIpv4(addr)) return p <= 32;
  if (isIpv6(addr)) return p <= 128;
  return false;
}

// A recognizable cryptographic term keeps cipher/base64 from over-matching.
const CRYPTO = /(AES|RSA|ECDHE|ECDSA|DHE|GCM|SHA|CHACHA|POLY1305|CBC|CAMELLIA|SEED|3DES|DES|PSK|SRP|NULL)/;
function isCipher(t: string): boolean {
  if (/^TLS_[A-Z0-9_]+$/.test(t) && CRYPTO.test(t)) return true; // IANA name
  if (/^[A-Z0-9]+(?:-[A-Z0-9]+){2,}$/.test(t) && CRYPTO.test(t)) return true; // OpenSSL name
  return false;
}

function isBase64(t: string): boolean {
  if (t.length < 24 || t.length % 4 !== 0) return false;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(t)) return false;
  // Require a character outside the hex/decimal alphabet so plain hex blobs and
  // decimal counters are not mistaken for base64.
  return /[G-Zg-z+/=]/.test(t);
}

// -- block / line detectors (regex over the whole text) ---------------------

const CERT_RE = /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g;
const CSR_RE = /-----BEGIN (?:NEW )?CERTIFICATE REQUEST-----[\s\S]*?-----END (?:NEW )?CERTIFICATE REQUEST-----/g;
const URL_RE = /https?:\/\/[^\s"'<>()]+/g;
const PRI_RE = /<(\d{1,3})>/g;

// -- the openssl s_client report (2026-10-27) --------------------------------
// The line shapes come from the openssl s_client explainer's reading of the
// OpenSSL 3.5.9 source (src/lib/tools/openssl-s-client-explainer): the report
// opens with CONNECTED(<socket fd as 8 hex digits>), or CONNECTION ESTABLISHED
// with -brief; s_client prints "Connecting to <address>", its verify callback's
// depth= and verify lines, error-queue lines and -state's SSL_connect: lines
// just before it; the full report ends with "Verify return code: N (text)" and
// a session block (SSL-Session:, or one per TLS 1.3 ticket) holding the
// Master-Key or Resumption PSK; -brief ends its summary with the server's key
// line; s_client prints DONE or closed when the connection ends. Every test is
// a line test with literal prefixes and bounded runs: linear, no backtracking.

/** The line a report starts with. */
const SCLIENT_START = /^(?:CONNECTED\([0-9A-F]{8}\)|CONNECTION ESTABLISHED)$/;
/** Lines s_client prints just before that line, which belong to the report. */
const SCLIENT_LEAD = /^(?:Connecting to \S|depth=\d|verify (?:error|return):|[0-9A-F]{8,16}:error:|SSL_connect:)/;
/** The session block, never handed over: the line before it ends the report. */
const SCLIENT_SECRETS = /^(?:SSL-Session:|Post-Handshake New Session Ticket arrived:)/;
/** The full report's last line, kept. */
const SCLIENT_LAST = /^Verify return code: \d{1,5} \(/;
/** The -brief summary's last line, kept when the report opened with CONNECTION ESTABLISHED. */
const SCLIENT_BRIEF_LAST = /^(?:Peer Temp Key|Server Temp Key|Negotiated TLS1\.3 group): /;
/** The end of the connection, kept. */
const SCLIENT_STOP = /^(?:DONE|closed)$/;
/** At most this many lines after the opening line. */
const SCLIENT_MAX_LINES = 200;
/** At most this many lead lines walked back over. */
const SCLIENT_MAX_LEAD = 40;
/** At most this many characters, under the handoff's 16,384 (src/lib/handoff.ts), cut at a line break. */
const SCLIENT_MAX_CHARS = 16000;

/**
 * Every s_client report in a text: from its lead lines to the line before the
 * session block, its Verify return code line, its -brief key line or DONE /
 * closed, whichever comes first, within the bounds above. Pure and linear.
 */
export function sclientReports(input: string): string[] {
  // The text as lines, with the CR of a CR LF ending dropped (serial lines often carry one).
  const lines = input.split("\n").map((l) => (l.endsWith("\r") ? l.slice(0, -1) : l));
  // The reports found, in order.
  const out: string[] = [];
  // Walk the lines once; a report's end moves the walk past it.
  for (let i = 0; i < lines.length; i++) {
    // Only an opening line starts a report.
    if (!SCLIENT_START.test(lines[i])) continue;
    // Whether this is the -brief summary.
    const brief = lines[i] === "CONNECTION ESTABLISHED";
    // Walk back over the lead lines that belong to it, at most SCLIENT_MAX_LEAD of them.
    let start = i;
    while (start > 0 && i - start < SCLIENT_MAX_LEAD && SCLIENT_LEAD.test(lines[start - 1])) start--;
    // The last line kept: the opening line until a later one is kept.
    let end = i;
    // Walk forward, at most SCLIENT_MAX_LINES lines.
    for (let j = i + 1; j < lines.length && j - i <= SCLIENT_MAX_LINES; j++) {
      // The session block or the next report: stop before it.
      if (SCLIENT_SECRETS.test(lines[j]) || SCLIENT_START.test(lines[j])) break;
      // Any other line belongs to the report.
      end = j;
      // The last line of the report: keep it, then stop.
      if (SCLIENT_LAST.test(lines[j]) || SCLIENT_STOP.test(lines[j]) || (brief && SCLIENT_BRIEF_LAST.test(lines[j]))) break;
    }
    // The report's text, lead lines included.
    let block = lines.slice(start, end + 1).join("\n");
    // Over the bound: cut at the last line break inside it, so only whole lines are handed over.
    if (block.length > SCLIENT_MAX_CHARS) {
      // The last line break at or before the bound.
      const cut = block.lastIndexOf("\n", SCLIENT_MAX_CHARS);
      // Whole lines when there is a break; a hard cut at the bound when the first line alone is longer.
      block = block.slice(0, cut > 0 ? cut : SCLIENT_MAX_CHARS);
    }
    // Keep it.
    out.push(block);
    // Carry on after it.
    i = end;
  }
  // Every report, in the order they appear.
  return out;
}

const MAX_TOKENS = 40;

/**
 * Scan a text buffer and return the recognizable tokens, deduplicated by
 * kind+value and capped. The block detectors run first and consume their text.
 */
export function detectTokens(input: string): DetectedToken[] {
  let text = input;
  const out: DetectedToken[] = [];
  const seen = new Set<string>();

  const add = (kind: DetectorKind, value: string) => {
    if (out.length >= MAX_TOKENS) return;
    const key = kind + "\u0000" + value;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ kind, value, toolSlug: TOOL[kind] });
  };

  const consume = (re: RegExp, kind: DetectorKind) => {
    text = text.replace(re, (match) => {
      add(kind, match.trim());
      return " "; // blank it so later detectors do not re-see the contents
    });
  };

  // The s_client reports first (2026-10-27): read from the original text and not consumed, so what is inside them
  // (the certificate, the address, the cipher suite) is still offered to its own tool below.
  for (const report of sclientReports(input)) add("sclient", report);

  consume(CSR_RE, "csr");
  consume(CERT_RE, "cert");
  consume(URL_RE, "url");
  consume(PRI_RE, "syslog-pri"); // value keeps the <N> form

  for (const tok of text.split(/[\s,;()\[\]{}"'<>|=]+/)) {
    if (!tok || out.length >= MAX_TOKENS) continue;
    if (isMac(tok)) add("mac", tok);
    else if (isIpv6(tok)) add("ipv6", tok);
    else if (isCidr(tok)) add("cidr", tok);
    else if (isIpv4(tok)) add("ipv4", tok);
    else if (isCipher(tok)) add("cipher", tok);
    else if (isBase64(tok)) add("base64", tok);
  }

  return out;
}

// -- golden vectors ---------------------------------------------------------

interface DVec {
  id: string;
  input: string;
  expect: Array<[DetectorKind, string]>;
}

const CERT_SAMPLE = "-----BEGIN CERTIFICATE-----\nMIIBkTCB+w==\n-----END CERTIFICATE-----";

// The s_client vectors' text (2026-10-27), copied line for line from the captures of the openssl s_client explainer
// (src/lib/tools/openssl-s-client-explainer/captures.ts: real OpenSSL 3.5.9 runs of 2026-10-27); kept here rather than
// imported, so the console's bundle does not carry the explainer's captures.
/** The command of capture verify-return-error-abort. */
const SCLIENT_COMMAND = "openssl s_client -connect localhost:44332 -servername www.example.test -CAfile root.pem -verify_return_error";
/** Capture verify-return-error-abort, up to its Verify return code line. */
const SCLIENT_ABORT = [
  "Connecting to 127.0.0.1", // stderr, as soon as TCP is up
  "depth=0 C=BR, O=Example Lab, CN=www.example.test", // the verify callback
  "verify error:num=20:unable to get local issuer certificate", // the error it saw
  "40CC48FDE07F0000:error:0A000086:SSL routines:tls_post_process_server_certificate:certificate verify failed:ssl/statem/statem_clnt.c:2124:", // the error queue
  "CONNECTED(00000003)", // the report's opening line
  "---", // separator
  "Certificate chain", // the chain as sent
  " 0 s:C=BR, O=Example Lab, CN=www.example.test", // subject
  "   i:C=BR, O=Example Lab, CN=Example Lab Issuing CA 1", // issuer
  "   a:PKEY: RSA, 2048 (bit); sigalg: sha256WithRSAEncryption", // key and signature
  "   v:NotBefore: Oct 27 13:31:57 2026 GMT; NotAfter: Jan 25 13:31:57 2027 GMT", // validity
  "---", // separator
  "no peer certificate available", // the handshake was aborted
  "---", // separator
  "No client certificate CA names sent", // no client certificate request
  "Negotiated TLS1.3 group: X25519MLKEM768", // the TLS 1.3 group two 3.5.9 peers negotiate
  "---", // separator
  "SSL handshake has read 2239 bytes and written 1556 bytes", // byte counts
  "Verification error: unable to get local issuer certificate", // the verification result
  "---", // separator
  "New, TLSv1.3, Cipher is TLS_AES_256_GCM_SHA384", // the cipher line
  "Protocol: TLSv1.3", // the protocol line
  "This TLS version forbids renegotiation.", // renegotiation
  "Compression: NONE", // compression
  "Expansion: NONE", // expansion
  "No ALPN negotiated", // ALPN
  "Early data was not sent", // early data
  "Verify return code: 20 (unable to get local issuer certificate)", // the report's last line
].join("\n");
/** Capture tls12-forced-alpn: its opening line, the cipher and protocol lines. */
const SCLIENT_TLS12_HEAD = ["CONNECTED(00000003)", "---", "New, TLSv1.2, Cipher is ECDHE-RSA-AES256-GCM-SHA384", "Protocol: TLSv1.2"].join("\n");
/** Capture tls12-forced-alpn: the start of its session block, with the Master-Key of a throwaway localhost session. */
const SCLIENT_TLS12_SESSION = [
  "SSL-Session:", // the session block
  "    Protocol  : TLSv1.2", // its protocol
  "    Cipher    : ECDHE-RSA-AES256-GCM-SHA384", // its cipher
  "    Master-Key: C2227C3B8663204B8B7E9CCD2E7582870C19E6C68BD0B9FEDFAC802C4685F2318E30370B7466942A81980E1CB1E5FAD4", // the secret
  "    Verify return code: 0 (ok)", // the session's own verify line, indented
  "---", // separator
  "closed", // the connection closed
].join("\n");
/** Capture brief, verbatim up to its key line. */
const SCLIENT_BRIEF = [
  "Connecting to 127.0.0.1", // stderr
  "CONNECTION ESTABLISHED", // the -brief opening line
  "Protocol version: TLSv1.3", // protocol
  "Ciphersuite: TLS_AES_256_GCM_SHA384", // suite
  "Peer certificate: C=BR, O=Example Lab, CN=www.example.test", // the server's certificate
  "Hash used: SHA256", // the signature hash
  "Signature type: rsa_pss_rsae_sha256", // the signature scheme
  "Verification: OK", // verification
  "Negotiated TLS1.3 group: X25519MLKEM768", // the summary's last line
].join("\n");

const DVECTORS: DVec[] = [
  { id: "mac-and-cidr", input: "Router# show int; MAC 00:1b:54:11:22:33 on 10.0.0.1/24", expect: [["mac", "00:1b:54:11:22:33"], ["cidr", "10.0.0.1/24"]] },
  { id: "ipv4-plain", input: "ping 192.168.1.1 timeout 2", expect: [["ipv4", "192.168.1.1"]] },
  { id: "ipv6-compressed", input: "BGP neighbor 2001:db8::1 Established", expect: [["ipv6", "2001:db8::1"]] },
  { id: "syslog-pri", input: "<190>Jul 10 12:00:00 host %SYS-5-CONFIG_I", expect: [["syslog-pri", "<190>"]] },
  { id: "url", input: "downloading https://example.com/a?x=1 (200)", expect: [["url", "https://example.com/a?x=1"]] },
  { id: "cipher-iana", input: "negotiated TLS_AES_128_GCM_SHA256 ok", expect: [["cipher", "TLS_AES_128_GCM_SHA256"]] },
  { id: "cipher-openssl", input: "cipher is ECDHE-RSA-AES128-GCM-SHA256 today", expect: [["cipher", "ECDHE-RSA-AES128-GCM-SHA256"]] },
  { id: "cert-block", input: `some log\n${CERT_SAMPLE}\nmore log`, expect: [["cert", CERT_SAMPLE]] },
  { id: "cisco-dotted-mac", input: "mac address 001b.5411.2233 aging 300", expect: [["mac", "001b.5411.2233"]] },
  { id: "no-false-hex", input: "flags 0x0011223344 crc deadbeef done", expect: [] },
  // 2026-10-27: an s_client report on a shell prompt (the explainer's capture verify-return-error-abort, verbatim): the
  // report from its lead lines to its Verify return code line, the command and the prompts left out; the address and
  // the suite inside it still found by their own detectors.
  { id: "sclient-report", input: `$ ${SCLIENT_COMMAND}\n${SCLIENT_ABORT}\n---\n$ `, expect: [["sclient", SCLIENT_ABORT], ["ipv4", "127.0.0.1"], ["cipher", "TLS_AES_256_GCM_SHA384"]] },
  // A TLS 1.2 report cut before its session block (lines of the explainer's capture tls12-forced-alpn): the Master-Key
  // is never part of the value handed over, and its hex is not taken for base64.
  { id: "sclient-session-cut", input: `${SCLIENT_TLS12_HEAD}\n${SCLIENT_TLS12_SESSION}`, expect: [["sclient", SCLIENT_TLS12_HEAD], ["cipher", "ECDHE-RSA-AES256-GCM-SHA384"]] },
  // A -brief summary (the explainer's capture brief, verbatim), ended by its key line, the prompt after it left out.
  { id: "sclient-brief", input: `${SCLIENT_BRIEF}\n$ `, expect: [["sclient", SCLIENT_BRIEF], ["ipv4", "127.0.0.1"], ["cipher", "TLS_AES_256_GCM_SHA384"]] },
  // The opening line's shape inside other text is not a report.
  { id: "sclient-not-a-line", input: "peer 10.0.0.2 state CONNECTED(00000003) since boot", expect: [["ipv4", "10.0.0.2"]] },
];

export function verifyDetectors(): { passed: number; failed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;
  for (const v of DVECTORS) {
    const got = detectTokens(v.input)
      .map((d) => `${d.kind}:${d.value}`)
      .sort();
    const want = v.expect.map(([k, val]) => `${k}:${val}`).sort();
    if (JSON.stringify(got) === JSON.stringify(want)) passed++;
    else failures.push(`[${v.id}] got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);
  }
  return { passed, failed: failures.length, failures };
}

export const detectorVectors = DVECTORS.map((v) => v.id);

/** The vector set's dated id (2026-10-27: the original ten vectors and the four s_client vectors). */
export const GOLDEN_VECTOR_SET_ID = "webserial-detectors-2026-10-27";

/**
 * The name scripts/run-golden-vectors.mts looks for (2026-10-27). verifyDetectors was never called by anything, so
 * the "exercised in the build check" above was not true; this wrapper makes the runner call it at prebuild. Its
 * { passed, failed, failures } shape is one the runner reads.
 */
export function verifyVectors(): { passed: number; failed: number; failures: string[] } {
  // The same vectors, under the runner's name.
  return verifyDetectors();
}
