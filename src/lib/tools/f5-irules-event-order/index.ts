// ============================================================================
// src/lib/tools/f5-irules-event-order/index.ts
// ----------------------------------------------------------------------------
// Public surface of the arsenal-local iRule event-order planner. Pure,
// deterministic, never contacts a BIG-IP. Liftable into an open library.
// ============================================================================

export {
  planEventOrder,
  parseProfileStack,
  run,
  EventOrderInputError,
} from "./compute";
export type {
  VirtualConfig,
  IRuleEvent,
  EventOrderResult,
  EventSide,
  EventTrigger,
} from "./compute";
export {
  GOLDEN_VECTOR_SET_ID,
  GOLDEN_VECTORS,
  verifyVectors,
} from "./golden-vectors";
export type { EventOrderVector, VerifyReport } from "./golden-vectors";

/** Tool manifest. `sources` surface on the tool page as reference links. */
export const manifest = Object.freeze({
  toolSlug: "f5-irules-event-order",
  // How input is handled: Share results (2026-10-27) builds a link only when pressed, carrying the five profile switches
  // after the #. This manifest had no dangerousInputHandling key before; the page has no free-text input to guard.
  dangerousInputHandling: ["share-input"],
  /** The Learn article written for this tool. Added 2026-08-12: this manifest
   *  had no learnLinks key at all, so the tool page offered no route back into
   *  the explanation. The link is the tool's OWN article, which is guaranteed
   *  to exist (check-tool-articles enforces it) rather than a judgement call. */
  learnLinks: [
    "learn/bigip-l4-protocol-profiles",
    "learn/irule-clientside-vs-serverside",
    "learn/irule-event-order-explained",
    "learn/irule-events-modules-and-profiles",
    "learn/irule-fastl4-vs-standard-events",
    "learn/irule-priority-and-event-order",
    "learn/irule-ssl-handshake-events",
  ],
  canonicalAliases: ["irules-event-order"], // pre-rename slug (2026-07-03), kept for omnibox continuity
  sources: [
    { id: "irules-events", label: "F5 Clouddocs - Master List of iRule Events", type: "doc", url: "https://clouddocs.f5.com/api/irules/Events.html", access_date: "2026-06-29", scope: "event names and triggers", status: "active" },
    { id: "client-accepted", label: "F5 Clouddocs - CLIENT_ACCEPTED", type: "doc", url: "https://clouddocs.f5.com/api/irules/CLIENT_ACCEPTED.html", access_date: "2026-06-29", scope: "connection-setup timing (Standard vs FastL4)", status: "active" },
    { id: "http-request-send", label: "F5 Clouddocs - HTTP_REQUEST_SEND", type: "doc", url: "https://clouddocs.f5.com/api/irules/HTTP_REQUEST_SEND.html", access_date: "2026-06-29", scope: "server-side send ordering", status: "active" },
    { id: "irule-priority", label: "F5 - K12090273: iRule priority command controls execution order", type: "doc", url: "https://my.f5.com/manage/s/article/K12090273", access_date: "2026-06-29", scope: "within-event priority", status: "active" },
    { id: "devcentral-order", label: "F5 DevCentral codeshare - iRule Event Order (captured sequence)", type: "community", url: "https://community.f5.com/kb/codeshare/irule-event-order/290961", access_date: "2026-06-29", scope: "empirical event ordering", status: "active" },
    // Added 2026-10-26: the JSON events' page, source of the 21.0.0 introduction named in the notes.
    { id: "json-request", label: "F5 Clouddocs - JSON_REQUEST", type: "doc", url: "https://clouddocs.f5.com/api/irules/JSON_REQUEST.html", access_date: "2026-10-26", scope: "JSON events introduced in BIG-IP 21.0.0", status: "active" },
    // Added 2026-10-26: the SSE event's page, same introduction version.
    { id: "sse-response", label: "F5 Clouddocs - SSE_RESPONSE", type: "doc", url: "https://clouddocs.f5.com/api/irules/SSE_RESPONSE.html", access_date: "2026-10-26", scope: "SSE event introduced in BIG-IP 21.0.0", status: "active" },
    // Added 2026-10-26: the profiles chapter stating JSON and SSE profiles ride with an HTTP profile.
    { id: "mcp-profiles", label: "F5 - BIG-IP 21.0 profiles reference: Model Context Protocol", type: "doc", url: "https://techdocs.f5.com/en-us/bigip-21-0-0/big-ip-local-traffic-management-profiles-reference/model-context-protocol.html", access_date: "2026-10-26", scope: "JSON and SSE profiles alongside an HTTP profile", status: "active" },
  ],
});
