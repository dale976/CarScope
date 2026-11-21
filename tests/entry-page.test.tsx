import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { App } from '../src/client/App';

describe('buying report entry page', () => {
  test('sets honest coverage expectations and uses formal CarScope branding', () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('digital MOT records generally begin in 2005');
    expect(html).toContain('Older, imported and exempt vehicles may have gaps');
    expect(html).toContain('class="brand-car">CAR');
    expect(html).toContain('class="brand-scope">SCOPE');
    expect(html).not.toContain('class="brand-symbol"');
  });
  test('mock launch has examples but no source selector', () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).not.toContain('aria-label="Data source"');
    expect(html.match(/class="example-vehicle"/g)).toHaveLength(4);
  });
  test('connected launch has no mock examples or source controls', () => {
    const html = renderToStaticMarkup(
      <App runtimeConfig={{ dataMode: 'connected', reportAction: 'sandbox' }} />,
    );
    expect(html).not.toContain('aria-label="Data source"');
    expect(html).not.toContain('class="example-vehicle"');
    expect(html).toContain('no payment');
  });
});
