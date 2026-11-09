// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/share/cases/bit-numbering-and-order.ts
// ----------------------------------------------------------------------------
// Share cases of the bit numbering and bit order tool (08/11/2026): the field
// as typed under "input", the mode, and the mode's own fields only. Values are
// the page's three Examples and its samples (golden vectors example-value,
// example-printed, example-mac, field-example, sample-mac-reversed).
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { BIT_NUMBERING_SHARE, type BitShareState } from "../../tools/bit-numbering-and-order/share"; // the spec

/** A state with every field at its blank or default value, for the cases to override. */
const BASE: BitShareState = { mode: "value", input: "", width: "", layout: "none", order: "msb-first", form: "canonical", numbering: "lsb0", from: "", to: "" }; // nothing typed

/** The cases. */
export const BIT_NUMBERING_AND_ORDER_SHARE_CASES = defineShareCases<BitShareState, BitShareState>({
  spec: BIT_NUMBERING_SHARE, // the spec
  accept: [
    { id: "value-example", state: { ...BASE, input: "0x81A0", width: "16", layout: "dns-flags" }, params: { input: "0x81A0", mode: "value", width: "16", layout: "dns-flags" }, restored: { ...BASE, input: "0x81A0", width: "16", layout: "dns-flags" } }, // the value Example
    { id: "printed-example", state: { ...BASE, mode: "printed", input: "10111100", order: "lsb-first", layout: "lacp" }, params: { input: "10111100", mode: "printed", order: "lsb-first", layout: "lacp" }, restored: { ...BASE, mode: "printed", input: "10111100", order: "lsb-first", layout: "lacp" } }, // the printed Example (Huawei)
    { id: "mac-example", state: { ...BASE, mode: "mac", input: "12-34-56-78-9A-BC" }, params: { input: "12-34-56-78-9A-BC", mode: "mac", form: "canonical" }, restored: { ...BASE, mode: "mac", input: "12-34-56-78-9A-BC" } }, // the MAC Example
    { id: "value-field", state: { ...BASE, input: "0xB8", layout: "tos", numbering: "msb0", from: "0", to: "5" }, params: { input: "0xB8", mode: "value", layout: "tos", numbering: "msb0", from: "0", to: "5" }, restored: { ...BASE, input: "0xB8", layout: "tos", numbering: "msb0", from: "0", to: "5" } }, // the DSCP field
    { id: "value-one-bit", state: { ...BASE, input: "0x3D", numbering: "one", from: "1" }, params: { input: "0x3D", mode: "value", numbering: "one", from: "1" }, restored: { ...BASE, input: "0x3D", numbering: "one", from: "1" } }, // one bit, no "to"
    { id: "mac-reversed", state: { ...BASE, mode: "mac", input: "48-2C-6A-1E-59-3D", form: "reversed" }, params: { input: "48-2C-6A-1E-59-3D", mode: "mac", form: "reversed" }, restored: { ...BASE, mode: "mac", input: "48-2C-6A-1E-59-3D", form: "reversed" } }, // the MSB format
    { id: "printed-spaces", state: { ...BASE, mode: "printed", input: "1 0 1 0 1 0 1 0" }, params: { input: "1 0 1 0 1 0 1 0", mode: "printed", order: "msb-first" }, restored: { ...BASE, mode: "printed", input: "1 0 1 0 1 0 1 0" } }, // spaces survive the link
  ],
  arrive: [
    { id: "value-only-input", values: { mode: "value", input: "0x3D" }, restored: { ...BASE, input: "0x3D" } }, // every optional field at its default
    { id: "printed-no-order", values: { mode: "printed", input: "00111101" }, restored: { ...BASE, mode: "printed", input: "00111101" } }, // most significant first when absent
    { id: "mac-no-form", values: { mode: "mac", input: "00-00-5E-00-53-01" }, restored: { ...BASE, mode: "mac", input: "00-00-5E-00-53-01" } }, // canonical when absent
    { id: "field-no-numbering", values: { mode: "value", input: "0xB8", from: "2", to: "7" }, restored: { ...BASE, input: "0xB8", from: "2", to: "7" } }, // LSB 0 when absent
  ],
  empty: [
    { id: "blank", state: { ...BASE } }, // nothing typed
    { id: "refused-value", state: { ...BASE, input: "3D" } }, // the page shows its refusal: hex without 0x
    { id: "refused-layout-width", state: { ...BASE, input: "0x81", layout: "dns-flags" } }, // a 16-bit layout on 8 bits
    { id: "refused-mac", state: { ...BASE, mode: "mac", input: "12-34-56" } }, // not a MAC address
    { id: "refused-field", state: { ...BASE, input: "0x3D", from: "8" } }, // bit 8 of 8
  ],
  blocked: [],
  reject: [
    { id: "no-mode", values: { input: "0x3D" } }, // the mode is always written
    { id: "unknown-mode", values: { mode: "bytes", input: "0x3D" } }, // not a mode
    { id: "no-input", values: { mode: "value" } }, // the input is required
    { id: "blank-input", values: { mode: "value", input: "  " } }, // blank
    { id: "two-lines", values: { mode: "value", input: "0x3D\n0x3E" } }, // one line
    { id: "too-long", values: { mode: "value", input: "0b" + "1".repeat(80) } }, // longer than the engine reads
    { id: "value-with-form", values: { mode: "value", input: "0x3D", form: "reversed" } }, // a MAC field in value mode
    { id: "value-with-order", values: { mode: "value", input: "0x3D", order: "lsb-first" } }, // a printed field in value mode
    { id: "printed-with-width", values: { mode: "printed", input: "10111100", width: "8" } }, // printed mode has no width
    { id: "mac-with-layout", values: { mode: "mac", input: "12-34-56-78-9A-BC", layout: "lacp" } }, // MAC mode has no layout
    { id: "unknown-layout", values: { mode: "value", input: "0x3D", layout: "ospf" } }, // not a layout
    { id: "unknown-order", values: { mode: "printed", input: "10111100", order: "little" } }, // not an order
    { id: "unknown-form", values: { mode: "mac", input: "12-34-56-78-9A-BC", form: "msb" } }, // not a form
    { id: "unknown-numbering", values: { mode: "value", input: "0x3D", numbering: "msb1", from: "0" } }, // not a numbering
    { id: "width-not-digits", values: { mode: "value", input: "0x3D", width: "eight" } }, // digits only
    { id: "from-not-digits", values: { mode: "value", input: "0x3D", from: "-1" } }, // digits only
    { id: "to-without-from", values: { mode: "value", input: "0x3D", to: "3" } }, // a last bit needs a first
    { id: "numbering-without-from", values: { mode: "value", input: "0x3D", numbering: "msb0" } }, // a numbering belongs to a field
  ],
});
