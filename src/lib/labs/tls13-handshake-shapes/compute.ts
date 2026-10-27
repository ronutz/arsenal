// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/tls13-handshake-shapes/compute.ts
// ----------------------------------------------------------------------------
// THE TLS 1.3 HANDSHAKE SHAPES LAB'S MODEL (2026-10-26), the interactive
// companion of the article "TLS 1.2 vs TLS 1.3 vs DTLS vs QUIC". The reader
// sets the conditions of one TLS 1.3 connection: what the client offers (a full
// handshake, a resumption PSK, or a PSK with 0-RTT early data), whether its key
// shares fit the server's groups, how the server answers the PSK and the early
// data, and whether the server wants a client certificate. The model lays out
// the flights in order, the keys that protect each message, and the round trips
// before the client's application data counts.
//
// Every rule is RFC 9846 (July 2026, which obsoletes RFC 8446; read from
// www.rfc-editor.org on 2026-10-26, status Proposed Standard, not obsoleted or
// updated; its one verified erratum, 9040, touches Appendix E.2 only). Section
// numbers are RFC 9846's own (they moved by one against RFC 8446: key exchange
// messages are 4.2, extensions 4.3, CertificateRequest 4.4.2):
//   - A full handshake uses (EC)DHE and a certificate; the server's share must
//     be in a group of one of the client's shares (2, 4.2.1, 4.3.8).
//   - Shares only in groups the server will not use, while supported_groups
//     names one it accepts: the server sends a HelloRetryRequest naming that
//     group and the client sends a second ClientHello with one share for it
//     (2.1, 4.2.1, 4.2.4, 4.3.8). No group in common when the key exchange
//     needs one: the server aborts with handshake_failure or
//     insufficient_security (4.2.1).
//   - A PSK offer carries psk_key_exchange_modes; psk_dhe_ke adds a key_share
//     (forward secrecy kept), psk_ke has none (no forward secrecy for the
//     application data) and makes group overlap irrelevant (2.2, 4.2.1,
//     4.3.9). A server that accepts a PSK sends no Certificate or
//     CertificateVerify (2.2, 4.2.1, 4.5.1); one that declines it falls back
//     to a full handshake on the client's key_share (2.2, 4.3.11).
//   - A server authenticating with a resumption PSK must not send a
//     CertificateRequest in the main handshake (4.4.2, 4.5).
//   - Early data is sent under the client_early_traffic_secret; it is accepted
//     only when the server selected the first PSK offered and says so with
//     early_data in EncryptedExtensions, after which the client sends
//     EndOfEarlyData under the same keys (2.3, 4.3.10, 4.6). It is not
//     permitted after a HelloRetryRequest (4.2.2, 4.3.10). A rejecting server
//     discards the records; the application may resend the data after the
//     handshake (4.3.10).
//   - ClientHello, HelloRetryRequest and ServerHello travel unprotected;
//     everything after the ServerHello is under handshake traffic keys until
//     each side's Finished, then under application traffic keys; the server
//     may send application data right after its first flight (2, 4.4, 4.5,
//     4.5.3).
// What the model leaves out (the lab's scope note): external PSKs and several
// PSKs offered, the cookie and other HelloRetryRequest triggers, a client that
// has no certificate to send, middlebox compatibility mode, post-handshake
// messages (NewSessionTicket, KeyUpdate, post-handshake authentication), and
// why a server refuses 0-RTT (anti-replay and freshness checks, section 8).
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** What the client offers in its first ClientHello. */
export type ClientOffer = "full" | "psk" | "psk-0rtt";
/** Every value the offer control can take. */
export const OFFERS: readonly ClientOffer[] = ["full", "psk", "psk-0rtt"];
/** How the client's key shares fit the server's groups. */
export type KeyShareFit = "match" | "retry" | "none";
/** Every value the key-share control can take. */
export const KEY_SHARE_FITS: readonly KeyShareFit[] = ["match", "retry", "none"];
/** How the server answers a PSK: accept with (EC)DHE, accept alone, or decline. */
export type PskAnswer = "dhe" | "psk-only" | "decline";
/** Every value the PSK-answer control can take. */
export const PSK_ANSWERS: readonly PskAnswer[] = ["dhe", "psk-only", "decline"];
/** How the server answers 0-RTT data it could accept. */
export type EarlyAnswer = "accept" | "reject";
/** Every value the early-data control can take. */
export const EARLY_ANSWERS: readonly EarlyAnswer[] = ["accept", "reject"];

