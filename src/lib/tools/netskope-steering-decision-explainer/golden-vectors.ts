// ============================================================================
// src/lib/tools/netskope-steering-decision-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS: every documented branch - the three modes' scopes, the
// RFC1918 default, dynamic steering with mode None, Fail Close's
// domain/cert-pinned rescue versus category casualty, steer-and-decrypt,
// the non-standard-port-by-IP pitfall, the no-published-precedence note,
// and the validation paths.
// GOLDEN_VECTOR_SET_ID: netskope-steering-decision-explainer-golden-v1.
// ============================================================================

import { run } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "netskope-steering-decision-explainer-golden-v1";

export interface SteeringVector {
  name: string;
  input: string;
  expect: (r: ReturnType<typeof run>) => boolean;
  expectError?: RegExp;
}

export const STEERING_VECTORS: SteeringVector[] = [
  {
    name: "web flow in Web mode, no exceptions -> STEERED with TLS pointer",
    input: "mode: web\ntunnel: up\nflow: web app.example.com",
    expect: (r) => r.verdict === "STEERED" && r.notes.some((n) => n.includes("TLS")),
  },
  {
    name: "RFC1918 destination -> BYPASSED by documented default",
    input: "mode: all\ntunnel: up\nflow: rfc1918 10.20.30.40",
    expect: (r) => r.verdict === "BYPASSED" && r.ledger.some((s) => s.outcome.includes("always bypassed")),
  },
  {
    name: "non-web flow in Web mode -> DIRECT (out of scope)",
    input: "mode: web\ntunnel: up\nflow: non-web tcp/5432",
    expect: (r) => r.verdict === "DIRECT" && r.ledger.some((s) => s.outcome.includes("All Traffic mode")),
  },
  {
    name: "non-web flow in All mode -> STEERED (Cloud Firewall scope)",
    input: "mode: all\ntunnel: up\nflow: non-web udp/514",
    expect: (r) => r.verdict === "STEERED",
  },
  {
    name: "generic web in Cloud Apps Only -> DIRECT",
    input: "mode: cloud-apps\ntunnel: up\nflow: web random-site.example",
    expect: (r) => r.verdict === "DIRECT" && r.ledger.some((s) => s.outcome.includes("selected applications")),
  },
  {
    name: "steered app in Cloud Apps Only -> STEERED",
    input: "mode: cloud-apps\ntunnel: up\nflow: app corporate-crm",
    expect: (r) => r.verdict === "STEERED",
  },
  {
    name: "domain exception match -> BYPASSED at Client",
    input: "mode: web\ntunnel: up\nflow: web internal.netskope.com\nexception: domain *.netskope.com\nflow-matches: domain",
    expect: (r) => r.verdict === "BYPASSED" && r.ledger.some((s) => s.check.includes('domain "*.netskope.com"')),
  },
  {
    name: "cert-pinned with steer-decrypt -> STEERED and decrypted",
    input: "mode: web\ntunnel: up\nflow: app devtool\nexception: cert-pinned devtool steer-decrypt\nflow-matches: cert-pinned",
    expect: (r) => r.verdict === "STEERED" && r.headline.includes("decrypted"),
  },
  {
    name: "dynamic steering, on-prem mode None -> DIRECT, exceptions unprocessed",
    input: "dynamic: on\nlocation: on-prem\nmode-on-prem: none\nmode-off-prem: web\ntunnel: up\nflow: web app.example.com\nexception: domain *.example.com\nflow-matches: domain",
    expect: (r) => r.verdict === "DIRECT" && r.ledger.some((s) => s.outcome.includes("exceptions are not processed")),
  },
  {
    name: "tunnel down + Fail Close + domain exception -> BYPASSED (documented rescue)",
    input: "mode: web\ntunnel: down\nfail-close: on\nflow: web login.example.com\nexception: domain login.example.com\nflow-matches: domain",
    expect: (r) => r.verdict === "BYPASSED" && r.notes.some((n) => n.includes("Category-based")),
  },
  {
    name: "tunnel down + Fail Close + only category match -> BLOCKED (documented casualty)",
    input: "mode: web\ntunnel: down\nfail-close: on\nflow: web news.example.com\nexception: category News\nflow-matches: category",
    expect: (r) => r.verdict === "BLOCKED" && r.ledger.some((s) => s.outcome.includes("category-based exceptions are blocked")),
  },
  {
    name: "non-standard web port accessed by IP in Web mode -> DIRECT with remedy note",
    input: "mode: web\ntunnel: up\nflow: web 203.0.113.7:8443\nnon-standard-port: ip",
    expect: (r) => r.verdict === "DIRECT" && r.ledger.some((s) => s.outcome.includes("both the FQDN and the IP")),
  },
  {
    name: "two matching families -> bypass + no-published-precedence note",
    input: "mode: web\ntunnel: up\nflow: web fin.example.com\nexception: domain *.example.com\nexception: category Finance\nflow-matches: domain category",
    expect: (r) => r.verdict === "BYPASSED" && r.notes.some((n) => n.includes("do not publish a cross-family precedence")),
  },
  {
    name: "flow-matches naming an unconfigured kind -> teaching error",
    input: "mode: web\ntunnel: up\nflow: web x.example\nflow-matches: domain",
    expect: () => false,
    expectError: /flow-matches names "domain" but no/,
  },
];

/** Run every vector; return failures (empty = all green). */
export function verifyVectors(): string[] {
  const failures: string[] = [];
  for (const v of STEERING_VECTORS) {
    try {
      const r = run(v.input);
      if (v.expectError) failures.push(`${v.name}: expected error, got ${r.verdict}`);
      else if (!v.expect(r)) failures.push(`${v.name}: expectation failed (got ${r.verdict})`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!v.expectError) failures.push(`${v.name}: unexpected error ${msg}`);
      else if (!v.expectError.test(msg)) failures.push(`${v.name}: error mismatch ${msg}`);
    }
  }
  return failures;
}
