// ============================================================================
// src/lib/share/cases/syslog-message-parser.ts
// ----------------------------------------------------------------------------
// Share cases of the syslog message parser: the paste goes as typed, alone
// (posture input-caution: the popover adds the tool's caution line).
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { SYSLOG_MESSAGE_SHARE } from "../../tools/syslog-message-parser/share"; // the spec
import { VECTORS } from "../../tools/syslog-message-parser/golden-vectors"; // the tool's own vectors

/** A vector's text by id (the page's presets are these vectors, byte for byte). */
const text = (id: string): string => VECTORS.find((v) => v.id === id)?.input.text ?? ""; // "" if renamed: the case then fails loudly

/** The cases. */
export const SYSLOG_MESSAGE_SHARE_CASES = defineShareCases(Object.freeze({
  spec: SYSLOG_MESSAGE_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "example", state: { input: text("rfc5424-example-3") }, params: { input: text("rfc5424-example-3") }, restored: { input: text("rfc5424-example-3") } }, // the page's Example: structured data, quotes, a BOM
    { id: "bsd", state: { input: text("bsd-rfc3164") }, params: { input: text("bsd-rfc3164") }, restored: { input: text("bsd-rfc3164") } }, // the BSD form
    { id: "octet-counting", state: { input: text("octet-counting") }, params: { input: text("octet-counting") }, restored: { input: text("octet-counting") } }, // a TCP frame with its length
  ],
  empty: [ // nothing to share: the button is disabled
    { id: "nothing", state: { input: "" } }, // a blank box
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
    { id: "blank", values: { input: " " } }, // only a space
  ],
}));