/** The reader's settings. */
export interface Tls13Input {
  /** What the client offers. */
  offer: ClientOffer;
  /** How its key shares fit the server's groups. */
  keyShare: KeyShareFit;
  /** The server's answer to a PSK (ignored when none is offered). */
  pskAnswer: PskAnswer;
  /** The server's answer to early data it is allowed to accept (ignored when none is offered). */
  earlyAnswer: EarlyAnswer;
  /** True when the server wants a client certificate. */
  clientCert: boolean;
}

/** Which keys protect a message: none, or the early, handshake or application traffic keys. */
export type Keys = "plaintext" | "early" | "handshake" | "application";
/** The handshake messages (and application data) the lab draws. */
export type MessageName =
  | "ClientHello"
  | "HelloRetryRequest"
  | "ServerHello"
  | "EncryptedExtensions"
  | "CertificateRequest"
  | "Certificate"
  | "CertificateVerify"
  | "Finished"
  | "EndOfEarlyData"
  | "ApplicationData";
/** The extensions the lab shows on a message. */
export type Ext = "early_data" | "key_share" | "psk_key_exchange_modes" | "pre_shared_key";

/** One message in one flight. */
export interface FlightMessage {
  /** The flight it belongs to, counted from 1. */
  flight: number;
  /** Who sends it. */
  from: "client" | "server";
  /** The message. */
  name: MessageName;
  /** The noteworthy extensions it carries, in the order RFC 9846's figures list them. */
  ext: Ext[];
  /** The keys that protect it. */
  keys: Keys;
  /** True for a message the sender may leave out (the server's data after its first flight). */
  optional: boolean;
  /** True for 0-RTT data the server throws away. */
  discarded: boolean;
}

/** The key exchange the handshake ends with. */
export type KeyExchange = "dhe-cert" | "psk-dhe" | "psk-only";
/** What the key shares lead to. */
export type ShareOutcome = "used" | "retry" | "not-needed" | "abort";
/** What happens to the 0-RTT data. */
export type EarlyOutcome = "not-offered" | "accepted" | "rejected-retry" | "rejected-psk-declined" | "rejected-by-server" | "lost-abort";
/** Whether the client is asked for a certificate. */
export type ClientAuth = "not-requested" | "requested" | "forbidden-psk";

/** The model's answer. */
export interface Tls13Result {
  /** True when the server aborts the handshake for want of a common group. */
  aborted: boolean;
  /** The key exchange, or null when the handshake aborts. */
  keyExchange: KeyExchange | null;
  /** True when the client offered a PSK. */
  pskOffered: boolean;
  /** True when the server accepted it. */
  pskUsed: boolean;
  /** What the key shares lead to. */
  share: ShareOutcome;
  /** True when a HelloRetryRequest adds a round trip. */
  retry: boolean;
  /** What happens to the 0-RTT data. */
  early: EarlyOutcome;
  /** Whether the client is asked for a certificate. */
  clientAuth: ClientAuth;
  /** True when the server sends Certificate and CertificateVerify. */
  serverCert: boolean;
  /** True when the application data keeps forward secrecy ((EC)DHE in play), null when the handshake aborts. */
  forwardSecret: boolean | null;
  /** Round trips before the client's first application data that the server processes, null when it aborts. */
  roundTrips: number | null;
  /** How many flights the exchange takes. */
  flights: number;
  /** Every message, in order. */
  messages: FlightMessage[];
}

/** The stable code an invalid input is refused with. */
export type Tls13ErrorCode = "bad-choice";

/** An invalid input, refused with a stable code the interface can word. */
export class Tls13Error extends Error {
  /** The stable code. */
  readonly code: Tls13ErrorCode;
  /** Build the refusal with its code and an English message for logs. */
  constructor(code: Tls13ErrorCode, message: string) {
    // The message, for developers.
    super(message);
    // The code, for the interface.
    this.code = code;
  }
}

