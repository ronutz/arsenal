// ============================================================================
// src/lib/tools/fortigate-session-table-explainer/compute.ts
// ----------------------------------------------------------------------------
// FORTIGATE SESSION TABLE EXPLAINER — pure engine.
//
// WHAT IT ANSWERS
// "What is this session actually telling me?" `diagnose sys session list` is
// the authoritative record of what a FortiGate did with a flow: which policy
// admitted it, what was translated, and whether the far side ever replied.
// Its format is dense, positional, and unmemorable, so the information is
// present and unread.
//
// THE MOST DIAGNOSTIC FIELD IS THE ONE PEOPLE SKIP
// `statistic(bytes/packets/allow_err): org=... reply=...`
// A session with org traffic and reply=0 means the FortiGate forwarded the
// packets and nothing came back. That single reading separates "my firewall is
// blocking it" (it is not; the session exists and permitted the traffic) from
// a routing or far-end problem, and it is the most common misdiagnosis this
// tool exists to prevent.
//
// HONESTY BOUNDARY
// Fields whose full value tables are vendor-internal are reported RAW with
// their meaning stated only where it is documented and unambiguous. The engine
// never guesses a mapping in order to look more complete. Pure, bounded,
// never fetches, never evaluates input as code.
// ============================================================================

const MAX_INPUT = 200_000;
const MAX_SESSIONS = 500;

export interface NatHook {
  /** "pre" or "post" — which side of translation this line describes. */
  readonly hook: string;
  /** "org" (client to server) or "reply". */
  readonly dir: string;
  /** snat, dnat, noop... */
  readonly act: string;
  readonly src: string;
  readonly dst: string;
  /** The parenthesised translated tuple, when present. */
  readonly translated: string | null;
  readonly explain: string;
}

export interface SessionStat {
  readonly bytes: number;
  readonly packets: number;
  readonly allowErr: number;
}

export interface ParsedSession {
  readonly index: number;
  readonly proto: number | null;
  readonly protoName: string;
  readonly protoState: string | null;
  readonly protoStateExplain: string | null;
  readonly duration: number | null;
  readonly expire: number | null;
  readonly timeout: number | null;
  readonly stateFlags: readonly string[];
  readonly org: SessionStat | null;
  readonly reply: SessionStat | null;
  readonly hooks: readonly NatHook[];
  readonly policyId: string | null;
  readonly vd: string | null;
  readonly dev: string | null;
  readonly gwy: string | null;
  readonly offloaded: boolean | null;
  /** Plain-language readings derived from the fields above. */
  readonly findings: readonly string[];
}

export interface SessionResult {
  readonly mode: "decode" | "reference";
  readonly sessions: readonly ParsedSession[];
  readonly notes: readonly string[];
  readonly parseWarnings: readonly string[];
}

export interface ToolRunResult {
  readonly result: SessionResult;
}

/** IANA protocol numbers seen in a FortiGate session table. */
const PROTOS: Readonly<Record<number, string>> = Object.freeze({
  1: "ICMP", 2: "IGMP", 6: "TCP", 17: "UDP", 47: "GRE", 50: "ESP", 51: "AH", 58: "ICMPv6", 89: "OSPF", 132: "SCTP",
});

/** State flags FortiOS documents on a session. Anything not listed is shown
 *  raw rather than guessed at. */
const STATE_FLAGS: Readonly<Record<string, string>> = Object.freeze({
  log: "session is being logged",
  local: "session terminates on the FortiGate itself rather than passing through",
  may_dirty: "session may be re-evaluated if the policy set changes",
  ndr: "no dirty routing: the route is not re-checked on every packet",
  nds: "no dirty session",
  br: "bridged (transparent mode)",
  redir: "session was redirected",
  dirty: "session is flagged for re-evaluation against the policy set",
  npu: "session is offloaded to the network processor",
  synced: "session has been synchronised to the HA peer",
});

/**
 * proto_state decode.
 *
 * DELIBERATELY NARROW. For UDP the two values are documented and unambiguous
 * and are among the most useful things in the whole output. For TCP the field
 * is a pair of per-direction states whose full table is vendor documentation;
 * only the value everyone actually encounters is named, and the rest is
 * reported raw with an explanation of what the two digits MEAN rather than an
 * invented mapping. Inventing that table would make the tool look more capable
 * and be wrong on the cases that matter.
 */
