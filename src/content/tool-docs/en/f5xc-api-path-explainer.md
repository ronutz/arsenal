## What it does

This tool explains an OpenAPI or Swagger specification - the exact artifact F5 Distributed Cloud (XC) API Protection works with. XC imports an OpenAPI spec (version 2.0 or 3.0.x) to build its API inventory and enforce a positive security model, and XC API Discovery generates a downloadable Swagger JSON you can edit and re-import. Paste that spec and this tool lists every path and operation with its method, parameters, request body, responses, and whether it requires authentication. It runs entirely in your browser.

## The inventory it builds

For each path, the tool walks every operation - GET, POST, PUT, PATCH, DELETE, and the rest - and reports the same details XC uses to define valid behavior: the parameters (name, location, and whether they are required), the request body content types, the response codes, and the security schemes that apply. It resolves local $ref parameters within the document, so a parameter defined once and referenced across operations is shown in full at each use. The summary at the top counts the paths, the operations, and how many are unauthenticated, object-level, or deprecated.

## Authentication, resolved correctly

Whether an operation requires authentication is not always stated on the operation itself. OpenAPI lets you set a global security requirement and override it per operation - and an operation with an empty security list is explicitly public, even if the API has a global requirement. The tool resolves this the way the spec defines it: an operation uses its own security if present, otherwise the global one, and an empty list means no authentication. That is why an operation can show as unauthenticated even in an API that mostly requires a token.

## The flags, and why they map to OWASP

The tool flags two things that matter for API security. An operation with no effective security is a Broken Authentication risk - it is reachable without credentials. An endpoint with a path parameter, like /orders/{id}, is an object-level access point and the classic surface for Broken Object Level Authorization, the top item on the OWASP API Security Top 10: the API must check that the caller is allowed to touch that specific object, not just that they are logged in. These are prompts to verify your authorization design, not proof of a vulnerability - but they are exactly the endpoints worth checking first.
