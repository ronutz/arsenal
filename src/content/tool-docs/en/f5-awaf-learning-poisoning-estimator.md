## What it does

This calculator answers a question every WAF instructor gets: how many requests does an attacker need to drill a hole through your F5 AWAF - Advanced WAF (formerly BIG-IP ASM - Application Security Manager) policy when the Policy Builder is left in Automatic learning mode against untrusted traffic? You describe your policy's Loosen configuration (learning mode, whether it loosens from untrusted traffic, the different-sources and different-sessions thresholds, the time spread, and the violation rating of the manipulation an attacker wants accepted) and the attacker's resources (how many distinct source IPs they control and how fast each can send), and it computes the minimum sources, requests, and elapsed time to force one automatic policy relaxation. It is a deterministic model of F5's documented Policy Builder behaviour, and it runs entirely in your browser.

## Why this matters

In Automatic learning mode, a suggestion that reaches a 100% learning score is accepted and enforced with no administrator in the loop, and the Policy Builder's Loosen stage can add entities, widen attributes, and disable violations. An attacker who floods legitimate-looking traffic (low violation rating, recurring, from many sources) can push a relaxation to 100% and get a control auto-disabled, manufacturing false negatives for future attacks. This tool puts numbers on that risk so the decision to leave learning on Automatic in production stops being abstract.

## The hard gates it checks first

Before computing any effort, the tool applies the documented rules that make automatic drilling impossible. Manual or Disabled learning means a human must accept every suggestion, so there is no automatic hole. A rating-5 violation is unlearnable: the Policy Builder never auto-relaxes it, so no amount of traffic helps. And if loosening is restricted to trusted traffic, an untrusted attacker cannot reach the Loosen path at all. Only when none of those gates apply does the tool compute attacker effort.

## How it computes effort

The binding constraint is distinct sources. The tool takes your Loosen threshold for different sources (F5 default 10 for untrusted, 1 for trusted), multiplies it by an explicit rating slowdown factor you set (F5 requires more for higher ratings but does not publish the exact curve), and reports the minimum distinct source IPs, a lower-bound request count of at least one distinct hit per required source or session, and the minimum elapsed time, which is the greater of your configured time spread and the time to deliver that volume at the attacker's throughput. If the attacker does not control enough distinct sources, the result is out of reach.

## Grounding and the honest defaults

The thresholds default to F5's documented values, and the calculator never invents F5's internal scoring math: the hard gates and the threshold arithmetic are computed, while the higher-rating cost is exposed as a factor you control rather than a fabricated number. Read your policy's real Loosen thresholds from Security, Application Security, Policy Building, Learning and Blocking Settings, and adjust the inputs to match. Nothing you enter is uploaded or leaves the page. Grounded in F5 K000134503 and the BIG-IP ASM learning documentation; for a production decision, confirm the settings against the Policy Builder documentation for your BIG-IP version.
