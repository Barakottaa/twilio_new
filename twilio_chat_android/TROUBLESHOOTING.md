# Troubleshooting Guide - Current Issues Fixed

## ✅ Issue 1: NDK Error - FIXED

**Problem**: NDK at `C:\Users\Administrator\AppData\Local\Android\Sdk\ndk\25.1.8937393` was incomplete (missing `source.properties`).

**Solution Applied**: Commented out NDK requirement in `android/app/build.gradle`. The app can build without NDK for basic React Native functionality.

**If you need NDK later** (for advanced native modules):
1. Open Android Studio
2. Go to **Tools > SDK Manager**
3. Click **SDK Tools** tab
4. Check **NDK (Side by side)** and select version **25.1.8937393**
5. Click **Apply** to install
6. Uncomment the `ndkVersion` line in `android/app/build.gradle`

---

## ⚠️ Issue 2: ADB Not Found - NEEDS FIXING

**Problem**: `adb` command not recognized - Android SDK platform-tools not in PATH.

**Solution**:

### Option A: Add to PATH (Recommended)
1. Open **System Properties**:
   - Press `Win + R`, type `sysdm.cpl`, press Enter
   - Or: Right-click "This PC" > Properties > Advanced system settings

2. Click **Environment Variables**

3. Under **User variables**, find **Path** and click **Edit**

4. Click **New** and add:
   ```
   C:\Users\Administrator\AppData\Local\Android\Sdk\platform-tools
   ```

5. Click **OK** on all dialogs

6. **Restart your terminal/PowerShell** for changes to take effect

7. Verify:
   ```powershell
   adb version
   ```

### Option B: Use Full Path (Temporary)
You can use the full path when needed:
```powershell
C:\Users\Administrator\AppData\Local\Android\Sdk\platform-tools\adb.exe devices
```

---

## ⚠️ Issue 3: No Emulator Found - NEEDS SETUP

**Problem**: No Android Virtual Devices (AVDs) configured.

**Solution**:

1. **Open Android Studio**

2. **Open Device Manager**:
   - Tools → Device Manager
   - Or click the Device Manager icon in the toolbar

3. **Create Virtual Device**:
   - Click **"Create Device"** button
   - Select a device (e.g., **Pixel 5** or **Pixel 6**)
   - Click **Next**

4. **Select System Image**:
   - Choose **API Level 33** (Android 13) or **API Level 34** (Android 14)
   - If not installed, click **Download** next to the system image
   - Wait for download to complete
   - Click **Next**

5. **Configure AVD**:
   - Name: `Pixel_5_API_33` (or your preferred name)
   - Verify settings
   - Click **Finish**

6. **Start Emulator**:
   - In Device Manager, click the ▶️ **Play** button next to your AVD
   - Wait for emulator to boot (2-3 minutes first time)

7. **Verify**:
   ```powershell
   adb devices
   # Should show your emulator
   ```

---

## 🚀 Quick Fix Steps Summary

1. ✅ **NDK Issue** - Already fixed (commented out)

2. **Fix ADB** (Choose one):
   - Add platform-tools to PATH (see above)
   - OR use full path when needed

3. **Create Emulator**:
   - Open Android Studio
   - Tools → Device Manager → Create Device
   - Select Pixel 5, API 33/34
   - Start emulator

4. **Test Build**:
   ```powershell
   cd twilio_chat_android
   npm start
   # In another terminal:
   npm run android
   ```

---

## 🔍 Verify Everything Works

Run these commands in PowerShell:

```powershell
# 1. Check ADB (after adding to PATH)
adb version
# Should show version number

# 2. Check connected devices/emulators
adb devices
# Should show your emulator if running

# 3. Check Android SDK
echo $env:ANDROID_HOME
# Should show: C:\Users\Administrator\AppData\Local\Android\Sdk

# 4. Check React Native setup
cd twilio_chat_android
npx react-native doctor
```

---

## 📝 Next Steps After Fixes

1. **Start Metro Bundler**:
   ```powershell
   cd twilio_chat_android
   npm start
   ```

2. **Start Emulator** (from Android Studio Device Manager)

3. **Run App**:
   ```powershell
   # In another terminal
   cd twilio_chat_android
   npm run android
   ```

4. **Or Build from Android Studio**:
   - Open `twilio_chat_android/android` in Android Studio
   - Wait for Gradle sync
   - Click Run button (▶️)

---

## 🐛 If Build Still Fails

### Clean Build:
```powershell
cd twilio_chat_android/android
.\gradlew clean
cd ..
npm start
# In another terminal:
npm run android
```

### Check Gradle Sync:
- Open `android` folder in Android Studio
- File → Sync Project with Gradle Files
- Check for any errors in Build output

### Invalidate Caches:
- Android Studio: File → Invalidate Caches / Restart
- Select "Invalidate and Restart"

---

## 📞 Common Commands

```powershell
# List connected devices
adb devices

# Restart ADB
adb kill-server
adb start-server

# View logs
adb logcat

# Install APK manually
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Uninstall app
adb uninstall com.twiliochatapp
```

---

**Last Updated**: Current session
**Status**: NDK fixed, ADB and Emulator need setup

