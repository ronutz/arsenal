"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/EthernetFrameBuilderLab.tsx
// ----------------------------------------------------------------------------
// THE ETHERNET FRAME BUILDER LAB (2026-10-26), embedded in "The Ethernet
// frame, field by field" as <Lab id="ethernet-frame-builder" />. A destination
// MAC field, the tag and its VID, the protocol, the packet size and the link
// speed; the result reads the destination's I/G and U/L bits, lays the frame
// out field by field and measures it: frame size, wire size, frames per
// second at line rate and the packet's share of the wire time. The model is
// src/lib/labs/ethernet-frame-builder/compute.ts; its checked cases are the
// golden vectors beside it. Words: "learnLabs.ethernet-frame-builder".
// ============================================================================

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import LabFrame, { LabField, LabSelect } from "./LabFrame";
import {
  compute,
  DEFAULT_INPUT,
  EXAMPLE_INPUT,
  FrameError,
  MAX_PAYLOAD,
  SOURCE_MAC,
  type Field,
  type FrameErrorCode,
  type FrameInput,
  type FrameResult,
  type Protocol,
  type Rate,
} from "@/lib/labs/ethernet-frame-builder/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "ethernet-frame-builder";

/** The form as typed: number fields stay text so the reader can edit freely. */
interface Form {
  /** The destination MAC, as typed. */
  destination: string;
  /** "yes" when tagged. */
  tagged: "yes" | "no";
  /** The VID, as typed. */
  vid: string;
  /** The protocol. */
  protocol: Protocol;
  /** The packet size, as typed. */
  packet: string;
  /** The link speed. */
  rate: Rate;
}

/** A model input as the form shows it. */
function toForm(i: FrameInput): Form {
  // Numbers become text; the boolean becomes a select value.
  return { destination: i.destination, tagged: i.tagged ? "yes" : "no", vid: String(i.vid), protocol: i.protocol, packet: String(i.packet), rate: i.rate };
}

/** Read a typed whole number; an empty field is not a number. */
function readNumber(s: string): number {
  // Blank means nothing was entered.
  return s.trim() === "" ? Number.NaN : Number(s.trim());
}

