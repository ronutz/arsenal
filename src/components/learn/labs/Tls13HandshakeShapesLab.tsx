"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/Tls13HandshakeShapesLab.tsx
// ----------------------------------------------------------------------------
// THE TLS 1.3 HANDSHAKE SHAPES LAB (2026-10-26), embedded in "TLS 1.2 vs TLS
// 1.3 vs DTLS vs QUIC" as <Lab id="tls13-handshake-shapes" />. Up to five
// selects (what the client offers, how its key share fits, the server's answer
// to the PSK and to 0-RTT data, a client certificate or not); the PSK and
// 0-RTT selects appear only when the client offers them. The result is a short
// summary, the flights as a table (who sends what, under which keys), and an
// ordered account naming the RFC 9846 section behind each decision. The model
// is src/lib/labs/tls13-handshake-shapes/compute.ts; its checked cases are
// the golden vectors beside it. Words: "learnLabs.tls13-handshake-shapes".
// ============================================================================

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import LabFrame, { LabField, LabSelect } from "./LabFrame";
import {
  compute,
  DEFAULT_INPUT,
  EXAMPLE_INPUT,
  type ClientOffer,
  type EarlyAnswer,
  type FlightMessage,
  type KeyShareFit,
  type PskAnswer,
  type Tls13Input,
} from "@/lib/labs/tls13-handshake-shapes/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "tls13-handshake-shapes";

