# BIG-IP packet-filter explainer

Packet filters are the BIG-IP's earliest checkpoint, a BPF-based access policy on incoming traffic that runs before nearly everything you usually think about, and the chapter is explicit that they are unrelated to iRules. This tool walks yours the way the man page would.

Paste `net packet-filter` stanzas and the rules render in evaluation order: a single global list, lowest order first, the man page's own worked sequence (500, 100, 300, 200, 201 evaluates as 100, 200, 201, 300, 500) sitting in the golden vectors. Orders must be unique, and duplicates are flagged as the hard error the reference makes them. Evaluation stops on the first match whose action is accept, discard, or reject; continue is the only non-terminal action, acknowledging the packet for logging or statistics and moving to the next rule. The rule expression is mandatory but may be empty, and empty matches ALL packets, so the tool runs deterministic shadow detection: an earlier terminal matches-all rule marks every later rule its VLAN scope covers as unreachable.

Add a `sim:` line describing a packet and the simulator answers which rule matches, honestly. The evaluator implements a BPF subset: src and dst host, net with CIDR, port, the protocol keywords in both pcap form and the (proto TCP) form F5's own examples use, with and, or, not, and parentheses. An expression outside that subset stops the walk at that rule rather than guessing, because an unknown primitive cannot even be segmented safely, and every verdict past it would be fiction.

The context panel carries what the chapter says always applies: the master switch is disabled by default, and off means no rules operate and all traffic is allowed; trusted exemptions process before rule evaluation and cannot be overridden by any rule; ARP and the important IPv4 ICMP types are exempt by default; established connections are not filtered by default; unmatched packets take the Unhandled Packet Action, default Accept; and the management interface is not affected by any of it.

Configuration is parsed, never executed. Everything runs locally; nothing you paste leaves the page.
