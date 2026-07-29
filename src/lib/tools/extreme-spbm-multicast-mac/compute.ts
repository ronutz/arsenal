// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/extreme-spbm-multicast-mac/compute.ts
// ----------------------------------------------------------------------------
// THE SPBM MULTICAST B-MAC ENGINE, BOTH DIRECTIONS.
//
// In Shortest Path Bridging MAC mode there is no learning of backbone MACs.
// The group address a BEB uses for a service is not discovered or configured -
// it is COMPUTED, from two numbers every node already knows:
//
//     first three bytes  =  0x030000 OR the 20-bit nickname
//     last three bytes   =  the 24-bit I-SID
//
// So nickname 0.00.10 carrying I-SID 100 produces 03:00:10:00:00:64, and every
// other node on that shortest path tree computes the identical address without
// being told. That is the whole trick of SPBM multicast, and it is why the
// forwarding database can be built from the link-state database alone.
//
// THE DIRECTION THAT EARNS ITS KEEP IS THE REVERSE ONE. Reading
// `show isis spbm multicast-fib` gives a column of group addresses, and the
// operational question is always the same: whose tree is this, and which
// service. Both answers are sitting in the address. 03:00:41:00:04:4d is
// nickname 0.00.41 carrying I-SID 1101, and once that is visible the FIB stops
// being a wall of hex.
//
// The nickname is written x.yy.zz in Extreme's configuration - three dotted
// fields totalling 20 bits - which is a notation people transcribe wrongly
// often enough that parsing it is half the value here.
//
// LIMITS, stated rather than implied: this computes the group address only. It
// does not model B-VID selection, the shortest path tree itself, IS-IS
// adjacency, or the unicast B-MAC, which is the chassis MAC and is not derived
// from anything.
// ============================================================================

/** A nickname in Extreme's dotted form, plus its numeric value. */
export interface Nickname {
  /** As written, e.g. "0.00.10". */
  text: string;
  /** 20-bit value. */
  value: number;
}

export interface SpbmMulticastResult {
  nickname: Nickname;
  /** 24-bit service identifier. */
  isid: number;
  /** The computed group address, lower-case colon form. */
  mac: string;
  /** How the address was assembled, for display. */
  workings: {
    prefixHex: string;
    nicknameHex: string;
    firstThreeBytes: string;
    isidHex: string;
    lastThreeBytes: string;
  };
  /** Which way the tool was used. */
  direction: "forward" | "reverse";
  notes: string[];
}

export class SpbmParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SpbmParseError";
  }
}

// The fixed high bits every SPBM group address carries.
//
// A FIRST ATTEMPT USED 0x030000 AND DECODED WRONGLY. The vendor formula is
// `nickname | 0x30000` - five hex digits, not six - which renders as the
// leading 03 byte. Writing it as 0x030000 shifted the whole prefix a nibble
// and turned nickname 0.00.41 into 3.00.41 on the way back. The forward
// direction still produced correct addresses, which is exactly why the reverse
// vectors mattered: a one-way check would have shipped this.
const PREFIX = 0x30000;
const NICKNAME_MAX = 0xfffff; // 20 bits
const ISID_MAX = 0xffffff; // 24 bits

/** Parse a nickname written x.yy.zz, or a bare hex value. */
export function parseNickname(input: string): Nickname {
  const text = input.trim();
  if (!text) throw new SpbmParseError("No nickname given.");

  const dotted = /^([0-9a-f]{1,2})\.([0-9a-f]{1,2})\.([0-9a-f]{1,2})$/i.exec(text);
  if (dotted) {
    const [, a, b, c] = dotted;
    // The three fields are hex and concatenate to 20 bits: x is the top nibble,
    // yy and zz are a byte each.
    const value = (parseInt(a, 16) << 16) | (parseInt(b, 16) << 8) | parseInt(c, 16);
    if (value > NICKNAME_MAX) {
      throw new SpbmParseError(
        `Nickname ${text} exceeds 20 bits. The first field is a single hex nibble (0-f).`,
      );
    }
    return { text, value };
  }

  const bare = /^(0x)?([0-9a-f]{1,5})$/i.exec(text);
  if (bare) {
    const value = parseInt(bare[2], 16);
    if (value > NICKNAME_MAX) throw new SpbmParseError(`Nickname 0x${bare[2]} exceeds 20 bits.`);
    return { text: formatNickname(value), value };
  }

  throw new SpbmParseError(
    `"${text}" is not a nickname. Extreme writes them x.yy.zz in hex, for example 0.00.10 or 1.11.16.`,
  );
}

/** Render a 20-bit nickname back to Extreme's dotted form. */
export function formatNickname(value: number): string {
  const a = (value >> 16) & 0xf;
  const b = (value >> 8) & 0xff;
  const c = value & 0xff;
  return `${a.toString(16)}.${b.toString(16).padStart(2, "0")}.${c.toString(16).padStart(2, "0")}`;
}

