export type WidgetPosition = { x: number; y: number; w: number; h: number; z?: number };

export type WidgetInstance = {
  id: string;
  type: string;
  position: WidgetPosition;
  refreshMs?: number;
  props?: Record<string, unknown>;
  color?: string; // e.g., "blue-alt2"
};

export type BoardLayout = {
  columns: number;
  rowHeight: number; // px per row
  gap: number; // px
  background?: string;
};

export type BoardBehavior = {
  defaultFullscreen: boolean;
  autoReloadMs?: number;
};

export type BoardTheme = {
  name: string; // case-insensitive theme name, e.g., 'Saturated'
  mode: 'light' | 'dark';
  fontScale?: number; // multiplier
};

export type Board = {
  id: string;
  title: string;
  layout: BoardLayout;
  behavior?: BoardBehavior;
  theme?: BoardTheme;
  widgets: WidgetInstance[];
};

export type AlertAction = { id: string; label: string; primary?: boolean };
export type AlertLevel = 'info' | 'warn' | 'error' | 'success';

export type AlertData = {
  id?: string;
  title: string;
  message: string;
  level?: AlertLevel;
  timeoutMs?: number;
  actions?: AlertAction[];
};

export type PersistedAlert = Required<Pick<AlertData, 'title' | 'message'>> &
  Pick<AlertData, 'level' | 'timeoutMs' | 'actions'> & {
    id: string;
    startedAt: number; // epoch ms
    expiresAt?: number; // epoch ms
  };

export type LocalState = {
  boardName?: string;
  fullscreenConsent?: boolean;
  activeAlert?: PersistedAlert;
};

export type ShellApi = {
  triggerAlert: (data: AlertData) => Promise<string>;
  dismissAlert: (id?: string) => void;
  requestFullscreen: () => Promise<boolean>;
  isFullscreen: () => boolean;
  onBoardEvent: (type: string, handler: (payload?: any) => void) => () => void;
};
