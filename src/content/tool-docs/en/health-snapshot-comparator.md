## What it does

Declare the comparison you are making - why (post-change validation, post-incident recovery, migration cutover, drift check, or a rollback decision), against what class of target, at what scope, how good the baseline actually is, how complete the after-capture is, how long you have observed, and how much the target churns on its own - and a fixed registry of 27 original rules produces the TIERED COMPARISON REPORT: a baseline-quality statement; the dimension catalog worth snapshotting for that target (14 dimensions, each with a churn class and exactly what to record); DELTA-INTERPRETATION guidance per dimension - should-match, read-with-care, or expected-drift under your declared churn, each with what would SUPPORT a finding and what would WEAKEN a conclusion; the validation-completeness gaps; and the GATE: continue, observe, investigate, or hold-rollback-ready, with explicit conditions that would raise or drop the tier.

## The naming-honesty contract

This tool never ingests state data and never diffs anything. YOU DECLARE THE STATES, THE TOOL GATES THE CONCLUSION - that sentence is not marketing, it is the architecture: the engine's baseline rule fires on every run to say the report is gated on declared classes, and the first checklist line is verifying the declarations against the actual captures. What the gate buys you is discipline, not omniscience: a from-memory baseline caps the verdict at investigate no matter how clean the after looks; an immediate observation window caps it at observe because convergence has not spoken; and under a rollback-decision context, ANY evidence gap converts the verdict to hold-rollback-ready - when the question is "roll back?", anything short of clean evidence means keep the rollback armed.

## Never on green components alone

The canon risk rule is structural: the state-versus-service rule also fires unconditionally, and even the best verdict remains conditional on a service-tier dimension (an end-to-end probe, a real auth transaction) agreeing with the component tier. Unchanged configuration is not health; green components are not a working service; the report says so on every run.

## Determinism and verification

Rules are pure predicates over the seven enums; the severity ladder (0 continue, 1 observe, 2 investigate) takes the maximum, and the rollback conversion is explicit in code. Verification follows the cluster's rule-firing snapshot model with two tool-specific pins: the exact GATE VERDICT and the exact selected DIMENSION SET are frozen in the vectors alongside fired rules and warnings - thirteen vectors (nine scenarios, four rejects), pinned from engine execution; any drift breaks the build.

## API input

The API-parity entry takes a JSON object: `{"context", "target", "scope", "beforeConfidence", "afterState", "window", "churn", "preset", "notes": {"changeRef", "title", "notes"}}`. All fields except `notes` use the closed vocabularies shown in the form; an out-of-vocabulary value is a format error, never a guess.
