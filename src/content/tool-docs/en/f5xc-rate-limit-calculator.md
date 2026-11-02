## What it does

This calculator turns an F5 Distributed Cloud (XC) rate-limiter configuration into exactly what it will do. You enter the four fields F5's console asks for - **Number**, **Per Period**, **Periods**, and **Burst Multiplier** - plus the **Mitigation Action** (and a lockout if you choose Block), and it computes the effective rate, the per-second / minute / hour equivalents, the burst ceiling, and a plain description of the enforcement behaviour. It runs entirely in your browser.

## The rate math

XC expresses a rate as *Number requests per (Periods x Per Period)*. That is why `[1, Seconds, 60]` and `[1, Minutes, 1]` are the same limit - one request per minute - which regularly surprises people. The calculator normalises any configuration to a single window in seconds and shows the equivalent per-second, per-minute, and per-hour rates, so two configurations can be compared directly.

## Burst and enforcement

The **Burst Multiplier** is the maximum burst of requests allowed, as a multiple of the rate (default 1); a 15 request/second limit with a 3x multiplier permits a 45-request burst. Enforcement is a leaky bucket: when the bucket overflows, the load balancer returns **HTTP 429**.

## The mitigation gotcha

The single most misread setting is the **Mitigation Action**. **Disabled does not bypass rate limiting** - the leaky bucket still returns 429 on overflow; Disabled only means no extra lockout timer is applied. **Block** adds a lockout on top: once the bucket overflows, the user is blocked for the full lockout duration even if the bucket drains, and can send again only after the timer expires (maximum 48 hours). The calculator states which behaviour your configuration produces.

## Caveats it surfaces

Counting is distributed per Regional Edge and per proxy, so you may briefly see more requests than the limit before enforcement converges. And when you layer Server URL and API endpoint rules, they are evaluated first-match in the order you configure them.

## Share results

Under the effective rate, **Share results** builds a link to this page, only when you press it, that carries every field after the `#`: Number, Per Period, Periods, Burst Multiplier, Mitigation, and the lockout with its unit, each as the calculation reads it (an empty Burst Multiplier as 1). Every field goes even when it matches the default, so a link keeps its meaning if a default changes, and the numbers name no system or person. The page shows a result as it opens, so the button is available at once. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The fields are set as if typed, and the result follows. A link with a value the page would refuse is ignored whole. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
