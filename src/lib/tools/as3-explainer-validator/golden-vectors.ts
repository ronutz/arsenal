// ============================================================================
// src/lib/tools/as3-explainer-validator/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors for the AS3 declaration explainer. The positive cases use
// F5's OWN example declarations from the AS3 user guide (the Sample_02 HTTPS
// declaration and an HTTP one), so the parse and the class recognition are
// pinned to shapes F5 publishes. The validation cases pin the documented
// structural rules: AS3-vs-ADC detection, the schemaVersion requirement, the
// Tenant/Application minimum, and the template/service-class matching rule.
// Checks assert on the derived result, never on internal representation.
// ============================================================================

import { explainAs3, KNOWN_CLASSES } from "./compute";

export const SET_ID = "as3-explainer-golden-v1";

interface Vector {
  readonly id: string;
  readonly description: string;
  readonly check: () => string | null;
}
function expect(cond: boolean, msg: string): string | null {
  return cond ? null : msg;
}

// F5's Sample_02 HTTPS declaration (AS3 user guide, "Getting Started Examples").
const SAMPLE_HTTPS = JSON.stringify({
  class: "AS3",
  action: "deploy",
  persist: true,
  declaration: {
    class: "ADC",
    schemaVersion: "3.0.0",
    id: "123abc",
    label: "Sample 2",
    remark: "HTTPS with predictive-node pool",
    Sample_02: {
      class: "Tenant",
      A1: {
        class: "Application",
        service: { class: "Service_HTTPS", virtualAddresses: ["192.0.2.11"], pool: "web_pool", serverTLS: "webtls" },
        web_pool: { class: "Pool", loadBalancingMode: "predictive-node", monitors: ["http"], members: [{ servicePort: 80, serverAddresses: ["192.0.2.12", "192.0.2.13"] }] },
        webtls: { class: "TLS_Server", certificates: [{ certificate: "webcert" }] },
        webcert: { class: "Certificate", certificate: "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----" },
      },
    },
  },
});

