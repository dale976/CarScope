import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadRuntimeConfig, RuntimeUnavailable } from '../src/client/runtime-config';

test('runtime config failures cannot silently start a different data journey', async () => {
  for (const fetcher of [
    async () => {
      throw new Error('offline');
    },
    async () => new Response('error', { status: 503 }),
    async () => Response.json({ dataMode: 'other', reportAction: 'sandbox' }),
  ]) {
    expect(await loadRuntimeConfig(fetcher)).toBeNull();
  }
  const html = renderToStaticMarkup(<RuntimeUnavailable />);
  expect(html).toContain('Reload');
  expect(html).not.toContain('<form');
});
test('runtime config returns only validated public launch metadata', async () => {
  expect(
    await loadRuntimeConfig(async () =>
      Response.json({ dataMode: 'connected', reportAction: 'sandbox', private: 'omitted' }),
    ),
  ).toEqual({ dataMode: 'connected', reportAction: 'sandbox' });
});
