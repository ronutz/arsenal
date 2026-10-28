// ============================================================================
// src/lib/tools/f5-tmsh-config-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// Vectors for the tmsh config explainer. These exercise the parser (object
// typing, nesting, iRule verbatim capture, unbalanced-brace detection) and the
// explain layer (known vs unknown types, field annotation, and the operational
// observations). Share vectors (2026-10-27) pin the copy a Share results link
// carries (shareableTmsh) and prove the copy parses into the same tree.
// verifyVectors() runs the set.
// ============================================================================

import { parseTmsh, shareableTmsh, SHARE_REDACTED, type ConfigNode } from "./compute";
import { explainConfig } from "./explain";

// 2026-10-27: share vectors added (SHARE_VECTORS, the copy a Share results link carries), so the set id moved from
// "f5-tmsh-config-explainer-golden-v1" (scripts/api-sync.json records it; the re-check is in the wave's notes).
export const GOLDEN_VECTOR_SET_ID = "f5-tmsh-config-explainer-golden-2026-10-27b"; // b: quoted strings keep "\r\n" as written (F5 K2167)

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
  /** A field's displayed value, exactly (the send string as written, escapes included). */
  expectFieldValue?: { obj: number; key: string; value: string };
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
    id: "monitor-send-escapes-as-written",
    description: "A send string keeps \\r\\n as written: the BIG-IP turns them into CR and LF only when it sends the request (F5 K2167, read 2026-10-27); before 2026-10-27 the display dropped the backslashes (HTTP/1.1rnHost)",
    input: `ltm monitor http mon_app {
    defaults-from http
    send "GET /health HTTP/1.1\\r\\nHost: app.example.com\\r\\nConnection: close\\r\\n\\r\\n"
    recv "200 OK"
}`,
    expectOk: true,
    expectTypes: ["ltm monitor http"],
    expectFieldValue: { obj: 0, key: "send", value: "GET /health HTTP/1.1\\r\\nHost: app.example.com\\r\\nConnection: close\\r\\n\\r\\n" },
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

// -- Share vectors (2026-10-27) ------------------------------------------------
// The copy a Share results link carries (shareableTmsh in compute.ts), pinned byte for byte: every secret setting's
// value replaced by SHARE_REDACTED, "none" kept, iRule bodies kept as pasted, Authorization credentials in a send
// string replaced. Each vector also proves that the receiving page reads the same tree: the copy parses into the same
// objects, fields and nesting as the paste, and differs only in the tokens that now hold SHARE_REDACTED.

/** One share vector. */
export interface TmshShareVector {
  /** Stable id. */
  id: string;
  /** The configuration as pasted. */
  input: string;
  /** The copy a link carries, exactly. */
  expect: string;
  /** How many values are replaced. */
  redacted: number;
  /** How many iRule bodies the copy keeps as pasted. */
  irules: number;
  /** Strings that must not appear anywhere in the copy. */
  secrets: readonly string[];
}

