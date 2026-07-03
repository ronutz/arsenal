## What it does

Paste an ltm pool stanza and the tool explains its load-balancing method in F5's own terms: what the method weighs, how it behaves, when the vendor says to choose it, and the sharp edges to watch. It then cross-checks the method against the rest of the pool and flags the combinations that quietly misbehave, such as ratio weights under a mode that ignores them or a weighted mode missing the connection limits it needs. You can also type a single method name for its full explanation, the word "methods" for the whole catalogue, or answer two questions in the chooser panel for a sourced recommendation. Everything runs in your browser and contacts no device.

## Static and dynamic, member and node

The 19 documented modes split along two axes. Static modes, Round Robin and Ratio, decide from configuration alone and never notice live server state. Dynamic modes react to something measured: open connections, sessions, response speed, or monitor-fed server metrics. The second axis is the scope suffix. A member mode counts a server's work inside this pool only; a node mode counts it across every pool the server belongs to, which is the fair count when the same machines serve several pools.

## What each family weighs

Round Robin weighs nothing but whose turn it is, and it is the default. Ratio follows a proportion you declare. Least Connections picks whoever has the fewest connections open at that exact moment, which absorbs uneven connection durations. Observed smooths that instant count into a per-second ratio, and Predictive adds the trend, preferring members that are improving. Weighted Least Connections reads each member's connection-limit as its capacity and balances by percentage of it. Ratio Least Connections combines your declared ratio with the live count. Dynamic Ratio takes the proportion out of your hands entirely and keeps recomputing it from server measurements. Least Sessions and Ratio (session) count persistence sessions instead of connections, and Fastest follows response speed, tracked as outstanding Layer 7 requests.

## The cross-checks

The observations are deterministic readings of the pasted config against documented rules. Member ratios under a non-ratio mode are flagged because, per K6406, ratios only apply under a ratio method. Weighted Least Connections (member) with a member left at the default connection-limit of 0 is flagged because the reference requires a limit on every member. A least-connections pool gets the slow-ramp note, since the reference singles that pairing out and the default ramp is 10 seconds. Least Sessions surfaces its virtual-server prerequisite, a persistence profile that tracks sessions. ignore-persisted-weight is explained when it applies and flagged when the mode is outside its documented scope. Priority groups are read together with min-active-members, the setting that actually arms priority-based activation.

## The chooser

Two questions drive a fixed decision table: how member capacities differ (equal, declared as a ratio, quantified as connection limits, or measured for you) and what the method should react to (nothing, live connections, the trend, sessions, or response speed). Same answers, same recommendation, always, with the reasoning and prerequisites stated. The table encodes the vendor's own guidance from K42275060 rather than opinion.

## Sources

The 19 tokens, their descriptions, and the pool options come from the tmsh ltm pool reference. The when-to-use guidance and the least-sessions prerequisite come from K42275060. The dynamic-mode mechanics, the OneConnect exclusion, and the ratios-need-a-ratio-method rule come from K6406.
