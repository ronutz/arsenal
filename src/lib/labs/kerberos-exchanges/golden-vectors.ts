// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/kerberos-exchanges/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the Kerberos exchanges lab (set 2026-10-26a). Each case is
// worked by hand from RFC 4120 (read 2026-10-26) and, for the AS exchange's
// time check and the acceptable skew, from Microsoft Learn (read the same day),
// and pins: each exchange's outcome, the error name, the two clock gaps, how
// the story ends, and every message part on the wire with the key that
// encrypts it. The edge cases are the skew boundary (equal is not "more
// than"), two clocks each within the skew of the KDC but beyond it of each
// other, and the order of the checks when two conditions fail at once. The
// reject vectors pin the stable error codes. verifyVectors() runs them all;
// scripts/run-golden-vectors runs it at prebuild and fails on any drift.
// ============================================================================

import { compute, DEFAULT_INPUT, EXAMPLE_INPUT, KerberosError, type KerberosErrorCode, type KerberosInput, type KerberosResult } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "kerberos-exchanges/2026-10-26a";

/** The scalar fields a case can pin. */
type Scalars = Omit<KerberosResult, "parts">;

/** A case the model must answer exactly so. */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings (changes from the opening state). */
  input: Partial<KerberosInput>;
  /** The scalar fields that must match. */
  expect: Partial<Scalars>;
  /** The parts as "MESSAGE part key" (with " earlier" when so), joined with " | ". */
  parts: string;
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings outside the lab's range (cast where the interface could never send them). */
  input: KerberosInput;
  /** The code the refusal must carry. */
  code: KerberosErrorCode;
}

/** The parts of a result as one string. */
function partsOf(r: KerberosResult): string {
  // Message, part, key, and the earlier flag.
  return r.parts.map((p) => `${p.message} ${p.part} ${p.key}${p.earlier ? " earlier" : ""}`).join(" | ");
}

/** The full exchange when everything holds (shared by several cases). */
const ALL_OK =
  "AS-REQ as-req-body none | AS-REQ pa-enc-timestamp client | AS-REP tgt tgs | AS-REP as-rep-enc client | TGS-REQ tgt tgs | TGS-REQ tgs-authenticator tgs-session | TGS-REQ tgs-req-body none | TGS-REP service-ticket service | TGS-REP tgs-rep-enc tgs-session | AP-REQ service-ticket service | AP-REQ ap-authenticator service-session | AP-REP ap-rep-enc service-session";
/** Everything up to the AP-REQ, then the service's error. */
const AP_FAILS =
  "AS-REQ as-req-body none | AS-REQ pa-enc-timestamp client | AS-REP tgt tgs | AS-REP as-rep-enc client | TGS-REQ tgt tgs | TGS-REQ tgs-authenticator tgs-session | TGS-REQ tgs-req-body none | TGS-REP service-ticket service | TGS-REP tgs-rep-enc tgs-session | AP-REQ service-ticket service | AP-REQ ap-authenticator service-session | KRB-ERROR krb-error none";
/** The AS exchange refused after an encrypted timestamp. */
const AS_SKEW = "AS-REQ as-req-body none | AS-REQ pa-enc-timestamp client | KRB-ERROR krb-error none";

