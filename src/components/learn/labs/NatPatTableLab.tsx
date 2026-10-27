"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/NatPatTableLab.tsx
// ----------------------------------------------------------------------------
// THE NAT/PAT TABLE LAB (2026-10-26), embedded in "NAT Explained" as
// <Lab id="nat-pat-table" />. Controls: how many public addresses, the outside
// port range (two number inputs), the mapping and filtering behaviours, and
// the inbound packet. The result is the translation table of five UDP flows
// (inside, outside, destination, and how each was translated or why it was
// refused), the ports in use, an ordered account of the inbound packet's
// lookup and filtering, and the same packet under all three filtering
// behaviours side by side. The model is src/lib/labs/nat-pat-table/compute.ts;
// its checked cases are the golden vectors beside it. Words:
// "learnLabs.nat-pat-table".
// ============================================================================

import { Fragment, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import LabFrame, { LabField, LabSelect } from "./LabFrame";
import {
  compute,
  DEFAULT_INPUT,
  EXAMPLE_INPUT,
  MAX_PORT,
  MIN_PORT,
  NatError,
  PUBLIC_ADDRESSES,
  type Endpoint,
  type Filtering,
  type FlowKind,
  type Inbound,
  type Mapping,
  type NatErrorCode,
  type NatInput,
  type NatResult,
} from "@/lib/labs/nat-pat-table/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "nat-pat-table";

/** The form as typed: the two port fields stay text so the reader can edit freely. */
interface Form {
  /** Public addresses, "1" or "2". */
  addresses: string;
  /** The range's first port, as typed. */
  first: string;
  /** The range's last port, as typed. */
  last: string;
  /** The mapping behaviour. */
  mapping: Mapping;
  /** The filtering behaviour. */
  filtering: Filtering;
  /** The inbound packet. */
  inbound: Inbound;
}

/** A model input as the form shows it. */
function toForm(i: NatInput): Form {
  // Numbers become text; the selects keep their values.
  return { addresses: String(i.addresses), first: String(i.first), last: String(i.last), mapping: i.mapping, filtering: i.filtering, inbound: i.inbound };
}

/** Read a typed whole number; an empty field is not a number. */
function readNumber(s: string): number {
  // Blank means nothing was entered.
  return s.trim() === "" ? Number.NaN : Number(s.trim());
}

/** An endpoint as address:port (notation, not words). */
function ep(e: Endpoint): string {
  // Dotted address, colon, port.
  return `${e.addr}:${e.port}`;
}

/** The message key for each way a flow was handled. */
const KIND_KEY: Record<FlowKind, string> = {
  // A new mapping that kept the inside port.
  preserved: "kindPreserved",
  // A new mapping that kept it on the second address.
  "preserved-other-address": "kindPreservedOther",
  // A new mapping on another port (the table cell picks the taken or out-of-range wording instead).
  changed: "kindChangedTaken",
  // An existing mapping reused.
  reused: "kindReused",
  // Refused: no free port anywhere.
  "dropped-exhausted": "kindDroppedExhausted",
  // Refused: the paired address is full.
  "dropped-paired": "kindDroppedPaired",
};

export default function NatPatTableLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.nat-pat-table");
  // The page's language, for numbers.
  const locale = useLocale();
  // Whole numbers with the page's grouping.
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  // The reader's settings, opening on the article's table and the server's reply.
  const [form, setForm] = useState<Form>(toForm(DEFAULT_INPUT));

  // The parsed form, as the model reads it.
  const input: NatInput = { addresses: Number(form.addresses), first: readNumber(form.first), last: readNumber(form.last), mapping: form.mapping, filtering: form.filtering, inbound: form.inbound };
  // The model's answer, or null when it refused the input.
  let r: NatResult | null = null;
  // The refusal code, when there is one.
  let err: NatErrorCode | null = null;
  // Run the pure model.
  try {
    // Compute.
    r = compute(input);
  } catch (e) {
    // Only the model's own refusals are expected here.
    if (e instanceof NatError) err = e.code;
    // Anything else is a bug and must surface.
    else throw e;
  }
  // The refusal, worded for the reader.
  const errText = err === "bad-port" ? t("errorPort", { min: MIN_PORT, max: MAX_PORT }) : err === "bad-range" ? t("errorRange") : t("errorChoice");

  // The address options.
  const addressOptions = [
    ["1", t("addressesOne")],
    ["2", t("addressesTwo")],
  ] as const;
  // The mapping options.
  const mappingOptions = [
    ["eim", t("mapEim")],
    ["adm", t("mapAdm")],
    ["apdm", t("mapApdm")],
  ] as const;
  // The filtering options.
  const filteringOptions = [
    ["eif", t("filterEif")],
    ["adf", t("filterAdf")],
    ["apdf", t("filterApdf")],
  ] as const;
  // The inbound options.
  const inboundOptions = [
    ["server", t("inboundServer")],
    ["server-other-port", t("inboundServerOtherPort")],
    ["stranger", t("inboundStranger")],
  ] as const;
  /** A filtering behaviour's short name. */
  const filterName = (f: Filtering): string => (f === "eif" ? t("shortEif") : f === "adf" ? t("shortAdf") : t("shortApdf"));

  /** The result block for a valid input. */
  const resultBlock = (res: NatResult) => {
    // The inside endpoint the inbound packet's mapping leads to.
    const inside = ep(res.inboundInside);
    // Where that endpoint has sent packets, as a list.
    const sentTo = res.sentTo.map(ep).join(", ");
    // The filtering rule applied, worded with this packet's numbers.
    const filterLine =
      form.filtering === "eif"
        ? t("filterLineEif", { inside })
        : form.filtering === "adf"
          ? t("filterLineAdf", { inside, addr: res.inboundFrom.addr, sentTo })
          : t("filterLineApdf", { inside, from: ep(res.inboundFrom), sentTo });
    // The verdict under the reader's behaviour.
    const verdict = res.admitted ? t("verdictAdmitted", { inside, from: ep(res.inboundFrom) }) : t("verdictDropped", { inside, from: ep(res.inboundFrom) });
    // A packet from someone never contacted getting in is the warning case; a dropped one is a stop; the expected reply is fine.
    const tone = res.admitted ? (form.inbound === "stranger" ? "warn" : "ok") : "stop";
    // True when any flow had its port changed: the lab's own port choice is in play.
    const anyChanged = res.flows.some((f) => f.kind === "changed");
    // Flow 4's row: the mapping-behaviour case.
    const flow4 = res.flows[3];
    return (
      <>
        {/* The translation table. */}
        <div className="lab-table-wrap">
          <table className="lab-table">
            <thead>
              <tr>
                <th scope="col">{t("colFlow")}</th>
                <th scope="col">{t("colInside")}</th>
                <th scope="col">{t("colOutside")}</th>
                <th scope="col">{t("colDest")}</th>
                <th scope="col">{t("colHow")}</th>
              </tr>
            </thead>
            <tbody>
              {res.flows.map((f) => (
                <tr key={f.n}>
                  <th scope="row">{f.n}</th>
                  <td className="mono">{ep(f.inside)}</td>
                  <td className="mono">{f.outside ? ep(f.outside) : t("none")}</td>
                  <td className="mono">{ep(f.dest)}</td>
                  <td>
                    {f.kind === "changed"
                      ? t(f.inside.port >= input.first && f.inside.port <= input.last ? "kindChangedTaken" : "kindChangedRange")
                      : t(KIND_KEY[f.kind], { flow: f.reusedFrom ?? 0 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* The ports in use against the range. */}
        <dl className="lab-kv">
          <dt>{t("kvRange")}</dt>
          <dd>{t("kvRangeValue", { first: String(input.first), last: String(input.last), n: nf.format(res.portsPerAddress) })}</dd>
          {res.usedPerAddress.map((u, i) => (
            <Fragment key={i}>
              <dt>{t("kvUsed", { addr: PUBLIC_ADDRESSES[i] })}</dt>
              <dd>{t("kvUsedValue", { used: nf.format(u), n: nf.format(res.portsPerAddress) })}</dd>
            </Fragment>
          ))}
        </dl>
        {/* The inbound packet: lookup, filter, verdict. */}
        <ol className="lab-steps">
          <li className="lab-step">
            <span className="lab-step-where">{t("stepLookup")}</span> {t("lookupLine", { from: ep(res.inboundFrom), to: ep(res.inboundTo), inside })}
          </li>
          <li className="lab-step">
            <span className="lab-step-where">{t("stepFilter")}</span> {filterLine}
          </li>
          <li className="lab-step">
            <span className="lab-step-where">{t("stepVerdict")}</span> <span className={`lab-verdict lab-verdict--${tone}`}>{verdict}</span>
          </li>
        </ol>
        {/* The same packet under every filtering behaviour. */}
        <div className="lab-table-wrap">
          <table className="lab-table">
            <thead>
              <tr>
                <th scope="col">{t("colFiltering")}</th>
                <th scope="col">{t("colThisPacket", { from: ep(res.inboundFrom) })}</th>
              </tr>
            </thead>
            <tbody>
              {res.verdicts.map((v) => (
                <tr key={v.filtering}>
                  <th scope="row">{v.filtering === form.filtering ? t("chosen", { name: filterName(v.filtering) }) : filterName(v.filtering)}</th>
                  <td>{v.admitted ? t("cellAdmitted") : t("cellDropped")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* What flow 4 says about the mapping behaviour. */}
        {flow4.kind === "reused" ? (
          <p className="lab-note">{t("noteReused")}</p>
        ) : flow4.outside ? (
          <p className="lab-note">{t("noteOwnMapping", { port: ep(flow4.outside) })}</p>
        ) : null}
        {/* The port choice is the lab's own, not a standard's. */}
        {anyChanged && <p className="lab-note">{t("notePortChoice")}</p>}
      </>
    );
  };

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          <LabField id={`${ID}-addresses`} label={t("addresses")}>
            <LabSelect id={`${ID}-addresses`} value={form.addresses} options={addressOptions} onChange={(v) => setForm({ ...form, addresses: v })} />
          </LabField>
          <LabField id={`${ID}-first`} label={t("first")}>
            <input id={`${ID}-first`} className="lab-input" type="number" inputMode="numeric" min={MIN_PORT} max={MAX_PORT} step={1} value={form.first} aria-invalid={err === "bad-port" || err === "bad-range" ? "true" : undefined} onChange={(e) => setForm({ ...form, first: e.target.value })} />
          </LabField>
          <LabField id={`${ID}-last`} label={t("last")}>
            <input id={`${ID}-last`} className="lab-input" type="number" inputMode="numeric" min={MIN_PORT} max={MAX_PORT} step={1} value={form.last} aria-invalid={err === "bad-port" || err === "bad-range" ? "true" : undefined} onChange={(e) => setForm({ ...form, last: e.target.value })} />
          </LabField>
          <LabField id={`${ID}-mapping`} label={t("mapping")}>
            <LabSelect id={`${ID}-mapping`} value={form.mapping} options={mappingOptions} onChange={(v) => setForm({ ...form, mapping: v as Mapping })} />
          </LabField>
          <LabField id={`${ID}-filtering`} label={t("filtering")}>
            <LabSelect id={`${ID}-filtering`} value={form.filtering} options={filteringOptions} onChange={(v) => setForm({ ...form, filtering: v as Filtering })} />
          </LabField>
          <LabField id={`${ID}-inbound`} label={t("inbound")}>
            <LabSelect id={`${ID}-inbound`} value={form.inbound} options={inboundOptions} onChange={(v) => setForm({ ...form, inbound: v as Inbound })} />
          </LabField>
        </>
      }
      result={r ? resultBlock(r) : <p className="lab-error">{errText}</p>}
      onExample={() => setForm(toForm(EXAMPLE_INPUT))}
      onReset={() => setForm(toForm(DEFAULT_INPUT))}
      scope={t("scope")}
    />
  );
}
