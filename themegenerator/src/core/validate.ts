import { Alt, HueName, Mode, ThemeConfig, TokensByMode, ValidationReport } from './types.js';
import { apcaContrast } from './apca.js';
import { oklchDistance } from './color.js';

const ALTS: Alt[] = ['alt1','alt2','alt3'];

export function validateTokens(cfg: ThemeConfig, tokens: TokensByMode): ValidationReport {
  const pairs: ValidationReport['pairs'] = [];
  const distinctness: ValidationReport['distinctness'] = [];

  for (const mode of ['light', 'dark'] as Mode[]) {
    const hues = Object.keys(tokens[mode].color) as HueName[];
    for (const hue of hues) {
      for (const alt of ALTS) {
        const t = tokens[mode].color[hue][alt];
        const contrast = apcaContrast(t.fg, t.bg);
        const passed = Math.abs(contrast) >= cfg.apca.textThreshold;
        pairs.push({ mode, hue, alt, apca: contrast, passed });
      }
      // distinctness between bg alt1/alt2 and alt2/alt3
      const c = tokens[mode].color[hue];
      const d12 = oklchDistance(c.alt1.bg, c.alt2.bg);
      const d23 = oklchDistance(c.alt2.bg, c.alt3.bg);
      const minRequired = 0.02; // small but noticeable delta in OKLCH space
      distinctness.push({ mode, hue, d12, d23, minRequired, passed: d12 >= minRequired && d23 >= minRequired });
    }
  }

  return { pairs, distinctness };
}
