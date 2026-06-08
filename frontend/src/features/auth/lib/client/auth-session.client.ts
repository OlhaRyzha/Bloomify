import {
  clearAuthSessionCookie,
  setAuthSessionCookie,
} from '../shared/auth-session-cookie';
import { useAuthTokenStore } from '../../store/auth-token.store';

type StartAuthSessionParams = {
  accessToken: string;
};

export const startClientAuthSession = ({
  accessToken,
}: StartAuthSessionParams) => {
  useAuthTokenStore.getState().setAccessToken(accessToken);
  setAuthSessionCookie();
};

export const clearClientAuthSession = () => {
  useAuthTokenStore.getState().clearAccessToken();
  clearAuthSessionCookie();
};
