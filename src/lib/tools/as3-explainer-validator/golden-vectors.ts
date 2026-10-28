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
//
// SHARE VECTORS (2026-10-27, Share results): SHARE_VECTORS pin the copy a
// Share results link carries (shareableDeclaration in compute.ts) byte for
// byte: every value AS3's schema reference calls a secret replaced by
// "[redacted]", everything else as pasted, and the receiving page reading the
// same declaration (explainAs3 gives the same result for the copy as for the
// paste). The set id moved from as3-explainer-golden-v1 to
// as3-explainer-golden-2026-10-27 with them.
// ============================================================================

import { explainAs3, KNOWN_CLASSES, shareableDeclaration } from "./compute";
import { SHARE_REDACTED } from "./json-secrets"; // "[redacted]"

export const SET_ID = "as3-explainer-golden-2026-10-27"; // was as3-explainer-golden-v1 until the share vectors (2026-10-27)

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

// ---- share vectors (Share results, 2026-10-27) ------------------------------

/** One share vector: a paste, and the exact copy a link carries (or the secret name that leaves it without one). */
export interface ShareVector {
  /** A stable id. */
  readonly id: string;
  /** What it pins. */
  readonly description: string;
  /** The paste. */
  readonly input: string;
  /** The exact copy, or null when no copy may be made. */
  readonly expect: string | null;
  /** How many values the copy replaces (0 when there is no copy). */
  readonly redacted: number;
  /** For a paste with no copy: the secret name it mentions. */
  readonly blockedName?: string;
  /** Strings that must never be in the copy (the secrets themselves). */
  readonly secrets: readonly string[];
}

