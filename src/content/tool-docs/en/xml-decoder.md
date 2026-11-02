## What it does

Paste XML and the tool parses it into a readable structure: the XML declaration, the DOCTYPE and any entities it declares, and the full element tree with its namespaces and attributes, along with CDATA, comments, and processing instructions. It checks that the document is well-formed and runs a security analysis of the XML attack surface. It fetches nothing and resolves nothing.

## What it shows

XML packs several kinds of node into one document, and the tool separates them out: the **declaration** with its version and encoding; the **DOCTYPE** and any **entities** it defines; the **element tree**, with **namespaces** (the `xmlns` bindings) and **attributes** shown per element; and the **CDATA** sections, **comments**, and **processing instructions**. It also checks well-formedness in the XML sense: that every tag is matched and that the document has exactly one root element.

## The XML attack surface

XML is powerful in a way that makes it dangerous when it comes from an untrusted source, and the tool's security analysis flags exactly where that danger lives:

- **A DOCTYPE at all**, because the document type definition is what enables the rest;
- **External entities**, which can pull in a local file or a URL and are the mechanism of XML External Entity (XXE) attacks;
- **Parameter entities**, a form used to smuggle XXE past naive defenses; and
- **Entity expansion**, the nesting behind the billion-laughs denial-of-service attack.

Seeing these called out is the point: it tells you whether a given document is trying to do something a plain data document never would.

## Safe by construction

The tool is a text tokenizer, not an XML processor. It reads the document as text and describes its structure, and it never resolves an entity, never opens an external reference, and never expands anything. That is what lets it analyse hostile XML safely: the very features it warns you about are described, not executed. This is the general-purpose counterpart to the SAML decoder, which refuses a DTD entirely because a SAML message never legitimately has one.

## Using it

Paste an XML document and read its declaration, DOCTYPE and entities, element tree, and the security flags. The parse is deterministic and local, so it is safe to inspect XML from any source.

For every well-formedness rule of XML 1.0, with the line and column of the first failure, and to pretty-print or minify a document, use the [XML formatter and validator](/tools/xml-formatter).

## Share results

Under the well-formedness verdict, **Share results** builds a link to this page, only when you press it, that carries the document as pasted after the `#`, once the page has read it as XML. Its popover says first what the link carries, then offers Copy link and, where the browser has one, its share sheet; the page's address is not changed. XML can name internal hosts and people, so the popover asks you to read it before you send the link. Before a link is offered, the text is searched for a credential a standard defines: a PEM private key, an `Authorization` or `Proxy-Authorization` line with any scheme ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), sections 11.6.2 and 11.7.2: the value "consists of credentials"), a `Cookie` or `Set-Cookie` line with a value ([RFC 6265](https://www.rfc-editor.org/rfc/rfc6265), sections 4.1.1, 4.2.1 and 8.4, where a cookie commonly holds a session identifier), a JWT ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519), section 1), a password in a URL ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986), section 3.2.1), an AWS access key ID or a FortiOS `ENC` value; all read 2026-11-01. One of them means no link: the popover names its line, and you replace it with a placeholder and press again. A value whose name only looks like a secret (a JSON member `token`, a `password=` in a URL's query) does not block the link; the popover names the first one so you can check it. Two more places count as credentials here: the `Password` of a WS-Security `UsernameToken` ([OASIS UsernameToken Profile 1.1.1](https://docs.oasis-open.org/wss-m/wss/v1.1.1/os/wss-UsernameTokenProfile-v1.1.1-os.html), read 2026-11-01: it "provides password information (or equivalent such as a hash)"), and a signed or encrypted SAML assertion, as in the SAML decoder. An element or attribute whose name looks like a secret (`password`, `apiKey`, `client_secret`) is named in the popover instead.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-11-01) has the fragment "separated from the rest of the URI prior to a dereference", so what follows the `#` is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The document fills the box as a paste would and the page reads it, locally: no entity is resolved and nothing is fetched. The values then leave the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
