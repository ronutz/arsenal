// ============================================================================
// src/lib/share/cases/incident-timeline-rca-builder.ts
// ----------------------------------------------------------------------------
// Share cases of the incident timeline & RCA builder (wave 4C, 2026-11-01).
// The timeline travels as one line per row (kind, order, note, clock fields,
// tab-separated, trailing empty fields left out); the factors and the reader's
// confirmations as id lists in the page's order; a typed tab travels as a
// space; a note holding a credential by its format gives no link. Test values
// are the page's Example (a snapshot vector), published credentials (RFC
// 7617), and plainly made-up hosts and tickets.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { RCA_SHARE, type RcaShareEvent, type RcaShareState } from "../../tools/incident-timeline-rca-builder/share"; // the spec

/** A row without clock fields. */
const ev = (kind: RcaShareEvent["kind"], order: number, note = ""): RcaShareEvent => ({ kind, order, note, clock: { reported: "", offset: "", uncertainty: "" } }); // shorthand
/** No notes. */
const NONE = { summary: "", followups: "" }; // both empty

/** The page's Example: the "change-caused-detect-gap" snapshot vector, with recent-change confirmed by the reader. */
const EXAMPLE: RcaShareState = {
  events: [ev("change-made", 10, "Deployed v2.3 to the API tier"), ev("symptom-began", 20, "5xx rate climbing"), ev("investigation-step", 25), ev("alert-fired", 30), ev("detected", 40, "On-call paged"), ev("mitigated", 50, "Rolled back v2.3"), ev("resolved", 60)], // seven rows
  factors: [{ domain: "recent-change", confirmed: true }, { domain: "monitoring-gap", confirmed: false }], // observed, one confirmed
  notes: NONE, // no notes
};
/** Its link values. */
const EXAMPLE_PARAMS = { events: "change-made\t10\tDeployed v2.3 to the API tier\nsymptom-began\t20\t5xx rate climbing\ninvestigation-step\t25\nalert-fired\t30\ndetected\t40\tOn-call paged\nmitigated\t50\tRolled back v2.3\nresolved\t60", factors: "recent-change,monitoring-gap", confirmed: "recent-change" }; // as the encoder writes them

/** Clock evidence on two rows (one partly typed, kept as typed), a decimal order, and both notes. */
const CLOCKS: RcaShareState = {
  events: [
    { kind: "symptom-began", order: 10, note: "Errors on api-gw-02", clock: { reported: "1730480400000", offset: "-1500", uncertainty: "200" } }, // a full clock
    { kind: "detected", order: 12.5, note: "", clock: { reported: "1730480460000", offset: "", uncertainty: "" } }, // a partly typed clock, no note
  ],
  factors: [], // none observed
  notes: { summary: "API gateway errors, INC-4211", followups: "Check NTP on api-gw-02" }, // both notes
};

/** The cases. */
export const RCA_SHARE_CASES = defineShareCases<RcaShareState, RcaShareState>({
  spec: RCA_SHARE, // the spec
  accept: [
    { id: "example-with-confirmation", state: EXAMPLE, params: EXAMPLE_PARAMS, restored: EXAMPLE }, // the Example; the confirmation is the reader's and travels exactly
    { id: "clocks-and-notes", state: CLOCKS, params: { events: "symptom-began\t10\tErrors on api-gw-02\t1730480400000\t-1500\t200\ndetected\t12.5\t\t1730480460000", summary: "API gateway errors, INC-4211", followups: "Check NTP on api-gw-02" }, restored: CLOCKS }, // clock fields as typed, a decimal order, an empty note between filled fields
    { id: "starting-rows", state: { events: [ev("symptom-began", 10), ev("detected", 20)], factors: [{ domain: "unknown-still", confirmed: false }], notes: NONE }, params: { events: "symptom-began\t10\ndetected\t20", factors: "unknown-still" }, restored: { events: [ev("symptom-began", 10), ev("detected", 20)], factors: [{ domain: "unknown-still", confirmed: false }], notes: NONE } }, // the starting rows, one factor observed, none confirmed
    { id: "tab-in-a-note-travels-as-a-space", state: { events: [ev("detected", 5, "paged\tthe on-call")], factors: [], notes: NONE }, params: { events: "detected\t5\tpaged the on-call" }, restored: { events: [ev("detected", 5, "paged the on-call")], factors: [], notes: NONE } }, // a typed tab (the separator) becomes a space: the one change a link makes
    { id: "maybe-secret-in-a-note", state: { events: [ev("other", 1, "api_token=placeholder rotated")], factors: [], notes: NONE }, params: { events: "other\t1\tapi_token=placeholder rotated" }, restored: { events: [ev("other", 1, "api_token=placeholder rotated")], factors: [], notes: NONE } }, // a secret-looking name: the link goes, the caution line names it
  ],
  arrive: [
    { id: "events-only", values: { events: "resolved\t-3" }, restored: { events: [ev("resolved", -3)], factors: [], notes: NONE } }, // no factors, no notes; a negative order
  ],
  empty: [], // the timeline always has a row: a shown scaffold always has something to share
  blocked: [
    { id: "credential-in-an-event-note", state: { events: [ev("change-made", 10, "Authorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ=="), ev("detected", 20)], factors: [], notes: NONE }, code: "secret" }, // RFC 7617's credentials in a row's note
    { id: "credential-in-the-summary", state: { events: [ev("detected", 20)], factors: [], notes: { summary: "token in https://svc:Pa55w0rd@git.example.com/repo", followups: "" } }, code: "secret" }, // a password in a URL in the summary
  ],
  reject: [
    { id: "no-events", values: { factors: "recent-change" } }, // the timeline is required
    { id: "unknown-kind", values: { events: "panic\t10" } }, // a kind the select does not offer
    { id: "order-not-a-number", values: { events: "detected\tsoon" } }, // the order is a number
    { id: "order-not-canonical", values: { events: "detected\t010" } }, // the page writes 10
    { id: "trailing-empty-field", values: { events: "detected\t10\t" } }, // the encoder leaves trailing empty fields out
    { id: "too-many-fields", values: { events: "detected\t10\ta\t1\t2\t3\t4" } }, // six fields at most
    { id: "confirmed-not-observed", values: { events: "detected\t10", factors: "recent-change", confirmed: "monitoring-gap" } }, // a confirmation needs an observation
    { id: "unknown-factor", values: { events: "detected\t10", factors: "bad-luck" } }, // a domain the page does not offer
    { id: "factors-out-of-order", values: { events: "detected\t10", factors: "monitoring-gap,recent-change" } }, // the page's order only
    { id: "summary-with-a-line-break", values: { events: "detected\t10", summary: "one\ntwo" } }, // a one-line field
  ],
});