/** Lay out the handshake for the reader's settings. */
export function compute(input: Tls13Input): Tls13Result {
  // Every select can only send one of its offered values; anything else is refused, not guessed at.
  if (
    !OFFERS.includes(input.offer) ||
    !KEY_SHARE_FITS.includes(input.keyShare) ||
    !PSK_ANSWERS.includes(input.pskAnswer) ||
    !EARLY_ANSWERS.includes(input.earlyAnswer) ||
    typeof input.clientCert !== "boolean"
  ) {
    // One code covers every stray value.
    throw new Tls13Error("bad-choice", "a setting is outside the values the lab offers");
  }

  // A PSK is offered in both resumption choices; early data only in the second (it needs a PSK, 4.3.10).
  const pskOffered = input.offer !== "full";
  // 0-RTT is offered only alongside a PSK.
  const earlyOffered = input.offer === "psk-0rtt";
  // The server uses the PSK when one is offered and it does not decline it.
  const pskUsed = pskOffered && input.pskAnswer !== "decline";
  // (EC)DHE is needed for a full handshake and for psk_dhe_ke; psk_ke sends no key_share (4.3.9).
  const needsDhe = !pskUsed || input.pskAnswer === "dhe";
  // The key shares: not needed in psk_ke, otherwise used, retried, or fatal (4.2.1, 4.2.4).
  const share: ShareOutcome = !needsDhe ? "not-needed" : input.keyShare === "match" ? "used" : input.keyShare === "retry" ? "retry" : "abort";
  // No group in common while one is needed: the server aborts (4.2.1).
  const aborted = share === "abort";
  // A HelloRetryRequest when the shares miss but a common group exists (2.1).
  const retry = share === "retry";
  // The early data's fate, first cause first: abort, retry (4.2.2), PSK not selected or server refusal (4.3.10).
  const early: EarlyOutcome = !earlyOffered
    ? "not-offered"
    : aborted
      ? "lost-abort"
      : retry
        ? "rejected-retry"
        : !pskUsed
          ? "rejected-psk-declined"
          : input.earlyAnswer === "accept"
            ? "accepted"
            : "rejected-by-server";
  // A client certificate: not asked for, asked for, or forbidden because a resumption PSK authenticates the server (4.4.2).
  const clientAuth: ClientAuth = aborted || !input.clientCert ? "not-requested" : pskUsed ? "forbidden-psk" : "requested";
  // The server proves itself with a certificate only when no PSK is in use (2.2, 4.5.1).
  const serverCert = !aborted && !pskUsed;
  // The key exchange the handshake ends with.
  const keyExchange: KeyExchange | null = aborted ? null : !pskUsed ? "dhe-cert" : input.pskAnswer === "dhe" ? "psk-dhe" : "psk-only";

  // The messages, built flight by flight.
  const messages: FlightMessage[] = [];
  /** Append one message with its defaults. */
  const add = (flight: number, from: "client" | "server", name: MessageName, ext: Ext[], keys: Keys, extra: Partial<Pick<FlightMessage, "optional" | "discarded">> = {}) => {
    // Optional and discarded default to false.
    messages.push({ flight, from, name, ext, keys, optional: extra.optional ?? false, discarded: extra.discarded ?? false });
  };

  // Flight 1: the first ClientHello, in the clear, with early_data first and pre_shared_key last (Figure 4, 4.3.11).
  const ch1: Ext[] = [];
  // The early-data indication, when 0-RTT is offered.
  if (earlyOffered) ch1.push("early_data");
  // The key shares are always sent: the client SHOULD include them with a PSK too (2.2).
  ch1.push("key_share");
  // A PSK offer brings its modes and the PSK itself.
  if (pskOffered) ch1.push("psk_key_exchange_modes", "pre_shared_key");
  // The first ClientHello.
  add(1, "client", "ClientHello", ch1, "plaintext");
  // The 0-RTT data rides in the first flight under the client early traffic keys (2.3).
  if (earlyOffered) add(1, "client", "ApplicationData", [], "early", { discarded: early !== "accepted" });

  // An aborted handshake ends here: the server answers with an alert, and no keys ever exist.
  if (aborted) {
    // The account stops after the first flight.
    return { aborted, keyExchange, pskOffered, pskUsed, share, retry, early, clientAuth, serverCert, forwardSecret: null, roundTrips: null, flights: 1, messages };
  }

  // The flight counter after the first ClientHello.
  let flight = 1;
  // A HelloRetryRequest and the second ClientHello add two flights (2.1).
  if (retry) {
    // The server's retry names the group it wants (4.3.8).
    add(++flight, "server", "HelloRetryRequest", ["key_share"], "plaintext");
    // The second ClientHello: one share, the PSK recomputed, and no early_data (4.2.2).
    add(++flight, "client", "ClientHello", pskOffered ? ["key_share", "psk_key_exchange_modes", "pre_shared_key"] : ["key_share"], "plaintext");
  }

  // The server's flight.
  const sf = ++flight;
  // ServerHello: key_share when (EC)DHE is in play, pre_shared_key when the PSK is used (4.2.3).
  const sh: Ext[] = [];
  // Its own share.
  if (needsDhe) sh.push("key_share");
  // The PSK it selected.
  if (pskUsed) sh.push("pre_shared_key");
  // The ServerHello itself, in the clear.
  add(sf, "server", "ServerHello", sh, "plaintext");
  // EncryptedExtensions, the first message under handshake keys, carrying early_data when it is accepted (4.4.1, 4.3.10).
  add(sf, "server", "EncryptedExtensions", early === "accepted" ? ["early_data"] : [], "handshake");
  // CertificateRequest follows EncryptedExtensions when the client is asked for a certificate (4.4.2).
  if (clientAuth === "requested") add(sf, "server", "CertificateRequest", [], "handshake");
  // Certificate and CertificateVerify when the server authenticates with a certificate (4.5.1, 4.5.2).
  if (serverCert) {
    // The chain.
    add(sf, "server", "Certificate", [], "handshake");
    // The signature over the handshake.
    add(sf, "server", "CertificateVerify", [], "handshake");
  }
  // Finished always closes the server's flight (4.5.3).
  add(sf, "server", "Finished", [], "handshake");
  // The server may already send data, to a client it has not yet authenticated (4.5.3).
  add(sf, "server", "ApplicationData", [], "application", { optional: true });

  // The client's last flight.
  const cf = ++flight;
  // EndOfEarlyData, under the early keys, when the server accepted early data (4.6).
  if (early === "accepted") add(cf, "client", "EndOfEarlyData", [], "early");
  // The client's certificate and signature when asked (2, 4.5).
  if (clientAuth === "requested") {
    // The client's chain.
    add(cf, "client", "Certificate", [], "handshake");
    // Its signature.
    add(cf, "client", "CertificateVerify", [], "handshake");
  }
  // The client's Finished.
  add(cf, "client", "Finished", [], "handshake");
  // Its application data, under application keys (4.5.3).
  add(cf, "client", "ApplicationData", [], "application");

  // Round trips before the client's data counts: none when its early data is accepted, else one, plus one for a retry.
  const roundTrips = early === "accepted" ? 0 : retry ? 2 : 1;
  // Forward secrecy for the application data: lost only in psk_ke (2.2).
  const forwardSecret = keyExchange !== "psk-only";
  // The full answer.
  return { aborted, keyExchange, pskOffered, pskUsed, share, retry, early, clientAuth, serverCert, forwardSecret, roundTrips, flights: flight, messages };
}

/** The opening state: a first visit, a key share the server accepts, no PSK, no client certificate. */
export const DEFAULT_INPUT: Tls13Input = { offer: "full", keyShare: "match", pskAnswer: "dhe", earlyAnswer: "accept", clientCert: false };

/** The Example: a returning client sends 0-RTT data, but its key share misses; the retry costs a round trip and the early data. */
export const EXAMPLE_INPUT: Tls13Input = { offer: "psk-0rtt", keyShare: "retry", pskAnswer: "dhe", earlyAnswer: "accept", clientCert: false };
