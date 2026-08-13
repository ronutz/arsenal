## What it does

Fill in what you want to trace — an address, optionally ports, a protocol, a packet count — and the tool assembles the full `diagnose debug flow` sequence for a FortiGate: the clean-state reset, the filter, the display options, the trace and the enable, followed by the cleanup. Every line is explained individually. It generates text and contacts nothing.

## Why a builder rather than a reference

`diagnose debug flow` is not a command, it is a recipe of four or five commands that only work in combination. The order matters, the cleanup matters more, and the whole thing is used rarely enough that almost nobody remembers it exactly. That is precisely the shape of problem a deterministic builder solves.

## The order it emits, and why

The tool emits **filter first, enable last**. Fortinet's own administration guide shows `diagnose debug enable` first, before the filter, and **both work** — the tool says so in its notes rather than quietly picking one. The reason to prefer filter-first is practical: on a busy firewall, turning output on before the filter is set traces everything until the filter lands.

## Three things it always tells you

- **The count is packets, not seconds.** `trace start 100` is one hundred packets, and a busy interface can exhaust that in under a second.
- **Offloaded traffic never reaches this code.** On NP or SP platforms a correct filter can produce nothing at all while traffic is plainly flowing. That is the single most common reason a good trace looks broken.
- **Line numbers in the output are not stable across versions.** Match on the function name.

## What it will not do

It cannot know your platform, your VDOM layout or whether your session is being offloaded, and it validates nothing against a device. It refuses to build an unfiltered trace, because an unfiltered debug flow on a production firewall is the fastest way to make a console unusable.
