// ============================================================================
// src/app/[locale]/tools/[slug]/page.tsx
// ----------------------------------------------------------------------------
// PER-TOOL PAGE - the detail view for a single tool, statically generated for
// every (locale, slug). The registry (src/config/tools.ts) supplies the name
// and blurb; the local tool module supplies the live component and its RFC
// sources (rendered as a References block). Every tool, CIDR included, lives at
// /tools/<slug>; the home page additionally embeds the CIDR widget as a live
// demo, but /tools/cidr is its canonical page.
//
// Adding a tool page = drop one entry in TOOL_PAGES below; generateStaticParams
// expands it across every locale automatically.
// ============================================================================

import type { ComponentType } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ogImages } from "@/lib/og";
import { hasToolDoc } from "@/lib/toolDocs";
import MessageSlice from "@/components/MessageSlice";
import ShareControl from "@/components/ShareControl";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import Breadcrumbs from "@/components/Breadcrumbs";
import { populatedVendors } from "@/config/vendors";
import SiteFooter from "@/components/SiteFooter";
import ToolLearnPanel from "@/components/ToolLearnPanel";
import ApiAffordance from "@/components/ApiAffordance";
import ToolRequirements from "@/components/ToolRequirements";
import ToolApiEndpoint from "@/components/ToolApiEndpoint";
// API_TOOLS is the authoritative list of API-capable tool slugs (also drives the
// worker's /api/v1/<slug> routes and the OpenAPI generator). We use it here only
// to decide whether the "API-ready" pill applies to this tool.
import { API_TOOLS } from "@/lib/tools/registry";
import { isApiProcessingEnabled } from "@/config/apiSurface";
import FamilyChip from "@/components/FamilyChip";
import PageCapabilities from "@/components/PageCapabilities";
import ToolProvenance from "@/components/ToolProvenance";
import { provenanceFor } from "@/config/toolProvenance";
import { isEnabled } from "@/config/features";
import { tools } from "@/config/tools";
import JwtTool from "@/components/JwtTool";
import { manifest as jwtManifest } from "@/lib/tools/jwt";
import Base64Tool from "@/components/Base64Tool";
import { manifest as base64Manifest } from "@/lib/tools/base64";
import HashTool from "@/components/HashTool";
import { manifest as hashManifest } from "@/lib/tools/hash";
import HmacTool from "@/components/HmacTool";
import { manifest as hmacManifest } from "@/lib/tools/hmac";
import TotpHotpTool from "@/components/TotpHotpTool";
import { manifest as totpHotpManifest } from "@/lib/tools/totp-hotp";
import AcmeDns01Tool from "@/components/AcmeDns01Tool";
import { manifest as acmeDns01Manifest } from "@/lib/tools/acme-dns01";
import PublicSuffixTool from "@/components/PublicSuffixTool";
import { manifest as publicSuffixManifest } from "@/lib/tools/public-suffix";
import LetsEncryptRateLimitsTool from "@/components/LetsEncryptRateLimitsTool";
import { manifest as letsEncryptRateLimitsManifest } from "@/lib/tools/letsencrypt-rate-limits";
import F5IrulesRuntimeCalculatorTool from "@/components/F5IrulesRuntimeCalculatorTool";
import { manifest as f5IrulesRuntimeCalculatorManifest } from "@/lib/tools/f5-irules-runtime-calculator";
import F5IrulesPerformanceLinterTool from "@/components/F5IrulesPerformanceLinterTool";
import { manifest as f5IrulesPerformanceLinterManifest } from "@/lib/tools/f5-irules-performance-linter";
import F5ReleaseCadenceCalendarTool from "@/components/F5ReleaseCadenceCalendarTool";
import { manifest as f5ReleaseCadenceCalendarManifest } from "@/lib/tools/f5-release-cadence-calendar";
import DiffTool from "@/components/DiffTool";
import { manifest as diffManifest } from "@/lib/tools/diff";
import PkceTool from "@/components/PkceTool";
import { manifest as pkceManifest } from "@/lib/tools/pkce";
import UuidTool from "@/components/UuidTool";
import { manifest as uuidManifest } from "@/lib/tools/uuid";
import X509Tool from "@/components/X509Tool";
import { manifest as x509Manifest } from "@/lib/tools/x509";
import Ipv6Tool from "@/components/Ipv6Tool";
import { manifest as ipv6Manifest } from "@/lib/tools/ipv6";
import CipherTool from "@/components/CipherTool";
import { manifest as cipherManifest } from "@/lib/tools/cipher";
import CidrTool from "@/components/CidrTool";
// CIDR's single-subnet engine + manifest are now arsenal-local; the
// src/lib/tools/cidr module adds the extended modes and exports no manifest of
// its own, so the References block sources come from the tool's manifest.
import { manifest as cidrManifest } from "@/lib/tools/cidr";
import SecureHeadersTool from "@/components/SecureHeadersTool";
import { manifest as secureHeadersManifest } from "@/lib/tools/secure-headers";
import SamlDecoderTool from "@/components/SamlDecoderTool";
import { manifest as samlDecoderManifest } from "@/lib/tools/saml-decoder";
import OidcTool from "@/components/OidcTool";
import { manifest as oidcManifest } from "@/lib/tools/oidc";
import BigipCookieTool from "@/components/BigipCookieTool";
import { manifest as bigipManifest } from "@/lib/tools/f5-bigip-persistence-cookie";
import UrlInspectorTool from "@/components/UrlInspectorTool";
import { manifest as urlManifest } from "@/lib/tools/url-inspector";
import JsonFormatterTool from "@/components/JsonFormatterTool";
import { manifest as jsonManifest } from "@/lib/tools/json-formatter";
import JsonYamlConvertTool from "@/components/JsonYamlConvertTool";
import { manifest as jsonYamlManifest } from "@/lib/tools/json-yaml-convert";
import TmshConfigExplainerTool from "@/components/TmshConfigExplainerTool";
import { manifest as tmshManifest } from "@/lib/tools/f5-tmsh-config-explainer";
import DigOutputExplainerTool from "@/components/DigOutputExplainerTool";
import { manifest as digManifest } from "@/lib/tools/dig-output-explainer";
import NslookupOutputExplainerTool from "@/components/NslookupOutputExplainerTool";
import { manifest as nslookupManifest } from "@/lib/tools/nslookup-output-explainer";
import XmlDecoderTool from "@/components/XmlDecoderTool";
import { manifest as xmlManifest } from "@/lib/tools/xml-decoder";
import F5xcServicePolicyExplainerTool from "@/components/F5xcServicePolicyExplainerTool";
import F5xcRateLimitCalculatorTool from "@/components/F5xcRateLimitCalculatorTool";
import F5xcTlsSecurityLevelMapperTool from "@/components/F5xcTlsSecurityLevelMapperTool";
import F5xcCeEgressChecklistTool from "@/components/F5xcCeEgressChecklistTool";
import F5xcHttpLbRouteExplainerTool from "@/components/F5xcHttpLbRouteExplainerTool";
import F5xcLbAlgorithmChooserTool from "@/components/F5xcLbAlgorithmChooserTool";
import F5xcOriginPoolExplainerTool from "@/components/F5xcOriginPoolExplainerTool";
import F5xcDomainSniMatchResolverTool from "@/components/F5xcDomainSniMatchResolverTool";
import F5xcSecurityEventExplainerTool from "@/components/F5xcSecurityEventExplainerTool";
import F5xcObjectLinterTool from "@/components/F5xcObjectLinterTool";
import F5xcApiPathExplainerTool from "@/components/F5xcApiPathExplainerTool";
import BigipLtmLbSimulatorTool from "@/components/BigipLtmLbSimulatorTool";
import BigipDnsGslbSimulatorTool from "@/components/BigipDnsGslbSimulatorTool";
import Ja3TlsFingerprintTool from "@/components/Ja3TlsFingerprintTool";
import { manifest as f5xcServicePolicyManifest } from "@/lib/tools/f5xc-service-policy-explainer";
import { manifest as f5xcRateLimitManifest } from "@/lib/tools/f5xc-rate-limit-calculator";
import { manifest as f5xcTlsMapperManifest } from "@/lib/tools/f5xc-tls-security-level-mapper";
import { manifest as f5xcCeEgressManifest } from "@/lib/tools/f5xc-ce-egress-checklist";
import { manifest as f5xcRouteManifest } from "@/lib/tools/f5xc-http-lb-route-explainer";
import { manifest as f5xcLbAlgoManifest } from "@/lib/tools/f5xc-lb-algorithm-chooser";
import { manifest as f5xcOriginPoolManifest } from "@/lib/tools/f5xc-origin-pool-explainer";
import { manifest as f5xcDomainSniManifest } from "@/lib/tools/f5xc-domain-sni-match-resolver";
import { manifest as f5xcSecurityEventManifest } from "@/lib/tools/f5xc-security-event-explainer";
import { manifest as f5xcObjectLinterManifest } from "@/lib/tools/f5xc-object-linter";
import { manifest as f5xcApiPathManifest } from "@/lib/tools/f5xc-api-path-explainer";
import { manifest as bigipLtmSimManifest } from "@/lib/tools/bigip-ltm-lb-simulator";
import { manifest as bigipDnsGslbManifest } from "@/lib/tools/bigip-dns-gslb-simulator";
import { manifest as ja3Manifest } from "@/lib/tools/ja3-tls-fingerprint";
import PersistenceMethodExplainerTool from "@/components/PersistenceMethodExplainerTool";
import { manifest as persistManifest } from "@/lib/tools/f5-persistence-method-explainer";
import LbMethodChooserTool from "@/components/LbMethodChooserTool";
import ZscalerTunnelChooserTool from "@/components/ZscalerTunnelChooserTool";
import ZscalerFirewallRuleOrderSimulatorTool from "@/components/ZscalerFirewallRuleOrderSimulatorTool";
import ZscalerSslBypassPlannerTool from "@/components/ZscalerSslBypassPlannerTool";
import GslbDecisionFlowTool from "@/components/GslbDecisionFlowTool";
import TopologyLongestMatchTool from "@/components/TopologyLongestMatchTool";
import DosVectorExplainerTool from "@/components/DosVectorExplainerTool";
import IrulesCommandContextTool from "@/components/IrulesCommandContextTool";
import IrulesVsLtmPolicyTool from "@/components/IrulesVsLtmPolicyTool";
import OneconnectSourceMaskTool from "@/components/OneconnectSourceMaskTool";
import AfmRuleContextTool from "@/components/AfmRuleContextTool";
import ApmSsoExplainerTool from "@/components/ApmSsoExplainerTool";
import L4ProfileExplainerTool from "@/components/L4ProfileExplainerTool";
import ApmSessionVariableReferenceTool from "@/components/ApmSessionVariableReferenceTool";
import PacketFilterExplainerTool from "@/components/PacketFilterExplainerTool";
import { manifest as lbMethodManifest } from "@/lib/tools/f5-lb-method-chooser";
import { manifest as zscalerTunnelManifest } from "@/lib/tools/zscaler-tunnel-chooser";
import { manifest as zscalerFwManifest } from "@/lib/tools/zscaler-firewall-rule-order-simulator";
import { manifest as zscalerSslManifest } from "@/lib/tools/zscaler-ssl-bypass-planner";
import { manifest as gslbFlowManifest } from "@/lib/tools/f5-gslb-decision-flow";
import { manifest as topoMatchManifest } from "@/lib/tools/f5-topology-longest-match";
import { manifest as dosVectorManifest } from "@/lib/tools/f5-dos-vector-explainer";
import { manifest as irulesCtxManifest } from "@/lib/tools/f5-irules-command-context";
import { manifest as irulesPolManifest } from "@/lib/tools/f5-irules-vs-ltm-policy";
import { manifest as oneconnectManifest } from "@/lib/tools/f5-oneconnect-source-mask";
import { manifest as afmContextManifest } from "@/lib/tools/f5-afm-rule-context";
import { manifest as apmSsoManifest } from "@/lib/tools/f5-apm-sso-explainer";
import { manifest as l4ProfileManifest } from "@/lib/tools/f5-l4-profile-explainer";
import { manifest as svarManifest } from "@/lib/tools/f5-apm-session-variable-reference";
import { manifest as packetFilterManifest } from "@/lib/tools/f5-packet-filter-explainer";
import F5CipherStringExpanderTool from "@/components/F5CipherStringExpanderTool";
import { manifest as cipherStrManifest } from "@/lib/tools/f5-cipher-string-expander";
import F5ServiceCheckDateTool from "@/components/F5ServiceCheckDateTool";
import F5BigdThreadCalculatorTool from "@/components/F5BigdThreadCalculatorTool";
import MtuMssTool from "@/components/MtuMssTool";
import { manifest as mtuMssManifest } from "@/lib/tools/mtu-mss";
import HttpMethodsComparisonTool from "@/components/HttpMethodsComparisonTool";
import { manifest as httpMethodsManifest } from "@/lib/tools/http-methods-comparison";
import { manifest as f5BigdThreadManifest } from "@/lib/tools/f5-bigd-thread-calculator";
import FaultHypothesisBuilderTool from "@/components/FaultHypothesisBuilderTool";
import { manifest as faultHypothesisBuilderManifest } from "@/lib/tools/fault-hypothesis-builder";
import ChangeWindowRunbookBuilderTool from "@/components/ChangeWindowRunbookBuilderTool";
import { manifest as changeWindowRunbookBuilderManifest } from "@/lib/tools/change-window-runbook-builder";
import IncidentTimelineRcaBuilderTool from "@/components/IncidentTimelineRcaBuilderTool";
import { manifest as incidentTimelineRcaBuilderManifest } from "@/lib/tools/incident-timeline-rca-builder";
import ChangeBlastRadiusMapperTool from "@/components/ChangeBlastRadiusMapperTool";
import { manifest as changeBlastRadiusMapperManifest } from "@/lib/tools/change-blast-radius-mapper";
import TacEscalationPacketBuilderTool from "@/components/TacEscalationPacketBuilderTool";
import { manifest as tacEscalationPacketBuilderManifest } from "@/lib/tools/tac-escalation-packet-builder";
import PacketCapturePlanBuilderTool from "@/components/PacketCapturePlanBuilderTool";
import { manifest as packetCapturePlanBuilderManifest } from "@/lib/tools/packet-capture-plan-builder";
import FlowPathReasonerTool from "@/components/FlowPathReasonerTool";
import { manifest as flowPathReasonerManifest } from "@/lib/tools/flow-path-reasoner";
import HealthSnapshotComparatorTool from "@/components/HealthSnapshotComparatorTool";
import { manifest as healthSnapshotComparatorManifest } from "@/lib/tools/health-snapshot-comparator";
import { manifest as f5ServiceCheckManifest } from "@/lib/tools/f5-service-check-date";
import F5BigipLicenseExplainerTool from "@/components/F5BigipLicenseExplainerTool";
import { manifest as f5BigipLicenseManifest } from "@/lib/tools/f5-bigip-license-explainer";
import F5AwafDeclarativePolicyExplainerTool from "@/components/F5AwafDeclarativePolicyExplainerTool";
import F5AwafEvasionExplainerTool from "@/components/F5AwafEvasionExplainerTool";
import F5AwafLearningPoisoningEstimatorTool from "@/components/F5AwafLearningPoisoningEstimatorTool";
import As3ExplainerValidatorTool from "@/components/As3ExplainerValidatorTool";
import IqueryProtocolExplainerTool from "@/components/IqueryProtocolExplainerTool";
import FortiosSnifferBuilderTool from "@/components/FortiosSnifferBuilderTool";
import PacFileExplainerTool from "@/components/PacFileExplainerTool";
import ExosConfigExplainerTool from "@/components/ExosConfigExplainerTool";
import DoExplainerValidatorTool from "@/components/DoExplainerValidatorTool";
import TelemetryStreamingExplainerTool from "@/components/TelemetryStreamingExplainerTool";
import F5AwafFalsePositiveTriageTool from "@/components/F5AwafFalsePositiveTriageTool";
import F5AwafRequestLogTriageTool from "@/components/F5AwafRequestLogTriageTool";
import F5AwafLearningSuggestionInterpreterTool from "@/components/F5AwafLearningSuggestionInterpreterTool";
import F5AwafSignatureAccuracyRiskTool from "@/components/F5AwafSignatureAccuracyRiskTool";
import F5AwafPolicyDiffTool from "@/components/F5AwafPolicyDiffTool";
import { manifest as f5AwafManifest } from "@/lib/tools/f5-awaf-declarative-policy-explainer";
import { manifest as f5AwafEvasionManifest } from "@/lib/tools/f5-awaf-evasion-explainer";
import { manifest as f5AwafPoisoningManifest } from "@/lib/tools/f5-awaf-learning-poisoning-estimator";
import { manifest as as3Manifest } from "@/lib/tools/as3-explainer-validator";
import { manifest as iqueryManifest } from "@/lib/tools/iquery-protocol-explainer";
import { manifest as fortiosSnifferManifest } from "@/lib/tools/fortios-sniffer-builder";
import { manifest as pacManifest } from "@/lib/tools/pac-file-explainer";
import { manifest as exosManifest } from "@/lib/tools/exos-config-explainer";
import { manifest as doManifest } from "@/lib/tools/do-explainer-validator";
import { manifest as tsManifest } from "@/lib/tools/telemetry-streaming-explainer";
import { manifest as f5AwafFpManifest } from "@/lib/tools/f5-awaf-false-positive-triage";
import { manifest as f5AwafLogManifest } from "@/lib/tools/f5-awaf-request-log-triage";
import { manifest as f5AwafSuggManifest } from "@/lib/tools/f5-awaf-learning-suggestion-interpreter";
import { manifest as f5AwafSigManifest } from "@/lib/tools/f5-awaf-signature-accuracy-risk";
import { manifest as f5AwafDiffManifest } from "@/lib/tools/f5-awaf-policy-diff";
import F5SslProfileExplainerTool from "@/components/F5SslProfileExplainerTool";
import { manifest as sslProfileManifest } from "@/lib/tools/f5-ssl-profile-explainer";
import EpochTool from "@/components/EpochTool";
import RomanNumeralsTool from "@/components/RomanNumeralsTool";
import GreekAlphabetTool from "@/components/GreekAlphabetTool";
import P0fSignatureExplainerTool from "@/components/P0fSignatureExplainerTool";
import UserAgentEntropyAnalyzerTool from "@/components/UserAgentEntropyAnalyzerTool";
import HttpHeaderOrderFingerprintTool from "@/components/HttpHeaderOrderFingerprintTool";
import TimeCalculatorTool from "@/components/TimeCalculatorTool";
import TimezoneMeetingPlannerTool from "@/components/TimezoneMeetingPlannerTool";
import { manifest as epochManifest } from "@/lib/tools/epoch";
import { manifest as romanManifest } from "@/lib/tools/roman-numerals";
import { manifest as greekManifest } from "@/lib/tools/greek-alphabet";
import { manifest as p0fManifest } from "@/lib/tools/p0f-signature-explainer";
import { manifest as uaManifest } from "@/lib/tools/user-agent-entropy-analyzer";
import { manifest as hdrManifest } from "@/lib/tools/http-header-order-fingerprint";
import { manifest as timeCalcManifest } from "@/lib/tools/time-calculator";
import { manifest as tzPlannerManifest } from "@/lib/tools/timezone-meeting-planner";
import CertRenewalPlannerTool from "@/components/CertRenewalPlannerTool";
import { manifest as certRenewalManifest } from "@/lib/tools/cert-renewal-planner";
import CsrDecoderTool from "@/components/CsrDecoderTool";
import { manifest as csrManifest } from "@/lib/tools/csr-decoder";
import IrulesEventOrderTool from "@/components/IrulesEventOrderTool";
import { manifest as irevManifest } from "@/lib/tools/f5-irules-event-order";
import SyslogPriDecoderTool from "@/components/SyslogPriDecoderTool";
import Ja4FingerprintDecoderTool from "@/components/Ja4FingerprintDecoderTool";
import OuiLookupTool from "@/components/OuiLookupTool";
import VossFabricIdTool from "@/components/VossFabricIdTool";
import VossExosTranslatorTool from "@/components/VossExosTranslatorTool";
import { manifest as syslogPriManifest } from "@/lib/tools/syslog-pri-decoder";
import { manifest as ja4Manifest } from "@/lib/tools/ja4-fingerprint-decoder";
import { manifest as ouiManifest } from "@/lib/tools/oui-lookup";
import { manifest as vossManifest } from "@/lib/tools/voss-fabric-id";
import { manifest as vossExosManifest } from "@/lib/tools/voss-exos-translator";
import JwksExplainerTool from "@/components/JwksExplainerTool";
import { manifest as jwksManifest } from "@/lib/tools/jwks-explainer";
import RegexTool from "@/components/RegexTool";
import { manifest as regexManifest } from "@/lib/tools/regex";
import BigipTcpdumpBuilderTool from "@/components/BigipTcpdumpBuilderTool";
import { manifest as tcpdumpManifest } from "@/lib/tools/f5-bigip-tcpdump-builder";
import CvssVectorDecoderTool from "@/components/CvssVectorDecoderTool";
import { manifest as cvssManifest } from "@/lib/tools/cvss-vector-decoder";
import HttpRequestTranslatorTool from "@/components/HttpRequestTranslatorTool";
import { manifest as curlManifest } from "@/lib/tools/http-request-translator";
import { manifest as curlbManifest } from "@/lib/tools/curl-command-builder";
import CurlCommandBuilderTool from "@/components/CurlCommandBuilderTool";
import HashPreimageFinderTool from "@/components/HashPreimageFinderTool";
import { manifest as hpfManifest } from "@/lib/tools/hash-preimage-finder";
import SsrfUrlClassifierTool from "@/components/SsrfUrlClassifierTool";
import { manifest as ssrfManifest } from "@/lib/tools/ssrf-url-classifier";

