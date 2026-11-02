## What this tool does

It answers why a DLP rule fired, or did not, by separating three things that are usually collapsed into one, and that fail separately:

1. **Candidates**: how many strings have the right shape
2. **Matches**: how many of those pass the checksum
3. **Threshold**: whether that count reaches what the rule requires

A rule that did not fire failed at exactly one of those, and which one tells you what to change.

## Why the checksum matters more than the pattern

A predefined data identifier is not a regular expression. A sixteen-digit string is a *candidate*; whether it counts as a match depends on arithmetic.

That single fact explains most DLP tuning arguments. **"It flagged a purchase order number"** is usually a number that happens to pass Luhn. **"It missed a real card"** is usually one with a transposed digit, which fails Luhn and therefore is not a card as far as the engine is concerned. Neither complaint is fixable by arguing about the pattern.

## The identifiers

**Payment card**: the Luhn algorithm, as specified for card numbers. Note that valid cards run from thirteen to nineteen digits, so rules written around sixteen miss the rest.

**CPF and CNPJ**: the Brazilian identifiers, each with two mod-11 check digits. Repeated-digit sequences like `111.111.111-11` satisfy the arithmetic but are never issued, so they are rejected.

Those three are here because their validation is a published, unambiguous algorithm. An identifier whose rules are not public cannot be modelled honestly.

## Privacy

Everything stays in your browser. Nothing you paste is transmitted, stored or logged, which matters more here than for most tools, because the whole point is pasting content you suspect is sensitive.

## Honest limits

**This is not Netskope's engine.** It models the checksum step, which is the one that surprises people. Proximity keywords, dictionaries, document fingerprinting, exact data match, OCR and file-type detection are all out of scope, and none of them is approximated.

Shape detection here is deliberately simple, so a result of zero candidates means *this tool found none*, not *the platform would find none*. And it counts a repeated number once; whether a given platform counts occurrences or distinct values changes threshold behaviour, and that is configuration this does not model.

## Share results

Under the verdict, **Share results** builds a link to this page, only when you press it, that never carries your text. The box holds what you suspect is sensitive: payment card numbers (a PAN, "primary account number", is the "unique payment card number ... that identifies the issuer and the cardholder account", [PCI SSC glossary](https://www.pcisecuritystandards.org/glossary/), read 2026-11-01), CPF and CNPJ numbers, and the words around them. What this page diagnoses is structural, so the link carries stand-ins after the `#`: one line per candidate, in the page's order, each with the candidate's own separators and length, and digits the page makes (zeros, the candidate's place in the list, and check digits chosen so the checksum passes or fails exactly as the candidate's did, confirmed by the same Luhn and mod-11 checks the page runs); a repeated-digit sequence, which is no one's number, goes as it is. The identifier and the threshold go too. Before the link is offered, the page reads the stand-ins again and must reach the same diagnosis (the same candidates by shape, result and reason, the same count, verdict and findings), or there is no link. A text with no candidate gets no link, because its diagnosis is about the text itself. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The stand-ins fill the box, the identifier and the threshold are set, and the page evaluates; a note under the verdict says the numbers are stand-ins. A link whose lines are not stand-ins of their place is ignored. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
