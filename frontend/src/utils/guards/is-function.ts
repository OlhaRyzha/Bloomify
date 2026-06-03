export function isFunction<T extends (...args: never[]) => unknown>(
  value: unknown
): value is T {
  return typeof value === 'function';
}
