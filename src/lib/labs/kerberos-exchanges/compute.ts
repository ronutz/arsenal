// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/kerberos-exchanges/compute.ts
// ----------------------------------------------------------------------------
// THE KERBEROS EXCHANGES LAB'S MODEL (2026-10-26), the interactive companion of
// the article "Kerberos and SPNEGO: How Silent Desktop SSO Actually Works". The
// user alice@EXAMPLE.COM reaches the web service HTTP/intranet.example.com
// through the three exchanges: AS (a TGT from the KDC), TGS (a service ticket
// from the KDC) and AP (the ticket presented to the service). The reader sets
// the client's and the service's clocks against the KDC's, the acceptable
// skew, whether the client pre-authenticates, which ticket (if any) has
// expired, and where the SPN is registered. The model lists every message part
// with the key that encrypts it and what it carries, and stops at the first
// check that fails, with its error name.
//
// The rules are RFC 4120 (July 2005, Proposed Standard; read from
// www.rfc-editor.org on 2026-10-26; updated by RFCs 4537, 5021, 5896, 6111,
// 6112, 6113, 6649, 6806, 7751, 8062, 8129, 8429 and 8553, none of which
// changes a rule below; its verified erratum, 7022, is editorial, in 5.2.6.2):
//   - Keys: the AS-REP's ticket (the TGT) is encrypted in the TGS's long-term
//     key and its encrypted part in the client's; the TGS-REQ authenticator
//     and the TGS-REP's encrypted part in the TGS session key; the service
//     ticket in the service's long-term key; the AP-REQ authenticator and the
//     AP-REP in the service session key; PA-ENC-TIMESTAMP in the client's key
//     (1.1, 3.1, 3.2.2, 3.2.4, 3.3, 5.2.7.2, 5.4.2, key usages in 7.5.1).
//     What each carries: 5.3 (EncTicketPart), 5.4.2 (EncKDCRepPart), 5.5.1
//     (Authenticator), 5.5.2 (EncAPRepPart). The KRB_ERROR is not encrypted
//     (3.1).
//   - Pre-authentication required and absent: KDC_ERR_PREAUTH_REQUIRED, with
//     METHOD-DATA naming the acceptable mechanisms (3.1.3).
//   - At the service: a ticket that does not decrypt with the service's key
//     gives KRB_AP_ERR_BAD_INTEGRITY ("chances are good that different keys
//     were used"); client and server times further apart than the allowable
//     skew give KRB_AP_ERR_SKEW; a ticket past its end time by more than the
//     skew gives KRB_AP_ERR_TKT_EXPIRED; in that order (3.2.3).
//   - The TGS does not accept an expired TGT (3.3), with the AP check's error
//     (3.2.3; the TGT authenticates the client to the TGS "in the same manner
//     as" to any application server, 1.1); the KDC looks the requested server
//     up in its database (3.3.3), and KDC_ERR_S_PRINCIPAL_UNKNOWN means "Server
//     not found in Kerberos database" (7.5.9). When both fail, the lab reports
//     the expired TGT first, in the order the RFC describes them (3.3.2, then
//     3.3.3); the RFC does not state that order as a rule.
// Vendor behaviour, labelled as such in the lab:
//   - The acceptable skew: RFC 4120 says only that it is "typically on the
//     order of 5 minutes" (1.6). Microsoft Learn ("Maximum tolerance for
//     computer clock synchronization", read 2026-10-26) gives 5 minutes as the
//     Default Domain Policy value and the domain controller's effective
//     default; MIT Kerberos 1.22.2's krb5.conf documentation gives clockskew a
//     default of 300 seconds.
//   - The AS exchange's time check: RFC 4120 does not say what a KDC does with
//     an encrypted timestamp outside the skew. Microsoft documents, for TGT
//     requests (event 4768), KRB_AP_ERR_SKEW when "a client computer sends a
//     timestamp whose value differs from that of the server's timestamp by
//     more than" the Maximum tolerance. The lab's KDC follows that document.
// What the model leaves out (the lab's scope note): clients that correct their
// clock from the KDC's (RFC 4120 3.1.5's optional offset; MIT's kdc_timesync,
// on by default), the KDC checking the TGS-REQ's authenticator time (a skewed
// client already fails at the AS exchange here), a ticket not yet valid,
// renewal, key version numbers (KRB_AP_ERR_BADKEYVER), cross-realm referrals,
// FAST, PKINIT, encryption types, SPNEGO's own messages, the PAC and any
// authorization decision.
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** Whether the client pre-authenticates its AS request. */
export type Preauth = "sent" | "missing";
/** Every value the pre-authentication control can take. */
export const PREAUTHS: readonly Preauth[] = ["sent", "missing"];
/** Which ticket, if any, has passed its end time by more than the skew. */
export type Tickets = "fresh" | "tgt-expired" | "st-expired";
/** Every value the tickets control can take. */
export const TICKETS: readonly Tickets[] = ["fresh", "tgt-expired", "st-expired"];
/** Where the service principal name HTTP/intranet.example.com is registered. */
export type SpnState = "registered" | "unregistered" | "wrong-account";
/** Every value the SPN control can take. */
export const SPN_STATES: readonly SpnState[] = ["registered", "unregistered", "wrong-account"];

