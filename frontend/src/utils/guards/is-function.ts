// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isFunction<T extends (...args: any[]) => unknown>(
  value: unknown
): value is T {
  return typeof value === 'function';
}
