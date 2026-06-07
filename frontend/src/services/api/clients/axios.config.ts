import { TIMEOUT } from '@/constants/network.constants';
import { cleanParams } from '@/services/api/request/clean-params';
import { AxiosRequestConfig } from 'axios';
import qs from 'qs';

export const createAxiosConfig = (): AxiosRequestConfig => ({
  timeout: TIMEOUT,
  paramsSerializer: {
    serialize: (params) =>
      qs.stringify(cleanParams(params), {
        arrayFormat: 'repeat',
        encode: false,
      }),
  },
});
