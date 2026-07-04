## What it does

Characterise a Traffic Learning suggestion from F5 AWAF - Advanced WAF (formerly BIG-IP ASM - Application Security Manager): its action, its learning score, the average violation rating, the learning mode, and whether the traffic behind it is trusted. The tool tells you whether accepting the suggestion loosens or tightens the policy, whether a loosening is a genuine false-positive fix or a security relaxation, and whether Automatic learning is about to enforce it for you. It is the bridge between the poisoning estimator and the false-positive triage, and it runs entirely in your browser.

## Loosening vs tightening

F5 sorts suggestions into two directions. Tightening suggestions make the policy more specific: remove a wildcard and add explicit entities, enforce a staged entity, make an attribute more specific. Accepting them generally improves security. Loosening suggestions relax the policy: add an allowed entity, allow a meta-character, relax an attribute, disable a violation or a signature. Adding a legitimate entity the policy simply had not learned is low-risk, but a loosening that reduces enforcement needs judgement, and the tool judges it by the violation rating: 1 or 2 is a likely false-positive fix, 3 needs investigation, 4 or 5 means you would be relaxing a real attack.

## The learning score and the poisoning vector

Each suggestion carries a learning score that shows how close the system is to accepting it, and the score rises as the violation rating falls. So the lowest-rated suggestions, the ones most likely to be false positives, reach auto-accept fastest. That is by design, but it is also exactly what an attacker feeding many low-rated violations drives up. When the mode is Automatic, the loosening reduces enforcement, the traffic is untrusted, and the score is climbing, the tool flags the poisoning vector and points you at the poisoning estimator to see how far off the auto-accept threshold is. In Manual learning a human must accept every suggestion, so nothing is enforced without review.

## The discipline

For any loosening that reduces enforcement, the tool restates F5's rule: relax the policy only where a false positive occurred, never where a real attack caused the violation. The violation rating is how you tell the two apart, which is why it drives the assessment.

## Grounding

The loosening and tightening categories come from F5 K03513854, and the learning-score behaviour, the auto-apply at 100% in Automatic mode, and the false-positive discipline come from the ASM learning documentation and K70544352. The tool models documented behaviour and does not depend on the exact (version-variable) REST suggestion JSON; you describe the suggestion from the Traffic Learning screen. Nothing you select leaves the page.
