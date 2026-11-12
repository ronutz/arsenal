"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/desk/DeskQuickTool.tsx
// ----------------------------------------------------------------------------
// THE QUICK TOOL WIDGET (PLAN-personal-desk-20261112, section 3.6). One of the
// eligible tools (src/lib/desk/quickTools.ts: the subnet calculator, Base64,
// Unix time, UUIDs), usable right on the desk: a field, and the answer as a
// few labelled rows, each with a Copy button. The tool's engine is loaded only
// when the widget shows it (a dynamic import of its compute.ts alone), and it
// computes in this browser: nothing typed is kept (the field is not stored) or
// sent, and the widget says so. The tool chosen is the widget's own setting;
// "Change tool" picks another, the full tool is one link away, and every other
// tool is linked from the picker. The page may hold several quick tools.
// ============================================================================

// React's state, effects and ids.
import { useEffect, useId, useState } from "react";
// The page's strings and language.
import { useLocale, useTranslations } from "next-intl";
// Locale-aware links.
import { Link } from "@/i18n/navigation";
// The layout's write.
import { setLayoutWidgets, type DeskData, type DeskWidget } from "@/lib/desk/store";
// A widget's own settings.
import { setWidgetSettingsIn } from "@/lib/desk/layout";
// The eligible tools and their answers.
import { QUICK_TOOLS, QUICK_TOOL_SLUGS, type QuickResult, type QuickRow } from "@/lib/desk/quickTools";
// The index, for the tools' names.
import type { SiteIndex } from "@/lib/desk/siteIndex";
// An item's title.
import { titleOf } from "./DeskItemRow";

/**
 * The widget.
 *
 * @param props the desk, the widget and the index
 * @returns the widget's content
 */
