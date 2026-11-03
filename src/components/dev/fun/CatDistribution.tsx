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
//
// THE REVEAL WAITS FOR "TRACK" (review R4-13, 03/11/2026): the manifest used to
// change on every keystroke, so typing "Maria" showed four strangers' cats on
// the way. The System now answers when the applicant presses Track (or Enter,
// or Example), stamps the result at the top of the manifest, and brings it into
// view, which on a phone used to sit two screens below the button. The ETA
// reads "1 day" and "2 days" (R4-03); the inputs are one line tall and the
// manifest's long cells wrap instead of running off a phone (R4-02).
//
// A SHAREABLE RESULT (PRIME 03/11/2026, "Yes on all your suggested ideas"):
// under the timeline, the answer as a few lines of text ending in a link that
// delivers the same cat to whoever opens it, with a Copy button. The link is
// the toy's address with the name (and the city, when one was given, since it
// changes the cat) after the "#", never in the query, so it is never sent in a
// request (cat-share.ts). The text is shown before it is copied, with a line
// saying what the link carries and the site's standard warning about values
// after the "#". Opening such a link fills the fields and tracks at once; the
// values then leave the address (useShareArrival), as they do on the tools.
// ============================================================================
"use client";

// React state, the memoised assignment and share card, a handle on the results to scroll to, and the effect that
// brings an arriving link's answer into view once it has rendered.
import { useEffect, useMemo, useRef, useState } from "react";
// The form's submit event type.
import type { FormEvent } from "react";
import { useFullscreen } from "@/lib/hooks/useFullscreen";
// The site's one share-link format: the page's address with the values after the "#".
import { buildShareLink } from "@/lib/share/format";
// Opening a share link: read the values from the fragment, then take them out of the address.
import { useShareArrival } from "@/lib/share/use-share-arrival";
// The production origin the /dev/fun share cards are written with.
import { SHARE_ORIGIN } from "@/lib/fun/share";
// The share line's Copy button, and the filler for its template.
import ToyShare, { fillTemplate, type ToyShareLabels } from "@/components/dev/fun/ToyShare";
// What the cat's link carries, and how an arriving one is read.
import { CAT_SHARE_SPEC } from "@/components/dev/fun/cat-share";

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
    /** "1 day", "2 days" ... one wording per possible ETA, in order (index 0 is 1 day), plural rules applied. */
    etaDays: string[];
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
    /** The toy's name, the share card's first line. */
    systemName: string;
    /** The share block's heading. */
    shareTitle: string;
    /** The share line's template, raw: {name}, {cat}, {unit} and {eta} are filled in the browser. */
    shareLine: string;
    /** "The link carries the name ...", for an application without a city. */
    shareCarriesName: string;
    /** "The link carries the name and the city ...", for an application with one. */
    shareCarriesNameCity: string;
    /** The site's standard warning about values after the "#" (share.stateNote). */
    stateNote: string;
    /** The Copy button's words. */
    share: ToyShareLabels;
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

/** The longest ETA the System quotes, in days (1 to 14); the page sends one wording for each (etaDays). */
const ETA_MAX_DAYS = 14;

/** The toy's path below /dev/fun, for the share link. */
const SLUG = "cat-distribution";

