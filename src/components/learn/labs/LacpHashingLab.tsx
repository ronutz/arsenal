"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/LacpHashingLab.tsx
// ----------------------------------------------------------------------------
// THE LACP HASHING LAB (2026-10-26), embedded in "Link aggregation and LACP" as
// <Lab id="lacp-hashing" />. Three selects (members, transmit hash policy,
// failed member) and six checkboxes (the flows the server sends). The result:
// the first running flow's hash worked step by step with the Linux bonding
// driver's documented formula, a table of every flow's hash and member before
// and after the failure, a table of each member's load, a verdict on the
// imbalance, and notes on flows sharing a member and flows that moved although
// their member stayed up. The model is src/lib/labs/lacp-hashing/compute.ts;
// its checked cases are the golden vectors beside it.
// Words: "learnLabs.lacp-hashing".
// ============================================================================

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import LabFrame, { LabField, LabSelect } from "./LabFrame";
import {
  compute,
  DEFAULT_INPUT,
  EXAMPLE_INPUT,
  FLOWS,
  ipToNumber,
  macByte5,
  MEMBER_MBPS,
  POLICIES,
  SERVER,
  type FlowDef,
  type HashPolicy,
  type LacpInput,
} from "@/lib/labs/lacp-hashing/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "lacp-hashing";

/** A 32-bit value as eight hexadecimal digits. */
function hex8(v: number): string {
  // Padded so every step of the hash reads at the same width.
  return `0x${v.toString(16).padStart(8, "0")}`;
}

/** A byte as two hexadecimal digits. */
function hex2(v: number): string {
  // MAC[5] is one byte.
  return `0x${v.toString(16).padStart(2, "0")}`;
}

