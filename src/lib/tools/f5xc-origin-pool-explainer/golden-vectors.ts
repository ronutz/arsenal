// ============================================================================
// src/lib/tools/f5xc-origin-pool-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors: representative origin_pool specs decoded into asserted views,
// including the two TLS security levels (reused from W1-2), the skip-verify
// warning, and the port/algorithm/endpoint-selection fields.
// ============================================================================

import { explainOriginPool, run } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "f5xc-origin-pool-explainer/2026-07-11";

const SAMPLE_A = JSON.stringify({
  metadata: { name: "buytime-pool" },
  spec: {
    origin_servers: [
      { public_name: { dns_name: "webserver.example.com" }, labels: { tier: "web" } },
      { k8s_service: { service_name: "frontend.hipster", site_locator: { site: { name: "ce-site-1" } } } },
    ],
    port: 443,
    loadbalancer_algorithm: "ROUND_ROBIN",
    endpoint_selection: "LOCAL_PREFERRED",
    healthcheck: [{ name: "http-hc" }],
    use_tls: { tls_config: { default_security: {} }, use_host_header_as_sni: {}, volterra_trusted_ca: {}, no_mtls: {} },
  },
});

const SAMPLE_B = JSON.stringify({
  spec: {
    origin_servers: [{ private_ip: { ip: "10.0.0.5", site_locator: { virtual_site: { name: "fra-res" } } } }],
    same_as_endpoint_port: {},
    loadbalancer_algorithm: "RING_HASH",
    use_tls: { tls_config: { medium_security: {} }, sni: "origin.internal", skip_server_verification: {}, use_mtls: {} },
  },
});

const SAMPLE_NOTLS = JSON.stringify({ spec: { origin_servers: [{ public_ip: { ip: "203.0.113.9" } }], port: 80, no_tls: {} } });

export function verifyVectors(): { passed: number; failed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;
  const ok = (name: string, cond: boolean, detail = "") => {
    if (cond) passed++;
    else failures.push(`[${name}] ${detail}`);
  };

  const a = explainOriginPool(SAMPLE_A);
  ok("a-recognized", a.ok && a.recognized);
  ok("a-name", a.name === "buytime-pool", a.name);
  ok("a-origin-count", a.origins.length === 2, `${a.origins.length}`);
  ok("a-o0-type", a.origins[0].typeLabel === "Public DNS name" && a.origins[0].address === "webserver.example.com", JSON.stringify(a.origins[0]));
  ok("a-o0-label", a.origins[0].labels.includes("tier=web"), JSON.stringify(a.origins[0].labels));
  ok("a-o1-k8s", a.origins[1].typeLabel === "K8s service" && a.origins[1].address === "frontend.hipster" && a.origins[1].location === "site ce-site-1", JSON.stringify(a.origins[1]));
  ok("a-port", a.port.kind === "explicit" && a.port.value === 443, JSON.stringify(a.port));
  ok("a-algo", a.algorithm === "Round Robin", a.algorithm);
  ok("a-endpoint", a.endpointSelection === "Local Preferred", a.endpointSelection);
  ok("a-hc", a.healthchecks.length === 1 && a.healthchecks[0] === "http-hc", JSON.stringify(a.healthchecks));
  ok("a-tls-on", a.tls.enabled && a.tls.level === "High" && a.tls.minTls === "TLS 1.2" && a.tls.maxTls === "TLS 1.3", JSON.stringify(a.tls));
  ok("a-tls-sni", a.tls.sni === "host-header", a.tls.sni);
  ok("a-tls-verify", a.tls.serverVerify === "trusted-ca" && a.tls.mtls === false, JSON.stringify(a.tls));
  ok("a-weight-note", a.notes.some((n) => n.includes("weights and priorities")), "missing weight/priority teaching note");

  const b = explainOriginPool(SAMPLE_B);
  ok("b-origin-priv", b.origins[0].typeLabel === "IP on given sites" && b.origins[0].address === "10.0.0.5" && b.origins[0].location === "virtual site fra-res", JSON.stringify(b.origins[0]));
  ok("b-port-same", b.port.kind === "same-as-endpoint", JSON.stringify(b.port));
  ok("b-algo-ringhash", b.algorithm === "Ring Hash (consistent hashing)", b.algorithm);
  ok("b-tls-medium", b.tls.level === "Medium" && b.tls.minTls === "TLS 1.0", JSON.stringify(b.tls));
  ok("b-tls-sni-value", b.tls.sni === "value" && b.tls.sniValue === "origin.internal", JSON.stringify(b.tls));
  ok("b-tls-skip", b.tls.serverVerify === "skip" && b.tls.mtls === true, JSON.stringify(b.tls));
  ok("b-warn-skip", b.warnings.some((w) => w.includes("verification is disabled")), JSON.stringify(b.warnings));

  const n = explainOriginPool(SAMPLE_NOTLS);
  ok("notls-off", n.tls.enabled === false, JSON.stringify(n.tls));
  ok("notls-port", n.port.kind === "explicit" && n.port.value === 80, JSON.stringify(n.port));

  // run() + negatives
  ok("run-json", run(SAMPLE_A).recognized === true);
  ok("reject-bad-json", explainOriginPool("{nope").ok === false, "bad json not rejected");
  ok("empty-pool-warns", (() => { const r = explainOriginPool(JSON.stringify({ spec: { port: 80 } })); return r.recognized === true && r.warnings.some((w) => w.includes("no origin servers")); })(), "empty pool should warn");
  ok("unrecognized", explainOriginPool(JSON.stringify({ domains: ["x.com"] })).recognized === false, "non-pool JSON should be unrecognized");
  ok("reject-empty", explainOriginPool("").ok === false);

  return { passed, failed: failures.length, failures };
}

export const goldenVectors = [
  "a-recognized", "a-name", "a-origin-count", "a-o0-type", "a-o0-label", "a-o1-k8s", "a-port", "a-algo", "a-endpoint", "a-hc",
  "a-tls-on", "a-tls-sni", "a-tls-verify", "a-weight-note", "b-origin-priv", "b-port-same", "b-algo-ringhash", "b-tls-medium",
  "b-tls-sni-value", "b-tls-skip", "b-warn-skip", "notls-off", "notls-port", "run-json", "reject-bad-json", "empty-pool-warns", "unrecognized", "reject-empty",
];
