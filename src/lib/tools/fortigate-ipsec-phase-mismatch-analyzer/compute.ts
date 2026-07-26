// ============================================================================
// src/lib/tools/fortigate-ipsec-phase-mismatch-analyzer/compute.ts
// ----------------------------------------------------------------------------
// FORTIGATE IPSEC PHASE MISMATCH ANALYZER — pure engine.
//
// WHAT IT ANSWERS
// "The tunnel will not come up. What do the two peers disagree about?"
// Almost every IPsec fault resolves to which PHASE failed, and the phases fail
// for different reasons: phase 1 on identity or proposal, phase 2 on selectors,
// transforms or PFS. Given both peers' configuration the disagreement is
// mechanically computable.
//
// THREE THINGS THIS GETS RIGHT THAT PEOPLE GET WRONG
// 1. PROPOSALS INTERSECT, they do not have to be equal. FortiOS accepts a list
//    of proposals; the tunnel comes up if ANY is common. Reporting
//    "aes256-sha256 != aes128-sha1 aes256-sha256" as a mismatch would be
//    wrong, so this computes set intersection.
// 2. LIFETIMES DO NOT NEED TO MATCH. The shorter one wins. Flagging a lifetime
//    difference as a fault is a classic false positive, so it is reported as
//    informational with the effective value named.
// 3. SELECTORS ARE MIRRORED. Peer A's local subnet is Peer B's remote subnet.
//    Comparing src to src would report a mismatch on a correctly configured
//    tunnel, so the comparison is deliberately crossed.
//
// Pure, bounded, never fetches, never evaluates input as code.
// ============================================================================

const MAX_INPUT = 50_000;

export type Phase = "phase1" | "phase2";
export type Severity = "fatal" | "info";

export interface PeerPhase1 {
  readonly version: string | null;
  readonly mode: string | null;
  readonly auth: string | null;
  readonly encryption: readonly string[];
  readonly hash: readonly string[];
  readonly dhgroup: readonly string[];
  readonly lifetime: number | null;
}

export interface PeerPhase2 {
  readonly encryption: readonly string[];
  readonly hash: readonly string[];
  readonly pfs: boolean | null;
  readonly dhgroup: readonly string[];
  readonly lifetime: number | null;
  readonly src: string | null;
  readonly dst: string | null;
}

export interface Peer {
  readonly name: string;
  readonly p1: PeerPhase1;
  readonly p2: PeerPhase2;
}

export interface Issue {
  readonly phase: Phase;
  readonly field: string;
  readonly severity: Severity;
  readonly detail: string;
}

export interface IpsecResult {
  readonly mode: "analyze" | "reference";
  readonly peers: readonly Peer[];
  readonly issues: readonly Issue[];
  /** The phase that would fail first, or null when nothing fatal was found. */
  readonly failsAt: Phase | null;
  readonly verdict: string | null;
  readonly notes: readonly string[];
  readonly parseWarnings: readonly string[];
}

export interface ToolRunResult {
  readonly result: IpsecResult;
}

const norm = (s: string) => s.trim().toLowerCase().replace(/[_\s]+/g, "-");

/** Split a value that may be a space or comma separated proposal list. */
function list(v: string | undefined): string[] {
  if (!v) return [];
  return v.split(/[\s,]+/).map(norm).filter(Boolean);
}

/** Set intersection over proposal lists. Empty lists mean "not stated", which
 *  is different from "no match" and is reported as such rather than as a
 *  fault, because a config paste that omits a field is not a disagreement. */
function intersect(a: readonly string[], b: readonly string[]): string[] {
  const set = new Set(b);
  return a.filter((x) => set.has(x));
}

/** Normalise a subnet for comparison. Deliberately literal: 10.1.0.0/16 and
 *  10.1.0.0/24 are DIFFERENT selectors, not an approximation of each other,
 *  which is exactly the mistake that breaks phase 2. */
function normSubnet(s: string | null): string | null {
  if (!s) return null;
  return s.trim().toLowerCase();
}

