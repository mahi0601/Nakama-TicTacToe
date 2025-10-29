const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Game state
const games = new Map(); // gameId -> game object
const players = new Map(); // playerId -> player object
const matchmakingQueue = [];
const leaderboard = new Map(); // playerId -> { username, wins, losses, draws }

// WebSocket connection handler
wss.on("connection", (ws) => {
  console.log("New client connected");

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      handleMessage(ws, data);
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  });

  ws.on("close", () => {
    handleDisconnect(ws);
  });
});

function handleMessage(ws, data) {
  const { type, payload } = data;

  switch (type) {
    case "JOIN":
      handleJoin(ws, payload);
      break;
    case "FIND_MATCH":
      handleFindMatch(ws, payload);
      break;
    case "MAKE_MOVE":
      handleMove(ws, payload);
      break;
    case "GET_LEADERBOARD":
      handleGetLeaderboard(ws);
      break;
    case "REMATCH":
      handleRematch(ws, payload);
      break;
    default:
      console.log("Unknown message type:", type);
  }
}

function handleJoin(ws, payload) {
  const { username } = payload;
  const playerId = uuidv4();

  const player = {
    id: playerId,
    username,
    ws,
    gameId: null,
  };

  players.set(playerId, player);
  ws.playerId = playerId;

  // Initialize leaderboard entry if new player
  if (!leaderboard.has(playerId)) {
    leaderboard.set(playerId, {
      id: playerId,
      username,
      wins: 0,
      losses: 0,
      draws: 0,
    });
  }

  sendToClient(ws, "JOINED", { playerId, username });
  console.log(`Player ${username} joined with ID ${playerId}`);
}

function handleFindMatch(ws, payload) {
  const player = players.get(ws.playerId);
  if (!player) return;

  // Check if already in queue
  if (matchmakingQueue.includes(player.id)) {
    return;
  }

  // Add to queue
  matchmakingQueue.push(player.id);
  sendToClient(ws, "MATCHMAKING", { status: "searching" });
  console.log(`Player ${player.username} added to matchmaking queue`);

  // Try to match
  tryMatchmaking();
}

function tryMatchmaking() {
  while (matchmakingQueue.length >= 2) {
    const player1Id = matchmakingQueue.shift();
    const player2Id = matchmakingQueue.shift();

    const player1 = players.get(player1Id);
    const player2 = players.get(player2Id);

    if (!player1 || !player2) continue;

    // Create game
    const gameId = uuidv4();
    const game = {
      id: gameId,
      player1: player1Id,
      player2: player2Id,
      board: Array(9).fill(null),
      currentTurn: player1Id,
      status: "playing", // playing, finished
      winner: null,
      createdAt: Date.now(),
    };

    games.set(gameId, game);
    player1.gameId = gameId;
    player2.gameId = gameId;

    // Notify both players
    sendToClient(player1.ws, "MATCH_FOUND", {
      gameId,
      opponent: player2.username,
      symbol: "X",
      yourTurn: true,
    });

    sendToClient(player2.ws, "MATCH_FOUND", {
      gameId,
      opponent: player1.username,
      symbol: "O",
      yourTurn: false,
    });

    console.log(`Match created: ${player1.username} vs ${player2.username}`);
  }
}

