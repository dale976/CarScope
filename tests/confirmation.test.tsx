import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { App } from '../src/client/App';

test('entry journey asks only for the registration before identification', () => {
  const html = renderToStaticMarkup(<App />);
  expect(html).toContain('Vehicle registration');
  expect(html).toContain('Identify vehicle');
  expect(html).not.toContain('Current mileage');
  expect(html).not.toContain('Asking price');
});
