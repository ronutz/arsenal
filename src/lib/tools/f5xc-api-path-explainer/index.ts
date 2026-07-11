// ============================================================================
// src/lib/tools/f5xc-api-path-explainer/index.ts
// ----------------------------------------------------------------------------
// THE F5XC API PATH EXPLAINER - a {manifest, run, vectors} triple. Paste the
// OpenAPI / Swagger spec you import into (or download from) XC API Protection;
// get every path + operation with its method, parameters, request body,
// responses, and authentication, plus unauthenticated and object-level flags.
// Grounded in the OpenAPI standard and OWASP API Security Top 10. Pure.
// ============================================================================

import { run } from "./compute";
import { GOLDEN_VECTOR_SET_ID } from "./golden-vectors";

export { explainSpec, run } from "./compute";
export type { SpecView, OperationView, ParamView, Flag, SpecVersion, Severity } from "./compute";
export { GOLDEN_VECTOR_SET_ID, verifyVectors, goldenVectors } from "./golden-vectors";

export { run as default };

export const manifest = Object.freeze({
  toolFamily: "F5 Distributed Cloud (XC)",
  toolSlug: "f5xc-api-path-explainer",
  canonicalAliases: ["xc-api-path", "f5xc-openapi-explainer", "xc-swagger-paths", "f5xc-api-inventory", "distributed-cloud-openapi"],
  inputDetectors: [],

  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["bounded-parse", "json-only"],
  shareSafetyDefault: "manual",

  learnLinks: ["learn/f5xc-openapi-and-api-inventory"],
  sources: [
    {
      id: "xc-import-openapi",
      label: "F5 Distributed Cloud: Import OpenAPI Specification to Define API Definition (supported versions: OpenAPI 2.0 and 3.0.x)",
      type: "docs",
      url: "https://docs.cloud.f5.com/docs-v2/web-app-and-api-protection/how-to/adv-security/import-openapi-spec",
      access_date: "2026-07-11",
      scope: "XC imports OpenAPI 2.0 (Swagger) and 3.0.x specs to build the API inventory (endpoints + methods) and drive OpenAPI Validation as a positive security model",
      status: "active",
    },
    {
      id: "xc-api-discovery-swagger",
      label: "F5 Distributed Cloud: Enable API Endpoint Discovery and Schema Learning (downloaded Swagger file is JSON)",
      type: "docs",
      url: "https://docs.cloud.f5.com/docs-v2/web-app-and-api-protection/how-to/app-security/apiep-discovery-control",
      access_date: "2026-07-11",
      scope: "XC API Discovery learns schemas from traffic and generates a downloadable Swagger JSON that can be edited and re-imported - the same artifact this tool reads",
      status: "active",
    },
    {
      id: "openapi-spec",
      label: "OpenAPI Specification (paths, operations, parameters, requestBody, responses, security, components)",
      type: "reference",
      url: "https://swagger.io/specification/",
      access_date: "2026-07-11",
      scope: "the OpenAPI 2.0/3.x document structure this tool parses, including $ref resolution and security requirement semantics",
      status: "active",
    },
    {
      id: "owasp-api-top-10",
      label: "OWASP API Security Top 10 (Broken Object Level Authorization, Broken Authentication, Improper Assets Management)",
      type: "reference",
      url: "https://owasp.org/API-Security/editions/2023/en/0x11-t10/",
      access_date: "2026-07-11",
      scope: "the risk framing for the flags: unauthenticated operations (Broken Authentication) and object-level path-parameter endpoints (Broken Object Level Authorization)",
      status: "active",
    },
  ],
  credits: [
    { handle: "f5-docs", display_name: "F5 Distributed Cloud documentation", role: "reference", public: true },
    { handle: "openapi", display_name: "OpenAPI Initiative", role: "reference", public: true },
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});