/** The client's principal. */
export const CLIENT = "alice@EXAMPLE.COM";
/** The TGS's principal. */
export const TGS = "krbtgt/EXAMPLE.COM";
/** The service principal name the browser asks for. */
export const SPN = "HTTP/intranet.example.com";
/** The account that should hold the SPN (its key is in the service's keytab). */
export const SERVICE_ACCOUNT = "svc-intranet";
/** The account that holds the SPN by mistake in the wrong-account case. */
export const OTHER_ACCOUNT = "oldweb$";

/** The lowest and highest clock offset the lab accepts, in minutes (a day either way). */
export const OFFSET_RANGE = [-1440, 1440] as const;
/** The lowest and highest acceptable skew the lab accepts, in minutes (Microsoft's policy range). */
export const SKEW_RANGE = [1, 99999] as const;

/** The reader's settings. */
export interface KerberosInput {
  /** The client's clock minus the KDC's, in whole minutes. */
  clientOffset: number;
  /** The service's clock minus the KDC's, in whole minutes. */
  serviceOffset: number;
  /** The acceptable clock skew, in whole minutes (the same on the KDC and the service). */
  skew: number;
  /** Whether the client sends PA-ENC-TIMESTAMP (the KDC requires it). */
  preauth: Preauth;
  /** Which ticket, if any, has expired. */
  tickets: Tickets;
  /** Where the SPN is registered. */
  spn: SpnState;
}

/** The three exchanges. */
export type Exchange = "as" | "tgs" | "ap";
/** How an exchange went. */
export type ExchangeStatus = "ok" | "failed" | "not-reached";
/** The RFC 4120 error names the lab can end on. */
export type KerberosErrorName = "KDC_ERR_PREAUTH_REQUIRED" | "KRB_AP_ERR_SKEW" | "KRB_AP_ERR_TKT_EXPIRED" | "KDC_ERR_S_PRINCIPAL_UNKNOWN" | "KRB_AP_ERR_BAD_INTEGRITY";
/** The keys of the story, plus "none" for what travels in the clear. */
export type KeyName = "none" | "client" | "tgs" | "tgs-session" | "service" | "other" | "service-session";
/** The message parts the lab lists. */
export type PartName =
  | "as-req-body"
  | "pa-enc-timestamp"
  | "tgt"
  | "as-rep-enc"
  | "tgs-req-body"
  | "tgs-authenticator"
  | "service-ticket"
  | "tgs-rep-enc"
  | "ap-authenticator"
  | "ap-rep-enc"
  | "krb-error";
/** The messages the parts belong to. */
export type MessageName = "AS-REQ" | "AS-REP" | "TGS-REQ" | "TGS-REP" | "AP-REQ" | "AP-REP" | "KRB-ERROR";

/** One part of one message on the wire. */
export interface MessagePart {
  /** The exchange it belongs to. */
  exchange: Exchange;
  /** The message. */
  message: MessageName;
  /** The part. */
  part: PartName;
  /** The key it is encrypted in ("none" for clear text). */
  key: KeyName;
  /** True when the part travelled earlier (the expired-ticket cases: at logon, or at the first use of the service). */
  earlier: boolean;
}

