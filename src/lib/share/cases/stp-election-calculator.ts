// ============================================================================
// src/lib/share/cases/stp-election-calculator.ts
// ----------------------------------------------------------------------------
// Share cases of the spanning tree election calculator (08/11/2026): a form,
// the mode's fields as typed, nothing of the other mode; the topology as its
// lines. Values are the page's Examples (golden vectors example and cost-1G:
// deck slides 259 and 266 of the course's chapter 2.4) and the sample chips.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { STP_SHARE, type StpShareState } from "../../tools/stp-election-calculator/share"; // the spec
import { EXAMPLE_TOPOLOGY, SAMPLES } from "../../tools/stp-election-calculator/examples"; // the Example and the chips

/** The mixed-methods chip, with a short bridge (the method word travels inside the topology). */
const MIXED = SAMPLES[2].topology; // OLD on short costs

/** The cases. */
export const STP_ELECTION_CALCULATOR_SHARE_CASES = defineShareCases<StpShareState, StpShareState>({
  spec: STP_SHARE, // the spec
  accept: [
    { id: "election-example", state: { mode: "election", method: "long", topology: EXAMPLE_TOPOLOGY }, params: { mode: "election", method: "long", topology: EXAMPLE_TOPOLOGY }, restored: { mode: "election", method: "long", topology: EXAMPLE_TOPOLOGY } }, // the Example (slide 259)
    { id: "election-short", state: { mode: "election", method: "short", topology: SAMPLES[0].topology }, params: { mode: "election", method: "short", topology: SAMPLES[0].topology }, restored: { mode: "election", method: "short", topology: SAMPLES[0].topology } }, // the Learn lab chip, short costs
    { id: "election-mixed", state: { mode: "election", method: "long", topology: MIXED }, params: { mode: "election", method: "long", topology: MIXED }, restored: { mode: "election", method: "long", topology: MIXED } }, // a bridge line with its own method
    { id: "cost-example", state: { mode: "cost", speed: "1G" }, params: { mode: "cost", speed: "1G" }, restored: { mode: "cost", speed: "1G" } }, // the cost Example (slide 266)
    { id: "cost-spelled", state: { mode: "cost", speed: "40 Gb/s" }, params: { mode: "cost", speed: "40 Gb/s" }, restored: { mode: "cost", speed: "40 Gb/s" } }, // a spelled speed, kept as typed
  ],
  arrive: [
    { id: "election-no-method", values: { mode: "election", topology: EXAMPLE_TOPOLOGY }, restored: { mode: "election", method: "long", topology: EXAMPLE_TOPOLOGY } }, // long when absent
  ],
  empty: [
    { id: "election-blank", state: { mode: "election", method: "long", topology: "" } }, // nothing typed
    { id: "election-refused", state: { mode: "election", method: "long", topology: "bridge A 32769 00-00-5E-00-53-01\nbridge B 32768 00-00-5E-00-53-02\nlink A:1 B:1 1G" } }, // the page shows its refusal (not a multiple of 4096)
    { id: "cost-blank", state: { mode: "cost", speed: "" } }, // nothing typed
    { id: "cost-undocumented", state: { mode: "cost", speed: "5G" } }, // refused: no document read gives a cost (2.5G has one since 2026-11-08b: Huawei's Table 5-92)
  ],
  blocked: [],
  reject: [
    { id: "no-mode", values: { topology: EXAMPLE_TOPOLOGY } }, // the mode is always written
    { id: "unknown-mode", values: { mode: "mstp", topology: EXAMPLE_TOPOLOGY } }, // not a mode the page has
    { id: "method-medium", values: { mode: "election", method: "medium", topology: EXAMPLE_TOPOLOGY } }, // not a method
    { id: "election-without-topology", values: { mode: "election", method: "long" } }, // the topology is required
    { id: "election-blank-topology", values: { mode: "election", topology: "   " } }, // blank
    { id: "election-too-long", values: { mode: "election", topology: "#".repeat(4001) } }, // over the engine's bound
    { id: "election-with-speed", values: { mode: "election", topology: EXAMPLE_TOPOLOGY, speed: "1G" } }, // a field of the other mode
    { id: "cost-without-speed", values: { mode: "cost" } }, // the speed is required
    { id: "cost-with-topology", values: { mode: "cost", speed: "1G", topology: EXAMPLE_TOPOLOGY } }, // a field of the other mode
    { id: "cost-with-method", values: { mode: "cost", speed: "1G", method: "long" } }, // the method belongs to the election
    { id: "cost-two-lines", values: { mode: "cost", speed: "1G\n10G" } }, // one line
    { id: "cost-too-long", values: { mode: "cost", speed: "1".repeat(25) } }, // over the engine's bound
  ],
});
