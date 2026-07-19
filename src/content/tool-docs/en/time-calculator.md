## What it does

Two modes of exact time arithmetic. Between two instants: the signed span, split largest-unit-first (weeks, days, hours, minutes, seconds) and totalled fully in each unit, with the canonical ISO 8601 duration. Instant plus or minus a duration: the resulting timestamp. Durations are read in ISO 8601 (P1DT2H30M, PT90M, P1W) or plain shorthand (1d 2h 30m; 90min). Everything is computed on the UTC timeline in your browser.

## What it refuses, and why

Adding "one month" is calendar arithmetic: a month is 28 to 31 days and a year 365 or 366, so P1M has no single exact length. The tool refuses months and years with that explanation instead of silently picking a convention. Days here are exactly 24 hours and weeks exactly 7 days - exact time, stated.

## Offsets

A timestamp without an offset is read as UTC and the assumption is noted. Add Z or an explicit offset (for example -03:00) and the answer never depends on the machine the tool happens to run on.
