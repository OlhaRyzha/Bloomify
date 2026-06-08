import z from 'zod';

import { ApiError } from '../errors/api-error';
import { technicalMessages } from '@/constants/message.constants';

export function parseResponseWithSchema<T>(
  response: T,
  schema: z.Schema<NonNullable<T>>
): T {
  const parsed = schema.safeParse(response);

  if (parsed.success) {
    return parsed.data;
  }

  console.error(technicalMessages.zodError, parsed.error, response);
  throw ApiError.fromZod(parsed.error);
}

export async function safeFetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error('[Binance] fetch error', url, error);
    return null;
  }
}
