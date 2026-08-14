## What it does

Paste an `f5-tenants:tenants` block — the CLI form or the RESTCONF JSON — and the tool reads it back: the lifecycle state and what it means, the image and which platform it belongs to, the blades and VLANs, and each field explained. Local and offline; it parses the text and contacts no platform.

## The check that makes it more than a glossary

F5 publishes the minimum memory as **(3.5 × 1024 × vCPU) + 512**, so two vCPUs need 7680 MB and four need 14848 MB. The tool computes that minimum and **shows it beside the configured value**, warning when the allocation is below it.

It also warns when a vCPU count appears with no memory value, because **the two move together**: raising cores alone leaves the tenant below its new minimum.

## The lifecycle rule it states

**To change vCPU or memory on a deployed tenant you must move it back to `provisioned` first**, make the change, then return it to `deployed`. It is not a live operation, and the tool says so on every deployed tenant rather than waiting to be asked.

## Platform shape

It flags what belongs to which machine. **VELOS** is a chassis — `nodes` names blades within a chassis partition and a tenant can span them. **rSeries** is an appliance with no partitions or blades, and `vcpu-cores-per-node` must be a multiple of four. A valid two-vCPU VELOS tenant **will not commit on an rSeries**, and an image bundle named `ALL-VELOS` will not deploy on one either — which the tool points out from the filename alone.

## What it will not do

It cannot know how much of your platform is already allocated, so it validates a tenant against the published formula rather than against remaining capacity. Whether the blade has the memory free is a question for the platform.
