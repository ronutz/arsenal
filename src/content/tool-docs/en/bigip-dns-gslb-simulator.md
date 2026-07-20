## What it does

Models BIG-IP DNS (formerly GTM) global server load balancing, which is two-tier: a wide IP first selects a pool, then the pool selects a virtual server. Configure your pools - each with a ratio, a region tag, an up/down state, and a member-selection method - and their members, then set the wide-IP pool method, a client region, and a request count N. The tool computes how the next N DNS name-resolution requests resolve: first the per-pool distribution, then the per-member distribution within each pool.

## What it simulates, and what it does not

Deterministic at both tiers: Round Robin (circular and even), Ratio (weighted, largest-remainder), Global Availability (all requests to the first available resource in list order, the rest as backups), and Topology (the resource whose region matches the client wins with the highest score; ties inside the winning score round-robin). A down pool or member receives nothing, and the traffic redistributes among those that are up.

The dynamic methods - Quality of Service, Completion Rate, Round-Trip Time, Fewest Hops, Kilobytes/Second, Packet Rate, Virtual Server Score, Least Connections, CPU - depend on live performance metrics that the big3d agents collect from each data center. Those cannot be reproduced offline, so the tool says so plainly rather than inventing a distribution. This is the same honesty rule the LTM simulator follows for its dynamic methods.

## Why two tiers matter

The most common GSLB confusion is treating pool selection and member selection as one decision. They are separate, and each can use a different method: a wide IP might pick pools by Topology (send European clients to the EU pool) while each pool picks a virtual server by Ratio (weight the bigger site heavier). The tool makes that separation visible - you see which pool answered, then which virtual server inside it resolved - so the interaction between the two tiers is concrete rather than abstract.
