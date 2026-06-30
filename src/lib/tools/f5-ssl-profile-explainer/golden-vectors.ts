// ============================================================================
// src/lib/tools/f5-ssl-profile-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// Fixed input -> expected-property pairs that pin the explainer's behavior.
// These are an explainer, not a codec, so each vector asserts the meaningful
// derived facts (profile type, the protocol matrix, key findings, identity)
// rather than a byte-for-byte blob.
// ============================================================================

import { explainSslProfile } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "f5-ssl-profile-explainer-golden-2026-06-29";

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
  return {
    setId: GOLDEN_VECTOR_SET_ID,
    total: GOLDEN_VECTORS.length,
    passed: GOLDEN_VECTORS.length - failures.length,
    failures,
  };
}
