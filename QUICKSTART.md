# Quick Start Guide - Battle Royal

## Install & Run

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start

# 3. Open browser
http://localhost:3001
```

## How to Play

### Join
- Enter your player name
- Select team (solo or team)
- Click "Join Battle Arena"

### Controls
- **Arrow Keys**: Move around the arena
- **Space**: Attack nearby enemies
- **G**: Global Chat (all players)
- **T**: Team Chat (your team only)
- **V**: Voice Chat
- **M**: Mute Microphone

### Game Mechanics

**Zone Shrinking**
- Safe zone shrinks every 30 seconds
- If you're outside zone, you take damage
- Take damage to stay alive!

**Combat**
- Get close to enemy (within 5m)
- Press Space to attack
- Deal 25 damage per hit
- Eliminate enemies to get kills

**Win**
- Be the last player standing
- Score depends on kills
- Zone keeps shrinking until match ends

## Test Multiplayer Locally

1. Open http://localhost:3001 in one tab
   - Name: Player 1
   - Team: Solo

2. Open http://localhost:3001 in another tab  
   - Name: Player 2
   - Team: Solo

3. Use arrow keys to move toward each other

4. When close, press Space to attack

5. Watch health drop and messages appear

## Features Included

✅ Multiplayer real-time gameplay
✅ Voice chat (WebRTC ready)
✅ Global & Team text chat
✅ Zone shrinking mechanic
✅ Combat & health system
✅ Player stats (kills)
✅ Accessibility (speech announcements)
✅ Screen reader friendly UI
✅ Keyboard-only controls

## Troubleshooting

**Port already in use?**
```bash
PORT=3002 npm start
```

**Can't connect?**
- Check server is running
- Try http://localhost:3001 not 127.0.0.1
- Check browser console for errors

**No sound?**
- Check browser audio permissions
- Volume not muted
- Speaker working

## Next Steps

- Add more game modes (squad, deathmatch)
- Implement real voice chat codec
- Add more sound effects
- Deploy to cloud
- Mobile app version

Enjoy the game! 🎮
