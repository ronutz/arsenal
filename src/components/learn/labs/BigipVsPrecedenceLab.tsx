"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/BigipVsPrecedenceLab.tsx
// ----------------------------------------------------------------------------
// THE BIG-IP VIRTUAL SERVER PRECEDENCE LAB (2026-10-26), embedded in "How a
// BIG-IP Virtual Server Works" as <Lab id="bigip-vs-precedence" />. The reader
// picks three to five virtual servers and types each one's destination,
// source (address/mask or *) and port (or *), then one packet's source,
// destination and port. The result is a table (each virtual server's K14800
// row, whether it matches, where it dropped out) and an ordered account:
// the candidates, then destination, source and port in K14800's order, each
// step naming who stays and who drops out, then the verdict. The model is
// src/lib/labs/bigip-vs-precedence/compute.ts; its checked cases are the golden
// vectors beside it. Words: "learnLabs.bigip-vs-precedence".
// ============================================================================

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import LabFrame, { LabField, LabSelect } from "./LabFrame";
import {
  compute,
  DEFAULT_INPUT,
  EXAMPLE_INPUT,
  formatPrefix,
  MAX_VIRTUALS,
  MIN_VIRTUALS,
  VsPrecedenceError,
  type AddrClass,
  type Criterion,
  type PacketInput,
  type Prefix,
  type VirtualInput,
  type VsPrecedenceInput,
  type VsPrecedenceResult,
} from "@/lib/labs/bigip-vs-precedence/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "bigip-vs-precedence";

/** A deep copy of an input, so the form never shares rows with the model's constants. */
function copyOf(i: VsPrecedenceInput): VsPrecedenceInput {
  // Rows and packet copied field by field.
  return { count: i.count, virtuals: i.virtuals.map((v) => ({ ...v })), packet: { ...i.packet } };
}

