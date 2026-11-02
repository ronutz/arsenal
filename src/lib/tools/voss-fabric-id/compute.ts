// ============================================================================
// src/lib/tools/voss-fabric-id/compute.ts
// ----------------------------------------------------------------------------
// VOSS / Fabric Connect (SPBM) identifier decoder. Pure logic: auto-detect and
// decode the three numbers that name things in an Extreme SPBM fabric -
//   - the 24-bit I-SID (service identifier),
//   - the 20-bit nickname, written X.XX.XX, and
//   - the system-id / B-MAC (a 48-bit MAC-form value).
// Grounded in Extreme VOSS documentation (see the tool manifest sources).
//
// Detection is unambiguous by shape: a nickname is one hex digit then two
// dot-separated hex bytes; a B-MAC is a separated 48-bit MAC (dotted-triple,
// colon, or hyphen); a bare decimal number is an I-SID.
//
// PAGE LANGUAGE (02/11/2026): every note and error message is built as an
// EngineText (src/lib/tools/engine-text.ts): a stable id, the English as
// before, and its values. analyzeFabricIdLocalisable() returns them as such for
// the page (pack keys tools.voss-fabric-id.engine.<id>); analyzeFabricId()
// returns plainText() of the same reading, so the API, the share spec and the
// golden vectors are unchanged.
// ============================================================================

import { say, plainText, type EngineText } from "../engine-text"; // sentences with ids (02/11/2026)

export type FabricIdKind = "isid" | "nickname" | "bmac";

/** S is string in the API's reading and EngineText in the page's (analyzeFabricIdLocalisable). */
export interface FabricIdResult<S = string> {
  ok: boolean;
  input: string;
  kind?: FabricIdKind;
  isid?: { value: number; hex: string };
  nickname?: { formatted: string; value: number; hex: string };
  bmac?: { formatted: string; firstOctet: string; local: boolean; multicast: boolean };
  notes?: S[]; // each a sentence
  error?: { message: S }; // a sentence
}

const NICKNAME_RE = /^([0-9a-fA-F])\.([0-9a-fA-F]{2})\.([0-9a-fA-F]{2})$/;
const BMAC_DOTTED = /^([0-9a-fA-F]{4})\.([0-9a-fA-F]{4})\.([0-9a-fA-F]{4})$/;
const BMAC_SEP = /^([0-9a-fA-F]{2})([:-][0-9a-fA-F]{2}){5}$/;
const ISID_RE = /^\d+$/;

const ISID_MAX = 0xffffff; // 16,777,215 (24-bit)
const NICK_MAX = 0xfffff; // 1,048,575 (20-bit)

function hex(n: number): string {
  return "0x" + n.toString(16).toUpperCase();
}

/** Group 12 hex digits into dotted-triple form (00bb.0021.0001). */
function toDottedTriple(h: string): string {
  return (h.match(/.{1,4}/g) ?? []).join(".");
}

export function analyzeFabricId(input: string): FabricIdResult {
  return plainText(analyzeFabricIdLocalisable(input)); // the same reading, as English (the API's and the vectors')
} // analyzeFabricId

/** The page's reading: the same as analyzeFabricId(), with every sentence an EngineText (id, English, values). */
export function analyzeFabricIdLocalisable(input: string): FabricIdResult<EngineText> {
  const s = input.trim();
  if (!s) {
    return { ok: false, input: s, error: { message: say("err.empty", "Enter an I-SID, a nickname (X.XX.XX), or a system-id / B-MAC.") } }; // nothing typed
  }

  // -- Nickname (20-bit, X.XX.XX) --
  const nm = s.match(NICKNAME_RE);
  if (nm) {
    const d1 = parseInt(nm[1], 16);
    const d2 = parseInt(nm[2], 16);
    const d3 = parseInt(nm[3], 16);
    const value = (d1 << 16) | (d2 << 8) | d3;
    const formatted = `${d1.toString(16).toUpperCase()}.${d2.toString(16).toUpperCase().padStart(2, "0")}.${d3
      .toString(16)
      .toUpperCase()
      .padStart(2, "0")}`;
    const notes: EngineText[] = []; // each note with its id
    if (value === 0) {
      notes.push(say("nick.zero", "0.00.00 is all zeros; it is not a valid assigned nickname.")); // all zeros
    }
    notes.push(say("nick.what", // what a nickname is
      "A nickname is a 20-bit SPBM node identifier used to build the multicast trees. It must be unique across the fabric, including across adjacent IS-IS areas.",
    ));
    return { ok: true, input: s, kind: "nickname", nickname: { formatted, value, hex: hex(value) }, notes };
  }

  // -- B-MAC / system-id (48-bit, MAC form) --
  let bhex: string | null = null;
  if (BMAC_DOTTED.test(s)) {
    bhex = s.replace(/\./g, "").toUpperCase();
  } else if (BMAC_SEP.test(s)) {
    bhex = s.replace(/[:-]/g, "").toUpperCase();
  }
  if (bhex) {
    const b0 = parseInt(bhex.slice(0, 2), 16);
    const local = (b0 & 0x02) !== 0;
    const multicast = (b0 & 0x01) !== 0;
    const notes: EngineText[] = []; // each note with its id
    if (local) {
      notes.push(say("bmac.local", "The U/L bit is set: this is a locally administered address, which matches Extreme's SPBM guidance to use 02 as the first octet of the system-id.")); // locally administered
    } else {
      notes.push(say("bmac.universal", "The U/L bit is clear (universally administered). Extreme's SPBM guidance is to use a locally administered address (first octet 02) for the system-id / B-MAC.")); // universally administered
    }
    if (multicast) {
      notes.push(say("bmac.group", "The I/G bit is set (a group address); a node system-id / B-MAC should be an individual (unicast) address.")); // a group address
    }
    return {
      ok: true,
      input: s,
      kind: "bmac",
      bmac: { formatted: toDottedTriple(bhex), firstOctet: "0x" + bhex.slice(0, 2), local, multicast },
      notes,
    };
  }

  // -- I-SID (24-bit, decimal) --
  if (ISID_RE.test(s)) {
    const value = Number(s);
    if (value < 1 || value > ISID_MAX) {
      return {
        ok: false,
        input: s,
        error: { message: say("err.isidRange", `An I-SID is a 24-bit value from 1 to ${ISID_MAX}; ${value} is out of range.`, { max: String(ISID_MAX), value: String(value) }) }, // out of range
      };
    }
    const notes: EngineText[] = []; // each note with its id
    notes.push(say("isid.what", // L2 or L3 is provisioning
      "Whether this is a Layer 2 VSN (a VLAN mapped to the I-SID) or a Layer 3 VSN (a VRF mapped to the I-SID) is set by how it is provisioned, not by the number. IP Shortcuts uses no I-SID.",
    ));
    if (value === 16777001) {
      notes.push(say("isid.fan", "16777001 is the default Fabric Attach network I-SID (FAN).")); // the FAN I-SID
    }
    return { ok: true, input: s, kind: "isid", isid: { value, hex: hex(value) }, notes };
  }

  return {
    ok: false,
    input: s,
    error: {
      message: say("err.unrecognised", "Unrecognised. Enter a decimal I-SID, a nickname like C.30.00, or a system-id / B-MAC like 00bb.0021.0001."), // none of the shapes
    },
  };
}

// Exposed for tests / callers that want the numeric bounds.
export const FABRIC_ID_BOUNDS = { ISID_MAX, NICK_MAX };
