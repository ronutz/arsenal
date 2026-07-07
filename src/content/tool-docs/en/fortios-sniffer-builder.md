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
