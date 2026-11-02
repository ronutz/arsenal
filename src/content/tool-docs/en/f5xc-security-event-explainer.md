## What it does

This tool decodes an F5 Distributed Cloud (XC) security event. Paste the event JSON - from the Console's security-events page, a global log receiver, or the API - and it lays out what happened: which security service produced the event, the action that was taken and whether the request was blocked, the request context, and the exact reason the event fired. It runs entirely in your browser.

## The four event types

XC produces four kinds of security event, and the tool identifies which one you pasted from the sec_event_type field. A WAF event comes from the application firewall and carries signatures, violations, and attack types. A Bot Defense event carries the bot verdict. A Service Policy event carries the policy and rule that matched. An API event carries OpenAPI validation results and policy hits. If the type tag is missing, the tool infers the type from the shape of the event.

## Action versus recommendation

A security event records both what the WAF recommended and what it actually did, and those are not always the same. The recommended (or calculated) action reflects the policy's verdict; the action taken reflects the enforcement mode. In monitoring mode - or while a signature is in staging - the WAF logs a full event with signatures and violations but does not block, so the action is report even though the signature matched. The tool shows both, and derives a plain disposition: blocked, reported, or allowed.

## The reason it fired

The most useful part of an event is why it fired, and that lives in different fields per type. For a WAF event, the tool lists each signature with its id, name, accuracy, and attack type, each violation with its context, and the detected attack types. For a Bot Defense event, it shows the insight (human, good bot, or malicious), the automation type, and the recommendation. For a Service Policy event, it names the policy, the rule, and the policy set. For an API event, it shows the matched policy and rule, the OpenAPI request and response validation status, and any signatures. Together with the request id, that is enough to either open a support case or build a precise exclusion.

## Share results

Under the event's type and disposition, **Share results** builds a link to this page, only when you press it, that carries a copy of the event after the `#`, never the event as pasted. F5's [Security Events Reference](https://docs.cloud.f5.com/docs-v2/platform/reference/security-events-reference) (read 2026-11-01) lists what an event can carry: `req_headers` ("Request headers"), `req_body` ("Request body"), `req_parameters`, `user` ("User identifier as configured in User Identification Policy"), `tenant`, and the client's address and location. Request headers hold cookies and `Authorization` values, and a body can hold a password. The page reads a fixed set of fields, so the copy holds only those: the event's type and name, action, result and recommendation; the method, host, path, client address, load balancer, namespace, request id and time; each signature's id, name, accuracy and attack type (never its `matching_info`, which can quote the request), each violation's name and context, the attack types, the bot verdict, and the service or API policy and rule. An envelope (a `message` string, an `events` page, a list) gives the one event the page reads. Before the link is offered, the page reads the copy again and must give the same reading, or there is no link; then the copy is searched for a credential still in a field the page shows (a token in the path): one means no link.

Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed. It also says that the copy keeps the host, path, client address, load balancer and namespace, so you can check them.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The copy fills the box as a paste would, and the page reads it. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
