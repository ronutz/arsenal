## What it does

Paste an F5 AWAF - Advanced WAF (formerly BIG-IP ASM - Application Security Manager) declarative security policy, the JSON `{ "policy": { ... } }` you keep in source control, and the tool reads it back to you section by section in plain language: what each setting is, and, where it matters, what the specific value you set actually means for the policy's security. It is a decode-only explainer, grounded in F5's published declarative-policy schema, and it runs entirely in your browser.

## It reads a policy as a delta on its template

A declarative policy lists only its adjustments on top of a base template, so the single most important rule when reading one is that an absent section means the template's default applies, not that a protection is off. The tool honours that throughout: it explains only what the policy explicitly sets, always carries the reminder that anything not shown is inherited, and never reports a protection as disabled just because it is missing. Every security callout it makes is derived from a value the policy actually sets, never from an absence.

## What it covers

The tool recognises about fifty-five top-level policy sections, grouped in reading order: identity (`name`, `description`, `template`), enforcement posture (`enforcementMode`, `signature-settings`, passive mode, and the `general` staging and X-Forwarded-For settings), automatic learning (Policy Builder), application context (application language, case sensitivity, server technologies), the traffic surface (URLs, parameters, file types, methods, headers, cookies), the protections (blocking settings, Data Guard, CSRF, brute-force, geolocation blocking, behavioural enforcement, and more), and content profiles (JSON, XML, GraphQL, OpenAPI). Each section is described from F5's own schema text, and anything the tool does not recognise is still acknowledged as present.

## The security callouts

Beyond describing sections, the tool reads the values that decide whether a policy actually protects. It raises a warning when `enforcementMode` is `transparent`, because the policy is then monitor-only and blocks nothing, even violations flagged to block. It notes when attack signatures are in staging (matched but not yet enforcing), when the policy trusts `X-Forwarded-For` for the client IP, when Data Guard is explicitly disabled, and when an enforced cookie is set without the Secure or HttpOnly attribute. Each is a state people routinely miss when skimming a policy by eye.

## Grounding and accuracy

Field descriptions are paraphrased from F5's published declarative-policy schema. F5 publishes the docs for five versions, v16.0, v16.1, v17.0, v17.1, and v17.5; the tool is grounded to the v17.1 schema, which is the latest with a complete published schema (the v17.5 schema page is not yet published). The core sections covered here are stable across the v16.x to v17.x line. Nothing you paste is uploaded or leaves the page; for a production decision, confirm any reading against the declarative-policy schema for your BIG-IP version.

## Share results

Under the overview and its security notes, **Share results** builds a link to this page, only when you press it, that carries the policy as pasted after the `#`, once the page has read it as a policy. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed. A policy can name internal hosts, URLs, parameter and cookie names and addresses, so the popover adds a line asking you to read it before you send the link.

F5's declarative policy schema ([v17.1 schema description](https://clouddocs.f5.com/products/waf-declarative-policy/declarative_policy_v17_1.html), read 2026-11-01) defines no property that holds a password or a key, but a policy holds URLs (`webhooks[].url`, `open-api-files[].link`) and whatever was pasted with it. Before a link is offered, the text is searched for a credential a standard defines: a PEM private key, an `Authorization` or `Proxy-Authorization` line with any scheme ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sections 11.6.2 and 11.7.2: the value "consists of credentials"), a `Cookie` or `Set-Cookie` line with a value ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sections 4.1.1, 4.2.1 and 8.4, where a cookie commonly holds a session identifier), a JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), a password in a URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1), an AWS access key ID or a FortiOS `ENC` value; all read 2026-11-01. One of them means no link: the popover names its line, and you replace it with a placeholder and press again. A value whose name only looks like a secret (a JSON member `token`, a `password=` in a URL's query) does not block the link; the popover names the first one so you can check it. A webhook's URL is named the same way, because the receiving service often puts its token in it.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The policy fills the box as a paste would and the page explains it. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
