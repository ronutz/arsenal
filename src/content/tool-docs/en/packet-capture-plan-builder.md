## What it does

Describe the path and the symptom through seven structured fields - path archetype, symptom, traffic class, intermediaries, transformation, capture access, and time behavior, plus a command-family preset - and a fixed registry of 35 original rules fires deterministically over that description. Out comes a PHASED CAPTURE PLAN: ranked capture points on 13 named boundaries (endpoint, pre/post-firewall, VIP-front, member-side, proxy-front/back, VPN outer/inner, resolver, egress, mirror), each with a vendor-neutral filter template and the observations it can establish; an interpretation matrix stating, for every candidate conclusion, what would SUPPORT it and what would WEAKEN it - decided IN ADVANCE, before a single packet is collected; a synchronization and authorization checklist; and minimal-exposure warnings for sensitive traffic classes. One click exports the plan as Markdown for the ticket, the bridge chat, or the capture request to another team.

## What it deliberately is not

Command builders answer "how do I capture?"; this tool answers "where, why, and what would it mean?" - and it stops there. It PLANS collection and never ingests capture files (that privacy boundary is structural, not policy). It provides no interception, evasion, or decryption-bypass guidance. Filter hints are templates with `<placeholders>`, never claimed accurate for a specific product version; preset notes name command families nominatively only. Capture authorization, retention, and access control are named as YOUR responsibility on every plan - the authorization rule fires unconditionally. Free-text labels and notes flow only into the export; they never influence the rules.

## How the plan is built - and how it is verified

Each rule is a pure predicate over the structured input contributing points to catalog capture points, plus optional expectations, checklist items, warnings, and interpretation-matrix candidates. Ranking is score-descending with catalog order as the deterministic tie-break; the signal badge is a score band (strong ≥ 60, moderate ≥ 30, weak below) describing which rules fired, never a probability. Phase 1 is the minimum viable set (top points scoring ≥ 30, capped at four, floor of two); phase 2 is the expansion. The "Why these points?" panel exposes every fired rule.

Verification follows the cluster's rule-firing snapshot model: for each test input, the build asserts exactly which rules fire, the exact ranked point list with scores and signal bands, the exact warning set, and - specific to this tool - the exact phase-1 set. Thirteen vectors (nine scenarios, four rejects) pin the current registry; any drift breaks the build.

## API input

The API-parity entry takes a JSON object: `{"archetype", "symptom", "trafficClass", "intermediaries", "transformation", "access", "timeBehavior", "preset", "notes": {"labels", "reference", "notes"}}`. All fields except `notes` use the closed vocabularies shown in the form; an out-of-vocabulary value is a format error, never a guess.
