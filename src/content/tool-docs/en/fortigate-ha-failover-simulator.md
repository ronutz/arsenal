## What it does

Describe an FGCP cluster (each unit's monitored-interface failures, age, priority and serial, plus the override setting) and this tool runs the primary election, names the criterion that decided it, and tells you who would be primary if override were toggled. It runs entirely in your browser.

## The question it answers

"Why is the unit with the higher priority not the primary?"

That question is asked constantly, and the answer is almost always the same. With override **disabled**, which is the default, FGCP compares **age before priority**. A unit that rebooted has low age, so it stays secondary no matter how high its priority is.

That is not a bug and it is not a misconfiguration. The default exists so a flapping unit cannot repeatedly seize and lose the primary role, because each seizure is a disruption to traffic. Fortinet chose stability over preference, and the setting to change it is right there.

## The comparison order

| Order | Criterion | Wins |
|---|---|---|
| 1 | Failed monitored interfaces | Fewer |
| 2 | Age (override disabled) | Higher |
| 3 | Priority | Higher |
| 4 | Serial number | Deterministic tie-break |

Enabling override moves **priority above age**, so positions 2 and 3 swap. Monitored interfaces stay first in both modes, and serial stays last.

The tool shows the order actually in force for your input rather than the generic one, because that is the part people misremember.

## The counterfactual is the useful output

Alongside the winner, the tool computes who would be primary with override toggled. When that differs, it says so explicitly.

That matters because "FGT-B is primary" is a fact, and "with override enabled FGT-A would be primary instead, and that single setting is what decides this cluster" is a decision. The second is what someone actually needs when they are looking at a cluster behaving unexpectedly.

When toggling override would change nothing, it says that too, which rules out a whole line of investigation in one line.

## Reading the other outcomes

**Decided by monitored interfaces** means interface health settled it before anything else was consulted. Fix the down interface and the comparison moves on.

**Decided by serial number** means everything else tied. That is deterministic but arbitrary: if you want a specific unit preferred, set a priority rather than relying on which serial sorts higher.

## What it does not model

The election only. It does not model session survival across the failover, which depends on session pickup and on whether inspection was proxy-based, and it does not model split brain, which is a heartbeat-path failure rather than an election outcome. Those are covered in the FGCP high availability article.

## Share results

Under the primary and its findings, **Share results** builds a link to this page, only when you press it, that carries the box as pasted after the `#`. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

The directive lines name your units and their serial numbers (the reason the popover adds a caution line), and the page reads only the `member:` and `override:` lines, so a `config system ha` block pasted beside them would travel too, with its cluster password. Before a link is offered, the box is read for a credential FortiOS or a standard defines: a `set` line of a setting the [FortiOS 7.6.8 CLI reference](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) types as a password (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd` and the rest; read 2026-11-01) or the `name` of an SNMP community ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), section 3.2.5), any `ENC` value (Fortinet's advisory [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007), read 2026-11-01: such data posted where others can read it "should currently be considered "easy to decrypt""), a `psksecret=` or `password=` pair of the same names on a directive line, a PEM private key ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), a JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), an `Authorization` line ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2), a password in a URL or an AWS access key ID. One of them means no link: the popover names its line, and you replace it with a placeholder and press again, so what you share is exactly what you chose (a value is never replaced inside a pasted box, which would change what was sent). A value whose name only looks like a secret does not stop the link; the popover names the first one.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The box fills as a paste would and the page runs the election, counterfactual included. Nothing is contacted. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

## Where it fits

It pairs with the FortiGate FGCP high availability article, which explains why the default ordering exists and what else changes at failover. For NSE 4 candidates it supports objective 1.03.
