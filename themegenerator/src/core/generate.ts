import { Alt, HueName, Mode, Oklch, ThemeConfig, TokenSet, TokensByMode } from './types.js';
import { oklch, clamp } from './color.js';

const ALTS: Alt[] = ['alt1','alt2','alt3'];

export interface GenerationOptions {
  // Allows per-mode tuning of target ranges, else defaults per spec
  light?: Partial<ModeTargets>;
  dark?: Partial<ModeTargets>;
}

export interface ModeTargets {
  L_bg: [number, number];
  C_bg: [number, number];
  L_fg: [number, number];
  C_fg: [number, number];
}

const defaultsLight: ModeTargets = {
  L_bg: [0.92, 0.97],
  C_bg: [0.03, 0.07],
  L_fg: [0.25, 0.40],
  C_fg: [0.10, 0.18],
};

const defaultsDark: ModeTargets = {
  L_bg: [0.18, 0.30],
  C_bg: [0.05, 0.10],
  L_fg: [0.78, 0.92],
  C_fg: [0.06, 0.14],
};

function lerp([a, b]: [number, number], t: number) {
  return a + (b - a) * t;
}

function buildNeutrals(neutralHue: number, mode: Mode): Pick<TokenSet, 'surface' | 'text' | 'border'> {
  const h = neutralHue;
  if (mode === 'light') {
    return {
      surface: {
        canvas: oklch(0.98, 0.01, h),
        panel:  oklch(0.96, 0.01, h),
        subtle: oklch(0.93, 0.01, h),
      },
      text: {
        primary: oklch(0.22, 0.02, h),
        muted:   oklch(0.40, 0.02, h),
      },
      border: {
        subtle: oklch(0.86, 0.01, h),
        strong: oklch(0.76, 0.01, h),
      }
    };
  }
  return {
    surface: {
      canvas: oklch(0.17, 0.02, h),
      panel:  oklch(0.21, 0.02, h),
      subtle: oklch(0.25, 0.02, h),
    },
    text: {
      primary: oklch(0.92, 0.02, h),
      muted:   oklch(0.74, 0.02, h),
    },
    border: {
      subtle: oklch(0.32, 0.02, h),
      strong: oklch(0.42, 0.02, h),
    }
  };
}

function altDeltas(mode: Mode) {
  // From spec: alt1 deeper fill, alt3 softer fill. Vary bg mainly in L; fg vary slightly in C.
  const bgDL = [-0.02, 0.0, +0.02] as const;
  const fgDC = [+0.01, 0.0, -0.01] as const;
  return { bgDL, fgDC };
}

function buildHueFamily(h: number, cBg: number, cFg: number, mode: Mode, caps: { bg: number; fg: number; accent: number }, mt: ModeTargets) {
  const { bgDL, fgDC } = altDeltas(mode);
  const color: Record<Alt, { bg: Oklch; fg: Oklch; border: Oklch; accent: Oklch }> = {
    alt1: undefined as any,
    alt2: undefined as any,
    alt3: undefined as any,
  };

  // Canonical positions for alt2
  const Lbg = lerp(mt.L_bg, 0.6); // closer to higher L for good contrast in light; in dark it's fine too
  const Cbg = clamp(Math.min(lerp(mt.C_bg, 0.6), caps.bg, cBg), 0, caps.bg);
  const Lfg = lerp(mt.L_fg, 0.5);
  const Cfg = clamp(Math.min(lerp(mt.C_fg, 0.5), caps.fg, cFg), 0, caps.fg);

  (['alt1','alt2','alt3'] as Alt[]).forEach((alt, i) => {
    const bg = oklch(
      clamp(Lbg + bgDL[i], 0, 1),
      clamp(Cbg + (i - 1) * 0.005, 0, caps.bg),
      h
    );
    const fg = oklch(
      Lfg,
      clamp(Cfg + fgDC[i], 0, caps.fg),
      h
    );
    const border = oklch(
      mode === 'light' ? (bg.l - 0.08) : (bg.l + 0.10),
      Math.max(0, bg.c - 0.01),
      h
    );
    const accent = oklch(
      fg.l + (mode === 'light' ? 0.02 : -0.02),
      clamp(Math.min(caps.accent, fg.c + 0.02), 0, caps.accent),
      h
    );
    color[alt] = { bg, fg, border, accent };
  });

  return color;
}

export function generateTokens(cfg: ThemeConfig, opts?: GenerationOptions): TokensByMode {
  const mtLight: ModeTargets = { ...defaultsLight, ...(opts?.light || {}) } as ModeTargets;
  const mtDark: ModeTargets = { ...defaultsDark, ...(opts?.dark || {}) } as ModeTargets;

  function build(mode: Mode): TokenSet {
    const mt = mode === 'light' ? mtLight : mtDark;
    const neut = buildNeutrals(cfg.neutralHue, mode);
    const color: TokenSet['color'] = {} as any;
    const names = Object.keys(cfg.hues) as HueName[];
    for (const name of names) {
      const info = cfg.hues[name];
      if (!info) continue;
      const cBg = Math.min(cfg.chromaCaps.bg, info.cBg);
      const cFg = Math.min(cfg.chromaCaps.fg, info.cFg);
      (color as any)[name] = buildHueFamily(info.h, cBg, cFg, mode, cfg.chromaCaps, mt);
    }
    return { color, ...neut };
  }

  const tokens: TokensByMode = { light: build('light'), dark: build('dark') };

  // Apply overrides last
  if (cfg.overrides) {
    for (const [key, value] of Object.entries(cfg.overrides)) {
      const ok = value.startsWith('oklch(');
      if (!ok) continue;
      const [mode, path] = key.split('.', 2) as [Mode, string];
      const parts = path.split('.');
      const o = (tokens as any)[mode];
      if (!o) continue;
      let ref: any = o;
      for (let i = 0; i < parts.length - 1; i++) {
        ref = ref?.[parts[i]];
        if (!ref) break;
      }
      if (ref && parts.length >= 1) {
        const last = parts[parts.length - 1];
        ref[last] = parseOklchSafe(value);
      }
    }
  }

  return tokens;
}

function parseOklchSafe(s: string): Oklch {
  const m = s.match(/oklch\(([^)]+)\)/i);
  if (!m) return oklch(0, 0, 0);
  const [l, c, h] = m[1].split(/[\s,]+/).map(Number);
  return oklch(l, c, h);
}
