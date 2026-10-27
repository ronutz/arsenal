// ============================================================================
// src/lib/share/cases/bits-bytes.ts
// ----------------------------------------------------------------------------
// Share cases of bits, bytes and throughput: the filled fields go as typed;
// absent ones are emptied on arrival, so the result is the sender's.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { BITS_BYTES_SHARE, type BitsBytesShareState } from "../../tools/bits-bytes/share"; // the spec

/** The cases. */
export const BITS_BYTES_SHARE_CASES = defineShareCases<BitsBytesShareState, BitsBytesShareState>({
  spec: BITS_BYTES_SHARE, // the spec
  accept: [
    { id: "example", state: { size: "56 KiB", rate: "56 kbit/s", time: "", efficiency: "" }, params: { size: "56 KiB", rate: "56 kbit/s" }, restored: { size: "56 KiB", rate: "56 kbit/s", time: "", efficiency: "" } }, // the Example (vector lineage-56k-modem): "/" survives
    { id: "rate-time-preset", state: { size: "", rate: "1 Gbit/s", time: "2 h", efficiency: "tcp-ipv4-ethernet-1500" }, params: { rate: "1 Gbit/s", time: "2 h", eff: "tcp-ipv4-ethernet-1500" }, restored: { size: "", rate: "1 Gbit/s", time: "2 h", efficiency: "tcp-ipv4-ethernet-1500" } }, // no size: the size is derived
    { id: "size-alone-percent", state: { size: "1.5 GB", rate: "", time: "", efficiency: "80%" }, params: { size: "1.5 GB", eff: "80%" }, restored: { size: "1.5 GB", rate: "", time: "", efficiency: "80%" } }, // "%" survives
  ],
  arrive: [
    { id: "absent-emptied", values: { size: "700 MiB", rate: null, time: null, eff: null }, restored: { size: "700 MiB", rate: "", time: "", efficiency: "" } }, // absent fields are empty
  ],
  empty: [
    { id: "nothing", state: { size: "", rate: "", time: "", efficiency: "" } }, // no field
    { id: "efficiency-only", state: { size: " ", rate: "", time: "", efficiency: "90%" } }, // an efficiency alone computes nothing
  ],
  reject: [
    { id: "efficiency-only", values: { size: null, rate: null, time: null, eff: "90%" } }, // nothing to compute
    { id: "size-too-long", values: { size: "9".repeat(65), rate: null, time: null, eff: null } }, // longer than the field holds
    { id: "eff-too-long", values: { size: "1 GB", rate: null, time: null, eff: "123456789" } }, // longer than the field, and not a preset
  ],
});
