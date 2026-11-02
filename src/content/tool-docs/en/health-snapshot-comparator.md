## What it does

Declare the comparison you are making - why (post-change validation, post-incident recovery, migration cutover, drift check, or a rollback decision), against what class of target, at what scope, how good the baseline actually is, how complete the after-capture is, how long you have observed, and how much the target churns on its own - and a fixed registry of 27 original rules produces the TIERED COMPARISON REPORT: a baseline-quality statement; the dimension catalogue worth snapshotting for that target (14 dimensions, each with a churn class and exactly what to record); DELTA-INTERPRETATION guidance per dimension - should-match, read-with-care, or expected-drift under your declared churn, each with what would SUPPORT a finding and what would WEAKEN a conclusion; the validation-completeness gaps; and the GATE: continue, observe, investigate, or hold-rollback-ready, with explicit conditions that would raise or drop the tier.

## The naming-honesty contract

This tool never ingests state data and never diffs anything. YOU DECLARE THE STATES, THE TOOL GATES THE CONCLUSION - that sentence is not marketing, it is the architecture: the engine's baseline rule fires on every run to say the report is gated on declared classes, and the first checklist line is verifying the declarations against the actual captures. What the gate buys you is discipline, not omniscience: a from-memory baseline caps the verdict at investigate no matter how clean the after looks; an immediate observation window caps it at observe because convergence has not spoken; and under a rollback-decision context, ANY evidence gap converts the verdict to hold-rollback-ready - when the question is "roll back?", anything short of clean evidence means keep the rollback armed.

## Never on green components alone

The canon risk rule is structural: the state-versus-service rule also fires unconditionally, and even the best verdict remains conditional on a service-tier dimension (an end-to-end probe, a real auth transaction) agreeing with the component tier. Unchanged configuration is not health; green components are not a working service; the report says so on every run.

## Determinism and verification

Rules are pure predicates over the seven enums; the severity ladder (0 continue, 1 observe, 2 investigate) takes the maximum, and the rollback conversion is explicit in code. Verification follows the cluster's rule-firing snapshot model with two tool-specific pins: the exact GATE VERDICT and the exact selected DIMENSION SET are frozen in the vectors alongside fired rules and warnings - thirteen vectors (nine scenarios, four rejects), pinned from engine execution; any drift breaks the build.

## Share results

Under the gate's verdict, **Share results** builds a link to this page, only when you press it, that carries every field of the form after the `#`: the eight choices by their ids (`context`, `target`, `scope`, `before`, `after`, `window`, `churn`, `preset`, always) and the three notes as typed (`title`, `changeref`, `notes`). Its popover says first what the link carries, then a caution of its own (notes can name the devices compared and the change ticket), then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

Your ticks are not in it: they are your own progress on this page (the Markdown export carries them), and they belong to the result, not to what you typed.

The notes are where host names, customers, people and ticket numbers go, so before a link is offered they go through the site's secrets check. A value that is a credential by its format means no link, and the popover names the note: a PEM private key ([RFC 7468](https://www.rfc-editor.org/rfc/rfc7468), sections 10 and 11), Authorization credentials ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 11.6.2), a Cookie line ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), section 4.2.1), a JWS or JWE (the serialisation JWTs use, [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), a password in a URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1), an AWS access key ID or a FortiOS `ENC` value. Put a placeholder in its place and press again. A value whose name only looks like a secret (`db_password=...`) still gets a link, and the caution line names the note so you check it first.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so the form is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The choices and notes are set, the checklist ticks start empty, and the gate is computed as it is on a change; nothing is fetched. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

## API input

The API-parity entry takes a JSON object: `{"context", "target", "scope", "beforeConfidence", "afterState", "window", "churn", "preset", "notes": {"changeRef", "title", "notes"}}`. All fields except `notes` use the closed vocabularies shown in the form; an out-of-vocabulary value is a format error, never a guess.