/** A reference link shown under a tool (from its manifest sources). */
interface ToolSource {
  id: string;
  label: string;
  url?: string;
}

/** The render unit for one tool page: its component + its source links. */
interface ToolPage {
  Component: ComponentType;
  sources: ToolSource[];
}

// The slug map. Each entry pairs a route segment with its live component and
// the references to surface. CIDR is included here (canonical /tools/cidr) and
// also appears as a live demo on the home page.
const TOOL_PAGES: Record<string, ToolPage> = {
  "f5-service-check-date": {
    Component: F5ServiceCheckDateTool,
    sources: f5ServiceCheckManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "fault-hypothesis-builder": {
    Component: FaultHypothesisBuilderTool,
    // The pilot's provenance is the original ruleset (D-18): no URL, by nature.
    sources: faultHypothesisBuilderManifest.sources.map((s) => ({ id: s.id, label: s.label })),
  },
  "change-window-runbook-builder": {
    Component: ChangeWindowRunbookBuilderTool,
    // Provenance is the original change-runbook ruleset (D-18): no URL, by nature.
    sources: changeWindowRunbookBuilderManifest.sources.map((s) => ({ id: s.id, label: s.label })),
  },
  "incident-timeline-rca-builder": {
    Component: IncidentTimelineRcaBuilderTool,
    // Provenance is the original incident-RCA ruleset (D-18): no URL, by nature.
    sources: incidentTimelineRcaBuilderManifest.sources.map((s) => ({ id: s.id, label: s.label })),
  },
  "change-blast-radius-mapper": {
    Component: ChangeBlastRadiusMapperTool,
    // Provenance is the original blast-radius ruleset (D-18): no URL, by nature.
    sources: changeBlastRadiusMapperManifest.sources.map((s) => ({ id: s.id, label: s.label })),
  },
  "tac-escalation-packet-builder": {
    Component: TacEscalationPacketBuilderTool,
    // Provenance is the original TAC-escalation ruleset (D-18): no URL, by nature.
    sources: tacEscalationPacketBuilderManifest.sources.map((s) => ({ id: s.id, label: s.label })),
  },
  "packet-capture-plan-builder": {
    Component: PacketCapturePlanBuilderTool,
    // Provenance is the original capture-planning ruleset (D-18): no URL, by nature.
    sources: packetCapturePlanBuilderManifest.sources.map((s) => ({ id: s.id, label: s.label })),
  },
  "flow-path-reasoner": {
    Component: FlowPathReasonerTool,
    // Provenance is the original path-reasoning ruleset (D-18): no URL, by nature.
    sources: flowPathReasonerManifest.sources.map((s) => ({ id: s.id, label: s.label })),
  },
  "health-snapshot-comparator": {
    Component: HealthSnapshotComparatorTool,
    // Provenance is the original comparison-gating ruleset (D-18): no URL, by nature.
    sources: healthSnapshotComparatorManifest.sources.map((s) => ({ id: s.id, label: s.label })),
  },
  "f5-bigd-thread-calculator": {
    Component: F5BigdThreadCalculatorTool,
    sources: f5BigdThreadManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "mtu-mss": {
    Component: MtuMssTool,
    sources: mtuMssManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "http-methods-comparison": {
    Component: HttpMethodsComparisonTool,
    sources: httpMethodsManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5-bigip-license-explainer": {
    Component: F5BigipLicenseExplainerTool,
    sources: f5BigipLicenseManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  jwt: {
    Component: JwtTool,
    sources: jwtManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  base64: {
    Component: Base64Tool,
    sources: base64Manifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  hash: {
    Component: HashTool,
    sources: hashManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  hmac: {
    Component: HmacTool,
    sources: hmacManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "acme-dns01": {
    Component: AcmeDns01Tool,
    sources: acmeDns01Manifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "public-suffix": {
    Component: PublicSuffixTool,
    sources: publicSuffixManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "letsencrypt-rate-limits": {
    Component: LetsEncryptRateLimitsTool,
    sources: letsEncryptRateLimitsManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5-irules-runtime-calculator": {
    Component: F5IrulesRuntimeCalculatorTool,
    sources: f5IrulesRuntimeCalculatorManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5-irules-performance-linter": {
    Component: F5IrulesPerformanceLinterTool,
    sources: f5IrulesPerformanceLinterManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5-release-cadence-calendar": {
    Component: F5ReleaseCadenceCalendarTool,
    sources: f5ReleaseCadenceCalendarManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "totp-hotp": {
    Component: TotpHotpTool,
    sources: totpHotpManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  diff: {
    Component: DiffTool,
    sources: diffManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  pkce: {
    Component: PkceTool,
    sources: pkceManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  uuid: {
    Component: UuidTool,
    sources: uuidManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  x509: {
    Component: X509Tool,
    sources: x509Manifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  ipv6: {
    Component: Ipv6Tool,
    sources: ipv6Manifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  cipher: {
    Component: CipherTool,
    sources: cipherManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  cidr: {
    Component: CidrTool,
    // the manifest types sources as unknown; narrow to the fields we render.
    sources: (
      cidrManifest.sources as { id: string; label: string; url?: string }[]
    ).map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "secure-headers": {
    Component: SecureHeadersTool,
    sources: secureHeadersManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "saml-decoder": {
    Component: SamlDecoderTool,
    sources: samlDecoderManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  oidc: {
    Component: OidcTool,
    sources: oidcManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5-bigip-persistence-cookie": {
    Component: BigipCookieTool,
    sources: bigipManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "url-inspector": {
    Component: UrlInspectorTool,
    sources: urlManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "json-formatter": {
    Component: JsonFormatterTool,
    sources: jsonManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "json-yaml-convert": {
    Component: JsonYamlConvertTool,
    sources: jsonYamlManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5-tmsh-config-explainer": {
    Component: TmshConfigExplainerTool,
    sources: tmshManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "dig-output-explainer": {
    Component: DigOutputExplainerTool,
    sources: digManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "nslookup-output-explainer": {
    Component: NslookupOutputExplainerTool,
    sources: nslookupManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "xml-decoder": {
    Component: XmlDecoderTool,
    sources: xmlManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5xc-service-policy-explainer": {
    Component: F5xcServicePolicyExplainerTool,
    sources: f5xcServicePolicyManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5xc-rate-limit-calculator": {
    Component: F5xcRateLimitCalculatorTool,
    sources: f5xcRateLimitManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5xc-tls-security-level-mapper": {
    Component: F5xcTlsSecurityLevelMapperTool,
    sources: f5xcTlsMapperManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5xc-ce-egress-checklist": {
    Component: F5xcCeEgressChecklistTool,
    sources: f5xcCeEgressManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5xc-http-lb-route-explainer": {
    Component: F5xcHttpLbRouteExplainerTool,
    sources: f5xcRouteManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5xc-lb-algorithm-chooser": {
    Component: F5xcLbAlgorithmChooserTool,
    sources: f5xcLbAlgoManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5xc-origin-pool-explainer": {
    Component: F5xcOriginPoolExplainerTool,
    sources: f5xcOriginPoolManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5xc-domain-sni-match-resolver": {
    Component: F5xcDomainSniMatchResolverTool,
    sources: f5xcDomainSniManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5xc-security-event-explainer": {
    Component: F5xcSecurityEventExplainerTool,
    sources: f5xcSecurityEventManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5xc-object-linter": {
    Component: F5xcObjectLinterTool,
    sources: f5xcObjectLinterManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5xc-api-path-explainer": {
    Component: F5xcApiPathExplainerTool,
    sources: f5xcApiPathManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "bigip-ltm-lb-simulator": {
    Component: BigipLtmLbSimulatorTool,
    sources: bigipLtmSimManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "bigip-dns-gslb-simulator": {
    Component: BigipDnsGslbSimulatorTool,
    sources: bigipDnsGslbManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "ja3-tls-fingerprint": {
    Component: Ja3TlsFingerprintTool,
    sources: ja3Manifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5-awaf-declarative-policy-explainer": {
    Component: F5AwafDeclarativePolicyExplainerTool,
    sources: f5AwafManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5-awaf-evasion-explainer": {
    Component: F5AwafEvasionExplainerTool,
    sources: f5AwafEvasionManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5-awaf-learning-poisoning-estimator": {
    Component: F5AwafLearningPoisoningEstimatorTool,
    sources: f5AwafPoisoningManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "as3-explainer-validator": {
    Component: As3ExplainerValidatorTool,
    sources: as3Manifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "iquery-protocol-explainer": {
    Component: IqueryProtocolExplainerTool,
    sources: iqueryManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "fortios-sniffer-builder": {
    Component: FortiosSnifferBuilderTool,
    sources: fortiosSnifferManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "pac-file-explainer": {
    Component: PacFileExplainerTool,
    sources: pacManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "exos-config-explainer": {
    Component: ExosConfigExplainerTool,
    sources: exosManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "do-explainer-validator": {
    Component: DoExplainerValidatorTool,
    sources: doManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "telemetry-streaming-explainer": {
    Component: TelemetryStreamingExplainerTool,
    sources: tsManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5-awaf-false-positive-triage": {
    Component: F5AwafFalsePositiveTriageTool,
    sources: f5AwafFpManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5-awaf-request-log-triage": {
    Component: F5AwafRequestLogTriageTool,
    sources: f5AwafLogManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5-awaf-learning-suggestion-interpreter": {
    Component: F5AwafLearningSuggestionInterpreterTool,
    sources: f5AwafSuggManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5-awaf-signature-accuracy-risk": {
    Component: F5AwafSignatureAccuracyRiskTool,
    sources: f5AwafSigManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5-awaf-policy-diff": {
    Component: F5AwafPolicyDiffTool,
    sources: f5AwafDiffManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "cvss-vector-decoder": {
    Component: CvssVectorDecoderTool,
    sources: cvssManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "curl-command-builder": {
    Component: CurlCommandBuilderTool,
    sources: curlbManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "http-request-translator": {
    Component: HttpRequestTranslatorTool,
    sources: curlManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "hash-preimage-finder": {
    Component: HashPreimageFinderTool,
    sources: hpfManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "ssrf-url-classifier": {
    Component: SsrfUrlClassifierTool,
    sources: ssrfManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5-bigip-tcpdump-builder": {
    Component: BigipTcpdumpBuilderTool,
    sources: tcpdumpManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5-persistence-method-explainer": {
    Component: PersistenceMethodExplainerTool,
    sources: persistManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5-lb-method-chooser": {
    Component: LbMethodChooserTool,
    sources: lbMethodManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "zscaler-tunnel-chooser": {
    Component: ZscalerTunnelChooserTool,
    sources: zscalerTunnelManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "zscaler-firewall-rule-order-simulator": {
    Component: ZscalerFirewallRuleOrderSimulatorTool,
    sources: zscalerFwManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "zscaler-ssl-bypass-planner": {
    Component: ZscalerSslBypassPlannerTool,
    sources: zscalerSslManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5-gslb-decision-flow": {
    Component: GslbDecisionFlowTool,
    sources: gslbFlowManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5-topology-longest-match": {
    Component: TopologyLongestMatchTool,
    sources: topoMatchManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5-dos-vector-explainer": {
    Component: DosVectorExplainerTool,
    sources: dosVectorManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5-irules-command-context": {
    Component: IrulesCommandContextTool,
    sources: irulesCtxManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5-irules-vs-ltm-policy": {
    Component: IrulesVsLtmPolicyTool,
    sources: irulesPolManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5-oneconnect-source-mask": {
    Component: OneconnectSourceMaskTool,
    sources: oneconnectManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5-afm-rule-context": {
    Component: AfmRuleContextTool,
    sources: afmContextManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5-apm-sso-explainer": {
    Component: ApmSsoExplainerTool,
    sources: apmSsoManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5-l4-profile-explainer": {
    Component: L4ProfileExplainerTool,
    sources: l4ProfileManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5-apm-session-variable-reference": {
    Component: ApmSessionVariableReferenceTool,
    sources: svarManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5-packet-filter-explainer": {
    Component: PacketFilterExplainerTool,
    sources: packetFilterManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5-cipher-string-expander": {
    Component: F5CipherStringExpanderTool,
    sources: cipherStrManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5-ssl-profile-explainer": {
    Component: F5SslProfileExplainerTool,
    sources: sslProfileManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  epoch: {
    Component: EpochTool,
    sources: epochManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "roman-numerals": {
    Component: RomanNumeralsTool,
    sources: romanManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "greek-alphabet": {
    Component: GreekAlphabetTool,
    sources: greekManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "p0f-signature-explainer": {
    Component: P0fSignatureExplainerTool,
    sources: p0fManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "user-agent-entropy-analyzer": {
    Component: UserAgentEntropyAnalyzerTool,
    sources: uaManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "http-header-order-fingerprint": {
    Component: HttpHeaderOrderFingerprintTool,
    sources: hdrManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "time-calculator": {
    Component: TimeCalculatorTool,
    sources: timeCalcManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "timezone-meeting-planner": {
    Component: TimezoneMeetingPlannerTool,
    sources: tzPlannerManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "cert-renewal-planner": {
    Component: CertRenewalPlannerTool,
    sources: certRenewalManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "csr-decoder": {
    Component: CsrDecoderTool,
    sources: csrManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "f5-irules-event-order": {
    Component: IrulesEventOrderTool,
    sources: irevManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "oui-lookup": {
    Component: OuiLookupTool,
    sources: ouiManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "voss-fabric-id": {
    Component: VossFabricIdTool,
    sources: vossManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "voss-exos-translator": {
    Component: VossExosTranslatorTool,
    sources: vossExosManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },


  "ja4-fingerprint-decoder": {
    Component: Ja4FingerprintDecoderTool,
    sources: ja4Manifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "syslog-pri-decoder": {
    Component: SyslogPriDecoderTool,
    sources: syslogPriManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  "jwks-explainer": {
    Component: JwksExplainerTool,
    sources: jwksManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
  regex: {
    Component: RegexTool,
    sources: regexManifest.sources.map((s) => ({ id: s.id, label: s.label, url: s.url })),
  },
};

/** Pre-generate every tool page for every locale at build time. */
export function generateStaticParams() {
  const slugs = Object.keys(TOOL_PAGES);
  return routing.locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!TOOL_PAGES[slug]) return {};
  const t = await getTranslations({ locale, namespace: "tools" });
  const name = t(`${slug}.name`);
  return {
    title: `${name} · ${(await getTranslations({ locale, namespace: "site" }))("name")}`,
    ...ogImages("tool", slug, locale, name),
  };
}

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const page = TOOL_PAGES[slug];
  if (!page) notFound();

  const entry = tools.find((tool) => tool.id === slug);
  // Vendor-tool breadcrumbs trail through the vendor hub (Home > Vendor > Tool)
  // rather than the generic category. Pick the first of the tool's vendors that
  // actually has a hub page (populatedVendors is derived from available vendored
  // tools, so a hub is guaranteed to exist for it) — this keeps the vendor crumb
  // a real, built page and never a broken link. Falls back to null (category
  // trail) for non-vendor tools or the theoretical case of a not-yet-populated
  // vendor. Today every vendored tool is single-vendor F5, but the .find keeps
  // this correct if a multi-vendor tool ever ships.
  const populated = new Set(populatedVendors());
  const hubVendor = entry?.vendors?.find((v) => populated.has(v)) ?? null;
  const tNav = await getTranslations("nav");
  const tTools = await getTranslations("tools");
  const tHome = await getTranslations("home");
  const Component = page.Component;
  const prov = isEnabled("toolProvenance") ? provenanceFor(slug) : null;

  // PROOF OF CONCEPT (reviewable): the "what this page needs" pill row is wired
  // onto a single tool page first — the CIDR calculator — before any site-wide
  // rollout. Rolling it out later is just widening this gate.
  const showRequirements = slug === "cidr";
  // API-ready when this tool's slug is in the API registry (capability is real;
  // the surface being switched on is a separate, later config flip).
  const apiReady = API_TOOLS.some((t) => t.slug === slug);
  // The single API_PROCESSING switch: green pills + "served locally" wording
  // when on; neutral pills + "documented, not served" wording when off.
  const processingOn = isApiProcessingEnabled();
  const tReq = await getTranslations("toolRequirements");
  const reqLabels = {
    heading: tReq("heading"),
    browserPill: tReq("browserPill"),
    clientNeeds: tReq("clientNeeds"),
    browserNote: tReq("browserNote"),
    apiPill: tReq("apiPill"),
    apiNote: processingOn ? tReq("apiNoteOn") : tReq("apiNoteOff"),
    noscriptHeading: tReq("noscriptHeading"),
    noscriptBody: tReq("noscriptBody"),
  };
  // Endpoint-URL affordance: shown on every API-capable tool (the component
  // renders nothing for tools without an endpoint). Links to the Swagger view.
  const tEndpoint = await getTranslations("toolApiEndpoint");
  const tShortcuts = await getTranslations("shortcuts");
  const endpointLabels = {
    heading: tEndpoint("heading"),
    note: processingOn ? tEndpoint("noteOn") : tEndpoint("noteOff"),
    linkAria: tEndpoint("linkAria"),
  };

  return (
    <>
      <a href="#main" className="skip-link">
        {tNav("skipToContent")}
      </a>
      <Header />

      <main id="main">
        <article className="section">
          <div className="container article-container">
            {entry && (
              <a
                href="https://buymeacoffee.com/ronutz"
                target="_blank"
                rel="noopener noreferrer"
                className="tool-coffee-corner"
                aria-label={locale === "pt-BR" ? "Me pague um café" : "Buy me a coffee"}
                title={locale === "pt-BR" ? "Me pague um café" : "Buy me a coffee"}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 8h13v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8z" />
                  <path d="M17 9h1.4a2.5 2.5 0 0 1 0 5H17" />
                  <path d="M7 2.2c-.5 1 .5 1.6 0 2.8M11 2.2c-.5 1 .5 1.6 0 2.8" />
                </svg>
              </a>
            )}
            {entry ? (
              <Breadcrumbs
                ariaLabel={tNav("breadcrumb")}
                items={
                  hubVendor
                    ? [
                        { label: tNav("home"), href: "/" },
                        { label: tTools(`vendors.${hubVendor}`), href: `/${hubVendor}` },
                        { label: tTools(`${slug}.name`) },
                      ]
                    : [
                        { label: tNav("home"), href: "/" },
                        { label: tNav("tools"), href: "/tools" },
                        { label: tTools(`categories.${entry.category}`), href: `/category/${entry.category}` },
                        { label: tTools(`${slug}.name`) },
                      ]
                }
              />
            ) : (
              <Link href="/tools" className="article-back">
                ← {tTools("backToTools")}
              </Link>
            )}
            {entry && <h1 className="article-title">{tTools(`${slug}.name`)}</h1>}
            {entry && <p className="article-summary">{tTools(`${slug}.blurb`)}</p>}
            {entry && (locale === "en" || locale === "pt-BR") && (
              <p className="doc-md-link">
                <a href={`/${locale}/tools/${slug}.md`}>
                  {locale === "pt-BR" ? "Documentação (Markdown)" : "Documentation (Markdown)"}
                </a>
              </p>
            )}
            {/* T-DOT: register this tool page's "." context capability - open the
                D-77 man page inline. Only en/pt-BR carry a D-77 doc (the same
                gate as the Markdown link above), so the capability is only
                offered where the fetch target exists. */}
            {entry && (locale === "en" || locale === "pt-BR") && (
              <PageCapabilities
                set={{
                  title: tTools(`${slug}.name`),
                  capabilities: [
                    {
                      id: "man-page",
                      kind: "man-page",
                      label: tShortcuts("manPageLabel"),
                      detail: tShortcuts("manPageDetail"),
                      docUrl: `/${locale}/tools/${slug}.md`,
                    },
                  ],
                }}
              />
            )}
            {entry && (
              <span className="family-chip-row">
                <FamilyChip
                  category={entry.category}
                  label={tTools(`categories.${entry.category}`)}
                />
              </span>
            )}

            {/* Tool meta links (2026-07-10): the documentation pill (present for
                every built tool, so guarded) paired with a quiet share control.
                Wrapped in a nested provider carrying only the share namespace
                (A1), matching the tool's own tools.<slug> slice below. */}
            <MessageSlice namespaces={["share"]}>
              <div className="tool-meta-links">
                {hasToolDoc(slug) && (
                  <Link href={`/tools/${slug}/docs`} className="tool-doc-link">
                    {tTools("documentation")} <span aria-hidden="true">&#8594;</span>
                  </Link>
                )}
                <ShareControl title={tTools(`${slug}.name`)} />
              </div>
            </MessageSlice>

            {/* A1 nested provider: only this tool's namespace + the API
                affordance's, instead of the whole pack. Prop-driven children
                (endpoint, requirements, learn panel) need no namespace. */}
            <MessageSlice namespaces={[`tools.${slug}`, "apiAffordance"]}>
              <Component />

              <ToolApiEndpoint slug={slug} processingOn={processingOn} labels={endpointLabels} />

              {showRequirements && (
                <ToolRequirements apiReady={apiReady} processingOn={processingOn} labels={reqLabels} />
              )}

              <ToolLearnPanel toolSlug={slug} locale={locale} heading={tTools("learnHeading")} />

              <ApiAffordance slug={slug} />
            </MessageSlice>

            {prov ? (
              <ToolProvenance
                enabled
                data={prov}
                copy={{
                  title: tHome("provenance.title"),
                  show: tHome("provenance.show"),
                  hide: tHome("provenance.hide"),
                  basisLabel: tHome("provenance.basisLabel"),
                  sourcesLabel: tHome("provenance.sourcesLabel"),
                  disclaimer: tHome("provenance.disclaimer"),
                }}
              />
            ) : (
              page.sources.length > 0 && (
                <section className="tool-sources" aria-label={tTools("references")}>
                  <h2 className="tool-sources-title">{tTools("references")}</h2>
                  <ul className="tool-sources-list">
                    {page.sources.map((source) => (
                      <li key={source.id}>
                        {source.url ? (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tool-sources-link"
                          >
                            {source.label}
                          </a>
                        ) : (
                          source.label
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )
            )}
          </div>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
