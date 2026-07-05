// ============================================================================
// src/lib/tools/do-explainer-validator/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors for the DO (Declarative Onboarding) declaration explainer.
// The positive cases use F5's OWN example declarations from the DO docs (the
// standalone standalone-BIG-IP composing example and the HA cluster example),
// so the parse and class recognition are pinned to shapes F5 publishes. The
// validation cases pin the documented structural rules and gotchas: the
// DO-request-vs-bare-Device distinction, the schemaVersion requirement, the
// mandatory Common tenant name, the hostname mutual-exclusion between Common
// and System, the DO 1.36 allowService default change, the root oldPassword
// requirement, and the async-returns-202 note. Checks assert on the derived
// result, never on internal representation.
//
// Source: clouddocs.f5.com/products/extensions/f5-declarative-onboarding/latest
// (composing-a-declaration.html and clustering.html), DO 1.47.0, fetched
// 2026-07-05.
// ============================================================================

import { explainDo, KNOWN_CLASSES } from "./compute";

export const SET_ID = "do-explainer-golden-v1";

interface Vector {
  readonly id: string;
  readonly description: string;
  readonly check: () => string | null;
}
function expect(cond: boolean, msg: string): string | null {
  return cond ? null : msg;
}

// F5's standalone-BIG-IP sample declaration (composing-a-declaration.html),
// trimmed to the classes that matter for the walk. This is a bare Device
// declaration (POSTed straight to a BIG-IP), so no DO request wrapper.
const STANDALONE = JSON.stringify({
  schemaVersion: "1.0.0",
  class: "Device",
  async: true,
  webhook: "https://example.com/myHook",
  label: "my BIG-IP declaration for declarative onboarding",
  Common: {
    class: "Tenant",
    mySystem: { class: "System", hostname: "bigip.example.com", cliInactivityTimeout: 1200, autoPhonehome: false },
    myLicense: { class: "License", licenseType: "regKey", regKey: "AAAAA-BBBBB-CCCCC-DDDDD-EEEEEEE" },
    myDns: { class: "DNS", nameServers: ["8.8.8.8", "2001:4860:4860::8844"], search: ["f5.com"] },
    myNtp: { class: "NTP", servers: ["0.pool.ntp.org", "1.pool.ntp.org"], timezone: "UTC" },
    root: { class: "User", userType: "root", oldPassword: "default", newPassword: "myNewPass1word" },
    admin: { class: "User", userType: "regular", password: "asdfjkl", shell: "bash" },
    myProvisioning: { class: "Provision", ltm: "nominal", gtm: "minimum" },
    internal: { class: "VLAN", tag: 4093, mtu: 1500, interfaces: [{ name: "1.2", tagged: true }] },
    "internal-self": { class: "SelfIp", address: "10.10.0.100/24", vlan: "internal", allowService: "default", trafficGroup: "traffic-group-local-only" },
    default: { class: "Route", gw: "10.10.0.1", network: "default", mtu: 1500 },
    dbvars: { class: "DbVariables", "ui.advisory.enabled": true },
  },
});

// F5's HA cluster sample (clustering.html), trimmed: it adds the clustering
// classes on top of a standalone base, and it sets hostname on Common (NOT on
// a System class), which is the legal way to do it.
const CLUSTER = JSON.stringify({
  schemaVersion: "1.0.0",
  class: "Device",
  async: true,
  label: "Onboard BIG-IP into an HA Pair",
  Common: {
    class: "Tenant",
    hostname: "bigip1.example.com",
    myLicense: { class: "License", licenseType: "regKey", regKey: "AAAAA-BBBBB-CCCCC-DDDDD-EEEEEEE" },
    myProvisioning: { class: "Provision", ltm: "nominal" },
    external: { class: "VLAN", tag: 4094, interfaces: [{ name: "1.1", tagged: true }] },
    "external-self": { class: "SelfIp", address: "10.20.0.100/24", vlan: "external", allowService: "none" },
    configSync: { class: "ConfigSync", configsyncIp: "/Common/external-self/address" },
    failoverAddress: { class: "FailoverUnicast", address: "/Common/external-self/address" },
    failoverGroup: { class: "DeviceGroup", type: "sync-failover", members: ["bigip1.example.com", "bigip2.example.com"], owner: "bigip1.example.com", autoSync: true },
    trust: { class: "DeviceTrust", localUsername: "admin", localPassword: "pass", remoteHost: "10.20.0.101", remoteUsername: "admin", remotePassword: "pass" },
  },
});

// A DO request wrapper as POSTed to a BIG-IQ for remote onboarding (from the
// BIG-IQ API reference): class DO, a nested declaration, and a targetHost.
const BIGIQ_WRAPPER = JSON.stringify({
  class: "DO",
  targetHost: "54.10.10.10",
  targetUsername: "admin",
  declaration: {
    schemaVersion: "1.5.0",
    class: "Device",
    async: true,
    Common: {
      class: "Tenant",
      myProvision: { class: "Provision", ltm: "nominal" },
      admin: { class: "User", userType: "regular", password: "x", partitionAccess: { "all-partitions": { role: "admin" } } },
      hostname: "aws.ve.do.demo",
    },
  },
});

