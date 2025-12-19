import React, { useEffect, useMemo, useState } from 'react';
import type { WidgetProps } from './index';

type ClockProps = { timezone?: 'local' | string; showSeconds?: boolean };

export const ClockWidget: React.FC<WidgetProps<ClockProps>> = ({ props }) => {
  const [now, setNow] = useState<Date>(new Date());
  const tz = props.timezone && props.timezone !== 'local' ? props.timezone : undefined;
  const fmt = useMemo(() => new Intl.DateTimeFormat(undefined, {
    hour: '2-digit', minute: '2-digit', second: props.showSeconds ? '2-digit' : undefined,
    hour12: false, timeZone: tz,
  }), [tz, props.showSeconds]);
  const df = useMemo(() => new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: '2-digit', timeZone: tz }), [tz]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), props.showSeconds ? 1000 : 1000 * 10);
    return () => clearInterval(t);
  }, [props.showSeconds]);

  return (
    <div className="h-full flex flex-col justify-center items-start">
      <div className="text-6xl font-semibold leading-none">{fmt.format(now)}</div>
      <div className="mt-2 opacity-70 text-xl">{df.format(now)}</div>
    </div>
  );
};

