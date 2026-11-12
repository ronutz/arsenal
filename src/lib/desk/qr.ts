// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/desk/qr.ts
// ----------------------------------------------------------------------------
// AN IN-HOUSE QR CODE ENCODER, for pairing a second browser with My desk's
// sync (PRIME 12/11/2026 13:38, "Portable storage": "an in-house encoder, no
// package and no third-party service; byte mode, error correction M"). The
// pairing link (/<locale>/desk/#pair=<code>) is drawn as a QR code in this
// browser and nowhere else: no image service, no library.
//
// WHAT IT DOES: ISO/IEC 18004 QR Code Model 2, byte mode, error correction
// level M, versions 1 to 10 (up to 213 bytes, far more than a pairing link
// needs). The data is padded, split into blocks, given Reed-Solomon error
// correction over GF(256) (polynomial 0x11D), interleaved and placed in the
// zigzag order around the finder, timing and alignment patterns; the format
// information (BCH 15,5, mask 0x5412) and, from version 7, the version
// information (BCH 18,6) are written; and the mask with the lowest penalty
// (the standard's four rules) is kept. The structure follows the public
// description of the standard and Project Nayuki's reference explanation;
// scripts/check-desk-store.mts draws codes with it and decodes them with an
// independent reader before every build.
//
// Pure: no window, no DOM. The page draws the matrix as SVG (DeskQr.tsx).
// ============================================================================

