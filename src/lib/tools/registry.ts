// ============================================================================
// src/lib/tools/registry.ts
// ----------------------------------------------------------------------------
// THE API SURFACE - the single source of truth for which tools are exposed over
// the HTTP API, and how to run each one. Both the Cloudflare Worker (worker/
// index.ts, which routes /api/v1/<slug>) and the OpenAPI generator (scripts/
// build-openapi.mts) read this list, so the served endpoints and the documented
// endpoints can never drift from each other or from the toolbox.
//
// DISCIPLINE (D-72): every tool marked "built" in the catalogue MUST appear here.
// scripts/build-openapi.mts fails the build if a built tool is missing, so a new
// tool cannot ship without an API endpoint and a doc entry. Adding a tool =
// build its engine (with run()), then add one line below.
//
// Each entry normalizes the tool to (input: string) => result. Most tools take a
// plain string. The six structured-input tools (f5-bigip-tcpdump-builder, cert-
// renewal-planner, csr-decoder, diff, hmac, totp-hotp) accept a JSON object,
// passed to the API as a JSON string and parsed here; they are marked structured
// so the docs describe a JSON request body. cidr's engine is named cidrAnalyze.
// Async engines (hash, hmac, pkce, totp-hotp) return a Promise; the Worker awaits
// every run() unconditionally, so sync and async are handled identically.
//
// This module has no runtime dependency beyond the engines themselves, so it
// bundles cleanly into the Worker. Nothing in the browser app imports it, so it
// adds nothing to the client bundle.
// ============================================================================

