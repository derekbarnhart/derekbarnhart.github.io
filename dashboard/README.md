Desk Dashboard (Vite + React + TS + Tailwind + PWA)

Overview
- Kiosk-friendly dashboard shell rendering boards defined in code.
- Widgets are pluggable and can trigger full-screen alerts.
- PWA: installable, offline shell with runtime caching for data.

Dev
- Install: npm install
- Run: npm run dev
- Build: npm run build; Preview: npm run preview

Development notes
- Fullscreen is disabled in development: the app will not auto-enter or prompt for fullscreen when running `npm run dev`.
- Press `h` to open a Help overlay listing keybindings.

Hosting
- Vite base is set to `/dashboard/` for GitHub Pages under derekbarnhart.github.io/dashboard.

Boards
- Defined in `src/boards/index.ts`; select via `?board=<name>`.
- Persisted board selection in localStorage; switch boards with `[` and `]`.
 - Each board includes a theme and mode: `theme: { name: 'Saturated'|'Unsaturated'|string, mode: 'light'|'dark', fontScale?: number }`.
 - Theme names are case-insensitive and applied via `data-theme`/`data-mode` attributes on `<html>`.

Widgets
- Samples: Clock, Weather (Open-Meteo), Quote (Quotable).
- Add new widgets in `src/widgets/` and register in `src/widgets/index.tsx`.
 - Optional `color` per widget (e.g., `"blue-alt2"`) styles the tile using theme tokens:
   - `background: var(--color-<hue>-altN-bg)`, `color: var(--color-<hue>-altN-fg)`, `border-color: var(--color-<hue>-altN-border)`.
   - If omitted, widget uses neutral surfaces (`--surface-panel`, `--text-primary`, `--border-subtle`).

Alerts
- Widgets call `shell.triggerAlert({ title, message, timeoutMs?, actions? })`.
- Full-screen overlay; Enter/Space acknowledges; digits 1–9 select actions; Esc cancels if a cancel action exists.
- Alerts persist across refresh; timeouts resume with remaining time.

Keyboard shortcuts
- `[` / `]`: previous / next board
- `h`: toggle help overlay
- `Enter` / `Space`: acknowledge alert
- `1–9`: choose alert action
- `Esc`: cancel alert (if available) or close help

Fullscreen
- App requests fullscreen on startup; if gesture required, a click-to-start gate appears.

PWA
- vite-plugin-pwa handles precache and runtime caching; manifest scope/start_url `/dashboard/`.

Themes
- Theme CSS lives in `src/themes/` and is bundled; selectors are `:root[data-theme="<Name>"][data-mode="light|dark"]`.
- The app imports `saturated.css` and `unsaturated.css` and switches theme/mode by setting attributes on `<html>`.
