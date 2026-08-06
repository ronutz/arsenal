// ============================================================================
// VERIFICATION MANIFEST — verified 2026-08-05 against Kyndryl SEC filings and
// earnings releases:
//   - FY2025 (year to 31 March 2025): $1.2B of revenue tied to cloud
//     hyperscaler alliances, MORE THAN DOUBLE the prior year, exceeding the
//     ~$1B target; the "three-A's" (Alliances, Advanced Delivery, Accounts)
//     all exceeded
//   - FY2026 Q1: revenue $3.74B, hyperscaler revenue $400M (+86% YoY),
//     trailing-twelve-month signings +43%
//   - FY2026 Q2: revenue $3.7B, hyperscaler $440M (+65%), adjusted EBITDA
//     $641M (+15%), TTM signings $15.6B against TTM revenue $15.0B
//   - FY2026 Q3: revenue $3.9B, hyperscaler $500M (+58%), Kyndryl Consult
//     +24% YoY at $3.6B TTM revenue and $4.1B signings, TTM signings $15.4B,
//     eleven contracts over $50M signed in the quarter
//
// THE BODY ALREADY ARGUES the separation, the scale, the decline-versus-
// structure reading, the neutrality thesis, the Microsoft and Google timing,
// and the cool market reception. This profile answers the question the body
// leaves open: FIVE YEARS ON, DID THE THESIS HOLD?
// ============================================================================
import type { VendorProfile } from "../profile-types";

export const kyndrylProfile: VendorProfile = {
  slug: "kyndryl",
  foundings: [
    {
      company: "Kyndryl",
      year: 2021,
      place: "New York",
      founders: ["IBM"],
      story:
        "Not founded so much as separated: IBM Global Technology Services, given a name in April 2021 and its own listing on 4 November. What made it unusual as a new company was that it began with a complete customer base, a complete cost base and no ability to choose either.",
    },
  ],
  timeline: [
    { year: 2020, title: "The announcement", detail: "October: IBM says it will separate its managed infrastructure business." },
    { year: 2021, title: "Named, listed, partnered", detail: "Named in April, separated 4 November, and into hyperscaler partnerships within weeks." },
    {
      year: 2023,
      title: "The three-A's",
      detail:
        "Alliances, Advanced Delivery and Accounts: grow revenue through hyperscaler partnerships, automate delivery so people can be redeployed rather than replaced, and fix or exit the customer relationships carrying substandard margins. An unglamorous three-part programme, and the whole of the turnaround.",
    },
    {
      year: 2025,
      title: "The thesis, measured",
      detail:
        "Fiscal 2025 produced $1.2B of revenue tied to cloud hyperscaler alliances - more than double the prior year, and past the target. That figure is the neutrality argument expressed in money: it is the business the company could not have written while IBM owned it.",
    },
    {
      year: 2026,
      title: "Signings above revenue",
      detail:
        "Trailing-twelve-month signings of $15.4B to $15.6B against revenue of about $15.0B, hyperscaler revenue heading for a $1.8B target, and Kyndryl Consult growing in the mid-twenties per cent while approaching a quarter of the business. In the third quarter alone, eleven contracts over $50M each.",
    },
  ],
  products: [
    { name: "Managed infrastructure services", what: "The original business: running mainframes, networks, storage and data centres for organisations that will not run them themselves. Unfashionable, enormous, and the reason three quarters of the Fortune 100 were customers on day one." },
    { name: "Kyndryl Consult", what: "Advisory and implementation, and the deliberate move up the value chain - now around $3.6B of revenue, growing in the mid-twenties per cent, and the part of the business that decides whether the company is a contractor or an adviser." },
    { name: "Kyndryl Bridge", what: "The operating platform: the delivery telemetry from thousands of managed estates turned into a product customers see. It is what an outsourcer has that nobody else does - observed data about how large estates actually behave." },
    { name: "Hyperscaler practices", what: "Dedicated practices for the major clouds, staffed and certified separately. The point is that all of them exist at once, which is the entire proposition." },
    { name: "Security, resiliency and network practices", what: "The specialist lines sold across the same customer base - the pattern of a services firm growing by depth rather than by new logos." },
  ],
  innovations: [
    {
      title: "Neutrality as a balance-sheet item",
      detail:
        "The argument that an independent adviser can recommend any cloud is easy to make and hard to prove. Here it is measurable: hyperscaler-linked revenue more than doubled in a single year and is running toward $1.8B. That is not brand positioning, it is business that could not previously have been written.",
    },
    {
      title: "Automating delivery to redeploy rather than to cut",
      detail:
        "The Advanced Delivery initiative freed staff to serve new work and backfill attrition rather than being made redundant. Whether that framing survives contact with a downturn is untested - but a labour-intensive business that automates its own delivery has to decide what the savings are for, and this one said so out loud.",
    },
    {
      title: "Fixing or leaving unprofitable contracts",
      detail:
        "The Accounts initiative meant renegotiating or exiting business the company had inherited at bad margins. Shrinking revenue on purpose is difficult inside a public company and nearly impossible inside a division of a larger one, where the revenue line belongs to somebody else's story.",
    },
    {
      title: "Selling the operations data back",
      detail:
        "Bridge productises what the company sees across thousands of estates. An outsourcer's real asset is not its people but its observations, and turning those into something the customer can look at is the difference between selling hours and selling knowledge.",
    },
  ],
  markets: [
    "Large enterprises and governments in more than sixty countries, at around $15B of annual revenue - the organisations whose technology estates are too large, too old or too regulated to move wholesale, which is a durable position for as long as those conditions hold.",
    "It competes with the global integrators and consultancies, with the hyperscalers' own professional services, and with the offshore service providers on cost. Its distinguishing claim is the one the separation created: it can be credibly indifferent about which cloud a customer chooses.",
  ],
  analyst: [
    "Signings running above revenue is the measure worth watching in a services business, because it is the only leading indicator of a company whose revenue is contracted years ahead. On that measure the trajectory has been positive since the separation.",
    "The verdict on the original question is now largely in. Five years after a cool opening, the fastest-growing lines are the ones that depend entirely on being independent. Whether the business would have declined more slowly inside IBM is unknowable - but the business it has written since leaving is not business it could have written while it stayed.",
  ],
};
