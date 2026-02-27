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

    const fromStorage = window.localStorage.getItem('bloomify_locale');
    if (fromStorage) return fromStorage;

    const fromHtml = document.documentElement.lang;
    return fromHtml || null;
  }

  private handleBaseRequest = (
    config: InternalAxiosRequestConfig
  ): InternalAxiosRequestConfig => {
    // const token = getAuthTokenSomehow();
    // if (token) config.headers.setAuthorization(`Bearer ${token}`);

    const url = config.url ?? '';
    if (url.startsWith('/api/')) return config;

    const locale = this.getCurrentLocale();
    if (!locale) return config;

    const params = new URLSearchParams(config.params as Record<string, string> | undefined);
    if (!params.has('lang')) {
      params.set('lang', locale);
      config.params = Object.fromEntries(params.entries());
    }

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

  public async get<TResponse>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<TResponse> {
    const client = this.pickInstance(url);
    const response = await client.get<TResponse>(url, config);
    return response.data;
  }

  public async post<TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: AxiosRequestConfig
  ): Promise<TResponse> {
    const client = this.pickInstance(url);
    const response = await client.post<TResponse>(url, body, config);
    return response.data;
  }

  public async put<TResponse, TBody = unknown>(
    url: string,
    body: TBody,
    config?: AxiosRequestConfig
  ): Promise<TResponse> {
    const client = this.pickInstance(url);
    const response = await client.put<TResponse>(url, body, config);
    return response.data;
  }

  public async delete<TResponse>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<TResponse> {
    const client = this.pickInstance(url);
    const response = await client.delete<TResponse>(url, config);
    return response.data;
  }
}

const apiClient = new ApiClient();
export default apiClient;
