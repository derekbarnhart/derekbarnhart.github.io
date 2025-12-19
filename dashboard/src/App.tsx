import React, { useEffect, useMemo, useState } from 'react';
import { Grid } from './components/Grid';
import { AlertOverlay } from './components/AlertOverlay';
import { FullscreenGate } from './components/FullscreenGate';
import { HelpOverlay } from './components/HelpOverlay';
import { ShellProvider, useShell } from './shell/ShellContext';
import type { Board } from './types';
import { boards, boardOrder } from './boards';

const STORAGE_KEY = 'dashboard/state';

function useQueryBoardName(): [string, (name: string) => void] {
  const params = new URLSearchParams(window.location.search);
  const q = params.get('board');
  const persisted = (() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')?.boardName as string | undefined; } catch { return undefined; }
  })();
  const initial = q ?? persisted ?? 'default';
  const [name, setName] = useState<string>(initial);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    p.set('board', name);
    const url = `${location.pathname}?${p.toString()}${location.hash}`;
    window.history.replaceState({}, '', url);
    // persist
    try {
      const state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      state.boardName = name;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [name]);
  return [name, setName];
}

const BoardView: React.FC = () => {
  const { activeAlert, shell, bus } = useShell();
  const [showHelp, setShowHelp] = useState(false);
  const [boardName, setBoardName] = useQueryBoardName();
  const order = useMemo(() => boardOrder, []);
  const idx = Math.max(0, order.indexOf(boardName));
  const firstKey = order[0] ?? Object.keys(boards)[0] ?? 'default';
  const board: Board = (boards[boardName] ?? boards[firstKey]) as Board;

  // keyboard shortcuts: board switching and help
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ']') {
        if (order.length === 0) return;
        const next = order[(idx + 1) % order.length] as string;
        setBoardName(next);
        bus.emit('board:changed', next);
      } else if (e.key === '[') {
        if (order.length === 0) return;
        const prev = order[(idx - 1 + order.length) % order.length] as string;
        setBoardName(prev);
        bus.emit('board:changed', prev);
      } else if (e.key.toLowerCase() === 'h') {
        setShowHelp((v) => !v);
      } else if (e.key === 'Escape') {
        setShowHelp(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [idx, order, setBoardName, bus]);

  // attempt fullscreen by default (prod only)
  useEffect(() => {
    const attempt = async () => {
      if (import.meta.env.DEV) return; // do not request FS in dev
      if (!document.fullscreenElement) {
        try { await shell.requestFullscreen(); } catch {}
      }
    };
    // defer to next tick to allow PWA standalone rendering
    setTimeout(attempt, 0);
  }, [shell]);

  // Apply theme data attributes and meta theme-color on board change
  useEffect(() => {
    const r = document.documentElement;
    const themeName = (board.theme?.name ?? 'Saturated');
    const canonical = (() => {
      const n = themeName.toLowerCase();
      if (n === 'saturated') return 'Saturated';
      if (n === 'unsaturated') return 'Unsaturated';
      return themeName; // use as-is
    })();
    const mode = board.theme?.mode ?? 'dark';
    r.setAttribute('data-theme', canonical);
    r.setAttribute('data-mode', mode);
    // update meta theme-color to surface-canvas
    const meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    if (meta) {
      const color = getComputedStyle(r).getPropertyValue('--surface-canvas').trim();
      if (color) meta.content = color;
    }
    // font scale
    const scale = board.theme?.fontScale ?? 1;
    (r.style as any).setProperty('--dashboard-font-scale', String(scale));
  }, [board]);

  const bg = board.layout.background ?? 'var(--surface-canvas)';
  return (
    <div className="h-full" style={{ background: bg }}>
      <Grid board={board} />
      {activeAlert && <AlertOverlay alert={activeAlert} />}
      {!import.meta.env.DEV && !document.fullscreenElement && <FullscreenGate />}
      {showHelp && <HelpOverlay onClose={() => setShowHelp(false)} />}
    </div>
  );
};

const AppInner: React.FC = () => {
  return <BoardView />;
};

export const App: React.FC = () => {
  return (
    <ShellProvider>
      <AppInner />
    </ShellProvider>
  );
};

export default App;
