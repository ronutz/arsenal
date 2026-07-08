// ============================================================================
// src/lib/dev-other/pcap/compute.ts
// ----------------------------------------------------------------------------
// PCAP ANALYZER — the green room's anchor tenant. A local, in-browser capture
// dissector: drop a .pcap or .pcapng and it summarizes L2-L4, lists
// conversations, and flags common signatures — WITHOUT UPLOADING A BYTE.
//
// WHY GREEN (not catalogue): the catalogue's input contract is paste/form
// text. This tool's input is a BINARY FILE — the notice's "experimental input
// contract." That is a shape the catalogue cannot hold yet; the day it grows
// a file-input manifest field, this tool GRADUATES to the main floor (the same
// way advisory tools graduated once the manifest learned snapshot verification).
//
// SCOPE (honest, phased): this v1 parses the two container formats (classic
// pcap, both byte orders + nanosecond variant; and pcapng, the common block
// types) and dissects Ethernet -> IPv4/IPv6 -> TCP/UDP/ICMP, enough for the
// summary, the conversation table, and a first tier of anomaly flags. Deeper
// application dissection (DNS/TLS/HTTP payload parsing) is deliberately left
// for a later pass and the UI says so — an honest tool states its depth.
//
// PURITY: parsing is a pure function of the input bytes, so despite the
// tool's file input the DISSECTION is fully deterministic and vector-tested
// against hand-built fixtures. No clock, no network, no randomness in here.
// ============================================================================

// ----------------------------------------------------------------------------
// Errors & link types
// ----------------------------------------------------------------------------

export type PcapErrorCode = "empty" | "format" | "unsupported" | "truncated";

export class PcapError extends Error {
  code: PcapErrorCode;
  constructor(code: PcapErrorCode, message?: string) {
    super(message ?? code);
    this.name = "PcapError";
    this.code = code;
  }
}

/** LINKTYPE values we dissect (others are captured but their L3 is skipped). */
const LINKTYPE_ETHERNET = 1;
const LINKTYPE_RAW = 101; // raw IP
const LINKTYPE_LINUX_SLL = 113;
const LINKTYPE_NULL = 0; // BSD loopback

// ----------------------------------------------------------------------------
// Public shapes
// ----------------------------------------------------------------------------

export interface PacketRecord {
  index: number;
  /** Seconds since epoch (float); the container's timestamp, read not invented. */
  ts: number;
  capLen: number;
  origLen: number;
  l3: "ipv4" | "ipv6" | "arp" | "other" | null;
  l4: "tcp" | "udp" | "icmp" | "icmpv6" | "other" | null;
  src: string | null;
  dst: string | null;
  srcPort: number | null;
  dstPort: number | null;
  /** TCP flags as a compact string when applicable, e.g. "SYN", "SYN ACK". */
  tcpFlags: string | null;
  proto: number | null;
  length: number;
}

export interface Conversation {
  a: string;
  b: string;
  protocol: string;
  packets: number;
  bytes: number;
}

export interface AnomalyFlag {
  id: string;
  severity: "info" | "warn";
  /** i18n key suffix under devOther.pcap.flags.* + interpolation values. */
  key: string;
  values?: Record<string, string | number>;
}

export interface PcapSummary {
  format: "pcap" | "pcapng";
  byteOrder: "LE" | "BE";
  linkType: number;
  packetCount: number;
  /** Capture span in seconds (last ts - first ts), or 0 for <2 packets. */
  durationSec: number;
  firstTs: number;
  lastTs: number;
  totalBytes: number;
  l3Counts: Record<string, number>;
  l4Counts: Record<string, number>;
  conversations: Conversation[];
  topTalkers: { host: string; bytes: number; packets: number }[];
  flags: AnomalyFlag[];
  /** True when parsing stopped early on a truncated final record. */
  truncated: boolean;
}

// ----------------------------------------------------------------------------
// Byte readers
// ----------------------------------------------------------------------------

