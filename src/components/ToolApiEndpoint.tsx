// ============================================================================
// src/components/ToolApiEndpoint.tsx
// ----------------------------------------------------------------------------
// THE ENDPOINT-URL AFFORDANCE for an API-capable tool (a server component; no
// "use client"). On a tool that exposes an HTTP API, this shows the endpoint
// URL, e.g. "GET https://ronutz.com/api/v1/cidr", as a link to the /api page's
// Swagger UI view, deep-linked to that tool's operation.
//
// HONEST FRAMING: the endpoint is IMPLEMENTED and DOCUMENTED, but the site does
// NOT serve the API (see the /api page). So this URL is a reference/copy target
// and a doorway into the spec, not a live call. The label makes that clear.
//
// The link carries the operation as query params (?op=<operationId>&tag=<tag>)
// rather than a raw Swagger fragment, because Swagger UI's own deep-link
// escaping is version-specific; the /api page turns these params into the right
// Swagger deep link on the client. operationId + tag come from the generated
// API_ENDPOINTS map (src/generated/api-endpoints.ts), which is derived from the
// real OpenAPI spec, so the operationId is always correct (e.g. cidr's
// "computeCidr", not a guessed "run_cidr").
//
// COPY is passed in already-localized by the caller (the FamilyChip pattern),
// so this file has no i18n dependency. VISUAL lives in the .tool-endpoint CSS.
// ============================================================================

import { Link } from "@/i18n/navigation";
import { apiEndpointFor } from "@/generated/api-endpoints";

export interface ToolApiEndpointLabels {
  /** Small heading / eyebrow, e.g. "API endpoint". */
  heading: string;
  /** Note about serving state. The page passes the ON or OFF variant depending
      on whether API processing is switched on (served locally vs documented,
      not served). */
  note: string;
  /** Accessible label for the link, e.g. "Open the API reference for this tool". */
  linkAria: string;
}

export default function ToolApiEndpoint({
  slug,
  processingOn,
  labels,
}: {
  /** Tool slug; looked up in the generated API endpoint map. */
  slug: string;
  /** True when local API processing is switched on (drives the green vs grey
      pill colour via the data-processing attribute). */
  processingOn: boolean;
  /** Already-localized strings (the page resolves these). */
  labels: ToolApiEndpointLabels;
}) {
  const endpoint = apiEndpointFor(slug);
  if (!endpoint) return null; // tool has no API endpoint → render nothing

  // Deep link to the /api page, Swagger view, this tool's operation. Query
  // params (not a raw fragment) keep this robust across Swagger UI versions.
  const href = `/api?op=${encodeURIComponent(endpoint.op)}&tag=${encodeURIComponent(endpoint.tag)}`;

  // data-processing drives the colour: "on" => green (served locally),
  // "off" => neutral grey/white (documented, not served).
  return (
    <div className="tool-endpoint" data-processing={processingOn ? "on" : "off"}>
      <span className="tool-endpoint-eyebrow">{labels.heading}</span>
      <Link href={href} className="tool-endpoint-link" aria-label={labels.linkAria}>
        <span className="tool-endpoint-method mono">{endpoint.method}</span>
        <span className="tool-endpoint-url mono">{endpoint.url}</span>
      </Link>
      <span className="tool-endpoint-note">{labels.note}</span>
    </div>
  );
}
