## What it does

Paste two declarative security policies from F5 AWAF - Advanced WAF (formerly BIG-IP ASM - Application Security Manager), a before and an after, and this compares them and classifies every security-relevant change as a relaxation or a tightening. It exists to answer the one question that matters after a tuning session: did this open a hole? It runs entirely in your browser and never contacts a BIG-IP.

## The distinction it draws

Not every relaxation is dangerous. Adding one allowed URL or parameter is a scoped, single-entity widening: the normal, correct way to clear a false positive. What deserves scrutiny is a relaxation that widens protection across the whole policy: switching enforcement to Transparent (which stops the entire policy blocking), disabling a violation or an evasion, turning Data Guard off, trusting a client-supplied X-Forwarded-For header, moving signatures to staging, or adding a wildcard entity that matches many URLs at once. The tool separates these policy-wide relaxations from the scoped ones, so a tuning diff does not quietly become a security regression.

## The verdict

If any policy-wide relaxation is present, the verdict is "opened a hole," and those changes are listed first, each with a concern level. If the widenings all stay entity-scoped, the verdict is "scoped changes only", the safe zone for false-positive tuning. If every change increases protection, it is "tightened." It also lists the tightenings so you can see the full picture of what moved between the two policies.

## What it compares

It reads the security-relevant sections F5's declarative policy schema defines: enforcementMode, signature-settings staging, general.trustXff, data-guard, csrf-protection, the per-violation block flags under blocking-settings, the per-evasion enablement, and the URL, parameter, and file-type entity lists (where a name containing an asterisk is treated as a wildcard). These are the same field paths validated in the declarative-policy explainer and the evasion explainer.

## Grounding

The relaxation semantics follow F5's declarative WAF policy schema and the ASM documentation on how a Transparent policy and a cleared block flag stop enforcement, together with K70544352's rule that you relax only where a false positive occurred and scope it. Neither policy you paste is uploaded or leaves the page.

## Share results

Under the verdict, **Share results** builds a link to this page, only when you press it, that carries both policies as pasted after the `#`, named `before` and `after` like the two boxes, once the page has compared them. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed. Policies can name internal hosts, URLs and addresses, so the popover asks you to read both before you send the link. Both boxes go through the same check as the declarative-policy explainer's. Before a link is offered, the text is searched for a credential a standard defines: a PEM private key, an `Authorization` or `Proxy-Authorization` line with any scheme ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sections 11.6.2 and 11.7.2: the value "consists of credentials"), a `Cookie` or `Set-Cookie` line with a value ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sections 4.1.1, 4.2.1 and 8.4, where a cookie commonly holds a session identifier), a JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), a password in a URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1), an AWS access key ID or a FortiOS `ENC` value; all read 2026-11-01. One of them means no link: the popover names its line, and you replace it with a placeholder and press again. A value whose name only looks like a secret (a JSON member `token`, a `password=` in a URL's query) does not block the link; the popover names the first one so you can check it. The popover says which box the line is in.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** Both boxes fill as a paste would and the page compares them as usual. A link that lacks one of the two is ignored. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
