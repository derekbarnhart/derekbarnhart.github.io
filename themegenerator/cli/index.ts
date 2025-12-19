#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';
import { ThemeConfig } from '../src/core/types.js';
import { generateTokens } from '../src/core/generate.js';
import { validateTokens } from '../src/core/validate.js';
import { tokensToCss } from '../src/core/output-css.js';
import { tokensToJson } from '../src/core/output-json.js';
import { tokensToTailwind } from '../src/core/output-tailwind.js';

type Cmd = 'generate' | 'validate' | 'init' | 'preview';

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {};
  let cmd: Cmd = 'generate';
  const a = argv.slice(2);
  for (let i = 0; i < a.length; i++) {
    const token = a[i];
    if (token === 'generate' || token === 'validate' || token === 'init' || token === 'preview') {
      cmd = token as Cmd;
      continue;
    }
    if (token.startsWith('--')) {
      const body = token.slice(2);
      if (body.includes('=')) {
        const [k, v] = body.split('=');
        args[k] = v === undefined ? true : v;
      } else {
        const k = body;
        const next = a[i + 1];
        if (next && !next.startsWith('--')) {
          args[k] = next;
          i++;
        } else {
          args[k] = true;
        }
      }
      continue;
    }
  }
  return { cmd, args };
}

function loadConfig(p?: string): ThemeConfig {
  const path = resolve(process.cwd(), p || 'config/example.theme.json');
  const json = readFileSync(path, 'utf8');
  return JSON.parse(json);
}

function ensureDir(p: string) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function doInit() {
  const path = resolve(process.cwd(), 'config/example.theme.json');
  if (existsSync(path)) {
    console.log('config/example.theme.json already exists.');
    return;
  }
  ensureDir(resolve(process.cwd(), 'config'));
  const example = {
    name: 'example',
    neutralHue: 260,
    chromaCaps: { bg: 0.08, fg: 0.18, accent: 0.2 },
    apca: { textThreshold: 60, displayThreshold: 45 },
    hues: {
      red: { h: 25, cBg: 0.06, cFg: 0.15 },
      orange: { h: 55, cBg: 0.06, cFg: 0.15 },
      amber: { h: 70, cBg: 0.06, cFg: 0.14 },
      yellow: { h: 95, cBg: 0.05, cFg: 0.12 },
      lime: { h: 120, cBg: 0.05, cFg: 0.13 },
      green: { h: 145, cBg: 0.06, cFg: 0.14 },
      teal: { h: 170, cBg: 0.06, cFg: 0.14 },
      cyan: { h: 200, cBg: 0.06, cFg: 0.14 },
      blue: { h: 255, cBg: 0.05, cFg: 0.14 },
      indigo: { h: 275, cBg: 0.05, cFg: 0.14 },
      violet: { h: 295, cBg: 0.05, cFg: 0.15 },
      purple: { h: 305, cBg: 0.05, cFg: 0.15 },
      pink: { h: 335, cBg: 0.06, cFg: 0.16 },
      gray: { h: 260, cBg: 0.02, cFg: 0.02 }
    },
    overrides: {}
  };
  writeFileSync(path, JSON.stringify(example, null, 2));
  console.log('Wrote config/example.theme.json');
}

function doGenerate(configPath?: string, outDir?: string, nameOverride?: string) {
  const cfg = loadConfig(configPath);
  const tokens = generateTokens(cfg);
  const name = nameOverride || cfg.name;
  const out = resolve(process.cwd(), outDir || 'out');
  ensureDir(out);

  const css = tokensToCss(name, tokens);
  writeFileSync(resolve(out, `${name}.css`), css, 'utf8');
  writeFileSync(resolve(out, `${name}.tokens.json`), JSON.stringify(tokensToJson(tokens), null, 2), 'utf8');
  writeFileSync(resolve(out, `${name}.tailwind.json`), JSON.stringify(tokensToTailwind(name, tokens), null, 2), 'utf8');
  console.log(`Generated CSS/JSON/Tailwind in ${out}`);
}

