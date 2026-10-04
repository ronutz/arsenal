// ============================================================================
// src/lib/tools/cert-chain-builder/compute.ts
// ----------------------------------------------------------------------------
// CERTIFICATE CHAIN BUILDER AND VALIDATOR - the pure, deterministic engine.
//
// WHAT IT DOES. Takes any number of X.509 certificates in PEM form, in any
// order, and does what a TLS client's path builder does before it checks a
// single signature: finds the end-entity certificate, follows each certificate
// to its issuer (by Authority Key Identifier to Subject Key Identifier when
// both sides carry one, by issuer name to subject name otherwise), and reports
// the ordered chain the server should send (RFC 8446 section 4.4.2: the
// sender's certificate first, each following certificate directly certifying
// the one before it, the trust anchor optional), the certificates that are
// missing, the ones that are extra, and every structural rule of RFC 5280's
// path validation that the chain breaks: basicConstraints cA, keyCertSign,
// pathLenConstraint, name chaining, and validity at a stated instant.
//
// WHAT IT DOES NOT DO, ON PURPOSE. It does not verify signatures (that needs a
// cryptographic library or WebCrypto, and the component may add it as a
// browser-side extra, labelled as such), does not consult a trust store (it
// says whether the chain ends at a self-signed certificate, not whether that
// certificate is trusted by anyone), does not check revocation (it lists the
// CRL and OCSP pointers it finds and explains what a validator would do with
// them), and does not fetch anything. The result for a given input and a given
// "now" is the same on every machine, which is what the golden vectors pin.
//
// DECODING is delegated to the x509 tool's decoder (src/lib/tools/x509), the
// same one the single-certificate decoder page uses, so a certificate reads
// identically on both pages.
//
// SOURCES (all read 2026-10-04):
//   RFC 5280 s4.2.1.1 (AKI), s4.2.1.2 (SKI), s4.2.1.3 (keyUsage), s4.2.1.9
//   (basicConstraints), s6.1 (path validation, self-issued), s6.1.4 steps
//   (k) to (n) (CA checks); RFC 8446 s4.4.2 (certificate_list order and the
//   optional trust anchor); CA/Browser Forum Baseline Requirements v2.3.1
//   s6.1.5 (RSA at least 2048 bits, ECDSA P-256/P-384/P-521) and its change
//   log (SHA-1 in certificates sunset 2026-09-15); RFC 9155 (SHA-1 and MD5
//   deprecated for signatures; notes the CA/B Forum deprecation for
//   certificate signatures).
// ============================================================================

import { decodeCertificate, X509DecodeError, type DecodedCertificate } from "../x509/compute";

// ----------------------------------------------------------------------------
// Limits (ReDoS- and memory-safe parsing)
// ----------------------------------------------------------------------------

/** The most input text the engine will read; anything longer is refused. */
export const MAX_INPUT_CHARS = 262_144;
/** The most certificates the engine will consider from one input. */
export const MAX_CERTS = 32;

// ----------------------------------------------------------------------------
// Public types
// ----------------------------------------------------------------------------

/** The input: the PEM text and the instant to judge validity at (ISO 8601 UTC). */
export interface ChainInput {
  /** One or more PEM certificates, in any order, with anything between them. */
  text: string;
  /**
   * The instant validity is judged at, as "YYYY-MM-DDTHH:MM:SSZ". The browser
   * passes its clock; a vector passes a fixed instant. When absent, no
   * expired / not-yet-valid finding is produced and `validAt` is null.
   */
  now?: string;
}

