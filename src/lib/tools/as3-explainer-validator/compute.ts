// ============================================================================
// src/lib/tools/as3-explainer-validator/compute.ts
// ----------------------------------------------------------------------------
// F5 BIG-IP AS3 (Application Services 3 Extension) DECLARATION EXPLAINER +
// STRUCTURAL VALIDATOR (arsenal-local, pure, deterministic).
//
// Paste an AS3 declaration (the JSON you POST to /mgmt/shared/appsvcs/declare)
// and this reads it back to you: whether it is a full AS3 request or an
// ADC-only declaration, the top-level options, and the Tenant -> Application
// -> resource tree with every class named and explained. It also checks the
// STRUCTURAL rules F5 documents (a top-level AS3 or ADC class, a schemaVersion,
// at least one Tenant containing at least one Application containing at least
// one resource, and the template/service-class matching rule), and flags
// reserved names and out-of-spec object names.
//
// SCOPE. This is a structure explainer and sanity checker, not a full
// JSON-Schema validator: it does not reproduce the entire AS3 schema or check
// every property, so a declaration that passes here can still be rejected by
// AS3 itself. It never contacts a BIG-IP and never fetches; same input always
// yields the same output (D-49).
//
// GROUNDING (see index.ts `sources`): the class model, the AS3-vs-ADC
// distinction, the Tenant-as-partition rule, the template/service-class
// matching rule (http/https/tcp/udp/l4 require a matching Service_* named
// `service`, formerly `serviceMain`), the `generic` default from AS3 3.20, the
// reserved names (Common, Shared, service, constants), and the 1-64
// alphanumeric name rule are all from F5's AS3 user guide and schema reference.
// ============================================================================

const MAX_INPUT = 200_000; // generous; declarations are JSON, not payloads

export type DocKind = "as3-request" | "adc-only" | "not-as3";

/** A class known to the AS3 schema, with a plain-language explanation. */
interface ClassInfo {
  readonly category: ObjectCategory;
  readonly explain: string;
}
export type ObjectCategory =
  | "service"
  | "pool"
  | "monitor"
  | "tls"
  | "security"
  | "policy"
  | "persistence"
  | "network"
  | "irule"
  | "other";

// The AS3 templates and their required service class (when not generic/shared).
const TEMPLATE_SERVICE: Record<string, string> = {
  http: "Service_HTTP",
  https: "Service_HTTPS",
  tcp: "Service_TCP",
  udp: "Service_UDP",
  l4: "Service_L4",
};
const TEMPLATES_NO_REQUIREMENT = new Set(["generic", "shared"]);

// Catalog of common AS3 resource classes. Explanations are paraphrased from
// F5's schema reference; the list is representative, not exhaustive.
const CLASS_CATALOG: Record<string, ClassInfo> = {
  Service_HTTP: { category: "service", explain: "an HTTP virtual server (Layer 7, no TLS)" },
  Service_HTTPS: { category: "service", explain: "an HTTPS virtual server (HTTP with TLS termination)" },
  Service_TCP: { category: "service", explain: "a TCP virtual server (Layer 4)" },
  Service_UDP: { category: "service", explain: "a UDP virtual server (Layer 4)" },
  Service_L4: { category: "service", explain: "a fast Layer 4 virtual server (FastL4)" },
  Service_SCTP: { category: "service", explain: "an SCTP virtual server" },
  Service_Generic: { category: "service", explain: "a generic virtual server with no protocol requirements" },
  Service_Forwarding: { category: "service", explain: "a forwarding virtual server (IP or L2)" },
  Service_Address: { category: "network", explain: "a virtual address with its own settings (ARP, route advertisement)" },
  Pool: { category: "pool", explain: "a load-balancing pool of backend members" },
  Monitor: { category: "monitor", explain: "a custom health monitor" },
  Persist: { category: "persistence", explain: "a persistence (session-stickiness) profile" },
  TLS_Server: { category: "tls", explain: "server-side TLS: the profile clients connect to (a Client SSL profile on BIG-IP)" },
  TLS_Client: { category: "tls", explain: "client-side TLS: how BIG-IP connects to the pool (a Server SSL profile on BIG-IP)" },
  Certificate: { category: "tls", explain: "an X.509 certificate and its private key" },
  CA_Bundle: { category: "tls", explain: "a bundle of trusted CA certificates" },
  WAF_Policy: { category: "security", explain: "an Advanced WAF (ASM) security policy attached to the service" },
  Endpoint_Policy: { category: "policy", explain: "a Local Traffic (LTM) policy of rules and actions" },
  iRule: { category: "irule", explain: "a Tcl iRule attached to the service" },
  SNAT_Pool: { category: "network", explain: "a pool of translation addresses for source NAT" },
  Firewall_Policy: { category: "security", explain: "an AFM firewall policy" },
  Firewall_Rule_List: { category: "security", explain: "an AFM firewall rule list" },
  Log_Publisher: { category: "other", explain: "a log publisher routing logs to destinations" },
  Analytics_Profile: { category: "other", explain: "an analytics (AVR) profile" },
};

