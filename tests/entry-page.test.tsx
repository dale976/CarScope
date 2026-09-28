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
  test('starts in mock mode with four optional examples and no sandbox controls', () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('aria-pressed="true">Mock');
    expect(html).toContain('aria-pressed="false">Live');
    expect(html.match(/class="example-vehicle"/g)).toHaveLength(4);
    expect(html).not.toContain('100 supplier calls');
    expect(html).not.toContain('30 registrations');
    expect(html).not.toContain('Sandbox prototype');
  });
});
