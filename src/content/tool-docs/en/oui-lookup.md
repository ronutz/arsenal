## What it does

A MAC address is a 48-bit hardware address, usually written as six hex bytes like `00:1b:54:11:22:33`. The first three bytes are the OUI - the Organizationally Unique Identifier - which the IEEE assigns to a manufacturer. This tool takes a MAC (in any common format) or a bare OUI, looks the OUI up in an embedded snapshot of the IEEE MA-L registry to name the manufacturer, and reads the two meaningful bits of the first byte. It all runs in your browser.

## The two bits that matter

The very first byte of a MAC carries two flags in its low bits:

- The **I/G bit** (least significant bit) is unicast when 0 and multicast when 1. A multicast address is a group address, not a single interface.
- The **U/L bit** (second-least significant bit) is universal when 0 and locally administered when 1. A universally administered address is globally unique and drawn from a manufacturer's OUI; a locally administered address was set by software (a hypervisor, a bonded interface, a randomized Wi-Fi MAC) and has no manufacturer.

So `02:...` is locally administered (there is no vendor to find), and `01:...` is multicast.

## Formats it accepts

Colon (`00:1b:54:...`), hyphen (`00-1b-54-...`), Cisco dotted (`001b.5411.2233`), and unseparated (`001b5411...`) forms all work, in upper or lower case, as does a bare six-hex OUI.

## About the data

The vendor names come from the IEEE MA-L (OUI) public listing, embedded here as a point-in-time snapshot. Because it is a snapshot, a very recently assigned block may not be present yet, and this build covers the MA-L (24-bit) registry, not the smaller MA-M (28-bit) or MA-S (36-bit) blocks. The snapshot is lazy-loaded when you do your first lookup, so opening the page is fast and nothing is ever fetched from a server at lookup time.

## Using it

Type or paste a MAC address or an OUI. A locally administered or unknown address is reported honestly rather than guessed at.
