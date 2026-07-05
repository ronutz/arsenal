// ============================================================================
// src/lib/tools/do-explainer-validator/compute.ts
// ----------------------------------------------------------------------------
// F5 BIG-IP DO (Declarative Onboarding) DECLARATION EXPLAINER + STRUCTURAL
// VALIDATOR (arsenal-local, pure, deterministic).
//
// Paste a DO declaration (the JSON you POST to
// /mgmt/shared/declarative-onboarding) and this reads it back to you: whether
// it is a full DO request wrapper (class DO, as used against a BIG-IQ) or a
// bare Device declaration, the top-level options (schemaVersion, async,
// webhook, label), and the Common tenant's class-objects walked in the order
// DO onboards them (licensing, then system identity, then networking, then
// clustering), with every class named and explained. It also checks the
// STRUCTURAL rules F5 documents, and flags the documented gotchas that bite in
// production (hostname declared in both Common and System, the DO 1.36
// allowService default change, a root User missing its oldPassword).
//
// SCOPE. This is a structure explainer and sanity checker, NOT a full
// JSON-Schema validator: it does not reproduce the entire DO schema or check
// every property, so a declaration that passes here can still be rejected by
// DO itself (validate against the published schema in VS Code for that). It
// never contacts a BIG-IP or a BIG-IQ and never fetches; the same input always
// yields the same output (D-49).
//
// DO is the sibling of AS3: AS3 configures Layer 4-7 application services on a
// box that is already on the network; DO does the Layer 1-3 onboarding that
// gets it there (licensing, provisioning, VLANs, self IPs, routes, users,
// clustering). Same Automation Toolchain declarative model, different job.
//
// GROUNDING (see index.ts `sources`, fetched 2026-07-05 from clouddocs, DO
// 1.47.0): the Device/Tenant/class model and the "Common" tenant rule
// (composing-a-declaration.html); the class catalog and their properties; the
// hostname mutual-exclusion between Common and System; the allowService
// default change from `default` to `none` in DO 1.36; the root-User
// oldPassword requirement; async returning 202; the endpoint and single-NIC
// :8443 note. Nothing here is invented from memory.
// ============================================================================

const MAX_INPUT = 200_000; // generous; declarations are JSON, not payloads

export type DocKind = "do-request" | "device-only" | "not-do";

// A DO class known to the schema, with a plain-language explanation and the
// onboarding phase it belongs to. `phase` drives the "onboards in what order"
// grouping: licensing and provisioning must land before the modules they gate,
// system identity (DNS/NTP/hostname/users) is foundational, networking builds
// the data plane, and clustering joins boxes once each is itself onboarded.
export type Phase = "license" | "system" | "network" | "cluster" | "other";
interface ClassInfo {
  readonly phase: Phase;
  readonly explain: string;
}