import { run as base64Run } from "./base64";
import { run as bigipPersistenceCookieRun } from "./f5-bigip-persistence-cookie";
import { run as bigipTcpdumpBuilderRun } from "./f5-bigip-tcpdump-builder";
import { run as certRenewalPlannerRun } from "./cert-renewal-planner";
import { cidrAnalyze } from "./cidr/compute";
import { run as cipherRun } from "./cipher";
import { run as csrDecoderRun } from "./csr-decoder";
import { run as cvssVectorDecoderRun } from "./cvss-vector-decoder";
import { run as diffRun } from "./diff";
import { run as digOutputExplainerRun } from "./dig-output-explainer";
import { run as epochRun } from "./epoch";
import { run as romanNumeralsRun } from "./roman-numerals";
import { run as greekAlphabetRun } from "./greek-alphabet";
import { run as p0fSignatureExplainerRun } from "./p0f-signature-explainer";
import { run as userAgentEntropyAnalyzerRun } from "./user-agent-entropy-analyzer";
import { run as httpHeaderOrderFingerprintRun } from "./http-header-order-fingerprint";
import { run as timeCalculatorRun } from "./time-calculator";
import { run as timezoneMeetingPlannerRun } from "./timezone-meeting-planner";
import { run as f5CipherStringExpanderRun } from "./f5-cipher-string-expander";
import { run as f5SslProfileExplainerRun } from "./f5-ssl-profile-explainer";
import { run as f5xcServicePolicyExplainerRun } from "./f5xc-service-policy-explainer";
import { run as f5xcRateLimitCalculatorRun } from "./f5xc-rate-limit-calculator";
import { run as f5xcTlsSecurityLevelMapperRun } from "./f5xc-tls-security-level-mapper";
import { run as f5xcCeEgressChecklistRun } from "./f5xc-ce-egress-checklist";
import { run as f5xcHttpLbRouteExplainerRun } from "./f5xc-http-lb-route-explainer";
import { run as f5xcLbAlgorithmChooserRun } from "./f5xc-lb-algorithm-chooser";
import { run as f5xcOriginPoolExplainerRun } from "./f5xc-origin-pool-explainer";
import { run as f5xcDomainSniMatchResolverRun } from "./f5xc-domain-sni-match-resolver";
import { run as f5xcSecurityEventExplainerRun } from "./f5xc-security-event-explainer";
import { run as f5xcObjectLinterRun } from "./f5xc-object-linter";
import { run as f5xcApiPathExplainerRun } from "./f5xc-api-path-explainer";
import { run as bigipLtmLbSimulatorRun } from "./bigip-ltm-lb-simulator";
import { run as bigipDnsGslbSimulatorRun } from "./bigip-dns-gslb-simulator";
import { run as ja3TlsFingerprintRun } from "./ja3-tls-fingerprint";
import { run as f5ServiceCheckDateRun } from "./f5-service-check-date";
import { run as f5BigdThreadCalculatorRun } from "./f5-bigd-thread-calculator";
import { run as mtuMssRun } from "./mtu-mss";
import { run as httpMethodsComparisonRun } from "./http-methods-comparison";
import { runFromJson as faultHypothesisBuilderRun } from "./fault-hypothesis-builder";
import { runFromJson as changeWindowRunbookBuilderRun } from "./change-window-runbook-builder";
import { runFromJson as incidentTimelineRcaBuilderRun } from "./incident-timeline-rca-builder";
import { runFromJson as changeBlastRadiusMapperRun } from "./change-blast-radius-mapper";
import { runFromJson as tacEscalationPacketBuilderRun } from "./tac-escalation-packet-builder";
import { runFromJson as packetCapturePlanBuilderRun } from "./packet-capture-plan-builder";
import { runFromJson as flowPathReasonerRun } from "./flow-path-reasoner";
import { runFromJson as healthSnapshotComparatorRun } from "./health-snapshot-comparator";
import { run as f5BigipLicenseExplainerRun } from "./f5-bigip-license-explainer";
import { run as f5AwafDeclarativePolicyRun } from "./f5-awaf-declarative-policy-explainer";
import { run as f5AwafEvasionRun } from "./f5-awaf-evasion-explainer";
import { run as f5AwafPoisoningRun } from "./f5-awaf-learning-poisoning-estimator";
import { run as as3Run } from "./as3-explainer-validator";
import { run as iqueryRun } from "./iquery-protocol-explainer";
import { run as doRun } from "./do-explainer-validator";
import { run as tsRun } from "./telemetry-streaming-explainer";
import { run as fortiosSnifferRun } from "./fortios-sniffer-builder";
import { run as pacRun } from "./pac-file-explainer";
import { run as exosRun } from "./exos-config-explainer";
import { run as acmeDns01Run } from "./acme-dns01";
import { run as publicSuffixRun } from "./public-suffix";
import { run as letsEncryptRateLimitsRun } from "./letsencrypt-rate-limits";
import { run as f5IrulesRuntimeCalculatorRun } from "./f5-irules-runtime-calculator";
import { run as f5IrulesPerformanceLinterRun } from "./f5-irules-performance-linter";
import { run as f5ReleaseCadenceCalendarRun } from "./f5-release-cadence-calendar";
import { run as f5AwafFpRun } from "./f5-awaf-false-positive-triage";
import { run as f5AwafLogRun } from "./f5-awaf-request-log-triage";
import { run as f5AwafSuggRun } from "./f5-awaf-learning-suggestion-interpreter";
import { run as f5AwafSigRun } from "./f5-awaf-signature-accuracy-risk";
import { run as f5AwafDiffRun } from "./f5-awaf-policy-diff";
import { run as hashRun } from "./hash";
import { run as hmacRun } from "./hmac";
import { run as curlCommandBuilderRun } from "./curl-command-builder";
import { run as httpRequestTranslatorRun } from "./http-request-translator";
import { run as ipv6Run } from "./ipv6";
import { run as irulesEventOrderRun } from "./f5-irules-event-order";
import { run as jsonFormatterRun } from "./json-formatter";
import { run as jsonYamlConvertRun } from "./json-yaml-convert";
import { run as jwksExplainerRun } from "./jwks-explainer";
import { run as jwtRun } from "./jwt";
import { run as nslookupOutputExplainerRun } from "./nslookup-output-explainer";
import { run as oidcRun } from "./oidc";
import { run as persistenceMethodExplainerRun } from "./f5-persistence-method-explainer";
import { run as lbMethodChooserRun } from "./f5-lb-method-chooser";
import { run as gslbDecisionFlowRun } from "./f5-gslb-decision-flow";
import { run as topologyLongestMatchRun } from "./f5-topology-longest-match";
import { run as dosVectorExplainerRun } from "./f5-dos-vector-explainer";
import { run as irulesCommandContextRun } from "./f5-irules-command-context";
import { run as irulesVsLtmPolicyRun } from "./f5-irules-vs-ltm-policy";
import { run as oneconnectSourceMaskRun } from "./f5-oneconnect-source-mask";
import { run as afmRuleContextRun } from "./f5-afm-rule-context";
import { run as apmSsoExplainerRun } from "./f5-apm-sso-explainer";
import { run as l4ProfileExplainerRun } from "./f5-l4-profile-explainer";
import { run as apmSvarRun } from "./f5-apm-session-variable-reference";
import { run as packetFilterExplainerRun } from "./f5-packet-filter-explainer";
import { run as pkceRun } from "./pkce";
import { run as regexRun } from "./regex";
import { run as samlDecoderRun } from "./saml-decoder";
import { run as secureHeadersRun } from "./secure-headers";
import { run as ssrfUrlClassifierRun } from "./ssrf-url-classifier";
import { run as syslogPriDecoderRun } from "./syslog-pri-decoder";
import { run as ja4FingerprintDecoderRun } from "./ja4-fingerprint-decoder";
import { run as ouiLookupRun } from "./oui-lookup";
import { run as vossFabricIdRun } from "./voss-fabric-id";
import { run as vossExosTranslatorRun } from "./voss-exos-translator";
import { run as tmshConfigExplainerRun } from "./f5-tmsh-config-explainer";
import { run as totpHotpRun } from "./totp-hotp";
import { run as urlInspectorRun } from "./url-inspector";
import { run as uuidRun } from "./uuid";
import { run as x509Run } from "./x509";
import { run as xmlDecoderRun } from "./xml-decoder";

