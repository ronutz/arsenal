## What it does

Paste an F5XC - F5 Distributed Cloud `service_policy` as JSON and the tool spells out exactly how it matches: the server scope it applies to, the order its rules are evaluated in, and for each rule its action and the conditions that must hold. It reads the policy definition entirely in your browser and evaluates nothing against live traffic.

## What a service policy is

On the F5 Distributed Cloud platform, a service policy decides which requests reach a load balancer and which are turned away, the platform's equivalent of the request-matching logic you would write as an iRule on a classic BIG-IP. A policy has a **server scope** that says which servers it governs, a **disposition** that sets the default behaviour, and an ordered **rule list**. Order matters: the rules are evaluated in sequence, and the first one that matches decides the outcome, so reading them top to bottom is how you understand what the policy actually does.

## How a rule matches

Each rule pairs an **action**, such as allow or deny, with a set of conditions that must all hold for the rule to apply. The tool renders each condition the way the schema defines it:

- the **matcher** and what it inspects (a source, a header, a path, and so on);
- its **criteria**, whether it matches by exact value, by regular expression, or by prefix;
- the **and/or logic** combining multiple values;
- any **inversion**, where the match is negated; and
- the **case sensitivity** of the comparison.

Rendering these plainly is the value: a service policy in raw JSON is hard to read, and a single misread matcher or an inverted condition is exactly the kind of thing that allows or blocks the wrong traffic.

## Grounded in the schema

The field names and shapes the tool understands follow the official F5 Distributed Cloud OpenAPI schema for the service policy and its rules, so the decode reflects the real object rather than a guess. The tool is local and zero-egress: it parses and explains the JSON you paste, and it never contacts the platform or tests the policy against real requests. Malformed input is reported rather than throwing.

## Using it

Paste a `service_policy` JSON spec and read the server scope, the ordered rules, and each rule's action and conditions. The decode is deterministic and local.
