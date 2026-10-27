// ============================================================================
// src/lib/tools/openssl-s-client-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// THE PINNED TRUTH for the openssl s_client explainer. Basis: OpenSSL 3.5, the
// long-term-support release (3.5.9; supported until 2030-04-08).
//
//   - OUTPUT vectors: the nineteen captures of captures.ts, real OpenSSL 3.5.9
//     runs of 2026-10-27 (client and servers both 3.5.9, built from the
//     official source; captures.ts says how). Each is run with its own command
//     line; every expected value was checked against the capture before it was
//     pinned, and the findings list is pinned whole and in order, so a finding
//     that appears or disappears fails. They replace a set of 3.0.13 runs
//     rewritten into the 3.5.9 layout: against the real runs, those rewrites
//     differed only where a 3.5.9 server changes the handshake (the TLS 1.3
//     group, X25519MLKEM768, printed as "Negotiated TLS1.3 group:") and in
//     values (keys, times, byte counts), so every other pin held.
//   - COMMAND vectors: command lines written for the tests (not captures), one
//     per rule of the command reader, each with the findings pinned whole.
//   - RUN vectors: the single-string entry point (the API): command and output
//     pasted together, output alone, text that is not s_client, and the caps.
//   - TABLE vectors: the verification code table (0 to 95 in 3.5.9, 96 to 101
//     marked as 3.6 only) against the texts the captures printed, the option
//     table against the 3.5.9 option list, and LINE-FORMAT vectors: short
//     snippets of the lines the parser reads that no capture contains, written
//     from the source that prints them (3.5.9 lines such as the EC a:PKEY
//     form; the 3.0 and 3.6.5 lines the parser keeps; -msg lines, whose format
//     msg_cb prints the same way in 3.0.13 and 3.5.9).
//   - SHARE vectors (2026-10-27c): the copy a Share results link carries
//     (shareableSClient): each pins the two boxes exactly as the link carries
//     them, the number of values replaced, the secrets that must not survive,
//     and that the receiving page reads the same handshake (the same findings,
//     less only "secretsPrinted").
// verifyVectors() runs everything and returns { setId, total, passed, failures }.
// ============================================================================

import { explain, explainCommand, explainOutput, run, splitInput, shareableSClient, SHARE_REDACTED, MAX_LINE_LENGTH, MAX_OUTPUT_LINES, type FindingId } from "./compute"; // the engine
import { CAPTURES, capture } from "./captures"; // the real captures
import { VERIFY_CODES, VERIFY_CODE_BY_NUMBER } from "./verify-codes"; // the code table
import { OPTIONS, OPTION_BY_NAME } from "./options"; // the option table

/** The dated id of this vector set (bump it whenever a vector changes). */
export const GOLDEN_VECTOR_SET_ID = "openssl-s-client-explainer/2026-10-27c"; // b: re-pinned on real 3.5.9 runs the same day; c: the Share results copy (shareableSClient)

/** What an output vector pins. */
export interface OutputExpect {
  layout: "full" | "brief" | "unknown"; // the layout read
  items: number; // how many items the output became
  connections: number; // how many handshakes
  protocol: string | null; // first connection: negotiated version
  cipher: string | null; // first connection: cipher
  cipherLineVersion: string | null; // first connection: the version on the "New," line
  verifyCode: number | null; // first connection: Verify return code
  verifyErrors: string[]; // first connection: "num@depth" of each verify error line
  chain: number; // first connection: entries in Certificate chain
  tickets: number; // all connections: post-handshake tickets
  tempKey: string | null; // first connection: temp key or group
  alpn: string | null; // first connection: ALPN ("" for No ALPN negotiated)
  peername: string | null; // first connection: Verified peername
  ocsp: "none" | "stapled" | null; // first connection: OCSP outcome
  ocspCertStatus: string | null; // first connection: stapled Cert Status
  kinds: Record<string, number>; // counts of selected item kinds (connecting and protocol-line are 3.5 lines)
  findings: FindingId[]; // the merged findings, in order
}

/** One output vector: a capture id and its expectations. */
export interface OutputVector { id: string; expect: OutputExpect }

