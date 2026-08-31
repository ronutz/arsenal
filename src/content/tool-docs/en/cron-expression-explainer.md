# Cron expression explainer

Paste a five-field crontab schedule — or one of the `@` macros — and the tool reads it back: each field explained in plain language with the exact set of values it matches, the next five occurrences, and the dialect's footguns flagged as you type.

## The five fields

`minute hour day-of-month month day-of-week`, with ranges `a-b`, lists `a,b`, steps `*/n` and `a-b/n`, and names (`JAN`–`DEC`, `SUN`–`SAT`). The `@` macros — `@yearly`, `@monthly`, `@weekly`, `@daily`, `@hourly` and friends — expand to their five-field forms; `@reboot` has no schedule at all, and the tool says so instead of inventing one.

## The footguns it flags

The big one: when day-of-month **and** day-of-week are both restricted, cron runs the command when **either** matches — an OR, not the AND almost everyone expects. Also: `0` and `7` are both Sunday; a step that does not divide its span evenly wraps ragged (`*/7` in minutes ends at 56, then jumps to 0); names inside stepped ranges are historically unreliable across implementations; and a six-field input is recognized as Quartz's seconds dialect and named as such.

## About the projected times

cron evaluates schedules in the daemon's **local** time. The occurrences here are computed on the wall-clock of your browser's current instant, with no time-zone database applied — the same deterministic engine the golden vectors pin against a frozen reference moment.

Everything runs locally; the schedule never leaves the page. Grounded in `crontab(5)` and the POSIX specification.
