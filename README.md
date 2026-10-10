# Battle Royal - Accessible Multiplayer Arena
An accessible battle royale gaming platform tailored for blind players featuring serious mind and reaction games with immersive sound design and real-time multiplayer capabilities. No mini-games or time pressure - pure skill-based competitive gameplay with voice and text chat.

## Features
- **Multiplayer Arena**: Real-time battles with up to 100 players
- **Voice Chat**: Crystal-clear spatial audio voice communication (WebRTC)
- **Text Chat**: Team and global chat functionality
- **Sound-Based Gameplay**: Immersive audio cues for all game events
- **Skill-Based Combat**: Pure competitive gameplay focused on strategy and reaction
- **Accessible Controls**: Keyboard and screen-reader friendly interface

## How to Play

### Getting Started
1. Create an account or join as a guest
2. Enter the voice chat lobby
3. Queue for a battle
4. Listen for game start audio cue
5. Navigate the arena using spatial audio

### Game Controls
- **Arrow Keys**: Move forward/backward, strafe left/right
- **Space**: Jump/climb obstacles
- **T**: Toggle team voice chat
- **G**: Global text chat
- **V**: Push-to-talk voice
- **M**: Mute/unmute

### Combat Mechanics
- **Audio Localization**: Hear enemy positions via spatial audio
- **Health Status**: Audio announcements of damage taken
- **Item Pickup**: Audio confirmation of loot acquisition
- **Zone Warnings**: Sound alerts for shrinking safe zone
- **Victory/Defeat**: Unique audio cues for outcomes

## Tech Stack

### Backend
- **Node.js + Express**: Server framework
- **Socket.IO**: Real-time communication for chat and game state
- **WebRTC**: Peer-to-peer voice chat
- **PostgreSQL**: Player data and match history
- **Redis**: Game state and session caching

### Frontend
- **Web Audio API**: Spatial audio and sound generation
- **WebRTC API**: Voice communication
- **Accessible HTML5**: Screen reader compatible UI

### Deployment
- **Docker**: Containerization
- **AWS/GCP**: Cloud hosting

## Project Structure
```
battle-royal/
├── server/
│   ├── game/          # Game logic and arena management
│   ├── chat/          # Voice and text chat handlers
│   ├── auth/          # Authentication and sessions
│   ├── db/            # Database models
│   └── config/        # Configuration files
├── client/
│   ├── audio/         # Web Audio API utilities
│   ├── game/          # Client-side game state
│   ├── chat/          # Chat UI and handlers
│   ├── accessibility/ # ARIA and screen reader support
│   └── main.js        # Entry point
├── docs/              # Documentation
└── docker-compose.yml # Docker setup
```

## Installation & Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- Docker & Docker Compose (optional)

### Local Development
```bash
# Clone the repo
git clone https://github.com/vivaanshrirao-byte/battle-royal.git
cd battle-royal

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Start services with Docker
docker-compose up -d

# Run migrations
npm run migrate

# Start development server
npm run dev

# Access at http://localhost:3000
```

## Contributing
Contributions are welcome! Please ensure all features maintain accessibility standards for blind and visually impaired players.

## License
MIT

---
**Made for competitive gaming without visual barriers** ♿🎮