function handleMove(ws, payload) {
  const { gameId, position } = payload;
  const player = players.get(ws.playerId);
  if (!player) return;

  const game = games.get(gameId);
  if (!game) {
    sendToClient(ws, "ERROR", { message: "Game not found" });
    return;
  }

  // Validate move
  if (game.status !== "playing") {
    sendToClient(ws, "ERROR", { message: "Game is finished" });
    return;
  }

  if (game.currentTurn !== player.id) {
    sendToClient(ws, "ERROR", { message: "Not your turn" });
    return;
  }

  if (game.board[position] !== null) {
    sendToClient(ws, "ERROR", { message: "Position already taken" });
    return;
  }

  // Make move
  const symbol = game.player1 === player.id ? "X" : "O";
  game.board[position] = symbol;

  // Check for winner
  const winner = checkWinner(game.board);

  if (winner) {
    game.status = "finished";
    game.winner = winner === "X" ? game.player1 : game.player2;

    // Update leaderboard
    updateLeaderboard(game);

    // Notify both players
    broadcastToGame(game, "GAME_UPDATE", {
      board: game.board,
      status: "finished",
      winner: winner,
      winnerId: game.winner,
    });
  } else if (game.board.every((cell) => cell !== null)) {
    // Draw
    game.status = "finished";
    game.winner = "draw";

    updateLeaderboard(game);

    broadcastToGame(game, "GAME_UPDATE", {
      board: game.board,
      status: "finished",
      winner: "draw",
    });
  } else {
    // Continue game
    game.currentTurn =
      game.currentTurn === game.player1 ? game.player2 : game.player1;

    broadcastToGame(game, "GAME_UPDATE", {
      board: game.board,
      status: "playing",
      currentTurn: game.currentTurn,
    });
  }
}

function checkWinner(board) {
  const winPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // columns
    [0, 4, 8],
    [2, 4, 6], // diagonals
  ];

  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  return null;
}

function updateLeaderboard(game) {
  const player1Stats = leaderboard.get(game.player1);
  const player2Stats = leaderboard.get(game.player2);

  if (game.winner === "draw") {
    if (player1Stats) player1Stats.draws++;
    if (player2Stats) player2Stats.draws++;
  } else {
    const winnerId = game.winner;
    const loserId = winnerId === game.player1 ? game.player2 : game.player1;

    const winnerStats = leaderboard.get(winnerId);
    const loserStats = leaderboard.get(loserId);

    if (winnerStats) winnerStats.wins++;
    if (loserStats) loserStats.losses++;
  }
}

function handleGetLeaderboard(ws) {
  const leaderboardArray = Array.from(leaderboard.values())
    .sort((a, b) => {
      const scoreA = a.wins * 3 + a.draws;
      const scoreB = b.wins * 3 + b.draws;
      return scoreB - scoreA;
    })
    .slice(0, 100); // Top 100

  sendToClient(ws, "LEADERBOARD", { leaderboard: leaderboardArray });
}

function handleRematch(ws, payload) {
  const player = players.get(ws.playerId);
  if (!player) return;

  // Add back to matchmaking
  handleFindMatch(ws, {});
}

function handleDisconnect(ws) {
  const playerId = ws.playerId;
  if (!playerId) return;

  const player = players.get(playerId);
  if (!player) return;

  // Remove from queue
  const queueIndex = matchmakingQueue.indexOf(playerId);
  if (queueIndex > -1) {
    matchmakingQueue.splice(queueIndex, 1);
  }

  // Handle active game
  if (player.gameId) {
    const game = games.get(player.gameId);
    if (game && game.status === "playing") {
      game.status = "finished";
      const opponentId =
        game.player1 === playerId ? game.player2 : game.player1;
      game.winner = opponentId;

      const opponent = players.get(opponentId);
      if (opponent) {
        sendToClient(opponent.ws, "OPPONENT_DISCONNECTED", {
          message: "Opponent disconnected. You win!",
        });
      }

      // Update leaderboard
      updateLeaderboard(game);
    }
  }

  players.delete(playerId);
  console.log(`Player disconnected: ${player.username}`);
}

function broadcastToGame(game, type, payload) {
  const player1 = players.get(game.player1);
  const player2 = players.get(game.player2);

  if (player1) sendToClient(player1.ws, type, payload);
  if (player2) sendToClient(player2.ws, type, payload);
}

function sendToClient(ws, type, payload) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, payload }));
  }
}

// REST endpoints
app.get("/", (req, res) => {
  res.json({
    message: "Tic-Tac-Toe Server",
    activeGames: games.size,
    activePlayers: players.size,
    queueSize: matchmakingQueue.length,
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
