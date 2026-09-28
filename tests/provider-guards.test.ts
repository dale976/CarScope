import { expect, test } from 'bun:test';
import {
  asRecord,
  asRecordList,
  readBoolean,
  readDate,
  readFiniteNumber,
  readRecord,
  readString,
} from '../src/server/provider/guards';
import { requestPackage } from '../src/server/provider/client';

test('guards narrow supplier values without inventing defaults', () => {
  expect(asRecord(null)).toBeUndefined();
  expect(asRecordList([{}, null, 'bad'])).toEqual([{}]);
  expect(readString({ value: '  Lotus ' }, 'value')).toBe('Lotus');
  expect(readFiniteNumber({ value: 0 }, 'value')).toBe(0);
  expect(readFiniteNumber({ value: Number.NaN }, 'value')).toBeUndefined();
  expect(readBoolean({ value: false }, 'value')).toBe(false);
  expect(readRecord({ value: [] }, 'value')).toBeUndefined();
  expect(readDate('2026-02-30')).toBeUndefined();
  expect(readDate('2026-02-28T12:00:00Z')).toBe('2026-02-28');
});

test('rejects unsuccessful and malformed HTTP 200 envelopes', async () => {
  const fetcher = async () =>
    new Response(JSON.stringify({ ResponseInformation: { IsSuccessStatusCode: false } }));
  expect(requestPackage('VDICheck', 'YJ22ACU', 'secret', fetcher)).rejects.toThrow(
    'VDICheck returned no usable results',
  );
  const malformed = async () => new Response(JSON.stringify({ Results: [] }));
  expect(requestPackage('VDICheck', 'YJ22ACU', 'secret', malformed)).rejects.toThrow(
    'VDICheck returned no usable results',
  );
});

test('supplier transport failures carry a stable safe error classification', async () => {
  const fetcher = async () => new Response('private upstream detail', { status: 503 });
  try {
    await requestPackage('VDICheck', 'YJ22ACU', 'secret', fetcher);
    throw new Error('Expected requestPackage to reject');
  } catch (error) {
    expect((error as { code?: string }).code).toBe('SUPPLIER_UNAVAILABLE');
    expect((error as { status?: number }).status).toBe(502);
    expect(String(error)).not.toContain('private upstream detail');
    expect(String(error)).not.toContain('secret');
  }
});
