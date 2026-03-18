import { useEffect } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { authService } from '../services/authService';

// Required for web browser to close after redirect
WebBrowser.maybeCompleteAuthSession();

export const useGoogleOAuth = () => {
  const discovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
  };

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
      scopes: ['profile', 'email'],
      redirectUri: AuthSession.makeRedirectUri({ scheme: 'demus' }),
      usePKCE: true, // Critical for security
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      authService.loginWithGoogle(code).catch((error) => {
        console.error('Google OAuth error:', error);
      });
    }
  }, [response]);

  return { promptAsync, loading: !request, ready: !!request };
};

export const useAppleOAuth = () => {
  const discovery = {
    authorizationEndpoint: 'https://appleid.apple.com/auth/authorize',
    tokenEndpoint: 'https://appleid.apple.com/auth/token',
  };

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_APPLE_CLIENT_ID || '',
      scopes: ['email', 'name'],
      redirectUri: AuthSession.makeRedirectUri({ scheme: 'demus' }),
      usePKCE: true,
      responseType: AuthSession.ResponseType.Code,
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const { code, id_token } = response.params;
      authService.loginWithApple(code, id_token || '').catch((error) => {
        console.error('Apple OAuth error:', error);
      });
    }
  }, [response]);

  return { promptAsync, loading: !request, ready: !!request };
};