export function parsePeers(text: string): { peers: Peer[]; warnings: string[] } {
  const warnings: string[] = [];
  const peers: Peer[] = [];
  // Blocks start at a `peer:` line and run until the next one.
  const blocks = text.split(/(?=^\s*peer\s*:)/im).map((b) => b.trim()).filter((b) => /^peer\s*:/i.test(b));

  for (const block of blocks) {
    if (peers.length >= 2) { warnings.push("Only the first two peers were compared."); break; }
    const kv = (line: string): Record<string, string> => {
      const f: Record<string, string> = {};
      for (const part of line.split(/\s*,\s*/)) {
        const m = /^\s*([a-z0-9]+)\s*=\s*(.+?)\s*$/i.exec(part);
        if (m) f[m[1].toLowerCase()] = m[2];
      }
      return f;
    };
    const nameLine = /^\s*peer\s*:\s*(.*)$/im.exec(block);
    const nameF = nameLine ? kv(nameLine[1]) : {};
    const p1Line = /^\s*phase1\s*:\s*(.*)$/im.exec(block);
    const p2Line = /^\s*phase2\s*:\s*(.*)$/im.exec(block);
    const f1 = p1Line ? kv(p1Line[1]) : {};
    const f2 = p2Line ? kv(p2Line[1]) : {};
    const n = (v: string | undefined) => {
      const x = Number(v); return Number.isFinite(x) ? x : null;
    };
    const bool = (v: string | undefined) =>
      v === undefined ? null : /^(enable|on|true|yes)$/i.test(v.trim());

    peers.push({
      name: nameF.name ?? `peer${peers.length + 1}`,
      p1: {
        version: f1.version ? norm(f1.version) : null,
        mode: f1.mode ? norm(f1.mode) : null,
        auth: f1.auth ? norm(f1.auth) : null,
        encryption: list(f1.encryption ?? f1.enc),
        hash: list(f1.hash ?? f1.integrity),
        dhgroup: list(f1.dhgroup ?? f1.dh),
        lifetime: n(f1.lifetime),
      },
      p2: {
        encryption: list(f2.encryption ?? f2.enc),
        hash: list(f2.hash ?? f2.integrity),
        pfs: bool(f2.pfs),
        dhgroup: list(f2.dhgroup ?? f2.dh),
        lifetime: n(f2.lifetime),
        src: normSubnet(f2.src ?? null),
        dst: normSubnet(f2.dst ?? null),
      },
    });
  }
  if (peers.length < 2) {
    warnings.push("Two peers are needed to compare. Each starts with a line like: peer: name=SiteA");
  }
  return { peers, warnings };
}

/** Compare one proposal field across peers. */
function compareList(
  phase: Phase, field: string, a: readonly string[], b: readonly string[],
  nameA: string, nameB: string, issues: Issue[],
): void {
  if (a.length === 0 || b.length === 0) return; // not stated, not a disagreement
  const common = intersect(a, b);
  if (common.length === 0) {
    issues.push({
      phase, field, severity: "fatal",
      detail: `No common ${field}. ${nameA} offers ${a.join(", ")}; ${nameB} offers ${b.join(", ")}. Proposals must INTERSECT, so add a value both sides accept.`,
    });
  } else if (common.length < Math.max(a.length, b.length)) {
    issues.push({
      phase, field, severity: "info",
      detail: `${field} intersects on ${common.join(", ")}. The lists differ but that is fine: a tunnel needs one common proposal, not identical lists.`,
    });
  }
}

