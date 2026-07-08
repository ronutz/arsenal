// ============================================================================
// src/lib/dev-other/pcap/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors for the pcap dissector. Real capture files cannot be embedded
// as source, so the fixtures are BUILT byte-by-byte here from known headers —
// which is stronger than a captured sample, because every field's expected
// value is derived from the bytes we wrote, not guessed. If the container
// parser, the Ethernet/IP/TCP/UDP dissection, or the summary math drift, these
// break.
// ============================================================================

import { analyzePcap, PcapError } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "dev-other-pcap/2026-07-08";

// ---- fixture builders ------------------------------------------------------

/** Build a classic little-endian pcap with the given Ethernet frames. */
function buildClassicPcap(frames: Uint8Array[], nano = false): ArrayBuffer {
  const recordsLen = frames.reduce((n, f) => n + 16 + f.length, 0);
  const buf = new ArrayBuffer(24 + recordsLen);
  const dv = new DataView(buf);
  const bytes = new Uint8Array(buf);
  // Global header, little-endian magic.
  dv.setUint32(0, nano ? 0x4d3cb2a1 : 0xd4c3b2a1, false); // stored as-is
  // Actually write LE magic bytes: 0xa1b2c3d4 in LE file => bytes d4 c3 b2 a1
  bytes[0] = nano ? 0x4d : 0xd4;
  bytes[1] = 0x3c === 0x3c && nano ? 0x3c : 0xc3;
  bytes[1] = nano ? 0x3c : 0xc3;
  bytes[2] = 0xb2;
  bytes[3] = 0xa1;
  dv.setUint16(4, 2, true); // version major
  dv.setUint16(6, 4, true); // version minor
  dv.setUint32(20, 1, true); // LINKTYPE_ETHERNET
  let off = 24;
  frames.forEach((f, i) => {
    dv.setUint32(off, 1_700_000_000 + i, true); // ts sec
    dv.setUint32(off + 4, i * (nano ? 1_000_000 : 1000), true); // ts frac
    dv.setUint32(off + 8, f.length, true); // capLen
    dv.setUint32(off + 12, f.length, true); // origLen
    bytes.set(f, off + 16);
    off += 16 + f.length;
  });
  return buf;
}

/** Ethernet + IPv4 + TCP frame with the given ports and flag byte. */
function ethIpv4Tcp(src: string, dst: string, sport: number, dport: number, flags: number): Uint8Array {
  const ihl = 20;
  const tcp = 20;
  const frame = new Uint8Array(14 + ihl + tcp);
  // Ethernet: dst mac, src mac, ethertype 0x0800
  frame[12] = 0x08;
  frame[13] = 0x00;
  let o = 14;
  frame[o] = 0x45; // v4, ihl=5
  frame[o + 9] = 6; // proto TCP
  const s = src.split(".").map(Number);
  const d = dst.split(".").map(Number);
  frame.set(s, o + 12);
  frame.set(d, o + 16);
  o += ihl;
  frame[o] = (sport >> 8) & 0xff;
  frame[o + 1] = sport & 0xff;
  frame[o + 2] = (dport >> 8) & 0xff;
  frame[o + 3] = dport & 0xff;
  frame[o + 13] = flags;
  return frame;
}

/** Ethernet + IPv4 + UDP frame. */
function ethIpv4Udp(src: string, dst: string, sport: number, dport: number): Uint8Array {
  const frame = new Uint8Array(14 + 20 + 8);
  frame[12] = 0x08;
  frame[13] = 0x00;
  let o = 14;
  frame[o] = 0x45;
  frame[o + 9] = 17; // UDP
  frame.set(src.split(".").map(Number), o + 12);
  frame.set(dst.split(".").map(Number), o + 16);
  o += 20;
  frame[o] = (sport >> 8) & 0xff;
  frame[o + 1] = sport & 0xff;
  frame[o + 2] = (dport >> 8) & 0xff;
  frame[o + 3] = dport & 0xff;
  return frame;
}

export interface VectorReport {
  setId: string;
  total: number;
  passed: number;
  failures: string[];
}

