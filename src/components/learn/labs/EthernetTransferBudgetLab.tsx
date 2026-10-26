"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/EthernetTransferBudgetLab.tsx
// ----------------------------------------------------------------------------
// THE ETHERNET TRANSFER BUDGET LAB (2026-10-26), embedded in "Bits, bytes and
// the two kinds of kilo" as <Lab id="ethernet-transfer-budget" />. The file's
// size and unit, the link speed, the transport, the MTU and the tag; the
// result counts the packets (full ones and the short last one), the octets on
// the wire and the time they take, against the bare file at the same speed.
// The model is src/lib/labs/ethernet-transfer-budget/compute.ts; its checked
// cases are the golden vectors beside it. The bits and bytes tool does the
// unit arithmetic with one efficiency; this lab adds the framing.
// Words: "learnLabs.ethernet-transfer-budget".
// ============================================================================

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import LabFrame, { LabField, LabSelect } from "./LabFrame";
import {
  compute,
  DEFAULT_INPUT,
  EXAMPLE_INPUT,
  IPV6_MIN_MTU,
  MAX_MTU,
  MAX_SIZE,
  MIN_MTU,
  TransferError,
  type Rate,
  type SizeUnit,
  type Transport,
  type TransferErrorCode,
  type TransferInput,
  type TransferResult,
} from "@/lib/labs/ethernet-transfer-budget/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "ethernet-transfer-budget";

/** The form as typed: number fields stay text so the reader can edit freely. */
interface Form {
  /** The size, as typed. */
  size: string;
  /** The unit. */
  unit: SizeUnit;
  /** The link speed. */
  rate: Rate;
  /** The transport. */
  transport: Transport;
  /** The MTU, as typed. */
  mtu: string;
  /** "yes" when tagged. */
  tagged: "yes" | "no";
}

/** A model input as the form shows it. */
function toForm(i: TransferInput): Form {
  // Numbers become text; the boolean becomes a select value.
  return { size: String(i.size), unit: i.unit, rate: i.rate, transport: i.transport, mtu: String(i.mtu), tagged: i.tagged ? "yes" : "no" };
}

/** Read a typed number, accepting a decimal comma; an empty field is not a number. */
function readNumber(s: string): number {
  // Blank means nothing was entered.
  return s.trim() === "" ? Number.NaN : Number(s.trim().replace(",", "."));
}

