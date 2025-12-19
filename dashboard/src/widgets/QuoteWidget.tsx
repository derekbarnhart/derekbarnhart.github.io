import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './index';

type QuoteProps = { intervalMs?: number };
type QuoteData = { content: string; author: string };

const FALLBACKS: QuoteData[] = [
  { content: 'Simplicity is the ultimate sophistication.', author: 'Leonardo da Vinci' },
  { content: 'What gets measured gets managed.', author: 'Peter Drucker' },
  { content: 'Well begun is half done.', author: 'Aristotle' },
];

export const QuoteWidget: React.FC<WidgetProps<QuoteProps>> = ({ props }) => {
  const [q, setQ] = useState<QuoteData>(() => FALLBACKS[0]!);
  const [i, setI] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch('https://api.quotable.io/random');
        const j = await r.json();
        if (!cancelled) setQ({ content: j.content, author: j.author });
      } catch {
        if (!cancelled) setQ(FALLBACKS[(i + 1) % FALLBACKS.length]!);
      }
    };
    load();
    const t = setInterval(load, Math.max(10_000, props.intervalMs ?? 60_000));
    return () => { cancelled = true; clearInterval(t); };
  }, [props.intervalMs, i]);

  return (
    <div className="h-full flex flex-col">
      <div className="widget-title">Quote</div>
      <div className="widget-body flex-1">
        <div className="text-xl leading-relaxed">“{q.content}”</div>
        <div className="opacity-70 mt-2">— {q.author}</div>
      </div>
    </div>
  );
};
