"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/OctetBitNumberingLab.tsx
// ----------------------------------------------------------------------------
// THE OCTET BIT NUMBERING LAB (2026-11-08), embedded in "Least and most
// significant bit: bit numbering and bit order" as
// <Lab id="octet-bit-numbering" />. Eight toggle buttons, one per bit, laid out
// most significant first as an RFC diagram draws them, and a select for what
// the octet is (a plain octet, a MAC address's first octet, an LACP state
// octet, the TCP flags octet). The result gives the value, a table of the
// eight bits with their numbers under LSB 0, MSB 0 and 1-based numbering and
// their weights, the names of the set bits, the RFC drawing, the order on an Ethernet wire, and the
// value a receiver that took the wire order for most significant first would
// read. The model is src/lib/labs/octet-bit-numbering/compute.ts; its checked
// cases are the golden vectors beside it. Words: "learnLabs.octet-bit-numbering".
// Every toggle is a 44 px button with aria-pressed, reachable with Tab and
// switched with Space or Enter; nothing moves or animates.
// ============================================================================

import { useState } from "react";
import { useTranslations } from "next-intl";
import LabFrame, { LabField, LabSelect } from "./LabFrame";
import { compute, toggle, DEFAULT_INPUT, EXAMPLE_INPUT, type OctetInput, type ReadAs } from "@/lib/labs/octet-bit-numbering/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "octet-bit-numbering";

export default function OctetBitNumberingLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.octet-bit-numbering");
  // The reader's settings, opening on RFC 791's 170.
  const [input, setInput] = useState<OctetInput>(DEFAULT_INPUT);
  // The model's answer (the toggles and the select can only send valid values).
  const r = compute(input);

  // The reading options.
  const readOptions = [
    ["none", t("readNone")],
    ["mac", t("readMac")],
    ["lacp", t("readLacp")],
    ["tcp", t("readTcp")],
  ] as const;

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          {/* The eight bits, most significant first, as RFC 791 draws an octet; the group spans the whole row. */}
          <div className="lab-field" style={{ gridColumn: "1 / -1" }}>
            <span className="lab-label" id={`${ID}-bits-label`}>{t("bits")}</span>
            {/* Two nibbles of four: on a phone they stack as two rows of four, never as six and two. */}
            <div className="lab-presets" role="group" aria-labelledby={`${ID}-bits-label`}>
              {[r.bits.slice(0, 4), r.bits.slice(4)].map((nibble, n) => (
                <div className="lab-presets" key={n}>
                  {nibble.map((b) => (
                    <button key={b.lsb0} type="button" className="lab-preset mono" aria-pressed={b.set} aria-label={t("toggleLabel", { lsb0: b.lsb0, weight: b.weight })} onClick={() => setInput({ ...input, value: toggle(input.value, b.lsb0) })}>
                      {b.set ? "1" : "0"}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <LabField id={`${ID}-read`} label={t("readAs")}>
            <LabSelect id={`${ID}-read`} value={input.readAs} options={readOptions} onChange={(v) => setInput({ ...input, readAs: v as ReadAs })} />
          </LabField>
        </>
      }
      result={
        <>
          {/* The value and the two orders. */}
          <dl className="lab-kv">
            <dt>{t("kvValue")}</dt>
            <dd className="mono">{t("value", { hex: r.hex, dec: r.decimal })}</dd>
            <dt>{t("kvDrawing")}</dt>
            <dd className="mono">{r.rfcDrawing.split("").join(" ")}</dd>
            <dt>{t("kvWire")}</dt>
            <dd className="mono">{r.wireOrder}</dd>
            <dt>{t("kvMisread")}</dt>
            <dd className="mono">{t("value", { hex: r.misread.hex, dec: r.misread.decimal })}</dd>
            {/* The names of the set bits, when the octet is read as something with names. */}
            {input.readAs !== "none" && <dt>{t("kvSetNames")}</dt>}
            {input.readAs !== "none" && <dd className="mono">{r.setNames.length ? r.setNames.join(", ") : t("noneSet")}</dd>}
          </dl>
          {/* The eight bits, three numberings each. */}
          <div className="lab-table-wrap">
            <table className="lab-table">
              <thead>
                <tr>
                  <th scope="col">{t("colBit")}</th>
                  <th scope="col">{t("colLsb0")}</th>
                  <th scope="col">{t("colMsb0")}</th>
                  <th scope="col">{t("colOne")}</th>
                  <th scope="col">{t("colWeight")}</th>
                </tr>
              </thead>
              <tbody>
                {r.bits.map((b) => (
                  <tr key={b.lsb0}>
                    <th scope="row" className="mono">{b.set ? "1" : "0"}</th>
                    <td className="mono">{b.lsb0}</td>
                    <td className="mono">{b.msb0}</td>
                    <td className="mono">{b.one}</td>
                    <td className="mono">{b.weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* What the reading says about the octet. */}
          {r.mac && <p className="lab-note">{t("noteMac", { ig: r.mac.group ? t("group") : t("individual"), ul: r.mac.local ? t("local") : t("universal") })}</p>}
          {input.readAs === "lacp" && <p className="lab-note">{t("noteLacp", { huawei: r.wireOrder })}</p>}
          {input.readAs === "tcp" && <p className="lab-note">{t("noteTcp")}</p>}
          {/* The octet in one sentence. */}
          <p>
            <span className="lab-verdict lab-verdict--ok">{r.misread.decimal === r.decimal ? t("verdictSame", { hex: r.hex }) : t("verdict", { hex: r.hex, misread: r.misread.hex })}</span>
          </p>
        </>
      }
      onExample={() => setInput(EXAMPLE_INPUT)}
      onReset={() => setInput(DEFAULT_INPUT)}
      scope={t("scope")}
    />
  );
}
