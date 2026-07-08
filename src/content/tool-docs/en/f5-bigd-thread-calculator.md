## What it does

BIG-IP 21.1 rebuilt bigd, the health-monitor daemon, as a single multi-threaded instance able to serve up to 15,000 control-plane monitors, and documented exactly how the automatic thread count is derived from the vCPU count. This tool encodes those two formulas verbatim: enter a vCPU count plus the system type and it returns the thread count the system would derive, the bigd.numprocs manual-override cap, and the monitor ceiling. A bare number computes both formulas side by side.

## The two formulas

For hyperthreaded systems, F5's release notes state `Number of BigD Threads = (Number of vCPUs × 6) ÷ 10`, with the rationale that HT cores run at roughly 60% of a real core's performance. For normal (non-HT) systems the formula is `Number of BigD Threads = (Number of vCPUs ÷ 2) − 1`. Where a formula yields a fraction (8 vCPUs hyperthreaded gives 4.8), the release notes state no rounding rule, so the tool shows both the exact value and its whole-thread floor and says so plainly. At 2 vCPUs the normal formula's honest result is 0; bigd still runs, so read that edge as minimal threading, not absence.

## The override and the ceiling

The db variable `bigd.numprocs` sets the thread count manually but is capped at the number of available vCPUs; its default 0 means automatic calculation with the formulas above. The multi-threaded daemon supports up to 15,000 control-plane monitors. For sizing context, F5's 21.0 notes recommend keeping bigd at or below 5,000 monitor instances and moving beyond that to In-TMM monitors, which scale to 25,000 with an 8 GB extramb allocation.

## Which platforms are hyperthreaded

The formula choice is a platform fact, and F5's own platform documentation settles it. On rSeries, the family splits down the middle: the mid-range and high-end appliances (r5000, r10000, and the r12000 family in F5's sizing tables) run hyperthreading, each Intel core appearing as two vCPUs, while the r2000 and r4000 use a CPU class without hyperthreading and are counted in physical cores only. VELOS is hyperthreaded on both blade types: a tenant's vCPUs are hyperthreads, two per physical core, with BIG-IP tenants using the HT-Split arrangement (K15003) where TMM takes one hyperthread of each core. iSeries and VIPRION also count vCPUs as hyperthreads in F5's sizing language, but neither runs BIG-IP 21.x, so for them the tool shows the mapping as context only. Virtual Edition inherits whatever the hypervisor exposes: check inside the guest (`lscpu`, Thread(s) per core) and pick the matching formula.

Type the platform straight into the input: `8 r10900` selects the hyperthreaded formula, `16 r4800` the normal one, `22 velos` hyperthreaded, `8 ve` shows both with the check-your-host note. An explicit `ht` or `normal` word always overrides the platform default, for the case where hyperthreading was disabled in firmware.

## Worked examples

`8 ht` yields 4.8 exact, 4 whole threads. `10 ht` lands whole at 6. `16 normal` gives 7. `40 ht` gives 24. `6` alone shows both: 3.6 (floor 3) hyperthreaded, 2 normal.

## Provenance

Formulas, cap behavior, and the 15,000 ceiling are verbatim from F5's "New Features in BIG-IP Version 21.1.0" release notes (BigD enhancements for large-scale configurations), fetched 2026-07-08; the 5,000-instance guidance and In-TMM figures are from the 21.0.0 counterpart. The running system's actual thread count is always authoritative.
