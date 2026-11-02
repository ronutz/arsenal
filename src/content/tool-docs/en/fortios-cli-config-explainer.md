## What it does

Paste a FortiOS configuration block and the tool returns the structure as a tree with every verb explained: what `config`, `edit`, `set`, `unset`, `append`, `next`, `end` and `abort` each do, and where the block sits at each line. Local and offline; it reads structure, not semantics.

## The trap it exists to catch

**`set` on a multi-value field replaces the whole list.** `set srcaddr "internal-net"` on a policy that had four source addresses leaves it with one, successfully, silently, with nothing in the output mentioning it. The command that adds is **`append`**.

The tool warns on every `set` against a known list field, naming the field and the line. That is the single most expensive habit in FortiOS CLI work and it is invisible in a block read casually, which is exactly when blocks get read.

## Two more it always says

- **`edit` creates what it cannot find.** A mistyped policy ID does not produce an error, it produces a policy.
- **`end` is the only line that commits.** `next` closes an entry and stays in the table; `abort` closes and discards. A block using `end` where `next` was meant leaves the table early and every remaining edit lands somewhere else.

It also reports **unclosed blocks**, because an unclosed block has committed nothing and pasting one into a live session leaves you somewhere unexpected.

## What it will not do

It does not know your address objects, your policies or your VDOM layout, and it cannot say whether a value is sensible. It answers whether the command shape does what the person typing it probably expected, which is a different and often more useful question.

It also cannot know what was in a field before. When it warns that a `set` replaces a list, **the question it is asking you to answer is what that list contained.**

## Share results

First in the reading, **Share results** builds a link to this page, only when you press it, that carries a copy of the block after the `#`, with the value of every FortiOS secret setting replaced by a numbered mark, never the block as pasted, because the tree shows every line's value. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed. The popover also says how many values were replaced.

The settings replaced are those the [FortiOS 7.6.8 CLI reference](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) types as passwords (`password`, `password-2`, `password-3` or `password_aes256`; read 2026-11-01): an IPsec phase 1's `psksecret`, `psksecret-remote` and `ppk-secret`, an administrator's `password` and a local user's `passwd`, an API user's `api-key`, the RADIUS `secret` values, the TACACS+ and HA `key` values, the SNMPv3 `auth-pwd` and `priv-pwd`, the BGP and LDAP `password`, the OSPF `authentication-key` and `key-string`, a Wi-Fi `passphrase` and the cloud connectors' secret keys; any setting whose name ends in a word such as password, secret or token; the `name` of an SNMP community, which is the community string itself ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), section 3.2.5; [RFC 3584](https://www.rfc-editor.org/rfc/rfc3584), section 5.2.1); and every `ENC` value, whatever its setting. Fortinet's own advisory [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007) (read 2026-11-01) says a configuration "willingly posted on a forum for troubleshooting purpose" can have its `ENC` data decrypted to plaintext, and that such data "should currently be considered "easy to decrypt"", so an `ENC` value is treated as the secret it holds. Each value becomes a numbered mark (`[redacted-1]`, `[redacted-2]` and so on), the same number for the same value; the `ENC` word, the quotes and every other character stay. There is no switch to put the values back in: none of them changes the reading, and each is a credential.

A value that runs past its line cannot be replaced there (a PEM private key in quotes over several lines, [RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), section 10), and the copy can still hold a credential it cannot name (a JWT, [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1; an `Authorization` line, [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2; a password in a URL, RFC 3986 section 3.2.1; an AWS access key ID). Either means no link: the popover names the line, and you put a placeholder in its place and press again. A value whose name only looks like a secret (a word in a comment, say) does not stop the link; the popover names the first one. Interface, address, object and user names go as pasted, and the popover asks you to read them first.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The copy fills the box as a paste would and the page explains it: the tree, the warnings and the notes read as they did for the sender, with the marks in place of the values. A link that still holds a secret is one the button never builds, and it is ignored. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

## Related tools

To collect a configuration from a FortiGate by script, the [Expect script builder](/tools/expect-script-builder) writes a login-and-run script with a FortiOS profile. By default it answers the `--More--` pager with a Space instead of changing the console's output setting, a global change every administrator's session would see.
