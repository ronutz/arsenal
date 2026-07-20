// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/CatDistribution.tsx
// ----------------------------------------------------------------------------
// THE GLOBAL CAT DISTRIBUTION SYSTEM — a tracking console for the internet's
// most reliable logistics network: stray cats assigning themselves to humans.
//
// Architecture mirrors MeetingBingo: this component is locale-agnostic — the
// server page resolves all labels and trait tables from the i18n catalogs and
// passes them in. The component only computes and renders.
//
// The engine is DETERMINISTIC on purpose (tools that compute, never guess,
// even on the not-serious shelf): the applicant's name + city seed an FNV-1a
// hash feeding a mulberry32 PRNG over the trait tables, so the same name
// always receives the same cat. That is not a bug; that is destiny — and it
// makes results shareable ("type your name, look what the System sent ME").
// ============================================================================
"use client";

import { useMemo, useState } from "react";
import { useFullscreen } from "@/lib/hooks/useFullscreen";

/** Trait tables + labels, resolved by the server page from i18n catalogs. */
export interface CatDistributionData {
  labels: {
    nameLabel: string;
    cityLabel: string;
    example: string;
    clear: string;
    track: string;
    emptyHint: string;
    manifestTitle: string;
    unitField: string;
    coatField: string;
    ageField: string;
    tempField: string;
    nameField: string;
    vectorField: string;
    etaField: string;
    etaDays: string;
    confidence: string;
    confidenceValue: string;
    timelineTitle: string;
    doneMark: string;
    pendingMark: string;
    stamp: string;
    stampSub: string;
    exampleName: string;
    exampleCity: string;
    fullscreenEnterAria: string;
    fullscreenExitAria: string;
  };
  coats: string[];
  ages: string[];
  temperaments: string[];
  catNames: string[];
  vectors: string[];
  steps: string[];
}

/** FNV-1a 32-bit — tiny, stable, and perfectly cat-grade. */
function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// Each trait is drawn from its OWN hash — fnv1a(applicant|traitKey) — instead
// of sequential PRNG draws. Independent by construction: traits can never
// couple through draw order, and each is uniform over its table. (Field
// report, 2026-07-18: with sequential draws, "rodolfo", "mariana", AND the
// Example applicant all received the rain vector by honest coincidence.
// Uniformity was verified over 6000 names; the clustering was destiny, but
// destiny with better statistical hygiene is still destiny.)
const pick = <T,>(applicant: string, traitKey: string, arr: T[]): T =>
  arr[fnv1a(`${applicant}#${traitKey}`) % arr.length];

export default function CatDistribution({ data }: { data: CatDistributionData }) {
  const { labels } = data;
  const { ref: fsRef, isFullscreen, toggle: toggleFs } = useFullscreen<HTMLDivElement>();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");

  const assignment = useMemo(() => {
    const n = name.trim();
    if (!n) return null;
    const applicant = `${n.toLowerCase()}|${city.trim().toLowerCase()}`;
    const seed = fnv1a(applicant);
    return {
      unitId: `CAT-${String(seed % 100000).padStart(5, "0")}`,
      coat: pick(applicant, "coat", data.coats),
      age: pick(applicant, "age", data.ages),
      temperament: pick(applicant, "temperament", data.temperaments),
      catName: pick(applicant, "catName", data.catNames),
      vector: pick(applicant, "vector", data.vectors),
      etaDays: 1 + (fnv1a(`${applicant}#eta`) % 14),
      // Steps 1..5 complete; the delivery step stays pending until the doorbell.
      completed: 5,
    };
  }, [name, city, data]);

  return (
    <div ref={fsRef} className={`cidr-tool jwt-tool json-tool tmsh-tool fs-fill${isFullscreen ? " is-fullscreen" : ""}`}>
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="catd-name">{labels.nameLabel}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => { setName(labels.exampleName); setCity(labels.exampleCity); }}>{labels.example}</button>
            <button type="button" className="b64-copy" onClick={() => { setName(""); setCity(""); }}>{labels.clear}</button>
            <button
              type="button"
              className="fs-toggle"
              onClick={toggleFs}
              aria-pressed={isFullscreen}
              aria-label={isFullscreen ? labels.fullscreenExitAria : labels.fullscreenEnterAria}
              title={isFullscreen ? labels.fullscreenExitAria : labels.fullscreenEnterAria}
            >
              <span aria-hidden="true">{isFullscreen ? "\u2921" : "\u2922"}</span>
            </button>
          </div>
        </div>
        <input id="catd-name" className="cidr-input mono json-input" value={name}
          onChange={(e) => setName(e.target.value)} placeholder="Ada" autoComplete="off" spellCheck={false} />
        <label className="cidr-label" htmlFor="catd-city">{labels.cityLabel}</label>
        <input id="catd-city" className="cidr-input mono json-input" value={city}
          onChange={(e) => setCity(e.target.value)} placeholder="São Paulo" autoComplete="off" spellCheck={false} />
        {!assignment && <p className="cidr-privacy">{labels.emptyHint}</p>}
      </div>

      {assignment && (
        <div className="tmsh-results">
          <section>
            <h3 className="cidr-h">{labels.manifestTitle}</h3>
            <div className="cidr-table-wrap">
              <table className="cidr-table">
                <tbody>
                  <tr><td>{labels.unitField}</td><td className="mono">{assignment.unitId}</td></tr>
                  <tr><td>{labels.coatField}</td><td>{assignment.coat}</td></tr>
                  <tr><td>{labels.ageField}</td><td>{assignment.age}</td></tr>
                  <tr><td>{labels.tempField}</td><td>{assignment.temperament}</td></tr>
                  <tr><td>{labels.nameField}</td><td className="mono">{assignment.catName}</td></tr>
                  <tr><td>{labels.vectorField}</td><td>{assignment.vector}</td></tr>
                  <tr><td>{labels.etaField}</td><td>{labels.etaDays.replace("{n}", String(assignment.etaDays))} · {labels.confidence}: {labels.confidenceValue}</td></tr>
                </tbody>
              </table>
            </div>
          </section>
          <section>
            <h3 className="cidr-h">{labels.timelineTitle}</h3>
            <div className="cidr-table-wrap">
              <table className="cidr-table">
                <tbody>
                  {data.steps.map((s, i) => (
                    <tr key={i}>
                      <td className="mono">{i < assignment.completed ? labels.doneMark : labels.pendingMark}</td>
                      <td>{s}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section aria-live="polite">
            <p className="mono" style={{ fontSize: "1.3rem" }}>{labels.stamp}</p>
            <p>{labels.stampSub}</p>
          </section>
        </div>
      )}
    </div>
  );
}
