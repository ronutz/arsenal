## What it does

This tool decodes an F5 Distributed Cloud (XC) security event. Paste the event JSON - from the Console's security-events page, a global log receiver, or the API - and it lays out what happened: which security service produced the event, the action that was taken and whether the request was blocked, the request context, and the exact reason the event fired. It runs entirely in your browser.

## The four event types

XC produces four kinds of security event, and the tool identifies which one you pasted from the sec_event_type field. A WAF event comes from the application firewall and carries signatures, violations, and attack types. A Bot Defense event carries the bot verdict. A Service Policy event carries the policy and rule that matched. An API event carries OpenAPI validation results and policy hits. If the type tag is missing, the tool infers the type from the shape of the event.

## Action versus recommendation

A security event records both what the WAF recommended and what it actually did, and those are not always the same. The recommended (or calculated) action reflects the policy's verdict; the action taken reflects the enforcement mode. In monitoring mode - or while a signature is in staging - the WAF logs a full event with signatures and violations but does not block, so the action is report even though the signature matched. The tool shows both, and derives a plain disposition: blocked, reported, or allowed.

## The reason it fired

The most useful part of an event is why it fired, and that lives in different fields per type. For a WAF event, the tool lists each signature with its id, name, accuracy, and attack type, each violation with its context, and the detected attack types. For a Bot Defense event, it shows the insight (human, good bot, or malicious), the automation type, and the recommendation. For a Service Policy event, it names the policy, the rule, and the policy set. For an API event, it shows the matched policy and rule, the OpenAPI request and response validation status, and any signatures. Together with the request id, that is enough to either open a support case or build a precise exclusion.
