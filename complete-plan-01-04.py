#!/usr/bin/env python3
"""
Plan 01-04: OAuth Integration
Creates OAuth hooks, updates app config, and integrates OAuth buttons.
"""

import os
import json

def create_directories():
    """Ensure required directories exist."""
    os.makedirs('src/hooks', exist_ok=True)
    print("✓ Created src/hooks directory")

def create_oauth_hooks():
    """Create src/hooks/useOAuth.ts with Google and Apple OAuth hooks."""
    content = """import { useEffect } from 'react';
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
"""
    
    with open('src/hooks/useOAuth.ts', 'w') as f:
        f.write(content)
    print("✓ Created src/hooks/useOAuth.ts")

def update_app_json():
    """Update app.json with OAuth configuration."""
    app_json_content = {
        "expo": {
            "name": "Demus",
            "slug": "demus-mobile",
            "scheme": "demus",
            "version": "1.0.0",
            "orientation": "portrait",
            "icon": "./assets/icon.png",
            "userInterfaceStyle": "light",
            "splash": {
                "image": "./assets/splash.png",
                "resizeMode": "contain",
                "backgroundColor": "#ffffff"
            },
            "ios": {
                "bundleIdentifier": "com.demus.music",
                "supportsTablet": True,
                "infoPlist": {
                    "CFBundleURLTypes": [
                        {
                            "CFBundleURLSchemes": ["demus"]
                        }
                    ]
                }
            },
            "android": {
                "package": "com.demus.music",
                "adaptiveIcon": {
                    "foregroundImage": "./assets/adaptive-icon.png",
                    "backgroundColor": "#FFFFFF"
                },
                "intentFilters": [
                    {
                        "action": "VIEW",
                        "data": [
                            {
                                "scheme": "demus"
                            }
                        ],
                        "category": ["BROWSABLE", "DEFAULT"]
                    }
                ]
            },
            "web": {
                "favicon": "./assets/favicon.png"
            }
        }
    }
    
    with open('app.json', 'w') as f:
        json.dump(app_json_content, f, indent=2)
    print("✓ Updated app.json")

def update_env_example():
    """Update .env.example with OAuth configuration."""
    content = """# Backend API
EXPO_PUBLIC_API_URL=https://api.demus.com

# Google OAuth Configuration
# 1. Create OAuth 2.0 Client ID at https://console.cloud.google.com/apis/credentials
# 2. Application type: iOS (for iOS) and Android (for Android)
# 3. Add authorized redirect URIs:
#    - Dev: exp://localhost:19000/--/ (Expo Go)
#    - Prod iOS: demus://
#    - Prod Android: demus://
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here

# Apple Sign-In Configuration
# 1. Register Service ID at https://developer.apple.com/account/resources/identifiers/list/serviceId
# 2. Enable Sign in with Apple capability
# 3. Add redirect URIs:
#    - Prod: demus://
EXPO_PUBLIC_APPLE_CLIENT_ID=your_apple_service_id_here

# Notes:
# - Copy this file to .env and fill in actual values
# - Never commit .env to source control
# - For EAS Build, use `eas secret:push` to set environment variables
"""
    
    with open('.env.example', 'w') as f:
        f.write(content)
    print("✓ Updated .env.example")

def create_oauth_readme():
    """Create README-OAUTH.md with setup instructions."""
    content = """# OAuth Setup Guide

## Google OAuth Setup

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing one
3. Enable Google+ API

### 2. Create OAuth Credentials
1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth 2.0 Client ID**
3. Select **iOS** application type:
   - Bundle ID: `com.demus.music`
   - iOS URL scheme: `demus`
4. Select **Android** application type:
   - Package name: `com.demus.music`
   - SHA-1 certificate fingerprint (get via `expo credentials:manager`)

### 3. Configure Redirect URIs
Add these authorized redirect URIs:
- **Development (Expo Go)**: `exp://localhost:19000/--/`
- **Production**: `demus://`

### 4. Update .env
```
EXPO_PUBLIC_GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
```

---

## Apple Sign-In Setup

### 1. Enable Sign in with Apple
1. Go to [Apple Developer](https://developer.apple.com/account/resources)
2. Select **Certificates, Identifiers & Profiles**
3. Select your App ID (`com.demus.music`)
4. Enable **Sign in with Apple** capability

### 2. Create Service ID
1. Click **Identifiers > +**
2. Select **Services IDs**
3. Register a Service ID (e.g., `com.demus.music.signin`)
4. Enable **Sign in with Apple**
5. Configure:
   - Primary App ID: `com.demus.music`
   - Return URLs: `demus://`

### 3. Update .env
```
EXPO_PUBLIC_APPLE_CLIENT_ID=com.demus.music.signin
```

---

## Testing OAuth Flows

### Development (Expo Go)
```bash
expo start
# Scan QR code with Expo Go app
# Test OAuth on physical device (required - simulators have limitations)
```

### Production Build
```bash
# iOS
eas build --platform ios --profile preview
eas submit --platform ios

# Android
eas build --platform android --profile preview
eas submit --platform android
```

### Common Issues

**"redirect_uri_mismatch" error**
- Verify redirect URI in code matches OAuth app configuration
- Check scheme in app.json matches AuthSession.makeRedirectUri output
- Log `AuthSession.makeRedirectUri({ scheme: 'demus' })` to see actual URI

**OAuth browser doesn't redirect back**
- Ensure WebBrowser.maybeCompleteAuthSession() is called
- Check URL scheme configured in app.json
- Test on physical device (not simulator)

**Android KeyStore error**
- Enable device lock screen on Android emulator
- Settings > Security > Screen Lock
"""
    
    with open('README-OAUTH.md', 'w') as f:
        f.write(content)
    print("✓ Created README-OAUTH.md")

