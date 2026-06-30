// ============================================================================
// src/lib/tools/f5-cipher-string-expander/compute.ts
// ----------------------------------------------------------------------------
// EXPLAINS AND ANALYZES AN F5 BIG-IP CIPHER STRING.
//
// A BIG-IP cipher string (the `cipher` field of an ltm cipher rule, or a raw
// string in an SSL profile) is an ordered list of cipher sets separated by ':',
// ',', or whitespace. Each set combines keywords with '+' (protocol, key
// exchange, authentication, bulk cipher, MAC), and a leading operator can
// exclude ('!'), delete ('-'), or lower the priority of ('+') a set. '@STRENGTH'
// re-sorts by key length.
//
// This module PARSES that string, EXPLAINS every keyword and operator, and
// FLAGS weak or deprecated choices. It does NOT reproduce the exact ordered
// suite list that `tmm --clientciphers` prints, because that list depends on
// the per-TMOS-version cipher database, which is not vendored here. What it
// gives is the meaning and security posture of the string itself.
//
// Sources: F5 SSL administration guide, the BIG-IP v13 cipher rules article,
// and the F5 TMOS cipher reference. Pure and offline.
// ============================================================================

export type KwCategory = "protocol" | "kx" | "auth" | "bulk" | "mac" | "alias" | "sort" | "literal" | "unknown";
export type Security = "weak" | "strong" | "neutral";

export interface KeywordExplain {
  text: string;
  known: boolean;
  category: KwCategory;
  label: string;
  note: string;
  security: Security;
}

export type Operator = "include" | "exclude" | "delete" | "lower-priority" | "sort";

export interface CipherSet {
  raw: string;
  operator: Operator;
  keywords: KeywordExplain[];
  summary: string;
}

export interface CipherResult {
  ok: boolean;
  input: string;
  sets: CipherSet[];
  expandedFromRule?: { name: string; cipher: string };
  positives: string[];
  concerns: string[];
  pfs: boolean;
  error?: { message: string };
}

interface KwDef {
  category: KwCategory;
  label: string;
  note: string;
  security: Security;
}

