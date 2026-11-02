# ZIA SSL Bypass Planner

## What it does

Paste a list of applications or destinations - one per line, in a four-field grammar - and receive a deterministic TLS inspection plan. Each asset gets one of three verdicts: **Inspect** (the default, feeding every content engine), **Do Not Inspect via policy rule** (the Edge-level exemption for governance categories and for pinned applications on paths no agent controls), or **Client Connector bypass** (the cleanest exemption for pinned applications where ZCC controls the path - the traffic never enters the tunnel, paired with a policy rule as defense in depth). Every verdict carries its sourced rationale; every bypass carries a blind-spot ledger naming what stops seeing this flow; and whenever anything goes uninspected, the plan appends the outside-backstop checklist - the Untrusted Server Certificates action, OCSP via stapling, the Minimum TLS Version floor, and Block No-SNI.

## The grammar

One asset per line, four pipe-separated fields; lines starting with `#` are comments:

```
<name> | pinned|clean | regulated|general | agent|no-agent
```

`pinned` marks a certificate-pinning application (it will not accept a certificate regenerated under the inspection CA and fails closed under interception). `regulated` marks a governance category that policy or law requires to stay sealed. `agent` marks a path the Zscaler Client Connector controls.

## Reading the plan

The summary counts the verdicts; the cards walk each asset's reasoning; the ordering note carries the doctrine that Do Not Inspect carve-outs belong at high order, above the Inspect body, because SSL policy rules evaluate in ascending order with first match. When every asset inspects, there is no bypass ledger and no backstop debt - and the plan says so. Every policy exemption the planner recommends is a Do Not Inspect rule set to **Evaluate Other Policies**, because that is the form that keeps the outside backstops and the web policies in force; a note in the plan explains that **Bypass Other Policies** offers no backstops and also skips URL Filtering and Cloud App Control, and that traffic bypassed at the Client Connector never reaches the Edge at all.

## Honesty

The grammar is a deliberate teaching subset: real bypass planning also scopes rules by users, groups, and locations, and weighs application specifics this planner does not model. The decision logic - pinning forces an exemption, governance seals a category, everything else inspects, and every bypass is a priced blind spot - is the durable part. All computation is local; asset names never leave the page.

## Share results

Under the summary counts, **Share results** builds a link to this page, only when you press it, that carries the assets as pasted after the `#`. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

Asset names can identify your internal applications (the reason the popover adds a caution line). Before a link is offered, the box is read for a credential a standard defines: a PEM private key ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), section 10), an `Authorization` line ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2), a `Cookie` line with a value ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), section 4.2.1), a JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), a password in a URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1), an AWS access key ID or a FortiOS `ENC` value; all read 2026-11-01. The grammar has no place for any of them, but asset names and comment lines are free text. One of them means no link: the popover names its line, and you replace it with a placeholder and press again. A value whose name only looks like a secret does not stop the link; the popover names the first one.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The box fills as a paste would and the page plans the inspection. Nothing is contacted. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

## Sources

Grounded in Zscaler's SSL inspection documentation (Configuring the SSL/TLS Inspection Policy; About SSL Inspection) and the Data Protection reference architecture, access date 2026-07-21. The two forms of Do Not Inspect, and the settings each offers, were re-read on [Configuring SSL/TLS Inspection Policy](https://help.zscaler.com/zia/configuring-ssltls-inspection-policy) (read 2026-10-26). The paired Learn article is *ZIA SSL Inspection: Policy and Bypasses*.

The fragment rule behind Share results is [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.5 (read 2026-11-01), and the credentials its check looks for are defined in RFC 7468, RFC 9110, RFC 6265 and RFC 7519 (read the same day).