// Catalog of DO classes. Explanations are paraphrased from F5's DO schema
// reference and the composing-a-declaration guide; the list covers the classes
// in the standard standalone and cluster examples plus the common extras, and
// is representative rather than exhaustive (unknown classes are still reported).
const CLASS_CATALOG: Record<string, ClassInfo> = {
  // Licensing and provisioning: gate everything downstream.
  License: { phase: "license", explain: "a BYOL license (regKey or a BIG-IQ licensePool); omit it for PAYG images that are already licensed" },
  Provision: { phase: "license", explain: "module provisioning levels (ltm, gtm, asm, apm, afm, avr, and so on: dedicated, nominal, minimum, or none)" },
  // System identity and access.
  System: { phase: "system", explain: "system-level settings: hostname, CLI/console inactivity timeouts, autoPhonehome, autoCheck" },
  DNS: { phase: "system", explain: "DNS name servers and search domains (configuring this disables DHCP for DNS)" },
  NTP: { phase: "system", explain: "NTP servers and the system timezone (configuring this disables DHCP for NTP)" },
  User: { phase: "system", explain: "a user account, its role, shell, and partition access (root requires its existing oldPassword)" },
  RemoteAuthRole: { phase: "system", explain: "a remote (RADIUS/TACACS/LDAP/AD) authentication role, ordered by lineOrder" },
  Authentication: { phase: "system", explain: "remote authentication configuration (RADIUS, TACACS+, LDAP, or Active Directory)" },
  SnmpAgent: { phase: "system", explain: "SNMP agent settings (contact, location, allowed clients)" },
  SnmpCommunity: { phase: "system", explain: "an SNMP v1/v2c community" },
  SnmpUser: { phase: "system", explain: "an SNMP v3 user" },
  SnmpTrapDestination: { phase: "system", explain: "an SNMP trap destination" },
  SyslogRemoteServer: { phase: "system", explain: "a remote syslog destination" },
  TrafficControl: { phase: "system", explain: "global traffic control tunables (acceptIpOptions, timeouts, and related settings)" },
  DbVariables: { phase: "system", explain: "arbitrary BIG-IP database (sys db) variables set by name and value" },
  DeviceCertificate: { phase: "system", explain: "the device's own management certificate and key" },
  // Networking: the data plane.
  VLAN: { phase: "network", explain: "a VLAN and its tagged/untagged interfaces (the object name becomes the VLAN name)" },
  SelfIp: { phase: "network", explain: "a self IP on a VLAN, with its allowService port-lockdown and traffic group" },
  Route: { phase: "network", explain: "a TMM route (name it `default` for the default route)" },
  ManagementIp: { phase: "network", explain: "a management-interface IP address" },
  ManagementRoute: { phase: "network", explain: "a route on the management network" },
  RouteDomain: { phase: "network", explain: "a route domain (an isolated L3 address space), referenced elsewhere by its id" },
  Trunk: { phase: "network", explain: "a link-aggregation trunk of physical interfaces" },
  Tunnel: { phase: "network", explain: "a network tunnel (for example a VXLAN overlay)" },
  RoutingBGP: { phase: "network", explain: "BGP routing configuration (neighbors, local AS, address families)" },
  RoutingAsPath: { phase: "network", explain: "a BGP AS-path access list" },
  RoutingPrefixList: { phase: "network", explain: "a routing prefix list of permit/deny entries" },
  RouteMap: { phase: "network", explain: "a route map applied to routing protocols" },
  RoutingAccessList: { phase: "network", explain: "a routing access list of permit/deny address entries" },
  FirewallPolicy: { phase: "network", explain: "an AFM firewall policy (a DO-onboarded policy object)" },
  FirewallAddressList: { phase: "network", explain: "an AFM firewall address list" },
  FirewallPortList: { phase: "network", explain: "an AFM firewall port list" },
  NetAddressList: { phase: "network", explain: "a network address list" },
  NetPortList: { phase: "network", explain: "a network port list" },
  // Clustering / high availability: joins onboarded boxes.
  ConfigSync: { phase: "cluster", explain: "the config-sync self IP used to propagate configuration across the device group" },
  FailoverUnicast: { phase: "cluster", explain: "the unicast address(es) used for failover heartbeat" },
  FailoverMulticast: { phase: "cluster", explain: "the multicast address used for failover heartbeat" },
  DeviceTrust: { phase: "cluster", explain: "device-trust settings that add this box to the trust domain (ignored on the owner itself)" },
  DeviceGroup: { phase: "cluster", explain: "a device group and its members (sync-failover or sync-only); the owner creates it, members join" },
  TrafficGroup: { phase: "cluster", explain: "a traffic group of floating objects that fail over together" },
  MirrorIp: { phase: "cluster", explain: "the primary/secondary mirroring addresses for connection mirroring" },
  GSLBGlobals: { phase: "other", explain: "global BIG-IP DNS (GTM) settings for onboarding" },
  GSLBDataCenter: { phase: "other", explain: "a BIG-IP DNS (GTM) data center" },
  GSLBServer: { phase: "other", explain: "a BIG-IP DNS (GTM) server object" },
  GSLBMonitor: { phase: "other", explain: "a BIG-IP DNS (GTM) health monitor" },
  GSLBProberPool: { phase: "other", explain: "a BIG-IP DNS (GTM) prober pool" },
  Analytics: { phase: "other", explain: "global AVR analytics settings" },
};

// The order phases are presented in: the order DO effectively onboards them.
const PHASE_ORDER: readonly Phase[] = ["license", "system", "network", "cluster", "other"];
const PHASE_LABEL: Record<Phase, string> = {
  license: "Licensing & provisioning",
  system: "System & access",
  network: "Networking",
  cluster: "Clustering / HA",
  other: "Other",
};

