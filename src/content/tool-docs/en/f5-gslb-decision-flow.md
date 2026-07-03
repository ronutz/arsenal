# GSLB decision-flow explainer

Paste `gtm wideip` and `gtm pool` stanzas (as `tmsh list gtm wideip a <name>` and `tmsh list gtm pool a <name>` print them) and the two-tier BIG-IP DNS decision renders as it really runs.

The wide-IP tier shows the pool-selection method (`pool-lb-mode`, default round-robin) with the attached pools, their order and ratio values, and the wide-IP settings that shape answers: persistence, last-resort-pool, failure-rcode behavior, and the decision-log verbosity knob that lets you watch this same flow in the logs.

The pool tier renders the three-step chain: preferred (`load-balancing-mode`), alternate (`alternate-mode`), fallback (`fallback-mode`), each step carrying the vendor's semantics for the tier and the method. The defaults are applied and labeled when an attribute is absent: round-robin, round-robin, return-to-dns.

Underneath, deterministic observations cross-check the configuration against the documented grammar and the Load Balancing manual's rules: methods outside a tier's admitted token list, the fallback tier's ignores-availability property stated on every resolved chain, Fallback IP wiring (the method with no address, or an address no tier uses), the dynamic-ratio applicability set, zeroed QoS coefficients, member ratios no tier consumes, the Global Availability pairing rule, and the topology-at-both-tiers warning that wants each pool's fallback set to None.

A single method name explains that one method, including which tiers admit it and where its decision signal comes from (LDNS-path probing, server-side statistics, or none). The word `methods` lists both catalogues.

Everything runs locally; nothing you paste leaves the page.
