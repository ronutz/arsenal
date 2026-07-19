## What it does

Give it one meeting instant - with Z or an explicit offset, because a meeting time without one is ambiguous - and a list of IANA time zones, one per line. It reads that single instant in every zone: local date and time, weekday, the UTC offset tzdata reports for that date, the date shift relative to the first zone, and a working-hours flag. The zone data is your browser's own IANA database, the same one the operating system keeps current.

## The flags, stated

Working hours are flagged for 09:00-17:59 local, Monday to Friday - the conventional envelope, named rather than hidden. A date-shift column calls out attendees sitting on a different calendar date, the classic Tokyo-joins-tomorrow surprise worth saying out loud in the invitation.

## Why the date matters

Daylight saving is whatever the zone's rules say for that specific date: Berlin is UTC+2 in July and UTC+1 in January; Sao Paulo is UTC-3 year-round since Brazil abolished DST in 2019. Planning with a real date is the whole point.
