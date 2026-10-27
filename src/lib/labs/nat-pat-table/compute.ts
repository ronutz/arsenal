// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/nat-pat-table/compute.ts
// ----------------------------------------------------------------------------
// THE NAT/PAT TABLE LAB'S MODEL (2026-10-26), the interactive companion of the
// article "NAT Explained" (its section "Mapping behaviour, filtering behaviour
// and the difference"). One router doing NAPT for three inside hosts, with one
// or two public addresses and an outside port range the reader sets. Five UDP
// flows leave in a fixed order (the article's worked table and two more); the
// model builds the translation table, then takes one inbound packet aimed at
// the first flow's outside address and port and says whether the filtering
// behaviour lets it in.
//
// The rules, with their sources (read on 2026-10-26):
//   1. NAPT maps (local address, local port) tuples to (registered address,
//      assigned port) tuples (RFC 3022, section 2.2).
//   2. Mapping reuse (RFC 4787, section 4.1): endpoint-independent mapping
//      reuses an inside X:x's mapping for any destination; address-dependent
//      only for the same destination address; address-and-port-dependent only
//      for the same address and port. REQ-1: a NAT MUST be endpoint-independent.
//   3. IP address pooling (RFC 4787, section 4.1): "Paired" keeps every
//      mapping of one inside address on the same public address and is
//      RECOMMENDED (REQ-2). A NAT may keep the inside port on a collision by
//      choosing another public address, and picks a different port only when
//      the port is taken on all of them (section 4.2.1). With pairing, when the
//      host's address has no port left, new sessions from that host SHOULD be
//      dropped (RFC 7857, section 4).
//   4. No port overloading: two mappings never share an outside address and
//      port (REQ-3, RFC 4787, section 12). The lab also does not use the port
//      overlapping RFC 7857 section 3 allows, so a full range refuses the flow.
//   5. Filtering (RFC 4787, section 5): endpoint-independent filtering forwards
//      any packet to a mapped X:x; address-dependent only from an address X:x
//      has sent to; address-and-port-dependent only from an address and port
//      X:x has sent to. A packet to an outside port with no mapping is dropped.
// The LAB'S OWN CHOICES, not standards, and labelled as such in the article and
// the lab: (a) when the inside port is taken or outside the range, the next
// free port upward from it, wrapping round to the start of the range (RFC 7857
// section 9 asks a NAPT to obfuscate the replacement port instead, following
// RFC 6056, which notes that deployed NAPTs use many different algorithms);
// (b) a host's first mapping goes to the first public address, in order, on
// which its inside port is free, and if none, to the first with any free port;
// (c) the range is held within 1024 to 65535, where RFC 4787 REQ-3 a)
// recommends a port of 1024 or more stays.
// What the model leaves out (the lab's scope note): timers and refresh, TCP and
// ICMP, hairpinning, port parity and contiguity, port overlapping, random port
// choice, ALGs and static port forwarding.
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** An address and a port. */
export interface Endpoint {
  /** IPv4 address, dotted. */
  addr: string;
  /** Port number. */
  port: number;
}

/** The mapping behaviour of RFC 4787, section 4.1. */
export type Mapping = "eim" | "adm" | "apdm";
/** Every value the mapping control can take. */
export const MAPPINGS: readonly Mapping[] = ["eim", "adm", "apdm"];
/** The filtering behaviour of RFC 4787, section 5. */
export type Filtering = "eif" | "adf" | "apdf";
/** Every value the filtering control can take, in the order the comparison lists them. */
export const FILTERINGS: readonly Filtering[] = ["eif", "adf", "apdf"];
/** The inbound packet the reader sends at the first flow's mapping. */
export type Inbound = "server" | "server-other-port" | "stranger";
/** Every value the inbound control can take. */
export const INBOUNDS: readonly Inbound[] = ["server", "server-other-port", "stranger"];

/** The NAT's public addresses (documentation range of RFC 5737, as in the article). */
export const PUBLIC_ADDRESSES: readonly string[] = Object.freeze(["203.0.113.1", "203.0.113.2"]);
/** The lowest port the range may start at (RFC 4787 REQ-3 a): ports of 1024 or more stay in 1024 to 65535). */
export const MIN_PORT = 1024;
/** The highest port. */
export const MAX_PORT = 65535;

