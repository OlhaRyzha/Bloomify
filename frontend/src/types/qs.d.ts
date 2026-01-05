declare module 'qs' {
  export interface StringifyOptions {
    arrayFormat?: 'indices' | 'brackets' | 'repeat' | 'comma';
    encode?: boolean;
  }

  export function stringify(
    obj: Record<string, unknown>,
    options?: StringifyOptions
  ): string;

  const qs: {
    stringify: typeof stringify;
  };

  export default qs;
}
