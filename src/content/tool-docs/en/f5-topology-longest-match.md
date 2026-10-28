# GTM topology longest-match scorer

The folklore says longest match wins. The documentation says something sharper: Longest Match is a sort of the record list, and the scores decide. This tool computes the whole thing the way BIG-IP DNS (formerly GTM - Global Traffic Manager) does.

Paste `gtm topology` records (as tmsh prints them: `gtm topology ldns: <source> server: <destination> { score N }`, with `not` negation supported on either side), optional `gtm region` stanzas (positive members; nested regions resolve), one `source` line declaring the LDNS attributes to evaluate (`ip=`, `country=`, `continent=`, `isp=`, `region=`), and optionally a `candidates` line naming the destinations to score (otherwise the pool and datacenter destinations in the records become the candidates).

The output shows the records in Longest Match sorted order, each with its rank rationale: the negation bucket (plain entries above server-side negations, above LDNS-side negations, above wildcards, per K10721), the type ladder (subnets by longest mask, then datacenter and pool, region, ISP, country, continent), and the weight. Types the sources do not rank are placed after the verified ladder and flagged, never guessed.

Then the scoring walk: each candidate receives its score from the first record in the sorted list that matches it, and later records for that candidate are marked shadowed. The candidate with the highest score wins; equal top scores round-robin. Which is why a wildcard carrying weight 100 really does beat a /32 carrying weight 5, and the tool shows exactly where that happens.

Without a `source` line, the sorted list renders on its own. Everything runs locally; nothing you paste leaves the page.

## Share results

Under the winner (at the top of the reading when there is none), **Share results** builds a link to this page, only when you press it, that carries the box as typed after the `#`, and nothing else. Its popover says first what the link carries, then a caution of its own: topology records name your subnets, regions, pools and data centres, so read them before you send the link. Then it offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

This page skips every stanza it does not explain, so a whole configuration file still gets a reading, and a link of it would carry everything in it. So while the paste holds a secret setting there is no link, and the popover names the setting: a tmsh attribute called `password`, `passphrase` or `secret`, or one whose name ends in them (`encrypted-password`, `proxy-ca-passphrase`, `shared-secret`), `bind-pw` or `community-name`, followed by a value other than `none`; or an `Authorization` header anywhere, as in a monitor's `send` string. F5's [tmsh reference for gtm monitor http](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/gtm/gtm_monitor_http.html) (read 2026-10-27) lists `password` beside `send`, and [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (section 11.6.2, read 2026-10-27) defines the Authorization value as credentials. Remove that line and press again: this page never shows those values, so the rest reads the same.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-10-27) has the fragment "separated from the rest of the URI prior to a dereference", so the text is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The text fills the box as a paste would and the page reads it; nothing is sent anywhere. The value then leaves the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
