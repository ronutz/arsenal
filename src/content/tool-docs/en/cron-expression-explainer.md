# Cron expression explainer

Paste a five-field crontab schedule, or one of the `@` macros, and the tool reads it back: each field explained in plain language with the exact set of values it matches, the next five occurrences, and the dialect's footguns flagged as you type.

## The five fields

`minute hour day-of-month month day-of-week`, with ranges `a-b`, lists `a,b`, steps `*/n` and `a-b/n`, and names (`JAN`–`DEC`, `SUN`–`SAT`). The `@` macros (`@yearly`, `@monthly`, `@weekly`, `@daily`, `@hourly` and friends) expand to their five-field forms; `@reboot` has no schedule at all, and the tool says so instead of inventing one.

## The footguns it flags

The big one: when day-of-month **and** day-of-week are both restricted, cron runs the command when **either** matches: an OR, not the AND almost everyone expects. Also: `0` and `7` are both Sunday; a step that does not divide its span evenly wraps ragged (`*/7` in minutes ends at 56, then jumps to 0); names inside stepped ranges are historically unreliable across implementations; and a six-field input is recognised as Quartz's seconds dialect and named as such.

## About the projected times

cron evaluates schedules in the daemon's **local** time. The occurrences here are computed on the wall-clock of your browser's current instant, with no time-zone database applied, using the same deterministic engine the golden vectors pin against a frozen reference moment.

Everything runs locally; the schedule never leaves the page. Grounded in `crontab(5)` and the POSIX specification.

## Share results

Above the field panels, **Share results** builds a link to this page, only when you press it, that carries the schedule as typed after the `#`, once the page has read it. The page reads only a schedule, five time fields or an @macro: a crontab line with its command is refused (the field count is wrong), so a command, and any password or token written in one, never goes in a link. The next runs are worked out from the clock of whoever opens the link. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **Opening a link.** The schedule fills the box as a paste would and the page explains it. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
