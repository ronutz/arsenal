"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/VrrpMasterElectionLab.tsx
// ----------------------------------------------------------------------------
// THE VRRP ELECTION LAB (2026-10-26), embedded in "First-hop redundancy: VRRP,
// HSRP, and the gateway that is a fiction" as <Lab id="vrrp-master-election" />.
// The controls: how many routers, each router's priority, Preempt_Mode, the
// Advertisement_Interval, which router (if any) is not running at the start,
// and three events in order. The result: an ordered account (the start, then
// each event) naming the RFC 9568 rule that decided who is Active and how long
// the change took; a table of every router's Skew_Time, Active_Down_Interval
// and final state; and a verdict. The model is
// src/lib/labs/vrrp-master-election/compute.ts; its checked cases are the
// golden vectors beside it. Words: "learnLabs.vrrp-master-election".
// ============================================================================

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import LabFrame, { LabField, LabSelect } from "./LabFrame";
import {
  ADDRESSES,
  activeDownInterval,
  compute,
  DEFAULT_INPUT,
  EXAMPLE_INPUT,
  MAX_INTERVAL_CS,
  skewTime,
  VrrpError,
  type LateRouter,
  type Step,
  type VrrpErrorCode,
  type VrrpEvent,
  type VrrpInput,
  type VrrpResult,
} from "@/lib/labs/vrrp-master-election/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "vrrp-master-election";

/** The form as typed: number fields stay text so the reader can edit freely. */
interface Form {
  /** How many routers, as the select's value. */
  routers: string;
  /** Each router's priority as typed, R1 first. */
  priorities: string[];
  /** Preempt_Mode, as the select's value ("on" or "off"). */
  preempt: string;
  /** The interval in centiseconds, as typed. */
  interval: string;
  /** The held-back router. */
  late: LateRouter;
  /** The three events. */
  events: VrrpEvent[];
}

/** A model input as the form shows it. */
function toForm(i: VrrpInput): Form {
  // Numbers become text; the rest is copied.
  return { routers: String(i.routers), priorities: i.priorities.map(String), preempt: i.preempt ? "on" : "off", interval: String(i.intervalCs), late: i.late, events: [...i.events] };
}

/** Read a typed whole number; an empty field is not a number. */
function readNumber(s: string): number {
  // Blank means nothing was entered; anything else is parsed as typed.
  return s.trim() === "" ? Number.NaN : Number(s.trim());
}