export interface ApiTool {
  /** Tool slug; the API path is /api/v1/<slug>. */
  slug: string;
  /** Normalized entry point: a string in, a JSON-serializable result out (or a Promise of one). */
  run: (input: string) => unknown | Promise<unknown>;
  /** True when the input is a JSON object (sent as a JSON string / request body). */
  structured?: boolean;
}

/** Every API-exposed tool. Kept in sync with the catalogue by the build (D-72). */
export const API_TOOLS: ApiTool[] = [
  { slug: "base64", run: base64Run },
  { slug: "f5-bigip-persistence-cookie", run: bigipPersistenceCookieRun },
  { slug: "f5-bigip-tcpdump-builder", structured: true, run: (input) => bigipTcpdumpBuilderRun(JSON.parse(input)) },
  { slug: "cert-renewal-planner", structured: true, run: (input) => certRenewalPlannerRun(JSON.parse(input)) },
  { slug: "cidr", run: (input) => cidrAnalyze(input) },
  { slug: "cipher", run: cipherRun },
  { slug: "csr-decoder", structured: true, run: (input) => csrDecoderRun(JSON.parse(input)) },
  { slug: "acme-dns01", structured: true, run: (input) => acmeDns01Run(JSON.parse(input)) },
  { slug: "public-suffix", structured: true, run: (input) => publicSuffixRun({ host: input }) },
  { slug: "letsencrypt-rate-limits", structured: true, run: (input) => letsEncryptRateLimitsRun({ names: input }) },
  { slug: "f5-irules-runtime-calculator", structured: true, run: (input) => f5IrulesRuntimeCalculatorRun(JSON.parse(input)) },
  { slug: "f5-bigd-thread-calculator", run: f5BigdThreadCalculatorRun },
  { slug: "mtu-mss", run: mtuMssRun },
  { slug: "http-methods-comparison", run: httpMethodsComparisonRun },
  { slug: "fault-hypothesis-builder", structured: true, run: faultHypothesisBuilderRun },
  { slug: "change-window-runbook-builder", structured: true, run: changeWindowRunbookBuilderRun },
  { slug: "incident-timeline-rca-builder", structured: true, run: incidentTimelineRcaBuilderRun },
  { slug: "change-blast-radius-mapper", structured: true, run: changeBlastRadiusMapperRun },
  { slug: "tac-escalation-packet-builder", structured: true, run: tacEscalationPacketBuilderRun },
  { slug: "packet-capture-plan-builder", structured: true, run: packetCapturePlanBuilderRun },
  { slug: "flow-path-reasoner", structured: true, run: flowPathReasonerRun },
  { slug: "health-snapshot-comparator", structured: true, run: healthSnapshotComparatorRun },
  { slug: "f5-irules-performance-linter", structured: true, run: (input) => f5IrulesPerformanceLinterRun(JSON.parse(input)) },
  { slug: "f5-release-cadence-calendar", structured: true, run: (input) => f5ReleaseCadenceCalendarRun(JSON.parse(input)) },
  { slug: "cvss-vector-decoder", run: cvssVectorDecoderRun },
  { slug: "diff", structured: true, run: (input) => diffRun(JSON.parse(input)) },
  { slug: "dig-output-explainer", run: digOutputExplainerRun },
  { slug: "epoch", run: epochRun },
  { slug: "roman-numerals", run: romanNumeralsRun },
  { slug: "greek-alphabet", run: greekAlphabetRun },
  { slug: "p0f-signature-explainer", run: p0fSignatureExplainerRun },
  { slug: "user-agent-entropy-analyzer", run: userAgentEntropyAnalyzerRun },
  { slug: "http-header-order-fingerprint", run: httpHeaderOrderFingerprintRun },
  { slug: "time-calculator", structured: true, run: (input) => timeCalculatorRun(JSON.parse(input)) },
  { slug: "timezone-meeting-planner", structured: true, run: (input) => timezoneMeetingPlannerRun(JSON.parse(input)) },
  { slug: "f5-cipher-string-expander", run: f5CipherStringExpanderRun },
  { slug: "f5-ssl-profile-explainer", run: f5SslProfileExplainerRun },
  { slug: "f5xc-service-policy-explainer", run: f5xcServicePolicyExplainerRun },
  { slug: "f5xc-rate-limit-calculator", run: f5xcRateLimitCalculatorRun },
  { slug: "f5xc-tls-security-level-mapper", run: f5xcTlsSecurityLevelMapperRun },
  { slug: "f5xc-ce-egress-checklist", run: f5xcCeEgressChecklistRun },
  { slug: "f5xc-http-lb-route-explainer", run: f5xcHttpLbRouteExplainerRun },
  { slug: "f5xc-lb-algorithm-chooser", run: f5xcLbAlgorithmChooserRun },
  { slug: "f5xc-origin-pool-explainer", run: f5xcOriginPoolExplainerRun },
  { slug: "f5xc-domain-sni-match-resolver", run: f5xcDomainSniMatchResolverRun },
  { slug: "f5xc-security-event-explainer", run: f5xcSecurityEventExplainerRun },
  { slug: "f5xc-object-linter", run: f5xcObjectLinterRun },
  { slug: "f5xc-api-path-explainer", run: f5xcApiPathExplainerRun },
  { slug: "bigip-ltm-lb-simulator", run: bigipLtmLbSimulatorRun },
  { slug: "bigip-dns-gslb-simulator", run: bigipDnsGslbSimulatorRun },
  { slug: "ja3-tls-fingerprint", run: ja3TlsFingerprintRun },
  { slug: "f5-service-check-date", run: f5ServiceCheckDateRun },
  { slug: "f5-bigip-license-explainer", run: f5BigipLicenseExplainerRun },
  { slug: "f5-awaf-declarative-policy-explainer", run: f5AwafDeclarativePolicyRun },
  { slug: "f5-awaf-evasion-explainer", run: f5AwafEvasionRun },
  { slug: "f5-awaf-learning-poisoning-estimator", structured: true, run: f5AwafPoisoningRun },
  { slug: "as3-explainer-validator", run: as3Run },
  { slug: "iquery-protocol-explainer", run: iqueryRun },
  { slug: "do-explainer-validator", run: doRun },
  { slug: "telemetry-streaming-explainer", run: tsRun },
  { slug: "fortios-sniffer-builder", run: fortiosSnifferRun },
  { slug: "pac-file-explainer", run: pacRun },
  { slug: "exos-config-explainer", run: exosRun },
  { slug: "f5-awaf-false-positive-triage", structured: true, run: f5AwafFpRun },
  { slug: "f5-awaf-request-log-triage", run: f5AwafLogRun },
  { slug: "f5-awaf-learning-suggestion-interpreter", structured: true, run: f5AwafSuggRun },
  { slug: "f5-awaf-signature-accuracy-risk", structured: true, run: f5AwafSigRun },
  { slug: "f5-awaf-policy-diff", structured: true, run: f5AwafDiffRun },
  { slug: "hash", run: hashRun },
  { slug: "curl-command-builder", structured: true, run: (input) => curlCommandBuilderRun(JSON.parse(input)) },
  { slug: "hmac", structured: true, run: (input) => hmacRun(JSON.parse(input)) },
  { slug: "http-request-translator", run: httpRequestTranslatorRun },
  { slug: "ipv6", run: ipv6Run },
  { slug: "f5-irules-event-order", run: irulesEventOrderRun },
  { slug: "json-formatter", run: jsonFormatterRun },
  { slug: "json-yaml-convert", run: jsonYamlConvertRun },
  { slug: "jwks-explainer", run: jwksExplainerRun },
  { slug: "jwt", run: jwtRun },
  { slug: "nslookup-output-explainer", run: nslookupOutputExplainerRun },
  { slug: "oidc", run: oidcRun },
  { slug: "f5-persistence-method-explainer", run: persistenceMethodExplainerRun },
  { slug: "f5-lb-method-chooser", run: lbMethodChooserRun },
  { slug: "f5-gslb-decision-flow", run: gslbDecisionFlowRun },
  { slug: "f5-topology-longest-match", run: topologyLongestMatchRun },
  { slug: "f5-dos-vector-explainer", run: dosVectorExplainerRun },
  { slug: "f5-irules-command-context", run: irulesCommandContextRun },
  { slug: "f5-irules-vs-ltm-policy", run: irulesVsLtmPolicyRun },
  { slug: "f5-oneconnect-source-mask", run: oneconnectSourceMaskRun },
  { slug: "f5-afm-rule-context", run: afmRuleContextRun },
  { slug: "f5-apm-sso-explainer", run: apmSsoExplainerRun },
  { slug: "f5-l4-profile-explainer", run: l4ProfileExplainerRun },
  { slug: "f5-apm-session-variable-reference", run: apmSvarRun },
  { slug: "f5-packet-filter-explainer", run: packetFilterExplainerRun },
  { slug: "pkce", run: pkceRun },
  { slug: "regex", run: regexRun },
  { slug: "saml-decoder", run: samlDecoderRun },
  { slug: "secure-headers", run: secureHeadersRun },
  { slug: "ssrf-url-classifier", run: ssrfUrlClassifierRun },
  { slug: "syslog-pri-decoder", run: syslogPriDecoderRun },
  { slug: "ja4-fingerprint-decoder", run: ja4FingerprintDecoderRun },
  { slug: "oui-lookup", run: ouiLookupRun },
  { slug: "voss-fabric-id", run: vossFabricIdRun },
  { slug: "voss-exos-translator", run: vossExosTranslatorRun },
  { slug: "f5-tmsh-config-explainer", run: tmshConfigExplainerRun },
  { slug: "totp-hotp", structured: true, run: (input) => totpHotpRun(JSON.parse(input)) },
  { slug: "url-inspector", run: urlInspectorRun },
  { slug: "uuid", run: uuidRun },
  { slug: "x509", run: x509Run },
  { slug: "xml-decoder", run: xmlDecoderRun },
];

