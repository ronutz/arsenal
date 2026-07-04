## What it does

Paste an F5 BIG-IP AS3 declaration, the JSON you POST to `/mgmt/shared/appsvcs/declare`, and this reads it back to you: whether it is a full AS3 request or an ADC-only declaration, the top-level options, the ADC metadata, and the Tenant to Application to resource tree with every class named and explained. It also checks the structural rules F5 documents. It is a decode-only tool that runs entirely in your browser, grounded in F5's AS3 user guide and schema reference.

## Request or declaration

The first thing it tells you is which of two shapes you pasted. A full AS3 request has `class: "AS3"` and carries `action` (deploy, dry-run, retrieve, remove, patch) and `persist`, wrapping the declaration. An ADC-only declaration has `class: "ADC"` at the top and omits the wrapper, which means the action and persist options are not available. The tool surfaces the action and persist for a request, and the schemaVersion, id, label, and remark for the ADC declaration either way.

## The tree it walks

Below the metadata, the tool walks the fixed AS3 hierarchy: each Tenant (which becomes a BIG-IP partition), each Application (with its template, noting when generic is defaulted in AS3 3.20 and later), and each resource object inside. For every object it shows the class and a plain-language explanation, from Service_HTTP and Service_HTTPS through Pool, Monitor, TLS_Server, TLS_Client, Certificate, Persist, WAF_Policy, Endpoint_Policy, and iRule. A class it does not recognize is still listed and marked, never hidden.

## The structural checks

Alongside the explanation, the tool applies the documented rules that make a declaration valid: a top-level AS3 or ADC class, a required schemaVersion, at least one Tenant containing at least one Application containing at least one resource, and the template and service-class matching rule (a template of http, https, tcp, udp, or l4 requires a matching Service object named service, formerly serviceMain). It also flags reserved names (Common, Shared, service) as informational and checks that object names follow the 1 to 64 character, letter-first, alphanumeric rule.

## Scope and grounding

This is a structure explainer and sanity checker, not a full JSON-Schema validator. It does not reproduce the entire AS3 schema or check every property, so a declaration that passes here can still be rejected by AS3 itself; treat a clean result as a good sign rather than a guarantee. Nothing you paste is uploaded or leaves the page. Grounded in F5's AS3 documentation; for a deployment, validate against your AS3 version and the schema reference.
