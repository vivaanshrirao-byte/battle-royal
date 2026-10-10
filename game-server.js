const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, { cors: { origin: '*' } });

app.use(express.static('public'));

// ==================== GAME ENGINE ====================
const GAME_CONFIG = {
  ARENA_SIZE: 200,
  INITIAL_ZONE_RADIUS: 80,
  ZONE_SHRINK_INTERVAL: 30000,
  ZONE_SHRINK_FACTOR: 0.75,
  DAMAGE_OUTSIDE_ZONE: 2,
  ATTACK_RANGE: 15,
  ATTACK_DAMAGE: 25,
  MOVE_SPEED: 3,
  PLAYER_RADIUS: 5
};

const gameState = {
  players: new Map(),
  match: {
    id: `match_${Date.now()}`,
    status: 'waiting',
    zone: { center: { x: 100, y: 100 }, radius: 80 },
    round: 0,
    startTime: null
  },
  chatMessages: []
};

// Player class
class GamePlayer {
  constructor(id, name, team) {
    this.id = id;
    this.name = name;
    this.team = team;
    this.health = 100;
    this.position = {
      x: Math.random() * GAME_CONFIG.ARENA_SIZE * 0.8 + 20,
      y: Math.random() * GAME_CONFIG.ARENA_SIZE * 0.8 + 20
    };
    this.status = 'alive';
    this.kills = 0;
    this.lastAttackTime = 0;
    this.joinedAt = Date.now();
  }

