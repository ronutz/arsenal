// ============================================================================
// src/lib/share/cases/f5-service-check-date.ts
// ----------------------------------------------------------------------------
// Share cases of the F5 service check date tool: a version or a date goes as
// typed; from a pasted licence, only the service check date line the engine
// read goes, never the registration key or anything else in the paste.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { SERVICE_CHECK_SHARE, type ServiceCheckArrival, type ServiceCheckShareState } from "../../tools/f5-service-check-date/share"; // the spec
import { run } from "../../tools/f5-service-check-date/compute"; // the engine, for the line it reads out of a paste

/** A licence pasted into the one-line field (the browser flattens its lines), with K3782's sample registration key. */
const LICENCE = "Auth vers : 5b # BIG-IP System License Key File Registration Key : J1744-76883-90149-96395-1680471 Licensed version : 17.1.0 Service check date : 20230611 Dossier : 0a1b2c3d4e5f Authorization : 9f8e7d6c5b4a"; // as flattened
/** The line the engine reads out of it (result.extractedFrom.matchedText). */
const LINE = (() => { const r = run(LICENCE); return r.kind === "date" && r.extractedFrom ? r.extractedFrom.matchedText : ""; })(); // "Service check date : 20230611"

/** The cases. */
export const F5_SERVICE_CHECK_SHARE_CASES = defineShareCases<ServiceCheckShareState, ServiceCheckArrival>({
  spec: SERVICE_CHECK_SHARE, // the spec
  accept: [
    { id: "version", state: { input: "17.1.3", extracted: null }, params: { input: "17.1.3" }, restored: { input: "17.1.3" } }, // the page's Example
    { id: "date-trimmed", state: { input: " 2023-06-11 ", extracted: null }, params: { input: "2023-06-11" }, restored: { input: "2023-06-11" } }, // a date, trimmed
    { id: "licence-line-only", state: { input: LICENCE, extracted: LINE }, params: { input: "Service check date : 20230611" }, restored: { input: "Service check date : 20230611" }, mustNotContain: ["J1744-76883-90149-96395-1680471", "J1744", "0a1b2c3d4e5f", "9f8e7d6c5b4a", "Registration"] }, // the one line, never the licence
  ],
  empty: [
    { id: "nothing", state: { input: "", extracted: null } }, // nothing entered
    { id: "spaces", state: { input: "  ", extracted: null } }, // spaces only
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
  ],
});