// Keys that are Device-level metadata, not the tenant.
const DEVICE_META = new Set(["schemaVersion", "class", "async", "webhook", "label", "Credentials", "controls"]);
// Keys that are Common (Tenant) level metadata, not class-objects.
const TENANT_META = new Set(["class", "hostname"]);

// The tenant in a DO declaration MUST be named Common.
const REQUIRED_TENANT = "Common";

// ---------------------------------------------------------------------------
// Result shapes.
// ---------------------------------------------------------------------------
export interface ObjectInfo {
  readonly name: string;
  readonly className: string;
  readonly phase: Phase;
  readonly explain: string;
  /** True if the class is not in the catalog (still reported as present). */
  readonly unknown: boolean;
  /** Short, sourced per-object notes (e.g. the allowService default, root oldPassword). */
  readonly notes: readonly string[];
}
export interface PhaseGroup {
  readonly phase: Phase;
  readonly label: string;
  readonly objects: readonly ObjectInfo[];
}
export type Finding =
  | { kind: "parse-error"; detail: string }
  | { kind: "not-do" }
  | { kind: "device-only" } // informational: a bare Device (no DO request wrapper)
  | { kind: "missing-schema-version" }
  | { kind: "no-common" } // no Common tenant at all
  | { kind: "tenant-not-common"; name: string } // a tenant object named something other than Common
  | { kind: "empty-common" }
  | { kind: "hostname-conflict" } // hostname in both Common and a System class
  | { kind: "root-missing-oldpassword"; name: string }
  | { kind: "selfip-allowservice-default"; name: string } // relies on the changed default
  | { kind: "async-note" }; // async:true returns 202, poll with GET

