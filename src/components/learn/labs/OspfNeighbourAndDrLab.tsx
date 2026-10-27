"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/OspfNeighbourAndDrLab.tsx
// ----------------------------------------------------------------------------
// THE OSPF NEIGHBOUR AND DR LAB (2026-10-26), embedded in "OSPF: the map, the
// math, and area 0" as <Lab id="ospf-neighbour-and-dr" />. A small table of
// routers (Router Priority, Router ID, when each comes up), a select for the
// number of routers, one for a parameter configured differently on one router
// (and which), and one that makes the DR fail at the end. The result is the
// election told stage by stage, each router's role, each pair's neighbour
// state (Full, 2-Way, stuck, or never neighbours) and the counts. The model is
// src/lib/labs/ospf-neighbour-and-dr/compute.ts; its checked cases are the
// golden vectors beside it. Words: "learnLabs.ospf-neighbour-and-dr".
// ============================================================================

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import LabFrame, { LabField, LabSelect } from "./LabFrame";
import {
  compute,
  DEFAULT_INPUT,
  EXAMPLE_INPUT,
  OspfError,
  ROUTER_NAMES,
  type Mismatch,
  type OspfErrorCode,
  type OspfInput,
  type OspfResult,
  type PairState,
  type Role,
  type Stage,
} from "@/lib/labs/ospf-neighbour-and-dr/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "ospf-neighbour-and-dr";

export default function OspfNeighbourAndDrLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.ospf-neighbour-and-dr");
  // The page's language, for lists.
  const locale = useLocale();
  // Lists in the page's language; English as British English writes them, without the serial comma ("a, b and c").
  const lf = new Intl.ListFormat(locale === "en" ? "en-GB" : locale, { style: "long", type: "conjunction" });
  // The reader's settings, opening with every router up together.
  const [input, setInput] = useState<OspfInput>(DEFAULT_INPUT);

  // The model's answer, or the refusal.
  let r: OspfResult | null = null;
  // The refusal's code and row, when there is one.
  let err: { code: OspfErrorCode; row: number } | null = null;
  // Run the pure model.
  try {
    // Compute.
    r = compute(input);
  } catch (e) {
    // Only the model's own refusals are expected here.
    if (e instanceof OspfError) err = { code: e.code, row: e.row };
    // Anything else is a bug and must surface.
    else throw e;
  }

  /** A router's name from its row. */
  const nm = (i: number | null): string => (i === null ? t("none") : ROUTER_NAMES[i]);
  /** A list of routers, in words. */
  const names = (rows: number[]): string => lf.format(rows.map((i) => ROUTER_NAMES[i]));

  /** Set one field of one router row. */
  const setRow = (i: number, field: "priority" | "routerId" | "order", value: string) => {
    // A copy of the rows with the one field changed.
    const routers = input.routers.map((row, j) => (j === i ? { ...row, [field]: field === "order" ? Number(value) : value } : row));
    // The new settings.
    setInput({ ...input, routers });
  };

  // The router-count options.
  const countOptions = [3, 4, 5].map((n) => [String(n), t("countOption", { n })] as const);
  // The order options: first to fifth.
  const orderOptions = [1, 2, 3, 4, 5].map((n) => [String(n), t("orderOption", { n })] as const);
  // The mismatch options.
  const mismatchOptions = [
    ["none", t("mismatchNone")],
    ["area", t("mismatchArea")],
    ["auth", t("mismatchAuth")],
    ["mask", t("mismatchMask")],
    ["hello", t("mismatchHello")],
    ["dead", t("mismatchDead")],
    ["ebit", t("mismatchEbit")],
    ["mtu", t("mismatchMtu")],
  ] as const;
  // The routers that can carry the mismatch.
  const oddOptions = ROUTER_NAMES.slice(0, input.count).map((n, i) => [String(i), n] as const);
  // The failure switch.
  const failOptions = [
    ["no", t("drFailsNo")],
    ["yes", t("drFailsYes")],
  ] as const;

  /** The parameter that differs, in words (for the isolated router's sentence). */
  const paramText = (m: Mismatch): string =>
    m === "area" ? t("paramArea") : m === "auth" ? t("paramAuth") : m === "mask" ? t("paramMask") : m === "hello" ? t("paramHello") : m === "dead" ? t("paramDead") : m === "ebit" ? t("paramEbit") : t("paramMtu");

  /** One stage of the account, in words. */
  const stageText = (s: Stage, res: OspfResult): string => {
    // The DR's failure.
    if (s.kind === "fail") {
      // The BDR took over: say so, and name the new BDR, if any router is left to take that seat.
      if (s.bdrBefore !== null && s.drAfter === s.bdrBefore)
        return s.bdrAfter === null ? t("failPromoteNoBdr", { dr: nm(s.failed), bdr: nm(s.drAfter) }) : t("failPromote", { dr: nm(s.failed), bdr: nm(s.drAfter), newBdr: nm(s.bdrAfter) });
      // No eligible router is left: no DR at all.
      if (s.drAfter === null) return t("failNoEligible", { dr: nm(s.failed) });
      // Otherwise the remaining routers elected afresh, with or without a BDR.
      return s.bdrAfter === null ? t("failElectNoBdr", { dr: nm(s.failed), newDr: nm(s.drAfter) }) : t("failElect", { dr: nm(s.failed), newDr: nm(s.drAfter), newBdr: nm(s.bdrAfter) });
    }
    // The sentences for this stage.
    const parts: string[] = [];
    // The routers that joined the segment's Hello exchange.
    if (s.joined.length) {
      // Their names and how many.
      const who = { routers: names(s.joined), count: s.joined.length };
      // No DR declared before: an election.
      if (s.drBefore === null) parts.push(s.drAfter === null ? t("upNoEligible", who) : s.bdrAfter === null ? t("upElectNoBdr", { ...who, dr: nm(s.drAfter) }) : t("upElect", { ...who, dr: nm(s.drAfter), bdr: nm(s.bdrAfter) }));
      // A DR and a BDR already declared: they stay.
      else if (s.bdrBefore !== null) parts.push(t("upAccept", { ...who, dr: nm(s.drBefore), bdr: nm(s.bdrBefore) }));
      // A DR declared and no BDR: the seat is filled if anyone can take it.
      else parts.push(s.bdrAfter === null ? t("upAcceptNoBdrStill", { ...who, dr: nm(s.drBefore) }) : t("upAcceptFillBdr", { ...who, dr: nm(s.drBefore), bdr: nm(s.bdrAfter) }));
      // Joiners that outrank the DR they accepted.
      if (s.outranked.length) parts.push(t("upOutranked", { routers: names(s.outranked), count: s.outranked.length, dr: nm(s.drBefore) }));
    }
    // The router whose Hellos everyone drops.
    for (const i of s.isolated) {
      // Its role tells whether it could elect itself.
      const role = res.routers[i].role;
      // Its sentence.
      parts.push(t(role === "isolated-dr" ? "upIsolated" : "upIsolatedIneligible", { router: nm(i), param: paramText(input.mismatch) }));
    }
    // The stage in one paragraph.
    return parts.join(" ");
  };

  /** A role, in words. */
  const roleText = (role: Role): string =>
    role === "dr"
      ? t("roleDr")
      : role === "bdr"
        ? t("roleBdr")
        : role === "drother"
          ? t("roleDrother")
          : role === "ineligible"
            ? t("roleIneligible")
            : role === "isolated-dr"
              ? t("roleIsolatedDr")
              : role === "isolated-ineligible"
                ? t("roleIsolatedIneligible")
                : t("roleDown");

  /** A pair's state, in words. */
  const stateText = (s: PairState): string => (s === "full" ? t("stateFull") : s === "two-way" ? t("stateTwoWay") : s === "stuck" ? t("stateStuck") : t("stateNoNeighbour"));

  /** The refusal, worded. */
  const errText = (e: { code: OspfErrorCode; row: number }): string =>
    e.code === "bad-priority"
      ? t("errorPriority", { router: nm(e.row) })
      : e.code === "bad-router-id"
        ? t("errorRouterId", { router: nm(e.row) })
        : e.code === "duplicate-router-id"
          ? t("errorDuplicate", { router: nm(e.row) })
          : t("errorChoice");

  /** The result block for a valid input. */
  const resultBlock = (res: OspfResult) => {
    // The isolated router, if one elected itself.
    const selfElected = res.routers.findIndex((x) => x.role === "isolated-dr");
    // The top-ranked router that is not DR, for the non-pre-emption note.
    const top = res.topNotDr === null ? null : res.routers[res.topNotDr];
    // Good news when every pair that should be adjacent is, and there is a DR.
    const tone = res.stuck || res.noNeighbour ? "stop" : res.dr === null ? "warn" : "ok";
    return (
      <>
        {/* The election, stage by stage. */}
        <ol className="lab-steps">
          {res.stages.map((s, k) => (
            <li className="lab-step" key={k}>
              <span className="lab-step-where">{s.kind === "fail" ? t("whereFail") : t("whereUp", { n: s.order })}</span> {stageText(s, res)}
            </li>
          ))}
        </ol>
        {/* Each router's role. */}
        <div className="lab-table-wrap">
          <table className="lab-table">
            <thead>
              <tr>
                <th scope="col">{t("colRouter")}</th>
                <th scope="col">{t("colRole")}</th>
              </tr>
            </thead>
            <tbody>
              {res.routers.map((x) => (
                <tr key={x.name}>
                  <th scope="row">{x.name}</th>
                  <td>{roleText(x.role)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Each pair's state. */}
        <div className="lab-table-wrap">
          <table className="lab-table">
            <thead>
              <tr>
                <th scope="col">{t("colPair")}</th>
                <th scope="col">{t("colState")}</th>
              </tr>
            </thead>
            <tbody>
              {res.pairs.map((p) => (
                <tr key={`${p.a}-${p.b}`}>
                  <th scope="row">{t("pair", { a: nm(p.a), b: nm(p.b) })}</th>
                  <td>{stateText(p.state)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* The counts, in one sentence. */}
        <p>
          <span className={`lab-verdict lab-verdict--${tone}`}>
            {t("verdict", { full: res.full, twoWay: res.twoWay })}
            {res.stuck ? ` ${t("verdictStuck", { stuck: res.stuck })}` : ""}
            {res.noNeighbour ? ` ${t("verdictNoNeighbour", { none: res.noNeighbour })}` : ""}
          </span>
        </p>
        {/* The surprise: the highest-ranked router is not DR. */}
        {top && <p className="lab-note">{t("noteTop", { router: top.name, priority: top.priority, id: top.routerId, role: roleText(top.role) })}</p>}
        {/* No DR at all. */}
        {res.dr === null && <p className="lab-note">{t("noteNoDr")}</p>}
        {/* The MTU mismatch leaves the election alone. */}
        {input.mismatch === "mtu" && <p className="lab-note">{t("noteMtu")}</p>}
        {/* Two routers that each call themselves DR. */}
        {selfElected >= 0 && res.dr !== null && <p className="lab-note">{t("noteTwoDrs", { lone: res.routers[selfElected].name, dr: nm(res.dr) })}</p>}
      </>
    );
  };

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          <LabField id={`${ID}-count`} label={t("count")}>
            <LabSelect id={`${ID}-count`} value={String(input.count)} options={countOptions} onChange={(v) => setInput({ ...input, count: Number(v), odd: input.odd < Number(v) ? input.odd : 0 })} />
          </LabField>
          {/* The routers: priority, Router ID and order, one row each. */}
          <div className="lab-table-wrap">
            <table className="lab-table">
              <caption className="lab-label">{t("routersCaption")}</caption>
              <thead>
                <tr>
                  <th scope="col">{t("colRouter")}</th>
                  <th scope="col">{t("colPriority")}</th>
                  <th scope="col">{t("colRouterId")}</th>
                  <th scope="col">{t("colOrder")}</th>
                </tr>
              </thead>
              <tbody>
                {input.routers.slice(0, input.count).map((row, i) => (
                  <tr key={ROUTER_NAMES[i]}>
                    <th scope="row">{ROUTER_NAMES[i]}</th>
                    <td>
                      <input
                        id={`${ID}-priority-${i + 1}`}
                        className="lab-input"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={255}
                        step={1}
                        aria-label={t("priorityOf", { router: ROUTER_NAMES[i] })}
                        aria-invalid={err && err.row === i && err.code === "bad-priority" ? "true" : undefined}
                        value={row.priority}
                        onChange={(e) => setRow(i, "priority", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        id={`${ID}-router-id-${i + 1}`}
                        className="lab-input mono"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        spellCheck={false}
                        aria-label={t("routerIdOf", { router: ROUTER_NAMES[i] })}
                        aria-invalid={err && err.row === i && (err.code === "bad-router-id" || err.code === "duplicate-router-id") ? "true" : undefined}
                        value={row.routerId}
                        onChange={(e) => setRow(i, "routerId", e.target.value)}
                      />
                    </td>
                    <td>
                      <select
                        id={`${ID}-order-${i + 1}`}
                        className="lab-input"
                        aria-label={t("orderOf", { router: ROUTER_NAMES[i] })}
                        value={String(row.order)}
                        onChange={(e) => setRow(i, "order", e.target.value)}
                      >
                        {orderOptions.map(([v, label]) => (
                          <option key={v} value={v}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <LabField id={`${ID}-mismatch`} label={t("mismatch")}>
            <LabSelect id={`${ID}-mismatch`} value={input.mismatch} options={mismatchOptions} onChange={(v) => setInput({ ...input, mismatch: v as Mismatch })} />
          </LabField>
          {input.mismatch !== "none" && (
            <LabField id={`${ID}-odd`} label={t("odd")}>
              <LabSelect id={`${ID}-odd`} value={String(input.odd)} options={oddOptions} onChange={(v) => setInput({ ...input, odd: Number(v) })} />
            </LabField>
          )}
          <LabField id={`${ID}-dr-fails`} label={t("drFails")}>
            <LabSelect id={`${ID}-dr-fails`} value={input.drFails ? "yes" : "no"} options={failOptions} onChange={(v) => setInput({ ...input, drFails: v === "yes" })} />
          </LabField>
        </>
      }
      result={r ? resultBlock(r) : <p className="lab-error">{err ? errText(err) : t("errorChoice")}</p>}
      onExample={() => setInput(EXAMPLE_INPUT)}
      onReset={() => setInput(DEFAULT_INPUT)}
      scope={t("scope")}
    />
  );
}
