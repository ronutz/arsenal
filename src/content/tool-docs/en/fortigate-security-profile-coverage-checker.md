## What it does

Describe a policy — the traffic, the SSL inspection setting, the inspection mode, and which security profiles are attached — and this tool tells you which profiles can actually **see** that traffic. It runs entirely in your browser.

## The dependency chain

A security profile only acts when every precondition above it holds:

1. A firewall policy **permits** the traffic. Nothing inspects what was denied.
2. SSL inspection **decrypts** it, if it is encrypted.
3. The inspection **mode** supports the feature.
4. Only then does the profile act.

The tool walks that chain per profile and names the link that failed. Most reports that a profile is not working resolve at **step 2**: the traffic is HTTPS, the policy carries certificate inspection rather than deep inspection, and there is simply nothing to read. The profile looks attached, the configuration looks correct, and it is blind.

## Blind is not the same as degraded

That distinction is the judgement this tool exists to make, and getting it wrong in either direction would be worse than saying nothing.

**Blind** means attached, configured, and doing nothing. AntiVirus, IPS, DLP and file filter all need the message body. Behind certificate inspection there is no body, so they are not partly effective — they are inert.

**Degraded** means working with less than the full picture. Application control and web filter can still identify some traffic from handshake metadata such as SNI, so a hostname policy still applies while a URL-path policy does not.

Telling someone a profile is partly working when it sees nothing at all is the more dangerous error, so the two are reported separately and styled differently.

## Certificate inspection is a different thing, not a weaker one

It validates the certificate and reads the handshake. It never decrypts the payload. Describing it as "lighter deep inspection" leads directly to the blind-profile situation, which is why the tool words it as a different mechanism rather than a lower setting.

Switching a policy to deep inspection is the single change that fixes every blind profile at once — and it is a real decision, not a checkbox. Deep inspection means terminating TLS on the FortiGate, which carries certificate-trust, privacy and performance consequences that belong in the decision.

## Mode caveats

Even where coverage exists, flow mode constrains some behaviour, and the tool says where. AntiVirus in flow mode scans as the file streams rather than buffering it whole, so very large files and deeply nested archives are where coverage thins. It also flags the oversize-file action, whose default **passes** files above the threshold — leaving the largest downloads uninspected unless that is changed deliberately.

## What it does not model

**Coverage, not detection.** It answers whether a profile can see the traffic. It never claims a profile would catch a particular threat, because that depends on signatures, databases and the threat itself, none of which are computable from a policy description.

It also does not evaluate profile configuration quality — an AntiVirus profile with every scan disabled reads as effective here, because the question asked is about visibility.

## Where it fits

It pairs with the FortiGate security profiles article, which explains flow versus proxy in full, and with the SSL inspection modes article. For NSE 4 candidates it supports objectives 3.02 through 3.05.
