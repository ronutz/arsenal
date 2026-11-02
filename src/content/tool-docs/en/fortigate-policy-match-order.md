## What it does

Paste an ordered FortiGate policy list and, optionally, a packet. The tool walks the list top-down showing which field ruled each policy out, names the winner, and reports when the packet falls through to the implicit deny. Local and offline; it reasons about the list you give it and never touches a device.

## The analysis worth running on its own

Even with no packet, the tool reports **policies that can never be reached**, where an earlier policy covers every field a later one covers. That is the commonest form of "my rule isn't working": the rule is correct and simply never reached. Worth running periodically rather than only when something breaks.

## What it corrects

**The policy ID is an identifier, not a position.** Policy 3 can sit below policy 47, and renumbering changes nothing about evaluation order. Plenty of material online reads as though the ID were the order; the tool states the correction on every run, and one of its golden vectors is a list where policy 47 sits above policy 3 and wins.

It also always says that **each direction needs its own policy**: traffic permitted from A to B says nothing about B to A.

## The virtual-IP rules

A policy with a **VIP applied is matched differently and takes priority** over an ordinary policy, so ordering alone will not block a source from reaching it. The deny policy needs **`match-vip`** and must sit above. New deny policies have it enabled by default; an **accept** policy cannot have it at all, and the tool flags that combination as impossible.

## What it will not do

It does not resolve address objects or service groups, so a named object is an opaque token unless it is `all` or `any`. So it can tell you that `web-servers` and `all` are different, and cannot tell you whether one contains the other. For that, the device is the authority.

## Share results

First in the reading, **Share results** builds a link to this page, only when you press it, that carries the policies and the packet line as typed (an empty packet line is left out) after the `#`. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

Policies name your interfaces, address objects and services (the reason the popover adds a caution line). Both fields are read, and a message about a credential says which one holds it. Before a link is offered, the box is read for a credential FortiOS or a standard defines: a `set` line of a setting the [FortiOS 7.6.8 CLI reference](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) types as a password (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd` and the rest; read 2026-11-01) or the `name` of an SNMP community ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), section 3.2.5), any `ENC` value (Fortinet's advisory [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007), read 2026-11-01: such data posted where others can read it "should currently be considered "easy to decrypt""), a `psksecret=` or `password=` pair of the same names on a directive line, a PEM private key ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), a JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), an `Authorization` line ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2), a password in a URL or an AWS access key ID. One of them means no link: the popover names its line, and you replace it with a placeholder and press again, so what you share is exactly what you chose (a value is never replaced inside a pasted box, which would change what was sent). A value whose name only looks like a secret does not stop the link; the popover names the first one.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** Both fields fill as typed (a packet line the link does not carry leaves that field empty) and the page reads them. Nothing is contacted. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