export const VECTORS: readonly Vector[] = [
  {
    id: "as3-request-detected",
    description: "Sample_02 HTTPS parses as an AS3 request with action=deploy, persist=true",
    check: () => {
      const r = explainAs3(SAMPLE_HTTPS);
      return (
        expect(r !== null && r.kind === "as3-request", `kind=${r?.kind}`) ??
        expect(r!.request?.action === "deploy", `action=${r!.request?.action}`) ??
        expect(r!.request?.persist === true, `persist=${r!.request?.persist}`) ??
        expect(r!.request?.hasDeclaration === true, "declaration not seen")
      );
    },
  },
  {
    id: "adc-metadata-read",
    description: "the ADC schemaVersion, id, label, and remark are extracted",
    check: () => {
      const r = explainAs3(SAMPLE_HTTPS);
      return (
        expect(r!.adc?.schemaVersion === "3.0.0", `schemaVersion=${r!.adc?.schemaVersion}`) ??
        expect(r!.adc?.id === "123abc" && r!.adc?.label === "Sample 2", "id/label wrong") ??
        expect(r!.adc?.remark === "HTTPS with predictive-node pool", "remark wrong")
      );
    },
  },
  {
    id: "tenant-app-tree",
    description: "the Tenant -> Application -> resource tree is walked with classes recognized",
    check: () => {
      const r = explainAs3(SAMPLE_HTTPS);
      const t = r!.tenants[0];
      const a = t?.applications[0];
      const classes = a?.objects.map((o) => o.className) ?? [];
      return (
        expect(t?.name === "Sample_02", `tenant=${t?.name}`) ??
        expect(a?.name === "A1", `app=${a?.name}`) ??
        expect(classes.includes("Service_HTTPS") && classes.includes("Pool") && classes.includes("TLS_Server") && classes.includes("Certificate"), `classes=${classes.join(",")}`) ??
        expect(a!.templateDefaulted === true && a!.template === "generic", "generic default not applied")
      );
    },
  },
  {
    id: "stats-counted",
    description: "stats count tenants, applications, services, and pools",
    check: () => {
      const r = explainAs3(SAMPLE_HTTPS);
      return (
        expect(r!.stats.tenants === 1 && r!.stats.applications === 1, `t=${r!.stats.tenants} a=${r!.stats.applications}`) ??
        expect(r!.stats.services === 1 && r!.stats.pools === 1, `svc=${r!.stats.services} pool=${r!.stats.pools}`)
      );
    },
  },
  {
    id: "adc-only-detected",
    description: "an ADC-only declaration (no AS3 class) is detected and flagged",
    check: () => {
      const input = JSON.stringify({
        class: "ADC",
        schemaVersion: "3.18.0",
        id: "x",
        T1: { class: "Tenant", App: { class: "Application", template: "generic", svc: { class: "Service_TCP", virtualAddresses: ["1.2.3.4"], virtualPort: 100 } } },
      });
      const r = explainAs3(input);
      return (
        expect(r !== null && r.kind === "adc-only", `kind=${r?.kind}`) ??
        expect(r!.findings.some((f) => f.kind === "adc-only"), "missing adc-only finding") ??
        expect(r!.request === null, "request should be null for ADC-only")
      );
    },
  },
  {
    id: "template-service-mismatch-flagged",
    description: "template http without a Service_HTTP named service is flagged",
    check: () => {
      const input = JSON.stringify({
        class: "ADC",
        schemaVersion: "3.0.0",
        T1: { class: "Tenant", App: { class: "Application", template: "http", web_pool: { class: "Pool", members: [] } } },
      });
      const r = explainAs3(input);
      return expect(
        r !== null && r.findings.some((f) => f.kind === "template-service-mismatch" && f.needs === "Service_HTTP"),
        "template-service-mismatch not flagged",
      );
    },
  },
  {
    id: "template-http-satisfied",
    description: "template http WITH a Service_HTTP is accepted (no mismatch)",
    check: () => {
      const input = JSON.stringify({
        class: "ADC",
        schemaVersion: "3.0.0",
        T1: { class: "Tenant", App: { class: "Application", template: "http", service: { class: "Service_HTTP", virtualAddresses: ["1.1.1.1"] } } },
      });
      const r = explainAs3(input);
      return expect(!r!.findings.some((f) => f.kind === "template-service-mismatch"), "false mismatch flagged");
    },
  },
  {
    id: "missing-schema-version-flagged",
    description: "an ADC declaration without schemaVersion is flagged",
    check: () => {
      const input = JSON.stringify({ class: "ADC", T1: { class: "Tenant", App: { class: "Application", s: { class: "Service_HTTP" } } } });
      const r = explainAs3(input);
      return expect(r!.findings.some((f) => f.kind === "missing-schema-version"), "missing-schema-version not flagged");
    },
  },
  {
    id: "no-tenant-flagged",
    description: "an ADC declaration with no Tenant is flagged",
    check: () => {
      const r = explainAs3(JSON.stringify({ class: "ADC", schemaVersion: "3.0.0", id: "x" }));
      return expect(r!.findings.some((f) => f.kind === "no-tenant"), "no-tenant not flagged");
    },
  },
  {
    id: "reserved-names-ok",
    description: "reserved names Common / Shared / service do not trip the name check",
    check: () => {
      const input = JSON.stringify({
        class: "ADC",
        schemaVersion: "3.0.0",
        Common: { class: "Tenant", Shared: { class: "Application", template: "shared", service: { class: "Service_HTTP", virtualAddresses: ["1.1.1.1"] } } },
      });
      const r = explainAs3(input);
      return expect(!r!.findings.some((f) => f.kind === "invalid-name"), "reserved name wrongly flagged invalid");
    },
  },
  {
    id: "not-as3-detected",
    description: "plain JSON that is not an AS3 or ADC document is reported as such",
    check: () => {
      const r = explainAs3(JSON.stringify({ hello: "world" }));
      return expect(r !== null && r.kind === "not-as3" && r.findings.some((f) => f.kind === "not-as3"), "not-as3 not detected");
    },
  },
  {
    id: "parse-error-safe",
    description: "malformed JSON yields a parse-error finding, never a throw",
    check: () => {
      const r = explainAs3('{ "class": "AS3", ');
      return expect(r !== null && r.findings.some((f) => f.kind === "parse-error"), "parse-error not reported");
    },
  },
  {
    id: "catalog-has-core-classes",
    description: "the class catalog includes the core service, pool, TLS, and WAF classes",
    check: () =>
      expect(
        ["Service_HTTP", "Service_HTTPS", "Pool", "Monitor", "TLS_Server", "TLS_Client", "WAF_Policy"].every((c) => KNOWN_CLASSES.includes(c)),
        "catalog missing a core class",
      ),
  },
];

export function verifyVectors(): { ok: boolean; failures: string[] } {
  const failures: string[] = [];
  for (const v of VECTORS) {
    let msg: string | null;
    try {
      msg = v.check();
    } catch (e) {
      msg = e instanceof Error ? e.message : String(e);
    }
    if (msg) failures.push(`${v.id}: ${msg}`);
  }
  return { ok: failures.length === 0, failures };
}
