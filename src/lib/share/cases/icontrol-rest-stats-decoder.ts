// ============================================================================
// src/lib/share/cases/icontrol-rest-stats-decoder.ts
// ----------------------------------------------------------------------------
// Share cases of the iControl REST stats decoder: the response goes as
// pasted.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { ICONTROL_STATS_SHARE, type IcontrolStatsShareState } from "../../tools/icontrol-rest-stats-decoder/share"; // the spec
import { STATS_VECTORS } from "../../tools/icontrol-rest-stats-decoder/golden-vectors"; // the tool's own vectors

/** A pool's stats (the first vector): URL keys, nested entries, a split 64-bit counter. */
const POOL = STATS_VECTORS[0].input; // pinned there

/** The cases. */
export const ICONTROL_STATS_SHARE_CASES = defineShareCases<IcontrolStatsShareState, IcontrolStatsShareState>({
  spec: ICONTROL_STATS_SHARE, // the spec
  accept: [
    { id: "pool", state: { input: POOL }, params: { input: POOL }, restored: { input: POOL } }, // braces, quotes, slashes and tildes
    { id: "one-line", state: { input: '{"entries":{"https://localhost/mgmt/tm/ltm/virtual/~Common~vs/stats":{"nestedStats":{"entries":{"clientside.curConns":{"value":12}}}}}}' }, params: { input: '{"entries":{"https://localhost/mgmt/tm/ltm/virtual/~Common~vs/stats":{"nestedStats":{"entries":{"clientside.curConns":{"value":12}}}}}}' }, restored: { input: '{"entries":{"https://localhost/mgmt/tm/ltm/virtual/~Common~vs/stats":{"nestedStats":{"entries":{"clientside.curConns":{"value":12}}}}}}' } }, // a compact response
  ],
  empty: [
    { id: "nothing", state: { input: "" } }, // nothing pasted
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
  ],
});
