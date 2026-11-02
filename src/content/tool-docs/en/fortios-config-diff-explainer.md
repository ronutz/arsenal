## What it does

Paste two FortiOS configurations separated by a line of `---` and get a **structural** diff: what changed by section, object and setting. It runs entirely in your browser.

## Why a line diff is the wrong tool here

A textual diff finds a minimal **edit script**, which is not the same thing as the change a human made. Applied to FortiOS output that produces three specific annoyances:

- A block that **moved** is reported as a deletion plus an insertion, so a review of an unchanged object costs the same attention as a real edit.
- An object appears changed because a neighbour grew a line and the alignment shifted.
- Three genuine edits sit buried inside four hundred lines of unchanged context.

This tool parses both sides into section, object and setting, then compares the structures. A block that moved is not a change. A setting that changed is one line naming the old value and the new one.

## The one place order is not noise

For most sections the order of objects is irrelevant: address objects, service objects, interfaces. Reporting a reordering there would be noise, so it is ignored.

For **firewall policy** and its relatives, order **is** the behaviour. First match wins, so moving a policy above another changes what the device does without changing a single setting. That is the edit a line diff buries most thoroughly, because nothing on either side of the move differs textually except position.

Those sections are treated as order-sensitive by name, and a reordering in them is reported as a real finding:

`firewall policy` · `firewall policy6` · `firewall proxy-policy` · `firewall local-in-policy` · `firewall shaping-policy` · `firewall security-policy` · `router policy` · `router policy6` · `system sdwan`

Treating both cases the same way, in either direction, would make the tool wrong, so both behaviours are pinned by golden vectors.

## Input

Two configurations, either separated by a line containing only `---`, or labelled with `BEFORE:` and `AFTER:` on their own lines. Each side is ordinary `show` or `show full-configuration` output.

Nested `config` blocks inside an object are parsed, and their settings are prefixed with the nested path so they cannot collide with a same-named setting on the parent object.

## What it does not do

**It compares, it does not judge.** It will tell you that a policy moved or an address changed; it will not tell you whether that was a good idea, because that depends on intent it cannot see.

It also does not model the semantic weight of a setting. Changing a comment and changing an action both read as one changed setting, and it is left to the reader to know which matters.

Identical input produces silence rather than a reassurance banner. A diff tool that finds phantom changes is untrustworthy on the ones that count, so a vector pins that too.

## Share results

First in the comparison, **Share results** builds a link to this page, only when you press it, that carries a copy of the box after the `#`, both configurations with the value of every FortiOS secret setting replaced by a numbered mark, never the box as pasted. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed. The popover also says how many values were replaced.

The settings replaced are those the [FortiOS 7.6.8 CLI reference](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) types as passwords (`password`, `password-2`, `password-3` or `password_aes256`; read 2026-11-01): an IPsec phase 1's `psksecret`, `psksecret-remote` and `ppk-secret`, an administrator's `password` and a local user's `passwd`, an API user's `api-key`, the RADIUS `secret` values, the TACACS+ and HA `key` values, the SNMPv3 `auth-pwd` and `priv-pwd`, the BGP and LDAP `password`, the OSPF `authentication-key` and `key-string`, a Wi-Fi `passphrase` and the cloud connectors' secret keys; any setting whose name ends in a word such as password, secret or token; the `name` of an SNMP community, which is the community string itself ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), section 3.2.5; [RFC 3584](https://www.rfc-editor.org/rfc/rfc3584), section 5.2.1); and every `ENC` value, whatever its setting. Fortinet's own advisory [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007) (read 2026-11-01) says a configuration "willingly posted on a forum for troubleshooting purpose" can have its `ENC` data decrypted to plaintext, and that such data "should currently be considered "easy to decrypt"", so an `ENC` value is treated as the secret it holds. Each value becomes a numbered mark (`[redacted-1]`, `[redacted-2]` and so on), the same number for the same value; the `ENC` word, the quotes and every other character stay. There is no switch to put the values back in: none of them changes the reading, and each is a credential. Because equal values keep equal marks and different values different ones, a secret that changed between the two sides still shows as a changed setting (`psksecret: ENC [redacted-1] → ENC [redacted-3]`), and one that did not change still does not.

A value that runs past its line cannot be replaced there (a PEM private key in quotes over several lines, [RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), section 10), and the copy can still hold a credential it cannot name (a JWT, [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1; an `Authorization` line, [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2; a password in a URL, RFC 3986 section 3.2.1; an AWS access key ID). Either means no link: the popover names the line, and you put a placeholder in its place and press again. A value whose name only looks like a secret (a word in a comment, say) does not stop the link; the popover names the first one. Addresses, object names and the rest of both configurations go as pasted, and the popover asks you to read them first.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The copy fills the box as a paste would and the page compares the two sides, with the same sections, objects and settings changed as for the sender. A link that still holds a secret is one the button never builds, and it is ignored. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

## Where it fits

Pair it with the FortiGate firewall policy and NAT article, which explains why order determines behaviour in the sections this tool treats as order-sensitive.
