import React from 'react';
import type { Board, WidgetInstance } from '../types';
import { widgetFor } from '../widgets';
import { ErrorBoundary } from './ErrorBoundary';

function colorStyle(token?: string): React.CSSProperties | undefined {
  if (!token) return undefined;
  // token like "blue-alt2"
  const m = token.match(/^([a-z]+)-alt([123])$/i);
  if (!m) return undefined;
  const [, h, a] = m;
  if (!h || !a) return undefined;
  const hue = h.toLowerCase();
  const alt = a;
  return {
    background: `var(--color-${hue}-alt${alt}-bg)` as any,
    color: `var(--color-${hue}-alt${alt}-fg)` as any,
    borderColor: `var(--color-${hue}-alt${alt}-border)` as any,
  };
}

const Tile: React.FC<{ widget: WidgetInstance }> = ({ widget }) => {
  const Cmp = widgetFor(widget.type);
  if (!Cmp) {
    return (
      <div className="widget-tile">
        <div className="widget-body">Unknown widget type: {widget.type}</div>
      </div>
    );
  }
  return (
    <div className="widget-tile" style={colorStyle(widget.color)}>
      <div className="widget-body">
        <ErrorBoundary>
          <Cmp id={widget.id} position={widget.position} props={widget.props ?? {}} />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export const Grid: React.FC<{ board: Board }> = ({ board }) => {
  const { layout } = board;
  const style: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
    gridAutoRows: `${layout.rowHeight}px`,
    gap: `${layout.gap}px`,
    alignContent: 'start',
  };
  return (
    <div className="dashboard-grid p-3" style={style}>
      {board.widgets.map((w) => {
        const s: React.CSSProperties = {
          gridColumn: `${w.position.x + 1} / span ${w.position.w}`,
          gridRow: `${w.position.y + 1} / span ${w.position.h}`,
          zIndex: w.position.z,
          height: '100%',
        };
        return (
          <div key={w.id} style={s}>
            <Tile widget={w} />
          </div>
        );
      })}
    </div>
  );
};
