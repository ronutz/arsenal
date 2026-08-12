## What it does

Paste an F5OS RESTCONF path and the tool decodes it segment by segment: the API root, the YANG module prefixes, the container hierarchy, and any list keys such as `tenant=tenant1`. It names the modules it recognises and says what each one governs. It parses the path text only: nothing is fetched, no schema is consulted, and nothing leaves the browser.

## Why an F5OS path needs decoding

F5OS, the platform layer beneath tenants on VELOS and rSeries, is driven by **RESTCONF** (RFC 8040) over data modelled in **YANG**, not by iControl REST over the TMOS object model. Somebody fluent in `/mgmt/tm/ltm/virtual` meets `/restconf/data/f5-tenants:tenants/tenant=tenant1/config` and has no way to tell which part is a module, which is a container, and which selects an instance. That is a vocabulary problem rather than a hard one, and it is what this tool removes.

## The module prefix and the prefixing convention

`f5-tenants:tenants` is the node `tenants` in the YANG module `f5-tenants`. F5OS uses vendor-neutral **OpenConfig** modules — `openconfig-system`, `openconfig-interfaces`, `openconfig-vlan` — alongside F5's own `f5-` modules. **Only the first node of a module carries the prefix**; nodes beneath it are written bare because they inherit it. A prefix reappearing part-way down a path means the path has crossed into a different module, which is the single most useful thing to notice when reading one.

## List keys, and the port duality

RESTCONF addresses a list entry by putting its key in the path — `tenant=tenant1` selects one tenant from the `tenants` list — rather than by a query parameter. The tool marks these separately from plain containers.

It also explains the port arrangement that catches people: F5OS originally exposed RESTCONF on **port 8888** under `/restconf`, and from **F5OS 1.8** the same API is reachable on the standard HTTPS port under `/api`. Two paths that look different can address the identical resource. Authentication uses an `X-Auth-Token` header, and that token is itself a JWT, so it expires.

## What it will not do

The module table is finite and deliberately short. If a path uses a module the tool does not know, it decodes the structure and **says the module is unrecognised rather than describing it from a guess**. It also validates nothing against a schema, because it has none: it cannot tell you whether a node exists in your F5OS release, only how the path you typed is constructed.

## Using it

Paste a bare path, a full URL, or a path with a query string. Query parameters are set aside and named, because they qualify the request rather than identify the resource.
