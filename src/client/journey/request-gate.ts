/** Ignore stale responses after the registration or selected source changes. */
export function createRequestGate() {
  let sequence = 0;
  return {
    invalidate() {
      sequence++;
    },
    async run<T>(
      work: () => Promise<T>,
      success: (value: T) => void,
      failure: (error: unknown) => void,
    ) {
      const current = ++sequence;
      try {
        const value = await work();
        if (current === sequence) success(value);
      } catch (error) {
        if (current === sequence) failure(error);
      }
    },
  };
}
