import type { ClientRuntimeConfig } from '../shared/preview';

export async function loadRuntimeConfig(
  fetcher: (url: string, init?: RequestInit) => Promise<Response> = fetch,
): Promise<ClientRuntimeConfig | null> {
  try {
    const response = await fetcher('/api/runtime-config', { cache: 'no-store' });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
    const value = body as Partial<ClientRuntimeConfig>;
    if (value.dataMode === 'mock' && value.reportAction === 'mock')
      return { dataMode: 'mock', reportAction: 'mock' };
    if (
      value.dataMode === 'connected' &&
      (value.reportAction === 'sandbox' || value.reportAction === 'unavailable')
    )
      return { dataMode: 'connected', reportAction: value.reportAction };
  } catch {
    /* A failed configuration load must never silently change data sources. */
  }
  return null;
}
export function RuntimeUnavailable() {
  return (
    <main className="message-panel" role="alert">
      <h1>We couldn’t load the vehicle lookup.</h1>
      <p>Please reload the page before trying a registration.</p>
      <button type="button" className="primary" onClick={() => window.location.reload()}>
        Reload page
      </button>
    </main>
  );
}