/** Parse an I-SID given in decimal, or hex when prefixed with 0x. */
export function parseIsid(input: string): number {
  const text = input.trim();
  if (!text) throw new SpbmParseError("No I-SID given.");
  const hex = /^0x([0-9a-f]{1,6})$/i.exec(text);
  const value = hex ? parseInt(hex[1], 16) : Number(text);
  if (!Number.isInteger(value) || value < 0) {
    throw new SpbmParseError(`"${text}" is not an I-SID. Give a decimal value, or hex as 0x...`);
  }
  if (value > ISID_MAX) {
    throw new SpbmParseError(
      `I-SID ${value} exceeds 24 bits (maximum ${ISID_MAX}). Check for a transposed digit.`,
    );
  }
  return value;
}

const hex2 = (n: number) => n.toString(16).padStart(2, "0");

/** FORWARD: nickname + I-SID -> the group address every node will compute. */
export function buildMulticastMac(nicknameInput: string, isidInput: string): SpbmMulticastResult {
  const nickname = parseNickname(nicknameInput);
  const isid = parseIsid(isidInput);

  const high = PREFIX | nickname.value;
  // Bits 16 and 17 belong to the prefix. A nickname that sets them cannot be
  // recovered from the address afterwards, so the ambiguity is declared rather
  // than hidden - see the note pushed below.
  const bytes = [
    (high >> 16) & 0xff,
    (high >> 8) & 0xff,
    high & 0xff,
    (isid >> 16) & 0xff,
    (isid >> 8) & 0xff,
    isid & 0xff,
  ];
  const mac = bytes.map(hex2).join(":");

  const notes: string[] = [
    "Every node on this tree computes the same address from the link-state database. Nothing is learned and nothing is configured, which is why SPBM needs no backbone MAC learning.",
  ];
  if (isid === 0) {
    notes.push("I-SID 0 is not a service. Check the value you meant to use.");
  }
  if (nickname.value === 0) {
    notes.push(
      "A nickname of 0.00.00 means the node has none assigned. SPBM will not form adjacencies until one is set.",
    );
  }
  if ((nickname.value & PREFIX) !== 0) {
    notes.push(
      "This nickname sets bits that the fixed 0x30000 prefix also sets, so the address it produces cannot be decoded back to a single nickname. Every documented example uses a first field of 0; treat anything else as unverified here and check it against the switch.",
    );
  }

  return {
    nickname,
    isid,
    mac,
    workings: {
      prefixHex: "0x030000",
      nicknameHex: `0x${nickname.value.toString(16).padStart(5, "0")}`,
      firstThreeBytes: bytes.slice(0, 3).map(hex2).join(":"),
      isidHex: `0x${isid.toString(16).padStart(6, "0")}`,
      lastThreeBytes: bytes.slice(3).map(hex2).join(":"),
    },
    direction: "forward",
    notes,
  };
}

/** REVERSE: a group address from the FIB -> whose tree, and which service. */
export function decodeMulticastMac(macInput: string): SpbmMulticastResult {
  const cleaned = macInput.trim().toLowerCase().replace(/[:.-]/g, "");
  if (!/^[0-9a-f]{12}$/.test(cleaned)) {
    throw new SpbmParseError(
      `"${macInput.trim()}" is not a MAC address. Paste one as it appears in the multicast FIB, for example 03:00:41:00:04:4d.`,
    );
  }
  const bytes: number[] = [];
  for (let i = 0; i < 12; i += 2) bytes.push(parseInt(cleaned.slice(i, i + 2), 16));

  if (bytes[0] !== 0x03) {
    throw new SpbmParseError(
      `This is not an SPBM group address: they all begin 03. A first byte of ${hex2(
        bytes[0],
      )} means this is something else - a unicast backbone MAC is the chassis address and is not derived from a nickname.`,
    );
  }

  const high = (bytes[0] << 16) | (bytes[1] << 8) | bytes[2];
  // Recover the nickname by removing the prefix that was OR-ed in, NOT by
  // masking to 20 bits - masking leaves the prefix's own bits in place and
  // reports a nickname three units too high in the first field.
  const value = high & ~PREFIX & NICKNAME_MAX;
  const nickname: Nickname = { text: formatNickname(value), value };
  const isid = (bytes[3] << 16) | (bytes[4] << 8) | bytes[5];

  return {
    nickname,
    isid,
    mac: bytes.map(hex2).join(":"),
    workings: {
      prefixHex: "0x030000",
      nicknameHex: `0x${value.toString(16).padStart(5, "0")}`,
      firstThreeBytes: bytes.slice(0, 3).map(hex2).join(":"),
      isidHex: `0x${isid.toString(16).padStart(6, "0")}`,
      lastThreeBytes: bytes.slice(3).map(hex2).join(":"),
    },
    direction: "reverse",
    notes: [
      `This is the tree rooted on the node with nickname ${nickname.text}, carrying I-SID ${isid}.`,
      "Match the nickname against the SYSID or HOST-NAME column of the same FIB output to name the node.",
    ],
  };
}

/** Accepts either direction and works out which was meant. */
export function analyse(input: string, isid?: string): SpbmMulticastResult {
  const t = input.trim();
  const looksLikeMac = /^[0-9a-f]{2}([:.-][0-9a-f]{2}){5}$/i.test(t) || /^[0-9a-f]{12}$/i.test(t);
  if (looksLikeMac && !isid) return decodeMulticastMac(t);
  if (!isid) {
    throw new SpbmParseError(
      "Give a nickname and an I-SID to build an address, or paste a group MAC on its own to take one apart.",
    );
  }
  return buildMulticastMac(t, isid);
}
