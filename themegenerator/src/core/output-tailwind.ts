import { TokensByMode } from './types.js';

// Generates a Tailwind theme.colors object using CSS variables
// Example: { colors: { red: { DEFAULT: 'oklch(var(--color-red-alt2-bg))', ... } } }

export function tokensToTailwind(name: string, tokens: TokensByMode): Record<string, any> {
  // We output references to CSS vars so runtime switching works.
  // For simplicity, we map alt2 as default bg/fg, but keep all alts.
  const hues = Array.from(new Set([
    ...Object.keys(tokens.light.color),
    ...Object.keys(tokens.dark.color)
  ]));
  const colors: Record<string, any> = {};
  for (const hue of hues) {
    colors[hue] = {
      DEFAULT: `var(--color-${hue}-alt2-bg)`,
      bg: {
        alt1: `var(--color-${hue}-alt1-bg)`,
        alt2: `var(--color-${hue}-alt2-bg)`,
        alt3: `var(--color-${hue}-alt3-bg)`
      },
      fg: {
        alt1: `var(--color-${hue}-alt1-fg)`,
        alt2: `var(--color-${hue}-alt2-fg)`,
        alt3: `var(--color-${hue}-alt3-fg)`
      },
      border: {
        alt1: `var(--color-${hue}-alt1-border)`,
        alt2: `var(--color-${hue}-alt2-border)`,
        alt3: `var(--color-${hue}-alt3-border)`
      },
      accent: {
        alt1: `var(--color-${hue}-alt1-accent)`,
        alt2: `var(--color-${hue}-alt2-accent)`,
        alt3: `var(--color-${hue}-alt3-accent)`
      }
    };
  }
  colors['surface'] = {
    canvas: `var(--surface-canvas)`,
    panel: `var(--surface-panel)`,
    subtle: `var(--surface-subtle)`
  };
  colors['text'] = {
    primary: `var(--text-primary)`,
    muted: `var(--text-muted)`
  };
  colors['border'] = {
    subtle: `var(--border-subtle)`,
    strong: `var(--border-strong)`
  };

  return { colors };
}