export default function DeskQuickTool(props: { data: DeskData; widget: DeskWidget; index: SiteIndex | null }) {
  // The words.
  const t = useTranslations("desk");
  // The page's language, for numbers.
  const locale = useLocale();
  // Ids for the fields.
  const uid = useId();
  // The chosen tool, when it is still eligible.
  const stored = typeof props.widget.settings.tool === "string" && props.widget.settings.tool in QUICK_TOOLS ? props.widget.settings.tool : "";
  // Whether the picker is open (always, until a tool is chosen).
  const [choosing, setChoosing] = useState(false);
  // The picker's choice.
  const [pick, setPick] = useState(stored || QUICK_TOOL_SLUGS[0]);
  // What is typed (never stored).
  const [input, setInput] = useState("");
  // The loaded engine's answer function.
  const [run, setRun] = useState<((s: string) => QuickResult) | null>(null);
  // Whether loading failed.
  const [failed, setFailed] = useState(false);
  // What was just copied, in words.
  const [copied, setCopied] = useState("");

  // The engine, loaded when a tool is shown.
  useEffect(() => {
    // No tool yet.
    if (!stored) return;
    // Whether this load still matters.
    let live = true;
    // Not loaded yet.
    setRun(null);
    // No failure yet.
    setFailed(false);
    // Loaded.
    QUICK_TOOLS[stored].load().then(
      (fn) => { if (live) setRun(() => fn); },
      () => { if (live) setFailed(true); },
    );
    // Abandoned on change.
    return () => { live = false; };
  }, [stored]);

  /**
   * A tool's name in the page's language.
   *
   * @param slug the tool
   * @returns its title, or its slug before the index arrives
   */
  const nameOf = (slug: string) => titleOf(props.index, `tool:${slug}`) ?? slug;

  /** Keep the picker's choice as the widget's tool. */
  const choose = () => {
    // The new layout, or nothing when unchanged.
    const next = setWidgetSettingsIn(props.data.layout.widgets, props.widget.id, { tool: pick });
    // Written.
    if (next) setLayoutWidgets(next);
    // Closed, the field emptied.
    setChoosing(false);
    // Emptied.
    setInput("");
  };

  // The picker: before a tool is chosen, or when changing.
  if (!stored || choosing) {
    // The picker.
    return (
      <div className="desk-quick">
        <label className="desk-picker-label" htmlFor={`${uid}-pick`}>{t("quick.choose")}</label>
        <select id={`${uid}-pick`} className="desk-input" value={pick} onChange={(e) => setPick(e.target.value)}>
          {QUICK_TOOL_SLUGS.map((s) => <option key={s} value={s}>{nameOf(s)}</option>)}
        </select>
        <div className="desk-controls-row">
          <button type="button" className="desk-btn" onClick={choose}>{t("quick.use")}</button>
          {stored && <button type="button" className="desk-btn desk-btn--quiet" onClick={() => setChoosing(false)}>{t("countdown.cancel")}</button>}
        </div>
        <p className="desk-muted">
          {t("quick.others")} <Link href="/tools" className="desk-link">{t("quick.allTools")} <span aria-hidden="true">{"→"}</span></Link>
        </p>
      </div>
    );
  }

  // The tool's example.
  const example = QUICK_TOOLS[stored].example;
  // The answer, when there is input and an engine.
  const result = run && input.trim() !== "" ? run(input) : null;
  // Numbers in the page's language.
  const fmt = new Intl.NumberFormat(locale);

  /**
   * One row's value in words.
   *
   * @param r the row
   * @returns the text shown
   */
  const shown = (r: QuickRow): string => {
    // A failed Base64 decode.
    if (r.key === "decoded" && r.value === false) return t("quick.notBase64");
    // Yes or no.
    if (typeof r.value === "boolean") return r.value ? t("quick.yes") : t("quick.no");
    // A number, formatted.
    if (typeof r.value === "number") return fmt.format(r.value);
    // Text as it is.
    return r.value;
  };

  /**
   * Copy a row's value.
   *
   * @param label the row's label
   * @param text the value
   */
  const copy = (label: string, text: string) => {
    // The clipboard may refuse: then nothing is said.
    void navigator.clipboard?.writeText(text).then(() => setCopied(t("quick.copied", { label })), () => setCopied(""));
  };

  // The tool.
  return (
    <div className="desk-quick">
      <p className="desk-quick-head">
        <Link href={`/tools/${stored}`} className="desk-item-link">{nameOf(stored)}</Link>
        <Link href={`/tools/${stored}`} className="desk-link desk-quick-open">{t("quick.open")} <span aria-hidden="true">{"→"}</span></Link>
      </p>
      <label className="desk-visually-hidden" htmlFor={`${uid}-in`}>{t("quick.input", { tool: nameOf(stored) })}</label>
      <div className="desk-inline-form desk-quick-form">
        <input id={`${uid}-in`} className="desk-input mono" type="text" spellCheck={false} autoComplete="off" value={input} placeholder={t("quick.example", { example })} onChange={(e) => { setInput(e.target.value); setCopied(""); }} />
        <button type="button" className="desk-btn desk-btn--quiet" onClick={() => setInput(example)}>{t("quick.tryExample")}</button>
      </div>
      {/* The engine's state, then the answer. */}
      {failed && <p className="desk-alert" role="status"><span aria-hidden="true">{"⚠"}</span> {t("quick.loadFailed")}</p>}
      {!failed && !run && <p className="desk-muted">{t("quick.loading")}</p>}
      {result && !result.ok && <p className="desk-note" role="status"><span aria-hidden="true">{"⚠"}</span> {t("quick.invalid", { example })}</p>}
      {result && result.ok && (
        <dl className="desk-quick-out">
          {result.rows.map((r) => {
            // The label.
            const label = t(`quick.rows.${r.key}`);
            // The value in words.
            const text = shown(r);
            // One row.
            return (
              <div key={r.key} className="desk-quick-row">
                <dt>{label}</dt>
                <dd className="mono">{text}</dd>
                <button type="button" className="desk-icon-btn" aria-label={t("quick.copy", { label })} onClick={() => copy(label, text)}>
                  <span aria-hidden="true">{"⧉"}</span>
                </button>
              </div>
            );
          })}
        </dl>
      )}
      <p className="desk-status desk-quick-copied" role="status">{copied}</p>
      <p className="desk-muted">{t("quick.private")}</p>
      <p className="desk-widget-action">
        <button type="button" className="desk-btn desk-btn--quiet" onClick={() => { setPick(stored); setChoosing(true); }}>{t("quick.change")}</button>
      </p>
    </div>
  );
}
