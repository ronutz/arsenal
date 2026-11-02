## What it does

This tool is a guided chooser for the F5 Distributed Cloud (XC) origin-pool load-balancing algorithm. Answer three questions - whether sessions need to stick to the same origin, what identifies a session (source IP, a cookie, a custom header, or "it varies per route"), and whether the origin pool is dynamic - and it recommends one of XC's algorithms, names the BIG-IP equivalent, lists the caveats that apply to your answers, and tells you where to set it. Everything runs in your browser.

## The XC persistence model, for BIG-IP people

This is the point the tool exists to make. On BIG-IP, the load-balancing method (Round Robin, Least Connections, and so on) and the persistence profile (Source Address Affinity, Cookie) are two independent settings on the virtual server. XC folds them together. The consistent-hashing algorithms - Source IP Stickiness, Cookie Based Stickiness, and Ring Hash - are not just distribution methods; each one is also, by definition, the persistence method. Choosing one gives you both at once. The non-hash algorithms - Round Robin, Least Active Request, Random - do not persist at all. There is no separate persistence profile object to attach.

## The seven algorithms

Round Robin sends requests to origins in turn. Least Active Request sends each request to the origin with the fewest in-flight requests, which suits uneven request costs or long-lived connections. Random picks an origin at random and is statistically even across large pools. Source IP Stickiness, Cookie Based Stickiness, and Ring Hash are the consistent-hashing family - they hash the source IP, a cookie, or a hash policy you define (typically a session-ID header), and keep a client on the same origin. Load Balancer Override is the escape hatch - it defers the choice to the HTTP load balancer so you can set stickiness per route or per domain.

## Why the caveats matter

The recommendation is only as good as the fit, so the tool surfaces the traps. Hashing on source IP concentrates clients that share an IP (behind NAT or a proxy) onto one origin, making load uneven. Cookie stickiness needs a name, TTL, and path, and only holds if the client returns the cookie. A custom-header hash needs a value that is stable per session, not per request. And for a dynamic pool - Kubernetes pods scaling up and down - consistent hashing is the right family, because it remaps the fewest clients when membership changes.

## Share results

Under the recommended algorithm's name, **Share results** builds a link to this page, only when you press it, that carries your answers after the `#`, by their ids: whether you need persistence; the distribution or the session key, whichever the recommendation reads; and whether the pool is dynamic, once you have answered it. The questionnaire has nothing to type, so nothing you typed travels. The button is available once the recommendation is complete. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The answers are set as if clicked, and the recommendation follows. A link with an unknown answer, or with answers from both branches, is ignored. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
