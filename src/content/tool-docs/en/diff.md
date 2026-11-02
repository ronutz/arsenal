## What it does

Compare two blocks of text and see exactly what changed: a line-by-line view of additions and deletions, with word-level highlighting inside lines that were edited so you can spot the specific change. You can optionally ignore whitespace or case. Everything is computed in your browser; your text is never sent anywhere.

## How a diff is computed

A good diff is not a naive line-by-line comparison; it finds the smallest set of changes that turns the first text into the second. The tool does this by computing the **longest common subsequence** (LCS) of the two texts: the longest sequence of tokens that appears, in order, in both. Whatever is in that common subsequence is unchanged; everything in the first text but not in the LCS is a **deletion**, and everything in the second text but not in the LCS is an **insertion**. This is the idea at the heart of the classic Myers diff algorithm, and it produces a minimal edit script, the fewest additions and deletions that explain the difference.

## Two levels: lines and words

The same LCS operation runs at two granularities. For the main view, the tokens are whole lines, which gives you the familiar added-and-removed line list. For a line that changed rather than being added or removed outright, the tool runs the diff again with words, spaces, and punctuation as the tokens, and highlights just the parts of the line that actually differ. That inline highlighting is what turns "this line changed" into "this word changed".

## Determinism

When two different edit scripts are equally short, a diff has to pick one, and the tool always picks the same way (it prefers a deletion when the two directions are equally good). That fixed tie-break makes the output deterministic: the same two inputs always produce the same diff, with no dependence on timing or anything external.

## Using it

Paste the original text in one side and the changed text in the other, and read the line-by-line differences with inline word highlights. Turn on the ignore-whitespace or ignore-case options when you care about content rather than formatting.

## Share results

Under the result's head (or under "no differences", which is a reading too), **Share results** builds a link to this page, only when you press it, that carries after the `#` both texts as pasted, Original and Changed, and the two options. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed. Compared texts can be private, so the popover asks you to read both before you send the link. The texts go as pasted: a value replaced in both boxes could hide the very change you are showing. Before a link is offered, the text is searched for a credential a standard defines: a PEM private key, an `Authorization` or `Proxy-Authorization` line with any scheme ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sections 11.6.2 and 11.7.2: the value "consists of credentials"), a `Cookie` or `Set-Cookie` line with a value ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sections 4.1.1 and 4.2.1), a JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), a password in a URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1: the "user:password" form "is deprecated"), an AWS access key ID or a FortiOS `ENC` value; all read 2026-11-01. One of them means no link: the popover names the box and the line, and you replace it with a placeholder and press again. A value whose name only looks like a secret (`db_password = ...`, a `token=` in a URL) does not block the link; the popover names the first one so you can check it.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** Both boxes and both options are set as you would set them, and the page compares. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
