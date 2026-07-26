## What it does

Paste the output of `diagnose sys session list` and this tool reads it back: the protocol and its state, which policy admitted the flow, what was translated on each leg, the timers, and whether the far side ever replied. It runs entirely in your browser and never contacts a device.

## Why the session table is worth reading

The session table is the authoritative record of what the FortiGate actually did. The policy list tells you what should happen; the session tells you what did. When someone insists the firewall is blocking their traffic, a session entry showing the flow admitted by policy 7 with bytes counted in both directions settles it in one line.

Its problem is presentation. The output is dense, positional and unmemorable, so the information is present and unread.

## The reading people skip

```
statistic(bytes/packets/allow_err): org=240/4/0 reply=0/0/0
```

Outbound packets, zero reply. The FortiGate forwarded the traffic and **nothing came back**. The session exists, which means a policy permitted it, so this is not the firewall blocking anything — the problem is beyond this device: routing on the return path, the destination host, or a filter further along.

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

## Where it fits

It pairs with the FortiGate policy lookup explainer: that tool predicts which policy *should* match, and this one confirms which policy *did*. Together they close the loop between configuration and behaviour. For NSE 4 candidates it supports objectives 1.02 and 1.04.
