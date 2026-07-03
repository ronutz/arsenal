# iRules vs LTM Policy classifier

The vendor ships its Local Traffic Policies examples in both forms, policy and equivalent iRule, because the two genuinely overlap. The question worth automating is which of your when blocks live in the overlap.

Paste an iRule and each block gets one of three verdicts, and only three, because honesty needs a middle bucket. Policy-expressible means every construct maps onto grammar the vendor's own 12.1 examples demonstrate: http-uri, http-header, and http-cookie conditions with equals, contains, starts-with, and ends-with; forwarding to a pool or resetting; log write, tcl: substitution included; header replace and insert; compression enable. Those blocks come with a migration sketch in exactly that grammar, marked for validation with tmsh. Verify-on-version means the constructs are plausibly covered on current releases but the sources this tool verified did not demonstrate them; HTTP::redirect is the canonical resident, and the tool says check your version's condition and action lists instead of guessing. iRule-required names the blockers: events beyond the HTTP request and response pair, Tcl loops and procedures, regex logic (the verified grammar matches with operand lists, not patterns), variables (policies have none; the tcl: substitution inside an action is the narrow documented exception), table and session state, sideband connections, payload collection, timers.

The strategies keyword renders the three matching strategies with the ltm policy-strategy reference's own semantics: first-match terminates the engine on the first matching condition; all-match executes actions for everything that matches; best-match lets the more specific match win, ties falling through to the built-in precedence table whose head the tool reproduces.

Why migrate what can migrate: LTM Policy is the layer the sources describe as highly performant and, unlike iRules, requiring no programming, and none of the iRule CMP-demotion hazards exist inside a policy. The migration mechanics per the Getting Started manual: draft, publish, attach to the virtual.

Everything runs locally; nothing you paste leaves the page.
