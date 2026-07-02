## What it does

Paste a SAML Response or assertion, as raw XML, base64, or URL-encoded, and the tool decodes it: the issuer, the status, the subject, the conditions, the audience, and the attributes. It runs a rule-based security assessment alongside the decode, and it parses the XML in a way that is hardened against XXE. Everything happens in your browser.

## SAML in brief

SAML, Security Assertion Markup Language, is the XML-based standard behind much of enterprise single sign-on. After you authenticate, an identity provider issues a signed **Assertion**, usually wrapped in a **Response**, that asserts who you are to a service provider. The pieces the tool pulls out are the ones that decide whether that assertion should be trusted: the **Issuer** (which IdP), the **Status** (whether authentication succeeded), the **Subject** and its NameID (who), the **Conditions** (the validity window and the **AudienceRestriction** naming who the assertion is for), and the **Attributes** (the claims about the user). Because SAML travels base64-encoded over the HTTP-POST binding and DEFLATE-compressed over HTTP-Redirect, the tool normalizes those encodings first.

## The security model: XXE rejection

The headline property of this tool is how it parses. Untrusted XML is dangerous because of XML External Entity (XXE) attacks and entity-expansion attacks like billion laughs, and both of those require the document to declare a DTD, through a `DOCTYPE` or an `<!ENTITY>` declaration, to define their entities. A legitimate SAML message never needs a DTD, so the parser rejects any document that contains one outright. That single rule defeats classic XXE and the billion-laughs expansion by construction, rather than trying to sanitize them after the fact.

## What the assessment checks

Beyond decoding, the tool evaluates the message against SAML security guidance: whether it is signed, whether it relies on weak signature or digest algorithms (such as SHA-1), and whether its conditions and audience are present and coherent. If the assertion is encrypted, the tool detects the `EncryptedAssertion` and reports it rather than attempting to decrypt it. These checks mirror the questions in the OWASP SAML guidance, so the output points at the things that actually cause SAML vulnerabilities.

## Using it

Paste a SAML Response or assertion in any of its common forms and read the decoded issuer, status, subject, conditions, audience, and attributes, along with the security assessment. The parse is deterministic and local, and the XXE-rejecting parser makes it safe to inspect untrusted messages.