/** The share vectors. */
export const SHARE_VECTORS: readonly TmshShareVector[] = Object.freeze([
  {
    id: "share-monitor-password-and-authorization",
    // An HTTP monitor with a password (encrypted the way bigip.conf stores it) and a hand-written Basic header.
    input: 'ltm monitor http mon_app {\n    defaults-from http\n    interval 5\n    password $M$Kq$Zm9vYmFyYmF6\n    recv "200 OK"\n    send "GET /health HTTP/1.1\\r\\nHost: app.example.com\\r\\nAuthorization: Basic dXNlcjpzM2NyM3Q=\\r\\nConnection: close\\r\\n\\r\\n"\n    timeout 16\n    username monuser\n}',
    expect: 'ltm monitor http mon_app {\n    defaults-from http\n    interval 5\n    password [redacted]\n    recv "200 OK"\n    send "GET /health HTTP/1.1\\r\\nHost: app.example.com\\r\\nAuthorization: [redacted]\\r\\nConnection: close\\r\\n\\r\\n"\n    timeout 16\n    username monuser\n}',
    redacted: 2,
    irules: 0,
    secrets: ["$M$Kq$Zm9vYmFyYmF6", "Zm9vYmFyYmF6", "dXNlcjpzM2NyM3Q=", "Basic dXNlcjpz"],
  },
  {
    id: "share-persistence-cookie-passphrase",
    // ltm persistence cookie: a quoted cookie-encryption-passphrase (tmsh reference, ltm persistence cookie).
    input: 'ltm persistence cookie cookie_enc {\n    cookie-encryption required\n    cookie-encryption-passphrase "Long pass phrase 42"\n    cookie-name BIGipApp\n    defaults-from cookie\n    method insert\n}',
    expect: "ltm persistence cookie cookie_enc {\n    cookie-encryption required\n    cookie-encryption-passphrase [redacted]\n    cookie-name BIGipApp\n    defaults-from cookie\n    method insert\n}",
    redacted: 1,
    irules: 0,
    secrets: ["Long pass phrase 42", "pass phrase 42"],
  },
  {
    id: "share-snmp-auth-and-key-file",
    // SNMP community and v3 passwords, a RADIUS secret, an LDAP bind password, a key file's pass phrase; the
    // "security-type password" line keeps its value, which is a type, not a secret.
    input: "sys snmp {\n    communities {\n        /Common/c1 {\n            community-name n0tpublic\n            source 192.0.2.0/24\n        }\n    }\n    users {\n        /Common/u1 {\n            auth-password $M$ab$cGFzc3dvcmQ=\n            auth-protocol sha\n            privacy-password $M$cd$cHJpdmFjeQ==\n            privacy-protocol aes\n            username snmpuser\n        }\n    }\n}\nauth radius-server /Common/rs1 {\n    secret $M$ef$c2hhcmVkLXNlY3JldA==\n    server 192.0.2.10\n}\nauth ldap /Common/system-auth {\n    bind-dn cn=bind,dc=example,dc=com\n    bind-pw $M$gh$YmluZC1wdw==\n    servers { 192.0.2.20 }\n}\nsys file ssl-key /Common/app.key {\n    passphrase $M$ij$a2V5LXBhc3M=\n    revision 1\n    security-type password\n}",
    expect: "sys snmp {\n    communities {\n        /Common/c1 {\n            community-name [redacted]\n            source 192.0.2.0/24\n        }\n    }\n    users {\n        /Common/u1 {\n            auth-password [redacted]\n            auth-protocol sha\n            privacy-password [redacted]\n            privacy-protocol aes\n            username snmpuser\n        }\n    }\n}\nauth radius-server /Common/rs1 {\n    secret [redacted]\n    server 192.0.2.10\n}\nauth ldap /Common/system-auth {\n    bind-dn cn=bind,dc=example,dc=com\n    bind-pw [redacted]\n    servers { 192.0.2.20 }\n}\nsys file ssl-key /Common/app.key {\n    passphrase [redacted]\n    revision 1\n    security-type password\n}",
    redacted: 6,
    irules: 0,
    secrets: ["n0tpublic", "cGFzc3dvcmQ=", "cHJpdmFjeQ==", "c2hhcmVkLXNlY3JldA==", "YmluZC1wdw==", "a2V5LXBhc3M="],
  },
  {
    id: "share-none-and-irule-kept",
    // "passphrase none" is no secret and stays; an iRule body is Tcl, shown verbatim, and stays as pasted.
    input: "ltm profile client-ssl cssl {\n    cert-key-chain {\n        app_rsa {\n            cert /Common/app.crt\n            key /Common/app.key\n            passphrase none\n        }\n    }\n    defaults-from clientssl\n}\nltm rule r_token {\nwhen HTTP_REQUEST {\n    set password kept_as_pasted\n    HTTP::header insert X-Token abc123\n}\n}",
    expect: "ltm profile client-ssl cssl {\n    cert-key-chain {\n        app_rsa {\n            cert /Common/app.crt\n            key /Common/app.key\n            passphrase none\n        }\n    }\n    defaults-from clientssl\n}\nltm rule r_token {\nwhen HTTP_REQUEST {\n    set password kept_as_pasted\n    HTTP::header insert X-Token abc123\n}\n}",
    redacted: 0,
    irules: 1,
    secrets: [],
  },
  {
    id: "share-one-line-form",
    // tmsh's one-line form: several settings on one line; a quoted password with a space goes whole.
    input: 'ltm monitor ldap mon_ldap { base dc=example,dc=com password "two words" username cn=monitor }',
    expect: "ltm monitor ldap mon_ldap { base dc=example,dc=com password [redacted] username cn=monitor }",
    redacted: 1,
    irules: 0,
    secrets: ["two words"],
  },
  {
    id: "share-copy-is-stable",
    // The copy of a copy is itself: nothing is replaced twice.
    input: 'ltm monitor http mon_app {\n    password [redacted]\n    send "GET / HTTP/1.1\\r\\nAuthorization: [redacted]\\r\\n\\r\\n"\n}',
    expect: 'ltm monitor http mon_app {\n    password [redacted]\n    send "GET / HTTP/1.1\\r\\nAuthorization: [redacted]\\r\\n\\r\\n"\n}',
    redacted: 0,
    irules: 0,
    secrets: [],
  },
]);

