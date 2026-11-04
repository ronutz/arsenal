## What it does

Fill in what you want to trace (an address, optionally ports, a protocol, a packet count) and the tool assembles the full `diagnose debug flow` sequence for a FortiGate: the clean-state reset, the filter, the display options, the trace and the enable, followed by the cleanup. Every line is explained individually. It generates text and contacts nothing.

Typing is optional for most of the form: the port fields and the packet count have up and down arrows beside them, and under the protocol field there is one button per protocol name the tool turns into its number (`tcp`, `udp`, `icmp`, `icmpv6`, `gre`, `esp`, `ah`, `sctp`); pressing the lit one clears the field again. A protocol number, the addresses and the VDOM are still typed.

## Why a builder rather than a reference

`diagnose debug flow` is not a command, it is a recipe of four or five commands that only work in combination. The order matters, the cleanup matters more, and the whole thing is used rarely enough that almost nobody remembers it exactly. That is precisely the shape of problem a deterministic builder solves.

## The order it emits, and why

The tool emits **filter first, enable last**. Fortinet's own administration guide shows `diagnose debug enable` first, before the filter, and **both work**, so the tool says so in its notes rather than quietly picking one. The reason to prefer filter-first is practical: on a busy firewall, turning output on before the filter is set traces everything until the filter lands.

## Three things it always tells you

- **The count is packets, not seconds.** `trace start 100` is one hundred packets, and a busy interface can exhaust that in under a second.
- **Offloaded traffic never reaches this code.** On NP or SP platforms a correct filter can produce nothing at all while traffic is plainly flowing. That is the single most common reason a good trace looks broken.
- **Line numbers in the output are not stable across versions.** Match on the function name.

## What it will not do

It cannot know your platform, your VDOM layout or whether your session is being offloaded, and it validates nothing against a device. It refuses to build an unfiltered trace, because an unfiltered debug flow on a production firewall is the fastest way to make a console unusable.

## Share results

Under the commands, after Copy, **Share results** builds a link to this page, only when you press it, that carries the form after the `#` as named values, every field always: `addr`, `saddr`, `daddr`, `port`, `sport`, `dport`, `proto`, `vdom` and `count` as typed (an empty one is left out), and `iprope` and `timestamp` as 1 or 0. The button is disabled until a filter is set, because the page builds nothing without one. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

The form holds no secret (the builder formats text and runs nothing), but its filters name hosts, ports and a virtual domain of your network, so the popover adds a caution line before you copy anything. Every field goes, not only those that differ from the defaults, so an old link keeps its meaning if a default changes.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The link's values replace the whole form (a text field it does not carry is emptied) and the page builds the commands; nothing is run. A switch other than 1 or 0, or a link without a filter, makes the whole link be ignored. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
