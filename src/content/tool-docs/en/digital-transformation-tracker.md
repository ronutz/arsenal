# Digital transformation tracker

Thirty milestones across seven domains of ordinary life, from ARPANET's first packets to forecasts that have not happened yet. The point of the tool is not the timeline. It is the **certainty tier** attached to every row.

## Why the tiers exist

A tracker with a "what comes next" section is a forecasting surface, and this site's rule is that tools compute rather than guess. The resolution is that a forecast is never allowed to look like a fact:

- **Shipped** - it happened, dated and verifiable.
- **In force** - a legal obligation that binds today.
- **Scheduled** - a fixed future date set by law or a published timetable. High confidence in the date, no claim about the consequences.
- **Scheduled, but moving** - a date that genuinely exists in law *and* is actively being changed. The tool shows the original date, the proposed date, and the fact that the change is not yet law.
- **Forecast** - somebody's projection, always naming the forecaster, and paired with a counter-signal where one exists.

That fourth tier is the one nobody else shows. The EU AI Act's high-risk obligations are the worked example: scheduled for 2 August 2026, provisionally agreed on 7 May 2026 to move to 2 December 2027, and not yet law - so the original date still governs planning.

## What each row records

Every milestone answers two questions: what changed for an ordinary person, and what became possible that was not possible before. Filtering by domain shows how differently transformation arrived in money, in work, in health, and in the state.

## Share results

Under the count, **Share results** builds a link to this page, only when you press it, that carries the filters that are on after the `#`, by id: `domains` and `certainties`, in the page's order (a row with nothing on carries nothing, meaning all, as on the page). Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

With no filter on, the view is the page as it opens, which the page's own Share button already links to, so the button waits. The milestones never travel: the page that opens the link reads the same dataset, so the link stays short and a corrected row reaches old links too.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so the view is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **Opening a link.** The chips are set and the rail redraws, as tapping them does. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

## Privacy

Filters are evaluated locally. Nothing is transmitted, and the dataset ships with the page.
