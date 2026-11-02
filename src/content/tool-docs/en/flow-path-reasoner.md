## What it does

Describe the path as you believe it runs - archetype, name resolution, intermediaries, address transformation, TLS behaviour, authentication flow, and return path, plus a command-family preset - and a fixed registry of 27 original rules builds the model deterministically. Out comes a LAYERED FLOW-PATH MAP: the forward hop chain in a canonical order, rendered as a diagram with transformation and TLS markers on each node; the resolution and identity SIDE-FLOWS that run outside the primary path; the TLS segment map (each termination is a separate certificate, SNI, and cipher story); the transformation points where addresses - and therefore log identity - change meaning; evidence points naming where enforcement and logging must be established; and, above all, RANKED FAILURE-DOMAIN CANDIDATES, each with what would SUPPORT it and what would WEAKEN it. Unknown selections are never papered over: they surface as an explicit unknowns list, as quality warnings, and as score for the "path not established" domain itself.

## What it deliberately is not

The map is a PROPOSED MODEL assembled from your selections - never discovered topology. The engine's baseline rule fires on every run and says exactly that, and the verification checklist starts with confirming each hop with its owner. When two or more middleboxes are modelled, the chain uses a canonical assumed order and a rule tells you so. The tool makes no network calls, performs no discovery, claims no vendor packet-processing order, and suggests no control-bypass paths. Exports describe internal topology, so the topology-sensitivity warning also fires on every run. Free-text labels and notes flow only into the export; they never influence the rules.

## How the model is built - and how it is verified

Node insertion follows one canonical order (client, SSE edge, firewall, load balancer, proxy, VPN gateway pair, server); transformations attach to the most plausible node by a fixed preference; TLS segments derive from the declared behaviour against the TLS-capable nodes actually modelled - and when the two disagree (terminate-once declared with no capable node), the model flags the inconsistency instead of inventing a terminator. Rules are pure predicates contributing points to failure-domain candidates; ranking is score-descending with definition order as the deterministic tie-break; the signal badge is a score band (strong ≥ 60, moderate ≥ 30, weak below), never a probability.

Verification follows the cluster's rule-firing snapshot model with an FPR-specific pin: for each test input, the build asserts exactly which rules fire, the exact ranked domain list, the exact warning set, and the exact forward HOP SEQUENCE - the chain construction itself is frozen. Thirteen vectors (nine scenarios, four rejects) pin the current registry; any drift breaks the build.

## Share results

Under the modelled path, **Share results** builds a link to this page, only when you press it, that carries every field of the form after the `#`: the eight choices by their ids (`archetype`, `resolution`, `intermediary`, `transform`, `tls`, `auth`, `returnpath`, `preset`, always) and the three notes as typed (`title`, `nodelabels`, `notes`). Its popover says first what the link carries, then a caution of its own (node labels and notes can map your topology and name hosts), then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

Your ticks are not in it: they are your own progress on this page (the Markdown export carries them), and they belong to the result, not to what you typed.

The notes are where host names, customers, people and ticket numbers go, so before a link is offered they go through the site's secrets check. A value that is a credential by its format means no link, and the popover names the note: a PEM private key ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), sections 10 and 11), Authorization credentials ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2), a Cookie line ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), section 4.2.1), a JWS or JWE (the serialisation JWTs use, [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), a password in a URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1), an AWS access key ID or a FortiOS `ENC` value. Put a placeholder in its place and press again. A value whose name only looks like a secret (`db_password=...`) still gets a link, and the caution line names the note so you check it first.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so the form is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The choices and notes are set, the checklist ticks start empty, and the map is drawn as it is on a change; nothing is fetched. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

## API input

The API-parity entry takes a JSON object: `{"archetype", "resolution", "intermediaries", "transformation", "tls", "auth", "returnPath", "preset", "notes": {"nodeLabels", "title", "notes"}}`. All fields except `notes` use the closed vocabularies shown in the form; an out-of-vocabulary value is a format error, never a guess.
