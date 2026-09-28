export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    public readonly publicMessage: string,
    options?: ErrorOptions,
  ) {
    super(publicMessage, options);
    this.name = 'AppError';
  }
}

export function toPublicError(error: unknown): {
  status: number;
  body: { error: string; code: string };
} {
  if (error instanceof AppError)
    return {
      status: error.status,
      body: { error: error.publicMessage, code: error.code },
    };
  return {
    status: 500,
    body: {
      error: 'The request could not be completed. Please try again.',
      code: 'INTERNAL_ERROR',
    },
  };
}
