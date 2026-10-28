// ============================================================================
// src/lib/share/cases/f5-bigip-tcpdump-builder.ts
// ----------------------------------------------------------------------------
// Share cases of the BIG-IP tcpdump builder: the form goes as named values
// (no "input"), choices only when they differ from the default, text fields
// as typed; the untouched default form has nothing to share (posture
// input-caution).
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { TCPDUMP_SHARE } from "../../tools/f5-bigip-tcpdump-builder/share"; // the spec
import { DEFAULT_OPTIONS, type TcpdumpOptions } from "../../tools/f5-bigip-tcpdump-builder/compute"; // the form's default and shape

/** The page's Example: all TMMs, high detail, both sides, -nn, filtered on a host and a port. */
const EXAMPLE: TcpdumpOptions = { ...DEFAULT_OPTIONS, iface: "0.0", detail: "nnn", nameResolution: "no-dns-port", filter: "host 10.1.1.1 and port 443" }; // as the Example button sets it
/** Every choice away from its default: a VLAN, no suffix, one side, DNS on, a custom snap length, a count, -vv, -e, -X, nothing written. */
const CUSTOM: TcpdumpOptions = { iface: "/Common/internal", detail: "", bothSides: false, nameResolution: "default", snaplen: "custom", snaplenValue: 200, count: 1000, verbosity: "vv", etherHeader: true, hexAscii: true, writeFile: false, fileName: "/var/tmp/hidden.pcap", filter: "tcp port 80 and (host 192.0.2.10 or host 192.0.2.11)" }; // every kind

/** The cases. */
export const F5_TCPDUMP_SHARE_CASES = defineShareCases<TcpdumpOptions, TcpdumpOptions>({
  spec: TCPDUMP_SHARE, // the spec
  accept: [
    { id: "example", state: EXAMPLE, params: { iface: "0.0", filter: "host 10.1.1.1 and port 443", file: "/var/tmp/capture.pcap" }, restored: EXAMPLE }, // only the filter differs from the default
    { id: "custom", state: CUSTOM, params: { iface: "/Common/internal", filter: "tcp port 80 and (host 192.0.2.10 or host 192.0.2.11)", detail: "none", both: "0", names: "default", snaplen: "custom", snapbytes: "200", count: "1000", verbose: "vv", ether: "1", hex: "1", write: "0" }, restored: { ...CUSTOM, fileName: DEFAULT_OPTIONS.fileName } }, // the hidden file name is not carried and comes back as the default
    { id: "unfiltered", state: { ...DEFAULT_OPTIONS, filter: "", count: 500 }, params: { iface: "0.0", file: "/var/tmp/capture.pcap", count: "500" }, restored: { ...DEFAULT_OPTIONS, filter: "", count: 500 } }, // an emptied filter stays empty
  ],
  arrive: [
    { id: "filter-only", values: { filter: "port 53" }, restored: { ...DEFAULT_OPTIONS, iface: "", fileName: "", filter: "port 53" } }, // absent text fields are empty, absent choices default (the engine then writes to its default path)
  ],
  empty: [
    { id: "default-form", state: DEFAULT_OPTIONS }, // nothing the reader chose
  ],
  reject: [
    { id: "unknown-detail", values: { iface: "0.0", detail: "nnnn" } }, // not a button
    { id: "switch-not-binary", values: { iface: "0.0", both: "yes" } }, // a switch is 1 or 0
    { id: "unknown-verbosity", values: { iface: "0.0", verbose: "vvvv" } }, // not a button
    { id: "unknown-names", values: { iface: "0.0", names: "no-port" } }, // not a button
    { id: "snapbytes-without-custom", values: { iface: "0.0", snapbytes: "200" } }, // a length without the custom choice
    { id: "snapbytes-not-a-number", values: { iface: "0.0", snaplen: "custom", snapbytes: "2e2" } }, // digits only
    { id: "count-zero", values: { iface: "0.0", count: "0" } }, // -c counts from 1
    { id: "file-while-not-written", values: { iface: "0.0", write: "0", file: "/var/tmp/x.pcap" } }, // a file name with nothing written
  ],
});
