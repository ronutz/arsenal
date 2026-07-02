## What it does

Paste a snippet of a BIG-IP `bigip.conf` and the tool parses it and explains every object in plain language, along with the structure that holds them together. It reads the configuration only, entirely in your browser; it changes nothing and contacts no device.

## How a BIG-IP configuration is shaped

BIG-IP stores its configuration as tmsh objects, and they all follow one shape:

    <module> <component> [<type>] <name> {
        <key> <value>
        <key> { <nested body> }
        <bare-list-item>
    }

The leading words place the object in BIG-IP's module and component hierarchy (`ltm virtual`, `ltm pool`, `net vlan`, and so on), the name identifies it, and the braces hold its fields. Inside a body, newlines separate entries, brace blocks can nest to any depth, quoted strings may contain spaces, and a `#` begins a comment. The tool follows exactly this grammar to break a snippet into its objects and each object into its fields.

## What it explains

Rather than leaving you to recognize each field, the tool describes what the common objects and settings mean: a virtual server's `destination`, `pool`, `profiles`, and `source-address-translation`; a pool's `members`, `monitor`, and `load-balancing-mode`; and the many other objects a configuration ties together. The result is a readable map of what a configuration actually does, which is useful when you inherit a device, review a change, or learn the object model.

## The one thing that is not tmsh

There is a deliberate exception. An `ltm rule` object carries a Tcl iRule in its body, and that body is a script, not tmsh configuration. The parser recognizes this and captures the iRule verbatim rather than trying to parse it as objects and fields, so your rule is preserved exactly as written instead of being mangled.

## Using it

Paste a `bigip.conf` snippet, from a single object to a large block, and read the structured, explained breakdown. The parse is deterministic and local, so it is also a safe way to read a configuration exported from a device you cannot or should not query directly.
