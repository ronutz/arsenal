## What it does

Describe a request — where it is going, how it is steered, whether the device is managed, whether TLS is decrypted, whether it carries a payload — and the tool shows the single pass: which services engage, in what order, which are **pillars** and which are **cross-cutting**, and what a chain of separate appliances would have done instead. Deterministic and offline; it describes an architecture rather than querying one.

## The point it exists to make

**DLP and threat protection are not pillars.** They are cross-cutting: they run inside the same pass and receive whatever the pillars decrypted. That is why one data profile covers web, software-as-a-service and private applications alike, and why the same rule in a chained architecture has to be written four times in four dialects.

The pillars are about **where traffic is going** — secure web gateway for the general web, cloud access security broker for SaaS activity, zero trust network access for a private application, cloud firewall for the ports the others do not cover. Change the destination in the tool and watch which pillars engage while the cross-cutting engines stay constant.

## The claim you can check

Single-pass means **the payload is decrypted once** and the same stream is handed to every engine. Chained appliances decrypt and re-encrypt at each hop, and that repetition is most of the latency people blame on inspection.

The tool states this as the contrast on every result, because "converged" is often a bundling claim rather than an architectural one. The question worth asking a vendor is whether the payload is decrypted once, or once per engine.

## What it will not do

It does not model any specific tenant, and it is not a policy simulator. Turn decryption off and it will tell you that everything below application identification is working from metadata — which is the failure mode it most wants a learner to internalise, because a policy written as though content were visible will sit in the console looking correct.

## Vendor scope

The stage names follow Netskope's published description of its Zero Trust Engine, since that is the platform this site's training covers. The structural argument — single pass, cross-cutting inspection, full compute at the edge — is general to SSE and is presented as such.
