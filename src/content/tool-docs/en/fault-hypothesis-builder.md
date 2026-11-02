## What it does

Describe a fault through six structured fields - symptom, scope, recent change, timing, observed layer clues, and a domain preset - and a fixed registry of 25 original rules fires deterministically over that description. Out come ranked HYPOTHESES TO TEST across 13 fault domains (change regression, name resolution, TLS/PKI, capacity, path MTU, client-local, shared dependency, asymmetric path, identity chain, partial backend, application/backend, provisioning gap, external provider). Every hypothesis carries three honest parts: the evidence worth collecting, the observations that would SUPPORT it, and the observations that would WEAKEN it. Quality warnings check the input itself - "nothing changed" is flagged as a hypothesis to verify against the change record, not a fact. One click exports a Markdown worksheet ready for the ticket, the bridge chat, or a TAC case, with your checked evidence marked.

## What it deliberately is not

This tool structures; it never diagnoses. It makes no root-cause claims, performs no remediation, opens no network connections, and asks for no credentials or secrets. It does not replace vendor TAC, change approval, or production review - it makes your first hour with them better organised. The free-text notes (summary, impact, already tried) flow only into the exported worksheet; they never influence the ranking, so the engine's behaviour stays fully deterministic.

## How the ranking works - and how it is verified

Each rule is a pure predicate over the structured input with a fixed point contribution to one hypothesis; scores accumulate, and the deterministic tie-break is registry order. The signal badge is a score band (strong ≥ 60, moderate ≥ 30, weak below), deliberately called "signal" rather than confidence: it describes which rules fired, not a probability about the world. The "Why this ranking?" panel exposes every fired rule with its points, so the advice is auditable.

Because there is no "correct" hypothesis set for an advisory tool, classic golden vectors do not apply. The verification model - set by this pilot for the whole Operations & Fieldcraft family - is RULE-FIRING SNAPSHOT VECTORS: for each test input, the build asserts exactly which rules fire, in what order, the exact ranked hypothesis list with scores and signal bands, and the exact warning set. Thirteen vectors (eight scenarios, five rejects) pin the current registry; any drift in rules, weights, or ranking breaks the build.

## Share results

Under the worksheet's heading, **Share results** builds a link to this page, only when you press it, that carries every field of the form after the `#`: the four choices by their ids (`symptom`, `scope`, `timing`, `preset`, always), the ticked changes and clues (`changed`, `clues`, in the form's order) and the three notes as typed (`summary`, `impact`, `alreadytried`). Its popover says first what the link carries, then a caution of its own (notes can name the affected service, its users and hosts), then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

Your ticks are not in it: they are your own progress on this page (the Markdown export carries them), and they belong to the result, not to what you typed.

The notes are where host names, customers, people and ticket numbers go, so before a link is offered they go through the site's secrets check. A value that is a credential by its format means no link, and the popover names the note: a PEM private key ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), sections 10 and 11), Authorization credentials ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2), a Cookie line ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), section 4.2.1), a JWS or JWE (the serialisation JWTs use, [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), a password in a URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1), an AWS access key ID or a FortiOS `ENC` value. Put a placeholder in its place and press again. A value whose name only looks like a secret (`db_password=...`) still gets a link, and the caution line names the note so you check it first.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so the form is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The form and the notes are set, the evidence ticks start empty, and the hypotheses are ranked as they are on a change; nothing is fetched. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

## API input

The API-parity entry takes a JSON object: `{"symptom", "scope", "changed": [], "timing", "clues": [], "preset", "notes": {"summary", "impact", "alreadyTried"}}`. All fields except `notes` use the closed vocabularies shown in the form; an out-of-vocabulary value is a format error, never a guess. `changed` must carry at least `nothing-known`.
