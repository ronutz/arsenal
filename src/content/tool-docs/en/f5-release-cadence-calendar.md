## What it does

On 6 July 2026 F5 announced a move from a quarterly to a monthly security release cadence. This tool turns that schedule into concrete dates you can plan against. Pick a starting date (it defaults to today) and it lists the upcoming F5 hardened software releases and the security notifications that follow them, and tells you the next of each.

The whole cadence reduces to one rule. Hardened software releases ship on the **third Wednesday of every month**, starting 15 July 2026. A **security notification** for each release is published one month later, and because F5's own anchor dates line up to third Wednesdays (15 July release, 19 August notification), each third Wednesday carries both events at once: that month's hardened release ships, and the previous month's security notification is published. The one-month gap is deliberate, giving you a window to update before the vulnerability detail becomes public.

The dates are computed locally by simple arithmetic; nothing leaves your browser. They are the scheduled dates: F5 continues to issue out-of-band security alerts and engineering hotfixes for urgent issues at any time, and it explicitly retains flexibility to adjust the timing or content of a notification where legal, disclosure, exploitation, or customer-protection considerations require.

## Share results

Under the two headline dates, **Share results** builds a link to this page, only when you press it, that carries after the `#` the start date you chose (`from`, unless it is today) and the number of months (`months`, unless it is 6). The button is disabled while the form is untouched. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

A link without a date opens on the reader's own today, and "in N days" always counts from the reader's today. [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-10-27) has the fragment "separated from the rest of the URI prior to a dereference", so the values are not sent to the server when the link is opened; each stays in the address bar and the history of whoever opens it, and anyone who has the link can read them.

- **Opening a link.** The date and the count are set and the page lists the dates. A date that is not a real calendar day, or a count outside 1 to 24, makes the whole link ignored. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