export function analyze(a: Peer, b: Peer): { issues: Issue[]; failsAt: Phase | null; verdict: string } {
  const issues: Issue[] = [];

  // ---- Phase 1: identity and proposal ------------------------------------
  if (a.p1.version && b.p1.version && a.p1.version !== b.p1.version) {
    issues.push({ phase: "phase1", field: "IKE version", severity: "fatal",
      detail: `IKE version mismatch: ${a.name} is ${a.p1.version}, ${b.name} is ${b.p1.version}. The peers cannot negotiate at all across versions.` });
  }
  if (a.p1.auth && b.p1.auth && a.p1.auth !== b.p1.auth) {
    issues.push({ phase: "phase1", field: "authentication", severity: "fatal",
      detail: `Authentication method mismatch: ${a.name} uses ${a.p1.auth}, ${b.name} uses ${b.p1.auth}. Phase 1 fails on identity before any proposal is considered.` });
  }
  // Mode only applies to IKEv1; flagging it on v2 would be a false positive.
  const isV1 = (a.p1.version ?? b.p1.version ?? "").includes("1");
  if (isV1 && a.p1.mode && b.p1.mode && a.p1.mode !== b.p1.mode) {
    issues.push({ phase: "phase1", field: "mode", severity: "fatal",
      detail: `IKEv1 mode mismatch: ${a.name} is ${a.p1.mode}, ${b.name} is ${b.p1.mode}. Main and aggressive mode cannot interoperate.` });
  }
  compareList("phase1", "encryption", a.p1.encryption, b.p1.encryption, a.name, b.name, issues);
  compareList("phase1", "hash", a.p1.hash, b.p1.hash, a.name, b.name, issues);
  compareList("phase1", "DH group", a.p1.dhgroup, b.p1.dhgroup, a.name, b.name, issues);

  // ---- Phase 2: transforms, PFS, selectors -------------------------------
  compareList("phase2", "encryption", a.p2.encryption, b.p2.encryption, a.name, b.name, issues);
  compareList("phase2", "hash", a.p2.hash, b.p2.hash, a.name, b.name, issues);

  if (a.p2.pfs !== null && b.p2.pfs !== null && a.p2.pfs !== b.p2.pfs) {
    issues.push({ phase: "phase2", field: "PFS", severity: "fatal",
      detail: `Perfect forward secrecy is ${a.p2.pfs ? "enabled" : "disabled"} on ${a.name} and ${b.p2.pfs ? "enabled" : "disabled"} on ${b.name}. Phase 2 fails, and the log message does not usually say PFS, which is why this one costs time.` });
  } else if (a.p2.pfs && b.p2.pfs) {
    compareList("phase2", "PFS DH group", a.p2.dhgroup, b.p2.dhgroup, a.name, b.name, issues);
  }

  // Selectors are MIRRORED: A's local is B's remote.
  const aSrc = a.p2.src, aDst = a.p2.dst, bSrc = b.p2.src, bDst = b.p2.dst;
  if (aSrc && bDst && aSrc !== bDst) {
    issues.push({ phase: "phase2", field: "selectors", severity: "fatal",
      detail: `Selector mismatch: ${a.name} local is ${aSrc} but ${b.name} remote is ${bDst}. These must match EXACTLY and are compared crossed, because one peer's local subnet is the other's remote. A subnet against a supernet is a mismatch, not an approximation.` });
  }
  if (aDst && bSrc && aDst !== bSrc) {
    issues.push({ phase: "phase2", field: "selectors", severity: "fatal",
      detail: `Selector mismatch: ${a.name} remote is ${aDst} but ${b.name} local is ${bSrc}. These must match exactly.` });
  }
  if (aSrc && bDst && aSrc === bDst && aDst && bSrc && aDst === bSrc) {
    issues.push({ phase: "phase2", field: "selectors", severity: "info",
      detail: "Selectors are mirrored correctly: each peer's local subnet is the other's remote." });
  }

  // ---- Lifetimes: NOT a failure. The shorter one wins. -------------------
  for (const [phase, la, lb] of [
    ["phase1", a.p1.lifetime, b.p1.lifetime] as const,
    ["phase2", a.p2.lifetime, b.p2.lifetime] as const,
  ]) {
    if (la !== null && lb !== null && la !== lb) {
      issues.push({ phase, field: "lifetime", severity: "info",
        detail: `${phase} lifetimes differ (${la} vs ${lb}). This is NOT a failure: the shorter value wins, so the effective lifetime is ${Math.min(la, lb)} seconds. Very different values only mean rekeys at awkward intervals.` });
    }
  }

  const fatal = issues.filter((i) => i.severity === "fatal");
  const failsAt: Phase | null =
    fatal.some((i) => i.phase === "phase1") ? "phase1"
      : fatal.some((i) => i.phase === "phase2") ? "phase2" : null;

  let verdict: string;
  if (failsAt === "phase1") {
    verdict = "PHASE 1 WOULD FAIL. The peers cannot establish the protected channel, so phase 2 is never attempted. Expect no phase 2 in the logs at all.";
  } else if (failsAt === "phase2") {
    verdict = "PHASE 1 WOULD SUCCEED AND PHASE 2 WOULD FAIL. The peers authenticate and then disagree about what to protect, which is the signature of a selector, transform or PFS problem.";
  } else {
    verdict = "No fatal disagreement was found in what you supplied. If the tunnel still does not pass traffic, remember that a tunnel which reports up and carries nothing is missing a ROUTE or a FIREWALL POLICY, not an IPsec setting.";
  }
  return { issues, failsAt, verdict };
}

function referenceResult(): IpsecResult {
  return {
    mode: "reference", peers: [], issues: [], failsAt: null, verdict: null,
    notes: [
      "Phase 1 authenticates the peers and protects the negotiation; phase 2 negotiates the security associations and the selectors.",
      "Phase 1 failures are identity or proposal. Phase 2 failures are selectors, transforms or PFS.",
      "Proposals INTERSECT: the lists do not have to be identical, they only need one value in common.",
      "Lifetimes do NOT need to match. The shorter value wins.",
      "Selectors are mirrored: one peer's local subnet is the other's remote, and they must match exactly.",
      "Describe both peers, one block each:",
      "peer: name=SiteA",
      "phase1: version=ikev2, encryption=aes256, hash=sha256, dhgroup=14, auth=psk, lifetime=86400",
      "phase2: encryption=aes256, hash=sha256, pfs=enable, dhgroup=14, src=10.1.0.0/16, dst=10.2.0.0/16",
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

  const { peers, warnings } = parsePeers(text);
  if (peers.length < 2) {
    return { result: { mode: "analyze", peers, issues: [], failsAt: null, verdict: null, notes: [], parseWarnings: warnings } };
  }
  const { issues, failsAt, verdict } = analyze(peers[0], peers[1]);
  const notes = [
    "Only the fields you supplied are compared. A field present on one side and absent on the other is treated as not stated rather than as a disagreement.",
  ];
  return { result: { mode: "analyze", peers, issues, failsAt, verdict, notes, parseWarnings: warnings } };
}
