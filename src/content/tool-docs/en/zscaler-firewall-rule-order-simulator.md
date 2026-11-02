## What this tool does

Paste a Zscaler Internet Access (ZIA) Firewall Filtering rule list in a small teaching grammar - one rule per line as `order | name | action | criteria` - plus an optional `flow:` line, and the simulator executes the documented policy semantics in front of you: rules sorted into ascending numerical order, the flow traced rule by rule with evaluation stopping at the first match, the verdict named (a rule, or the Default Firewall Filtering Rule for whatever fell through), and a pairwise shadow analysis listing rules that can never fire because an earlier rule already covers everything they could match.

## The grammar

Rules: `10 | allow-web | allow | proto=tcp port=443 dest=203.0.113.0/24 src=any`, with actions `allow`, `block` (silent drop), or `block-icmp` (block informing the client), and an optional `disabled` token. Criteria left out mean Any - and Any is ignored during evaluation, exactly as the vendor documents. Optional lines: `flow: proto=tcp port=8443 dest=203.0.113.7 src=10.0.0.5` to trace, and `default: allow|block` to model a super-admin edit of the Default rule's action. Lines starting with `#` are comments.

## What the semantics encode

Everything simulated is Zscaler's published behaviour: evaluation ascends the Rule Order and stops at the first match; a disabled rule is not enforced but keeps its place (the service skips it and moves on); the Default Firewall Filtering Rule is undeletable, always lowest precedence, its criteria fixed and only its action editable - and out of the box it blocks all traffic, which is why the simulator's default, absent a `default:` line, is block.

## Honest limits

The criteria model here is a deliberate teaching subset - protocol, ports, source, destination. Real Firewall Filtering rules add users, groups, departments, locations, network services and applications, destination countries, device trust levels, and time windows; the ordering semantics this tool teaches apply to all of them identically. The shadow analysis is pairwise only: a rule covered by several earlier rules jointly, but by none alone, is not flagged. Predefined system rules (Office 365, Zscaler service traffic) and Admin Rank order bounds are described in the paired article but not simulated.

## Share results

Under the verdict card (first in the reading when there is no flow line), **Share results** builds a link to this page, only when you press it, that carries the rules and the flow as pasted after the `#`. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

Rule names and addresses can identify your infrastructure (the reason the popover adds a caution line). Before a link is offered, the box is read for a credential a standard defines: a PEM private key ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), section 10), an `Authorization` line ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2), a `Cookie` line with a value ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), section 4.2.1), a JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), a password in a URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1), an AWS access key ID or a FortiOS `ENC` value; all read 2026-11-01. The grammar has no place for any of them, but rule names and comment lines are free text. One of them means no link: the popover names its line, and you replace it with a placeholder and press again. A value whose name only looks like a secret does not stop the link; the popover names the first one.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The box fills as a paste would and the page simulates the rules. Nothing is contacted. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

## Sources

Grounded in three Zscaler Help pages, each pinned with its access date in the tool manifest: About Firewall Filtering (evaluation order, the deny-by-default Default rule, the action verb set), Configuring the Firewall Filtering Policy (Rule Order, the Any-means-ignored convention, Admin Rank), and Editing the Default Firewall Filtering Rule (lowest precedence, undeletable, fixed criteria, super-admin action edit).

The fragment rule behind Share results is [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.5 (read 2026-11-01), and the credentials its check looks for are defined in RFC 7468, RFC 9110, RFC 6265 and RFC 7519 (read the same day).