export default function Tls13HandshakeShapesLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.tls13-handshake-shapes");
  // The page's language, for numbers.
  const locale = useLocale();
  // Whole numbers in the page's language.
  const nf = new Intl.NumberFormat(locale);
  // The reader's settings, opening on a first visit with a key share that fits.
  const [input, setInput] = useState<Tls13Input>(DEFAULT_INPUT);
  // The model's answer (pure: computed on every render; the selects can only send valid values).
  const r = compute(input);

  // The offer choices.
  const offerOptions = [
    ["full", t("offerFull")],
    ["psk", t("offerPsk")],
    ["psk-0rtt", t("offerPsk0rtt")],
  ] as const;
  // The key-share choices.
  const shareOptions = [
    ["match", t("shareMatch")],
    ["retry", t("shareRetry")],
    ["none", t("shareNone")],
  ] as const;
  // The server's answers to a PSK.
  const pskOptions = [
    ["dhe", t("pskDhe")],
    ["psk-only", t("pskOnly")],
    ["decline", t("pskDecline")],
  ] as const;
  // The server's answers to 0-RTT data.
  const earlyOptions = [
    ["accept", t("earlyAccept")],
    ["reject", t("earlyReject")],
  ] as const;
  // Client certificate or not.
  const certOptions = [
    ["no", t("certNo")],
    ["yes", t("certYes")],
  ] as const;

  /** A message's name in the lab's words. */
  const msgName = (m: FlightMessage): string => {
    // Each protocol message has its own key; application data is worded, the others are the RFC's names.
    switch (m.name) {
      case "ClientHello":
        return t("msgClientHello");
      case "HelloRetryRequest":
        return t("msgHelloRetryRequest");
      case "ServerHello":
        return t("msgServerHello");
      case "EncryptedExtensions":
        return t("msgEncryptedExtensions");
      case "CertificateRequest":
        return t("msgCertificateRequest");
      case "Certificate":
        return t("msgCertificate");
      case "CertificateVerify":
        return t("msgCertificateVerify");
      case "Finished":
        return t("msgFinished");
      case "EndOfEarlyData":
        return t("msgEndOfEarlyData");
      default:
        return t("msgApplicationData");
    }
  };
  /** The message cell: the name, its extensions, and its flags. */
  const msgCell = (m: FlightMessage): string => {
    // The name, with the extensions when it carries any.
    const base = m.ext.length ? t("withExt", { name: msgName(m), ext: m.ext.join(", ") }) : msgName(m);
    // The flags, worded.
    const flags = `${m.optional ? ` ${t("optionalTag")}` : ""}${m.discarded ? ` ${t("discardedTag")}` : ""}`;
    // Together.
    return base + flags;
  };
  /** The keys cell. */
  const keysCell = (m: FlightMessage): string =>
    // One wording per key class.
    m.keys === "plaintext" ? t("keysPlaintext") : m.keys === "early" ? t("keysEarly") : m.keys === "handshake" ? t("keysHandshake") : t("keysApplication");

  // Step: the key exchange.
  const kxLine = r.aborted
    ? t("kxAbort")
    : !r.pskOffered
      ? t("kxFull")
      : !r.pskUsed
        ? t("kxDeclined")
        : r.keyExchange === "psk-dhe"
          ? t("kxPskDhe")
          : t("kxPskOnly");
  // Step: the key shares.
  const shareLine = r.share === "used" ? t("shareUsed") : r.share === "retry" ? t("shareRetried") : r.share === "not-needed" ? t("shareNotNeeded") : t("shareAbort");
  // Step: the early data, when it was offered.
  const earlyLine =
    r.early === "accepted"
      ? t("earlyAccepted")
      : r.early === "rejected-retry"
        ? `${t("earlyRetry")} ${t("earlyResend")}`
        : r.early === "rejected-psk-declined"
          ? `${t("earlyPskDeclined")} ${t("earlyResend")}`
          : r.early === "rejected-by-server"
            ? `${t("earlyRefused")} ${t("earlyResend")}`
            : r.early === "lost-abort"
              ? t("earlyLost")
              : t("earlyNone");
  // Step: authentication.
  const authLine = r.pskUsed
    ? r.clientAuth === "forbidden-psk"
      ? t("authPskNoClient")
      : t("authPsk")
    : r.clientAuth === "requested"
      ? t("authCertClient")
      : t("authCert");
  // The early data was thrown away.
  const earlyLost = r.early === "rejected-retry" || r.early === "rejected-psk-declined" || r.early === "rejected-by-server";
  // The verdict on the client's application data.
  const verdict =
    r.roundTrips === null
      ? t("verdictAbort")
      : r.roundTrips === 0
        ? t("verdictZero")
        : `${t("verdictRtt", { n: r.roundTrips })}${r.retry ? ` ${t("verdictRetry")}` : ""}${earlyLost ? ` ${t("verdictEarlyLost")}` : ""}`;
  // A clean 0 or 1 round trip is good news, a retry or lost early data a warning, an abort a stop.
  const tone = r.aborted ? "stop" : r.retry || earlyLost ? "warn" : "ok";
  // The key exchange, for the summary.
  const kxValue = r.keyExchange === null ? t("kxNone") : r.keyExchange === "dhe-cert" ? t("kxDheCert") : r.keyExchange === "psk-dhe" ? t("kxPskDheShort") : t("kxPskOnlyShort");
  // Forward secrecy, for the summary.
  const fsValue = r.forwardSecret === null ? t("none") : r.forwardSecret ? t("fsYes") : t("fsNo");

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          <LabField id={`${ID}-offer`} label={t("offer")}>
            <LabSelect id={`${ID}-offer`} value={input.offer} options={offerOptions} onChange={(v) => setInput({ ...input, offer: v as ClientOffer })} />
          </LabField>
          <LabField id={`${ID}-key-share`} label={t("keyShare")}>
            <LabSelect id={`${ID}-key-share`} value={input.keyShare} options={shareOptions} onChange={(v) => setInput({ ...input, keyShare: v as KeyShareFit })} />
          </LabField>
          {/* The server's answer to a PSK matters only when one is offered. */}
          {input.offer !== "full" && (
            <LabField id={`${ID}-psk-answer`} label={t("pskAnswer")}>
              <LabSelect id={`${ID}-psk-answer`} value={input.pskAnswer} options={pskOptions} onChange={(v) => setInput({ ...input, pskAnswer: v as PskAnswer })} />
            </LabField>
          )}
          {/* The server's answer to early data matters only when 0-RTT is offered. */}
          {input.offer === "psk-0rtt" && (
            <LabField id={`${ID}-early-answer`} label={t("earlyAnswer")}>
              <LabSelect id={`${ID}-early-answer`} value={input.earlyAnswer} options={earlyOptions} onChange={(v) => setInput({ ...input, earlyAnswer: v as EarlyAnswer })} />
            </LabField>
          )}
          <LabField id={`${ID}-client-cert`} label={t("clientCert")}>
            <LabSelect id={`${ID}-client-cert`} value={input.clientCert ? "yes" : "no"} options={certOptions} onChange={(v) => setInput({ ...input, clientCert: v === "yes" })} />
          </LabField>
        </>
      }
      result={
        <>
          {/* The summary. */}
          <dl className="lab-kv">
            <dt>{t("kvKeyExchange")}</dt>
            <dd>{kxValue}</dd>
            <dt>{t("kvRoundTrips")}</dt>
            <dd>{r.roundTrips === null ? t("none") : nf.format(r.roundTrips)}</dd>
            <dt>{t("kvFlights")}</dt>
            <dd>{nf.format(r.flights)}</dd>
            <dt>{t("kvForwardSecrecy")}</dt>
            <dd>{fsValue}</dd>
          </dl>
          {/* The flights, message by message. */}
          <div className="lab-table-wrap">
            <table className="lab-table">
              <thead>
                <tr>
                  <th scope="col">{t("colFlight")}</th>
                  <th scope="col">{t("colMessage")}</th>
                  <th scope="col">{t("colKeys")}</th>
                </tr>
              </thead>
              <tbody>
                {r.messages.map((m, i) => (
                  <tr key={`${m.flight}-${i}`}>
                    <th scope="row">{m.from === "client" ? t("flightClient", { n: m.flight }) : t("flightServer", { n: m.flight })}</th>
                    <td>{msgCell(m)}</td>
                    <td>{keysCell(m)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Why the handshake has this shape, decision by decision. */}
          <ol className="lab-steps">
            <li className="lab-step">
              <span className="lab-step-where">{t("stepKeyExchange")}</span> {kxLine}
            </li>
            <li className="lab-step">
              <span className="lab-step-where">{t("stepKeyShare")}</span> {shareLine}
            </li>
            {input.offer === "psk-0rtt" && (
              <li className="lab-step">
                <span className="lab-step-where">{t("stepEarly")}</span> {earlyLine}
              </li>
            )}
            {!r.aborted && (
              <li className="lab-step">
                <span className="lab-step-where">{t("stepAuth")}</span> {authLine}
              </li>
            )}
            <li className="lab-step">
              <span className="lab-step-where">{t("stepData")}</span> <span className={`lab-verdict lab-verdict--${tone}`}>{verdict}</span>
            </li>
          </ol>
          {/* Where the three kinds of keys come from. */}
          <p className="lab-note">{t("noteKeys")}</p>
        </>
      }
      onExample={() => setInput(EXAMPLE_INPUT)}
      onReset={() => setInput(DEFAULT_INPUT)}
      scope={t("scope")}
    />
  );
}
