// ============================================================================
// src/lib/tools/tmsh-config-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// Vectors for the tmsh config explainer. These exercise the parser (object
// typing, nesting, iRule verbatim capture, unbalanced-brace detection) and the
// explain layer (known vs unknown types, field annotation, and the operational
// observations). verifyVectors() runs the set.
// ============================================================================

import { parseTmsh } from "./compute";
import { explainConfig } from "./explain";

export const GOLDEN_VECTOR_SET_ID = "tmsh-config-explainer-golden-v1";

export interface TmshVector {
  id: string;
  description: string;
  input: string;
  expectOk?: boolean;
  expectErrorIncludes?: string;
  expectObjectCount?: number;
  expectTypes?: string[];
  expectNames?: string[];
  expectKnown?: boolean[];
  expectIRuleIndex?: number;
  expectVerbatimIncludes?: string;
  expectFieldNote?: { obj: number; key: string };
  expectNoteIncludes?: { obj: number; text: string };
  expectNoNotes?: number;
}

const POOL = `ltm pool web_pool {
    load-balancing-mode least-connections-member
    members {
        10.0.0.1:80 { address 10.0.0.1 }
        10.0.0.2:80 { address 10.0.0.2 }
    }
    monitor http
}`;

export const TMSH_VECTORS: TmshVector[] = [
  {
    id: "pool-basic",
    description: "A pool parses with typed fields and a known type",
    input: POOL,
    expectOk: true,
    expectObjectCount: 1,
    expectTypes: ["ltm pool"],
    expectNames: ["web_pool"],
    expectKnown: [true],
    expectFieldNote: { obj: 0, key: "load-balancing-mode" },
    expectNoNotes: 0,
  },
  {
    id: "virtual-https-no-ssl",
    description: "An HTTPS virtual with no client-SSL profile raises a note",
    input: `ltm virtual vip {
    destination 10.0.0.9:443
    ip-protocol tcp
    pool web_pool
    profiles { tcp { } http { } }
}`,
    expectOk: true,
    expectTypes: ["ltm virtual"],
    expectFieldNote: { obj: 0, key: "destination" },
    expectNoteIncludes: { obj: 0, text: "no client-SSL profile" },
  },
  {
    id: "virtual-snat-none",
    description: "source-address-translation none raises the client-IP note",
    input: `ltm virtual vip {
    destination 10.0.0.9:80
    pool p
    profiles { tcp { } http { } }
    source-address-translation { type none }
}`,
    expectOk: true,
    expectNoteIncludes: { obj: 0, text: "see the real client IP" },
  },
  {
    id: "irule-verbatim",
    description: "An iRule is typed and its Tcl body captured verbatim",
    input: `ltm rule redir {
    when HTTP_REQUEST {
        if { [HTTP::host] equals "a.example.com" } {
            HTTP::redirect "https://b.example.com[HTTP::uri]"
        }
    }
}`,
    expectOk: true,
    expectTypes: ["ltm rule"],
    expectIRuleIndex: 0,
    expectVerbatimIncludes: "HTTP::redirect",
  },
  {
    id: "monitor-http",
    description: "An HTTP monitor resolves to the monitor family with field notes",
    input: `ltm monitor http my_http {
    defaults-from http
    send "GET /health\\r\\n"
    recv "200 OK"
    interval 5
    timeout 16
}`,
    expectOk: true,
    expectTypes: ["ltm monitor http"],
    expectKnown: [true],
    expectFieldNote: { obj: 0, key: "send" },
  },
  {
    id: "node-basic",
    description: "A node is typed with an address field note",
    input: `ltm node n1 {
    address 10.0.0.1
    monitor icmp
}`,
    expectOk: true,
    expectTypes: ["ltm node"],
    expectFieldNote: { obj: 0, key: "address" },
  },
  {
    id: "self-allow-all",
    description: "A self IP that allows all services raises an exposure note",
    input: `net self internal_self {
    address 10.1.1.1/24
    vlan internal
    allow-service all
    traffic-group traffic-group-local-only
}`,
    expectOk: true,
    expectTypes: ["net self"],
    expectNoteIncludes: { obj: 0, text: "allows all services" },
  },
  {
    id: "pool-single-member",
    description: "A single-member pool raises a redundancy note",
    input: `ltm pool solo {
    members { 10.0.0.1:80 { address 10.0.0.1 } }
    monitor tcp
}`,
    expectOk: true,
    expectNoteIncludes: { obj: 0, text: "single member" },
  },
  {
    id: "pool-no-monitor",
    description: "A pool with no monitor raises a health-check note",
    input: `ltm pool unmon {
    members { 10.0.0.1:80 { address 10.0.0.1 } 10.0.0.2:80 { address 10.0.0.2 } }
}`,
    expectOk: true,
    expectNoteIncludes: { obj: 0, text: "No health monitor" },
  },
  {
    id: "unknown-type",
    description: "An unknown object type degrades gracefully",
    input: `sys global-settings {
    hostname bigip1.example.com
}`,
    expectOk: true,
    expectKnown: [false],
    expectNoNotes: 0,
  },
  {
    id: "multi-object",
    description: "A mixed config counts every object",
    input: `${POOL}
ltm node n1 { address 10.0.0.1 }
ltm virtual vip { destination 10.0.0.9:80 pool web_pool profiles { tcp { } } }`,
    expectOk: true,
    expectObjectCount: 3,
    expectTypes: ["ltm pool", "ltm node", "ltm virtual"],
  },
  {
    id: "clientssl-tls-options",
    description: "A client-SSL profile that does not disable TLS 1.0 raises a note",
    input: `ltm profile client-ssl secure_ssl {
    defaults-from clientssl
    cert /Common/site.crt
    key /Common/site.key
    options { dont-insert-empty-fragments }
}`,
    expectOk: true,
    expectTypes: ["ltm profile client-ssl"],
    expectNoteIncludes: { obj: 0, text: "disable TLS 1.0" },
  },
  {
    id: "unbalanced",
    description: "An unbalanced brace is reported as an error",
    input: `ltm pool x {
    members {
        10.0.0.1:80
}`,
    expectOk: false,
    expectErrorIncludes: "unbalanced brace",
  },
  {
    id: "empty",
    description: "Empty input parses to zero objects without error",
    input: "   \n  \n",
    expectOk: true,
    expectObjectCount: 0,
  },
];