/** What the result says about one certificate from the input. */
export interface ChainCert {
  /** Position in the input, 0-based, in the order the PEM blocks appeared. */
  index: number;
  /** Subject and issuer distinguished names, single-line, most specific first. */
  subject: string;
  issuer: string;
  /** Serial number, upper-case colon-grouped hex. */
  serial: string;
  /** Validity window, ISO 8601 UTC. */
  notBefore: string;
  notAfter: string;
  /** Subject and authority key identifiers, colon-grouped hex, when present. */
  ski: string | null;
  aki: string | null;
  /** X.509 version as a human number (1, 2 or 3). */
  version: number;
  /** basicConstraints: present?, cA?, pathLenConstraint (null = none). */
  basicConstraintsPresent: boolean;
  isCa: boolean;
  pathLen: number | null;
  /** keyUsage bits as names, empty when the extension is absent. */
  keyUsage: string[];
  keyUsagePresent: boolean;
  hasKeyCertSign: boolean;
  /** Extended key usage purposes, empty when absent. */
  extendedKeyUsage: string[];
  /** Issuer name equals subject name (RFC 5280 s6.1: self-issued). */
  selfIssued: boolean;
  /** Self-issued and the key identifiers do not contradict it: the shape of a root. */
  selfSigned: boolean;
  /** Signature algorithm name (or OID when unknown). */
  signatureAlgorithm: string;
  /** Public key: algorithm, RSA size or EC curve. */
  keyAlgorithm: string;
  keySizeBits: number | null;
  curve: string | null;
  /** How many subjectAltName entries the certificate carries. */
  sanCount: number;
  /** Revocation pointers found in the certificate (never contacted). */
  crlUrls: string[];
  ocspUrls: string[];
  caIssuerUrls: string[];
  /** Set when this certificate's DER bytes equal an earlier input certificate's. */
  duplicateOf: number | null;
}

/** How a certificate was linked to the issuer chosen for it. */
export type LinkMatch = "aki-ski" | "name" | "none";

/** One step of the path: the certificate and how its issuer was found. */
export interface ChainLink {
  /** The certificate at this step (index into `certs`). */
  cert: number;
  /** The issuer chosen for it, or null when none is in the input. */
  issuer: number | null;
  /** How the issuer was matched. */
  matchedBy: LinkMatch;
  /** Other input certificates that could also have been the issuer. */
  alternatives: number[];
}

/** Severity of a finding, in the vocabulary the site's other checkers use. */
export type Severity = "error" | "warning" | "info";

/** One thing worth saying about the input, located on a certificate when it is. */
export interface Finding {
  /** Stable code; the component localises it. */
  code: FindingCode;
  severity: Severity;
  /** The certificate the finding is about (index into `certs`), or null. */
  at: number | null;
  /** A second certificate when the finding is about a pair (the issuer). */
  other: number | null;
  /** A detail the message may interpolate: a name, a date, a number. */
  detail: string | null;
}

/** Every finding the engine can produce. The docs list each with its rule. */
export type FindingCode =
  | "input-empty"
  | "input-too-long"
  | "input-no-certificates"
  | "input-too-many"
  | "cert-unreadable"
  | "duplicate-certificate"
  | "single-self-signed"
  | "no-end-entity"
  | "multiple-end-entities"
  | "target-is-ca"
  | "issuer-not-found"
  | "issuer-matched-by-name-only"
  | "issuer-name-matches-key-differs"
  | "multiple-issuer-candidates"
  | "issuer-not-ca"
  | "issuer-no-basic-constraints"
  | "issuer-missing-keycertsign"
  | "pathlen-exceeded"
  | "cert-expired"
  | "cert-not-yet-valid"
  | "issuer-expires-before-subject"
  | "subject-predates-issuer"
  | "root-included"
  | "root-omitted"
  | "order-differs"
  | "extra-certificate"
  | "weak-signature"
  | "weak-key"
  | "end-entity-is-ca"
  | "end-entity-no-san"
  | "revocation-pointers";

/** How the engine judged the chain as a whole. */
export type Verdict =
  | "complete" // ends at a self-signed certificate, no error, no warning
  | "complete-with-warnings" // ends at a self-signed certificate, warnings only
  | "anchor-omitted" // sound as far as it goes and stops at a CA whose issuer is not in the input (the normal TLS configuration when that issuer is a root the client holds)
  | "incomplete" // stops at an end entity whose issuer is not in the input: an intermediate is missing
  | "invalid" // a rule of RFC 5280 is broken on the path
  | "unreadable"; // nothing could be read

