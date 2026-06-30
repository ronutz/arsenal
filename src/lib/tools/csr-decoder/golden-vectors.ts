// ============================================================================
// csr-decoder / golden-vectors.ts
// ----------------------------------------------------------------------------
// Known-answer vectors for the PKCS#10 decoder. Each CSR below was generated
// with OpenSSL 3.0 using fixed, documented parameters, so the expected fields
// are known *independently* of this tool's own parser - that is what makes
// them golden. verifyVectors() decodes each PEM and asserts those fields, so
// any regression in the ASN.1 walk is caught deterministically.
//
// Generation commands (for the record):
//   v1  openssl req -new -newkey rsa:2048 -nodes -subj "/C=BR/O=Example Org/CN=example.com"
//         -addext "subjectAltName=DNS:example.com,DNS:www.example.com,IP:192.0.2.10"
//         -addext "keyUsage=digitalSignature,keyEncipherment"
//         -addext "extendedKeyUsage=serverAuth,clientAuth"
//   v2  EC prime256v1 (P-256), subject "/CN=ec.example.net/O=EC Test"
//   v3  rsa:2048, subject "/CN=legacy.example.org",
//         challengePassword=SecretChallenge123, unstructuredName="Legacy CSR"
//   v4  Ed25519, subject "/CN=ed25519.example.com"
// ============================================================================

import { decodeCsr, type DecodedCsr } from "./compute";

/** Bump when the vector set changes in a way that invalidates cached results. */
export const GOLDEN_VECTOR_SET_ID = "csr-decoder/v1";

/** The fields a vector asserts. Only the present fields are checked. */
interface VectorExpect {
  subjectText: string;
  keyAlgorithm: string;
  keySizeBits?: number;
  curve?: string;
  exponent?: number;
  signatureAlgorithm: string;
  signatureBits?: number;
  version: number;
  hasExtensionRequest: boolean;
  san?: { type: string; value: string }[];
  keyUsage?: string[];
  extendedKeyUsage?: string[];
  challengePassword?: string;
  unstructuredName?: string;
}

interface GoldenVector {
  id: string;
  description: string;
  pem: string;
  expect: VectorExpect;
}

// --- v1: RSA-2048 with SAN, keyUsage and EKU --------------------------------
const V1_PEM = `-----BEGIN CERTIFICATE REQUEST-----
MIIC6jCCAdICAQAwOTELMAkGA1UEBhMCQlIxFDASBgNVBAoMC0V4YW1wbGUgT3Jn
MRQwEgYDVQQDDAtleGFtcGxlLmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCC
AQoCggEBANI2h6EE7lREjFqCOubcy5lI6hRXWXRcaOoh/wi6CMxPs7zyPNOG0Qby
h5xqbrZLWJHB5nKqnslN0o2mZJkXE7NG5HL2rYe40uIIS2Htz9MxEQoQN45mXGvK
7Dx0MwIOpO7O0k3Il3qCeW+pklaPksWTiw3IZAA0cjfvFqB2db5coPNNN03JxoAD
D8SHDMg9YKe8ZzW+wOWw8Xsliwbq7lqqVEGp0yxhQ5jLzTywu3QSI0Aq3CemNbof
pYWk3dGLiydxrKcoc8xVrnRkaTsc7lBjQUcJv+j88jrOg4q8yf+lNxF07fV51se0
h0LRM2hqO+UW7HU8FbZiqHH9eRpVzesCAwEAAaBsMGoGCSqGSIb3DQEJDjFdMFsw
LQYDVR0RBCYwJIILZXhhbXBsZS5jb22CD3d3dy5leGFtcGxlLmNvbYcEwAACCjAL
BgNVHQ8EBAMCBaAwHQYDVR0lBBYwFAYIKwYBBQUHAwEGCCsGAQUFBwMCMA0GCSqG
SIb3DQEBCwUAA4IBAQBiWE1zEfWdwfrqPDu6o5O+dXowrF839rDTl6wBTVKuiUbp
DAbdaxl1x/GvyU25DP0NkGcwEBMXCymRTv0+prBzoKz7zpLVUUdbFErU3jd7uqCb
MpgeuOMWWUg8mh5W/J/o6edWbtxK7bNMwEbLD0Y2iriG4dWlh2KUlGSdpb64eBED
+xTyCwt0tWfltRKfF1SOH1HbUeCZgLE+CVM0elMTuLPM1bk6dPIB04tRAQFfD5NX
I6/nCpf6ZA713IYaUzgI0s65pCF/Yi/P+qKbwX2Dtv1EKGvCxP+fj2l2Vb/VCaGG
2Pv9GFJb5zxpSrE/4iU4IyzVgKOUvMI18USW9PWJ
-----END CERTIFICATE REQUEST-----`;

