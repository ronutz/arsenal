// ============================================================================
// NVIDIA - the GPU company that became the network's biggest customer, and
// one of its vendors. Knowledge-based, dates well-documented (2026-07-16):
// founded April 1993 (Jensen Huang, Chris Malachowsky, Curtis Priem; the
// Denny's story); NV1 1995 stumbles, RIVA 128 1997 saves it; GeForce 256
// Oct 1999 marketed as the first GPU; programmable shaders 2001; CUDA
// 2006-07 - the decade-early bet; AlexNet 2012 ignites GPU deep learning;
// Mellanox acquisition closes April 2020 (~$7B) - InfiniBand, Spectrum
// Ethernet, BlueField DPUs: Nvidia becomes a networking vendor outright;
// Hopper/H100 2022; first to $1T May 2023, $2T Feb 2024, $3T June 2024,
// with stretches as the world's most valuable company; Blackwell 2024-25.
// Networking angle is the site-relevant frame: NVLink scale-up, InfiniBand
// and Spectrum-X scale-out - the AI fabric wars.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const nvidiaProfile: VendorProfile = {
  slug: "nvidia",
  foundings: [
    {
      company: "Nvidia",
      year: 1993,
      place: "Sunnyvale, California (founded over a Denny's booth, per company lore)",
      founders: ["Jensen Huang", "Chris Malachowsky", "Curtis Priem"],
      story:
        "Three engineers bet in 1993 that graphics would become the hardest and most valuable problem in computing. The first chip nearly killed the company; the RIVA 128 saved it; the GeForce 256 gave the product category its name - GPU. The decisive move came in 2006: CUDA made the graphics chip programmable for anything, a decade before the world needed exactly that. When deep learning arrived (AlexNet, 2012, trained on gaming cards), Nvidia owned the substrate - and its 2020 Mellanox acquisition made it, quietly, one of the most important NETWORKING companies on earth.",
    },
  ],
  timeline: [
    { year: 1997, title: "RIVA 128", detail: "After the NV1's near-fatal stumble, the RIVA 128 wins the 3D accelerator market on performance-per-dollar - the survival chapter every Nvidia history starts with." },
    { year: 1999, title: "GeForce 256", detail: "October 1999: hardware transform-and-lighting, marketed as the world's first GPU - the acronym sticks, the category is named, and the IPO the same year funds the run." },
    { year: 2006, title: "CUDA", detail: "The bet that defines the company: general-purpose programmability across every GeForce shipped, plus a decade of unprofitable ecosystem-building - so when researchers needed massive parallel math, the tool was already on their desks." },
    { year: 2012, title: "AlexNet", detail: "A neural network trained on two consumer GPUs crushes the ImageNet benchmark - the deep-learning ignition. The datacenter business that follows turns Nvidia from a components maker into the platform of the AI era." },
    { year: 2020, title: "Mellanox - Nvidia becomes a network vendor", detail: "The ~$7 billion acquisition closes: InfiniBand, Spectrum Ethernet switching, ConnectX NICs, BlueField DPUs. The insight - the datacenter is the computer, so the NETWORK is the backplane - makes fabric performance Nvidia's own product problem.", sourceNote: "Deal figure per the public record at closing, April 2020." },
    { year: 2023, title: "The trillion-dollar ascent", detail: "May 2023: first chipmaker to a $1 trillion market cap; $2T follows in February 2024 and $3T that June, with stretches as the world's most valuable company - the market pricing compute, and the fabrics that feed it, as the era's scarcest resource.", sourceNote: "Milestone dates per the public record." },
    { year: 2024, title: "Blackwell and the fabric wars", detail: "NVLink scale-up domains, InfiniBand scale-out, and Spectrum-X Ethernet pitched against the merchant-silicon world - the AI cluster's network becomes the industry's central architecture argument, with Nvidia on both sides of the buyer's table." },
  ],
  products: [
    { name: "GeForce / RTX", what: "The consumer graphics line that funded everything - and named the GPU category." },
    { name: "CUDA", what: "The programming platform that is the actual moat - the software layer a generation of AI is written against." },
    { name: "InfiniBand, Spectrum-X, BlueField", what: "The Mellanox-heritage networking portfolio: the fabrics and DPUs of the AI datacenter." },
  ],
  innovations: [
    { title: "The GPU as general-purpose compute", detail: "CUDA converted a graphics part into the era's defining processor - the platform bet that paid off a decade later, at civilization scale." },
    { title: "The network as the backplane", detail: "Nvidia's fabric thesis - NVLink up, InfiniBand or Spectrum-X out - made network topology a first-order compute design parameter; every AI-cluster diagram on these pages reflects it." },
  ],
  markets: [
    "Nvidia dominates AI compute and is a top-tier networking vendor by revenue through the Mellanox lineage - simultaneously the network industry's biggest customer, its most demanding workload, and one of its vendors.",
  ],
  analyst: [
    "First of the contemporaries by design: no company more directly sets what today's networks must carry - and its InfiniBand-versus-Ethernet position is the live argument every AI-fabric design this site's readers touch must answer.",
  ],
};
