## What this tool does

Paste a Zscaler Internet Access (ZIA) Firewall Filtering rule list in a small teaching grammar - one rule per line as `order | name | action | criteria` - plus an optional `flow:` line, and the simulator executes the documented policy semantics in front of you: rules sorted into ascending numerical order, the flow traced rule by rule with evaluation stopping at the first match, the verdict named (a rule, or the Default Firewall Filtering Rule for whatever fell through), and a pairwise shadow analysis listing rules that can never fire because an earlier rule already covers everything they could match.

## The grammar

Rules: `10 | allow-web | allow | proto=tcp port=443 dest=203.0.113.0/24 src=any`, with actions `allow`, `block` (silent drop), or `block-icmp` (block informing the client), and an optional `disabled` token. Criteria left out mean Any - and Any is ignored during evaluation, exactly as the vendor documents. Optional lines: `flow: proto=tcp port=8443 dest=203.0.113.7 src=10.0.0.5` to trace, and `default: allow|block` to model a super-admin edit of the Default rule's action. Lines starting with `#` are comments.

## What the semantics encode

Everything simulated is Zscaler's published behavior: evaluation ascends the Rule Order and stops at the first match; a disabled rule is not enforced but keeps its place (the service skips it and moves on); the Default Firewall Filtering Rule is undeletable, always lowest precedence, its criteria fixed and only its action editable - and out of the box it blocks all traffic, which is why the simulator's default, absent a `default:` line, is block.

## Honest limits

The criteria model here is a deliberate teaching subset - protocol, ports, source, destination. Real Firewall Filtering rules add users, groups, departments, locations, network services and applications, destination countries, device trust levels, and time windows; the ordering semantics this tool teaches apply to all of them identically. The shadow analysis is pairwise only: a rule covered by several earlier rules jointly, but by none alone, is not flagged. Predefined system rules (Office 365, Zscaler service traffic) and Admin Rank order bounds are described in the paired article but not simulated.

## Sources

Grounded in three Zscaler Help pages, each pinned with its access date in the tool manifest: About Firewall Filtering (evaluation order, the deny-by-default Default rule, the action verb set), Configuring the Firewall Filtering Policy (Rule Order, the Any-means-ignored convention, Admin Rank), and Editing the Default Firewall Filtering Rule (lowest precedence, undeletable, fixed criteria, super-admin action edit).
