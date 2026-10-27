"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/BgpBestPathLab.tsx
// ----------------------------------------------------------------------------
// THE BGP BEST-PATH LAB (2026-10-26), embedded in "BGP: how the internet
// decides where traffic goes" as <Lab id="bgp-best-path" />. Four selects set
// the decision profile, how many paths are in play, the best path before this
// run (for the profiles that use it) and which path is being edited; the
// edited path's attributes follow, so the controls stay one column on a phone.
// The result is a table of the paths and their fate, the decision step by step
// (each step's values, what it removed, and where one path was left), and the
// verdict. The model is src/lib/labs/bgp-best-path/compute.ts; its checked
// cases are the golden vectors beside it. Words: "learnLabs.bgp-best-path".
// ============================================================================

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import LabFrame, { LabField, LabSelect } from "./LabFrame";
import {
  BgpError,
  compute,
  DEFAULT_INPUT,
  EXAMPLE_INPUT,
  LETTERS,
  LOCAL_AS,
  type BgpErrorCode,
  type BgpInput,
  type BgpResult,
  type Learned,
  type Origin,
  type PathInput,
  type Previous,
  type Profile,
  type Step,
  type StepId,
} from "@/lib/labs/bgp-best-path/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "bgp-best-path";
/** The local AS as text: AS numbers are names, never grouped like quantities (64496, not 64,496). */
const AS_TEXT = String(LOCAL_AS);

/** The text fields of a path, by the error codes that concern them. */
const FIELD_OF: Partial<Record<BgpErrorCode, keyof PathInput>> = {
  "bad-local-pref": "localPref",
  "bad-as-path": "asPath",
  "ebgp-empty-path": "asPath",
  "cisco-own-as-ibgp": "asPath",
  "bad-med": "med",
  "bad-cost": "igpCost",
  "bad-id": "bgpId",
  "bad-peer": "peer",
  "duplicate-peer": "peer",
  "bad-originator": "originatorId",
};

