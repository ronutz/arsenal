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
//
// PAGE LANGUAGE (02/11/2026): every explanation, finding, note, warning and
// error is built as an EngineText (src/lib/tools/engine-text.ts): a stable id,
// the English as before, and its values. runLocalisable() returns them as such
// for the page (pack keys tools.fortigate-session-table-explainer.engine.<id>);
// run() and parseSession() return plainText() of the same readings, so the API,
// the share spec and the golden vectors are unchanged. The state-flag meanings
// keep their strings; the page looks them up by flag name (flag.<name>).
// ============================================================================

import { say, plainText, engineError, type EngineText } from "../engine-text"; // sentences with ids (02/11/2026)

const MAX_INPUT = 200_000;
const MAX_SESSIONS = 500;

/** S is string in the API's reading and EngineText in the page's (runLocalisable). */
export interface NatHook<S = string> {
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
  readonly explain: S; // a sentence
}

export interface SessionStat {
  readonly bytes: number;
  readonly packets: number;
  readonly allowErr: number;
}

/** S is string in the API's reading and EngineText in the page's. */
export interface ParsedSession<S = string> {
  readonly index: number;
  readonly proto: number | null;
  readonly protoName: S; // the protocol's name, or "protocol N", or "unknown"
  readonly protoState: string | null;
  readonly protoStateExplain: S | null; // a sentence
  readonly duration: number | null;
  readonly expire: number | null;
  readonly timeout: number | null;
  readonly stateFlags: readonly string[];
  readonly org: SessionStat | null;
  readonly reply: SessionStat | null;
  readonly hooks: readonly NatHook<S>[]; // each NAT leg
  readonly policyId: string | null;
  readonly vd: string | null;
  readonly dev: string | null;
  readonly gwy: string | null;
  readonly offloaded: boolean | null;
  /** Plain-language readings derived from the fields above. */
  readonly findings: readonly S[]; // each a sentence
}

/** S is string in the API's reading and EngineText in the page's. */
export interface SessionResult<S = string> {
  readonly mode: "decode" | "reference";
  readonly sessions: readonly ParsedSession<S>[]; // each session
  readonly notes: readonly S[]; // each a sentence
  readonly parseWarnings: readonly S[]; // each a sentence
}

/** S is string in the API's reading and EngineText in the page's. */
export interface ToolRunResult<S = string> {
  readonly result: SessionResult<S>; // the reading
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
function explainProtoState(proto: number | null, raw: string): EngineText | null {
  if (proto === 17) {
    if (raw === "00") return say("state.udp00", "UDP one-way: the FortiGate has seen traffic in the original direction only. Nothing has come back."); // one-way
    if (raw === "01") return say("state.udp01", "UDP two-way: traffic has been seen in both directions."); // two-way
    return say("state.udpOther", `UDP state ${raw}.`, { raw }); // another value, raw
  }
  if (proto === 6) {
    if (raw === "01") return say("state.tcp01", "TCP established: the handshake completed and the session is open."); // established
    return say("state.tcpOther", `TCP state pair ${raw}. The two digits are the connection state in the original and reply directions; consult Fortinet's session-state documentation for the full table.`, { raw }); // another pair, raw
  }
  return null;
}

function num(s: string | undefined): number | null {
  if (s === undefined) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Parse the NAT hook lines, which are where translation is actually visible. */
function parseHooks(block: string): NatHook<EngineText>[] {
  const hooks: NatHook<EngineText>[] = []; // each leg, its explanation with an id
  const re = /hook=(\w+)\s+dir=(\w+)\s+act=(\w+)\s+(\S+?)->(\S+?)(?:\(([^)]*)\))?\s*$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) {
    const [, hook, dir, act, src, dst, translated] = m;
    let explain: EngineText; // this leg's explanation
    if (act === "snat") {
      explain = translated
        ? say("hook.snatTo", `Source NAT: the source ${src} was rewritten to ${translated} on the way out.`, { src, translated }) // with the translated tuple
        : say("hook.snat", "Source NAT applied."); // without
    } else if (act === "dnat") {
      explain = translated
        ? say("hook.dnatTo", `Destination NAT: ${dst} was rewritten to ${translated}, which is a VIP doing its work.`, { dst, translated }) // with the translated tuple
        : say("hook.dnat", "Destination NAT applied."); // without
    } else if (act === "noop") {
      explain = say("hook.noop", "No translation on this leg."); // none
    } else {
      explain = say("hook.other", `Action ${act}.`, { act }); // another action, raw
    }
    hooks.push({ hook, dir, act, src, dst, translated: translated ?? null, explain });
  }
  return hooks;
}