// Keys that are ADC-level metadata, not tenants.
const ADC_META = new Set(["class", "schemaVersion", "id", "label", "remark", "controls", "updateMode", "constants", "scratch", "target", "Common"]);
// Keys that are Tenant-level metadata, not applications.
const TENANT_META = new Set(["class", "controls", "constants", "enable", "label", "remark", "optimisticLockKey", "defaultRouteDomain", "verifiers"]);
// Keys that are Application-level metadata, not resources.
const APP_META = new Set(["class", "template", "constants", "enable", "label", "remark", "schemaOverlay"]);

// AS3 reserved names.
const RESERVED_TENANT = "Common";
const RESERVED_APPLICATION = "Shared";
const RESERVED_SERVICE = "service";

const NAME_RE = /^[A-Za-z][A-Za-z0-9_]{0,63}$/; // 1-64, starts with a letter

// ---------------------------------------------------------------------------
// Result shapes.
// ---------------------------------------------------------------------------
export interface ObjectInfo {
  readonly name: string;
  readonly className: string;
  readonly category: ObjectCategory;
  readonly explain: string;
  /** True if the class is not in the catalog (still reported as present). */
  readonly unknown: boolean;
}
export interface AppInfo {
  readonly name: string;
  readonly isShared: boolean;
  readonly template: string | null;
  readonly templateDefaulted: boolean; // generic default (3.20+) when absent
  readonly objects: readonly ObjectInfo[];
}
export interface TenantInfo {
  readonly name: string;
  readonly isCommon: boolean;
  readonly applications: readonly AppInfo[];
}
export type Finding =
  | { kind: "parse-error"; detail: string }
  | { kind: "not-as3" }
  | { kind: "adc-only" }
  | { kind: "missing-schema-version" }
  | { kind: "no-tenant" }
  | { kind: "empty-tenant"; tenant: string }
  | { kind: "empty-application"; tenant: string; app: string }
  | { kind: "template-service-mismatch"; tenant: string; app: string; template: string; needs: string }
  | { kind: "invalid-name"; name: string; where: string }
  | { kind: "reserved-name"; name: string; role: string };

export interface RequestInfo {
  readonly action: string;
  readonly persist: boolean | null;
  readonly hasDeclaration: boolean;
}
export interface AdcInfo {
  readonly schemaVersion: string | null;
  readonly id: string | null;
  readonly label: string | null;
  readonly remark: string | null;
  readonly hasControls: boolean;
}
export interface As3Stats {
  readonly tenants: number;
  readonly applications: number;
  readonly services: number;
  readonly pools: number;
  readonly otherObjects: number;
}
export interface As3Result {
  readonly kind: DocKind;
  readonly request: RequestInfo | null;
  readonly adc: AdcInfo | null;
  readonly tenants: readonly TenantInfo[];
  readonly findings: readonly Finding[];
  readonly stats: As3Stats;
}

function isObj(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object" && !Array.isArray(x);
}
function str(x: unknown): string | null {
  return typeof x === "string" ? x : null;
}

