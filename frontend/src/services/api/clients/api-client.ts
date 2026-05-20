import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import { ALLOWED_EXTERNAL_HOSTS } from '@/constants/network.constants';
import { createAxiosConfig } from './axios.config';
import { BASE_URL } from '@/components/config/env';
import { isAbsoluteUrl } from '@/utils/guards/is-absolute-url';
import { getHost } from '@/utils/url/get-host';
import { safeRequest, safeVoidRequest } from '@/utils/api/safe-request';
import type { SafeRequestOptions } from '@/utils/api/safe-request';
import { getLocaleFromPathname } from '@/i18n/routing';
import { isObject } from '@/utils/guards/is-object';
import { useAuthTokenStore } from '@/features/auth/store/auth-token.store';

type RequestMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

type RequestParams<TBody = unknown> = {
  method: RequestMethod;
  url: string;
  body?: TBody;
  config?: AxiosRequestConfig;
};

const silentRequestOptions: SafeRequestOptions = {
  showErrorToast: false,
};

const withLocaleParam = (
  params: AxiosRequestConfig['params'],
  locale: string
) => {
  if (params instanceof URLSearchParams) {
    const nextParams = new URLSearchParams(params);

    if (!nextParams.has('lang')) {
      nextParams.set('lang', locale);
    }

    return Object.fromEntries(nextParams.entries());
  }

  if (!isObject(params)) {
    return { lang: locale };
  }

  if ('lang' in params) {
    return params;
  }

  return {
    ...params,
    lang: locale,
  };
};

export class ApiClient {
  private axiosBase: AxiosInstance;
  private axiosExternal: AxiosInstance;
  private axiosNext: AxiosInstance;

  constructor() {
    this.axiosBase = axios.create({
      ...createAxiosConfig(),
      baseURL: BASE_URL,
      withCredentials: true,
    });

    this.axiosNext = axios.create({
      ...createAxiosConfig(),
      withCredentials: true,
    });

    this.axiosExternal = axios.create({
      ...createAxiosConfig(),
      withCredentials: false,
    });

    this.axiosBase.interceptors.request.use(this.handleBaseRequest);
    this.axiosBase.interceptors.response.use(
      (r) => r,
      this.handleResponseError
    );

    this.axiosNext.interceptors.request.use(this.handleBaseRequest);
    this.axiosNext.interceptors.response.use(
      (r) => r,
      this.handleResponseError
    );

    this.axiosExternal.interceptors.request.use(this.handleExternalRequest);
    this.axiosExternal.interceptors.response.use(
      (r) => r,
      this.handleResponseError
    );
  }

  private getCurrentLocale(): string | null {
    if (typeof window === 'undefined') return null;

    const fromPathname = getLocaleFromPathname(window.location.pathname);
    if (fromPathname) return fromPathname;

    const fromHtml = document.documentElement.lang;
    return fromHtml || null;
  }

  private handleBaseRequest = (
    config: InternalAxiosRequestConfig
  ): InternalAxiosRequestConfig => {
    const accessToken = useAuthTokenStore.getState().accessToken;
    if (accessToken) {
      config.headers.set('Authorization', `Bearer ${accessToken}`);
    }

    const url = config.url ?? '';
    if (url.startsWith('/api/')) return config;

    const locale = this.getCurrentLocale();
    if (!locale) return config;

    config.params = withLocaleParam(config.params, locale);

    return config;
  }

  private handleExternalRequest(
    config: InternalAxiosRequestConfig
  ): InternalAxiosRequestConfig {
    if (config.headers) {
      delete config.headers.Authorization;
      delete config.headers.Cookie;
    }
    return config;
  }

  private handleResponseError(error: AxiosError): Promise<never> {
    console.error('[API ERROR]', error);
    return Promise.reject(error);
  }

  private pickInstance(url: string): AxiosInstance {
    if (url.startsWith('/api/')) {
      return this.axiosNext;
    }

    if (isAbsoluteUrl(url)) {
      const host = getHost(url);
      if (!ALLOWED_EXTERNAL_HOSTS.has(host)) {
        throw new Error(
          `[ApiClient] External host "${host}" is not allowlisted`
        );
      }
      return this.axiosExternal;
    }
    return this.axiosBase;
  }

  private async request<TResponse, TBody = unknown>({
    method,
    url,
    body,
    config,
  }: RequestParams<TBody>): Promise<TResponse> {
    const client = this.pickInstance(url);

    const response = await client.request<TResponse>({
      ...config,
      data: body,
      method,
      url,
    });

    return response.data;
  }

  public async get<TResponse>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<TResponse> {
    return safeRequest(
      this.request<TResponse>({ method: 'get', url, config }),
      silentRequestOptions
    );
  }

  public async post<TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: AxiosRequestConfig
  ): Promise<TResponse> {
    return safeRequest(
      this.request<TResponse, TBody>({
        method: 'post',
        url,
        body,
        config,
      }),
      silentRequestOptions
    );
  }

  public async put<TResponse, TBody = unknown>(
    url: string,
    body: TBody,
    config?: AxiosRequestConfig
  ): Promise<TResponse> {
    return safeRequest(
      this.request<TResponse, TBody>({
        method: 'put',
        url,
        body,
        config,
      }),
      silentRequestOptions
    );
  }

  public async patch<TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: AxiosRequestConfig
  ): Promise<TResponse> {
    return safeRequest(
      this.request<TResponse, TBody>({
        method: 'patch',
        url,
        body,
        config,
      }),
      silentRequestOptions
    );
  }

  public async delete<TResponse>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<TResponse> {
    return safeRequest(
      this.request<TResponse>({
        method: 'delete',
        url,
        config,
      }),
      silentRequestOptions
    );
  }

  public async deleteVoid(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<Record<string, never>> {
    return safeVoidRequest(
      this.request<void>({
        method: 'delete',
        url,
        config,
      }),
      silentRequestOptions
    );
  }

  public getRawInstance(): AxiosInstance {
    return this.axiosBase;
  }
}

const apiClient = new ApiClient();
export default apiClient;
