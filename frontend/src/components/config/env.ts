// Default to local backend if env is missing to avoid hitting Next host or prod API accidentally
export const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
