// ============================================================================
// src/lib/tools/cert-chain-builder/verify-signatures.ts
// ----------------------------------------------------------------------------
// BROWSER-SIDE SIGNATURE CHECK for the certificate chain builder.
//
// The engine in compute.ts is deliberately structural and synchronous, so its
// result is identical everywhere and the golden vectors can pin it. Verifying
// a signature needs real cryptography, which the browser has in WebCrypto
// (SubtleCrypto) and the server does not necessarily have. So this module runs
// only in the page, after the structural result is on screen, and labels what
// it finds as checked in this browser: for every link of the path, the
// subject's tbsCertificate bytes are verified against the issuer's public key
// with the algorithm the certificate names, and a self-signed last
// certificate is checked against its own key. Nothing here changes the
// verdict; it adds a row of facts a reader can weigh.
//
// Algorithms: RSASSA-PKCS1-v1_5 with SHA-1, SHA-256, SHA-384 or SHA-512;
// RSASSA-PSS with the hash and salt length from its parameters; ECDSA with
// SHA-256, SHA-384 or SHA-512 on P-256, P-384 or P-521 (the DER signature is
// converted to the raw r||s form WebCrypto expects); Ed25519 where the browser
// supports it. Anything else is reported as not checked, never as failed.
// ============================================================================

import { decodeCertificate, parseDer, decodeOid, type Asn1Node } from "../x509/compute";
import type { ChainLink, ChainCert } from "./compute";

/** What the check says about one link (or a root's self-signature). */
export interface SignatureCheck {
  /** The certificate whose signature was checked (index into certs). */
  cert: number;
  /** The key it was checked against: the issuer, or the certificate itself for a root. */
  signer: number;
  /** verified: the signature is valid for that key; failed: it is not; unsupported: the
   *  algorithm or key is outside WebCrypto's reach here; error: the bytes could not be read. */
  status: "verified" | "failed" | "unsupported" | "error";
  /** The signature algorithm, by name. */
  algorithm: string;
  /** A short reason for unsupported or error. */
  detail: string | null;
}

/** Header length of a DER node: one tag byte plus the length encoding. */
function headerLength(n: Asn1Node): number {
  if (n.length < 128) return 2;
  let bytes = 0;
  for (let v = n.length; v > 0; v >>= 8) bytes += 1;
  return 2 + bytes;
}

/** The node's bytes including its own tag and length. */
function wholeNode(der: Uint8Array, n: Asn1Node): Uint8Array {
  return der.slice(n.contentStart - headerLength(n), n.contentEnd);
}

/** The SubjectPublicKeyInfo of a certificate, as DER, with its header. */
function spkiOf(der: Uint8Array): Uint8Array {
  const cert = parseDer(der);
  const tbs = cert.children[0];
  // Skip the optional [0] EXPLICIT version, then serial, signature, issuer, validity, subject.
  let idx = 0;
  if (tbs.children[idx] && tbs.children[idx].tagClass === 2 && tbs.children[idx].tagNumber === 0) idx++;
  const spki = tbs.children[idx + 5];
  return wholeNode(der, spki);
}

/** The signed bytes (tbsCertificate with its header), the algorithm node and the signature bits. */
function signedParts(der: Uint8Array): { tbs: Uint8Array; alg: Asn1Node; sig: Uint8Array } {
  const cert = parseDer(der);
  const tbs = cert.children[0];
  const alg = cert.children[1];
  const bits = cert.children[2].content;
  // A BIT STRING starts with the count of unused bits, zero for a signature.
  return { tbs: wholeNode(der, tbs), alg, sig: bits.slice(1) };
}

/** Converts an ECDSA DER signature (SEQUENCE of two INTEGERs) to raw r||s of the curve's size. */
function ecdsaDerToRaw(sig: Uint8Array, size: number): Uint8Array {
  const seq = parseDer(sig);
  const out = new Uint8Array(size * 2);
  seq.children.slice(0, 2).forEach((intNode, k) => {
    // Strip a leading zero added for sign, then right-align into the half.
    let v = intNode.content;
    while (v.length > size && v[0] === 0) v = v.slice(1);
    out.set(v, k * size + (size - v.length));
  });
  return out;
}

/** Hash name from the OID of a hash algorithm (RSASSA-PSS parameters). */
const HASH_OID: Record<string, string> = {
  "1.3.14.3.2.26": "SHA-1",
  "2.16.840.1.101.3.4.2.1": "SHA-256",
  "2.16.840.1.101.3.4.2.2": "SHA-384",
  "2.16.840.1.101.3.4.2.3": "SHA-512",
};

/** Signature OID to the WebCrypto family and hash. */
const SIG_OID: Record<string, { family: "rsa" | "pss" | "ecdsa" | "ed25519"; hash: string | null }> = {
  "1.2.840.113549.1.1.5": { family: "rsa", hash: "SHA-1" },
  "1.2.840.113549.1.1.11": { family: "rsa", hash: "SHA-256" },
  "1.2.840.113549.1.1.12": { family: "rsa", hash: "SHA-384" },
  "1.2.840.113549.1.1.13": { family: "rsa", hash: "SHA-512" },
  "1.2.840.113549.1.1.10": { family: "pss", hash: null },
  "1.2.840.10045.4.3.2": { family: "ecdsa", hash: "SHA-256" },
  "1.2.840.10045.4.3.3": { family: "ecdsa", hash: "SHA-384" },
  "1.2.840.10045.4.3.4": { family: "ecdsa", hash: "SHA-512" },
  "1.3.101.112": { family: "ed25519", hash: null },
};