export const VECTORS: readonly Vector[] = [
  {
    id: "standalone-device-detected",
    description: "The standalone sample parses as a bare Device declaration (no DO wrapper)",
    check: () => {
      const r = explainDo(STANDALONE);
      return (
        expect(r !== null && r.kind === "device-only", `kind=${r?.kind}`) ??
        expect(r!.commonPresent, "Common not found") ??
        expect(r!.device?.schemaVersion === "1.0.0", `schemaVersion=${r!.device?.schemaVersion}`) ??
        expect(r!.device?.async === true, `async=${r!.device?.async}`) ??
        expect(r!.device?.webhook === "https://example.com/myHook", "webhook not read")
      );
    },
  },
  {
    id: "standalone-object-count",
    description: "The standalone sample walks all eleven Common class-objects",
    check: () => {
      const r = explainDo(STANDALONE);
      // System, License, DNS, NTP, User x2, Provision, VLAN, SelfIp, Route, DbVariables = 11
      return expect(r!.stats.totalObjects === 11, `totalObjects=${r!.stats.totalObjects}`);
    },
  },
  {
    id: "standalone-phase-grouping",
    description: "Classes bucket into licensing, system, and networking phases in order",
    check: () => {
      const r = explainDo(STANDALONE);
      const phases = r!.groups.map((g) => g.phase);
      // license before system before network (PHASE_ORDER); no cluster here.
      return (
        expect(phases.includes("license"), "no license phase") ??
        expect(phases.includes("system"), "no system phase") ??
        expect(phases.includes("network"), "no network phase") ??
        expect(!phases.includes("cluster"), "unexpected cluster phase") ??
        expect(phases.indexOf("license") < phases.indexOf("system"), "license not before system") ??
        expect(phases.indexOf("system") < phases.indexOf("network"), "system not before network")
      );
    },
  },
  {
    id: "license-class-recognized",
    description: "The License object is recognized and placed in the licensing phase",
    check: () => {
      const r = explainDo(STANDALONE);
      const lic = r!.groups.flatMap((g) => g.objects).find((o) => o.className === "License");
      return (
        expect(!!lic, "License object not found") ??
        expect(lic!.phase === "license", `License phase=${lic!.phase}`) ??
        expect(!lic!.unknown, "License flagged unknown")
      );
    },
  },
  {
    id: "cluster-detected",
    description: "The HA cluster sample is flagged as a cluster with clustering classes",
    check: () => {
      const r = explainDo(CLUSTER);
      return (
        expect(r !== null && r.commonPresent, "Common not found") ??
        expect(r!.stats.isCluster, "not detected as cluster") ??
        expect(r!.stats.clusterObjects >= 4, `clusterObjects=${r!.stats.clusterObjects}`)
      );
    },
  },
  {
    id: "cluster-classes-recognized",
    description: "ConfigSync, DeviceGroup, DeviceTrust, and FailoverUnicast are all recognized",
    check: () => {
      const r = explainDo(CLUSTER);
      const names = new Set(r!.groups.flatMap((g) => g.objects).map((o) => o.className));
      return (
        expect(names.has("ConfigSync"), "ConfigSync missing") ??
        expect(names.has("DeviceGroup"), "DeviceGroup missing") ??
        expect(names.has("DeviceTrust"), "DeviceTrust missing") ??
        expect(names.has("FailoverUnicast"), "FailoverUnicast missing")
      );
    },
  },
  {
    id: "bigiq-wrapper-detected",
    description: "A class DO wrapper with targetHost parses as a DO request",
    check: () => {
      const r = explainDo(BIGIQ_WRAPPER);
      return (
        expect(r !== null && r.kind === "do-request", `kind=${r?.kind}`) ??
        expect(r!.request?.hasDeclaration === true, "declaration not seen") ??
        expect(r!.request?.targetHost === "54.10.10.10", `targetHost=${r!.request?.targetHost}`) ??
        expect(r!.commonPresent, "Common not found in nested declaration")
      );
    },
  },
  {
    id: "hostname-conflict-flagged",
    description: "hostname on both Common and a System class is flagged (mutually exclusive)",
    check: () => {
      const decl = JSON.stringify({
        schemaVersion: "1.0.0",
        class: "Device",
        Common: {
          class: "Tenant",
          hostname: "a.example.com",
          sys: { class: "System", hostname: "b.example.com" },
        },
      });
      const r = explainDo(decl);
      return expect(r!.findings.some((f) => f.kind === "hostname-conflict"), "hostname-conflict not flagged");
    },
  },
  {
    id: "hostname-single-ok",
    description: "hostname on Common alone (the cluster sample) is NOT flagged",
    check: () => {
      const r = explainDo(CLUSTER);
      return expect(!r!.findings.some((f) => f.kind === "hostname-conflict"), "false hostname-conflict");
    },
  },
  {
    id: "selfip-allowservice-default-flagged",
    description: "A SelfIp with no allowService is flagged for the DO 1.36 default change",
    check: () => {
      const decl = JSON.stringify({
        schemaVersion: "1.0.0",
        class: "Device",
        Common: {
          class: "Tenant",
          v: { class: "VLAN", tag: 10, interfaces: [{ name: "1.1", tagged: true }] },
          s: { class: "SelfIp", address: "10.0.0.1/24", vlan: "v" },
        },
      });
      const r = explainDo(decl);
      return expect(
        r!.findings.some((f) => f.kind === "selfip-allowservice-default" && f.name === "s"),
        "allowService-default not flagged",
      );
    },
  },
  {
    id: "selfip-allowservice-set-ok",
    description: "A SelfIp WITH allowService (the standalone sample) is NOT flagged",
    check: () => {
      const r = explainDo(STANDALONE);
      return expect(!r!.findings.some((f) => f.kind === "selfip-allowservice-default"), "false allowService flag");
    },
  },
  {
    id: "root-oldpassword-required",
    description: "A root User without oldPassword is flagged",
    check: () => {
      const decl = JSON.stringify({
        schemaVersion: "1.0.0",
        class: "Device",
        Common: { class: "Tenant", root: { class: "User", userType: "root", newPassword: "x" } },
      });
      const r = explainDo(decl);
      return expect(
        r!.findings.some((f) => f.kind === "root-missing-oldpassword" && f.name === "root"),
        "root oldPassword not flagged",
      );
    },
  },
  {
    id: "root-with-oldpassword-ok",
    description: "The standalone sample's root User (with oldPassword) is NOT flagged",
    check: () => {
      const r = explainDo(STANDALONE);
      return expect(!r!.findings.some((f) => f.kind === "root-missing-oldpassword"), "false root oldPassword flag");
    },
  },
  {
    id: "tenant-not-common-flagged",
    description: "A tenant named something other than Common is flagged",
    check: () => {
      const decl = JSON.stringify({
        schemaVersion: "1.0.0",
        class: "Device",
        MyTenant: { class: "Tenant", sys: { class: "System", hostname: "a.example.com" } },
      });
      const r = explainDo(decl);
      return (
        expect(r!.findings.some((f) => f.kind === "tenant-not-common" && f.name === "MyTenant"), "tenant-not-common not flagged") ??
        expect(r!.findings.some((f) => f.kind === "no-common"), "no-common not flagged") ??
        expect(!r!.commonPresent, "commonPresent should be false")
      );
    },
  },
  {
    id: "missing-schema-version-flagged",
    description: "A Device declaration without schemaVersion is flagged",
    check: () => {
      const decl = JSON.stringify({ class: "Device", Common: { class: "Tenant", sys: { class: "System" } } });
      const r = explainDo(decl);
      return expect(r!.findings.some((f) => f.kind === "missing-schema-version"), "missing-schema-version not flagged");
    },
  },
  {
    id: "async-note-emitted",
    description: "async:true emits the poll-with-GET note",
    check: () => {
      const r = explainDo(STANDALONE);
      return expect(r!.findings.some((f) => f.kind === "async-note"), "async-note not emitted");
    },
  },
  {
    id: "not-do-rejected",
    description: "A non-DO JSON object is rejected as not-do",
    check: () => {
      const r = explainDo(JSON.stringify({ class: "ADC", schemaVersion: "3.0.0" }));
      return (
        expect(r !== null && r.kind === "not-do", `kind=${r?.kind}`) ??
        expect(r!.findings.some((f) => f.kind === "not-do"), "not-do finding missing")
      );
    },
  },
  {
    id: "parse-error-handled",
    description: "Malformed JSON yields a parse-error finding, not a throw",
    check: () => {
      const r = explainDo("{ not valid json");
      return (
        expect(r !== null, "returned null") ??
        expect(r!.kind === "not-do", `kind=${r!.kind}`) ??
        expect(r!.findings.some((f) => f.kind === "parse-error"), "parse-error finding missing")
      );
    },
  },
  {
    id: "empty-input-null",
    description: "Empty input returns null (nothing to explain)",
    check: () => expect(explainDo("   ") === null, "empty input did not return null"),
  },
  {
    id: "unknown-class-reported",
    description: "An unrecognized class is still reported, flagged unknown, bucketed as other",
    check: () => {
      const decl = JSON.stringify({
        schemaVersion: "1.0.0",
        class: "Device",
        Common: { class: "Tenant", thing: { class: "SomeFutureClass", foo: 1 } },
      });
      const r = explainDo(decl);
      const obj = r!.groups.flatMap((g) => g.objects).find((o) => o.className === "SomeFutureClass");
      return (
        expect(!!obj, "unknown class not reported") ??
        expect(obj!.unknown === true, "not flagged unknown") ??
        expect(obj!.phase === "other", `phase=${obj!.phase}`)
      );
    },
  },
  {
    id: "catalog-nonempty",
    description: "The class catalog is populated (sanity)",
    check: () => expect(KNOWN_CLASSES.length >= 30, `catalog size=${KNOWN_CLASSES.length}`),
  },
];

export function verifyVectors(): string[] {
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
  return failures;
}
