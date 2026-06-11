import { headers } from 'next/headers';

import { BASE_URL } from '@/components/config/env';

const LOCAL_HOST_PREFIX = 'localhost';
const FORWARDED_HOST_HEADER = 'x-forwarded-host';
const FORWARDED_PROTO_HEADER = 'x-forwarded-proto';
const HOST_HEADER = 'host';

export const getServerApiBaseUrl = async (): Promise<string | undefined> => {
  if (BASE_URL !== '/api') {
    return undefined;
  }

  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get(FORWARDED_HOST_HEADER);
  const host = forwardedHost ?? requestHeaders.get(HOST_HEADER);

  if (!host) {
    return undefined;
  }

  const forwardedProto = requestHeaders.get(FORWARDED_PROTO_HEADER);
  const protocol =
    forwardedProto ?? (host.startsWith(LOCAL_HOST_PREFIX) ? 'http' : 'https');

  return `${protocol}://${host}${BASE_URL}`;
};
