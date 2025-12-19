import React from 'react';

type Props = { onClose: () => void };

export const HelpOverlay: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-w-3xl w-[90%] mx-auto rounded-xl shadow-2xl p-8 bg-white/10 text-white border border-white/20">
        <h2 className="text-2xl font-semibold mb-4">Keyboard Shortcuts</h2>
        <ul className="space-y-3">
          <li className="flex items-center gap-3"><span className="kbd">[</span><span>Previous board</span></li>
          <li className="flex items-center gap-3"><span className="kbd">]</span><span>Next board</span></li>
          <li className="flex items-center gap-3"><span className="kbd">h</span><span>Toggle help</span></li>
          <li className="flex items-center gap-3"><span className="kbd">Enter</span><span>Acknowledge alert</span></li>
          <li className="flex items-center gap-3"><span className="kbd">Space</span><span>Acknowledge alert</span></li>
          <li className="flex items-center gap-3"><span className="kbd">1–9</span><span>Select alert action</span></li>
          <li className="flex items-center gap-3"><span className="kbd">Esc</span><span>Cancel alert (if available) or close help</span></li>
        </ul>
        <div className="mt-6 text-sm opacity-80">Click outside or press <span className="kbd">h</span>/<span className="kbd">Esc</span> to close.</div>
      </div>
    </div>
  );
};

