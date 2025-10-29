# Tic-Tac-Toe Mobile App

React Native mobile app for multiplayer Tic-Tac-Toe.

## Features

- Beautiful, modern UI with gradient backgrounds
- Real-time multiplayer gameplay
- Matchmaking system
- Leaderboard
- Cross-platform (iOS & Android)

## Installation

```bash
npm install
```

## Configuration

Before running, update the server URL in `App.tsx`:

```typescript
const SERVER_URL = "ws://YOUR_SERVER_URL";
```

For local development:

- Find your computer's IP address
- Use `ws://YOUR_IP:3000` (e.g., `ws://192.168.1.100:3000`)

For production:

- Use your deployed server URL
- Use `wss://` for HTTPS servers

## Running

Start the development server:

```bash
npm start
```

Run on specific platform:

```bash
npm run android  # Android
npm run ios      # iOS (Mac only)
npm run web      # Web browser
```

## Testing Locally

1. Make sure your phone and computer are on the same WiFi network
2. Start the server on your computer
3. Update `SERVER_URL` in `App.tsx` with your computer's IP
4. Run `npm start`
5. Install Expo Go on your phone
6. Scan the QR code

## Building for Production

### Prerequisites

```bash
npm install -g eas-cli
eas login
```

### Build APK (Android)

```bash
eas build:configure
eas build --platform android --profile preview
```

### Build for iOS

```bash
eas build --platform ios --profile preview
```

## Screens

1. **Login** - Enter username
2. **Menu** - Find match or view leaderboard
3. **Game** - Play Tic-Tac-Toe
4. **Leaderboard** - View player rankings

## Tech Stack

- React Native
- Expo
- TypeScript
- WebSocket
- Linear Gradient

## Assets

The app uses Expo's default assets. For custom assets:

- Replace `assets/icon.png` - App icon
- Replace `assets/splash.png` - Splash screen
- Replace `assets/adaptive-icon.png` - Android adaptive icon
