class ChatHandler {
  handleMessage(socket, message, gameState, io) {
    const player = gameState.players.get(socket.id);
    
    if (!player) return;

    const chatMessage = {
      playerId: socket.id,
      playerName: player.name,
      message: message.text,
      type: message.type || 'global', // 'global', 'team', 'direct'
      timestamp: Date.now(),
      targetTeam: message.targetTeam || null
    };

    // Store message
    gameState.chatMessages.push(chatMessage);

    // Emit based on type
    if (message.type === 'global') {
      // Broadcast to all players
      io.emit('chat:message', chatMessage);
      console.log(`[GLOBAL] ${player.name}: ${message.text}`);
    } else if (message.type === 'team' && player.team) {
      // Broadcast to team only
      io.to(`team:${player.team}`).emit('chat:message', chatMessage);
      console.log(`[TEAM] ${player.name}: ${message.text}`);
    } else if (message.type === 'direct' && message.targetId) {
      // Send to specific player
      io.to(message.targetId).emit('chat:message', chatMessage);
      console.log(`[DM] ${player.name} -> ${message.targetId}: ${message.text}`);
    }
  }

  getChatHistory(gameState, limit = 50) {
    return gameState.chatMessages.slice(-limit);
  }

  clearChatHistory(gameState) {
    gameState.chatMessages = [];
  }
}

module.exports = new ChatHandler();
