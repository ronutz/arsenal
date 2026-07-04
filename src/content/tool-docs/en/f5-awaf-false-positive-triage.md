## What it does

Pick a violation you are triaging in F5 AWAF - Advanced WAF (formerly BIG-IP ASM - Application Security Manager): its category, its average violation rating, and whether the check is enforced, staged, or in a Transparent policy. The tool returns F5's rating-based verdict, whether the violation is blocking traffic right now, and the scoped remediation for that category if it turns out to be a genuine false positive. It is the counterpart to the poisoning estimator: that tool warns against over-relaxing, and this one shows how to relax a real false positive correctly. It is deterministic and runs entirely in your browser.

## The verdict comes from the rating

Advanced WAF assigns each transaction a violation rating from 1 to 5, and that rating decides how to treat a suspected false positive. Ratings of 4 or 5 are likely real attacks and block even when every violation's Block flag is off, so the tool tells you to clear the suggestion without changing the policy. A rating of 3 is ambiguous and must be investigated in the event log first. Ratings of 1 and 2 are usually genuine false positives, so the tool tells you to apply the scoped fix (or accept the learning suggestion) once you have confirmed the request is legitimate.

## It accounts for staging and Transparent mode

Whether a violation is actually blocking depends on enforcement. The tool marks a violation as blocking only when the policy is in Blocking mode and the rating is 4 or 5. A signature in staging logs but does not block, and a policy in Transparent mode blocks nothing, so in those cases the tool notes that the false positive is a learning signal rather than a broken user experience, and that the fix matters for when enforcement is turned on.

## The remediation is always scoped

For each violation category the tool gives the documented fix, and every option is scoped to the specific URL or parameter, never a policy-wide disable. Disabling a signature on one URL, adding an allowed entity, adding a meta-character to that entity's set, raising a specific length, marking a file-upload parameter, attaching an XML or JSON content profile, or enabling Potential False Positive Detection are all scoped actions. The tool always restates the discipline that governs the whole exercise: relax only where a false positive actually occurred, never where a real attack caused the violation.

## Grounding

The rating-to-action logic and the scoped remediations are taken from F5's K70544352 (Reducing false positive violations), the BIG-IP ASM Working with Violations documentation (which defines how the rating drives blocking and which violations are unlearnable), and the Refining Security Policies with Learning guidance. Nothing you select is uploaded or leaves the page. For a production change, confirm against the documentation and the specific request in your event log.