/** The output vectors, one per capture (real 3.5.9 runs). */
export const OUTPUT_VECTORS: readonly OutputVector[] = Object.freeze([
  { id: "missing-intermediate", expect: {layout: "full", items: 48, connections: 1, protocol: "TLSv1.3", cipher: "TLS_AES_256_GCM_SHA384", cipherLineVersion: "TLSv1.3", verifyCode: 21, verifyErrors: ["20@0", "21@0"], chain: 1, tickets: 2, tempKey: "X25519MLKEM768", alpn: "", peername: null, ocsp: null, ocspCertStatus: null, kinds: {"verify-error": 2, "chain-entry": 1, pem: 1, "ssl-session": 2, "ticket-arrived": 2, data: 0, "error-stack": 0, state: 0, msg: 0, connecting: 1, "protocol-line": 1}, findings: ["verifyFailed", "missingIntermediate", "noHostnameCheck", "connectedDespiteErrors", "secretsPrinted", "sniDiffers", "verifyNotEnforced", "emsNoTls13Note", "tls13Tickets"]} }, // the Example
  { id: "tls13-full-chain", expect: {layout: "full", items: 47, connections: 1, protocol: "TLSv1.3", cipher: "TLS_AES_256_GCM_SHA384", cipherLineVersion: "TLSv1.3", verifyCode: 0, verifyErrors: [], chain: 2, tickets: 2, tempKey: "X25519MLKEM768", alpn: "", peername: null, ocsp: null, ocspCertStatus: null, kinds: {"verify-error": 0, "chain-entry": 2, pem: 1, "ssl-session": 2, "ticket-arrived": 2, data: 0, "error-stack": 0, state: 0, msg: 0, connecting: 1, "protocol-line": 1}, findings: ["hostnameNotChecked", "secretsPrinted", "sniDiffers", "verifyNotEnforced", "emsNoTls13Note", "tls13Tickets"]} }, // TLS 1.3 good chain
  { id: "tls12-forced-alpn", expect: {layout: "full", items: 36, connections: 1, protocol: "TLSv1.2", cipher: "ECDHE-RSA-AES256-GCM-SHA384", cipherLineVersion: "TLSv1.2", verifyCode: 0, verifyErrors: [], chain: 2, tickets: 0, tempKey: "X25519, 253 bits", alpn: "h2", peername: null, ocsp: null, ocspCertStatus: null, kinds: {"verify-error": 0, "chain-entry": 2, pem: 1, "ssl-session": 1, "ticket-arrived": 0, data: 0, "error-stack": 0, state: 0, msg: 0, connecting: 1, "protocol-line": 1}, findings: ["hostnameNotChecked", "secretsPrinted", "sniDiffers", "verifyNotEnforced"]} }, // TLS 1.2 forced
  { id: "tls11-seclevel0", expect: {layout: "full", items: 36, connections: 1, protocol: "TLSv1.1", cipher: "ECDHE-RSA-AES256-SHA", cipherLineVersion: "TLSv1.0", verifyCode: 0, verifyErrors: [], chain: 2, tickets: 0, tempKey: "X25519, 253 bits", alpn: "", peername: null, ocsp: null, ocspCertStatus: null, kinds: {"verify-error": 0, "chain-entry": 2, pem: 1, "ssl-session": 1, "ticket-arrived": 0, data: 0, "error-stack": 0, state: 0, msg: 0, connecting: 1, "protocol-line": 1}, findings: ["oldProtocol", "oldProtocolForced", "seclevelZero", "hostnameNotChecked", "cbcCipher", "secretsPrinted", "sniDiffers", "verifyNotEnforced", "cipherLineVersion"]} }, // old protocol, cipher-line trap
  { id: "unknown-ca-root-sent", expect: {layout: "full", items: 51, connections: 1, protocol: "TLSv1.3", cipher: "TLS_AES_256_GCM_SHA384", cipherLineVersion: "TLSv1.3", verifyCode: 19, verifyErrors: ["19@2"], chain: 3, tickets: 2, tempKey: "X25519MLKEM768", alpn: "", peername: null, ocsp: null, ocspCertStatus: null, kinds: {"verify-error": 1, "chain-entry": 3, pem: 1, "ssl-session": 2, "ticket-arrived": 2, data: 0, "error-stack": 0, state: 0, msg: 0, connecting: 1, "protocol-line": 1}, findings: ["verifyFailed", "untrustedRoot", "noHostnameCheck", "connectedDespiteErrors", "secretsPrinted", "sniDiffers", "verifyNotEnforced", "defaultTrustStore", "rootSent", "emsNoTls13Note", "tls13Tickets"]} }, // unknown CA
  { id: "self-signed-leaf", expect: {layout: "full", items: 45, connections: 1, protocol: "TLSv1.3", cipher: "TLS_AES_256_GCM_SHA384", cipherLineVersion: "TLSv1.3", verifyCode: 18, verifyErrors: ["18@0"], chain: 1, tickets: 2, tempKey: "X25519MLKEM768", alpn: "", peername: null, ocsp: null, ocspCertStatus: null, kinds: {"verify-error": 1, "chain-entry": 1, pem: 1, "ssl-session": 2, "ticket-arrived": 2, data: 0, "error-stack": 0, state: 0, msg: 0, connecting: 1, "protocol-line": 1}, findings: ["verifyFailed", "selfSignedLeaf", "noHostnameCheck", "connectedDespiteErrors", "secretsPrinted", "sniDiffers", "verifyNotEnforced", "defaultTrustStore", "emsNoTls13Note", "tls13Tickets"]} }, // self-signed
  { id: "verify-return-error-abort", expect: {layout: "full", items: 26, connections: 1, protocol: "TLSv1.3", cipher: "TLS_AES_256_GCM_SHA384", cipherLineVersion: "TLSv1.3", verifyCode: 20, verifyErrors: ["20@0"], chain: 1, tickets: 0, tempKey: "X25519MLKEM768", alpn: "", peername: null, ocsp: null, ocspCertStatus: null, kinds: {"verify-error": 1, "chain-entry": 1, pem: 0, "ssl-session": 0, "ticket-arrived": 0, data: 0, "error-stack": 1, state: 0, msg: 0, connecting: 1, "protocol-line": 1}, findings: ["handshakeFailed", "abortedOnVerify", "verifyFailed", "missingIntermediate", "noHostnameCheck", "sniDiffers"]} }, // aborted
  { id: "showcerts", expect: {layout: "full", items: 48, connections: 1, protocol: "TLSv1.3", cipher: "TLS_AES_256_GCM_SHA384", cipherLineVersion: "TLSv1.3", verifyCode: 0, verifyErrors: [], chain: 2, tickets: 2, tempKey: "X25519MLKEM768", alpn: "", peername: null, ocsp: null, ocspCertStatus: null, kinds: {"verify-error": 0, "chain-entry": 2, pem: 2, "ssl-session": 2, "ticket-arrived": 2, data: 0, "error-stack": 0, state: 0, msg: 0, connecting: 1, "protocol-line": 1}, findings: ["hostnameNotChecked", "secretsPrinted", "sniDiffers", "verifyNotEnforced", "emsNoTls13Note", "tls13Tickets"]} }, // -showcerts
  { id: "brief", expect: {layout: "brief", items: 9, connections: 1, protocol: "TLSv1.3", cipher: "TLS_AES_256_GCM_SHA384", cipherLineVersion: null, verifyCode: null, verifyErrors: [], chain: 0, tickets: 0, tempKey: "X25519MLKEM768", alpn: null, peername: null, ocsp: null, ocspCertStatus: null, kinds: {"verify-error": 0, "chain-entry": 0, pem: 0, "ssl-session": 0, "ticket-arrived": 0, data: 0, "error-stack": 0, state: 0, msg: 0, connecting: 1, "protocol-line": 0}, findings: ["hostnameNotChecked", "sniDiffers", "verifyNotEnforced"]} }, // -brief
  { id: "status-not-stapled", expect: {layout: "full", items: 48, connections: 1, protocol: "TLSv1.3", cipher: "TLS_AES_256_GCM_SHA384", cipherLineVersion: "TLSv1.3", verifyCode: 0, verifyErrors: [], chain: 2, tickets: 2, tempKey: "X25519MLKEM768", alpn: "", peername: null, ocsp: "none", ocspCertStatus: null, kinds: {"verify-error": 0, "chain-entry": 2, pem: 1, "ssl-session": 2, "ticket-arrived": 2, data: 0, "error-stack": 0, state: 0, msg: 0, connecting: 1, "protocol-line": 1}, findings: ["hostnameNotChecked", "secretsPrinted", "sniDiffers", "verifyNotEnforced", "emsNoTls13Note", "tls13Tickets", "ocspNotStapled"]} }, // -status, nothing stapled
  { id: "status-stapled-good", expect: {layout: "full", items: 37, connections: 1, protocol: "TLSv1.2", cipher: "ECDHE-RSA-AES256-GCM-SHA384", cipherLineVersion: "TLSv1.2", verifyCode: 0, verifyErrors: [], chain: 2, tickets: 0, tempKey: "X25519, 253 bits", alpn: "", peername: null, ocsp: "stapled", ocspCertStatus: "good", kinds: {"verify-error": 0, "chain-entry": 2, pem: 1, "ssl-session": 1, "ticket-arrived": 0, data: 0, "error-stack": 0, state: 0, msg: 0, connecting: 1, "protocol-line": 1}, findings: ["hostnameNotChecked", "secretsPrinted", "sniDiffers", "verifyNotEnforced", "ocspGood"]} }, // -status, stapled good
  { id: "hostname-mismatch", expect: {layout: "full", items: 50, connections: 1, protocol: "TLSv1.3", cipher: "TLS_AES_256_GCM_SHA384", cipherLineVersion: "TLSv1.3", verifyCode: 62, verifyErrors: ["62@0"], chain: 2, tickets: 2, tempKey: "X25519MLKEM768", alpn: "", peername: null, ocsp: null, ocspCertStatus: null, kinds: {"verify-error": 1, "chain-entry": 2, pem: 1, "ssl-session": 2, "ticket-arrived": 2, data: 0, "error-stack": 0, state: 0, msg: 0, connecting: 1, "protocol-line": 1}, findings: ["verifyFailed", "nameMismatch", "connectedDespiteErrors", "secretsPrinted", "sniDiffers", "verifyNotEnforced", "emsNoTls13Note", "tls13Tickets"]} }, // error 62
  { id: "hostname-ok-brief", expect: {layout: "brief", items: 10, connections: 1, protocol: "TLSv1.3", cipher: "TLS_AES_256_GCM_SHA384", cipherLineVersion: null, verifyCode: null, verifyErrors: [], chain: 0, tickets: 0, tempKey: "X25519MLKEM768", alpn: null, peername: "www.example.test", ocsp: null, ocspCertStatus: null, kinds: {"verify-error": 0, "chain-entry": 0, pem: 0, "ssl-session": 0, "ticket-arrived": 0, data: 0, "error-stack": 0, state: 0, msg: 0, connecting: 1, "protocol-line": 0}, findings: ["sniDiffers", "verifyNotEnforced", "hostnameVerified"]} }, // Verified peername
  { id: "expired-attime", expect: {layout: "full", items: 52, connections: 1, protocol: "TLSv1.3", cipher: "TLS_AES_256_GCM_SHA384", cipherLineVersion: "TLSv1.3", verifyCode: 10, verifyErrors: ["10@0"], chain: 2, tickets: 2, tempKey: "X25519MLKEM768", alpn: "", peername: null, ocsp: null, ocspCertStatus: null, kinds: {"verify-error": 1, "chain-entry": 2, pem: 1, "ssl-session": 2, "ticket-arrived": 2, data: 0, "error-stack": 0, state: 0, msg: 0, connecting: 1, "protocol-line": 1}, findings: ["verifyFailed", "expired", "noHostnameCheck", "connectedDespiteErrors", "secretsPrinted", "sniDiffers", "verifyNotEnforced", "emsNoTls13Note", "tls13Tickets"]} }, // error 10
  { id: "state-brief", expect: {layout: "brief", items: 27, connections: 1, protocol: "TLSv1.3", cipher: "TLS_AES_256_GCM_SHA384", cipherLineVersion: null, verifyCode: null, verifyErrors: [], chain: 0, tickets: 0, tempKey: "X25519MLKEM768", alpn: null, peername: null, ocsp: null, ocspCertStatus: null, kinds: {"verify-error": 0, "chain-entry": 0, pem: 0, "ssl-session": 0, "ticket-arrived": 0, data: 0, "error-stack": 0, state: 16, msg: 0, connecting: 1, "protocol-line": 0}, findings: ["hostnameNotChecked", "sniDiffers", "verifyNotEnforced"]} }, // -state
  { id: "reconnect-full", expect: {layout: "full", items: 101, connections: 6, protocol: "TLSv1.2", cipher: "ECDHE-RSA-AES256-GCM-SHA384", cipherLineVersion: "TLSv1.2", verifyCode: 0, verifyErrors: [], chain: 2, tickets: 0, tempKey: "X25519, 253 bits", alpn: "", peername: null, ocsp: null, ocspCertStatus: null, kinds: {"verify-error": 0, "chain-entry": 2, pem: 1, "ssl-session": 6, "ticket-arrived": 0, data: 0, "error-stack": 0, state: 0, msg: 0, connecting: 6, "protocol-line": 6}, findings: ["hostnameNotChecked", "secretsPrinted", "sniDiffers", "verifyNotEnforced", "resumed"]} }, // -reconnect
  { id: "reconnect-brief", expect: {layout: "brief", items: 40, connections: 6, protocol: "TLSv1.2", cipher: "ECDHE-RSA-AES256-GCM-SHA384", cipherLineVersion: null, verifyCode: null, verifyErrors: [], chain: 0, tickets: 0, tempKey: "X25519, 253 bits", alpn: null, peername: null, ocsp: null, ocspCertStatus: null, kinds: {"verify-error": 0, "chain-entry": 0, pem: 0, "ssl-session": 0, "ticket-arrived": 0, data: 0, "error-stack": 0, state: 0, msg: 0, connecting: 6, "protocol-line": 0}, findings: ["hostnameNotChecked", "sniDiffers", "verifyNotEnforced"]} }, // -reconnect -brief
  { id: "alpn-verified-tls13", expect: {layout: "full", items: 48, connections: 1, protocol: "TLSv1.3", cipher: "TLS_AES_256_GCM_SHA384", cipherLineVersion: "TLSv1.3", verifyCode: 0, verifyErrors: [], chain: 2, tickets: 2, tempKey: "X25519MLKEM768", alpn: "h2", peername: "www.example.test", ocsp: null, ocspCertStatus: null, kinds: {"verify-error": 0, "chain-entry": 2, pem: 1, "ssl-session": 2, "ticket-arrived": 2, data: 0, "error-stack": 0, state: 0, msg: 0, connecting: 1, "protocol-line": 1}, findings: ["secretsPrinted", "sniDiffers", "hostnameVerified", "emsNoTls13Note", "tls13Tickets"]} }, // all checks on
  { id: "msg-brief", expect: {layout: "brief", items: 79, connections: 1, protocol: "TLSv1.3", cipher: "TLS_AES_256_GCM_SHA384", cipherLineVersion: null, verifyCode: null, verifyErrors: [], chain: 0, tickets: 0, tempKey: "X25519MLKEM768", alpn: null, peername: null, ocsp: null, ocspCertStatus: null, kinds: {"verify-error": 0, "chain-entry": 0, pem: 0, "ssl-session": 0, "ticket-arrived": 0, data: 0, "error-stack": 0, state: 0, msg: 35, connecting: 1, "protocol-line": 0}, findings: ["hostnameNotChecked", "sniDiffers", "verifyNotEnforced"]} }, // -msg: 35 protocol messages, the ClientHello with its ML-KEM key share
]);

