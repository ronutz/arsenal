## What it does

Describe an FGCP cluster — each unit's monitored-interface failures, age, priority and serial, plus the override setting — and this tool runs the primary election, names the criterion that decided it, and tells you who would be primary if override were toggled. It runs entirely in your browser.

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

When toggling override would change nothing, it says that too — which rules out a whole line of investigation in one line.

## Reading the other outcomes

**Decided by monitored interfaces** means interface health settled it before anything else was consulted. Fix the down interface and the comparison moves on.

**Decided by serial number** means everything else tied. That is deterministic but arbitrary: if you want a specific unit preferred, set a priority rather than relying on which serial sorts higher.

## What it does not model

The election only. It does not model session survival across the failover, which depends on session pickup and on whether inspection was proxy-based, and it does not model split brain, which is a heartbeat-path failure rather than an election outcome. Those are covered in the FGCP high availability article.

## Where it fits

It pairs with the FortiGate FGCP high availability article, which explains why the default ordering exists and what else changes at failover. For NSE 4 candidates it supports objective 1.03.
