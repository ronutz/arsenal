## What this tool does

It works both ways. Give it a node nickname and an I-SID and it builds the group address that node will use for that service. Paste an address out of `show isis spbm multicast-fib` and it tells you whose tree the entry belongs to and which service it carries.

## The rule

An SPBM group address is not configured and not learned. It is assembled from two numbers every node already has:

- **first three bytes**: the fixed prefix `0x30000` combined with the 20-bit nickname
- **last three bytes**: the 24-bit I-SID

So nickname `0.00.10` carrying I-SID 100 gives `03:00:10:00:00:64`. Every node on the shortest path tree computes that same address from the link-state database without being told it, which is exactly why SPBM needs no backbone MAC learning.

The same I-SID rooted on a different node produces a different address: one tree per root.

## The direction that earns its keep

Reading the multicast FIB. It is a column of hex, and the question is always the same: whose tree is this, and which service. Both answers are in the address. `03:00:41:00:04:4d` is nickname `0.00.41` carrying I-SID 1101. Match the nickname against the SYSID or HOST-NAME column of the same output to put a name to the node.

## One ambiguity, declared rather than hidden

Bits 16 and 17 belong to the fixed prefix. A nickname whose first field sets them produces an address that cannot be decoded back to a single nickname. Every documented example uses a first field of 0. If you enter something else, the tool builds the address and tells you the reverse is unverified, rather than returning a nickname it cannot stand behind.

## Honest limits

This computes the group address only. B-VID selection, the shortest path tree itself, IS-IS adjacency and the unicast backbone MAC are all out of scope; the unicast B-MAC is the chassis address and is not derived from anything. The I-SID is treated as a number; whether a given value is a Layer 2 VSN or a Layer 3 VSN is a configuration question this does not model.

## Share results

Under the address and its summary, **Share results** builds a link to this page, only when you press it, that carries the fields of the job the answer came from after the `#`: the nickname and the I-SID as typed (`nickname`, `isid`) for an address you built, or the address as typed (`input`) for one you took apart; a link never carries both. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so the fields is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **Opening a link.** The job's fields are filled and the page computes, as typing does; nothing is looked up. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