/** What a command vector pins. */
export interface CommandExpect {
  found: boolean; // an invocation was found
  options?: string[]; // canonical names with =value, "?" for unknown, "!problem"
  host?: string | null; // target host
  port?: string | null; // target port
  portDefaulted?: boolean; // 4433 by default
  sni?: string; // SNI mode
  sniValue?: string | null; // SNI value
  stdinClosed?: boolean; // input closed
  inputFrom?: string | null; // producer
  outputTo?: string | null; // consumer
  findings: FindingId[]; // the command findings, in order
}

/** One command vector (command lines written for the tests). */
export interface CommandVector { id: string; command: string; expect: CommandExpect }

/** The command vectors. */
export const COMMAND_VECTORS: readonly CommandVector[] = Object.freeze([
  { id: "connect-without-port", command: "openssl s_client -connect example.com", expect: { found: true, options: ["-connect=example.com"], host: "example.com", port: "4433", portDefaulted: true, sni: "from-host", sniValue: "example.com", findings: ["connectNoPort", "noHostnameCheck", "verifyNotEnforced", "defaultTrustStore"] } }, // the 4433 trap
  { id: "ip-target-no-sni", command: "openssl s_client -connect 192.0.2.10:443", expect: { found: true, host: "192.0.2.10", port: "443", portDefaulted: false, sni: "none-ip", sniValue: null, findings: ["sniFromIp", "noHostnameCheck", "verifyNotEnforced", "defaultTrustStore"] } }, // no SNI for an IP
  { id: "ipv6-bracketed-servername", command: "openssl s_client -connect [2001:db8::1]:443 -servername www.example.test", expect: { found: true, host: "[2001:db8::1]", port: "443", sni: "explicit", sniValue: "www.example.test", findings: ["noHostnameCheck", "verifyNotEnforced", "defaultTrustStore"] } }, // IPv6 with SNI
  { id: "echo-pipe-x509", command: "echo | openssl s_client -connect example.com:443 -servername example.com 2>/dev/null | openssl x509 -noout -dates", expect: { found: true, options: ["-connect=example.com:443", "-servername=example.com"], stdinClosed: true, inputFrom: "echo", outputTo: "openssl", findings: ["noHostnameCheck", "verifyNotEnforced", "defaultTrustStore", "inputClosedEarly"] } }, // the common one-liner
  { id: "double-dash-and-equals", command: "openssl s_client --servername=example.com --connect=example.com:443 -verify_return_error -verify_hostname example.com -CAfile ca.pem", expect: { found: true, options: ["-servername=example.com", "-connect=example.com:443", "-verify_return_error", "-verify_hostname=example.com", "-CAfile=ca.pem"], sni: "explicit", findings: [] } }, // opt.c forms, all checks on
  { id: "servername-and-noservername", command: "openssl s_client -connect example.com:443 -servername example.com -noservername", expect: { found: true, sni: "suppressed", findings: ["servernameAndNoservername", "sniSuppressed", "noHostnameCheck", "verifyNotEnforced", "defaultTrustStore"] } }, // refused pair
  { id: "starttls-unknown-keyword", command: "openssl s_client -connect mail.example.com:25 -starttls smtps", expect: { found: true, findings: ["noHostnameCheck", "verifyNotEnforced", "defaultTrustStore", "starttlsUnknown"] } }, // smtps is not a keyword
  { id: "tls12-with-no-tls13-and-ciphersuites", command: "openssl s_client -connect example.com:443 -tls1_2 -no_tls1_3 -ciphersuites TLS_AES_128_GCM_SHA256", expect: { found: true, findings: ["deprecatedOption", "noHostnameCheck", "verifyNotEnforced", "defaultTrustStore", "versionAndNo", "ciphersuitesWithTls12Only"] } }, // version rules
  { id: "tls13-with-cipher-and-npn", command: "openssl s_client -connect example.com:443 -tls1_3 -cipher ECDHE-RSA-AES128-GCM-SHA256 -nextprotoneg h2", expect: { found: true, findings: ["noHostnameCheck", "verifyNotEnforced", "defaultTrustStore", "cipherWithTls13Only", "nextprotonegTls13"] } }, // -cipher is TLS 1.2 only
  { id: "quic-without-alpn", command: "openssl s_client -quic -connect example.com:443", expect: { found: true, findings: ["noHostnameCheck", "verifyNotEnforced", "defaultTrustStore", "quicWithoutAlpn"] } }, // QUIC needs ALPN
  { id: "keylog-and-pass", command: "openssl s_client -connect example.com:443 -keylogfile /tmp/keys.log -cert c.pem -key k.pem -pass pass:secret", expect: { found: true, findings: ["noHostnameCheck", "verifyNotEnforced", "defaultTrustStore", "keylogFile", "passOnCommandLine"] } }, // secrets
  { id: "proxy-basic-auth", command: "openssl s_client -connect example.com:443 -proxy proxy.example.net:3128 -proxy_user alice", expect: { found: true, findings: ["noHostnameCheck", "verifyNotEnforced", "defaultTrustStore", "proxyBasicAuth"] } }, // Basic in the clear
  { id: "unknown-and-missing-value", command: "openssl s_client -connect example.com:443 -frobnicate -CAfile", expect: { found: true, options: ["-connect=example.com:443", "-frobnicate?", "-CAfile!missingValue"], findings: ["unknownOption", "missingValue", "noHostnameCheck", "verifyNotEnforced"] } }, // parse problems
  { id: "flag-with-value", command: "openssl s_client -connect example.com:443 -showcerts=yes", expect: { found: true, options: ["-connect=example.com:443", "-showcerts=yes!unexpectedValue"], findings: ["unexpectedValue", "noHostnameCheck", "verifyNotEnforced", "defaultTrustStore"] } }, // flag=value
  { id: "no-target-at-all", command: "openssl s_client", expect: { found: true, options: [], host: "localhost", port: "4433", portDefaulted: true, sni: "localhost", sniValue: "localhost", findings: ["defaultTarget", "noHostnameCheck", "verifyNotEnforced", "defaultTrustStore"] } }, // localhost:4433
  { id: "connect-and-target-word", command: "openssl s_client -connect a.example:443 b.example:443", expect: { found: true, host: "a.example", findings: ["connectAndTarget", "noHostnameCheck", "verifyNotEnforced", "defaultTrustStore"] } }, // both
  { id: "two-target-words", command: "openssl s_client a.example:443 b.example:443", expect: { found: true, host: "a.example", port: "443", findings: ["extraArguments", "noHostnameCheck", "verifyNotEnforced", "defaultTrustStore"] } }, // too many
  { id: "engine-and-ssl3", command: "openssl s_client -connect example.com:443 -engine pkcs11 -ssl3", expect: { found: true, findings: ["removedIn4", "removedIn4", "noHostnameCheck", "verifyNotEnforced", "defaultTrustStore", "oldProtocolForced"] } }, // OpenSSL 4 notes
  { id: "crl-download-alone", command: "openssl s_client -connect example.com:443 -crl_download", expect: { found: true, findings: ["noHostnameCheck", "verifyNotEnforced", "defaultTrustStore", "crlDownloadIgnored"] } }, // ignored
  { id: "tls1-seclevel0-quoted", command: "openssl s_client -connect legacy.example.net:443 -tls1 -cipher 'DEFAULT@SECLEVEL=0'", expect: { found: true, options: ["-connect=legacy.example.net:443", "-tls1", "-cipher=DEFAULT@SECLEVEL=0"], findings: ["noHostnameCheck", "verifyNotEnforced", "defaultTrustStore", "oldProtocolForced", "seclevelZero"] } }, // quotes removed
  { id: "continued-lines-devnull", command: "openssl s_client \\\n  -connect example.com:443 \\\n  -servername example.com </dev/null", expect: { found: true, options: ["-connect=example.com:443", "-servername=example.com"], stdinClosed: true, inputFrom: "/dev/null", findings: ["noHostnameCheck", "verifyNotEnforced", "defaultTrustStore", "inputClosedEarly"] } }, // backslash continuations
  { id: "dane-ip-target", command: "openssl s_client -dane_tlsa_domain example.com -dane_tlsa_rrdata '3 1 1 abcd' -connect 192.0.2.1:25", expect: { found: true, options: ["-dane_tlsa_domain=example.com", "-dane_tlsa_rrdata=3 1 1 abcd", "-connect=192.0.2.1:25"], sni: "dane", sniValue: "example.com", findings: ["verifyNotEnforced", "defaultTrustStore"] } }, // DANE names the host
  { id: "windows-exe", command: "openssl.exe s_client -connect example.com:443 -servername example.com", expect: { found: true, sni: "explicit", findings: ["noHostnameCheck", "verifyNotEnforced", "defaultTrustStore"] } }, // openssl.exe
  { id: "not-s-client", command: "wget https://example.com/", expect: { found: false, findings: ["noCommandFound"] } }, // another program
  { id: "service-name-port", command: "openssl s_client -connect example.com:https -verify 5", expect: { found: true, options: ["-connect=example.com:https", "-verify=5"], port: "https", portDefaulted: false, findings: ["noHostnameCheck", "verifyNotEnforced", "defaultTrustStore"] } }, // service name
  { id: "prompt-starttls-quiet", command: "$ openssl s_client -connect smtp.example.com:587 -starttls smtp -crlf -quiet < /dev/null", expect: { found: true, options: ["-connect=smtp.example.com:587", "-starttls=smtp", "-crlf", "-quiet"], stdinClosed: true, inputFrom: "/dev/null", findings: ["noHostnameCheck", "verifyNotEnforced", "defaultTrustStore"] } }, // -quiet implies -ign_eof
]);

