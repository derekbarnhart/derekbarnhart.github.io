import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { AlertData, LocalState, PersistedAlert, ShellApi } from '../types';

const STORAGE_KEY = 'dashboard/state';

function loadState(): LocalState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalState) : {};
  } catch {
    return {};
  }
}

function saveState(state: LocalState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

// Simple event bus
type Handler = (payload?: any) => void;
class Bus {
  private handlers = new Map<string, Set<Handler>>();
  on(type: string, h: Handler) {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type)!.add(h);
    return () => this.off(type, h);
  }
  off(type: string, h: Handler) {
    this.handlers.get(type)?.delete(h);
  }
  emit(type: string, payload?: any) {
    this.handlers.get(type)?.forEach((h) => h(payload));
  }
}

type ShellContextValue = {
  shell: ShellApi;
  activeAlert?: PersistedAlert;
  setActiveAlert: React.Dispatch<React.SetStateAction<PersistedAlert | undefined>>;
  bus: Bus;
};

const ShellContext = createContext<ShellContextValue | null>(null);

export function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error('ShellContext not available');
  return ctx;
}

function fullscreenElement(): Element | null {
  return document.fullscreenElement || (document as any).webkitFullscreenElement || null;
}

async function requestFs(): Promise<boolean> {
  const el = document.documentElement as any;
  try {
    if (el.requestFullscreen) {
      await el.requestFullscreen();
      return true;
    }
    if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export const ShellProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const persisted = useMemo(loadState, []);
  const [activeAlert, setActiveAlert] = useState<PersistedAlert | undefined>(() => {
    const a = persisted.activeAlert;
    if (!a) return undefined;
    if (a.expiresAt && a.expiresAt <= Date.now()) return undefined; // already expired
    return a;
  });
  const [fsConsent, setFsConsent] = useState<boolean>(!!persisted.fullscreenConsent);
  const busRef = useRef(new Bus());
  const resolvers = useRef<Record<string, (value: string) => void>>({});

  // persist on changes
  useEffect(() => {
    const state: LocalState = {
      ...persisted,
      fullscreenConsent: fsConsent,
      activeAlert,
    };
    saveState(state);
  }, [activeAlert, fsConsent]);

  // resume countdown for alert with timeout
  useEffect(() => {
    if (!activeAlert || !activeAlert.timeoutMs) return;
    const remaining = (activeAlert.expiresAt ?? activeAlert.startedAt + activeAlert.timeoutMs) - Date.now();
    if (remaining <= 0) {
      // auto-ack
      const id = activeAlert.id;
      setActiveAlert(undefined);
      resolvers.current[id]?.('ack');
      delete resolvers.current[id];
      return;
    }
    const t = setTimeout(() => {
      const id = activeAlert.id;
      setActiveAlert(undefined);
      resolvers.current[id]?.('ack');
      delete resolvers.current[id];
    }, remaining);
    return () => clearTimeout(t);
  }, [activeAlert]);

  const isFullscreen = useCallback(() => !!fullscreenElement(), []);

  const requestFullscreen = useCallback(async () => {
    const ok = await requestFs();
    if (ok && !fsConsent) setFsConsent(true);
    return ok;
  }, [fsConsent]);

  const triggerAlert = useCallback((data: AlertData) => {
    const id = data.id ?? Math.random().toString(36).slice(2);
    const startedAt = Date.now();
    const expiresAt = data.timeoutMs ? startedAt + data.timeoutMs : undefined;
    const alert: PersistedAlert = {
      id,
      title: data.title,
      message: data.message,
      level: data.level,
      actions: data.actions,
      timeoutMs: data.timeoutMs,
      startedAt,
      expiresAt,
    };
    setActiveAlert(alert);
    return new Promise<string>((resolve) => {
      resolvers.current[id] = resolve;
      // timer handling is in the effect
    });
  }, []);

  const dismissAlert = useCallback((id?: string) => {
    if (!activeAlert) return;
    if (!id || id === activeAlert.id) {
      const a = activeAlert;
      setActiveAlert(undefined);
      resolvers.current[a.id]?.('ack');
      delete resolvers.current[a.id];
    }
  }, [activeAlert]);

  useEffect(() => {
    // keyboard for alerts
    const onKey = (e: KeyboardEvent) => {
      if (!activeAlert) return;
      if (e.key === 'Enter' || e.key === ' ') {
        dismissAlert(activeAlert.id);
      } else if (/^[1-9]$/.test(e.key) && activeAlert.actions && activeAlert.actions.length) {
        const idx = parseInt(e.key, 10) - 1;
        const action = activeAlert.actions[idx];
        if (action) {
          const id = activeAlert.id;
          setActiveAlert(undefined);
          resolvers.current[id]?.(`action:${action.id}`);
          delete resolvers.current[id];
        }
      } else if (e.key === 'Escape') {
        const cancel = activeAlert.actions?.find((a) => a.id === 'cancel');
        if (cancel) {
          const id = activeAlert.id;
          setActiveAlert(undefined);
          resolvers.current[id]?.('cancel');
          delete resolvers.current[id];
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeAlert, dismissAlert]);

  const shell: ShellApi = useMemo(() => ({
    triggerAlert,
    dismissAlert,
    requestFullscreen,
    isFullscreen: () => !!fullscreenElement(),
    onBoardEvent: (type, handler) => busRef.current.on(type, handler),
  }), [triggerAlert, dismissAlert, requestFullscreen]);

  const value: ShellContextValue = { shell, activeAlert, setActiveAlert, bus: busRef.current };
  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
};

