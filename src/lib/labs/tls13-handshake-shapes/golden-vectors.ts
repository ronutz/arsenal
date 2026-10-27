// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/tls13-handshake-shapes/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the TLS 1.3 handshake shapes lab (set 2026-10-26a). Each
// case is worked by hand from RFC 9846 (read 2026-10-26) and pinned message by
// message: the flight, the sender, the extensions, the keys, and whether the
// message is optional or discarded. Four cases reproduce the RFC's own figures
// exactly (Figure 1 without client authentication, Figure 2, the subsequent
// handshake of Figure 3, Figure 4); the others follow the rules compute.ts
// lists (psk_ke, a declined PSK, refused 0-RTT, the abort, the forbidden
// CertificateRequest). The reject vector pins the stable error code.
// verifyVectors() runs them all; scripts/run-golden-vectors runs it at
// prebuild and fails the build on any drift.
// ============================================================================

import { compute, Tls13Error, type FlightMessage, type Tls13ErrorCode, type Tls13Input, type Tls13Result } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "tls13-handshake-shapes/2026-10-26a";

/** The scalar fields a case can pin. */
type Scalars = Omit<Tls13Result, "messages">;

/** A case the model must answer exactly so. */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings. */
  input: Tls13Input;
  /** The scalar fields that must match. */
  expect: Partial<Scalars>;
  /** The messages, as shape() writes them, joined with " | ". */
  shape: string;
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings outside the lab's range (cast, as the interface could never send them). */
  input: Tls13Input;
  /** The code the refusal must carry. */
  code: Tls13ErrorCode;
}

/** One message as a short stable string: flight, sender, name, extensions, keys, flags. */
function shapeOf(m: FlightMessage): string {
  // The extensions, when there are any.
  const ext = m.ext.length ? `+${m.ext.join(",")}` : "";
  // The flags, when set.
  const flags = `${m.optional ? " optional" : ""}${m.discarded ? " discarded" : ""}`;
  // Flight and sender, name, keys, flags.
  return `${m.flight}${m.from === "client" ? "C" : "S"} ${m.name}${ext} ${m.keys}${flags}`;
}

/** Every message of a result, in order, as one string. */
export function shape(r: Tls13Result): string {
  // Joined with a separator that never appears inside a message.
  return r.messages.map(shapeOf).join(" | ");
}

