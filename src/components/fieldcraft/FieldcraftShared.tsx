// ============================================================================
// src/components/fieldcraft/FieldcraftShared.tsx
// ----------------------------------------------------------------------------
// OPERATIONS & FIELDCRAFT - shared client components (D-86 §2), pioneered by
// the Fault Hypothesis Builder and reused by the cluster's later tools:
//   SignalBadge       - the honest strength marker ("signal", not confidence)
//   EvidenceChecklist - evidence items as a working checklist (local state)
//   HypothesisCard    - one hypothesis-to-test, complete with both halves
//                       (supports AND weakens - the discipline in D-86 §3.2)
//   WhyPanel          - "Why this result?": the fired rules, inspectable
// All styling uses the fc-* class family + existing tokens; the D-71 status
// tokens color the signal bands (success/warning/neutral).
// ============================================================================
"use client";

import { useState } from "react";
import type { Hypothesis, SignalStrength } from "@/lib/fieldcraft/schema";

// ----------------------------------------------------------------------------
// SignalBadge
// ----------------------------------------------------------------------------

export function SignalBadge({ signal, label }: { signal: SignalStrength; label: string }) {
  return <span className={`fc-signal fc-signal--${signal} mono`}>{label}</span>;
}

// ----------------------------------------------------------------------------
// EvidenceChecklist - checkbox state is client-local working memory; engines
// emit items unchecked, exports mark checked items.
// ----------------------------------------------------------------------------

export function EvidenceChecklist({
  items,
  checked,
  onToggle,
}: {
  items: { id: string; action: string; command?: string }[];
  checked: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <ul className="fc-evidence">
      {items.map((e) => (
        <li key={e.id} className="fc-evidence-item">
          <label>
            <input type="checkbox" checked={checked.has(e.id)} onChange={() => onToggle(e.id)} />{" "}
            <span>{e.action}</span>
          </label>
          {e.command && <code className="mono fc-evidence-cmd">{e.command}</code>}
        </li>
      ))}
    </ul>
  );
}

// ----------------------------------------------------------------------------
// HypothesisCard
// ----------------------------------------------------------------------------

export function HypothesisCard({
  rank,
  hypothesis,
  signalLabel,
  headings,
  checked,
  onToggle,
}: {
  rank: number;
  hypothesis: Hypothesis;
  signalLabel: string;
  headings: { evidence: string; supports: string; weakens: string };
  checked: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <section className="fc-card">
      <div className="fc-card-head">
        <span className="fc-rank mono">{rank}</span>
        <h4 className="fc-card-title">{hypothesis.title}</h4>
        <SignalBadge signal={hypothesis.signal} label={signalLabel} />
      </div>
      <p className="fc-rationale">{hypothesis.rationale}</p>
      <p className="fc-subhead">{headings.evidence}</p>
      <EvidenceChecklist items={hypothesis.evidence} checked={checked} onToggle={onToggle} />
      <p className="fc-sw">
        <strong>{headings.supports}:</strong> {hypothesis.supports.join("; ")}
      </p>
      <p className="fc-sw">
        <strong>{headings.weakens}:</strong> {hypothesis.weakens.join("; ")}
      </p>
    </section>
  );
}

// ----------------------------------------------------------------------------
// WhyPanel - the inspectable ranking: every fired rule with its points.
// ----------------------------------------------------------------------------

export function WhyPanel({
  hypotheses,
  heading,
  intro,
}: {
  hypotheses: Hypothesis[];
  heading: string;
  intro: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <details className="fc-why" open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary className="cipher-note">{heading}</summary>
      <p className="cipher-note">{intro}</p>
      {hypotheses.map((h) => (
        <div key={h.id} className="fc-why-block">
          <p className="fc-subhead mono">
            {h.id} = {h.score}
          </p>
          <ul className="fc-why-rules">
            {h.firedRules.map((r) => (
              <li key={r.ruleId}>
                <code className="mono">{r.ruleId}</code> (+{r.points}) — {r.because}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </details>
  );
}
