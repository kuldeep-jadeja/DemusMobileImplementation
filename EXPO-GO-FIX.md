# Expo Go SDK Fix - Quick Solutions

## Current Situation
- **Project SDK**: Expo 51 (React Native 0.74.5)
- **Expo CLI**: 0.18.31
- **Issue**: Expo Go on your devices may not support SDK 51

## ✅ Solution 1: Update Expo Go App (Recommended - 2 minutes)

### iOS:
1. Open the App Store
2. Search for "Expo Go"
3. Update to the latest version (should support SDK 51)

### Android:
1. Open Google Play Store  
2. Search for "Expo Go"
3. Update to the latest version (should support SDK 51)

**After updating, try connecting again:**
```bash
npm start
```
Then scan the QR code with the updated Expo Go app.

---

## ✅ Solution 2: Downgrade Project to SDK 50 (5 minutes)

If updating Expo Go doesn't work, downgrade the project to SDK 50:

### Step 1: Install SDK 50 dependencies
```bash
npm install expo@~50.0.28 react-native@0.73.6
npm install -D jest-expo@~50.0.4
```

### Step 2: Update native modules
```bash
npx expo install --fix
```

### Step 3: Clear cache and restart
```bash
npm start -- --clear
```

---

## 🔍 Check Expo Go Version

To verify which SDK version your Expo Go supports:

1. Open Expo Go on your device
2. Tap the **profile/settings icon**
3. Look for "About" or "Version"
4. Note the version number

**Expo Go Version → SDK Support:**
- 2.30.x → SDK 50
- 2.31.x → SDK 51
- 2.32.x → SDK 52

---

## ⚡ Quick Test

After updating Expo Go or downgrading the project:

```bash
# Clear everything
npm start -- --clear

# Or with reset cache
npx expo start -c
```

Then scan the QR code with Expo Go.

---

## 📝 Current Project State

- ✓ expo-dev-client installed (for future development builds)
- ✓ eas.json configured (for cloud builds)
- ✓ DEV-BUILD-SETUP.md available (for later)

You can revert these changes if you want to stay with Expo Go only:
```bash
npm uninstall expo-dev-client
```
