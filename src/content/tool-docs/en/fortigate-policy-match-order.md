## What it does

Paste an ordered FortiGate policy list and, optionally, a packet. The tool walks the list top-down showing which field ruled each policy out, names the winner, and reports when the packet falls through to the implicit deny. Local and offline; it reasons about the list you give it and never touches a device.

## The analysis worth running on its own

Even with no packet, the tool reports **policies that can never be reached** — where an earlier policy covers every field a later one covers. That is the commonest form of "my rule isn't working": the rule is correct and simply never reached. Worth running periodically rather than only when something breaks.

## What it corrects

**The policy ID is an identifier, not a position.** Policy 3 can sit below policy 47, and renumbering changes nothing about evaluation order. Plenty of material online reads as though the ID were the order; the tool states the correction on every run, and one of its golden vectors is a list where policy 47 sits above policy 3 and wins.

It also always says that **each direction needs its own policy** — traffic permitted from A to B says nothing about B to A.

## The virtual-IP rules

A policy with a **VIP applied is matched differently and takes priority** over an ordinary policy, so ordering alone will not block a source from reaching it. The deny policy needs **`match-vip`** and must sit above. New deny policies have it enabled by default; an **accept** policy cannot have it at all, and the tool flags that combination as impossible.

## What it will not do

It does not resolve address objects or service groups — a named object is an opaque token unless it is `all` or `any`. So it can tell you that `web-servers` and `all` are different, and cannot tell you whether one contains the other. For that, the device is the authority.
