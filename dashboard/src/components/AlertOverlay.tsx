import React from 'react';
import type { PersistedAlert } from '../types';

type Props = { alert: PersistedAlert };

export const AlertOverlay: React.FC<Props> = ({ alert }) => {
  const remaining = alert.expiresAt ? Math.max(0, alert.expiresAt - Date.now()) : undefined;
  const seconds = remaining ? Math.ceil(remaining / 1000) : undefined;
  const levelClass =
    alert.level === 'error' ? 'bg-red-600/90' :
    alert.level === 'warn' ? 'bg-yellow-600/90' :
    alert.level === 'success' ? 'bg-green-600/90' : 'bg-sky-700/90';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className={`relative max-w-3xl mx-6 rounded-xl shadow-2xl p-8 ${levelClass} text-white`}>
        <h2 className="text-3xl font-bold mb-3">{alert.title}</h2>
        <p className="text-lg opacity-95 whitespace-pre-wrap">{alert.message}</p>
        <div className="mt-6 flex items-center gap-3 flex-wrap">
          {alert.actions?.slice(0, 9).map((a, idx) => (
            <span key={a.id} className={`kbd ${a.primary ? 'border-white/50 bg-white/20' : ''}`}>
              {idx + 1}. {a.label}
            </span>
          ))}
          <span className="ml-auto text-sm opacity-80 flex items-center gap-2">
            <span className="kbd">Enter</span>
            <span>Acknowledge</span>
            {alert.actions?.find(a => a.id === 'cancel') && (
              <>
                <span className="kbd">Esc</span>
                <span>Cancel</span>
              </>
            )}
          </span>
        </div>
        {seconds !== undefined && (
          <div className="mt-3 text-sm opacity-80">Auto-acknowledging in {seconds}s…</div>
        )}
      </div>
    </div>
  );
};

