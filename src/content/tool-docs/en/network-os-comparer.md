## What it does

Fourteen network operating systems (IOS, IOS XE, IOS XR, NX-OS, Junos, Junos Evolved, EOS, TMOS, F5OS, EXOS, VOSS, FortiOS, PAN-OS and Gaia), each with its lineage, what it runs on, how components share state, where control and forwarding divide, how changes are applied, and what an upgrade costs.

**Pick one for a full profile. Pick two to see them axis by axis**, with a note on each axis explaining why that axis predicts anything.

## The axis that matters most

**How state is shared** predicts failure behaviour better than anything else:

- **Shared memory**: a fault spreads. Classic IOS runs everything in one address space with no memory protection.
- **Message passing**: a fault is contained. IOS XR restarts the process.
- **A state store**: a restarted process **resumes** rather than rebuilds. Arista's SysDB and Junos Evolved's distributed data store both work this way, and Evolved's survives the process coming back on a different node.

The second axis is **immediate versus candidate-and-commit**. Immediate means a mistake is live. Commit means a mistake is an abandoned edit: the difference between an incident and an afternoon.

## Every entry lists weaknesses

**A golden vector asserts that no entry has fewer than two.** An entry with no cost listed is an advertisement, and a reader would be right to distrust the rest of the table. That includes the platforms this site's author teaches and is authorised on.

The same audit checks that every entry has lineage, at least two strengths, and a differentiator substantial enough to say something; it caught a thin field on the first run.

## What it will not do

It is not a feature matrix and not a buying guide. It does not track current versions, deliberately: **versions move and architecture does not**, and a table that went stale every quarter would be worse than no table.

It also cannot tell you which one to buy. What it can tell you is what each one will do when something breaks, which is a more durable question.

## Share results

Under the profile's facts, or under the comparison's title, **Share results** builds a link to this page, only when you press it, that carries the systems you chose after the `#`, by their ids: `os` always (so the link keeps its meaning if the starting system changes) and `with` when a second system is chosen. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so the choice is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **Opening a link.** The two selects are set and the page shows the profile or the comparison, as choosing them does. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
