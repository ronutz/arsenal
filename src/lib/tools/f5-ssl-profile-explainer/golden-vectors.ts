// ============================================================================
// src/lib/tools/f5-ssl-profile-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// Fixed input -> expected-property pairs that pin the explainer's behavior.
// These are an explainer, not a codec, so each vector asserts the meaningful
// derived facts (profile type, the protocol matrix, key findings, identity)
// rather than a byte-for-byte blob.
//
// SHARE vectors (2026-10-27): the copy a Share results link carries
// (shareableProfile), byte for byte: every pass-phrase value replaced, nothing
// else changed, and the receiving page reading the same profile (the same
// type, protocols, findings and cert-key-chain entries, pass-phrase flags
// included).
// ============================================================================

import { explainSslProfile, shareableProfile } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "f5-ssl-profile-explainer-golden-2026-10-27"; // 2026-10-27: the Share results copy (was -2026-06-29)

export interface SslVector {
  id: string;
  input: string;
  expect: {
    profileType: "client-ssl" | "server-ssl";
    name: string | null;
    /** Versions whose no-* flag IS present (disabled). */
    disabled?: string[];
    /** Versions whose no-* flag is absent (permitted). */
    permitted?: string[];
    /** Finding titles that must appear. */
    findings?: string[];
    /** cert-key-chain entry names. */
    ckcNames?: string[];
    cipherMode?: "string" | "group" | "none";
  };
}

export const GOLDEN_VECTORS: SslVector[] = [
  {
    id: "modern-secure-clientssl",
    input: `ltm profile client-ssl /Common/web_clientssl {
      cert-key-chain { rsa { cert /Common/www.crt key /Common/www.key chain /Common/int.crt } }
      cipher-group /Common/f5-secure
      ciphers none
      options { dont-insert-empty-fragments cipher-server-preference no-sslv3 no-tlsv1 no-tlsv1.1 }
      renegotiation disabled
      secure-renegotiation require
      server-name www.example.com
      sni-default true
      ocsp-stapling enabled
    }`,
    expect: {
      profileType: "client-ssl",
      name: "web_clientssl",
      disabled: ["SSLv3", "TLSv1.0", "TLSv1.1"],
      permitted: ["TLSv1.2", "TLSv1.3"],
      ckcNames: ["rsa"],
      cipherMode: "group",
      findings: ["Chain bundle present", "Server cipher preference is set"],
    },
  },
  {
    id: "legacy-insecure-clientssl",
    input: `ltm profile client-ssl /Common/legacy {
      cert /Common/old.crt key /Common/old.key chain none
      ciphers DEFAULT
      options { dont-insert-empty-fragments }
      renegotiation enabled
      secure-renegotiation request
    }`,
    expect: {
      profileType: "client-ssl",
      name: "legacy",
      permitted: ["SSLv3", "TLSv1.0", "TLSv1.1", "TLSv1.2", "TLSv1.3"],
      cipherMode: "string",
      findings: [
        "SSLv3 is not disabled",
        "TLSv1.0 is not disabled",
        "TLSv1.1 is not disabled",
        "No intermediate chain configured",
        "secure-renegotiation is request, not require",
      ],
    },
  },
  {
    id: "serverssl-no-validation",
    input: `ltm profile server-ssl /Common/backend {
      ciphers DEFAULT
      options { dont-insert-empty-fragments no-tlsv1 no-tlsv1.1 }
      peer-cert-mode ignore
    }`,
    expect: {
      profileType: "server-ssl",
      name: "backend",
      disabled: ["TLSv1.0", "TLSv1.1"],
      findings: ["Backend server certificate is not validated"],
    },
  },
  {
    id: "mtls-require-clientssl",
    input: `ltm profile client-ssl /Common/mtls {
      cert-key-chain { default { cert /Common/s.crt key /Common/s.key chain /Common/int.crt } }
      ciphers DEFAULT
      options { dont-insert-empty-fragments no-sslv3 no-tlsv1 no-tlsv1.1 }
      peer-cert-mode require
      ca-file /Common/client-ca-bundle.crt
      secure-renegotiation require
    }`,
    expect: {
      profileType: "client-ssl",
      name: "mtls",
      disabled: ["SSLv3", "TLSv1.0", "TLSv1.1"],
      ckcNames: ["default"],
      findings: ["Chain bundle present"],
    },
  },
];

/** One share vector: a pasted profile, the exact copy, how many values it replaced, and what must not survive. */
export interface ShareVector {
  id: string; // the vector's name
  input: string; // the profile as pasted
  expect: string; // the copy, exactly
  redacted: number; // values replaced
  secrets: string[]; // values that must not survive
}

