export function exampleForRegistration(
  value: string,
): 'porsche' | 'lotus' | 'fiat' | 'tesla' | null {
  const normalized = value.toUpperCase().replace(/\s/g, '');
  return normalized === 'DF74FPA'
    ? 'porsche'
    : normalized === 'YJ22ACU'
      ? 'lotus'
      : normalized === 'SL60AUC'
        ? 'fiat'
        : normalized === 'LD17VAE'
          ? 'tesla'
          : null;
}
export function parseBuyerInputs(mileage: string, askingPrice: string) {
  function number(value: string, min: number, max: number) {
    if (!value.trim()) return null;
    if (!/^\d+$/.test(value.trim()))
      throw new Error('Enter whole numbers only, without commas or currency symbols.');
    const result = Number(value);
    if (!Number.isSafeInteger(result) || result < min || result > max)
      throw new Error(
        `Enter a value between ${min.toLocaleString('en-GB')} and ${max.toLocaleString('en-GB')}.`,
      );
    return result;
  }
  return { mileage: number(mileage, 0, 2000000), askingPrice: number(askingPrice, 1, 10000000) };
}
