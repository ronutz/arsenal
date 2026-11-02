// ============================================================================
// src/lib/share/cases/f5xc-api-path-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the F5 XC API path explainer (2026-11-01, wave 4B): the
// OpenAPI file goes as pasted once the page lists an operation; a JWT in an
// example or a SecretType secret blocks the link; a secret-looking member is
// only named in the caution line; a file with no operation, or not JSON, has
// nothing to share.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { API_PATH_SHARE, type ApiPathShareState } from "../../tools/f5xc-api-path-explainer/share"; // the spec

/** The page's Example, built as the component builds it. */
const EXAMPLE = JSON.stringify(
  {
    openapi: "3.0.3", // the version
    info: { title: "Orders API" }, // the title
    components: { securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } } }, // a scheme
    security: [{ bearerAuth: [] }], // applied to all
    paths: {
      "/orders": {
        get: { summary: "List orders", responses: { "200": {}, "401": {} } }, // an operation
        post: { summary: "Create order", requestBody: { content: { "application/json": {} } }, responses: { "201": {} } }, // with a body
      },
      "/orders/{id}": {
        get: { summary: "Get order", parameters: [{ name: "id", in: "path", required: true }], responses: { "200": {} } }, // object level
        delete: { security: [], summary: "Delete order", parameters: [{ name: "id", in: "path", required: true }], responses: { "204": {} }, deprecated: true }, // unauthenticated
      },
    },
  },
  null,
  2,
); // as the component holds it

/** A Swagger 2.0 file whose parameter example names an API key: a maybe-secret, named, not blocked. */
const SWAGGER_KEY = JSON.stringify({ swagger: "2.0", info: { title: "Keys" }, securityDefinitions: { key: { type: "apiKey", name: "X-Api-Key", in: "header" } }, paths: { "/k": { get: { parameters: [{ name: "q", in: "query" }], "x-sample": { apiKey: "k-123-sample" }, responses: { "200": {} } } } } }, null, 2); // one operation

/** RFC 7519 section 3.1's example JWT (read 2026-11-01), standing in for a live token in an example. */
const JWT = "eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"; // never in a link
/** The XC API reference's own example of a clear secret (read 2026-11-01). */
const XC_CLEAR = "string:///U2VjcmV0SW5mb3JtYXRpb24="; // never in a link

/** The cases. */
export const F5XC_API_PATH_SHARE_CASES = defineShareCases<ApiPathShareState, ApiPathShareState>({
  spec: API_PATH_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // the Example, as pasted
    { id: "swagger-key-named", state: { input: SWAGGER_KEY }, params: { input: SWAGGER_KEY }, restored: { input: SWAGGER_KEY } }, // a maybe-secret does not block
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing pasted
    { id: "not-json", state: { input: "openapi: 3.0.3" } }, // YAML is refused with a message
    { id: "no-operation", state: { input: "{\"openapi\": \"3.0.3\", \"paths\": {}}" } }, // nothing listed
  ],
  blocked: [
    { id: "jwt-in-example", state: { input: EXAMPLE.replace("\"List orders\"", `"List orders", "x-token": "Bearer ${JWT}"`) }, code: "secret" }, // a JWS
    { id: "secret-type", state: { input: EXAMPLE.replace("\"bearer\"", `"bearer", "x-key": {"clear_secret_info": {"url": "${XC_CLEAR}"}}`) }, code: "secret" }, // a SecretType secret in clear
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: "  " } }, // white space
    { id: "absent", values: { input: null } }, // not there
  ],
});