export default function EthernetTransferBudgetLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.ethernet-transfer-budget");
  // The page's language, for number formatting.
  const locale = useLocale();
  // The reader's settings, opening on 1 GB over 1 Gb/s.
  const [form, setForm] = useState<Form>(toForm(DEFAULT_INPUT));
  // Whole numbers with grouping.
  const nf0 = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  // Up to three decimals, for times.
  const nf3 = new Intl.NumberFormat(locale, { maximumFractionDigits: 3 });
  // Exactly two decimals, for percentages.
  const nf2 = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  /** A time in milliseconds, shown in seconds from one second up. */
  const time = (ms: number): string => (ms >= 1000 ? t("seconds", { s: nf3.format(ms / 1000) }) : t("milliseconds", { ms: nf3.format(ms) }));

  // The model's answer, or the code it refused the input with.
  let r: TransferResult | null = null;
  // The refusal code, when there is one.
  let err: TransferErrorCode | null = null;
  // Run the pure model on the parsed form.
  try {
    // Parse and compute.
    r = compute({ size: readNumber(form.size), unit: form.unit, rate: form.rate, transport: form.transport, mtu: readNumber(form.mtu), tagged: form.tagged === "yes" });
  } catch (e) {
    // Only the model's own refusals are expected here.
    if (e instanceof TransferError) err = e.code;
    // Anything else is a bug and must surface.
    else throw e;
  }
  // The refusal, worded for the reader.
  const errText =
    err === "bad-size"
      ? t("errorSize", { max: nf0.format(MAX_SIZE) })
      : err === "bad-mtu"
        ? t("errorMtu", { min: nf0.format(MIN_MTU), max: nf0.format(MAX_MTU) })
        : err === "ipv6-mtu"
          ? t("errorIpv6Mtu", { min: nf0.format(IPV6_MIN_MTU) })
          : err
            ? t("errorChoice")
            : null;

  // The unit options.
  const unitOptions = [
    ["MB", t("unitMB")],
    ["MiB", t("unitMiB")],
    ["GB", t("unitGB")],
    ["GiB", t("unitGiB")],
  ] as const;
  // The rate options.
  const rateOptions = [
    ["10M", t("rate10M")],
    ["100M", t("rate100M")],
    ["1G", t("rate1G")],
    ["10G", t("rate10G")],
  ] as const;
  // The transport options.
  const transportOptions = [
    ["tcp4", t("tcp4")],
    ["tcp6", t("tcp6")],
    ["udp4", t("udp4")],
  ] as const;
  // The tag options.
  const tagOptions = [
    ["no", t("tagNo")],
    ["yes", t("tagYes")],
  ] as const;

  /** The result block for a valid input. */
  const resultBlock = (res: TransferResult) => (
    <>
      {/* How the file is cut and what the wire carries. */}
      <dl className="lab-kv">
        <dt>{t("kvBytes")}</dt>
        <dd>{t("octets", { n: nf0.format(res.bytes) })}</dd>
        <dt>{t("kvPerPacket")}</dt>
        <dd>{t("perPacket", { n: nf0.format(res.perPacket), ip: res.ipHeader, l4: res.l4Header })}</dd>
        <dt>{t("kvPackets")}</dt>
        <dd>{res.lastBytes > 0 ? t("packetsWithLast", { n: nf0.format(res.packets), full: nf0.format(res.fullPackets), last: nf0.format(res.lastBytes) }) : t("packetsExact", { n: nf0.format(res.packets) })}</dd>
        <dt>{t("kvWire")}</dt>
        <dd>{t("octets", { n: nf0.format(res.wireBytes) })}</dd>
        <dt>{t("kvOverhead")}</dt>
        <dd>{t("octets", { n: nf0.format(res.overheadBytes) })}</dd>
        <dt>{t("kvWireTime")}</dt>
        <dd>{time(res.wireMs)}</dd>
        <dt>{t("kvNominal")}</dt>
        <dd>{time(res.nominalMs)}</dd>
      </dl>
      {/* The answer in one line. */}
      <p>
        <span className="lab-verdict lab-verdict--ok">{t("verdict", { time: time(res.wireMs), pct: nf2.format(res.efficiency) })}</span>
      </p>
      {/* Padding, when the last packet was tiny. */}
      {res.pad > 0 && <p className="lab-note">{t("notePad", { pad: nf0.format(res.pad) })}</p>}
    </>
  );

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          <LabField id={`${ID}-size`} label={t("size")}>
            <input id={`${ID}-size`} className="lab-input" type="number" inputMode="decimal" min={0} max={MAX_SIZE} step="any" value={form.size} aria-invalid={err === "bad-size" ? "true" : undefined} onChange={(e) => setForm({ ...form, size: e.target.value })} />
          </LabField>
          <LabField id={`${ID}-unit`} label={t("unit")}>
            <LabSelect id={`${ID}-unit`} value={form.unit} options={unitOptions} onChange={(v) => setForm({ ...form, unit: v as SizeUnit })} />
          </LabField>
          <LabField id={`${ID}-rate`} label={t("rate")}>
            <LabSelect id={`${ID}-rate`} value={form.rate} options={rateOptions} onChange={(v) => setForm({ ...form, rate: v as Rate })} />
          </LabField>
          <LabField id={`${ID}-transport`} label={t("transport")}>
            <LabSelect id={`${ID}-transport`} value={form.transport} options={transportOptions} onChange={(v) => setForm({ ...form, transport: v as Transport })} />
          </LabField>
          <LabField id={`${ID}-mtu`} label={t("mtu")}>
            <input id={`${ID}-mtu`} className="lab-input" type="number" inputMode="decimal" min={MIN_MTU} max={MAX_MTU} step={1} value={form.mtu} aria-invalid={err === "bad-mtu" || err === "ipv6-mtu" ? "true" : undefined} onChange={(e) => setForm({ ...form, mtu: e.target.value })} />
          </LabField>
          <LabField id={`${ID}-tag`} label={t("tag")}>
            <LabSelect id={`${ID}-tag`} value={form.tagged} options={tagOptions} onChange={(v) => setForm({ ...form, tagged: v as "yes" | "no" })} />
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
