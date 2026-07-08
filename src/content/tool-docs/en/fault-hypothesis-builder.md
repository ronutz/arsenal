## What it does

Describe a fault through six structured fields - symptom, scope, recent change, timing, observed layer clues, and a domain preset - and a fixed registry of 25 original rules fires deterministically over that description. Out come ranked HYPOTHESES TO TEST across 13 fault domains (change regression, name resolution, TLS/PKI, capacity, path MTU, client-local, shared dependency, asymmetric path, identity chain, partial backend, application/backend, provisioning gap, external provider). Every hypothesis carries three honest parts: the evidence worth collecting, the observations that would SUPPORT it, and the observations that would WEAKEN it. Quality warnings check the input itself - "nothing changed" is flagged as a hypothesis to verify against the change record, not a fact. One click exports a Markdown worksheet ready for the ticket, the bridge chat, or a TAC case, with your checked evidence marked.

## What it deliberately is not

This tool structures; it never diagnoses. It makes no root-cause claims, performs no remediation, opens no network connections, and asks for no credentials or secrets. It does not replace vendor TAC, change approval, or production review - it makes your first hour with them better organized. The free-text notes (summary, impact, already tried) flow only into the exported worksheet; they never influence the ranking, so the engine's behavior stays fully deterministic.

## How the ranking works - and how it is verified

Each rule is a pure predicate over the structured input with a fixed point contribution to one hypothesis; scores accumulate, and the deterministic tie-break is registry order. The signal badge is a score band (strong ≥ 60, moderate ≥ 30, weak below), deliberately called "signal" rather than confidence: it describes which rules fired, not a probability about the world. The "Why this ranking?" panel exposes every fired rule with its points, so the advice is auditable.

Because there is no "correct" hypothesis set for an advisory tool, classic golden vectors do not apply. The verification model - set by this pilot for the whole Operations & Fieldcraft family - is RULE-FIRING SNAPSHOT VECTORS: for each test input, the build asserts exactly which rules fire, in what order, the exact ranked hypothesis list with scores and signal bands, and the exact warning set. Thirteen vectors (eight scenarios, five rejects) pin the current registry; any drift in rules, weights, or ranking breaks the build.

## API input

The API-parity entry takes a JSON object: `{"symptom", "scope", "changed": [], "timing", "clues": [], "preset", "notes": {"summary", "impact", "alreadyTried"}}`. All fields except `notes` use the closed vocabularies shown in the form; an out-of-vocabulary value is a format error, never a guess. `changed` must carry at least `nothing-known`.
