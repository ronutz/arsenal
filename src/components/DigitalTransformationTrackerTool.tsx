"use client";
// ============================================================================
// src/components/DigitalTransformationTrackerTool.tsx
// ----------------------------------------------------------------------------
// UI for the digital-transformation-tracker. A vertical year rail (reusing the
// proven lineage-* vocabulary from AcquisitionTimeline) with domain and
// certainty filters above it.
//
// The design rule that matters: a forecast must never LOOK like a fact. Each
// row carries a certainty badge, and every non-shipped row prints its source
// underneath, so attribution is visible at a glance rather than buried. The
// contested row additionally prints what the date is moving to and that the
// change is not yet law. NO new CSS classes. (D-19, D-83.)
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  track,
  DOMAINS,
  CERTAINTIES,
  type Domain,
  type Certainty,
} from "@/lib/tools/digital-transformation-tracker";

/** D-83 example: the state domain across every tier is the tool's thesis in one view. */
const EXAMPLE_DOMAINS: Domain[] = ["state"];

export default function DigitalTransformationTrackerTool() {
  const t = useTranslations("tools.digital-transformation-tracker");
  const [domains, setDomains] = useState<Domain[]>([]);
  const [certainties, setCertainties] = useState<Certainty[]>([]);

  const result = useMemo(() => track({ domains, certainties }), [domains, certainties]);

  const toggle = <T,>(list: T[], value: T, set: (v: T[]) => void) =>
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);

  return (
    <div className="tool-panel">
      <div className="dig-input-head">
        <span className="cidr-label">{t("filtersLabel")}</span>
        <div className="dig-input-actions">
          <button
            type="button"
            className="b64-copy"
            onClick={() => {
              setDomains(EXAMPLE_DOMAINS);
              setCertainties([]);
            }}
          >
            {t("example")}
          </button>
          <button
            type="button"
            className="b64-copy"
            onClick={() => {
              setDomains([]);
              setCertainties([]);
            }}
          >
            {t("clear")}
          </button>
        </div>
      </div>

      {/* Domain filters */}
      <p className="cidr-label">{t("domainLabel")}</p>
      <div className="curlb-chips">
        {DOMAINS.map((d) => (
          <button
            key={d}
            type="button"
            className={"curlb-chip" + (domains.includes(d) ? " curlb-chip--on" : "")}
            onClick={() => toggle(domains, d, setDomains)}
          >
            {t(`domain_${d}`)}
          </button>
        ))}
      </div>

      {/* Certainty filters: the organizing principle of the tool */}
      <p className="cidr-label">{t("certaintyLabel")}</p>
      <div className="curlb-chips">
        {CERTAINTIES.map((c) => (
          <button
            key={c}
            type="button"
            className={"curlb-chip" + (certainties.includes(c) ? " curlb-chip--on" : "")}
            onClick={() => toggle(certainties, c, setCertainties)}
          >
            {t(`certainty_${c}`)}
          </button>
        ))}
      </div>

      {!result.ok ? (
        <div className="json-error">
          <p className="json-error-title">{t("errorTitle")}</p>
          <p>{result.error}</p>
        </div>
      ) : result.milestones.length === 0 ? (
        <p className="ztc-empty">{t("emptyState")}</p>
      ) : (
        <div className="ztc-result">
          <p className="lbm-facts">
            {t("summary", {
              total: result.milestones.length,
              settled: result.settledCount,
              forward: result.forwardCount,
            })}
          </p>

          <div className="lineage">
            {result.milestones.map((m) => (
              <div className="lineage-deal" key={m.id}>
                <div className="lineage-deal-rail">
                  <span className="lineage-deal-dot" />
                  <span className="lineage-deal-year mono">{m.year}</span>
                </div>
                <div className="lineage-deal-card">
                  <div className="lineage-deal-top">
                    <span className="lineage-deal-name">{m.title}</span>
                    <span className="type-badge">{t(`domain_${m.domain}`)}</span>
                    <span className="type-badge">{t(`certainty_${m.certainty}`)}</span>
                  </div>
                  <p className="lineage-deal-what">{m.changed}</p>
                  <p className="lineage-deal-note">
                    <span className="lineage-deal-became-label">{t("enabledLabel")}</span>{" "}
                    {m.enabled}
                  </p>
                  {m.contestedNote ? (
                    <p className="json-error-title">{m.contestedNote}</p>
                  ) : null}
                  {m.source ? (
                    <p className="lineage-deal-note">
                      <span className="lineage-deal-became-label">{t("sourceLabel")}</span>{" "}
                      {m.source}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <p className="ztc-notes">{t("runsLocally")}</p>
        </div>
      )}
    </div>
  );
}
