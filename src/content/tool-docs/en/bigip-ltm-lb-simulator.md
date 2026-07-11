## What it does

This tool simulates how a BIG-IP LTM pool distributes traffic. You configure the pool members - each with a member ratio, a node and a node ratio, a priority group, and a count of existing persistence records - then pick a load balancing method and a number of requests N, and it shows where the next N connections land as a per-member distribution. It runs entirely in your browser, and it is deterministic: the same inputs always produce the same answer.

## The methods it simulates

It simulates the static and connection- or session-based methods, because their outcome is determined by configuration and the load you supply. Round Robin sends each request to the next member in turn. Ratio (member) distributes in proportion to each member's ratio; Ratio (node) does the same by node, splitting a node's share among its members. Least Connections (member and node) sends each new connection to the least-loaded member; Weighted Least Connections weights that by ratio. Least Sessions sends to the member with the fewest persistence records - which is exactly the persistence-record count you enter per member.

## Priority groups

Priority group activation decides which members are eligible. Each member has a priority; traffic goes to the highest-priority group first, and a lower group is only activated when the number of available members in the active set falls below the threshold you set (0 disables the feature). The tool applies this and marks each member as active or on standby, so you can see a lower group sitting idle until the higher one thins out.

## What it does not simulate, and why

Fastest, Observed, Predictive, and Dynamic Ratio are dynamic methods that decide based on live runtime metrics - response time, per-second connection counts, performance trends, SNMP data. Those values are not part of a pool's configuration and change continuously, so there is no honest way to compute a fixed distribution for them from static inputs. The tool offers them in the list but, when selected, explains why it cannot simulate them rather than inventing numbers. Two more honesty notes: Least Connections is modeled from a fresh connection table because the tool takes no current-connection count, so it starts even; and Least Sessions assumes source-address or session persistence, since cookie-based persistence makes BIG-IP fall back to Round Robin.
