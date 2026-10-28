## What it does

Paste an `f5-tenants:tenants` block, either the CLI form or the RESTCONF JSON, and the tool reads it back: the lifecycle state and what it means, the image and which platform it belongs to, the blades and VLANs, and each field explained. Local and offline; it parses the text and contacts no platform.

## The check that makes it more than a glossary

F5 publishes the minimum memory as **(3.5 × 1024 × vCPU) + 512**, so two vCPUs need 7680 MB and four need 14848 MB. The tool computes that minimum and **shows it beside the configured value**, warning when the allocation is below it.

It also warns when a vCPU count appears with no memory value, because **the two move together**: raising cores alone leaves the tenant below its new minimum.

## The lifecycle rule it states

**To change vCPU or memory on a deployed tenant you must move it back to `provisioned` first**, make the change, then return it to `deployed`. It is not a live operation, and the tool says so on every deployed tenant rather than waiting to be asked.

## Platform shape

It flags what belongs to which machine. **VELOS** is a chassis, where `nodes` names blades within a chassis partition and a tenant can span them. **rSeries** is an appliance with no partitions or blades, and `vcpu-cores-per-node` must be a multiple of four. A valid two-vCPU VELOS tenant **will not commit on an rSeries**, and an image bundle named `ALL-VELOS` will not deploy on one either, which the tool points out from the filename alone.

## What it will not do

It cannot know how much of your platform is already allocated, so it validates a tenant against the published formula rather than against remaining capacity. Whether the blade has the memory free is a question for the platform.

## Share results

Under the summary, **Share results** builds a link to this page, only when you press it, that carries the box as typed after the `#`, and nothing else. Its popover says first what the link carries, then a caution of its own: the block names the tenant's management address, gateway and VLANs, so read it before you send the link. Then it offers Copy link and, where the browser has one, its share sheet; the page's address is not changed.

A tenant block holds no password or key: F5's [tenant lifecycle reference for the VELOS API](https://clouddocs.f5.com/api/velos-api/api-chassis-tenant.html) (read 2026-10-27) configures a tenant with its name, type, image, nodes, management address, prefix length, gateway, VLANs, cryptos, vCPUs, memory, running state and appliance mode. The credentials that page uses belong to the API request, not to the block.

[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-10-27) has the fragment "separated from the rest of the URI prior to a dereference", so the text is not sent to the server when the link is opened; it stays in the address bar and the history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters in all, the bound the site uses for every value after the `#`; a longer share gets no link, and the popover says how long it is.
- **Opening a link.** The text fills the box as a paste would and the page reads it; nothing is sent anywhere. The value then leaves the page's address at once, without a request, so a reload or the page's own Share button carries nothing.
