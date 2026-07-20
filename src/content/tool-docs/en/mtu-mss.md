## What it does

Enter a link MTU (Maximum Transmission Unit) and, optionally, the encapsulation stack the traffic crosses, and the tool computes everything the MTU line controls: the inner IP MTU and the TCP MSS (Maximum Segment Size) for IPv4 and IPv6, the Ethernet frame sizes the link must accept, the underlay MTU an overlay needs to carry full 1500-byte inner packets, and the wire efficiency of this MTU against the standard 1500 and jumbo 9000 reference points. Everything is fixed RFC header arithmetic, computed locally.

## The input line

Start with the MTU, then add tokens in any order: `v6` (IPv6 outer header for tunnels), `pppoe`, `gre`, `ipip`, `6in4` (or `sit`), `vxlan`, `geneve`, `wireguard` (or `wg`), `vlan` (or `dot1q`), `qinq`, `mpls` or `mpls2`..`mpls8`, and `+N` for a custom overhead in bytes. So `1500 vxlan` is the canonical overlay question, `1500 gre v6` is GRE over IPv6, `9000 vxlan vlan` is a tagged jumbo underlay, and `1500 +57` models a measured IPsec cost.

## The one distinction that matters

Overheads live on two different sides of the MTU line. Encapsulations (PPPoE, GRE, IP-in-IP, 6in4, VXLAN, GENEVE, WireGuard, your custom `+N`) consume bytes inside the link MTU, so they shrink the inner IP MTU and the MSS: that is why a GRE tunnel on a 1500-byte link shows MTU 1476. Layer 2 shims (802.1Q VLAN tags, QinQ, MPLS labels) ride in the frame header outside the IP payload, so the IP MTU does not move at all; the frame grows instead, which is why one VLAN tag makes a 1522-byte baby giant and why switch platforms carry frame headroom (system MTUs like 9216) rather than shrinking the IP MTU. The tool renders the two families separately so the distinction stays visible.

## The numbers it uses

Every constant is protocol-fixed: IPv4 header 20 (RFC 791), IPv6 40 (RFC 8200), TCP 20 (RFC 9293), UDP 8 (RFC 768), Ethernet header 14 + FCS 4 with 20 bytes of preamble and inter-frame gap on the wire, 802.1Q tag 4, MPLS label 4 (RFC 3032), PPPoE 8 (RFC 2516), GRE base 4 (RFC 2784), IP-in-IP and 6in4 outer-header-only (RFC 2003 / RFC 4213), VXLAN 8 + UDP + outer IP + inner Ethernet = 50 with IPv4 outer or 70 with IPv6 (RFC 7348), GENEVE the same base with variable options on top (RFC 8926), and WireGuard 60 with IPv4 outer or 80 with IPv6. IPsec ESP is deliberately not a preset: its overhead genuinely varies with mode, cipher, IV size, padding, integrity tag, and NAT-T, so pretending one number would be dishonest. Measure yours (or take it from your platform's documentation) and enter it as `+N`.

## Worked examples

`1500` alone gives MSS 1460 (IPv4) and 1440 (IPv6), a 1518-byte maximum frame, and 94.93% wire efficiency. `1500 gre` gives the classic 1476 inner MTU. `1500 vxlan` gives 1450 inner and answers the design question: a 1550-byte underlay carries full 1500-byte inner packets. `1500 pppoe` gives the famous 1492. `1500 vlan` leaves the inner MTU at 1500 and grows the frame to the 1522-byte baby giant. `9000 vxlan` gives 8950 inner, the standard datacenter overlay answer. `1500 wireguard` gives 1440, and `1492 wireguard` (WireGuard over PPPoE) gives 1432.

## Provenance

Header sizes are from the RFCs named above; the composite overheads (GRE 24, VXLAN 50/70, WireGuard 60/80, PPPoE 8) were cross-verified against multiple independent tunnel-overhead references on 2026-07-20. The tool ships 22 golden vectors pinning every classic number, so any drift in the arithmetic breaks the build.