function explainProtoState(proto: number | null, raw: string): string | null {
  if (proto === 17) {
    if (raw === "00") return "UDP one-way: the FortiGate has seen traffic in the original direction only. Nothing has come back.";
    if (raw === "01") return "UDP two-way: traffic has been seen in both directions.";
    return `UDP state ${raw}.`;
  }
  if (proto === 6) {
    if (raw === "01") return "TCP established: the handshake completed and the session is open.";
    return `TCP state pair ${raw}. The two digits are the connection state in the original and reply directions; consult Fortinet's session-state documentation for the full table.`;
  }
  return null;
}

function num(s: string | undefined): number | null {
  if (s === undefined) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Parse the NAT hook lines, which are where translation is actually visible. */
function parseHooks(block: string): NatHook[] {
  const hooks: NatHook[] = [];
  const re = /hook=(\w+)\s+dir=(\w+)\s+act=(\w+)\s+(\S+?)->(\S+?)(?:\(([^)]*)\))?\s*$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) {
    const [, hook, dir, act, src, dst, translated] = m;
    let explain: string;
    if (act === "snat") {
      explain = translated
        ? `Source NAT: the source ${src} was rewritten to ${translated} on the way out.`
        : "Source NAT applied.";
    } else if (act === "dnat") {
      explain = translated
        ? `Destination NAT: ${dst} was rewritten to ${translated}, which is a VIP doing its work.`
        : "Destination NAT applied.";
    } else if (act === "noop") {
      explain = "No translation on this leg.";
    } else {
      explain = `Action ${act}.`;
    }
    hooks.push({ hook, dir, act, src, dst, translated: translated ?? null, explain });
  }
  return hooks;
}

/** Derive plain-language findings. This is the value the raw output hides. */
function derive(s: {
  proto: number | null; org: SessionStat | null; reply: SessionStat | null;
  hooks: readonly NatHook[]; policyId: string | null; expire: number | null;
  protoState: string | null; offloaded: boolean | null;
}): string[] {
  const out: string[] = [];

  // The headline reading, and the reason this tool exists.
  if (s.org && s.reply) {
    if (s.org.packets > 0 && s.reply.packets === 0) {
      out.push(
        "NOTHING CAME BACK. The FortiGate forwarded traffic in the original direction and has seen no reply packets. The session exists and the policy permitted it, so this is not the firewall blocking the traffic: look at routing beyond this device, at the destination host, or at a filter further along the path.",
      );
    } else if (s.org.packets === 0 && s.reply.packets > 0) {
      out.push("Reply traffic only, with nothing in the original direction. That usually means the session was created by traffic this device did not see the start of, or the directions are the reverse of what you assumed.");
    } else if (s.org.packets > 0 && s.reply.packets > 0) {
      out.push("Traffic has flowed in both directions, so the path works in both directions and the policy permitted it.");
    }
    if (s.org.allowErr > 0 || s.reply.allowErr > 0) {
      out.push("A non-zero allow_err count means packets were permitted despite an error condition, which is worth investigating rather than ignoring.");
    }
  }

  if (s.policyId !== null) {
    out.push(
      s.policyId === "0"
        ? "policy_id=0 means no ordinary firewall policy admitted this session; it is typically local traffic to the FortiGate itself or an implicitly handled flow."
        : `Policy ${s.policyId} admitted this session. That is the authoritative answer to which rule matched, and it beats reading the policy list.`,
    );
  }

  const snat = s.hooks.find((h) => h.act === "snat");
  const dnat = s.hooks.find((h) => h.act === "dnat");
  if (!snat && !dnat && s.hooks.length > 0) {
    out.push("No translation on any leg: this session was routed without NAT.");
  }
  if (dnat) {
    out.push("Destination NAT is present, so a VIP matched. Remember the ordering: destination translation happens BEFORE the routing lookup and before policy evaluation, which is why the policy destination must be the VIP object.");
  }
  if (snat) {
    out.push("Source NAT is present, applied AFTER the policy matched. The translated tuple in brackets is what the far side sees.");
  }

  if (s.expire !== null && s.expire <= 10) {
    out.push(`This session expires in ${s.expire} seconds and is about to be removed from the table, which is why a second look may not find it.`);
  }
  if (s.offloaded) {
    out.push("The session is offloaded to hardware. Offloaded traffic does not traverse the CPU path, so a packet sniffer on the device will not show it unless offload is disabled for the test.");
  }
  return out;
}

/** Split a paste into per-session blocks. */
function splitSessions(text: string): string[] {
  const parts = text.split(/(?=^session info:)/m).map((p) => p.trim()).filter(Boolean);
  return parts.filter((p) => /^session info:/.test(p));
}

