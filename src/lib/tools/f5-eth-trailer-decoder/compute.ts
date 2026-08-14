// ============================================================================
// src/lib/tools/f5-eth-trailer-decoder/compute.ts
// ----------------------------------------------------------------------------
// F5 ETHERNET TRAILER DECODER - the pure engine.
//
// WHAT THIS IS. When tcpdump runs ON a BIG-IP with the noise flags, the system
// appends a trailer to each captured frame carrying what TMM knew about that
// packet: which slot and TMM handled it, which direction it was going, which
// virtual server it matched, the flow and peer identifiers, and - on a reset -
// why the device sent the RST. Wireshark reads it with the `f5ethtrailer`
// dissector. This reads the same fields without Wireshark.
//
// *** THE REFUSAL THIS TOOL IS BUILT AROUND ***
//
// From BIG-IP v15 the trailer can carry a TLS PROVIDER SECTION, and that
// section contains SESSION SECRETS - early secret, client and server traffic
// secrets, the exporter secret. Wireshark's dissector will happily turn them
// into keylog entries and decrypt the capture.
//
// THIS TOOL DECODES THE DIAGNOSTIC NOISE AND STOPS AT THE TLS PROVIDER. It
// reports that a TLS section is present, says what that means, and does not
// parse, echo or store a single byte of it.
//
// The reason is not squeamishness. It is that the most useful thing this tool
// can tell an engineer is the thing nobody tells them:
//
//   A CAPTURE TAKEN AT HIGH NOISE ON A v15+ BIG-IP CAN CONTAIN THE KEYS TO ITS
//   OWN TLS SESSIONS. Sending that pcap to a vendor, a ticket, or a colleague
//   sends the session keys with it.
//
// F5's own documentation notes the trailer never leaves the device on the wire
// - which is true, and is about the WIRE. The file is a different question.
//
// SCOPE. Parses the trailer text or hex you paste. Contacts nothing, stores
// nothing, and cannot see your capture.
// ============================================================================

/** The three noise levels, set by the tcpdump interface suffix. */
export type NoiseLevel = "low" | "medium" | "high" | "unknown";

export interface TrailerField {
  name: string;
  value: string;
  /** Which noise level makes this field appear. */
  level: NoiseLevel;
  explain: string;
}

export interface TrailerDecode {
  /** `0xf5deb0f5` when the magic was found. */
  magic?: string;
  trailerLength?: number;
  version?: number;
  /** Highest noise level the input demonstrates. */
  noise: NoiseLevel;
  fields: TrailerField[];
  /** True when a TLS provider section is present. Deliberately NOT parsed. */
  tlsProviderPresent: boolean;
  notes: string[];
  warnings: string[];
}

export class TrailerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TrailerError";
  }
}

/** The magic that opens an F5 Ethernet trailer. */
const MAGIC = "f5deb0f5";

/**
 * RST causes seen in the field. Deliberately short: the list is long and
 * version-dependent, and an invented explanation for a cause this tool has not
 * verified would be worse than reporting the string as given.
 */
const RST_CAUSES: Record<string, string> = {
  "no local listener":
    "No virtual server was listening on that address and port. The commonest cause of a reset that surprises somebody: the traffic arrived, the device looked for a listener, and there was not one.",
  "no flow found":
    "A packet arrived for a connection the device has no record of. Usually a late packet on a flow that has already been torn down, or traffic arriving on a path that did not carry the handshake.",
  "flow expired":
    "The connection was idle beyond its timeout and the device removed it. If this appears on traffic the application believes is alive, the idle timeout and the application's keepalive interval disagree.",
};

const norm = (s: string) => s.trim().toLowerCase();

