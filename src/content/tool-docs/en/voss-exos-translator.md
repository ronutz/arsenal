## What it does

This is a reference translator between **VOSS** (Extreme's Fabric Connect / SPBM) and **EXOS**. It lays common tasks side by side so you can see how each command line expresses them, and it is explicit where EXOS has no equivalent - because EXOS does not run SPBM at all. It is a reference, not a config generator: every command is grounded in Extreme documentation, but you should adapt names, ports, and numbers to your own network and verify before applying anything.

## The key difference

EXOS and VOSS are different operating systems that run on Extreme's universal hardware. VOSS is fabric-native: it builds an SPBM fabric with IS-IS, nicknames, B-VLANs, and I-SIDs. EXOS does not support SPBM. It joins a Fabric Connect network as a **Fabric Attach** edge (an FA Proxy or Client), and the VOSS FA Server provisions the I-SID for it. So for the fabric-core tasks - the SPBM instance, the nickname, the B-VLANs, an L3 VSN - there simply is no EXOS command, and the tool says so plainly.

## How to use it

Type a task or a fragment of a command (for example `i-sid`, `nickname`, `vlan`, or `fabric attach`) and the table filters to the matching rows. Each row shows the concept, the VOSS command(s), the EXOS command(s) or a note that there is no equivalent, and a short explanation. Clear the box to see the whole table.

## What it is not

It does not generate a deployable configuration, and it does not translate an arbitrary config file line by line. Fabric configuration is high-impact and platform-specific; this tool is meant to help you learn and cross-reference the two CLIs, not to produce config you would paste into a live switch unchecked.
