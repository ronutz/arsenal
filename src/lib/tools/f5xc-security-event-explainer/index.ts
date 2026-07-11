// ============================================================================
// src/lib/tools/f5xc-security-event-explainer/index.ts
// ----------------------------------------------------------------------------
// THE F5XC SECURITY EVENT EXPLAINER - a {manifest, run, vectors} triple. Paste
// a WAF / Bot Defense / Service Policy / API security event; get the event
// type, action and disposition, request context, and the specific reason it
// fired (signatures, violations, attack types, bot verdict, matched policy and
// rule, OpenAPI validation). Defensive decode. Pure and offline.
// ============================================================================

import { run } from "./compute";
import { GOLDEN_VECTOR_SET_ID } from "./golden-vectors";

export { explainSecurityEvent, run } from "./compute";
export type { SecEventView, EventType, Disposition, SigView, ViolView } from "./compute";
export { GOLDEN_VECTOR_SET_ID, verifyVectors, goldenVectors } from "./golden-vectors";

export { run as default };

export const manifest = Object.freeze({
  toolFamily: "F5 Distributed Cloud (XC)",
  toolSlug: "f5xc-security-event-explainer",
  canonicalAliases: ["xc-security-event", "f5xc-waf-event", "xc-sec-event-decoder", "f5xc-event-triage", "distributed-cloud-security-event"],
  inputDetectors: [],

  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["bounded-parse", "json-only"],
  shareSafetyDefault: "manual",

  learnLinks: ["learn/f5xc-security-events-anatomy"],
  sources: [
    {
      id: "xc-security-events-reference",
      label: "F5 Distributed Cloud: Security Events Reference (WAF / Bot Defense / Service Policy / API event fields)",
      type: "docs",
      url: "https://docs.cloud.f5.com/docs-v2/platform/reference/security-events-reference",
      access_date: "2026-07-11",
      scope: "verified field names and values: sec_event_type, action, calculated_action, signatures{id,name,accuracy,attack_type}, violations{name,context}, attack_types, bot_info/bot_defense, policy/policy_rule/result, policy_hits, oas_req_status, vh_name, req_id (mod 2026-07-01)",
      status: "active",
    },
    {
      id: "xc-ai-assistant-fields",
      label: "F5 Distributed Cloud: AI Assistant field reference (sec_event_type values, signatures.accuracy, bot_info.classification, violations, attack_types)",
      type: "docs",
      url: "https://docs.cloud.f5.com/docs-v2/ai-assistant/how-to/use-ai-assistant",
      access_date: "2026-07-11",
      scope: "sec_event_type examples (waf_sec_event, bot_defense_sec_event, svc_policy_sec_event, api_sec_event); violation and attack-type token forms",
      status: "active",
    },
    {
      id: "xc-waf-enforcement",
      label: "F5 Distributed Cloud: Create Web Application Firewall (enforcement mode blocking vs monitoring, signature staging)",
      type: "docs",
      url: "https://docs.cloud.f5.com/docs-v2/web-app-and-api-protection/how-to/app-security/application-firewall",
      access_date: "2026-07-11",
      scope: "why a signature can trigger yet not block (monitoring mode / staging), and the action-vs-recommended-action distinction",
      status: "active",
    },
  ],
  credits: [
    { handle: "f5-docs", display_name: "F5 Distributed Cloud documentation", role: "reference", public: true },
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});
