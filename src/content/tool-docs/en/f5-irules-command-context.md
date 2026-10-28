# iRules command / context explainer

An iRule is Tcl with a contract: code runs when events fire, commands are valid in some events and not others, and a handful of constructs quietly cost you every CPU core but one. This tool reads the contract back.

Paste an iRule and every `when` block renders as a card. The event's identity comes from the Master List of iRule Events on clouddocs, condensed faithfully, with its module and a link to its reference page; events outside the curated BIG-IP LTM - Local Traffic Manager scope table still parse and are flagged rather than guessed at. The block's commands are inventoried, namespaced and bare alike, each linked directly to its reference page.

When an event appears in more than one block, the evaluation order renders per the priority command's documented rules: values 0 to 1000, default 500, lower runs first, same priority runs in insertion order, and across multiple iRules on one virtual the rule listing order breaks the remaining ties.

The CMP audit is the part that pays rent, and every finding is sourced to the CMP Compatibility page. Global variables are not CMP-compatible; the validator catches the global form as of v10 and the virtual server is demoted, which means every connection it carries lands on a single TMM. The documented alternative for shared statics is the `static::` namespace, and the tool says so on sight. Keys generated in RULE_INIT get one instance per TMM, so cross-TMM decryption fails; statistics profiles count per TMM instance. The audit names each of these where it sees them.

One honesty note, engineered in deliberately: per-command event-validity lists live on each command's own reference page and vary by version, so the tool links every command's page rather than reproducing validity tables it has not verified. A single event name renders its card; the word `events` renders the module-grouped catalogue.

The iRule is parsed and read, never executed. Everything runs locally; nothing you paste leaves the page.

## Share results

At the top of the reading, **Share results** builds a link to this page, only when you press it, that carries the box (an iRule, an event name or `events`) as pasted after the `#`, and nothing else. Before you copy anything, the popover adds a caution: an iRule can name internal hosts, pools and data groups.

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