/** The model's answer. */
export interface KerberosResult {
  /** The AS exchange's outcome. */
  as: ExchangeStatus;
  /** The TGS exchange's outcome. */
  tgs: ExchangeStatus;
  /** The AP exchange's outcome. */
  ap: ExchangeStatus;
  /** The exchange that failed, or null. */
  failedAt: Exchange | null;
  /** The error it failed with, or null. */
  error: KerberosErrorName | null;
  /** Minutes between the client's and the KDC's clocks (what the AS check compares). */
  kdcGap: number;
  /** Minutes between the client's and the service's clocks (what the AP check compares). */
  serviceGap: number;
  /** How the story ends: authenticated, failed for good, or failed in a way the client recovers from with a new exchange. */
  outcome: "authenticated" | "failed" | "renew";
  /** Every message part that travelled, in order. */
  parts: MessagePart[];
}

/** The stable codes an invalid input is refused with. */
export type KerberosErrorCode = "bad-offset" | "bad-skew" | "bad-choice";

/** An invalid input, refused with a stable code the interface can word. */
export class KerberosError extends Error {
  /** The stable code. */
  readonly code: KerberosErrorCode;
  /** Build the refusal with its code and an English message for logs. */
  constructor(code: KerberosErrorCode, message: string) {
    // The message, for developers.
    super(message);
    // The code, for the interface.
    this.code = code;
  }
}

/** True when a value is a whole number within a closed range. */
function wholeIn(v: unknown, [lo, hi]: readonly [number, number]): boolean {
  // A finite integer between the bounds.
  return typeof v === "number" && Number.isInteger(v) && v >= lo && v <= hi;
}

