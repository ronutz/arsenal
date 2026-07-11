// ============================================================================
// src/lib/tools/f5xc-security-event-explainer/compute.ts
// ----------------------------------------------------------------------------
// Deterministic decoder for an F5 Distributed Cloud (XC) security event
// (WAF / Bot Defense / Service Policy / API). Pure, offline.
//
// Paste a security-event JSON (from the Console security-events page "JSON"
// view, a global log receiver, or the API) and it decodes: the event type and
// name, the action taken (and the recommended action / policy result), the
// request context, and the "why" - WAF signatures and violations and attack
// types, the bot classification, the service-policy and rule that matched, or
// the API OpenAPI validation and policy hits.
//
// Field names verified 2026-07-11 against F5's Security Events Reference
// (docs.cloud.f5.com/docs-v2/platform/reference/security-events-reference,
// last modified 2026-07-01) and the AI-Assistant field list.
// ============================================================================

export type EventType = "waf" | "bot" | "svc_policy" | "api" | "unknown";
export type Disposition = "blocked" | "reported" | "allowed" | "unknown";

export interface SigView {
  id?: string;
  name?: string;
  accuracy?: string;
  attackType?: string;
}
export interface ViolView {
  name?: string;
  context?: string;
}

export interface SecEventView {
  ok: boolean;
  error?: string;
  recognized: boolean;
  eventType: EventType;
  eventName?: string;
  action?: string;
  recommended?: string;
  result?: string;
  disposition: Disposition;
  request: { method?: string; host?: string; path?: string; srcIp?: string; lb?: string; lbType?: string; namespace?: string; reqId?: string; time?: string };
  waf?: { signatures: SigView[]; violations: ViolView[]; attackTypes: string[]; botClassification?: string };
  bot?: { insight?: string; automationType?: string; recommendation?: string };
  svcPolicy?: { policy?: string; rule?: string; set?: string; rateLimiter?: string; maliciousUser?: string };
  api?: { policy?: string; rule?: string; result?: string; oasReq?: string; oasRsp?: string; signatures: SigView[]; violations: ViolView[] };
  notes: string[];
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function s(v: unknown): string | undefined {
  if (typeof v === "string") return v.trim() === "" ? undefined : v;
  if (typeof v === "number") return String(v);
  return undefined;
}
/** First present, non-empty string among the given keys. */
function pick(o: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = s(o[k]);
    if (v !== undefined) return v;
  }
  return undefined;
}

function decodeSignatures(v: unknown): SigView[] {
  if (!Array.isArray(v)) return [];
  return v.filter(isObj).map((e) => ({
    id: pick(e, "id"),
    name: pick(e, "name", "id_name"),
    accuracy: pick(e, "accuracy"),
    attackType: pick(e, "attack_type"),
  }));
}
function decodeViolations(v: unknown): ViolView[] {
  if (!Array.isArray(v)) return [];
  return v.filter(isObj).map((e) => ({ name: pick(e, "name"), context: pick(e, "context") }));
}
function stringList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => s(x)).filter((x): x is string => x !== undefined);
  const one = s(v);
  return one ? one.split(",").map((t) => t.trim()).filter(Boolean) : [];
}

const TYPE_FROM_TAG: Record<string, EventType> = {
  waf_sec_event: "waf",
  bot_defense_sec_event: "bot",
  svc_policy_sec_event: "svc_policy",
  api_sec_event: "api",
};

function classifyType(o: Record<string, unknown>): EventType {
  const tag = pick(o, "sec_event_type");
  if (tag) {
    const t = TYPE_FROM_TAG[tag.toLowerCase()];
    if (t) return t;
  }
  // infer from shape
  if (isObj(o.bot_defense)) return "bot";
  if (o.policy_hits !== undefined || pick(o, "oas_req_status", "oas_rsp_status")) return "api";
  if (Array.isArray(o.signatures) || Array.isArray(o.violations) || Array.isArray(o.attack_types)) return "waf";
  if (pick(o, "policy", "policy_rule", "result")) return "svc_policy";
  return "unknown";
}

function dispositionOf(...vals: (string | undefined)[]): Disposition {
  const joined = vals.filter(Boolean).join(" ").toLowerCase();
  if (/(block|deny)/.test(joined)) return "blocked";
  if (/(report|alert|alarm|challenge|redirect)/.test(joined)) return "reported";
  if (/(allow|pass)/.test(joined)) return "allowed";
  return "unknown";
}

