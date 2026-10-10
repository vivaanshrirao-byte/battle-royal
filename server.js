const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// Game state
const gameState = {
  players: new Map(),
  matches: new Map(),
  chatMessages: [],
  gameActive: false
};

// Game constants
const ARENA_SIZE = 100;
const ZONE_SHRINK_INTERVAL = 30000; // 30 seconds
const INITIAL_ZONE_RADIUS = 50;
let currentZoneRadius = INITIAL_ZONE_RADIUS;
let zoneCenter = { x: 50, y: 50 };

// Socket.IO connection
io.on('connection', (socket) => {
  console.log(`✅ Player connected: ${socket.id}`);

  // Player joins game
  socket.on('player:join', (data) => {
    const player = {
      id: socket.id,
      name: data.playerName,
      team: data.team || 'solo',
      health: 100,
      position: { x: Math.random() * ARENA_SIZE, y: Math.random() * ARENA_SIZE },
      status: 'alive',
      joinedAt: Date.now(),
      kills: 0,
      deaths: 0
    };

    gameState.players.set(socket.id, player);
    console.log(`🎮 ${data.playerName} joined`);
    
    io.emit('player:joined', {
      playerId: socket.id,
      playerName: data.playerName,
      team: data.team,
      totalPlayers: gameState.players.size
    });

    // Announce to player
    socket.emit('ui:announcement', `Welcome ${data.playerName}. ${gameState.players.size} players in arena.`);
  });

  // Player moves
  socket.on('game:move', (data) => {
    const player = gameState.players.get(socket.id);
    if (player && player.status === 'alive') {
      // Clamp position to arena
      player.position.x = Math.max(0, Math.min(ARENA_SIZE, data.x));
      player.position.y = Math.max(0, Math.min(ARENA_SIZE, data.y));

      // Check if in zone
      const distance = Math.sqrt(
        Math.pow(player.position.x - zoneCenter.x, 2) + 
        Math.pow(player.position.y - zoneCenter.y, 2)
      );

      if (distance > currentZoneRadius) {
        player.health -= 1; // Zone damage
        socket.emit('ui:announcement', `Taking zone damage. Health: ${player.health}`);
      }

      if (player.health <= 0) {
        player.status = 'dead';
        socket.emit('ui:announcement', 'You have been eliminated!');
        io.emit('player:eliminated', { playerId: socket.id, playerName: player.name });
      }

      // Broadcast movement
      io.emit('game:playerMoved', {
        playerId: socket.id,
        position: player.position
      });
    }
  });

  // Player attacks
  socket.on('game:attack', (data) => {
    const attacker = gameState.players.get(socket.id);
    const target = gameState.players.get(data.targetId);

    if (attacker && target && target.status === 'alive') {
      const distance = Math.sqrt(
        Math.pow(attacker.position.x - target.position.x, 2) +
        Math.pow(attacker.position.y - target.position.y, 2)
      );

      if (distance < 5) {
        const damage = 25;
        target.health -= damage;
        attacker.kills++;

        io.emit('game:hit', {
          attackerId: socket.id,
          targetId: data.targetId,
          damage: damage,
          remainingHealth: target.health
        });

        socket.emit('ui:announcement', `Hit! ${damage} damage dealt.`);
        io.to(data.targetId).emit('ui:announcement', `You took ${damage} damage. Health: ${target.health}`);

        if (target.health <= 0) {
          target.status = 'dead';
          attacker.kills++;
          socket.emit('ui:announcement', `${target.name} eliminated!`);
          io.emit('player:eliminated', { playerId: data.targetId, playerName: target.name });
        }
      } else {
        socket.emit('ui:announcement', 'Target too far away');
      }
    }
  });

  // Text chat
  socket.on('chat:message', (data) => {
    const player = gameState.players.get(socket.id);
    if (player) {
      const message = {
        playerId: socket.id,
        playerName: player.name,
        message: data.message,
        type: data.type,
        timestamp: Date.now()
      };

      gameState.chatMessages.push(message);

      if (data.type === 'global') {
        io.emit('chat:message', message);
        console.log(`💬 [GLOBAL] ${player.name}: ${data.message}`);
      } else if (data.type === 'team' && player.team) {
        io.to(`team:${player.team}`).emit('chat:message', message);
        console.log(`💬 [TEAM] ${player.name}: ${data.message}`);
      }
    }
  });

  // Voice chat offer
  socket.on('voice:offer', (data) => {
    io.to(data.targetId).emit('voice:offer', {
      fromId: socket.id,
      offer: data.offer
    });
  });

  // Voice chat answer
  socket.on('voice:answer', (data) => {
    io.to(data.targetId).emit('voice:answer', {
      fromId: socket.id,
      answer: data.answer
    });
  });

  // ICE candidate
  socket.on('voice:ice-candidate', (data) => {
    io.to(data.targetId).emit('voice:ice-candidate', {
      fromId: socket.id,
      candidate: data.candidate
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    const player = gameState.players.get(socket.id);
    if (player) {
      gameState.players.delete(socket.id);
      io.emit('player:left', { playerId: socket.id, playerName: player.name });
      console.log(`❌ ${player.name} disconnected`);
    }
  });
});

// Zone shrink every 30 seconds
setInterval(() => {
  currentZoneRadius *= 0.8; // Reduce radius by 20%
  
  if (currentZoneRadius > 5) {
    io.emit('game:zoneUpdate', {
      center: zoneCenter,
      radius: currentZoneRadius
    });
    io.emit('ui:announcement', `Zone shrinking! New radius: ${currentZoneRadius.toFixed(1)}`);
    console.log(`📍 Zone shrunk to radius: ${currentZoneRadius.toFixed(1)}`);
  } else {
    // Game over
    io.emit('game:over', { message: 'Match complete!' });
    gameState.players.clear();
    currentZoneRadius = INITIAL_ZONE_RADIUS;
  }
}, ZONE_SHRINK_INTERVAL);

// REST endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    players: gameState.players.size,
    zone: { center: zoneCenter, radius: currentZoneRadius }
  });
});

app.get('/api/players', (req, res) => {
  const players = Array.from(gameState.players.values()).map(p => ({
    id: p.id,
    name: p.name,
    health: p.health,
    position: p.position,
    status: p.status
  }));
  res.json(players);
});

// Serve HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🎮 Battle Royal Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket enabled`);
  console.log(`🔊 Voice chat ready\n`);
});
