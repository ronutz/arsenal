# iRules vs LTM Policy classifier

The vendor ships its Local Traffic Policies examples in both forms, policy and equivalent iRule, because the two genuinely overlap. The question worth automating is which of your when blocks live in the overlap.

Paste an iRule and each block gets one of three verdicts, and only three, because honesty needs a middle bucket. Policy-expressible means every construct maps onto grammar the vendor's own 12.1 examples demonstrate: http-uri, http-header, and http-cookie conditions with equals, contains, starts-with, and ends-with; forwarding to a pool or resetting; log write, tcl: substitution included; header replace and insert; compression enable. Those blocks come with a migration sketch in exactly that grammar, marked for validation with tmsh. Verify-on-version means the constructs are plausibly covered on current releases but the sources this tool verified did not demonstrate them; HTTP::redirect is the canonical resident, and the tool says check your version's condition and action lists instead of guessing. iRule-required names the blockers: events beyond the HTTP request and response pair, Tcl loops and procedures, regex logic (the verified grammar matches with operand lists, not patterns), variables (policies have none; the tcl: substitution inside an action is the narrow documented exception), table and session state, sideband connections, payload collection, timers.

The strategies keyword renders the three matching strategies with the ltm policy-strategy reference's own semantics: first-match terminates the engine on the first matching condition; all-match executes actions for everything that matches; best-match lets the more specific match win, ties falling through to the built-in precedence table whose head the tool reproduces. The [Getting Started with Policies manual](https://techdocs.f5.com/en-us/bigip-15-1-0/big-ip-local-traffic-management-getting-started-with-policies/introducing-local-traffic-policies.html) (Applies To 15.1.0 to 17.5.1, read 2026-10-26) spells the best-match order out in four steps: the rule with the most conditions wins, ignoring what the conditions are; then the rule with the highest-priority condition types; then equal match types over starts-with, ends-with or contains; then the operand ordinal. The same chapter settles two cases the strategy names leave open: under all-match, when matching rules specify conflicting actions only the action of the best-match rule is implemented, and under best-match or first-match a rule without conditions becomes the default rule when it is the last entry in the Rules list.

Why migrate what can migrate: LTM Policy, native to BIG-IP LTM - Local Traffic Manager, is the layer the sources describe as highly performant and, unlike iRules, requiring no programming, and none of the iRule CMP-demotion hazards exist inside a policy. The migration mechanics per the Getting Started manual: draft, publish, attach to the virtual.

Everything runs locally; nothing you paste leaves the page.

## Share results

At the top of the verdicts, **Share results** builds a link to this page, only when you press it, that carries the box (an iRule, or `strategies`) as pasted after the `#`, and nothing else. Before you copy anything, the popover adds a caution: an iRule can name internal hosts, pools and data groups.

Before it offers a link at all, the page reads the iRule for keys and credentials written out where F5's own references put them (all read 2026-10-27):

- the pass phrase of `HTTP::cookie encrypt` and `decrypt` ([HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html));
- a key in the `AES 128 <hex>` string form, or the key of `AES::encrypt` and `AES::decrypt` written out ([AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html));
- the value of `-key` or `-keyhex` on `CRYPTO::encrypt`, `decrypt`, `sign` and `verify` ([CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html));
- an `Authorization` or `Proxy-Authorization` header written with `HTTP::header insert` or `replace` ([HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html)), whose value [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (sections 11.6.2 and 11.7.2) defines as the credentials;
- a literal given with `set` to a variable used in one of those places, as in `CRYPTO::encrypt`'s own example;
- and, from the site's secrets check, a PEM private key, a JWT, an AWS access key ID or a password in a URL.

When the page finds one, there is no link: the popover names the line, and you replace the value with a placeholder and press again. A value whose name only looks like a secret (`set static::api_token "..."`) does not stop the link; the caution line names it instead. No check finds every secret, so read what you send.

Everything the link carries goes after the `#`, which [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-10-27) has "separated from the rest of the URI prior to a dereference": a browser does not send it to the server when the link is opened, but it stays in the address bar and history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters, the bound the site uses for every value after the `#`; a longer iRule gets no link, and the popover says how long it is.
- **Opening a link.** The text fills the box as a paste would, and the page reads it as it reads a paste; the iRule is never run. Accepted or not, the values then leave the page's own address at once, without a request, so a reload, a bookmark or the page's own Share button carries nothing you did not choose to share.
