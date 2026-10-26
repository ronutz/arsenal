"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/StpRootElectionLab.tsx
// ----------------------------------------------------------------------------
// THE SPANNING TREE LAB (2026-10-26), embedded in "Spanning tree in one
// article" as <Lab id="stp-root-election" />. Three selects (which switch, if
// any, is set to priority 4096; the speed of link B-D; which link has failed);
// the result is a table of the four switches (bridge ID, root path cost, root
// port) and a table of the five links (cost, the role at each end, forwarding
// or blocked), with a note where a root port was chosen on a tie. The model is
// src/lib/labs/stp-root-election/compute.ts; its checked cases are the golden
// vectors beside it. Words: "learnLabs.stp-root-election".
// ============================================================================

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import LabFrame, { LabField, LabSelect } from "./LabFrame";
import { compute, DEFAULT_INPUT, EXAMPLE_INPUT, type Failure, type Role, type RootChoice, type Speed, type StpInput } from "@/lib/labs/stp-root-election/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "stp-root-election";

export default function StpRootElectionLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.stp-root-election");
  // The page's language, for numbers.
  const locale = useLocale();
  // The reader's settings, opening with every priority at its default.
  const [input, setInput] = useState<StpInput>(DEFAULT_INPUT);
  // The model's answer (every control is a select, so the input is always valid).
  const r = compute(input);
  // Whole numbers with grouping.
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });

  // The root options.
  const rootOptions = [
    ["default", t("rootDefault")],
    ["A", t("rootSet", { name: "A" })],
    ["B", t("rootSet", { name: "B" })],
    ["C", t("rootSet", { name: "C" })],
    ["D", t("rootSet", { name: "D" })],
  ] as const;
  // The speed options, with their costs.
  const speedOptions = [
    ["10M", t("speed10M")],
    ["100M", t("speed100M")],
    ["1G", t("speed1G")],
    ["10G", t("speed10G")],
  ] as const;
  // The failure options.
  const failOptions = [
    ["none", t("failNone")],
    ["A-B", t("failLink", { link: "A-B" })],
    ["A-C", t("failLink", { link: "A-C" })],
    ["B-C", t("failLink", { link: "B-C" })],
    ["B-D", t("failLink", { link: "B-D" })],
    ["C-D", t("failLink", { link: "C-D" })],
  ] as const;
  /** A role, worded. */
  const roleText = (role: Role): string => (role === "root" ? t("roleRoot") : role === "designated" ? t("roleDesignated") : role === "alternate" ? t("roleAlternate") : t("roleDown"));
  // The switches whose root port was chosen on a tie.
  const ties = r.switches.filter((s) => s.tie);

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          <LabField id={`${ID}-root`} label={t("root")}>
            <LabSelect id={`${ID}-root`} value={input.root} options={rootOptions} onChange={(v) => setInput({ ...input, root: v as RootChoice })} />
          </LabField>
          <LabField id={`${ID}-speed`} label={t("speed")}>
            <LabSelect id={`${ID}-speed`} value={input.speedBD} options={speedOptions} onChange={(v) => setInput({ ...input, speedBD: v as Speed })} />
          </LabField>
          <LabField id={`${ID}-failed`} label={t("failed")}>
            <LabSelect id={`${ID}-failed`} value={input.failed} options={failOptions} onChange={(v) => setInput({ ...input, failed: v as Failure })} />
          </LabField>
        </>
      }
      result={
        <>
          {/* The election, switch by switch. */}
          <div className="lab-table-wrap">
            <table className="lab-table">
              <thead>
                <tr>
                  <th scope="col">{t("colSwitch")}</th>
                  <th scope="col">{t("colBid")}</th>
                  <th scope="col">{t("colCost")}</th>
                  <th scope="col">{t("colRootPort")}</th>
                </tr>
              </thead>
              <tbody>
                {r.switches.map((s) => (
                  <tr key={s.name}>
                    <th scope="row">{s.name === r.root ? t("isRoot", { name: s.name }) : s.name}</th>
                    <td className="mono">{t("bid", { priority: nf.format(s.priority), mac: s.mac })}</td>
                    <td>{nf.format(s.cost)}</td>
                    <td>{s.rootPort === null ? t("none") : t("port", { port: s.rootPort, via: s.rootVia ?? "" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* The links and their roles. */}
          <div className="lab-table-wrap">
            <table className="lab-table">
              <thead>
                <tr>
                  <th scope="col">{t("colLink")}</th>
                  <th scope="col">{t("colLinkCost")}</th>
                  <th scope="col">{t("colRoles")}</th>
                  <th scope="col">{t("colState")}</th>
                </tr>
              </thead>
              <tbody>
                {r.links.map((l) => (
                  <tr key={l.id}>
                    <th scope="row">{l.id}</th>
                    <td>{nf.format(l.cost)}</td>
                    <td>{t("roles", { a: l.a, roleA: roleText(l.roleA), b: l.b, roleB: roleText(l.roleB) })}</td>
                    <td>{l.roleA === "down" ? t("stateDown") : l.forwards ? t("stateForwards") : t("stateBlocked")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Root ports chosen on an equal-cost tie. */}
          {ties.map((s) => (
            <p className="lab-note" key={s.name}>
              {t("noteTie", { name: s.name, port: s.rootPort ?? 0, via: s.rootVia ?? "" })}
            </p>
          ))}
          {/* The tree in one sentence. */}
          <p>
            <span className="lab-verdict lab-verdict--ok">{t("verdict", { root: r.root, forward: r.links.filter((l) => l.forwards).length, blocked: r.blocked })}</span>
          </p>
        </>
      }
      onExample={() => setInput(EXAMPLE_INPUT)}
      onReset={() => setInput(DEFAULT_INPUT)}
      scope={t("scope")}
    />
  );
}
