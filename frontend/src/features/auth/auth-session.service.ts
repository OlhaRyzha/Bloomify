import AuthService from './api/auth.service';
import type { LoginValues, RegisterValues } from './forms/auth.schemas';
import {
  clearClientAuthSession,
  startClientAuthSession,
} from './auth-session.client';

type SignUpPayload = Omit<RegisterValues, 'confirmPassword'>;

const AuthSessionService = {
  signIn: async (payload: LoginValues) => {
    const session = await AuthService.signIn(payload);

    startClientAuthSession({ accessToken: session.accessToken });

    return session;
  },

  signUp: async (payload: SignUpPayload) => {
    const session = await AuthService.signUp(payload);

    startClientAuthSession({ accessToken: session.accessToken });

    return session;
  },

  refresh: async () => {
    const session = await AuthService.refreshSession();

    startClientAuthSession({ accessToken: session.accessToken });

    return session;
  },

  signInWithAuth0: async (accessToken: string, idToken: string) => {
    const session = await AuthService.signInWithAuth0({ accessToken, idToken });

    startClientAuthSession({ accessToken: session.accessToken });

    return session;
  },

  signOut: async () => {
    try {
      await AuthService.signOut();
    } finally {
      clearClientAuthSession();
    }
  },
};

export default AuthSessionService;
