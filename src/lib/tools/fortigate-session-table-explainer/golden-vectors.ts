// ============================================================================
// src/lib/tools/fortigate-session-table-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS. Each pins an input to invariant parts of the decode.
//
// The cases target the READINGS rather than the parsing, because a parser that
// extracts every field and draws the wrong conclusion is the failure mode that
// matters. The headline case is org traffic with reply=0, which must be called
// out as "nothing came back" rather than reported as two numbers.
// ============================================================================

import { run } from "./compute";

export const SET_ID = "fortigate-session-table-explainer/golden@1";

export interface SessionVector {
  readonly name: string;
  readonly input: string;
  readonly sessions: number;
  readonly protoName?: string;
  readonly policyId?: string | null;
  /** Substring that MUST appear in the derived findings. */
  readonly mustFind?: string;
  /** Substring that must NOT appear (guards against a wrong reading). */
  readonly mustNotFind?: string;
  readonly natActs?: readonly string[];
}

const ONEWAY = `session info: proto=6 proto_state=02 duration=31 expire=10 timeout=3600 flags=00000000
state=log may_dirty
statistic(bytes/packets/allow_err): org=240/4/0 reply=0/0/0 tuples=2
orgin->sink: org pre->post, reply pre->post dev=5->6/6->5 gwy=10.1.1.1/192.168.1.1
hook=post dir=org act=snat 192.168.1.10:52345->93.184.216.34:443(203.0.113.5:52345)
hook=pre dir=reply act=dnat 93.184.216.34:443->203.0.113.5:52345(192.168.1.10:52345)
misc=0 policy_id=7 auth_info=0 chk_client_info=0 vd=0`;

const HEALTHY = `session info: proto=6 proto_state=01 duration=125 expire=3590 timeout=3600 flags=00000000
state=log may_dirty ndr
statistic(bytes/packets/allow_err): org=1024/12/0 reply=8192/14/0 tuples=2
orgin->sink: org pre->post, reply pre->post dev=5->6/6->5 gwy=10.1.1.1/192.168.1.1
hook=post dir=org act=snat 192.168.1.10:52346->93.184.216.34:443(203.0.113.5:52346)
misc=0 policy_id=12 auth_info=0 chk_client_info=0 vd=0`;

const UDP_ONEWAY = `session info: proto=17 proto_state=00 duration=5 expire=175 timeout=180 flags=00000000
state=log
statistic(bytes/packets/allow_err): org=128/2/0 reply=0/0/0 tuples=2
hook=post dir=org act=noop 10.1.1.5:5060->10.2.2.9:5060
misc=0 policy_id=3 vd=0`;

const LOCAL = `session info: proto=6 proto_state=01 duration=9 expire=3600 timeout=3600 flags=00000000
state=local
statistic(bytes/packets/allow_err): org=300/5/0 reply=400/5/0 tuples=2
misc=0 policy_id=0 vd=0`;

export const VECTORS: readonly SessionVector[] = Object.freeze([
  {
    // THE headline reading. If this ever regresses the tool is worthless.
    name: "one-way session is called out as nothing coming back",
    input: ONEWAY,
    sessions: 1,
    protoName: "TCP",
    policyId: "7",
    mustFind: "NOTHING CAME BACK",
    natActs: ["snat", "dnat"],
  },
  {
    // A healthy session must NOT be reported as one-way.
    name: "healthy bidirectional session is not flagged",
    input: HEALTHY,
    sessions: 1,
    protoName: "TCP",
    policyId: "12",
    mustFind: "both directions",
    mustNotFind: "NOTHING CAME BACK",
    natActs: ["snat"],
  },
  {
    // UDP proto_state 00 is documented and unambiguous.
    name: "UDP proto_state 00 decodes as one-way",
    input: UDP_ONEWAY,
    sessions: 1,
    protoName: "UDP",
    policyId: "3",
    mustFind: "NOTHING CAME BACK",
  },
  {
    // policy_id=0 must NOT be reported as "policy 0 matched".
    name: "policy_id 0 is explained as local, not as a matching rule",
    input: LOCAL,
    sessions: 1,
    protoName: "TCP",
    policyId: "0",
    mustFind: "no ordinary firewall policy",
  },
  {
    name: "two sessions in one paste are both parsed",
    input: `${ONEWAY}\n${HEALTHY}`,
    sessions: 2,
  },
  {
    name: "empty input yields the reference card",
    input: "",
    sessions: 0,
  },
  {
    name: "unrecognised input warns rather than throwing",
    input: "this is not a session table",
    sessions: 0,
  },
]);

export function verifyVectors(): { ok: true; count: number } {
  for (const v of VECTORS) {
    const { result } = run(v.input);
    if (result.sessions.length !== v.sessions) {
      throw new Error(`[${SET_ID}] "${v.name}": expected ${v.sessions} sessions, got ${result.sessions.length}`);
    }
    if (v.sessions === 0) continue;
    const s = result.sessions[0];
    if (v.protoName && s.protoName !== v.protoName) {
      throw new Error(`[${SET_ID}] "${v.name}": expected proto ${v.protoName}, got ${s.protoName}`);
    }
    if (v.policyId !== undefined && s.policyId !== v.policyId) {
      throw new Error(`[${SET_ID}] "${v.name}": expected policy_id ${String(v.policyId)}, got ${String(s.policyId)}`);
    }
    const findings = s.findings.join(" | ");
    if (v.mustFind && !findings.includes(v.mustFind)) {
      throw new Error(`[${SET_ID}] "${v.name}": findings missing "${v.mustFind}". Got: ${findings}`);
    }
    if (v.mustNotFind && findings.includes(v.mustNotFind)) {
      throw new Error(`[${SET_ID}] "${v.name}": findings wrongly contain "${v.mustNotFind}"`);
    }
    if (v.natActs) {
      const acts = s.hooks.map((h) => h.act);
      if (acts.join(",") !== v.natActs.join(",")) {
        throw new Error(`[${SET_ID}] "${v.name}": expected NAT acts [${v.natActs.join(",")}], got [${acts.join(",")}]`);
      }
    }
  }
  return { ok: true, count: VECTORS.length };
}
