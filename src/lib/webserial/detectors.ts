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
  | "base64";

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