// -- Keyword knowledge base (keys are uppercased) -----------------------------
const KEYWORDS: Record<string, KwDef> = {
  // Protocols
  SSLV2: { category: "protocol", label: "SSL 2.0", note: "An obsolete, broken protocol. It should never be enabled.", security: "weak" },
  SSLV3: { category: "protocol", label: "SSL 3.0", note: "A deprecated protocol vulnerable to POODLE. Disable it.", security: "weak" },
  TLSV1: { category: "protocol", label: "TLS 1.0", note: "A deprecated protocol; most compliance regimes now require it off.", security: "weak" },
  TLSV1_1: { category: "protocol", label: "TLS 1.1", note: "A deprecated protocol; disable it in favor of TLS 1.2 and 1.3.", security: "weak" },
  TLSV1_2: { category: "protocol", label: "TLS 1.2", note: "A current, secure protocol version.", security: "strong" },
  TLSV1_3: { category: "protocol", label: "TLS 1.3", note: "The newest protocol version; note BIG-IP manages its suites separately.", security: "strong" },
  DTLSV1: { category: "protocol", label: "DTLS 1.0", note: "Datagram TLS 1.0, the UDP analogue of TLS 1.0; deprecated.", security: "weak" },
  DTLSV1_2: { category: "protocol", label: "DTLS 1.2", note: "Datagram TLS 1.2, the UDP analogue of TLS 1.2.", security: "neutral" },
  // Key exchange
  ECDHE: { category: "kx", label: "Ephemeral ECDH key exchange", note: "Elliptic-curve ephemeral key exchange; provides forward secrecy.", security: "strong" },
  DHE: { category: "kx", label: "Ephemeral DH key exchange", note: "Finite-field ephemeral key exchange; provides forward secrecy but is slower than ECDHE.", security: "strong" },
  EDH: { category: "kx", label: "Ephemeral DH key exchange", note: "An alias for DHE; provides forward secrecy.", security: "strong" },
  ECDH: { category: "kx", label: "Static ECDH key exchange", note: "Static elliptic-curve key exchange; no forward secrecy.", security: "neutral" },
  DH: { category: "kx", label: "Static DH key exchange", note: "Static finite-field key exchange; no forward secrecy.", security: "neutral" },
  ECDHE_RSA: { category: "kx", label: "ECDHE with RSA authentication", note: "Ephemeral ECDH key exchange authenticated by an RSA certificate; forward secrecy.", security: "strong" },
  ECDHE_ECDSA: { category: "kx", label: "ECDHE with ECDSA authentication", note: "Ephemeral ECDH key exchange authenticated by an ECDSA certificate; required when offering an ECDSA cert only.", security: "strong" },
  DHE_RSA: { category: "kx", label: "DHE with RSA authentication", note: "Ephemeral DH key exchange authenticated by RSA; forward secrecy.", security: "strong" },
  // Authentication / cert type
  RSA: { category: "auth", label: "RSA", note: "RSA key exchange or authentication. As a key exchange method (not ECDHE/DHE) it does not provide forward secrecy.", security: "neutral" },
  ECDSA: { category: "auth", label: "ECDSA", note: "Authentication with an ECDSA certificate.", security: "neutral" },
  DSS: { category: "auth", label: "DSS", note: "Authentication with a DSA certificate; rarely used today.", security: "neutral" },
  ADH: { category: "kx", label: "Anonymous DH", note: "Anonymous Diffie-Hellman: no certificate, no authentication. It allows man-in-the-middle attacks and must be disabled.", security: "weak" },
  AECDH: { category: "kx", label: "Anonymous ECDH", note: "Anonymous elliptic-curve DH: no authentication; disable it.", security: "weak" },
  // Bulk ciphers
  AES: { category: "bulk", label: "AES", note: "AES bulk encryption (both 128 and 256, CBC and GCM unless narrowed).", security: "neutral" },
  "AES-GCM": { category: "bulk", label: "AES-GCM", note: "AES in Galois/Counter Mode: an AEAD cipher, the preferred bulk choice.", security: "strong" },
  "AES-CBC": { category: "bulk", label: "AES-CBC", note: "AES in CBC mode; functional but lacks the AEAD properties of GCM.", security: "neutral" },
  AES128: { category: "bulk", label: "AES-128", note: "128-bit AES.", security: "neutral" },
  AES256: { category: "bulk", label: "AES-256", note: "256-bit AES.", security: "neutral" },
  "CHACHA20-POLY1305": { category: "bulk", label: "ChaCha20-Poly1305", note: "An AEAD stream cipher, strong and fast on devices without AES hardware.", security: "strong" },
  CAMELLIA: { category: "bulk", label: "Camellia", note: "A block cipher comparable to AES; uncommon and not hardware-accelerated on most platforms.", security: "neutral" },
  "3DES": { category: "bulk", label: "Triple DES", note: "A slow 64-bit-block cipher vulnerable to Sweet32. Avoid it.", security: "weak" },
  DES: { category: "bulk", label: "DES", note: "Single DES: broken by brute force. Never enable it.", security: "weak" },
  RC4: { category: "bulk", label: "RC4", note: "A stream cipher with known biases, prohibited by RFC 7465. Disable it.", security: "weak" },
  NULL: { category: "bulk", label: "Null cipher", note: "No encryption at all. Only ever appropriate for testing; never in production.", security: "weak" },
  IDEA: { category: "bulk", label: "IDEA", note: "A legacy block cipher; uncommon and not recommended.", security: "weak" },
  SEED: { category: "bulk", label: "SEED", note: "A legacy Korean block cipher; uncommon.", security: "neutral" },
  // MAC / hash
  SHA: { category: "mac", label: "SHA-1 MAC", note: "HMAC-SHA1 for message authentication. Acceptable as a TLS MAC, though SHA-1 is retired for certificates.", security: "neutral" },
  SHA1: { category: "mac", label: "SHA-1 MAC", note: "HMAC-SHA1 for message authentication.", security: "neutral" },
  SHA256: { category: "mac", label: "SHA-256 MAC", note: "HMAC-SHA256, or the PRF hash for newer suites.", security: "strong" },
  SHA384: { category: "mac", label: "SHA-384 MAC", note: "HMAC-SHA384, used by AES-256-GCM suites.", security: "strong" },
  MD5: { category: "mac", label: "MD5 MAC", note: "HMAC-MD5: MD5 is broken and must not be used.", security: "weak" },
  AEAD: { category: "mac", label: "AEAD", note: "Authenticated encryption (GCM or ChaCha20-Poly1305) where the cipher provides its own integrity.", security: "strong" },
  // Aliases / groups
  DEFAULT: { category: "alias", label: "DEFAULT", note: "The BIG-IP default cipher set for this TMOS version. F5 recommends appending to it rather than replacing it.", security: "neutral" },
  NATIVE: { category: "alias", label: "NATIVE", note: "Cipher suites implemented natively by TMM (as opposed to the removed COMPAT/OpenSSL stack).", security: "neutral" },
  ALL: { category: "alias", label: "ALL", note: "Every cipher suite TMM supports, including weak ones; narrow it before use.", security: "neutral" },
  COMPAT: { category: "alias", label: "COMPAT", note: "The OpenSSL compatibility stack, REMOVED in TMOS 13.0+. If present it is replaced with NONE and affected connections fail.", security: "weak" },
  HIGH: { category: "alias", label: "HIGH", note: "Cipher suites with long keys; F5 recommends including HIGH alongside disabling ADH.", security: "strong" },
  MEDIUM: { category: "alias", label: "MEDIUM", note: "Medium-strength cipher suites; review what this admits.", security: "neutral" },
  LOW: { category: "alias", label: "LOW", note: "Low-strength cipher suites; exclude these.", security: "weak" },
  EXPORT: { category: "alias", label: "EXPORT", note: "Deliberately weakened export-grade ciphers (FREAK/Logjam). Always exclude.", security: "weak" },
  EXP: { category: "alias", label: "EXPORT", note: "Shorthand for EXPORT: deliberately weakened ciphers. Always exclude.", security: "weak" },
  ENULL: { category: "alias", label: "eNULL", note: "Ciphers with no encryption. Exclude them.", security: "weak" },
  ANULL: { category: "alias", label: "aNULL", note: "Ciphers with no authentication (anonymous). Exclude them.", security: "weak" },
  NONE: { category: "alias", label: "NONE", note: "No ciphers. A profile resolving to NONE cannot complete a handshake.", security: "weak" },
};

