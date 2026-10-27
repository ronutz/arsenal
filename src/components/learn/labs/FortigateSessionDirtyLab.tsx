"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/FortigateSessionDirtyLab.tsx
// ----------------------------------------------------------------------------
// THE FORTIGATE SESSION-DIRTY LAB (2026-10-26), embedded in "FortiGate Firewall
// Policies and NAT" as <Lab id="fortigate-session-dirty" />. Up to four
// selects: the VDOM's firewall-session-dirty, the accepting policy's own
// option (shown only under check-policy-option, the only setting that offers
// it), when the session opened (shown only under check-new, the only setting
// where it matters) and the change the administrator makes. The result is a
// short summary and a three-step account (before the change, the change, the
// next packet), each step naming the Fortinet document behind it, then the
// verdict. The model is src/lib/labs/fortigate-session-dirty/compute.ts; its
// checked cases are the golden vectors beside it. Words:
// "learnLabs.fortigate-session-dirty".
// ============================================================================

import { useState } from "react";
import { useTranslations } from "next-intl";
import LabFrame, { LabField, LabSelect } from "./LabFrame";
import {
  compute,
  DEFAULT_INPUT,
  EXAMPLE_INPUT,
  type Change,
  type GlobalSetting,
  type PolicySetting,
  type SessionDirtyInput,
  type SessionDirtyResult,
} from "@/lib/labs/fortigate-session-dirty/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "fortigate-session-dirty";

