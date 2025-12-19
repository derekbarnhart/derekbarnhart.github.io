import { Oklch } from './types';

// Minimal OKLCH utilities: clamping, parsing, formatting and conversion to sRGB for APCA.

export function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function oklch(l: number, c: number, h: number): Oklch {
  return { l: clamp(l, 0, 1), c: Math.max(0, c), h: ((h % 360) + 360) % 360 };
}

export function parseOklch(str: string): Oklch | null {
  // Accepts strings like: oklch(0.95 0.06 25)
  const m = str.trim().match(/^oklch\(([^)]+)\)$/i);
  if (!m) return null;
  const parts = m[1].split(/[\s,]+/).map(Number);
  if (parts.length !== 3 || parts.some((x) => Number.isNaN(x))) return null;
  return oklch(parts[0], parts[1], parts[2]);
}

export function formatOklch(c: Oklch): string {
  return `oklch(${round(c.l, 4)} ${round(c.c, 4)} ${round(c.h, 2)})`;
}

export function round(n: number, d = 3) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

// Conversion OKLCH -> sRGB for APCA computation
// Based on https://bottosson.github.io/posts/oklab/ and CSS Color 4.
export function oklchToSRGB(c: Oklch): { r: number; g: number; b: number } {
  // Convert OKLCH -> OKLab
  const a = c.c * Math.cos((c.h * Math.PI) / 180);
  const b = c.c * Math.sin((c.h * Math.PI) / 180);
  const L = c.l;
  const A = a;
  const B = b;

  // OKLab -> linear sRGB
  const l_ = L + 0.3963377774 * A + 0.2158037573 * B;
  const m_ = L - 0.1055613458 * A - 0.0638541728 * B;
  const s_ = L - 0.0894841775 * A - 1.2914855480 * B;

  const l3 = l_ ** 3;
  const m3 = m_ ** 3;
  const s3 = s_ ** 3;

  const r_lin = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const g_lin = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const b_lin = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

  // linear sRGB -> sRGB
  function compand(x: number) {
    const v = Math.max(0, Math.min(1, x));
    return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  }
  return { r: compand(r_lin), g: compand(g_lin), b: compand(b_lin) };
}

// Relative luminance of sRGB per WCAG for APCA input.
export function relativeLuminanceSRGB(r: number, g: number, b: number): number {
  function lin(c: number) {
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }
  const R = lin(r);
  const G = lin(g);
  const B = lin(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

// Simple OKLCH distance for distinctness checks.
export function oklchDistance(a: Oklch, b: Oklch): number {
  const dh = Math.abs(a.h - b.h);
  const dhMin = Math.min(dh, 360 - dh);
  const dl = a.l - b.l;
  const dc = a.c - b.c;
  return Math.sqrt(dl * dl + dc * dc + (dhMin / 360) * (dhMin / 360));
}

