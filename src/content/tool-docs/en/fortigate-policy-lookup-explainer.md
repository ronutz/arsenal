## What it does

Paste a FortiGate firewall policy list and a packet, and this tool performs the evaluation FortiOS would: top to bottom, every criterion must match, first match wins. It reports the policy that matches, a trace naming the **first criterion that eliminated** each earlier policy, and the policies below the match that would also have matched. It runs entirely in your browser and never contacts a device.

## Why the trace matters more than the verdict

Knowing that policy 7 matched is a small part of the answer. The useful part is why policies 1 through 6 did not, because that is what tells you whether the list is written as intended. A policy with the right addresses and the wrong outgoing interface silently fails to match, and nothing in the interface says so; the hit counter simply never increments.

The trace names one criterion per policy: the first one that failed. FortiOS requires all of them, so a single failure is enough to eliminate a policy, and reporting the first is what keeps the output readable on a long list.

## Shadowed versus catch-all, and why the distinction is the point

Once a policy matches, later policies that would also have matched fall into two very different categories, and this tool keeps them apart.

**Shadowed** means the later policy is at least as specific as the one that won. That is a genuine fault: it is live in the configuration, looks correct on screen, and can never take effect for this traffic as ordered. It is the single most common FortiGate policy problem, and moving it above the winner is the fix.

**Catch-all** means the later policy is broader than the winner. A general allow beneath a set of specific rules is correct design, not a mistake, so the tool reports it without flagging it. Conflating the two is what makes this class of tool cry wolf on every well-ordered policy list, which is why specificity is computed rather than assumed.

## Input formats

Two shapes are accepted, because you may have either.

**FortiOS CLI**: the output of `show firewall policy` or a `config firewall policy` block. Members are read from the quoted lists, and a policy with `set status disable` is reported as skipped rather than silently ignored.

**A pipe or tab table**: `id | srcintf | dstintf | srcaddr | dstaddr | service | action`, which is what a copy from the GUI or a hand-written list looks like. Multiple members in a cell are comma separated.

The packet goes on its own line in either format:

```
packet: srcintf=port1, dstintf=port2, srcaddr=LAN, dstaddr=WebSrv, service=HTTPS
```

## The limitation, stated plainly

Matching compares **object names**, not resolved addresses. A pasted policy list does not carry the address-object definitions, so the question "is 10.1.1.5 inside the object called LAN_Subnet" cannot be answered from this input. Supply the object name, or `all`.

This is a deliberate choice. The tool could guess by parsing addresses out of object names, and it would be confidently wrong whenever a name did not describe its contents. A stated limit is more useful than a plausible wrong answer, and it is the reason this tool can be trusted on the parts it does answer.

It also models the **match decision only**. NAT results, security profile outcomes, routing, and session state depend on configuration this input does not carry, and are not inferred.

## Share results

Under the headline answer (first in the reading when there is no packet), **Share results** builds a link to this page, only when you press it, that carries a copy of the box after the `#`. The page reads the policies and the `packet:` line and skips everything else, so a whole configuration pasted here gets a reading too; the copy replaces the value of every FortiOS secret setting in it by a numbered mark, never the box as pasted. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed. The popover also says how many values were replaced.

The settings replaced are those the [FortiOS 7.6.8 CLI reference](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) types as passwords (`password`, `password-2`, `password-3` or `password_aes256`; read 2026-11-01): an IPsec phase 1's `psksecret`, `psksecret-remote` and `ppk-secret`, an administrator's `password` and a local user's `passwd`, an API user's `api-key`, the RADIUS `secret` values, the TACACS+ and HA `key` values, the SNMPv3 `auth-pwd` and `priv-pwd`, the BGP and LDAP `password`, the OSPF `authentication-key` and `key-string`, a Wi-Fi `passphrase` and the cloud connectors' secret keys; any setting whose name ends in a word such as password, secret or token; the `name` of an SNMP community, which is the community string itself ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), section 3.2.5; [RFC 3584](https://www.rfc-editor.org/rfc/rfc3584), section 5.2.1); and every `ENC` value, whatever its setting. Fortinet's own advisory [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007) (read 2026-11-01) says a configuration "willingly posted on a forum for troubleshooting purpose" can have its `ENC` data decrypted to plaintext, and that such data "should currently be considered "easy to decrypt"", so an `ENC` value is treated as the secret it holds. Each value becomes a numbered mark (`[redacted-1]`, `[redacted-2]` and so on), the same number for the same value; the `ENC` word, the quotes and every other character stay. There is no switch to put the values back in: none of them changes the reading, and each is a credential.

A value that runs past its line cannot be replaced there (a PEM private key in quotes over several lines, [RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), section 10), and the copy can still hold a credential it cannot name (a JWT, [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1; an `Authorization` line, [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2; a password in a URL, RFC 3986 section 3.2.1; an AWS access key ID). Either means no link: the popover names the line, and you put a placeholder in its place and press again. A value whose name only looks like a secret (a word in a comment, say) does not stop the link; the popover names the first one. The lookup never reads those settings, so it reads exactly the same from the copy; the interface, address and policy names go as pasted, and the popover asks you to read them first.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The copy fills the box as a paste would and the page runs the lookup. A link that still holds a secret is one the button never builds, and it is ignored. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

## Where it fits

It pairs with the FortiGate firewall policy and NAT article, which explains the evaluation pipeline this tool walks, including why destination NAT through a VIP happens before policy evaluation and source NAT after it. For NSE 4 candidates it covers objectives 2.01 and 2.02.