function doValidate(configPath?: string) {
  const cfg = loadConfig(configPath);
  const tokens = generateTokens(cfg);
  const report = validateTokens(cfg, tokens);
  const fails = report.pairs.filter((p) => !p.passed);
  const distinctFails = report.distinctness.filter((d) => !d.passed);
  console.log(`APCA pairs failing: ${fails.length}`);
  if (fails.length) {
    for (const f of fails.slice(0, 10)) {
      console.log(`  ${f.mode} ${f.hue} ${f.alt}: APCA=${f.apca.toFixed(1)}`);
    }
    if (fails.length > 10) console.log('  ...');
  }
  console.log(`Alt distinctness failing: ${distinctFails.length}`);
}

function doPreview(configPath?: string, outDir?: string) {
  // Simple static preview HTML that loads generated CSS and shows swatches.
  const cfg = loadConfig(configPath);
  const tokens = generateTokens(cfg);
  const name = cfg.name;
  const out = resolve(process.cwd(), outDir || 'out');
  ensureDir(out);
  const cssFile = `${name}.css`;
  writeFileSync(resolve(out, cssFile), tokensToCss(name, tokens), 'utf8');
  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${name} preview</title>
    <link rel="stylesheet" href="./${cssFile}" />
    <style>
      :root { --gap: 10px; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
      body { margin: 0; padding: 20px; }
      .row { display: flex; gap: var(--gap); flex-wrap: wrap; }
      .chip { border-radius: 8px; padding: 10px; min-width: 130px; border: 1px solid var(--border-subtle); }
      .title { font-weight: 600; margin-bottom: 8px; }
      .toggle { position: fixed; top: 12px; right: 12px; }
      [data-mode="light"] body { background: var(--surface-canvas); color: var(--text-primary); }
      [data-mode="dark"] body { background: var(--surface-canvas); color: var(--text-primary); }
    </style>
  </head>
  <body data-theme="${name}" data-mode="light">
    <button class="toggle" onclick="(function(){var r=document.documentElement;var m=r.getAttribute('data-mode')==='light'?'dark':'light';r.setAttribute('data-mode',m);document.body.setAttribute('data-mode',m);})();">Toggle Mode</button>
    <script>document.documentElement.setAttribute('data-theme','${name}');document.documentElement.setAttribute('data-mode','light');</script>
    <h1>${name} – Preview</h1>
    <section>
      <h2>Neutrals</h2>
      <div class="row">
        ${['surface-canvas','surface-panel','surface-subtle','text-primary','text-muted','border-subtle','border-strong'].map(k => `
          <div class="chip" style="background: var(--${k})"><div class="title">${k}</div></div>
        `).join('\n')}
      </div>
    </section>
    <section>
      <h2>Swatches</h2>
      ${Object.keys(tokens.light.color).map(h => `
        <h3>${h}</h3>
        <div class=\"row\">
          ${['alt1','alt2','alt3'].map(a => `
            <div class=\"chip\" style=\"background: var(--color-${h}-${a}-bg); color: var(--color-${h}-${a}-fg)\">
              <div class=\"title\">${a}</div>
              <div>bg</div>
              <div style=\"border-top:1px solid var(--color-${h}-${a}-border); margin-top:6px; padding-top:6px\">border/accent</div>
            </div>
          `).join('')}
        </div>
      `).join('\n')}
    </section>
  </body>
</html>`;
  writeFileSync(resolve(out, `${name}.preview.html`), html, 'utf8');
  console.log(`Wrote preview to ${out}/${name}.preview.html`);
}

function main() {
  const { cmd, args } = parseArgs(process.argv);
  switch (cmd) {
    case 'init':
      doInit();
      break;
    case 'generate':
      doGenerate(args.config as string | undefined, args.out as string | undefined, args['theme-name'] as string | undefined);
      break;
    case 'validate':
      doValidate(args.config as string | undefined);
      break;
    case 'preview':
      doPreview(args.config as string | undefined, args.out as string | undefined);
      break;
    default:
      console.log('Commands: init | generate | validate | preview');
  }
}

main();
