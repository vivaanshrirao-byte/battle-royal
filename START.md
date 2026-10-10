# 🎮 BATTLE ROYAL - START HERE

## Install & Run

```bash
# 1. Install Node.js from nodejs.org

# 2. Install dependencies
npm install

# 3. Start server
npm start

# 4. Open browser
http://localhost:3001
```

## Play Locally (Test with 2 Players)

1. Open http://localhost:3001 in **Tab 1**
   - Name: Player 1
   - Click JOIN

2. Open http://localhost:3001 in **Tab 2**
   - Name: Player 2
   - Click JOIN

3. Use **Arrow Keys** to move
4. Get close and press **SPACE** to attack
5. Watch health drop!

## Controls

- **↑↓←→** Move around
- **SPACE** Attack nearby enemy
- **T** Switch to Team Chat
- **G** Switch to Global Chat
- **Enter** Send message

## Game Rules

✅ Zone shrinks every 30 seconds
✅ Outside zone = take damage
✅ Attack nearby = 25 damage per hit
✅ Last player standing = WINNER
✅ Kills are tracked

## Features

✅ Real-time multiplayer
✅ Global & Team chat
✅ Zone shrinking system
✅ Combat & health
✅ Accessibility (speech announcements)
✅ Sound effects

## Troubleshooting

**Port 3001 already in use?**
```bash
PORT=3002 npm start
```

**Can't connect?**
- Check server is running
- Try http://localhost:3001
- Check browser console (F12)

**No sound?**
- Check browser volume
- Enable audio in browser settings

## Deploy (Optional)

For online play:
- Deploy to Heroku/Railway/Replit
- Use their URL instead of localhost
- Others join your game via that URL

---

**Enjoy the battle! ⚔️**
