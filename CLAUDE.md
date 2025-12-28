# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CYPHER is a text-based investigative RPG designed to educate players about data privacy and digital sovereignty. It uses a unique **two-device architecture**:

- **Mobile Agent** (`/agent/`) - The "vault" that stores all game state, holds decryption keys, and is the source of truth
- **PC Terminal** (`/terminal/`) - A "dumb terminal" that displays the UI and never stores sensitive data

Communication happens via WebRTC P2P (PeerJS) with no central server required.

## Development Commands

```bash
# Start local server (any of these work)
python3 -m http.server 8000
npx serve .

# Access points
# Terminal (PC): http://localhost:8000/terminal/
# Agent (Mobile): http://localhost:8000/agent/
```

## Testing on Mobile (Chromebook)

1. Enable port forwarding: **Settings > Developers > Linux > Port forwarding > add port 8000**
2. Find your Chromebook's WiFi IP: **Settings > Network > WiFi > your network > IP address**
3. Start the local server in Linux
4. Open terminal at `http://localhost:8000/terminal/`
5. Enter your Chromebook IP (e.g. `192.168.86.249:8000`) in the host field and click "Update QR"
6. Scan QR with phone (must be on same WiFi) - open the URL in Chrome/Safari, not the camera app's webview

## Architecture

### Folder Structure
```
cypher/
├── shared/
│   ├── components/
│   │   └── cypher-markdown.js   # Styled markdown renderer
│   ├── services/
│   │   ├── peer-service.js      # PeerJS connection wrapper
│   │   └── storage-service.js   # Dexie.js wrapper
│   └── utils/
│       └── protocol.js          # Message type constants
├── terminal/
│   ├── index.html               # Entry point
│   └── components/
│       ├── terminal-app.js      # Main shell
│       ├── terminal-connect.js  # QR code screen
│       ├── terminal-boot.js     # Boot animation
│       ├── terminal-main.js     # Connected view + file system
│       └── terminal-locked.js   # Locked screen
├── agent/
│   ├── index.html               # Entry point
│   └── components/
│       ├── agent-app.js         # Main shell
│       ├── agent-setup.js       # Profile/avatar creation
│       └── agent-main.js        # Connected view + intel viewer
└── data/                        # Game content (markdown files)
    ├── intel/
    ├── personnel/
    └── operations/
```

### No Build Step Required
All dependencies load via CDN (esm.sh). Pure ES Modules served directly.

**Dependencies:**
- Lit (UI framework): `https://esm.sh/lit@3`
- PeerJS (WebRTC): `https://esm.sh/peerjs@1`
- QRCode: `https://esm.sh/qrcode@1`
- Dexie.js (IndexedDB): `https://esm.sh/dexie@4`

### File System Commands
Agent can send terminal commands:
- `ls [dir]` - List directory
- `cd <dir>` - Change directory
- `cat <file>` - Display file on terminal
- `download <file>` - Transfer to agent device
- `pwd` - Show current directory
- `help` - Show commands

### Connection Protocol
1. PC generates QR code with session ID
2. Mobile scans QR and connects via PeerJS
3. Mobile sends `INIT_STATE` with profile
4. Terminal runs boot sequence animation
5. Bidirectional messaging for commands/files

### Database Schema (Mobile Only - Dexie.js)
Tables: `agent` (profile), `downloads` (acquired intel)

## Key Documentation

- `docs/PROJECT_BRIEF.md` - Complete game design, narrative, mechanics, and technical specifications
- `docs/TECH_BRIEF.md` - High-level architecture overview

## Current Status

**Implemented:**
- Lit web components architecture (shared, terminal, agent)
- PeerJS connection with heartbeat
- QR code generation for pairing
- Boot sequence animation
- Virtual file system with real markdown files
- Terminal commands: ls, cd, cat, download, pwd, help
- Markdown renderer with cyberpunk styling
- Agent intel viewer (downloaded files)
- Dexie.js storage for profile and downloads

**Planned:**
- IPFS integration for decentralized content
- AES-GCM encryption
- More game content
- Session reconnection handling

## Design Principles

The game practices what it teaches:
- All state on user's device (mobile)
- No central server (P2P only)
- Decentralized content (IPFS)
- PC terminal never stores secrets
- Works offline
