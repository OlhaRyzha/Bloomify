import { BASE_URL } from '@/components/config/env';

export const apiUrl = (path: string) => `${BASE_URL}/${path}`;
