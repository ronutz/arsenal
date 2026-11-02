// ============================================================================
// src/components/FaultHypothesisBuilderTool.tsx
// ----------------------------------------------------------------------------
// FAULT HYPOTHESIS BUILDER - the Operations & Fieldcraft pilot's client.
//
// Quick mode first (D-86 §2 / SCOUT §4.4): six structured fields, results
// live on every change, value inside two minutes. Optional free-text detail
// (summary / impact / already-tried) flows ONLY into the export artifact,
// never into rule matching - the engine stays deterministic. D-83 Example
// loads the snapshot-vector scenario "deploy-5xx-regression" verbatim.
//
// Language discipline (D-86 §3.2) is structural here: cards say "hypothesis
// to test", show BOTH supports and weakens, and the Why panel exposes every
// fired rule - ranked advice you can audit, never an oracle.
//
// PAGE LANGUAGE (02/11/2026): the reading comes from runLocalisable() (every
// sentence an EngineText) and is turned into the page's language once, by
// inPageLanguage(); the cards, the Why panel and the exported worksheet then
// read in Portuguese on the pt-BR page and exactly as before in English. The
// engine is imported from compute directly (not the index, which also pulls
// the manifest and the vectors into the page).
// ============================================================================
"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  runLocalisable,
  artifactToMarkdown,
  type FhbInput,
  type Symptom,
  type Scope,
  type Change,
  type Timing,
  type Clue,
  type PresetId,
} from "@/lib/tools/fault-hypothesis-builder/compute"; // the reading with sentence ids (02/11/2026)
import { engineTexts } from "@/lib/tools/engine-text"; // engine sentences in the page's language
import { inPageLanguage } from "@/lib/tools/engine-text-page"; // a whole reading in the page's language
import { HypothesisCard, WhyPanel } from "@/components/fieldcraft/FieldcraftShared";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // a shared link fills the form as typing would
import type { ShareEncoding } from "@/lib/share/spec"; // what the button is given
import { FHB_SHARE, checkFhbNotes, encodeFhbShare, type FhbShareState } from "@/lib/tools/fault-hypothesis-builder/share"; // this tool's share spec: the form and the notes, checked

// D-83 Example - verbatim the "deploy-5xx-regression" snapshot vector input.
const EXAMPLE: FhbInput = {
  symptom: "errors-for-some",
  scope: "some-users",
  changed: ["software-deploy"],
  timing: "since-change",
  clues: ["http-5xx", "tcp-connects-but-app-errors"],
  preset: "load-balancer",
};

/** Share results with nothing to share: the button is disabled (the result is not shown yet). */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // module constant

const SYMPTOMS: Symptom[] = ["total-outage", "intermittent", "slow", "errors-for-some", "auth-failures", "cannot-reach-new-service"];
const SCOPES: Scope[] = ["one-user", "some-users", "one-site", "one-app", "everyone"];
const CHANGES: Change[] = ["nothing-known", "config-change", "software-deploy", "network-change", "cert-or-key", "capacity-growth", "provider-maintenance"];
const TIMINGS: Timing[] = ["constant", "intermittent-random", "time-of-day", "since-change"];
const CLUES: Clue[] = ["dns-fails", "works-by-ip-not-name", "tls-errors", "tcp-connects-but-app-errors", "timeouts", "slow-only-large-transfers", "one-path-works-other-not", "http-5xx", "http-4xx-auth"];
const PRESETS: PresetId[] = ["generic", "load-balancer", "dns", "tls-pki"];

const BLANK: FhbInput = {
  symptom: "intermittent",
  scope: "some-users",
  changed: ["nothing-known"],
  timing: "constant",
  clues: [],
  preset: "generic",
};

