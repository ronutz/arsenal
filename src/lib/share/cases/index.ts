// ============================================================================
// src/lib/share/cases/index.ts
// ----------------------------------------------------------------------------
// Every tool's share cases, run by the central harness (share-vectors.ts).
// A rollout helper adds two lines per tool (the import and the list entry);
// keep both lists in alphabetical order of the slug, so parallel waves merge.
// ============================================================================

import type { ShareCaseRunner } from "./define"; // the runner shape
import { ACL_FIRST_MATCH_SHARE_CASES } from "./acl-first-match-evaluator"; // acl-first-match-evaluator (2026-11-02, new tool)
import { ACME_DNS01_SHARE_CASES } from "./acme-dns01"; // acme-dns01 (2026-10-27, wave 1B)
import { AS3_SHARE_CASES } from "./as3-explainer-validator"; // as3-explainer-validator (2026-10-27, wave 2C)
import { ASCII_TABLE_SHARE_CASES } from "./ascii-table"; // ascii-table (2026-10-27, wave 1B)
import { BASE64_SHARE_CASES } from "./base64"; // base64 (2026-10-27, wave 1B)
import { BFD_TIMERS_SHARE_CASES } from "./bfd-timers"; // bfd-timers (2026-10-27, wave 1A)
import { GSLB_SIM_SHARE_CASES } from "./bigip-dns-gslb-simulator"; // bigip-dns-gslb-simulator (2026-10-27, wave 2C)
import { LTM_LB_SHARE_CASES } from "./bigip-ltm-lb-simulator"; // bigip-ltm-lb-simulator (2026-10-27, wave 2C)
import { BIGIP_SCRIPTED_MONITOR_SHARE_CASES } from "./bigip-scripted-monitor-explainer"; // bigip-scripted-monitor-explainer (2026-10-27, wave 2B)
import { BITS_BYTES_SHARE_CASES } from "./bits-bytes"; // bits-bytes (2026-10-27, wave 1B)
import { CABLE_SHARE_CASES } from "./cable-run-planner"; // cable-run-planner (2026-11-01, wave 4C)
import { CERT_CHAIN_BUILDER_SHARE_CASES } from "./cert-chain-builder"; // cert-chain-builder (2026-10-27, wave 1B)
import { CERT_RENEWAL_PLANNER_SHARE_CASES } from "./cert-renewal-planner"; // cert-renewal-planner (2026-10-27, wave 1B)
import { CGN_SHARE_CASES } from "./cgn-port-blocks"; // cgn-port-blocks (2026-10-27, wave 1A)
import { BLAST_SHARE_CASES } from "./change-blast-radius-mapper"; // change-blast-radius-mapper (2026-11-01, wave 4C)
import { RUNBOOK_SHARE_CASES } from "./change-window-runbook-builder"; // change-window-runbook-builder (2026-11-01, wave 4C)
import { CHARSET_EQUIVALENCY_SHARE_CASES } from "./charset-equivalency"; // charset-equivalency (2026-10-27, wave 1B)
import { CHECKPOINT_NAT_PROXY_ARP_SHARE_CASES } from "./checkpoint-nat-proxy-arp"; // checkpoint-nat-proxy-arp (2026-11-01, wave 4A)
import { CHECKPOINT_POLICY_LAYER_EVALUATOR_SHARE_CASES } from "./checkpoint-policy-layer-evaluator"; // checkpoint-policy-layer-evaluator (2026-11-01, wave 4A)
import { CHMOD_PERMISSION_SHARE_CASES } from "./chmod-permission-calculator"; // chmod-permission-calculator (2026-11-01, wave 4D)
import { CIDR_SHARE_CASES } from "./cidr"; // cidr (2026-10-27, wave 1A)
import { CIPHER_SHARE_CASES } from "./cipher"; // cipher (2026-10-27, wave 1B)
import { CODE_TO_IMAGE_SHARE_CASES } from "./code-to-image"; // code-to-image (2026-10-27)
import { COLOR_CONTRAST_SHARE_CASES } from "./color-contrast-format"; // color-contrast-format (2026-11-01, wave 3B)
import { CRON_EXPRESSION_SHARE_CASES } from "./cron-expression-explainer"; // cron-expression-explainer (2026-11-01, wave 4D)
import { CSP_EVALUATOR_SHARE_CASES } from "./csp-evaluator"; // csp-evaluator (2026-11-01, wave 3A)
import { CSR_DECODER_SHARE_CASES } from "./csr-decoder"; // csr-decoder (2026-10-27, wave 1B)
import { CSS_SELECTOR_SHARE_CASES } from "./css-selector-tester"; // css-selector-tester (2026-11-01, wave 3B)
import { CSS_SPECIFICITY_SHARE_CASES } from "./css-specificity-calculator"; // css-specificity-calculator (2026-11-01, wave 3B)
import { CURL_BUILDER_SHARE_CASES } from "./curl-command-builder"; // curl-command-builder (2026-11-01, wave 3B)
import { CURL_EXPLAINER_SHARE_CASES } from "./curl-command-explainer"; // curl-command-explainer (2026-11-01, wave 3B)
import { CVSS_VECTOR_SHARE_CASES } from "./cvss-vector-decoder"; // cvss-vector-decoder (2026-11-01, wave 3A)
import { DHCP_OPTION_43_SHARE_CASES } from "./dhcp-option-43"; // dhcp-option-43 (2026-10-27, wave 1A)
import { DIFF_SHARE_CASES } from "./diff"; // diff (2026-11-01, wave 4D)
import { DIG_COMMAND_BUILDER_SHARE_CASES } from "./dig-command-builder"; // dig-command-builder (2026-10-27, wave 1A)
import { DIG_OUTPUT_SHARE_CASES } from "./dig-output-explainer"; // dig-output-explainer (2026-10-27, wave 1A)
import { TRACKER_SHARE_CASES } from "./digital-transformation-tracker"; // digital-transformation-tracker (2026-11-01, wave 4C)
import { DO_SHARE_CASES } from "./do-explainer-validator"; // do-explainer-validator (2026-10-27, wave 2C)
import { EPOCH_SHARE_CASES } from "./epoch"; // epoch (2026-11-01, wave 4D)
import { EXOS_REVEALED_SHARE_CASES } from "./exos-config-explainer-revealed"; // exos-config-explainer-revealed (2026-11-01, wave 4C)
import { EXOS_SHARE_CASES } from "./exos-config-explainer"; // exos-config-explainer (2026-11-01, wave 4C)
import { EXPECT_SCRIPT_BUILDER_SHARE_CASES } from "./expect-script-builder"; // expect-script-builder (2026-11-01, wave 4D)
import { EXPECT_SCRIPT_EXPLAINER_SHARE_CASES } from "./expect-script-explainer"; // expect-script-explainer (2026-11-01, wave 4D)
import { SPBM_MAC_SHARE_CASES } from "./extreme-spbm-multicast-mac"; // extreme-spbm-multicast-mac (2026-11-01, wave 4C)
import { OS_MAPPER_SHARE_CASES } from "./extreme-switch-os-mapper"; // extreme-switch-os-mapper (2026-11-01, wave 4C)
import { AFM_RULE_CONTEXT_SHARE_CASES } from "./f5-afm-rule-context"; // f5-afm-rule-context (2026-10-27, wave 2C)
import { APM_SESSION_VARIABLE_SHARE_CASES } from "./f5-apm-session-variable-reference"; // f5-apm-session-variable-reference (2026-10-27, wave 2C)
import { APM_SSO_SHARE_CASES } from "./f5-apm-sso-explainer"; // f5-apm-sso-explainer (2026-10-27, wave 2C)
import { F5_AWAF_POLICY_SHARE_CASES } from "./f5-awaf-declarative-policy-explainer"; // f5-awaf-declarative-policy-explainer (2026-11-01, wave 3A)
import { F5_AWAF_EVASION_SHARE_CASES } from "./f5-awaf-evasion-explainer"; // f5-awaf-evasion-explainer (2026-11-01, wave 3A)
import { F5_FP_TRIAGE_SHARE_CASES } from "./f5-awaf-false-positive-triage"; // f5-awaf-false-positive-triage (2026-11-01, wave 3A)
import { F5_POISONING_SHARE_CASES } from "./f5-awaf-learning-poisoning-estimator"; // f5-awaf-learning-poisoning-estimator (2026-11-01, wave 3A)
import { F5_SUGGESTION_SHARE_CASES } from "./f5-awaf-learning-suggestion-interpreter"; // f5-awaf-learning-suggestion-interpreter (2026-11-01, wave 3A)
import { F5_AWAF_POLICY_DIFF_SHARE_CASES } from "./f5-awaf-policy-diff"; // f5-awaf-policy-diff (2026-11-01, wave 3A)
import { F5_AWAF_REQUEST_LOG_SHARE_CASES } from "./f5-awaf-request-log-triage"; // f5-awaf-request-log-triage (2026-11-01, wave 3A)
import { F5_SIGNATURE_RISK_SHARE_CASES } from "./f5-awaf-signature-accuracy-risk"; // f5-awaf-signature-accuracy-risk (2026-11-01, wave 3A)
import { F5_BIGD_SHARE_CASES } from "./f5-bigd-thread-calculator"; // f5-bigd-thread-calculator (2026-10-27, wave 2B)
import { F5_INDEX_BASE_SHARE_CASES } from "./f5-bigip-index-base-finder"; // f5-bigip-index-base-finder (2026-10-27, wave 2B)
import { F5_BIGIP_LICENSE_SHARE_CASES } from "./f5-bigip-license-explainer"; // f5-bigip-license-explainer (2026-10-27, wave 2B)
import { F5_BIGIP_COOKIE_SHARE_CASES } from "./f5-bigip-persistence-cookie"; // f5-bigip-persistence-cookie (2026-11-01, wave 3A)
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
import { F5XC_API_PATH_SHARE_CASES } from "./f5xc-api-path-explainer"; // f5xc-api-path-explainer (2026-11-01, wave 4B)
import { F5XC_CE_EGRESS_SHARE_CASES } from "./f5xc-ce-egress-checklist"; // f5xc-ce-egress-checklist (2026-11-01, wave 4B)
import { F5XC_DOMAIN_SNI_SHARE_CASES } from "./f5xc-domain-sni-match-resolver"; // f5xc-domain-sni-match-resolver (2026-11-01, wave 4B)
import { F5XC_HTTP_LB_ROUTE_REVEALED_SHARE_CASES } from "./f5xc-http-lb-route-explainer-revealed"; // f5xc-http-lb-route-explainer-revealed (2026-11-01, wave 4B)
import { F5XC_HTTP_LB_ROUTE_SHARE_CASES } from "./f5xc-http-lb-route-explainer"; // f5xc-http-lb-route-explainer (2026-11-01, wave 4B)
import { F5XC_LB_ALGORITHM_SHARE_CASES } from "./f5xc-lb-algorithm-chooser"; // f5xc-lb-algorithm-chooser (2026-11-01, wave 4B)
import { F5XC_OBJECT_LINTER_REVEALED_SHARE_CASES } from "./f5xc-object-linter-revealed"; // f5xc-object-linter-revealed (2026-11-01, wave 4B)
import { F5XC_OBJECT_LINTER_SHARE_CASES } from "./f5xc-object-linter"; // f5xc-object-linter (2026-11-01, wave 4B)
import { F5XC_ORIGIN_POOL_SHARE_CASES } from "./f5xc-origin-pool-explainer"; // f5xc-origin-pool-explainer (2026-11-01, wave 4B)
import { F5XC_RATE_LIMIT_SHARE_CASES } from "./f5xc-rate-limit-calculator"; // f5xc-rate-limit-calculator (2026-11-01, wave 4B)
import { F5XC_SECURITY_EVENT_SHARE_CASES } from "./f5xc-security-event-explainer"; // f5xc-security-event-explainer (2026-11-01, wave 4B)
import { F5XC_SERVICE_POLICY_SHARE_CASES } from "./f5xc-service-policy-explainer"; // f5xc-service-policy-explainer (2026-11-01, wave 4B)
import { F5XC_TLS_MAPPER_SHARE_CASES } from "./f5xc-tls-security-level-mapper"; // f5xc-tls-security-level-mapper (2026-11-01, wave 4B)
import { SPB_SHARE_CASES } from "./fabric-connect-spb-explainer"; // fabric-connect-spb-explainer (2026-11-01, wave 4C)
import { FHB_SHARE_CASES } from "./fault-hypothesis-builder"; // fault-hypothesis-builder (2026-11-01, wave 4C)
import { FLOW_PATH_SHARE_CASES } from "./flow-path-reasoner"; // flow-path-reasoner (2026-11-01, wave 4C)
import { FORTIGATE_HA_FAILOVER_SIMULATOR_SHARE_CASES } from "./fortigate-ha-failover-simulator"; // fortigate-ha-failover-simulator (2026-11-01, wave 4A)
import { FORTIGATE_IPSEC_PHASE_MISMATCH_ANALYZER_SHARE_CASES } from "./fortigate-ipsec-phase-mismatch-analyzer"; // fortigate-ipsec-phase-mismatch-analyzer (2026-11-01, wave 4A)
import { FORTIGATE_POLICY_LOOKUP_EXPLAINER_SHARE_CASES } from "./fortigate-policy-lookup-explainer"; // fortigate-policy-lookup-explainer (2026-11-01, wave 4A)
import { FORTIGATE_POLICY_MATCH_ORDER_SHARE_CASES } from "./fortigate-policy-match-order"; // fortigate-policy-match-order (2026-11-01, wave 4A)
import { FORTIGATE_ROUTE_SELECTION_EXPLAINER_SHARE_CASES } from "./fortigate-route-selection-explainer"; // fortigate-route-selection-explainer (2026-11-01, wave 4A)
import { FORTIGATE_SECURITY_PROFILE_COVERAGE_CHECKER_SHARE_CASES } from "./fortigate-security-profile-coverage-checker"; // fortigate-security-profile-coverage-checker (2026-11-01, wave 4A)
import { FORTIGATE_SESSION_TABLE_EXPLAINER_SHARE_CASES } from "./fortigate-session-table-explainer"; // fortigate-session-table-explainer (2026-11-01, wave 4A)
import { FORTIOS_CLI_CONFIG_EXPLAINER_SHARE_CASES } from "./fortios-cli-config-explainer"; // fortios-cli-config-explainer (2026-11-01, wave 4A)
import { FORTIOS_CONFIG_DIFF_EXPLAINER_SHARE_CASES } from "./fortios-config-diff-explainer"; // fortios-config-diff-explainer (2026-11-01, wave 4A)
import { FORTIOS_FLOW_DEBUG_BUILDER_SHARE_CASES } from "./fortios-flow-debug-builder"; // fortios-flow-debug-builder (2026-11-01, wave 4A)
import { FORTIOS_SNIFFER_BUILDER_SHARE_CASES } from "./fortios-sniffer-builder"; // fortios-sniffer-builder (2026-11-01, wave 4A)
import { GREEK_SHARE_CASES } from "./greek-alphabet"; // greek-alphabet (2026-11-01, wave 4D)
import { HASH_PREIMAGE_FINDER_SHARE_CASES } from "./hash-preimage-finder"; // hash-preimage-finder (2026-11-01, wave 3C)
import { HASH_SHARE_CASES } from "./hash"; // hash (2026-11-01, wave 3C)
import { HEALTH_SNAPSHOT_SHARE_CASES } from "./health-snapshot-comparator"; // health-snapshot-comparator (2026-11-01, wave 4C)
import { HMAC_SHARE_CASES } from "./hmac"; // hmac (2026-11-01, wave 3C)
import { HTML_STRUCTURE_SHARE_CASES } from "./html-structure-explainer"; // html-structure-explainer (2026-11-01, wave 3B)
import { HEADER_ORDER_SHARE_CASES } from "./http-header-order-fingerprint"; // http-header-order-fingerprint (2026-11-01, wave 4C)
import { MESSAGE_DECODER_SHARE_CASES } from "./http-message-decoder"; // http-message-decoder (2026-11-01, wave 3B)
import { HTTP_METHODS_SHARE_CASES } from "./http-methods-comparison"; // http-methods-comparison (2026-11-01, wave 3B)
import { REQUEST_TRANSLATOR_SHARE_CASES } from "./http-request-translator"; // http-request-translator (2026-11-01, wave 3B)
import { HTTP_STATUS_SHARE_CASES } from "./http-status-code-explainer"; // http-status-code-explainer (2026-11-01, wave 3B)
import { ICONTROL_PATH_SHARE_CASES } from "./icontrol-rest-path-explainer"; // icontrol-rest-path-explainer (2026-10-27, wave 2B)
import { ICONTROL_STATS_SHARE_CASES } from "./icontrol-rest-stats-decoder"; // icontrol-rest-stats-decoder (2026-10-27, wave 2B)
import { RCA_SHARE_CASES } from "./incident-timeline-rca-builder"; // incident-timeline-rca-builder (2026-11-01, wave 4C)
import { IPV6_SHARE_CASES } from "./ipv6"; // ipv6 (2026-10-27, wave 1A)
import { IQUERY_SHARE_CASES } from "./iquery-protocol-explainer"; // iquery-protocol-explainer (2026-10-27, wave 2C)
import { JA3_SHARE_CASES } from "./ja3-tls-fingerprint"; // ja3-tls-fingerprint (2026-11-01, wave 4C)
import { JA4_FINGERPRINT_SHARE_CASES } from "./ja4-fingerprint-decoder"; // ja4-fingerprint-decoder (2026-10-27, wave 1A)
import { JSON_FORMATTER_SHARE_CASES } from "./json-formatter"; // json-formatter (2026-11-01, wave 4D)
import { JSON_YAML_CONVERT_SHARE_CASES } from "./json-yaml-convert"; // json-yaml-convert (2026-11-01, wave 4D)
import { JWKS_EXPLAINER_SHARE_CASES } from "./jwks-explainer"; // jwks-explainer (2026-11-01, wave 3C)
import { JWT_SHARE_CASES } from "./jwt"; // jwt (2026-11-01, wave 3C)
import { LDAP_FILTER_EXPLAINER_SHARE_CASES } from "./ldap-filter-explainer"; // ldap-filter-explainer (2026-11-01, wave 3C)
import { LETSENCRYPT_RATE_LIMITS_SHARE_CASES } from "./letsencrypt-rate-limits"; // letsencrypt-rate-limits (2026-10-27, wave 1B)
import { LOG_LEVEL_SHARE_CASES } from "./log-level-mapper"; // log-level-mapper (2026-11-01, wave 4C)
import { META_OG_JSONLD_SHARE_CASES } from "./meta-og-jsonld-inspector"; // meta-og-jsonld-inspector (2026-11-01, wave 3B)
import { MTU_MSS_SHARE_CASES } from "./mtu-mss"; // mtu-mss (2026-10-27, wave 1B)
import { NETSKOPE_DLP_SHARE_CASES } from "./netskope-dlp-match-predictor"; // netskope-dlp-match-predictor (2026-11-01, wave 4B)
import { NETSKOPE_STEERING_DECISION_SHARE_CASES } from "./netskope-steering-decision-explainer"; // netskope-steering-decision-explainer (2026-11-01, wave 4B)
import { NETSKOPE_STEERING_METHOD_SHARE_CASES } from "./netskope-steering-explainer"; // netskope-steering-explainer (2026-11-01, wave 4B)
import { NETWORK_OS_SHARE_CASES } from "./network-os-comparer"; // network-os-comparer (2026-11-01, wave 4C)
import { NGINX_LOCATION_SHARE_CASES } from "./nginx-location-matcher"; // nginx-location-matcher (2026-11-01, wave 4B)
import { NGINX_PROXY_CACHE_REVEALED_SHARE_CASES } from "./nginx-proxy-cache-decision-revealed"; // nginx-proxy-cache-decision-revealed (2026-11-01, wave 4B)
import { NGINX_PROXY_CACHE_SHARE_CASES } from "./nginx-proxy-cache-decision"; // nginx-proxy-cache-decision (2026-11-01, wave 4B)
import { NGINX_PROXY_PASS_SHARE_CASES } from "./nginx-proxy-pass-rewriter"; // nginx-proxy-pass-rewriter (2026-11-01, wave 4B)
import { NSLOOKUP_OUTPUT_SHARE_CASES } from "./nslookup-output-explainer"; // nslookup-output-explainer (2026-10-27, wave 1A)
import { OAUTH_FLOW_CHOOSER_SHARE_CASES } from "./oauth-flow-chooser"; // oauth-flow-chooser (2026-11-01, wave 3C)
import { OIDC_SHARE_CASES } from "./oidc"; // oidc (2026-11-01, wave 3C)
import { OPENSSL_S_CLIENT_SHARE_CASES } from "./openssl-s-client-explainer"; // openssl-s-client-explainer (2026-10-27, wave 1B)
import { OUI_LOOKUP_SHARE_CASES } from "./oui-lookup"; // oui-lookup (2026-10-27, wave 1A)
import { P0F_SHARE_CASES } from "./p0f-signature-explainer"; // p0f-signature-explainer (2026-11-01, wave 4C)
import { PAC_FILE_SHARE_CASES } from "./pac-file-explainer"; // pac-file-explainer (2026-11-01, wave 4B)
import { CAPTURE_PLAN_SHARE_CASES } from "./packet-capture-plan-builder"; // packet-capture-plan-builder (2026-11-01, wave 4C)
import { PANOS_POLICY_SHARE_CASES } from "./panos-policy-evaluation-order"; // panos-policy-evaluation-order (2026-10-27, wave 1A)
import { PINGFEDERATE_OGNL_EXPLAINER_SHARE_CASES } from "./pingfederate-ognl-explainer"; // pingfederate-ognl-explainer (2026-11-01, wave 3C)
import { PKCE_SHARE_CASES } from "./pkce"; // pkce (2026-11-01, wave 3C)
import { PUBLIC_SUFFIX_SHARE_CASES } from "./public-suffix"; // public-suffix (2026-10-27, wave 1A)
import { PYPROJECT_TOML_SHARE_CASES } from "./pyproject-toml-explainer"; // pyproject-toml-explainer (2026-11-01, wave 4D)
import { PYTHON_PLAYGROUND_SHARE_CASES } from "./python-playground"; // python-playground (2026-11-01, wave 4D)
import { PYTHON_TRACEBACK_SHARE_CASES } from "./python-traceback-explainer"; // python-traceback-explainer (2026-10-27)
import { REGEX_SHARE_CASES } from "./regex"; // regex (2026-11-01, wave 4D)
import { ROMAN_SHARE_CASES } from "./roman-numerals"; // roman-numerals (2026-11-01, wave 4D)
import { ROUTING_TABLE_SHARE_CASES } from "./routing-table-explainer"; // routing-table-explainer (2026-10-27, wave 1A)
import { RPKI_SHARE_CASES } from "./rpki-origin-validation"; // rpki-origin-validation (2026-10-27, wave 1A)
import { SAML_DECODER_SHARE_CASES } from "./saml-decoder"; // saml-decoder (2026-11-01, wave 3A)
import { SECURE_HEADERS_REVEALED_SHARE_CASES } from "./secure-headers-revealed"; // secure-headers-revealed (2026-11-01, reveal switch)
import { SECURE_HEADERS_SHARE_CASES } from "./secure-headers"; // secure-headers (2026-11-01, wave 3A)
import { SNMP_COUNTER_WRAP_CALCULATOR_SHARE_CASES } from "./snmp-counter-wrap-calculator"; // snmp-counter-wrap-calculator (2026-11-02, new tool)
import { SORTING_ALGORITHM_SHARE_CASES } from "./sorting-algorithm-stepper"; // sorting-algorithm-stepper (2026-11-01, wave 4D)
import { SSE_ARCHITECTURE_SHARE_CASES } from "./sse-architecture-explainer"; // sse-architecture-explainer (2026-11-01, wave 4B)
import { SSRF_URL_SHARE_CASES } from "./ssrf-url-classifier"; // ssrf-url-classifier (2026-11-01, wave 3A)
import { SYSLOG_MESSAGE_SHARE_CASES } from "./syslog-message-parser"; // syslog-message-parser (2026-10-27, wave 1A)
import { SYSLOG_PRI_SHARE_CASES } from "./syslog-pri-decoder"; // syslog-pri-decoder (2026-10-27, wave 1A)
import { TAC_PACKET_SHARE_CASES } from "./tac-escalation-packet-builder"; // tac-escalation-packet-builder (2026-11-01, wave 4C)
import { TCPDUMP_SHARE_CASES } from "./tcpdump-filter-explainer"; // tcpdump-filter-explainer (2026-11-01, wave 4C)
import { TS_SHARE_CASES } from "./telemetry-streaming-explainer"; // telemetry-streaming-explainer (2026-10-27, wave 2C)
import { TERMINAL_SHARE_CASES } from "./terminal-stack-explainer"; // terminal-stack-explainer (2026-11-01, wave 4C)
import { TEXT_ENCRYPTION_SHARE_CASES } from "./text-encryption"; // text-encryption (2026-10-27)
import { TIME_CALCULATOR_SHARE_CASES } from "./time-calculator"; // time-calculator (2026-11-01, wave 4D)
import { TIMEZONE_MEETING_PLANNER_SHARE_CASES } from "./timezone-meeting-planner"; // timezone-meeting-planner (2026-11-01, wave 4D)
import { TOTP_HOTP_SHARE_CASES } from "./totp-hotp"; // totp-hotp (2026-11-01, wave 3C)
import { UNICODE_INSPECTOR_SHARE_CASES } from "./unicode-inspector"; // unicode-inspector (2026-10-27, wave 1B)
import { URL_INSPECTOR_SHARE_CASES } from "./url-inspector"; // url-inspector (2026-11-01, wave 3B)
import { UA_SHARE_CASES } from "./user-agent-entropy-analyzer"; // user-agent-entropy-analyzer (2026-11-01, wave 4C)
import { UUID_SHARE_CASES } from "./uuid"; // uuid (2026-11-01, wave 4D)
import { VOSS_EXOS_TRANSLATOR_SHARE_CASES } from "./voss-exos-translator"; // voss-exos-translator (2026-10-27, wave 1A)
import { VOSS_FABRIC_ID_SHARE_CASES } from "./voss-fabric-id"; // voss-fabric-id (2026-10-27, wave 1A)
import { VRRP_TIMER_CALCULATOR_SHARE_CASES } from "./vrrp-timer-calculator"; // vrrp-timer-calculator (2026-11-02, new tool)
import { MULTICAST_MAC_MAPPER_SHARE_CASES } from "./multicast-mac-mapper"; // multicast-mac-mapper (2026-11-02, new tool)
import { WHEEL_FILENAME_SHARE_CASES } from "./wheel-filename-explainer"; // wheel-filename-explainer (2026-11-01, wave 4D)
import { X509_SHARE_CASES } from "./x509"; // x509 (2026-10-27, wave 1B)
import { XML_DECODER_SHARE_CASES } from "./xml-decoder"; // xml-decoder (2026-11-01, wave 3A)
import { XML_FORMATTER_SHARE_CASES } from "./xml-formatter"; // xml-formatter (2026-11-01, wave 4D)
import { ZCC_FORWARDING_DECISION_EXPLAINER_SHARE_CASES } from "./zcc-forwarding-decision-explainer"; // zcc-forwarding-decision-explainer (2026-11-01, wave 4A)
import { ZDX_SCORE_FACTOR_EXPLAINER_SHARE_CASES } from "./zdx-score-factor-explainer"; // zdx-score-factor-explainer (2026-11-01, wave 4A)
import { ZSCALER_FIREWALL_RULE_ORDER_SIMULATOR_SHARE_CASES } from "./zscaler-firewall-rule-order-simulator"; // zscaler-firewall-rule-order-simulator (2026-11-01, wave 4A)
import { ZSCALER_SSL_BYPASS_PLANNER_SHARE_CASES } from "./zscaler-ssl-bypass-planner"; // zscaler-ssl-bypass-planner (2026-11-01, wave 4A)
import { ZSCALER_TUNNEL_CHOOSER_SHARE_CASES } from "./zscaler-tunnel-chooser"; // zscaler-tunnel-chooser (2026-11-01, wave 4A)

