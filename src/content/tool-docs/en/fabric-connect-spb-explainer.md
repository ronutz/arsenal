## What it does

Give an I-SID, an SPB nickname or a switch role, and the tool sorts the Shortest Path Bridging vocabulary for you: which backbone VLAN carries the service and why, what an L2VSN and an L3VSN actually bind to, what a B-VLAN is and is not, and what changes between a backbone edge bridge and a backbone core bridge. Deterministic and offline — it explains identifiers, it does not query a fabric.

## The behaviour worth checking

**Even I-SIDs ride one backbone VLAN and odd ones the other.** With the Extreme defaults of 4051 and 4052, I-SID 20010 is carried on 4052 and 20011 on 4051. Two shortest-path trees, each carrying roughly half the services.

The tool says this is **the default distribution rather than a rule of the standard**, because a deployment can assign differently — and when one service behaves unlike its neighbours, which tree it is on is the first thing to check.

## The fact the tool repeats on every result

**A B-VLAN is not a VLAN.** It does not flood unknown unicast, broadcast or multicast. It forwards only on backbone MAC tables that IS-IS provisioned from shortest-path trees. No spanning tree, nothing blocked.

Everything else follows: if forwarding is computed, the core does not learn; if the core does not learn, it does not need to know your services exist. Which is why **adding a service touches only the edge switches where it appears.**

## Validation it performs

An I-SID must be in the 24-bit range, and the tool refuses values outside it rather than explaining a number that cannot exist. A nickname must be in `x.xx.xx` form, and a malformed one warns — **a duplicate or malformed nickname is one of the few errors here that breaks things far from where it was typed.**

## What it will not do

It cannot see your fabric. It does not know your topology, your adjacencies or whether IS-IS is actually up. It explains what your numbers mean inside a fabric, not what your fabric is doing.