/** The accept cases. */
export const KERBEROS_VECTORS: readonly AcceptVector[] = Object.freeze([
  // The opening state: clocks a minute either side of the KDC's (two minutes apart), every check passes.
  {
    id: "default-all-ok",
    input: {},
    expect: { as: "ok", tgs: "ok", ap: "ok", failedAt: null, error: null, kdcGap: 1, serviceGap: 2, outcome: "authenticated" },
    parts: ALL_OK,
  },
  // The Example: the client and the KDC agree, the service runs 7 minutes fast; the service refuses the authenticator (3.2.3).
  {
    id: "example-service-clock-fast",
    input: { clientOffset: 0, serviceOffset: 7 },
    expect: { as: "ok", tgs: "ok", ap: "failed", failedAt: "ap", error: "KRB_AP_ERR_SKEW", kdcGap: 0, serviceGap: 7, outcome: "failed" },
    parts: AP_FAILS,
  },
  // Each clock within 5 minutes of the KDC's, yet 6 minutes from each other: the AS and TGS pass, the service does not.
  {
    id: "both-within-kdc-but-apart",
    input: { clientOffset: 3, serviceOffset: -3 },
    expect: { as: "ok", tgs: "ok", ap: "failed", error: "KRB_AP_ERR_SKEW", kdcGap: 3, serviceGap: 6 },
    parts: AP_FAILS,
  },
  // The client 6 minutes fast: the KDC refuses its encrypted timestamp (Microsoft, event 4768).
  {
    id: "client-clock-fast",
    input: { clientOffset: 6, serviceOffset: 0 },
    expect: { as: "failed", tgs: "not-reached", ap: "not-reached", failedAt: "as", error: "KRB_AP_ERR_SKEW", kdcGap: 6, outcome: "failed" },
    parts: AS_SKEW,
  },
  // The client 6 minutes slow: the same, the gap is a magnitude.
  {
    id: "client-clock-slow",
    input: { clientOffset: -6, serviceOffset: -6 },
    expect: { as: "failed", error: "KRB_AP_ERR_SKEW", kdcGap: 6, serviceGap: 0 },
    parts: AS_SKEW,
  },
  // Exactly the skew is not "more than" it: everything passes.
  {
    id: "skew-boundary-equal",
    input: { clientOffset: 5, serviceOffset: 0 },
    expect: { as: "ok", tgs: "ok", ap: "ok", error: null, kdcGap: 5, serviceGap: 5, outcome: "authenticated" },
    parts: ALL_OK,
  },
  // A wider acceptable skew absorbs the Example's 7 minutes.
  {
    id: "wider-skew",
    input: { clientOffset: 0, serviceOffset: 7, skew: 10 },
    expect: { ap: "ok", error: null, outcome: "authenticated" },
    parts: ALL_OK,
  },
  // No pre-authentication where the KDC requires it: KDC_ERR_PREAUTH_REQUIRED (3.1.3).
  {
    id: "preauth-missing",
    input: { preauth: "missing" },
    expect: { as: "failed", tgs: "not-reached", ap: "not-reached", failedAt: "as", error: "KDC_ERR_PREAUTH_REQUIRED", outcome: "failed" },
    parts: "AS-REQ as-req-body none | KRB-ERROR krb-error none",
  },
  // No pre-authentication and a skewed clock: the missing pre-authentication is answered first, before any time is read.
  {
    id: "preauth-missing-and-skew",
    input: { preauth: "missing", clientOffset: 30 },
    expect: { as: "failed", error: "KDC_ERR_PREAUTH_REQUIRED", kdcGap: 30 },
    parts: "AS-REQ as-req-body none | KRB-ERROR krb-error none",
  },
  // An expired TGT: the TGS refuses it, and the client needs a new AS exchange (3.3).
  {
    id: "tgt-expired",
    input: { tickets: "tgt-expired" },
    expect: { as: "ok", tgs: "failed", ap: "not-reached", failedAt: "tgs", error: "KRB_AP_ERR_TKT_EXPIRED", outcome: "renew" },
    parts: "AS-REQ as-req-body none earlier | AS-REQ pa-enc-timestamp client earlier | AS-REP tgt tgs earlier | AS-REP as-rep-enc client earlier | TGS-REQ tgt tgs | TGS-REQ tgs-authenticator tgs-session | TGS-REQ tgs-req-body none | KRB-ERROR krb-error none",
  },
  // An expired TGT and an unregistered SPN: the ticket is checked before the server is looked up.
  {
    id: "tgt-expired-before-spn",
    input: { tickets: "tgt-expired", spn: "unregistered" },
    expect: { tgs: "failed", error: "KRB_AP_ERR_TKT_EXPIRED", outcome: "renew" },
    parts: "AS-REQ as-req-body none earlier | AS-REQ pa-enc-timestamp client earlier | AS-REP tgt tgs earlier | AS-REP as-rep-enc client earlier | TGS-REQ tgt tgs | TGS-REQ tgs-authenticator tgs-session | TGS-REQ tgs-req-body none | KRB-ERROR krb-error none",
  },
  // An expired service ticket: the service refuses it, and the client asks the TGS for a new one.
  {
    id: "service-ticket-expired",
    input: { tickets: "st-expired" },
    expect: { as: "ok", tgs: "ok", ap: "failed", failedAt: "ap", error: "KRB_AP_ERR_TKT_EXPIRED", outcome: "renew" },
    parts: "AS-REQ as-req-body none earlier | AS-REQ pa-enc-timestamp client earlier | AS-REP tgt tgs earlier | AS-REP as-rep-enc client earlier | TGS-REQ tgt tgs earlier | TGS-REQ tgs-authenticator tgs-session earlier | TGS-REQ tgs-req-body none earlier | TGS-REP service-ticket service earlier | TGS-REP tgs-rep-enc tgs-session earlier | AP-REQ service-ticket service | AP-REQ ap-authenticator service-session | KRB-ERROR krb-error none",
  },
  // An expired service ticket and a skewed service clock: the time is checked before the end time (3.2.3).
  {
    id: "skew-before-expiry",
    input: { tickets: "st-expired", clientOffset: 0, serviceOffset: -8 },
    expect: { ap: "failed", error: "KRB_AP_ERR_SKEW", serviceGap: 8, outcome: "failed" },
    parts: "AS-REQ as-req-body none earlier | AS-REQ pa-enc-timestamp client earlier | AS-REP tgt tgs earlier | AS-REP as-rep-enc client earlier | TGS-REQ tgt tgs earlier | TGS-REQ tgs-authenticator tgs-session earlier | TGS-REQ tgs-req-body none earlier | TGS-REP service-ticket service earlier | TGS-REP tgs-rep-enc tgs-session earlier | AP-REQ service-ticket service | AP-REQ ap-authenticator service-session | KRB-ERROR krb-error none",
  },
  // The SPN registered nowhere: the KDC cannot find the server (3.3.3, 7.5.9).
  {
    id: "spn-unregistered",
    input: { spn: "unregistered" },
    expect: { as: "ok", tgs: "failed", ap: "not-reached", failedAt: "tgs", error: "KDC_ERR_S_PRINCIPAL_UNKNOWN", outcome: "failed" },
    parts: "AS-REQ as-req-body none | AS-REQ pa-enc-timestamp client | AS-REP tgt tgs | AS-REP as-rep-enc client | TGS-REQ tgt tgs | TGS-REQ tgs-authenticator tgs-session | TGS-REQ tgs-req-body none | KRB-ERROR krb-error none",
  },
  // The SPN on another account: the KDC issues the ticket in that account's key; the service cannot decrypt it (3.2.3).
  {
    id: "spn-wrong-account",
    input: { spn: "wrong-account" },
    expect: { as: "ok", tgs: "ok", ap: "failed", failedAt: "ap", error: "KRB_AP_ERR_BAD_INTEGRITY", outcome: "failed" },
    parts: "AS-REQ as-req-body none | AS-REQ pa-enc-timestamp client | AS-REP tgt tgs | AS-REP as-rep-enc client | TGS-REQ tgt tgs | TGS-REQ tgs-authenticator tgs-session | TGS-REQ tgs-req-body none | TGS-REP service-ticket other | TGS-REP tgs-rep-enc tgs-session | AP-REQ service-ticket other | AP-REQ ap-authenticator service-session | KRB-ERROR krb-error none",
  },
  // The wrong account and a skewed service: the ticket is decrypted before the time is read.
  {
    id: "wrong-account-before-skew",
    input: { spn: "wrong-account", clientOffset: 0, serviceOffset: 9 },
    expect: { ap: "failed", error: "KRB_AP_ERR_BAD_INTEGRITY" },
    parts: "AS-REQ as-req-body none | AS-REQ pa-enc-timestamp client | AS-REP tgt tgs | AS-REP as-rep-enc client | TGS-REQ tgt tgs | TGS-REQ tgs-authenticator tgs-session | TGS-REQ tgs-req-body none | TGS-REP service-ticket other | TGS-REP tgs-rep-enc tgs-session | AP-REQ service-ticket other | AP-REQ ap-authenticator service-session | KRB-ERROR krb-error none",
  },
]);

