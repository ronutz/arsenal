// ============================================================================
// src/lib/tools/x509/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the X.509 decoder.
//
// Each accept vector is a real certificate (generated with OpenSSL 3.0) whose
// expected decoded fields were taken from `openssl x509 -text` - an independent
// reference, so these pin the parser to a second implementation, not to itself.
// Reject vectors assert that malformed input throws the right stable code.
//
// `verifyVectors()` runs the whole set and returns a structured pass/fail report
// (used by the build/CI check and runnable standalone).
// ============================================================================

import { decodeCertificate, X509DecodeError, type X509DecodeErrorCode } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "x509-golden-v1";

/** The subset of decoded fields a golden vector asserts. */
export interface X509Expectation {
  version: number;
  serialNumberHex: string;
  subjectText: string;
  issuerText: string;
  notBefore: string;
  notAfter: string;
  signatureAlgorithm: string;
  keyAlgorithm: string;
  keySizeBits?: number;
  curve?: string;
  san?: string[];
  keyUsage?: string[];
  extendedKeyUsage?: string[];
  ca?: boolean;
  pathLen?: number;
  selfIssued: boolean;
}

export interface X509GoldenVector {
  id: string;
  description: string;
  pem: string;
  expect: X509Expectation;
}

// --- Vector 1: RSA-2048 leaf with SAN, EKU, keyUsage, CA:FALSE ----------------
const LEAF_PEM = `-----BEGIN CERTIFICATE-----
MIIELDCCAxSgAwIBAgIGGis8TV5vMA0GCSqGSIb3DQEBCwUAMHoxCzAJBgNVBAYT
AkJSMRIwEAYDVQQIDAlTYW8gUGF1bG8xEjAQBgNVBAcMCVNhbyBQYXVsbzEXMBUG
A1UECgwOTlRaIFRlY2hub2xvZ3kxEDAOBgNVBAsMB0Fyc2VuYWwxGDAWBgNVBAMM
D3Rlc3Qucm9udXR6LmNvbTAeFw0yNjA2MjYwNDI3MzRaFw0zNjA2MjMwNDI3MzRa
MHoxCzAJBgNVBAYTAkJSMRIwEAYDVQQIDAlTYW8gUGF1bG8xEjAQBgNVBAcMCVNh
byBQYXVsbzEXMBUGA1UECgwOTlRaIFRlY2hub2xvZ3kxEDAOBgNVBAsMB0Fyc2Vu
YWwxGDAWBgNVBAMMD3Rlc3Qucm9udXR6LmNvbTCCASIwDQYJKoZIhvcNAQEBBQAD
ggEPADCCAQoCggEBALwOgIj4c3kdS4Xg2PosyzzgJ06lZM9xD+3XHr4N857o56Hi
qumKeYQM/4jkOJWhKz5StbWNXqZ1lbrjQwr9RV9kV6jqMo/iQYlmlmxsTeWoJ61Q
6VYeAIsZrJSCr7tS0ZH9nAYzJYz/FnqtSjwm9EPEc/zahpMvSNLYS3R/d1m41EG4
JhE1hL9tvF7Hb/7KaoxVuot86kOiAf20j5RsM86f/0LdXHAWro4VUAMvukqSW+Y2
ohhmRHq4OvAxNccxUBAVG6txUuaSVOxTNVj2tD+0ZFXWrLdZtLAWcXC1BmDi5UiB
+0loZvGF4oqL1DlNJzg5C74wiQ0LzIznnm89hO8CAwEAAaOBtzCBtDAdBgNVHQ4E
FgQUu2Q3pfojzu7xdoDhP2xGe0Xikz0wHwYDVR0jBBgwFoAUu2Q3pfojzu7xdoDh
P2xGe0Xikz0wNQYDVR0RBC4wLIIPdGVzdC5yb251dHouY29tghN3d3cudGVzdC5y
b251dHouY29thwTAAAIKMAwGA1UdEwEB/wQCMAAwDgYDVR0PAQH/BAQDAgWgMB0G
A1UdJQQWMBQGCCsGAQUFBwMBBggrBgEFBQcDAjANBgkqhkiG9w0BAQsFAAOCAQEA
ZLJsSDfnqw1fq796la2eG4rvmiSSJjJ538572mwEy+onM7I3YLYCcB3WigGUzGCN
ZrCxxSjM8o0fxzsAC6lF0R8/TH2JGcIkbDs9AeKrxk2R6rzw9GX7piuY8coq3/as
kajp304mXNvu3fDab2+ZS1V9GtxwFH85PfToN5le5Hj5r32C5li3COCd50MldjtA
uxXXdP0pZ6kQXPiANQMEsd3Cw3WwajsDBVVoS51q0aBXwpaXYVZKOQseXYnxGLIx
QtPSAxwFS8aeZ+jBOyChneaQiUdMc6QtK5NdWgGhSI3eAOr7T2sV/ZGgQqTxNd05
Poj+ZRuLb3wyRtsDCQJiDw==
-----END CERTIFICATE-----`;