export function parseSession(block: string, index: number): ParsedSession {
  const g = (re: RegExp): string | undefined => re.exec(block)?.[1];

  const proto = num(g(/\bproto=(\d+)/));
  const protoState = g(/\bproto_state=(\w+)/) ?? null;
  const stateLine = g(/^state=(.*)$/m) ?? "";
  const stateFlags = stateLine.trim().split(/\s+/).filter(Boolean);

  const statRe = /statistic\(bytes\/packets\/allow_err\):\s*org=(\d+)\/(\d+)\/(\d+)\s+reply=(\d+)\/(\d+)\/(\d+)/.exec(block);
  const org = statRe ? { bytes: +statRe[1], packets: +statRe[2], allowErr: +statRe[3] } : null;
  const reply = statRe ? { bytes: +statRe[4], packets: +statRe[5], allowErr: +statRe[6] } : null;

  const hooks = parseHooks(block);
  const policyId = g(/\bpolicy_id=(\S+)/) ?? null;
  const npu = /npu_state=0x0*[1-9a-f]/i.test(block);
  const noOffload = /no_offload/i.test(block);

  const base = {
    proto, org, reply, hooks, policyId,
    expire: num(g(/\bexpire=(\d+)/)),
    protoState,
    offloaded: noOffload ? false : (npu || stateFlags.includes("npu") ? true : null),
  };

  return {
    index,
    proto,
    protoName: proto !== null ? (PROTOS[proto] ?? `protocol ${proto}`) : "unknown",
    protoState,
    protoStateExplain: protoState ? explainProtoState(proto, protoState) : null,
    duration: num(g(/\bduration=(\d+)/)),
    expire: base.expire,
    timeout: num(g(/\btimeout=(\d+)/)),
    stateFlags,
    org, reply, hooks, policyId,
    vd: g(/\bvd=(\d+)/) ?? null,
    dev: g(/\bdev=(\S+)/) ?? null,
    gwy: g(/\bgwy=(\S+)/) ?? null,
    offloaded: base.offloaded,
    findings: derive(base),
  };
}

/** Human-readable meaning for a state flag, or null when undocumented. */
export function explainStateFlag(flag: string): string | null {
  return STATE_FLAGS[flag] ?? null;
}

function referenceResult(): SessionResult {
  return {
    mode: "reference",
    sessions: [],
    notes: [
      "Paste the output of `diagnose sys session list` (filter it first with `diagnose sys session filter dst <address>` so you get the session you mean).",
      "The session table is the authoritative record of what the FortiGate did: which policy admitted the flow, what was translated, and whether the far side replied.",
      "The most useful field is the statistic line. org traffic with reply=0 means the packets left and nothing came back, which is not the firewall blocking anything.",
      "policy_id names the rule that actually matched, which settles arguments the policy list alone cannot.",
      "hook=post dir=org act=snat carries the post-NAT source; hook=pre dir=reply act=dnat carries the pre-NAT destination.",
    ],
    parseWarnings: [],
  };
}

/** Tool entry point. Deterministic, bounded, never fetches. */
export function run(input: string): ToolRunResult {
  if (typeof input !== "string") throw new Error("Input must be a string.");
  if (input.length > MAX_INPUT) {
    throw new Error(`Input too large (${input.length} chars; limit ${MAX_INPUT}).`);
  }
  const text = input.trim();
  if (text === "") return { result: referenceResult() };

  const blocks = splitSessions(text);
  const warnings: string[] = [];
  if (blocks.length === 0) {
    warnings.push("No session blocks were recognised. Each session starts with a line beginning 'session info:'.");
    return { result: { mode: "decode", sessions: [], notes: [], parseWarnings: warnings } };
  }
  const capped = blocks.slice(0, MAX_SESSIONS);
  if (blocks.length > MAX_SESSIONS) {
    warnings.push(`Only the first ${MAX_SESSIONS} sessions were parsed.`);
  }
  const sessions = capped.map((b, i) => parseSession(b, i + 1));

  const notes: string[] = [];
  const dead = sessions.filter((s) => s.org && s.reply && s.org.packets > 0 && s.reply.packets === 0);
  if (dead.length > 0) {
    notes.push(
      `${dead.length} of ${sessions.length} ${sessions.length === 1 ? "session has" : "sessions have"} outbound traffic and no reply. That is the signature of a path that works in one direction only.`,
    );
  }
  notes.push("Fields whose full value tables are vendor documentation are shown raw rather than guessed at.");

  return { result: { mode: "decode", sessions, notes, parseWarnings: warnings } };
}
