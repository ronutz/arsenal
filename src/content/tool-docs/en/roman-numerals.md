## What it does

Type a number (1 to 3999) and read its Roman numeral; type a numeral and read its value. The tool always shows the canonical subtractive form and how it is built place by place: 1994 is M + CM + XC + IV. Everything is computed in your browser.

## Honest validation

Historical additive spellings the Romans themselves used - IIII on clock faces, MDCCCCX on building facades - are accepted, valued correctly, and flagged with the canonical form beside them. Truly malformed strings are refused with the specific rule they break: IL is not a legal subtractive pair (only IV, IX, XL, XC, CD, CM subtract), VV repeats a symbol that never repeats, IIX subtracts two symbols where only one may be subtracted.

## Why it stops at 3999

The classical system has seven symbols, no zero, and nothing above M (1000). For larger values the Romans wrote a vinculum - an overline multiplying by 1000 - which has no plain-text form. Rather than invent a convention, the tool states the limit.

## Share results

Under the result, **Share results** builds a link to this page, only when you press it, that carries the number or numeral as typed after the `#`, once the page has converted it; a value it refuses has nothing to share. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **Opening a link.** The value fills the box as a paste would and the page converts it. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
