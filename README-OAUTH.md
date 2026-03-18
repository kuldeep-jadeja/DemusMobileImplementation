# OAuth Setup Guide

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