/** The deterministic result. */
export interface ChainResult {
  /** False only when nothing could be built at all (no readable certificate). */
  ok: boolean;
  verdict: Verdict;
  /** Every certificate read from the input, in input order. */
  certs: ChainCert[];
  /** The end-entity (or target) the path starts from, or null. */
  target: number | null;
  /** Other certificates nobody issues and which are not CAs (ambiguous leaves). */
  otherEndEntities: number[];
  /** The path from the target upwards: each step and how it was linked. */
  path: ChainLink[];
  /** The certificates on the path in order, target first (indices into certs). */
  order: number[];
  /** True when the last certificate on the path is self-signed. */
  endsAtSelfSigned: boolean;
  /** When the path stops short: who the missing issuer is, from the last certificate. */
  missingIssuer: { name: string; aki: string | null; caIssuerUrls: string[] } | null;
  /** Input certificates that are not on the path (not counting duplicates). */
  extras: number[];
  /** Everything worth saying, most severe first, in path order within a severity. */
  findings: Finding[];
  /** The instant used for validity, or null when none was given. */
  validAt: string | null;
  /**
   * The chain as a server should send it, re-encoded from the DER bytes with
   * 64-column base64: the end entity first, then each issuer. `withoutRoot`
   * drops a self-signed last certificate (RFC 8446 s4.4.2: a trust anchor MAY
   * be omitted); `withRoot` keeps it. Both are the same string when the input
   * holds no root.
   */
  orderedPem: { withoutRoot: string; withRoot: string };
}

// ----------------------------------------------------------------------------
// PEM splitting and re-encoding
// ----------------------------------------------------------------------------

/** Matches one PEM certificate block; the body is captured for the decoder. */
const PEM_BLOCK = /-----BEGIN CERTIFICATE-----([A-Za-z0-9+/=\s]*?)-----END CERTIFICATE-----/g;

/** Base64 alphabet, for re-encoding DER without relying on btoa. */
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Base64-encodes bytes (standard alphabet, padded). */
function toBase64(bytes: Uint8Array): string {
  let out = "";
  // Three bytes become four characters; the tail is padded with "=".
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const n = (a << 16) | (b << 8) | c;
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63];
    out += i + 1 < bytes.length ? B64[(n >> 6) & 63] : "=";
    out += i + 2 < bytes.length ? B64[n & 63] : "=";
  }
  return out;
}

/** Re-encodes a certificate's DER as a canonical PEM block (64-column lines). */
export function toPem(der: Uint8Array): string {
  const b64 = toBase64(der);
  const lines: string[] = [];
  for (let i = 0; i < b64.length; i += 64) lines.push(b64.slice(i, i + 64));
  return `-----BEGIN CERTIFICATE-----\n${lines.join("\n")}\n-----END CERTIFICATE-----`;
}

/** True when two byte arrays are identical. */
function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

// ----------------------------------------------------------------------------
// Per-certificate summary
// ----------------------------------------------------------------------------

/** Signature algorithms the Baseline Requirements no longer permit in certificates. */
const WEAK_SIGNATURE = /sha1|md5|md2/i;

/** Builds the ChainCert view of a decoded certificate. */
function summarise(index: number, d: DecodedCertificate): ChainCert {
  const bc = d.extensions.basicConstraints;
  const ku = d.extensions.keyUsage;
  const ski = d.extensions.subjectKeyId?.keyId || null;
  const aki = d.extensions.authorityKeyId?.keyId || null;
  // Self-signed, structurally: self-issued, and when both identifiers exist they
  // agree (RFC 5280 s4.2.1.1: in a self-signed certificate the two would be
  // identical). The signature itself is not checked here.
  const selfSigned = d.selfIssued && (!aki || !ski || aki === ski);
  return {
    index,
    subject: d.subject.text,
    issuer: d.issuer.text,
    serial: d.serialNumberHex,
    notBefore: d.validity.notBefore,
    notAfter: d.validity.notAfter,
    ski,
    aki,
    version: d.version,
    basicConstraintsPresent: Boolean(bc),
    isCa: Boolean(bc?.ca),
    pathLen: bc && typeof bc.pathLen === "number" ? bc.pathLen : null,
    keyUsage: ku?.usages ?? [],
    keyUsagePresent: Boolean(ku),
    hasKeyCertSign: Boolean(ku?.usages.includes("keyCertSign")),
    extendedKeyUsage: d.extensions.extendedKeyUsage?.purposes ?? [],
    selfIssued: d.selfIssued,
    selfSigned,
    signatureAlgorithm: d.signatureAlgorithm,
    keyAlgorithm: d.publicKey.algorithm,
    keySizeBits: d.publicKey.keySizeBits ?? null,
    curve: d.publicKey.curve ?? null,
    sanCount: d.extensions.subjectAltName?.entries.length ?? 0,
    crlUrls: d.extensions.revocation.crlUrls,
    ocspUrls: d.extensions.revocation.ocspUrls,
    caIssuerUrls: d.extensions.revocation.caIssuerUrls,
    duplicateOf: null,
  };
}