// --- Vector 2: EC P-256 root CA with CA:TRUE, keyCertSign --------------------
const CA_PEM = `-----BEGIN CERTIFICATE-----
MIIB8jCCAZegAwIBAgIHDw4NDAsKCTAKBggqhkjOPQQDAjBLMQswCQYDVQQGEwJV
UzEfMB0GA1UECgwWRXhhbXBsZSBUcnVzdCBTZXJ2aWNlczEbMBkGA1UEAwwSRXhh
bXBsZSBSb290IENBIEcyMB4XDTI2MDYyNjA0MjczNFoXDTQ2MDYyMTA0MjczNFow
SzELMAkGA1UEBhMCVVMxHzAdBgNVBAoMFkV4YW1wbGUgVHJ1c3QgU2VydmljZXMx
GzAZBgNVBAMMEkV4YW1wbGUgUm9vdCBDQSBHMjBZMBMGByqGSM49AgEGCCqGSM49
AwEHA0IABOvQQTIgxb2axTVyMiSs4GbhWQO/h8jl6pYNxrrm21WD77sAxqPiHas1
+T7BYlZ74IjlNAAlZMvrNSaxUxqqwaejZjBkMB0GA1UdDgQWBBTMe7JHyF6zi6Ak
8yMThCzHJiRdfDAfBgNVHSMEGDAWgBTMe7JHyF6zi6Ak8yMThCzHJiRdfDASBgNV
HRMBAf8ECDAGAQH/AgEBMA4GA1UdDwEB/wQEAwIBBjAKBggqhkjOPQQDAgNJADBG
AiEAg1pTWt9GSnsyn03xdIhoJvlvqI+FXN8p5jenUf4ctSsCIQDx/stJQP0ZYBvU
Qv8UuJv2xJN1yNSVSgrInpj1de6xTw==
-----END CERTIFICATE-----`;

export const X509_GOLDEN_VECTORS: X509GoldenVector[] = [
  {
    id: "rsa-leaf",
    description: "RSA-2048 leaf, SAN (2x DNS + IP), serverAuth/clientAuth EKU, CA:FALSE",
    pem: LEAF_PEM,
    expect: {
      version: 3,
      serialNumberHex: "1A:2B:3C:4D:5E:6F",
      subjectText: "CN=test.ronutz.com, OU=Arsenal, O=NTZ Technology, L=Sao Paulo, ST=Sao Paulo, C=BR",
      issuerText: "CN=test.ronutz.com, OU=Arsenal, O=NTZ Technology, L=Sao Paulo, ST=Sao Paulo, C=BR",
      notBefore: "2026-06-26T04:27:34Z",
      notAfter: "2036-06-23T04:27:34Z",
      signatureAlgorithm: "sha256WithRSAEncryption",
      keyAlgorithm: "RSA",
      keySizeBits: 2048,
      san: ["DNS:test.ronutz.com", "DNS:www.test.ronutz.com", "IP:192.0.2.10"],
      keyUsage: ["digitalSignature", "keyEncipherment"],
      extendedKeyUsage: ["serverAuth", "clientAuth"],
      ca: false,
      selfIssued: true,
    },
  },
  {
    id: "ec-ca",
    description: "EC P-256 root CA, CA:TRUE pathlen:1, keyCertSign/cRLSign",
    pem: CA_PEM,
    expect: {
      version: 3,
      serialNumberHex: "0F:0E:0D:0C:0B:0A:09",
      subjectText: "CN=Example Root CA G2, O=Example Trust Services, C=US",
      issuerText: "CN=Example Root CA G2, O=Example Trust Services, C=US",
      notBefore: "2026-06-26T04:27:34Z",
      notAfter: "2046-06-21T04:27:34Z",
      signatureAlgorithm: "ecdsa-with-SHA256",
      keyAlgorithm: "EC",
      curve: "P-256",
      keyUsage: ["keyCertSign", "cRLSign"],
      ca: true,
      pathLen: 1,
      selfIssued: true,
    },
  },
];

