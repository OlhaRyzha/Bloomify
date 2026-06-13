import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import { API_ROUTES } from '@/constants/api.constant';
import { ALLOWED_EXTERNAL_HOSTS } from '@/constants/network.constants';
import { createAxiosConfig } from './axios.config';
import { BASE_URL, SITE_URL } from '@/components/config/env';
import { isAbsoluteUrl } from '@/utils/guards/is-absolute-url';
import { getHost } from '@/utils/url/get-host';
import {
  safeRequest,
  safeVoidRequest,
} from '@/services/api/request/safe-request';
import type { SafeRequestOptions } from '@/services/api/request/safe-request';
import { parseResponseWithSchema } from '@/services/api/request/safe-fetch';
import { getLocaleFromPathname } from '@/i18n/routing';
import { isObject } from '@/utils/guards/is-object';
import {
  clearClientAuthSession,
  startClientAuthSession,
} from '@/features/auth/lib/client/auth-session.client';
import {
  authTokenResponseSchema,
  type AuthTokenResponse,
} from '@/features/auth/lib/server/api/auth.schemas';
import { useAuthTokenStore } from '@/features/auth/store/auth-token.store';
import { isWindowUndefined } from '@/utils/guards/is-window-undefined';
import { isProduction } from '@/utils/guards/is-production';

type RequestMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

type AuthRetryRequestConfig = InternalAxiosRequestConfig & {
  _authRetry?: boolean;
  _skipAuthRefresh?: boolean;
  _skipErrorLog?: boolean;
};

type RequestParams<TBody = unknown> = {
  method: RequestMethod;
  url: string;
  body?: TBody;
  config?: AxiosRequestConfig;
};

const silentRequestOptions: SafeRequestOptions = {
  showErrorToast: false,
};

const SERVER_LOCAL_BASE_URL = 'http://127.0.0.1:8000';
const ABSOLUTE_API_BASE_URL_PATTERN = /^https?:\/\//i;

const hasBrowserWindow = () =>
  typeof globalThis === 'object' && 'window' in globalThis;

const getApiBaseUrl = () => {
  const baseUrl: string = BASE_URL;

  if (ABSOLUTE_API_BASE_URL_PATTERN.test(baseUrl) || hasBrowserWindow()) {
    return baseUrl;
  }

  if (!baseUrl.startsWith('/')) {
    return baseUrl;
  }

  const siteUrl = SITE_URL.trim().replace(/\/$/, '');
  if (siteUrl) {
    return `${siteUrl}${baseUrl}`;
  }

  if (isProduction) {
    return baseUrl;
  }

  return SERVER_LOCAL_BASE_URL;
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

const authSessionRoutes = new Set([
  API_ROUTES.AUTH_SIGN_IN,
  API_ROUTES.AUTH_SIGN_UP,
  API_ROUTES.AUTH_REFRESH_TOKEN,
  API_ROUTES.AUTH_SIGN_OUT,
]);

const normalizeApiPath = (url: string) => {
  const withoutQuery = url.split('?')[0] ?? '';
  return withoutQuery.replace(/^\/+/, '');
};

const isAuthSessionRoute = (url: string) => {
  if (isAbsoluteUrl(url)) {
    try {
      return authSessionRoutes.has(normalizeApiPath(new URL(url).pathname));
    } catch {
      return false;
    }
  }

  return authSessionRoutes.has(normalizeApiPath(url));
};

export class ApiClient {
  private axiosBase: AxiosInstance;
  private axiosExternal: AxiosInstance;
  private axiosNext: AxiosInstance;
  private refreshAccessTokenPromise: Promise<string | null> | null = null;

  constructor() {
    this.axiosBase = axios.create({
      ...createAxiosConfig(),
      baseURL: getApiBaseUrl(),
      withCredentials: true,
    });

    this.axiosNext = axios.create({
      ...createAxiosConfig(),
      baseURL: isWindowUndefined() ? getApiBaseUrl() : undefined,
      withCredentials: true,
    });

    this.axiosExternal = axios.create({
      ...createAxiosConfig(),
      withCredentials: false,
    });

    this.axiosBase.interceptors.request.use(this.handleBaseRequest);
    this.axiosBase.interceptors.response.use(
      (r) => r,
      this.handleAuthResponseError(this.axiosBase)
    );

    this.axiosNext.interceptors.request.use(this.handleBaseRequest);
    this.axiosNext.interceptors.response.use(
      (r) => r,
      this.handleAuthResponseError(this.axiosNext)
    );

    this.axiosExternal.interceptors.request.use(this.handleExternalRequest);
    this.axiosExternal.interceptors.response.use(
      (r) => r,
      this.handleResponseError
    );
  }

  private getCurrentLocale(): string | null {
    if (isWindowUndefined()) return null;

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
  };

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
    const config = error.config as AuthRetryRequestConfig | undefined;
    if (!config?._skipErrorLog) {
      console.error('[API ERROR]', error);
    }

    return Promise.reject(error);
  }

  private handleAuthResponseError =
    (client: AxiosInstance) =>
    async (error: AxiosError): Promise<unknown> => {
      const config = error.config as AuthRetryRequestConfig | undefined;

      if (!this.shouldRefreshAccessToken(error, config)) {
        return this.handleResponseError(error);
      }

      const accessToken = await this.refreshAccessToken();

      if (!accessToken) {
        return Promise.reject(error);
      }

      if (!config) {
        return this.handleResponseError(error);
      }

      config._authRetry = true;
      config.headers.set('Authorization', `Bearer ${accessToken}`);

      return client.request(config);
    };

  private shouldRefreshAccessToken(
    error: AxiosError,
    config?: AuthRetryRequestConfig
  ) {
    if (error.response?.status !== 401) return false;
    if (!config || config._authRetry || config._skipAuthRefresh) return false;

    const url = config.url ?? '';
    if (isAuthSessionRoute(url)) return false;

    return true;
  }

  private async refreshAccessToken(): Promise<string | null> {
    this.refreshAccessTokenPromise ??= this.requestFreshAccessToken();

    try {
      return await this.refreshAccessTokenPromise;
    } finally {
      this.refreshAccessTokenPromise = null;
    }
  }

  private async requestFreshAccessToken(): Promise<string | null> {
    try {
      const response = await this.axiosBase.request<unknown>({
        method: 'post',
        url: API_ROUTES.AUTH_REFRESH_TOKEN,
        _skipAuthRefresh: true,
        _skipErrorLog: true,
      } as AuthRetryRequestConfig);

      const { accessToken } = parseResponseWithSchema(
        response.data,
        authTokenResponseSchema
      ) as AuthTokenResponse;

      if (typeof document !== 'undefined') {
        startClientAuthSession({ accessToken });
      } else {
        useAuthTokenStore.getState().setAccessToken(accessToken);
      }

      return accessToken;
    } catch {
      if (typeof document !== 'undefined') {
        clearClientAuthSession();
      } else {
        useAuthTokenStore.getState().clearAccessToken();
      }

      return null;
    }
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
