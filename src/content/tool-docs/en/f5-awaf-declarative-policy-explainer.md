## What it does

Paste an F5 AWAF - Advanced WAF (formerly BIG-IP ASM - Application Security Manager) declarative security policy, the JSON `{ "policy": { ... } }` you keep in source control, and the tool reads it back to you section by section in plain language: what each setting is, and, where it matters, what the specific value you set actually means for the policy's security. It is a decode-only explainer, grounded in F5's published declarative-policy schema, and it runs entirely in your browser.

## It reads a policy as a delta on its template

A declarative policy lists only its adjustments on top of a base template, so the single most important rule when reading one is that an absent section means the template's default applies, not that a protection is off. The tool honors that throughout: it explains only what the policy explicitly sets, always carries the reminder that anything not shown is inherited, and never reports a protection as disabled just because it is missing. Every security callout it makes is derived from a value the policy actually sets, never from an absence.

## What it covers

The tool recognizes about fifty-five top-level policy sections, grouped in reading order: identity (`name`, `description`, `template`), enforcement posture (`enforcementMode`, `signature-settings`, passive mode, and the `general` staging and X-Forwarded-For settings), automatic learning (Policy Builder), application context (application language, case sensitivity, server technologies), the traffic surface (URLs, parameters, file types, methods, headers, cookies), the protections (blocking settings, Data Guard, CSRF, brute-force, geolocation blocking, behavioral enforcement, and more), and content profiles (JSON, XML, GraphQL, OpenAPI). Each section is described from F5's own schema text, and anything the tool does not recognize is still acknowledged as present.

## The security callouts

Beyond describing sections, the tool reads the values that decide whether a policy actually protects. It raises a warning when `enforcementMode` is `transparent`, because the policy is then monitor-only and blocks nothing, even violations flagged to block. It notes when attack signatures are in staging (matched but not yet enforcing), when the policy trusts `X-Forwarded-For` for the client IP, when Data Guard is explicitly disabled, and when an enforced cookie is set without the Secure or HttpOnly attribute. Each is a state people routinely miss when skimming a policy by eye.

## Grounding and accuracy

Field descriptions are paraphrased from F5's published declarative-policy schema. F5 publishes the docs for five versions, v16.0, v16.1, v17.0, v17.1, and v17.5; the tool is grounded to the v17.1 schema, which is the latest with a complete published schema (the v17.5 schema page is not yet published). The core sections covered here are stable across the v16.x to v17.x line. Nothing you paste is uploaded or leaves the page; for a production decision, confirm any reading against the declarative-policy schema for your BIG-IP version.
