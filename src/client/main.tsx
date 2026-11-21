import { createRoot } from 'react-dom/client';
import { App } from './App';
import { loadRuntimeConfig, RuntimeUnavailable } from './runtime-config';
import './styles/base.css';
import './styles/layout.css';
import './styles/journey.css';
import './styles/report.css';
import './styles/history.css';

const config = await loadRuntimeConfig();
createRoot(document.getElementById('root')!).render(
  config ? <App runtimeConfig={config} /> : <RuntimeUnavailable />,
);
