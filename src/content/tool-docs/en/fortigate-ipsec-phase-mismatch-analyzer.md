## What it does

Describe both ends of an IPsec tunnel and this tool names what they disagree about, and then the part that actually matters: **which phase would fail**. It runs entirely in your browser.

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

It also does not diagnose the case that wastes the most time in practice: a tunnel that reports **up and passes no traffic**. That is not an IPsec problem at all: it is a missing route or a missing firewall policy, and the tool says so when it finds no fatal disagreement.

## Share results

Under the verdict, **Share results** builds a link to this page, only when you press it, that carries both peers as pasted after the `#`. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

Peer names and protected subnets describe your network (the reason the popover adds a caution line). The page reads no pre-shared key, but a reader describing a tunnel may write one on a `phase1:` line or paste a phase1-interface block beside the directives. Before a link is offered, the box is read for a credential FortiOS or a standard defines: a `set` line of a setting the [FortiOS 7.6.8 CLI reference](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) types as a password (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd` and the rest; read 2026-11-01) or the `name` of an SNMP community ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), section 3.2.5), any `ENC` value (Fortinet's advisory [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007), read 2026-11-01: such data posted where others can read it "should currently be considered "easy to decrypt""), a `psksecret=` or `password=` pair of the same names on a directive line, a PEM private key ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), a JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), an `Authorization` line ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2), a password in a URL or an AWS access key ID. One of them means no link: the popover names its line, and you replace it with a placeholder and press again, so what you share is exactly what you chose (a value is never replaced inside a pasted box, which would change what was sent). A value whose name only looks like a secret does not stop the link; the popover names the first one.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The box fills as a paste would and the page compares the two peers. Nothing is contacted. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

## Where it fits

It pairs with the FortiGate IPsec VPN article, which is organised around the same question and covers the topology choices this tool does not model. For NSE 4 candidates it supports objective 5.01.