/** Render an explained option the way the vectors write it. */
function optionKey(o: { name: string; value: string | null; known: boolean; problem: string | null }): string {
  return `${o.name}${o.value !== null ? "=" + o.value : ""}${o.known ? "" : "?"}${o.problem ? "!" + o.problem : ""}`; // e.g. "-CAfile!missingValue"
}

/** Compare two values as JSON (arrays and primitives). */
/**
 * One share vector: the two boxes (a capture's, or text written for the test), and what the copy must be. The
 * expected boxes are the input with each listed secret replaced by SHARE_REDACTED and nothing else changed, unless a
 * vector gives the exact expected command; every listed secret must be absent from the copy afterwards.
 */
export interface ShareVector {
  id: string; // the vector's name
  capture?: string; // a capture id: its command and output are the input
  command?: string; // or a command written for the test
  output?: string; // or an output written for the test
  secrets: readonly string[]; // the values that must be replaced, each occurrence, and must not survive
  expectCommand?: string; // the exact command box of the copy, when it differs from a plain replacement
  expectOutput?: string; // the exact output box of the copy, when it differs from a plain replacement
  redacted: number; // how many values the copy replaced
}

/** The share vectors (Share results, 2026-10-27). */
export const SHARE_VECTORS: readonly ShareVector[] = Object.freeze([
  // The Example (TLS 1.3): its two Resumption PSK values, the post-handshake tickets' secrets.
  { id: "share-example", capture: "missing-intermediate", secrets: ["466B5761F596FB42E4CD1BAF2E4A7B67C559DA0E0C7079892C9FA911CA873CCAF9F74683442F61C133709DEEA58D00DF", "8FF03262578AE6CB34BD39D74A1A6EF6C2E981FA3DA248DE261FE99BEEC5908040972EF1B2BE5DCB91935993295A5CDE"], redacted: 2 },
  // TLS 1.2: the Master-Key.
  { id: "share-tls12-master-key", capture: "tls12-forced-alpn", secrets: ["C2227C3B8663204B8B7E9CCD2E7582870C19E6C68BD0B9FEDFAC802C4685F2318E30370B7466942A81980E1CB1E5FAD4"], redacted: 1 },
  // -reconnect: the same Master-Key printed six times, every one replaced.
  { id: "share-reconnect-six", capture: "reconnect-full", secrets: ["F018B29EA42BB7B4EC2B00CBE92A6EFC84D61AAFFED7BB7851C7B05DF2E4717FF45FAE335BB3FE2499C1B61B8D1D62B6"], redacted: 6 },
  // -brief prints no session block: nothing to replace, the copy is the paste.
  { id: "share-brief-nothing", capture: "brief", secrets: [], redacted: 0 },
  // The four command-line secrets (the manual's forms), quoted and unquoted.
  {
    id: "share-command-secrets",
    command: "openssl s_client -connect lab.example.test:443 -cert client.pem -key client.key -pass pass:hunter2 -proxy proxy.example.test:3128 -proxy_user ana -proxy_pass 'pass:p w' -psk 1a2b3c4d -srppass s3cret",
    output: "",
    secrets: ["hunter2", "p w", "1a2b3c4d", "s3cret"],
    expectCommand: "openssl s_client -connect lab.example.test:443 -cert client.pem -key client.key -pass pass:[redacted] -proxy proxy.example.test:3128 -proxy_user ana -proxy_pass pass:[redacted] -psk [redacted] -srppass [redacted]",
    redacted: 4,
  },
  // A source that is not the password itself stays: env:, file:, fd: and stdin.
  { id: "share-command-sources-kept", command: "openssl s_client -connect lab.example.test:443 -key client.key -pass env:KEYPASS -proxy_pass file:/run/proxy.pass -sess_out s.pem", output: "", secrets: [], redacted: 0 },
  // The "--opt=value" form, and a value after a line continuation, with quotes inside the word.
  {
    id: "share-command-inline-and-continued",
    command: "openssl s_client --pass=pass:abc -psk=0011 -connect lab.example.test:443 \
  -pass \
  pass:z\"q r\"",
    output: "",
    secrets: ["abc", "0011", "q r"],
    expectCommand: "openssl s_client --pass=pass:[redacted] -psk=[redacted] -connect lab.example.test:443 \
  -pass \
  pass:[redacted]",
    redacted: 3,
  },
  // The command at the top of the output box (the split form): its secret goes too.
  {
    id: "share-command-in-output",
    output: "openssl s_client -connect localhost:44331 -servername www.example.test -tls1_2 -pass pass:lab-only-pw\nCONNECTED(00000003)\n---\nSSL-Session:\n    Protocol  : TLSv1.2\n    Master-Key: 00112233445566778899AABBCCDDEEFF\n",
    command: "",
    secrets: ["lab-only-pw", "00112233445566778899AABBCCDDEEFF"],
    expectOutput: "openssl s_client -connect localhost:44331 -servername www.example.test -tls1_2 -pass pass:[redacted]\nCONNECTED(00000003)\n---\nSSL-Session:\n    Protocol  : TLSv1.2\n    Master-Key: [redacted]\n",
    redacted: 2,
  },
  // Another command's pass phrase in a pasted terminal session.
  { id: "share-other-pass-word", command: "", output: "$ openssl pkcs12 -in lab.p12 -passin pass:Secr3t -nokeys\nMAC verified OK", secrets: ["Secr3t"], expectOutput: "$ openssl pkcs12 -in lab.p12 -passin pass:[redacted] -nokeys\nMAC verified OK", redacted: 1 },
]);

