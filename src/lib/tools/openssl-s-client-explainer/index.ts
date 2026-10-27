// ============================================================================
// src/lib/tools/openssl-s-client-explainer/index.ts
// ----------------------------------------------------------------------------
// Public surface + the D-49 declarative manifest for the openssl s_client
// explainer: paste an `openssl s_client` command line, what it printed, or
// both, and get every option and every block of the output explained against
// the OpenSSL 3.5 manual pages (3.5 is the long-term-support release, supported
// until 2030-04-08), with the defaults that apply because an option
// is missing and the findings worth flagging (verification that failed or was
// never enforced, a host name nobody checked, a chain missing its
// intermediate, an old protocol or cipher, secrets printed in the output).
//
// It reads text only. It connects to nothing, resolves nothing, runs nothing
// and reads no clock (zero egress, D-49). The engine is pure. Its golden
// vectors are real s_client runs of 2026-10-27 with OpenSSL 3.5.9, built from
// the official source, against 3.5.9 s_server on localhost (see captures.ts).
// ============================================================================

import { run as runEngine, type SClientExplanation } from "./compute"; // the engine
import { GOLDEN_VECTOR_SET_ID, OUTPUT_VECTORS, COMMAND_VECTORS } from "./golden-vectors"; // the vectors

export {
  explain, // command and/or output, the browser's entry point
  explainCommand, // the command line alone
  explainOutput, // the output alone
  splitInput, // separate a pasted command from the output under it
  tokenizeShell, // the shell word splitter
  isIpLiteral, // IP literal test (the SNI rule)
  SESSION_FIELDS, // the SSL-Session field explanations
  MAX_COMMAND_LENGTH, // the command cap
  MAX_OUTPUT_LENGTH, // the output size cap
  MAX_OUTPUT_LINES, // the output line cap
  MAX_LINE_LENGTH, // the line-length cap
} from "./compute";
export type {
  SClientExplanation, // the whole result
  CommandExplanation, // the command part
  OutputExplanation, // the output part
  ExplainedOption, // one option
  TargetView, // where it connects
  SniView, // the SNI decision
  OutputItem, // one line or block of output
  ItemKind, // its kind
  ChainEntry, // one certificate of the chain list
  ConnectionSummary, // one handshake
  VerifyErrorSeen, // one verify error line
  Finding, // one finding
  FindingId, // finding codes
  Severity, // high, warn, info
  SourceId, // the manifest source ids
} from "./compute";
export { OPTIONS, OPTION_BY_NAME, GROUP_LABELS, STARTTLS_PROTOCOLS } from "./options"; // the option table
export type { OptionInfo, OptionGroup, Bilingual } from "./options"; // its types
export { VERIFY_CODES, VERIFY_CODE_BY_NUMBER } from "./verify-codes"; // the verification codes
export type { VerifyCode } from "./verify-codes"; // its type
export { GOLDEN_VECTOR_SET_ID, OUTPUT_VECTORS, COMMAND_VECTORS, verifyVectors } from "./golden-vectors"; // the vectors and their runner

