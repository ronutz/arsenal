## What it does

Give the tool a certificate's start and end dates, its `notBefore` and `notAfter`, and it works out the practical consequences: how long the certificate is valid, which phase of the CA/Browser Forum's shrinking-validity schedule it was issued under and whether its length fits that phase's cap, how many renewals per year that cadence implies, the reuse windows for domain and identity validation in that era, and a recommended lead time and "renew by" date. It is pure date math and runs entirely offline.

## Why certificate lifetimes are shrinking

Publicly trusted TLS certificates have been getting shorter for years, and the CA/Browser Forum's ballot SC-081v3 sets out a schedule that steps the maximum validity down from 398 days, through 200 and 100 days, to 47 days by 2029. Shorter certificates limit how long a compromised or mis-issued certificate stays useful, but they also make manual renewal impractical, which is the point: the schedule effectively forces automation. Two related windows shrink alongside the validity: the period for which a domain-control validation (DCV) can be reused, and the period for which validated identity information (SII) can be reused, so more of the process must be repeated more often.

## What the plan tells you

From just the two dates, the tool derives the whole picture:

- the **validity length** and which SC-081v3 phase it corresponds to, with a clear yes or no on whether the length is within that phase's cap;
- the **renewal cadence**, expressed as renewals per year, both for the current cap and for each future cap, so you can see how the workload grows;
- the **DCV and SII reuse windows** that apply to the issuance era; and
- a **recommended renewal lead time** and the resulting "renew by" date, so a renewal completes before expiry rather than at the wire.

## Automation is the real answer

Because the endpoint of this schedule is a 47-day certificate, renewing by hand many times a year per certificate does not scale. The standard answer is the ACME protocol (RFC 8555), the automated issuance and renewal that tools like certbot use; the planner's cadence numbers are really an argument for adopting it.

## Using it

Enter the certificate's `notBefore` and `notAfter` dates and read the validity, the schedule fit, the renewal cadence, the reuse windows, and the recommended renewal date. The calculation is a pure function of those two dates; whether a certificate is expired right now is shown separately, against your device clock.