export function verifyVectors(): VectorReport {
  const failures: string[] = [];

  // --- 1. classic pcap, mixed TCP/UDP dissection ---
  {
    const frames = [
      ethIpv4Tcp("10.0.0.1", "10.0.0.2", 51000, 443, 0x02), // SYN
      ethIpv4Tcp("10.0.0.2", "10.0.0.1", 443, 51000, 0x12), // SYN ACK
      ethIpv4Udp("10.0.0.1", "8.8.8.8", 53000, 53), // DNS-ish UDP
    ];
    try {
      const { summary, records } = analyzePcap(buildClassicPcap(frames));
      if (summary.format !== "pcap") failures.push(`fmt: got ${summary.format}`);
      if (summary.byteOrder !== "LE") failures.push(`order: got ${summary.byteOrder}`);
      if (summary.packetCount !== 3) failures.push(`count: got ${summary.packetCount}`);
      if (records[0].l4 !== "tcp" || records[0].tcpFlags !== "SYN") failures.push(`p0: ${records[0].l4}/${records[0].tcpFlags}`);
      if (records[1].tcpFlags !== "SYN ACK") failures.push(`p1 flags: ${records[1].tcpFlags}`);
      if (records[2].l4 !== "udp" || records[2].dstPort !== 53) failures.push(`p2: ${records[2].l4}/${records[2].dstPort}`);
      if (records[0].src !== "10.0.0.1" || records[0].dst !== "10.0.0.2") failures.push(`p0 addrs: ${records[0].src}->${records[0].dst}`);
      if ((summary.l4Counts.tcp ?? 0) !== 2 || (summary.l4Counts.udp ?? 0) !== 1) failures.push(`l4counts: ${JSON.stringify(summary.l4Counts)}`);
    } catch (e) {
      failures.push(`classic: threw ${(e as Error).message}`);
    }
  }

  // --- 2. conversation aggregation is direction-agnostic ---
  {
    const frames = [
      ethIpv4Tcp("10.0.0.1", "10.0.0.2", 51000, 443, 0x02),
      ethIpv4Tcp("10.0.0.2", "10.0.0.1", 443, 51000, 0x12),
      ethIpv4Tcp("10.0.0.1", "10.0.0.2", 51000, 443, 0x10),
    ];
    try {
      const { summary } = analyzePcap(buildClassicPcap(frames));
      // All three belong to ONE conversation (10.0.0.1<->10.0.0.2 TCP).
      if (summary.conversations.length !== 1) failures.push(`conv-count: ${summary.conversations.length}`);
      if (summary.conversations[0]?.packets !== 3) failures.push(`conv-packets: ${summary.conversations[0]?.packets}`);
      // Top talkers: both hosts present.
      if (summary.topTalkers.length !== 2) failures.push(`talkers: ${summary.topTalkers.length}`);
    } catch (e) {
      failures.push(`conv: threw ${(e as Error).message}`);
    }
  }

  // --- 3. SYN-without-SYNACK flag fires ---
  {
    const frames = [
      ethIpv4Tcp("10.0.0.1", "10.0.0.9", 40000, 80, 0x02),
      ethIpv4Tcp("10.0.0.1", "10.0.0.9", 40001, 80, 0x02),
    ];
    try {
      const { summary } = analyzePcap(buildClassicPcap(frames));
      if (!summary.flags.some((f) => f.id === "syn-no-synack")) {
        failures.push(`flag: syn-no-synack did not fire (${JSON.stringify(summary.flags.map((f) => f.id))})`);
      }
    } catch (e) {
      failures.push(`flag: threw ${(e as Error).message}`);
    }
  }

  // --- 4. nanosecond magic parses and timestamps scale ---
  {
    const frames = [ethIpv4Udp("10.0.0.1", "10.0.0.2", 5000, 5001)];
    try {
      const { summary } = analyzePcap(buildClassicPcap(frames, true));
      if (summary.format !== "pcap") failures.push(`ns-fmt: ${summary.format}`);
      if (summary.packetCount !== 1) failures.push(`ns-count: ${summary.packetCount}`);
    } catch (e) {
      failures.push(`ns: threw ${(e as Error).message}`);
    }
  }

  // --- 5. rejects ---
  {
    try {
      analyzePcap(new ArrayBuffer(8));
      failures.push("reject-empty: expected throw");
    } catch (e) {
      if (!(e instanceof PcapError) || e.code !== "empty") failures.push(`reject-empty: ${(e as Error).message}`);
    }
    try {
      const bad = new ArrayBuffer(40);
      new DataView(bad).setUint32(0, 0xdeadbeef, false);
      analyzePcap(bad);
      failures.push("reject-format: expected throw");
    } catch (e) {
      if (!(e instanceof PcapError) || e.code !== "format") failures.push(`reject-format: ${(e as Error).message}`);
    }
  }

  const total = 12 + 3 + 1 + 2 + 2; // per-assertion tally across the blocks
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: total - failures.length, failures };
}
