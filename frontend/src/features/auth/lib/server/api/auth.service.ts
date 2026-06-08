import { API_ROUTES } from '@/constants/api.constant';
import apiClient from '@/services/api/clients/api-client';
import { parseResponseWithSchema } from '@/services/api/request/safe-fetch';
import type { LoginValues, RegisterValues } from '../../../forms/auth.schemas';
import {
  authTokenResponseSchema,
  type AuthTokenResponse,
  currentUserSchema,
  type CurrentUser,
} from './auth.schemas';

type SignUpPayload = Omit<RegisterValues, 'confirmPassword'>;

type Auth0Payload = {
  accessToken: string;
  idToken: string;
};

const AuthService = {
  signIn: async (payload: LoginValues): Promise<AuthTokenResponse> => {
    const response = await apiClient.post<unknown, LoginValues>(
      API_ROUTES.AUTH_SIGN_IN,
      payload
    );

    return parseResponseWithSchema(
      response,
      authTokenResponseSchema
    ) as AuthTokenResponse;
  },

  signUp: async (payload: SignUpPayload): Promise<AuthTokenResponse> => {
    const response = await apiClient.post<unknown, SignUpPayload>(
      API_ROUTES.AUTH_SIGN_UP,
      payload
    );

    return parseResponseWithSchema(
      response,
      authTokenResponseSchema
    ) as AuthTokenResponse;
  },

  refreshSession: async (): Promise<AuthTokenResponse> => {
    const response = await apiClient.post<unknown>(
      API_ROUTES.AUTH_REFRESH_TOKEN
    );

    return parseResponseWithSchema(
      response,
      authTokenResponseSchema
    ) as AuthTokenResponse;
  },

  signOut: async (): Promise<void> => {
    await apiClient.post(API_ROUTES.AUTH_SIGN_OUT);
  },

  getCurrentUser: async (): Promise<CurrentUser> => {
    const response = await apiClient.get<unknown>(API_ROUTES.AUTH_ME);

    return parseResponseWithSchema(response, currentUserSchema) as CurrentUser;
  },

  signInWithAuth0: async (
    payload: Auth0Payload
  ): Promise<AuthTokenResponse> => {
    const response = await apiClient.post<unknown, Auth0Payload>(
      API_ROUTES.AUTH_AUTH0,
      payload
    );

    return parseResponseWithSchema(
      response,
      authTokenResponseSchema
    ) as AuthTokenResponse;
  },
};

export default AuthService;
