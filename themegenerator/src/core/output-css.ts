import { TokensByMode } from './types.js';
import { formatOklch } from './color.js';

export function tokensToCss(name: string, tokens: TokensByMode): string {
  const blocks: string[] = [];

  function writeBlock(sel: string, styles: Record<string, string>) {
    const lines = Object.entries(styles).map(([k, v]) => `  --${k}: ${v};`).join('\n');
    blocks.push(`${sel} {\n${lines}\n}`);
  }

  for (const mode of ['light', 'dark'] as const) {
    const t = tokens[mode];
    const styles: Record<string, string> = {};

    // neutrals
    styles['surface-canvas'] = formatOklch(t.surface.canvas);
    styles['surface-panel'] = formatOklch(t.surface.panel);
    styles['surface-subtle'] = formatOklch(t.surface.subtle);
    styles['text-primary'] = formatOklch(t.text.primary);
    styles['text-muted'] = formatOklch(t.text.muted);
    styles['border-subtle'] = formatOklch(t.border.subtle);
    styles['border-strong'] = formatOklch(t.border.strong);

    // literal colors
    for (const hue of Object.keys(t.color)) {
      const family = (t.color as any)[hue];
      for (const alt of Object.keys(family)) {
        const set = family[alt];
        styles[`color-${hue}-${alt}-bg`] = formatOklch(set.bg);
        styles[`color-${hue}-${alt}-fg`] = formatOklch(set.fg);
        styles[`color-${hue}-${alt}-border`] = formatOklch(set.border);
        styles[`color-${hue}-${alt}-accent`] = formatOklch(set.accent);
      }
    }

    writeBlock(`:root[data-theme="${name}"][data-mode="${mode}"]`, styles);
  }

  return blocks.join('\n\n');
}
