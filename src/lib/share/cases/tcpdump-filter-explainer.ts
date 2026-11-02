// ============================================================================
// src/lib/share/cases/tcpdump-filter-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the tcpdump command and filter explainer (wave 4C,
// 2026-11-01): the text as pasted; a command whose -E carries an inline ESP
// secret, or whose -M carries the TCP-MD5 secret (tcpdump(1), 4.99.7), gets no
// link, nor does one holding a credential by its format. Addresses are from
// the documentation ranges (RFC 5737).
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { TCPDUMP_SHARE, type TcpdumpShareState } from "../../tools/tcpdump-filter-explainer/share"; // the spec

/** The page's Example (golden vector example-syn-without-ack). */
const EXAMPLE = "sudo tcpdump -nn -i eth0 -c 20 'tcp[tcpflags] & (tcp-syn|tcp-ack) == tcp-syn and host 192.0.2.10 and port 443'"; // verbatim

/** The cases. */
export const TCPDUMP_SHARE_CASES = defineShareCases<TcpdumpShareState, TcpdumpShareState>({
  spec: TCPDUMP_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // as pasted
    { id: "bare-filter", state: { input: "src net 198.51.100.0/24 and not port 22" }, params: { input: "src net 198.51.100.0/24 and not port 22" }, restored: { input: "src net 198.51.100.0/24 and not port 22" } }, // a filter alone
    { id: "esp-from-a-file", state: { input: "tcpdump -n -E /etc/tcpdump/esp.secrets esp" }, params: { input: "tcpdump -n -E /etc/tcpdump/esp.secrets esp" }, restored: { input: "tcpdump -n -E /etc/tcpdump/esp.secrets esp" } }, // -E's file form names a file, not a secret: the link goes
  ],
  empty: [
    { id: "blank", state: { input: " " } }, // nothing pasted
  ],
  blocked: [
    { id: "esp-inline-secret", state: { input: "tcpdump -i eth0 -E 'spi@192.0.2.1 3des-cbc:0x0123456789abcdef' esp" }, code: "option" }, // -E spi@ipaddr algo:secret
    { id: "tcp-md5-secret", state: { input: "tcpdump -nnM s3cr3t-md5 port 179" }, code: "option" }, // -M secret, in a cluster
    { id: "url-password", state: { input: "tcpdump -w ftp://svc:Pa55w0rd@192.0.2.9/cap.pcap" }, code: "secret" }, // a password in a URL (RFC 3986 section 3.2.1)
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
    { id: "with-an-esp-secret", values: { input: "tcpdump -E 'spi@192.0.2.1 des-cbc:secret' esp" } }, // the encoder never builds one
  ],
});
