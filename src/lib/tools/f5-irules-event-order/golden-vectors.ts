// ============================================================================
// src/lib/tools/f5-irules-event-order/golden-vectors.ts
// ----------------------------------------------------------------------------
// Fixed profile-stack -> expected automatic event sequence. The sequences are
// pinned to F5 Clouddocs and the DevCentral iRule-event-order capture.
// ============================================================================

import { run } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "f5-irules-event-order-golden-2026-06-29";

export interface EventOrderVector {
  id: string;
  input: string;
  expectAuto: string[];
  expectConditional: string[];
}

export const GOLDEN_VECTORS: EventOrderVector[] = [
  {
    id: "https-reencrypt",
    input: "clientssl http serverssl pool",
    expectAuto: [
      "CLIENT_ACCEPTED",
      "CLIENTSSL_CLIENTHELLO",
      "CLIENTSSL_HANDSHAKE",
      "HTTP_REQUEST",
      "LB_SELECTED",
      "SERVER_CONNECTED",
      "SERVERSSL_HANDSHAKE",
      "HTTP_REQUEST_SEND",
      "HTTP_RESPONSE",
      "SERVER_CLOSED",
      "CLIENT_CLOSED",
    ],
    expectConditional: [
      "HTTP_REQUEST_DATA",
      "LB_FAILED",
      "HTTP_RESPONSE_CONTINUE",
      "HTTP_RESPONSE_DATA",
    ],
  },
  {
    id: "ssl-offload",
    input: "clientssl http pool",
    expectAuto: [
      "CLIENT_ACCEPTED",
      "CLIENTSSL_CLIENTHELLO",
      "CLIENTSSL_HANDSHAKE",
      "HTTP_REQUEST",
      "LB_SELECTED",
      "SERVER_CONNECTED",
      "HTTP_REQUEST_SEND",
      "HTTP_RESPONSE",
      "SERVER_CLOSED",
      "CLIENT_CLOSED",
    ],
    expectConditional: [
      "HTTP_REQUEST_DATA",
      "LB_FAILED",
      "HTTP_RESPONSE_CONTINUE",
      "HTTP_RESPONSE_DATA",
    ],
  },
  {
    id: "http-clear",
    input: "http pool",
    expectAuto: [
      "CLIENT_ACCEPTED",
      "HTTP_REQUEST",
      "LB_SELECTED",
      "SERVER_CONNECTED",
      "HTTP_REQUEST_SEND",
      "HTTP_RESPONSE",
      "SERVER_CLOSED",
      "CLIENT_CLOSED",
    ],
    expectConditional: [
      "HTTP_REQUEST_DATA",
      "LB_FAILED",
      "HTTP_RESPONSE_CONTINUE",
      "HTTP_RESPONSE_DATA",
    ],
  },
  {
    id: "raw-tcp",
    input: "pool",
    expectAuto: [
      "CLIENT_ACCEPTED",
      "LB_SELECTED",
      "SERVER_CONNECTED",
      "SERVER_CLOSED",
      "CLIENT_CLOSED",
    ],
    expectConditional: ["CLIENT_DATA", "LB_FAILED", "SERVER_DATA"],
  },
  {
    id: "irule-only-no-pool",
    input: "http",
    expectAuto: ["CLIENT_ACCEPTED", "HTTP_REQUEST", "CLIENT_CLOSED"],
    expectConditional: ["HTTP_REQUEST_DATA"],
  },
];

export interface VerifyReport {
  setId: string;
  total: number;
  passed: number;
  failures: { id: string; reason: string }[];
}

export function verifyVectors(): VerifyReport {
  const failures: { id: string; reason: string }[] = [];
  for (const v of GOLDEN_VECTORS) {
    try {
      const r = run(v.input);
      const auto = r.events.map((e) => e.name);
      const cond = r.conditional.map((e) => e.name);
      if (JSON.stringify(auto) !== JSON.stringify(v.expectAuto))
        failures.push({ id: v.id, reason: `auto ${auto.join(",")} != ${v.expectAuto.join(",")}` });
      if (JSON.stringify(cond) !== JSON.stringify(v.expectConditional))
        failures.push({ id: v.id, reason: `cond ${cond.join(",")} != ${v.expectConditional.join(",")}` });
    } catch (err) {
      failures.push({ id: v.id, reason: `threw: ${(err as Error).message}` });
    }
  }
  return {
    setId: GOLDEN_VECTOR_SET_ID,
    total: GOLDEN_VECTORS.length,
    passed: GOLDEN_VECTORS.length - failures.length,
    failures,
  };
}
