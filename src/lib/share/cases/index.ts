// ============================================================================
// src/lib/share/cases/index.ts
// ----------------------------------------------------------------------------
// Every tool's share cases, run by the central harness (share-vectors.ts).
// A rollout helper adds two lines per tool (the import and the list entry);
// keep both lists in alphabetical order of the slug, so parallel waves merge.
// ============================================================================

import type { ShareCaseRunner } from "./define"; // the runner shape
import { ACME_DNS01_SHARE_CASES } from "./acme-dns01"; // acme-dns01 (2026-10-27, wave 1B)
import { AS3_SHARE_CASES } from "./as3-explainer-validator"; // as3-explainer-validator (2026-10-27, wave 2C)
import { ASCII_TABLE_SHARE_CASES } from "./ascii-table"; // ascii-table (2026-10-27, wave 1B)
import { BASE64_SHARE_CASES } from "./base64"; // base64 (2026-10-27, wave 1B)
import { BFD_TIMERS_SHARE_CASES } from "./bfd-timers"; // bfd-timers (2026-10-27, wave 1A)
import { GSLB_SIM_SHARE_CASES } from "./bigip-dns-gslb-simulator"; // bigip-dns-gslb-simulator (2026-10-27, wave 2C)
import { LTM_LB_SHARE_CASES } from "./bigip-ltm-lb-simulator"; // bigip-ltm-lb-simulator (2026-10-27, wave 2C)
import { BIGIP_SCRIPTED_MONITOR_SHARE_CASES } from "./bigip-scripted-monitor-explainer"; // bigip-scripted-monitor-explainer (2026-10-27, wave 2B)
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
import { DO_SHARE_CASES } from "./do-explainer-validator"; // do-explainer-validator (2026-10-27, wave 2C)
import { AFM_RULE_CONTEXT_SHARE_CASES } from "./f5-afm-rule-context"; // f5-afm-rule-context (2026-10-27, wave 2C)
import { APM_SESSION_VARIABLE_SHARE_CASES } from "./f5-apm-session-variable-reference"; // f5-apm-session-variable-reference (2026-10-27, wave 2C)
import { APM_SSO_SHARE_CASES } from "./f5-apm-sso-explainer"; // f5-apm-sso-explainer (2026-10-27, wave 2C)
import { F5_BIGD_SHARE_CASES } from "./f5-bigd-thread-calculator"; // f5-bigd-thread-calculator (2026-10-27, wave 2B)
import { F5_INDEX_BASE_SHARE_CASES } from "./f5-bigip-index-base-finder"; // f5-bigip-index-base-finder (2026-10-27, wave 2B)
import { F5_BIGIP_LICENSE_SHARE_CASES } from "./f5-bigip-license-explainer"; // f5-bigip-license-explainer (2026-10-27, wave 2B)
import { F5_TCPDUMP_SHARE_CASES } from "./f5-bigip-tcpdump-builder"; // f5-bigip-tcpdump-builder (2026-10-27, wave 2B)
import { F5_CIPHER_STRING_SHARE_CASES } from "./f5-cipher-string-expander"; // f5-cipher-string-expander (2026-10-27, wave 1B)
import { DOS_VECTOR_SHARE_CASES } from "./f5-dos-vector-explainer"; // f5-dos-vector-explainer (2026-10-27, wave 2C)
import { F5_ETH_TRAILER_SHARE_CASES } from "./f5-eth-trailer-decoder"; // f5-eth-trailer-decoder (2026-10-27, wave 2B)
import { GSLB_DECISION_FLOW_SHARE_CASES } from "./f5-gslb-decision-flow"; // f5-gslb-decision-flow (2026-10-27, wave 2C)
import { IRULES_COMMAND_CONTEXT_SHARE_CASES } from "./f5-irules-command-context"; // f5-irules-command-context (2026-10-27, wave 2A)
import { IRULES_CONDITIONAL_BUILDER_SHARE_CASES } from "./f5-irules-conditional-builder"; // f5-irules-conditional-builder (2026-10-27, wave 2A)
import { IRULES_EVENT_ORDER_SHARE_CASES } from "./f5-irules-event-order"; // f5-irules-event-order (2026-10-27, wave 2A)
import { IRULES_EXPRESSION_LAB_SHARE_CASES } from "./f5-irules-expression-lab"; // f5-irules-expression-lab (2026-10-27, wave 2A)
import { IRULES_NUMBER_NOTATION_SHARE_CASES } from "./f5-irules-number-notation"; // f5-irules-number-notation (2026-10-27, wave 2A)
import { IRULES_PERFORMANCE_LINTER_SHARE_CASES } from "./f5-irules-performance-linter"; // f5-irules-performance-linter (2026-10-27, wave 2A)
import { IRULES_RUNTIME_CALCULATOR_SHARE_CASES } from "./f5-irules-runtime-calculator"; // f5-irules-runtime-calculator (2026-10-27, wave 2A)
import { IRULES_SCAN_EXPLAINER_SHARE_CASES } from "./f5-irules-scan-explainer"; // f5-irules-scan-explainer (2026-10-27, wave 2A)
import { IRULES_SCRIPT_STEPPER_SHARE_CASES } from "./f5-irules-script-stepper"; // f5-irules-script-stepper (2026-10-27, wave 2A)
import { IRULES_STRING_EXTRACT_SHARE_CASES } from "./f5-irules-string-extract"; // f5-irules-string-extract (2026-10-27, wave 2A)
import { IRULES_STRING_WORKBENCH_SHARE_CASES } from "./f5-irules-string-workbench"; // f5-irules-string-workbench (2026-10-27, wave 2A)
import { IRULES_STYLE_CHECKER_SHARE_CASES } from "./f5-irules-style-checker"; // f5-irules-style-checker (2026-10-27, wave 2A)
import { IRULES_VS_LTM_POLICY_SHARE_CASES } from "./f5-irules-vs-ltm-policy"; // f5-irules-vs-ltm-policy (2026-10-27, wave 2A)
import { F5_L4_PROFILE_SHARE_CASES } from "./f5-l4-profile-explainer"; // f5-l4-profile-explainer (2026-10-27, wave 2B)
import { F5_LB_METHOD_SHARE_CASES } from "./f5-lb-method-chooser"; // f5-lb-method-chooser (2026-10-27, wave 2B)
import { F5_ONECONNECT_SHARE_CASES } from "./f5-oneconnect-source-mask"; // f5-oneconnect-source-mask (2026-10-27, wave 2B)
import { F5_PACKET_FILTER_SHARE_CASES } from "./f5-packet-filter-explainer"; // f5-packet-filter-explainer (2026-10-27, wave 2B)
import { F5_PERSISTENCE_SHARE_CASES } from "./f5-persistence-method-explainer"; // f5-persistence-method-explainer (2026-10-27, wave 2B)
import { F5_RELEASE_CADENCE_SHARE_CASES } from "./f5-release-cadence-calendar"; // f5-release-cadence-calendar (2026-10-27, wave 2B)
import { F5_SERVICE_CHECK_SHARE_CASES } from "./f5-service-check-date"; // f5-service-check-date (2026-10-27, wave 2B)
import { F5_SSL_PROFILE_SHARE_CASES } from "./f5-ssl-profile-explainer"; // f5-ssl-profile-explainer (2026-10-27, wave 1B)
import { F5_TMSH_CONFIG_SHARE_CASES } from "./f5-tmsh-config-explainer"; // f5-tmsh-config-explainer (2026-10-27, wave 2B)
import { TOPOLOGY_LONGEST_MATCH_SHARE_CASES } from "./f5-topology-longest-match"; // f5-topology-longest-match (2026-10-27, wave 2C)
import { F5OS_PATH_SHARE_CASES } from "./f5os-restconf-path-explainer"; // f5os-restconf-path-explainer (2026-10-27, wave 2C)
import { F5OS_TENANT_SHARE_CASES } from "./f5os-tenant-config-explainer"; // f5os-tenant-config-explainer (2026-10-27, wave 2C)
import { ICONTROL_PATH_SHARE_CASES } from "./icontrol-rest-path-explainer"; // icontrol-rest-path-explainer (2026-10-27, wave 2B)
import { ICONTROL_STATS_SHARE_CASES } from "./icontrol-rest-stats-decoder"; // icontrol-rest-stats-decoder (2026-10-27, wave 2B)
import { IPV6_SHARE_CASES } from "./ipv6"; // ipv6 (2026-10-27, wave 1A)
import { IQUERY_SHARE_CASES } from "./iquery-protocol-explainer"; // iquery-protocol-explainer (2026-10-27, wave 2C)
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
import { TS_SHARE_CASES } from "./telemetry-streaming-explainer"; // telemetry-streaming-explainer (2026-10-27, wave 2C)
import { TEXT_ENCRYPTION_SHARE_CASES } from "./text-encryption"; // text-encryption (2026-10-27)
import { UNICODE_INSPECTOR_SHARE_CASES } from "./unicode-inspector"; // unicode-inspector (2026-10-27, wave 1B)
import { VOSS_EXOS_TRANSLATOR_SHARE_CASES } from "./voss-exos-translator"; // voss-exos-translator (2026-10-27, wave 1A)
import { VOSS_FABRIC_ID_SHARE_CASES } from "./voss-fabric-id"; // voss-fabric-id (2026-10-27, wave 1A)
import { X509_SHARE_CASES } from "./x509"; // x509 (2026-10-27, wave 1B)

