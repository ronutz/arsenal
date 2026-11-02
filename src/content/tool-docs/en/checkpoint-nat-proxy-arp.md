## What this tool does

It answers one question: will traffic to the translated address actually reach the gateway? Not whether the policy permits it, but whether the packet arrives at all.

That distinction matters because the usual failure is a layer below the rule base. If the translated address sits inside a subnet the gateway is directly connected to, some device is going to ARP for it, and unless the gateway answers, nothing is ever sent.

## The rule

**Automatic NAT** adds the proxy ARP entry itself at policy install, provided *Automatic ARP configuration* is enabled in Global Properties.

**Manual NAT does not.** It never has. The administrator creates the entry.

**Neither matters** if the translated address is not in a connected subnet. In that case nobody on the segment will ARP for it, and something upstream has to route it; proxy ARP is the wrong thing to be looking at.

## The diagnostic signature

A manual static NAT onto an address in the gateway's own subnet, with no proxy ARP entry, produces a very particular kind of silence. The policy installs cleanly. The rule base looks right. The server is healthy.

And there is **nothing in the firewall logs at all**, not a drop, not a reject. Nothing arrived to be logged. A capture on the outside interface shows ARP requests going unanswered.

## One case that makes "just use automatic NAT" insufficient

Automatic NAT still creates nothing if *Automatic ARP configuration* is switched off in Global Properties. The tool treats that combination exactly as it treats a manual rule, because the outcome is identical.

If you do add entries by hand alongside automatic ones, *Merge manual proxy ARP configuration* has to be enabled or they will not coexist.

## What this deliberately does not do

**It does not rank the NAT rule base.** Published sources contradict each other on whether manual rules are evaluated before or after the automatic ones: one guide states manual first, another states the automatic tiers first, and Check Point's own administration guide describes the two kinds as enforced differently without settling the order.

Ranking them would mean picking a side and presenting a guess as a computation. The proxy-ARP behaviour is stated consistently everywhere, so that is what this answers.

## Honest limits

One interface at a time; a gateway with several interfaces facing the same traffic is a topology question this does not model. IPv4 only. And it reasons about layer 2 reachability, not about whether the access policy permits the connection once it arrives.

## Share results

Under the verdict, **Share results** builds a link to this page, only when you press it, that carries the form after the `#` as named values, every field always: `method`, `type`, `natip`, `gateway`, `prefix` and `autoarp` (1 or 0). Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

The form holds two addresses, a prefix and three choices, none of them a secret, so the popover adds nothing to the site's standard warning. Every field goes, not only those that differ from the defaults, so an old link keeps its meaning if a default changes.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The link's values replace the whole form and the page evaluates it (subnet arithmetic; no ARP is sent and nothing is queried). An unknown method or type, an `autoarp` other than 1 or 0, or addresses the page refuses make the whole link be ignored. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
