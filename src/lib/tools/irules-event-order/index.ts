// ============================================================================
// src/lib/tools/irules-event-order/index.ts
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
  toolSlug: "irules-event-order",
  sources: [
    { id: "irules-events", label: "F5 Clouddocs — Master List of iRule Events", type: "doc", url: "https://clouddocs.f5.com/api/irules/Events.html", access_date: "2026-06-29", scope: "event names and triggers", status: "active" },
    { id: "client-accepted", label: "F5 Clouddocs — CLIENT_ACCEPTED", type: "doc", url: "https://clouddocs.f5.com/api/irules/CLIENT_ACCEPTED.html", access_date: "2026-06-29", scope: "connection-setup timing (Standard vs FastL4)", status: "active" },
    { id: "http-request-send", label: "F5 Clouddocs — HTTP_REQUEST_SEND", type: "doc", url: "https://clouddocs.f5.com/api/irules/HTTP_REQUEST_SEND.html", access_date: "2026-06-29", scope: "server-side send ordering", status: "active" },
    { id: "irule-priority", label: "F5 — K12090273: iRule priority command controls execution order", type: "doc", url: "https://my.f5.com/manage/s/article/K12090273", access_date: "2026-06-29", scope: "within-event priority", status: "active" },
    { id: "devcentral-order", label: "F5 DevCentral codeshare — iRule Event Order (captured sequence)", type: "community", url: "https://community.f5.com/kb/codeshare/irule-event-order/290961", access_date: "2026-06-29", scope: "empirical event ordering", status: "active" },
  ],
});
