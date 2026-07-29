## What this tool does

It answers why a DLP rule fired, or did not, by separating three things that are usually collapsed into one — and that fail separately:

1. **Candidates** — how many strings have the right shape
2. **Matches** — how many of those pass the checksum
3. **Threshold** — whether that count reaches what the rule requires

A rule that did not fire failed at exactly one of those, and which one tells you what to change.

## Why the checksum matters more than the pattern

A predefined data identifier is not a regular expression. A sixteen-digit string is a *candidate*; whether it counts as a match depends on arithmetic.

That single fact explains most DLP tuning arguments. **"It flagged a purchase order number"** is usually a number that happens to pass Luhn. **"It missed a real card"** is usually one with a transposed digit, which fails Luhn and therefore is not a card as far as the engine is concerned. Neither complaint is fixable by arguing about the pattern.

## The identifiers

**Payment card** — the Luhn algorithm, as specified for card numbers. Note that valid cards run from thirteen to nineteen digits, so rules written around sixteen miss the rest.

**CPF and CNPJ** — the Brazilian identifiers, each with two mod-11 check digits. Repeated-digit sequences like `111.111.111-11` satisfy the arithmetic but are never issued, so they are rejected.

Those three are here because their validation is a published, unambiguous algorithm. An identifier whose rules are not public cannot be modelled honestly.

## Privacy

Everything stays in your browser. Nothing you paste is transmitted, stored or logged — which matters more here than for most tools, because the whole point is pasting content you suspect is sensitive.

## Honest limits

**This is not Netskope's engine.** It models the checksum step, which is the one that surprises people. Proximity keywords, dictionaries, document fingerprinting, exact data match, OCR and file-type detection are all out of scope, and none of them is approximated.

Shape detection here is deliberately simple, so a result of zero candidates means *this tool found none*, not *the platform would find none*. And it counts a repeated number once; whether a given platform counts occurrences or distinct values changes threshold behaviour, and that is configuration this does not model.
