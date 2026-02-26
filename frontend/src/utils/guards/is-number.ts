export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isValueGreaterThanZero(value: unknown): value is number {
  return isNumber(value) && value > 0;
}
