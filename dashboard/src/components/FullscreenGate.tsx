import React from 'react';
import { useShell } from '../shell/ShellContext';

export const FullscreenGate: React.FC = () => {
  const { shell } = useShell();
  const onClick = async () => {
    await shell.requestFullscreen();
  };
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative max-w-xl mx-6 rounded-xl shadow-xl p-8 bg-white/10 text-white border border-white/20">
        <h2 className="text-2xl font-semibold mb-2">Click to start</h2>
        <p className="opacity-90">This dashboard runs in fullscreen. Click anywhere to continue.</p>
        <button onClick={onClick} className="mt-6 px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded">Enter Fullscreen</button>
      </div>
    </div>
  );
};

