## What it does

Paste a p0f v3 SYN signature in the canonical grammar - ver:ittl:olen:mss:wsize,scale:olayout:quirks:pclass - and the tool decodes all eight fields, explains the initial-TTL and window reasoning, names every TCP option and quirk token, and matches the field shape against p0f's documented OS reference signatures. It accepts either a bare signature or the "label = sig" form.

## Why it is passive

p0f fingerprints by watching packets a host already sent - the SYN of a normal connection - and never sends a probe of its own. That is what "passive" means here, and it is why the technique is invisible to the target. This tool takes that one step further into pure teaching: you paste a signature you already hold, and nothing is read from your own machine or sent anywhere.

## The proxy tell

The single most useful reading is the initial TTL. Because every router decrements TTL, a value near 64 says Linux/BSD/Darwin, near 128 says Windows, near 255 says network gear. When that stack TTL contradicts the operating system a User-Agent claims, you are almost certainly looking at a proxy or NAT: the packet carries the intermediary's stack, not the client's. The option layout and quirks refine the guess; the tool shows each one's contribution.
