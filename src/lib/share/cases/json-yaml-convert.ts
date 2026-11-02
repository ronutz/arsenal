// ============================================================================
// src/lib/share/cases/json-yaml-convert.ts
// ----------------------------------------------------------------------------
// Share cases of the JSON <-> YAML converter: the box as pasted, the direction
// and the indent, always written; a credential blocks the link.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { JSON_YAML_SHARE, type JsonYamlShareState } from "../../tools/json-yaml-convert/share"; // the spec

/** The cases. */
export const JSON_YAML_CONVERT_SHARE_CASES = defineShareCases<JsonYamlShareState, JsonYamlShareState>({
  spec: JSON_YAML_SHARE, // the spec
  accept: [
    { id: "example-yaml", state: { input: "name: api\nport: 80", direction: "yaml-to-json", indent: 2 }, params: { input: "name: api\nport: 80", direction: "yaml-to-json", indent: "2" }, restored: { input: "name: api\nport: 80", direction: "yaml-to-json", indent: 2 } }, // the page's Example, read as YAML
    { id: "json-to-yaml-4", state: { input: "{\"replicas\": 3, \"image\": \"nginx:1.27\"}", direction: "json-to-yaml", indent: 4 }, params: { input: "{\"replicas\": 3, \"image\": \"nginx:1.27\"}", direction: "json-to-yaml", indent: "4" }, restored: { input: "{\"replicas\": 3, \"image\": \"nginx:1.27\"}", direction: "json-to-yaml", indent: 4 } }, // the other way
    { id: "maybe-secret-goes", state: { input: "db:\n  user: app\n  password: changeme\n", direction: "yaml-to-json", indent: 2 }, params: { input: "db:\n  user: app\n  password: changeme\n", direction: "yaml-to-json", indent: "2" }, restored: { input: "db:\n  user: app\n  password: changeme\n", direction: "yaml-to-json", indent: 2 } }, // a secret-looking key: a caution line
  ],
  empty: [
    { id: "blank", state: { input: "", direction: "json-to-yaml", indent: 2 } }, // nothing pasted
  ],
  blocked: [
    { id: "yaml-refresh-token", state: { input: "oauth:\n  refresh_token: tGzv3JOkF0XG5Qx2TlKWIA\n", direction: "yaml-to-json", indent: 2 }, code: "secret" }, // RFC 6749 section 1.5 (RFC 6749 section 5.1's example value)
    { id: "pem-key", state: { input: "tls:\n  key: |\n    -----BEGIN EC PRIVATE KEY-----\n    MHcCAQEEIIrYSSNQFaA2Hwf1duRSxKtLYX5CB04fSeQ6tF1aY/PuoAoGCCqGSM49\n    -----END EC PRIVATE KEY-----\n", direction: "yaml-to-json", indent: 2 }, code: "secret" }, // a PEM private key
  ],
  reject: [
    { id: "no-input", values: { input: null, direction: "json-to-yaml", indent: "2" } }, // nothing to convert
    { id: "unknown-direction", values: { input: "a: 1", direction: "yaml-to-toml", indent: "2" } }, // not offered
    { id: "unknown-indent", values: { input: "a: 1", direction: "yaml-to-json", indent: "3" } }, // not offered
  ],
});
