## What it does

Paste a FortiGate firewall policy list and a packet, and this tool performs the evaluation FortiOS would: top to bottom, every criterion must match, first match wins. It reports the policy that matches, a trace naming the **first criterion that eliminated** each earlier policy, and the policies below the match that would also have matched. It runs entirely in your browser and never contacts a device.

## Why the trace matters more than the verdict

Knowing that policy 7 matched is a small part of the answer. The useful part is why policies 1 through 6 did not, because that is what tells you whether the list is written as intended. A policy with the right addresses and the wrong outgoing interface silently fails to match, and nothing in the interface says so — the hit counter simply never increments.

The trace names one criterion per policy: the first one that failed. FortiOS requires all of them, so a single failure is enough to eliminate a policy, and reporting the first is what keeps the output readable on a long list.

## Shadowed versus catch-all, and why the distinction is the point

Once a policy matches, later policies that would also have matched fall into two very different categories, and this tool keeps them apart.

**Shadowed** means the later policy is at least as specific as the one that won. That is a genuine fault: it is live in the configuration, looks correct on screen, and can never take effect for this traffic as ordered. It is the single most common FortiGate policy problem, and moving it above the winner is the fix.

**Catch-all** means the later policy is broader than the winner. A general allow beneath a set of specific rules is correct design, not a mistake, so the tool reports it without flagging it. Conflating the two is what makes this class of tool cry wolf on every well-ordered policy list, which is why specificity is computed rather than assumed.

## Input formats

Two shapes are accepted, because you may have either.

**FortiOS CLI** — the output of `show firewall policy` or a `config firewall policy` block. Members are read from the quoted lists, and a policy with `set status disable` is reported as skipped rather than silently ignored.

**A pipe or tab table** — `id | srcintf | dstintf | srcaddr | dstaddr | service | action`, which is what a copy from the GUI or a hand-written list looks like. Multiple members in a cell are comma separated.

The packet goes on its own line in either format:

```
packet: srcintf=port1, dstintf=port2, srcaddr=LAN, dstaddr=WebSrv, service=HTTPS
```

## The limitation, stated plainly

Matching compares **object names**, not resolved addresses. A pasted policy list does not carry the address-object definitions, so the question "is 10.1.1.5 inside the object called LAN_Subnet" cannot be answered from this input. Supply the object name, or `all`.

This is a deliberate choice. The tool could guess by parsing addresses out of object names, and it would be confidently wrong whenever a name did not describe its contents. A stated limit is more useful than a plausible wrong answer, and it is the reason this tool can be trusted on the parts it does answer.

It also models the **match decision only**. NAT results, security profile outcomes, routing, and session state depend on configuration this input does not carry, and are not inferred.

## Where it fits

It pairs with the FortiGate firewall policy and NAT article, which explains the evaluation pipeline this tool walks, including why destination NAT through a VIP happens before policy evaluation and source NAT after it. For NSE 4 candidates it covers objectives 2.01 and 2.02.