/** The accept cases. */
export const TLS13_VECTORS: readonly AcceptVector[] = Object.freeze([
  // RFC 9846 Figure 1 without client authentication: one round trip, a certificate, (EC)DHE.
  {
    id: "full-1rtt",
    input: { offer: "full", keyShare: "match", pskAnswer: "dhe", earlyAnswer: "accept", clientCert: false },
    expect: { aborted: false, keyExchange: "dhe-cert", pskOffered: false, pskUsed: false, share: "used", retry: false, early: "not-offered", clientAuth: "not-requested", serverCert: true, forwardSecret: true, roundTrips: 1, flights: 3 },
    shape: "1C ClientHello+key_share plaintext | 2S ServerHello+key_share plaintext | 2S EncryptedExtensions handshake | 2S Certificate handshake | 2S CertificateVerify handshake | 2S Finished handshake | 2S ApplicationData application optional | 3C Finished handshake | 3C ApplicationData application",
  },
  // RFC 9846 Figure 1 with client authentication: CertificateRequest after EncryptedExtensions, the client's Certificate and CertificateVerify before its Finished.
  {
    id: "full-client-cert",
    input: { offer: "full", keyShare: "match", pskAnswer: "dhe", earlyAnswer: "accept", clientCert: true },
    expect: { clientAuth: "requested", serverCert: true, roundTrips: 1, flights: 3 },
    shape: "1C ClientHello+key_share plaintext | 2S ServerHello+key_share plaintext | 2S EncryptedExtensions handshake | 2S CertificateRequest handshake | 2S Certificate handshake | 2S CertificateVerify handshake | 2S Finished handshake | 2S ApplicationData application optional | 3C Certificate handshake | 3C CertificateVerify handshake | 3C Finished handshake | 3C ApplicationData application",
  },
  // RFC 9846 Figure 2: the HelloRetryRequest and the second ClientHello add a round trip.
  {
    id: "full-retry",
    input: { offer: "full", keyShare: "retry", pskAnswer: "dhe", earlyAnswer: "accept", clientCert: true },
    expect: { share: "retry", retry: true, clientAuth: "requested", roundTrips: 2, flights: 5 },
    shape: "1C ClientHello+key_share plaintext | 2S HelloRetryRequest+key_share plaintext | 3C ClientHello+key_share plaintext | 4S ServerHello+key_share plaintext | 4S EncryptedExtensions handshake | 4S CertificateRequest handshake | 4S Certificate handshake | 4S CertificateVerify handshake | 4S Finished handshake | 4S ApplicationData application optional | 5C Certificate handshake | 5C CertificateVerify handshake | 5C Finished handshake | 5C ApplicationData application",
  },
  // No group in common and a full handshake needs one: the server aborts after the first ClientHello (4.2.1).
  {
    id: "full-no-common-group",
    input: { offer: "full", keyShare: "none", pskAnswer: "dhe", earlyAnswer: "accept", clientCert: false },
    expect: { aborted: true, keyExchange: null, share: "abort", retry: false, early: "not-offered", serverCert: false, forwardSecret: null, roundTrips: null, flights: 1 },
    shape: "1C ClientHello+key_share plaintext",
  },
  // RFC 9846 Figure 3, subsequent handshake: PSK with (EC)DHE, no Certificate or CertificateVerify.
  {
    id: "psk-dhe",
    input: { offer: "psk", keyShare: "match", pskAnswer: "dhe", earlyAnswer: "accept", clientCert: false },
    expect: { keyExchange: "psk-dhe", pskOffered: true, pskUsed: true, share: "used", early: "not-offered", serverCert: false, forwardSecret: true, roundTrips: 1, flights: 3 },
    shape: "1C ClientHello+key_share,psk_key_exchange_modes,pre_shared_key plaintext | 2S ServerHello+key_share,pre_shared_key plaintext | 2S EncryptedExtensions handshake | 2S Finished handshake | 2S ApplicationData application optional | 3C Finished handshake | 3C ApplicationData application",
  },
  // psk_ke: no key_share from the server, no forward secrecy, and groups with nothing in common are not fatal (4.2.1, 4.3.9).
  {
    id: "psk-only-no-common-group",
    input: { offer: "psk", keyShare: "none", pskAnswer: "psk-only", earlyAnswer: "accept", clientCert: false },
    expect: { aborted: false, keyExchange: "psk-only", share: "not-needed", retry: false, forwardSecret: false, roundTrips: 1, flights: 3 },
    shape: "1C ClientHello+key_share,psk_key_exchange_modes,pre_shared_key plaintext | 2S ServerHello+pre_shared_key plaintext | 2S EncryptedExtensions handshake | 2S Finished handshake | 2S ApplicationData application optional | 3C Finished handshake | 3C ApplicationData application",
  },
  // psk_ke again: shares that would need a retry do not matter when the server sends no key_share.
  {
    id: "psk-only-ignores-retry",
    input: { offer: "psk", keyShare: "retry", pskAnswer: "psk-only", earlyAnswer: "accept", clientCert: false },
    expect: { share: "not-needed", retry: false, roundTrips: 1, flights: 3 },
    shape: "1C ClientHello+key_share,psk_key_exchange_modes,pre_shared_key plaintext | 2S ServerHello+pre_shared_key plaintext | 2S EncryptedExtensions handshake | 2S Finished handshake | 2S ApplicationData application optional | 3C Finished handshake | 3C ApplicationData application",
  },
  // A declined PSK falls back to a full handshake on the client's key_share (2.2).
  {
    id: "psk-declined",
    input: { offer: "psk", keyShare: "match", pskAnswer: "decline", earlyAnswer: "accept", clientCert: false },
    expect: { keyExchange: "dhe-cert", pskOffered: true, pskUsed: false, serverCert: true, forwardSecret: true, roundTrips: 1 },
    shape: "1C ClientHello+key_share,psk_key_exchange_modes,pre_shared_key plaintext | 2S ServerHello+key_share plaintext | 2S EncryptedExtensions handshake | 2S Certificate handshake | 2S CertificateVerify handshake | 2S Finished handshake | 2S ApplicationData application optional | 3C Finished handshake | 3C ApplicationData application",
  },
  // A resumption PSK forbids the CertificateRequest in the main handshake (4.4.2).
  {
    id: "psk-forbids-client-cert",
    input: { offer: "psk", keyShare: "match", pskAnswer: "dhe", earlyAnswer: "accept", clientCert: true },
    expect: { clientAuth: "forbidden-psk", serverCert: false, roundTrips: 1 },
    shape: "1C ClientHello+key_share,psk_key_exchange_modes,pre_shared_key plaintext | 2S ServerHello+key_share,pre_shared_key plaintext | 2S EncryptedExtensions handshake | 2S Finished handshake | 2S ApplicationData application optional | 3C Finished handshake | 3C ApplicationData application",
  },
  // RFC 9846 Figure 4: 0-RTT accepted, EndOfEarlyData under the early keys, zero round trips.
  {
    id: "zero-rtt-accepted",
    input: { offer: "psk-0rtt", keyShare: "match", pskAnswer: "dhe", earlyAnswer: "accept", clientCert: false },
    expect: { early: "accepted", keyExchange: "psk-dhe", roundTrips: 0, flights: 3 },
    shape: "1C ClientHello+early_data,key_share,psk_key_exchange_modes,pre_shared_key plaintext | 1C ApplicationData early | 2S ServerHello+key_share,pre_shared_key plaintext | 2S EncryptedExtensions+early_data handshake | 2S Finished handshake | 2S ApplicationData application optional | 3C EndOfEarlyData early | 3C Finished handshake | 3C ApplicationData application",
  },
  // 0-RTT refused by the server: the early records are discarded and there is no EndOfEarlyData (4.3.10, 4.6).
  {
    id: "zero-rtt-refused",
    input: { offer: "psk-0rtt", keyShare: "match", pskAnswer: "dhe", earlyAnswer: "reject", clientCert: false },
    expect: { early: "rejected-by-server", pskUsed: true, roundTrips: 1, flights: 3 },
    shape: "1C ClientHello+early_data,key_share,psk_key_exchange_modes,pre_shared_key plaintext | 1C ApplicationData early discarded | 2S ServerHello+key_share,pre_shared_key plaintext | 2S EncryptedExtensions handshake | 2S Finished handshake | 2S ApplicationData application optional | 3C Finished handshake | 3C ApplicationData application",
  },
  // 0-RTT with a declined PSK: the server must select the first PSK to accept early data, so it cannot (4.3.10).
  {
    id: "zero-rtt-psk-declined",
    input: { offer: "psk-0rtt", keyShare: "match", pskAnswer: "decline", earlyAnswer: "accept", clientCert: false },
    expect: { early: "rejected-psk-declined", pskUsed: false, serverCert: true, keyExchange: "dhe-cert", roundTrips: 1 },
    shape: "1C ClientHello+early_data,key_share,psk_key_exchange_modes,pre_shared_key plaintext | 1C ApplicationData early discarded | 2S ServerHello+key_share plaintext | 2S EncryptedExtensions handshake | 2S Certificate handshake | 2S CertificateVerify handshake | 2S Finished handshake | 2S ApplicationData application optional | 3C Finished handshake | 3C ApplicationData application",
  },
  // The Example: 0-RTT offered, the key share misses, the retry rejects the early data and costs a round trip (4.2.2).
  {
    id: "zero-rtt-retry",
    input: { offer: "psk-0rtt", keyShare: "retry", pskAnswer: "dhe", earlyAnswer: "accept", clientCert: false },
    expect: { early: "rejected-retry", retry: true, pskUsed: true, keyExchange: "psk-dhe", roundTrips: 2, flights: 5 },
    shape: "1C ClientHello+early_data,key_share,psk_key_exchange_modes,pre_shared_key plaintext | 1C ApplicationData early discarded | 2S HelloRetryRequest+key_share plaintext | 3C ClientHello+key_share,psk_key_exchange_modes,pre_shared_key plaintext | 4S ServerHello+key_share,pre_shared_key plaintext | 4S EncryptedExtensions handshake | 4S Finished handshake | 4S ApplicationData application optional | 5C Finished handshake | 5C ApplicationData application",
  },
  // psk_dhe_ke with no group in common: the key exchange needs a group, so the server aborts and the early data is lost.
  {
    id: "zero-rtt-abort",
    input: { offer: "psk-0rtt", keyShare: "none", pskAnswer: "dhe", earlyAnswer: "accept", clientCert: false },
    expect: { aborted: true, early: "lost-abort", keyExchange: null, roundTrips: null, flights: 1 },
    shape: "1C ClientHello+early_data,key_share,psk_key_exchange_modes,pre_shared_key plaintext | 1C ApplicationData early discarded",
  },
]);

