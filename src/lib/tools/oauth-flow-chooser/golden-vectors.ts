// ============================================================================
// src/lib/tools/oauth-flow-chooser/golden-vectors.ts
// ----------------------------------------------------------------------------
// 12 golden vectors pinning the decision table: every app type, the identity
// and offline modifiers, the retired-grants invariant, and the contradictory-
// input warning. (D-19.)
// ============================================================================

import { choose, type ChooserInput, type ChooserResult, type ChooserError } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "oauth-flow-chooser-golden-v1";

export interface ChooserVector {
  id: string;
  input: ChooserInput;
  expect: (r: ChooserResult | ChooserError) => boolean;
  describe: string;
}

const okR = (r: ChooserResult | ChooserError): r is ChooserResult => r.ok === true;
const hasRetired = (r: ChooserResult) =>
  r.avoided.some((a) => a.grant === "implicit") && r.avoided.some((a) => a.grant.startsWith("password"));

export const CHOOSER_VECTORS: ChooserVector[] = [
  { id: "V01-server-web", input: { appType: "server-web", wantsIdentity: false, needsOffline: false },
    describe: "backend web app = confidential code + PKCE",
    expect: (r) => okR(r) && r.grant === "authorization_code" && r.clientType === "confidential" && hasRetired(r) },
  { id: "V02-spa", input: { appType: "spa", wantsIdentity: false, needsOffline: false },
    describe: "SPA = public code + PKCE, RFC 7636 cited",
    expect: (r) => okR(r) && r.clientType === "public" && r.citations.includes("RFC 7636") },
  { id: "V03-native", input: { appType: "native", wantsIdentity: false, needsOffline: false },
    describe: "native app cites RFC 8252 and the system-browser rule",
    expect: (r) => okR(r) && r.citations.includes("RFC 8252") && r.why.some((w) => w.includes("SYSTEM browser")) },
  { id: "V04-service", input: { appType: "service", wantsIdentity: false, needsOffline: false },
    describe: "machine-to-machine = client_credentials, RFC 6749 4.4",
    expect: (r) => okR(r) && r.grant === "client_credentials" && r.citations[0].includes("4.4") },
  { id: "V05-device", input: { appType: "device", wantsIdentity: false, needsOffline: false },
    describe: "input-constrained = device grant, RFC 8628",
    expect: (r) => okR(r) && r.name.includes("Device") && r.citations.includes("RFC 8628") },
  { id: "V06-oidc-layer", input: { appType: "spa", wantsIdentity: true, needsOffline: false },
    describe: "identity request adds the OIDC note",
    expect: (r) => okR(r) && typeof r.oidcNote === "string" && r.oidcNote.includes("ID Token") },
  { id: "V07-public-rotation", input: { appType: "spa", wantsIdentity: false, needsOffline: true },
    describe: "offline on a public client = rotation guidance, RFC 9700",
    expect: (r) => okR(r) && typeof r.refreshNote === "string" && r.refreshNote.includes("ROTATED") },
  { id: "V08-confidential-offline", input: { appType: "server-web", wantsIdentity: true, needsOffline: true },
    describe: "confidential offline stores refresh server-side, plus OIDC note",
    expect: (r) => okR(r) && r.refreshNote?.includes("server-side") === true && r.oidcNote !== undefined },
  { id: "V09-service-identity-warning", input: { appType: "service", wantsIdentity: true, needsOffline: false },
    describe: "identity on machine-to-machine raises the contradiction warning",
    expect: (r) => okR(r) && typeof r.warning === "string" && r.warning.includes("no end user") },
  { id: "V10-cc-no-refresh", input: { appType: "service", wantsIdentity: false, needsOffline: true },
    describe: "client credentials + offline explains SHOULD NOT issue refresh",
    expect: (r) => okR(r) && r.refreshNote?.includes("SHOULD NOT") === true },
  { id: "V11-device-oidc-offline", input: { appType: "device", wantsIdentity: true, needsOffline: true },
    describe: "device grant composes with OIDC and refresh tokens",
    expect: (r) => okR(r) && r.oidcNote !== undefined && r.refreshNote !== undefined },
  { id: "V12-retired-invariant", input: { appType: "native", wantsIdentity: true, needsOffline: true },
    describe: "implicit and ROPC appear retired on every result",
    expect: (r) => okR(r) && hasRetired(r) && r.avoided.every((a) => a.why.length > 20) },
];

/** Verify every vector; returns the ids that FAILED (empty = all green). */
export function verifyVectors(): string[] {
  const bad: string[] = [];
  for (const v of CHOOSER_VECTORS) {
    let r: ChooserResult | ChooserError;
    try {
      r = choose(v.input);
    } catch {
      bad.push(v.id);
      continue;
    }
    if (!v.expect(r)) bad.push(v.id);
  }
  return bad;
}