// --- v2: EC P-256 -----------------------------------------------------------
const V2_PEM = `-----BEGIN CERTIFICATE REQUEST-----
MIHmMIGNAgEAMCsxFzAVBgNVBAMMDmVjLmV4YW1wbGUubmV0MRAwDgYDVQQKDAdF
QyBUZXN0MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEXoXL8iiiiuRIPWp5bH+r
J9+g0JXrcF7BbX8Qz/7k5uF6+i8jllyqNEUIU66pLmAjKV8p43nqGNTohv8DyJ0H
s6AAMAoGCCqGSM49BAMCA0gAMEUCIBh9LFnO0w2TTb2YelV2tlQIaTKYi04ZOJr5
G2ajV5OUAiEA/JyB2+pB51joYYKg5VGtPUgqrCR7+n+CufunytJC4u4=
-----END CERTIFICATE REQUEST-----`;

// --- v3: RSA-2048 with challengePassword + unstructuredName ------------------
const V3_PEM = `-----BEGIN CERTIFICATE REQUEST-----
MIICoDCCAYgCAQAwHTEbMBkGA1UEAwwSbGVnYWN5LmV4YW1wbGUub3JnMIIBIjAN
BgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0BnKzK/nQ9RZ3rSm4RURKvKCP71f
rDqsQIRyX4MC4MNBesx5EdLhDKagHY7V1wC4Zfh14l5bjpM6JFjiBMZB5boROQkd
RFAIbJIPW0wwc5H1m6d1Y5G1RFmEG9TWw6xRYzpUwoxpvcJiavrJp4/UluRU/BNQ
EjkbZlRgyJ3F475rxuLJukT7hzcwf09jfwamJa4OD3mwB7x/17gfjEw2Z3zSnH40
IAyOXcCaqDAy+afNS2vGBb26RmkICb+13yWRNDfkgK9RNijcSwjdH0V0U0e/10nf
F6gkMKsG9Pyj66rmxt3qcHP1q3BuqVC7+C7SCRof2dz3EDRScD+J7C7PSQIDAQAB
oD4wGQYJKoZIhvcNAQkCMQwMCkxlZ2FjeSBDU1IwIQYJKoZIhvcNAQkHMRQMElNl
Y3JldENoYWxsZW5nZTEyMzANBgkqhkiG9w0BAQsFAAOCAQEAne4jz1bJ0yV/Dh81
KchYl930mjguucVhBrZlcKyAltf1tYf2BPMSbGU9xkej+Lf5LRUC+3Mn+ziqATTy
XHdRpIWBPAQtMUP3DfP7SC/Qvtke9FZpXyivjB+0XRXdCytSe4QZkynPnAK2Ue+a
Z7WlCiCrhpv+RgOiO6nVH5TzT8YcwaWUu0wakN224KrpvAbb+As/4Mz2gdNBQ5ny
NtceKv461/u7l/1q1lPiV7vL5ywntvG5lDz2sJCzHpTaJ2AwZrj9f5ZyJQn3s43t
gNlt0rfo+HcAE3gMcIiWV75TSNSMpHMzc/jg0tQVT03NlQBBb4XE8OfNf/feYYgC
6Rz+Hw==
-----END CERTIFICATE REQUEST-----`;

// --- v4: Ed25519 ------------------------------------------------------------
const V4_PEM = `-----BEGIN CERTIFICATE REQUEST-----
MIGdMFECAQAwHjEcMBoGA1UEAwwTZWQyNTUxOS5leGFtcGxlLmNvbTAqMAUGAytl
cAMhAAYWsf+ml3oKhyD/YWW3gdjTrWwyKiJYq9UGMbnKTtfpoAAwBQYDK2VwA0EA
4TJjgztrU5nxn9CfBC/xAnyTU9RluGe47XDCw8Lfd4r9BsWSwBZGb40EyJqIQW9i
87/BOkqS4qXAScW8hlvZAg==
-----END CERTIFICATE REQUEST-----`;