  distanceTo(other) {
    const dx = this.position.x - other.position.x;
    const dy = this.position.y - other.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  isInZone(zone) {
    const dx = this.position.x - zone.center.x;
    const dy = this.position.y - zone.center.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= zone.radius;
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    if (this.health === 0) {
      this.status = 'dead';
    }
  }

  getPlayerData() {
    return {
      id: this.id,
      name: this.name,
      team: this.team,
      health: this.health,
      position: this.position,
      status: this.status,
      kills: this.kills
    };
  }
}

// Socket events
io.on('connection', (socket) => {
  console.log(`✅ Player connected: ${socket.id}`);

  socket.on('player:join', (data) => {
    const { playerName, team } = data;
    const player = new GamePlayer(socket.id, playerName, team || 'solo');
    gameState.players.set(socket.id, player);

    if (gameState.match.status === 'waiting') {
      gameState.match.status = 'active';
      gameState.match.startTime = Date.now();
    }

    io.emit('player:joined', {
      playerId: socket.id,
      playerName: playerName,
      team: player.team,
      totalPlayers: gameState.players.size,
      position: player.position,
      allPlayers: Array.from(gameState.players.values()).map(p => p.getPlayerData())
    });

    socket.emit('ui:speak', `Welcome ${playerName}. Battle started with ${gameState.players.size} players.`);
    console.log(`🎮 ${playerName} joined match. Total players: ${gameState.players.size}`);
  });

  socket.on('game:move', (data) => {
    const player = gameState.players.get(socket.id);
    if (!player || player.status !== 'alive') return;

    let newX = player.position.x + data.dx * GAME_CONFIG.MOVE_SPEED;
    let newY = player.position.y + data.dy * GAME_CONFIG.MOVE_SPEED;

    newX = Math.max(0, Math.min(GAME_CONFIG.ARENA_SIZE, newX));
    newY = Math.max(0, Math.min(GAME_CONFIG.ARENA_SIZE, newY));

    player.position.x = newX;
    player.position.y = newY;

    if (!player.isInZone(gameState.match.zone)) {
      player.takeDamage(GAME_CONFIG.DAMAGE_OUTSIDE_ZONE);
      socket.emit('ui:speak', `Zone damage! Health: ${player.health}`);

      if (player.health === 0) {
        io.emit('player:died', { playerId: socket.id, playerName: player.name, reason: 'zone' });
      }
    }

    io.emit('game:playerMoved', { playerId: socket.id, position: player.position, health: player.health });
  });

  socket.on('game:attack', (data) => {
    const attacker = gameState.players.get(socket.id);
    const defender = gameState.players.get(data.targetId);

    if (!attacker || !defender || attacker.status !== 'alive' || defender.status !== 'alive') return;
    if (Date.now() - attacker.lastAttackTime < 500) return;

    const distance = attacker.distanceTo(defender);
    if (distance <= GAME_CONFIG.ATTACK_RANGE) {
      defender.takeDamage(GAME_CONFIG.ATTACK_DAMAGE);
      attacker.lastAttackTime = Date.now();

      io.emit('game:hit', {
        attackerId: socket.id,
        attackerName: attacker.name,
        targetId: data.targetId,
        targetName: defender.name,
        damage: GAME_CONFIG.ATTACK_DAMAGE,
        remainingHealth: defender.health
      });

      socket.emit('ui:speak', `Hit! ${GAME_CONFIG.ATTACK_DAMAGE} damage!`);

      if (defender.health === 0) {
        attacker.kills++;
        io.emit('player:died', { playerId: data.targetId, playerName: defender.name, killerId: socket.id, killerName: attacker.name, reason: 'combat' });
        socket.emit('ui:speak', `${defender.name} eliminated!`);
      } else {\n        io.to(data.targetId).emit('ui:speak', `${attacker.name} hit you! Health: ${defender.health}`);\n      }\n    }\n  });\n\n  socket.on('chat:message', (data) => {\n    const player = gameState.players.get(socket.id);\n    if (!player) return;\n\n    const message = { playerId: socket.id, playerName: player.name, message: data.message, type: data.type, timestamp: Date.now() };\n    gameState.chatMessages.push(message);\n\n    if (data.type === 'global') {\n      io.emit('chat:message', message);\n    } else if (data.type === 'team') {\n      Array.from(gameState.players.values())\n        .filter(p => p.team === player.team)\n        .forEach(p => io.to(p.id).emit('chat:message', message));\n    }\n  });\n\n  socket.on('voice:offer', (data) => {\n    io.to(data.targetId).emit('voice:offer', { fromId: socket.id, offer: data.offer });\n  });\n\n  socket.on('voice:answer', (data) => {\n    io.to(data.targetId).emit('voice:answer', { fromId: socket.id, answer: data.answer });\n  });\n\n  socket.on('voice:ice', (data) => {\n    io.to(data.targetId).emit('voice:ice', { fromId: socket.id, candidate: data.candidate });\n  });\n\n  socket.on('disconnect', () => {\n    const player = gameState.players.get(socket.id);\n    if (player) {\n      gameState.players.delete(socket.id);\n      io.emit('player:left', { playerId: socket.id, playerName: player.name });\n      console.log(`❌ ${player.name} disconnected`);\n    }\n  });\n});\n\n// Zone shrinking\nsetInterval(() => {\n  if (gameState.match.status === 'active') {\n    gameState.match.zone.radius *= GAME_CONFIG.ZONE_SHRINK_FACTOR;\n    gameState.match.round++;\n\n    if (gameState.match.zone.radius > 5) {\n      io.emit('game:zoneUpdate', { radius: gameState.match.zone.radius, round: gameState.match.round });\n      io.emit('ui:speak', `Zone shrinking! New radius ${gameState.match.zone.radius.toFixed(1)} meters`);\n    } else {\n      const survivors = Array.from(gameState.players.values()).filter(p => p.status === 'alive');\n      if (survivors.length === 1) {\n        gameState.match.status = 'ended';\n        io.emit('game:ended', { winner: survivors[0].name, kills: survivors[0].kills });\n        io.emit('ui:speak', `Game ended! ${survivors[0].name} is the champion!`);\n      }\n    }\n  }\n}, GAME_CONFIG.ZONE_SHRINK_INTERVAL);\n\n// REST endpoints\napp.get('/api/health', (req, res) => {\n  res.json({ status: 'ok', players: gameState.players.size, match: gameState.match });\n});\n\napp.get('/', (req, res) => {\n  res.sendFile(path.join(__dirname, 'public', 'index.html'));\n});\n\n// Start server\nconst PORT = process.env.PORT || 3001;\nserver.listen(PORT, () => {\n  console.log(`\n⚔️  BATTLE ROYAL SERVER\\n🎮 http://localhost:${PORT}\\n📡 Ready for battle!\\n`);\n});\n