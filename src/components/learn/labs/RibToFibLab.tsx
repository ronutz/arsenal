"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/RibToFibLab.tsx
// ----------------------------------------------------------------------------
// THE RIB-TO-FIB LAB (2026-10-26), embedded in "Static routes, longest prefix
// match and administrative distance" as <Lab id="rib-to-fib" />. A destination
// field and six selects that switch candidate routes on and off; the result
// is the candidates with their fate in the routing table (installed, or why
// not), then the lookup: the installed routes that contain the destination,
// and the longest of them. The model is src/lib/labs/rib-to-fib/compute.ts;
// its checked cases are the golden vectors beside it.
// Words: "learnLabs.rib-to-fib".
// ============================================================================

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import LabFrame, { LabField, LabSelect } from "./LabFrame";
import { compute, DEFAULT_INPUT, EXAMPLE_INPUT, RibToFibError, type Candidate, type RibToFibErrorCode, type RibToFibInput, type RibToFibResult, type StaticChoice } from "@/lib/labs/rib-to-fib/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "rib-to-fib";

/** The on/off selects, by input field. */
type Toggle = "defaultRoute" | "ospf" | "staticResolves" | "bgp25" | "discard26";

export default function RibToFibLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.rib-to-fib");
  // The page's language, for the list of matches.
  const locale = useLocale();
  // The reader's settings, opening on the BGP /25.
  const [input, setInput] = useState<RibToFibInput>(DEFAULT_INPUT);
  // Lists in the page's language; English as British English writes them, without the serial comma ("a, b and c").
  const lf = new Intl.ListFormat(locale === "en" ? "en-GB" : locale, { style: "long", type: "conjunction" });

  // The model's answer, or the code it refused the input with.
  let r: RibToFibResult | null = null;
  // The refusal code, when there is one.
  let err: RibToFibErrorCode | null = null;
  // Run the pure model.
  try {
    // Compute.
    r = compute(input);
  } catch (e) {
    // Only the model's own refusals are expected here.
    if (e instanceof RibToFibError) err = e.code;
    // Anything else is a bug and must surface.
    else throw e;
  }
  // The refusal, worded for the reader.
  const errText = err === "bad-destination" ? t("errorDestination") : err ? t("errorChoice") : null;

  /** A present/absent select's options, worded per route. */
  const onOff = (on: string, off: string) =>
    [
      ["yes", on],
      ["no", off],
    ] as const;
  /** Set one on/off field from a select. */
  const setToggle = (key: Toggle) => (v: string) => setInput({ ...input, [key]: v === "yes" });
  // The static route's options.
  const staticOptions = [
    ["none", t("staticNone")],
    ["ad1", t("staticAd1")],
    ["ad250", t("staticAd250")],
  ] as const;

  /** A candidate's source, worded. */
  const sourceText = (c: Candidate): string => (c.source === "static" ? t("sourceStatic") : c.source === "ospf" ? t("sourceOspf") : t("sourceBgp"));
  /** A candidate's fate, worded. */
  const statusText = (c: Candidate): string =>
    c.status === "installed" ? t("statusInstalled") : c.status === "lost-metric" ? t("statusLostMetric") : c.status === "lost-distance" ? t("statusLostDistance") : t("statusUnresolved");

  /** The result block for a valid input. */
  const resultBlock = (res: RibToFibResult) => {
    // The winning candidate, if any.
    const win = res.candidates.find((c) => c.id === res.winner) ?? null;
    // The verdict sentence.
    const verdict =
      res.verdict === "forward" && win
        ? t("verdictForward", { dest: input.destination.trim(), hop: win.nextHop, prefix: win.prefix })
        : res.verdict === "discard" && win
          ? t("verdictDiscard", { dest: input.destination.trim(), prefix: win.prefix })
          : t("verdictNoRoute", { dest: input.destination.trim() });
    // Forwarded is good news; a discard is deliberate; no route at all is a stop.
    const tone = res.verdict === "forward" ? "ok" : res.verdict === "discard" ? "warn" : "stop";
    return (
      <>
        {/* Moment 1: the candidates and their fate. */}
        <div className="lab-table-wrap">
          <table className="lab-table">
            <thead>
              <tr>
                <th scope="col">{t("colPrefix")}</th>
                <th scope="col">{t("colSource")}</th>
                <th scope="col">{t("colDistance")}</th>
                <th scope="col">{t("colNextHop")}</th>
                <th scope="col">{t("colTable")}</th>
              </tr>
            </thead>
            <tbody>
              {res.candidates.length === 0 ? (
                <tr>
                  <td colSpan={5}>{t("noCandidates")}</td>
                </tr>
              ) : (
                res.candidates.map((c) => (
                  <tr key={c.id}>
                    <th scope="row" className="mono">
                      {c.prefix}
                    </th>
                    <td>{sourceText(c)}</td>
                    <td className="mono">{`[${c.distance}/${c.metric}]`}</td>
                    <td className="mono">{c.nextHop === "discard" ? t("discard") : c.nextHop}</td>
                    <td>{statusText(c)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Moment 2: the lookup. */}
        <ol className="lab-steps">
          <li className="lab-step">
            <span className="lab-step-where">{t("stepMatches")}</span> {res.matches.length ? t("matchesList", { list: lf.format(res.matches) }) : t("matchesNone")}
          </li>
          <li className="lab-step">
            <span className="lab-step-where">{t("stepResult")}</span> <span className={`lab-verdict lab-verdict--${tone}`}>{verdict}</span>
          </li>
        </ol>
      </>
    );
  };

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          <LabField id={`${ID}-destination`} label={t("destination")}>
            <input
              id={`${ID}-destination`}
              className="lab-input mono"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              value={input.destination}
              aria-invalid={err === "bad-destination" ? "true" : undefined}
              onChange={(e) => setInput({ ...input, destination: e.target.value })}
            />
          </LabField>
          <LabField id={`${ID}-default`} label={t("defaultRoute")}>
            <LabSelect id={`${ID}-default`} value={input.defaultRoute ? "yes" : "no"} options={onOff(t("present"), t("absent"))} onChange={setToggle("defaultRoute")} />
          </LabField>
          <LabField id={`${ID}-ospf`} label={t("ospf")}>
            <LabSelect id={`${ID}-ospf`} value={input.ospf ? "yes" : "no"} options={onOff(t("ospfOn"), t("ospfOff"))} onChange={setToggle("ospf")} />
          </LabField>
          <LabField id={`${ID}-static`} label={t("staticRoute")}>
            <LabSelect id={`${ID}-static`} value={input.staticRoute} options={staticOptions} onChange={(v) => setInput({ ...input, staticRoute: v as StaticChoice })} />
          </LabField>
          <LabField id={`${ID}-resolves`} label={t("staticResolves")}>
            <LabSelect id={`${ID}-resolves`} value={input.staticResolves ? "yes" : "no"} options={onOff(t("resolvesYes"), t("resolvesNo"))} onChange={setToggle("staticResolves")} />
          </LabField>
          <LabField id={`${ID}-bgp`} label={t("bgp25")}>
            <LabSelect id={`${ID}-bgp`} value={input.bgp25 ? "yes" : "no"} options={onOff(t("present"), t("absent"))} onChange={setToggle("bgp25")} />
          </LabField>
          <LabField id={`${ID}-discard`} label={t("discard26")}>
            <LabSelect id={`${ID}-discard`} value={input.discard26 ? "yes" : "no"} options={onOff(t("present"), t("absent"))} onChange={setToggle("discard26")} />
          </LabField>
        </>
      }
      result={r ? resultBlock(r) : <p className="lab-error">{errText}</p>}
      onExample={() => setInput(EXAMPLE_INPUT)}
      onReset={() => setInput(DEFAULT_INPUT)}
      scope={t("scope")}
    />
  );
}
