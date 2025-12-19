import React, { useEffect, useMemo, useState } from 'react';
import { JsonEditor, githubDarkTheme } from 'json-edit-react';
import { ThemeConfig, generateTokens, tokensToCss, validateTokens, tokensToJson } from '../../../src/core/index.js';

const defaultConfig: ThemeConfig = {
  name: 'example',
  neutralHue: 260,
  chromaCaps: { bg: 0.08, fg: 0.18, accent: 0.2 },
  apca: { textThreshold: 60, displayThreshold: 45 },
  hues: {
    red: { h: 25, cBg: 0.06, cFg: 0.15 },
    orange: { h: 55, cBg: 0.06, cFg: 0.15 },
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

type Mode = 'light' | 'dark';

export function App() {
  const [mode, setMode] = useState<Mode>(() => (localStorage.getItem('theme-mode') as Mode) || 'light');
  const [leftTab, setLeftTab] = useState<'swatches' | 'preview'>('swatches');
  const [showUsage, setShowUsage] = useState(false);
  const [config, setConfig] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem('theme-config');
    return saved ? JSON.parse(saved) : defaultConfig;
  });
  type GenParams = { hueDrift: number; chromaJitterBgPct: number; chromaJitterFgPct: number; saturationTargetBg?: number; saturationTargetFg?: number };
  const defaultParams: GenParams = { hueDrift: 10, chromaJitterBgPct: 15, chromaJitterFgPct: 15 };
  const [genParams, setGenParams] = useState<GenParams>(() => {
    const saved = localStorage.getItem('gen-params');
    return saved ? JSON.parse(saved) : defaultParams;
  });

  useEffect(() => {
    localStorage.setItem('theme-config', JSON.stringify(config));
  }, [config]);
  useEffect(() => {
    localStorage.setItem('gen-params', JSON.stringify(genParams));
  }, [genParams]);
  useEffect(() => {
    localStorage.setItem('theme-mode', mode);
  }, [mode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', config.name);
    document.documentElement.setAttribute('data-mode', mode);
  }, [mode, config.name]);

  const tokens = useMemo(() => generateTokens(config), [config]);
  const css = useMemo(() => tokensToCss(config.name, tokens), [config.name, tokens]);
  const report = useMemo(() => validateTokens(config, tokens), [config, tokens]);

  useEffect(() => {
    const styleId = 'theme-style';
    let style = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }
    style.textContent = css;
  }, [css]);

  const download = (filename: string, content: string, type = 'text/plain') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: 16 }}>
      <header style={{ position: 'sticky', top: 0, background: 'var(--surface-canvas)', borderBottom: '1px solid var(--border-subtle)', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '8px 0' }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Theme Builder</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowUsage(true)}
            style={{ background: 'var(--surface-panel)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '8px 12px', cursor: 'pointer' }}
          >
            Usage
          </button>
          <button
            onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
            style={{ background: 'var(--surface-panel)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '8px 12px', cursor: 'pointer' }}
          >
            Toggle {mode === 'light' ? 'Dark' : 'Light'}
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(0, 350px)', gap: 16 }}>
        {/* Left column: Tabs (Swatches / Preview UI) */}
        <div>
          <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border-subtle)', marginBottom: 12 }}>
            <TabButton active={leftTab === 'swatches'} onClick={() => setLeftTab('swatches')}>Swatches</TabButton>
            <TabButton active={leftTab === 'preview'} onClick={() => setLeftTab('preview')}>Preview UI</TabButton>
          </div>
          <div>
            {leftTab === 'swatches' && (
              <div>
                <Swatches themeName={config.name} hues={Object.keys(tokens.light.color)} />
              </div>
            )}
            {leftTab === 'preview' && (
              <div>
                <PreviewUI />
              </div>
            )}
          </div>
        </div>

        {/* Right column: Config/Generator tabs + Validation */}
        <div style={{ display: 'grid', gridTemplateRows: 'auto auto', gap: 8 }}>
          <section>
            <h2 style={{ marginTop: 0 }}>Config</h2>
            <RightTabs
              config={config}
              onConfigChange={setConfig}
              genParams={genParams}
              onParamsChange={setGenParams}
              onDownloadCss={() => download(`${config.name}.css`, css, 'text/css')}
              onDownloadJson={() => download(`${config.name}.tokens.json`, JSON.stringify(tokensToJson(tokens), null, 2), 'application/json')}
            />
          </section>
          <section>
            <h2 style={{ marginTop: 0 }}>Validation</h2>
            <Validation report={report} threshold={config.apca.textThreshold} />
          </section>
        </div>
      </div>
      {showUsage && (
        <UsageOverlay themeName={config.name} onClose={() => setShowUsage(false)} />
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 12px',
        border: '1px solid var(--border-subtle)',
        borderBottom: active ? '2px solid var(--border-strong)' : '1px solid var(--border-subtle)',
        background: active ? 'var(--surface-panel)' : 'var(--surface-subtle)',
        color: 'var(--text-primary)',
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
        fontWeight: active ? 600 : 500,
        cursor: 'pointer'
      }}
    >
      {children}
    </button>
  );
}

function RightTabs({ config, onConfigChange, genParams, onParamsChange, onDownloadCss, onDownloadJson }:
  { config: ThemeConfig; onConfigChange: (v: ThemeConfig) => void; genParams: any; onParamsChange: (v: any) => void; onDownloadCss: () => void; onDownloadJson: () => void }) {
  const [tab, setTab] = useState<'config' | 'generator'>('config');
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border-subtle)', marginBottom: 8 }}>
        <TabButton active={tab === 'config'} onClick={() => setTab('config')}>Configuration</TabButton>
        <TabButton active={tab === 'generator'} onClick={() => setTab('generator')}>Generator</TabButton>
      </div>
      {tab === 'config' ? (
        <>
          <ConfigEditor value={config} onChange={onConfigChange} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={onDownloadCss} style={{ background: 'var(--surface-panel)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}>Download CSS</button>
            <button onClick={onDownloadJson} style={{ background: 'var(--surface-panel)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}>Download JSON</button>
          </div>
        </>
      ) : (
        <GeneratorParamsEditor
          value={genParams}
          onChange={onParamsChange}
          caps={config.chromaCaps}
          config={config}
          onConfigChange={onConfigChange}
        />
      )}
    </div>
  );
}

function ConfigEditor({ value, onChange }: { value: ThemeConfig, onChange: (v: ThemeConfig) => void }) {
  const [live, setLive] = useState(true);
  const [draft, setDraft] = useState<any>(value);
  useEffect(() => { if (live) setDraft(value); }, [value, live]);

  const handleSetData = (v: any) => {
    setDraft(v);
    if (live) onChange(v as ThemeConfig);
  };

  const apply = () => onChange(draft as ThemeConfig);
  const reset = () => setDraft(value);
  const resetDefault = () => {
    setDraft(defaultConfig);
    if (live) onChange(defaultConfig);
  };

  function rand(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }
  function wrapHue(h: number) {
    return ((h % 360) + 360) % 360;
  }
  function clamp(n: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, n));
  }
  // Generate button moved to Generator tab

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
          <input type="checkbox" checked={live} onChange={e => setLive(e.target.checked)} />
          Live update
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={resetDefault} title="Reset to default example config" style={{ background: 'var(--surface-panel)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}>Reset</button>
          {!live && (
            <>
              <button onClick={apply} style={{ background: 'var(--surface-panel)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}>Apply</button>
              <button onClick={reset} style={{ background: 'var(--surface-panel)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}>Revert</button>
            </>
          )}
        </div>
      </div>
      <div style={{ background: 'var(--surface-panel)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 8, maxHeight: '55vh', overflow: 'auto', overflowX: 'auto', width: '100%', fontSize: 12 }}>
        <JsonEditor
          data={draft}
          setData={handleSetData}
          theme={githubDarkTheme}
        />
      </div>
    </div>
  );
}

function LabeledNumber({ label, value, onChange, min, max, step, suffix }: { label: string; value: number | undefined; onChange: (n: number | undefined) => void; min?: number; max?: number; step?: number; suffix?: string }) {
  return (
    <label style={{ display: 'grid', gap: 4 }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}{suffix ? ` (${suffix})` : ''}</span>
      <input
        type="number"
        value={value ?? ''}
        min={min as any}
        max={max as any}
        step={step as any}
        onChange={e => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        style={{ background: 'var(--surface-canvas)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '6px 8px' }}
      />
    </label>
  );
}

function GeneratorParamsEditor({ value, onChange, caps, config, onConfigChange }:
  { value: any; onChange: (v: any) => void; caps: { bg: number; fg: number; accent: number }; config: ThemeConfig; onConfigChange: (v: ThemeConfig) => void }) {
  const v = value || {};
  const set = (patch: any) => onChange({ ...v, ...patch });
  const reset = () => onChange({ hueDrift: 10, chromaJitterBgPct: 15, chromaJitterFgPct: 15 });
  function rand(min: number, max: number) { return Math.random() * (max - min) + min; }
  function wrapHue(h: number) { return ((h % 360) + 360) % 360; }
  function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }
  const generate = () => {
    const drift = typeof v.hueDrift === 'number' ? v.hueDrift : 10;
    const chromaJitterBg = typeof v.chromaJitterBgPct === 'number' ? v.chromaJitterBgPct / 100 : 0.15;
    const chromaJitterFg = typeof v.chromaJitterFgPct === 'number' ? v.chromaJitterFgPct / 100 : 0.15;
    const targetBg = typeof v.saturationTargetBg === 'number' ? v.saturationTargetBg : undefined;
    const targetFg = typeof v.saturationTargetFg === 'number' ? v.saturationTargetFg : undefined;
    const cfg = config;
    const next: ThemeConfig = {
      ...cfg,
      neutralHue: wrapHue(cfg.neutralHue + rand(-drift, drift)),
      hues: Object.fromEntries(Object.entries(cfg.hues).map(([name, vv]) => {
        const h = wrapHue(vv.h + rand(-drift, drift));
        const baseBg = targetBg ?? vv.cBg;
        const baseFg = targetFg ?? vv.cFg;
        const cBg = clamp(baseBg * (1 + rand(-chromaJitterBg, chromaJitterBg)), 0, cfg.chromaCaps.bg);
        const cFg = clamp(baseFg * (1 + rand(-chromaJitterFg, chromaJitterFg)), 0, cfg.chromaCaps.fg);
        return [name, { h, cBg, cFg }];
      })) as ThemeConfig['hues']
    };
    onConfigChange(next);
  };
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
        <LabeledNumber label="Hue drift" value={v.hueDrift ?? 10} onChange={n => set({ hueDrift: n ?? 0 })} min={0} max={30} step={1} suffix="deg" />
        <div />
        <LabeledNumber label="BG jitter" value={v.chromaJitterBgPct ?? 15} onChange={n => set({ chromaJitterBgPct: n ?? 0 })} min={0} max={100} step={1} suffix="%" />
        <LabeledNumber label="FG jitter" value={v.chromaJitterFgPct ?? 15} onChange={n => set({ chromaJitterFgPct: n ?? 0 })} min={0} max={100} step={1} suffix="%" />
        <LabeledNumber label="BG saturation target" value={v.saturationTargetBg} onChange={n => set({ saturationTargetBg: n })} min={0} max={caps.bg} step={0.005} />
        <LabeledNumber label="FG saturation target" value={v.saturationTargetFg} onChange={n => set({ saturationTargetFg: n })} min={0} max={caps.fg} step={0.005} />
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={generate} style={{ background: 'var(--surface-panel)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}>Generate Theme</button>
        <button onClick={reset} style={{ background: 'var(--surface-panel)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}>Reset Params</button>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        Generate uses these values to vary hues and saturation. Leave targets blank to vary around current values.
      </div>
    </div>
  );
}

function Validation({ report, threshold }: { report: ReturnType<typeof validateTokens>, threshold: number }) {
  const pairsFail = report.pairs.filter(p => !p.passed);
  const distinctFail = report.distinctness.filter(d => !d.passed);
  return (
    <div>
      <div>APCA pairs failing: {pairsFail.length} (threshold {threshold})</div>
      {pairsFail.slice(0, 10).map(p => (
        <div key={`${p.mode}-${p.hue}-${p.alt}`}>{p.mode} {p.hue} {p.alt}: {p.apca.toFixed(1)}</div>
      ))}
      <div>Distinctness failing: {distinctFail.length}</div>
    </div>
  );
}

function Swatches({ themeName, hues }: { themeName: string, hues: string[] }) {
  const alts = ['alt1','alt2','alt3'];
  return (
    <div>
      {hues.map(h => (
        <div key={h}>
          <h3>{h}</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {alts.map(a => (
              <div key={a} style={{ borderRadius: 8, padding: 12, minWidth: 160, background: `var(--color-${h}-${a}-bg)`, color: `var(--color-${h}-${a}-fg)`, border: `1px solid var(--color-${h}-${a}-border)` }}>
                <div style={{ fontWeight: 600 }}>{a}</div>
                <div>Text on bg</div>
                <div style={{ marginTop: 8, color: `var(--color-${h}-${a}-accent)` }}>Accent sample</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PreviewUI() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
      <div style={{ background: 'var(--surface-panel)', padding: 16, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
        <h3>Buttons</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn label="Primary" hue="blue" alt="alt2" />
          <Btn label="Danger" hue="red" alt="alt2" />
          <Btn label="Muted" hue="gray" alt="alt2" />
          <Btn label="Success" hue="green" alt="alt2" />
        </div>
      </div>
      <div style={{ background: 'var(--surface-panel)', padding: 16, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
        <h3>Alerts</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          <Alert hue="yellow" alt="alt2" title="Warning" text="This is an example warning." />
          <Alert hue="red" alt="alt2" title="Danger" text="This is an error alert." />
          <Alert hue="green" alt="alt2" title="Success" text="This is a success alert." />
          <Alert hue="blue" alt="alt2" title="Info" text="This is an informational alert." />
        </div>
      </div>
      <div style={{ background: 'var(--surface-panel)', padding: 16, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
        <h3>Inputs</h3>
        <FormDemo />
      </div>
      <div style={{ background: 'var(--surface-panel)', padding: 16, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
        <h3>Badges</h3>
        <Badges hues={Object.keys((generateTokens as any)(defaultConfig).light.color)} />
      </div>
      <div style={{ background: 'var(--surface-panel)', padding: 16, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
        <h3>Table</h3>
        <Table />
      </div>
    </div>
  );
}

function Btn({ label, hue, alt }: { label: string; hue: string; alt: string }) {
  const bg = `var(--color-${hue}-${alt}-bg)`;
  const fg = `var(--color-${hue}-${alt}-fg)`;
  const br = `var(--color-${hue}-${alt}-border)`;
  return (
    <button style={{ background: bg, color: fg, border: `1px solid ${br}`, borderRadius: 6, padding: '8px 12px', cursor: 'pointer' }}>{label}</button>
  );
}

function Alert({ hue, alt, title, text }: { hue: string; alt: string; title: string; text: string }) {
  const bg = `var(--color-${hue}-${alt}-bg)`;
  const fg = `var(--color-${hue}-${alt}-fg)`;
  const br = `var(--color-${hue}-${alt}-border)`;
  const ac = `var(--color-${hue}-${alt}-accent)`;
  return (
    <div style={{ background: bg, color: fg, border: `1px solid ${br}`, borderRadius: 8, padding: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
      <div>{text}</div>
      <div style={{ color: ac, marginTop: 6 }}>More details →</div>
    </div>
  );
}

function FormDemo() {
  const inputStyle: React.CSSProperties = {
    background: 'var(--surface-canvas)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 6,
    padding: '8px 10px'
  };
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <label>
        <div style={{ marginBottom: 4, color: 'var(--text-muted)' }}>Name</div>
        <input placeholder="Jane Doe" style={inputStyle} />
      </label>
      <label>
        <div style={{ marginBottom: 4, color: 'var(--text-muted)' }}>Email</div>
        <input placeholder="jane@example.com" style={inputStyle} />
      </label>
      <label>
        <div style={{ marginBottom: 4, color: 'var(--text-muted)' }}>Status</div>
        <select style={{ ...inputStyle }}>
          <option>Active</option>
          <option>Paused</option>
          <option>Disabled</option>
        </select>
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" />
        <span>Subscribe to updates</span>
      </label>
    </div>
  );
}

function Badges({ hues }: { hues: string[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {hues.map(h => (
        <span key={h} style={{ padding: '4px 8px', borderRadius: 999, background: `var(--color-${h}-alt2-bg)`, color: `var(--color-${h}-alt2-fg)`, border: `1px solid var(--color-${h}-alt2-border)` }}>
          {h}
        </span>
      ))}
    </div>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre style={{ background: 'var(--surface-panel)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 12, overflowX: 'auto' }}>
      <code>{children}</code>
    </pre>
  );
}

function Usage({ themeName }: { themeName: string }) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <section>
        <h3>Outputs</h3>
        <ul>
          <li>CSS: <code>out/{themeName}.css</code> with variables for light/dark</li>
          <li>JSON: <code>out/{themeName}.tokens.json</code> with light/dark token objects</li>
          <li>Tailwind: <code>out/{themeName}.tailwind.json</code> mapping colors to CSS vars</li>
        </ul>
        <CodeBlock>{`:root[data-theme="${themeName}"][data-mode="light"] {
  --surface-canvas: oklch(...);
  --text-primary: oklch(...);
  --color-blue-alt2-bg: oklch(...);
  --color-blue-alt2-fg: oklch(...);
}
:root[data-theme="${themeName}"][data-mode="dark"] { /* ... */ }`}</CodeBlock>
      </section>

      <section>
        <h3>Using the CSS</h3>
        <CodeBlock>{`<link rel="stylesheet" href="/out/${themeName}.css">
<html data-theme="${themeName}" data-mode="light">
  <body>
    <button style="background: var(--color-blue-alt2-bg); color: var(--color-blue-alt2-fg)">
      Button
    </button>
  </body>
</html>`}</CodeBlock>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Toggle mode by switching <code>data-mode</code> to <code>dark</code>.</div>
      </section>

      <section>
        <h3>Using with Tailwind</h3>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Map utilities to CSS variables for runtime switching.</div>
        <CodeBlock>{`// tailwind.config.js
export default {
  darkMode: ['class', '[data-mode="dark"]'],
  theme: {
    extend: {
      colors: {
        surface: { canvas: 'var(--surface-canvas)' },
        text: { primary: 'var(--text-primary)' },
        blue: {
          DEFAULT: 'var(--color-blue-alt2-bg)',
          bg: { alt1: 'var(--color-blue-alt1-bg)', alt2: 'var(--color-blue-alt2-bg)', alt3: 'var(--color-blue-alt3-bg)' },
          fg: { alt1: 'var(--color-blue-alt1-fg)', alt2: 'var(--color-blue-alt2-fg)', alt3: 'var(--color-blue-alt3-fg)' }
        }
      }
    }
  }
}`}</CodeBlock>
        <CodeBlock>{`// example usage in markup
<div class="bg-[var(--surface-canvas)] text-[var(--text-primary)]">
  <button class="px-3 py-2 rounded" style="background: var(--color-blue-alt2-bg); color: var(--color-blue-alt2-fg)">
    Button
  </button>
</div>`}</CodeBlock>
      </section>

      <section>
        <h3>CLI usage</h3>
        <CodeBlock>{`# Generate outputs
npm run cli -- generate --config config/example.theme.json --out out

# Validate contrast and distinctness
npm run cli -- validate --config config/example.theme.json

# Quick HTML preview
npm run cli -- preview --config config/example.theme.json --out out`}</CodeBlock>
      </section>
    </div>
  );
}

function UsageOverlay({ themeName, onClose }: { themeName: string; onClose: () => void }) {
  // Cover content area below the sticky header
  return (
    <div style={{
      position: 'fixed',
      top: 56,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 20,
      background: 'var(--surface-canvas)',
      borderTop: '1px solid var(--border-subtle)',
      overflow: 'auto'
    }}>
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Usage</h2>
          <button onClick={onClose} style={{ background: 'var(--surface-panel)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}>Close ×</button>
        </div>
        <Usage themeName={themeName} />
      </div>
    </div>
  );
}

function Table() {
  const rows = Array.from({ length: 6 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}`, status: i % 2 ? 'Active' : 'Paused' }));
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          {['ID','Name','Status'].map(h => (
            <th key={h} style={{ textAlign: 'left', borderBottom: '1px solid var(--border-strong)', padding: 8 }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.id} style={{ background: i % 2 ? 'var(--surface-subtle)' : 'transparent' }}>
            <td style={{ padding: 8 }}>{r.id}</td>
            <td style={{ padding: 8 }}>{r.name}</td>
            <td style={{ padding: 8 }}>
              <span style={{ padding: '2px 6px', borderRadius: 999, background: 'var(--color-green-alt3-bg)', color: 'var(--color-green-alt3-fg)', border: '1px solid var(--color-green-alt3-border)' }}>{r.status}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
