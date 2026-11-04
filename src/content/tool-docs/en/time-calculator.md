## What it does

Two modes of exact time arithmetic. Between two instants: the signed span, split largest-unit-first (weeks, days, hours, minutes, seconds) and totalled fully in each unit, with the canonical ISO 8601 duration. Instant plus or minus a duration: the resulting timestamp. Durations are read in ISO 8601 (P1DT2H30M, PT90M, P1W) or plain shorthand (1d 2h 30m; 90min). Everything is computed on the UTC timeline in your browser.

## What it refuses, and why

Adding "one month" is calendar arithmetic: a month is 28 to 31 days and a year 365 or 366, so P1M has no single exact length. The tool refuses months and years with that explanation instead of silently picking a convention. Days here are exactly 24 hours and weeks exactly 7 days - exact time, stated.

## Offsets

A timestamp without an offset is read as UTC and the assumption is noted. Add Z or an explicit offset (for example -03:00) and the answer never depends on the machine the tool happens to run on.

Under each instant, a date-and-time picker sets it without typing. A pick keeps the seconds and the offset the field already had, and writes Z (UTC) when it had none; an offset other than Z, or a date alone, is still typed.

## Share results

Under the result, **Share results** builds a link to this page, only when you press it, that carries the mode and its fields after the `#`, once the page has a result: the two instants for the span between them, or the start, the duration and add or subtract. The other mode's fields are not carried. Instants and durations name nothing of yours. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **Opening a link.** The mode is chosen and its fields fill as you would type them, and the page computes; the other mode's fields keep what you had. An unknown mode or operation, a missing field or a field of the other mode means the link is ignored. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