export default function FaultHypothesisBuilderTool() {
  const t = useTranslations("tools.fault-hypothesis-builder");
  const tx = useMemo(() => engineTexts(t), [t]); // the engine's sentences in the page's language

  const [input, setInput] = useState<FhbInput>(BLANK);
  const [notes, setNotes] = useState({ summary: "", impact: "", alreadyTried: "" });
  const [touched, setTouched] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  // Live, local, deterministic. Notes are appended at render time so typing
  // free text never re-fires rules (it cannot affect them anyway).
  const result = useMemo(() => {
    if (!touched) return null;
    const withNotes: FhbInput = {
      ...input,
      notes: {
        summary: notes.summary.trim() || undefined,
        impact: notes.impact.trim() || undefined,
        alreadyTried: notes.alreadyTried.trim() || undefined,
      },
    };
    return inPageLanguage(runLocalisable(withNotes), tx); // the reading, in the page's language
  }, [input, notes, touched, tx]);

  // Share results (2026-11-01): the form and the notes as one state; the notes check runs once per change and feeds
  // the button, the caution line and the blocked message; there is something to share only with hypotheses shown.
  const shareState = useMemo<FhbShareState>(() => ({ input, notes }), [input, notes]); // what a link carries
  const shareCheck = useMemo(() => checkFhbNotes(shareState), [shareState]); // credentials and secret-looking names in the notes
  const share = useMemo<ShareEncoding>(() => (result ? encodeFhbShare(shareState, shareCheck) : NOTHING), [result, shareState, shareCheck]); // the button's encoding
  const shareMaybe = shareCheck.maybe[0] ?? null; // the first secret-looking value, for the caution line
  // A note's link name to the label the form shows for it (the popover names the note it found something in).
  const NOTE_LABEL: Record<string, string> = { summary: "notes.summary", impact: "notes.impact", alreadytried: "notes.alreadyTried" }; // link name -> message key
  const noteLabel = (field: string): string => (NOTE_LABEL[field] ? t(NOTE_LABEL[field]) : field); // the form's own words
  // A shared link sets the choices, the ticked changes and clues, and the notes as typing would; the evidence ticks start empty.
  useShareArrival(FHB_SHARE, (s) => { setInput({ ...s.input }); setNotes({ ...s.notes }); setChecked(new Set()); setTouched(true); });

  const set = <K extends keyof FhbInput>(k: K, v: FhbInput[K]) => {
    setTouched(true);
    setInput((cur) => ({ ...cur, [k]: v }));
  };

  const toggleMulti = (k: "changed" | "clues", v: Change | Clue) => {
    setTouched(true);
    setInput((cur) => {
      const list = new Set(cur[k] as string[]);
      if (list.has(v)) list.delete(v);
      else list.add(v);
      if (k === "changed") {
        // "nothing-known" is exclusive with actual changes, both ways.
        if (v === "nothing-known" && list.has(v)) list.clear(), list.add(v);
        else if (list.size > 1) list.delete("nothing-known");
        if (list.size === 0) list.add("nothing-known");
      }
      // Preserve canonical (registry) order so rule firing order is stable.
      const canon = (k === "changed" ? CHANGES : CLUES) as string[];
      return { ...cur, [k]: canon.filter((c) => list.has(c)) as never };
    });
  };

  const toggleChecked = (id: string) =>
    setChecked((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const exportMarkdown = () => {
    if (!result) return "";
    // Mark checked evidence in the artifact at export time (client-side date).
    const md = artifactToMarkdown({ ...result.artifact, generated: new Date().toISOString().slice(0, 10) }, tx); // the Generated line in the page's language too
    return checked.size === 0
      ? md
      : md
          .split("\n")
          .map((line) => {
            const m = /^- \[ \] (.*)$/.exec(line);
            if (!m) return line;
            const hyp = result.hypotheses.find((h) => h.evidence.some((e) => e.action === m[1]));
            const item = hyp?.evidence.find((e) => e.action === m[1]);
            return item && checked.has(item.id) ? `- [x] ${m[1]}` : line;
          })
          .join("\n");
  };

  const copyMd = async () => {
    try {
      await navigator.clipboard.writeText(exportMarkdown());
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable: the download path remains */
    }
  };

  const downloadMd = () => {
    const blob = new Blob([exportMarkdown()], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fault-hypothesis-worksheet.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectField = (
    key: "symptom" | "scope" | "timing" | "preset",
    options: readonly string[],
  ) => (
    <div className="fc-field">
      <label className="cidr-label" htmlFor={`fhb-${key}`}>
        {t(`form.${key}`)}
      </label>
      <select
        id={`fhb-${key}`}
        className="cidr-input"
        value={input[key]}
        onChange={(e) => set(key, e.target.value as never)}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {t(`options.${o}`)}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="cidr-tool jwt-tool">
      <div className="dig-input-head">
        <span className="cidr-label">{t("form.heading")}</span>
        <div className="dig-input-actions">
          <button
            type="button"
            className="b64-copy"
            onClick={() => {
              setInput(EXAMPLE);
              setNotes({ summary: "", impact: "", alreadyTried: "" });
              setChecked(new Set());
              setTouched(true);
            }}
          >
            {t("example")}
          </button>
          <button
            type="button"
            className="b64-copy"
            onClick={() => {
              setInput(BLANK);
              setNotes({ summary: "", impact: "", alreadyTried: "" });
              setChecked(new Set());
              setTouched(false);
            }}
          >
            {t("clear")}
          </button>
        </div>
      </div>

      <div className="fc-form-grid">
        {selectField("symptom", SYMPTOMS)}
        {selectField("scope", SCOPES)}
        {selectField("timing", TIMINGS)}
        {selectField("preset", PRESETS)}
      </div>

      <div className="fc-field">
        <span className="cidr-label">{t("form.changed")}</span>
        <div className="fc-check-group">
          {CHANGES.map((c) => (
            <label key={c}>
              <input type="checkbox" checked={input.changed.includes(c)} onChange={() => toggleMulti("changed", c)} />{" "}
              {t(`options.${c}`)}
            </label>
          ))}
        </div>
      </div>

      <div className="fc-field">
        <span className="cidr-label">{t("form.clues")}</span>
        <div className="fc-check-group">
          {CLUES.map((c) => (
            <label key={c}>
              <input type="checkbox" checked={input.clues.includes(c)} onChange={() => toggleMulti("clues", c)} />{" "}
              {t(`options.${c}`)}
            </label>
          ))}
        </div>
      </div>

      {/* Optional structured detail (SCOUT §4.4): artifact-only by design. */}
      <details className="fc-notes">
        <summary className="cipher-note">{t("notes.heading")}</summary>
        <p className="cipher-note">{t("notes.hint")}</p>
        {(["summary", "impact", "alreadyTried"] as const).map((k) => (
          <div className="fc-field" key={k}>
            <label className="cidr-label" htmlFor={`fhb-note-${k}`}>
              {t(`notes.${k}`)}
            </label>
            <input
              id={`fhb-note-${k}`}
              className="cidr-input"
              value={notes[k]}
              onChange={(e) => setNotes((cur) => ({ ...cur, [k]: e.target.value }))}
            />
          </div>
        ))}
      </details>

      <p className="cidr-privacy">
        <span className="cidr-lock" aria-hidden="true">
          🔒
        </span>{" "}
        {t("runsLocally")}
      </p>

      {!result && <p className="cipher-note">{t("emptyState")}</p>}

      {result && (
        <div className="jwt-results">
          {result.warnings.map((w) => (
            <p key={w.id} className="fc-warning" role="note">
              {w.message}
            </p>
          ))}

          <h3 className="jwt-panel-title">{t("results.heading")}</h3>
          <p className="cipher-note">{t("results.framing")}</p>

          {/* Share results (2026-11-01): under the worksheet's heading, before the ranked hypotheses. The caution and a note's secret-looking value show only beside a link;
              a note holding a credential gives no link, naming the note. */}
          <div className="rdap-ask-row">
            <ShareResultsButton
              encoding={share}
              carries={t("share.carries")}
              details={[t("share.caution"), ...(shareMaybe ? [t("share.maybeSecret", { field: noteLabel(shareMaybe.field), label: shareMaybe.label })] : [])]}
              blockedMessage={!share.ok && share.reason === "blocked" ? t("share.blockedSecret", { field: noteLabel(String(share.values?.field ?? "")), label: String(share.values?.label ?? "") }) : ""}
              title={t("name")}
            />
          </div>

          {result.hypotheses.map((h, i) => (
            <HypothesisCard
              key={h.id}
              rank={i + 1}
              hypothesis={h}
              signalLabel={t(`results.signal.${h.signal}`)}
              headings={{
                evidence: t("results.evidenceHeading"),
                supports: t("results.supportsHeading"),
                weakens: t("results.weakensHeading"),
              }}
              checked={checked}
              onToggle={toggleChecked}
            />
          ))}

          <WhyPanel hypotheses={result.hypotheses} heading={t("results.whyHeading")} intro={t("results.whyIntro")} />

          <div className="fc-export-row">
            <button type="button" className="b64-copy" onClick={copyMd}>
              {copied ? t("results.copied") : t("results.copyMd")}
            </button>
            <button type="button" className="b64-copy" onClick={downloadMd}>
              {t("results.downloadMd")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
