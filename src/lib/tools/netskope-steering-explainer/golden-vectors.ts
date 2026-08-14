// ============================================================================
// GOLDEN VECTORS for the Netskope steering-method explainer.
//
// The behaviours that must not drift: a managed device gets the client, an
// unmanaged one cannot, a tunnel is a site method, proxy chaining requires an
// existing proxy, and the two warnings that matter - the client disabling
// itself when it detects a tunnel, and the certificate requirement for TLS
// inspection - always fire when they apply.
// ============================================================================

import { explainSteering, type Situation, type Method } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "netskope-steering-explainer/2026-08-14";

const base: Situation = {
  managedDevice: true, onPremises: false, canInstallCert: true,
  needUserIdentity: true, needPrivateApps: false, needNonWebPorts: false,
  existingProxy: false,
};

export interface SteeringVector {
  name: string;
  input: Situation;
  expect: {
    primary?: Method;
    fitOf?: [Method, "primary" | "secondary" | "unsuitable"];
    warnContains?: string;
    noteContains?: string;
    noWarnContains?: string;
  };
}

export const STEERING_VECTORS: readonly SteeringVector[] = Object.freeze([
  {
    name: "a managed roaming device gets the client",
    input: { ...base },
    expect: { primary: "client" },
  },
  {
    name: "an unmanaged device cannot use the client",
    input: { ...base, managedDevice: false },
    expect: { fitOf: ["client", "unsuitable"] },
  },
  {
    name: "a tunnel is unsuitable for a roaming user",
    input: { ...base, onPremises: false },
    expect: { fitOf: ["ipsec", "unsuitable"] },
  },
  {
    name: "on a site, IPsec becomes viable",
    input: { ...base, managedDevice: false, onPremises: true },
    expect: { fitOf: ["ipsec", "primary"] },
  },
  {
    name: "GRE is the throughput variant, not the default",
    input: { ...base, managedDevice: false, onPremises: true },
    expect: { fitOf: ["gre", "secondary"] },
  },
  {
    name: "proxy chaining needs a proxy to chain from",
    input: { ...base, existingProxy: false },
    expect: { fitOf: ["proxy-chain", "unsuitable"] },
  },
  {
    name: "with an existing proxy it becomes a migration option",
    input: { ...base, existingProxy: true },
    expect: { fitOf: ["proxy-chain", "secondary"] },
  },
  {
    name: "*** CLIENT PLUS TUNNEL WARNS: THE CLIENT DISABLES ITSELF ***",
    input: { ...base, managedDevice: true, onPremises: true },
    expect: { warnContains: "DISABLES ITSELF" },
  },
  {
    name: "and offers the identity-only arrangement",
    input: { ...base, managedDevice: true, onPremises: true },
    expect: { noteContains: "provision certificates and supply user identity" },
  },
  {
    name: "*** NO CERTIFICATE MEANS NO TLS INSPECTION, AND IT SAYS SO ***",
    input: { ...base, canInstallCert: false },
    expect: { warnContains: "no TLS inspection and no SAML authentication" },
  },
  {
    name: "identity needed without a client warns",
    input: { ...base, managedDevice: false, onPremises: true, needUserIdentity: true },
    expect: { warnContains: "identity must come from" },
  },
  {
    name: "non-web ports bring the cloud-firewall caveat",
    input: { ...base, needNonWebPorts: true },
    expect: { noteContains: "NOT inspected by the cloud firewall" },
  },
  {
    name: "the bypass-versus-do-not-decrypt distinction is always given",
    input: { ...base },
    expect: { noteContains: "steering bypass and a do-not-decrypt rule are different" },
  },
]);

/** Run every vector. Returns the failures, empty when all pass. */
export function verifyVectors(): string[] {
  const f: string[] = [];
  for (const v of STEERING_VECTORS) {
    let r;
    try { r = explainSteering(v.input); }
    catch (e) { f.push(`${v.name}: threw ${(e as Error).message}`); continue; }
    const e = v.expect;
    if (e.primary && r.primary !== e.primary) f.push(`${v.name}: primary ${r.primary} != ${e.primary}`);
    if (e.fitOf) {
      const hit = r.recommendations.find((x) => x.method === e.fitOf![0]);
      if (!hit) f.push(`${v.name}: no recommendation for ${e.fitOf[0]}`);
      else if (hit.fit !== e.fitOf[1]) f.push(`${v.name}: ${e.fitOf[0]} fit ${hit.fit} != ${e.fitOf[1]}`);
    }
    if (e.warnContains && !r.warnings.some((w) => w.includes(e.warnContains!))) f.push(`${v.name}: no warning containing "${e.warnContains}"`);
    if (e.noteContains && !r.notes.some((n) => n.includes(e.noteContains!))) f.push(`${v.name}: no note containing "${e.noteContains}"`);
    if (e.noWarnContains && r.warnings.some((w) => w.includes(e.noWarnContains!))) f.push(`${v.name}: unexpected warning "${e.noWarnContains}"`);
  }
  /* EVERY method must carry its costs, chosen or not - the tool exists to say
     what you lose, and a recommendation with an empty cost list would quietly
     stop doing that. */
  const r = explainSteering(base);
  for (const rec of r.recommendations) {
    if (rec.costs.length === 0) f.push(`${rec.method}: no costs listed`);
  }
  return f;
}
