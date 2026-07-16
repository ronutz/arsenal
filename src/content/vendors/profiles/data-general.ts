// ============================================================================
// DATA GENERAL - the soul of a new machine. Knowledge-based, dates
// well-documented (2026-07-16): founded 1968, Hudson MA area, by Edson de
// Castro (designer of DEC's PDP-8, walked out when Olsen shelved his 16-bit
// design) with Henry Burkhardt, Richard Sogge, Herbert Richman; Nova 1969
// ($8,000 16-bit mini - a phenomenon; "the best small computer in the
// world" ads); Eclipse 1974; the Eagle/MV-8000 project (Tom West) becomes
// Tracy Kidder's "The Soul of a New Machine" (1981, Pulitzer 1982); AViiON
// Unix servers 1989; CLARiiON storage 1992; EMC acquires Data General Oct
// 1999 (~$1.1B) - CLARiiON becomes EMC's midrange dynasty (-> Dell EMC).
// The DEC page tells the company de Castro left; this one tells the rival
// he built.
// ============================================================================

import type { VendorProfile } from "@/content/vendors/profile-types";

export const dataGeneralProfile: VendorProfile = {
  slug: "data-general",
  foundings: [
    {
      company: "Data General",
      year: 1968,
      place: "Hudson, Massachusetts",
      founders: ["Edson de Castro", "Henry Burkhardt", "Richard Sogge", "Herbert Richman"],
      story:
        "Data General was born from the industry's most famous walkout. Edson de Castro had designed DEC's PDP-8 - the machine that created the minicomputer market - and when Ken Olsen shelved his 16-bit follow-on, de Castro left with two colleagues and built it anyway. The 1969 Nova, elegant and ruthless at $8,000, forced the entire industry to respond, and Data General's swaggering ads ('the best small computer in the world') matched a company culture pugnacious enough that Tracy Kidder's book about it won the Pulitzer Prize.",
    },
  ],
  timeline: [
    { year: 1969, title: "The Nova", detail: "Sixteen bits on four boards at a price that embarrassed everyone - the Nova sells tens of thousands and makes Data General the fastest-rising rival of the company its founder walked out of." },
    { year: 1974, title: "Eclipse", detail: "The upmarket line extends the franchise into the mid-range - and sets up the architecture fight that the next decade's most famous engineering story is about." },
    { year: 1980, title: "The Eagle - and the book", detail: "Tom West's skunkworks MV-8000 catches DEC's VAX from behind; Tracy Kidder embeds with the team, and 'The Soul of a New Machine' (Pulitzer, 1982) makes 'signing up' and midnight debugging the permanent mythology of engineering itself." },
    { year: 1989, title: "AViiON: the Unix pivot", detail: "Proprietary minis are dying; Data General bets on Motorola 88000 (later Intel) Unix servers - the AViiON line - and on something on the side called storage." },
    { year: 1992, title: "CLARiiON", detail: "The disk-array side project becomes the main event: open-systems RAID storage that outsells expectations and quietly becomes the company's future while the servers fade." },
    { year: 1999, title: "EMC closes", detail: "October 1999: EMC completes the ~$1.1 billion acquisition, wanting exactly one thing - CLARiiON - which becomes EMC's midrange storage dynasty and lives on today deep inside Dell's storage lineage.", sourceNote: "Close per the deal record." },
  ],
  products: [
    { name: "Nova and Eclipse", what: "The minicomputer lines that made DEC sweat - tens of thousands sold into labs, factories, and OEM racks." },
    { name: "MV-8000 'Eagle'", what: "The 32-bit comeback machine - and the protagonist of the most celebrated engineering book ever written." },
    { name: "CLARiiON", what: "The storage array that outlived the company - EMC's midrange line for two decades after the acquisition." },
  ],
  innovations: [
    { title: "The lean machine", detail: "The Nova's minimalist elegance - maximum computer from minimum boards - set a cost-engineering standard the whole minicomputer industry chased." },
    { title: "Engineering as literature", detail: "Kidder's embedded account of the Eagle team gave the industry its defining self-portrait: how ambitious systems actually get built, deadline mythology included." },
  ],
  markets: [
    "Data General's markets dissolved with the minicomputer, but CLARiiON's DNA persists in Dell's storage portfolio - and the Eagle's story persists in every engineering team that has ever signed up.",
  ],
  analyst: [
    "DEC's sharpest tormentor in the minicomputer evaluations of the 70s - and, in the end, remembered less for market share than for the book that explained the industry to itself.",
  ],
};