function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b); // structural equality for the pinned shapes
}

/** Run every vector; return the shape the golden-vector runner reads. */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  const failures: string[] = []; // what failed
  let total = 0; // vectors run

  // ---- output vectors ----
  for (const v of OUTPUT_VECTORS) { // each capture
    total += 1; // one vector
    const c = capture(v.id); // the capture
    const r = explain({ command: c.command, output: c.output }); // both inputs
    const o = r.output; // the output part
    if (!o) { failures.push(`${v.id}: no output explanation`); continue; } // must exist
    const c1 = o.connections[0]; // the first handshake
    const kinds: Record<string, number> = {}; // counts of the pinned kinds
    for (const k of Object.keys(v.expect.kinds)) kinds[k] = o.items.filter((x) => x.kind === k).length; // count each
    const got: OutputExpect = { // the same shape as the expectation
      layout: o.layout, items: o.items.length, connections: o.connections.length, protocol: c1.protocol, cipher: c1.cipher, // handshake
      cipherLineVersion: c1.cipherLineVersion, verifyCode: c1.verifyCode, verifyErrors: c1.verifyErrors.map((e) => `${e.num}@${e.depth}`), // verification
      chain: c1.chain.length, tickets: o.connections.reduce((s, x) => s + x.tickets, 0), tempKey: c1.tempKey, alpn: c1.alpn, // chain and keys
      peername: c1.verifiedPeername, ocsp: c1.ocsp, ocspCertStatus: c1.ocspCertStatus, kinds, findings: r.findings.map((f) => f.id), // the rest
    };
    for (const key of Object.keys(v.expect) as (keyof OutputExpect)[]) { // every pinned field
      if (!same(got[key], v.expect[key])) failures.push(`${v.id}: ${key} expected ${JSON.stringify(v.expect[key])}, got ${JSON.stringify(got[key])}`); // drift
    }
    if (o.items.some((x) => x.kind === "data")) failures.push(`${v.id}: a line of real s_client output was not recognised`); // every line of a capture is s_client's
  }

  // ---- command vectors ----
  for (const v of COMMAND_VECTORS) { // each command
    total += 1; // one vector
    const r = explainCommand(v.command); // explain it
    const e = v.expect; // the expectation
    const check = (name: string, want: unknown, gotValue: unknown) => { if (want !== undefined && !same(want, gotValue)) failures.push(`${v.id}: ${name} expected ${JSON.stringify(want)}, got ${JSON.stringify(gotValue)}`); }; // compare one field
    check("found", e.found, r.found); // found
    check("options", e.options, r.options.map(optionKey)); // options
    check("host", e.host, r.target.host); // host
    check("port", e.port, r.target.port); // port
    check("portDefaulted", e.portDefaulted, r.target.portDefaulted); // default port
    check("sni", e.sni, r.sni.mode); // SNI mode
    check("sniValue", e.sniValue, r.sni.value); // SNI value
    check("stdinClosed", e.stdinClosed, r.stdinClosed); // input
    check("inputFrom", e.inputFrom, r.inputFrom); // producer
    check("outputTo", e.outputTo, r.outputTo); // consumer
    check("findings", e.findings, r.findings.map((f) => f.id)); // findings
  }

  // ---- run vectors (the single-string entry point) ----
  const ex = capture("missing-intermediate"); // the Example capture
  total += 1; // pasted together, as a terminal shows them
  { const r = run(`$ ${ex.command}\n${ex.output}`); const both = explain({ command: ex.command, output: ex.output }); if (!r.command?.found || !same(r.findings.map((f) => f.id), both.findings.map((f) => f.id)) || r.output?.items.length !== both.output?.items.length) failures.push("run-together: command plus output in one string should read like the two boxes"); } // same reading
  total += 1; // output alone
  { const t = capture("tls12-forced-alpn"); const r = run(t.output); if (r.command !== null || r.output?.connections[0].alpn !== "h2" || r.findings.some((f) => f.id === "noHostnameCheck")) failures.push("run-output-only: output alone should read without a command"); } // no command
  total += 1; // not s_client text
  { const r = run(";; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 4321"); if (!same(r.findings.map((f) => f.id), ["notSClientOutput"]) || r.output?.recognised !== false) failures.push("run-not-s-client: dig output should be refused politely"); } // dig output
  total += 1; // command found at the top of the output box
  { const r = explain({ output: `openssl s_client ${ex.command.slice("openssl s_client ".length)}\n${ex.output}` }); if (!r.splitFromOutput || !r.command?.found || r.command.target.port !== "44332") failures.push("split-from-output: a command at the top of the output box should be separated"); } // split
  total += 1; // splitInput keeps the lines in order
  { const s = splitInput("first line\nopenssl s_client -connect a.example:443 \\\n  -servername a.example\nCONNECTED(00000003)"); if (s.command !== "openssl s_client -connect a.example:443 \\\n  -servername a.example" || s.output !== "first line\nCONNECTED(00000003)") failures.push(`split-continuation: got ${JSON.stringify(s)}`); } // continuation lines
  total += 1; // the line cap
  { const r = explainOutput("---\n".repeat(MAX_OUTPUT_LINES + 5)); if (!r.truncated || r.lines !== MAX_OUTPUT_LINES) failures.push(`cap-lines: expected truncation at ${MAX_OUTPUT_LINES} lines, got ${r.lines}`); } // bounded
  total += 1; // a very long line is cut, not fatal
  { const r = explainOutput("verify error:num=" + "9".repeat(MAX_LINE_LENGTH * 2)); if (r.items.length !== 1 || r.items[0].text.length !== MAX_LINE_LENGTH) failures.push("cap-line-length: a long line should be cut to MAX_LINE_LENGTH"); } // bounded line

  // ---- table vectors ----
  total += 1; // the code table is complete and in order
  { const nums = VERIFY_CODES.map((x) => x.code); if (nums.length !== 102 || nums.some((n, i) => n !== i)) failures.push("codes-contiguous: VERIFY_CODES should hold 0 to 101 in order"); } // 0..101
  total += 1; // the texts the captures printed match the table (3.5.9 x509_txt.c; the same texts in 3.0.13)
  { const seen: Array<[number, string]> = [[0, "ok"], [18, "self-signed certificate"], [19, "self-signed certificate in certificate chain"], [20, "unable to get local issuer certificate"], [21, "unable to verify the first certificate"], [10, "certificate has expired"], [62, "hostname mismatch"]]; for (const [n, t] of seen) { const row = VERIFY_CODE_BY_NUMBER.get(n); if (!row || row.text !== t) failures.push(`codes-text: code ${n} should print "${t}"`); } if (VERIFY_CODE_BY_NUMBER.get(9)?.text36 !== "certificate is not yet valid or the system clock is incorrect") failures.push("codes-text: code 9 has a 3.6.5 text of its own"); } // printed texts
  total += 1; // the option table: unique names, and the value-taking flags of the 3.5.9 option list
  { const names = OPTIONS.map((x) => x.name); if (new Set(names).size !== names.length) failures.push("options-unique: duplicate option names"); const takes: Array<[string, boolean]> = [["-connect", true], ["-servername", true], ["-noservername", false], ["-showcerts", false], ["-verify", true], ["-verify_return_error", false], ["-brief", false], ["-starttls", true], ["-alpn", true], ["-status", false], ["-CAfile", true], ["-sess_out", true], ["-tls1_3", false], ["-cipher", true], ["-groups", true]]; for (const [n, v] of takes) { const row = OPTION_BY_NAME.get(n); if (!row || (row.arg !== null) !== v) failures.push(`options-arg: ${n} should ${v ? "take" : "not take"} a value`); } } // option shapes
  total += 1; // the 3.5 basis of the code table: 0 to 95 are 3.5.9's, 96 to 101 are marked 3.6 only, 95 is marked absent from 3.0.13, only code 9 has a 3.6 text
  { const only36 = VERIFY_CODES.filter((x) => x.only36).map((x) => x.code); const notIn30 = VERIFY_CODES.filter((x) => x.notIn30).map((x) => x.code); const t36 = VERIFY_CODES.filter((x) => x.text36).map((x) => x.code); if (!same(only36, [96, 97, 98, 99, 100, 101]) || !same(notIn30, [95]) || !same(t36, [9]) || VERIFY_CODE_BY_NUMBER.get(9)?.text !== "certificate is not yet valid") failures.push(`codes-35: only36 ${JSON.stringify(only36)}, notIn30 ${JSON.stringify(notIn30)}, text36 ${JSON.stringify(t36)}`); } // 3.5.9 x509_vfy.h.in and x509_txt.c
  total += 1; // the 3.5 basis of the option table: only the two options 3.6 added are marked, and they raise newerOption
  { const marked = OPTIONS.filter((x) => x.notIn35).map((x) => x.name); const f = explainCommand("openssl s_client -connect example.com:443 -ocsp_check_leaf -CAfile ca.pem").findings.map((x) => x.id); if (!same(marked, ["-ocsp_check_leaf", "-ocsp_check_all"]) || !same(f, ["newerOption", "noHostnameCheck", "verifyNotEnforced"])) failures.push(`options-35: marked ${JSON.stringify(marked)}, findings ${JSON.stringify(f)}`); } // 3.5.9 option table vs the 3.6 page
  total += 1; // line formats only 3.5 prints that no capture holds (apps/s_client.c, apps/lib/s_cb.c, apps/lib/s_socket.c at openssl-3.5.9)
  { const o = explainOutput(["Connecting to 192.0.2.10", "CONNECTED(00000003)", "---", "Certificate chain", " 0 s:CN=www.example.test", "   i:CN=Example Lab Issuing CA 1", "   a:PKEY: EC, (prime256v1); sigalg: ecdsa-with-SHA256", "   v:NotBefore: Oct 27 01:51:20 2026 GMT; NotAfter: Jan 25 01:51:20 2027 GMT", "---", "Negotiated TLS1.3 group: X25519MLKEM768", "---", "New, TLSv1.3, Cipher is TLS_AES_256_GCM_SHA384", "Protocol: TLSv1.3", "This TLS version forbids renegotiation.", "Connecting via TFO", "Server-to-client raw public key negotiated", "no peer rpk available"].join("\n")); const c = o.connections[0]; const e = c.chain[0]; if (!same(o.items.map((x) => x.kind), ["connecting", "connected", "separator", "chain-header", "chain-entry", "separator", "negotiated-group", "separator", "cipher-line", "protocol-line", "secure-reneg", "connecting", "rpk", "rpk"]) || c.tempKey !== "X25519MLKEM768" || c.protocol !== "TLSv1.3" || c.secureReneg !== "forbidden" || !e || e.keyType !== "EC" || e.keyBits !== null || e.keyCurve !== "prime256v1") failures.push("lines-35: a 3.5 line format was misread"); } // 3.5 lines
  total += 1; // line formats kept from 3.0.13 (the run's own lines) and 3.6.5 (apps/s_client.c ocsp_resp_cb, apps/lib/s_cb.c verify_callback), not printed by 3.5
  { const o = explainOutput(["CONNECTED(00000003)", "depth=0 C = BR, O = Example Lab, CN = www.example.test", "verify return:1", "---", "Certificate chain", " 0 s:C = BR, O = Example Lab, CN = www.example.test", "   i:C = BR, O = Example Lab, CN = Example Lab Issuing CA 1", "   a:PKEY: rsaEncryption, 2048 (bit); sigalg: RSA-SHA256", "   v:NotBefore: Oct 27 01:51:20 2026 GMT; NotAfter: Jan 25 01:51:20 2027 GMT", "---", "Peer signature type: RSA-PSS", "Server Temp Key: X25519, 253 bits", "---", "New, TLSv1.3, Cipher is TLS_AES_256_GCM_SHA384", "Secure Renegotiation IS NOT supported", "OCSP responses: no responses sent", "no OCSP response(s) for certificate(s) found."].join("\n")); const c = o.connections[0]; if (!same(o.items.map((x) => x.kind), ["connected", "verify-depth", "verify-return", "separator", "chain-header", "chain-entry", "separator", "peer-signature-type", "temp-key", "separator", "cipher-line", "secure-reneg", "ocsp-none", "verify-ocsp-none"]) || c.tempKey !== "X25519, 253 bits" || c.chain[0]?.keyBits !== 2048 || c.ocsp !== "none") failures.push("lines-kept: a kept 3.0 or 3.6 line was misread"); } // kept lines
  total += 1; // -msg lines: msg_cb prints the same format in 3.0.13 and 3.5.9 (the bytes are from the 3.0.13 run)
  { const o = explainOutput([">>> TLS 1.0, RecordHeader [length 0005]", "    16 03 01 01 39", ">>> TLS 1.3, Handshake [length 0139], ClientHello", "    01 00 01 35 03 03 bb e9 2d 0c ed f0 a6 e7 09 41"].join("\n")); if (!same(o.items.map((x) => x.kind), ["msg", "msg-hex", "msg", "msg-hex"])) failures.push("lines-msg: a -msg line was misread"); } // -msg
  total += 1; // every capture is used by an output vector
  { const used = new Set(OUTPUT_VECTORS.map((v) => v.id)); for (const c of CAPTURES) if (!used.has(c.id)) failures.push(`captures-used: ${c.id} has no vector`); } // nothing idle

  // ---- share vectors (Share results, 2026-10-27) ----
  for (const v of SHARE_VECTORS) { // each copy
    total += 1; // one vector
    const c = v.capture ? capture(v.capture) : null; // a capture, if named
    const command = c ? c.command : v.command ?? ""; // the command box
    const output = c ? c.output : v.output ?? ""; // the output box
    const swap = (text: string) => v.secrets.reduce((t, sec) => t.split(sec).join(SHARE_REDACTED), text); // a plain replacement of the listed secrets
    const want = { command: v.expectCommand ?? swap(command), output: v.expectOutput ?? swap(output), redacted: v.redacted }; // the exact copy
    const got = shareableSClient({ command, output }); // the engine
    if (!same(got, want)) failures.push(`${v.id}: copy expected ${JSON.stringify(want).slice(0, 160)}, got ${JSON.stringify(got).slice(0, 160)}`); // byte for byte
    for (const sec of v.secrets) if (got.command.includes(sec) || got.output.includes(sec)) failures.push(`${v.id}: the copy still holds ${JSON.stringify(sec)}`); // nothing survives
    const before = explain({ command, output }).findings.map((f) => f.id).filter((id) => id !== "secretsPrinted"); // the sender's reading, less the secrets warning
    const after = explain({ command: got.command, output: got.output }).findings.map((f) => f.id); // the receiver's reading
    if (!same(after, before)) failures.push(`${v.id}: the receiving page reads ${JSON.stringify(after)}, the sender read ${JSON.stringify(before)}`); // the same handshake
  }

  const failedVectors = new Set(failures.map((f) => f.split(":")[0])).size; // every message starts with its vector's id
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: total - failedVectors, failures }; // the report
}
