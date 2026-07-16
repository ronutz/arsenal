## What it does

Describe the path as you believe it runs - archetype, name resolution, intermediaries, address transformation, TLS behavior, authentication flow, and return path, plus a command-family preset - and a fixed registry of 27 original rules builds the model deterministically. Out comes a LAYERED FLOW-PATH MAP: the forward hop chain in a canonical order, rendered as a diagram with transformation and TLS markers on each node; the resolution and identity SIDE-FLOWS that run outside the primary path; the TLS segment map (each termination is a separate certificate, SNI, and cipher story); the transformation points where addresses - and therefore log identity - change meaning; evidence points naming where enforcement and logging must be established; and, above all, RANKED FAILURE-DOMAIN CANDIDATES, each with what would SUPPORT it and what would WEAKEN it. Unknown selections are never papered over: they surface as an explicit unknowns list, as quality warnings, and as score for the "path not established" domain itself.

## What it deliberately is not

The map is a PROPOSED MODEL assembled from your selections - never discovered topology. The engine's baseline rule fires on every run and says exactly that, and the verification checklist starts with confirming each hop with its owner. When two or more middleboxes are modeled, the chain uses a canonical assumed order and a rule tells you so. The tool makes no network calls, performs no discovery, claims no vendor packet-processing order, and suggests no control-bypass paths. Exports describe internal topology, so the topology-sensitivity warning also fires on every run. Free-text labels and notes flow only into the export; they never influence the rules.

## How the model is built - and how it is verified

Node insertion follows one canonical order (client, SSE edge, firewall, load balancer, proxy, VPN gateway pair, server); transformations attach to the most plausible node by a fixed preference; TLS segments derive from the declared behavior against the TLS-capable nodes actually modeled - and when the two disagree (terminate-once declared with no capable node), the model flags the inconsistency instead of inventing a terminator. Rules are pure predicates contributing points to failure-domain candidates; ranking is score-descending with definition order as the deterministic tie-break; the signal badge is a score band (strong ≥ 60, moderate ≥ 30, weak below), never a probability.

Verification follows the cluster's rule-firing snapshot model with an FPR-specific pin: for each test input, the build asserts exactly which rules fire, the exact ranked domain list, the exact warning set, and the exact forward HOP SEQUENCE - the chain construction itself is frozen. Thirteen vectors (nine scenarios, four rejects) pin the current registry; any drift breaks the build.

## API input

The API-parity entry takes a JSON object: `{"archetype", "resolution", "intermediaries", "transformation", "tls", "auth", "returnPath", "preset", "notes": {"nodeLabels", "title", "notes"}}`. All fields except `notes` use the closed vocabularies shown in the form; an out-of-vocabulary value is a format error, never a guess.