class Reader {
  private v: DataView;
  private le: boolean;
  off = 0;
  constructor(
    private buf: ArrayBuffer,
    littleEndian: boolean,
  ) {
    this.v = new DataView(buf);
    this.le = littleEndian;
  }
  get length() {
    return this.buf.byteLength;
  }
  remaining() {
    return this.buf.byteLength - this.off;
  }
  u16(o: number) {
    return this.v.getUint16(o, this.le);
  }
  u32(o: number) {
    return this.v.getUint32(o, this.le);
  }
  bytes(o: number, n: number) {
    return new Uint8Array(this.buf, o, n);
  }
}

// Big-endian helpers for network headers (always network byte order).
function beU16(b: Uint8Array, o: number) {
  return (b[o] << 8) | b[o + 1];
}

// ----------------------------------------------------------------------------
// Address formatting
// ----------------------------------------------------------------------------

function ipv4(b: Uint8Array, o: number): string {
  return `${b[o]}.${b[o + 1]}.${b[o + 2]}.${b[o + 3]}`;
}
function ipv6(b: Uint8Array, o: number): string {
  const parts: string[] = [];
  for (let i = 0; i < 16; i += 2) parts.push(((b[o + i] << 8) | b[o + i + 1]).toString(16));
  // RFC 5952-ish compression of the longest zero run.
  let best = { start: -1, len: 0 };
  let cur = { start: -1, len: 0 };
  parts.forEach((p, i) => {
    if (p === "0") {
      if (cur.start === -1) cur = { start: i, len: 1 };
      else cur.len++;
      if (cur.len > best.len) best = { ...cur };
    } else {
      cur = { start: -1, len: 0 };
    }
  });
  if (best.len > 1) {
    const head = parts.slice(0, best.start).join(":");
    const tail = parts.slice(best.start + best.len).join(":");
    return `${head}::${tail}`;
  }
  return parts.join(":");
}

// ----------------------------------------------------------------------------
// L3/L4 dissection of one packet's bytes (given the link type)
// ----------------------------------------------------------------------------

function dissect(frame: Uint8Array, linkType: number, rec: PacketRecord): void {
  let o = 0;
  let etherType: number | null = null;

  if (linkType === LINKTYPE_ETHERNET) {
    if (frame.length < 14) return;
    etherType = beU16(frame, 12);
    o = 14;
    // 802.1Q VLAN tag(s)
    while (etherType === 0x8100 || etherType === 0x88a8) {
      if (frame.length < o + 4) return;
      etherType = beU16(frame, o + 2);
      o += 4;
    }
  } else if (linkType === LINKTYPE_RAW) {
    etherType = (frame[0] >> 4) === 6 ? 0x86dd : 0x0800;
  } else if (linkType === LINKTYPE_NULL) {
    // 4-byte AF_ family header, host order; 2 = IPv4, 24/28/30 = IPv6.
    if (frame.length < 4) return;
    const af = frame[0] | (frame[1] << 8) | (frame[2] << 16) | (frame[3] << 24);
    etherType = af === 2 ? 0x0800 : 0x86dd;
    o = 4;
  } else if (linkType === LINKTYPE_LINUX_SLL) {
    if (frame.length < 16) return;
    etherType = beU16(frame, 14);
    o = 16;
  } else {
    return; // unknown link layer: counted, not dissected
  }

  if (etherType === 0x0806) {
    rec.l3 = "arp";
    return;
  }
  if (etherType === 0x0800) {
    // IPv4
    if (frame.length < o + 20) return;
    const ihl = (frame[o] & 0x0f) * 4;
    rec.l3 = "ipv4";
    rec.proto = frame[o + 9];
    rec.src = ipv4(frame, o + 12);
    rec.dst = ipv4(frame, o + 16);
    dissectL4(frame, o + ihl, rec);
    return;
  }
  if (etherType === 0x86dd) {
    // IPv6 (no extension-header walking in v1; next-header taken at face value)
    if (frame.length < o + 40) return;
    rec.l3 = "ipv6";
    rec.proto = frame[o + 6];
    rec.src = ipv6(frame, o + 8);
    rec.dst = ipv6(frame, o + 24);
    dissectL4(frame, o + 40, rec);
    return;
  }
  rec.l3 = "other";
}