/** Decode a pasted trailer, as hex bytes or as Wireshark/tshark field text. */
export function decodeTrailer(input: string): TrailerDecode {
  const raw = (input ?? "").trim();
  if (!raw) throw new TrailerError("Nothing to decode: paste the trailer bytes, or the F5 Ethernet Trailer section from Wireshark.");

  const fields: TrailerField[] = [];
  const notes: string[] = [];
  const warnings: string[] = [];
  let noise: NoiseLevel = "unknown";
  let magic: string | undefined;
  let trailerLength: number | undefined;
  let version: number | undefined;

  // --- hex path: find the magic and read the header ------------------------
  const hex = raw.replace(/0x/gi, "").replace(/[^0-9a-fA-F]/g, "").toLowerCase();
  const looksHex = hex.length >= 16 && hex.length / raw.replace(/\s/g, "").length > 0.6;
  if (looksHex) {
    const at = hex.indexOf(MAGIC);
    if (at >= 0) {
      magic = "0xf5deb0f5";
      // The header that follows the magic in the dissector's own output order:
      // length, then version.
      const after = hex.slice(at + 8);
      if (after.length >= 4) trailerLength = parseInt(after.slice(0, 4), 16);
      if (after.length >= 6) version = parseInt(after.slice(4, 6), 16);
      notes.push(
        "The magic 0xf5deb0f5 marks the start of the F5 trailer. Anything before it in the frame is the packet proper; anything after is the device talking about that packet.",
      );
    } else {
      warnings.push(
        "No 0xf5deb0f5 magic found in those bytes. Either this is not an F5 trailer, or the capture was taken somewhere other than on the BIG-IP itself - the trailer only exists in files written by tcpdump running on the device.",
      );
    }
  }

  // --- text path: the dissector prints the header as LABELLED LINES --------
  // A pasted Wireshark view carries "Magic: 0xf5deb0f5" as text, not as hex
  // bytes, so the hex scan above never sees it. Read it here as well, or the
  // commonest input a reader actually has - a copied dissector pane - falls
  // through both paths and looks like garbage.
  if (!magic && /magic\s*[:=]\s*0x?f5deb0f5/i.test(raw)) {
    magic = "0xf5deb0f5";
    const L = /\blength\s*[:=]\s*(\d+)/i.exec(raw);
    const V = /\bversion\s*[:=]\s*(\d+)/i.exec(raw);
    if (L) trailerLength = Number(L[1]);
    if (V) version = Number(V[1]);
  }

  // --- text path: read labelled fields from a pasted dissector view --------
  const line = (re: RegExp) => {
    const m = re.exec(raw);
    return m ? m[1].trim() : undefined;
  };
  const add = (name: string, value: string | undefined, level: NoiseLevel, explain: string) => {
    if (value === undefined || value === "") return;
    fields.push({ name, value, level, explain });
  };

  const dir = line(/\b(?:ingress|direction)\s*[:=]\s*(\S+)/i);
  add("Direction", dir, "low",
    "Which way the packet was going relative to the device. Present at the lowest noise level because it is the first thing that disambiguates a capture: the same connection appears twice, once on each side, and without this the two look like duplicates.");

  const slot = line(/\bslot\s*[:=]\s*(\d+)/i);
  add("Slot", slot, "low",
    "The blade that handled the packet, on a chassis. On an appliance it is constant and uninteresting; on a VIPRION or VELOS it tells you which blade to look at when only some traffic misbehaves.");

  const tmm = line(/\btmm\s*[:=]\s*(\d+)/i);
  add("TMM", tmm, "low",
    "The Traffic Management Microkernel instance that handled the packet. Each TMM owns its own connections, so a problem confined to one TMM behaves like an intermittent problem until you notice the pattern.");

  const vip = line(/\b(?:vip|virtual(?:\s+server)?(?:\s+name)?)\s*[:=]\s*(\S+)/i);
  add("Virtual server", vip, "low",
    "The virtual server the packet matched, where one applied. An empty value on traffic you expected to be proxied is itself the answer: nothing matched.");

  const flow = line(/\bflow(?:\s*id)?\s*[:=]\s*(\S+)/i);
  add("Flow ID", flow, "medium",
    "The device's identifier for this side of the connection. Unique only within a slot and TMM combination, and REUSED over time - so the same flow ID can appear on unrelated packets earlier or later in one capture.");

  const peer = line(/\bpeer(?:\s*(?:id|flow))?\s*[:=]\s*(\S+)/i);
  add("Peer ID", peer, "medium",
    "The identifier for the other side of the same connection: the server-side flow when this is the client side, and the reverse. Filtering on f5ethtrailer.anyflowid rather than flowid returns BOTH halves, which is almost always what you actually want.");

  const rst = line(/\brst\s*cause\s*[:=]\s*(.+)/i);
  if (rst) {
    const key = norm(rst).replace(/[.;].*$/, "");
    const known = Object.entries(RST_CAUSES).find(([k]) => key.includes(k));
    add("RST cause", rst, "medium",
      known
        ? known[1]
        : "The device's own reason for sending the reset. This tool does not carry an explanation for this particular cause and will not invent one - the string is the thing to search F5's documentation for.");
    notes.push(
      "The RST cause is the single most useful field in the trailer. A reset seen in a capture without it tells you a connection died; with it, the device tells you why it killed the connection itself.",
    );
  }

  // --- noise level -------------------------------------------------------
  const hasLow = fields.some((f) => f.level === "low");
  const hasMed = fields.some((f) => f.level === "medium");
  if (/:nnn\b/.test(raw) || /high\s+details/i.test(raw)) noise = "high";
  else if (hasMed || /:nn\b/.test(raw) || /medium\s+details/i.test(raw)) noise = "medium";
  else if (hasLow || /:n\b/.test(raw) || /low\s+details/i.test(raw)) noise = "low";

  // --- THE TLS PROVIDER: DETECTED, NAMED, NOT PARSED ----------------------
  const tlsProviderPresent =
    /provider\s*[:=]\s*4\b/i.test(raw) ||
    /\btls\b/i.test(raw) && /(secret|keylog|traffic_secret)/i.test(raw);

  if (tlsProviderPresent) {
    warnings.push(
      "A TLS provider section is present in this trailer. From BIG-IP v15 that section carries SESSION SECRETS, and Wireshark will convert them into keylog entries and decrypt the capture. This tool reports its presence and decodes none of it.",
    );
    warnings.push(
      "Treat the capture file accordingly. F5 documents that the trailer never leaves the device on the wire, which is true and is about the wire - the FILE is a different question. Sending this pcap to a vendor, a ticket or a colleague sends the session keys with it.",
    );
  }

  if (fields.length === 0 && !magic && !tlsProviderPresent && !looksHex) {
    throw new TrailerError(
      "Nothing recognisable found. Paste either the raw trailer bytes as hex, or the F5 Ethernet Trailer section as Wireshark displays it.",
    );
  }

  notes.push(
    "Noise levels are set on the tcpdump command line by suffixing the interface: :n for low, :nn for medium, :nnn for high, with -s0 so frames are not truncated. Higher levels add fields rather than replacing them.",
  );
  if (noise === "medium" || noise === "high") {
    notes.push(
      "Most of the medium-level fields beyond flow, peer and RST cause are meaningful to F5 support rather than to you. That is not a criticism of the format - it is diagnostic instrumentation for the people who wrote the code.",
    );
  }

  return { magic, trailerLength, version, noise, fields, tlsProviderPresent, notes, warnings };
}

/** Uniform entry point, matching the other tools in this repository. */
export function run(input: string): TrailerDecode {
  return decodeTrailer(input);
}
