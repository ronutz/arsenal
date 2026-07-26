## What it does

Describe both ends of an IPsec tunnel and this tool names what they disagree about, and — the part that actually matters — **which phase would fail**. It runs entirely in your browser.

## Why the phase is the whole diagnosis

Phase 1 authenticates the peers and protects the negotiation. Phase 2 runs inside that protected channel and negotiates the security associations and the selectors.

That split is why knowing the phase narrows a fault immediately. A phase 1 failure is about identity or proposal, and no phase 2 is ever attempted, so its absence from the logs is expected rather than a second problem. A phase 2 failure means the peers authenticated successfully and *then* disagreed about what to protect, which points at selectors, transforms or PFS and nowhere else.

Getting that backwards sends an engineer to the wrong half of the configuration, which is why this tool leads with the verdict rather than a field-by-field table.

## The three false positives it refuses to produce

A mismatch analyser that reports healthy configurations as broken is worse than no analyser, because people stop reading it. Three differences look like faults and are not:

**Proposal lists do not have to be identical.** FortiOS accepts a list, and the tunnel comes up if any value is common. Comparing `aes256` against `aes128 aes256` and calling it a mismatch would be wrong, so this computes the intersection and reports a shared value as fine.

**Lifetimes do not have to match.** The shorter one wins. The tool names the effective value and says explicitly that this is not a failure. Wildly different values only mean rekeys at awkward intervals.

**Selectors are mirrored.** One peer's local subnet is the other's remote, so comparing local to local would flag every correctly built tunnel. The comparison is deliberately crossed.

Findings are split into blocking disagreements and differences that are not faults, and kept visually apart. Presenting "your lifetimes differ" with the same weight as "no common encryption" is how output becomes noise.

## What it catches

Phase 1: IKE version, authentication method, IKEv1 mode, and no common encryption, hash or DH group. Mode is only compared when the version is v1, because flagging main versus aggressive on IKEv2 would be a false positive of exactly the kind above.

Phase 2: no common transform, PFS enabled on one side only, a PFS DH group mismatch when both have it on, and selector mismatches in either direction.

The PFS case deserves its own mention: the log message on that failure does not usually say PFS, which is why it costs so much time and why a tool that names it is worth having.

## Selectors are exact, not approximate

`10.1.0.0/16` against `10.1.0.0/24` is a **mismatch**, not a near-match. Both sides must agree exactly on the networks the tunnel carries. When one peer is a device with narrow selector support, the two ends must be configured symmetrically rather than conveniently.

## What it will not tell you

It compares what you supply. A field present on one side and absent on the other is treated as *not stated* rather than as a disagreement, because a partial paste is not evidence of a fault.

It also does not diagnose the case that wastes the most time in practice: a tunnel that reports **up and passes no traffic**. That is not an IPsec problem at all — it is a missing route or a missing firewall policy — and the tool says so when it finds no fatal disagreement.

## Where it fits

It pairs with the FortiGate IPsec VPN article, which is organised around the same question and covers the topology choices this tool does not model. For NSE 4 candidates it supports objective 5.01.
