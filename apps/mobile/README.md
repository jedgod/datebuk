# DateBuk Mobile App

React Native mobile application for DateBuk dating platform.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Expo Go app on your phone (download from App Store/Play Store)
- Or iOS Simulator / Android Emulator

### Installation

1. Install dependencies:

```bash
cd apps/mobile
npm install
```

2. Start the development server:

```bash
npx expo start
```

3. Run on your device:
   - **Scan QR code** with Expo Go app (iOS: Camera app, Android: Expo Go)
   - **Press `i`** for iOS Simulator
   - **Press `a`** for Android Emulator
   - **Press `w`** for Web browser

## 📱 Features

- **Beautiful Landing Screen** with gradient background (pink → purple → indigo)
- **Authentication Flow** (Sign Up / Sign In)
- **Profile Management**
- **Swipe Cards** for matching
- **Real-time Messaging**
- **Video Calls**
- **Push Notifications**

## 🛠️ Tech Stack

- **React Native**: v0.81.5
- **Expo**: v54.0.33
- **React Navigation**: Stack navigation
- **Axios**: API communication
- **TypeScript**: Type safety

## 🔗 API Configuration

The app connects to the DateBuk API at `http://localhost:4000` (configured in `app.json`).

To change the API URL, update the `extra.apiUrl` field in [app.json](app.json).

## 📂 Project Structure

```
apps/mobile/
├── App.tsx              # Main app entry (landing screen)
├── app.json             # Expo configuration
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
└── assets/              # Images, fonts, icons
```

## 🎨 Branding

- **Primary Color**: Pink (#EC4899)
- **Secondary Color**: Purple (#8B5CF6)
- **Accent Color**: Indigo (#6366F1)
- **App Name**: DateBuk
- **Tagline**: "Find Your Perfect Match"

## 🔧 Development Commands

```bash
# Start development server
npx expo start

# Start with cleared cache
npx expo start --clear

# Build for iOS
npx expo build:ios

# Build for Android
npx expo build:android

# Install new dependency
npm install <package-name>
```

## 📝 Next Steps

1. ✅ Landing screen created
2. ⏳ Add authentication screens (Login, SignUp)
3. ⏳ Connect to API endpoints
4. ⏳ Implement profile screens
5. ⏳ Add swipe card interface
6. ⏳ Integrate WebSocket for real-time chat
7. ⏳ Add push notifications

## 🐛 Troubleshooting

**Issue: "expo is not recognized"**

- Solution: Use `npx expo start` instead of `expo start`

**Issue: Can't connect to API**

- Make sure the API is running on port 4000: `pnpm --filter api dev`
- Check `extra.apiUrl` in [app.json](app.json)

**Issue: Dependencies not installing**

- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`

## 📄 License

Part of the DateBuk monorepo project.