def update_login_screen():
    """Update LoginScreen to add OAuth buttons."""
    content = """import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useGoogleOAuth, useAppleOAuth } from '../../hooks/useOAuth';

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { promptAsync: promptGoogleAsync, ready: googleReady } = useGoogleOAuth();
  const { promptAsync: promptAppleAsync, ready: appleReady } = useAppleOAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>

      <Input
        label="Email"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Input
        label="Password"
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button
        title={loading ? 'Signing in...' : 'Sign In'}
        onPress={handleLogin}
        disabled={loading}
      />

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      <Button
        title="Continue with Google"
        onPress={() => promptGoogleAsync()}
        variant="outline"
        disabled={!googleReady}
        style={styles.oauthButton}
      />

      <Button
        title="Continue with Apple"
        onPress={() => promptAppleAsync()}
        variant="outline"
        disabled={!appleReady}
        style={styles.oauthButton}
      />

      <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
        <Text style={styles.forgotPassword}>Forgot Password?</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.footerLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
    fontSize: 14,
  },
  oauthButton: {
    marginBottom: 12,
  },
  forgotPassword: {
    textAlign: 'center',
    color: '#007AFF',
    marginTop: 16,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  footerLink: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
"""
    
    with open('src/screens/auth/LoginScreen.tsx', 'w') as f:
        f.write(content)
    print("✓ Updated src/screens/auth/LoginScreen.tsx")

def update_register_screen():
    """Update RegisterScreen to add OAuth buttons."""
    content = """import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useGoogleOAuth, useAppleOAuth } from '../../hooks/useOAuth';

export const RegisterScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { promptAsync: promptGoogleAsync, ready: googleReady } = useGoogleOAuth();
  const { promptAsync: promptAppleAsync, ready: appleReady } = useAppleOAuth();

  const handleRegister = async () => {
    if (!email || !password || !displayName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await register(email, password, displayName);
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Unable to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Sign up to get started</Text>

      <Input
        label="Display Name"
        placeholder="Enter your name"
        value={displayName}
        onChangeText={setDisplayName}
      />

      <Input
        label="Email"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Input
        label="Password"
        placeholder="Enter your password (min 8 characters)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button
        title={loading ? 'Creating account...' : 'Sign Up'}
        onPress={handleRegister}
        disabled={loading}
      />

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      <Button
        title="Continue with Google"
        onPress={() => promptGoogleAsync()}
        variant="outline"
        disabled={!googleReady}
        style={styles.oauthButton}
      />

      <Button
        title="Continue with Apple"
        onPress={() => promptAppleAsync()}
        variant="outline"
        disabled={!appleReady}
        style={styles.oauthButton}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.footerLink}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
    fontSize: 14,
  },
  oauthButton: {
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  footerLink: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
"""
    
    with open('src/screens/auth/RegisterScreen.tsx', 'w') as f:
        f.write(content)
    print("✓ Updated src/screens/auth/RegisterScreen.tsx")

def main():
    """Main execution function."""
    print("\n========================================")
    print("Plan 01-04: OAuth Integration")
    print("========================================\n")
    
    try:
        create_directories()
        create_oauth_hooks()
        update_app_json()
        update_env_example()
        create_oauth_readme()
        update_login_screen()
        update_register_screen()
        
        print("\n========================================")
        print("✅ Plan 01-04 Setup Complete!")
        print("========================================\n")
        print("Files created/updated:")
        print("  - src/hooks/useOAuth.ts")
        print("  - app.json")
        print("  - .env.example")
        print("  - README-OAUTH.md")
        print("  - src/screens/auth/LoginScreen.tsx")
        print("  - src/screens/auth/RegisterScreen.tsx")
        print("\n⚠️  CHECKPOINT: OAuth App Setup Required")
        print("\nBefore testing, you must:")
        print("  1. Set up Google OAuth app (see README-OAUTH.md)")
        print("  2. Set up Apple Sign-In (see README-OAUTH.md)")
        print("  3. Copy .env.example to .env and add your client IDs")
        print("\nNext steps:")
        print("  1. Verify: npx tsc --noEmit")
        print("  2. Run tests: npm test")
        print("  3. Read: README-OAUTH.md for setup instructions")
        print("\n========================================\n")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return 1
    
    return 0

if __name__ == '__main__':
    exit(main())
