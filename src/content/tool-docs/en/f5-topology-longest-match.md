# GTM topology longest-match scorer

The folklore says longest match wins. The documentation says something sharper: Longest Match is a sort of the record list, and the scores decide. This tool computes the whole thing the way BIG-IP DNS (formerly GTM - Global Traffic Manager) does.

Paste `gtm topology` records (as tmsh prints them: `gtm topology ldns: <source> server: <destination> { score N }`, with `not` negation supported on either side), optional `gtm region` stanzas (positive members; nested regions resolve), one `source` line declaring the LDNS attributes to evaluate (`ip=`, `country=`, `continent=`, `isp=`, `region=`), and optionally a `candidates` line naming the destinations to score (otherwise the pool and datacenter destinations in the records become the candidates).

The output shows the records in Longest Match sorted order, each with its rank rationale: the negation bucket (plain entries above server-side negations, above LDNS-side negations, above wildcards, per K10721), the type ladder (subnets by longest mask, then datacenter and pool, region, ISP, country, continent), and the weight. Types the sources do not rank are placed after the verified ladder and flagged, never guessed.

Then the scoring walk: each candidate receives its score from the first record in the sorted list that matches it, and later records for that candidate are marked shadowed. The candidate with the highest score wins; equal top scores round-robin. Which is why a wildcard carrying weight 100 really does beat a /32 carrying weight 5, and the tool shows exactly where that happens.

Without a `source` line, the sorted list renders on its own. Everything runs locally; nothing you paste leaves the page.
