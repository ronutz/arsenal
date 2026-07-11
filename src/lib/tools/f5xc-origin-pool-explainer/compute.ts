// ============================================================================
// src/lib/tools/f5xc-origin-pool-explainer/compute.ts
// ----------------------------------------------------------------------------
// Deterministic decoder for an F5 Distributed Cloud (XC) origin_pool spec
// (ves.io.schema.views.origin_pool). Pure, offline.
//
// Paste an origin_pool object (Console JSON view, YAML-as-JSON, or a get/create
// envelope) and it explains: each origin server's type and address, the pool
// port, the load-balancing algorithm and endpoint selection, health-check
// references, and the TLS-to-origin settings (security level, SNI mode, server
// verification, mTLS). The security level reuses the verified level data from
// the TLS security-level mapper (W1-2).
//
// Build-gate note (verified 2026-07-11 against F5's Create Origin Pools guide,
// the load-balancing/mesh concept doc, and a real spec YAML): WEIGHTS and
// PRIORITIES are NOT properties of origin servers inside a pool. They live on
// the pool REFERENCE in a route or default_route_pools (OriginPoolWithWeight:
// pool + weight + priority). The tool decodes the pool accurately and says so.
// ============================================================================

import { LEVEL_TLS, type Level } from "../f5xc-tls-security-level-mapper/compute";

export type PortKind = "explicit" | "same-as-endpoint" | "automatic" | "unset";
export type SniMode = "host-header" | "value" | "disabled" | "unset";
export type ServerVerify = "trusted-ca" | "custom-ca" | "skip" | "unset";

export interface OriginServerView {
  typeLabel: string; // human label of the origin-server oneof
  address: string; // the ip / dns_name / service_name
  location?: string; // site / virtual site / virtual network, when present
  labels: string[];
}

export interface TlsView {
  enabled: boolean;
  securityKey?: string; // the raw key: default_security, high_security, ...
  level?: Level | "custom"; // mapped level (default_security -> High)
  minTls?: string;
  maxTls?: string;
  sni: SniMode;
  sniValue?: string;
  serverVerify: ServerVerify;
  mtls: boolean;
}

