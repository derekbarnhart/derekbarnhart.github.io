# Theme Usage Guide

This doc explains how to consume the generated theme CSS files in web apps, and how to use the companion Tailwind colors JSON. Place this file in the same directory as your downloaded theme CSS files for easy reference.

## What You Get

- One CSS file per theme: `<theme-name>.css`
  - Defines CSS variables under `:root[data-theme="<theme-name>"][data-mode="light|dark"]`.
  - Tokens include neutrals (`--surface-*`, `--text-*`, `--border-*`) and literal color families (`--color-<hue>-alt<1|2|3>-<role>` where role is `bg|fg|border|accent`).
- One JSON file per theme (optional): `<theme-name>.tokens.json` with the raw tokens.
- One Tailwind colors JSON (optional): `<theme-name>.tailwind.json` mapping colors to CSS variables for runtime theming.

## Quick Start (Vanilla HTML/CSS)

1) Include the CSS file

```html
<link rel="stylesheet" href="./example.css" />
```

2) Set theme + mode on the root element

```html
<html data-theme="example" data-mode="light">
  <body>
    ...
  </body>
  
</html>
```

3) Use the variables

```html
<button style="
  background: var(--color-blue-alt2-bg);
  color: var(--color-blue-alt2-fg);
  border: 1px solid var(--color-blue-alt2-border);
">
  Primary
</button>
```

4) Toggle light/dark

```js
// Switch mode
const root = document.documentElement;
root.setAttribute('data-mode', root.getAttribute('data-mode') === 'light' ? 'dark' : 'light');
```

5) Switch themes at runtime

- Load multiple theme CSS files via multiple `<link>` tags.
- Flip `data-theme` to the desired theme name; only the matching variables apply.

```html
<link rel="stylesheet" href="./example.css" />
<link rel="stylesheet" href="./corporate.css" />
<!-- Later -->
<script>
  document.documentElement.setAttribute('data-theme', 'corporate');
  
</script>
```

## Token Names You Can Use

- Neutrals (foundational):
  - `--surface-canvas`, `--surface-panel`, `--surface-subtle`
  - `--text-primary`, `--text-muted`
  - `--border-subtle`, `--border-strong`
- Literal color families (paired tokens):
  - `--color-<hue>-alt<1|2|3>-bg`
  - `--color-<hue>-alt<1|2|3>-fg`
  - `--color-<hue>-alt<1|2|3>-border`
  - `--color-<hue>-alt<1|2|3>-accent`

Notes
- `fg` colors are designed to sit on their matching `bg` for readability (APCA validated).
- Alternates are meaning-neutral; `alt1` is deeper fill, `alt3` is softer.

## Using With Tailwind (Runtime Switchable)

You can use the provided Tailwind mapping or roll your own. The mapping points Tailwind colors to CSS variables so switching `data-theme`/`data-mode` updates the UI without rebuilding.

Option A — import `<theme-name>.tailwind.json` and merge:

```js
// tailwind.config.js (ESM shown; use require(...) for CJS)
import colorsMap from './example.tailwind.json' assert { type: 'json' };

export default {
  darkMode: ['class', '[data-mode="dark"]'],
  theme: {
    extend: colorsMap // { colors: { ... } }
  }
};
```

Then use utilities that reference variables, e.g.:

```html
<div class="bg-[var(--surface-canvas)] text-[var(--text-primary)]">
  <button class="px-3 py-2 rounded" style="background: var(--color-blue-alt2-bg); color: var(--color-blue-alt2-fg)">
    Button
  </button>
</div>
```

Option B — define minimal colors inline:

```js
export default {
  darkMode: ['class', '[data-mode="dark"]'],
  theme: {
    extend: {
      colors: {
        surface: { canvas: 'var(--surface-canvas)', panel: 'var(--surface-panel)' },
        text: { primary: 'var(--text-primary)', muted: 'var(--text-muted)' },
        // Example family
        blue: {
          DEFAULT: 'var(--color-blue-alt2-bg)',
          bg: { alt1: 'var(--color-blue-alt1-bg)', alt2: 'var(--color-blue-alt2-bg)', alt3: 'var(--color-blue-alt3-bg)' },
          fg: { alt1: 'var(--color-blue-alt1-fg)', alt2: 'var(--color-blue-alt2-fg)', alt3: 'var(--color-blue-alt3-fg)' },
          border: { alt1: 'var(--color-blue-alt1-border)', alt2: 'var(--color-blue-alt2-border)', alt3: 'var(--color-blue-alt3-border)' },
          accent: { alt1: 'var(--color-blue-alt1-accent)', alt2: 'var(--color-blue-alt2-accent)', alt3: 'var(--color-blue-alt3-accent)' }
        }
      }
    }
  }
};
```

Dark mode in Tailwind
- Set `darkMode: ['class', '[data-mode="dark"]']` and control with the same attribute used by the theme.

## React/SPA Integration

- Include the CSS in `index.html` or dynamically load it.
- Set attributes on mount:

```ts
useEffect(() => {
  const r = document.documentElement;
  r.setAttribute('data-theme', 'example');
  r.setAttribute('data-mode', prefersDark ? 'dark' : 'light');
}, []);
```

## Browser Support

- Variables hold native `oklch(...)` values. Modern Chrome/Edge/Safari/Firefox support OKLCH. If you need legacy support, consider a build step to produce sRGB fallbacks — not included by default.

## Multiple Projects / Theming Strategy

- Keep one CSS file per theme and load the ones you need.
- Use `data-theme="..."` on the root to select which set of variables is active.
- Use `data-mode="light|dark"` to toggle between light and dark for the same theme.
- All tokens are precomputed; switching is instant with no layout shift.

## File Naming

- Place this doc alongside your theme files.
- Each theme is `<theme-name>.css`, `<theme-name>.tokens.json`, and `<theme-name>.tailwind.json` (if generated).

---

Questions or issues? Ensure your markup includes the attributes, your CSS link paths are correct, and you’re referencing variables via `var(--token-name)`.