/** Error-correction codewords per block, level M, by version (index 0 unused). */
const ECC_PER_BLOCK = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
/** Number of blocks, level M, by version. */
const NUM_BLOCKS = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];
/** Alignment pattern centres by version. */
const ALIGN = [[], [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];
/** The highest version this encoder makes. */
export const QR_MAX_VERSION = 10;

/**
 * The number of data-carrying modules of a version (everything but the function patterns), in bits.
 *
 * @param ver the version
 * @returns the count
 */
function rawModules(ver: number): number {
  // The side.
  const size = ver * 4 + 17;
  // Everything, minus finders with separators and format areas, minus timing.
  let n = size * size - 3 * 64 - 2 * 15 - 1 - 2 * (size - 16);
  // Alignment patterns, minus their overlap with the timing patterns; version information from version 7.
  if (ver >= 2) {
    // How many per side.
    const a = Math.floor(ver / 7) + 2;
    // Their modules, without the ones already counted on the timing lines.
    n -= (a * a - 3) * 25 - (a - 2) * 2 * 5;
    // The two version information blocks.
    if (ver >= 7) n -= 36;
  }
  // The count.
  return n;
}

/**
 * Codewords of a version at level M: total, and the data ones.
 *
 * @param ver the version
 * @returns total and data codewords
 */
function codewords(ver: number): { total: number; data: number } {
  // All codewords.
  const total = Math.floor(rawModules(ver) / 8);
  // Minus the error correction of every block.
  return { total, data: total - ECC_PER_BLOCK[ver] * NUM_BLOCKS[ver] };
}

/**
 * Multiply in GF(2^8) modulo x^8 + x^4 + x^3 + x^2 + 1 (0x11D).
 *
 * @param x a field element
 * @param y another
 * @returns the product
 */
function gfMul(x: number, y: number): number {
  // Russian-peasant multiplication with reduction.
  let z = 0;
  // From the top bit of y down.
  for (let i = 7; i >= 0; i -= 1) {
    // Shift and reduce.
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    // Add x when the bit is set.
    z ^= ((y >>> i) & 1) * x;
  }
  // The product.
  return z & 0xff;
}

/**
 * The Reed-Solomon generator polynomial of a degree (coefficients, highest first, leading 1 omitted).
 *
 * @param degree the number of error-correction codewords
 * @returns the divisor
 */
function rsDivisor(degree: number): number[] {
  // Start with x^0.
  const out = new Array<number>(degree).fill(0);
  // The last coefficient is 1.
  out[degree - 1] = 1;
  // Multiply by (x - r^i) for i from 0.
  let root = 1;
  // Each factor.
  for (let i = 0; i < degree; i += 1) {
    // The polynomial times x minus root.
    for (let j = 0; j < degree; j += 1) {
      // Times root.
      out[j] = gfMul(out[j], root);
      // Plus the next coefficient.
      if (j + 1 < degree) out[j] ^= out[j + 1];
    }
    // The next root.
    root = gfMul(root, 0x02);
  }
  // The divisor.
  return out;
}

/**
 * The Reed-Solomon remainder of data by a divisor: the error-correction codewords.
 *
 * @param data the data codewords
 * @param divisor the generator
 * @returns the remainder
 */
function rsRemainder(data: number[], divisor: number[]): number[] {
  // Zero to start.
  const out = new Array<number>(divisor.length).fill(0);
  // Polynomial division, one codeword at a time.
  for (const b of data) {
    // The leading term.
    const factor = b ^ (out.shift() as number);
    // Shifted.
    out.push(0);
    // Subtracted.
    for (let i = 0; i < divisor.length; i += 1) out[i] ^= gfMul(divisor[i], factor);
  }
  // The remainder.
  return out;
}

/**
 * Encode bytes as the data codewords of a version: mode, count, data, terminator, padding.
 *
 * @param bytes the data
 * @param ver the version
 * @returns the data codewords
 */
function dataCodewords(bytes: Uint8Array, ver: number): number[] {
  // The bits.
  const bits: number[] = [];
  // Append a value's low n bits, most significant first.
  const put = (val: number, n: number) => { for (let i = n - 1; i >= 0; i -= 1) bits.push((val >>> i) & 1); };
  // Byte mode.
  put(0b0100, 4);
  // The count: 8 bits up to version 9, 16 from 10.
  put(bytes.length, ver <= 9 ? 8 : 16);
  // The bytes.
  for (const b of bytes) put(b, 8);
  // The capacity in bits.
  const cap = codewords(ver).data * 8;
  // A terminator of up to four zeros.
  put(0, Math.min(4, cap - bits.length));
  // To a byte boundary.
  put(0, (8 - (bits.length % 8)) % 8);
  // Padding bytes, alternating 0xEC and 0x11.
  for (let pad = 0xec; bits.length < cap; pad ^= 0xec ^ 0x11) put(pad, 8);
  // Packed into codewords.
  const out: number[] = [];
  // Every eight bits.
  for (let i = 0; i < bits.length; i += 8) out.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
  // The data codewords.
  return out;
}

/**
 * Add error correction to each block and interleave, as the standard places them.
 *
 * @param data the data codewords
 * @param ver the version
 * @returns all codewords in placement order
 */
function interleave(data: number[], ver: number): number[] {
  // The block structure.
  const nb = NUM_BLOCKS[ver];
  // Error correction per block.
  const ecc = ECC_PER_BLOCK[ver];
  // All codewords.
  const raw = codewords(ver).total;
  // Short blocks come first.
  const numShort = nb - (raw % nb);
  // A short block's length, error correction included.
  const shortLen = Math.floor(raw / nb);
  // The divisor.
  const div = rsDivisor(ecc);
  // The blocks.
  const blocks: number[][] = [];
  // Cut the data.
  for (let i = 0, k = 0; i < nb; i += 1) {
    // This block's data.
    const dat = data.slice(k, k + shortLen - ecc + (i < numShort ? 0 : 1));
    // Moved on.
    k += dat.length;
    // Its error correction.
    const e = rsRemainder(dat, div);
    // A short block gets a placeholder so the columns line up.
    if (i < numShort) dat.push(0);
    // Kept.
    blocks.push([...dat, ...e]);
  }
  // Column by column, skipping the placeholders.
  const out: number[] = [];
  // Each column.
  for (let i = 0; i < blocks[0].length; i += 1) {
    // Each block.
    blocks.forEach((b, j) => { if (i !== shortLen - ecc || j >= numShort) out.push(b[i]); });
  }
  // In order.
  return out;
}

/** A QR code: its side and its modules (true = dark), row by row. */
export interface QrMatrix {
  /** The version chosen. */
  version: number;
  /** The side in modules (without the quiet zone). */
  size: number;
  /** Rows of modules. */
  modules: boolean[][];
}

/**
 * Encode text (as UTF-8) in a QR code, byte mode, level M, the smallest version that fits.
 *
 * @param text the text (a pairing link)
 * @returns the matrix
 */
export function encodeQr(text: string): QrMatrix {
  // The bytes.
  const bytes = new TextEncoder().encode(text);
  // The smallest version that holds them.
  let ver = 1;
  // Grown until it fits.
  while (ver <= QR_MAX_VERSION && codewords(ver).data * 8 < 4 + (ver <= 9 ? 8 : 16) + bytes.length * 8) ver += 1;
  // Too long for this encoder.
  if (ver > QR_MAX_VERSION) throw new Error("qr: text too long");
  // The side.
  const size = ver * 4 + 17;
  // The modules and which of them are function patterns.
  const mod: boolean[][] = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  // Function modules.
  const fn: boolean[][] = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  // Set a function module (x column, y row).
  const setFn = (x: number, y: number, dark: boolean) => { mod[y][x] = dark; fn[y][x] = true; };

  // Timing patterns.
  for (let i = 0; i < size; i += 1) { setFn(6, i, i % 2 === 0); setFn(i, 6, i % 2 === 0); }
  // Finder patterns with their separators.
  for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) {
    // The 9x9 area around each centre.
    for (let dy = -4; dy <= 4; dy += 1) for (let dx = -4; dx <= 4; dx += 1) {
      // The ring.
      const d = Math.max(Math.abs(dx), Math.abs(dy));
      // Inside the symbol.
      const x = cx + dx;
      const y = cy + dy;
      // Dark except the rings at distance 2 and 4.
      if (x >= 0 && x < size && y >= 0 && y < size) setFn(x, y, d !== 2 && d !== 4);
    }
  }
  // Alignment patterns (not over the finders).
  const al = ALIGN[ver];
  // Each pair of centres.
  for (let i = 0; i < al.length; i += 1) for (let j = 0; j < al.length; j += 1) {
    // The three finder corners.
    if ((i === 0 && j === 0) || (i === 0 && j === al.length - 1) || (i === al.length - 1 && j === 0)) continue;
    // The 5x5 pattern.
    for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1) setFn(al[i] + dx, al[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }

  /**
   * Write the format information for a mask (level M), both copies, and the dark module.
   *
   * @param mask the mask number
   */
  const drawFormat = (mask: number) => {
    // Level M is 00; then the mask.
    const data = (0 << 3) | mask;
    // BCH(15,5).
    let rem = data;
    // The remainder.
    for (let i = 0; i < 10; i += 1) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    // With the mask pattern applied.
    const bits = ((data << 10) | rem) ^ 0x5412;
    // Bit i.
    const bit = (i: number) => ((bits >>> i) & 1) !== 0;
    // First copy, around the top-left finder.
    for (let i = 0; i <= 5; i += 1) setFn(8, i, bit(i));
    setFn(8, 7, bit(6));
    setFn(8, 8, bit(7));
    setFn(7, 8, bit(8));
    for (let i = 9; i < 15; i += 1) setFn(14 - i, 8, bit(i));
    // Second copy, split between the other two finders.
    for (let i = 0; i < 8; i += 1) setFn(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i += 1) setFn(8, size - 15 + i, bit(i));
    // The dark module.
    setFn(8, size - 8, true);
  };
  // Reserved now (overwritten once the mask is chosen).
  drawFormat(0);

  // Version information from version 7.
  if (ver >= 7) {
    // BCH(18,6).
    let rem = ver;
    // The remainder.
    for (let i = 0; i < 12; i += 1) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    // The 18 bits.
    const bits = (ver << 12) | rem;
    // Two 6x3 blocks.
    for (let i = 0; i < 18; i += 1) {
      // The bit.
      const b = ((bits >>> i) & 1) !== 0;
      // Its two places.
      const a = size - 11 + (i % 3);
      const c = Math.floor(i / 3);
      setFn(a, c, b);
      setFn(c, a, b);
    }
  }

  // The codewords, placed in the zigzag.
  const all = interleave(dataCodewords(bytes, ver), ver);
  // The bit index.
  let bi = 0;
  // Right to left in two-column strips, skipping the vertical timing column.
  for (let right = size - 1; right >= 1; right -= 2) {
    // Past the timing column.
    if (right === 6) right = 5;
    // Down the strip, alternating direction.
    for (let v = 0; v < size; v += 1) for (let j = 0; j < 2; j += 1) {
      // The column.
      const x = right - j;
      // Upwards on every other strip.
      const up = ((right + 1) & 2) === 0;
      // The row.
      const y = up ? size - 1 - v : v;
      // Only data modules, while bits remain (the rest are the remainder bits, light).
      if (!fn[y][x] && bi < all.length * 8) {
        // The bit.
        mod[y][x] = ((all[bi >>> 3] >>> (7 - (bi & 7))) & 1) !== 0;
        // Next.
        bi += 1;
      }
    }
  }

  /**
   * Whether mask m inverts the module at (x, y).
   *
   * @param m the mask
   * @param x column
   * @param y row
   * @returns true to invert
   */
  const masked = (m: number, x: number, y: number): boolean => {
    // The eight patterns.
    switch (m) {
      case 0: return (x + y) % 2 === 0;
      case 1: return y % 2 === 0;
      case 2: return x % 3 === 0;
      case 3: return (x + y) % 3 === 0;
      case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
      case 5: return ((x * y) % 2) + ((x * y) % 3) === 0;
      case 6: return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
      default: return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
    }
  };

  /**
   * Apply (or undo: it is its own inverse) a mask to the data modules.
   *
   * @param m the mask
   */
  const applyMask = (m: number) => {
    // Every data module.
    for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) if (!fn[y][x] && masked(m, x, y)) mod[y][x] = !mod[y][x];
  };

  /**
   * The standard's penalty of the current matrix (lower is easier to read).
   *
   * @returns the penalty
   */
  const penalty = (): number => {
    // The total.
    let p = 0;
    // Runs of five or more of one colour, in rows and columns (rule 1).
    for (let pass = 0; pass < 2; pass += 1) for (let a = 0; a < size; a += 1) {
      // The current run.
      let run = 1;
      // Along the line.
      for (let b = 1; b < size; b += 1) {
        // The two neighbours.
        const cur = pass === 0 ? mod[a][b] : mod[b][a];
        const prev = pass === 0 ? mod[a][b - 1] : mod[b - 1][a];
        // Same colour: longer.
        if (cur === prev) { run += 1; if (run === 5) p += 3; else if (run > 5) p += 1; } else run = 1;
      }
    }
    // Two-by-two blocks of one colour (rule 2).
    for (let y = 0; y < size - 1; y += 1) for (let x = 0; x < size - 1; x += 1) {
      // The block.
      const c = mod[y][x];
      // All four alike.
      if (c === mod[y][x + 1] && c === mod[y + 1][x] && c === mod[y + 1][x + 1]) p += 3;
    }
    // Finder-like patterns (rule 3): 1:1:3:1:1 with four light modules on one side.
    const pat1 = [true, false, true, true, true, false, true, false, false, false, false];
    const pat2 = [false, false, false, false, true, false, true, true, true, false, true];
    // Rows and columns.
    for (let pass = 0; pass < 2; pass += 1) for (let a = 0; a < size; a += 1) for (let b = 0; b + 11 <= size; b += 1) {
      // Either pattern.
      for (const pat of [pat1, pat2]) {
        // Matched everywhere.
        let ok = true;
        // Each place.
        for (let k = 0; k < 11 && ok; k += 1) ok = (pass === 0 ? mod[a][b + k] : mod[b + k][a]) === pat[k];
        // Counted.
        if (ok) p += 40;
      }
    }
    // The balance of dark and light (rule 4).
    let dark = 0;
    // Counted.
    for (const row of mod) for (const m of row) if (m) dark += 1;
    // Ten points per 5% away from half.
    const total = size * size;
    // The deviation in steps.
    p += Math.max(0, Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
    // The penalty.
    return p;
  };

  // The best mask.
  let best = 0;
  // Its penalty.
  let bestP = Infinity;
  // Every mask tried.
  for (let m = 0; m < 8; m += 1) {
    // Applied with its format.
    applyMask(m);
    drawFormat(m);
    // Scored.
    const p = penalty();
    // Better.
    if (p < bestP) { bestP = p; best = m; }
    // Undone.
    applyMask(m);
  }
  // The chosen mask, for good.
  applyMask(best);
  drawFormat(best);
  // The code.
  return { version: ver, size, modules: mod };
}
