"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/RequestThroughLayersLab.tsx
// ----------------------------------------------------------------------------
// THE REQUEST-THROUGH-LAYERS LAB (2026-10-26), embedded in "The OSI Model in
// Practice" as <Lab id="request-through-layers" />. Two selects (the path,
// and whether a reverse proxy re-encrypts); the result is a table with one
// row per link the request crosses, a column per layer (Ethernet addresses,
// IP addresses and TTL, TCP connection, TLS session), and a summary of what
// changed between the ends. The model is
// src/lib/labs/request-through-layers/compute.ts; its checked cases are the
// golden vectors beside it. Words: "learnLabs.request-through-layers".
// ============================================================================

import { useState } from "react";
import { useTranslations } from "next-intl";
import LabFrame, { LabField, LabSelect } from "./LabFrame";
import { compute, DEFAULT_INPUT, EXAMPLE_INPUT, type LayersInput, type Nic, type Path, type TlsSession } from "@/lib/labs/request-through-layers/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "request-through-layers";

export default function RequestThroughLayersLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.request-through-layers");
  // The reader's settings, opening on the routed path.
  const [input, setInput] = useState<LayersInput>(DEFAULT_INPUT);
  // The model's answer (both controls are selects, so the input is always valid).
  const r = compute(input);

  // The path options.
  const pathOptions = [
    ["lan", t("pathLan")],
    ["routed", t("pathRouted")],
    ["proxy", t("pathProxy")],
  ] as const;
  // The backend options.
  const backendOptions = [
    ["yes", t("backendTls")],
    ["no", t("backendPlain")],
  ] as const;
  /** An interface, worded. */
  const nic = (n: Nic): string =>
    n === "client" ? t("nicClient") : n === "server" ? t("nicServer") : n === "router-a" ? t("nicRouterA") : n === "router-b" ? t("nicRouterB") : n === "proxy-a" ? t("nicProxyA") : t("nicProxyB");
  /** A TLS session, worded. */
  const tls = (s: TlsSession): string => (s === "client-server" ? t("tlsClientServer") : s === "client-proxy" ? t("tlsClientProxy") : s === "proxy-server" ? t("tlsProxyServer") : t("tlsNone"));
  // The summary, in one sentence.
  const verdict = r.serverSeesClient ? t("verdictEndToEnd", { tcp: r.tcpConnections, tls: r.tlsSessions }) : t("verdictProxy", { tcp: r.tcpConnections, tls: r.tlsSessions });
  // A proxy without re-encryption leaves the second link in clear text.
  const tone = input.path === "proxy" && !input.backendTls ? "warn" : "ok";

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          <LabField id={`${ID}-path`} label={t("path")}>
            <LabSelect id={`${ID}-path`} value={input.path} options={pathOptions} onChange={(v) => setInput({ ...input, path: v as Path })} />
          </LabField>
          <LabField id={`${ID}-backend`} label={t("backend")}>
            <LabSelect id={`${ID}-backend`} value={input.backendTls ? "yes" : "no"} options={backendOptions} onChange={(v) => setInput({ ...input, backendTls: v === "yes" })} />
          </LabField>
        </>
      }
      result={
        <>
          {/* One row per link, one column per layer. */}
          <div className="lab-table-wrap">
            <table className="lab-table">
              <thead>
                <tr>
                  <th scope="col">{t("colLink")}</th>
                  <th scope="col">{t("colEthernet")}</th>
                  <th scope="col">{t("colIp")}</th>
                  <th scope="col">{t("colTtl")}</th>
                  <th scope="col">{t("colTcp")}</th>
                  <th scope="col">{t("colTls")}</th>
                </tr>
              </thead>
              <tbody>
                {r.hops.map((h, i) => (
                  <tr key={i}>
                    <th scope="row">{i + 1}</th>
                    <td>{t("arrow", { from: nic(h.ethSource), to: nic(h.ethDestination) })}</td>
                    <td className="mono">{t("arrow", { from: h.ipSource, to: h.ipDestination })}</td>
                    <td>{h.ttl}</td>
                    <td>{t("connection", { n: h.tcp })}</td>
                    <td>{tls(h.tls)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* What happened between the ends. */}
          <ol className="lab-steps">
            <li className="lab-step">
              <span className="lab-step-where">{t("stepL2")}</span> {r.hops.length > 1 ? t("l2Changed") : t("l2Single")}
            </li>
            <li className="lab-step">
              <span className="lab-step-where">{t("stepL3")}</span> {r.ttlLowered ? t("l3Routed") : r.serverSeesClient ? t("l3Lan") : t("l3Proxy")}
            </li>
            <li className="lab-step">
              <span className="lab-step-where">{t("stepL4")}</span> <span className={`lab-verdict lab-verdict--${tone}`}>{verdict}</span>
            </li>
          </ol>
          {/* Clear text behind a proxy that does not re-encrypt. */}
          {input.path === "proxy" && !input.backendTls && <p className="lab-note">{t("notePlain")}</p>}
          {/* The re-encryption setting only matters with a proxy. */}
          {input.path !== "proxy" && <p className="lab-note">{t("noteBackendIgnored")}</p>}
        </>
      }
      onExample={() => setInput(EXAMPLE_INPUT)}
      onReset={() => setInput(DEFAULT_INPUT)}
      scope={t("scope")}
    />
  );
}