function dissectL4(frame: Uint8Array, o: number, rec: PacketRecord): void {
  const proto = rec.proto;
  if (proto === 6) {
    // TCP
    if (frame.length < o + 20) return;
    rec.l4 = "tcp";
    rec.srcPort = beU16(frame, o);
    rec.dstPort = beU16(frame, o + 2);
    const flags = frame[o + 13];
    const names: string[] = [];
    if (flags & 0x02) names.push("SYN");
    if (flags & 0x10) names.push("ACK");
    if (flags & 0x01) names.push("FIN");
    if (flags & 0x04) names.push("RST");
    if (flags & 0x08) names.push("PSH");
    if (flags & 0x20) names.push("URG");
    rec.tcpFlags = names.join(" ") || "-";
  } else if (proto === 17) {
    // UDP
    if (frame.length < o + 8) return;
    rec.l4 = "udp";
    rec.srcPort = beU16(frame, o);
    rec.dstPort = beU16(frame, o + 2);
  } else if (proto === 1) {
    rec.l4 = "icmp";
  } else if (proto === 58) {
    rec.l4 = "icmpv6";
  } else if (proto !== null) {
    rec.l4 = "other";
  }
}

// ----------------------------------------------------------------------------
// Container parsers
// ----------------------------------------------------------------------------

const PCAP_MAGIC_LE = 0xd4c3b2a1; // file is little-endian
const PCAP_MAGIC_BE = 0xa1b2c3d4; // file is big-endian
const PCAP_MAGIC_LE_NS = 0x4d3cb2a1; // nanosecond, little-endian
const PCAP_MAGIC_BE_NS = 0xa1b23c4d; // nanosecond, big-endian
const PCAPNG_BOM = 0x1a2b3c4d;

function parseClassicPcap(buf: ArrayBuffer): { records: PacketRecord[]; summary: Partial<PcapSummary> } {
  const dvBE = new DataView(buf);
  const magic = dvBE.getUint32(0, false);
  let le: boolean;
  let nano = false;
  if (magic === PCAP_MAGIC_BE) le = false;
  else if (magic === PCAP_MAGIC_LE) le = true;
  else if (magic === PCAP_MAGIC_BE_NS) {
    le = false;
    nano = true;
  } else if (magic === PCAP_MAGIC_LE_NS) {
    le = true;
    nano = true;
  } else throw new PcapError("format", "not a classic pcap magic");

  const r = new Reader(buf, le);
  const linkType = r.u32(20);
  let off = 24;
  const records: PacketRecord[] = [];
  let truncated = false;
  let index = 0;

  while (off + 16 <= r.length) {
    const tsSec = r.u32(off);
    const tsFrac = r.u32(off + 4);
    const capLen = r.u32(off + 8);
    const origLen = r.u32(off + 12);
    off += 16;
    if (off + capLen > r.length) {
      truncated = true;
      break;
    }
    const frame = r.bytes(off, capLen);
    const rec: PacketRecord = {
      index: index++,
      ts: tsSec + tsFrac / (nano ? 1e9 : 1e6),
      capLen,
      origLen,
      l3: null,
      l4: null,
      src: null,
      dst: null,
      srcPort: null,
      dstPort: null,
      tcpFlags: null,
      proto: null,
      length: origLen,
    };
    dissect(frame, linkType, rec);
    records.push(rec);
    off += capLen;
  }
  return {
    records,
    summary: { format: "pcap", byteOrder: le ? "LE" : "BE", linkType, truncated },
  };
}

