## What this tool does

Paste the `location` lines from a server block plus one `request <uri>` line, and the matcher runs NGINX's documented selection algorithm in front of you. It names the winning block and shows the whole walk: what happened at each step and why, including the steps that did not decide anything. A query string on the request line is allowed; it is kept out of the match and only feeds `$arg_<name>` variables.

## The rule it exists to teach

**NGINX does not pick the first location that matches, and it does not pick the last.** It tries an exact match first and stops if one hits. It then checks every prefix location and remembers the **longest** match, not the first. If that prefix carries `^~` it wins immediately. Otherwise regular expressions are tried **in file order** and the first one that matches wins, beating the remembered prefix. From nginx 1.31.5, if no regex matches, predicate locations (`location $variable`) are tried in file order, and the first whose variable is neither empty nor `0` wins. Only if nothing in those two rounds matches does the prefix win after all.

File order decides only the regular-expression and predicate rounds, which is why reading a config from top to bottom actively misleads you about the result.

## The two results people meet the hard way

A `/images/` prefix block loses to a `~ \.(gif|jpg|png)$` block written below it, because regexes are tried after the prefix round and beat it. The more specific-looking block, written first, is outranked by design.

And `^~` does not mean "higher priority": it means **stop before the regular expressions** (and, from 1.31.5, before the predicate locations too). That is precisely why it fixes the case above.

The same order decides which block hands a `.php` URL to PHP-FPM; [PHP-FPM and FastCGI](/learn/php-fpm-and-fastcgi) covers what passes between NGINX and PHP after that.

## What else it reports

Alongside the walk, the tool inspects the configuration itself: prefix blocks a regular expression could take over (with the `^~` fix named), duplicate locations, the absence of a `location /` catch-all, the nginx version a predicate location needs, and any predicate whose variable has no value.

## Honest limits

One server block: no `server_name` selection and no listen-port matching. The `~` and `~*` patterns compile to JavaScript regular expressions; PCRE and JS agree on the syntax used in ordinary location blocks, but they are different engines, so trust NGINX itself for anything exotic. The [Regex Toolkit](/tools/regex)'s portability view lists, construct by construct, where PCRE2 and JavaScript read a pattern differently. No `rewrite`, `try_files` or internal redirects: this answers which block is selected, not what the whole request does. The URI is matched as written, because NGINX decodes before matching and doing half of that here would be worse than doing none. Variables are not evaluated: a `$arg_<name>` predicate reads the query string, any other variable takes the value you give it on a `variable $name value` line, and an undeclared variable counts as empty, so its predicate does not match.

## Share results

Under the winner, **Share results** builds a link to this page, only when you press it, that carries the box as typed after the `#`, once the page has a walk. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed. The grammar takes location lines, `variable` lines and the `request` line, nothing else, so no other directive can ride along; but a request line can carry a query string and a `variable` line a value. Before a link is offered, the box is searched for a credential a standard defines: a PEM private key, an `Authorization` or `Proxy-Authorization` line with any scheme ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sections 11.6.2 and 11.7.2: the value "consists of credentials"), a `Cookie` or `Set-Cookie` line with a value ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), section 8.4: servers "commonly store a nonce (or "session identifier") in a cookie"), a JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), a password in a URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1), an AWS access key ID or a FortiOS `ENC` value; all read 2026-11-01. One of them means no link: the popover names its line, and you replace it with a placeholder and press again. A value whose name only looks like a secret (a JSON member `token`, a `token=` in a query) does not block the link; the popover names the first one so you can check it.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The box fills as a paste would, and the page walks it. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

## Sources

- [NGINX documentation, ngx_http_core_module, location](https://nginx.org/en/docs/http/ngx_http_core_module.html#location) (read 2026-10-26): the selection order, `^~` skipping regular expressions and predicate locations, the predicate rule, and the worked example (configurations A to F) that the tool's tests reproduce
- [NGINX documentation, How nginx processes a request](https://nginx.org/en/docs/http/request_processing.html) (read 2026-10-26): locations test only the URI part of the request line, without arguments
- [NGINX changes log, nginx 1.31.5, 02 Sep 2026](https://nginx.org/en/CHANGES) (read 2026-10-26): "Feature: predicate locations"
