## What it does

Paste an ExtremeXOS (EXOS, now branded Switch Engine) configuration and this reads it back without touching a switch: a plain-English explanation of each command, an aggregated VLAN summary, and the commands grouped by category. EXOS is unlike Cisco IOS or FortiOS in one structural way that makes an explainer genuinely useful: it has no interface sub-modes. Every line is a self-contained imperative command, so a config reads as a flat list rather than nested blocks. This tool runs entirely in your browser and is grounded in the ExtremeXOS Command Reference.

## The command model

Every EXOS command begins with one of six verbs acting on a named object: `create` (make a new VLAN, account, or STP domain), `configure` (set a property on something that already exists, the workhorse verb), `enable` and `disable` (turn a feature or object on and off), `delete` (remove an object), and `unconfigure` (reset part of the config to default). Because there is no mode nesting, you read each line on its own. The tool labels each command with its verb and category so the structure is visible at a glance.

## VLANs and ports

The most common EXOS commands build VLANs and assign ports, and the tool aggregates them into a per-VLAN summary. It follows `create vlan <name> tag <id>`, `configure vlan <name> add ports <portlist> tagged|untagged`, and `configure vlan <name> ipaddress <ip>` across the whole config, then shows each VLAN with its tag, its tagged and untagged ports, and any IP address. Two rules from the documentation are surfaced where relevant: tagged ports carry the 802.1Q tag and can belong to many VLANs (a trunk), while an untagged port can belong to only one VLAN and must first be removed from the Default VLAN. Ports are written slot:port on stacked and modular switches (for example 1:1, 2:24) and as plain numbers on a stand-alone switch.

## Layer 3, link aggregation, and the rest

Assigning an IP address to a VLAN makes it a routed interface, but the switch still needs `enable ipforwarding` to route between interfaces, so the tool warns when a VLAN has an IP but no ipforwarding command was seen. Link aggregation has an EXOS-specific name and shape: a LAG is a "sharing" group created with `enable sharing <master-port> grouping <portlist>` and referenced by its master port, which the tool calls out. Static routes (`configure iproute add default`), spanning tree (`create stpd`, `configure stpd add vlan`), local accounts (`create account <role> <name>`), and management services (SNMP, SNTP, DNS, logging, LLDP) are each recognized, explained, and grouped under their category.

## Scope and grounding

This parses and explains; it never connects to a switch, runs a command, or fetches anything, and the same input always produces the same output. It models the command grammar and recognizes the common commands; it is not a full ExtremeXOS parser, and an unusual or newer command it does not recognize is shown with a generic explanation rather than a wrong one. Every fact comes from the ExtremeXOS Command Reference and the Switch Engine user guide. Nothing you paste leaves the page.
