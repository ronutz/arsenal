## What it does

The CIDR / Subnet Calculator takes an IPv4 block written in CIDR notation — an
address together with a prefix length, such as `192.168.1.0/24` — and derives
everything that prefix implies: the network address, the broadcast address, the
first and last usable host, the number of usable hosts, and the subnet mask in
dotted-decimal form. It also classifies the block against the well-known reserved
ranges, so a private block (RFC 1918) or another special-use block (RFC 6890) is
flagged as such. Every calculation runs in your browser; no input is sent
anywhere.

## How CIDR notation works

A prefix length `/n` fixes the leading `n` bits of the 32-bit address as the
network portion and leaves the remaining `32 − n` bits for hosts. That one number
sets the size of the block: it spans `2^(32 − n)` addresses. Within any block:

- the **network address** has every host bit set to 0 (the lowest address);
- the **broadcast address** has every host bit set to 1 (the highest);
- the **usable host range** is everything between them.

A /24, for example, spans `2^8 = 256` addresses: one network address, one
broadcast address, and `254` usable hosts. In general, a block from /0 through
/30 has `2^(32 − n) − 2` usable hosts, because the network and broadcast
addresses are reserved and not assignable to hosts.

## The /31 and /32 edge cases

Two prefixes break the "minus two" rule:

- A **/32** describes a single host: one address, with no separate network or
  broadcast address.
- A **/31** describes exactly two addresses. On point-to-point links, RFC 3021
  defines both of those addresses as usable, so a /31 provides two hosts with no
  reserved network or broadcast address. The calculator counts /31 blocks the
  RFC 3021 way.

## Worked examples

- `192.168.1.0/24` → network `192.168.1.0`, broadcast `192.168.1.255`, usable
  `192.168.1.1`–`192.168.1.254`, `254` hosts, mask `255.255.255.0`.
- `10.0.0.0/30` → network `10.0.0.0`, broadcast `10.0.0.3`, usable
  `10.0.0.1`–`10.0.0.2`, `2` hosts, mask `255.255.255.252`.
- `10.0.0.0/31` → two usable addresses (`10.0.0.0` and `10.0.0.1`), a
  point-to-point link per RFC 3021, with no network or broadcast address.

## Using it

Enter an IPv4 CIDR block such as `192.168.1.0/24` or `10.0.0.0/8`, and the tool
reports the network and broadcast addresses, the usable host range, the host
count, and the subnet mask. To see the reserved-range classification, enter a
private block such as `10.0.0.0/8` (RFC 1918) or another special-use block; the
tool flags what kind of block it is.
