import { test, expect } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { VehicleStory, buildTimeline } from '../src/client/VehicleStory';
test('timeline combines events chronologically without inventing ownership', () => {
  const events = buildTimeline(
    {
      registered: '2022-05-11',
      keepers: [
        { date: '2024-06-27', previous: 2 },
        { date: '2023-08-01', previous: 1 },
      ],
    },
    [{ date: '2025-04-11', mileage: 3454, expiry: '2026-05-10' }],
  );
  expect(events.map((e) => e.date)).toEqual([
    '2022-05-11',
    '2023-08-01',
    '2024-06-27',
    '2025-04-11',
  ]);
  expect(events[1]?.title).toContain('keeper');
});
test('optional detail does not invent missing specifications', () => {
  const html = renderToStaticMarkup(
    <VehicleStory
      detail={{
        registered: '2022-05-11',
        keepers: [],
        colour: 'Blue',
        originalColour: 'Blue',
        colourChanges: 0,
      }}
      mot={[]}
    />,
  );
  expect(html).toContain('Blue');
  expect(html).toContain('No recorded colour changes');
  expect(html).not.toContain('410 bhp');
  expect(html).not.toContain('0–60');
});
test('Porsche acceleration uses the supplied metric rather than relabelling 0–60', () => {
  const html = renderToStaticMarkup(
    <VehicleStory detail={{ registered: '2024-11-22', keepers: [], zeroToHundred: 4 }} mot={[]} />,
  );
  expect(html).toContain('0–100 km/h');
  expect(html).not.toContain('0–60 mph');
});
test('performance summary uses the same card surface as other vehicle facts', () => {
  const html = renderToStaticMarkup(
    <VehicleStory
      detail={{ registered: '2024-11-22', keepers: [], engine: 'Electric', powerBhp: 500 }}
      mot={[]}
    />,
  );
  expect(html).toContain('class="character data-card"');
  expect(html).toContain('Model specifications');
  expect(html).not.toContain('Meet the machine');
});
test('identity dimensions and weight share one compact vehicle profile card', () => {
  const html = renderToStaticMarkup(
    <VehicleStory
      detail={{
        registered: '2024-11-22',
        keepers: [],
        dimensions: { length: 4000, width: 1800, height: 1200 },
        weight: { kerb: 1200, massInService: 1250 },
      }}
      mot={[]}
    />,
  );
  expect(html).toContain('class="vehicle-profile-card data-card"');
  const card = html.slice(
    html.indexOf('vehicle-profile-card'),
    html.indexOf('</section>', html.indexOf('vehicle-profile-card')),
  );
  expect(card).toContain('Identity &amp; appearance');
  expect(card).toContain('Size and everyday practicality');
  expect(card).toContain('Weight figures explained');
});
