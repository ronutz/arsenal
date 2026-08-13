## What it does

Paste an iControl REST URL and the tool decodes it: the TMOS module, the collection, the tilde-encoded partition and folder path together with its `tmsh` equivalent, any sub-collection such as pool members, and the query options. It parses the URL text only — nothing is fetched and nothing leaves the browser.

## The tilde

`/mgmt/tm/ltm/pool/~Common~apps~web_pool` addresses `/Common/apps/web_pool`. The tilde is a folder separator, used because **a URL already uses the slash for its own structure**. The tool always shows the `tmsh` form beside the decoded parts, because that is the form most readers already know.

## The partition detail that causes 404s

A name written without a partition is resolved **in the caller's current partition**. The same request can succeed for one administrator and return 404 for another, with nothing wrong in either case. The tool says so whenever the object name is unqualified.

## Query options

`$select`, `$filter`, `$top`, `$skip`, `expandSubcollections`, `options` and `ver` are explained individually. The one worth knowing is **`expandSubcollections`**: without it, a pool comes back with no members, which is the most common surprise in this API.

## What it will not do

The module table is finite. If a path uses a module the tool does not know, it decodes the structure and **says the module is unrecognised rather than describing it from a guess**. It validates nothing against a device and cannot tell you whether the object exists.

## The companion tool

The F5OS RESTCONF path explainer decodes the platform layer underneath a tenant, which uses RESTCONF over YANG rather than this object model. The two APIs look nothing alike because they come from different traditions, not different versions.
