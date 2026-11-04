## What it does

Give it one meeting instant - with Z or an explicit offset, because a meeting time without one is ambiguous - and a list of IANA time zones, one per line. It reads that single instant in every zone: local date and time, weekday, the UTC offset tzdata reports for that date, the date shift relative to the first zone, and a working-hours flag. The zone data is your browser's own IANA database, the same one the operating system keeps current.

## The flags, stated

Working hours are flagged for 09:00-17:59 local, Monday to Friday - the conventional envelope, named rather than hidden. A date-shift column calls out attendees sitting on a different calendar date, the classic Tokyo-joins-tomorrow surprise worth saying out loud in the invitation.

## Why the date matters

Daylight saving is whatever the zone's rules say for that specific date: Berlin is UTC+2 in July and UTC+1 in January; Sao Paulo is UTC-3 year-round since Brazil abolished DST in 2019. Planning with a real date is the whole point.

Under the instant, a date-and-time picker sets it without typing: a pick keeps the field's seconds and offset, and writes Z (UTC) when it had none. Under the zones, a list of every IANA zone the browser knows adds the one chosen as a new line.

## Share results

Under the table, **Share results** builds a link to this page, only when you press it, that carries the meeting instant and the zones, one per line, as typed after the `#`, once the page has a plan. The local readings are worked out from the time-zone data of the browser that opens the link, which is what the page always uses. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **Opening a link.** The instant and the zones fill as you would type them, and the page plans. Both must be there, or the link is ignored. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
