## What this tool does

It works both ways. Give it a node nickname and an I-SID and it builds the group address that node will use for that service. Paste an address out of `show isis spbm multicast-fib` and it tells you whose tree the entry belongs to and which service it carries.

## The rule

An SPBM group address is not configured and not learned. It is assembled from two numbers every node already has:

- **first three bytes** — the fixed prefix `0x30000` combined with the 20-bit nickname
- **last three bytes** — the 24-bit I-SID

So nickname `0.00.10` carrying I-SID 100 gives `03:00:10:00:00:64`. Every node on the shortest path tree computes that same address from the link-state database without being told it, which is exactly why SPBM needs no backbone MAC learning.

The same I-SID rooted on a different node produces a different address — one tree per root.

## The direction that earns its keep

Reading the multicast FIB. It is a column of hex, and the question is always the same: whose tree is this, and which service. Both answers are in the address. `03:00:41:00:04:4d` is nickname `0.00.41` carrying I-SID 1101. Match the nickname against the SYSID or HOST-NAME column of the same output to put a name to the node.

## One ambiguity, declared rather than hidden

Bits 16 and 17 belong to the fixed prefix. A nickname whose first field sets them produces an address that cannot be decoded back to a single nickname. Every documented example uses a first field of 0. If you enter something else, the tool builds the address and tells you the reverse is unverified — rather than returning a nickname it cannot stand behind.

## Honest limits

This computes the group address only. B-VID selection, the shortest path tree itself, IS-IS adjacency and the unicast backbone MAC are all out of scope — the unicast B-MAC is the chassis address and is not derived from anything. The I-SID is treated as a number; whether a given value is a Layer 2 VSN or a Layer 3 VSN is a configuration question this does not model.