function parsePcapng(buf: ArrayBuffer): { records: PacketRecord[]; summary: Partial<PcapSummary> } {
  // Determine byte order from the first SHB's BOM.
  const probe = new DataView(buf);
  if (probe.getUint32(0, false) !== 0x0a0d0d0a) throw new PcapError("format", "not a pcapng SHB");
  const bomBE = probe.getUint32(8, false);
  const le = bomBE !== PCAPNG_BOM; // if BE read didn't match the BOM, it's LE
  const r = new Reader(buf, le);

  let off = 0;
  const records: PacketRecord[] = [];
  const linkTypes: number[] = []; // per interface (IDB order)
  let tsResol = 1e6; // default microsecond
  let truncated = false;
  let index = 0;

  while (off + 12 <= r.length) {
    const blockType = r.u32(off);
    const blockLen = r.u32(off + 4);
    if (blockLen < 12 || off + blockLen > r.length) {
      truncated = true;
      break;
    }
    if (blockType === 0x00000001) {
      // Interface Description Block: linktype at +8 (u16)
      linkTypes.push(r.u16(off + 8));
    } else if (blockType === 0x00000006) {
      // Enhanced Packet Block
      const ifId = r.u32(off + 8);
      const tsHi = r.u32(off + 12);
      const tsLo = r.u32(off + 16);
      const capLen = r.u32(off + 20);
      const origLen = r.u32(off + 24);
      const tsWhole = tsHi * 0x100000000 + tsLo;
      const frame = r.bytes(off + 28, Math.min(capLen, r.length - (off + 28)));
      const rec: PacketRecord = {
        index: index++,
        ts: tsWhole / tsResol,
        capLen,
        origLen,
        l3: null,
        l4: null,
        src: null,
        dst: null,
        srcPort: null,
        dstPort: null,
        tcpFlags: null,
        proto: null,
        length: origLen,
      };
      dissect(frame, linkTypes[ifId] ?? linkTypes[0] ?? LINKTYPE_ETHERNET, rec);
      records.push(rec);
    } else if (blockType === 0x00000003) {
      // Simple Packet Block (no per-packet ts): use interface 0
      const origLen = r.u32(off + 8);
      const capLen = Math.min(origLen, blockLen - 16);
      const frame = r.bytes(off + 12, Math.min(capLen, r.length - (off + 12)));
      const rec: PacketRecord = {
        index: index++,
        ts: 0,
        capLen,
        origLen,
        l3: null,
        l4: null,
        src: null,
        dst: null,
        srcPort: null,
        dstPort: null,
        tcpFlags: null,
        proto: null,
        length: origLen,
      };
      dissect(frame, linkTypes[0] ?? LINKTYPE_ETHERNET, rec);
      records.push(rec);
    }
    off += blockLen;
  }
  void tsResol;
  return {
    records,
    summary: { format: "pcapng", byteOrder: le ? "LE" : "BE", linkType: linkTypes[0] ?? -1, truncated },
  };
}

// ----------------------------------------------------------------------------
// Summary assembly (conversations, talkers, flags)
// ----------------------------------------------------------------------------

