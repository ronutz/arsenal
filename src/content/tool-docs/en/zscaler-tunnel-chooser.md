## What it does

Answer six questions about a location - required bandwidth, whether high availability is required, whether the egress IP is static, whether transit must be encrypted, whether the edge device supports GRE, and whether the internal tunnel endpoints are source-NATed - and the tool returns the deterministic forwarding recommendation: GRE or IPsec, the per-tunnel capacity figure that applies and the documented rule it comes from, and the minimum number of primary and backup tunnels that covers the requirement. Every elimination step is shown in order, so the answer teaches the reasoning rather than replacing it. Same answers, same recommendation, always; everything runs in your browser and contacts nothing.

## The published figures it computes from

All capacity numbers are Zscaler's own, live-verified on 2026-07-21 against the help portal. A GRE tunnel carries up to 1 Gbps - unless the internal tunnel endpoint addresses are source-NATed, in which case the figure drops to 250 Mbps, because the service load-balances GRE traffic on the inner addresses and NAT collapses them into one. An IPsec tunnel carries up to 400 Mbps per public source IP address. The scale-out shapes mirror the documentation's own worked examples: 2 Gbps of GRE is two primaries plus two backups on distinct public source IPs; 800 Mbps of IPsec is two plus two, reached either through different public source IPs or through multiple tunnels on the same IP using NAT Traversal with source-port randomization under IKEv2.

## How the elimination works

GRE is preferred when its three preconditions hold - a static public egress address, a GRE-capable device, and no encryption mandate - because it is the simpler encapsulation, forwarded at hardware rate, with the higher per-tunnel ceiling. Any failed precondition routes the answer to IPsec, which tolerates dynamic addresses (peers identified by fully qualified domain name), provides encryption by construction, and asks only that IKEv2 and Dead Peer Detection be configured. The tunnel count is then a ceiling division of the required bandwidth by the applicable per-tunnel figure, and the backup count mirrors the primaries when high availability is required - each backup pointed at a Public Service Edge in a different data center, the documented primary/secondary shape. When no HA is requested, the tool returns the true minimum and says plainly that the vendor still recommends a secondary.

## What it will not pretend

The figures are forwarding-plane guidance for location tunnels, not promises about any specific circuit, and the tool says which documented rule produced each number rather than inventing precision. Roaming users are out of scope by design: a laptop off the network forwards through Zscaler Client Connector's Z-Tunnel, not through a location tunnel - a boundary this tool states rather than blurs.

## Sources

The GRE figures, the source-NAT rule, and the scale-out examples come from Understanding Generic Routing Encapsulation (GRE). The IPsec per-source-IP limit, its two scale-out shapes, and the primary/secondary recommendation come from Configuring an IPSec VPN Tunnel. The GRE preconditions, the dynamic-IP cue toward IPsec, and the MTU field guidance come from Choosing Traffic Forwarding Methods.
