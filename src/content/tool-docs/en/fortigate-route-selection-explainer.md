## What it does

Give a destination and a set of routes, and this tool runs the selection FortiOS would: which routes install, which one traffic actually takes, and which are floating backups. It runs entirely in your browser.

## The distinction the whole tool exists for

Administrative distance and priority are routinely treated as the same idea. They are not, and they act at different moments.

**Distance decides which route is INSTALLED.** Routes to the same destination compete, the lowest distance wins, and the loser is **absent** from the forwarding table, not ranked lower, not a fallback that gets used under load, simply not there. That is why "my route is not working" so often turns out to be "my route never installed", and why a route you configured cannot be found in `get router info routing-table all`.

**Priority decides which of several ALREADY-INSTALLED routes is preferred.** It only ever applies to routes that survived the distance comparison. A priority of 0 cannot rescue a route that lost on distance, and a golden vector pins exactly that case.

## What follows from it

| Configuration | Result |
|---|---|
| Same prefix, same distance | Both install; priority chooses |
| Same prefix, different distance | One installs; the other is a floating backup |
| Same prefix, same distance, same priority | ECMP load shares across both |

The floating backup is how a standby default route is built: same prefix, higher distance. It appears in the table only when the primary is withdrawn, which is what **link health monitoring** does, and why a static route without it stays in the table while the path beyond the interface is broken.

The tool models a down route so you can watch the backup take over.

## Forwarding takes the longest match

Among **installed** routes, the most specific prefix wins, regardless of distance or priority. A /16 beats a default route for an address inside it even if the default route has better values, because specificity is compared first at forwarding time.

That is also why prefix hijacking works, and why the ordering is worth having in mind beyond a single device.

## What it does not model

The routing table only. Two things are consulted **before** it and override it:

- A **policy route**, which matches on source, protocol and port as well as destination. A forgotten policy route is the classic cause of traffic that ignores an obviously correct static route, so if the table says one thing and the traffic does another, look there first.
- An **SD-WAN rule**, which selects a member by measured performance before the table is reached.

It is IPv4 only, and it does not evaluate whether a gateway is actually reachable; it takes the route set as given.

## Share results

Under the selected route, **Share results** builds a link to this page, only when you press it, that carries the destination and the routes as pasted after the `#`. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

Routes name your internal prefixes, next hops and interfaces, as a routing table does (the reason the popover adds a caution line). Before a link is offered, the box is read for a credential FortiOS or a standard defines: a `set` line of a setting the [FortiOS 7.6.8 CLI reference](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) types as a password (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd` and the rest; read 2026-11-01) or the `name` of an SNMP community ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), section 3.2.5), any `ENC` value (Fortinet's advisory [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007), read 2026-11-01: such data posted where others can read it "should currently be considered "easy to decrypt""), a `psksecret=` or `password=` pair of the same names on a directive line, a PEM private key ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), a JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), an `Authorization` line ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2), a password in a URL or an AWS access key ID. One of them means no link: the popover names its line, and you replace it with a placeholder and press again, so what you share is exactly what you chose (a value is never replaced inside a pasted box, which would change what was sent). A value whose name only looks like a secret does not stop the link; the popover names the first one.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The box fills as a paste would and the page selects the route. Nothing is contacted. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

## Where it fits

It pairs with the FortiGate routing and SD-WAN article, which covers the full consultation order and the SD-WAN layer this tool leaves out. For NSE 4 candidates it supports objective 4.01.
