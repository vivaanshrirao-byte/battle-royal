const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Game state
const gameState = {
  players: new Map(),
  matches: new Map(),
  chatMessages: [],
  voiceRooms: new Map()
};

// Player management
const playerManager = require('./game/playerManager');
const chatHandler = require('./chat/chatHandler');
const voiceHandler = require('./chat/voiceHandler');

// Socket.IO Events
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Player joins
  socket.on('player:join', (data) => {
    playerManager.addPlayer(socket.id, data, gameState);
    io.emit('player:joined', { playerId: socket.id, playerName: data.playerName });
  });

  // Chat events
  socket.on('chat:message', (message) => {
    chatHandler.handleMessage(socket, message, gameState, io);
  });

  // Voice chat events
  socket.on('voice:offer', (data) => {
    voiceHandler.handleOffer(socket, data, io);
  });

  socket.on('voice:answer', (data) => {
    voiceHandler.handleAnswer(socket, data, io);
  });

  socket.on('voice:ice-candidate', (data) => {
    voiceHandler.handleICECandidate(socket, data, io);
  });

  // Game events
  socket.on('game:move', (data) => {
    const player = gameState.players.get(socket.id);
    if (player) {
      player.position = data.position;
      io.emit('player:moved', { playerId: socket.id, position: data.position });
    }
  });

  socket.on('game:attack', (data) => {
    io.emit('player:attacked', { attackerId: socket.id, targetId: data.targetId });
  });

  // Disconnect
  socket.on('disconnect', () => {
    playerManager.removePlayer(socket.id, gameState);
    io.emit('player:left', { playerId: socket.id });
    console.log(`Player disconnected: ${socket.id}`);
  });
});

// REST endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', players: gameState.players.size });
});

app.get('/api/players', (req, res) => {
  const players = Array.from(gameState.players.values());
  res.json(players);
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🎮 Battle Royal server running on port ${PORT}`);
});
