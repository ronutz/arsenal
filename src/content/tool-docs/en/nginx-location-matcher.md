## What this tool does

Paste the `location` lines from a server block plus one `request <uri>` line, and the matcher runs NGINX's documented selection algorithm in front of you. It names the winning block and shows the whole walk: what happened at each of the five steps and why, including the steps that did not decide anything.

## The rule it exists to teach

**NGINX does not pick the first location that matches, and it does not pick the last.** It tries an exact match first and stops if one hits. It then checks every prefix location and remembers the **longest** match, not the first. If that prefix carries `^~` it wins immediately. Otherwise regular expressions are tried **in file order** and the first one that matches wins, beating the remembered prefix. Only if no regex matches does the prefix win after all.

File order decides exactly one of those five steps, which is why reading a config from top to bottom actively misleads you about the result.

## The two results people meet the hard way

A `/images/` prefix block loses to a `~ \.(gif|jpg|png)$` block written below it, because regexes are tried after the prefix round and beat it. The more specific-looking block, written first, is outranked by design.

And `^~` does not mean "higher priority" — it means **stop before the regular expressions**. That is precisely why it fixes the case above.

## What else it reports

Alongside the walk, the tool inspects the configuration itself: prefix blocks a regular expression could take over (with the `^~` fix named), duplicate locations, and the absence of a `location /` catch-all.

## Honest limits

One server block: no `server_name` selection and no listen-port matching. The `~` and `~*` patterns compile to JavaScript regular expressions — PCRE and JS agree on the syntax used in ordinary location blocks, but they are different engines, so trust NGINX itself for anything exotic. No `rewrite`, `try_files` or internal redirects: this answers which block is selected, not what the whole request does. The URI is matched as written, because NGINX decodes before matching and doing half of that here would be worse than doing none.