/** Curve name to the byte length of one ECDSA signature half. */
const CURVE_BYTES: Record<string, number> = { "P-256": 32, "P-384": 48, "P-521": 66 };

/**
 * Checks one certificate's signature against a signer's public key.
 * @param subjectPem the certificate whose signature is checked
 * @param signerPem the certificate holding the key to check it with
 * @param signerCurve the signer's named curve when its key is EC (from the decoder)
 */
async function checkOne(subjectPem: string, signerPem: string, signerCurve: string | null): Promise<Pick<SignatureCheck, "status" | "algorithm" | "detail">> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return { status: "unsupported", algorithm: "", detail: "no-webcrypto" };
  let algorithmName = "";
  try {
    const subject = decodeCertificate(subjectPem);
    algorithmName = subject.signatureAlgorithm;
    const { tbs, alg, sig } = signedParts(subject.der);
    const spki = spkiOf(decodeCertificate(signerPem).der);
    const oid = decodeOid(alg.children[0].content);
    const spec = SIG_OID[oid];
    if (!spec) return { status: "unsupported", algorithm: algorithmName, detail: "algorithm" };
    // Copy into fresh ArrayBuffers: WebCrypto wants plain buffers, not views into the PEM's bytes.
    const buf = (u: Uint8Array) => u.slice().buffer as ArrayBuffer;
    if (spec.family === "rsa") {
      const key = await subtle.importKey("spki", buf(spki), { name: "RSASSA-PKCS1-v1_5", hash: spec.hash! }, false, ["verify"]);
      const ok = await subtle.verify({ name: "RSASSA-PKCS1-v1_5" }, key, buf(sig), buf(tbs));
      return { status: ok ? "verified" : "failed", algorithm: algorithmName, detail: null };
    }
    if (spec.family === "pss") {
      // RSASSA-PSS-params ::= SEQUENCE { [0] hashAlgorithm, [1] maskGenAlgorithm, [2] saltLength, [3] trailerField }
      const params = alg.children[1];
      let hash = "SHA-1";
      let saltLength = 20;
      for (const p of params?.children ?? []) {
        if (p.tagNumber === 0) hash = HASH_OID[decodeOid(p.children[0].children[0].content)] ?? hash;
        if (p.tagNumber === 2) saltLength = p.children[0].content.reduce((a, b) => (a << 8) | b, 0);
      }
      const key = await subtle.importKey("spki", buf(spki), { name: "RSA-PSS", hash }, false, ["verify"]);
      const ok = await subtle.verify({ name: "RSA-PSS", saltLength }, key, buf(sig), buf(tbs));
      return { status: ok ? "verified" : "failed", algorithm: algorithmName, detail: null };
    }
    if (spec.family === "ecdsa") {
      const size = signerCurve ? CURVE_BYTES[signerCurve] : undefined;
      if (!size) return { status: "unsupported", algorithm: algorithmName, detail: "curve" };
      const key = await subtle.importKey("spki", buf(spki), { name: "ECDSA", namedCurve: signerCurve! }, false, ["verify"]);
      const ok = await subtle.verify({ name: "ECDSA", hash: spec.hash! }, key, buf(ecdsaDerToRaw(sig, size)), buf(tbs));
      return { status: ok ? "verified" : "failed", algorithm: algorithmName, detail: null };
    }
    // Ed25519: supported by recent browsers; an older one throws on importKey and lands below.
    const key = await subtle.importKey("spki", buf(spki), "Ed25519", false, ["verify"]);
    const ok = await subtle.verify("Ed25519", key, buf(sig), buf(tbs));
    return { status: ok ? "verified" : "failed", algorithm: algorithmName, detail: null };
  } catch (e) {
    // importKey rejects keys it cannot use (an unsupported curve or algorithm) and
    // malformed bytes alike; both are "not checked here", with the reason kept short.
    return { status: "unsupported", algorithm: algorithmName, detail: e instanceof Error ? e.name : "error" };
  }
}

/**
 * Checks every link of a built path in the browser.
 * @param certs the engine's certificate summaries (for PEM and curve)
 * @param path the engine's path
 * @returns one check per link, plus the root's self-signature when the path ends at one
 */
export async function verifyPathSignatures(certs: ChainCert[], path: ChainLink[]): Promise<SignatureCheck[]> {
  const out: SignatureCheck[] = [];
  for (const link of path) {
    const subject = certs[link.cert];
    // A link with an issuer in the input is checked against that issuer; the
    // self-signed end of the path is checked against itself.
    const signerIndex = link.issuer ?? (subject.selfSigned ? link.cert : null);
    if (signerIndex === null) continue;
    const signer = certs[signerIndex];
    const r = await checkOne(subject.pem, signer.pem, signer.curve);
    out.push({ cert: link.cert, signer: signerIndex, ...r });
  }
  return out;
}