/** Locate the event object across common envelopes. */
function locate(root: unknown): Record<string, unknown> | null {
  if (typeof root === "object" && root !== null) {
    if (isObj(root)) {
      // Sekoia-style { message: "<json string>" }
      if (typeof root.message === "string") {
        try {
          const inner = JSON.parse(root.message);
          if (isObj(inner)) return inner;
        } catch {
          /* fall through */
        }
      }
      if (Array.isArray(root.events) && root.events.length && isObj(root.events[0])) return root.events[0] as Record<string, unknown>;
      return root;
    }
    if (Array.isArray(root) && root.length && isObj(root[0])) return root[0] as Record<string, unknown>;
  }
  return null;
}

export function explainSecurityEvent(text: string): SecEventView {
  const empty: SecEventView = { ok: false, recognized: false, eventType: "unknown", disposition: "unknown", request: {}, notes: [] };
  const t = text.trim();
  if (t === "") return { ...empty, error: "Paste an F5XC security-event JSON." };

  let root: unknown;
  try {
    root = JSON.parse(t);
  } catch {
    return { ...empty, error: "That is not valid JSON. Paste the security event from the Console (JSON view) or the API." };
  }

  const o = locate(root);
  if (!o) return { ...empty, ok: true, notes: ["no security-event object found - paste an event, an { events: [...] } page, or a { message } envelope"] };

  const eventType = classifyType(o);
  const action = pick(o, "action");
  const result = pick(o, "result");
  const recommended = pick(o, "calculated_action", "recommended_action");

  const request = {
    method: pick(o, "method"),
    host: pick(o, "authority", "domain"),
    path: pick(o, "req_path", "original_path", "api_endpoint", "uri"),
    srcIp: pick(o, "src_ip", "src"),
    lb: pick(o, "vh_name"),
    lbType: pick(o, "vh_type"),
    namespace: pick(o, "namespace"),
    reqId: pick(o, "req_id", "support_id"),
    time: pick(o, "time", "@timestamp"),
  };

  const view: SecEventView = {
    ok: true,
    recognized: eventType !== "unknown" || Object.values(request).some(Boolean),
    eventType,
    eventName: pick(o, "sec_event_name"),
    action,
    recommended,
    result,
    disposition: dispositionOf(action, result),
    request,
    notes: [],
  };

  if (eventType === "waf") {
    const botClass = isObj(o.bot_info) ? pick(o.bot_info, "classification") : undefined;
    view.waf = {
      signatures: decodeSignatures(o.signatures),
      violations: decodeViolations(o.violations),
      attackTypes: stringList(o.attack_types),
      botClassification: botClass && botClass.toUpperCase() !== "UNKNOWN" ? botClass : undefined,
    };
  } else if (eventType === "bot") {
    const bd = isObj(o.bot_defense) ? o.bot_defense : {};
    view.bot = { insight: pick(bd, "insight"), automationType: pick(bd, "automation_type"), recommendation: pick(bd, "recommendation") };
    view.disposition = dispositionOf(action, pick(bd, "recommendation"));
  } else if (eventType === "svc_policy") {
    view.svcPolicy = {
      policy: pick(o, "policy"),
      rule: pick(o, "policy_rule"),
      set: pick(o, "policy_set"),
      rateLimiter: pick(o, "rate_limiter_action"),
      maliciousUser: pick(o, "malicious_user_mitigation_action"),
    };
    view.disposition = dispositionOf(action, result);
  } else if (eventType === "api") {
    const ph = isObj(o.policy_hits) ? o.policy_hits : {};
    view.api = {
      policy: pick(ph, "policy") ?? pick(o, "policy"),
      rule: pick(ph, "policy_rule") ?? pick(o, "policy_rule"),
      result: pick(ph, "result") ?? result,
      oasReq: pick(o, "oas_req_status"),
      oasRsp: pick(o, "oas_rsp_status"),
      signatures: decodeSignatures(o.signatures),
      violations: decodeViolations(o.violations),
    };
    view.disposition = dispositionOf(action, view.api.result, recommended);
  }

  if (view.disposition === "blocked" && (request.reqId ?? "") !== "") view.notes.push("quote the request/support id when opening a case or building an allow-list exception");

  return view;
}

/** D-49 run entrypoint: a JSON string. */
export function run(input: string): SecEventView {
  return explainSecurityEvent(input);
}
