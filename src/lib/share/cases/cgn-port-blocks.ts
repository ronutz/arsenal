// ============================================================================
// src/lib/share/cases/cgn-port-blocks.ts
// ----------------------------------------------------------------------------
// Share cases of the CGN port-block and MAP port-set calculator: the open tab
// and its typed fields go by name; a field of another tab, an unknown tab or
// an unknown log format makes the share malformed.
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { CGN_PORT_BLOCKS_SHARE, type CgnShareState } from "../../tools/cgn-port-blocks/share"; // the spec and its state

/** The page's three Examples (CgnPortBlocksTool's EXAMPLES, verbatim from the tool's golden vectors). */
const BLOCKS = { pool: "192.0.2.0/24", blockSize: "300" }; // blocks-rfc7768-300
const DET = { inside: "198.51.100.0/28", outside: "192.0.2.1", dynamicFactor: "2", maxPorts: "5040", revAddress: "192.0.2.1", revPort: "2001", revTime: "2026-10-19T14:32:52Z" }; // det-rfc7422-reverse-2001
const MAP = { offset: "6", psidLength: "8", psid: "0x34" }; // map-rfc7597-psid-0x34

/** The cases. */
export const CGN_SHARE_CASES = defineShareCases(Object.freeze<ShareCases<CgnShareState, CgnShareState>>({ // typed, so cases carrying different values check as one list
  spec: CGN_PORT_BLOCKS_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "blocks-example", state: { mode: "blocks" as const, fields: BLOCKS, logFormat: "nat444" }, params: { mode: "blocks", pool: "192.0.2.0/24", blocksize: "300" }, restored: { mode: "blocks" as const, fields: BLOCKS, logFormat: "nat444" } }, // the default log format is not carried
    { id: "blocks-ds-lite", state: { mode: "blocks" as const, fields: { ...BLOCKS, blocksPerSubscriber: "2", subscribers: "", portRange: " " }, logFormat: "ds-lite" }, params: { mode: "blocks", pool: "192.0.2.0/24", blocksize: "300", blockspersub: "2", logformat: "ds-lite" }, restored: { mode: "blocks" as const, fields: { ...BLOCKS, blocksPerSubscriber: "2" }, logFormat: "ds-lite" } }, // blank fields left out; another log format carried
    { id: "deterministic-example", state: { mode: "deterministic" as const, fields: DET }, params: { mode: "deterministic", inside: "198.51.100.0/28", outside: "192.0.2.1", dynamic: "2", maxports: "5040", revaddress: "192.0.2.1", revport: "2001", revtime: "2026-10-19T14:32:52Z" }, restored: { mode: "deterministic" as const, fields: DET } }, // RFC 7422 section 2.3, a reverse lookup: ":" in the time travels
    { id: "map-example", state: { mode: "map" as const, fields: MAP, logFormat: "ds-lite" }, params: { mode: "map", offset: "6", psidlength: "8", psid: "0x34" }, restored: { mode: "map" as const, fields: MAP } }, // RFC 7597 Appendix A; the log format belongs to the port-blocks tab only
  ],
  arrive: [ // decode only: defaults of absent optional values
    { id: "mode-absent", values: { mode: null, pool: "100.64.0.0/22", blocksize: "512" }, restored: { mode: "blocks" as const, fields: { pool: "100.64.0.0/22", blockSize: "512" }, logFormat: "nat444" } }, // no tab named: port blocks, default log format
  ],
  empty: [ // nothing to share: the button is disabled
    { id: "nothing", state: { mode: "blocks" as const, fields: {}, logFormat: "nat444" } }, // an empty form
    { id: "blank-fields", state: { mode: "map" as const, fields: { offset: " ", psid: "" } } }, // only blanks
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "unknown-mode", values: { mode: "nat64", pool: "192.0.2.0/24" } }, // not a tab
    { id: "field-of-another-tab", values: { mode: "map", offset: "6", pool: "192.0.2.0/24" } }, // pool is a port-blocks field
    { id: "unknown-log-format", values: { mode: "blocks", pool: "192.0.2.0/24", logformat: "nat64" } }, // not offered
    { id: "log-format-off-tab", values: { mode: "deterministic", inside: "198.51.100.0/28", logformat: "ds-lite" } }, // only the port-blocks tab has one
    { id: "tab-alone", values: { mode: "map" } }, // nothing to fill
    { id: "prototype-name", values: { mode: "constructor", offset: "6" } }, // not an own tab
  ],
}));