export interface RequestInfo {
  readonly hasDeclaration: boolean;
  readonly targetHost: string | null; // BIG-IQ remote-onboarding target, if present
}
export interface DeviceInfo {
  readonly schemaVersion: string | null;
  readonly async: boolean | null;
  readonly webhook: string | null;
  readonly label: string | null;
}
export interface DoStats {
  readonly totalObjects: number;
  readonly licenseObjects: number;
  readonly networkObjects: number;
  readonly clusterObjects: number;
  readonly isCluster: boolean; // any clustering class present
}
export interface DoResult {
  readonly kind: DocKind;
  readonly request: RequestInfo | null;
  readonly device: DeviceInfo | null;
  readonly commonPresent: boolean;
  readonly groups: readonly PhaseGroup[];
  readonly findings: readonly Finding[];
  readonly stats: DoStats;
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
export function explainDo(input: string): DoResult | null {
  const raw = input.trim();
  if (!raw) return null;
  const clipped = raw.length > MAX_INPUT ? raw.slice(0, MAX_INPUT) : raw;

  let doc: unknown;
  try {
    doc = JSON.parse(clipped);
  } catch (e) {
    return emptyResult("not-do", [{ kind: "parse-error", detail: e instanceof Error ? e.message : String(e) }]);
  }
  if (!isObj(doc)) {
    return emptyResult("not-do", [{ kind: "not-do" }]);
  }

  const topClass = str(doc.class);
  const findings: Finding[] = [];

  // Locate the Device declaration: either doc is a DO request wrapper
  // (class DO, with a .declaration, as POSTed to a BIG-IQ) or doc is the
  // Device declaration itself (as POSTed straight to a BIG-IP).
  let request: RequestInfo | null = null;
  let deviceObj: Record<string, unknown> | null = null;
  let kind: DocKind;

  if (topClass === "DO") {
    kind = "do-request";
    const decl = doc.declaration;
    request = {
      hasDeclaration: isObj(decl),
      targetHost: str(doc.targetHost),
    };
    deviceObj = isObj(decl) ? decl : null;
  } else if (topClass === "Device") {
    kind = "device-only";
    deviceObj = doc;
    findings.push({ kind: "device-only" });
  } else {
    return emptyResult("not-do", [{ kind: "not-do" }]);
  }

  if (!deviceObj) {
    return {
      kind,
      request,
      device: null,
      commonPresent: false,
      groups: [],
      findings: [...findings, { kind: "no-common" }],
      stats: zeroStats(),
    };
  }

  // Device-level metadata.
  const schemaVersion = str(deviceObj.schemaVersion);
  const asyncVal = typeof deviceObj.async === "boolean" ? deviceObj.async : null;
  const device: DeviceInfo = {
    schemaVersion,
    async: asyncVal,
    webhook: str(deviceObj.webhook),
    label: str(deviceObj.label),
  };
  if (!schemaVersion) findings.push({ kind: "missing-schema-version" });
  if (asyncVal === true) findings.push({ kind: "async-note" });

  // Locate the Common tenant. DO requires the tenant to be named Common; a
  // tenant object under any other name is a documented error we surface.
  let common: Record<string, unknown> | null = null;
  for (const [tName, tVal] of Object.entries(deviceObj)) {
    if (DEVICE_META.has(tName)) continue;
    if (!isObj(tVal) || str(tVal.class) !== "Tenant") continue;
    if (tName === REQUIRED_TENANT) {
      common = tVal;
    } else {
      findings.push({ kind: "tenant-not-common", name: tName });
    }
  }

  if (!common) {
    findings.push({ kind: "no-common" });
    return {
      kind,
      request,
      device,
      commonPresent: false,
      groups: [],
      findings,
      stats: zeroStats(),
    };
  }

  // A hostname may be set on Common OR on a System class, but not both.
  const hostnameOnCommon = typeof common.hostname === "string";
  let hostnameOnSystem = false;

  // Walk the class-objects inside Common, bucketed by onboarding phase.
  const buckets = new Map<Phase, ObjectInfo[]>();
  for (const p of PHASE_ORDER) buckets.set(p, []);

  let total = 0;
  let licenseCount = 0;
  let networkCount = 0;
  let clusterCount = 0;

  for (const [oName, oVal] of Object.entries(common)) {
    if (TENANT_META.has(oName)) continue;
    if (!isObj(oVal)) continue;
    const cls = str(oVal.class);
    if (!cls) continue;

    const info = CLASS_CATALOG[cls];
    const phase = info?.phase ?? "other";
    const explain = info?.explain ?? "a DO onboarding object";
    const notes: string[] = [];

    // Per-object, sourced observations.
    if (cls === "System" && typeof oVal.hostname === "string") {
      hostnameOnSystem = true;
    }
    if (cls === "User") {
      const userType = str(oVal.userType);
      if (userType === "root" && typeof oVal.oldPassword !== "string") {
        findings.push({ kind: "root-missing-oldpassword", name: oName });
        notes.push("root requires its existing oldPassword to change the password");
      }
    }
    if (cls === "SelfIp") {
      // DO 1.36 changed the allowService default from `default` to `none`.
      // A self IP that omits allowService now locks down by default.
      if (!("allowService" in oVal)) {
        findings.push({ kind: "selfip-allowservice-default", name: oName });
        notes.push("no allowService set: since DO 1.36 the default is none (was default), so this self IP allows no services unless you set them");
      }
    }

    buckets.get(phase)!.push({ name: oName, className: cls, phase, explain, unknown: !info, notes });
    total++;
    if (phase === "license") licenseCount++;
    else if (phase === "network") networkCount++;
    else if (phase === "cluster") clusterCount++;
  }

  if (hostnameOnCommon && hostnameOnSystem) findings.push({ kind: "hostname-conflict" });
  if (total === 0) findings.push({ kind: "empty-common" });

  const groups: PhaseGroup[] = PHASE_ORDER
    .map((p) => ({ phase: p, label: PHASE_LABEL[p], objects: buckets.get(p)! }))
    .filter((g) => g.objects.length > 0);

  return {
    kind,
    request,
    device,
    commonPresent: true,
    groups,
    findings,
    stats: {
      totalObjects: total,
      licenseObjects: licenseCount,
      networkObjects: networkCount,
      clusterObjects: clusterCount,
      isCluster: clusterCount > 0,
    },
  };
}

function zeroStats(): DoStats {
  return { totalObjects: 0, licenseObjects: 0, networkObjects: 0, clusterObjects: 0, isCluster: false };
}
function emptyResult(kind: DocKind, findings: Finding[]): DoResult {
  return { kind, request: null, device: null, commonPresent: false, groups: [], findings, stats: zeroStats() };
}

/** The set of catalog classes, for the reference view and tests. */
export const KNOWN_CLASSES = Object.freeze(Object.keys(CLASS_CATALOG));
export { PHASE_ORDER, PHASE_LABEL };
