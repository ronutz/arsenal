// ============================================================================
// src/lib/tools/telemetry-streaming-explainer/index.ts
// ----------------------------------------------------------------------------
// F5 BIG-IP TS (Telemetry Streaming) DECLARATION EXPLAINER. A {manifest, run,
// vectors} triple. Paste the JSON you POST to /mgmt/shared/telemetry/declare
// and it reads back the top-level Telemetry class, the optional Controls, and
// every named class-object grouped by its role in the telemetry pipeline (data
// sources that produce telemetry, consumers that forward it out, and the
// grouping/endpoint classes), while checking the structural rules and flagging
// the pipeline gaps that make a declaration succeed but do nothing.
//
// Pure and deterministic (D-49): a model of the TS schema's structure, never a
// probe. It never contacts a BIG-IP and never fetches. It is a structure
// explainer and sanity checker, not a full JSON-Schema validator.
//
// TS is the third F5 Automation Toolchain declarative extension, alongside AS3
// (application services) and DO (device onboarding). AS3 and DO CONFIGURE the
// box; TS OBSERVES it: it aggregates, normalizes, and forwards statistics and
// events from the BIG-IP to a consumer application.
// ============================================================================

import { explainTs } from "./compute";
import { SET_ID, verifyVectors } from "./golden-vectors";

export { explainTs, KNOWN_CLASSES, ROLE_ORDER, ROLE_LABEL } from "./compute";
export type {
  TsResult, DocKind, Role, ControlsInfo, RoleGroup, ObjectInfo, Finding, TsStats,
} from "./compute";
export { SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest for the telemetry-streaming-explainer tool. */
export const manifest = Object.freeze({
  // D-73: toolFamily MUST equal the catalogue family for this slug.
  toolFamily: "F5 automation (AS3 / DO)",
  toolSlug: "telemetry-streaming-explainer",
  canonicalAliases: ["ts-explainer", "telemetry-streaming", "telemetry-explainer", "ts-declaration"],
  inputDetectors: [
    // The top-level Telemetry class is the unambiguous TS signal.
    { kind: "regex", pattern: '"class"\\s*:\\s*"Telemetry"', priority: 9, example: '{ "class": "Telemetry", "My_System": { "class": "Telemetry_System", "systemPoller": { "interval": 60 } } }' },
    // Any Telemetry_* class strongly implies a TS declaration.
    { kind: "regex", pattern: '"class"\\s*:\\s*"Telemetry_(System|Listener|Consumer|Namespace|Pull_Consumer|System_Poller|Endpoints)"', priority: 7, example: '{ "class": "Telemetry_Consumer", "type": "Splunk" }' },
  ],

  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  goldenVectors: SET_ID,
  dangerousInputHandling: ["bounded-parse", "never-evaluates", "never-fetches"],
  // A declaration can carry consumer hosts, API keys (passphrase.cipherText),
  // and proxy credentials -> shareable fragment.
  shareSafetyDefault: "fragment",

  learnLinks: [
    "learn/bigip-telemetry-streaming-ts",
    "learn/bigip-declarative-onboarding-do",
    "learn/as3-declaration-anatomy",
  ],
  relatedTools: ["as3-explainer-validator", "do-explainer-validator", "json-yaml-convert"],
  // Live-fetched 2026-07-05 from clouddocs (TS 1.41.0 / 1.42.0).
  sources: [
    { id: "ts-quickstart", label: "F5 BIG-IP Telemetry Streaming: Quick Start (the base Telemetry declaration, the Controls class with logLevel default info, the Telemetry_System / Telemetry_Listener / Telemetry_Consumer classes, default Listener port 6514, Consumer protocol default http, and the /mgmt/shared/telemetry/declare and /info endpoints)", url: "https://clouddocs.f5.com/products/extensions/f5-telemetry-streaming/latest/quick-start.html" },
    { id: "ts-using", label: "F5 BIG-IP Telemetry Streaming: Using TS (the full class index and the complete push and pull consumer type catalogue: Splunk, Azure, AWS, Graphite, Kafka, ElasticSearch, DataDog, Generic HTTP, OpenTelemetry, Prometheus, and more)", url: "https://clouddocs.f5.com/products/extensions/f5-telemetry-streaming/latest/using-ts.html" },
    { id: "ts-system", label: "F5 BIG-IP Telemetry Streaming: Telemetry System class (the system poller and the iHealth poller, and the rule that an iHealth poller must be attached to a Telemetry_System)", url: "https://clouddocs.f5.com/products/extensions/f5-telemetry-streaming/latest/telemetry-system.html" },
    { id: "ts-declarations", label: "F5 BIG-IP Telemetry Streaming: Example Declarations (the base declaration, the referenced Telemetry_System_Poller pulling from an additional BIG-IP, and the Telemetry_Namespace examples)", url: "https://clouddocs.f5.com/products/extensions/f5-telemetry-streaming/latest/declarations.html" },
    { id: "ts-troubleshooting", label: "F5 BIG-IP Telemetry Streaming: Troubleshooting (a Telemetry_System used for metrics must define systemPoller; event ingest needs a Telemetry_Listener whose port matches the BIG-IP log configuration)", url: "https://clouddocs.f5.com/products/extensions/f5-telemetry-streaming/latest/troubleshooting.html" },
  ],
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

/** Tool entry point. Deterministic; delegates to the pure engine. */
export function run(input: string) {
  return explainTs(input);
}

export const __selftest = verifyVectors;
