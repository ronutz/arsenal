// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/request-through-layers/compute.ts
// ----------------------------------------------------------------------------
// THE REQUEST-THROUGH-LAYERS LAB'S MODEL (2026-10-26), the interactive
// companion of the article "The OSI Model in Practice". One HTTPS request
// from client A (192.0.2.10) to a web server, over one of three paths: the
// server on A's own LAN (192.0.2.20); the server on another network
// (198.51.100.20) behind a router; or the server behind a reverse proxy that
// A connects to instead (192.0.2.100 on A's side, 198.51.100.100 on the
// server's), which re-encrypts towards the server or not. For each link the
// request crosses, the model gives the Ethernet addresses (layer 2), the IP
// addresses and the TTL on arrival (layer 3), the TCP connection (layer 4)
// and the TLS session (above it).
//
// The rules, with their sources (added to the article on 2026-10-26):
//   - A router "removes the Link Layer header a message was received with,
//     modifies the IP header, and replaces the Link Layer header for
//     retransmission" (RFC 1812, section 1): new MAC addresses on each link,
//     the same IP addresses end to end; and "When a router forwards a packet,
//     it MUST reduce the TTL by at least one" (RFC 1812, 5.3.1). The lab
//     lowers it by exactly one.
//   - Senders start at 64, IANA's "current recommended default time to live"
//     (IANA, IP Parameters).
//   - A reverse proxy "acts as an origin server for the outbound connection"
//     and forwards requests inbound (RFC 9110, 3.7), so the request crosses
//     two separate connections, and it reaches the server from "the proxy's
//     IP address" (RFC 7239, 1). Towards the server the proxy may speak any
//     protocol it likes (RFC 9110, 3.7): HTTPS again, or plain HTTP. The
//     proxy sends its own packets, starting again at 64.
// What the model leaves out (the lab's scope note): DNS and ARP before the
// request, NAT, VLANs, IPv6, HTTP/3 over QUIC, TLS passthrough and
// transparent proxies, and headers such as Forwarded that carry the client's
// address on.
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** The path the request takes. */
export type Path = "lan" | "routed" | "proxy";
/** Every value the path control can take. */
export const PATHS: readonly Path[] = ["lan", "routed", "proxy"];

/** The client's address. */
export const CLIENT_IP = "192.0.2.10";
/** The server's address on the client's LAN. */
export const LAN_SERVER_IP = "192.0.2.20";
/** The server's address on the other network. */
export const REMOTE_SERVER_IP = "198.51.100.20";
/** The proxy's address on the client's side. */
export const PROXY_FRONT_IP = "192.0.2.100";
/** The proxy's address on the server's side. */
export const PROXY_BACK_IP = "198.51.100.100";
/** The TTL a sender starts at (IANA's recommended default). */
export const INITIAL_TTL = 64;

/** The reader's settings. */
export interface LayersInput {
  /** The path. */
  path: Path;
  /** With a proxy: true when it uses TLS towards the server too. */
  backendTls: boolean;
}

/** A device's interface, named by the device and the side it faces. */
export type Nic = "client" | "server" | "router-a" | "router-b" | "proxy-a" | "proxy-b";
/** Which TLS session protects a link, if any. */
export type TlsSession = "client-server" | "client-proxy" | "proxy-server" | "none";

/** One link the request crosses. */
export interface Hop {
  /** Ethernet source (layer 2). */
  ethSource: Nic;
  /** Ethernet destination (layer 2). */
  ethDestination: Nic;
  /** IP source (layer 3). */
  ipSource: string;
  /** IP destination (layer 3). */
  ipDestination: string;
  /** TTL as the packet arrives on this link's far end. */
  ttl: number;
  /** The TCP connection, 1 or 2 (layer 4). */
  tcp: 1 | 2;
  /** The TLS session. */
  tls: TlsSession;
}

/** The model's answer. */
export interface LayersResult {
  /** The links, in order. */
  hops: Hop[];
  /** Separate TCP connections. */
  tcpConnections: number;
  /** Separate TLS sessions. */
  tlsSessions: number;
  /** True when the server sees the client's own IP address. */
  serverSeesClient: boolean;
  /** True when some device lowered the TTL. */
  ttlLowered: boolean;
}

/** The stable codes an invalid input is refused with. */
export type LayersErrorCode = "bad-choice";

/** An invalid input, refused with a stable code the interface can word. */
export class LayersError extends Error {
  /** The stable code. */
  readonly code: LayersErrorCode;
  /** Build the refusal with its code and an English message for logs. */
  constructor(code: LayersErrorCode, message: string) {
    // The message, for developers.
    super(message);
    // The code, for the interface.
    this.code = code;
  }
}

/** Follow the request link by link. */
export function compute(input: LayersInput): LayersResult {
  // Both fields come from selects: anything else is a programming error.
  if (!PATHS.includes(input.path) || typeof input.backendTls !== "boolean") throw new LayersError("bad-choice", "unknown path or backend setting");

  // Same LAN: one link, one connection, one session.
  if (input.path === "lan") {
    // The single hop.
    const hops: Hop[] = [{ ethSource: "client", ethDestination: "server", ipSource: CLIENT_IP, ipDestination: LAN_SERVER_IP, ttl: INITIAL_TTL, tcp: 1, tls: "client-server" }];
    // Nothing in between.
    return { hops, tcpConnections: 1, tlsSessions: 1, serverSeesClient: true, ttlLowered: false };
  }
  // Through a router: two links, new MACs on the second, the same IPs, the TTL one lower.
  if (input.path === "routed") {
    // Both hops.
    const hops: Hop[] = [
      // Client to router.
      { ethSource: "client", ethDestination: "router-a", ipSource: CLIENT_IP, ipDestination: REMOTE_SERVER_IP, ttl: INITIAL_TTL, tcp: 1, tls: "client-server" },
      // Router to server: new link-layer header, TTL lowered by one.
      { ethSource: "router-b", ethDestination: "server", ipSource: CLIENT_IP, ipDestination: REMOTE_SERVER_IP, ttl: INITIAL_TTL - 1, tcp: 1, tls: "client-server" },
    ];
    // Still one connection and one session, end to end.
    return { hops, tcpConnections: 1, tlsSessions: 1, serverSeesClient: true, ttlLowered: true };
  }
  // Through a reverse proxy: two connections, the second from the proxy's own address.
  const hops: Hop[] = [
    // Client to proxy: the client's connection ends here.
    { ethSource: "client", ethDestination: "proxy-a", ipSource: CLIENT_IP, ipDestination: PROXY_FRONT_IP, ttl: INITIAL_TTL, tcp: 1, tls: "client-proxy" },
    // Proxy to server: the proxy's own connection and packets.
    { ethSource: "proxy-b", ethDestination: "server", ipSource: PROXY_BACK_IP, ipDestination: REMOTE_SERVER_IP, ttl: INITIAL_TTL, tcp: 2, tls: input.backendTls ? "proxy-server" : "none" },
  ];
  // Two connections; one or two sessions; the server sees the proxy.
  return { hops, tcpConnections: 2, tlsSessions: input.backendTls ? 2 : 1, serverSeesClient: false, ttlLowered: false };
}

/** The opening state: the server behind a router. */
export const DEFAULT_INPUT: LayersInput = { path: "routed", backendTls: true };
/** The Example: a reverse proxy that does not re-encrypt; two connections, one TLS session, and the server never sees the client. */
export const EXAMPLE_INPUT: LayersInput = { path: "proxy", backendTls: false };
