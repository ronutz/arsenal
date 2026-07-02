## What it does

Enter a Unix timestamp or an ISO-8601 date and read the same instant back in every common form. When you enter a number, the tool auto-detects its unit (seconds, milliseconds, microseconds, or nanoseconds) from its magnitude, so you can paste a value from almost any system without saying which unit it is. It then renders the instant as a UTC calendar breakdown, an ISO-8601 string, an RFC 3339 timestamp, the HTTP date format, and the timestamp itself in all four units. Everything is computed in your browser.

## What Unix time means

Unix time, defined by POSIX, is the number of seconds elapsed since the epoch (1970-01-01 00:00:00 UTC), not counting leap seconds. Different systems store it at different resolutions: classic Unix and most APIs use seconds; JavaScript and many databases use milliseconds; some tracing and kernel interfaces use microseconds or nanoseconds. Because those magnitudes are roughly a thousand apart, the unit can be inferred from how many digits the number has, which is what the auto-detection does.

## The formats it produces

- **UTC calendar breakdown**, the year, month, day, and time of day in UTC.
- **ISO 8601 and RFC 3339**, the internet timestamp format, for example `2026-07-01T20:00:00Z`.
- **HTTP date**, the IMF-fixdate form used in HTTP headers (RFC 9110, section 5.6.7), for example `Wed, 01 Jul 2026 20:00:00 GMT`.
- **All four units**, the same instant expressed as seconds, milliseconds, microseconds, and nanoseconds.

## Range and determinism

Dates are handled within the range a JavaScript date value can represent, roughly plus or minus 273,000 years around the epoch (a limit of 8.64 x 10^15 milliseconds on either side). The conversion is a pure function of the input value and never reads the current clock, so a given timestamp always renders the same way. A "relative to now" convenience necessarily needs the wall clock, so it lives in the tool's interface rather than in this deterministic core.

## Using it

Enter a Unix timestamp such as `1751400000` (a ten-digit value, so it is read as seconds) or `1751400000000` (thirteen digits, read as milliseconds), or an ISO-8601 date such as `2026-07-01T20:00:00Z`, and read every equivalent form at once.