const SORT_KEYWORDS: Record<string, string> = {
  "@STRENGTH": "Re-sort the ciphers selected so far by key length (strongest first).",
  "@SPEED": "Re-sort the ciphers selected so far by encryption speed.",
};

// Pre-built F5 cipher rules and their documented cipher strings.
const PREBUILT_RULES: Record<string, string> = {
  "f5-default": "DEFAULT",
  "f5-ecc": "ECDHE:ECDHE_ECDSA",
  "f5-secure": "ECDHE:RSA:!SSLV3:!RC4:!EXP:!DES",
};

const WEAK_IF_ENABLED = new Set(["SSLV2", "SSLV3", "TLSV1", "TLSV1_1", "DTLSV1", "RC4", "DES", "3DES", "NULL", "MD5", "ADH", "AECDH", "LOW", "EXPORT", "EXP", "COMPAT", "ENULL", "ANULL", "IDEA"]);

function looksLikeLiteralSuite(s: string): boolean {
  // e.g. ECDHE-RSA-AES128-GCM-SHA256 (a fully-named OpenSSL-style suite)
  return /^[A-Z0-9]+(-[A-Z0-9]+){2,}$/.test(s) && s.includes("-");
}

function explainKeyword(text: string): KeywordExplain {
  const up = text.toUpperCase();
  const def = KEYWORDS[up];
  if (def) return { text, known: true, category: def.category, label: def.label, note: def.note, security: def.security };
  if (looksLikeLiteralSuite(up)) {
    return { text, known: true, category: "literal", label: "Literal cipher suite", note: "A fully-named cipher suite, taken as-is.", security: "neutral" };
  }
  return { text, known: false, category: "unknown", label: text, note: "Not a recognized BIG-IP cipher keyword.", security: "neutral" };
}

function classifySet(operator: Operator, keywords: KeywordExplain[]): string {
  const labels = keywords.map((k) => k.label);
  const joined = labels.join(" + ");
  switch (operator) {
    case "exclude":
      return `Permanently excludes ${joined}.`;
    case "delete":
      return `Removes ${joined} from the list so far (it may be re-added later).`;
    case "lower-priority":
      return `Lowers the priority of ${joined}, moving it toward the end.`;
    case "sort":
      return keywords[0]?.note ?? "Re-sorts the list.";
    default:
      return keywords.length > 1 ? `Selects ciphers that combine ${joined}.` : `Selects ${joined}.`;
  }
}

