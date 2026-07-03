// ============================================================================
// src/lib/tools/f5-persistence-method-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// Vectors for the persistence-method explainer. They check method recognition
// across the profile types, field annotation, the presence of failure-mode
// caveats, and the primary/fallback chain resolution (including inference of
// built-in default profile names and the pairing observations).
// ============================================================================

import { run } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "f5-persistence-method-explainer-golden-v1";

export interface PVector {
  id: string;
  description: string;
  input: string;
  expectOk?: boolean;
  expectErrorIncludes?: string;
  expectProfileCount?: number;
  expectMethods?: string[];
  expectKnown?: boolean[];
  expectFieldNote?: { prof: number; key: string };
  expectCaveats?: number; // profile index expected to have >=1 caveat
  expectChainCount?: number;
  expectChain?: { idx: number; primary?: string; fallback?: string };
  expectChainNoteIncludes?: { idx: number; text: string };
}

export const P_VECTORS: PVector[] = [
  {
    id: "cookie-profile",
    description: "A cookie profile is recognized with annotated fields and caveats",
    input: `ltm persistence cookie c1 {
    defaults-from cookie
    cookie-name BIGipServer_app
    method insert
}`,
    expectOk: true,
    expectProfileCount: 1,
    expectMethods: ["cookie"],
    expectKnown: [true],
    expectFieldNote: { prof: 0, key: "method" },
    expectCaveats: 0,
  },
  {
    id: "source-addr-profile",
    description: "A source-address profile is recognized with a mask field note",
    input: `ltm persistence source-addr s1 {
    defaults-from source_addr
    mask 255.255.255.0
    timeout 1800
}`,
    expectOk: true,
    expectMethods: ["source-addr"],
    expectFieldNote: { prof: 0, key: "mask" },
    expectCaveats: 0,
  },
  {
    id: "ssl-profile",
    description: "An SSL persistence profile is recognized",
    input: `ltm persistence ssl ssl_p {
    defaults-from ssl
    timeout 300
}`,
    expectOk: true,
    expectMethods: ["ssl"],
    expectKnown: [true],
    expectCaveats: 0,
  },
  {
    id: "universal-profile",
    description: "A universal profile is recognized with a rule field note",
    input: `ltm persistence universal uni {
    defaults-from universal
    rule jsessionid_rule
}`,
    expectOk: true,
    expectMethods: ["universal"],
    expectFieldNote: { prof: 0, key: "rule" },
  },
  {
    id: "hash-profile",
    description: "A hash persistence profile is recognized",
    input: `ltm persistence hash h1 {
    defaults-from hash
    hash-algorithm default
}`,
    expectOk: true,
    expectMethods: ["hash"],
    expectKnown: [true],
  },
  {
    id: "dest-addr-profile",
    description: "A destination-address profile is recognized",
    input: `ltm persistence dest-addr d1 {
    defaults-from dest_addr
    mask 255.255.255.255
}`,
    expectOk: true,
    expectMethods: ["dest-addr"],
    expectKnown: [true],
  },
  {
    id: "unknown-persistence",
    description: "An unrecognized persistence type degrades gracefully",
    input: `ltm persistence made-up x1 {
    timeout 60
}`,
    expectOk: true,
    expectMethods: ["made-up"],
    expectKnown: [false],
  },
  {
    id: "chain-cookie-source",
    description: "A cookie primary with source-addr fallback is resolved and noted",
    input: `ltm virtual v {
    destination 10.0.0.9:80
    persist { cookie { } }
    fallback-persistence source_addr
}`,
    expectOk: true,
    expectChainCount: 1,
    expectChain: { idx: 0, primary: "cookie", fallback: "source-addr" },
    expectChainNoteIncludes: { idx: 0, text: "refuse cookies" },
  },
  {
    id: "chain-ssl-source",
    description: "An SSL primary with source-addr fallback gets the recommended-pairing note",
    input: `ltm virtual v {
    destination 10.0.0.9:443
    persist { ssl { } }
    fallback-persistence source_addr
}`,
    expectOk: true,
    expectChain: { idx: 0, primary: "ssl", fallback: "source-addr" },
    expectChainNoteIncludes: { idx: 0, text: "recommended pairing" },
  },
  {
    id: "chain-same-method-warning",
    description: "Primary and fallback resolving to the same method is flagged",
    input: `ltm persistence cookie c1 { defaults-from cookie }
ltm persistence cookie c2 { defaults-from cookie }
ltm virtual v {
    persist { c1 { } }
    fallback-persistence c2
}`,
    expectOk: true,
    expectChain: { idx: 0, primary: "cookie", fallback: "cookie" },
    expectChainNoteIncludes: { idx: 0, text: "defeats the purpose" },
  },
  {
    id: "chain-primary-only",
    description: "A primary with no fallback is noted",
    input: `ltm virtual v {
    persist { cookie { } }
}`,
    expectOk: true,
    expectChain: { idx: 0, primary: "cookie" },
    expectChainNoteIncludes: { idx: 0, text: "no fallback" },
  },
  {
    id: "profiles-and-chain",
    description: "A defined profile referenced by a virtual is resolved via its definition",
    input: `ltm persistence cookie app_cookie { defaults-from cookie method insert }
ltm virtual v {
    persist { app_cookie { } }
    fallback-persistence source_addr
}`,
    expectOk: true,
    expectProfileCount: 1,
    expectChainCount: 1,
    expectChain: { idx: 0, primary: "cookie", fallback: "source-addr" },
  },
  {
    id: "no-persistence",
    description: "Config with no persistence yields nothing",
    input: `ltm pool p { members { 10.0.0.1:80 { address 10.0.0.1 } } }`,
    expectOk: true,
    expectProfileCount: 0,
    expectChainCount: 0,
  },
  {
    id: "unbalanced",
    description: "An unbalanced brace surfaces the parser error",
    input: `ltm persistence cookie c1 {
    method insert
`,
    expectOk: false,
    expectErrorIncludes: "unbalanced brace",
  },
];