// ----------------------------------------------------------------------------
// The engine
// ----------------------------------------------------------------------------

/** Severity order for the final sort: errors first. */
const SEVERITY_RANK: Record<Severity, number> = { error: 0, warning: 1, info: 2 };

/**
 * Finds the issuer candidates for `c` among `all`, excluding duplicates and the
 * certificate itself. AKI-to-SKI is the primary rule; a name match is the
 * fallback. Returns the candidates and how they matched.
 */
function issuerCandidates(
  c: ChainCert,
  all: ChainCert[],
): { byKey: ChainCert[]; byName: ChainCert[] } {
  const byKey: ChainCert[] = [];
  const byName: ChainCert[] = [];
  for (const o of all) {
    if (o.index === c.index || o.duplicateOf !== null) continue;
    if (o.subject !== c.issuer) continue; // RFC 5280 s6.1: subject of x is issuer of x+1
    if (c.aki && o.ski) {
      if (c.aki === o.ski) byKey.push(o);
      // Same name, different key: not an issuer of this certificate (a rollover).
    } else {
      byName.push(o);
    }
  }
  return { byKey, byName };
}

/** Compares two ISO 8601 UTC instants of the same shape by string order. */
const before = (a: string, b: string): boolean => a < b;

/**
 * run - the deterministic entry point.
 * @param input the PEM text and the optional instant
 * @returns the ordered chain, the findings and the re-encoded PEM
 */
