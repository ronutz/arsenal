// ============================================================================
// src/components/ChangeBlastRadiusMapperTool.tsx
// ----------------------------------------------------------------------------
// CHANGE BLAST-RADIUS MAPPER (client island) - Operations & Fieldcraft tool 4
// (D-86). Describe what you are changing and its structural characteristics
// through a small closed-enum form; the deterministic engine maps the blast
// radius as concentric tiers (target -> co-located -> downstream -> human),
// each populated with the categories of thing that could be affected, plus
// severity-tagged risks and containment measures. One click exports a Markdown
// blast-radius assessment.
//
// It maps CATEGORIES from what you describe - it has no topology of its own -
// and maps what COULD be affected, never asserts what will break (D-86 §3.5).
//
// The engine runs entirely here in the browser: same input -> same map, pinned
// by rule-firing snapshot vectors (D-86 §3.1). Tier/risk/containment text is
// canonical English from the engine (vector-pinned); form chrome is localized.
// ============================================================================
"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  run,
  artifactToMarkdown,
  TIER_ORDER,
  RULE_REASONS,
  type BlastInput,
  type TargetType,
  type Colocation,
  type TrafficPath,
  type Dependents,
  type Redundancy,
  type UserReach,
  type PresetId,
} from "@/lib/tools/change-blast-radius-mapper";
import { SignalBadge } from "@/components/fieldcraft/FieldcraftShared";

// D-83 Example - verbatim the "cert-shared-inpath-everyone" snapshot vector.
const EXAMPLE: BlastInput = {
  target: "certificate",
  colocation: "heavily-shared",
  trafficPath: "in-path",
  dependents: "many",
  redundancy: "ha-pair-healthy",
  userReach: "everyone",
  preset: "tls-pki",
};

// A neutral starting point: a dedicated, out-of-band, low-reach change so the
// first render is a small contained map rather than an alarming one.
const BLANK: BlastInput = {
  target: "single-server",
  colocation: "dedicated",
  trafficPath: "out-of-band",
  dependents: "none-known",
  redundancy: "ha-pair-healthy",
  userReach: "internal-team",
  preset: "generic",
};

const TARGETS: TargetType[] = ["single-server", "network-device", "load-balancer", "dns-record", "certificate", "firewall-policy", "shared-platform", "database"];
const COLOCATIONS: Colocation[] = ["dedicated", "some-shared", "heavily-shared"];
const TRAFFIC_PATHS: TrafficPath[] = ["in-path", "control-plane", "out-of-band"];
const DEPENDENTS: Dependents[] = ["none-known", "a-few", "many", "everything"];
const REDUNDANCIES: Redundancy[] = ["ha-pair-healthy", "ha-pair-degraded", "cluster", "standalone"];
const USER_REACHES: UserReach[] = ["internal-team", "one-app", "one-site", "customer-facing", "everyone"];
const PRESETS: PresetId[] = ["generic", "load-balancer", "dns", "tls-pki", "firewall"];

const SEVERITY_SIGNAL: Record<"low" | "medium" | "high", "weak" | "moderate" | "strong"> = {
  low: "weak",
  medium: "moderate",
  high: "strong",
};

const BAND_SIGNAL: Record<"contained" | "moderate" | "wide", "weak" | "moderate" | "strong"> = {
  contained: "weak",
  moderate: "moderate",
  wide: "strong",
};

