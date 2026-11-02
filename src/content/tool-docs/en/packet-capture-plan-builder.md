## What it does

Describe the path and the symptom through seven structured fields - path archetype, symptom, traffic class, intermediaries, transformation, capture access, and time behaviour, plus a command-family preset - and a fixed registry of 35 original rules fires deterministically over that description. Out comes a PHASED CAPTURE PLAN: ranked capture points on 13 named boundaries (endpoint, pre/post-firewall, VIP-front, member-side, proxy-front/back, VPN outer/inner, resolver, egress, mirror), each with a vendor-neutral filter template and the observations it can establish; an interpretation matrix stating, for every candidate conclusion, what would SUPPORT it and what would WEAKEN it - decided IN ADVANCE, before a single packet is collected; a synchronization and authorization checklist; and minimal-exposure warnings for sensitive traffic classes. One click exports the plan as Markdown for the ticket, the bridge chat, or the capture request to another team.

## What it deliberately is not

Command builders answer "how do I capture?"; this tool answers "where, why, and what would it mean?" - and it stops there. It PLANS collection and never ingests capture files (that privacy boundary is structural, not policy). It provides no interception, evasion, or decryption-bypass guidance. Filter hints are templates with `<placeholders>`, never claimed accurate for a specific product version; preset notes name command families nominatively only. Capture authorization, retention, and access control are named as YOUR responsibility on every plan - the authorization rule fires unconditionally. Free-text labels and notes flow only into the export; they never influence the rules.

## How the plan is built - and how it is verified

Each rule is a pure predicate over the structured input contributing points to catalogue capture points, plus optional expectations, checklist items, warnings, and interpretation-matrix candidates. Ranking is score-descending with catalogue order as the deterministic tie-break; the signal badge is a score band (strong ≥ 60, moderate ≥ 30, weak below) describing which rules fired, never a probability. Phase 1 is the minimum viable set (top points scoring ≥ 30, capped at four, floor of two); phase 2 is the expansion. The "Why these points?" panel exposes every fired rule.

Verification follows the cluster's rule-firing snapshot model: for each test input, the build asserts exactly which rules fire, the exact ranked point list with scores and signal bands, the exact warning set, and - specific to this tool - the exact phase-1 set. Thirteen vectors (nine scenarios, four rejects) pin the current registry; any drift breaks the build.

## Share results

First in the plan, after its warnings, **Share results** builds a link to this page, only when you press it, that carries every field of the form after the `#`: the eight choices by their ids (`archetype`, `symptom`, `trafficclass`, `intermediary`, `transform`, `access`, `timebehavior`, `preset`, always) and the three notes as typed (`labels`, `reference`, `notes`). Its popover says first what the link carries, then a caution of its own (endpoint labels and notes can name hosts, addresses and the incident ticket), then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

Your ticks are not in it: they are your own progress on this page (the Markdown export carries them), and they belong to the result, not to what you typed.

The notes are where host names, customers, people and ticket numbers go, so before a link is offered they go through the site's secrets check. A value that is a credential by its format means no link, and the popover names the note: a PEM private key ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), sections 10 and 11), Authorization credentials ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2), a Cookie line ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), section 4.2.1), a JWS or JWE (the serialisation JWTs use, [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), a password in a URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1), an AWS access key ID or a FortiOS `ENC` value. Put a placeholder in its place and press again. A value whose name only looks like a secret (`db_password=...`) still gets a link, and the caution line names the note so you check it first.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so the form is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The choices and notes are set, the checklist ticks start empty, and the plan is built as it is on a change; nothing is captured or fetched. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

## API input

The API-parity entry takes a JSON object: `{"archetype", "symptom", "trafficClass", "intermediaries", "transformation", "access", "timeBehavior", "preset", "notes": {"labels", "reference", "notes"}}`. All fields except `notes` use the closed vocabularies shown in the form; an out-of-vocabulary value is a format error, never a guess.
