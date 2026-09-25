import { expect, test } from 'bun:test';
import {
  asRecord,
  asRecordList,
  readFiniteNumber,
  readString,
} from '../src/server/provider/guards';
import { requestPackage } from '../src/server/provider/client';

test('guards narrow supplier values without inventing defaults', () => {
  expect(asRecord(null)).toBeUndefined();
  expect(asRecordList([{}, null, 'bad'])).toEqual([{}]);
  expect(readString({ value: '  Lotus ' }, 'value')).toBe('Lotus');
  expect(readFiniteNumber({ value: 0 }, 'value')).toBe(0);
  expect(readFiniteNumber({ value: Number.NaN }, 'value')).toBeUndefined();
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