/** The tools whose share specs the harness checks, alphabetical by slug. */
export const SHARE_CASE_SETS: readonly ShareCaseRunner[] = [
  ACL_FIRST_MATCH_SHARE_CASES, // acl-first-match-evaluator
  ACME_DNS01_SHARE_CASES, // acme-dns01
  AS3_SHARE_CASES, // as3-explainer-validator
  ASCII_TABLE_SHARE_CASES, // ascii-table
  BASE64_SHARE_CASES, // base64
  BFD_TIMERS_SHARE_CASES, // bfd-timers
  GSLB_SIM_SHARE_CASES, // bigip-dns-gslb-simulator
  LTM_LB_SHARE_CASES, // bigip-ltm-lb-simulator
  BIGIP_SCRIPTED_MONITOR_SHARE_CASES, // bigip-scripted-monitor-explainer
  BITS_BYTES_SHARE_CASES, // bits-bytes
  CABLE_SHARE_CASES, // cable-run-planner
  CERT_CHAIN_BUILDER_SHARE_CASES, // cert-chain-builder
  CERT_RENEWAL_PLANNER_SHARE_CASES, // cert-renewal-planner
  CGN_SHARE_CASES, // cgn-port-blocks
  BLAST_SHARE_CASES, // change-blast-radius-mapper
  RUNBOOK_SHARE_CASES, // change-window-runbook-builder
  CHARSET_EQUIVALENCY_SHARE_CASES, // charset-equivalency
  CHECKPOINT_NAT_PROXY_ARP_SHARE_CASES, // checkpoint-nat-proxy-arp
  CHECKPOINT_POLICY_LAYER_EVALUATOR_SHARE_CASES, // checkpoint-policy-layer-evaluator
  CHMOD_PERMISSION_SHARE_CASES, // chmod-permission-calculator
  CIDR_SHARE_CASES, // cidr
  CIPHER_SHARE_CASES, // cipher
  CODE_TO_IMAGE_SHARE_CASES, // code-to-image
  COLOR_CONTRAST_SHARE_CASES, // color-contrast-format
  CRON_EXPRESSION_SHARE_CASES, // cron-expression-explainer
  CSP_EVALUATOR_SHARE_CASES, // csp-evaluator
  CSR_DECODER_SHARE_CASES, // csr-decoder
  CSS_SELECTOR_SHARE_CASES, // css-selector-tester
  CSS_SPECIFICITY_SHARE_CASES, // css-specificity-calculator
  CURL_BUILDER_SHARE_CASES, // curl-command-builder
  CURL_EXPLAINER_SHARE_CASES, // curl-command-explainer
  CVSS_VECTOR_SHARE_CASES, // cvss-vector-decoder
  DHCP_OPTION_43_SHARE_CASES, // dhcp-option-43
  DIFF_SHARE_CASES, // diff
  DIG_COMMAND_BUILDER_SHARE_CASES, // dig-command-builder
  DIG_OUTPUT_SHARE_CASES, // dig-output-explainer
  TRACKER_SHARE_CASES, // digital-transformation-tracker
  DO_SHARE_CASES, // do-explainer-validator
  EPOCH_SHARE_CASES, // epoch
  EXOS_REVEALED_SHARE_CASES, // exos-config-explainer-revealed
  EXOS_SHARE_CASES, // exos-config-explainer
  EXPECT_SCRIPT_BUILDER_SHARE_CASES, // expect-script-builder
  EXPECT_SCRIPT_EXPLAINER_SHARE_CASES, // expect-script-explainer
  SPBM_MAC_SHARE_CASES, // extreme-spbm-multicast-mac
  OS_MAPPER_SHARE_CASES, // extreme-switch-os-mapper
  AFM_RULE_CONTEXT_SHARE_CASES, // f5-afm-rule-context
  APM_SESSION_VARIABLE_SHARE_CASES, // f5-apm-session-variable-reference
  APM_SSO_SHARE_CASES, // f5-apm-sso-explainer
  F5_AWAF_POLICY_SHARE_CASES, // f5-awaf-declarative-policy-explainer
  F5_AWAF_EVASION_SHARE_CASES, // f5-awaf-evasion-explainer
  F5_FP_TRIAGE_SHARE_CASES, // f5-awaf-false-positive-triage
  F5_POISONING_SHARE_CASES, // f5-awaf-learning-poisoning-estimator
  F5_SUGGESTION_SHARE_CASES, // f5-awaf-learning-suggestion-interpreter
  F5_AWAF_POLICY_DIFF_SHARE_CASES, // f5-awaf-policy-diff
  F5_AWAF_REQUEST_LOG_SHARE_CASES, // f5-awaf-request-log-triage
  F5_SIGNATURE_RISK_SHARE_CASES, // f5-awaf-signature-accuracy-risk
  F5_BIGD_SHARE_CASES, // f5-bigd-thread-calculator
  F5_INDEX_BASE_SHARE_CASES, // f5-bigip-index-base-finder
  F5_BIGIP_LICENSE_SHARE_CASES, // f5-bigip-license-explainer
  F5_BIGIP_COOKIE_SHARE_CASES, // f5-bigip-persistence-cookie
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
  F5XC_API_PATH_SHARE_CASES, // f5xc-api-path-explainer
  F5XC_CE_EGRESS_SHARE_CASES, // f5xc-ce-egress-checklist
  F5XC_DOMAIN_SNI_SHARE_CASES, // f5xc-domain-sni-match-resolver
  F5XC_HTTP_LB_ROUTE_REVEALED_SHARE_CASES, // f5xc-http-lb-route-explainer-revealed
  F5XC_HTTP_LB_ROUTE_SHARE_CASES, // f5xc-http-lb-route-explainer
  F5XC_LB_ALGORITHM_SHARE_CASES, // f5xc-lb-algorithm-chooser
  F5XC_OBJECT_LINTER_REVEALED_SHARE_CASES, // f5xc-object-linter-revealed
  F5XC_OBJECT_LINTER_SHARE_CASES, // f5xc-object-linter
  F5XC_ORIGIN_POOL_SHARE_CASES, // f5xc-origin-pool-explainer
  F5XC_RATE_LIMIT_SHARE_CASES, // f5xc-rate-limit-calculator
  F5XC_SECURITY_EVENT_SHARE_CASES, // f5xc-security-event-explainer
  F5XC_SERVICE_POLICY_SHARE_CASES, // f5xc-service-policy-explainer
  F5XC_TLS_MAPPER_SHARE_CASES, // f5xc-tls-security-level-mapper
  SPB_SHARE_CASES, // fabric-connect-spb-explainer
  FHB_SHARE_CASES, // fault-hypothesis-builder
  FLOW_PATH_SHARE_CASES, // flow-path-reasoner
  FORTIGATE_HA_FAILOVER_SIMULATOR_SHARE_CASES, // fortigate-ha-failover-simulator
  FORTIGATE_IPSEC_PHASE_MISMATCH_ANALYZER_SHARE_CASES, // fortigate-ipsec-phase-mismatch-analyzer
  FORTIGATE_POLICY_LOOKUP_EXPLAINER_SHARE_CASES, // fortigate-policy-lookup-explainer
  FORTIGATE_POLICY_MATCH_ORDER_SHARE_CASES, // fortigate-policy-match-order
  FORTIGATE_ROUTE_SELECTION_EXPLAINER_SHARE_CASES, // fortigate-route-selection-explainer
  FORTIGATE_SECURITY_PROFILE_COVERAGE_CHECKER_SHARE_CASES, // fortigate-security-profile-coverage-checker
  FORTIGATE_SESSION_TABLE_EXPLAINER_SHARE_CASES, // fortigate-session-table-explainer
  FORTIOS_CLI_CONFIG_EXPLAINER_SHARE_CASES, // fortios-cli-config-explainer
  FORTIOS_CONFIG_DIFF_EXPLAINER_SHARE_CASES, // fortios-config-diff-explainer
  FORTIOS_FLOW_DEBUG_BUILDER_SHARE_CASES, // fortios-flow-debug-builder
  FORTIOS_SNIFFER_BUILDER_SHARE_CASES, // fortios-sniffer-builder
  GREEK_SHARE_CASES, // greek-alphabet
  HASH_PREIMAGE_FINDER_SHARE_CASES, // hash-preimage-finder
  HASH_SHARE_CASES, // hash
  HEALTH_SNAPSHOT_SHARE_CASES, // health-snapshot-comparator
  HMAC_SHARE_CASES, // hmac
  HTML_STRUCTURE_SHARE_CASES, // html-structure-explainer
  HEADER_ORDER_SHARE_CASES, // http-header-order-fingerprint
  MESSAGE_DECODER_SHARE_CASES, // http-message-decoder
  HTTP_METHODS_SHARE_CASES, // http-methods-comparison
  REQUEST_TRANSLATOR_SHARE_CASES, // http-request-translator
  HTTP_STATUS_SHARE_CASES, // http-status-code-explainer
  ICONTROL_PATH_SHARE_CASES, // icontrol-rest-path-explainer
  ICONTROL_STATS_SHARE_CASES, // icontrol-rest-stats-decoder
  RCA_SHARE_CASES, // incident-timeline-rca-builder
  IPV6_SHARE_CASES, // ipv6
  IQUERY_SHARE_CASES, // iquery-protocol-explainer
  JA3_SHARE_CASES, // ja3-tls-fingerprint
  JA4_FINGERPRINT_SHARE_CASES, // ja4-fingerprint-decoder
  JSON_FORMATTER_SHARE_CASES, // json-formatter
  JSON_YAML_CONVERT_SHARE_CASES, // json-yaml-convert
  JWKS_EXPLAINER_SHARE_CASES, // jwks-explainer
  JWT_SHARE_CASES, // jwt
  LDAP_FILTER_EXPLAINER_SHARE_CASES, // ldap-filter-explainer
  LETSENCRYPT_RATE_LIMITS_SHARE_CASES, // letsencrypt-rate-limits
  LOG_LEVEL_SHARE_CASES, // log-level-mapper
  META_OG_JSONLD_SHARE_CASES, // meta-og-jsonld-inspector
  MTU_MSS_SHARE_CASES, // mtu-mss
  NETSKOPE_DLP_SHARE_CASES, // netskope-dlp-match-predictor
  NETSKOPE_STEERING_DECISION_SHARE_CASES, // netskope-steering-decision-explainer
  NETSKOPE_STEERING_METHOD_SHARE_CASES, // netskope-steering-explainer
  NETWORK_OS_SHARE_CASES, // network-os-comparer
  NGINX_LOCATION_SHARE_CASES, // nginx-location-matcher
  NGINX_PROXY_CACHE_REVEALED_SHARE_CASES, // nginx-proxy-cache-decision-revealed
  NGINX_PROXY_CACHE_SHARE_CASES, // nginx-proxy-cache-decision
  NGINX_PROXY_PASS_SHARE_CASES, // nginx-proxy-pass-rewriter
  NSLOOKUP_OUTPUT_SHARE_CASES, // nslookup-output-explainer
  OAUTH_FLOW_CHOOSER_SHARE_CASES, // oauth-flow-chooser
  OIDC_SHARE_CASES, // oidc
  OPENSSL_S_CLIENT_SHARE_CASES, // openssl-s-client-explainer
  OUI_LOOKUP_SHARE_CASES, // oui-lookup
  P0F_SHARE_CASES, // p0f-signature-explainer
  PAC_FILE_SHARE_CASES, // pac-file-explainer
  CAPTURE_PLAN_SHARE_CASES, // packet-capture-plan-builder
  PANOS_POLICY_SHARE_CASES, // panos-policy-evaluation-order
  PINGFEDERATE_OGNL_EXPLAINER_SHARE_CASES, // pingfederate-ognl-explainer
  PKCE_SHARE_CASES, // pkce
  PUBLIC_SUFFIX_SHARE_CASES, // public-suffix
  PYPROJECT_TOML_SHARE_CASES, // pyproject-toml-explainer
  PYTHON_PLAYGROUND_SHARE_CASES, // python-playground
  PYTHON_TRACEBACK_SHARE_CASES, // python-traceback-explainer
  REGEX_SHARE_CASES, // regex
  ROMAN_SHARE_CASES, // roman-numerals
  ROUTING_TABLE_SHARE_CASES, // routing-table-explainer
  RPKI_SHARE_CASES, // rpki-origin-validation
  SAML_DECODER_SHARE_CASES, // saml-decoder
  SECURE_HEADERS_REVEALED_SHARE_CASES, // secure-headers-revealed
  SECURE_HEADERS_SHARE_CASES, // secure-headers
  SNMP_COUNTER_WRAP_CALCULATOR_SHARE_CASES, // snmp-counter-wrap-calculator
  SORTING_ALGORITHM_SHARE_CASES, // sorting-algorithm-stepper
  SSE_ARCHITECTURE_SHARE_CASES, // sse-architecture-explainer
  SSRF_URL_SHARE_CASES, // ssrf-url-classifier
  SYSLOG_MESSAGE_SHARE_CASES, // syslog-message-parser
  SYSLOG_PRI_SHARE_CASES, // syslog-pri-decoder
  TAC_PACKET_SHARE_CASES, // tac-escalation-packet-builder
  TCPDUMP_SHARE_CASES, // tcpdump-filter-explainer
  TS_SHARE_CASES, // telemetry-streaming-explainer
  TERMINAL_SHARE_CASES, // terminal-stack-explainer
  TEXT_ENCRYPTION_SHARE_CASES, // text-encryption
  TIME_CALCULATOR_SHARE_CASES, // time-calculator
  TIMEZONE_MEETING_PLANNER_SHARE_CASES, // timezone-meeting-planner
  TOTP_HOTP_SHARE_CASES, // totp-hotp
  UNICODE_INSPECTOR_SHARE_CASES, // unicode-inspector
  URL_INSPECTOR_SHARE_CASES, // url-inspector
  UA_SHARE_CASES, // user-agent-entropy-analyzer
  UUID_SHARE_CASES, // uuid
  VOSS_EXOS_TRANSLATOR_SHARE_CASES, // voss-exos-translator
  VOSS_FABRIC_ID_SHARE_CASES, // voss-fabric-id
  VRRP_TIMER_CALCULATOR_SHARE_CASES, // vrrp-timer-calculator
  MULTICAST_MAC_MAPPER_SHARE_CASES, // multicast-mac-mapper
  WHEEL_FILENAME_SHARE_CASES, // wheel-filename-explainer
  X509_SHARE_CASES, // x509
  XML_DECODER_SHARE_CASES, // xml-decoder
  XML_FORMATTER_SHARE_CASES, // xml-formatter
  ZCC_FORWARDING_DECISION_EXPLAINER_SHARE_CASES, // zcc-forwarding-decision-explainer
  ZDX_SCORE_FACTOR_EXPLAINER_SHARE_CASES, // zdx-score-factor-explainer
  ZSCALER_FIREWALL_RULE_ORDER_SIMULATOR_SHARE_CASES, // zscaler-firewall-rule-order-simulator
  ZSCALER_SSL_BYPASS_PLANNER_SHARE_CASES, // zscaler-ssl-bypass-planner
  ZSCALER_TUNNEL_CHOOSER_SHARE_CASES, // zscaler-tunnel-chooser
];
