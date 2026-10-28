## What it does

Models BIG-IP DNS (formerly GTM) global server load balancing, which is two-tier: a wide IP first selects a pool, then the pool selects a virtual server. Configure your pools - each with a ratio, a region tag, an up/down state, and a member-selection method - and their members, then set the wide-IP pool method, a client region, and a request count N. The tool computes how the next N DNS name-resolution requests resolve: first the per-pool distribution, then the per-member distribution within each pool.

## What it simulates, and what it does not

Deterministic at both tiers: Round Robin (circular and even), Ratio (weighted, largest-remainder), Global Availability (all requests to the first available resource in list order, the rest as backups), and Topology (the resource whose region matches the client wins with the highest score; ties inside the winning score round-robin). A down pool or member receives nothing, and the traffic redistributes among those that are up.

The dynamic methods - Quality of Service, Completion Rate, Round-Trip Time, Fewest Hops, Kilobytes/Second, Packet Rate, Virtual Server Score, Least Connections, CPU - depend on live performance metrics that the big3d agents collect from each data center. Those cannot be reproduced offline, so the tool says so plainly rather than inventing a distribution. This is the same honesty rule the LTM simulator follows for its dynamic methods.

## Why two tiers matter

The most common GSLB confusion is treating pool selection and member selection as one decision. They are separate, and each can use a different method: a wide IP might pick pools by Topology (send European clients to the EU pool) while each pool picks a virtual server by Ratio (weight the bigger site heavier). The tool makes that separation visible - you see which pool answered, then which virtual server inside it resolved - so the interaction between the two tiers is concrete rather than abstract.

## Share results

Under the pool tier (or under the explanation, for a dynamic wide-IP method), **Share results** builds a link to this page, only when you press it, that carries the whole form after the `#` as named values: `method`, `region` (left out when empty), `requests`, `pools` (one line per pool: name, ratio, region, up and member method, separated by tabs) and `members` (one line per member: its pool's number, name, ratio, region and up). Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed. Names and regions go as typed, except that a tab pasted into one travels as a space.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-10-27) has the fragment "separated from the rest of the URI prior to a dereference", so the values are not sent to the server when the link is opened; they stay in the address bar and the history of whoever opens it, and anyone who has the link can read them.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The whole form is replaced by the link's values, a field the link does not carry included, and the page simulates them; nothing is sent anywhere. A value the form would not hold (an unknown method, a ratio below 1, a row with a field missing) makes the link malformed, and it is ignored whole. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
