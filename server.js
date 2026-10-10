const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, { cors: { origin: '*' } });

app.use(express.static('public'));

const CONFIG = {
  ARENA_SIZE: 200,
  INITIAL_ZONE_RADIUS: 80,
  ZONE_SHRINK_INTERVAL: 30000,
  ZONE_SHRINK_FACTOR: 0.75,
  DAMAGE_OUTSIDE_ZONE: 2,
  ATTACK_RANGE: 15,
  ATTACK_DAMAGE: 25,
  MOVE_SPEED: 3
};

const gameState = {
  players: new Map(),
  match: {
    status: 'active',
    zone: { center: { x: 100, y: 100 }, radius: 80 },
    round: 0
  }
};

class Player {
  constructor(id, name, team) {
    this.id = id;
    this.name = name;
    this.team = team;
    this.health = 100;
    this.position = { x: Math.random() * 160 + 20, y: Math.random() * 160 + 20 };
    this.status = 'alive';
    this.kills = 0;
    this.lastAttack = 0;
  }

  distanceTo(p) {
    const dx = this.position.x - p.position.x;
    const dy = this.position.y - p.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  isInZone(zone) {
    const dx = this.position.x - zone.center.x;
    const dy = this.position.y - zone.center.y;
    return Math.sqrt(dx * dx + dy * dy) <= zone.radius;
  }
}

io.on('connection', (socket) => {
  console.log(`✅ ${socket.id} connected`);

  socket.on('join', (data) => {
    const player = new Player(socket.id, data.name, data.team || 'solo');
    gameState.players.set(socket.id, player);
    io.emit('playerJoined', { id: socket.id, name: data.name, team: player.team, total: gameState.players.size });
    socket.emit('speak', `Welcome ${data.name}. ${gameState.players.size} players in arena.`);
  });

  socket.on('move', (data) => {
    const p = gameState.players.get(socket.id);
    if (!p || p.status !== 'alive') return;
    p.position.x = Math.max(0, Math.min(CONFIG.ARENA_SIZE, p.position.x + data.dx * CONFIG.MOVE_SPEED));
    p.position.y = Math.max(0, Math.min(CONFIG.ARENA_SIZE, p.position.y + data.dy * CONFIG.MOVE_SPEED));
    if (!p.isInZone(gameState.match.zone)) {
      p.health = Math.max(0, p.health - CONFIG.DAMAGE_OUTSIDE_ZONE);
      if (p.health === 0) { p.status = 'dead'; io.emit('died', { id: socket.id, name: p.name }); }
    }
    io.emit('move', { id: socket.id, pos: p.position, health: p.health });
  });

  socket.on('attack', (data) => {
    const attacker = gameState.players.get(socket.id);
    const target = gameState.players.get(data.target);
    if (!attacker || !target || attacker.status !== 'alive' || target.status !== 'alive') return;
    if (Date.now() - attacker.lastAttack < 500) return;
    if (attacker.distanceTo(target) > CONFIG.ATTACK_RANGE) return;
    target.health = Math.max(0, target.health - CONFIG.ATTACK_DAMAGE);
    attacker.lastAttack = Date.now();
    io.emit('hit', { attacker: attacker.name, target: target.name, damage: CONFIG.ATTACK_DAMAGE, health: target.health });
    if (target.health === 0) { target.status = 'dead'; attacker.kills++; io.emit('died', { id: data.target, name: target.name, killer: attacker.name }); }
  });

  socket.on('chat', (data) => {
    const p = gameState.players.get(socket.id);
    if (p) io.emit('chat', { name: p.name, msg: data.msg, type: data.type });
  });

  socket.on('disconnect', () => { gameState.players.delete(socket.id); io.emit('left', socket.id); });
});

setInterval(() => {
  gameState.match.zone.radius *= CONFIG.ZONE_SHRINK_FACTOR;
  if (gameState.match.zone.radius > 5) {
    io.emit('zone', { radius: gameState.match.zone.radius });
    io.emit('speak', `Zone shrinking! ${gameState.match.zone.radius.toFixed(1)}m`);
  } else {
    const alive = Array.from(gameState.players.values()).filter(p => p.status === 'alive');
    if (alive.length === 1) io.emit('winner', { name: alive[0].name, kills: alive[0].kills });
  }
}, CONFIG.ZONE_SHRINK_INTERVAL);

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`\n⚔️ BATTLE ROYAL\n🎮 http://localhost:${PORT}\n📡 READY\n`));