/** A Certificate with an inlined PEM key and an encrypted passphrase (AS3 Certificate: privateKey, passphrase). */
const CERT_DECL = {
  class: "ADC", schemaVersion: "3.50.0", id: "tls-share",
  Web: { class: "Tenant", App: { class: "Application", template: "https",
    service: { class: "Service_HTTPS", virtualAddresses: ["192.0.2.20"], pool: "web_pool", serverTLS: "webtls" },
    web_pool: { class: "Pool", members: [{ servicePort: 80, serverAddresses: ["192.0.2.21"] }] },
    webtls: { class: "TLS_Server", certificates: [{ certificate: "webcert" }] },
    webcert: { class: "Certificate", certificate: "-----BEGIN CERTIFICATE-----\nMIIBPUBLIC\n-----END CERTIFICATE-----", privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqh-FAKE-KEY-BODY\n-----END PRIVATE KEY-----", passphrase: { ciphertext: "c2VjcmV0LXBhc3NwaHJhc2U", protected: "eyJhbGciOiJkaXIiLCJlbmMiOiJub25lIn0", ignoreChanges: true } },
  } },
};
/** The same, as the link carries it. */
const CERT_COPY = { ...CERT_DECL, Web: { ...CERT_DECL.Web, App: { ...CERT_DECL.Web.App, webcert: { ...CERT_DECL.Web.App.webcert, privateKey: SHARE_REDACTED, passphrase: { ...CERT_DECL.Web.App.webcert.passphrase, ciphertext: SHARE_REDACTED } } } } };

/** Key material through pointer objects: base64 for the key and a PKCS #12 bundle; a bigip path stays. */
const POINTER_DECL = {
  class: "ADC", schemaVersion: "3.50.0",
  Pki: { class: "Tenant", App: { class: "Application",
    cert_inline: { class: "Certificate", certificate: { base64: "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t" }, privateKey: { base64: "LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tRkFLRQ" } },
    cert_bundle: { class: "Certificate", pkcs12: { base64: "MIIKFAKEPKCS12BUNDLE" }, pkcs12Options: { keyImportFormat: "pkcs8" } },
    cert_onbox: { class: "Certificate", certificate: { bigip: "/Common/default.crt" }, privateKey: { bigip: "/Common/default.key" } },
  } },
};
/** The same, as the link carries it. */
const POINTER_COPY = { ...POINTER_DECL, Pki: { ...POINTER_DECL.Pki, App: { ...POINTER_DECL.Pki.App, cert_inline: { ...POINTER_DECL.Pki.App.cert_inline, privateKey: { base64: SHARE_REDACTED } }, cert_bundle: { ...POINTER_DECL.Pki.App.cert_bundle, pkcs12: { base64: SHARE_REDACTED } } } } };

/** A full AS3 request aimed at another BIG-IP: its password and token header (AS3 class: targetPassphrase, targetTokens). */
const TARGET_REQ = {
  class: "AS3", action: "deploy", persist: true, targetHost: "192.0.2.50", targetUsername: "admin", targetPassphrase: "Adm1n-Pa55", targetTokens: { "X-F5-Auth-Token": "TOKEN0123456789ABCDEF" },
  declaration: { class: "ADC", schemaVersion: "3.50.0", Remote: { class: "Tenant", App: { class: "Application", template: "http", service: { class: "Service_HTTP", virtualAddresses: ["192.0.2.60"] } } } },
};
/** The same, as the link carries it. */
const TARGET_COPY = { ...TARGET_REQ, targetPassphrase: SHARE_REDACTED, targetTokens: { "X-F5-Auth-Token": SHARE_REDACTED } };

/** A bearer token fetching a WAF policy, and a monitor's encrypted passphrase (Resource_URL authentication, Monitor). */
const TOKEN_DECL = {
  class: "ADC", schemaVersion: "3.50.0",
  Sec: { class: "Tenant", App: { class: "Application",
    waf: { class: "WAF_Policy", url: { url: "https://policies.example.com/waf.json", authentication: { method: "bearer-token", token: "eyJhbGciOiJIUzI1NiJ9.FAKE.TOKEN" } } },
    mon: { class: "Monitor", monitorType: "http", send: "GET /health HTTP/1.1\r\nHost: app.example.com\r\n\r\n", username: "probe", passphrase: { ciphertext: "cHJvYmUtcGFzcw", protected: "eyJhbGciOiJkaXIiLCJlbmMiOiJub25lIn0" } },
  } },
};
/** The same, as the link carries it. */
const TOKEN_COPY = { ...TOKEN_DECL, Sec: { ...TOKEN_DECL.Sec, App: { ...TOKEN_DECL.Sec.App, waf: { ...TOKEN_DECL.Sec.App.waf, url: { ...TOKEN_DECL.Sec.App.waf.url, authentication: { method: "bearer-token", token: SHARE_REDACTED } } }, mon: { ...TOKEN_DECL.Sec.App.mon, passphrase: { ...TOKEN_DECL.Sec.App.mon.passphrase, ciphertext: SHARE_REDACTED } } } } };

/** Service Discovery credentials, minified, with an escaped quote and backslash inside a secret (AWS and Azure). */
const DISCOVERY_INPUT = '{"class":"ADC","schemaVersion":"3.50.0","Disc":{"class":"Tenant","App":{"class":"Application","web_pool":{"class":"Pool","members":[{"servicePort":443,"addressDiscovery":"aws","region":"us-west-2","tagKey":"app","tagValue":"web","accessKeyId":"AKIAIOSFODNN7EXAMPLE","secretAccessKey":"wJalrXUtnFEMI/K7MDENG\\"bPxRfiCY\\\\EXAMPLEKEY"},{"servicePort":443,"addressDiscovery":"azure","resourceGroup":"rg1","subscriptionId":"sub-1","directoryId":"dir-1","applicationId":"app-1","apiAccessKey":"azure-sp-secret","tagKey":"app","tagValue":"web"}]}}}}';
/** The copy, byte for byte: only the two secret tokens differ. */
const DISCOVERY_EXPECT = '{"class":"ADC","schemaVersion":"3.50.0","Disc":{"class":"Tenant","App":{"class":"Application","web_pool":{"class":"Pool","members":[{"servicePort":443,"addressDiscovery":"aws","region":"us-west-2","tagKey":"app","tagValue":"web","accessKeyId":"AKIAIOSFODNN7EXAMPLE","secretAccessKey":"[redacted]"},{"servicePort":443,"addressDiscovery":"azure","resourceGroup":"rg1","subscriptionId":"sub-1","directoryId":"dir-1","applicationId":"app-1","apiAccessKey":"[redacted]","tagKey":"app","tagValue":"web"}]}}}}';

/** Pretty-printed as the AS3 user guide prints declarations. */
const pretty = (x: unknown): string => JSON.stringify(x, null, 2); // two-space indent

/** The share vectors. */
export const SHARE_VECTORS: readonly ShareVector[] = [
  { id: "share-sample-unchanged", description: "F5's Sample_02 holds no secret: the copy is the paste, nothing replaced", input: SAMPLE_HTTPS, expect: SAMPLE_HTTPS, redacted: 0, secrets: [] },
  { id: "share-certificate-key-and-passphrase", description: "an inlined PEM privateKey and a passphrase's ciphertext are replaced; protected and the certificate stay", input: pretty(CERT_DECL), expect: pretty(CERT_COPY), redacted: 2, secrets: ["MIIEvQIBADANBgkqh-FAKE-KEY-BODY", "c2VjcmV0LXBhc3NwaHJhc2U"] },
  { id: "share-pointer-objects", description: "privateKey and pkcs12 given as base64 pointers are replaced; a bigip path and the certificate's base64 stay", input: pretty(POINTER_DECL), expect: pretty(POINTER_COPY), redacted: 2, secrets: ["LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tRkFLRQ", "MIIKFAKEPKCS12BUNDLE"] },
  { id: "share-request-target-credentials", description: "an AS3 request's targetPassphrase and targetTokens values are replaced; targetHost and targetUsername stay", input: pretty(TARGET_REQ), expect: pretty(TARGET_COPY), redacted: 2, secrets: ["Adm1n-Pa55", "TOKEN0123456789ABCDEF"] },
  { id: "share-bearer-token-and-monitor", description: "a Resource_URL bearer token and a monitor passphrase's ciphertext are replaced; the send string goes as pasted", input: pretty(TOKEN_DECL), expect: pretty(TOKEN_COPY), redacted: 2, secrets: ["eyJhbGciOiJIUzI1NiJ9.FAKE.TOKEN", "cHJvYmUtcGFzcw"] },
  { id: "share-discovery-minified", description: "AWS secretAccessKey (with an escaped quote and backslash) and Azure apiAccessKey are replaced byte for byte in minified JSON; accessKeyId stays", input: DISCOVERY_INPUT, expect: DISCOVERY_EXPECT, redacted: 2, secrets: ["wJalrXUtnFEMI", "EXAMPLEKEY", "azure-sp-secret"] },
  { id: "share-copy-is-stable", description: "a copy shared again is unchanged, and nothing is counted twice", input: pretty(CERT_COPY), expect: pretty(CERT_COPY), redacted: 0, secrets: [] },
  { id: "share-unparsed-with-secret", description: "text that is not JSON and names a passphrase gets no copy", input: '{ "class": "ADC", "T": { "class": "Tenant", "cert": { "passphrase": { "ciphertext": "c2VjcmV0" } ', expect: null, redacted: 0, blockedName: "passphrase", secrets: [] },
  { id: "share-unparsed-clean", description: "text that is not JSON and names no secret goes as typed (the page shows its parse error)", input: '{ "class": "AS3", ', expect: '{ "class": "AS3", ', redacted: 0, secrets: [] },
];

/**
 * Check one share vector: the exact copy and count, no secret in it, and the same reading on the receiving page.
 * @param v the vector
 * @returns null, or what failed
 */
function checkShare(v: ShareVector): string | null {
  const got = shareableDeclaration(v.input); // the engine
  if (v.expect === null) return expect(!got.ok && got.name === v.blockedName, `expected no copy (${v.blockedName}), got ${JSON.stringify(got).slice(0, 120)}`); // no link
  if (!got.ok) return `expected a copy, got none (${got.name})`; // a copy was due
  return (
    expect(got.text === v.expect, `copy differs: ${JSON.stringify(got.text).slice(0, 160)}`) ?? // byte for byte
    expect(got.redacted === v.redacted, `redacted=${got.redacted}, expected ${v.redacted}`) ?? // the count the popover shows
    expect(v.secrets.every((x) => !got.text.includes(x)), "a secret is still in the copy") ?? // never carried
    expect(JSON.stringify(explainAs3(got.text)) === JSON.stringify(explainAs3(v.input)), "the receiving page would read it differently") // the same reading
  );
} // checkShare

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
  // The share vectors (2026-10-27), each guarded like the others.
  for (const v of SHARE_VECTORS) {
    let msg: string | null; // the failure, if any
    try {
      msg = checkShare(v); // the check
    } catch (e) {
      msg = e instanceof Error ? e.message : String(e); // a throw is a failure
    } // try
    if (msg) failures.push(`${v.id}: ${msg}`); // recorded
  } // share vectors
  return { ok: failures.length === 0, failures };
}