/** The D-49 declarative manifest for the openssl s_client explainer. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "TLS & transport", // the catalogue family (with the cipher-suite decoder)
  toolSlug: "openssl-s-client-explainer", // the route segment and i18n key
  canonicalAliases: ["s_client explainer", "openssl s_client", "s_client output", "verify return code", "openssl connect explainer", "tls handshake output"], // search aliases
  inputDetectors: [
    // Literal or bounded patterns, no nested quantifiers (ReDoS-safe); every example is copied from a golden vector.
    // Priority 1 for every one (S4 sweep, 2026-10-27): the paste box lists the LOWEST number first, and each of these
    // lines is printed by s_client and nothing else, so a capture must rank above the tools that read one piece of it:
    // the chain builder (3, two PEM blocks in a -showcerts capture), the cipher decoder (9) and the X.509 decoder (10).
    { kind: "regex", pattern: "openssl(\\.exe)?[ \\t]+s_client", priority: 1, example: "openssl s_client -connect localhost:44332 -servername www.example.test -CAfile root.pem" }, // the command (missing-intermediate)
    { kind: "regex", pattern: "CONNECTED\\([0-9A-F]{8}\\)", priority: 1, example: "CONNECTED(00000003)" }, // the first report line (every full capture)
    { kind: "regex", pattern: "SSL handshake has read \\d{1,20} bytes and written \\d{1,20} bytes", priority: 1, example: "SSL handshake has read 1511 bytes and written 398 bytes" }, // the byte counts (missing-intermediate)
    { kind: "regex", pattern: "Verify return code: \\d{1,5} \\(", priority: 1, example: "Verify return code: 21 (unable to verify the first certificate)" }, // the result (missing-intermediate)
    { kind: "regex", pattern: "CONNECTION ESTABLISHED\\r?\\nProtocol version: ", priority: 1, example: "CONNECTION ESTABLISHED\nProtocol version: TLSv1.3" }, // -brief (brief)
  ],

  // -- Capability & execution --
  capabilityBadge: "browser", // runs client-side
  executionClass: ["localOnly"], // text parsing only; no network, no clock
  apiCapabilityClass: "local-equivalent", // the API runs the same engine

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID, // the vector set id
  dangerousInputHandling: ["bounded-line-parse", "redos-guard", "never-connects", "never-executes", "share-derived-only"], // capped, anchored patterns, contacts nothing, runs nothing; Share results (2026-10-27): a link only when pressed, both boxes with every Master-Key, Resumption PSK and command-line password replaced
  shareSafetyDefault: "caution", // s_client output carries Master-Key / Resumption PSK secrets and internal names

  // -- Teaching & provenance --
  learnLinks: [
    "learn/reading-openssl-s-client-output", // the article written with the tool
    "learn/certificate-chains-order-anchors-and-what-breaks-them", // what error 20 and 21 are about
    "learn/certificate-validation", // what verification checks
    "learn/tls12-tls13-dtls-quic", // why TLS 1.3 output differs
  ],
  // Every source was downloaded with curl and read on its access_date (corpus kept with the build notes).
  sources: [
    { id: "s_client-3.5", label: "OpenSSL 3.5 manual, openssl-s_client(1): every option, the SNI default since 1.1.1, -showcerts (not a verified chain), -verify and -verify_return_error, the starttls keywords, the note on non-interactive use, HISTORY", url: "https://docs.openssl.org/3.5/man1/openssl-s_client/", access_date: "2026-10-27" }, // the basis
    { id: "openssl-source-3.5.9", label: "OpenSSL Library, downloads: openssl-3.5.9, the 3.5 [LTS] release of 29 September 2026, with its SHA-256 and PGP signature; the build that made the golden-vector runs (hash and signature checked)", url: "https://openssl-library.org/source/", access_date: "2026-10-27" }, // the runs' build
    { id: "openssl-releases", label: "OpenSSL Library, release strategy: version 3.5 is supported until 2030-04-08 (LTS), 3.6 until 2026-11-01, 4.0 until 2027-05-14; 3.0 is no longer supported", url: "https://openssl-library.org/policies/releasestrat/", access_date: "2026-10-27" }, // why 3.5
    { id: "openssl-downloads", label: "OpenSSL Library, downloads: 3.5.9 (released 29 Sep 2026, end of life 08 Apr 2030) is the current 3.5 [LTS] release; versions not listed are out of support", url: "https://openssl-library.org/source/", access_date: "2026-10-27" }, // the 3.5 release read
    { id: "s_client-3.6", label: "OpenSSL 3.6 manual, openssl-s_client(1): -ocsp_check_leaf and -ocsp_check_all, added in OpenSSL 3.6 (kept and marked: 3.5 has neither)", url: "https://docs.openssl.org/3.6/man1/openssl-s_client/", access_date: "2026-10-27" }, // what 3.6 added
    { id: "s_client-3.0", label: "OpenSSL 3.0 manual, openssl-s_client(1): the release whose output layout is still read (Server Temp Key, spaced names)", url: "https://docs.openssl.org/3.0/man1/openssl-s_client/", access_date: "2026-10-27" }, // the older layout
    { id: "s_client-4.1", label: "OpenSSL 4.1 manual, openssl-s_client(1): what changed after 3.x (-engine removed in 4.0, -ssl3 no longer listed, -quiet implies -verify_quiet, ECH options)", url: "https://docs.openssl.org/4.1/man1/openssl-s_client/", access_date: "2026-10-27" }, // 4.x deltas
    { id: "openssl-verify-3.5", label: "OpenSSL 3.5 manual, openssl-verify(1), DIAGNOSTICS: the error number and depth, and where the list of codes lives", url: "https://docs.openssl.org/3.5/man1/openssl-verify/", access_date: "2026-10-27" }, // the verify page
    { id: "x509-store-ctx-get-error-3.5", label: "OpenSSL 3.5 manual, X509_STORE_CTX_get_error(3), ERROR CODES: every verification code with its message and description (3.6 adds five OCSP codes, kept and marked)", url: "https://docs.openssl.org/3.5/man3/X509_STORE_CTX_get_error/", access_date: "2026-10-27" }, // the code list
    { id: "verification-options-3.5", label: "OpenSSL 3.5 manual, openssl-verification-options(1): trusted certificate options (-CAfile, -CApath, -CAstore, no default trust anchors shipped), verification options (-verify_hostname, -verify_ip, -attime, -partial_chain, -x509_strict, -purpose, -auth_level)", url: "https://docs.openssl.org/3.5/man1/openssl-verification-options/", access_date: "2026-10-27" }, // verification options
    { id: "ssl-conf-cmd-3.5", label: "OpenSSL 3.5 manual, SSL_CONF_cmd(3), SUPPORTED COMMAND LINE COMMANDS: -cipher, -ciphersuites, -groups and -curves (X25519MLKEM768 first in the default list from 3.5), -sigalgs, -no_ticket, -min_protocol, -max_protocol, the deprecated -no_* options, middlebox compatibility", url: "https://docs.openssl.org/3.5/man3/SSL_CONF_cmd/", access_date: "2026-10-27" }, // SSL_CONF options
    { id: "ssl-ctx-set1-curves-3.5", label: "OpenSSL 3.5 manual, SSL_CTX_set1_groups_list(3): the key shares a client sends (* prefix, at most four) and the DEFAULT list, which predicts X25519MLKEM768", url: "https://docs.openssl.org/3.5/man3/SSL_CTX_set1_curves/", access_date: "2026-10-27" }, // groups and key shares
    { id: "openssl-3.5", label: "OpenSSL 3.5 manual, openssl(1), TLS Version Options: one version only, not combined with -no_*; by default the client offers its lowest to highest version", url: "https://docs.openssl.org/3.5/man1/openssl/", access_date: "2026-10-27" }, // version options
    { id: "ssl-ctx-set-verify-3.5", label: "OpenSSL 3.5 manual, SSL_CTX_set_verify(3): in client mode with SSL_VERIFY_NONE the certificate is still checked and the handshake continues regardless", url: "https://docs.openssl.org/3.5/man3/SSL_CTX_set_verify/", access_date: "2026-10-27" }, // verify modes
    { id: "ssl-cipher-get-name-3.5", label: "OpenSSL 3.5 manual, SSL_CIPHER_get_name(3): SSL_CIPHER_get_version returns the version that first defined the cipher", url: "https://docs.openssl.org/3.5/man3/SSL_CIPHER_get_name/", access_date: "2026-10-27" }, // the cipher-line trap
    { id: "ssl-get-peer-signature-nid-3.5", label: "OpenSSL 3.5 manual, SSL_get_peer_signature_nid(3): SSL_get0_peer_signature_name returns the IANA name of the peer's signature scheme (added in 3.5)", url: "https://docs.openssl.org/3.5/man3/SSL_get_peer_signature_nid/", access_date: "2026-10-27" }, // signature scheme names
    { id: "security-level-3.5", label: "OpenSSL 3.5 manual, SSL_CTX_set_security_level(3): levels 0 to 5; SSLv3, TLS 1.0 and 1.1 disabled from level 1", url: "https://docs.openssl.org/3.5/man3/SSL_CTX_set_security_level/", access_date: "2026-10-27" }, // @SECLEVEL
    { id: "err-print-errors-3.5", label: "OpenSSL 3.5 manual, ERR_print_errors(3): the format of an error-queue line", url: "https://docs.openssl.org/3.5/man3/ERR_print_errors/", access_date: "2026-10-27" }, // error lines
    { id: "passphrase-options-3.5", label: "OpenSSL 3.5 manual, openssl-passphrase-options(1): pass:password is visible to ps", url: "https://docs.openssl.org/3.5/man1/openssl-passphrase-options/", access_date: "2026-10-27" }, // passwords
    { id: "bio-parse-hostserv-3.5", label: "OpenSSL 3.5 manual, BIO_parse_hostserv(3): a host with no port leaves the service untouched (so s_client keeps 4433)", url: "https://docs.openssl.org/3.5/man3/BIO_parse_hostserv/", access_date: "2026-10-27" }, // the port rule
    { id: "openssl-ciphers-3.5", label: "OpenSSL 3.5 manual, openssl-ciphers(1), CIPHER SUITE NAMES: standard and OpenSSL names; names without an authentication part use RSA", url: "https://docs.openssl.org/3.5/man1/openssl-ciphers/", access_date: "2026-10-27" }, // cipher names
    { id: "openssl-src-3.5.9", label: "OpenSSL source at tag openssl-3.5.9: apps/s_client.c (print_stuff, print_cert_key_info, ocsp_resp_cb, new_session_cb, option table), apps/lib/s_cb.c (verify_callback, ssl_print_sigalgs, ssl_print_tmp_key, ssl_print_secure_renegotiation_notes, print_ssl_summary), apps/lib/s_socket.c (init_client), apps/lib/apps.c (get_nameopt), apps/lib/opt.c, ssl/ssl_txt.c, ssl/t1_lib.c, include/openssl/x509_vfy.h.in, crypto/x509/x509_txt.c", url: "https://github.com/openssl/openssl/blob/openssl-3.5.9/apps/s_client.c", access_date: "2026-10-27" }, // the output layout
    { id: "openssl-src-3.6.5", label: "OpenSSL source at tag openssl-3.6.5: the same files, for the lines only 3.6 prints (OCSP responses: wording, -ocsp_check_* messages, codes 96 to 101)", url: "https://github.com/openssl/openssl/blob/openssl-3.6.5/apps/s_client.c", access_date: "2026-10-27" }, // kept 3.6 lines
    { id: "openssl-src-3.0.13", label: "OpenSSL source at tag openssl-3.0.13: the same files, for the lines only 3.0 prints (Server Temp Key, spaced names, rsaEncryption key names)", url: "https://github.com/openssl/openssl/blob/openssl-3.0.13/apps/s_client.c", access_date: "2026-10-27" }, // kept 3.0 lines
    { id: "rfc9846", label: "RFC 9846, The Transport Layer Security (TLS) Protocol Version 1.3 (July 2026; obsoletes RFC 8446 and RFC 5246): 4.5.1 certificate list order, 4.7.1 tickets and the resumption PSK, Appendix E extended main secret", url: "https://www.rfc-editor.org/rfc/rfc9846", access_date: "2026-10-27" }, // TLS 1.3
    { id: "rfc6066", label: "RFC 6066, TLS Extensions: section 3 (server_name: no IP literals) and section 8 (status_request)", url: "https://www.rfc-editor.org/rfc/rfc6066", access_date: "2026-10-27" }, // SNI and stapling
    { id: "rfc7301", label: "RFC 7301, TLS Application-Layer Protocol Negotiation Extension", url: "https://www.rfc-editor.org/rfc/rfc7301", access_date: "2026-10-27" }, // ALPN
    { id: "rfc8996", label: "RFC 8996, Deprecating TLS 1.0 and TLS 1.1", url: "https://www.rfc-editor.org/rfc/rfc8996", access_date: "2026-10-27" }, // old versions
    { id: "rfc9325", label: "RFC 9325 (BCP 195), Recommendations for Secure Use of TLS and DTLS: 3.5 renegotiation_info and extended_master_secret, 4.1 and 4.2 cipher suites", url: "https://www.rfc-editor.org/rfc/rfc9325", access_date: "2026-10-27" }, // recommendations
    { id: "rfc5246", label: "RFC 5246, TLS 1.2: section 8.1, the 48-byte master secret, and section 6.3, the keys derived from it", url: "https://www.rfc-editor.org/rfc/rfc5246", access_date: "2026-10-27" }, // master secret
    { id: "rfc5746", label: "RFC 5746, TLS Renegotiation Indication Extension", url: "https://www.rfc-editor.org/rfc/rfc5746", access_date: "2026-10-27" }, // renegotiation
    { id: "rfc9155", label: "RFC 9155, Deprecating MD5 and SHA-1 Signature Hashes in TLS 1.2 and DTLS 1.2", url: "https://www.rfc-editor.org/rfc/rfc9155", access_date: "2026-10-27" }, // SHA-1 signatures
    { id: "rfc6960", label: "RFC 6960, Online Certificate Status Protocol (OCSP): section 2.2, good, revoked and unknown", url: "https://www.rfc-editor.org/rfc/rfc6960", access_date: "2026-10-27" }, // OCSP states
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }, // the author
  ],
});

/**
 * run - the registry-facing entry point.
 * @param input an `openssl s_client` command line, what it printed, or the command on its first line followed by the output
 * @returns the command and output explanations and the findings
 */
export function run(input: string): SClientExplanation {
  return runEngine(input); // split and explain
}

// Vectors, exposed by the conventional names the golden-vector runner and the API docs read.
export const goldenVectors = OUTPUT_VECTORS; // the real-capture vectors
export const commandVectors = COMMAND_VECTORS; // the command vectors
