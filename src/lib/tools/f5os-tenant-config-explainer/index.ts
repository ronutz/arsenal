// ============================================================================
// The {manifest, run, vectors} triple for the F5OS tenant config explainer.
// Offline: it parses the block you paste and contacts no platform.
// ============================================================================

export { decodeTenant, minMemoryFor, run, TenantConfigError } from "./compute";
export type { TenantDecode, TenantField, RunningState } from "./compute";
export { verifyVectors, TENANT_VECTORS, GOLDEN_VECTOR_SET_ID } from "./golden-vectors";
export type { TenantVector } from "./golden-vectors";

export const manifest = Object.freeze({
  toolSlug: "f5os-tenant-config-explainer",
  learnLinks: [
    "learn/f5os-tenant-lifecycle",
    "learn/f5os-restconf-paths",
  ],
  sources: Object.freeze([
    Object.freeze({ id: "velos-tenant-mgmt", label: "F5 - VELOS systems administration: tenant management, including the minimum-memory formula and blade capacities", url: "https://techdocs.f5.com/en-us/velos-1-5-0/velos-systems-administration-configuration/title-tenant-management.html" }),
    Object.freeze({ id: "rseries-tenant-mgmt", label: "F5 - rSeries systems administration: tenant management, vCPU multiples and defaults", url: "https://techdocs.f5.com/en-us/f5os-a-1-1-0/f5-rseries-systems-administration-configuration/title-tenant-management.html" }),
    Object.freeze({ id: "velos-api-tenant", label: "F5 CloudDocs - VELOS API: chassis partition tenant lifecycle", url: "https://clouddocs.f5.com/api/velos-api/api-chassis-tenant.html" }),
  ]),
});
