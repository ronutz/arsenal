## What it does

Describe a policy (the traffic, the SSL inspection setting, the inspection mode, and which security profiles are attached) and this tool tells you which profiles can actually **see** that traffic. It runs entirely in your browser.

## The dependency chain

A security profile only acts when every precondition above it holds:

1. A firewall policy **permits** the traffic. Nothing inspects what was denied.
2. SSL inspection **decrypts** it, if it is encrypted.
3. The inspection **mode** supports the feature.
4. Only then does the profile act.

The tool walks that chain per profile and names the link that failed. Most reports that a profile is not working resolve at **step 2**: the traffic is HTTPS, the policy carries certificate inspection rather than deep inspection, and there is simply nothing to read. The profile looks attached, the configuration looks correct, and it is blind.

## Blind is not the same as degraded

That distinction is the judgement this tool exists to make, and getting it wrong in either direction would be worse than saying nothing.

**Blind** means attached, configured, and doing nothing. AntiVirus, IPS, DLP and file filter all need the message body. Behind certificate inspection there is no body, so they are not partly effective: they are inert.

**Degraded** means working with less than the full picture. Application control and web filter can still identify some traffic from handshake metadata such as SNI, so a hostname policy still applies while a URL-path policy does not.

Telling someone a profile is partly working when it sees nothing at all is the more dangerous error, so the two are reported separately and styled differently.

## Certificate inspection is a different thing, not a weaker one

It validates the certificate and reads the handshake. It never decrypts the payload. Describing it as "lighter deep inspection" leads directly to the blind-profile situation, which is why the tool words it as a different mechanism rather than a lower setting.

Switching a policy to deep inspection is the single change that fixes every blind profile at once, and it is a real decision, not a checkbox. Deep inspection means terminating TLS on the FortiGate, which carries certificate-trust, privacy and performance consequences that belong in the decision.

## Mode caveats

Even where coverage exists, flow mode constrains some behaviour, and the tool says where. AntiVirus in flow mode scans as the file streams rather than buffering it whole, so very large files and deeply nested archives are where coverage thins. It also flags the oversize-file action, whose default **passes** files above the threshold, leaving the largest downloads uninspected unless that is changed deliberately.

## What it does not model

**Coverage, not detection.** It answers whether a profile can see the traffic. It never claims a profile would catch a particular threat, because that depends on signatures, databases and the threat itself, none of which are computable from a policy description.

It also does not evaluate profile configuration quality: an AntiVirus profile with every scan disabled reads as effective here, because the question asked is about visibility.

## Share results

Under the coverage table, **Share results** builds a link to this page, only when you press it, that carries the box as pasted after the `#`. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

The directive lines name profile kinds and inspection modes, not your network, so the popover adds no caution line of its own. Before a link is offered, the box is read for a credential FortiOS or a standard defines: a `set` line of a setting the [FortiOS 7.6.8 CLI reference](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) types as a password (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd` and the rest; read 2026-11-01) or the `name` of an SNMP community ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), section 3.2.5), any `ENC` value (Fortinet's advisory [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007), read 2026-11-01: such data posted where others can read it "should currently be considered "easy to decrypt""), a `psksecret=` or `password=` pair of the same names on a directive line, a PEM private key ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), a JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), an `Authorization` line ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2), a password in a URL or an AWS access key ID. One of them means no link: the popover names its line, and you replace it with a placeholder and press again, so what you share is exactly what you chose (a value is never replaced inside a pasted box, which would change what was sent). A value whose name only looks like a secret does not stop the link; the popover names the first one.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The box fills as a paste would and the page checks the coverage. Nothing is contacted. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

## Where it fits

It pairs with the FortiGate security profiles article, which explains flow versus proxy in full, and with the SSL inspection modes article. For NSE 4 candidates it supports objectives 3.02 through 3.05.
