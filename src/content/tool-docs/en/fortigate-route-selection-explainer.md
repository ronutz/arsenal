## What it does

Give a destination and a set of routes, and this tool runs the selection FortiOS would: which routes install, which one traffic actually takes, and which are floating backups. It runs entirely in your browser.

## The distinction the whole tool exists for

Administrative distance and priority are routinely treated as the same idea. They are not, and they act at different moments.

**Distance decides which route is INSTALLED.** Routes to the same destination compete, the lowest distance wins, and the loser is **absent** from the forwarding table — not ranked lower, not a fallback that gets used under load, simply not there. That is why "my route is not working" so often turns out to be "my route never installed", and why a route you configured cannot be found in `get router info routing-table all`.

**Priority decides which of several ALREADY-INSTALLED routes is preferred.** It only ever applies to routes that survived the distance comparison. A priority of 0 cannot rescue a route that lost on distance, and a golden vector pins exactly that case.

## What follows from it

| Configuration | Result |
|---|---|
| Same prefix, same distance | Both install; priority chooses |
| Same prefix, different distance | One installs; the other is a floating backup |
| Same prefix, same distance, same priority | ECMP load shares across both |

The floating backup is how a standby default route is built: same prefix, higher distance. It appears in the table only when the primary is withdrawn — which is what **link health monitoring** does, and why a static route without it stays in the table while the path beyond the interface is broken.

The tool models a down route so you can watch the backup take over.

## Forwarding takes the longest match

Among **installed** routes, the most specific prefix wins, regardless of distance or priority. A /16 beats a default route for an address inside it even if the default route has better values, because specificity is compared first at forwarding time.

That is also why prefix hijacking works, and why the ordering is worth having in mind beyond a single device.

## What it does not model

The routing table only. Two things are consulted **before** it and override it:

- A **policy route**, which matches on source, protocol and port as well as destination. A forgotten policy route is the classic cause of traffic that ignores an obviously correct static route, so if the table says one thing and the traffic does another, look there first.
- An **SD-WAN rule**, which selects a member by measured performance before the table is reached.

It is IPv4 only, and it does not evaluate whether a gateway is actually reachable — it takes the route set as given.

## Where it fits

It pairs with the FortiGate routing and SD-WAN article, which covers the full consultation order and the SD-WAN layer this tool leaves out. For NSE 4 candidates it supports objective 4.01.
