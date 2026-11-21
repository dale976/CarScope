import { expect, test } from 'bun:test';
import { createRequestGate } from '../src/client/journey/request-gate';

test('a source change invalidates pending success and error updates', async () => {
  const gate = createRequestGate();
  const updates: string[] = [];
  let resolve!: (value: string) => void;
  const pending = gate.run(
    () =>
      new Promise<string>((done) => {
        resolve = done;
      }),
    (value) => {
      updates.push(value);
    },
    () => {
      updates.push('error');
    },
  );
  gate.invalidate();
  resolve('stale official preview');
  await pending;
  expect(updates).toEqual([]);
  await gate.run(
    async () => 'current mock preview',
    (value) => {
      updates.push(value);
    },
    () => {
      updates.push('error');
    },
  );
  expect(updates).toEqual(['current mock preview']);
});
test('a slower earlier request cannot replace a newer preview', async () => {
  const gate = createRequestGate();
  const updates: string[] = [];
  let reject!: (error: Error) => void;
  const pending = gate.run(
    () =>
      new Promise<string>((_, fail) => {
        reject = fail;
      }),
    (value) => {
      updates.push(value);
    },
    () => {
      updates.push('stale error');
    },
  );
  await gate.run(
    async () => 'new preview',
    (value) => {
      updates.push(value);
    },
    () => {},
  );
  reject(new Error('stale'));
  await pending;
  expect(updates).toEqual(['new preview']);
});
