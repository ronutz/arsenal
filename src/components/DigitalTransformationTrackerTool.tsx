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
//
// PAGE LANGUAGE (02/11/2026): each milestone's title, what changed, what it
// enabled, its contested note and its source note are looked up in the tool's
// messages by the milestone's id (engine.m.<id>.*), falling back to the
// dataset's English; the English pack carries the dataset's English, so the
// English page reads as before and the pt-BR page reads in Portuguese. The
// dataset and the query engine are unchanged (the API returns them as they are).
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
import { engineTexts } from "@/lib/tools/engine-text"; // dataset texts in the page's language, by milestone id
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // a shared link fills the page as typing would
import type { ShareEncoding } from "@/lib/share/spec"; // what the button is given
import { TRACKER_SHARE } from "@/lib/tools/digital-transformation-tracker/share"; // this tool's share spec: the two chip rows

/** Share results with nothing to share: the button is disabled. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // module constant

/** D-83 example: the state domain across every tier is the tool's thesis in one view. */
const EXAMPLE_DOMAINS: Domain[] = ["state"];

export default function DigitalTransformationTrackerTool() {
  const t = useTranslations("tools.digital-transformation-tracker");
  const tx = useMemo(() => engineTexts(t), [t]); // the dataset's texts in the page's language (02/11/2026)
  const [domains, setDomains] = useState<Domain[]>([]);
  const [certainties, setCertainties] = useState<Certainty[]>([]);

  const result = useMemo(() => track({ domains, certainties }), [domains, certainties]);

  // Share results (2026-11-01): the two chip rows by id; with no chip on, the view is the page as it opens.
  const share = useMemo<ShareEncoding>(() => (result.ok ? TRACKER_SHARE.encode({ domains, certainties }) : NOTHING), [result, domains, certainties]); // the button's encoding
  const shareRow = (
    <div className="rdap-ask-row">
      <ShareResultsButton encoding={share} carries={t("share.carries")} title={t("name")} />
    </div>
  ); // the row, at the start of its own line under the answer it shares
  // A shared link sets the chips, as tapping them does; the rail redraws.
  useShareArrival(TRACKER_SHARE, (s) => { setDomains(s.domains); setCertainties(s.certainties); });

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
        <div className="json-error-box">
          <p className="json-error-headline">{t("errorTitle")}</p>
          <p>{result.error}</p>
        </div>
      ) : result.milestones.length === 0 ? (
        <>
          <p className="ztc-empty">{t("emptyState")}</p>
          {/* Share results: a view with no row can still be sent ("no forecasts here"). */}
          {shareRow}
        </>
      ) : (
        <div className="ztc-result">
          <p className="lbm-facts">
            {t("summary", {
              total: result.milestones.length,
              settled: result.settledCount,
              forward: result.forwardCount,
            })}
          </p>

          {/* Share results: under the count (the answer), before the year rail, at the start of its own row. */}
          {shareRow}

          <div className="lineage">
            {result.milestones.map((m) => (
              <div className="lineage-deal" key={m.id}>
                <div className="lineage-deal-rail">
                  <span className="lineage-deal-dot" />
                  <span className="lineage-deal-year mono">{m.year}</span>
                </div>
                <div className="lineage-deal-card">
                  <div className="lineage-deal-top">
                    <span className="lineage-deal-name">{tx.key(`m.${m.id}.title`, m.title)}</span>
                    <span className="tmsh-type-badge">{t(`domain_${m.domain}`)}</span>
                    <span className="tmsh-type-badge">{t(`certainty_${m.certainty}`)}</span>
                  </div>
                  <p className="lineage-deal-what">{tx.key(`m.${m.id}.changed`, m.changed)}</p>
                  <p className="lineage-deal-note">
                    <span className="lineage-deal-became-label">{t("enabledLabel")}</span>{" "}
                    {tx.key(`m.${m.id}.enabled`, m.enabled)}
                  </p>
                  {m.contestedNote ? (
                    <p className="json-error-headline">{tx.key(`m.${m.id}.contestedNote`, m.contestedNote)}</p>
                  ) : null}
                  {m.source ? (
                    <p className="lineage-deal-note">
                      <span className="lineage-deal-became-label">{t("sourceLabel")}</span>{" "}
                      {tx.key(`m.${m.id}.source`, m.source)}
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
