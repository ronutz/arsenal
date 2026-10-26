"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/VlanTrunkLab.tsx
// ----------------------------------------------------------------------------
// THE VLAN TRUNK LAB (2026-10-26), embedded in "VLANs and 802.1Q trunking" as
// <Lab id="vlan-trunk" />. Five selects (each host's access VLAN, the allowed
// list, each end's native VLAN) and a three-step account of one frame: what the
// left switch sends, how the right switch classifies it, and whether it reaches
// the receiver. The model is src/lib/labs/vlan-trunk/compute.ts; its checked
// cases are the golden vectors beside it. Words: "learnLabs.vlan-trunk".
// ============================================================================

import { useState } from "react";
import { useTranslations } from "next-intl";
import LabFrame, { LabField, LabSelect } from "./LabFrame";
import { compute, DEFAULT_INPUT, EXAMPLE_INPUT, type Allowed, type LabVlan, type VlanTrunkInput } from "@/lib/labs/vlan-trunk/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "vlan-trunk";

export default function VlanTrunkLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.vlan-trunk");
  // The reader's settings, opening on the clean trunk.
  const [input, setInput] = useState<VlanTrunkInput>(DEFAULT_INPUT);
  // The model's answer for them (a pure function: computed on every render).
  const r = compute(input);
  // The two VLAN choices, labelled in the page's language.
  const vlanOptions = [
    ["10", t("vlan", { id: 10 })],
    ["20", t("vlan", { id: 20 })],
  ] as const;
  // The allowed-list choices.
  const allowedOptions = [
    ["both", t("allowedBoth")],
    ["10", t("allowedOnly", { id: 10 })],
    ["20", t("allowedOnly", { id: 20 })],
  ] as const;
  /** Set one VLAN field from a select's string value. */
  const setVlan = (key: "sender" | "receiver" | "nativeLeft" | "nativeRight") => (v: string) => setInput({ ...input, [key]: Number(v) as LabVlan });

  // Step 1, the left switch: dropped, or sent tagged or untagged.
  const step1 = !r.leftAllows
    ? t("leftDrop", { vlan: input.sender })
    : r.tagged
      ? t("leftTagged", { vid: r.vid ?? 0 })
      : t("leftUntagged", { vlan: input.sender });
  // Step 2, the right switch: not reached, or how it classified the frame and whether its allowed list takes it.
  const step2 = !r.leftAllows
    ? t("rightNotReached")
    : (r.tagged ? t("rightTagged", { vlan: r.classifiedInto }) : t("rightUntagged", { vlan: r.classifiedInto })) +
      " " +
      (r.rightAllows ? t("rightAccepts") : t("rightDrop", { vlan: r.classifiedInto }));
  // Step 3, the receiver: the verdict.
  const verdict =
    r.outcome === "delivered"
      ? r.crossed
        ? t("deliveredCrossed", { from: input.sender, to: r.classifiedInto })
        : t("delivered", { vlan: r.classifiedInto })
      : r.outcome === "wrong-vlan"
        ? t("wrongVlan", { vlan: r.classifiedInto, receiver: input.receiver })
        : r.outcome === "dropped-left"
          ? t("droppedLeft")
          : t("droppedRight");
  // A delivered frame is good news unless it crossed VLANs; anything else is a stop.
  const tone = r.outcome === "delivered" && !r.crossed ? "ok" : r.crossed ? "warn" : "stop";

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          <LabField id={`${ID}-sender`} label={t("sender")}>
            <LabSelect id={`${ID}-sender`} value={String(input.sender)} options={vlanOptions} onChange={setVlan("sender")} />
          </LabField>
          <LabField id={`${ID}-receiver`} label={t("receiver")}>
            <LabSelect id={`${ID}-receiver`} value={String(input.receiver)} options={vlanOptions} onChange={setVlan("receiver")} />
          </LabField>
          <LabField id={`${ID}-allowed`} label={t("allowed")}>
            <LabSelect id={`${ID}-allowed`} value={input.allowed} options={allowedOptions} onChange={(v) => setInput({ ...input, allowed: v as Allowed })} />
          </LabField>
          <LabField id={`${ID}-native-left`} label={t("nativeLeft")}>
            <LabSelect id={`${ID}-native-left`} value={String(input.nativeLeft)} options={vlanOptions} onChange={setVlan("nativeLeft")} />
          </LabField>
          <LabField id={`${ID}-native-right`} label={t("nativeRight")}>
            <LabSelect id={`${ID}-native-right`} value={String(input.nativeRight)} options={vlanOptions} onChange={setVlan("nativeRight")} />
          </LabField>
        </>
      }
      result={
        <>
          {/* The three steps, in the order the frame meets them. */}
          <ol className="lab-steps">
            <li className="lab-step">
              <span className="lab-step-where">{t("stepLeft")}</span> {step1}
            </li>
            <li className="lab-step">
              <span className="lab-step-where">{t("stepRight")}</span> {step2}
            </li>
            <li className="lab-step">
              <span className="lab-step-where">{t("stepReceiver")}</span>{" "}
              <span className={`lab-verdict lab-verdict--${tone}`}>{verdict}</span>
            </li>
          </ol>
          {/* The standing hazard, even when this frame happens to be tagged and safe. */}
          {r.nativeMismatch && <p className="lab-note">{t("mismatchNote", { left: input.nativeLeft, right: input.nativeRight })}</p>}
        </>
      }
      onExample={() => setInput(EXAMPLE_INPUT)}
      onReset={() => setInput(DEFAULT_INPUT)}
      scope={t("scope")}
    />
  );
}
