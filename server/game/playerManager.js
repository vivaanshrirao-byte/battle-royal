class PlayerManager {
  addPlayer(socketId, data, gameState) {
    const player = {
      id: socketId,
      name: data.playerName,
      health: 100,
      position: { x: 0, y: 0, z: 0 },
      team: data.team || null,
      status: 'alive',
      joinedAt: Date.now(),
      stats: {
        kills: 0,
        deaths: 0,
        damageDealt: 0,
        damageTaken: 0
      }
    };
    
    gameState.players.set(socketId, player);
    return player;
  }

  removePlayer(socketId, gameState) {
    gameState.players.delete(socketId);
  }

  updatePlayerPosition(socketId, position, gameState) {
    const player = gameState.players.get(socketId);
    if (player) {
      player.position = position;
    }
  }

  updatePlayerHealth(socketId, damage, gameState) {
    const player = gameState.players.get(socketId);
    if (player) {
      player.health = Math.max(0, player.health - damage);
      player.stats.damageTaken += damage;
      if (player.health === 0) {
        player.status = 'dead';
      }
    }
  }

  getPlayerStats(socketId, gameState) {
    const player = gameState.players.get(socketId);
    return player ? player.stats : null;
  }

  getAllPlayers(gameState) {
    return Array.from(gameState.players.values());
  }
}

module.exports = new PlayerManager();
