# Multiplayer Tic-Tac-Toe Game

A simple, deployable multiplayer Tic-Tac-Toe mobile game with server-authoritative gameplay.

## Features

- ✅ Server-authoritative multiplayer game logic
- ✅ Queue-based matchmaking system
- ✅ Real-time gameplay via WebSocket
- ✅ Leaderboard tracking
- ✅ Multiple simultaneous games support
- ✅ Beautiful, modern UI

## Tech Stack

**Mobile App:**

- React Native with Expo
- TypeScript
- WebSocket for real-time communication

**Server:**

- Node.js with Express
- WebSocket (ws library)
- In-memory game state (easily replaceable with Redis/DB)

## Quick Start

### Server Setup

```bash
cd server
npm install
npm start
```

Server runs on http://localhost:3000

### Mobile App Setup

```bash
cd mobile
npm install
npm start
```

## Deployment

### Server Deployment (Railway/Render/Heroku)

1. Push code to GitHub
2. Connect to Railway/Render
3. Set environment variables:
   - `PORT` (optional, defaults to 3000)
4. Deploy!

### Mobile Deployment

1. Build APK: `cd mobile && npm run build:android`
2. Build iOS: `cd mobile && npm run build:ios`

## How to Play

1. Open the app
2. Enter your username
3. Click "Find Match" to join matchmaking queue
4. Play against matched opponent
5. Check leaderboard to see rankings

## Architecture

- **Server-authoritative**: All game logic runs on server
- **WebSocket**: Real-time bidirectional communication
- **Queue-based matchmaking**: Players added to queue, matched with first available opponent
- **Stateful sessions**: Server tracks all active games and player states
