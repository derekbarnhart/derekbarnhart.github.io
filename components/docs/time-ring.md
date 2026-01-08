# Time Ring Web Component (db-time-ring)

A glanceable, low-effort visual timer that displays time as a draining circular ring with optional ticks and gentle boundary cues. Designed to externalize time and counter time blindness by emphasizing depletion, chunk boundaries, and continuous motion.

This document specifies the proposed usage/API for the `db-time-ring` component prior to implementation.

## Quick Start

```html
<!-- Load the library (dev: from src/, prod: from dist/) -->
<script type="module" src="/components/src/loader.js"></script>
<!-- or: <script type="module" src="https://derekbarnhart.github.io/components/dist/loader.js"></script> -->

<!-- Minimal 25-minute countdown (Pomodoro) -->
<db-time-ring duration="1500" mode="countdown" autoplay></db-time-ring>
```

## Features
- Draining ring with continuous sweep; optional ticks at chunk boundaries (e.g., every 5 minutes).
- Countdown or elapsed mode with start/end anchoring.
- Gentle boundary pulse and configurable warn/danger thresholds.
- Optional label for remaining/elapsed time.
- Reduced‑motion friendly: discrete tick updates instead of continuous sweep.

## Tag
`<db-time-ring>`

## Attributes (HTML)
- `duration` (number, seconds): Total interval length. Example: `duration="1500"` for 25 minutes.
- `mode` ("countdown" | "elapsed"; default: `countdown`): Whether to show remaining or elapsed time.
- `start-time` (ISO8601 string or epoch ms number as string): Anchor the timer to a start point. Example: `start-time="2024-01-03T10:00:00Z"`.
- `end-time` (ISO8601 string or epoch ms number as string): Alternative anchor; overrides `duration` if both `start-time` and `end-time` are set.
- `chunk-size` (number, seconds; default: auto): Size of sub-intervals for ticks/micro-pulses. Defaults to 300s (5 min) when `duration >= 900s`, else 60s.
- `major-step` (number, seconds; optional): Major tick spacing.
- `minor-step` (number, seconds; optional): Minor tick spacing.
- `pulse-on-chunk` (boolean): Emit a subtle visual pulse on each chunk boundary.
- `warn-threshold` (number, 0–1; default: 0.2): Fraction remaining where color/urgency escalates to warn.
- `danger-threshold` (number, 0–1; default: 0.1): Fraction remaining for danger zone.
- `label` ("none" | "remaining" | "elapsed" | "both"; default: `none`): Control numeric text inside the ring.
- `autoplay` (boolean): Start the timer automatically when connected.
- `paused` (boolean, reflective): Present when paused.
- `reduced-motion` (boolean): Force reduced‑motion behavior, regardless of user preference.

Notes:
- Time anchoring precedence: If `end-time` is given with `duration`, the ring counts down to `end-time`. If `start-time` and `duration` are given without `end-time`, end is computed. If only `duration` is given, the component counts from its connection/start time.
- Attributes map to like-named properties (kebab-case ↔ camelCase).

## Properties (JS)
- `duration: number` (seconds)
- `mode: 'countdown' | 'elapsed'`
- `startTime: number | Date | string | null`
- `endTime: number | Date | string | null`
- `chunkSize: number` (seconds)
- `majorStep?: number` (seconds)
- `minorStep?: number` (seconds)
- `pulseOnChunk: boolean`
- `warnThreshold: number` (0–1)
- `dangerThreshold: number` (0–1)
- `label: 'none' | 'remaining' | 'elapsed' | 'both'`
- `autoplay: boolean`
- `paused: boolean` (read/write)
- `progress: number` (read-only, 0–1; 1 = complete in countdown mode)
- `elapsed: number` (seconds, read-only)
- `remaining: number` (seconds, read-only)
- `running: boolean` (read-only)

## Methods
- `start(): void` – Start or resume.
- `pause(): void` – Pause at the current position.
- `reset(opts?: { hard?: boolean }): void` – Reset to initial state; `hard` also clears anchors.
- `seek(secondsOrProgress: number): void` – Seek by seconds (if >1e3 assume seconds) or 0–1 fraction if ≤1.
- `sync(now?: number | Date): void` – Recompute progress against the wall clock (useful after system sleep).

## Events
- `db-start` – Fired on `start()` or autoplay begin.
- `db-pause` – Fired on `pause()`.
- `db-reset` – Fired on `reset()`.
- `db-chunk` – Fired when crossing a chunk boundary. Detail: `{ elapsed, remaining, chunkIndex }`.
- `db-tick` – Fired at display update cadence (≤1 Hz in reduced‑motion). Detail: `{ elapsed, remaining, progress }`.
- `db-finish` – Fired when reaching completion (countdown hits zero or elapsed reaches duration).

Example:
```js
document.querySelector('db-time-ring')
  .addEventListener('db-finish', () => console.log('Done!'))
```

