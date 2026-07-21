# ZIA SSL Bypass Planner

## What it does

Paste a list of applications or destinations - one per line, in a four-field grammar - and receive a deterministic TLS inspection plan. Each asset gets one of three verdicts: **Inspect** (the default, feeding every content engine), **Do Not Inspect via policy rule** (the Edge-level exemption for governance categories and for pinned applications on paths no agent controls), or **Client Connector bypass** (the cleanest exemption for pinned applications where ZCC controls the path - the traffic never enters the tunnel, paired with a policy rule as defense in depth). Every verdict carries its sourced rationale; every bypass carries a blind-spot ledger naming what stops seeing this flow; and whenever anything goes uninspected, the plan appends the outside-backstop checklist - the Untrusted Server Certificates action, OCSP via stapling, the Minimum TLS Version floor, and Block No-SNI.

## The grammar

One asset per line, four pipe-separated fields; lines starting with `#` are comments:

```
<name> | pinned|clean | regulated|general | agent|no-agent
```

`pinned` marks a certificate-pinning application (it will not accept a certificate regenerated under the inspection CA and fails closed under interception). `regulated` marks a governance category that policy or law requires to stay sealed. `agent` marks a path the Zscaler Client Connector controls.

## Reading the plan

The summary counts the verdicts; the cards walk each asset's reasoning; the ordering note carries the doctrine that Do Not Inspect carve-outs belong at high order, above the Inspect body, because SSL policy rules evaluate in ascending order with first match. When every asset inspects, there is no bypass ledger and no backstop debt - and the plan says so.

## Honesty

The grammar is a deliberate teaching subset: real bypass planning also scopes rules by users, groups, and locations, and weighs application specifics this planner does not model. The decision logic - pinning forces an exemption, governance seals a category, everything else inspects, and every bypass is a priced blind spot - is the durable part. All computation is local; asset names never leave the page.

## Sources

Grounded in Zscaler's SSL inspection documentation (Configuring the SSL/TLS Inspection Policy; About SSL Inspection) and the Data Protection reference architecture, access date 2026-07-21. The paired Learn article is *ZIA SSL Inspection: Policy and Bypasses*.