/** One outbound flow of the fixed script. */
export interface Flow {
  /** The inside endpoint. */
  inside: Endpoint;
  /** The destination. */
  dest: Endpoint;
}

/** The five flows, in the order they start: the article's three rows, the first socket to a second destination, a third host. */
export const FLOWS: readonly Flow[] = Object.freeze([
  // The article's first row.
  { inside: { addr: "10.0.0.10", port: 51234 }, dest: { addr: "198.51.100.80", port: 443 } },
  // A second host that picked the same port.
  { inside: { addr: "10.0.0.2", port: 51234 }, dest: { addr: "198.51.100.80", port: 443 } },
  // The first host's next socket.
  { inside: { addr: "10.0.0.10", port: 51235 }, dest: { addr: "198.51.100.80", port: 443 } },
  // The first socket again, to a STUN server on port 3478: the mapping-behaviour case.
  { inside: { addr: "10.0.0.10", port: 51234 }, dest: { addr: "192.0.2.1", port: 3478 } },
  // A third host.
  { inside: { addr: "10.0.0.3", port: 51236 }, dest: { addr: "198.51.100.80", port: 443 } },
]);

/** The source of each inbound packet. */
export const INBOUND_SOURCES: Readonly<Record<Inbound, Endpoint>> = Object.freeze({
  // The server the first flow talks to, from the port it was sent to.
  server: { addr: "198.51.100.80", port: 443 },
  // The same server, from another port.
  "server-other-port": { addr: "198.51.100.80", port: 8443 },
  // A host the inside endpoint never sent anything to.
  stranger: { addr: "192.0.2.99", port: 50000 },
});

/** The reader's settings. */
export interface NatInput {
  /** How many public addresses the NAT has: 1 or 2. */
  addresses: number;
  /** The first outside port of the range. */
  first: number;
  /** The last outside port of the range. */
  last: number;
  /** The mapping behaviour. */
  mapping: Mapping;
  /** The filtering behaviour. */
  filtering: Filtering;
  /** The inbound packet. */
  inbound: Inbound;
}

/** How a flow was translated. */
export type FlowKind = "preserved" | "preserved-other-address" | "changed" | "reused" | "dropped-exhausted" | "dropped-paired";

/** One row of the translation table. */
export interface FlowResult {
  /** 1-based flow number. */
  n: number;
  /** The inside endpoint. */
  inside: Endpoint;
  /** The destination. */
  dest: Endpoint;
  /** The outside endpoint, or null when the flow was dropped. */
  outside: Endpoint | null;
  /** How it was translated. */
  kind: FlowKind;
  /** For a reused mapping, the flow that created it. */
  reusedFrom: number | null;
}

/** What one filtering behaviour does with the inbound packet. */
export interface FilterVerdict {
  /** The behaviour. */
  filtering: Filtering;
  /** True when the packet is forwarded to the inside endpoint. */
  admitted: boolean;
}

/** The model's answer. */
export interface NatResult {
  /** The translation table, one row per flow. */
  flows: FlowResult[];
  /** The number of mappings created. */
  mappings: number;
  /** Ports per public address in the range. */
  portsPerAddress: number;
  /** Ports in use on each public address. */
  usedPerAddress: number[];
  /** The inbound packet's source. */
  inboundFrom: Endpoint;
  /** The outside endpoint it is sent to: the first flow's mapping. */
  inboundTo: Endpoint;
  /** The inside endpoint that mapping leads to. */
  inboundInside: Endpoint;
  /** The destinations that inside endpoint has sent packets to. */
  sentTo: Endpoint[];
  /** The verdict under every filtering behaviour, in FILTERINGS order. */
  verdicts: FilterVerdict[];
  /** The verdict under the reader's filtering behaviour. */
  admitted: boolean;
}

/** The stable codes an invalid input is refused with. */
export type NatErrorCode = "bad-port" | "bad-range" | "bad-choice";

/** The error a refused input throws, with its stable code. */
export class NatError extends Error {
  /** The stable code, for vectors and for the interface's message. */
  readonly code: NatErrorCode;
  /** Build the error from its code and a message for developers. */
  constructor(code: NatErrorCode, message: string) {
    // The message for developers.
    super(message);
    // The code for everything else.
    this.code = code;
  }
}

/** True when two endpoints are the same address and port. */
function same(a: Endpoint, b: Endpoint): boolean {
  // Both fields.
  return a.addr === b.addr && a.port === b.port;
}

