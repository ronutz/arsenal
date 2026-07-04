## What it does

Paste an F5 AWAF - Advanced WAF (formerly BIG-IP ASM - Application Security Manager) request-log entry, either the syslog key-value line or the CEF line you see in your SIEM, and this pulls out the fields that matter: the policy, the support ID for log correlation, the request status, the violation rating, the client IP, the method, and the URI. It classifies each violation into a triage category and gives F5's rating-based verdict for the whole request, then points you at the false-positive triage tool for the per-violation fix. It is a decode-only tool that runs entirely in your browser.

## Why a log parser, not a support-ID decoder

A support ID is an opaque correlation reference: it lets you find one exact request in the event log, but it does not encode the violations. In the log line the support ID sits in its own field next to the actual list of violations and the violation rating, so the useful thing to read is the whole log entry, not the number. This tool surfaces the support ID for correlation and reads the violations from the line; it never tries to decode the number into violations, because that information is not in the number.

## The verdict comes from the rating

If the log carries a violation_rating, the tool applies F5's scale: a 4 or 5 is most likely a real attack and blocks even when Block flags are off, so you clear any learning suggestion rather than relaxing; a 3 is ambiguous and needs investigation; a 1 or 2 is usually a genuine false positive you can fix if you confirm it is legitimate. Older log formats omit the rating, and the tool says so and points you to the Requests screen to read it.

## Both formats, and the bridge

The parser handles the legacy key-value format (fields like policy_name, violations, support_id, violation_rating, request_status, ip_client, method, uri) and CEF (resolving externalId as the support ID and the csN label fields for policy and attack type). Once it has the violations classified, take each one into the false-positive triage tool with its category and the rating to get the scoped remediation, so a blocked request in your SIEM turns into a concrete, correctly-scoped tuning decision.

## Grounding

The field names and violation classification come from F5's ASM logging documentation, and the rating verdict from the ASM reporting guidance (rating 4-5 attack, 1-2 false positive). Nothing you paste is uploaded or leaves the page. A log line can contain a client IP and URI, so treat it as you would any request data.
