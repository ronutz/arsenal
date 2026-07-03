// ============================================================================
// src/lib/tools/f5-lb-method-chooser/golden-vectors.ts
// ----------------------------------------------------------------------------
// Vectors for the LB-method chooser. They pin: the 19-token catalogue, method
// lookup through the documented plural quirk and GUI-style labels, the pool
// observation rules (ratios ignored per K6406, the weighted-least-connections
// connection-limit requirement, slow-ramp pairing, priority-group activation,
// ignore-persisted-weight scoping), the deterministic chooser table, and the
// helpful-error paths. Sources: the tmsh ltm pool reference, K42275060, K6406.
// ============================================================================

import { run } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "f5-lb-method-chooser-golden-v1";

export interface LbVector {
  id: string;
  description: string;
  input: string;
  expectOk?: boolean;
  expectErrorIncludes?: string;
  expectMode?: "pools" | "method" | "catalog" | "choose";
  expectCatalogCount?: number;
  expectMethodToken?: string;
  expectMethodFamily?: "static" | "dynamic";
  expectPoolCount?: number;
  expectPoolModeToken?: { pool: number; token: string };
  expectObservationIncludes?: { pool: number; text: string };
  expectObservationCount?: { pool: number; count: number };
  expectRecommendPrimary?: string;
  expectRecommendAltIncludes?: string;
  expectPrereqIncludes?: string;
}

export const LB_VECTORS: LbVector[] = [
  {
    id: "catalog-19",
    description: "The methods keyword lists all 19 documented tokens",
    input: "methods",
    expectOk: true,
    expectMode: "catalog",
    expectCatalogCount: 19,
  },
  {
    id: "method-lookup-token",
    description: "A canonical token resolves to its explanation",
    input: "predictive-member",
    expectOk: true,
    expectMode: "method",
    expectMethodToken: "predictive-member",
    expectMethodFamily: "dynamic",
  },
  {
    id: "method-plural-quirk",
    description: "The reference's own plural spelling normalizes to the singular token",
    input: "least-connections-members",
    expectOk: true,
    expectMode: "method",
    expectMethodToken: "least-connections-member",
  },
  {
    id: "method-gui-label",
    description: "A GUI-style label resolves to the token",
    input: "Weighted Least Connections (node)",
    expectOk: true,
    expectMode: "method",
    expectMethodToken: "weighted-least-connections-node",
  },
  {
    id: "method-static-family",
    description: "Round Robin is classified static",
    input: "round-robin",
    expectOk: true,
    expectMethodToken: "round-robin",
    expectMethodFamily: "static",
  },
  {
    id: "pool-ratio-ignored",
    description: "Ratios under least-connections trip the K6406 observation",
    input: `ltm pool web_pool {
    load-balancing-mode least-connections-member
    members {
        10.1.1.1:http { ratio 3 }
        10.1.1.2:http { }
    }
}`,
    expectOk: true,
    expectMode: "pools",
    expectPoolCount: 1,
    expectPoolModeToken: { pool: 0, token: "least-connections-member" },
    expectObservationIncludes: { pool: 0, text: "must reference a ratio load-balancing method" },
  },
  {
    id: "pool-default-mode",
    description: "A pool without load-balancing-mode reads as the round-robin default",
    input: `ltm pool plain_pool {
    members {
        10.1.1.9:http { }
    }
}`,
    expectOk: true,
    expectPoolModeToken: { pool: 0, token: "round-robin" },
    expectObservationIncludes: { pool: 0, text: "documented default" },
  },
  {
    id: "pool-wlc-missing-limit",
    description: "Weighted least connections with a limitless member trips the requirement warning",
    input: `ltm pool app_pool {
    load-balancing-mode weighted-least-connections-member
    members {
        10.2.2.1:443 { connection-limit 200 }
        10.2.2.2:443 { }
    }
}`,
    expectOk: true,
    expectObservationIncludes: { pool: 0, text: "requires a connection-limit on all members" },
  },
  {
    id: "pool-slow-ramp-zero",
    description: "slow-ramp-time 0 under least-connections trips the flood warning",
    input: `ltm pool lc_pool {
    load-balancing-mode least-connections-member
    slow-ramp-time 0
    members {
        10.3.3.1:80 { }
    }
}`,
    expectOk: true,
    expectObservationIncludes: { pool: 0, text: "burst of new traffic" },
  },
  {
    id: "pool-ipw-out-of-scope",
    description: "ignore-persisted-weight under round-robin is flagged as having no effect",
    input: `ltm pool rr_pool {
    load-balancing-mode round-robin
    ignore-persisted-weight yes
    members {
        10.4.4.1:80 { }
    }
}`,
    expectOk: true,
    expectObservationIncludes: { pool: 0, text: "does not change Round Robin" },
  },
  {
    id: "pool-pga-active",
    description: "Priority groups with min-active-members explain the activation threshold",
    input: `ltm pool tiered_pool {
    load-balancing-mode round-robin
    min-active-members 2
    members {
        10.5.5.1:80 { priority-group 10 }
        10.5.5.2:80 { priority-group 10 }
        10.5.5.3:80 { priority-group 5 }
    }
}`,
    expectOk: true,
    expectObservationIncludes: { pool: 0, text: "confined to the highest-priority group" },
  },
  {
    id: "pool-least-sessions-prereq",
    description: "Least sessions surfaces the persistence-profile prerequisite",
    input: `ltm pool sess_pool {
    load-balancing-mode least-sessions
    members {
        10.6.6.1:80 { }
    }
}`,
    expectOk: true,
    expectObservationIncludes: { pool: 0, text: "persistence profile" },
  },
  {
    id: "choose-wlc",
    description: "connlimit capacity reacting to connections recommends weighted least connections",
    input: "choose capacity=connlimit react=connections",
    expectOk: true,
    expectMode: "choose",
    expectRecommendPrimary: "weighted-least-connections-member",
    expectPrereqIncludes: "connection-limit",
  },
  {
    id: "choose-static-equal",
    description: "equal capacity with no reaction recommends round robin",
    input: "choose capacity=equal react=none",
    expectOk: true,
    expectRecommendPrimary: "round-robin",
    expectRecommendAltIncludes: "least-connections-member",
  },
  {
    id: "choose-measured",
    description: "measured capacity recommends dynamic ratio regardless of the react axis",
    input: "choose capacity=measured react=none",
    expectOk: true,
    expectRecommendPrimary: "dynamic-ratio-member",
    expectPrereqIncludes: "monitoring",
  },
  {
    id: "choose-sessions",
    description: "reacting to sessions recommends least sessions with the persistence prerequisite",
    input: "choose capacity=equal react=sessions",
    expectOk: true,
    expectRecommendPrimary: "least-sessions",
    expectPrereqIncludes: "persistence",
  },
  {
    id: "error-empty",
    description: "Empty input asks for a pool, a method, methods, or choose",
    input: "   ",
    expectOk: false,
    expectErrorIncludes: "Paste an ltm pool",
  },
  {
    id: "error-unknown-method",
    description: "An undocumented token gets a helpful error",
    input: "fastest-ever",
    expectOk: false,
    expectErrorIncludes: "not a documented load-balancing mode",
  },
  {
    id: "error-no-pools",
    description: "tmsh without pools says so",
    input: "ltm virtual vs_app {\n    destination 10.0.0.1:443\n}",
    expectOk: false,
    expectErrorIncludes: "No ltm pool stanzas found",
  },
  {
    id: "error-choose-partial",
    description: "choose with a missing answer names both required answers",
    input: "choose capacity=equal",
    expectOk: false,
    expectErrorIncludes: "needs both answers",
  },
];