export default function VrrpMasterElectionLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.vrrp-master-election");
  // The page's language, for numbers and lists.
  const locale = useLocale();
  // The reader's settings, opening on two routers, R1 failing and coming back.
  const [form, setForm] = useState<Form>(toForm(DEFAULT_INPUT));
  // Centiseconds, exact: every timer is a whole number of 1/256 cs, so eight decimals always suffice.
  const nfCs = new Intl.NumberFormat(locale, { maximumFractionDigits: 8 });
  // Seconds, to four decimals as the article prints them.
  const nfS = new Intl.NumberFormat(locale, { maximumFractionDigits: 4 });
  // Lists in the page's language; English as British English writes them, without the serial comma ("a, b and c").
  const lf = new Intl.ListFormat(locale === "en" ? "en-GB" : locale, { style: "long", type: "conjunction" });

  // The router count the form names.
  const n = Number(form.routers);
  // The parsed form, as the model reads it.
  const input: VrrpInput = {
    // How many routers.
    routers: n,
    // Each priority, parsed.
    priorities: form.priorities.map(readNumber),
    // On or off.
    preempt: form.preempt === "on",
    // The interval, parsed.
    intervalCs: readNumber(form.interval),
    // The held-back router.
    late: form.late,
    // The events.
    events: form.events,
  };
  // The model's answer, or null when it refused the input.
  let r: VrrpResult | null = null;
  // The refusal code, when there is one.
  let err: VrrpErrorCode | null = null;
  // The router the refusal concerns, when it concerns one.
  let errRouter: number | null = null;
  // Run the pure model.
  try {
    // Compute.
    r = compute(input);
  } catch (e) {
    // Only the model's own refusals are expected here.
    if (e instanceof VrrpError) {
      // Its code.
      err = e.code;
      // Its router.
      errRouter = e.router;
    }
    // Anything else is a bug and must surface.
    else throw e;
  }

  /** A timer as "X cs (Y s)". */
  const cs = (v: number): string => t("csAndS", { cs: nfCs.format(v), s: nfS.format(v / 100) });
  /** A router's priority as the model read it. */
  const prio = (i: number): number => input.priorities[i];

  /** Change the router count, dropping a held-back router or start events beyond it. */
  const setRouters = (v: string) => {
    // The new count.
    const count = Number(v);
    // A held-back router beyond the count is dropped.
    const late: LateRouter = form.late !== "none" && Number(form.late) > count ? "none" : form.late;
    // Start events beyond the count become "none".
    const events = form.events.map((e) => (e.startsWith("start") && Number(e.slice(5)) > count ? "none" : e)) as VrrpEvent[];
    // The new form.
    setForm({ ...form, routers: v, late, events });
  };
  /** Set one router's typed priority. */
  const setPriority = (i: number, v: string) => setForm({ ...form, priorities: form.priorities.map((p, j) => (j === i ? v : p)) });
  /** Set one event. */
  const setEvent = (k: number, v: string) => setForm({ ...form, events: form.events.map((e, j) => (j === k ? (v as VrrpEvent) : e)) });

  // The router-count choices.
  const routerOptions = [2, 3, 4].map((k) => [String(k), t("routersOption", { n: k })] as const);
  // The Preempt_Mode choices.
  const preemptOptions = [
    ["on", t("preemptOn")],
    ["off", t("preemptOff")],
  ] as const;
  // The held-back choices: none, or one of the routers.
  const lateOptions = [["none", t("lateNone")] as const, ...Array.from({ length: n }, (_, i) => [String(i + 1), t("lateRouter", { r: i + 1 })] as const)];
  // The event choices: none, a failure, a shutdown, or a router starting.
  const eventOptions = [
    ["none", t("eventNone")] as const,
    ["fail", t("eventFail")] as const,
    ["shutdown", t("eventShutdown")] as const,
    ...Array.from({ length: n }, (_, i) => [`start${i + 1}`, t("eventStart", { r: i + 1 })] as const),
  ];

  /** Routers' names as a list ("R2 and R3"). */
  const names = (ix: number[]): string => lf.format(ix.map((i) => `R${i + 1}`));
  /** The sentence for one step. */
  const stepText = (s: Step, runningAtStart: number): string => {
    // The router that ends Active, 1-based, or zero.
    const a = s.active === null ? 0 : s.active + 1;
    // The router before, 1-based, or zero.
    const prev = s.previous === null ? 0 : s.previous + 1;
    // The router the event concerned, 1-based, or zero.
    const subj = s.subject === null ? 0 : s.subject + 1;
    // The sentence the outcome calls for.
    const main = (() => {
      // Each outcome in turn.
      switch (s.outcome) {
        // The owner at start.
        case "owner-at-start":
          return t("startOwner", { r: a });
        // An election at start, alone or among several.
        case "elected-at-start":
          return runningAtStart === 1
            ? t("startAlone", { r: a, time: cs(s.timeCs ?? 0) })
            : s.tied.length
              ? t("startTie", { time: cs(s.timeCs ?? 0) })
              : t("startElected", { r: a, p: prio(s.active ?? 0), time: cs(s.timeCs ?? 0) });
        // A silent failure.
        case "failover":
          return t("failover", { f: subj, r: a, p: prio(s.active ?? 0), time: cs(s.timeCs ?? 0) });
        // A clean shutdown.
        case "shutdown-handover":
          return t("shutdownHandover", { f: subj, r: a, p: prio(s.active ?? 0), time: cs(s.timeCs ?? 0) });
        // Nobody left.
        case "none-left":
          return t("noneLeft", { f: subj });
        // Nothing to stop.
        case "nothing-to-stop":
          return t("nothingToStop");
        // The owner takes it back.
        case "owner-preempts":
          return t("ownerPreempts", { r: subj, prev });
        // The owner alone.
        case "owner-alone":
          return t("ownerAlone", { r: subj });
        // A router alone.
        case "start-alone":
          return t("startAloneLater", { r: subj, time: cs(s.timeCs ?? 0) });
        // Preemption.
        case "preempts":
          return t("preempts", { r: subj, p: prio(subj - 1), prev, pp: prio(prev - 1), time: cs(s.timeCs ?? 0) });
        // A lower newcomer.
        case "stays-lower":
          return t("staysLower", { r: subj, p: prio(subj - 1), prev, pp: prio(prev - 1) });
        // An equal newcomer.
        case "stays-equal":
          return t("staysEqual", { r: subj, p: prio(subj - 1), prev });
        // A higher newcomer without preemption.
        case "stays-no-preempt":
          return t("staysNoPreempt", { r: subj, p: prio(subj - 1), prev, pp: prio(prev - 1) });
        // Already running.
        default:
          return t("alreadyRunning", { r: subj });
      }
    })();
    // A tie adds its own sentence: who timed out together and who stayed.
    const tie = s.tied.length ? ` ${t("tieLine", { list: names(s.tied), p: prio(s.tied[0]), r: a, addr: ADDRESSES[s.active ?? 0] })}` : "";
    // The next Backup in line, and how long its own timer would have run: the skew at work.
    const ru = s.runnerUp;
    // Its waiting time: Skew_Time after a priority-0 ADVERTISEMENT, Active_Down_Interval otherwise.
    const next = ru === null ? "" : ` ${t("runnerUp", { r: ru + 1, p: prio(ru), time: cs(s.outcome === "shutdown-handover" ? skewTime(prio(ru), input.intervalCs) : activeDownInterval(prio(ru), input.intervalCs)) })}`;
    // The sentence, then the tie, then the runner-up.
    return `${main}${tie}${next}`;
  };

  /** The result block for a valid input. */
  const resultBlock = (res: VrrpResult) => {
    // How many routers were running at the start.
    const runningAtStart = n - (form.late === "none" ? 0 : 1);
    // The final Active Router's priority, and the best running router's.
    const finalP = res.finalActive === null ? null : prio(res.finalActive);
    // The best running router's priority.
    const bestP = res.bestRunning === null ? null : prio(res.bestRunning);
    // A lower-priority Active Router kept by Preempt_Mode False is the case to flag.
    const kept = finalP !== null && bestP !== null && finalP < bestP;
    // The verdict sentence.
    const verdict =
      res.finalActive === null
        ? t("verdictNone")
        : kept
          ? t("verdictKept", { r: res.finalActive + 1, p: finalP ?? 0, best: (res.bestRunning ?? 0) + 1, bp: bestP ?? 0 })
          : t("verdictActive", { r: res.finalActive + 1, p: finalP ?? 0 });
    // No gateway is a stop, a kept lower priority a warning, anything else good news.
    const tone = res.finalActive === null ? "stop" : kept ? "warn" : "ok";
    // The numbered events that actually ran, for their labels.
    const eventNumbers = form.events.map((e, k) => (e === "none" ? 0 : k + 1)).filter((k) => k > 0);
    return (
      <>
        {/* The start, then each event, with the rule that decided it. */}
        <ol className="lab-steps">
          {res.steps.map((s, k) => (
            <li className="lab-step" key={k}>
              <span className="lab-step-where">{k === 0 ? t("stepStart") : t("stepEvent", { n: eventNumbers[k - 1] })}</span> {stepText(s, runningAtStart)}
            </li>
          ))}
        </ol>
        {/* Every router's timers and where it ended. */}
        <div className="lab-table-wrap">
          <table className="lab-table">
            <thead>
              <tr>
                <th scope="col">{t("colRouter")}</th>
                <th scope="col">{t("colPriority")}</th>
                <th scope="col">{t("colSkew")}</th>
                <th scope="col">{t("colDown")}</th>
                <th scope="col">{t("colState")}</th>
              </tr>
            </thead>
            <tbody>
              {res.rows.map((row) => (
                <tr key={row.index}>
                  <th scope="row">{row.owner ? t("ownerCell", { r: row.index + 1, addr: row.address }) : t("routerCell", { r: row.index + 1, addr: row.address })}</th>
                  <td>{row.priority}</td>
                  <td>{row.owner ? t("ownerNoWait") : t("csValue", { v: nfCs.format(row.skewCs) })}</td>
                  <td>{row.owner ? t("ownerNoWait") : cs(row.downCs)}</td>
                  <td>{row.finalState === "active" ? t("stateActive") : row.finalState === "backup" ? t("stateBackup") : t("stateDown")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* The outcome after the last event. */}
        <p>
          <span className={`lab-verdict lab-verdict--${tone}`}>{verdict}</span>
        </p>
        {/* The names: RFC 9568's against the older ones the lab's readers will meet in router output. */}
        <p className="lab-note">{t("noteTerms")}</p>
      </>
    );
  };

  // The refusal, worded for the reader.
  const errText =
    err === "bad-priority"
      ? t("errorPriority", { r: (errRouter ?? 0) + 1 })
      : err === "two-owners"
        ? t("errorTwoOwners")
        : err === "bad-interval"
          ? t("errorInterval", { max: MAX_INTERVAL_CS })
          : t("errorOther");

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          <LabField id={`${ID}-routers`} label={t("routers")}>
            <LabSelect id={`${ID}-routers`} value={form.routers} options={routerOptions} onChange={setRouters} />
          </LabField>
          {/* One priority per router taking part. */}
          {Array.from({ length: n }, (_, i) => (
            <LabField key={i} id={`${ID}-priority-${i + 1}`} label={t("priority", { r: i + 1 })}>
              <input
                id={`${ID}-priority-${i + 1}`}
                className="lab-input"
                type="number"
                inputMode="numeric"
                min={1}
                max={255}
                step={1}
                value={form.priorities[i]}
                aria-invalid={(err === "bad-priority" || err === "two-owners") && errRouter === i ? "true" : undefined}
                onChange={(e) => setPriority(i, e.target.value)}
              />
            </LabField>
          ))}
          <LabField id={`${ID}-preempt`} label={t("preempt")}>
            <LabSelect id={`${ID}-preempt`} value={form.preempt} options={preemptOptions} onChange={(v) => setForm({ ...form, preempt: v })} />
          </LabField>
          <LabField id={`${ID}-interval`} label={t("interval")}>
            <input
              id={`${ID}-interval`}
              className="lab-input"
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_INTERVAL_CS}
              step={1}
              value={form.interval}
              aria-invalid={err === "bad-interval" ? "true" : undefined}
              onChange={(e) => setForm({ ...form, interval: e.target.value })}
            />
          </LabField>
          <LabField id={`${ID}-late`} label={t("late")}>
            <LabSelect id={`${ID}-late`} value={form.late} options={lateOptions} onChange={(v) => setForm({ ...form, late: v as LateRouter })} />
          </LabField>
          {/* The three events, applied in order. */}
          {[0, 1, 2].map((k) => (
            <LabField key={k} id={`${ID}-event-${k + 1}`} label={t("event", { n: k + 1 })}>
              <LabSelect id={`${ID}-event-${k + 1}`} value={form.events[k]} options={eventOptions} onChange={(v) => setEvent(k, v)} />
            </LabField>
          ))}
        </>
      }
      result={r ? resultBlock(r) : <p className="lab-error">{errText}</p>}
      onExample={() => setForm(toForm(EXAMPLE_INPUT))}
      onReset={() => setForm(toForm(DEFAULT_INPUT))}
      scope={t("scope")}
    />
  );
}
