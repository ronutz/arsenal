## What it does

Describe the situation — managed device or not, on a site or roaming, whether the certificate bundle can be installed, whether policy needs to name the user — and the tool says which steering method fits: the endpoint client, an IPsec or GRE tunnel, an explicit proxy, or chaining from a proxy already in place. **Every method lists what it costs, chosen or not**, because a tool that only listed the downsides of the options it rejected would be an advert for the one it picked.

## The interaction it warns about

**The client detects other steering methods and by default disables itself when it finds IPsec, GRE or an explicit proxy.** So running both is not automatically belt and braces — it is one of them, decided by a setting most people have never opened.

The tool also offers the third arrangement: deploy the client alongside the tunnel **not to steer**, but to provision certificates and supply user identity. The tunnel carries the traffic; the client answers who the user is.

## The hard limit it states

**Without the Netskope root and intermediate certificates on the endpoint there is no TLS inspection and no SAML authentication.** Traffic arrives and policy runs — on metadata. A rule written as though content were visible will look correct in the console and will not do what its author believes.

## How this differs from the steering decision explainer

They answer different questions and both are on this site:

- **This tool is a design question**: which on-ramp should be deployed for this situation?
- **The steering decision explainer is a runtime question**: given a steering configuration already in place, what happens to *this specific flow* — steered, bypassed, blocked or direct?

Choose the method here; trace the flow there.

## What it will not do

It does not know your licences, your tenant or your existing configuration. DNS steering, for instance, requires specific licences and applies only to certain configuration types, which the tool cannot verify for you.
