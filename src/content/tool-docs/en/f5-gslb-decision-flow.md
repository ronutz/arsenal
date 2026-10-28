# GSLB decision-flow explainer

Paste `gtm wideip` and `gtm pool` stanzas (as `tmsh list gtm wideip a <name>` and `tmsh list gtm pool a <name>` print them) and the two-tier BIG-IP DNS (formerly GTM - Global Traffic Manager) decision renders as it really runs.

The wide-IP tier shows the pool-selection method (`pool-lb-mode`, default round-robin) with the attached pools, their order and ratio values, and the wide-IP settings that shape answers: persistence, last-resort-pool, failure-rcode behaviour, and the decision-log verbosity knob that lets you watch this same flow in the logs.

The pool tier renders the three-step chain: preferred (`load-balancing-mode`), alternate (`alternate-mode`), fallback (`fallback-mode`), each step carrying the vendor's semantics for the tier and the method. The defaults are applied and labeled when an attribute is absent: round-robin, round-robin, return-to-dns.

Underneath, deterministic observations cross-check the configuration against the documented grammar and the Load Balancing manual's rules: methods outside a tier's admitted token list, the fallback tier's ignores-availability property stated on every resolved chain, Fallback IP wiring (the method with no address, or an address no tier uses), the dynamic-ratio applicability set, zeroed QoS coefficients, member ratios no tier consumes, the Global Availability pairing rule, and the topology-at-both-tiers warning that wants each pool's fallback set to None.

A single method name explains that one method, including which tiers admit it and where its decision signal comes from (LDNS-path probing, server-side statistics, or none). The word `methods` lists both catalogues.

Everything runs locally; nothing you paste leaves the page.

## Share results

At the top of the reading, **Share results** builds a link to this page, only when you press it, that carries the box as typed after the `#`, and nothing else. Its popover says first what the link carries, then a caution of its own: wide IP and pool names identify your infrastructure, so read the paste before you send the link. Then it offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

This page skips every stanza it does not explain, so a whole configuration file still gets a reading, and a link of it would carry everything in it. So while the paste holds a secret setting there is no link, and the popover names the setting: a tmsh attribute called `password`, `passphrase` or `secret`, or one whose name ends in them (`encrypted-password`, `proxy-ca-passphrase`, `shared-secret`), `bind-pw` or `community-name`, followed by a value other than `none`; or an `Authorization` header anywhere, as in a monitor's `send` string. F5's [tmsh reference for gtm monitor http](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/gtm/gtm_monitor_http.html) (read 2026-10-27) lists `password` beside `send`, and [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (section 11.6.2, read 2026-10-27) defines the Authorization value as credentials. Remove that line and press again: this page never shows those values, so the rest reads the same.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-10-27) has the fragment "separated from the rest of the URI prior to a dereference", so the text is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The text fills the box as a paste would and the page reads it; nothing is sent anywhere. The value then leaves the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