export default function BgpBestPathLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.bgp-best-path");
  // The page's language, for numbers and lists.
  const locale = useLocale();
  // Whole numbers with grouping.
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  // Lists in the page's language; English as British English writes them, without the serial comma ("a, b and c").
  const lf = new Intl.ListFormat(locale === "en" ? "en-GB" : locale, { style: "long", type: "conjunction" });
  // "A 100, B 100, C 200" in the page's language.
  const uf = new Intl.ListFormat(locale, { style: "short", type: "unit" });
  // The reader's settings, opening on the article's MED case.
  const [input, setInput] = useState<BgpInput>(DEFAULT_INPUT);
  // The path being edited (0-based).
  const [edit, setEdit] = useState(0);
  // Never past the paths in play.
  const ei = Math.min(edit, input.count - 1);
  // The edited path.
  const ep = input.paths[ei];

  // The model's answer, or the refusal.
  let r: BgpResult | null = null;
  // The refusal's code and path, when there is one.
  let err: { code: BgpErrorCode; path: number } | null = null;
  // Run the pure model.
  try {
    // Compute.
    r = compute(input);
  } catch (e) {
    // Only the model's own refusals are expected here.
    if (e instanceof BgpError) err = { code: e.code, path: e.path };
    // Anything else is a bug and must surface.
    else throw e;
  }

  /** Change one field of the edited path. */
  const setField = (field: keyof PathInput, value: string | boolean) => {
    // A copy of the paths with the one field changed.
    const paths = input.paths.map((p, j) => (j === ei ? { ...p, [field]: value } : p));
    // The new settings.
    setInput({ ...input, paths });
  };
  /** True when the refusal concerns this field of the edited path. */
  const invalid = (field: keyof PathInput): "true" | undefined => (err && err.path === ei && FIELD_OF[err.code] === field ? "true" : undefined);

  // The profile options.
  const profileOptions = [
    ["rfc", t("profileRfc")],
    ["rfc5004", t("profileRfc5004")],
    ["cisco", t("profileCisco")],
  ] as const;
  // The count options.
  const countOptions = [2, 3, 4].map((n) => [String(n), t("countOption", { n })] as const);
  // The previous-path options: none, or a path in play.
  const previousOptions = [["none", t("previousNone")] as const, ...LETTERS.slice(0, input.count).map((l) => [l, t("pathName", { path: l })] as const)];
  // The edit options: the paths in play.
  const editOptions = LETTERS.slice(0, input.count).map((l, i) => [String(i), t("pathName", { path: l })] as const);
  // How a path was learned.
  const learnedOptions = [
    ["ebgp", t("learnedEbgp")],
    ["ibgp", t("learnedIbgp")],
    ["ibgp-rr", t("learnedRr")],
  ] as const;
  // NEXT_HOP resolution.
  const resolvableOptions = [
    ["yes", t("resolvableYes")],
    ["no", t("resolvableNo")],
  ] as const;
  // ORIGIN.
  const originOptions = [
    ["igp", "IGP"],
    ["egp", "EGP"],
    ["incomplete", "INCOMPLETE"],
  ] as const;
  // Cisco WEIGHT.
  const weightOptions = ["0", "100", "200"].map((w) => [w, nf.format(Number(w))] as const);
  // CLUSTER_LIST length.
  const clusterOptions = ["1", "2", "3"].map((n) => [n, nf.format(Number(n))] as const);

  /** A step's short name, in the profile's own numbering. */
  const stepName = (id: StepId): string => {
    // Cisco numbers its steps.
    if (input.profile === "cisco") {
      // Each Cisco step by its number and name.
      const cisco: Record<StepId, string> = {
        exclude: t("nameExclude"),
        weight: t("ciscoWeight"),
        pref: t("ciscoPref"),
        a: t("ciscoA"),
        b: t("ciscoB"),
        c: t("ciscoC"),
        d: t("ciscoD"),
        e: t("ciscoE"),
        keep: t("ciscoKeep"),
        f: t("ciscoF"),
        cluster: t("ciscoCluster"),
        g: t("ciscoG"),
      };
      // The name.
      return cisco[id];
    }
    // The RFC's letters and RFC 4456's and RFC 5004's steps.
    const rfc: Record<StepId, string> = {
      exclude: t("nameExclude"),
      weight: t("ciscoWeight"),
      pref: t("namePref"),
      a: t("nameA"),
      b: t("nameB"),
      c: t("nameC"),
      d: t("nameD"),
      e: t("nameE"),
      keep: t("nameKeep"),
      f: t("nameF"),
      cluster: t("nameCluster"),
      g: t("nameG"),
    };
    // The name.
    return rfc[id];
  };

  /** One step's values and outcome, in words. */
  const stepText = (s: Step, res: BgpResult): string => {
    // The exclusions before phase 2.
    if (s.id === "exclude") {
      // Nothing excluded.
      if (!s.excluded?.length) return t("excludeNone", { as: AS_TEXT });
      // Each exclusion with its reason.
      const list = s.excluded.map((x) => (x.reason === "unresolvable" ? t("excludeUnresolvable", { path: x.path }) : t("excludeOwnAs", { path: x.path, as: AS_TEXT })));
      // The sentence, singular or plural.
      return t("excludeList", { list: lf.format(list), count: list.length });
    }
    // The keep step speaks in whole sentences.
    if (s.id === "keep" && s.keep) {
      // Its parameters.
      const k = s.keep;
      // RFC 5004 and Cisco word it differently.
      const cisco = input.profile === "cisco";
      // The sentence for each outcome.
      const text =
        k.outcome === "no-previous"
          ? t(cisco ? "ciscoNoPrevious" : "keepNoPrevious")
          : k.outcome === "not-in-contention"
            ? t("keepNotInContention", { path: k.favoured ?? "" })
            : k.outcome === "not-external"
              ? t(cisco ? "ciscoNotExternal" : "keepNotExternal")
              : k.outcome === "wins-anyway"
                ? t("keepWinsAnyway", { path: k.favoured ?? "" })
                : k.outcome === "same-id"
                  ? cisco
                    ? t("ciscoSameId", { path: k.favoured ?? "" })
                    : t("keepSameId", { path: k.favoured ?? "", wouldBe: k.wouldBe ?? "" })
                  : cisco
                    ? t("ciscoApplied", { path: k.favoured ?? "" })
                    : t("keepApplied", { path: k.favoured ?? "", wouldBe: k.wouldBe ?? "" });
      // With what it removed.
      return `${text} ${outcomeText(s, res)}`;
    }
    // Step c: the groups by neighbouring AS.
    if (s.id === "c" && s.groups) {
      // Each group's members and MEDs.
      const groups = s.groups.map((g) =>
        t("medGroup", {
          as: String(g.as),
          list: uf.format(g.members.map((m) => t("valuePair", { path: m.path, value: m.med === null ? t("medNone") : nf.format(m.med) }))),
        }),
      );
      // The groups, then the outcome.
      return `${t("medGroups", { groups: groups.join("; ") })} ${outcomeText(s, res)}`;
    }
    /** One value, in words. */
    const valueText = (v: Step["values"][number]): string => {
      // ORIGIN codes as names.
      if (s.id === "b") return ["IGP", "EGP", "INCOMPLETE"][Number(v.value)];
      // eBGP or iBGP.
      if (s.id === "d") return v.value === "ebgp" ? t("valueEbgp") : t("valueIbgp");
      // Addresses and identifiers as they are.
      if (typeof v.value === "string") return v.originator ? t("valueOriginator", { value: v.value }) : v.value;
      // Numbers with grouping.
      return nf.format(Number(v.value));
    };
    // Every considered path's value.
    const values = uf.format(s.values.map((v) => t("valuePair", { path: v.path, value: valueText(v) })));
    // The values, then the outcome.
    return `${t("values", { list: values })} ${outcomeText(s, res)}`;
  };

  /** What a step removed, and whether it decided. */
  const outcomeText = (s: Step, res: BgpResult): string =>
    s.removed.length === 0
      ? t("removedNone")
      : res.decidedBy === s.id && res.best
        ? t("decided", { list: lf.format(s.removed), count: s.removed.length, best: res.best })
        : t("removed", { list: lf.format(s.removed), count: s.removed.length });

  /** The refusal, worded. */
  const errText = (e: { code: BgpErrorCode; path: number }): string => {
    // The path it concerns, by letter.
    const path = e.path >= 0 ? LETTERS[e.path] : "";
    // One sentence per code.
    const key: Record<BgpErrorCode, string> = {
      "bad-choice": "errorChoice",
      "bad-local-pref": "errorLocalPref",
      "bad-as-path": "errorAsPath",
      "ebgp-empty-path": "errorEbgpEmpty",
      "bad-med": "errorMed",
      "bad-cost": "errorCost",
      "bad-id": "errorId",
      "bad-peer": "errorPeer",
      "bad-originator": "errorOriginator",
      "duplicate-peer": "errorDuplicatePeer",
      "cisco-own-as-ibgp": "errorCiscoOwnAs",
    };
    // The sentence.
    return t(key[e.code], { path, as: AS_TEXT });
  };

  /** How a path was learned, briefly. */
  const learnedShort = (l: Learned): string => (l === "ebgp" ? t("valueEbgp") : l === "ibgp" ? t("valueIbgp") : t("learnedShortRr"));

  /** The result block for a valid input. */
  const resultBlock = (res: BgpResult) => {
    // The verdict sentence.
    const verdict = res.best === null ? t("verdictNone") : res.decidedBy === "exclude" ? t("verdictOnly", { path: res.best }) : t("verdictBest", { path: res.best, step: stepName(res.decidedBy ?? "g") });
    // The winner's outcome row, for the MED note.
    const win = res.outcomes.find((o) => o.status === "best");
    // The paths step c compared, if the decision reached it.
    const atC = res.steps.find((s) => s.id === "c")?.considered ?? [];
    // Paths step c saw, from another neighbouring AS, with a lower MED than the winner's (absent counts as 0).
    const lowerElsewhere = win ? res.outcomes.filter((o) => atC.includes(o.path) && o.neighbourAs !== win.neighbourAs && (o.med ?? 0) < (win.med ?? 0)).map((o) => o.path) : [];
    return (
      <>
        {/* The paths and their fate. */}
        <div className="lab-table-wrap">
          <table className="lab-table">
            <thead>
              <tr>
                <th scope="col">{t("colPath")}</th>
                <th scope="col">{t("colLearned")}</th>
                <th scope="col">{t("colAsPath")}</th>
                <th scope="col">{t("colOutcome")}</th>
              </tr>
            </thead>
            <tbody>
              {res.outcomes.map((o, i) => (
                <tr key={o.path}>
                  <th scope="row">{o.path}</th>
                  <td>{learnedShort(input.paths[i].learned)}</td>
                  <td className="mono">{input.paths[i].asPath.trim() === "" ? t("emptyPath") : input.paths[i].asPath.trim().split(/\s+/).join(" ")}</td>
                  <td>{o.status === "best" ? t("outcomeBest") : o.status === "excluded" ? t("outcomeExcluded") : t("outcomeRemoved", { step: stepName(o.step ?? "g") })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* The decision, step by step, up to the one that left a single path. */}
        <ol className="lab-steps">
          {res.steps.map((s) => (
            <li className="lab-step" key={s.id}>
              <span className="lab-step-where">{t("where", { step: stepName(s.id) })}</span> {stepText(s, res)}
            </li>
          ))}
          <li className="lab-step">
            <span className="lab-step-where">{t("whereVerdict")}</span> <span className={`lab-verdict lab-verdict--${res.best ? "ok" : "stop"}`}>{verdict}</span>
          </li>
        </ol>
        {/* The MED surprise: the winner's MED is higher than a path's from another AS. */}
        {win && lowerElsewhere.length > 0 && <p className="lab-note">{t("noteMed", { path: win.path, med: nf.format(win.med ?? 0), others: lf.format(lowerElsewhere), count: lowerElsewhere.length })}</p>}
        {/* What the Cisco profile does not show. */}
        {input.profile === "cisco" && <p className="lab-note">{t("noteCisco")}</p>}
      </>
    );
  };

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          <LabField id={`${ID}-profile`} label={t("profile")}>
            <LabSelect id={`${ID}-profile`} value={input.profile} options={profileOptions} onChange={(v) => setInput({ ...input, profile: v as Profile })} />
          </LabField>
          <LabField id={`${ID}-count`} label={t("count")}>
            <LabSelect
              id={`${ID}-count`}
              value={String(input.count)}
              options={countOptions}
              onChange={(v) => {
                // The new count.
                const count = Number(v);
                // The previous path, unless it falls out of play.
                const previous: Previous = input.previous !== "none" && LETTERS.indexOf(input.previous) >= count ? "none" : input.previous;
                // Apply both.
                setInput({ ...input, count, previous });
              }}
            />
          </LabField>
          {input.profile !== "rfc" && (
            <LabField id={`${ID}-previous`} label={t("previous")}>
              <LabSelect id={`${ID}-previous`} value={input.previous} options={previousOptions} onChange={(v) => setInput({ ...input, previous: v as Previous })} />
            </LabField>
          )}
          <LabField id={`${ID}-edit`} label={t("edit")}>
            <LabSelect id={`${ID}-edit`} value={String(ei)} options={editOptions} onChange={(v) => setEdit(Number(v))} />
          </LabField>
          <LabField id={`${ID}-learned`} label={t("learned", { path: LETTERS[ei] })}>
            <LabSelect id={`${ID}-learned`} value={ep.learned} options={learnedOptions} onChange={(v) => setField("learned", v as Learned)} />
          </LabField>
          <LabField id={`${ID}-resolvable`} label={t("resolvable")}>
            <LabSelect id={`${ID}-resolvable`} value={ep.resolvable ? "yes" : "no"} options={resolvableOptions} onChange={(v) => setField("resolvable", v === "yes")} />
          </LabField>
          {input.profile === "cisco" && (
            <LabField id={`${ID}-weight`} label={t("weight")}>
              <LabSelect id={`${ID}-weight`} value={ep.weight} options={weightOptions} onChange={(v) => setField("weight", v)} />
            </LabField>
          )}
          <LabField id={`${ID}-local-pref`} label={t("localPref")}>
            <input id={`${ID}-local-pref`} className="lab-input" type="text" inputMode="numeric" autoComplete="off" value={ep.localPref} aria-invalid={invalid("localPref")} onChange={(e) => setField("localPref", e.target.value)} />
          </LabField>
          <LabField id={`${ID}-as-path`} label={t("asPath")}>
            <input id={`${ID}-as-path`} className="lab-input mono" type="text" inputMode="numeric" autoComplete="off" spellCheck={false} value={ep.asPath} aria-invalid={invalid("asPath")} onChange={(e) => setField("asPath", e.target.value)} />
          </LabField>
          <LabField id={`${ID}-origin`} label={t("origin")}>
            <LabSelect id={`${ID}-origin`} value={ep.origin} options={originOptions} onChange={(v) => setField("origin", v as Origin)} />
          </LabField>
          <LabField id={`${ID}-med`} label={t("med")}>
            <input id={`${ID}-med`} className="lab-input" type="text" inputMode="numeric" autoComplete="off" value={ep.med} aria-invalid={invalid("med")} onChange={(e) => setField("med", e.target.value)} />
          </LabField>
          <LabField id={`${ID}-igp-cost`} label={t("igpCost")}>
            <input id={`${ID}-igp-cost`} className="lab-input" type="text" inputMode="numeric" autoComplete="off" value={ep.igpCost} aria-invalid={invalid("igpCost")} onChange={(e) => setField("igpCost", e.target.value)} />
          </LabField>
          <LabField id={`${ID}-bgp-id`} label={t("bgpId")}>
            <input id={`${ID}-bgp-id`} className="lab-input mono" type="text" inputMode="decimal" autoComplete="off" spellCheck={false} value={ep.bgpId} aria-invalid={invalid("bgpId")} onChange={(e) => setField("bgpId", e.target.value)} />
          </LabField>
          <LabField id={`${ID}-peer`} label={t("peer")}>
            <input id={`${ID}-peer`} className="lab-input mono" type="text" inputMode="decimal" autoComplete="off" spellCheck={false} value={ep.peer} aria-invalid={invalid("peer")} onChange={(e) => setField("peer", e.target.value)} />
          </LabField>
          {ep.learned === "ibgp-rr" && (
            <>
              <LabField id={`${ID}-originator-id`} label={t("originatorId")}>
                <input id={`${ID}-originator-id`} className="lab-input mono" type="text" inputMode="decimal" autoComplete="off" spellCheck={false} value={ep.originatorId} aria-invalid={invalid("originatorId")} onChange={(e) => setField("originatorId", e.target.value)} />
              </LabField>
              <LabField id={`${ID}-cluster-length`} label={t("clusterLength")}>
                <LabSelect id={`${ID}-cluster-length`} value={ep.clusterLength} options={clusterOptions} onChange={(v) => setField("clusterLength", v)} />
              </LabField>
            </>
          )}
        </>
      }
      result={r ? resultBlock(r) : <p className="lab-error">{err ? errText(err) : t("errorChoice")}</p>}
      onExample={() => {
        // The Example's paths, and path A in the editor.
        setInput(EXAMPLE_INPUT);
        // Start editing from the first path.
        setEdit(0);
      }}
      onReset={() => {
        // The opening paths, and path A in the editor.
        setInput(DEFAULT_INPUT);
        // Start editing from the first path.
        setEdit(0);
      }}
      scope={t("scope")}
    />
  );
}
