import { createRoot } from 'react-dom/client';
import { App } from './App';
import type { ClientRuntimeConfig } from '../shared/preview';
import './styles/base.css';
import './styles/layout.css';
import './styles/journey.css';
import './styles/report.css';
import './styles/history.css';

async function runtimeConfig(): Promise<ClientRuntimeConfig> {
  try {
    const response = await fetch('/api/runtime-config', { cache: 'no-store' });
    if (response.ok) return (await response.json()) as ClientRuntimeConfig;
  } catch {
    // Production-safe fallback: never reveal development controls after a configuration failure.
  }
  return { sandboxControls: false };
}

createRoot(document.getElementById('root')!).render(<App runtimeConfig={await runtimeConfig()} />);
