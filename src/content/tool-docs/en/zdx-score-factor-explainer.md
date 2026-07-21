# ZDX score factor explainer

Paste the metrics Zscaler Digital Experience exposes - the composite score, the Web Probe metrics, the CloudPath metrics - and read back what each one is, per the vendor's own documentation: which probe family measures it, what it means, and how the documented score semantics apply.

## Honesty scope, stated up front

Zscaler documents the ZDX score's factors, its probing cadence, its lowest-of-the-hour rule, and the Poor band - and does **not** publish the exact composite formula. This tool therefore **computes no score from metrics**. It classifies a given score against the documented Poor band (0-33), explains each metric's documented meaning and probe-family attribution, and states plainly where the documentation stops. For raw metrics, no published threshold makes a value good or bad by itself - ZDX alert criteria are administrator-defined per rule - so the tool explains the metric and declines to grade it. Same no-invention rule as the rest of this site's tools.

## Input grammar

One metric per line, `metric = value`. Lines starting with `#` are comments.

- `score` - the composite ZDX score, a 1-100 value
- `pft`, `dns`, `srt` - Web Probe times in milliseconds (Page Fetch Time, DNS Time, Server Response Time)
- `availability` - Web Probe availability, percent 0-100
- `path-latency`, `path-loss` - CloudPath metrics (milliseconds, percent)

## What you get back

Each metric renders as a reading card: its probe-family badge (Web Probe / CloudPath / composite), its documented meaning - Page Fetch Time requesting only the top-level page document, Server Response Time as the time to first byte - and, for the score, classification against the documented Poor band with the automatic root-cause-analysis note. When both probe families are present, the diagnostic split renders: bad web metrics over a clean path point at the application; a bad path indicts the network. The standing notes carry the documented semantics every reading rides on: five-minute probes, the lowest score of the hour as the hourly score, group scores averaging each user's lowest, the roughly twenty-minute telemetry delay, and the small approximate-aggregation variance between API and dashboard.

Everything runs locally in your browser; nothing you paste leaves the page.

## Sources

- Zscaler Reference Architecture: Zscaler Digital Experience (ZDX) - probe metrics, cadence, lowest-of-hour and group-averaging semantics
- Zscaler Help: Evaluating User Details - the documented Poor band (0-33) and its automatic root-cause analysis
- Zscaler Help: Understanding the ZDX API - the telemetry delay and aggregate-variance calibrations