/** parse - split an F5 cipher string into ordered, operator-tagged sets. */
function parseCipherString(input: string): CipherSet[] {
  // Sets are separated by ':', ',', or whitespace.
  const rawSets = input.split(/[:,\s]+/).filter((s) => s.length > 0);
  const sets: CipherSet[] = [];

  for (const raw of rawSets) {
    // Sort directives are whole tokens.
    if (raw.startsWith("@")) {
      const up = raw.toUpperCase();
      const note = SORT_KEYWORDS[up] ?? "A sort directive.";
      sets.push({
        raw,
        operator: "sort",
        keywords: [{ text: raw, known: up in SORT_KEYWORDS, category: "sort", label: up, note, security: "neutral" }],
        summary: note,
      });
      continue;
    }

    let operator: Operator = "include";
    let body = raw;
    if (raw.startsWith("!")) {
      operator = "exclude";
      body = raw.slice(1);
    } else if (raw.startsWith("-")) {
      operator = "delete";
      body = raw.slice(1);
    } else if (raw.startsWith("+")) {
      operator = "lower-priority";
      body = raw.slice(1);
    }

    const keywords = body.split("+").filter((k) => k.length > 0).map(explainKeyword);
    sets.push({ raw, operator, keywords, summary: classifySet(operator, keywords) });
  }

  return sets;
}

function analyze(sets: CipherSet[]): { positives: string[]; concerns: string[]; pfs: boolean } {
  const positives: string[] = [];
  const concerns: string[] = [];

  const enabled = new Set<string>();
  const excluded = new Set<string>();
  for (const s of sets) {
    for (const k of s.keywords) {
      const up = k.text.toUpperCase();
      if (s.operator === "exclude" || s.operator === "delete") excluded.add(up);
      else if (s.operator === "include" || s.operator === "lower-priority") enabled.add(up);
    }
  }

  // Forward secrecy
  const hasPfs = ["ECDHE", "DHE", "EDH", "ECDHE_RSA", "ECDHE_ECDSA", "DHE_RSA"].some((k) => enabled.has(k));
  const pfs = hasPfs;
  if (hasPfs) positives.push("Includes an ephemeral key exchange (ECDHE or DHE), so connections get forward secrecy.");

  // Weak keywords actually enabled
  for (const up of enabled) {
    if (WEAK_IF_ENABLED.has(up)) {
      const def = KEYWORDS[up];
      concerns.push(`Enables ${def?.label ?? up}: ${def?.note ?? "this is weak or deprecated."}`);
    }
  }
  // Aliases that admit everything
  if (enabled.has("ALL") && !excluded.size) concerns.push("ALL admits every supported suite, including weak ones; pair it with exclusions or narrow it.");

  // Good hardening via exclusions
  const excludedWeak = [...excluded].filter((u) => WEAK_IF_ENABLED.has(u));
  if (excludedWeak.length) {
    const labels = excludedWeak.map((u) => KEYWORDS[u]?.label ?? u);
    positives.push(`Explicitly excludes ${labels.join(", ")}, which is good hardening.`);
  }

  if (!hasPfs && (enabled.has("RSA") || enabled.has("DEFAULT") || enabled.has("ALL"))) {
    concerns.push("No ephemeral key exchange is explicitly required, so non-forward-secret RSA key exchange may be selected; consider leading with ECDHE.");
  }

  return { positives, concerns, pfs };
}

/** run - parse, explain, and analyze an F5 cipher string. Never throws. */
export function run(input: string): CipherResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, input: trimmed, sets: [], positives: [], concerns: [], pfs: false, error: { message: "Enter an F5 cipher string or a pre-built rule name." } };
  }

  // Whole-input pre-built rule name?
  const lower = trimmed.toLowerCase();
  let working = trimmed;
  let expandedFromRule: { name: string; cipher: string } | undefined;
  if (PREBUILT_RULES[lower]) {
    expandedFromRule = { name: lower, cipher: PREBUILT_RULES[lower] };
    working = PREBUILT_RULES[lower];
  }

  const sets = parseCipherString(working);
  const { positives, concerns, pfs } = analyze(sets);

  return { ok: true, input: trimmed, sets, expandedFromRule, positives, concerns, pfs };
}