/** The share vectors (Share results, 2026-10-27). */
export const SHARE_VECTORS: ShareVector[] = [
  // The Example (the first golden vector): no pass phrase, the copy is the paste.
  { id: "share-example-unchanged", input: GOLDEN_VECTORS[0].input, expect: GOLDEN_VECTORS[0].input, redacted: 0, secrets: [] },
  // A cert-key-chain entry with an encrypted pass phrase, as tmsh lists it.
  {
    id: "share-ckc-passphrase",
    input: "ltm profile client-ssl /Common/app_clientssl {\n    cert-key-chain { app { cert /Common/app.crt key /Common/app.key chain /Common/int.crt passphrase $M$Lb$Zm9yLWRlbW8tb25seQ== } }\n    options { no-tlsv1.3 no-sslv3 no-tlsv1 no-tlsv1.1 }\n}",
    expect: "ltm profile client-ssl /Common/app_clientssl {\n    cert-key-chain { app { cert /Common/app.crt key /Common/app.key chain /Common/int.crt passphrase [redacted] } }\n    options { no-tlsv1.3 no-sslv3 no-tlsv1 no-tlsv1.1 }\n}",
    redacted: 1,
    secrets: ["$M$Lb$Zm9yLWRlbW8tb25seQ=="],
  },
  // A top-level pass phrase in quotes, the forward proxy CA's pass phrase, and a "none" that stays.
  {
    id: "share-top-level-and-proxy-ca",
    input: "ltm profile server-ssl /Common/backend_serverssl {\n    cert /Common/client.crt\n    key /Common/client.key\n    passphrase \"lab only phrase\"\n    proxy-ca-passphrase $M$Qx$cHJveHktY2EtZGVtbw==\n    proxy-ca-key none\n}",
    expect: "ltm profile server-ssl /Common/backend_serverssl {\n    cert /Common/client.crt\n    key /Common/client.key\n    passphrase [redacted]\n    proxy-ca-passphrase [redacted]\n    proxy-ca-key none\n}",
    redacted: 2,
    secrets: ["lab only phrase", "$M$Qx$cHJveHktY2EtZGVtbw=="],
  },
  // "passphrase none": no pass phrase, nothing to replace.
  { id: "share-passphrase-none", input: "ltm profile client-ssl /Common/x {\n    passphrase none\n}", expect: "ltm profile client-ssl /Common/x {\n    passphrase none\n}", redacted: 0, secrets: [] },
];

export interface VerifyReport {
  setId: string;
  total: number;
  passed: number;
  failures: { id: string; reason: string }[];
}

export function verifyVectors(): VerifyReport {
  const failures: { id: string; reason: string }[] = [];
  for (const v of GOLDEN_VECTORS) {
    try {
      const r = explainSslProfile(v.input);
      const e = v.expect;
      if (r.profileType !== e.profileType)
        failures.push({ id: v.id, reason: `profileType ${r.profileType} != ${e.profileType}` });
      if (r.name !== e.name) failures.push({ id: v.id, reason: `name ${r.name} != ${e.name}` });
      const off = new Set(r.protocols.filter((p) => !p.enabled).map((p) => p.name));
      const on = new Set(r.protocols.filter((p) => p.enabled).map((p) => p.name));
      for (const d of e.disabled ?? [])
        if (!off.has(d)) failures.push({ id: v.id, reason: `expected ${d} disabled` });
      for (const p of e.permitted ?? [])
        if (!on.has(p)) failures.push({ id: v.id, reason: `expected ${p} permitted` });
      const titles = new Set(r.findings.map((f) => f.title));
      for (const t of e.findings ?? [])
        if (!titles.has(t)) failures.push({ id: v.id, reason: `missing finding: ${t}` });
      if (e.ckcNames) {
        const names = r.certKeyChains.map((c) => c.name);
        for (const n of e.ckcNames)
          if (!names.includes(n)) failures.push({ id: v.id, reason: `missing ckc: ${n}` });
      }
      if (e.cipherMode && r.ciphers.mode !== e.cipherMode)
        failures.push({ id: v.id, reason: `cipherMode ${r.ciphers.mode} != ${e.cipherMode}` });
    } catch (err) {
      failures.push({ id: v.id, reason: `threw: ${(err as Error).message}` });
    }
  }
  // The share vectors (2026-10-27).
  for (const v of SHARE_VECTORS) {
    // The engine's copy.
    const got = shareableProfile(v.input);
    // Byte for byte, with the count.
    if (got.text !== v.expect || got.redacted !== v.redacted) failures.push({ id: v.id, reason: `copy ${JSON.stringify(got).slice(0, 160)}` });
    // No listed secret survives.
    for (const sec of v.secrets) if (got.text.includes(sec)) failures.push({ id: v.id, reason: `the copy still holds ${sec}` });
    // The receiving page reads the same profile: type, name, protocols, findings and cert-key-chain entries.
    try {
      // The facts that matter, from the paste and from the copy.
      const facts = (s: string) => { const r = explainSslProfile(s); return JSON.stringify([r.profileType, r.name, r.protocols, r.findings.map((f) => f.title), r.certKeyChains]); };
      // Equal, or the copy changed the reading.
      if (facts(got.text) !== facts(v.input)) failures.push({ id: v.id, reason: "the receiving page reads another profile" });
    } catch (err) {
      // An explainer refusal must be the same on both sides; a copy that throws where the paste did not is a failure.
      failures.push({ id: v.id, reason: `threw: ${(err as Error).message}` });
    }
  }
  // Every vector, golden and share.
  const total = GOLDEN_VECTORS.length + SHARE_VECTORS.length;
  return {
    setId: GOLDEN_VECTOR_SET_ID,
    total, // golden and share vectors
    passed: total - new Set(failures.map((f) => f.id)).size, // a vector with several failures counts once
    failures,
  };
}
