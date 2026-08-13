## What it does

Paste an iControl REST stats response and the tool flattens it into one line per statistic. It unwraps the `entries`, `nestedStats`, `value` and `description` envelopes, reduces the URL keys to the objects they name, and groups the result by object. Pure local transform — nothing is fetched and nothing leaves the browser.

## Why the response needs flattening

A BIG-IP stats payload wraps every leaf in `value` or `description`, every level in `entries` and `nestedStats`, and keys the outer object by a full URL. Three envelopes around one number. The shape is self-describing rather than perverse, but it is not readable at a glance, and a pool with its members can nest four levels deep.

## The 64-bit split, which is the part that matters

F5 splits large counters into `.high` and `.low` halves because JSON numbers cannot carry a 64-bit integer safely. `serverside.bitsIn.high = 3` and `serverside.bitsIn.low = 1000000` are **not two statistics** — they are one counter whose value is `(high << 32) + low`, or 12,885,901,888.

**The tool combines them and marks the combined values**, so you can check the arithmetic rather than trust it. A flattener that reports the halves separately will quietly under-report your busiest counters.

## Totals, not rates

Every counter is a total since the last reset, and the payload carries no interval. **A single sample cannot produce a rate.** The tool says so on every decode, because plotting a counter instead of its derivative is a routine way to build a dashboard that rises forever.

## What it will not do

It does not interpret the statistics, and it does not know your polling interval. It refuses a configuration response with a clear message rather than producing empty output, since the absence of an `entries` object is the reliable tell.
