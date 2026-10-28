# OneConnect source-mask explainer

OneConnect keeps server-side connections alive and hands them to the next eligible request, and the whole word doing the work in that sentence is eligible. The source mask decides eligibility, and the man page states its two poles plainly: 0.0.0.0, the default, shares reused connections across all clients; a host mask shares only among connections from the same client IP. Everything between behaves like a subnet mask, grouping clients by the bits it keeps.

Paste an `ltm profile one-connect` stanza and every option renders with the v17 reference's own semantics, defaults filled in explicitly rather than assumed: max-age 86400, max-reuse 1000, max-size 10000, limit-type none. The strict limit carries the manual's own warning, that idle connections will block new ones until they expire even when they could have been reused, a configuration the page itself calls not recommended outside special cases. share-pools gets its cross-virtual semantics; the idle-timeout-override option gets an honest flag for the man page's own quirk, declared as disabled or enabled but described as a number of seconds.

The simulation is the marquee. Give it a mask, a list of client IPs, and optionally a SNAT address, and the reuse groups render. With the SNAT present you watch the ordering both K7208 and K5911 state do its work: translation happens first, the mask applies to the translated address, so a single SNAT address collapses every client into one reuse group no matter how narrow the mask. That collapse is the production surprise this tool exists to make visible before it happens to you.

Two pieces of statistics honesty from F5's own lab article close the audit: max-size divides across TMM instances rather than forming one global pool, and the Current Idle counter includes every idle server-side connection whether or not the mask makes it eligible. Read `tmsh show` output with both in mind.

Everything runs locally; nothing you paste leaves the page.

## Share results

Under the profile's name, under the mask simulation's reuse groups, or at the head of the settings catalogue, **Share results** builds a link to this page, only when you press it, that carries the box as typed after the `#`: a profile, a mask simulation line or `settings`. A one-connect profile holds no secret setting ([F5's tmsh reference, ltm profile one-connect](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_profile_one-connect.html), read 2026-10-27). Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-10-27) has the fragment "separated from the rest of the URI prior to a dereference", so the text is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The text fills the box as a paste would and the page explains it. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