export default function FortigateSessionDirtyLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.fortigate-session-dirty");
  // The reader's settings, opening on the default check-all and a policy edited to deny.
  const [input, setInput] = useState<SessionDirtyInput>(DEFAULT_INPUT);
  // The model's answer (the selects can only send valid values, so it never refuses here).
  const r: SessionDirtyResult = compute(input);

  // The VDOM-level choices.
  const globalOptions = [
    ["check-all", t("globalAll")],
    ["check-new", t("globalNew")],
    ["check-policy-option", t("globalPolicy")],
  ] as const;
  // The policy-level choices.
  const policyOptions = [
    ["check-all", t("policyAll")],
    ["check-new", t("policyNew")],
  ] as const;
  // When the session opened, relative to check-new.
  const openedOptions = [
    ["after", t("openedAfter")],
    ["before", t("openedBefore")],
  ] as const;
  // The changes.
  const changeOptions = [
    ["edit-to-deny", t("changeEditToDeny")],
    ["narrow-match", t("changeNarrow")],
    ["deny-above", t("changeDenyAbove")],
    ["still-matches", t("changeStillMatches")],
  ] as const;

  // Step 1, before the change: which rule the session lives under, and its documented flag.
  const before =
    r.governing === "global-check-all"
      ? t("beforeGlobalAll")
      : r.governing === "global-check-new"
        ? t("beforeGlobalNew")
        : r.governing === "global-check-new-older"
          ? t("beforeGlobalNewOlder")
          : t("beforePolicy", { option: input.policy });
  // Step 2, the change: what the administrator did.
  const changeText =
    input.change === "edit-to-deny"
      ? t("changeTextEditToDeny")
      : input.change === "narrow-match"
        ? t("changeTextNarrow")
        : input.change === "deny-above"
          ? t("changeTextDenyAbove")
          : t("changeTextStill");
  // And what it does to this session, by the governing rule.
  const effect =
    r.governing === "global-check-all" || r.governing === "global-check-new-older"
      ? t("effectDirty")
      : r.governing === "global-check-new"
        ? t("effectPersistent")
        : r.governing === "policy-check-all"
          ? t("effectPolicyAll")
          : r.governing === "policy-check-new"
            ? t("effectPolicyNew")
            : t("effectUndocumented");
  // Step 3, the next packet.
  const next =
    r.outcome === "undocumented"
      ? t("nextUndocumented")
      : r.outcome === "unchecked-continues"
        ? t("nextUnchecked")
        : r.outcome === "revalidated-continues"
          ? t("nextAllowed")
          : input.change === "edit-to-deny"
            ? t("nextDeniedEdit")
            : input.change === "narrow-match"
              ? t("nextDeniedNarrow")
              : t("nextDeniedAbove");
  // The verdict.
  const verdict =
    r.outcome === "dropped"
      ? t("verdictDropped")
      : r.outcome === "revalidated-continues"
        ? t("verdictRevalidated")
        : r.outcome === "unchecked-continues"
          ? r.allowedAfterChange
            ? t("verdictUncheckedAllowed")
            : t("verdictUncheckedDenied")
          : t("verdictUndocumented");
  // Dropped is a stop; old traffic outliving a deny, or no document, is a warning; the rest is fine.
  const tone = r.outcome === "dropped" ? "stop" : r.outcome === "undocumented" || (r.outcome === "unchecked-continues" && !r.allowedAfterChange) ? "warn" : "ok";

  // The summary's values.
  const governingText =
    r.governing === "global-check-all"
      ? t("govGlobalAll")
      : r.governing === "global-check-new"
        ? t("govGlobalNew")
        : r.governing === "global-check-new-older"
          ? t("govGlobalNewOlder")
          : r.governing === "policy-check-all"
            ? t("govPolicyAll")
            : r.governing === "policy-check-new"
              ? t("govPolicyNew")
              : t("govUndocumented");
  // The flags a document names for this path.
  const flagsText = r.flagBefore === "may_dirty" ? t("flagsDirty") : r.flagBefore === "persistent" ? t("flagsPersistent") : t("flagsNotNamed");
  // Re-evaluated: yes, no, or not documented.
  const revalText = r.revalidated === null ? t("notDocumented") : r.revalidated ? t("yes") : t("no");

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          <LabField id={`${ID}-global`} label={t("global")}>
            <LabSelect id={`${ID}-global`} value={input.global} options={globalOptions} onChange={(v) => setInput({ ...input, global: v as GlobalSetting })} />
          </LabField>
          {/* The policy-level option exists only under check-policy-option. */}
          {input.global === "check-policy-option" && (
            <LabField id={`${ID}-policy`} label={t("policy")}>
              <LabSelect id={`${ID}-policy`} value={input.policy} options={policyOptions} onChange={(v) => setInput({ ...input, policy: v as PolicySetting })} />
            </LabField>
          )}
          {/* When the session opened matters only under check-new. */}
          {input.global === "check-new" && (
            <LabField id={`${ID}-opened`} label={t("opened")}>
              <LabSelect
                id={`${ID}-opened`}
                value={input.openedBeforeCheckNew ? "before" : "after"}
                options={openedOptions}
                onChange={(v) => setInput({ ...input, openedBeforeCheckNew: v === "before" })}
              />
            </LabField>
          )}
          <LabField id={`${ID}-change`} label={t("change")}>
            <LabSelect id={`${ID}-change`} value={input.change} options={changeOptions} onChange={(v) => setInput({ ...input, change: v as Change })} />
          </LabField>
        </>
      }
      result={
        <>
          {/* The summary. */}
          <dl className="lab-kv">
            <dt>{t("kvGoverning")}</dt>
            <dd>{governingText}</dd>
            <dt>{t("kvFlags")}</dt>
            <dd>{flagsText}</dd>
            <dt>{t("kvRevalidated")}</dt>
            <dd>{revalText}</dd>
            <dt>{t("kvNewSession")}</dt>
            <dd>{r.allowedAfterChange ? t("newAllowed") : t("newDenied")}</dd>
          </dl>
          {/* The account, in the order things happen. */}
          <ol className="lab-steps">
            <li className="lab-step">
              <span className="lab-step-where">{t("whereBefore")}</span> {before}
            </li>
            <li className="lab-step">
              <span className="lab-step-where">{t("whereChange")}</span> {changeText} {effect}
            </li>
            <li className="lab-step">
              <span className="lab-step-where">{t("whereNext")}</span> {next}
            </li>
            <li className="lab-step">
              <span className="lab-step-where">{t("whereResult")}</span> <span className={`lab-verdict lab-verdict--${tone}`}>{verdict}</span>
            </li>
          </ol>
          {/* The troubleshooting consequence: an old session proves nothing about the change. */}
          {r.outcome === "unchecked-continues" && !r.allowedAfterChange && <p className="lab-note">{t("noteTest")}</p>}
        </>
      }
      onExample={() => setInput(EXAMPLE_INPUT)}
      onReset={() => setInput(DEFAULT_INPUT)}
      scope={t("scope")}
    />
  );
}