export default function LacpHashingLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.lacp-hashing");
  // The page's language, for numbers and lists.
  const locale = useLocale();
  // The reader's settings, opening on four members, layer3+4 and four flows.
  const [input, setInput] = useState<LacpInput>(DEFAULT_INPUT);
  // Every control is a select or a checkbox, so the input is always valid.
  const r = compute(input);
  // Whole numbers with grouping.
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  // Shares as percentages.
  const pct = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });
  // Lists in the page's language; English as British English writes them, without the serial comma ("a, b and c").
  const lf = new Intl.ListFormat(locale === "en" ? "en-GB" : locale, { style: "long", type: "conjunction" });

  /** A policy's name for the reader. */
  const policyName = (p: HashPolicy): string => (p === "layer2" ? t("policyLayer2") : p === "layer2+3" ? t("policyLayer23") : t("policyLayer34"));
  /** A flow's kind, worded. */
  const kindName = (f: FlowDef): string => t(`kind.${f.kind}`);
  /** A flow's checkbox label. */
  const flowLabel = (f: FlowDef): string =>
    t(f.onLan ? "flowLan" : "flowRouted", { id: f.id, kind: kindName(f), ip: f.dstIp, dp: String(f.dstPort), sp: String(f.srcPort), mbps: nf.format(f.mbps) });

  // The member-count choices.
  const memberOptions = [2, 3, 4, 5, 6, 7, 8].map((k) => [String(k), t("membersOption", { n: k })] as const);
  // The policy choices.
  const policyOptions = POLICIES.map((p) => [p, policyName(p)] as const);
  // The failure choices: none, or one of the members.
  const failOptions = [["none", t("failNone")] as const, ...Array.from({ length: input.members }, (_, i) => [String(i), t("failMember", { m: i })] as const)];

  /** Change the member count, dropping a failed member beyond it. */
  const setMembers = (v: string) => {
    // The new count.
    const members = Number(v);
    // A failed member beyond the new count is cleared.
    setInput({ ...input, members, failed: input.failed !== null && input.failed >= members ? null : input.failed });
  };
  /** Turn one flow on or off. */
  const toggleFlow = (id: string, on: boolean) => {
    // Add or remove it, keeping the id order.
    const flows = FLOWS.map((f) => f.id).filter((x) => (x === id ? on : input.flows.includes(x)));
    // The new settings.
    setInput({ ...input, flows });
  };

  // ---- the worked hash of the first running flow ----
  // The first running flow, if any.
  const first = r.flows[0];
  // Its worked steps.
  const w = r.work;
  // The worked account, one item per step.
  const workSteps: { where: string; text: string }[] = [];
  // Only when a flow runs.
  if (first && w) {
    // The flow.
    const f = first.flow;
    // The starting value: MAC bytes and EtherType, or the ports.
    workSteps.push({
      where: t("stepStart"),
      text: w.policy === "layer3+4" ? t("workPorts", { sp: String(f.srcPort), dp: String(f.dstPort), v: hex8(w.start) }) : t("workMacs", { s: hex2(macByte5(SERVER.mac)), d: hex2(macByte5(f.dstMac)), v: hex8(w.start) }),
    });
    // The addresses and the folds, for the two policies that read them.
    if (w.afterIps !== null && w.afterFold !== null) {
      // XOR with both addresses.
      workSteps.push({ where: t("stepIps"), text: t("workIps", { sip: SERVER.ip, sx: hex8(ipToNumber(SERVER.ip)), dip: f.dstIp, dx: hex8(ipToNumber(f.dstIp)), v: hex8(w.afterIps) }) });
      // The two folds.
      workSteps.push({ where: t("stepFold"), text: t("workFold", { v: hex8(w.afterFold) }) });
    }
    // The shift, for layer3+4.
    if (w.policy === "layer3+4") workSteps.push({ where: t("stepShift"), text: t("workShift", { v: hex8(w.hash) }) });
    // The modulo with every member up.
    workSteps.push({ where: t("stepMember"), text: t("workModulo", { hash: nf.format(w.hash), n: input.members, m: first.member }) });
    // The modulo after the failure.
    if (input.failed !== null && first.memberAfter !== null) workSteps.push({ where: t("stepAfter"), text: t("workModuloAfter", { f: input.failed, hash: nf.format(w.hash), n: input.members - 1, i: w.hash % (input.members - 1), m: first.memberAfter }) });
  }

  // ---- the verdict ----
  // The busiest member's load.
  const busiestLoad = r.busiest === null ? 0 : r.load[r.busiest];
  // The verdict sentence.
  const verdict =
    r.busiest === null
      ? t("verdictNoFlows")
      : t(busiestLoad > MEMBER_MBPS ? "verdictOver" : "verdictLoad", {
          m: r.busiest,
          load: nf.format(busiestLoad),
          total: nf.format(r.total),
          share: pct.format(r.total ? busiestLoad / r.total : 0),
          even: pct.format(1 / input.members),
          cap: nf.format(MEMBER_MBPS),
        });
  // Over capacity or no flows is a warning; a load the member can carry is good news.
  const tone = r.busiest === null || busiestLoad > MEMBER_MBPS ? "warn" : "ok";

  // ---- the notes ----
  // Members carrying two or more flows, under the chosen policy.
  const shared = Array.from({ length: input.members }, (_, m) => ({ m, flows: r.flows.filter((x) => x.member === m) })).filter((g) => g.flows.length > 1);
  // The flows that a failure moved although their own member is still up.
  const movedUp = input.failed === null ? [] : r.flows.filter((x) => x.moved && x.member !== input.failed);
  // How many flows moved in all.
  const movedAll = r.flows.filter((x) => x.moved).length;

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          <LabField id={`${ID}-members`} label={t("members")}>
            <LabSelect id={`${ID}-members`} value={String(input.members)} options={memberOptions} onChange={setMembers} />
          </LabField>
          <LabField id={`${ID}-policy`} label={t("policy")}>
            <LabSelect id={`${ID}-policy`} value={input.policy} options={policyOptions} onChange={(v) => setInput({ ...input, policy: v as HashPolicy })} />
          </LabField>
          <LabField id={`${ID}-failed`} label={t("failed")}>
            <LabSelect id={`${ID}-failed`} value={input.failed === null ? "none" : String(input.failed)} options={failOptions} onChange={(v) => setInput({ ...input, failed: v === "none" ? null : Number(v) })} />
          </LabField>
          {/* The six flows, as a labelled group of checkboxes. */}
          <div className="lab-field" role="group" aria-labelledby={`${ID}-flows-label`}>
            <p className="lab-label" id={`${ID}-flows-label`}>
              {t("flows")}
            </p>
            {FLOWS.map((f) => (
              <label className="lab-input-row" key={f.id} htmlFor={`${ID}-flow-${f.id}`}>
                <input id={`${ID}-flow-${f.id}`} type="checkbox" checked={input.flows.includes(f.id)} onChange={(e) => toggleFlow(f.id, e.target.checked)} />
                <span>{flowLabel(f)}</span>
              </label>
            ))}
          </div>
        </>
      }
      result={
        <>
          {/* The first running flow's hash, worked step by step with the HOWTO's formula. */}
          {first ? (
            <>
              <p className="lab-note">{t("workTitle", { id: first.flow.id, policy: policyName(input.policy) })}</p>
              <ol className="lab-steps">
                {workSteps.map((s, k) => (
                  <li className="lab-step" key={k}>
                    <span className="lab-step-where">{s.where}</span> <span className="mono">{s.text}</span>
                  </li>
                ))}
              </ol>
            </>
          ) : null}
          {/* Every running flow: its hash and its member, before and after the failure. */}
          {r.flows.length ? (
            <div className="lab-table-wrap">
              <table className="lab-table">
                <thead>
                  <tr>
                    <th scope="col">{t("colFlow")}</th>
                    <th scope="col">{t("colHash")}</th>
                    <th scope="col">{t("colMember")}</th>
                    {input.failed !== null && <th scope="col">{t("colAfter", { f: input.failed })}</th>}
                  </tr>
                </thead>
                <tbody>
                  {r.flows.map((x) => (
                    <tr key={x.flow.id}>
                      <th scope="row">{t("flowCell", { id: x.flow.id, kind: kindName(x.flow) })}</th>
                      <td className="mono">{nf.format(x.hash)}</td>
                      <td>{x.member}</td>
                      {input.failed !== null && (
                        <td>{!x.moved ? t("afterSame", { m: x.memberAfter ?? 0 }) : x.member === input.failed ? t("afterOffFailed", { m: x.memberAfter ?? 0 }) : t("afterMoved", { m: x.memberAfter ?? 0 })}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {/* Each member's load, before and after the failure. */}
          <div className="lab-table-wrap">
            <table className="lab-table">
              <thead>
                <tr>
                  <th scope="col">{t("colMemberLoad")}</th>
                  <th scope="col">{t("colLoad")}</th>
                  {r.loadAfter && <th scope="col">{t("colLoadAfter", { f: input.failed ?? 0 })}</th>}
                </tr>
              </thead>
              <tbody>
                {r.load.map((v, m) => (
                  <tr key={m}>
                    <th scope="row">{t("memberCell", { m })}</th>
                    <td>{t(v > MEMBER_MBPS ? "loadOver" : "loadValue", { v: nf.format(v) })}</td>
                    {r.loadAfter && <td>{m === input.failed ? t("loadFailed") : t(r.loadAfter[m] > MEMBER_MBPS ? "loadOver" : "loadValue", { v: nf.format(r.loadAfter[m]) })}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* The imbalance, in one sentence. */}
          <p>
            <span className={`lab-verdict lab-verdict--${tone}`}>{verdict}</span>
          </p>
          {/* What the failure moved, in one sentence. */}
          {input.failed !== null && r.flows.length > 0 && (
            <p>
              <span className={`lab-verdict lab-verdict--${movedUp.length ? "warn" : "ok"}`}>{t("verdictFailure", { f: input.failed, moved: movedAll, count: r.flows.length, up: movedUp.length })}</span>
            </p>
          )}
          {/* Flows sharing a member, and where the other policies would put them. */}
          {shared.map((g) => {
            // The flows' ids as a list.
            const ids = lf.format(g.flows.map((x) => x.flow.id));
            /** Where these flows go under one policy ("F1 on 3 and F2 on 3"). */
            const under = (p: HashPolicy): string => lf.format(g.flows.map((x) => t("flowOn", { id: x.flow.id, m: x.byPolicy[p] })));
            // Two of them between the same two hosts: only the ports can split them.
            const sameHosts = input.policy !== "layer3+4" && g.flows.some((x, i) => g.flows.some((y, j) => j > i && y.flow.dstIp === x.flow.dstIp));
            // Two of them to the router under layer2: one MAC pair for every routed flow.
            const viaRouter = input.policy === "layer2" && g.flows.filter((x) => !x.flow.onLan).length > 1;
            return (
              <p className="lab-note" key={g.m}>
                {t("noteShared", { ids, m: g.m, l2: under("layer2"), l23: under("layer2+3"), l34: under("layer3+4") })}
                {sameHosts ? ` ${t("noteSameHosts")}` : ""}
                {viaRouter ? ` ${t("noteGateway")}` : ""}
              </p>
            );
          })}
          {/* Flows that moved although their own member stayed up. */}
          {movedUp.length > 0 && <p className="lab-note">{t("noteMoved", { ids: lf.format(movedUp.map((x) => x.flow.id)), n: input.members - 1 })}</p>}
        </>
      }
      onExample={() => setInput(EXAMPLE_INPUT)}
      onReset={() => setInput(DEFAULT_INPUT)}
      scope={t("scope")}
    />
  );
}
