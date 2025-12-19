export type Mode = 'light' | 'dark';

export type HueName =
  | 'red' | 'orange' | 'amber' | 'yellow' | 'lime' | 'green' | 'teal'
  | 'cyan' | 'blue' | 'indigo' | 'violet' | 'purple' | 'pink' | 'gray';

export type Alt = 'alt1' | 'alt2' | 'alt3';

export interface ThemeConfig {
  name: string;
  neutralHue: number; // OKLCH hue angle for neutrals
  chromaCaps: { bg: number; fg: number; accent: number };
  apca: { textThreshold: number; displayThreshold?: number };
  hues: Record<HueName, { h: number; cBg: number; cFg: number }>;
  overrides?: Record<string, string>; // e.g., "dark.color.red.alt2.bg": "oklch(...)"
}

export interface Oklch {
  l: number; // 0..1
  c: number; // 0..~0.4
  h: number; // 0..360
}

export interface PairValidation {
  apca: number;
  passed: boolean;
}

export interface TokenSet {
  // literal colors
  color: Record<HueName, Record<Alt, {
    bg: Oklch; fg: Oklch; border: Oklch; accent: Oklch;
  }>>;
  // neutrals
  surface: { canvas: Oklch; panel: Oklch; subtle: Oklch };
  text: { primary: Oklch; muted: Oklch };
  border: { subtle: Oklch; strong: Oklch };
}

export interface TokensByMode {
  light: TokenSet;
  dark: TokenSet;
}

export interface ValidationReport {
  pairs: Array<{ mode: Mode; hue: HueName; alt: Alt; apca: number; passed: boolean }>;
  distinctness: Array<{ mode: Mode; hue: HueName; d12: number; d23: number; minRequired: number; passed: boolean }>;
}