/** The reject cases. */
export const KERBEROS_REJECTS: readonly RejectVector[] = Object.freeze([
  // A fraction of a minute.
  { id: "offset-fraction", input: { ...DEFAULT_INPUT, clientOffset: 1.5 }, code: "bad-offset" },
  // More than a day.
  { id: "offset-too-large", input: { ...DEFAULT_INPUT, serviceOffset: 2000 }, code: "bad-offset" },
  // A skew of zero minutes.
  { id: "skew-zero", input: { ...DEFAULT_INPUT, skew: 0 }, code: "bad-skew" },
  // A choice the controls cannot produce.
  { id: "bad-spn", input: { ...DEFAULT_INPUT, spn: "duplicate" as unknown as "registered" }, code: "bad-choice" },
]);

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // The Example button must load the Example vector's settings.
  const ex = KERBEROS_VECTORS.find((v) => v.id === "example-service-clock-fast");
  // Compared through JSON (flat objects).
  if (!ex || JSON.stringify({ ...DEFAULT_INPUT, ...ex.input }) !== JSON.stringify(EXAMPLE_INPUT)) failures.push("EXAMPLE_INPUT differs from the example vector");
  // Each accept case: compute, compare every expected field, then the parts.
  for (const v of KERBEROS_VECTORS) {
    // The model's answer for the opening state with the case's changes.
    const got = compute({ ...DEFAULT_INPUT, ...v.input });
    // Each expected scalar in turn.
    for (const [k, want] of Object.entries(v.expect)) {
      // The answer's value for that field.
      const have = got[k as keyof Scalars];
      // A difference is a failure naming the case and the field.
      if (have !== want) failures.push(`${v.id}: ${k} is ${String(have)}, expected ${String(want)}`);
    }
    // The parts on the wire.
    const p = partsOf(got);
    // A difference is a failure showing both.
    if (p !== v.parts) failures.push(`${v.id}: parts are "${p}", expected "${v.parts}"`);
  }
  // Each reject case: it must throw with the right code.
  for (const r of KERBEROS_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof KerberosError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report in the shape the runner reads (the Example check counts as one).
  const total = KERBEROS_VECTORS.length + KERBEROS_REJECTS.length + 1;
  // Passed is everything that did not fail (a case can fail on several fields, so floor at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
