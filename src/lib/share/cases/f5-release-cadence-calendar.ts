// ============================================================================
// src/lib/share/cases/f5-release-cadence-calendar.ts
// ----------------------------------------------------------------------------
// Share cases of the F5 release cadence calendar: the start date goes unless
// it is the sender's today, the count unless it is 6; an absent date keeps
// the reader's own today.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { CADENCE_SHARE, type CadenceArrival, type CadenceShareState } from "../../tools/f5-release-cadence-calendar/share"; // the spec

/** A fixed "today" for the cases (the page uses the reader's clock). */
const TODAY = "2026-10-27"; // the day these cases were written

/** The cases. */
export const F5_RELEASE_CADENCE_SHARE_CASES = defineShareCases<CadenceShareState, CadenceArrival>({
  spec: CADENCE_SHARE, // the spec
  accept: [
    { id: "example", state: { reference: "2026-07-01", months: 6, today: TODAY }, params: { from: "2026-07-01" }, restored: { from: "2026-07-01", months: 6 } }, // the page's Example
    { id: "months-only", state: { reference: TODAY, months: 12, today: TODAY }, params: { months: "12" }, restored: { from: null, months: 12 } }, // a year ahead from the reader's today
    { id: "both-clamped", state: { reference: "2027-01-20", months: 99, today: TODAY }, params: { from: "2027-01-20", months: "24" }, restored: { from: "2027-01-20", months: 24 } }, // 99 typed, 24 listed: the count the engine uses
  ],
  arrive: [
    { id: "leap-day", values: { from: "2028-02-29" }, restored: { from: "2028-02-29", months: 6 } }, // a real day; an absent count is 6
  ],
  empty: [
    { id: "untouched", state: { reference: TODAY, months: 6, today: TODAY } }, // today and 6: the bare page
  ],
  reject: [
    { id: "not-a-day", values: { from: "2026-02-30" } }, // no such day
    { id: "not-the-form", values: { from: "27/10/2026" } }, // the date field's form only
    { id: "months-zero", values: { months: "0" } }, // from 1
    { id: "months-over", values: { months: "25" } }, // to 24
    { id: "months-not-a-number", values: { months: "six" } }, // digits only
    { id: "nothing", values: { from: null, months: null } }, // nothing to fill
  ],
});