export interface X509RejectVector {
  id: string;
  description: string;
  input: string;
  code: X509DecodeErrorCode;
}

export const X509_REJECT_VECTORS: X509RejectVector[] = [
  { id: "empty", description: "empty string", input: "   ", code: "empty" },
  { id: "garbage", description: "neither PEM, base64, nor hex", input: "this is not a certificate !!!", code: "format" },
  { id: "bad-der", description: "valid base64 but the DER length overruns", input: "AQID", code: "der" },
  { id: "not-a-cert", description: "valid DER but a bare INTEGER, not a Certificate", input: "AgEF", code: "structure" },
];

/** A single failure from the self-check. */
export interface VectorFailure {
  vectorId: string;
  field: string;
  expected: string;
  actual: string;
}

/** Run every vector; returns counts and a list of mismatches (empty == all pass). */
export function verifyVectors(): { passed: number; failed: number; failures: VectorFailure[] } {
  const failures: VectorFailure[] = [];
  const eq = (id: string, field: string, expected: unknown, actual: unknown) => {
    const e = JSON.stringify(expected);
    const a = JSON.stringify(actual);
    if (e !== a) failures.push({ vectorId: id, field, expected: e, actual: a });
  };

  for (const v of X509_GOLDEN_VECTORS) {
    let d;
    try {
      d = decodeCertificate(v.pem);
    } catch (err) {
      failures.push({ vectorId: v.id, field: "<decode>", expected: "decoded", actual: String(err) });
      continue;
    }
    const x = v.expect;
    eq(v.id, "version", x.version, d.version);
    eq(v.id, "serialNumberHex", x.serialNumberHex, d.serialNumberHex);
    eq(v.id, "subjectText", x.subjectText, d.subject.text);
    eq(v.id, "issuerText", x.issuerText, d.issuer.text);
    eq(v.id, "notBefore", x.notBefore, d.validity.notBefore);
    eq(v.id, "notAfter", x.notAfter, d.validity.notAfter);
    eq(v.id, "signatureAlgorithm", x.signatureAlgorithm, d.signatureAlgorithm);
    eq(v.id, "keyAlgorithm", x.keyAlgorithm, d.publicKey.algorithm);
    if (x.keySizeBits !== undefined) eq(v.id, "keySizeBits", x.keySizeBits, d.publicKey.keySizeBits);
    if (x.curve !== undefined) eq(v.id, "curve", x.curve, d.publicKey.curve);
    if (x.san !== undefined) {
      const got = (d.extensions.subjectAltName?.entries ?? []).map((s) => `${s.type}:${s.value}`);
      eq(v.id, "san", x.san, got);
    }
    if (x.keyUsage !== undefined) eq(v.id, "keyUsage", x.keyUsage, d.extensions.keyUsage?.usages ?? []);
    if (x.extendedKeyUsage !== undefined)
      eq(v.id, "extendedKeyUsage", x.extendedKeyUsage, d.extensions.extendedKeyUsage?.purposes ?? []);
    if (x.ca !== undefined) eq(v.id, "ca", x.ca, d.extensions.basicConstraints?.ca);
    if (x.pathLen !== undefined) eq(v.id, "pathLen", x.pathLen, d.extensions.basicConstraints?.pathLen);
    eq(v.id, "selfIssued", x.selfIssued, d.selfIssued);
  }

  for (const r of X509_REJECT_VECTORS) {
    try {
      decodeCertificate(r.input);
      failures.push({ vectorId: r.id, field: "<reject>", expected: `throw ${r.code}`, actual: "no throw" });
    } catch (err) {
      const code = err instanceof X509DecodeError ? err.code : "(not X509DecodeError)";
      if (code !== r.code) failures.push({ vectorId: r.id, field: "<reject>", expected: r.code, actual: code });
    }
  }

  const total =
    X509_GOLDEN_VECTORS.length * 1 + X509_REJECT_VECTORS.length; // coarse pass counter
  return { passed: total - failures.length, failed: failures.length, failures };
}
