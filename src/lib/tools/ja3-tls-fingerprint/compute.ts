// ============================================================================
// src/lib/tools/ja3-tls-fingerprint/compute.ts
// ----------------------------------------------------------------------------
// Passive TLS client fingerprint (JA3 / JA3N). Pure, offline. Paste a JA3
// string - the five ClientHello fields, comma-separated, dash-delimited
// within each - and it recomputes the JA3 MD5, computes the permutation-stable
// JA3N (extensions sorted), decodes the fields, and flags GREASE values.
//
// Verified 2026-07-11 against Salesforce's JA3 specification (the fingerprint's
// origin): field order SSLVersion,Ciphers,Extensions,EllipticCurves,
// EllipticCurvePointFormats; commas between fields, dashes between values;
// empty fields left empty; GREASE values (RFC 8701) excluded; MD5 -> 32 hex.
// Two published Salesforce string->hash vectors are pinned as golden vectors.
// JA3N sorts the extension list to survive Chrome's extension permutation
// ("JA3 churn"); JA4 is the modern successor (see the JA4 decoder).
// ============================================================================

import { hashString } from "@/lib/tools/hash-preimage-finder/compute";

// RFC 8701 GREASE values (0x0a0a, 0x1a1a, ... 0xfafa) in decimal.
export const GREASE_VALUES = new Set<number>([2570, 6682, 10794, 14906, 19018, 23130, 27242, 31354, 35466, 39578, 43690, 47802, 51914, 56026, 60138, 64250]);

const TLS_VERSIONS: Record<number, string> = {
  768: "SSL 3.0",
  769: "TLS 1.0",
  770: "TLS 1.1",
  771: "TLS 1.2",
  772: "TLS 1.3",
};

export interface Ja3Result {
  ok: boolean;
  error?: string;
  version: number;
  versionName: string;
  ciphers: number[];
  extensions: number[];
  curves: number[];
  formats: number[];
  greaseFound: number[];
  ja3String: string; // rebuilt, GREASE-stripped string that is hashed
  ja3Hash: string;
  ja3nString: string; // extensions sorted ascending
  ja3nHash: string;
  permuted: boolean; // extensions were not already in ascending order
  counts: { ciphers: number; extensions: number; curves: number; formats: number };
}

function parseField(field: string): { values: number[]; grease: number[] } {
  const grease: number[] = [];
  const values: number[] = [];
  if (field.trim() === "") return { values, grease };
  for (const part of field.split("-")) {
    const t = part.trim();
    if (t === "") continue;
    const n = Number(t);
    if (!Number.isInteger(n)) continue;
    if (GREASE_VALUES.has(n)) grease.push(n);
    else values.push(n);
  }
  return { values, grease };
}

export function computeJa3(text: string): Ja3Result {
  const empty: Ja3Result = { ok: false, version: 0, versionName: "", ciphers: [], extensions: [], curves: [], formats: [], greaseFound: [], ja3String: "", ja3Hash: "", ja3nString: "", ja3nHash: "", permuted: false, counts: { ciphers: 0, extensions: 0, curves: 0, formats: 0 } };
  const t = text.trim();
  if (t === "") return { ...empty, error: "Paste a JA3 string (five comma-separated fields from the ClientHello)." };

  const fields = t.split(",");
  if (fields.length !== 5) {
    return { ...empty, error: `A JA3 string has exactly five comma-separated fields (version, ciphers, extensions, curves, point formats); this has ${fields.length}.` };
  }

  const version = Number(fields[0].trim());
  if (!Number.isInteger(version)) return { ...empty, error: "The first field (TLS version) must be a decimal integer, e.g. 771 for TLS 1.2." };

  const cip = parseField(fields[1]);
  const ext = parseField(fields[2]);
  const cur = parseField(fields[3]);
  const fmt = parseField(fields[4]);
  const greaseFound = [...cip.grease, ...ext.grease, ...cur.grease, ...fmt.grease];

  const rebuild = (extensions: number[]) => [String(version), cip.values.join("-"), extensions.join("-"), cur.values.join("-"), fmt.values.join("-")].join(",");

  const ja3String = rebuild(ext.values);
  const ja3Hash = hashString("md5", ja3String);

  const sortedExt = [...ext.values].sort((a, b) => a - b);
  const ja3nString = rebuild(sortedExt);
  const ja3nHash = hashString("md5", ja3nString);

  const permuted = sortedExt.join("-") !== ext.values.join("-");

  return {
    ok: true,
    version,
    versionName: TLS_VERSIONS[version] ?? `0x${version.toString(16)}`,
    ciphers: cip.values,
    extensions: ext.values,
    curves: cur.values,
    formats: fmt.values,
    greaseFound,
    ja3String,
    ja3Hash,
    ja3nString,
    ja3nHash,
    permuted,
    counts: { ciphers: cip.values.length, extensions: ext.values.length, curves: cur.values.length, formats: fmt.values.length },
  };
}

/** D-49 run entrypoint: a JA3 string. */
export function run(input: string): Ja3Result {
  return computeJa3(input);
}
