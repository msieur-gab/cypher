# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NEXUS** is a text-based investigative RPG designed to educate players about data privacy and digital sovereignty. The player becomes the "nexus" of their own privacy - linking, deciphering, and understanding the causality of their data.

It uses a unique **two-device architecture**:

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
# Component Test: http://localhost:8000/docs/components-test.html
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
nexus/
├── index.html                   # Auto-detect device, route to terminal/agent
├── shared/
│   ├── styles/
│   │   ├── tokens.css           # CSS tokens (--nx-*)
│   │   └── base.css             # Reset and foundational styles
│   ├── components/
│   │   ├── nexus-icons.js       # SVG icon library (40+ icons)
│   │   ├── nexus-button.js      # Button component
│   │   ├── nexus-input.js       # Text input with search/password
│   │   ├── nexus-markdown.js    # Markdown renderer
│   │   ├── nexus-window.js      # Draggable/resizable window
│   │   ├── nexus-list-item.js   # List row with icon/label/meta
│   │   ├── nexus-list.js        # Scrollable list with keyboard nav
│   │   ├── nexus-toolbar.js     # Horizontal bar with slots
│   │   ├── nexus-header.js      # Top app bar (responsive)
│   │   ├── nexus-dock.js        # Bottom nav bar
│   │   ├── nexus-file-browser.js # Two-pane list-detail view
│   │   ├── nexus-desktop-icon.js # Desktop shortcut icon
│   │   ├── nexus-terminal.js    # Command-line interface
│   │   ├── nexus-tabs.js        # Tabbed interface
│   │   ├── nexus-overlay.js     # Modal/sheet/drawer
│   │   ├── nexus-toast.js       # Notification toasts
│   │   ├── nexus-qrcode.js      # QR code generator
│   │   ├── nexus-scanner.js     # QR code scanner (camera)
│   │   ├── nexus-avatar.js      # Avatar with ASCII art capture
│   │   └── nexus-status-badge.js # Connection status indicator
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
│       ├── agent-scanner.js     # QR code scanner
│       └── agent-main.js        # Connected view + intel viewer
└── data/                        # Game content (markdown files)
    ├── intel/
    ├── personnel/
    └── operations/
```

### Naming Convention
- **Custom elements**: `nexus-button`, `nexus-input` (full name)
- **CSS tokens**: `--nx-primary`, `--nx-bg` (short prefix)
- **Files**: `nexus-button.js` (matches element name)

### No Build Step Required
All dependencies load via CDN (esm.sh). Pure ES Modules served directly.

**Dependencies:**
- Lit (UI framework): `https://esm.sh/lit@3`
- PeerJS (WebRTC): `https://esm.sh/peerjs@1`
- QRCode: `https://esm.sh/qrcode@1`
- Dexie.js (IndexedDB): `https://esm.sh/dexie@4`

### Design Tokens (--nx-*)
Lean token system inspired by Suimo:
```css
/* Colors */
--nx-fg / --nx-fg-dim / --nx-fg-muted
--nx-bg / --nx-bg-raised
--nx-primary / --nx-primary-dim / --nx-primary-glow

/* Spacing */
--nx-xs / --nx-sm / --nx-md / --nx-lg / --nx-xl

/* Borders */
--nx-thin / --nx-thick / --nx-radius

/* Typography */
--nx-font / --nx-text-sm / --nx-text-base / --nx-text-lg

/* Effects */
--nx-glow / --nx-glow-lg
```

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
- `docs/components-test.html` - Live component playground

## Current Status

**Implemented:**
- Lit web components architecture (shared, terminal, agent)
- PeerJS connection with heartbeat
- QR code generation for pairing
- QR scanner in agent app
- Boot sequence animation
- Virtual file system with real markdown files
- Terminal commands: ls, cd, cat, download, pwd, help
- Agent intel viewer (downloaded files)
- Dexie.js storage for profile and downloads
- Auto-detect device type (root index.html router)
- Design tokens (--nx-* prefix) with dither patterns
- Base styles with layout utilities
- nexus-icons (SVG icon library, 40+ icons)
- nexus-button (primary/secondary/ghost, sizes, icons)
- nexus-input (text, search, password with clear/toggle)
- nexus-markdown (styled markdown renderer)
- nexus-window (draggable, resizable, fullscreen toggle)
- nexus-list-item (icon, label, meta, selection state)
- nexus-list (keyboard nav, selection management)
- nexus-toolbar (start/center/end slots)
- nexus-header (responsive menu collapse)
- nexus-dock (bottom nav with dock items)
- nexus-file-browser (two-pane list-detail, responsive)
- nexus-desktop-icon (clickable shortcut with dither shadow)
- nexus-terminal (CLI with history, command events)
- nexus-tabs (horizontal/vertical, keyboard nav)
- nexus-overlay (modal/sheet/drawer variants)
- nexus-toast (notification toasts with container)
- nexus-qrcode (QR code generator with themed styling)
- nexus-scanner (QR code scanner with camera)
- nexus-avatar (avatar with ASCII art camera capture)
- nexus-status-badge (connection status indicator)

**In Progress:**
- Refactor existing terminal/agent components to use tokens

**Planned:**
- Game mechanics definition
- Terminal-Agent interaction flow refinement
- IPFS integration for decentralized content
- AES-GCM encryption
- More game content
- Session reconnection handling

## Roadmap

### Phase 1: Architecture & UI Foundation (current)
1. [x] Design tokens (--nx-* CSS properties)
2. [x] Base styles (reset, typography, layout utilities)
3. [x] Icon library (nexus-icons.js, 40+ icons)
4. [x] nexus-button component
5. [x] nexus-input component
6. [x] nexus-markdown component
7. [x] nexus-window component
8. [x] nexus-list-item component
9. [x] nexus-list component
10. [x] nexus-toolbar component
11. [x] nexus-header component
12. [x] nexus-dock component
13. [x] nexus-file-browser component
14. [x] nexus-desktop-icon component
15. [x] nexus-terminal component
16. [x] nexus-tabs component
17. [x] nexus-overlay component
18. [x] nexus-toast component
19. [ ] Refactor terminal app to use NEXUS components
20. [ ] Refactor agent app to use NEXUS components

### Phase 2: Game Mechanics
1. [ ] Define core gameplay loop
2. [ ] Define data flow between terminal/agent
3. [ ] Define progression system

### Phase 3: Terminal-Agent Interaction
1. [ ] Implement game mechanics through P2P messaging
2. [ ] Refine connection/reconnection flow

### Phase 4: Content & Polish
1. [ ] IPFS integration
2. [ ] Game content creation
3. [ ] Encryption layer

## Design Principles

The game practices what it teaches:
- All state on user's device (mobile)
- No central server (P2P only)
- Decentralized content (IPFS)
- PC terminal never stores secrets
- Works offline
