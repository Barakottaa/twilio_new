# How to Test on Your Physical Phone 📱

Yes! You can absolutely use your phone to test the app. It's often better than an emulator.

## ✅ Prerequisites

1. **USB Debugging Enabled**: You said you have this connected, but just in case:
   - Settings > Developer Options > USB Debugging (ON)
2. **USB Connection**: Phone plugged into computer.
3. **Same Wi-Fi**: **Crucial!** Your phone and computer must be on the **same Wi-Fi network** because the app connects to your computer's API server.

## 🚀 Step-by-Step Guide

### 1. Verify Connection
Open your terminal (PowerShell) and run:
```powershell
adb devices
```
- You should see your device ID (e.g., `8AS7D87ASD device`).
- If it says `unauthorized`, check your phone screen and tap "Allow".

### 2. Check Your API Configuration
The app needs to know where your backend server is running.
Open `src/config/api.ts` and check this line:

```typescript
export const API_BASE_URL = __DEV__
  ? 'http://192.168.1.94:3000' // <--- THIS MUST BE YOUR COMPUTER'S CURRENT IP
  : '...';
```

**To find your current IP:**
1. Open PowerShell.
2. Run `ipconfig`.
3. Look for **IPv4 Address** (usually under "Wireless LAN adapter Wi-Fi").
4. If it's different from `192.168.1.94`, update the file!

### 3. Run the App
You need two terminals open:

**Terminal 1 (Metro Bundler):**
```powershell
npm start
```

**Terminal 2 (Install App):**
```powershell
npm run android
```
*React Native will detect your phone and install the app.*

### 4. Troubleshooting
- **White Screen / Can't Connect to Metro?**
  - Shake phone > "Reload".
  - Ensure both devices are on the same Wi-Fi.
- **API Errors?**
  - Check the IP address in `src/config/api.ts` again.
  - Ensure your backend server is running (`node server.js` or similar in your backend project).

---
**Enjoy testing on your real device!** 🚀