const VECTORS: GoldenVector[] = [
  {
    id: "rsa2048-san-ku-eku",
    description: "RSA-2048 with SAN (2 DNS + IP), keyUsage and EKU",
    pem: V1_PEM,
    expect: {
      subjectText: "CN=example.com, O=Example Org, C=BR",
      keyAlgorithm: "RSA",
      keySizeBits: 2048,
      exponent: 65537,
      signatureAlgorithm: "sha256WithRSAEncryption",
      signatureBits: 2048,
      version: 0,
      hasExtensionRequest: true,
      san: [
        { type: "DNS", value: "example.com" },
        { type: "DNS", value: "www.example.com" },
        { type: "IP", value: "192.0.2.10" },
      ],
      keyUsage: ["digitalSignature", "keyEncipherment"],
      extendedKeyUsage: ["serverAuth", "clientAuth"],
    },
  },
  {
    id: "ec-p256",
    description: "EC P-256, simple subject, no extension request",
    pem: V2_PEM,
    expect: {
      subjectText: "O=EC Test, CN=ec.example.net",
      keyAlgorithm: "EC",
      curve: "P-256",
      signatureAlgorithm: "ecdsa-with-SHA256",
      version: 0,
      hasExtensionRequest: false,
    },
  },
  {
    id: "rsa2048-challenge-password",
    description: "RSA-2048 with challengePassword and unstructuredName",
    pem: V3_PEM,
    expect: {
      subjectText: "CN=legacy.example.org",
      keyAlgorithm: "RSA",
      keySizeBits: 2048,
      exponent: 65537,
      signatureAlgorithm: "sha256WithRSAEncryption",
      signatureBits: 2048,
      version: 0,
      hasExtensionRequest: false,
      challengePassword: "SecretChallenge123",
      unstructuredName: "Legacy CSR",
    },
  },
  {
    id: "ed25519",
    description: "Ed25519 key and signature",
    pem: V4_PEM,
    expect: {
      subjectText: "CN=ed25519.example.com",
      keyAlgorithm: "Ed25519",
      signatureAlgorithm: "Ed25519",
      signatureBits: 512,
      version: 0,
      hasExtensionRequest: false,
    },
  },
];

/** Shallow array-of-objects equality for SAN / usage lists. */
function listEq<T>(a: T[] | undefined, b: T[] | undefined): boolean {
  if (!a || !b) return a === b;
  if (a.length !== b.length) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Compare a decoded CSR against a vector's expectations; returns mismatch strings. */
function diff(d: DecodedCsr, e: VectorExpect): string[] {
  const out: string[] = [];
  const eq = (label: string, got: unknown, want: unknown) => {
    if (got !== want) out.push(`${label}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
  };
  eq("subjectText", d.subject.text, e.subjectText);
  eq("keyAlgorithm", d.publicKey.algorithm, e.keyAlgorithm);
  if (e.keySizeBits !== undefined) eq("keySizeBits", d.publicKey.keySizeBits, e.keySizeBits);
  if (e.curve !== undefined) eq("curve", d.publicKey.curve, e.curve);
  if (e.exponent !== undefined) eq("exponent", d.publicKey.exponent, e.exponent);
  eq("signatureAlgorithm", d.signatureAlgorithm, e.signatureAlgorithm);
  if (e.signatureBits !== undefined) eq("signatureBits", d.signatureBits, e.signatureBits);
  eq("version", d.version, e.version);
  eq("hasExtensionRequest", d.hasExtensionRequest, e.hasExtensionRequest);
  if (e.san && !listEq(d.requested.subjectAltName, e.san)) {
    out.push(`san: got ${JSON.stringify(d.requested.subjectAltName)}, want ${JSON.stringify(e.san)}`);
  }
  if (e.keyUsage && !listEq(d.requested.keyUsage, e.keyUsage)) {
    out.push(`keyUsage: got ${JSON.stringify(d.requested.keyUsage)}, want ${JSON.stringify(e.keyUsage)}`);
  }
  if (e.extendedKeyUsage && !listEq(d.requested.extendedKeyUsage, e.extendedKeyUsage)) {
    out.push(`extendedKeyUsage: got ${JSON.stringify(d.requested.extendedKeyUsage)}, want ${JSON.stringify(e.extendedKeyUsage)}`);
  }
  if (e.challengePassword !== undefined) eq("challengePassword", d.challengePassword, e.challengePassword);
  if (e.unstructuredName !== undefined) eq("unstructuredName", d.unstructuredName, e.unstructuredName);
  return out;
}

export interface VectorResult {
  passed: number;
  failed: number;
  total: number;
  failures: { id: string; problems: string[] }[];
}

/** Decode every vector and check its expectations. */
export function verifyVectors(): VectorResult {
  const failures: { id: string; problems: string[] }[] = [];
  for (const v of VECTORS) {
    try {
      const decoded = decodeCsr(v.pem);
      const problems = diff(decoded, v.expect);
      if (problems.length) failures.push({ id: v.id, problems });
    } catch (err) {
      failures.push({ id: v.id, problems: [`threw: ${(err as Error).message}`] });
    }
  }
  return {
    passed: VECTORS.length - failures.length,
    failed: failures.length,
    total: VECTORS.length,
    failures,
  };
}
