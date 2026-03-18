# Development Build Setup Guide

## What Changed

We've switched from **Expo Go** to **Development Builds** to resolve SDK version compatibility issues and gain more control over the app.

## Benefits of Development Builds
- ✓ No SDK version constraints
- ✓ Use any native modules
- ✓ Custom native code support
- ✓ Production-ready workflow

## Setup Instructions

### Step 1: Login to Expo Account
```bash
eas login
```
If you don't have an Expo account, create one at https://expo.dev/signup

### Step 2: Configure Project
```bash
eas build:configure
```
This will link your project to your Expo account.

### Step 3: Build Development Client

#### For iOS Simulator:
```bash
eas build --profile development --platform ios
```

#### For Android Device/Emulator:
```bash
eas build --profile development --platform android
```

The build will happen on Expo's servers and provide you with a download link.

### Step 4: Install the Build

#### iOS:
- Download the .app file from the build link
- Drag and drop it into your iOS Simulator

#### Android:
- Download the .apk file from the build link
- Install it on your device: `adb install path/to/app.apk`

### Step 5: Start Development Server
```bash
npm run dev
```
or
```bash
expo start --dev-client
```

Then scan the QR code with your custom development build app (not Expo Go).

## Local Development (Faster)

For faster iteration during development, you can build locally:

### iOS (requires macOS with Xcode):
```bash
npx expo run:ios
```

### Android (requires Android SDK):
```bash
npx expo run:android
```

These commands build and run the app locally, which is much faster than cloud builds.

## What's Installed
- ✓ `expo-dev-client` - Development client package
- ✓ `eas.json` - Build configuration
- ✓ `app.json` updated with dev-client plugin

## Next Steps
1. Run `eas login` to authenticate
2. Run `eas build:configure` to set up your project
3. Build for your target platform(s)
4. Install the build on your device/simulator
5. Use `npm run dev` to start development

## Quick Start (Local Build - Recommended)
If you have the required development tools installed:

```bash
# iOS (macOS only)
npx expo run:ios

# Android
npx expo run:android
```

This builds locally and is much faster than waiting for cloud builds.