/** The reject cases. */
export const TLS13_REJECTS: readonly RejectVector[] = Object.freeze([
  // An offer the control cannot produce.
  { id: "bad-offer", input: { offer: "tls12" as unknown as "full", keyShare: "match", pskAnswer: "dhe", earlyAnswer: "accept", clientCert: false }, code: "bad-choice" },
]);

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // Each accept case: compute, compare every expected field, then the messages.
  for (const v of TLS13_VECTORS) {
    // The model's answer.
    const got = compute(v.input);
    // Each expected scalar in turn.
    for (const [k, want] of Object.entries(v.expect)) {
      // The answer's value for that field.
      const have = got[k as keyof Scalars];
      // A difference is a failure naming the case and the field.
      if (have !== want) failures.push(`${v.id}: ${k} is ${String(have)}, expected ${String(want)}`);
    }
    // The message sequence, compared as one string.
    const s = shape(got);
    // A different sequence is a failure showing both.
    if (s !== v.shape) failures.push(`${v.id}: messages are "${s}", expected "${v.shape}"`);
  }
  // Each reject case: it must throw with the right code.
  for (const r of TLS13_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof Tls13Error ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report in the shape the runner reads.
  const total = TLS13_VECTORS.length + TLS13_REJECTS.length;
  // Passed is everything that did not fail (a case can fail on several fields, so floor at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
