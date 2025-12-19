
1) Token naming spec

Goals the naming enforces
	•	Hue tokens stay perceptual (red stays red)
	•	Contrast is guaranteed only via explicit pairs
	•	Alternates are meaning-neutral variety, safe to place adjacent
	•	Functional semantics are aliases (not baked into “red”)

Token namespaces

A) Literal color tokens (what you asked for)

color.<hue>.alt<1|2|3>.<role>

Where:
	•	<hue>: red | orange | amber | yellow | lime | green | teal | cyan | blue | indigo | violet | purple | pink | gray
	•	alt1..alt3: three meaning-neutral variants
	•	<role> is always one of:
	•	bg  (colored background / fill)
	•	fg  (text/icon on that bg)
	•	border (outline on that bg)
	•	accent (stronger “ink” for charts/lines/icons; still meaning-neutral)

So the paired relationship is structural:
	•	color.red.alt2.fg is meant to be used with color.red.alt2.bg

B) Neutral surfaces (foundational)

surface.<level>
text.<level>
border.<level>

Recommended minimal set:
	•	surface.canvas (page background)
	•	surface.panel  (cards)
	•	surface.subtle (striped rows / subtle fill)
	•	text.primary
	•	text.muted
	•	border.subtle
	•	border.strong

C) Semantic aliases (theme-defined, not universal)

semantic.<intent>.<role>

Where <intent> might be:
	•	danger | success | warning | info | brand | emphasis

and <role> is:
	•	bg | fg | border | accent

Example alias mapping:
	•	semantic.danger.bg = color.red.alt2.bg
	•	semantic.danger.fg = color.red.alt2.fg

This lets you build multiple themes that decide what “danger” means while “red” stays “red”.

⸻

2) Generation rules (algorithm + guardrails)

2.1 Use OKLCH as the working space

Represent colors as OKLCH:
	•	L in [0..1]
	•	C in [0..~0.4] (but you cap it)
	•	H in degrees [0..360)

This is the backbone for:
	•	palette cohesion
	•	“red stays red”
	•	predictable deltas across light/dark

2.2 Define per-hue anchors + global constraints

Global constraints (palette cohesion)
	•	C_max_global: e.g. 0.16 for backgrounds, 0.20 for accents
	•	Hue drift allowed: ±3° (basically “none”)

Per-hue anchor table

For each hue, define a canonical hue angle H0 and a chroma budget C0 (still capped globally). Example anchors:
	•	red: H0=25
	•	orange: H0=55
	•	green: H0=145
	•	blue: H0=255
	•	purple: H0=305

(You can tune these to taste; the system doesn’t care.)

2.3 Build paired tokens as two coordinated points in OKLCH

For each hue + alt, you generate bg, fg, border, accent with explicit relationships.

Light mode generation (conceptual)
	•	Background is high L, low-to-medium C
	•	Foreground is low L, higher C (within caps)
	•	Border sits between fg/bg in L and lower C than fg
	•	Accent is close to fg but slightly higher C (for charts/strokes)

Example target ranges (good starting points):
	•	L_bg_light: 0.92–0.97
	•	C_bg_light: 0.03–0.07
	•	L_fg_light: 0.25–0.40
	•	C_fg_light: 0.10–0.18

Dark mode generation (inverted relationship)
	•	Background is low L, medium C
	•	Foreground is high L, controlled C (to avoid neon)
	•	Border slightly above bg in L, low C
	•	Accent is near fg but with a bit more C

Example target ranges:
	•	L_bg_dark: 0.18–0.30
	•	C_bg_dark: 0.05–0.10
	•	L_fg_dark: 0.78–0.92
	•	C_fg_dark: 0.06–0.14

2.4 The “3 alternates” rule (meaning-neutral AND adjacent-distinguishable)

The key: alternates should vary more on bg than on fg to avoid implying hierarchy in text/icon usage.

A solid pattern:

Alternate deltas (applied around a canonical alt2)

Let alt2 be canonical. Then:
	•	alt1 = slightly deeper fill
	•	alt3 = slightly softer fill

Use small deltas:
	•	For bg: vary mainly L a bit, C a tiny bit
	•	For fg: vary C slightly, keep L almost constant

Example deltas:
	•	Light mode
	•	bg: alt1 ΔL=-0.02, alt2 ΔL=0, alt3 ΔL=+0.02
	•	fg: alt1 ΔC=+0.01, alt2 ΔC=0, alt3 ΔC=-0.01
	•	Dark mode
	•	bg: alt1 ΔL=-0.02, alt2 ΔL=0, alt3 ΔL=+0.02
	•	fg: alt1 ΔC=+0.01, alt2 ΔC=0, alt3 ΔC=-0.01

Result: adjacent rows/widgets are distinguishable by fill, but text/icon color doesn’t scream “this is disabled/secondary”.

2.5 Pair-contrast validation (APCA-first)

You said: contrast is guaranteed only for paired tokens. Great.

Validation requirements (compile-time):
	•	APCA(color.<hue>.altX.fg on color.<hue>.altX.bg) >= threshold_text
	•	You choose the threshold (common is ~60+ for body text; can be lower for large text/icons)

If a pair fails:
	•	adjust fg L first (most perceptual impact)
	•	then adjust fg C downward in dark mode if it looks neon
	•	never change H unless a hue is truly problematic

Also validate:
	•	alternates distinctness on bg:
	•	ΔE_ok between bg alt1/alt2/alt3 above a minimal threshold (small but noticeable)

2.6 Theme composition

