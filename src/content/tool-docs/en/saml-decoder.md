## What it does

Paste a SAML Response or assertion, as raw XML, base64, or URL-encoded, and the tool decodes it: the issuer, the status, the subject, the conditions, the audience, and the attributes. It runs a rule-based security assessment alongside the decode, and it parses the XML in a way that is hardened against XXE. Everything happens in your browser.

## SAML in brief

SAML, Security Assertion Markup Language, is the XML-based standard behind much of enterprise single sign-on. After you authenticate, an identity provider issues a signed **Assertion**, usually wrapped in a **Response**, that asserts who you are to a service provider. The pieces the tool pulls out are the ones that decide whether that assertion should be trusted: the **Issuer** (which IdP), the **Status** (whether authentication succeeded), the **Subject** and its NameID (who), the **Conditions** (the validity window and the **AudienceRestriction** naming who the assertion is for), and the **Attributes** (the claims about the user). Because SAML travels base64-encoded over the HTTP-POST binding and DEFLATE-compressed over HTTP-Redirect, the tool normalises those encodings first.

## The security model: XXE rejection

The headline property of this tool is how it parses. Untrusted XML is dangerous because of XML External Entity (XXE) attacks and entity-expansion attacks like billion laughs, and both of those require the document to declare a DTD, through a `DOCTYPE` or an `<!ENTITY>` declaration, to define their entities. A legitimate SAML message never needs a DTD, so the parser rejects any document that contains one outright. That single rule defeats classic XXE and the billion-laughs expansion by construction, rather than trying to sanitize them after the fact.

## What the assessment checks

Beyond decoding, the tool evaluates the message against SAML security guidance: whether it is signed, whether it relies on weak signature or digest algorithms (such as SHA-1), and whether its conditions and audience are present and coherent. If the assertion is encrypted, the tool detects the `EncryptedAssertion` and reports it rather than attempting to decrypt it. These checks mirror the questions in the OWASP SAML guidance, so the output points at the things that actually cause SAML vulnerabilities.

## Using it

Paste a SAML Response or assertion in any of its common forms and read the decoded issuer, status, subject, conditions, audience, and attributes, along with the security assessment. The parse is deterministic and local, and the XXE-rejecting parser makes it safe to inspect untrusted messages.

To read a long message laid out line by line, the [XML formatter and validator](/tools/xml-formatter) pretty-prints it; its documentation explains why a signed message must not be sent on reformatted.

## Share results

Under the headline badges, **Share results** builds a link to this page, only when you press it, that carries the message as pasted after the `#` (raw XML, URL-encoded or base64), once the page has decoded it. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed. A SAML message names your identity provider and service provider, and a subject can name a person, so the popover asks you to check it before you send the link.

A message that carries a credential gets no link: a signed assertion, an assertion inside a signed Response, or an `EncryptedAssertion`. [SAML 2.0 Profiles](https://docs.oasis-open.org/security/saml/v2.0/saml-profiles-2.0-os.pdf) (OASIS, read 2026-11-01) says of the bearer method that "the subject of the assertion is the bearer of the assertion" (section 3.3), and that assertions delivered with the HTTP POST binding "MUST be signed" (section 4.1.4.5); the service provider only remembers used IDs for as long as the assertion is valid. So a signed assertion signs its subject in, and a link would hand that to anyone it reaches until it expires; an encrypted one ([SAML 2.0 Core](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf), section 2.3.4) is one the service provider can open. Removing the signature would change what this page shows, so the message is not copied either. An AuthnRequest, a LogoutRequest or LogoutResponse, metadata, an error Response (which "MUST NOT include any assertions", Profiles section 4.1.4.2) and an unsigned assertion all get a link.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The message fills the box as a paste would and the page decodes it, locally; it never verifies, fetches or decrypts. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
