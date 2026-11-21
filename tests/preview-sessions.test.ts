import { expect, test } from 'bun:test';
import { createMemoryPreviewSessionStore } from '../src/server/preview-sessions';
import type { BuyingReport } from '../src/shared/report';

const sampleReport = {
  kind: 'sandbox-example',
  registration: 'LD17VAE',
  vehicle: { name: 'Tesla Model X 75D', year: 2017, mileage: null, askingPrice: null },
  findings: [],
  checks: [],
  costs: [],
  sellerQuestions: [],
} as BuyingReport;

test('preview sessions expire and reject mismatched registration or mode', async () => {
  let now = 1_000;
  const sessions = createMemoryPreviewSessionStore({ now: () => now, ttlMs: 30 * 60_000 });
  const id = await sessions.create({ mode: 'mock', registration: 'LD17VAE', report: sampleReport });
  await expect(sessions.complete(id, 'live', 'LD17VAE', async () => sampleReport)).rejects.toThrow(
    'does not match',
  );
  await expect(sessions.complete(id, 'mock', 'SL60AUC', async () => sampleReport)).rejects.toThrow(
    'does not match',
  );
  now += 30 * 60_000 + 1;
  await expect(sessions.complete(id, 'mock', 'LD17VAE', async () => sampleReport)).rejects.toThrow(
    'expired',
  );
});

test('completion coalesces concurrent work and clears a rejected attempt', async () => {
  const sessions = createMemoryPreviewSessionStore();
  const id = await sessions.create({ mode: 'mock', registration: 'LD17VAE', report: sampleReport });
  let calls = 0;
  const complete = () => {
    calls++;
    return Promise.resolve(sampleReport);
  };
  const [first, second] = await Promise.all([
    sessions.complete(id, 'mock', 'LD17VAE', complete),
    sessions.complete(id, 'mock', 'LD17VAE', complete),
  ]);
  expect(first).toBe(second);
  expect(calls).toBe(1);

  const retryId = await sessions.create({
    mode: 'mock',
    registration: 'LD17VAE',
    report: sampleReport,
  });
  await expect(
    sessions.complete(retryId, 'mock', 'LD17VAE', async () => {
      throw new Error('temporary');
    }),
  ).rejects.toThrow('temporary');
  await sessions.complete(retryId, 'mock', 'LD17VAE', complete);
  expect(calls).toBe(2);
});

test('official sessions cache completed reports and failed attempts without repeat spending', async () => {
  const sessions = createMemoryPreviewSessionStore();
  const preview = {
    previewId: '',
    source: 'official' as const,
    registration: 'LD17VAE',
    vehicle: { name: 'TESLA MODEL X', year: 2017 },
    coverage: { message: 'Unknown' },
  };
  const id = await sessions.create({ mode: 'official', registration: 'LD17VAE', preview });
  let calls = 0;
  const work = async () => {
    calls++;
    return sampleReport;
  };
  await sessions.complete(id, 'official', 'LD17VAE', work);
  await sessions.complete(id, 'official', 'LD17VAE', work);
  expect(calls).toBe(1);
  const failed = await sessions.create({ mode: 'official', registration: 'LD17VAE', preview });
  const fail = async () => {
    calls++;
    throw new Error('partial supplier failure');
  };
  await expect(sessions.complete(failed, 'official', 'LD17VAE', fail)).rejects.toThrow(
    'partial supplier failure',
  );
  await expect(sessions.complete(failed, 'official', 'LD17VAE', fail)).rejects.toThrow(
    'partial supplier failure',
  );
  expect(calls).toBe(2);
});
test('preview expires at the exact TTL boundary', async () => {
  let now = 0;
  const sessions = createMemoryPreviewSessionStore({ now: () => now, ttlMs: 1000 });
  const id = await sessions.create({ mode: 'mock', registration: 'LD17VAE', report: sampleReport });
  now = 1000;
  await expect(sessions.complete(id, 'mock', 'LD17VAE', async () => sampleReport)).rejects.toThrow(
    'expired',
  );
});
