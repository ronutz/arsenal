// ============================================================================
// The {manifest, run, vectors} triple for the FortiOS CLI config explainer.
// Structure and verbs, offline.
// ============================================================================

export { decodeConfig, run, ConfigParseError } from "./compute";
export type { ConfigDecode, ConfigLine, Verb } from "./compute";
export { verifyVectors, CONFIG_VECTORS, GOLDEN_VECTOR_SET_ID } from "./golden-vectors";
export type { ConfigVector } from "./golden-vectors";

export const manifest = Object.freeze({
  toolSlug: "fortios-cli-config-explainer",
  learnLinks: [
    "learn/fortios-cli-grammar",
    "learn/fortigate-policy-order",
  ],
  sources: Object.freeze([
    Object.freeze({ id: "fortios-cli-ref", label: "Fortinet - FortiOS CLI reference: using the CLI, command syntax and the config/edit/set/next/end structure", url: "https://docs.fortinet.com/document/fortigate/7.4.0/cli-reference" }),
    Object.freeze({ id: "fortios-policy", label: "Fortinet - Firewall policy (FortiOS administration guide)", url: "https://docs.fortinet.com/document/fortigate/7.4.2/administration-guide/656084/firewall-policy" }),
  ]),
});
