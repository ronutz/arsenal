"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/LabFrame.tsx
// ----------------------------------------------------------------------------
// THE SHARED BODY OF EVERY LEARN LAB (2026-10-26). One layout for all of them,
// so a reader who has used one lab knows every other: the controls first, then
// the Example and Reset buttons (the D-83 example row of the tools, in a lab's
// words), then the result, announced politely to screen readers as it changes,
// then the lab's scope note: what the model leaves out. The heading and the
// lede above it are rendered on the server by src/components/learn/Lab.tsx, so
// they are in the page before any script runs.
//
// The words of this frame live in "learnLabs.shell" (both authored packs); the
// words of a lab live in "learnLabs.<id>". src/components/learn/Lab.tsx slices
// exactly those two namespaces into the page around the lab.
// ============================================================================

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

/** One labelled control: the label above the control, tied to it by htmlFor. */
export function LabField({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  // The label and its control, stacked; the label names the control for assistive technology.
  return (
    <div className="lab-field">
      <label className="lab-label" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  );
}

/** A select built from [value, label] pairs, in the lab's control style. */
export function LabSelect({ id, value, options, onChange }: { id: string; value: string; options: readonly (readonly [string, string])[]; onChange: (v: string) => void }) {
  // A native select: keyboard and screen-reader behaviour come with it.
  return (
    <select id={id} className="lab-input" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}

/** The frame: controls, the Example and Reset row, the live result, the scope note. */
export default function LabFrame({
  labId,
  controls,
  result,
  onExample,
  onReset,
  scope,
}: {
  /** The lab's id, for element ids. */
  labId: string;
  /** The lab's labelled controls. */
  controls: ReactNode;
  /** The computed result for the current settings. */
  result: ReactNode;
  /** Loads the lab's example settings. */
  onExample: () => void;
  /** Restores the lab's opening settings. */
  onReset: () => void;
  /** What the model leaves out, in one or two sentences. */
  scope: string;
}) {
  // The frame's own words.
  const t = useTranslations("learnLabs.shell");
  return (
    <div className="lab-body">
      {/* The controls: a form only for grouping and labelling; nothing is ever submitted. */}
      <form className="lab-controls" aria-label={t("controls")} onSubmit={(e) => e.preventDefault()}>
        {controls}
      </form>
      {/* The example row, as on every tool. */}
      <div className="lab-actions">
        <button type="button" className="lab-button" onClick={onExample}>
          {t("example")}
        </button>
        <button type="button" className="lab-button lab-button--quiet" onClick={onReset}>
          {t("reset")}
        </button>
      </div>
      {/* The result, re-read by screen readers when it changes. */}
      <div className="lab-result" id={`lab-${labId}-result`} aria-live="polite">
        <p className="lab-result-kicker mono">{t("result")}</p>
        {result}
      </div>
      {/* What the model leaves out. */}
      <p className="lab-scope">
        <strong>{t("scope")}</strong> {scope}
      </p>
    </div>
  );
}
