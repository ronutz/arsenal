## What it does

Paste the output of `diagnose sys session list` and this tool reads it back: the protocol and its state, which policy admitted the flow, what was translated on each leg, the timers, and whether the far side ever replied. It runs entirely in your browser and never contacts a device.

## Why the session table is worth reading

The session table is the authoritative record of what the FortiGate actually did. The policy list tells you what should happen; the session tells you what did. When someone insists the firewall is blocking their traffic, a session entry showing the flow admitted by policy 7 with bytes counted in both directions settles it in one line.

Its problem is presentation. The output is dense, positional and unmemorable, so the information is present and unread.

## The reading people skip

```
statistic(bytes/packets/allow_err): org=240/4/0 reply=0/0/0
```

Outbound packets, zero reply. The FortiGate forwarded the traffic and **nothing came back**. The session exists, which means a policy permitted it, so this is not the firewall blocking anything: the problem is beyond this device: routing on the return path, the destination host, or a filter further along.

This tool leads with that reading rather than reporting two numbers, because misdiagnosing it as a firewall problem is the most common and most expensive mistake made with this output.

For UDP, `proto_state` says the same thing more directly: `00` is one-way, `01` is two-way.

## The NAT hooks

The `hook=` lines are where translation becomes visible.

```
hook=post dir=org  act=snat 192.168.1.10:52345->93.184.216.34:443(203.0.113.5:52345)
hook=pre  dir=reply act=dnat 93.184.216.34:443->203.0.113.5:52345(192.168.1.10:52345)
```

The bracketed tuple is the translated form. `hook=post dir=org act=snat` carries the post-NAT source, which is what the far side sees. `hook=pre dir=reply act=dnat` carries the pre-NAT destination. A session with no `snat` or `dnat` on any leg was routed without translation, and the tool says so rather than leaving it implied.

## What it will not tell you

Fields whose full value tables are vendor documentation are shown **raw**, with their meaning stated only where it is documented and unambiguous. TCP `proto_state` is the clearest case: the two digits are the connection state in each direction, `01` is the established session everyone encounters, and the rest of the table is Fortinet's to publish. The tool says what the digits mean and does not invent the mapping.

That is a deliberate limit. A decoder that guesses at a value table looks more complete and is wrong exactly when the value is unusual, which is exactly when you are reading the session table in the first place.

## Share results

First in the reading, **Share results** builds a link to this page, only when you press it, that carries the sessions as pasted after the `#`. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

`diagnose sys session list` output names addresses, ports, NAT translations and the policy of each flow, and can name an authenticated user (the reason the popover adds a caution line). Before a link is offered, the box is read for a credential FortiOS or a standard defines: a `set` line of a setting the [FortiOS 7.6.8 CLI reference](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) types as a password (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd` and the rest; read 2026-11-01) or the `name` of an SNMP community ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), section 3.2.5), any `ENC` value (Fortinet's advisory [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007), read 2026-11-01: such data posted where others can read it "should currently be considered "easy to decrypt""), a `psksecret=` or `password=` pair of the same names on a directive line, a PEM private key ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), a JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), an `Authorization` line ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2), a password in a URL or an AWS access key ID. One of them means no link: the popover names its line, and you replace it with a placeholder and press again, so what you share is exactly what you chose (a value is never replaced inside a pasted box, which would change what was sent). A value whose name only looks like a secret does not stop the link; the popover names the first one.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The box fills as a paste would and the page reads each session. Nothing is contacted. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

## Where it fits

It pairs with the FortiGate policy lookup explainer: that tool predicts which policy *should* match, and this one confirms which policy *did*. Together they close the loop between configuration and behaviour. For NSE 4 candidates it supports objectives 1.02 and 1.04.