## Styling and Theming
Customize with CSS variables on the element or inherited from a parent.

- `--ring-size`: Overall size (e.g., `160px`).
- `--ring-thickness`: Stroke thickness (e.g., `10px`).
- `--ring-bg`: Background track color.
- `--ring-fg`: Foreground progress color.
- `--ring-warn`: Color when remaining ≤ `warn-threshold`.
- `--ring-danger`: Color when remaining ≤ `danger-threshold`.
- `--tick-color`: Color for tick marks.
- `--label-color`: Color of numeric label.
- `--pulse-scale`: Max scale for boundary pulse (e.g., `1.06`).
- `--transition-duration`: Sweep animation duration per frame (used for smoothing).

Example:
```html
<style>
  db-time-ring {
    --ring-size: 200px;
    --ring-thickness: 12px;
    --ring-bg: color-mix(in hsl, Canvas, CanvasText 12%);
    --ring-fg: #16a34a; /* green */
    --ring-warn: #ca8a04; /* amber */
    --ring-danger: #dc2626; /* red */
    --tick-color: color-mix(in hsl, CanvasText, Canvas 20%);
    --label-color: currentColor;
  }
  /* Optional: state-based colors via attributes the component may reflect */
  db-time-ring[warn] { --ring-fg: var(--ring-warn); }
  db-time-ring[danger] { --ring-fg: var(--ring-danger); }
  @media (prefers-color-scheme: dark) {
    db-time-ring { --ring-bg: color-mix(in hsl, Canvas, CanvasText 20%); }
  }
  @media (prefers-reduced-motion: reduce) {
    db-time-ring { --transition-duration: 0ms; }
  }
  </style>
```

## Accessibility
- Role and ARIA: component exposes `role="timer"` (countdown) or `role="progressbar"` (elapsed), with `aria-valuemin="0"`, `aria-valuemax="duration"`, `aria-valuenow`, and `aria-valuetext` (e.g., “12 minutes remaining”).
- Reduced motion: honors `@media (prefers-reduced-motion: reduce)` by switching to discrete updates (≤1 Hz) and disabling sweep easing/pulses unless explicitly overridden via `reduced-motion="false"`.
- Color: does not rely on color alone; label or tick pulses indicate state transitions. Ensure adequate contrast in themes.

## Behavior Details
- Sweep mapping: `angle = 360 * (elapsed / duration)` for elapsed; for countdown the foreground arc represents remaining.
- Update cadence: ~10–15 Hz visual smoothing via transforms; text/ARIA updates at 1 Hz to reduce churn; discrete mode updates at ≤1 Hz.
- Anchoring: If `end-time` is specified, progress is derived from wall clock; late starts catch up automatically; `sync()` can be called after sleep.
- Pausing: In anchored mode, pause decouples from wall time (component tracks offset); resuming re‑anchors to now.

## Usage Examples

1) 10‑minute countdown with 1‑minute chunks and pulses
```html
<db-time-ring duration="600" mode="countdown" chunk-size="60" pulse-on-chunk label="remaining" autoplay></db-time-ring>
```

2) Anchored to a calendar event (ends at specific time)
```html
<db-time-ring end-time="2024-01-03T15:30:00-05:00" warn-threshold="0.15" danger-threshold="0.07" label="remaining"></db-time-ring>
```

3) Programmatic control
```html
<db-time-ring id="ring" duration="1500" mode="countdown" label="remaining"></db-time-ring>
<script type="module">
  const ring = document.getElementById('ring');
  ring.start();
  setTimeout(() => ring.pause(), 5 * 60 * 1000);
  setTimeout(() => ring.start(), 6 * 60 * 1000);
  ring.addEventListener('db-chunk', (e) => {
    console.log('Chunk crossed', e.detail);
  });
  ring.addEventListener('db-finish', () => alert('Break time!'));
</script>
```

4) Theming per state
```css
db-time-ring { --ring-fg: #2563eb; }
db-time-ring[warn] { --ring-fg: #ca8a04; }
db-time-ring[danger] { --ring-fg: #dc2626; }
```

## Events Matrix (summary)
- Start/resume: `db-start`
- Pause: `db-pause`
- Reset: `db-reset`
- Tick (display update): `db-tick`
- Chunk crossed: `db-chunk`
- Finished: `db-finish`

## Integration Notes
- Dev import (no build): `<script type="module" src="/components/src/loader.js"></script>`
- Built import (GitHub Pages): `<script type="module" src="https://derekbarnhart.github.io/components/dist/loader.js"></script>`
- Individual import (once implemented):
  ```html
  <script type="module" src="https://derekbarnhart.github.io/components/dist/components/db-time-ring/db-time-ring.js"></script>
  ```

## Future Extensions
- Multi‑ring mode (hour + minute concentric rings).
- ETA display and uncertainty band.
- Haptics/audio cues with quiet‑hours and DND awareness.

---

Questions or change requests? Open an issue and specify desired attributes, events, and defaults.
