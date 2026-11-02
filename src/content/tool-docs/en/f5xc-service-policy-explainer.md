## What it does

Paste an F5XC - F5 Distributed Cloud `service_policy` as JSON and the tool spells out exactly how it matches: the server scope it applies to, the order its rules are evaluated in, and for each rule its action and the conditions that must hold. It reads the policy definition entirely in your browser and evaluates nothing against live traffic.

## What a service policy is

On the F5 Distributed Cloud platform, a service policy decides which requests reach a load balancer and which are turned away, the platform's equivalent of the request-matching logic you would write as an iRule on a classic BIG-IP. A policy has a **server scope** that says which servers it governs, a **disposition** that sets the default behaviour, and an ordered **rule list**. Order matters: the rules are evaluated in sequence, and the first one that matches decides the outcome, so reading them top to bottom is how you understand what the policy actually does.

## How a rule matches

Each rule pairs an **action**, such as allow or deny, with a set of conditions that must all hold for the rule to apply. The tool renders each condition the way the schema defines it:

- the **matcher** and what it inspects (a source, a header, a path, and so on);
- its **criteria**, whether it matches by exact value, by regular expression, or by prefix;
- the **and/or logic** combining multiple values;
- any **inversion**, where the match is negated; and
- the **case sensitivity** of the comparison.

Rendering these plainly is the value: a service policy in raw JSON is hard to read, and a single misread matcher or an inverted condition is exactly the kind of thing that allows or blocks the wrong traffic.

## Grounded in the schema

The field names and shapes the tool understands follow the official F5 Distributed Cloud OpenAPI schema for the service policy and its rules, so the decode reflects the real object rather than a guess. The tool is local and zero-egress: it parses and explains the JSON you paste, and it never contacts the platform or tests the policy against real requests. Malformed input is reported rather than throwing.

## Using it

Paste a `service_policy` JSON spec and read the server scope, the ordered rules, and each rule's action and conditions. The decode is deterministic and local.

## Share results

Under the overview, **Share results** builds a link to this page, only when you press it, that carries the policy as pasted after the `#`, once the page recognises it. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed. A policy can name internal hosts, address ranges, ASNs, and header and cookie names: the popover asks you to check them. The page renders every matcher with its values, so nothing can be cut out without changing the reading; a credential blocks the link instead. Before a link is offered, the policy is searched for a credential a standard defines: a PEM private key, an `Authorization` or `Proxy-Authorization` line with any scheme ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sections 11.6.2 and 11.7.2: the value "consists of credentials"), a `Cookie` or `Set-Cookie` line with a value ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), section 8.4: servers "commonly store a nonce (or "session identifier") in a cookie"), a JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), a password in a URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1), an AWS access key ID or a FortiOS `ENC` value, and two things F5 Distributed Cloud's own schema defines: a SecretType secret, a `clear_secret_info` URL or a `blindfold_secret_info` location (the [XC API reference](https://docs.cloud.f5.com/docs-v2/api/views-http-loadbalancer): "SecretType is used in an object to indicate a sensitive/confidential field"), and an `Authorization` header matcher with a literal value; all read 2026-11-01. One of them means no link: the popover names its line, and you replace it with a placeholder and press again. A value whose name only looks like a secret (a JSON member `token`, a `token=` in a query, an `X-Api-Key` or cookie matcher) does not block the link; the popover names the first one so you can check it.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The policy fills the box as a paste would, and the page reads it (decoded, never evaluated). The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
