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

The tool is a text tokenizer, not an XML processor. It reads the document as text and describes its structure, and it never resolves an entity, never opens an external reference, and never expands anything. That is what lets it analyze hostile XML safely: the very features it warns you about are described, not executed. This is the general-purpose counterpart to the SAML decoder, which refuses a DTD entirely because a SAML message never legitimately has one.

## Using it

Paste an XML document and read its declaration, DOCTYPE and entities, element tree, and the security flags. The parse is deterministic and local, so it is safe to inspect XML from any source.
