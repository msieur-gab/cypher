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

### No Build Step Required
All dependencies load via CDN (esm.sh). Pure ES Modules served directly.

**Dependencies:**
- Lit (UI framework): `https://esm.sh/lit`
- PeerJS (WebRTC): `https://esm.sh/peerjs@1`
- QRCode: `https://esm.sh/qrcode@1`
- Dexie.js (IndexedDB): `https://esm.sh/dexie`

### Data Flow
```
IPFS → Mobile (fetch, decrypt, store) → PC (render)
```

### Connection Protocol
1. PC generates QR code with WebRTC offer + session ID
2. Mobile scans QR and connects via PeerJS
3. Mobile sends `INIT_STATE` with game progress
4. Bidirectional messaging:
   - Mobile → PC: `INIT_STATE`, `STATE_UPDATE`, `CONTENT_RESPONSE`, `NOTIFICATION`
   - PC → Mobile: `UI_EVENT`, `REQUEST_CONTENT`, `REMOTE_INPUT`

### Database Schema (Mobile Only - Dexie.js)
Tables: `agent`, `progress`, `evidence`, `decryptedContent`, `contacts`, `keychain`, `missions`, `settings`

## Key Documentation

- `docs/PROJECT_BRIEF.md` - Complete game design, narrative, mechanics, and technical specifications
- `docs/TECH_BRIEF.md` - High-level architecture overview

## Current Status

Early POC phase. Implemented: PeerJS connection, QR generation, basic message passing. Planned: Lit components, Dexie database, IPFS integration, AES-GCM encryption, game content.

## Design Principles

The game practices what it teaches:
- All state on user's device (mobile)
- No central server (P2P only)
- Decentralized content (IPFS)
- PC terminal never stores secrets
- Works offline