/** Derive plain-language findings. This is the value the raw output hides. */
function derive(s: {
  proto: number | null; org: SessionStat | null; reply: SessionStat | null;
  hooks: readonly NatHook<EngineText>[]; policyId: string | null; expire: number | null;
  protoState: string | null; offloaded: boolean | null;
}): EngineText[] {
  const out: EngineText[] = []; // each finding with its id

  // The headline reading, and the reason this tool exists.
  if (s.org && s.reply) {
    if (s.org.packets > 0 && s.reply.packets === 0) {
      out.push(say("find.noReply", // the headline
        "NOTHING CAME BACK. The FortiGate forwarded traffic in the original direction and has seen no reply packets. The session exists and the policy permitted it, so this is not the firewall blocking the traffic: look at routing beyond this device, at the destination host, or at a filter further along the path.",
      ));
    } else if (s.org.packets === 0 && s.reply.packets > 0) {
      out.push(say("find.replyOnly", "Reply traffic only, with nothing in the original direction. That usually means the session was created by traffic this device did not see the start of, or the directions are the reverse of what you assumed.")); // reply only
    } else if (s.org.packets > 0 && s.reply.packets > 0) {
      out.push(say("find.bothWays", "Traffic has flowed in both directions, so the path works in both directions and the policy permitted it.")); // both ways
    }
    if (s.org.allowErr > 0 || s.reply.allowErr > 0) {
      out.push(say("find.allowErr", "A non-zero allow_err count means packets were permitted despite an error condition, which is worth investigating rather than ignoring.")); // allow_err
    }
  }

  if (s.policyId !== null) {
    const policy = s.policyId; // the policy that admitted it
    out.push(
      policy === "0"
        ? say("find.policy0", "policy_id=0 means no ordinary firewall policy admitted this session; it is typically local traffic to the FortiGate itself or an implicitly handled flow.") // no ordinary policy
        : say("find.policy", `Policy ${policy} admitted this session. That is the authoritative answer to which rule matched, and it beats reading the policy list.`, { policy }), // the matching policy
    );
  }

  const snat = s.hooks.find((h) => h.act === "snat");
  const dnat = s.hooks.find((h) => h.act === "dnat");
  if (!snat && !dnat && s.hooks.length > 0) {
    out.push(say("find.noNat", "No translation on any leg: this session was routed without NAT.")); // routed without NAT
  }
  if (dnat) {
    out.push(say("find.dnat", "Destination NAT is present, so a VIP matched. Remember the ordering: destination translation happens BEFORE the routing lookup and before policy evaluation, which is why the policy destination must be the VIP object.")); // a VIP
  }
  if (snat) {
    out.push(say("find.snat", "Source NAT is present, applied AFTER the policy matched. The translated tuple in brackets is what the far side sees.")); // source NAT
  }
  if (s.expire !== null && s.expire <= 10) {
    const seconds = String(s.expire); // how soon
    out.push(say("find.expiring", `This session expires in ${seconds} seconds and is about to be removed from the table, which is why a second look may not find it.`, { seconds })); // about to go
  }
  if (s.offloaded) {
    out.push(say("find.offloaded", "The session is offloaded to hardware. Offloaded traffic does not traverse the CPU path, so a packet sniffer on the device will not show it unless offload is disabled for the test.")); // offloaded
  }
  return out;
}

/** Split a paste into per-session blocks. */
function splitSessions(text: string): string[] {
  const parts = text.split(/(?=^session info:)/m).map((p) => p.trim()).filter(Boolean);
  return parts.filter((p) => /^session info:/.test(p));
}

/** One session block: the API's reading, every sentence in English, exactly as before 02/11/2026. */
export function parseSession(block: string, index: number): ParsedSession {
  return plainText(parseSessionLocalisable(block, index)); // the same reading, as English
} // parseSession

