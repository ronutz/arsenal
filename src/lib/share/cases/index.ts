// ============================================================================
// src/lib/share/cases/index.ts
// ----------------------------------------------------------------------------
// Every tool's share cases, run by the central harness (share-vectors.ts).
// A rollout helper adds two lines per tool (the import and the list entry);
// keep both lists in alphabetical order of the slug, so parallel waves merge.
// ============================================================================

import type { ShareCaseRunner } from "./define"; // the runner shape
import { ACME_DNS01_SHARE_CASES } from "./acme-dns01"; // acme-dns01 (2026-10-27, wave 1B)
import { ASCII_TABLE_SHARE_CASES } from "./ascii-table"; // ascii-table (2026-10-27, wave 1B)
import { BASE64_SHARE_CASES } from "./base64"; // base64 (2026-10-27, wave 1B)
import { BFD_TIMERS_SHARE_CASES } from "./bfd-timers"; // bfd-timers (2026-10-27, wave 1A)
import { BITS_BYTES_SHARE_CASES } from "./bits-bytes"; // bits-bytes (2026-10-27, wave 1B)
import { CERT_CHAIN_BUILDER_SHARE_CASES } from "./cert-chain-builder"; // cert-chain-builder (2026-10-27, wave 1B)
import { CERT_RENEWAL_PLANNER_SHARE_CASES } from "./cert-renewal-planner"; // cert-renewal-planner (2026-10-27, wave 1B)
import { CGN_SHARE_CASES } from "./cgn-port-blocks"; // cgn-port-blocks (2026-10-27, wave 1A)
import { CHARSET_EQUIVALENCY_SHARE_CASES } from "./charset-equivalency"; // charset-equivalency (2026-10-27, wave 1B)
import { CIDR_SHARE_CASES } from "./cidr"; // cidr (2026-10-27, wave 1A)
import { CIPHER_SHARE_CASES } from "./cipher"; // cipher (2026-10-27, wave 1B)
import { CODE_TO_IMAGE_SHARE_CASES } from "./code-to-image"; // code-to-image (2026-10-27)
import { CSR_DECODER_SHARE_CASES } from "./csr-decoder"; // csr-decoder (2026-10-27, wave 1B)
import { DHCP_OPTION_43_SHARE_CASES } from "./dhcp-option-43"; // dhcp-option-43 (2026-10-27, wave 1A)
import { DIG_COMMAND_BUILDER_SHARE_CASES } from "./dig-command-builder"; // dig-command-builder (2026-10-27, wave 1A)
import { DIG_OUTPUT_SHARE_CASES } from "./dig-output-explainer"; // dig-output-explainer (2026-10-27, wave 1A)
import { F5_CIPHER_STRING_SHARE_CASES } from "./f5-cipher-string-expander"; // f5-cipher-string-expander (2026-10-27, wave 1B)
import { F5_SSL_PROFILE_SHARE_CASES } from "./f5-ssl-profile-explainer"; // f5-ssl-profile-explainer (2026-10-27, wave 1B)
import { IPV6_SHARE_CASES } from "./ipv6"; // ipv6 (2026-10-27, wave 1A)
import { JA4_FINGERPRINT_SHARE_CASES } from "./ja4-fingerprint-decoder"; // ja4-fingerprint-decoder (2026-10-27, wave 1A)
import { LETSENCRYPT_RATE_LIMITS_SHARE_CASES } from "./letsencrypt-rate-limits"; // letsencrypt-rate-limits (2026-10-27, wave 1B)
import { MTU_MSS_SHARE_CASES } from "./mtu-mss"; // mtu-mss (2026-10-27, wave 1B)
import { NSLOOKUP_OUTPUT_SHARE_CASES } from "./nslookup-output-explainer"; // nslookup-output-explainer (2026-10-27, wave 1A)
import { OPENSSL_S_CLIENT_SHARE_CASES } from "./openssl-s-client-explainer"; // openssl-s-client-explainer (2026-10-27, wave 1B)
import { OUI_LOOKUP_SHARE_CASES } from "./oui-lookup"; // oui-lookup (2026-10-27, wave 1A)
import { PANOS_POLICY_SHARE_CASES } from "./panos-policy-evaluation-order"; // panos-policy-evaluation-order (2026-10-27, wave 1A)
import { PUBLIC_SUFFIX_SHARE_CASES } from "./public-suffix"; // public-suffix (2026-10-27, wave 1A)
import { PYTHON_TRACEBACK_SHARE_CASES } from "./python-traceback-explainer"; // python-traceback-explainer (2026-10-27)
import { ROUTING_TABLE_SHARE_CASES } from "./routing-table-explainer"; // routing-table-explainer (2026-10-27, wave 1A)
import { RPKI_SHARE_CASES } from "./rpki-origin-validation"; // rpki-origin-validation (2026-10-27, wave 1A)
import { SYSLOG_MESSAGE_SHARE_CASES } from "./syslog-message-parser"; // syslog-message-parser (2026-10-27, wave 1A)
import { SYSLOG_PRI_SHARE_CASES } from "./syslog-pri-decoder"; // syslog-pri-decoder (2026-10-27, wave 1A)
import { TEXT_ENCRYPTION_SHARE_CASES } from "./text-encryption"; // text-encryption (2026-10-27)
import { UNICODE_INSPECTOR_SHARE_CASES } from "./unicode-inspector"; // unicode-inspector (2026-10-27, wave 1B)
import { VOSS_EXOS_TRANSLATOR_SHARE_CASES } from "./voss-exos-translator"; // voss-exos-translator (2026-10-27, wave 1A)
import { VOSS_FABRIC_ID_SHARE_CASES } from "./voss-fabric-id"; // voss-fabric-id (2026-10-27, wave 1A)
import { X509_SHARE_CASES } from "./x509"; // x509 (2026-10-27, wave 1B)

