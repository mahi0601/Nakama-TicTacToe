# Tic-Tac-Toe Server

Server-authoritative multiplayer Tic-Tac-Toe game server.

## Features

- WebSocket-based real-time communication
- Server-authoritative game logic
- Queue-based matchmaking
- Multiple simultaneous games support
- Leaderboard system
- Graceful disconnect handling

## Installation

```bash
npm install
```

## Running Locally

```bash
npm start
```

Server will run on `http://localhost:3000`

## Development

```bash
npm run dev
```

Uses nodemon for auto-restart on file changes.

## API Endpoints

### REST Endpoints

- `GET /` - Server status and stats
- `GET /health` - Health check

### WebSocket Messages

**Client to Server:**

- `JOIN` - Join server with username

  ```json
  { "type": "JOIN", "payload": { "username": "Player1" } }
  ```

- `FIND_MATCH` - Enter matchmaking queue

  ```json
  { "type": "FIND_MATCH", "payload": {} }
  ```

- `MAKE_MOVE` - Make a move in game

  ```json
  { "type": "MAKE_MOVE", "payload": { "gameId": "...", "position": 0 } }
  ```

- `GET_LEADERBOARD` - Request leaderboard

  ```json
  { "type": "GET_LEADERBOARD", "payload": {} }
  ```

- `REMATCH` - Find new match after game ends
  ```json
  { "type": "REMATCH", "payload": {} }
  ```

**Server to Client:**

- `JOINED` - Confirmation of joining
- `MATCHMAKING` - Entered matchmaking queue
- `MATCH_FOUND` - Match found, game starting
- `GAME_UPDATE` - Game state updated
- `OPPONENT_DISCONNECTED` - Opponent left game
- `LEADERBOARD` - Leaderboard data
- `ERROR` - Error message

## Game Rules

- 3x3 Tic-Tac-Toe board
- Player 1 is X, Player 2 is O
- X goes first
- Win: 3 in a row (horizontal, vertical, or diagonal)
- Draw: Board full with no winner
- Disconnect: Opponent wins

## Deployment

See `DEPLOYMENT.md` in root directory for deployment instructions.

## Environment Variables

- `PORT` - Server port (default: 3000)

## Architecture

- In-memory game state storage
- WebSocket for real-time updates
- Server validates all moves
- No client-side game logic trusted