export function verifyVectors(): { passed: number; failed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;

  for (const v of P_VECTORS) {
    const r = run(v.input);
    const errs: string[] = [];

    if (v.expectOk !== undefined && r.ok !== v.expectOk) errs.push(`ok: got ${r.ok} want ${v.expectOk}`);
    if (v.expectErrorIncludes !== undefined && !(r.error?.message ?? "").includes(v.expectErrorIncludes)) errs.push(`error missing ${JSON.stringify(v.expectErrorIncludes)}`);
    if (v.expectProfileCount !== undefined && r.methods.length !== v.expectProfileCount) errs.push(`profile count: got ${r.methods.length} want ${v.expectProfileCount}`);
    if (v.expectMethods !== undefined) {
      const got = r.methods.map((m) => m.methodType);
      if (JSON.stringify(got) !== JSON.stringify(v.expectMethods)) errs.push(`methods: got ${JSON.stringify(got)} want ${JSON.stringify(v.expectMethods)}`);
    }
    if (v.expectKnown !== undefined) {
      const got = r.methods.map((m) => m.known);
      if (JSON.stringify(got) !== JSON.stringify(v.expectKnown)) errs.push(`known: got ${JSON.stringify(got)} want ${JSON.stringify(v.expectKnown)}`);
    }
    if (v.expectFieldNote !== undefined) {
      const m = r.methods[v.expectFieldNote.prof];
      const f = m?.fields.find((x) => x.key === v.expectFieldNote!.key);
      if (!f) errs.push(`field ${JSON.stringify(v.expectFieldNote.key)} not found`);
      else if (!f.note) errs.push(`field ${JSON.stringify(v.expectFieldNote.key)} has no note`);
    }
    if (v.expectCaveats !== undefined) {
      const m = r.methods[v.expectCaveats];
      if (!m || m.caveats.length === 0) errs.push(`profile ${v.expectCaveats} expected caveats`);
    }
    if (v.expectChainCount !== undefined && r.chains.length !== v.expectChainCount) errs.push(`chain count: got ${r.chains.length} want ${v.expectChainCount}`);
    if (v.expectChain !== undefined) {
      const c = r.chains[v.expectChain.idx];
      if (!c) errs.push(`chain ${v.expectChain.idx} missing`);
      else {
        if (v.expectChain.primary !== undefined && c.primary?.methodType !== v.expectChain.primary) errs.push(`chain primary: got ${c.primary?.methodType} want ${v.expectChain.primary}`);
        if (v.expectChain.fallback !== undefined && c.fallback?.methodType !== v.expectChain.fallback) errs.push(`chain fallback: got ${c.fallback?.methodType} want ${v.expectChain.fallback}`);
      }
    }
    if (v.expectChainNoteIncludes !== undefined) {
      const c = r.chains[v.expectChainNoteIncludes.idx];
      if (!c?.notes.some((n) => n.includes(v.expectChainNoteIncludes!.text))) errs.push(`chain note missing ${JSON.stringify(v.expectChainNoteIncludes.text)}: got ${JSON.stringify(c?.notes)}`);
    }

    if (errs.length) failures.push(`[${v.id}] ${errs.join("; ")}`);
    else passed++;
  }

  return { passed, failed: failures.length, failures };
}