export default function ChangeBlastRadiusMapperTool() {
  const t = useTranslations("tools.change-blast-radius-mapper");

  const [input, setInput] = useState<BlastInput>(BLANK);
  const [notes, setNotes] = useState({ summary: "", targetDetail: "" });
  const [touched, setTouched] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!touched) return null;
    const withNotes: BlastInput = {
      ...input,
      notes: {
        summary: notes.summary.trim() || undefined,
        targetDetail: notes.targetDetail.trim() || undefined,
      },
    };
    return run(withNotes);
  }, [input, notes, touched]);

  const set = <K extends keyof BlastInput>(k: K, v: BlastInput[K]) => {
    setTouched(true);
    setInput((cur) => ({ ...cur, [k]: v }));
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
    const md = artifactToMarkdown({ ...result.artifact, generated: new Date().toISOString().slice(0, 10) });
    if (checked.size === 0) return md;
    const allContain = result.containment;
    return md
      .split("\n")
      .map((line) => {
        const m = /^- \[ \] (.*)$/.exec(line);
        if (!m) return line;
        const c = allContain.find((x) => x.text === m[1]);
        return c && checked.has(c.id) ? `- [x] ${m[1]}` : line;
      })
      .join("\n");
  };
  const copyMd = async () => {
    try {
      await navigator.clipboard.writeText(exportMarkdown());
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };
  const downloadMd = () => {
    const blob = new Blob([exportMarkdown()], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "blast-radius-assessment.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectField = (
    key: "target" | "colocation" | "trafficPath" | "dependents" | "redundancy" | "userReach" | "preset",
    options: readonly string[],
  ) => (
    <div className="fc-field">
      <label className="cidr-label" htmlFor={`blast-${key}`}>
        {t(`form.${key}`)}
      </label>
      <select id={`blast-${key}`} className="cidr-input" value={input[key]} onChange={(e) => set(key, e.target.value as never)}>
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
              setNotes({ summary: "", targetDetail: "" });
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
              setNotes({ summary: "", targetDetail: "" });
              setChecked(new Set());
              setTouched(false);
            }}
          >
            {t("clear")}
          </button>
        </div>
      </div>

      <div className="fc-form-grid">
        {selectField("target", TARGETS)}
        {selectField("colocation", COLOCATIONS)}
        {selectField("trafficPath", TRAFFIC_PATHS)}
        {selectField("dependents", DEPENDENTS)}
        {selectField("redundancy", REDUNDANCIES)}
        {selectField("userReach", USER_REACHES)}
        {selectField("preset", PRESETS)}
      </div>

      {/* Optional structured detail: artifact-only by design. */}
      <details className="fc-notes">
        <summary className="cipher-note">{t("notes.heading")}</summary>
        <p className="cipher-note">{t("notes.hint")}</p>
        {(["summary", "targetDetail"] as const).map((k) => (
          <div className="fc-field" key={k}>
            <label className="cidr-label" htmlFor={`blast-note-${k}`}>
              {t(`notes.${k}`)}
            </label>
            <input
              id={`blast-note-${k}`}
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

          <div className="blast-band-head">
            <h3 className="jwt-panel-title">{t("results.heading")}</h3>
            <SignalBadge signal={BAND_SIGNAL[result.radiusBand]} label={t(`results.band.${result.radiusBand}`)} />
          </div>
          <p className="cipher-note">{t("results.framing")}</p>

          {/* Concentric tiers, in TIER_ORDER. */}
          {result.tiers.map((tier) => (
            <section key={tier.tier} className="fc-card blast-tier">
              <div className="blast-tier-head">
                <span className="blast-tier-num mono">{TIER_ORDER.indexOf(tier.tier) + 1}</span>
                <h4 className="fc-card-title">{t(`tiers.${tier.tier}`)}</h4>
              </div>
              <ul className="blast-items">
                {tier.items.map((it) => (
                  <li key={it.id} className="blast-item">
                    {it.text}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {/* Risk factors. */}
          {result.risks.length > 0 && (
            <section className="fc-card blast-risks">
              <p className="fc-subhead">{t("results.risksHeading")}</p>
              <ul className="blast-risk-list">
                {result.risks.map((r) => (
                  <li key={r.id} className="blast-risk-item">
                    <SignalBadge signal={SEVERITY_SIGNAL[r.severity]} label={t(`results.severity.${r.severity}`)} />{" "}
                    <span className="blast-risk-label">{r.label}</span>
                    {r.note ? <span className="blast-risk-note"> - {r.note}</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Containment measures (checkable). */}
          {result.containment.length > 0 && (
            <section className="fc-card blast-containment">
              <p className="fc-subhead">{t("results.containmentHeading")}</p>
              <ul className="blast-contain-list">
                {result.containment.map((c) => (
                  <li key={c.id} className="blast-contain-item">
                    <label>
                      <input type="checkbox" checked={checked.has(c.id)} onChange={() => toggleChecked(c.id)} /> <span>{c.text}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Why this map? - the fired-rule trail. */}
          <WhyRules fired={result.firedRuleIds} heading={t("results.whyHeading")} intro={t("results.whyIntro")} />

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

function WhyRules({ fired, heading, intro }: { fired: string[]; heading: string; intro: string }) {
  const [open, setOpen] = useState(false);
  return (
    <details className="fc-why" open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary className="cipher-note">{heading}</summary>
      <p className="cipher-note">{intro}</p>
      <ul className="fc-why-rules">
        {fired.map((id) => (
          <li key={id}>
            <code className="mono">{id}</code> — {RULE_REASONS[id] ?? ""}
          </li>
        ))}
      </ul>
    </details>
  );
}