/** One live mapping: inside endpoint, outside endpoint, the destination it was created for, and the flow that created it. */
interface Live {
  /** The inside endpoint. */
  inside: Endpoint;
  /** The outside endpoint. */
  outside: Endpoint;
  /** The destination of the flow that created it. */
  dest: Endpoint;
  /** The flow that created it. */
  flow: number;
}

/** The lab's port choice: the inside port if free, else the next free port upward, wrapping round the range; null when none is free. */
export function pickPort(used: ReadonlySet<number>, insidePort: number, first: number, last: number): number | null {
  // Where the upward scan starts: the inside port when it is in the range, the range's start otherwise.
  const start = insidePort >= first && insidePort <= last ? insidePort : first;
  // The number of ports in the range.
  const size = last - first + 1;
  // Walk the whole range once, from the start, wrapping at the end.
  for (let i = 0; i < size; i++) {
    // The candidate port.
    const p = first + ((start - first + i) % size);
    // The first free one wins.
    if (!used.has(p)) return p;
  }
  // Every port is in use.
  return null;
}

/** Build the translation table and judge the inbound packet. */
export function compute(input: NatInput): NatResult {
  // One or two public addresses.
  if (input.addresses !== 1 && input.addresses !== 2) throw new NatError("bad-choice", `addresses must be 1 or 2: ${String(input.addresses)}`);
  // The selects.
  if (!MAPPINGS.includes(input.mapping) || !FILTERINGS.includes(input.filtering) || !INBOUNDS.includes(input.inbound)) throw new NatError("bad-choice", "not a lab option");
  // Each end of the range: a whole port from 1024 to 65535.
  for (const p of [input.first, input.last]) {
    // Refused when fractional or out of bounds.
    if (typeof p !== "number" || !Number.isInteger(p) || p < MIN_PORT || p > MAX_PORT) throw new NatError("bad-port", `port must be a whole number from ${MIN_PORT} to ${MAX_PORT}: ${String(p)}`);
  }
  // The range must not run backwards.
  if (input.first > input.last) throw new NatError("bad-range", `first port ${input.first} is above last port ${input.last}`);
  // The public addresses in use.
  const publics = PUBLIC_ADDRESSES.slice(0, input.addresses);
  // Ports in use on each public address.
  const used: Set<number>[] = publics.map(() => new Set<number>());
  // The public address each inside host is paired with (rule 3).
  const paired = new Map<string, number>();
  // The live mappings.
  const live: Live[] = [];
  // The table's rows.
  const rows: FlowResult[] = [];
  // Every destination each inside endpoint has actually sent to, keyed "addr:port".
  const sent = new Map<string, Endpoint[]>();
  /** Record that an inside endpoint sent a packet to a destination. */
  const noteSent = (inside: Endpoint, dest: Endpoint) => {
    // The key for the inside endpoint.
    const k = `${inside.addr}:${inside.port}`;
    // Its list so far.
    const list = sent.get(k) ?? [];
    // Added once.
    if (!list.some((d) => same(d, dest))) list.push(dest);
    // Stored.
    sent.set(k, list);
  };
  // The flows, in order.
  FLOWS.forEach((f, i) => {
    // 1-based flow number.
    const n = i + 1;
    // Rule 2: an existing mapping of the same inside endpoint that this behaviour reuses for this destination.
    const reuse = live.find(
      (m) =>
        same(m.inside, f.inside) &&
        (input.mapping === "eim" || (input.mapping === "adm" && m.dest.addr === f.dest.addr) || (input.mapping === "apdm" && same(m.dest, f.dest))),
    );
    // Reused: no new port, the packet leaves through the existing mapping.
    if (reuse) {
      // The row.
      rows.push({ n, inside: f.inside, dest: f.dest, outside: reuse.outside, kind: "reused", reusedFrom: reuse.flow });
      // The packet went out.
      noteSent(f.inside, f.dest);
      // Next flow.
      return;
    }
    // Rule 3: the host's paired address, if it has one already.
    const pairedIdx = paired.get(f.inside.addr);
    // The address and port chosen, if any.
    let idx: number | null = null;
    // The port chosen, if any.
    let port: number | null = null;
    // The row's kind once chosen.
    let kind: FlowKind;
    if (pairedIdx !== undefined) {
      // Paired: this address or nothing.
      idx = pairedIdx;
      // The lab's port choice on it.
      port = pickPort(used[idx], f.inside.port, input.first, input.last);
      // When the paired address is full: does another address still have a free port?
      const elsewhere = port === null && used.some((u, a) => a !== pairedIdx && pickPort(u, f.inside.port, input.first, input.last) !== null);
      // Kept, changed, dropped because the paired address is full while another is not (RFC 7857, section 4), or dropped with every port in use.
      kind = port === null ? (elsewhere ? "dropped-paired" : "dropped-exhausted") : port === f.inside.port ? "preserved" : "changed";
    } else {
      // The inside port must be in the range to be kept at all.
      const inRange = f.inside.port >= input.first && f.inside.port <= input.last;
      // The first address on which the inside port is free (RFC 4787, section 4.2.1).
      const keepIdx = inRange ? used.findIndex((u) => !u.has(f.inside.port)) : -1;
      if (keepIdx >= 0) {
        // Port preserved, on the first or a later address.
        idx = keepIdx;
        // The inside port itself.
        port = f.inside.port;
        // Preserved, saying whether a second address made it possible.
        kind = keepIdx === 0 ? "preserved" : "preserved-other-address";
      } else {
        // The first address with any free port, and the lab's choice of port on it.
        for (let a = 0; a < used.length && port === null; a++) {
          // The candidate port on this address.
          const p = pickPort(used[a], f.inside.port, input.first, input.last);
          // Taken when there is one.
          if (p !== null) {
            // This address.
            idx = a;
            // This port.
            port = p;
          }
        }
        // Changed, or dropped because no address has a free port.
        kind = port === null ? "dropped-exhausted" : "changed";
      }
      // A new host is paired with the address it got.
      if (idx !== null && port !== null) paired.set(f.inside.addr, idx);
    }
    // Dropped: no mapping, nothing sent.
    if (idx === null || port === null) {
      // The row.
      rows.push({ n, inside: f.inside, dest: f.dest, outside: null, kind, reusedFrom: null });
      // Next flow.
      return;
    }
    // The new mapping's outside endpoint.
    const outside = { addr: publics[idx], port };
    // The port is now in use on that address (rule 4: never shared).
    used[idx].add(port);
    // The mapping is live.
    live.push({ inside: f.inside, outside, dest: f.dest, flow: n });
    // The row.
    rows.push({ n, inside: f.inside, dest: f.dest, outside, kind, reusedFrom: null });
    // The packet went out.
    noteSent(f.inside, f.dest);
  });
  // The inbound packet goes to the first flow's outside endpoint (the first flow always gets a mapping).
  const target = live[0];
  // Its source.
  const from = INBOUND_SOURCES[input.inbound];
  // Everything the inside endpoint behind that mapping has sent to.
  const sentTo = sent.get(`${target.inside.addr}:${target.inside.port}`) ?? [];
  /** Rule 5: does this filtering behaviour forward the packet to the mapped inside endpoint? */
  const admits = (fb: Filtering): boolean =>
    fb === "eif" ? true : fb === "adf" ? sentTo.some((d) => d.addr === from.addr) : sentTo.some((d) => same(d, from));
  // The verdict under each behaviour.
  const verdicts = FILTERINGS.map((fb) => ({ filtering: fb, admitted: admits(fb) }));
  // The answer.
  return {
    flows: rows,
    mappings: live.length,
    portsPerAddress: input.last - input.first + 1,
    usedPerAddress: used.map((u) => u.size),
    inboundFrom: from,
    inboundTo: target.outside,
    inboundInside: target.inside,
    sentTo: sentTo.map((d) => ({ ...d })),
    verdicts,
    admitted: admits(input.filtering),
  };
}

/** The lab's opening state: one public address, ports 1024 to 65535, the behaviours RFC 4787 recommends for a stricter NAT, and the server's reply. */
export const DEFAULT_INPUT: NatInput = { addresses: 1, first: 1024, last: 65535, mapping: "eim", filtering: "adf", inbound: "server" };

/** The Example button's state: endpoint-independent filtering lets in a packet from a host nobody inside ever contacted. */
export const EXAMPLE_INPUT: NatInput = { addresses: 1, first: 1024, last: 65535, mapping: "eim", filtering: "eif", inbound: "stranger" };