/** The tools whose share specs the harness checks, alphabetical by slug. */
export const SHARE_CASE_SETS: readonly ShareCaseRunner[] = [
  ACME_DNS01_SHARE_CASES, // acme-dns01
  ASCII_TABLE_SHARE_CASES, // ascii-table
  BASE64_SHARE_CASES, // base64
  BFD_TIMERS_SHARE_CASES, // bfd-timers
  BITS_BYTES_SHARE_CASES, // bits-bytes
  CERT_CHAIN_BUILDER_SHARE_CASES, // cert-chain-builder
  CERT_RENEWAL_PLANNER_SHARE_CASES, // cert-renewal-planner
  CGN_SHARE_CASES, // cgn-port-blocks
  CHARSET_EQUIVALENCY_SHARE_CASES, // charset-equivalency
  CIDR_SHARE_CASES, // cidr
  CIPHER_SHARE_CASES, // cipher
  CODE_TO_IMAGE_SHARE_CASES, // code-to-image
  CSR_DECODER_SHARE_CASES, // csr-decoder
  DHCP_OPTION_43_SHARE_CASES, // dhcp-option-43
  DIG_COMMAND_BUILDER_SHARE_CASES, // dig-command-builder
  DIG_OUTPUT_SHARE_CASES, // dig-output-explainer
  F5_CIPHER_STRING_SHARE_CASES, // f5-cipher-string-expander
  F5_SSL_PROFILE_SHARE_CASES, // f5-ssl-profile-explainer
  IPV6_SHARE_CASES, // ipv6
  JA4_FINGERPRINT_SHARE_CASES, // ja4-fingerprint-decoder
  LETSENCRYPT_RATE_LIMITS_SHARE_CASES, // letsencrypt-rate-limits
  MTU_MSS_SHARE_CASES, // mtu-mss
  NSLOOKUP_OUTPUT_SHARE_CASES, // nslookup-output-explainer
  OPENSSL_S_CLIENT_SHARE_CASES, // openssl-s-client-explainer
  OUI_LOOKUP_SHARE_CASES, // oui-lookup
  PANOS_POLICY_SHARE_CASES, // panos-policy-evaluation-order
  PUBLIC_SUFFIX_SHARE_CASES, // public-suffix
  PYTHON_TRACEBACK_SHARE_CASES, // python-traceback-explainer
  ROUTING_TABLE_SHARE_CASES, // routing-table-explainer
  RPKI_SHARE_CASES, // rpki-origin-validation
  SYSLOG_MESSAGE_SHARE_CASES, // syslog-message-parser
  SYSLOG_PRI_SHARE_CASES, // syslog-pri-decoder
  TEXT_ENCRYPTION_SHARE_CASES, // text-encryption
  UNICODE_INSPECTOR_SHARE_CASES, // unicode-inspector
  VOSS_EXOS_TRANSLATOR_SHARE_CASES, // voss-exos-translator
  VOSS_FABRIC_ID_SHARE_CASES, // voss-fabric-id
  X509_SHARE_CASES, // x509
];
