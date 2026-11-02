## What it does

Paste a p0f v3 SYN signature in the canonical grammar - ver:ittl:olen:mss:wsize,scale:olayout:quirks:pclass - and the tool decodes all eight fields, explains the initial-TTL and window reasoning, names every TCP option and quirk token, and matches the field shape against p0f's documented OS reference signatures. It accepts either a bare signature or the "label = sig" form.

## Why it is passive

p0f fingerprints by watching packets a host already sent - the SYN of a normal connection - and never sends a probe of its own. That is what "passive" means here, and it is why the technique is invisible to the target. This tool takes that one step further into pure teaching: you paste a signature you already hold, and nothing is read from your own machine or sent anywhere.

## The proxy tell

The single most useful reading is the initial TTL. Because every router decrements TTL, a value near 64 says Linux/BSD/Darwin, near 128 says Windows, near 255 says network gear. When that stack TTL contradicts the operating system a User-Agent claims, you are almost certainly looking at a proxy or NAT: the packet carries the intermediary's stack, not the client's. The option layout and quirks refine the guess; the tool shows each one's contribution.

## Share results

Under the OS read, **Share results** builds a link to this page, only when you press it, that carries the signature as typed (`input`) after the `#`, and nothing else. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

A p0f signature describes how a host builds a TCP SYN (TTL, options, window, quirks); it names no host or person.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so the signature is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **Opening a link.** The signature fills the box as a paste would and the page decodes it; nothing is sent. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