export interface PoolView {
  ok: boolean;
  error?: string;
  recognized: boolean;
  name?: string;
  origins: OriginServerView[];
  port: { kind: PortKind; value?: number };
  algorithm?: string; // readable label
  endpointSelection?: string; // readable label
  healthchecks: string[];
  tls: TlsView;
  notes: string[];
  warnings: string[];
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function asStr(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}
function asNum(v: unknown): number | undefined {
  return typeof v === "number" ? v : undefined;
}
function refName(v: unknown): string {
  if (typeof v === "string") return v;
  if (isObj(v)) {
    if (typeof v.name === "string") return v.name;
    if (Array.isArray(v.refs) && v.refs.length && isObj(v.refs[0]) && typeof (v.refs[0] as Record<string, unknown>).name === "string")
      return (v.refs[0] as Record<string, unknown>).name as string;
  }
  return "(ref)";
}

/** Read a site_locator ({ site | virtual_site | virtual_network }) to a label. */
function readLocator(v: unknown): string | undefined {
  if (!isObj(v)) return undefined;
  if (isObj(v.site)) return `site ${refName(v.site)}`;
  if (isObj(v.virtual_site)) return `virtual site ${refName(v.virtual_site)}`;
  if (isObj(v.virtual_network)) return `virtual network ${refName(v.virtual_network)}`;
  return undefined;
}

function labelsOf(o: Record<string, unknown>): string[] {
  if (!isObj(o.labels)) return [];
  return Object.entries(o.labels as Record<string, unknown>).map(([k, val]) => `${k}=${String(val)}`);
}

/** Decode one origin-server oneof. */
function decodeOrigin(raw: unknown): OriginServerView {
  const base: OriginServerView = { typeLabel: "unknown", address: "(none)", labels: [] };
  if (!isObj(raw)) return base;
  base.labels = labelsOf(raw);

  const pick = (key: string): Record<string, unknown> | null => (isObj(raw[key]) ? (raw[key] as Record<string, unknown>) : null);

  let o: Record<string, unknown> | null;
  if ((o = pick("public_ip"))) return { ...base, typeLabel: "Public IP", address: asStr(o.ip) ?? "(ip)" };
  if ((o = pick("public_name"))) return { ...base, typeLabel: "Public DNS name", address: asStr(o.dns_name) ?? "(dns)" };
  if ((o = pick("private_ip"))) return { ...base, typeLabel: "IP on given sites", address: asStr(o.ip) ?? "(ip)", location: readLocator(o.site_locator) };
  if ((o = pick("private_name"))) return { ...base, typeLabel: "DNS name on given sites", address: asStr(o.dns_name) ?? "(dns)", location: readLocator(o.site_locator) };
  if ((o = pick("k8s_service"))) return { ...base, typeLabel: "K8s service", address: asStr(o.service_name) ?? "(service)", location: readLocator(o.site_locator) };
  if ((o = pick("consul_service"))) return { ...base, typeLabel: "Consul service", address: asStr(o.service_name) ?? "(service)", location: readLocator(o.site_locator) };
  if ((o = pick("vn_private_ip"))) return { ...base, typeLabel: "IP on virtual network", address: asStr(o.ip) ?? "(ip)", location: isObj(o.virtual_network) ? `virtual network ${refName(o.virtual_network)}` : undefined };
  if ((o = pick("vn_private_name"))) return { ...base, typeLabel: "Name on virtual network", address: asStr(o.dns_name) ?? "(dns)", location: isObj(o.virtual_network) ? `virtual network ${refName(o.virtual_network)}` : undefined };
  if ((o = pick("cbip_service"))) return { ...base, typeLabel: "Classic BIG-IP service", address: asStr(o.service_name) ?? refName(o) };
  if ((o = pick("custom_endpoint_object"))) return { ...base, typeLabel: "Custom endpoint object", address: refName(o.endpoint ?? o) };
  return base;
}

const ALGO_LABEL: Record<string, string> = {
  ROUND_ROBIN: "Round Robin",
  LEAST_REQUEST: "Least Active Request",
  RANDOM: "Random",
  RING_HASH: "Ring Hash (consistent hashing)",
  LB_OVERRIDE: "Load Balancer Override",
  round_robin: "Round Robin",
  least_request: "Least Active Request",
  random: "Random",
  ring_hash: "Ring Hash (consistent hashing)",
  lb_override: "Load Balancer Override",
  source_ip_stickiness: "Source IP Stickiness",
  cookie_stickiness: "Cookie Based Stickiness",
};
const ENDPOINT_LABEL: Record<string, string> = {
  LOCAL_PREFERRED: "Local Preferred",
  LOCAL_ONLY: "Local Only",
  DISTRIBUTED: "Distributed",
};
const SECURITY_LEVEL: Record<string, Level | "custom"> = {
  default_security: "High", // Default IS the High level (W1-2)
  high_security: "High",
  medium_security: "Medium",
  low_security: "Low",
  custom_security: "custom",
};

function decodeAlgorithm(spec: Record<string, unknown>): string | undefined {
  // enum string form
  const enumStr = asStr(spec.loadbalancer_algorithm);
  if (enumStr) return ALGO_LABEL[enumStr] ?? enumStr;
  // oneof-object form
  for (const k of Object.keys(ALGO_LABEL)) {
    if (k === k.toLowerCase() && spec[k] !== undefined && isObj(spec[k])) return ALGO_LABEL[k];
  }
  return undefined;
}

function decodeTls(spec: Record<string, unknown>): TlsView {
  const tls: TlsView = { enabled: false, sni: "unset", serverVerify: "unset", mtls: false };
  if (spec.no_tls !== undefined) return tls;
  if (!isObj(spec.use_tls)) return tls;
  tls.enabled = true;
  const u = spec.use_tls;

  const cfg = isObj(u.tls_config) ? u.tls_config : {};
  for (const key of Object.keys(SECURITY_LEVEL)) {
    if (cfg[key] !== undefined) {
      tls.securityKey = key;
      const lvl = SECURITY_LEVEL[key];
      tls.level = lvl;
      if (lvl !== "custom") {
        tls.minTls = LEVEL_TLS[lvl].min;
        tls.maxTls = LEVEL_TLS[lvl].max;
      }
      break;
    }
  }

  if (u.use_host_header_as_sni !== undefined) tls.sni = "host-header";
  else if (typeof u.sni === "string") {
    tls.sni = "value";
    tls.sniValue = u.sni;
  } else if (u.disable_sni !== undefined) tls.sni = "disabled";

  if (u.volterra_trusted_ca !== undefined) tls.serverVerify = "trusted-ca";
  else if (u.use_server_verification !== undefined) tls.serverVerify = "custom-ca";
  else if (u.skip_server_verification !== undefined) tls.serverVerify = "skip";

  tls.mtls = u.use_mtls !== undefined && u.no_mtls === undefined;
  return tls;
}

/** Locate the origin_pool spec across envelope shapes. */
function locateSpec(root: unknown): { spec: Record<string, unknown>; name?: string } | null {
  if (!isObj(root)) return null;
  const name = isObj(root.metadata) ? asStr((root.metadata as Record<string, unknown>).name) : undefined;
  if (isObj(root.spec)) return { spec: root.spec, name };
  if (isObj(root.get_spec)) return { spec: root.get_spec, name };
  if (isObj(root.create_form) && isObj((root.create_form as Record<string, unknown>).spec)) return { spec: (root.create_form as Record<string, unknown>).spec as Record<string, unknown>, name };
  if (Array.isArray(root.origin_servers)) return { spec: root, name }; // pasted the spec body directly
  return null;
}

export function explainOriginPool(text: string): PoolView {
  const empty: PoolView = { ok: false, recognized: false, origins: [], port: { kind: "unset" }, healthchecks: [], tls: { enabled: false, sni: "unset", serverVerify: "unset", mtls: false }, notes: [], warnings: [] };
  const t = text.trim();
  if (t === "") return { ...empty, error: "Paste an F5XC origin_pool spec (JSON)." };

  let root: unknown;
  try {
    root = JSON.parse(t);
  } catch {
    return { ...empty, error: "That is not valid JSON. Paste the origin_pool object from the Console (JSON view) or the API." };
  }

  const found = locateSpec(root);
  if (!found) return { ...empty, ok: true, warnings: ["no origin_servers found - paste an origin_pool spec, its spec body, or a create/get envelope"] };
  const spec = found.spec;

  const origins = Array.isArray(spec.origin_servers) ? spec.origin_servers.map(decodeOrigin) : [];

  // port
  let port: PoolView["port"] = { kind: "unset" };
  if (typeof spec.port === "number") port = { kind: "explicit", value: spec.port };
  else if (spec.same_as_endpoint_port !== undefined) port = { kind: "same-as-endpoint" };
  else if (spec.automatic_port !== undefined) port = { kind: "automatic" };

  const tls = decodeTls(spec);
  const healthchecks = Array.isArray(spec.healthcheck) ? (spec.healthcheck as unknown[]).map(refName) : [];

  const notes: string[] = [];
  const warnings: string[] = [];
  if (origins.length === 0) warnings.push("this pool has no origin servers");
  if (port.kind === "unset") notes.push("no explicit port on the pool - if TLS is enabled the automatic port is 443, otherwise 80");
  if (tls.enabled && tls.serverVerify === "skip") warnings.push("origin-server verification is disabled (skip) - the connection to origin is encrypted but the origin certificate is not validated");
  // the weight/priority teaching note, always
  notes.push("weights and priorities are not set here - they belong to the pool's reference inside a route or default_route_pools (pool + weight + priority)");

  const endpointSelection = asStr(spec.endpoint_selection);

  return {
    ok: true,
    recognized: true,
    name: found.name,
    origins,
    port,
    algorithm: decodeAlgorithm(spec),
    endpointSelection: endpointSelection ? ENDPOINT_LABEL[endpointSelection] ?? endpointSelection : undefined,
    healthchecks,
    tls,
    notes,
    warnings,
  };
}

/** D-49 run entrypoint: a JSON string. */
export function run(input: string): PoolView {
  return explainOriginPool(input);
}
