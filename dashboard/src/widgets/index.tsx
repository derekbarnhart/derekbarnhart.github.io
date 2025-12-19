import React from 'react';
import type { ShellApi, WidgetInstance } from '../types';
import { useShell } from '../shell/ShellContext';
import { ClockWidget } from './ClockWidget';
import { WeatherWidget } from './WeatherWidget';
import { QuoteWidget } from './QuoteWidget';

export type WidgetProps<T = any> = {
  id: string;
  position: WidgetInstance['position'];
  props: T;
  shell?: ShellApi;
};

type WidgetComponent = React.FC<WidgetProps>;

const registry: Record<string, WidgetComponent> = {
  clock: withShell(ClockWidget),
  weather: withShell(WeatherWidget),
  quote: withShell(QuoteWidget),
};

export function widgetFor(type: string) {
  return registry[type];
}

function withShell<T>(Cmp: React.FC<WidgetProps<T>>): React.FC<WidgetProps<T>> {
  return (p: WidgetProps<T>) => {
    const { shell } = useShell();
    return <Cmp {...p} shell={shell} />;
  };
}