/** Fast lookup by slug for the Worker's request router. */
export const API_TOOL_MAP: Map<string, ApiTool> = new Map(API_TOOLS.map((t) => [t.slug, t]));

/**
 * Tools that are built and shipped in the browser but intentionally NOT exposed
 * over the HTTP API, each with the reason. Some capabilities do not belong on a
 * shared edge - e.g. a bounded brute-force search is compute-heavy and abusable.
 *
 * DISCIPLINE (D-72): the build requires every tool marked "built" in the
 * catalogue to be EITHER in API_TOOLS above OR listed here. That forces a
 * deliberate expose-or-exclude decision per tool, so a new tool cannot ship
 * without one, and the API and its docs stay in lockstep with the toolbox.
 */
export const API_EXCLUDED: Record<string, string> = {
  "zdx-score-factor-explainer":
    "Documentation explainer: the value is the sourced per-metric reading and honesty notes rendered in the UI; it computes no score (formula unpublished) and its metric grammar is a teaching subset, not a stable API contract.",
  "zscaler-ssl-bypass-planner":
    "Advisory planner: the value is the sourced rationale, blind-spot ledger, and backstop checklist rendered in the UI; the asset grammar is a teaching subset, not a stable API contract.",
  "zscaler-tunnel-chooser":
    "Interactive six-question chooser: the value is the sourced elimination walk-through rendered in the UI; the structured-object input is not a stable text API contract.",
  "zscaler-firewall-rule-order-simulator":
    "Policy teaching simulator: the value is the rendered trace, verdict, and shadow findings; the rule grammar is a deliberate teaching subset, not a stable API contract.",
  "hash-preimage-finder":
    "Bounded brute-force preimage search: compute-heavy and abuse-prone on a shared edge. Browser-only by design.",
};
