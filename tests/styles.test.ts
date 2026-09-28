import { expect, test } from 'bun:test';
test('timeline markers only decorate top-level history events', async () => {
  const css = await Bun.file(new URL('../src/client/styles/history.css', import.meta.url)).text();
  expect(css).toMatch(/\.test-findings li:before\s*{\s*content:\s*none;\s*}/);
});
test('tyre card keeps report rhythm when it follows EV battery details', async () => {
  const css = await Bun.file(new URL('../src/client/styles/report.css', import.meta.url)).text();
  expect(css).toMatch(
    /\.report-chapter \.ev-section\s*\+\s*\.data-card\s*{\s*margin-top:\s*22px;\s*}/,
  );
});

test('client imports responsibility styles in stable cascade order', async () => {
  const entry = await Bun.file(new URL('../src/client/main.tsx', import.meta.url)).text();
  const imports = [...entry.matchAll(/import '\.\/styles\/(.+\.css)'/g)].map((match) => match[1]);
  expect(imports).toEqual(['base.css', 'layout.css', 'journey.css', 'report.css', 'history.css']);
});
