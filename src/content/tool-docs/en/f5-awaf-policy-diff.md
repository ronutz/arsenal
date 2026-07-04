## What it does

Paste two declarative security policies from F5 AWAF - Advanced WAF (formerly BIG-IP ASM - Application Security Manager) — a before and an after — and this compares them and classifies every security-relevant change as a relaxation or a tightening. It exists to answer the one question that matters after a tuning session: did this open a hole? It runs entirely in your browser and never contacts a BIG-IP.

## The distinction it draws

Not every relaxation is dangerous. Adding one allowed URL or parameter is a scoped, single-entity widening — the normal, correct way to clear a false positive. What deserves scrutiny is a relaxation that widens protection across the whole policy: switching enforcement to Transparent (which stops the entire policy blocking), disabling a violation or an evasion, turning Data Guard off, trusting a client-supplied X-Forwarded-For header, moving signatures to staging, or adding a wildcard entity that matches many URLs at once. The tool separates these policy-wide relaxations from the scoped ones, so a tuning diff does not quietly become a security regression.

## The verdict

If any policy-wide relaxation is present, the verdict is "opened a hole," and those changes are listed first, each with a concern level. If the widenings all stay entity-scoped, the verdict is "scoped changes only" — the safe zone for false-positive tuning. If every change increases protection, it is "tightened." It also lists the tightenings so you can see the full picture of what moved between the two policies.

## What it compares

It reads the security-relevant sections F5's declarative policy schema defines: enforcementMode, signature-settings staging, general.trustXff, data-guard, csrf-protection, the per-violation block flags under blocking-settings, the per-evasion enablement, and the URL, parameter, and file-type entity lists (where a name containing an asterisk is treated as a wildcard). These are the same field paths validated in the declarative-policy explainer and the evasion explainer.

## Grounding

The relaxation semantics follow F5's declarative WAF policy schema and the ASM documentation on how a Transparent policy and a cleared block flag stop enforcement, together with K70544352's rule that you relax only where a false positive occurred and scope it. Neither policy you paste is uploaded or leaves the page.
