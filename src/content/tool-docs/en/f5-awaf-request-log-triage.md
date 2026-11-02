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

## Share results

Under the verdict, **Share results** builds a link to this page, only when you press it, that never carries the log line as pasted. An ASM line can hold the whole request: F5's field reference ([Fields in ASM Violations event messages](https://techdocs.f5.com/en-us/bigip-16-0-0/external-monitoring-of-big-ip-systems-implementations/event-messages-and-attack-types.html), the latest edition F5 publishes, read 2026-11-01) lists `request` ("Request string sent by client", headers included), `headers`, `query_string`, `response`, `username` and `session_id` beside the fields this page reads, and the CEF form carries the request as `cs3`. A cookie holds a session identifier ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), section 8.4) and an `Authorization` value "consists of credentials" ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2), and neither can be cut out of a free-form line safely.

So the link carries a copy rebuilt from the fields the page reads and shows (the policy, the violations, the rating, the support ID, the status, the client address, the method, the protocol, the URI, the attack type and the X-Forwarded-For value), written in F5's key-value form after `ASM:`, or after a bare CEF header for a CEF line, so the page shows the same format. Everything else stays out: the request, its headers and body, the query string, the response, the user name, the session and the device's names. Before the link is offered, the copy is read by the page's own parser and must give the same reading, or there is no link; and it goes through the site's check for credentials still in a field the page shows (a token in the URI, or a request the parser read as the URI), which blocks the link and names what it found. Text that is not an ASM line has no fields to copy, so the popover says there is no link. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed. The copy keeps the client address and the URI, and the popover asks you to check them.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The copy fills the box as a paste would and the page reads it. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