/** Run every vector; returns human-readable failures (empty = all green). */
export function verifyVectors(): string[] {
  const failures: string[] = [];
  for (const v of LB_VECTORS) {
    let out: ReturnType<typeof run> | null = null;
    let err: Error | null = null;
    try {
      out = run(v.input);
    } catch (e) {
      err = e as Error;
    }
    const fail = (msg: string) => failures.push(`${v.id}: ${msg}`);

    if (v.expectOk === false) {
      if (!err) fail("expected an error, got a result");
      else if (v.expectErrorIncludes && !err.message.includes(v.expectErrorIncludes))
        fail(`error "${err.message}" missing "${v.expectErrorIncludes}"`);
      continue;
    }
    if (err) {
      fail(`unexpected error: ${err.message}`);
      continue;
    }
    const r = out!;
    if (v.expectMode && r.mode !== v.expectMode) fail(`mode ${r.mode} != ${v.expectMode}`);
    if (v.expectCatalogCount !== undefined && (r.catalog?.length ?? -1) !== v.expectCatalogCount)
      fail(`catalog ${r.catalog?.length} != ${v.expectCatalogCount}`);
    if (v.expectMethodToken && r.method?.token !== v.expectMethodToken)
      fail(`method ${r.method?.token} != ${v.expectMethodToken}`);
    if (v.expectMethodFamily && r.method?.family !== v.expectMethodFamily)
      fail(`family ${r.method?.family} != ${v.expectMethodFamily}`);
    if (v.expectPoolCount !== undefined && (r.pools?.length ?? -1) !== v.expectPoolCount)
      fail(`pools ${r.pools?.length} != ${v.expectPoolCount}`);
    if (v.expectPoolModeToken) {
      const t = r.pools?.[v.expectPoolModeToken.pool]?.modeToken;
      if (t !== v.expectPoolModeToken.token) fail(`pool mode ${t} != ${v.expectPoolModeToken.token}`);
    }
    if (v.expectObservationIncludes) {
      const obs = r.pools?.[v.expectObservationIncludes.pool]?.observations ?? [];
      if (!obs.some((o) => o.includes(v.expectObservationIncludes!.text)))
        fail(`no observation containing "${v.expectObservationIncludes.text}"`);
    }
    if (v.expectObservationCount) {
      const n = r.pools?.[v.expectObservationCount.pool]?.observations.length ?? -1;
      if (n !== v.expectObservationCount.count) fail(`observations ${n} != ${v.expectObservationCount.count}`);
    }
    if (v.expectRecommendPrimary && r.recommendation?.primary !== v.expectRecommendPrimary)
      fail(`primary ${r.recommendation?.primary} != ${v.expectRecommendPrimary}`);
    if (v.expectRecommendAltIncludes && !r.recommendation?.alternatives.some((a) => a.token === v.expectRecommendAltIncludes))
      fail(`alternatives missing ${v.expectRecommendAltIncludes}`);
    if (v.expectPrereqIncludes && !r.recommendation?.prereqs.some((p) => p.includes(v.expectPrereqIncludes!)))
      fail(`prereqs missing "${v.expectPrereqIncludes}"`);
  }
  return failures;
}