export default function CatDistribution({ data, locale }: { data: CatDistributionData; locale: string }) {
  const { labels } = data;
  const { ref: fsRef, isFullscreen, toggle: toggleFs } = useFullscreen<HTMLDivElement>();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  // The application the System is answering: set by Track, Enter or Example, not by each keystroke (review R4-13).
  const [tracked, setTracked] = useState<{ name: string; city: string } | null>(null);
  // The results block, scrolled into view when an answer arrives.
  const resultsRef = useRef<HTMLDivElement>(null);

  const assignment = useMemo(() => {
    // Nothing tracked yet.
    if (!tracked) return null;
    // The tracked name, trimmed.
    const n = tracked.name.trim();
    if (!n) return null;
    // The applicant key: name and city as tracked.
    const applicant = `${n.toLowerCase()}|${tracked.city.trim().toLowerCase()}`;
    const seed = fnv1a(applicant);
    return {
      unitId: `CAT-${String(seed % 100000).padStart(5, "0")}`,
      coat: pick(applicant, "coat", data.coats),
      age: pick(applicant, "age", data.ages),
      temperament: pick(applicant, "temperament", data.temperaments),
      catName: pick(applicant, "catName", data.catNames),
      vector: pick(applicant, "vector", data.vectors),
      etaDays: 1 + (fnv1a(`${applicant}#eta`) % ETA_MAX_DAYS),
      // Steps 1..5 complete; the delivery step stays pending until the doorbell.
      completed: 5,
    };
    // Recomputed only when a new application is tracked.
  }, [tracked, data]);

  /**
   * Send an application to the System and bring its answer into view.
   *
   * @param n the applicant's name
   * @param c the city (optional)
   */
  const track = (n: string, c: string) => {
    // An empty name is not an application; the hint under the fields stays.
    if (!n.trim()) return;
    // The application being answered.
    setTracked({ name: n, city: c });
    // Once the answer has rendered (a press renders it before the next frame), bring it into view.
    requestAnimationFrame(reveal);
  };

  /** Bring the stamp at the top of the answer into view when it is not already fully on screen. */
  const reveal = () => {
    // The results block.
    const el = resultsRef.current;
    // Not rendered yet: nothing to show.
    if (!el) return;
    // Where it is.
    const box = el.getBoundingClientRect();
    // Its top already on screen, with room for the stamp: leave the page where it is.
    if (box.top >= 0 && box.top + 120 <= window.innerHeight) return;
    // A reader who asked for less motion gets a jump, not a glide.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // The stamp at the top of the screen (the site's scroll padding keeps it clear of the header).
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  // An answer asked for by an arriving link, to bring into view once it has rendered: set on arrival, used once.
  const revealOnRenderRef = useRef(false);
  // The arrival's answer renders after the next frame (its update starts in an effect, not in a press), so it is
  // brought into view here, once React has put it on the page.
  useEffect(() => {
    // Nothing asked for, or nothing tracked.
    if (!revealOnRenderRef.current || !tracked) return;
    // Used once.
    revealOnRenderRef.current = false;
    // Into view.
    reveal();
    // Runs when a new application is tracked.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracked]);

  /**
   * The form's submit (the Track button, or Enter in either field).
   *
   * @param e the submit event
   */
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    // No page reload.
    e.preventDefault();
    // Track what is in the fields.
    track(name, city);
  };

  // A share link opened: its name and city fill the fields and the System answers at once, as Example does; the
  // hook has already taken them out of the address (a malformed link is ignored and stripped the same way).
  useShareArrival(CAT_SHARE_SPEC, (app) => {
    // The name, as the link carried it.
    setName(app.name);
    // The city (empty when the link carried none).
    setCity(app.city);
    // The answer, brought into view once it has rendered (see the effect above).
    revealOnRenderRef.current = true;
    // The System answers.
    track(app.name, app.city);
  });

  // The share card for the answer on screen: the toy's name, the assignment, and the link that delivers the same cat.
  const share = useMemo(() => {
    // No answer, nothing to share.
    if (!assignment || !tracked) return null;
    // The link's values: the name, and the city when there is one.
    const enc = CAT_SHARE_SPEC.encode(tracked);
    // A name the link may not carry (over-long, not plain text): no share line.
    if (!enc.ok) return null;
    // The toy's address in this language, the values after the "#" (never the query).
    const link = buildShareLink(`${SHARE_ORIGIN}/${locale}/dev/fun/${SLUG}/`, enc.params);
    // Only a link proper (the format refuses an over-long one).
    if (link.kind !== "link") return null;
    // "Assignment for Ada: Biscuit, unit CAT-04217. ETA 3 days, confidence absolute."
    const line = fillTemplate(labels.shareLine, {
      // The name as tracked, trimmed.
      name: tracked.name.trim(),
      // The suggested designation.
      cat: assignment.catName,
      // The unit number.
      unit: assignment.unitId,
      // The ETA in its plural form (the bare number if a wording is missing).
      eta: labels.etaDays[assignment.etaDays - 1] ?? String(assignment.etaDays),
    });
    // The card: the System's name, the line, a blank line, the link.
    const text = [labels.systemName, line, "", link.href].join("\n");
    // What the link carries, said before anything is copied: the name, or the name and the city.
    const carries = "city" in enc.params ? labels.shareCarriesNameCity : labels.shareCarriesName;
    // Both, for the block below the timeline.
    return { text, carries };
    // Rebuilt for each new answer (and the page's language, which does not change while it is open).
  }, [assignment, tracked, labels, locale]);

  return (
    <div ref={fsRef} className={`cidr-tool jwt-tool json-tool tmsh-tool fs-fill${isFullscreen ? " is-fullscreen" : ""}`}>
      {/* A form, so Enter in either field tracks, as the Track button does (review R4-13). */}
      <form className="cidr-input-row" onSubmit={onSubmit}>
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="catd-name">{labels.nameLabel}</label>
          <div className="dig-input-actions">
            {/* Example fills the fields and tracks at once. */}
            <button type="button" className="b64-copy" onClick={() => { setName(labels.exampleName); setCity(labels.exampleCity); track(labels.exampleName, labels.exampleCity); }}>{labels.example}</button>
            {/* Clear empties the fields and puts the answer away. */}
            <button type="button" className="b64-copy" onClick={() => { setName(""); setCity(""); setTracked(null); }}>{labels.clear}</button>
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
        {/* One-line fields (review R4-02: the json-input class gave each a 9rem textarea's height). */}
        <input id="catd-name" className="cidr-input mono" value={name}
          onChange={(e) => setName(e.target.value)} placeholder="Ada" autoComplete="off" spellCheck={false} />
        <label className="cidr-label" htmlFor="catd-city">{labels.cityLabel}</label>
        <input id="catd-city" className="cidr-input mono" value={city}
          onChange={(e) => setCity(e.target.value)} placeholder="São Paulo" autoComplete="off" spellCheck={false} />
        {/* The Track button (its label was in the catalogs, unused): the System answers when asked. */}
        <button type="submit" className="btn btn-primary catd-track">{labels.track}</button>
        {!assignment && <p className="cidr-privacy">{labels.emptyHint}</p>}
        {/* Always on the page, so a screen reader hears each new verdict: the stamp and the cat's designation. */}
        <p className="sr-only" role="status" aria-live="polite">
          {assignment ? `${labels.stamp} ${labels.nameField}: ${assignment.catName}.` : ""}
        </p>
      </form>

      {assignment && (
        <div className="tmsh-results" ref={resultsRef}>
          {/* The stamp leads the answer, so it is the first thing seen (review R4-13). */}
          <section className="catd-stamp">
            <p className="catd-stamp-word mono">{labels.stamp}</p>
            <p className="catd-stamp-sub">{labels.stampSub}</p>
          </section>
          <section>
            <h3 className="cidr-h">{labels.manifestTitle}</h3>
            <div className="cidr-table-wrap">
              {/* catd-table: long cells wrap instead of running off a phone (review R4-02). */}
              <table className="cidr-table catd-table">
                <tbody>
                  <tr><td>{labels.unitField}</td><td className="mono">{assignment.unitId}</td></tr>
                  <tr><td>{labels.coatField}</td><td>{assignment.coat}</td></tr>
                  <tr><td>{labels.ageField}</td><td>{assignment.age}</td></tr>
                  <tr><td>{labels.tempField}</td><td>{assignment.temperament}</td></tr>
                  <tr><td>{labels.nameField}</td><td className="mono">{assignment.catName}</td></tr>
                  <tr><td>{labels.vectorField}</td><td>{assignment.vector}</td></tr>
                  {/* The ETA in its plural form ("1 day", "2 days"; review R4-03), the bare number if a wording is missing. */}
                  <tr><td>{labels.etaField}</td><td>{labels.etaDays[assignment.etaDays - 1] ?? String(assignment.etaDays)} · {labels.confidence}: {labels.confidenceValue}</td></tr>
                </tbody>
              </table>
            </div>
          </section>
          <section>
            <h3 className="cidr-h">{labels.timelineTitle}</h3>
            <div className="cidr-table-wrap">
              {/* The status lines wrap too; the [x] column stays narrow. */}
              <table className="cidr-table catd-table catd-timeline">
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
          {/* The shareable result: the text as it will be copied, what its link carries, the warning, then Copy. */}
          {share && (
            <section className="catd-share">
              <h3 className="cidr-h">{labels.shareTitle}</h3>
              <ToyShare text={share.text} labels={labels.share} preview notes={[share.carries, labels.stateNote]} />
            </section>
          )}
        </div>
      )}
    </div>
  );
}
