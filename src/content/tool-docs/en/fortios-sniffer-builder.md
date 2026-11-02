## What it does

Build a FortiGate `diagnose sniffer packet` command from its parts, or paste an existing command to have every argument explained, all without touching a device. The built-in FortiOS sniffer is the first tool most people reach for when a packet is not arriving where it should, and its command line packs five positional arguments into one line. This tool composes that line for you and reads it back argument by argument. It runs entirely in your browser and is grounded in Fortinet's own sniffer documentation and CLI reference.

## Building a command

Pick an interface (or `any` for all of them), optionally a host, a port, and a protocol, then a verbosity level, a packet count, and a timestamp format. The tool assembles the exact command:

```
diagnose sniffer packet <interface> <'filter'> <verbose> <count> <tsformat>
```

The filter you build is shown in single quotes, the way FortiOS expects a multi-word BPF-style expression, and a `host` plus a `proto` are joined with `and`. When no filter parts are set, the bare word `none` is used, which captures everything on the interface. Each argument is explained beside the command, and the common traps are flagged as you build.

## Decoding a command

Paste a command such as `diagnose sniffer packet any 'host 10.1.1.1 and tcp port 443' 4 0 l` and each of the five arguments is read back: the interface (and whether `any` means a Linux cooked capture that hides the real Ethernet header), the filter and what it matches, the verbosity level and exactly what it prints, the packet count, and the timestamp format. The abbreviated `diag sniff packet` form is accepted too, and a command with the trailing count or timestamp omitted still decodes, because those arguments are optional on the device.

## Verbosity, timestamps, and the traps

FortiOS verbosity runs 1 to 6. Levels 1 to 3 add progressively more of the packet (headers, then IP payload, then the full Ethernet frame); levels 4 to 6 do the same but additionally print the interface name each packet used, which is what you want with `any`. The full Ethernet-level output (verbose 3 or 6) can be converted to a `.pcap` for Wireshark with Fortinet's `fgt2eth.pl` script. The timestamp argument is `a` for absolute UTC, `l` for absolute local time, or omitted for a relative time since the sniff started; the tool warns that a relative timestamp cannot be correlated across parallel captures. It also flags the two classic reasons a sniff shows nothing: VLAN tags are stripped on `any` and VLAN interfaces at high verbosity, and hardware-offloaded (NP/SoC) sessions bypass the kernel sniffer entirely, so you may need `set auto-asic-offload disable` in the matching firewall policy while troubleshooting.

## Scope and grounding

This composes and explains command text; it never runs a sniffer, opens a socket, or fetches anything, and the same input always produces the same output. It models the command grammar and the documented verbosity and timestamp semantics; it does not capture or parse live packets. Every fact comes from Fortinet's FortiGate Administration Guide section on performing a sniffer trace, the FortiOS CLI reference for `diagnose sniffer packet`, and Fortinet's community troubleshooting guidance. Nothing you enter or paste leaves the page.

## Share results

Under the command box, **Share results** builds a link to this page, only when you press it, that carries the open mode after the `#`: in Build mode the form as named values, every field always (`iface`, `host`, `port`, `proto`, `verbose`, `count`, and `timestamp` as `a` or `l`, left out for relative); in Decode mode the pasted command as `input`. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

The interface and the filter name your network's interfaces and hosts, so the popover adds a caution line in both modes. The Build form holds no secret; the Decode box takes any text, so before a link is offered, the box is read for a credential FortiOS or a standard defines: a `set` line of a setting the [FortiOS 7.6.8 CLI reference](https://docs.fortinet.com/document/fortigate/7.6.8/cli-reference/305883427/config-vpn-ipsec-phase1-interface) types as a password (`psksecret`, `password`, `passwd`, `secret`, `key`, `auth-pwd` and the rest; read 2026-11-01) or the `name` of an SNMP community ([RFC 1157](https://www.rfc-editor.org/rfc/rfc1157), section 3.2.5), any `ENC` value (Fortinet's advisory [FG-IR-19-007](https://www.fortiguard.com/psirt/FG-IR-19-007), read 2026-11-01: such data posted where others can read it "should currently be considered "easy to decrypt""), a `psksecret=` or `password=` pair of the same names on a directive line, a PEM private key ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468)), a JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)), an `Authorization` line ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2), a password in a URL or an AWS access key ID. One of them means no link: the popover names its line, and you replace it with a placeholder and press again, so what you share is exactly what you chose (a value is never replaced inside a pasted box, which would change what was sent). A value whose name only looks like a secret does not stop the link; the popover names the first one.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The sender's mode opens and its fields fill (the other mode's keep theirs), and the page builds or decodes as on typing; nothing is captured or run. A link mixing the two modes, a level, protocol or timestamp the form does not offer, or a count that is not a whole number makes the whole link be ignored. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
