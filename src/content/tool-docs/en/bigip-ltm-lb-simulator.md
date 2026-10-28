## What it does

This tool simulates how a BIG-IP LTM pool distributes traffic. You configure the pool members - each with a member ratio, a node and a node ratio, a priority group, and a count of existing persistence records - then pick a load balancing method and a number of requests N, and it shows where the next N connections land as a per-member distribution. It runs entirely in your browser, and it is deterministic: the same inputs always produce the same answer.

## The methods it simulates

It simulates the static and connection- or session-based methods, because their outcome is determined by configuration and the load you supply. Round Robin sends each request to the next member in turn. Ratio (member) distributes in proportion to each member's ratio; Ratio (node) does the same by node, splitting a node's share among its members. Least Connections (member and node) sends each new connection to the least-loaded member; Weighted Least Connections weights that by ratio. Least Sessions sends to the member with the fewest persistence records - which is exactly the persistence-record count you enter per member.

## Priority groups

Priority group activation decides which members are eligible. Each member has a priority; traffic goes to the highest-priority group first, and a lower group is only activated when the number of available members in the active set falls below the threshold you set (0 disables the feature). The tool applies this and marks each member as active or on standby, so you can see a lower group sitting idle until the higher one thins out.

## What it does not simulate, and why

Fastest, Observed, Predictive, and Dynamic Ratio are dynamic methods that decide based on live runtime metrics - response time, per-second connection counts, performance trends, SNMP data. Those values are not part of a pool's configuration and change continuously, so there is no honest way to compute a fixed distribution for them from static inputs. The tool offers them in the list but, when selected, explains why it cannot simulate them rather than inventing numbers. Two more honesty notes: Least Connections is modeled from a fresh connection table because the tool takes no current-connection count, so it starts even; and Least Sessions assumes source-address or session persistence, since cookie-based persistence makes BIG-IP fall back to Round Robin.

## Share results

At the end of the answer, **Share results** builds a link to this page, only when you press it, that carries the whole form after the `#` as named values: `members` (one line per member, its name, node, ratio, node ratio, priority group and persistence records separated by tabs), `method`, `threshold` (the priority group activation) and `requests`. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed. Names and nodes go as typed, except that a tab pasted into one travels as a space.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-10-27) has the fragment "separated from the rest of the URI prior to a dereference", so the values are not sent to the server when the link is opened; they stay in the address bar and the history of whoever opens it, and anyone who has the link can read them.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The whole form is replaced by the link's values, a field the link does not carry included, and the page simulates them; nothing is sent anywhere. A value the form would not hold (an unknown method, a ratio below 1, a row with a field missing) makes the link malformed, and it is ignored whole. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