/** The tools whose share specs the harness checks, alphabetical by slug. */
export const SHARE_CASE_SETS: readonly ShareCaseRunner[] = [
  ACME_DNS01_SHARE_CASES, // acme-dns01
  AS3_SHARE_CASES, // as3-explainer-validator
  ASCII_TABLE_SHARE_CASES, // ascii-table
  BASE64_SHARE_CASES, // base64
  BFD_TIMERS_SHARE_CASES, // bfd-timers
  GSLB_SIM_SHARE_CASES, // bigip-dns-gslb-simulator
  LTM_LB_SHARE_CASES, // bigip-ltm-lb-simulator
  BIGIP_SCRIPTED_MONITOR_SHARE_CASES, // bigip-scripted-monitor-explainer
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
  DO_SHARE_CASES, // do-explainer-validator
  AFM_RULE_CONTEXT_SHARE_CASES, // f5-afm-rule-context
  APM_SESSION_VARIABLE_SHARE_CASES, // f5-apm-session-variable-reference
  APM_SSO_SHARE_CASES, // f5-apm-sso-explainer
  F5_BIGD_SHARE_CASES, // f5-bigd-thread-calculator
  F5_INDEX_BASE_SHARE_CASES, // f5-bigip-index-base-finder
  F5_BIGIP_LICENSE_SHARE_CASES, // f5-bigip-license-explainer
  F5_TCPDUMP_SHARE_CASES, // f5-bigip-tcpdump-builder
  F5_CIPHER_STRING_SHARE_CASES, // f5-cipher-string-expander
  DOS_VECTOR_SHARE_CASES, // f5-dos-vector-explainer
  F5_ETH_TRAILER_SHARE_CASES, // f5-eth-trailer-decoder
  GSLB_DECISION_FLOW_SHARE_CASES, // f5-gslb-decision-flow
  IRULES_COMMAND_CONTEXT_SHARE_CASES, // f5-irules-command-context
  IRULES_CONDITIONAL_BUILDER_SHARE_CASES, // f5-irules-conditional-builder
  IRULES_EVENT_ORDER_SHARE_CASES, // f5-irules-event-order
  IRULES_EXPRESSION_LAB_SHARE_CASES, // f5-irules-expression-lab
  IRULES_NUMBER_NOTATION_SHARE_CASES, // f5-irules-number-notation
  IRULES_PERFORMANCE_LINTER_SHARE_CASES, // f5-irules-performance-linter
  IRULES_RUNTIME_CALCULATOR_SHARE_CASES, // f5-irules-runtime-calculator
  IRULES_SCAN_EXPLAINER_SHARE_CASES, // f5-irules-scan-explainer
  IRULES_SCRIPT_STEPPER_SHARE_CASES, // f5-irules-script-stepper
  IRULES_STRING_EXTRACT_SHARE_CASES, // f5-irules-string-extract
  IRULES_STRING_WORKBENCH_SHARE_CASES, // f5-irules-string-workbench
  IRULES_STYLE_CHECKER_SHARE_CASES, // f5-irules-style-checker
  IRULES_VS_LTM_POLICY_SHARE_CASES, // f5-irules-vs-ltm-policy
  F5_L4_PROFILE_SHARE_CASES, // f5-l4-profile-explainer
  F5_LB_METHOD_SHARE_CASES, // f5-lb-method-chooser
  F5_ONECONNECT_SHARE_CASES, // f5-oneconnect-source-mask
  F5_PACKET_FILTER_SHARE_CASES, // f5-packet-filter-explainer
  F5_PERSISTENCE_SHARE_CASES, // f5-persistence-method-explainer
  F5_RELEASE_CADENCE_SHARE_CASES, // f5-release-cadence-calendar
  F5_SERVICE_CHECK_SHARE_CASES, // f5-service-check-date
  F5_SSL_PROFILE_SHARE_CASES, // f5-ssl-profile-explainer
  F5_TMSH_CONFIG_SHARE_CASES, // f5-tmsh-config-explainer
  TOPOLOGY_LONGEST_MATCH_SHARE_CASES, // f5-topology-longest-match
  F5OS_PATH_SHARE_CASES, // f5os-restconf-path-explainer
  F5OS_TENANT_SHARE_CASES, // f5os-tenant-config-explainer
  ICONTROL_PATH_SHARE_CASES, // icontrol-rest-path-explainer
  ICONTROL_STATS_SHARE_CASES, // icontrol-rest-stats-decoder
  IPV6_SHARE_CASES, // ipv6
  IQUERY_SHARE_CASES, // iquery-protocol-explainer
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
  TS_SHARE_CASES, // telemetry-streaming-explainer
  TEXT_ENCRYPTION_SHARE_CASES, // text-encryption
  UNICODE_INSPECTOR_SHARE_CASES, // unicode-inspector
  VOSS_EXOS_TRANSLATOR_SHARE_CASES, // voss-exos-translator
  VOSS_FABRIC_ID_SHARE_CASES, // voss-fabric-id
  X509_SHARE_CASES, // x509
];
