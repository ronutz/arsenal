# ZDX score factor explainer

Paste the metrics Zscaler Digital Experience exposes - the composite score, the Web Probe metrics, the CloudPath metrics - and read back what each one is, per the vendor's own documentation: which probe family measures it, what it means, and how the documented score semantics apply.

## Honesty scope, stated up front

Zscaler documents the ZDX score's factors, its probing cadence, its lowest-of-the-hour rule, its 0-100 scale and all three bands (Good 66-100, Okay 34-65, Poor 0-33) - and does **not** publish the exact composite formula. This tool therefore **computes no score from metrics**. It classifies a given score against the three documented bands, explains each metric's documented meaning and probe-family attribution, and states plainly where the documentation stops. For raw metrics, no published threshold makes a value good or bad by itself - ZDX alert criteria are administrator-defined per rule - so the tool explains the metric and declines to grade it. Same no-invention rule as the rest of this site's tools.

## Input grammar

One metric per line, `metric = value`. Lines starting with `#` are comments.

- `score` - the composite ZDX score, a whole number from 0 to 100 (Zscaler rounds every score to the nearest whole number)
- `pft`, `dns`, `srt` - Web Probe times in milliseconds (Page Fetch Time, DNS Time, Server Response Time)
- `availability` - Web Probe availability, percent 0-100
- `path-latency`, `path-loss` - CloudPath metrics (milliseconds, percent)

## What you get back

Each metric renders as a reading card: its probe-family badge (Web Probe / CloudPath / composite), its documented meaning - Page Fetch Time requesting only the top-level page document, Server Response Time as the time to first byte - and, for the score, classification into the documented Good, Okay or Poor band, with the automatic root-cause-analysis note on Poor. When both probe families are present, the diagnostic split renders: bad web metrics over a clean path point at the application; a bad path indicts the network. The standing notes carry the documented semantics every reading rides on: five-minute probes, the lowest value of the hour as the hourly value, application scores averaging each user's lowest while department, location, city and organisation scores average the lowest value of each time interval, the three score types (Synthetic Probe, RUM and Combined) that can disagree for the same application, the roughly twenty-minute telemetry delay, and the small approximate-aggregation variance between API and dashboard.

Everything runs locally in your browser; nothing you paste leaves the page.

## Share results

First in the reading, **Share results** builds a link to this page, only when you press it, that carries the metrics as pasted after the `#`. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

Metrics can describe how an internal application performs (the reason the popover adds a caution line). Before a link is offered, the box is read for a credential a standard defines: a PEM private key ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), section 10), an `Authorization` line ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2), a `Cookie` line with a value ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), section 4.2.1), a JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), a password in a URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1), an AWS access key ID or a FortiOS `ENC` value; all read 2026-11-01. The grammar has no place for any of them, but a comment line is free text. One of them means no link: the popover names its line, and you replace it with a placeholder and press again. A value whose name only looks like a secret does not stop the link; the popover names the first one.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The box fills as a paste would and the page reads each metric. Nothing is contacted. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

## Sources

- Zscaler Reference Architecture: Zscaler Digital Experience (ZDX) - probe metrics, cadence, lowest-of-hour and group-averaging semantics
- Zscaler Help: Evaluating User Details - the documented Poor band (0-33) and its automatic root-cause analysis
- Zscaler Help: Understanding the ZDX API - the telemetry delay and aggregate-variance calibrations
- [Zscaler Help: Understanding the ZDX Score](https://help.zscaler.com/zdx/understanding-zdx-score) - the 0-100 scale, the three bands, the roll-up rules, whole-number rounding and the score types (read 2026-10-26)

The fragment rule behind Share results is [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.5 (read 2026-11-01), and the credentials its check looks for are defined in RFC 7468, RFC 9110, RFC 6265 and RFC 7519 (read the same day).