/** Walk the three exchanges for the reader's settings. */
export function compute(input: KerberosInput): KerberosResult {
  // Each offset: a whole number of minutes within a day either way.
  if (!wholeIn(input.clientOffset, OFFSET_RANGE) || !wholeIn(input.serviceOffset, OFFSET_RANGE)) {
    // Refused with its own code, so the interface can mark the field.
    throw new KerberosError("bad-offset", "a clock offset must be a whole number of minutes from -1440 to 1440");
  }
  // The skew: a whole number of minutes in Microsoft's policy range.
  if (!wholeIn(input.skew, SKEW_RANGE)) throw new KerberosError("bad-skew", "the skew must be a whole number of minutes from 1 to 99999");
  // The selects can only send their offered values; anything else is refused.
  if (!PREAUTHS.includes(input.preauth) || !TICKETS.includes(input.tickets) || !SPN_STATES.includes(input.spn)) {
    // One code covers every stray choice.
    throw new KerberosError("bad-choice", "a setting is outside the values the lab offers");
  }

  // What the KDC compares: the client's time against its own.
  const kdcGap = Math.abs(input.clientOffset);
  // What the service compares: the client's time in the authenticator against its own.
  const serviceGap = Math.abs(input.clientOffset - input.serviceOffset);
  // The parts on the wire, in order.
  const parts: MessagePart[] = [];
  /** Append one part. */
  const add = (exchange: Exchange, message: MessageName, part: PartName, key: KeyName, earlier = false) => parts.push({ exchange, message, part, key, earlier });
  // The AS exchange happened earlier (at logon) when a ticket it led to has since expired.
  const asEarlier = input.tickets !== "fresh";
  // The TGS exchange happened earlier when the service ticket it issued has since expired.
  const tgsEarlier = input.tickets === "st-expired";
  // The key the service ticket is encrypted in: the key of whichever account holds the SPN.
  const ticketKey: KeyName = input.spn === "wrong-account" ? "other" : "service";

  // ---- AS exchange (RFC 4120, 3.1) ----
  // The request's clear part: client, TGS, nonce.
  add("as", "AS-REQ", "as-req-body", "none", asEarlier);
  // The encrypted timestamp, when the client pre-authenticates (5.2.7.2).
  if (input.preauth === "sent") add("as", "AS-REQ", "pa-enc-timestamp", "client", asEarlier);
  // The AS check's error: pre-authentication missing first (3.1.3), then the time (Microsoft, event 4768).
  const asError: KerberosErrorName | null = input.preauth === "missing" ? "KDC_ERR_PREAUTH_REQUIRED" : kdcGap > input.skew ? "KRB_AP_ERR_SKEW" : null;
  // A failure ends the story with a clear-text KRB_ERROR (3.1).
  if (asError) {
    // The error message.
    add("as", "KRB-ERROR", "krb-error", "none", asEarlier);
    // Nothing further is reached.
    return { as: "failed", tgs: "not-reached", ap: "not-reached", failedAt: "as", error: asError, kdcGap, serviceGap, outcome: "failed", parts };
  }
  // The TGT, in the TGS's long-term key (key usage 2).
  add("as", "AS-REP", "tgt", "tgs", asEarlier);
  // The reply's encrypted part, in the client's long-term key (key usage 3).
  add("as", "AS-REP", "as-rep-enc", "client", asEarlier);

  // ---- TGS exchange (RFC 4120, 3.3) ----
  // The TGT again, as issued.
  add("tgs", "TGS-REQ", "tgt", "tgs", tgsEarlier);
  // The authenticator, in the TGS session key (key usage 7).
  add("tgs", "TGS-REQ", "tgs-authenticator", "tgs-session", tgsEarlier);
  // The clear part: the service asked for, a nonce.
  add("tgs", "TGS-REQ", "tgs-req-body", "none", tgsEarlier);
  // The TGS check's error: an expired TGT (3.3, 3.2.3), then the server lookup (3.3.3, 7.5.9).
  const tgsError: KerberosErrorName | null = input.tickets === "tgt-expired" ? "KRB_AP_ERR_TKT_EXPIRED" : input.spn === "unregistered" ? "KDC_ERR_S_PRINCIPAL_UNKNOWN" : null;
  // A failure ends the story here.
  if (tgsError) {
    // The error message.
    add("tgs", "KRB-ERROR", "krb-error", "none", tgsEarlier);
    // An expired TGT is recovered by a new AS exchange (3.3); an unknown server is a failure.
    return { as: "ok", tgs: "failed", ap: "not-reached", failedAt: "tgs", error: tgsError, kdcGap, serviceGap, outcome: tgsError === "KRB_AP_ERR_TKT_EXPIRED" ? "renew" : "failed", parts };
  }
  // The service ticket, in the key of the account holding the SPN (key usage 2).
  add("tgs", "TGS-REP", "service-ticket", ticketKey, tgsEarlier);
  // The reply's encrypted part, in the TGS session key (key usage 8).
  add("tgs", "TGS-REP", "tgs-rep-enc", "tgs-session", tgsEarlier);

  // ---- AP exchange (RFC 4120, 3.2) ----
  // The service ticket, as issued.
  add("ap", "AP-REQ", "service-ticket", ticketKey);
  // The authenticator, in the service session key (key usage 11).
  add("ap", "AP-REQ", "ap-authenticator", "service-session");
  // The service's checks, in RFC 4120 3.2.3's order: decrypt, then time, then the ticket's end time.
  const apError: KerberosErrorName | null =
    input.spn === "wrong-account" ? "KRB_AP_ERR_BAD_INTEGRITY" : serviceGap > input.skew ? "KRB_AP_ERR_SKEW" : input.tickets === "st-expired" ? "KRB_AP_ERR_TKT_EXPIRED" : null;
  // A failure ends the story here.
  if (apError) {
    // The error message.
    add("ap", "KRB-ERROR", "krb-error", "none");
    // An expired service ticket is recovered by a new TGS exchange; the others are failures.
    return { as: "ok", tgs: "ok", ap: "failed", failedAt: "ap", error: apError, kdcGap, serviceGap, outcome: apError === "KRB_AP_ERR_TKT_EXPIRED" ? "renew" : "failed", parts };
  }
  // The AP-REP for mutual authentication, in the service session key (key usage 12).
  add("ap", "AP-REP", "ap-rep-enc", "service-session");
  // Every check passed.
  return { as: "ok", tgs: "ok", ap: "ok", failedAt: null, error: null, kdcGap, serviceGap, outcome: "authenticated", parts };
}

/** The opening state: clocks a minute either side of the KDC's, the defaults, a fresh logon, the SPN where it belongs. */
export const DEFAULT_INPUT: KerberosInput = { clientOffset: 1, serviceOffset: -1, skew: 5, preauth: "sent", tickets: "fresh", spn: "registered" };

/** The Example: the client and the KDC agree, the web server's clock runs 7 minutes fast; only the last step fails. */
export const EXAMPLE_INPUT: KerberosInput = { clientOffset: 0, serviceOffset: 7, skew: 5, preauth: "sent", tickets: "fresh", spn: "registered" };
