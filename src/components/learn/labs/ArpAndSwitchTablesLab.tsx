"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/ArpAndSwitchTablesLab.tsx
// ----------------------------------------------------------------------------
// THE ARP AND SWITCH TABLES LAB (2026-10-26), embedded in "ARP and MAC
// Addresses: How IP Finds Ethernet" as <Lab id="arp-and-switch-tables" />. Four selects (where the
// packet goes, A's ARP cache, whether the next hop answers, the switch's
// entry for it); the result is every event in order, the two tables as they
// end up, and a verdict. The model is
// src/lib/labs/arp-and-switch-tables/compute.ts; its checked cases are the
// golden vectors beside it. Words: "learnLabs.arp-and-switch-tables".
// ============================================================================

import { useState } from "react";
import { useTranslations } from "next-intl";
import LabFrame, { LabField, LabSelect } from "./LabFrame";
import { AGEING_SECONDS, compute, DEFAULT_INPUT, EXAMPLE_INPUT, HOST_A, HOST_B, PORT_A, PORT_OLD, ROUTER, type ArpSwitchInput, type EventCode, type FdbState, type Target } from "@/lib/labs/arp-and-switch-tables/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "arp-and-switch-tables";

export default function ArpAndSwitchTablesLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.arp-and-switch-tables");
  // The reader's settings, opening with both tables empty.
  const [input, setInput] = useState<ArpSwitchInput>(DEFAULT_INPUT);
  // The model's answer (every control is a select, so the input is always valid).
  const r = compute(input);
  // The next hop's name, worded.
  const name = input.target === "peer" ? t("nameB") : t("nameRouter");
  // The next hop's current port.
  const hopPort = (input.target === "peer" ? HOST_B : ROUTER).port;

  // The target options.
  const targetOptions = [
    ["peer", t("targetPeer", { ip: HOST_B.ip })],
    ["gateway", t("targetGateway", { ip: ROUTER.ip })],
  ] as const;
  // The ARP cache options.
  const cacheOptions = [
    ["no", t("cacheEmpty")],
    ["yes", t("cacheHolds")],
  ] as const;
  // The ARP answer options.
  const answerOptions = [
    ["yes", t("answersYes")],
    ["no", t("answersNo")],
  ] as const;
  // The switch table options.
  const fdbOptions = [
    ["none", t("fdbNone")],
    ["correct", t("fdbCorrect", { port: hopPort })],
    ["stale", t("fdbStale", { old: PORT_OLD, port: hopPort })],
  ] as const;

  /** One event, worded. */
  const eventText = (e: EventCode): string => {
    // The parameters every sentence may use.
    const p = { ip: r.nextHop.ip, mac: r.nextHop.mac, macA: HOST_A.mac, portA: PORT_A, port: hopPort, old: PORT_OLD, name, dest: r.destination };
    // One sentence per event code.
    switch (e) {
      case "arp-request":
        return t("evArpRequest", p);
      case "learn-a":
        return t("evLearnA", p);
      case "flood-broadcast":
        return t("evFloodBroadcast", p);
      case "arp-reply":
        return t("evArpReply", p);
      case "learn-next-hop":
        return input.fdb === "stale" ? t("evLearnNextHopReplace", p) : t("evLearnNextHop", p);
      case "reply-forwarded":
        return t("evReplyForwarded", p);
      case "arp-cached":
        return t("evArpCached", p);
      case "arp-silent":
        return t("evArpSilent", p);
      case "data-sent":
        return t("evDataSent", p);
      case "flood-unknown":
        return t("evFloodUnknown", p);
      case "forward-known":
        return t("evForwardKnown", p);
      default:
        return t("evForwardStale", p);
    }
  };
  // The verdict.
  const verdict = r.outcome === "delivered" ? t("verdictDelivered", { name }) : r.outcome === "delivered-flooded" ? t("verdictFlooded", { name }) : r.outcome === "misdelivered" ? t("verdictMisdelivered", { name, old: PORT_OLD }) : t("verdictNoMapping");
  // Delivered is good news, flooding a caution, lost or never sent a stop.
  const tone = r.outcome === "delivered" ? "ok" : r.outcome === "delivered-flooded" ? "warn" : "stop";

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          <LabField id={`${ID}-target`} label={t("target")}>
            <LabSelect id={`${ID}-target`} value={input.target} options={targetOptions} onChange={(v) => setInput({ ...input, target: v as Target })} />
          </LabField>
          <LabField id={`${ID}-cache`} label={t("cache")}>
            <LabSelect id={`${ID}-cache`} value={input.arpCached ? "yes" : "no"} options={cacheOptions} onChange={(v) => setInput({ ...input, arpCached: v === "yes" })} />
          </LabField>
          <LabField id={`${ID}-answers`} label={t("answers")}>
            <LabSelect id={`${ID}-answers`} value={input.answers ? "yes" : "no"} options={answerOptions} onChange={(v) => setInput({ ...input, answers: v === "yes" })} />
          </LabField>
          <LabField id={`${ID}-fdb`} label={t("fdb")}>
            <LabSelect id={`${ID}-fdb`} value={input.fdb} options={fdbOptions} onChange={(v) => setInput({ ...input, fdb: v as FdbState })} />
          </LabField>
        </>
      }
      result={
        <>
          {/* Every event, in order. */}
          <ol className="lab-steps">
            {r.events.map((e, i) => (
              <li className="lab-step" key={`${e}-${i}`}>
                {eventText(e)}
              </li>
            ))}
          </ol>
          {/* The two tables as they end up. */}
          <dl className="lab-kv">
            <dt>{t("kvArp")}</dt>
            <dd className="mono">{r.arpEntry ? t("arpEntry", { ip: r.nextHop.ip, mac: r.arpEntry }) : t("arpIncomplete", { ip: r.nextHop.ip })}</dd>
            <dt>{t("kvFdb")}</dt>
            <dd className="mono">
              {r.fdbA === null ? t("fdbNoA", { macA: HOST_A.mac }) : t("fdbEntry", { mac: HOST_A.mac, port: r.fdbA })}
              <br />
              {r.fdbNextHop === null ? t("fdbNoEntry", { mac: r.nextHop.mac }) : t("fdbEntry", { mac: r.nextHop.mac, port: r.fdbNextHop })}
            </dd>
          </dl>
          {/* Where the packet ends up. */}
          <p>
            <span className={`lab-verdict lab-verdict--${tone}`}>{verdict}</span>
          </p>
          {/* How a stale entry heals. */}
          {r.outcome === "misdelivered" && <p className="lab-note">{t("noteStale", { name, port: hopPort, old: PORT_OLD, seconds: AGEING_SECONDS })}</p>}
        </>
      }
      onExample={() => setInput(EXAMPLE_INPUT)}
      onReset={() => setInput(DEFAULT_INPUT)}
      scope={t("scope")}
    />
  );
}
