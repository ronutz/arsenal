## What this tool does

Paste a Check Point Access Control policy in a small teaching grammar - one or more `layer` declarations, their rules, and a `test` line - and the evaluator walks the connection through the layers in front of you. Each step names the rule that matched, says what that match actually meant, and flags the drops that log nothing. The output is a trace rather than a verdict, because the verdict on its own teaches nothing: the point is watching a connection get accepted by one layer and dropped by the next.

## The sentence it exists to teach

**Ordered layers are an AND, not an OR.** Accept in a layer means the connection *proceeds to the next layer*; it is allowed only when the last ordered layer accepts. A drop in any layer ends evaluation immediately, so a permit in an early layer cannot rescue traffic a later layer refuses - the exception belongs in the layer that would otherwise deny it. This is the behaviour people arriving from FortiGate, BIG-IP or a plain iptables chain most reliably get wrong, and it is the reason the trace shows "accepted, proceeds to the next layer" rather than a tick.

## The grammar

Layers: `layer Network ordered` or `layer DMZ inline`. Rules: `1 | permit internal | accept | src=10.0.0.0/8 dst=any svc=443`, with actions `accept`, `drop`, or `inline:<layer>` to gate a sub-policy. Add `nolog` to model a rule with Track set to None. Anything omitted means Any. One `test src=... dst=... svc=...` line supplies the connection. Lines starting with `#` are comments.

## What else it reports

Beyond the trace, the evaluator inspects the policy itself: a missing explicit cleanup rule, a cleanup rule with no logging (which defeats its only purpose), rules with Track set to None, and pairwise shadowing - a rule that can never fire because an earlier one already matches everything it would.

The silent-drop warning deserves its own mention. When nothing matches, the implicit cleanup rule drops the connection and records nothing at all. That is the single most expensive fact in a Check Point rule base for anyone troubleshooting, because the symptom is a connection that fails with no log entry to explain it, and it looks like a network fault rather than a policy decision.

## Honest limits

Service **names** are not resolved: `443` is a port number, not `https`. Mapping names to ports would be a guess about someone's object database. Shadowing analysis is **pairwise**, so a rule covered jointly by several earlier rules but by none alone is not flagged. IPv4 only. The grammar is a deliberate teaching subset - real rules add VPN, content, time, install-on and negation - but the layer semantics taught here apply to all of them identically.