// ---------------------------------------------------------------------------
// Entry point.
// ---------------------------------------------------------------------------
export function explainAs3(input: string): As3Result | null {
  const raw = input.trim();
  if (!raw) return null;
  const clipped = raw.length > MAX_INPUT ? raw.slice(0, MAX_INPUT) : raw;

  let doc: unknown;
  try {
    doc = JSON.parse(clipped);
  } catch (e) {
    return emptyResult("not-as3", [{ kind: "parse-error", detail: e instanceof Error ? e.message : String(e) }]);
  }
  if (!isObj(doc)) {
    return emptyResult("not-as3", [{ kind: "not-as3" }]);
  }

  const topClass = str(doc.class);
  const findings: Finding[] = [];

  // Locate the ADC declaration: either doc is the AS3 request (has .declaration)
  // or doc is the ADC declaration itself.
  let request: RequestInfo | null = null;
  let adcObj: Record<string, unknown> | null = null;
  let kind: DocKind;

  if (topClass === "AS3") {
    kind = "as3-request";
    const decl = doc.declaration;
    request = {
      action: str(doc.action) ?? "deploy", // AS3 default action is deploy
      persist: typeof doc.persist === "boolean" ? doc.persist : null,
      hasDeclaration: isObj(decl),
    };
    adcObj = isObj(decl) ? decl : null;
  } else if (topClass === "ADC") {
    kind = "adc-only";
    adcObj = doc;
    findings.push({ kind: "adc-only" });
  } else {
    // Not an AS3 or ADC document.
    return emptyResult("not-as3", [{ kind: "not-as3" }]);
  }

  if (!adcObj) {
    return {
      kind,
      request,
      adc: null,
      tenants: [],
      findings: [...findings, { kind: "no-tenant" }],
      stats: zeroStats(),
    };
  }

  // ADC-level metadata.
  const schemaVersion = str(adcObj.schemaVersion);
  const adc: AdcInfo = {
    schemaVersion,
    id: str(adcObj.id),
    label: str(adcObj.label),
    remark: str(adcObj.remark),
    hasControls: isObj(adcObj.controls),
  };
  if (!schemaVersion) findings.push({ kind: "missing-schema-version" });

  // Walk tenants.
  const tenants: TenantInfo[] = [];
  let appCount = 0;
  let serviceCount = 0;
  let poolCount = 0;
  let otherCount = 0;

  for (const [tName, tVal] of Object.entries(adcObj)) {
    if (ADC_META.has(tName)) continue;
    if (!isObj(tVal) || str(tVal.class) !== "Tenant") continue;

    const isCommon = tName === RESERVED_TENANT;
    if (!isCommon && !NAME_RE.test(tName)) findings.push({ kind: "invalid-name", name: tName, where: "tenant" });

    const apps: AppInfo[] = [];
    for (const [aName, aVal] of Object.entries(tVal)) {
      if (TENANT_META.has(aName)) continue;
      if (!isObj(aVal) || str(aVal.class) !== "Application") continue;

      const isShared = aName === RESERVED_APPLICATION;
      if (!isShared && !NAME_RE.test(aName)) findings.push({ kind: "invalid-name", name: aName, where: "application" });

      const templateRaw = str(aVal.template);
      const template = templateRaw ?? "generic";
      const templateDefaulted = templateRaw === null;

      // Resources within the application.
      const objects: ObjectInfo[] = [];
      let hasMatchingService = false;
      const needsService = templateRaw !== null && !TEMPLATES_NO_REQUIREMENT.has(templateRaw) && TEMPLATE_SERVICE[templateRaw];

      for (const [oName, oVal] of Object.entries(aVal)) {
        if (APP_META.has(oName)) continue;
        if (!isObj(oVal)) continue;
        const cls = str(oVal.class);
        if (!cls) continue;

        const info = CLASS_CATALOG[cls];
        const category = info?.category ?? "other";
        const explain = info?.explain ?? "an AS3 object";
        objects.push({ name: oName, className: cls, category, explain, unknown: !info });

        if (category === "service") serviceCount++;
        else if (category === "pool") poolCount++;
        else otherCount++;

        // Track template/service matching.
        if (needsService && cls === TEMPLATE_SERVICE[templateRaw!]) hasMatchingService = true;

        // Name checks for resources (service is reserved-ok).
        if (oName !== RESERVED_SERVICE && !NAME_RE.test(oName)) {
          findings.push({ kind: "invalid-name", name: oName, where: `${tName}/${aName}` });
        }
      }

      if (objects.length === 0) findings.push({ kind: "empty-application", tenant: tName, app: aName });
      if (needsService && !hasMatchingService) {
        findings.push({ kind: "template-service-mismatch", tenant: tName, app: aName, template: templateRaw!, needs: TEMPLATE_SERVICE[templateRaw!] });
      }

      apps.push({ name: aName, isShared, template, templateDefaulted, objects });
      appCount++;
    }

    if (apps.length === 0) findings.push({ kind: "empty-tenant", tenant: tName });
    tenants.push({ name: tName, isCommon, applications: apps });
  }

  if (tenants.length === 0) findings.push({ kind: "no-tenant" });

  return {
    kind,
    request,
    adc,
    tenants,
    findings,
    stats: { tenants: tenants.length, applications: appCount, services: serviceCount, pools: poolCount, otherObjects: otherCount },
  };
}

function zeroStats(): As3Stats {
  return { tenants: 0, applications: 0, services: 0, pools: 0, otherObjects: 0 };
}
function emptyResult(kind: DocKind, findings: Finding[]): As3Result {
  return { kind, request: null, adc: null, tenants: [], findings, stats: zeroStats() };
}

/** The set of catalog classes, for the reference view and tests. */
export const KNOWN_CLASSES = Object.freeze(Object.keys(CLASS_CATALOG));
export { TEMPLATE_SERVICE, TEMPLATES_NO_REQUIREMENT };
