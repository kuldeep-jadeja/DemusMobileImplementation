# Java Installation Guide for Android Development

## Issue
You need Java Development Kit (JDK) to build Android apps locally.

## Error
```
ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
```

## Solutions (Choose ONE)

### ✅ Option 1: Install Java Manually (Easiest - Recommended)

1. **Download Java 17 (OpenJDK)**:
   - Go to: https://adoptium.net/temurin/releases/?version=17
   - Select:
     - Operating System: **Windows**
     - Architecture: **x64**
     - Package Type: **JDK**
   - Click: **Download .msi installer**

2. **Install the MSI file**:
   - Run the downloaded `.msi` file
   - ✅ Check "Set JAVA_HOME variable"
   - ✅ Check "Add to PATH"
   - Click through the installation

3. **Verify Installation**:
   - Close and reopen your terminal
   - Run: `java -version`
   - You should see: `openjdk version "17.x.x"`

4. **Set JAVA_HOME** (if not set automatically):
   ```bash
   # In PowerShell
   setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot"
   ```

---

### ✅ Option 2: Install via PowerShell (Admin Required)

1. **Open PowerShell as Administrator**:
   - Press `Win + X`
   - Select "PowerShell (Admin)" or "Terminal (Admin)"

2. **Run this command**:
   ```powershell
   choco install microsoft-openjdk17 -y
   ```

3. **Restart your terminal** and verify:
   ```bash
   java -version
   ```

---

### ✅ Option 3: Install Android Studio (Most Complete)

Android Studio includes Java and all Android build tools:

1. **Download Android Studio**:
   - Go to: https://developer.android.com/studio
   - Download for Windows

2. **Install Android Studio**:
   - Run the installer
   - ✅ Select "Android SDK"
   - ✅ Select "Android SDK Platform"
   - ✅ Select "Android Virtual Device"

3. **Android Studio includes**:
   - ✅ Java JDK (bundled)
   - ✅ Android SDK
   - ✅ Gradle
   - ✅ All build tools
   - ✅ Device emulator

4. **Set Environment Variables** (after installation):
   ```powershell
   # Set JAVA_HOME to Android Studio's JDK
   setx JAVA_HOME "C:\Program Files\Android\Android Studio\jbr"
   
   # Set ANDROID_HOME
   setx ANDROID_HOME "C:\Users\%USERNAME%\AppData\Local\Android\Sdk"
   ```

---

## After Installing Java

### 1. Verify Java Installation
```bash
java -version
```
Expected output:
```
openjdk version "17.x.x"
```

### 2. Check JAVA_HOME
```bash
# In PowerShell
echo $env:JAVA_HOME

# In Git Bash
echo $JAVA_HOME
```

### 3. Try Building Again
```bash
cd android
./gradlew assembleRelease
```

---

## If You Still Get Errors

### Set JAVA_HOME Manually in Git Bash

If Java is installed but JAVA_HOME isn't set, add this to your `~/.bashrc`:

```bash
# Open Git Bash and run:
echo 'export JAVA_HOME="/c/Program Files/Eclipse Adoptium/jdk-17.0.18-hotspot"' >> ~/.bashrc
echo 'export PATH=$JAVA_HOME/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

*(Adjust the path to match your actual Java installation)*

---

## Quick Check: What Do You Have Installed?

Run these commands to see what's already on your system:

```bash
# Check for Java
where java

# Check for Android SDK
echo $ANDROID_HOME

# Check for Gradle (comes with the project)
cd android && ./gradlew --version
```

---

## Recommended Path Forward

**For quickest success**: Install **Option 1 (Manual Download)** or **Option 3 (Android Studio)**

- **Option 1** = Just Java (smallest download, ~200 MB)
- **Option 3** = Complete Android dev environment (largest download, ~3 GB, but most reliable)

Once Java is installed and `java -version` works, you can build the APK!

---

## Alternative: Use EAS Build

If installing Java/Android Studio is too much hassle right now, you can:

1. **Continue testing in Expo Go** (works for most features except audio)
2. **Wait and report the EAS Build issue** to Expo team
3. **Come back to local building** when you have more time

The app works perfectly in Expo Go for UI testing! 🎉
