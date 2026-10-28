// ============================================================================
// src/lib/share/cases/iquery-protocol-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the iQuery protocol explainer: the paste goes as typed
// (posture input-caution), and the topic index (an empty box, "list", or text
// the tool does not recognise) is not a result, so the button is disabled.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { IQUERY_SHARE, type IqueryShareInput, type IqueryShareState } from "../../tools/iquery-protocol-explainer/share"; // the spec
import { VECTORS } from "../../tools/iquery-protocol-explainer/golden-vectors"; // the tool's own vectors

/** The real iqdump sample (K000139663), as the tool's first vector holds it. */
const IQDUMP = VECTORS.find((v) => v.mode === "iqdump")?.input ?? ""; // pinned there
/** A /var/log/gtm state-change line, as the tool's vectors hold it. */
const LOG = VECTORS.find((v) => v.mode === "log")?.input ?? ""; // pinned there

/** The cases. */
export const IQUERY_SHARE_CASES = defineShareCases<IqueryShareInput, IqueryShareState>({
  spec: IQUERY_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "iqdump", state: { input: IQDUMP, listing: false }, params: { input: IQDUMP }, restored: { input: IQDUMP } }, // "<!--", "::ffff:", line breaks
    { id: "gtm-log", state: { input: LOG, listing: false }, params: { input: LOG }, restored: { input: LOG } }, // "-->" and a box address
    { id: "topic", state: { input: "port 4353", listing: false }, params: { input: "port 4353" }, restored: { input: "port 4353" } }, // a topic as typed
  ],
  empty: [ // nothing to share: the button is disabled
    { id: "nothing", state: { input: "", listing: true } }, // an empty box shows the index
    { id: "list", state: { input: "list", listing: true } }, // asked for the index
    { id: "unrecognised", state: { input: "hello", listing: true } }, // the index with a note
    { id: "white-space", state: { input: " \n", listing: false } }, // only white space
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
    { id: "blank", values: { input: "\t\n" } }, // only white space
  ],
});