A theme is simply:
	•	neutral surfaces + text + borders
	•	the color family tokens generated from the algorithm
	•	semantic alias map

Because everything is precomputed, runtime mode switching is just swapping which CSS var block is active.

⸻

3) Sample output (illustrative)

Below is one plausible set of values to show shape. (These are examples, not mathematically guaranteed without running APCA checks.)

Light mode – neutrals

:root[data-theme="example"][data-mode="light"] {
  --surface-canvas: oklch(0.98 0.01 260);
  --surface-panel:  oklch(0.96 0.01 260);
  --surface-subtle: oklch(0.93 0.01 260);

  --text-primary:   oklch(0.22 0.02 260);
  --text-muted:     oklch(0.40 0.02 260);

  --border-subtle:  oklch(0.86 0.01 260);
  --border-strong:  oklch(0.76 0.01 260);
}

Dark mode – neutrals

:root[data-theme="example"][data-mode="dark"] {
  --surface-canvas: oklch(0.17 0.02 260);
  --surface-panel:  oklch(0.21 0.02 260);
  --surface-subtle: oklch(0.25 0.02 260);

  --text-primary:   oklch(0.92 0.02 260);
  --text-muted:     oklch(0.74 0.02 260);

  --border-subtle:  oklch(0.32 0.02 260);
  --border-strong:  oklch(0.42 0.02 260);
}

Light mode – red alt1/2/3 (paired)

:root[data-theme="example"][data-mode="light"] {
  --color-red-alt1-bg:     oklch(0.93 0.06 25);
  --color-red-alt1-fg:     oklch(0.33 0.16 25);
  --color-red-alt1-border: oklch(0.84 0.05 25);
  --color-red-alt1-accent: oklch(0.38 0.18 25);

  --color-red-alt2-bg:     oklch(0.95 0.06 25);
  --color-red-alt2-fg:     oklch(0.33 0.15 25);
  --color-red-alt2-border: oklch(0.86 0.05 25);
  --color-red-alt2-accent: oklch(0.38 0.17 25);

  --color-red-alt3-bg:     oklch(0.97 0.05 25);
  --color-red-alt3-fg:     oklch(0.33 0.14 25);
  --color-red-alt3-border: oklch(0.88 0.04 25);
  --color-red-alt3-accent: oklch(0.38 0.16 25);
}

Dark mode – red alt1/2/3 (paired)

:root[data-theme="example"][data-mode="dark"] {
  --color-red-alt1-bg:     oklch(0.20 0.08 25);
  --color-red-alt1-fg:     oklch(0.86 0.10 25);
  --color-red-alt1-border: oklch(0.30 0.05 25);
  --color-red-alt1-accent: oklch(0.82 0.12 25);

  --color-red-alt2-bg:     oklch(0.22 0.08 25);
  --color-red-alt2-fg:     oklch(0.86 0.09 25);
  --color-red-alt2-border: oklch(0.32 0.05 25);
  --color-red-alt2-accent: oklch(0.82 0.11 25);

  --color-red-alt3-bg:     oklch(0.24 0.07 25);
  --color-red-alt3-fg:     oklch(0.86 0.08 25);
  --color-red-alt3-border: oklch(0.34 0.05 25);
  --color-red-alt3-accent: oklch(0.82 0.10 25);
}

Semantic alias example

:root[data-theme="example"] {
  --semantic-danger-bg:     var(--color-red-alt2-bg);
  --semantic-danger-fg:     var(--color-red-alt2-fg);
  --semantic-danger-border: var(--color-red-alt2-border);
  --semantic-danger-accent: var(--color-red-alt2-accent);
}

(And you’d do the same for success/warning/info/etc., mapping to green/amber/blue families as desired.)

⸻

4) Tooling for generating themes quickly

What you want in practice

A small CLI that:
	1.	Takes a config (hues, caps, neutral tint, APCA thresholds)
	2.	Generates light + dark token maps
	3.	Validates:
	•	APCA for every <hue>.altX.fg on <hue>.altX.bg
	•	bg alternates are distinguishable
	•	global chroma caps respected
	4.	Outputs:
	•	CSS variables
	•	JSON tokens (for your app / Style Dictionary)
	•	(optional) a preview HTML page

Suggested project structure

theme-gen/
  config/
    example.theme.json
  src/
    generate.ts
    validate.ts
    output-css.ts
    output-json.ts
  out/
    example.light.css
    example.dark.css
    example.tokens.json

Minimal config shape

{
  "name": "example",
  "neutralHue": 260,
  "chromaCaps": { "bg": 0.08, "fg": 0.18, "accent": 0.20 },
  "apca": { "textThreshold": 60 },
  "hues": {
    "red":    { "h": 25,  "cBg": 0.06, "cFg": 0.15 },
    "green":  { "h": 145, "cBg": 0.06, "cFg": 0.14 },
    "blue":   { "h": 255, "cBg": 0.05, "cFg": 0.14 }
  }
}

Implementation note (practical)
	•	Use a color lib that supports OKLCH conversions (common options in JS: culori, colorjs.io).
	•	Use an APCA implementation in JS to validate (there are OSS implementations you can vendor).

Fast path: “generate now, tune later”

You’ll get the biggest leverage if the tool supports:
	•	“nudge this pair” overrides (per token)
	•	while still enforcing guardrails

Example override:

"overrides": {
  "dark.color.red.alt2.bg": "oklch(0.23 0.09 25)"
}

The generator applies overrides last, then re-validates.

⸻
