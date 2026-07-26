// ============================================================================
// src/lib/tools/fortigate-policy-lookup-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS. Each pins an input to invariant parts of the output so a
// regression is caught by the build-time gate (verifyVectors via __selftest).
//
// The cases are chosen to cover the behaviours that make the tool worth having
// rather than the ones that are easy to assert: first-match-wins, shadowing,
// the implicit deny, a disabled policy being skipped, and the wildcard member.
// ============================================================================

import { run } from "./compute";

export const SET_ID = "fortigate-policy-lookup-explainer/golden@1";

export interface LookupVector {
  readonly name: string;
  readonly input: string;
  /** Expected matched policy id, or null for the implicit deny. */
  readonly matched: string | null;
  /** Expected SHADOWED ids: at least as specific as the winner, so genuinely
   *  unreachable as ordered. These are the faults. */
  readonly shadowed: readonly string[];
  /** Expected COVERED ids: broader than the winner, i.e. legitimate
   *  catch-alls. Pinned separately so the two can never be conflated again. */
  readonly covered: readonly string[];
}

const TABLE = `
id | srcintf | dstintf | srcaddr | dstaddr | service | action
1  | port1   | port2   | all     | all     | ALL     | accept
2  | port1   | port2   | LAN     | WebSrv  | HTTPS   | accept
`;

const CLI = `config firewall policy
    edit 1
        set name "narrow-ssh"
        set srcintf "port1"
        set dstintf "port2"
        set srcaddr "MgmtNet"
        set dstaddr "Jumphost"
        set service "SSH"
        set action accept
    next
    edit 2
        set name "broad-any"
        set srcintf "port1"
        set dstintf "port2"
        set srcaddr "all"
        set dstaddr "all"
        set service "ALL"
        set action accept
    next
end`;

export const VECTORS: readonly LookupVector[] = Object.freeze([
  {
    // The headline case: a broad policy above a narrow one makes the narrow
    // one unreachable, and FortiOS gives no warning.
    name: "broad policy shadows the narrow one below it",
    input: `${TABLE}\npacket: srcintf=port1, dstintf=port2, srcaddr=LAN, dstaddr=WebSrv, service=HTTPS`,
    matched: "1",
    shadowed: ["2"],
    covered: [],
  },
  {
    // Correct ordering: the specific rule is above, so it wins and nothing is
    // shadowed for this packet.
    name: "specific policy above broad one wins with no shadowing",
    input: `${CLI}\npacket: srcintf=port1, dstintf=port2, srcaddr=MgmtNet, dstaddr=Jumphost, service=SSH`,
    matched: "1",
    // Policy 2 is all/all/ALL, i.e. BROADER than the winner: a catch-all
    // below a specific rule is correct design, so it is covered, not a fault.
    shadowed: [],
    covered: ["2"],
  },
  {
    // The same list, different packet: policy 1 is eliminated on source
    // address and the broad policy legitimately matches.
    name: "narrow policy eliminated, broad policy matches",
    input: `${CLI}\npacket: srcintf=port1, dstintf=port2, srcaddr=Guest, dstaddr=Internet, service=HTTPS`,
    matched: "2",
    shadowed: [],
    covered: [],
  },
  {
    // Nothing matches -> implicit deny.
    name: "no policy matches, implicit deny",
    input: `id | srcintf | dstintf | srcaddr | dstaddr | service | action
1  | port1   | port2   | LAN     | WebSrv  | HTTPS   | accept
packet: srcintf=port3, dstintf=port4, srcaddr=LAN, dstaddr=WebSrv, service=HTTPS`,
    matched: null,
    shadowed: [],
    covered: [],
  },
  {
    // A disabled policy is skipped entirely, so the one below it wins.
    name: "disabled policy is skipped",
    input: `config firewall policy
    edit 1
        set srcintf "port1"
        set dstintf "port2"
        set srcaddr "all"
        set dstaddr "all"
        set service "ALL"
        set status disable
    next
    edit 2
        set srcintf "port1"
        set dstintf "port2"
        set srcaddr "all"
        set dstaddr "all"
        set service "ALL"
    next
end
packet: srcintf=port1, dstintf=port2, srcaddr=LAN, dstaddr=WebSrv, service=HTTPS`,
    matched: "2",
    shadowed: [],
    covered: [],
  },
  {
    // An explicit deny that matches is different from the implicit deny, and
    // the tool must say so.
    name: "explicit deny matches",
    input: `id | srcintf | dstintf | srcaddr | dstaddr | service | action
1  | port1   | port2   | Guest   | Internal | ALL    | deny
2  | port1   | port2   | all     | all      | ALL    | accept
packet: srcintf=port1, dstintf=port2, srcaddr=Guest, dstaddr=Internal, service=ALL`,
    matched: "1",
    // The accept below is BROADER, so it is a catch-all rather than a fault.
    shadowed: [],
    covered: ["2"],
  },
  {
    // Empty input is the reference state, not an error.
    name: "empty input yields the reference card",
    input: "",
    matched: null,
    shadowed: [],
    covered: [],
  },
]);

/** Build-time gate. Throws on the first mismatch with a readable message. */
export function verifyVectors(): { ok: true; count: number } {
  for (const v of VECTORS) {
    const { result } = run(v.input);
    const got = result.matched ? result.matched.id : null;
    if (got !== v.matched) {
      throw new Error(
        `[${SET_ID}] "${v.name}": expected matched=${String(v.matched)}, got ${String(got)}`,
      );
    }
    const gotShadow = result.shadowed.map((s) => s.id);
    if (gotShadow.join(",") !== v.shadowed.join(",")) {
      throw new Error(
        `[${SET_ID}] "${v.name}": expected shadowed=[${v.shadowed.join(",")}], got [${gotShadow.join(",")}]`,
      );
    }
    const gotCovered = result.covered.map((c) => c.id);
    if (gotCovered.join(",") !== v.covered.join(",")) {
      throw new Error(
        `[${SET_ID}] "${v.name}": expected covered=[${v.covered.join(",")}], got [${gotCovered.join(",")}]`,
      );
    }
  }
  return { ok: true, count: VECTORS.length };
}
