import { expect, test } from 'bun:test';
test('timeline markers only decorate top-level history events', async () => {
  const css = await Bun.file(new URL('../src/client/styles.css', import.meta.url)).text();
  expect(css).toMatch(/\.test-findings li:before\s*{\s*content:\s*none;\s*}/);
});
test('tyre card keeps report rhythm when it follows EV battery details', async () => {
  const css = await Bun.file(new URL('../src/client/styles.css', import.meta.url)).text();
  expect(css).toMatch(
    /\.report-chapter \.ev-section\s*\+\s*\.data-card\s*{\s*margin-top:\s*22px;\s*}/,
  );
});
