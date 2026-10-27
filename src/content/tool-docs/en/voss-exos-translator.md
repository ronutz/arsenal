## What it does

This is a reference translator between **VOSS** (Extreme's Fabric Connect / SPBM) and **EXOS**. It lays common tasks side by side so you can see how each command line expresses them, and it is explicit where EXOS has no equivalent - because EXOS does not run SPBM at all. It is a reference, not a config generator: every command is grounded in Extreme documentation, but you should adapt names, ports, and numbers to your own network and verify before applying anything.

## The key difference

EXOS and VOSS are different operating systems that run on Extreme's universal hardware. VOSS is fabric-native: it builds an SPBM fabric with IS-IS, nicknames, B-VLANs, and I-SIDs. EXOS does not support SPBM. It joins a Fabric Connect network as a **Fabric Attach** edge (an FA Proxy or Client), and the VOSS FA Server provisions the I-SID for it. So for the fabric-core tasks - the SPBM instance, the nickname, the B-VLANs, an L3 VSN - there simply is no EXOS command, and the tool says so plainly.

## How to use it

Type a task or a fragment of a command (for example `i-sid`, `nickname`, `vlan`, or `fabric attach`) and the table filters to the matching rows. Each row shows the concept, the VOSS command(s), the EXOS command(s) or a note that there is no equivalent, and a short explanation. Clear the box to see the whole table.

## What it is not

It does not generate a deployable configuration, and it does not translate an arbitrary config file line by line. Fabric configuration is high-impact and platform-specific; this tool is meant to help you learn and cross-reference the two CLIs, not to produce config you would paste into a live switch unchecked.

## Share results

Under the mappings, **Share results** builds a link to this page, only when you press it, that carries the search as typed (`#input=i-sid`), and nothing else; whoever opens it sees the same mappings. With the search blank every mapping is listed, and the button stays disabled. Everything the link carries goes after the `#`, which [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-10-27) has "separated from the rest of the URI prior to a dereference": a browser does not send it to the server when the link is opened, but it stays in the address bar and history of whoever opens it, and anyone who has the link can read it.

- **How long.** A link carries at most 16,384 characters, the bound the site uses for every value after the `#`; a search is far shorter.
- **Opening a link.** The link is the same address other links into this tool use: the words fill the search field as typing would. As with every link into this tool, the value stays after the `#` until you change or clear the field, and then leaves the address without a request.