export default function EthernetFrameBuilderLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.ethernet-frame-builder");
  // The page's language, for number formatting.
  const locale = useLocale();
  // The reader's settings, opening on a full-size IPv4 frame.
  const [form, setForm] = useState<Form>(toForm(DEFAULT_INPUT));
  // Whole numbers with grouping.
  const nf0 = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  // Two decimals, for the share of wire time.
  const nf2 = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });

  // The model's answer, or the code it refused the input with.
  let r: FrameResult | null = null;
  // The refusal code, when there is one.
  let err: FrameErrorCode | null = null;
  // Run the pure model on the parsed form.
  try {
    // Parse and compute.
    r = compute({ destination: form.destination, tagged: form.tagged === "yes", vid: readNumber(form.vid), protocol: form.protocol, packet: readNumber(form.packet), rate: form.rate });
  } catch (e) {
    // Only the model's own refusals are expected here.
    if (e instanceof FrameError) err = e.code;
    // Anything else is a bug and must surface.
    else throw e;
  }
  // The refusal, worded for the reader.
  const errText = err === "bad-mac" ? t("errorMac") : err === "bad-vid" ? t("errorVid") : err === "bad-packet" ? t("errorPacket", { max: nf0.format(MAX_PAYLOAD) }) : err ? t("errorChoice") : null;

  // The tag options.
  const tagOptions = [
    ["no", t("tagNo")],
    ["yes", t("tagYes")],
  ] as const;
  // The protocol options.
  const protocolOptions = [
    ["ipv4", t("protoIpv4")],
    ["ipv6", t("protoIpv6")],
    ["arp", t("protoArp")],
  ] as const;
  // The rate options.
  const rateOptions = [
    ["10M", t("rate10M")],
    ["100M", t("rate100M")],
    ["1G", t("rate1G")],
    ["10G", t("rate10G")],
  ] as const;

  /** A field's name, worded. */
  const fieldName = (f: Field): string =>
    f.id === "preamble"
      ? t("fPreamble")
      : f.id === "sfd"
        ? t("fSfd")
        : f.id === "destination"
          ? t("fDestination")
          : f.id === "source"
            ? t("fSource")
            : f.id === "tag"
              ? t("fTag")
              : f.id === "type"
                ? t("fType")
                : f.id === "payload"
                  ? t("fPayload")
                  : f.id === "fcs"
                    ? t("fFcs")
                    : t("fGap");
  /** A field's contents, worded. */
  const fieldValue = (f: Field, res: FrameResult): string =>
    f.id === "preamble"
      ? t("vPreamble")
      : f.id === "sfd"
        ? t("vSfd")
        : f.id === "destination"
          ? res.destination
          : f.id === "source"
            ? SOURCE_MAC
            : f.id === "tag"
              ? t("vTag", { vid: readNumber(form.vid) })
              : f.id === "type"
                ? res.etherType
                : f.id === "payload"
                  ? res.pad > 0
                    ? t("vPayloadPadded", { packet: nf0.format(readNumber(form.packet)), pad: nf0.format(res.pad) })
                    : t("vPayload", { packet: nf0.format(readNumber(form.packet)) })
                  : f.id === "fcs"
                    ? t("vFcs")
                    : t("vGap");

  /** The result block for a valid input. */
  const resultBlock = (res: FrameResult) => (
    <>
      {/* The destination's two special bits. */}
      <dl className="lab-kv">
        <dt>{t("kvFirstOctet")}</dt>
        <dd className="mono">{res.firstOctetBits}</dd>
        <dt>{t("kvIg")}</dt>
        <dd>{res.broadcast ? t("igBroadcast") : res.group ? t("igGroup") : t("igIndividual")}</dd>
        <dt>{t("kvUl")}</dt>
        <dd>{res.local ? t("ulLocal") : t("ulUniversal")}</dd>
      </dl>
      {/* The frame, field by field. */}
      <div className="lab-table-wrap">
        <table className="lab-table">
          <thead>
            <tr>
              <th scope="col">{t("colField")}</th>
              <th scope="col">{t("colOctets")}</th>
              <th scope="col">{t("colContents")}</th>
            </tr>
          </thead>
          <tbody>
            {res.fields.map((f) => (
              <tr key={f.id}>
                <th scope="row">{fieldName(f)}</th>
                <td>{nf0.format(f.octets)}</td>
                <td className="mono">{fieldValue(f, res)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* The measurements. */}
      <dl className="lab-kv">
        <dt>{t("kvFrame")}</dt>
        <dd>{t("octets", { n: nf0.format(res.frame) })}</dd>
        <dt>{t("kvWire")}</dt>
        <dd>{t("octets", { n: nf0.format(res.wire) })}</dd>
        <dt>{t("kvFps")}</dt>
        <dd>{t("fps", { n: nf0.format(Math.floor(res.maxFramesPerSecond)) })}</dd>
        <dt>{t("kvShare")}</dt>
        <dd>{t("percent", { n: nf2.format(res.packetShare) })}</dd>
      </dl>
      {/* Padding, when the packet was short. */}
      {res.pad > 0 && <p className="lab-note">{t("notePad", { pad: nf0.format(res.pad) })}</p>}
    </>
  );

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          <LabField id={`${ID}-destination`} label={t("destination")}>
            <input id={`${ID}-destination`} className="lab-input mono" type="text" autoComplete="off" spellCheck={false} value={form.destination} aria-invalid={err === "bad-mac" ? "true" : undefined} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
          </LabField>
          <LabField id={`${ID}-tag`} label={t("tag")}>
            <LabSelect id={`${ID}-tag`} value={form.tagged} options={tagOptions} onChange={(v) => setForm({ ...form, tagged: v as "yes" | "no" })} />
          </LabField>
          <LabField id={`${ID}-vid`} label={t("vid")}>
            <input id={`${ID}-vid`} className="lab-input" type="number" inputMode="decimal" min={1} max={4094} step={1} value={form.vid} disabled={form.tagged === "no"} aria-invalid={err === "bad-vid" ? "true" : undefined} onChange={(e) => setForm({ ...form, vid: e.target.value })} />
          </LabField>
          <LabField id={`${ID}-protocol`} label={t("protocol")}>
            <LabSelect id={`${ID}-protocol`} value={form.protocol} options={protocolOptions} onChange={(v) => setForm({ ...form, protocol: v as Protocol })} />
          </LabField>
          <LabField id={`${ID}-packet`} label={t("packet")}>
            <input id={`${ID}-packet`} className="lab-input" type="number" inputMode="decimal" min={1} max={MAX_PAYLOAD} step={1} value={form.packet} aria-invalid={err === "bad-packet" ? "true" : undefined} onChange={(e) => setForm({ ...form, packet: e.target.value })} />
          </LabField>
          <LabField id={`${ID}-rate`} label={t("rate")}>
            <LabSelect id={`${ID}-rate`} value={form.rate} options={rateOptions} onChange={(v) => setForm({ ...form, rate: v as Rate })} />
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
