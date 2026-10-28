## What it does

Paste an iControl REST stats response and the tool flattens it into one line per statistic. It unwraps the `entries`, `nestedStats`, `value` and `description` envelopes, reduces the URL keys to the objects they name, and groups the result by object. Pure local transform: nothing is fetched and nothing leaves the browser.

## Why the response needs flattening

A BIG-IP stats payload wraps every leaf in `value` or `description`, every level in `entries` and `nestedStats`, and keys the outer object by a full URL. Three envelopes around one number. The shape is self-describing rather than perverse, but it is not readable at a glance, and a pool with its members can nest four levels deep.

## The 64-bit split, which is the part that matters

F5 splits large counters into `.high` and `.low` halves because JSON numbers cannot carry a 64-bit integer safely. `serverside.bitsIn.high = 3` and `serverside.bitsIn.low = 1000000` are **not two statistics**: they are one counter whose value is `(high << 32) + low`, or 12,885,901,888.

**The tool combines them and marks the combined values**, so you can check the arithmetic rather than trust it. A flattener that reports the halves separately will quietly under-report your busiest counters.

## Totals, not rates

Every counter is a total since the last reset, and the payload carries no interval. **A single sample cannot produce a rate.** The tool says so on every decode, because plotting a counter instead of its derivative is a routine way to build a dashboard that rises forever.

## What it will not do

It does not interpret the statistics, and it does not know your polling interval. It refuses a configuration response with a clear message rather than producing empty output, since the absence of an `entries` object is the reliable tell.

## Share results

Under the flattened text, **Share results** builds a link to this page, only when you press it, that carries the stats response as pasted after the `#`. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

A stats response holds counters and the objects they belong to, not a credential: iControl REST carries the token in the `X-F5-Auth-Token` header of the request ([F5's AS3 guide, Authentication and Authorization](https://clouddocs.f5.com/products/extensions/f5-appsvcs-extension/latest/userguide/authentication.html), read 2026-10-27). [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-10-27) has the fragment "separated from the rest of the URI prior to a dereference", so the response is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a collection's stats can run past it, and then the popover says how long the share is instead of offering a link.
- **Opening a link.** The JSON fills the box as a paste would and the page flattens it. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
