## What it does

Paste an F5 BIG-IP AS3 declaration, the JSON you POST to `/mgmt/shared/appsvcs/declare`, and this reads it back to you: whether it is a full AS3 request or an ADC-only declaration, the top-level options, the ADC metadata, and the Tenant to Application to resource tree with every class named and explained. It also checks the structural rules F5 documents. It is a decode-only tool that runs entirely in your browser, grounded in F5's AS3 user guide and schema reference.

## Request or declaration

The first thing it tells you is which of two shapes you pasted. A full AS3 request has `class: "AS3"` and carries `action` (deploy, dry-run, retrieve, remove, patch) and `persist`, wrapping the declaration. An ADC-only declaration has `class: "ADC"` at the top and omits the wrapper, which means the action and persist options are not available. The tool surfaces the action and persist for a request, and the schemaVersion, id, label, and remark for the ADC declaration either way.

## The tree it walks

Below the metadata, the tool walks the fixed AS3 hierarchy: each Tenant (which becomes a BIG-IP partition), each Application (with its template, noting when generic is defaulted in AS3 3.20 and later), and each resource object inside. For every object it shows the class and a plain-language explanation, from Service_HTTP and Service_HTTPS through Pool, Monitor, TLS_Server, TLS_Client, Certificate, Persist, WAF_Policy, Endpoint_Policy, and iRule. A class it does not recognise is still listed and marked, never hidden.

## The structural checks

Alongside the explanation, the tool applies the documented rules that make a declaration valid: a top-level AS3 or ADC class, a required schemaVersion, at least one Tenant containing at least one Application containing at least one resource, and the template and service-class matching rule (a template of http, https, tcp, udp, or l4 requires a matching Service object named service, formerly serviceMain). It also flags reserved names (Common, Shared, service) as informational and checks that object names follow the 1 to 64 character, letter-first, alphanumeric rule.

## Share results

Under the verdict, **Share results** builds a link to this page, only when you press it, that carries a copy of the declaration after the `#`, never the paste: every value AS3's [schema reference](https://clouddocs.f5.com/products/extensions/f5-appsvcs-extension/latest/refguide/schema-reference.html) (read 2026-10-27) defines as a secret is replaced by `[redacted]`. That is the `ciphertext` of a Secret object (with the default `protected` header it is the secret itself, only base64url-encoded), a `passphrase`, `password`, `secret`, `sharedSecret` or `token` written as a plain string, the named passphrases (`cookiePassphrase`, `md5SignaturePassphrase`, `javaSignKeyPassphrase`), a Certificate's `privateKey` and `pkcs12` inlined or given as `base64` or `text`, the AS3 request's `targetPassphrase` and every `targetTokens` value, and the Service Discovery credentials (`secretAccessKey`, `apiAccessKey`, `encodedCredentials`, `encodedToken`). Its popover says first what the link carries and how many values were replaced, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

This page never shows those values, so the receiving page reads the same declaration; the copy keeps every other byte, spacing and order included. A key given as a `bigip` path or a `url` stays, and so do `accessKeyId`, names, addresses, iRules and monitor `send` strings, which the schema does not mark as secrets: check those yourself before you share.

A paste that is not valid JSON cannot be cut apart safely: if it names one of those settings anywhere, there is no link and the popover asks for the JSON to be fixed first; if it names none, it goes as typed and the receiving page shows the same parse error.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-10-27) has the fragment "separated from the rest of the URI prior to a dereference", so the copy is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The copy fills the box as a paste would and the page explains it; nothing is sent anywhere. The value then leaves the page's address at once, without a request, so a reload or the page's own Share button carries nothing.

## Scope and grounding

This is a structure explainer and sanity checker, not a full JSON-Schema validator. It does not reproduce the entire AS3 schema or check every property, so a declaration that passes here can still be rejected by AS3 itself; treat a clean result as a good sign rather than a guarantee. Nothing you paste is uploaded or leaves the page. Grounded in F5's AS3 documentation; for a deployment, validate against your AS3 version and the schema reference.
