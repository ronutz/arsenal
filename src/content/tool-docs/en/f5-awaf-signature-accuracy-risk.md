## What it does

Read the two properties F5 publishes for every attack signature in F5 AWAF - Advanced WAF (formerly BIG-IP ASM - Application Security Manager): its Accuracy and its Risk. Add whether the signature even applies to your systems and whether it is enforced, and the tool tells you how false-positive-prone the signature is, how much damage a real match would do, and the tuning move that follows. It is deterministic and runs entirely in your browser.

## Why properties, not a signature-ID lookup

F5's signature set is proprietary and enormous, so a per-ID database would be neither feasible nor honest. But F5 documents what Accuracy and Risk mean for every signature, and those two properties are what actually drive false-positive tuning, so the tool works from them. You read Accuracy, Risk, and Systems straight from the signature's own entry in the policy.

## Accuracy is false-positive susceptibility

F5 defines accuracy as a signature's ability to identify the attack, including its susceptibility to false-positive alarms, and states plainly that higher accuracy results in fewer false positives. So a Low accuracy signature has a high likelihood of false positives, Medium has some, and High has a low likelihood. Risk is a separate axis: the potential damage if the attack succeeds, from reconnaissance (Low) to sensitive-data exposure or moderate damage (Medium) to full system compromise or denial of service (High).

## The accuracy-by-risk quadrant

The tool places the signature in a 2x2. Low accuracy plus low risk is the prime relax candidate: frequent false positives, little lost by relaxing. Low accuracy plus high risk is false-positive-prone but dangerous, so you investigate the actual request before disabling rather than waving a possible real attack through. High accuracy plus high risk is a reliable, high-stakes block you do not relax. High accuracy plus low risk is reliable but low-stakes. It also flags a signature that targets a system your application does not run as pure noise, and surfaces accuracy as a lever: because accuracy is a signature-set filter criterion, a set weighted toward higher-accuracy signatures produces fewer false positives.

## Grounding

The accuracy and risk definitions come from F5's Working with Attack Signatures documentation and the classic BIG-IP ASM attack-signature reference (which spells out the low, medium, and high false-positive likelihood and signature-set scoping by system and accuracy), plus K70544352 on reducing false positives. Nothing you select is uploaded or leaves the page.

## Share results

Under the verdict, **Share results** builds a link to this page, only when you press it, that carries the four choices after the `#` by their ids: `accuracy`, `risk`, `system` and `enforcement`. All four always go, so the link keeps opening the same reading. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **Opening a link.** The four choices are set and the page computes as it does on a change. A choice the page does not offer makes the link ignored as a whole. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