/** One session block: the page's reading, every sentence an EngineText. */
function parseSessionLocalisable(block: string, index: number): ParsedSession<EngineText> {
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
    protoName: protoNameOf(proto), // the name, "protocol N" or "unknown"
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

/**
 * The protocol's display name: IANA's name, "protocol N" for a number the table lacks, or "unknown".
 * @param proto the protocol number, or null
 * @returns the name as a sentence (a name stays as written in every language)
 */
function protoNameOf(proto: number | null): EngineText {
  if (proto === null) return say("proto.unknown", "unknown"); // no proto= field
  const name = PROTOS[proto]; // IANA's name
  if (name !== undefined) return say("proto.named", `${name}`, { name }); // a protocol name, as written everywhere
  const number = String(proto); // the number
  return say("proto.number", `protocol ${number}`, { number }); // a number the table lacks
} // protoNameOf

/** Human-readable meaning for a state flag, or null when undocumented. */
export function explainStateFlag(flag: string): string | null {
  return STATE_FLAGS[flag] ?? null;
}

function referenceResult(): SessionResult<EngineText> {
  return {
    mode: "reference",
    sessions: [],
    notes: [
      say("ref.paste", "Paste the output of `diagnose sys session list` (filter it first with `diagnose sys session filter dst <address>` so you get the session you mean)."), // what to paste
      say("ref.authoritative", "The session table is the authoritative record of what the FortiGate did: which policy admitted the flow, what was translated, and whether the far side replied."), // why it matters
      say("ref.statistic", "The most useful field is the statistic line. org traffic with reply=0 means the packets left and nothing came back, which is not the firewall blocking anything."), // the key field
      say("ref.policyId", "policy_id names the rule that actually matched, which settles arguments the policy list alone cannot."), // policy_id
      say("ref.hooks", "hook=post dir=org act=snat carries the post-NAT source; hook=pre dir=reply act=dnat carries the pre-NAT destination."), // the hook lines
    ],
    parseWarnings: [],
  };
}

/** Tool entry point: the API's reading (and the golden vectors'), every sentence in English, exactly as before. */
export function run(input: string): ToolRunResult {
  return plainText(runLocalisable(input)); // the same reading, sentences as their English
} // run

/** The page's reading: the same as run(), with every sentence an EngineText. Deterministic, bounded, never fetches. */
export function runLocalisable(input: string): ToolRunResult<EngineText> {
  if (typeof input !== "string") throw engineError(say("err.notString", "Input must be a string.")); // not text
  if (input.length > MAX_INPUT) {
    const chars = String(input.length), limit = String(MAX_INPUT); // the sizes
    throw engineError(say("err.tooLarge", `Input too large (${chars} chars; limit ${limit}).`, { chars, limit })); // too large
  }
  const text = input.trim();
  if (text === "") return { result: referenceResult() };

  const blocks = splitSessions(text);
  const warnings: EngineText[] = []; // each warning with its id
  if (blocks.length === 0) {
    warnings.push(say("warn.noBlocks", "No session blocks were recognised. Each session starts with a line beginning 'session info:'.")); // nothing recognised
    return { result: { mode: "decode", sessions: [], notes: [], parseWarnings: warnings } };
  }
  const capped = blocks.slice(0, MAX_SESSIONS);
  if (blocks.length > MAX_SESSIONS) {
    const max = String(MAX_SESSIONS); // the cap
    warnings.push(say("warn.capped", `Only the first ${max} sessions were parsed.`, { max })); // capped
  }
  const sessions = capped.map((b, i) => parseSessionLocalisable(b, i + 1)); // each session, sentences with ids
  const notes: EngineText[] = []; // each note with its id
  const dead = sessions.filter((s) => s.org && s.reply && s.org.packets > 0 && s.reply.packets === 0);
  if (dead.length > 0) {
    const count = String(dead.length), total = String(sessions.length); // how many of how many
    notes.push(sessions.length === 1 // one session, or several
      ? say("note.deadOne", `${count} of ${total} session has outbound traffic and no reply. That is the signature of a path that works in one direction only.`, { count, total }) // one session
      : say("note.deadMany", `${count} of ${total} sessions have outbound traffic and no reply. That is the signature of a path that works in one direction only.`, { count, total })); // several
  }
  notes.push(say("note.raw", "Fields whose full value tables are vendor documentation are shown raw rather than guessed at.")); // the honesty boundary

  return { result: { mode: "decode", sessions, notes, parseWarnings: warnings } };
}
