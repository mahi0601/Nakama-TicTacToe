import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Configure server URL - change this to your deployed server URL
const SERVER_URL = 'ws://10.68.35.111:3000'; // Your computer's IP address

type Screen = 'login' | 'menu' | 'game' | 'leaderboard';

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [username, setUsername] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [gameState, setGameState] = useState({
    gameId: null as string | null,
    board: Array(9).fill(null),
    symbol: 'X',
    yourTurn: false,
    opponent: '',
    status: 'waiting' as 'waiting' | 'playing' | 'finished',
    winner: null as string | null,
  });
  const [searching, setSearching] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    const socket = new WebSocket(SERVER_URL);

    socket.onopen = () => {
      console.log('Connected to server');
    };

    socket.onmessage = (event) => {
      const { type, payload } = JSON.parse(event.data);
      handleServerMessage(type, payload);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      Alert.alert('Connection Error', 'Failed to connect to server');
    };

    socket.onclose = () => {
      console.log('Disconnected from server');
    };

    ws.current = socket;
  };

  const handleServerMessage = (type: string, payload: any) => {
    switch (type) {
      case 'JOINED':
        setPlayerId(payload.playerId);
        setScreen('menu');
        break;

      case 'MATCHMAKING':
        setSearching(true);
        break;

      case 'MATCH_FOUND':
        setSearching(false);
        setGameState({
          gameId: payload.gameId,
          board: Array(9).fill(null),
          symbol: payload.symbol,
          yourTurn: payload.yourTurn,
          opponent: payload.opponent,
          status: 'playing',
          winner: null,
        });
        setScreen('game');
        break;

      case 'GAME_UPDATE':
        setGameState((prev) => ({
          ...prev,
          board: payload.board,
          status: payload.status,
          yourTurn: payload.currentTurn === playerId,
          winner: payload.winner || payload.winnerId,
        }));
        break;

      case 'OPPONENT_DISCONNECTED':
        Alert.alert('Victory!', payload.message);
        setGameState((prev) => ({ ...prev, status: 'finished', winner: gameState.symbol }));
        break;

      case 'LEADERBOARD':
        setLeaderboard(payload.leaderboard);
        break;

      case 'ERROR':
        Alert.alert('Error', payload.message);
        break;
    }
  };

  const handleLogin = () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }
    connectWebSocket();
    setTimeout(() => {
      sendMessage('JOIN', { username: username.trim() });
    }, 500);
  };

  const findMatch = () => {
    sendMessage('FIND_MATCH', {});
  };

  const makeMove = (position: number) => {
    if (!gameState.yourTurn || gameState.status !== 'playing') return;
    if (gameState.board[position] !== null) return;

    sendMessage('MAKE_MOVE', {
      gameId: gameState.gameId,
      position,
    });
  };

  const getLeaderboard = () => {
    sendMessage('GET_LEADERBOARD', {});
    setScreen('leaderboard');
  };

  const rematch = () => {
    sendMessage('REMATCH', {});
    setSearching(true);
  };

  const sendMessage = (type: string, payload: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, payload }));
    }
  };

  // UI Rendering
  const renderLoginScreen = () => (
    <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.container}>
      <View style={styles.loginContainer}>
        <Text style={styles.title}>🎮 Tic-Tac-Toe</Text>
        <Text style={styles.subtitle}>Multiplayer Battle</Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter your username"
            placeholderTextColor="#9ca3af"
            value={username}
            onChangeText={setUsername}
            maxLength={20}
          />
        </View>
        
        <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
          <Text style={styles.primaryButtonText}>Start Playing</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  const renderMenuScreen = () => (
    <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.container}>
      <View style={styles.menuContainer}>
        <Text style={styles.welcomeText}>Welcome, {username}! 👋</Text>
        
        {searching ? (
          <View style={styles.searchingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.searchingText}>Finding opponent...</Text>
          </View>
        ) : (
          <>
            <TouchableOpacity style={styles.menuButton} onPress={findMatch}>
              <Text style={styles.menuButtonIcon}>⚔️</Text>
              <Text style={styles.menuButtonText}>Find Match</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuButton} onPress={getLeaderboard}>
              <Text style={styles.menuButtonIcon}>🏆</Text>
              <Text style={styles.menuButtonText}>Leaderboard</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </LinearGradient>
  );

  const renderGameScreen = () => {
    const getStatusText = () => {
      if (gameState.status === 'finished') {
        if (gameState.winner === 'draw') return '🤝 Draw!';
        if (gameState.winner === gameState.symbol) return '🎉 You Win!';
        return '😢 You Lose!';
      }
      return gameState.yourTurn ? '🎯 Your Turn' : '⏳ Opponent\'s Turn';
    };

    const getStatusColor = () => {
      if (gameState.status === 'finished') {
        if (gameState.winner === 'draw') return '#f59e0b';
        if (gameState.winner === gameState.symbol) return '#10b981';
        return '#ef4444';
      }
      return gameState.yourTurn ? '#10b981' : '#6b7280';
    };

    return (
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.container}>
        <View style={styles.gameContainer}>
          <View style={styles.gameHeader}>
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>You ({gameState.symbol})</Text>
              <Text style={styles.vsText}>VS</Text>
              <Text style={styles.playerName}>{gameState.opponent}</Text>
            </View>
            
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
              <Text style={styles.statusText}>{getStatusText()}</Text>
            </View>
          </View>

          <View style={styles.board}>
            {gameState.board.map((cell, index) => (
              <TouchableOpacity
                key={index}
                style={styles.cell}
                onPress={() => makeMove(index)}
                disabled={!gameState.yourTurn || gameState.status !== 'playing' || cell !== null}
              >
                <Text style={[
                  styles.cellText,
                  cell === 'X' ? styles.cellTextX : styles.cellTextO
                ]}>
                  {cell || ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {gameState.status === 'finished' && (
            <View style={styles.gameOverButtons}>
              <TouchableOpacity style={styles.rematchButton} onPress={rematch}>
                <Text style={styles.rematchButtonText}>Find New Match</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuButtonSecondary} onPress={() => setScreen('menu')}>
                <Text style={styles.menuButtonSecondaryText}>Back to Menu</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </LinearGradient>
    );
  };

  const renderLeaderboardScreen = () => (
    <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.container}>
      <SafeAreaView style={styles.leaderboardContainer}>
        <Text style={styles.leaderboardTitle}>🏆 Leaderboard</Text>
        
        <ScrollView style={styles.leaderboardList}>
          {leaderboard.length === 0 ? (
            <Text style={styles.emptyText}>No players yet</Text>
          ) : (
            leaderboard.map((player, index) => (
              <View key={player.id} style={styles.leaderboardItem}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>#{index + 1}</Text>
                </View>
                <View style={styles.playerStats}>
                  <Text style={styles.playerStatsName}>{player.username}</Text>
                  <Text style={styles.playerStatsRecord}>
                    {player.wins}W - {player.losses}L - {player.draws}D
                  </Text>
                </View>
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreText}>{player.wins * 3 + player.draws}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        <TouchableOpacity style={styles.backButton} onPress={() => setScreen('menu')}>
          <Text style={styles.backButtonText}>Back to Menu</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );

  return (
    <>
      <StatusBar barStyle="light-content" />
      {screen === 'login' && renderLoginScreen()}
      {screen === 'menu' && renderMenuScreen()}
      {screen === 'game' && renderGameScreen()}
      {screen === 'leaderboard' && renderLeaderboardScreen()}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginContainer: {
    width: '85%',
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 20,
    color: '#e0e7ff',
    marginBottom: 40,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  primaryButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#6366f1',
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuContainer: {
    width: '85%',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 40,
    textAlign: 'center',
  },
  searchingContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  searchingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 20,
  },
  menuButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  menuButtonIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  menuButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  gameContainer: {
    width: '90%',
    alignItems: 'center',
  },
  gameHeader: {
    width: '100%',
    marginBottom: 30,
  },
  playerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  playerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  vsText: {
    color: '#e0e7ff',
    fontSize: 14,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  statusBadge: {
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 320,
    height: 320,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 8,
  },
  cell: {
    width: '33.33%',
    height: '33.33%',
    padding: 4,
  },
  cellInner: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    fontSize: 64,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
  },
  cellTextX: {
    color: '#10b981',
  },
  cellTextO: {
    color: '#f59e0b',
  },
  gameOverButtons: {
    width: '100%',
    marginTop: 30,
  },
  rematchButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  rematchButtonText: {
    color: '#6366f1',
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuButtonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  menuButtonSecondaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  leaderboardContainer: {
    flex: 1,
    width: '100%',
    paddingTop: 50,
  },
  leaderboardTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  leaderboardList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#6366f1',
    fontWeight: 'bold',
    fontSize: 16,
  },
  playerStats: {
    flex: 1,
  },
  playerStatsName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  playerStatsRecord: {
    color: '#e0e7ff',
    fontSize: 14,
  },
  scoreBadge: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  scoreText: {
    color: '#6366f1',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyText: {
    color: '#e0e7ff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  backButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#6366f1',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

