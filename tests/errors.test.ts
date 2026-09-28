import { expect, test } from 'bun:test';
import { AppError, toPublicError } from '../src/server/errors';

test('typed application errors preserve stable public status and code', () => {
  expect(toPublicError(new AppError('INVALID_INPUT', 422, 'Enter a valid registration.'))).toEqual({
    status: 422,
    body: { error: 'Enter a valid registration.', code: 'INVALID_INPUT' },
  });
});

test('unexpected errors never expose their internal message', () => {
  const result = toPublicError(new Error('secret database or supplier detail'));
  expect(result.status).toBe(500);
  expect(result.body).toEqual({
    error: 'The request could not be completed. Please try again.',
    code: 'INTERNAL_ERROR',
  });
  expect(JSON.stringify(result)).not.toContain('secret');
});
