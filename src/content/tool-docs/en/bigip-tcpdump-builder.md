## What it does

Assemble a correct `tcpdump` command for an F5 BIG-IP from structured choices: the interface (in BIG-IP's own syntax), how much TMM flow detail to include, the snap length, whether to write a capture file, and a BPF filter. The tool formats the command for you to copy and run on the device; it captures nothing itself and contacts no device.

## Why BIG-IP tcpdump is different

On a BIG-IP, `tcpdump` runs against the Traffic Management Microkernel (TMM), and the interface argument is where it departs from stock tcpdump. Two BIG-IP-specific pieces matter most:

- **The `0.0` interface** means every TMM data interface at once. It is powerful for finding where traffic is (or is not) flowing, but it is not rate-limited, so a filter is essential to avoid overwhelming the capture.
- **The `:n` detail suffix** controls how much internal TMM information each packet line carries, and this is the part people most often get wrong.

## The detail suffix, and the mistake to avoid

Appending a suffix to the interface raises the "noise" level:

- **`:n`** (low) adds the virtual server name, the interface, and the direction.
- **`:nn`** (medium) adds flow details.
- **`:nnn`** (high) adds the IP and port of both sides of the BIG-IP, so you can follow a single connection across the proxy.

A trailing **`p`** (as in `:nnnp`, or just `:p`) captures both sides of the proxy at once: the client-to-BIG-IP flow and the BIG-IP-to-pool-member flow. The classic mistake is to confuse this `:n` interface suffix with the `-n` command-line flag, which does something entirely unrelated (it disables name resolution). They are separate things, and the tool models them separately so you do not conflate them.

## Using it

Choose the interface and detail level, set a snap length and an output file if you want them, add a BPF filter, and copy the assembled command. It is built from the options in F5's own packet-tracing guidance (K411 and K13637), so it is the command a BIG-IP will actually accept.
