// A reasonably close APCA 0.0.98 approximation for text contrast evaluation.
// Returns contrast value where |value| >= threshold indicates pass.
// Positive means light text on dark background; negative means dark on light.
// Implementation adapted from public algorithm notes by Andrew Somers (SAPC/APCA).

import { Oklch } from './types.js';
import { oklchToSRGB, relativeLuminanceSRGB } from './color.js';

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export function apcaContrast(foreground: Oklch, background: Oklch): number {
  const fg = oklchToSRGB(foreground);
  const bg = oklchToSRGB(background);
  const Ltext = relativeLuminanceSRGB(fg.r, fg.g, fg.b);
  const Lbg = relativeLuminanceSRGB(bg.r, bg.g, bg.b);

  // Normalize to 0..1
  const blk = 0.02;
  const scaleBoW = 1.14;
  const scaleWoB = 1.14;
  const normBg = Lbg <= blk ? Lbg + Math.pow(blk - Lbg, 1.414) : Lbg;
  const normText = Ltext <= blk ? Ltext + Math.pow(blk - Ltext, 1.414) : Ltext;

  if (normBg < normText) {
    // dark text on light background
    const SAPC = (Math.pow(normBg, 0.56) - Math.pow(normText, 0.57)) * 1.14;
    const output = SAPC * 100;
    return clamp(-output * scaleBoW, -108, 108);
  } else if (normBg > normText) {
    // light text on dark background
    const SAPC = (Math.pow(normBg, 0.65) - Math.pow(normText, 0.62)) * 1.14;
    const output = SAPC * 100;
    return clamp(output * scaleWoB, -108, 108);
  }
  return 0;
}
