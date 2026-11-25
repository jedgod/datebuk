# DateBuk Mobile - Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies (if not already done)
```bash
cd apps/mobile
npm install
```

### 2. Start the Development Server
```bash
npx expo start
```

### 3. Open on Your Device
- **Phone:** Install Expo Go app, scan QR code
- **iOS Simulator:** Press `i` in terminal
- **Android Emulator:** Press `a` in terminal

## 📱 Test the Features

### Authentication
1. Open the app → See Welcome screen
2. Tap "Create Account"
3. Fill in: Name, Email, Password
4. Sign up successfully
5. You're in! 🎉

### Swipe to Match
1. Navigate to 🔥 Swipe tab
2. View profile cards
3. Tap ❤️ to like, ✕ to pass, ★ for superlike
4. Get match notification when mutual like!

### Chat with Matches
1. Navigate to 💬 Matches tab
2. See all your matches
3. Tap on a match to open chat
4. Send real-time messages!

### Manage Profile
1. Navigate to 👤 Profile tab
2. View your profile info
3. Tap "Edit Profile"
4. Update your details
5. Save changes

## ⚙️ Configuration

### API Connection
The app connects to `http://localhost:4000` by default.

**To change API URL:**
1. Open [app.json](app.json)
2. Find `extra.apiUrl`
3. Update to your API URL
4. Restart Expo: `npx expo start --clear`

**For testing on physical device:**
1. Find your computer's IP address:
   - Windows: `ipconfig` → look for IPv4
   - Mac/Linux: `ifconfig` → look for inet
2. Update API URL to: `http://<YOUR_IP>:4000`
3. Make sure phone and computer are on same WiFi

**For Android Emulator:**
- Use `http://10.0.2.2:4000` instead of `localhost:4000`

## 🔍 Troubleshooting

**App won't start?**
```bash
# Clear cache and restart
npx expo start --clear

# Or reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Can't connect to API?**
1. Make sure API is running: `pnpm --filter api dev`
2. Check API URL in [app.json](app.json)
3. Ensure port 4000 is accessible

**WebSocket not connecting?**
1. Check API WebSocket endpoint is enabled
2. Verify JWT token is valid
3. Look for connection errors in console

## 📚 Key Files

- [App.tsx](App.tsx) - Main app entry, navigation setup
- [app.json](app.json) - Expo config, API URL setting
- [FEATURES.md](FEATURES.md) - Complete feature documentation
- [src/screens/](src/screens/) - All app screens
- [src/services/](src/services/) - API and WebSocket services
- [src/components/](src/components/) - Reusable UI components

## 🎯 What's Included

✅ Authentication (Login/SignUp)  
✅ Profile Management  
✅ Swipe Card Interface  
✅ Real-time Messaging  
✅ WebSocket Integration  
✅ Match Detection  
✅ Beautiful UI with DateBuk Branding  

## 🎨 Tech Stack

- **React Native** - Mobile framework
- **Expo** - Development platform
- **React Navigation** - Screen navigation
- **Axios** - HTTP requests
- **WebSocket** - Real-time communication
- **AsyncStorage** - Local data persistence
- **TypeScript** - Type safety

## 💻 Development Commands

```bash
# Start development server
npx expo start

# Start with cache cleared
npx expo start --clear

# iOS Simulator
npx expo start --ios

# Android Emulator
npx expo start --android

# Web browser
npx expo start --web

# Install new package
npm install <package-name>
```

## 🔗 Important Links

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Complete Feature Guide](FEATURES.md)

---

**Need Help?** Check [FEATURES.md](FEATURES.md) for detailed documentation!

**Ready to go?** Run `npx expo start` and start swiping! 🔥