/**
 * Whether two parse trees have the same shape: the same nodes, nesting, quoting and iRule bodies, with every token
 * equal except where the copy's token holds SHARE_REDACTED.
 * @param a the paste's nodes
 * @param b the copy's nodes
 * @returns true when the receiving page reads the same tree
 */
function sameShape(a: readonly ConfigNode[], b: readonly ConfigNode[]): boolean {
  if (a.length !== b.length) return false; // a node more or less
  return a.every((x, i) => {
    const y = b[i]; // the copy's node
    if (x.tokens.length !== y.tokens.length || x.line !== y.line || x.verbatim !== y.verbatim) return false; // its frame
    if (x.quotedMask.some((q, k) => q !== y.quotedMask[k] && !y.tokens[k].includes(SHARE_REDACTED))) return false; // quoting, except a replaced token
    if (x.tokens.some((t, k) => t !== y.tokens[k] && !y.tokens[k].includes(SHARE_REDACTED))) return false; // its words, except a replaced one
    if ((x.children === undefined) !== (y.children === undefined)) return false; // a block in one, not the other
    return x.children === undefined || sameShape(x.children, y.children!); // its children
  });
} // sameShape

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
    if (v.expectFieldValue !== undefined) {
      const o = r.objects[v.expectFieldValue.obj]; // the object
      const f = o?.fields.find((x) => x.key === v.expectFieldValue!.key); // the field
      if (!f) errs.push(`field ${JSON.stringify(v.expectFieldValue.key)} not found`); // missing
      else if (f.value !== v.expectFieldValue.value) errs.push(`field ${JSON.stringify(v.expectFieldValue.key)} value ${JSON.stringify(f.value)}, expected ${JSON.stringify(v.expectFieldValue.value)}`); // shown otherwise
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

  // The share vectors: the copy, its counts, no secret, and the same tree on the receiving page.
  for (const v of SHARE_VECTORS) {
    const out = shareableTmsh(v.input); // the copy
    const errs: string[] = []; // this vector's failures
    if (out.text !== v.expect) errs.push(`copy: got ${JSON.stringify(out.text)}`); // byte for byte
    if (out.redacted !== v.redacted) errs.push(`redacted: got ${out.redacted} want ${v.redacted}`); // the count
    if (out.irules !== v.irules) errs.push(`irules: got ${out.irules} want ${v.irules}`); // iRule bodies kept
    for (const secret of v.secrets) if (out.text.includes(secret)) errs.push(`the copy contains ${JSON.stringify(secret)}`); // never travels
    const a = parseTmsh(v.input); // the paste, parsed
    const b = parseTmsh(out.text); // the copy, parsed
    if (a.ok !== b.ok || !sameShape(a.nodes, b.nodes)) errs.push("the copy parses into another tree"); // the same reading
    const ea = explainConfig(a); // the paste, explained
    const eb = explainConfig(b); // the copy, explained
    if (JSON.stringify(ea.objects.map((o) => [o.type, o.name, o.fields.map((f) => f.key), o.notes])) !== JSON.stringify(eb.objects.map((o) => [o.type, o.name, o.fields.map((f) => f.key), o.notes]))) errs.push("the copy is explained differently"); // same objects, fields and notes
    if (shareableTmsh(out.text).text !== out.text) errs.push("the copy of the copy differs"); // stable
    if (errs.length) failures.push(`[${v.id}] ${errs.join("; ")}`); // failed
    else passed++; // passed
  }

  return { passed, failed: failures.length, failures };
}
