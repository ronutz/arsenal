## What it does

Takes two colours, written in any notation CSS Color Level 4 defines, and answers the question a stylesheet raises at every text and every control: can this be read against that? It computes the WCAG contrast ratio between them, tests it against every level of the three contrast criteria, previews the pair, converts each colour to every notation with its relative luminance, and, where a level fails, finds the nearest foreground that would pass it.

## What it reads

- **Named colours**: the 148 names of CSS Color Level 4 Section 6.1 (gray and grey, both spellings), and `transparent` (transparent black).
- **Hex**: `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`; the case of the letters does not matter, and a short form is expanded by replicating each digit.
- **rgb() / rgba()**: numbers 0 to 255 or percentages, legacy commas or modern spaces with `/ alpha`; out-of-range components are clamped, as the specification does at parsed-value time.
- **hsl() / hsla()** and **hwb()**: a hue as a number or angle (deg, grad, rad, turn), then percentages or numbers 0 to 100.
- **lab()**, **lch()**, **oklab()**, **oklch()**: with the specification's percentage reference ranges (lab a and b: 100% = 125; lch C: 100% = 150; oklab a and b: 100% = 0.4; oklch C: 100% = 0.4; L: 100% = 100 for Lab, 1 for OKLab).
- **color()**: `srgb`, `srgb-linear`, `display-p3`, `display-p3-linear`, `xyz`, `xyz-d65`, `xyz-d50`.
- `none` as a component counts as zero, as the specification says.

## What it computes

- **Relative luminance** (WCAG 2.2): each sRGB channel is linearised (c / 12.92 up to 0.04045, else ((c + 0.055) / 1.055) ^ 2.4) and weighted, L = 0.2126 R + 0.7152 G + 0.0722 B. WCAG 2.0 and 2.1 wrote the threshold as 0.03928; for 8-bit channel values the two thresholds classify every value identically.
- **Contrast ratio**: (L1 + 0.05) / (L2 + 0.05), lighter over darker, from 1:1 to 21:1.
- **Levels**: Success Criterion 1.4.3 Contrast (Minimum), Level AA, 4.5:1 for text and 3:1 for large-scale text; 1.4.6 Contrast (Enhanced), Level AAA, 7:1 and 4.5:1; 1.4.11 Non-text Contrast, Level AA, 3:1 for user interface components and graphical objects. Large-scale text is at least 18 point, or 14 point bold.
- **Alpha**: a translucent foreground is composited over the background before measuring (simple alpha blending in sRGB, as a display paints it), because WCAG defines contrast between the colours as shown. Alpha on the background is ignored.
- **Gamut**: a colour outside sRGB (a display-p3 yellow, a saturated oklch()) is clipped to the gamut for the sRGB notations and for the luminance, and marked; the Lab, LCH, OKLab, OKLCH and XYZ forms keep the unclipped value.
- **Fixes**: for each level the pair misses, the foreground's lightness is moved in OKLCH, lighter and darker, with hue and chroma kept (chroma reduced only when the result would leave the gamut), until the target is reached; the result is given as hex and oklch() with the ratio it reaches.

## Conversions

The conversions are the specification's own sample code, transcribed: the sRGB transfer function, the rational sRGB-to-XYZ and display-p3-to-XYZ matrices, Bradford adaptation between D65 and D50, CIE Lab with its rational constants, OKLab's two matrices, the polar forms with their powerless-hue thresholds, and the HSL and HWB algorithms. The engine reproduces the specification's worked examples: `#7654CD` is `lab(44.36% 36.05 -58.99)` and `color(xyz-d65 0.21661 0.14602 0.59452)`; the lab() and oklch() example colours agree with each other; `color(display-p3 1 1 0)` lands at `oklch(0.9648 0.245 110.23)`.

## Limits

- The ratio is WCAG's formula, which the criteria require; it is not a model of perception, and a pair that passes can still be hard for some readers (thin type, small sizes, colour-vision differences). The preview is there so eyes get a vote too.
- Colour management is not modelled: the display's own profile is not consulted, and wide-gamut colours are judged by their sRGB clip.
- Fixes change lightness only. A designer may prefer to change hue or chroma; the tool shows what the lightness move alone achieves.
- Named system colours (`Canvas`, `LinkText`) and `currentcolor` depend on the page and are not read.

## Sources

- [WCAG 2.2, W3C Recommendation 12 December 2024](https://www.w3.org/TR/WCAG22/) (read 2026-10-05): relative luminance, contrast ratio, SC 1.4.3, 1.4.6, 1.4.11, large-scale text
- [CSS Color Module Level 4, W3C Candidate Recommendation Draft 30 September 2026](https://www.w3.org/TR/css-color-4/) (read 2026-10-05): notations, percentage reference ranges, named colours
- [CSS Color Level 4 sample code in the csswg-drafts repository](https://github.com/w3c/csswg-drafts/tree/main/css-color-4) (read 2026-10-05): conversions.js, utilities.js, rgbToHsl.js, hslToRgb.js, hwbToRgb.js, rgbToHwb.js