export function run(input: ChainInput): ChainResult {
  const findings: Finding[] = [];
  const add = (code: FindingCode, severity: Severity, at: number | null = null, detail: string | null = null, other: number | null = null) =>
    findings.push({ code, severity, at, other, detail });
  const validAt = input.now && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(input.now) ? input.now : null;

  // The empty result every early return builds on.
  const empty = (verdict: Verdict): ChainResult => ({
    ok: false,
    verdict,
    certs: [],
    target: null,
    otherEndEntities: [],
    path: [],
    order: [],
    endsAtSelfSigned: false,
    missingIssuer: null,
    extras: [],
    findings,
    validAt,
    orderedPem: { withoutRoot: "", withRoot: "" },
  });

  // ---- 1. read the input --------------------------------------------------
  const text = input.text ?? "";
  if (text.trim().length === 0) {
    add("input-empty", "error");
    return empty("unreadable");
  }
  if (text.length > MAX_INPUT_CHARS) {
    add("input-too-long", "error", null, String(MAX_INPUT_CHARS));
    return empty("unreadable");
  }
  const blocks: string[] = [];
  for (const m of text.matchAll(PEM_BLOCK)) blocks.push(m[0]);
  if (blocks.length === 0) {
    add("input-no-certificates", "error");
    return empty("unreadable");
  }
  if (blocks.length > MAX_CERTS) {
    add("input-too-many", "error", null, String(MAX_CERTS));
    return empty("unreadable");
  }

  // ---- 2. decode each block, keep the DER for re-encoding and de-duplication
  const decoded: DecodedCertificate[] = [];
  const certs: ChainCert[] = [];
  const ders: Uint8Array[] = [];
  blocks.forEach((pem, i) => {
    try {
      const d = decodeCertificate(pem);
      decoded.push(d);
      ders.push(d.der);
      certs.push(summarise(certs.length, d));
    } catch (e) {
      // An unreadable block is reported by its position among the blocks and skipped.
      const code = e instanceof X509DecodeError ? e.code : "der";
      add("cert-unreadable", "error", null, `${i + 1}:${code}`);
    }
  });
  if (certs.length === 0) return empty("unreadable");

  // Duplicates: identical DER bytes. The later copy points at the first.
  for (let i = 0; i < certs.length; i++) {
    for (let j = 0; j < i; j++) {
      if (certs[j].duplicateOf === null && sameBytes(ders[i], ders[j])) {
        certs[i].duplicateOf = j;
        add("duplicate-certificate", "info", i, null, j);
        break;
      }
    }
  }
  const live = certs.filter((c) => c.duplicateOf === null);

  // ---- 3. choose the target: a certificate nobody in the input issues ------
  // "Issues" is judged the same way the path builder links: a certificate whose
  // AKI matches this one's SKI, or, lacking identifiers, whose issuer name is
  // this one's subject name.
  const issuesSomething = (o: ChainCert): boolean =>
    live.some((c) => c.index !== o.index && c.issuer === o.subject && (c.aki && o.ski ? c.aki === o.ski : true));
  const leaves = live.filter((c) => !issuesSomething(c));
  const endEntities = leaves.filter((c) => !c.isCa);

  if (live.length === 1 && live[0].selfSigned) {
    // One self-signed certificate: nothing to build; say so and describe it.
    add("single-self-signed", "info", live[0].index);
  }

  let target: ChainCert | null = null;
  if (endEntities.length >= 1) {
    target = endEntities[0];
    if (endEntities.length > 1) {
      add("multiple-end-entities", "warning", target.index, String(endEntities.length));
    }
  } else if (leaves.length >= 1) {
    // Every unissued certificate is a CA: build from the first one and say so.
    target = leaves[0];
    add("target-is-ca", "info", target.index);
  } else {
    // Every certificate is issued by another in the input: a cycle, which real
    // PKIs do not produce except through two self-signed-looking roots that name
    // each other. Fall back to the first certificate and report it.
    target = live[0];
    add("no-end-entity", "warning", target.index);
  }
  const otherEndEntities = endEntities.filter((c) => c.index !== target!.index).map((c) => c.index);

  // ---- 4. walk upwards from the target -------------------------------------
  const path: ChainLink[] = [];
  const onPath = new Set<number>();
  let current: ChainCert = target;
  let missingIssuer: ChainResult["missingIssuer"] = null;
  let endsAtSelfSigned = false;
  for (let guard = 0; guard <= MAX_CERTS; guard++) {
    onPath.add(current.index);
    if (current.selfSigned) {
      // A self-signed certificate closes the path: it is its own issuer.
      path.push({ cert: current.index, issuer: null, matchedBy: "none", alternatives: [] });
      endsAtSelfSigned = true;
      break;
    }
    const { byKey, byName } = issuerCandidates(current, live);
    const pool = byKey.length > 0 ? byKey : byName;
    const candidates = pool.filter((o) => !onPath.has(o.index));
    if (candidates.length === 0) {
      // Nobody in the input issued this certificate.
      path.push({ cert: current.index, issuer: null, matchedBy: "none", alternatives: [] });
      missingIssuer = { name: current.issuer, aki: current.aki, caIssuerUrls: current.caIssuerUrls };
      // A name match that failed on the key is worth naming: it is usually a
      // rolled-over CA with the same name and a new key.
      const sameNameOtherKey = live.find((o) => o.index !== current.index && o.subject === current.issuer && current.aki && o.ski && o.ski !== current.aki);
      // Stopping at a CA is the normal shape of a TLS chain whose trust anchor
      // is left out (RFC 8446 s4.4.2), so that is a warning the reader can judge;
      // stopping at the end entity means an intermediate is missing: an error.
      const severity: Severity = current.isCa ? "warning" : "error";
      if (sameNameOtherKey) add("issuer-name-matches-key-differs", "error", current.index, null, sameNameOtherKey.index);
      else add("issuer-not-found", severity, current.index, current.issuer);
      break;
    }
    // Several candidates (a cross-signed CA, or two copies of a CA with the same
    // key): prefer the one whose validity covers the subject's notBefore, then
    // the earliest in the input. Report the alternatives.
    let chosen = candidates[0];
    if (candidates.length > 1) {
      const covering = candidates.filter((o) => !before(current.notBefore, o.notBefore) && !before(o.notAfter, current.notBefore));
      if (covering.length > 0) chosen = covering[0];
      add("multiple-issuer-candidates", "info", current.index, String(candidates.length), chosen.index);
    }
    const matchedBy: LinkMatch = byKey.length > 0 ? "aki-ski" : "name";
    if (matchedBy === "name") add("issuer-matched-by-name-only", "info", current.index, null, chosen.index);
    path.push({ cert: current.index, issuer: chosen.index, matchedBy, alternatives: candidates.filter((o) => o.index !== chosen.index).map((o) => o.index) });
    current = chosen;
  }
  const order = path.map((l) => l.cert);
  const byIndex = (i: number): ChainCert => certs[i];

  // ---- 5. the rules of RFC 5280 along the path -----------------------------
  // (a) each issuer must be a CA able to sign certificates: s6.1.4 (k) and (n).
  for (const link of path) {
    if (link.issuer === null) continue;
    const issuer = byIndex(link.issuer);
    if (issuer.version === 3 && !issuer.basicConstraintsPresent) {
      add("issuer-no-basic-constraints", "error", link.issuer, null, link.cert);
    } else if (!issuer.isCa) {
      add("issuer-not-ca", "error", link.issuer, null, link.cert);
    }
    if (issuer.keyUsagePresent && !issuer.hasKeyCertSign) {
      add("issuer-missing-keycertsign", "error", link.issuer, null, link.cert);
    }
  }
  // (b) pathLenConstraint: s6.1.4 (l) and (m), walked from the top of the path
  // down. The trust anchor (a self-signed last certificate) is not part of the
  // prospective path (s6.1), so its own constraint is not applied; the
  // intermediates below it are counted, self-issued ones excepted.
  {
    const topDown = [...order].reverse();
    const anchorIdx = endsAtSelfSigned ? topDown[0] : null;
    let maxPathLength = Number.POSITIVE_INFINITY;
    for (const idx of topDown) {
      const c = byIndex(idx);
      const isLast = idx === order[0]; // the target is the last certificate of the path
      if (idx === anchorIdx) {
        // The anchor's constraint is not applied, but it still bounds the
        // intermediates below it when a validator enforces anchor constraints;
        // RFC 5937 makes that optional, so it is modelled as a starting bound.
        if (c.pathLen !== null) maxPathLength = c.pathLen;
        continue;
      }
      if (isLast) break; // the target is not an intermediate and is not counted
      if (!c.selfIssued) {
        if (maxPathLength <= 0) {
          // Which certificate imposed the exhausted limit: the nearest above with a pathLen.
          const above = topDown.slice(0, topDown.indexOf(idx)).reverse().find((i) => byIndex(i).pathLen !== null);
          add("pathlen-exceeded", "error", idx, above !== undefined ? String(byIndex(above).pathLen) : "0", above ?? null);
          break;
        }
        maxPathLength -= 1;
      }
      if (c.pathLen !== null && c.pathLen < maxPathLength) maxPathLength = c.pathLen;
    }
  }
  // (c) validity at the instant given, for every certificate on the path.
  if (validAt) {
    for (const idx of order) {
      const c = byIndex(idx);
      if (before(validAt, c.notBefore)) add("cert-not-yet-valid", "error", idx, c.notBefore);
      else if (before(c.notAfter, validAt)) add("cert-expired", "error", idx, c.notAfter);
    }
  }
  // (d) windows along each link: an issuer that expires before its subject
  // breaks the chain on that date; a subject issued before its issuer existed
  // is unusual (a cross-sign issued later than the leaf) and worth a note.
  for (const link of path) {
    if (link.issuer === null) continue;
    const c = byIndex(link.cert);
    const issuer = byIndex(link.issuer);
    if (before(issuer.notAfter, c.notAfter)) add("issuer-expires-before-subject", "warning", link.issuer, issuer.notAfter, link.cert);
    if (before(c.notBefore, issuer.notBefore)) add("subject-predates-issuer", "info", link.cert, issuer.notBefore, link.issuer);
  }
  // (e) the end entity itself: a server certificate without subjectAltName is
  // not accepted by current browsers; a CA used as the target is only noted.
  if (endEntities.length >= 1) {
    if (target.sanCount === 0) add("end-entity-no-san", "warning", target.index);
  } else if (target.isCa && live.length > 1) {
    add("end-entity-is-ca", "info", target.index);
  }
  // (f) algorithm strength, per the Baseline Requirements, on every certificate
  // of the path except a self-signed root's own signature (which no validator
  // checks: the anchor is trusted, not verified).
  for (const idx of order) {
    const c = byIndex(idx);
    if (!c.selfSigned && WEAK_SIGNATURE.test(c.signatureAlgorithm)) add("weak-signature", "warning", idx, c.signatureAlgorithm);
    if (c.keyAlgorithm === "RSA" && c.keySizeBits !== null && c.keySizeBits < 2048) add("weak-key", "warning", idx, `RSA ${c.keySizeBits}`);
  }
  // (g) the root and the order.
  if (endsAtSelfSigned && order.length > 1) add("root-included", "info", order[order.length - 1]);
  if (!endsAtSelfSigned && missingIssuer && path.length > 1) add("root-omitted", "info", order[order.length - 1], missingIssuer.name);
  {
    // Did the input already list the path in the right order (ignoring extras)?
    const inputOrderOfPath = live.filter((c) => onPath.has(c.index)).map((c) => c.index);
    if (inputOrderOfPath.some((idx, k) => idx !== order[k])) add("order-differs", "info", null, order.map((i) => i + 1).join(" > "));
  }
  // (h) extras: readable, not duplicates, not on the path.
  const extras = live.filter((c) => !onPath.has(c.index)).map((c) => c.index);
  for (const idx of extras) add("extra-certificate", "info", idx);
  // (i) revocation pointers on the path, summarised once.
  {
    const withPointers = order.filter((i) => byIndex(i).crlUrls.length + byIndex(i).ocspUrls.length > 0);
    if (withPointers.length > 0) add("revocation-pointers", "info", null, String(withPointers.length));
  }

  // ---- 6. verdict and the ordered PEM --------------------------------------
  // The verdict describes the PATH. An unreadable block is reported as an error
  // but does not change what was built from the readable ones, so it is left
  // out of the verdict and the chain can still read "complete" beside it.
  const pathFindings = findings.filter((f) => f.code !== "cert-unreadable");
  const hasError = pathFindings.some((f) => f.severity === "error");
  const hasWarning = pathFindings.some((f) => f.severity === "warning");
  // The two "stops short" findings decide between incomplete and anchor-omitted;
  // any other error is a broken rule and the path is invalid.
  const STOPS_SHORT: FindingCode[] = ["issuer-not-found", "issuer-name-matches-key-differs"];
  const otherErrors = pathFindings.some((f) => f.severity === "error" && !STOPS_SHORT.includes(f.code));
  let verdict: Verdict;
  if (otherErrors) verdict = "invalid";
  else if (missingIssuer && !endsAtSelfSigned) verdict = hasError ? "incomplete" : "anchor-omitted";
  else verdict = hasWarning ? "complete-with-warnings" : "complete";

  const pems = order.map((i) => toPem(ders[i]));
  const withRoot = pems.join("\n");
  const withoutRoot = endsAtSelfSigned && pems.length > 1 ? pems.slice(0, -1).join("\n") : withRoot;

  findings.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || (a.at ?? -1) - (b.at ?? -1));

  return {
    ok: true,
    verdict,
    certs,
    target: target.index,
    otherEndEntities,
    path,
    order,
    endsAtSelfSigned,
    missingIssuer,
    extras,
    findings,
    validAt,
    orderedPem: { withoutRoot, withRoot },
  };
}