export default function BigipVsPrecedenceLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.bigip-vs-precedence");
  // The page's language, for lists of names.
  const locale = useLocale();
  // "VS 1, VS 2 and VS 3" in the page's language (British English for en).
  const lf = new Intl.ListFormat(locale === "en" ? "en-GB" : locale, { style: "long", type: "conjunction" });
  // The reader's settings, opening on K14800's configuration and an ordinary client.
  const [input, setInput] = useState<VsPrecedenceInput>(copyOf(DEFAULT_INPUT));

  // The model's answer, or its refusal.
  let r: VsPrecedenceResult | null = null;
  // The refusal, when there is one.
  let err: VsPrecedenceError | null = null;
  // Run the pure model.
  try {
    // Compute.
    r = compute(input);
  } catch (e) {
    // Only the model's own refusals are expected here.
    if (e instanceof VsPrecedenceError) err = e;
    // Anything else is a bug and must surface.
    else throw e;
  }

  /** A virtual server's name, from its index. */
  const vs = (i: number): string => t("vsName", { n: i + 1 });
  /** Several virtual servers' names, as one list. */
  const names = (ix: number[]): string => lf.format(ix.map(vs));
  /** A class, worded. */
  const classText = (c: AddrClass): string => (c === "host" ? t("classHost") : c === "network" ? t("classNetwork") : t("classAny"));
  /** A prefix with its class: "192.168.1.0/24 (network)". */
  const prefixText = (p: Prefix, c: AddrClass): string => t("prefixWithClass", { prefix: formatPrefix(p), cls: classText(c) });

  /** True when the refusal points at this virtual server's field. */
  const badCell = (i: number, field: keyof VirtualInput): boolean => err !== null && err.row === i && (err.field === field || err.code === "duplicate-virtual");
  /** True when the refusal points at this packet field. */
  const badPacket = (field: keyof PacketInput): boolean => err !== null && err.row === null && err.code.startsWith("bad-packet") && err.field === field;

  /** Set one field of one virtual server. */
  const setCell = (i: number, field: keyof VirtualInput, value: string) =>
    // A new row list with that one field changed.
    setInput({ ...input, virtuals: input.virtuals.map((v, j) => (j === i ? { ...v, [field]: value } : v)) });
  /** Set one packet field. */
  const setPacket = (field: keyof PacketInput, value: string) => setInput({ ...input, packet: { ...input.packet, [field]: value } });

  // The refusal, worded for the reader.
  const errText = (e: VsPrecedenceError): string => {
    // The virtual server it names, when it names one.
    const who = e.row === null ? "" : vs(e.row);
    // One sentence per code.
    switch (e.code) {
      case "bad-count":
        return t("errorCount", { min: MIN_VIRTUALS, max: MAX_VIRTUALS });
      case "bad-destination":
        return t("errorDestination", { vs: who });
      case "bad-source":
        return t("errorSource", { vs: who });
      case "host-bits":
        return e.field === "destination" ? t("errorHostBitsDestination", { vs: who }) : t("errorHostBitsSource", { vs: who });
      case "bad-port":
        return t("errorPort", { vs: who });
      case "duplicate-virtual":
        return t("errorDuplicate", { vs: who });
      case "bad-packet-source":
        return t("errorPacketSource");
      case "bad-packet-destination":
        return t("errorPacketDestination");
      default:
        return t("errorPacketPort");
    }
  };

  /** The result block for a valid input. */
  const resultBlock = (res: VsPrecedenceResult) => {
    // The winner, when there is one.
    const win = res.winner === null ? null : res.virtuals[res.winner];
    /** One step's sentence. */
    const stepText = (criterion: Criterion, kept: number[], dropped: number[], bestLen: number | null): string => {
      // The winning specificity, worded with its class.
      const best = bestLen === null ? "" : bestLen === 32 ? t("bestHost") : bestLen === 0 ? t("bestAny") : t("bestNetwork", { len: bestLen });
      // The counts drive the verbs' number.
      const counts = { keptCount: kept.length, droppedCount: dropped.length };
      // The port step always separates (two candidates with the same port would be the same listener).
      if (criterion === "port") return t("portDecides", { kept: names(kept), dropped: names(dropped), port: String(res.packet.port), ...counts });
      // Destination: a tie hands over to the source, otherwise some drop out.
      if (criterion === "destination") return dropped.length ? t("destinationDecides", { kept: names(kept), dropped: names(dropped), best, ...counts }) : t("destinationTie", { kept: names(kept), best });
      // Source: a tie hands over to the port, otherwise some drop out.
      return dropped.length ? t("sourceDecides", { kept: names(kept), dropped: names(dropped), best, ...counts }) : t("sourceTie", { kept: names(kept), best });
    };
    /** The step heading for a criterion. */
    const where = (c: Criterion): string => (c === "destination" ? t("whereDestination") : c === "source" ? t("whereSource") : t("wherePort"));
    // A candidate that named the packet's port yet dropped out before the port was looked at, while the winner listens on every port.
    const portLoser = win && win.portClass === "any" ? res.virtuals.find((v) => v.portClass === "port" && (v.droppedAt === "destination" || v.droppedAt === "source")) : undefined;
    // The verdict.
    const verdict = win
      ? t("verdictWinner", {
          vs: vs(win.index),
          row: win.row,
          dest: prefixText(win.destination, win.destClass),
          src: prefixText(win.source, win.sourceClass),
          port: win.port === null ? "*" : String(win.port),
        })
      : t("verdictNone");

    return (
      <>
        {/* Every virtual server: its K14800 row, whether it matches, where it ended. */}
        <div className="lab-table-wrap">
          <table className="lab-table">
            <thead>
              <tr>
                <th scope="col">{t("colVirtual")}</th>
                <th scope="col">{t("colRow")}</th>
                <th scope="col">{t("colMatch")}</th>
                <th scope="col">{t("colOutcome")}</th>
              </tr>
            </thead>
            <tbody>
              {res.virtuals.map((v) => (
                <tr key={v.index}>
                  <th scope="row">{vs(v.index)}</th>
                  <td>{v.row}</td>
                  <td>{v.miss === null ? t("matchYes") : v.miss === "destination" ? t("missDestination") : v.miss === "source" ? t("missSource") : t("missPort")}</td>
                  <td>
                    {res.winner === v.index
                      ? t("outcomeWinner")
                      : v.droppedAt === "destination"
                        ? t("outcomeDestination")
                        : v.droppedAt === "source"
                          ? t("outcomeSource")
                          : v.droppedAt === "port"
                            ? t("outcomePort")
                            : t("outcomeOut")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* The account: candidates, then each criterion in K14800's order, then the verdict. */}
        <ol className="lab-steps">
          <li className="lab-step">
            <span className="lab-step-where">{t("whereCandidates")}</span>{" "}
            {res.candidates.length ? t("candidatesSome", { count: res.candidates.length, list: names(res.candidates) }) : t("candidatesNone")}
          </li>
          {res.steps.map((s) => (
            <li className="lab-step" key={s.criterion}>
              <span className="lab-step-where">{where(s.criterion)}</span> {stepText(s.criterion, s.kept, s.dropped, s.bestLen)}
            </li>
          ))}
          <li className="lab-step">
            <span className="lab-step-where">{t("whereResult")}</span> <span className={`lab-verdict lab-verdict--${win ? (res.rowConflict ? "warn" : "ok") : "stop"}`}>{verdict}</span>
          </li>
        </ol>
        {/* The surprise: a port match that never got looked at. */}
        {portLoser && win && <p className="lab-note">{t("notePortLoses", { loser: vs(portLoser.index), port: String(res.packet.port), winner: vs(win.index) })}</p>}
        {/* Where K14800's rows alone would rank the pair the other way. */}
        {res.rowConflict && win && res.tableWinner !== null && (
          <p className="lab-note">
            {t("noteConflict", { table: vs(res.tableWinner), tableRow: res.virtuals[res.tableWinner].row, winner: vs(win.index), winRow: win.row })}
          </p>
        )}
      </>
    );
  };

  // The count choices.
  const countOptions = [3, 4, 5].map((n) => [String(n), t("countOption", { n })] as const);

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          <LabField id={`${ID}-count`} label={t("count")}>
            <LabSelect id={`${ID}-count`} value={String(input.count)} options={countOptions} onChange={(v) => setInput({ ...input, count: Number(v) })} />
          </LabField>
          {/* The virtual servers: destination, source and port, one row each. */}
          <div className="lab-table-wrap">
            <table className="lab-table">
              <caption className="lab-label">{t("virtualsCaption")}</caption>
              <thead>
                <tr>
                  <th scope="col">{t("colVirtual")}</th>
                  <th scope="col">{t("colDestination")}</th>
                  <th scope="col">{t("colSource")}</th>
                  <th scope="col">{t("colPort")}</th>
                </tr>
              </thead>
              <tbody>
                {input.virtuals.slice(0, input.count).map((row, i) => (
                  <tr key={i}>
                    <th scope="row">{vs(i)}</th>
                    <td>
                      <input
                        id={`${ID}-destination-${i + 1}`}
                        className="lab-input mono"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        spellCheck={false}
                        aria-label={t("destinationOf", { vs: vs(i) })}
                        aria-invalid={badCell(i, "destination") ? "true" : undefined}
                        value={row.destination}
                        onChange={(e) => setCell(i, "destination", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        id={`${ID}-source-${i + 1}`}
                        className="lab-input mono"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        spellCheck={false}
                        aria-label={t("sourceOf", { vs: vs(i) })}
                        aria-invalid={badCell(i, "source") ? "true" : undefined}
                        value={row.source}
                        onChange={(e) => setCell(i, "source", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        id={`${ID}-port-${i + 1}`}
                        className="lab-input mono"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        spellCheck={false}
                        size={5}
                        aria-label={t("portOf", { vs: vs(i) })}
                        aria-invalid={badCell(i, "port") ? "true" : undefined}
                        value={row.port}
                        onChange={(e) => setCell(i, "port", e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* The packet. */}
          <LabField id={`${ID}-packet-source`} label={t("packetSource")}>
            <input
              id={`${ID}-packet-source`}
              className="lab-input mono"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={badPacket("source") ? "true" : undefined}
              value={input.packet.source}
              onChange={(e) => setPacket("source", e.target.value)}
            />
          </LabField>
          <LabField id={`${ID}-packet-destination`} label={t("packetDestination")}>
            <input
              id={`${ID}-packet-destination`}
              className="lab-input mono"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={badPacket("destination") ? "true" : undefined}
              value={input.packet.destination}
              onChange={(e) => setPacket("destination", e.target.value)}
            />
          </LabField>
          <LabField id={`${ID}-packet-port`} label={t("packetPort")}>
            <input
              id={`${ID}-packet-port`}
              className="lab-input mono"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={badPacket("port") ? "true" : undefined}
              value={input.packet.port}
              onChange={(e) => setPacket("port", e.target.value)}
            />
          </LabField>
        </>
      }
      result={r ? resultBlock(r) : <p className="lab-error">{err ? errText(err) : null}</p>}
      onExample={() => setInput(copyOf(EXAMPLE_INPUT))}
      onReset={() => setInput(copyOf(DEFAULT_INPUT))}
      scope={t("scope")}
    />
  );
}