function buildSummary(records: PacketRecord[], base: Partial<PcapSummary>): PcapSummary {
  const l3Counts: Record<string, number> = {};
  const l4Counts: Record<string, number> = {};
  const convMap = new Map<string, Conversation>();
  const talkerBytes = new Map<string, { bytes: number; packets: number }>();

  let totalBytes = 0;
  let firstTs = Infinity;
  let lastTs = -Infinity;
  let synCount = 0;
  let synAckCount = 0;
  let rstCount = 0;

  for (const p of records) {
    totalBytes += p.length;
    if (p.ts > 0) {
      if (p.ts < firstTs) firstTs = p.ts;
      if (p.ts > lastTs) lastTs = p.ts;
    }
    if (p.l3) l3Counts[p.l3] = (l3Counts[p.l3] ?? 0) + 1;
    if (p.l4) l4Counts[p.l4] = (l4Counts[p.l4] ?? 0) + 1;

    if (p.tcpFlags) {
      const f = p.tcpFlags;
      if (f === "SYN") synCount++;
      else if (f.includes("SYN") && f.includes("ACK")) synAckCount++;
      if (f.includes("RST")) rstCount++;
    }

    if (p.src && p.dst) {
      const [a, b] = p.src < p.dst ? [p.src, p.dst] : [p.dst, p.src];
      const protocol = p.l4 ? p.l4.toUpperCase() : (p.l3 ?? "other").toUpperCase();
      const key = `${a}|${b}|${protocol}`;
      const c = convMap.get(key) ?? { a, b, protocol, packets: 0, bytes: 0 };
      c.packets++;
      c.bytes += p.length;
      convMap.set(key, c);

      for (const host of [p.src, p.dst]) {
        const tk = talkerBytes.get(host) ?? { bytes: 0, packets: 0 };
        tk.bytes += p.length;
        tk.packets++;
        talkerBytes.set(host, tk);
      }
    }
  }

  const conversations = [...convMap.values()].sort((x, y) => y.bytes - x.bytes).slice(0, 50);
  const topTalkers = [...talkerBytes.entries()]
    .map(([host, v]) => ({ host, bytes: v.bytes, packets: v.packets }))
    .sort((x, y) => y.bytes - x.bytes)
    .slice(0, 10);

  // First-tier anomaly flags — signatures, phrased as observations not verdicts.
  const flags: AnomalyFlag[] = [];
  if (synCount > 0 && synAckCount === 0) {
    flags.push({ id: "syn-no-synack", severity: "warn", key: "synNoSynAck", values: { syn: synCount } });
  }
  if (synCount > synAckCount * 3 && synCount > 10) {
    flags.push({ id: "syn-imbalance", severity: "warn", key: "synImbalance", values: { syn: synCount, synack: synAckCount } });
  }
  if (rstCount > 0 && records.length > 0 && rstCount / records.length > 0.1) {
    flags.push({ id: "high-rst", severity: "warn", key: "highRst", values: { rst: rstCount } });
  }
  if (base.truncated) {
    flags.push({ id: "truncated", severity: "info", key: "truncated" });
  }
  if (conversations.length === 1 && records.length > 20) {
    flags.push({ id: "single-conversation", severity: "info", key: "singleConversation" });
  }

  const durationSec = firstTs !== Infinity && lastTs > firstTs ? lastTs - firstTs : 0;

  return {
    format: base.format!,
    byteOrder: base.byteOrder!,
    linkType: base.linkType!,
    packetCount: records.length,
    durationSec,
    firstTs: firstTs === Infinity ? 0 : firstTs,
    lastTs: lastTs === -Infinity ? 0 : lastTs,
    totalBytes,
    l3Counts,
    l4Counts,
    conversations,
    topTalkers,
    flags,
    truncated: !!base.truncated,
  };
}

// ----------------------------------------------------------------------------
// Entry point
// ----------------------------------------------------------------------------

/** Parse a capture file's bytes into a summary. Pure; deterministic. */
export function analyzePcap(buf: ArrayBuffer): { summary: PcapSummary; records: PacketRecord[] } {
  if (buf.byteLength < 24) throw new PcapError("empty", "file too small to be a capture");
  const dv = new DataView(buf);
  const first = dv.getUint32(0, false);

  let parsed: { records: PacketRecord[]; summary: Partial<PcapSummary> };
  if (first === 0x0a0d0d0a) {
    parsed = parsePcapng(buf);
  } else if (
    first === PCAP_MAGIC_BE ||
    first === PCAP_MAGIC_LE ||
    first === PCAP_MAGIC_BE_NS ||
    first === PCAP_MAGIC_LE_NS
  ) {
    parsed = parseClassicPcap(buf);
  } else {
    throw new PcapError("format", "unrecognized magic (not pcap or pcapng)");
  }

  const summary = buildSummary(parsed.records, parsed.summary);
  return { summary, records: parsed.records };
}