export function verifyVectors(): { passed: number; failed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;

  for (const v of TMSH_VECTORS) {
    const r = explainConfig(parseTmsh(v.input));
    const errs: string[] = [];

    if (v.expectOk !== undefined && r.ok !== v.expectOk) errs.push(`ok: got ${r.ok} want ${v.expectOk}`);
    if (v.expectErrorIncludes !== undefined && !(r.error?.message ?? "").includes(v.expectErrorIncludes)) errs.push(`error missing ${JSON.stringify(v.expectErrorIncludes)}: got ${JSON.stringify(r.error?.message)}`);
    if (v.expectObjectCount !== undefined && r.objects.length !== v.expectObjectCount) errs.push(`object count: got ${r.objects.length} want ${v.expectObjectCount}`);
    if (v.expectTypes !== undefined) {
      const got = r.objects.map((o) => o.type);
      if (JSON.stringify(got) !== JSON.stringify(v.expectTypes)) errs.push(`types: got ${JSON.stringify(got)} want ${JSON.stringify(v.expectTypes)}`);
    }
    if (v.expectNames !== undefined) {
      const got = r.objects.map((o) => o.name);
      if (JSON.stringify(got) !== JSON.stringify(v.expectNames)) errs.push(`names: got ${JSON.stringify(got)} want ${JSON.stringify(v.expectNames)}`);
    }
    if (v.expectKnown !== undefined) {
      const got = r.objects.map((o) => o.known);
      if (JSON.stringify(got) !== JSON.stringify(v.expectKnown)) errs.push(`known: got ${JSON.stringify(got)} want ${JSON.stringify(v.expectKnown)}`);
    }
    if (v.expectIRuleIndex !== undefined) {
      const o = r.objects[v.expectIRuleIndex];
      if (!o?.isIRule) errs.push(`object ${v.expectIRuleIndex} is not an iRule`);
      else if (!o.verbatim || o.verbatim.trim() === "") errs.push(`iRule verbatim empty`);
    }
    if (v.expectVerbatimIncludes !== undefined) {
      const o = r.objects[v.expectIRuleIndex ?? 0];
      if (!(o?.verbatim ?? "").includes(v.expectVerbatimIncludes)) errs.push(`verbatim missing ${JSON.stringify(v.expectVerbatimIncludes)}`);
    }
    if (v.expectFieldNote !== undefined) {
      const o = r.objects[v.expectFieldNote.obj];
      const f = o?.fields.find((x) => x.key === v.expectFieldNote!.key);
      if (!f) errs.push(`field ${JSON.stringify(v.expectFieldNote.key)} not found`);
      else if (!f.note || f.note.trim() === "") errs.push(`field ${JSON.stringify(v.expectFieldNote.key)} has no note`);
    }
    if (v.expectNoteIncludes !== undefined) {
      const o = r.objects[v.expectNoteIncludes.obj];
      if (!o?.notes.some((n) => n.includes(v.expectNoteIncludes!.text))) errs.push(`no operational note includes ${JSON.stringify(v.expectNoteIncludes.text)}: got ${JSON.stringify(o?.notes)}`);
    }
    if (v.expectNoNotes !== undefined) {
      const o = r.objects[v.expectNoNotes];
      if (o && o.notes.length !== 0) errs.push(`object ${v.expectNoNotes} expected no notes, got ${JSON.stringify(o.notes)}`);
    }

    if (errs.length) failures.push(`[${v.id}] ${errs.join("; ")}`);
    else passed++;
  }

  return { passed, failed: failures.length, failures };
}
