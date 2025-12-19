import type { Board } from '../types';

export const boards: Record<string, Board> = {
  default: {
    id: 'default',
    title: 'Desk Dashboard',
    layout: { columns: 12, rowHeight: 80, gap: 8, background: undefined },
    behavior: { defaultFullscreen: true },
    theme: { name: 'unsaturated', mode: 'dark', fontScale: 1 },
    widgets: [
      { id: 'clock1', type: 'clock', position: { x: 0, y: 0, w: 5, h: 2 }, props: { showSeconds: true }, color: 'blue-alt2' },
      { id: 'weather1', type: 'weather', position: { x: 5, y: 0, w: 4, h: 2 }, props: { lat: 37.77, lon: -122.42, units: 'imperial' }, color: 'teal-alt2' },
      { id: 'quote1', type: 'quote', position: { x: 0, y: 2, w: 9, h: 2 }, props: { intervalMs: 60000 } },
    ],
  },
  minimal: {
    id: 'minimal',
    title: 'Minimal',
    layout: { columns: 12, rowHeight: 90, gap: 10, background: undefined },
    behavior: { defaultFullscreen: true },
    theme: { name: 'Unsaturated', mode: 'light' },
    widgets: [
      { id: 'clock2', type: 'clock', position: { x: 0, y: 0, w: 12, h: 3 }, props: { showSeconds: false } },
    ],
  },
};

export const boardOrder = Object.keys(boards);
