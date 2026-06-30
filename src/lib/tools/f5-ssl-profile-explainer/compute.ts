// ============================================================================
// src/lib/tools/f5-ssl-profile-explainer/compute.ts
// ----------------------------------------------------------------------------
// F5 BIG-IP SSL profile explainer (arsenal-local, pure, deterministic).
//
// Takes a tmsh `ltm profile client-ssl` or `ltm profile server-ssl` block and
// explains it: the profile's role (terminate vs initiate), the cert/key/chain
// identity and chain building, the TLS protocol versions the `options` field
// enables or disables, ciphers, renegotiation, SNI, OCSP stapling, and client/
// peer certificate validation — with a security assessment using the standard
// 🟢/🟡/🟠/🔴 levels.
//
// PURE: string + structural analysis only. No Date, no Math.random, no I/O, no
// DOM, and crucially NO network — it never contacts a device. Same input ->
// same output. Liftable into an open library later.
//
// Sources: F5 clouddocs iControl REST / tmsh `ltm profile client-ssl` and
// `server-ssl` reference; F5 K-articles on SSL options and secure-renegotiation;
// RFC 5746 (secure renegotiation), RFC 6066 (SNI), RFC 6961 (OCSP stapling).
// ============================================================================

const MAX_INPUT = 40000; // defensive cap on pasted config length

/** Thrown for malformed input. `code` is stable for i18n; message is dev-facing. */
export class SslProfileInputError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "SslProfileInputError";
    this.code = code;
  }
}

export type Level = "ok" | "low" | "medium" | "high";

export interface SslField {
  /** Stable key for the recognized setting (e.g. "renegotiation"). */
  key: string;
  /** The raw value as configured. */
  value: string;
  /** Plain-language explanation of what this setting does, as configured. */
  explain: string;
  /** Optional severity if this specific value carries a security signal. */
  level?: Level;
}

export interface SslFinding {
  level: Level;
  title: string;
  detail: string;
}

export interface CertKeyChain {
  name?: string;
  cert?: string;
  key?: string;
  chain?: string;
  passphrase?: boolean; // true if a passphrase line is present (value never shown)
}

export interface SslProfileAnalysis {
  profileType: "client-ssl" | "server-ssl";
  /** What the profile does, in one line, given its type. */
  role: string;
  name: string | null;
  partition: string | null;
  /** Protocol matrix derived from the `options` field. */
  protocols: { name: string; enabled: boolean; level: Level }[];
  certKeyChains: CertKeyChain[];
  /** Legacy single cert/key/chain (pre cert-key-chain), if used. */
  legacy: { cert?: string; key?: string; chain?: string };
  /** Trusted-CA bundle used to validate the peer certificate, if any. */
  caFile: string | null;
  ciphers: { mode: "string" | "group" | "none"; value: string };
  options: string[];
  fields: SslField[];
  findings: SslFinding[];
}

// ---- tmsh block parsing ----------------------------------------------------
// SSL profiles have exactly two brace constructs that matter: `options { ... }`
// (a flat list of bare flags) and `cert-key-chain { name { ... } }` (named
// entries of scalar key/value). Everything else at the top level is a scalar
// "key value". A generic list-vs-node heuristic is ambiguous (`options { a b }`
// looks identical to `entry { cert x }`), so these are parsed by name instead.

