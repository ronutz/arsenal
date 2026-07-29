// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// Vectors for the SPBM multicast B-MAC engine.
//
// Every forward case is a WORKED EXAMPLE FROM VENDOR DOCUMENTATION, and every
// reverse case is a line of REAL `show isis spbm multicast-fib` output. None
// was invented, which matters here: the first implementation of this engine
// produced correct addresses in the forward direction while decoding them
// wrongly, and only the reverse vectors caught it.
// ============================================================================

import { buildMulticastMac, decodeMulticastMac, type SpbmMulticastResult } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "extreme-spbm-multicast-mac-golden-v1";

export interface SpbmVector {
  id: string;
  description: string;
  /** Forward: nickname + I-SID. Reverse: mac only. */
  nickname?: string;
  isid?: string;
  mac?: string;
  expectOk?: boolean;
  expectErrorIncludes?: string;
  expectMac?: string;
  expectNickname?: string;
  expectIsid?: number;
  expectNoteIncludes?: string;
}

export const SPBM_VECTORS: SpbmVector[] = [
  {
    id: "voss-guide-worked-example",
    description:
      "The worked example in Extreme's own VOSS user guide: nickname 0.00.10 with I-SID 100.",
    nickname: "0.00.10",
    isid: "100",
    expectOk: true,
    expectMac: "03:00:10:00:00:64",
  },
  {
    id: "beb1-isid-200",
    description: "A published SPB walkthrough: BEB1 at 0.40.01 advertising I-SID 200 (0xc8).",
    nickname: "0.40.01",
    isid: "200",
    expectOk: true,
    expectMac: "03:40:01:00:00:c8",
  },
  {
    id: "same-service-different-root",
    description:
      "The same I-SID rooted on a different node gives a different address - one tree per root, which is the point of source-specific multicast here.",
    nickname: "0.40.02",
    isid: "200",
    expectOk: true,
    expectMac: "03:40:02:00:00:c8",
  },
  {
    id: "hex-isid-accepted",
    description: "An I-SID given in hex resolves to the same address as its decimal form.",
    nickname: "0.00.10",
    isid: "0x64",
    expectOk: true,
    expectMac: "03:00:10:00:00:64",
  },
  {
    id: "fib-line-isid-1101",
    description: "Real multicast FIB output: 03:00:41:00:04:4d against a listed I-SID of 1101.",
    mac: "03:00:41:00:04:4d",
    expectOk: true,
    expectNickname: "0.00.41",
    expectIsid: 1101,
  },
  {
    id: "fib-line-isid-1103",
    description: "The adjacent FIB line, same root, next service - the addresses differ by one.",
    mac: "03:00:41:00:04:4f",
    expectOk: true,
    expectNickname: "0.00.41",
    expectIsid: 1103,
  },
  {
    id: "fib-large-isid",
    description:
      "A large I-SID from the same output: 03:00:07:e4:e2:02 decodes to 15000066, which is the value the FIB prints.",
    mac: "03:00:07:e4:e2:02",
    expectOk: true,
    expectNickname: "0.00.07",
    expectIsid: 15000066,
  },
  {
    id: "fib-same-service-second-root",
    description:
      "The same large I-SID rooted on the neighbouring node, which is how the FIB shows two trees for one service.",
    mac: "03:00:08:e4:e2:02",
    expectOk: true,
    expectNickname: "0.00.08",
    expectIsid: 15000066,
  },
  {
    id: "mac-without-separators",
    description: "A MAC pasted without separators is accepted.",
    mac: "030041 00044d".replace(" ", ""),
    expectOk: true,
    expectNickname: "0.00.41",
    expectIsid: 1101,
  },
  {
    id: "ambiguous-nickname-is-declared",
    description:
      "A nickname whose first field collides with the fixed prefix cannot be recovered from the address. The tool says so instead of pretending otherwise.",
    nickname: "1.11.16",
    isid: "100",
    expectOk: true,
    expectNoteIncludes: "cannot be decoded back to a single nickname",
  },
  {
    id: "unassigned-nickname-flagged",
    description: "A nickname of 0.00.00 means none is assigned, and SPBM will not come up.",
    nickname: "0.00.00",
    isid: "100",
    expectOk: true,
    expectNoteIncludes: "will not form adjacencies",
  },
  {
    id: "error-not-a-group-address",
    description:
      "A unicast backbone MAC is the chassis address and is not derived from anything, so decoding it is refused with the reason.",
    mac: "00:bb:00:00:41:00",
    expectOk: false,
    expectErrorIncludes: "not an SPBM group address",
  },
  {
    id: "error-isid-too-large",
    description: "An I-SID beyond 24 bits is a transposed digit, not a service.",
    nickname: "0.00.10",
    isid: "16777216",
    expectOk: false,
    expectErrorIncludes: "exceeds 24 bits",
  },
  {
    id: "error-bad-nickname",
    description: "Anything that is not x.yy.zz or a bare hex value is named rather than guessed at.",
    nickname: "not-a-nickname",
    isid: "100",
    expectOk: false,
    expectErrorIncludes: "is not a nickname",
  },
];

/** Run every vector. Returns failures, empty when all pass. */
export function verifyVectors(): string[] {
  const failures: string[] = [];
  for (const v of SPBM_VECTORS) {
    let r: SpbmMulticastResult | null = null;
    let error: string | null = null;
    try {
      r = v.mac !== undefined ? decodeMulticastMac(v.mac) : buildMulticastMac(v.nickname!, v.isid!);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
    if (v.expectOk === false) {
      if (!error) failures.push(`${v.id}: expected an error, got a result`);
      else if (v.expectErrorIncludes && !error.includes(v.expectErrorIncludes)) {
        failures.push(`${v.id}: error "${error}" does not mention "${v.expectErrorIncludes}"`);
      }
      continue;
    }
    if (error) {
      failures.push(`${v.id}: unexpected error "${error}"`);
      continue;
    }
    if (!r) {
      failures.push(`${v.id}: no result`);
      continue;
    }
    if (v.expectMac && r.mac !== v.expectMac) {
      failures.push(`${v.id}: mac ${r.mac}, expected ${v.expectMac}`);
    }
    if (v.expectNickname && r.nickname.text !== v.expectNickname) {
      failures.push(`${v.id}: nickname ${r.nickname.text}, expected ${v.expectNickname}`);
    }
    if (v.expectIsid !== undefined && r.isid !== v.expectIsid) {
      failures.push(`${v.id}: I-SID ${r.isid}, expected ${v.expectIsid}`);
    }
    if (v.expectNoteIncludes && !r.notes.some((n) => n.includes(v.expectNoteIncludes!))) {
      failures.push(`${v.id}: no note mentioning "${v.expectNoteIncludes}"`);
    }
  }
  return failures;
}