/** Tokenize a tmsh fragment: split on whitespace, keep braces as own tokens. */
function tokenize(s: string): string[] {
  return s
    .replace(/\{/g, " { ")
    .replace(/\}/g, " } ")
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

/**
 * Find `key {` in `body` and return the content of its balanced braces (or null
 * if absent). Handles nesting, so it is safe for cert-key-chain.
 */
function extractBalanced(body: string, keyPattern: string): string | null {
  const re = new RegExp(`(?:^|\\s)${keyPattern}\\s*\\{`);
  const m = re.exec(body);
  if (!m) return null;
  const braceStart = m.index + m[0].length - 1; // index of "{"
  let depth = 0;
  let i = braceStart;
  for (; i < body.length; i++) {
    if (body[i] === "{") depth++;
    else if (body[i] === "}") {
      depth--;
      if (depth === 0) {
        i++;
        break;
      }
    }
  }
  return body.slice(braceStart + 1, i - 1);
}

/** Parse "key value key value [flag]" into a map. */
function parseScalarPairs(s: string): Map<string, string> {
  const toks = s.split(/\s+/).filter(Boolean);
  const map = new Map<string, string>();
  let i = 0;
  for (; i + 1 < toks.length; i += 2) map.set(toks[i], toks[i + 1]);
  if (i < toks.length) map.set(toks[i], "");
  return map;
}

/** Parse the inner of cert-key-chain into named entries of scalar pairs. */
function parseCertKeyChainInner(inner: string): { name: string; sc: Map<string, string> }[] {
  const out: { name: string; sc: Map<string, string> }[] = [];
  let s = inner;
  const re = /([\w.\-]+)\s*\{/;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    const name = m[1];
    const braceStart = m.index + m[0].length - 1;
    let depth = 0;
    let i = braceStart;
    for (; i < s.length; i++) {
      if (s[i] === "{") depth++;
      else if (s[i] === "}") {
        depth--;
        if (depth === 0) {
          i++;
          break;
        }
      }
    }
    out.push({ name, sc: parseScalarPairs(s.slice(braceStart + 1, i - 1)) });
    s = s.slice(i);
  }
  return out;
}

/** Parse top-level scalars, skipping any nested brace group entirely. */
function parseTopScalars(body: string): Map<string, string> {
  const toks = tokenize(body);
  const map = new Map<string, string>();
  let i = 0;
  while (i < toks.length) {
    const key = toks[i++];
    if (key === "{" || key === "}") continue;
    const next = toks[i];
    if (next === "{") {
      let depth = 0;
      while (i < toks.length) {
        if (toks[i] === "{") depth++;
        else if (toks[i] === "}") {
          depth--;
          i++;
          if (depth === 0) break;
          continue;
        }
        i++;
      }
    } else if (next !== undefined && next !== "}") {
      map.set(key, next);
      i++;
    } else {
      map.set(key, "");
    }
  }
  return map;
}

// ---- protocol options ------------------------------------------------------

// Order matters for display: oldest -> newest.
const PROTO_OPTIONS: { name: string; flag: string; enabledLevel: Level; disabledLevel: Level }[] = [
  { name: "SSLv3", flag: "no-sslv3", enabledLevel: "high", disabledLevel: "ok" },
  { name: "TLSv1.0", flag: "no-tlsv1", enabledLevel: "medium", disabledLevel: "ok" },
  { name: "TLSv1.1", flag: "no-tlsv1.1", enabledLevel: "medium", disabledLevel: "ok" },
  { name: "TLSv1.2", flag: "no-tlsv1.2", enabledLevel: "ok", disabledLevel: "medium" },
  { name: "TLSv1.3", flag: "no-tlsv1.3", enabledLevel: "ok", disabledLevel: "low" },
];

// ---- main ------------------------------------------------------------------

export function explainSslProfile(input: string): SslProfileAnalysis {
  if (input.length > MAX_INPUT) {
    throw new SslProfileInputError("tooLong", `input exceeds ${MAX_INPUT} characters`);
  }
  const text = input.trim();
  if (text.length === 0) throw new SslProfileInputError("empty", "no input");

  const header = text.match(/ltm\s+profile\s+(client-ssl|server-ssl)\s+(\S+)/);
  if (!header) {
    throw new SslProfileInputError(
      "noHeader",
      "expected a line like: ltm profile client-ssl /Common/name { ... }",
    );
  }
  const profileType = header[1] as "client-ssl" | "server-ssl";
  const fullName = header[2];
  let partition: string | null = null;
  let name: string | null = fullName;
  const m = fullName.match(/^\/([^/]+)\/(.+)$/);
  if (m) {
    partition = m[1];
    name = m[2];
  }

  // Parse the body: cert-key-chain (nested) and options (flat list) are pulled
  // out by name; everything else at the top level is a scalar "key value".
  const open = text.indexOf("{");
  if (open === -1) throw new SslProfileInputError("noBody", "no opening brace found");
  const close = text.lastIndexOf("}");
  const body = text.slice(open + 1, close > open ? close : text.length);

  const scalars = parseTopScalars(body);
  const optInner = extractBalanced(body, "options");
  const optionsList = optInner ? optInner.split(/\s+/).filter(Boolean) : [];
  const ckcInner = extractBalanced(body, "cert-key-chain");
  const ckcEntries = ckcInner ? parseCertKeyChainInner(ckcInner) : [];

  const fields: SslField[] = [];
  const findings: SslFinding[] = [];
  const scalar = (k: string) => scalars.get(k);

  // ---- role ----
  const role =
    profileType === "client-ssl"
      ? "Terminates TLS from clients: the BIG-IP presents this certificate to clients and decrypts their traffic."
      : "Initiates TLS to pool members: the BIG-IP acts as the TLS client to the backend, and can validate the server certificate.";

  // ---- protocol matrix from options ----
  const options = optionsList;
  const protocols = PROTO_OPTIONS.map((p) => {
    const enabled = !options.includes(p.flag);
    return { name: p.name, enabled, level: enabled ? p.enabledLevel : p.disabledLevel };
  });
  for (const p of protocols) {
    const flag = PROTO_OPTIONS.find((x) => x.name === p.name)?.flag ?? "";
    if (p.name === "SSLv3" && p.enabled) {
      findings.push({
        level: "high",
        title: "SSLv3 is not disabled",
        detail:
          "no-sslv3 is absent, so this profile permits SSLv3. SSLv3 is broken (POODLE, CVE-2014-3566) — add no-sslv3 to options. On current TMOS it may already be blocked at the system level, but make it explicit.",
      });
    }
    if ((p.name === "TLSv1.0" || p.name === "TLSv1.1") && p.enabled) {
      findings.push({
        level: "medium",
        title: `${p.name} is not disabled`,
        detail: `${p.name} is permitted (${flag} is absent). It is deprecated (RFC 8996) and fails most compliance baselines — add ${flag} unless a legacy client truly requires it.`,
      });
    }
    if (p.name === "TLSv1.3" && !p.enabled) {
      findings.push({
        level: "low",
        title: "TLSv1.3 is disabled",
        detail:
          "no-tlsv1.3 is present, so TLS 1.3 is off. On a supported TMOS version, consider enabling it for a faster, safer handshake.",
      });
    }
  }
  if (protocols.every((p) => !p.enabled)) {
    findings.push({
      level: "high",
      title: "No TLS version is enabled",
      detail: "Every protocol is disabled by options; the profile cannot complete a handshake.",
    });
  }
  if (options.length > 0) {
    fields.push({
      key: "options",
      value: options.join(" "),
      explain:
        "Protocol and behavior flags. Each no-<version> flag DISABLES that version; a version is enabled when its flag is absent. dont-insert-empty-fragments turns off the 1/n-1 record split (a legacy BEAST workaround).",
    });
  }
  if (options.includes("cipher-server-preference")) {
    findings.push({
      level: "ok",
      title: "Server cipher preference is set",
      detail: "cipher-server-preference lets the BIG-IP choose the cipher from its own ordered list, not the client's.",
    });
  }

  // ---- ciphers ----
  let ciphers: SslProfileAnalysis["ciphers"] = { mode: "none", value: "" };
  const cipherGroup = scalar("cipher-group");
  const cipherStr = scalar("ciphers");
  if (cipherGroup && cipherGroup !== "none") {
    ciphers = { mode: "group", value: cipherGroup };
    fields.push({
      key: "cipher-group",
      value: cipherGroup,
      explain:
        "A cipher GROUP is in use: the negotiated suites come from the named group's allow/restrict cipher rules, not the legacy ciphers string. The ciphers string is ignored when a group is set.",
    });
  } else if (cipherStr) {
    ciphers = { mode: "string", value: cipherStr };
    fields.push({
      key: "ciphers",
      value: cipherStr,
      explain:
        "The legacy cipher STRING. Expand it with the F5 cipher-string expander to see the exact ordered suite list it resolves to. DEFAULT tracks F5's recommended modern set for the TMOS version.",
    });
    if (/\bDEFAULT\b/.test(cipherStr) === false && /[:!+-]/.test(cipherStr)) {
      // custom cipher string — worth a gentle nudge to verify
      findings.push({
        level: "low",
        title: "Custom cipher string",
        detail:
          "This is a hand-built cipher string. Expand it to confirm it excludes NULL, EXPORT, RC4, and other weak suites, and that ordering is sane.",
      });
    }
  }

  // ---- identity: cert-key-chain (modern) + legacy cert/key/chain ----
  const certKeyChains: CertKeyChain[] = ckcEntries.map((e) => ({
    name: e.name,
    cert: e.sc.get("cert"),
    key: e.sc.get("key"),
    chain: e.sc.get("chain"),
    passphrase: e.sc.has("passphrase"),
  }));
  const legacy = {
    cert: scalar("cert"),
    key: scalar("key"),
    chain: scalar("chain"),
  };
  const hasLegacyIdentity =
    (legacy.cert && legacy.cert !== "none") || (legacy.key && legacy.key !== "none");

  if (certKeyChains.length > 0) {
    fields.push({
      key: "cert-key-chain",
      value: certKeyChains.map((c) => c.name ?? "?").join(", "),
      explain:
        "Modern identity binding. Each entry pairs a server certificate with its private key and an intermediate chain bundle. Multiple entries let one profile serve, for example, both an RSA and an ECDSA certificate, picked per client capability.",
    });
    const anyChain = certKeyChains.some((c) => c.chain && c.chain !== "none");
    if (!anyChain && profileType === "client-ssl") {
      findings.push({
        level: "medium",
        title: "No intermediate chain configured",
        detail:
          "No chain bundle is set on any cert-key-chain entry. If your certificate is not signed directly by a root, clients that lack the intermediate will fail to build the path. Attach the intermediate CA bundle as the chain.",
      });
    } else if (anyChain) {
      findings.push({
        level: "ok",
        title: "Chain bundle present",
        detail:
          "An intermediate chain is attached, so the BIG-IP sends the certificates needed for clients to build a path to a trusted root.",
      });
    }
  } else if (hasLegacyIdentity) {
    fields.push({
      key: "cert / key",
      value: `${legacy.cert ?? "none"} / ${legacy.key ?? "none"}`,
      explain:
        "Legacy single cert/key/chain binding (pre cert-key-chain). It works, but cert-key-chain is preferred and is required to serve multiple certificate types from one profile.",
    });
    if (profileType === "client-ssl" && (!legacy.chain || legacy.chain === "none")) {
      findings.push({
        level: "medium",
        title: "No intermediate chain configured",
        detail:
          "chain is none. If the certificate is not signed directly by a trusted root, attach the intermediate CA bundle as the chain, or clients missing it will fail validation.",
      });
    }
  } else if (profileType === "client-ssl") {
    findings.push({
      level: "high",
      title: "No certificate configured",
      detail:
        "A client-ssl profile with no cert/key cannot present an identity to clients. Bind a certificate and key (via cert-key-chain).",
    });
  }

  // ---- secure renegotiation + renegotiation ----
  const reneg = scalar("renegotiation");
  const secReneg = scalar("secure-renegotiation");
  if (reneg) {
    fields.push({
      key: "renegotiation",
      value: reneg,
      explain:
        reneg === "disabled"
          ? "Mid-connection renegotiation is OFF. This blocks client-initiated renegotiation, removing a class of DoS and the insecure-renegotiation risk. Common and safe for most virtual servers."
          : "Mid-connection renegotiation is ON. Combined with secure-renegotiation, this controls whether the peer must support RFC 5746.",
    });
  }
  if (secReneg) {
    let explain: string;
    let level: Level | undefined;
    if (secReneg === "require-strict") {
      explain =
        "Strongest: the peer must support secure renegotiation (RFC 5746) even on the INITIAL handshake. Connections from peers without the extension are rejected.";
      level = "ok";
    } else if (secReneg === "require") {
      explain =
        "The peer must support secure renegotiation (RFC 5746) to renegotiate, but the initial handshake is still allowed from peers without it. A reasonable default.";
      level = "ok";
    } else {
      explain =
        "request only: secure renegotiation is requested but not enforced. A peer that does not support RFC 5746 is still allowed to renegotiate, which is weaker.";
      level = "low";
      findings.push({
        level: "low",
        title: "secure-renegotiation is request, not require",
        detail:
          "Renegotiation is permitted even for peers without RFC 5746. Prefer require (or require-strict), or disable renegotiation entirely.",
      });
    }
    fields.push({ key: "secure-renegotiation", value: secReneg, explain, level });
  }

  // ---- SNI ----
  const serverName = scalar("server-name");
  const sniDefault = scalar("sni-default");
  const sniRequire = scalar("sni-require");
  if (serverName && serverName !== "none") {
    fields.push({
      key: "server-name",
      value: serverName,
      explain:
        "The FQDN this profile serves. When several SSL profiles share a virtual server, the BIG-IP picks the profile whose server-name matches the client's SNI (RFC 6066).",
    });
  }
  if (sniDefault === "true") {
    fields.push({
      key: "sni-default",
      value: "true",
      explain:
        "This is the DEFAULT SSL profile: it answers when the client sends no SNI, or no other profile's server-name matches. Exactly one profile per virtual server should be the SNI default.",
    });
  }
  if (sniRequire === "true") {
    fields.push({
      key: "sni-require",
      value: "true",
      explain:
        "Clients that do not send an SNI extension are REJECTED. Strict, but it can break very old clients.",
    });
  }

  // ---- OCSP stapling ----
  const ocsp = scalar("ocsp-stapling");
  if (ocsp) {
    fields.push({
      key: "ocsp-stapling",
      value: ocsp,
      explain:
        ocsp === "enabled"
          ? "The BIG-IP staples a fresh OCSP response into the handshake (RFC 6066/6961), so clients need not contact the CA themselves — faster and more private. Requires an OCSP Stapling profile."
          : "OCSP stapling is off; clients that check revocation must reach the CA's OCSP responder on their own.",
      level: ocsp === "enabled" ? "ok" : undefined,
    });
  }

  // ---- client / peer certificate validation ----
  const peerMode = scalar("peer-cert-mode");
  const caFileRaw = scalar("ca-file") ?? scalar("client-cert-ca");
  const caFile = caFileRaw && caFileRaw !== "none" ? caFileRaw : null;
  if (peerMode) {
    let explain: string;
    if (peerMode === "require") {
      explain =
        profileType === "client-ssl"
          ? "Mutual TLS is ENFORCED: clients must present a valid certificate chaining to the trusted CA, or the handshake fails."
          : "The backend server MUST present a valid certificate; the BIG-IP rejects the connection otherwise.";
    } else if (peerMode === "request") {
      explain =
        "The peer certificate is REQUESTED but optional — the handshake still completes if none is presented. Often paired with an iRule or APM that inspects the result.";
    } else {
      explain = "No peer certificate is requested (the default). No mutual TLS.";
    }
    fields.push({ key: "peer-cert-mode", value: peerMode, explain });
    if ((peerMode === "require" || peerMode === "request") && !caFile) {
      findings.push({
        level: "medium",
        title: "Peer validation without a trusted-CA bundle",
        detail:
          "peer-cert-mode requests/requires a certificate, but no ca-file (trusted CA) is set. Validation cannot anchor to a trust source. Set the trusted CA bundle.",
      });
    }
  }
  if (caFile) {
    fields.push({
      key: "ca-file",
      value: caFile,
      explain:
        profileType === "client-ssl"
          ? "The trusted-CA bundle used to validate CLIENT certificates for mutual TLS."
          : "The trusted-CA bundle used to validate the BACKEND server certificate.",
    });
  }
  if (profileType === "server-ssl" && (!peerMode || peerMode === "ignore") && !caFile) {
    findings.push({
      level: "medium",
      title: "Backend server certificate is not validated",
      detail:
        "This server-ssl profile encrypts to the pool but does not validate the server's certificate (no peer-cert-mode require + ca-file). The backend leg is encrypted but not authenticated.",
    });
  }

  // ---- a couple more notable scalars ----
  const sessionTicket = scalar("session-ticket");
  if (sessionTicket) {
    fields.push({
      key: "session-ticket",
      value: sessionTicket,
      explain:
        sessionTicket === "enabled"
          ? "Stateless session resumption via tickets (RFC 5077) is on — faster reconnects without server-side session cache."
          : "Session tickets are off; resumption relies on the server-side session cache instead.",
    });
  }
  const alpn = scalar("alpn");
  if (alpn && alpn !== "none") {
    fields.push({
      key: "alpn",
      value: alpn,
      explain:
        "ALPN negotiation is configured — required for the virtual server to negotiate HTTP/2 over TLS.",
    });
  }

  // ---- a clean-bill finding if nothing flagged ----
  if (findings.length === 0) {
    findings.push({
      level: "ok",
      title: "No issues flagged",
      detail: "Nothing in the recognized settings raised a security flag. Always confirm against your own policy.",
    });
  }

  return {
    profileType,
    role,
    name,
    partition,
    protocols,
    certKeyChains,
    legacy,
    caFile,
    ciphers,
    options,
    fields,
    findings,
  };
}

/** Stable entry point used by golden vectors and the manifest's `run`. */
export function run(input: string): SslProfileAnalysis {
  return explainSslProfile(input);
}
