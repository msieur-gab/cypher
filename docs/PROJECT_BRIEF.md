# CYPHER - Project Brief

## Overview

**CYPHER** is a text-based investigative role-playing game designed to educate players about data privacy, digital sovereignty, and user agency. Players take on the role of a "Red Hat Investigator" — a digital intelligence operative working for the European Union's Digital Sovereignty Unit. Through immersive gameplay, players learn that collective change starts with individual action, and that small changes in digital practices can significantly improve their privacy and agency online.

---

## Hosting & Deployment

- **Platform**: GitHub Pages (free)
- **Structure**: Single domain with folder-based routing
  - `https://[username].github.io/cypher/terminal/` — HQ Terminal (PC)
  - `https://[username].github.io/cypher/agent/` — Agent Device (Phone)
- **No build step**: Pure ES modules, served directly

---

## Core Concept

### The Narrative

Players receive encrypted mission briefings and must:
- Decrypt classified documents to uncover objectives
- Collect evidence stored as encrypted files on IPFS
- Solve riddles to obtain decryption keys
- Build relationships with whistleblowers and contacts
- Connect evidence on an investigation board
- Complete missions that teach real-world privacy practices

### The Educational Goals

1. **Awareness**: Help players understand how their data is collected, sold, and used
2. **Agency**: Demonstrate that individuals can take concrete steps to protect themselves
3. **Action**: Guide players toward privacy-respecting tools (Brave, Firefox, Proton, etc.)
4. **Collective Impact**: Show that individual choices contribute to broader digital rights

### The Unique Hook

The game itself practices what it preaches:
- Player data stays on their device (agent)
- No central server stores sensitive information
- Evidence files are decentralized (IPFS)
- The architecture demonstrates data sovereignty in action

---

## Architecture

### Two-Device Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   MOBILE DEVICE                         PC TERMINAL                     │
│   "The Vault"                           "HQ Access Terminal"            │
│   ─────────────                         ──────────────────              │
│                                                                         │
│   • Stores all game state               • Displays game UI              │
│   • Holds decryption keys               • Shows evidence board          │
│   • Source of truth                     • Renders documents             │
│   • Fetches from IPFS                   • Receives state from agent     │
│   • Never shares secrets                • Never stores sensitive data   │
│   • Works offline                       • "Dumb terminal" philosophy    │
│                                                                         │
│            │                                       ▲                    │
│            │           WebRTC (P2P)                │                    │
│            └──────────────────────────────────────►│                    │
│                                                                         │
│   Mobile scans QR on PC to establish connection.                       │
│   Mobile pushes state. PC sends UI events back.                        │
│   Any PC can become a terminal. No trace left behind.                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   IPFS                           MOBILE                      PC         │
│   ────                           ──────                      ──         │
│                                                                         │
│   ┌──────────────┐              ┌──────────────┐         ┌──────────┐  │
│   │ Encrypted    │   fetch      │ Decrypt &    │  sync   │ Render   │  │
│   │ .md files    │─────────────►│ Store locally│────────►│ Display  │  │
│   │ Evidence     │              │ (IndexedDB)  │         │ only     │  │
│   │ Missions     │              │              │         │          │  │
│   └──────────────┘              └──────────────┘         └──────────┘  │
│                                        │                       │        │
│                                        │  UI events            │        │
│                                        │◄──────────────────────┘        │
│                                        │  (clicks, navigation)          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Connection Protocol

```
1. PC displays QR code containing WebRTC offer
2. Mobile scans QR, establishes P2P connection
3. Mobile sends INIT_STATE with full game progress
4. PC renders personalized UI
5. Bidirectional communication:
   - PC → Mobile: UI events (navigation, clicks, requests)
   - Mobile → PC: State updates, decrypted content
6. On disconnect: PC shows "CONNECTION LOST", returns to QR
```

---

## Tech Stack

### Approach: No Bundler, Pure ES Modules

All dependencies loaded via CDN (esm.sh / unpkg). No build step required.

```html
<!-- Example: importing dependencies -->
<script type="module">
  import { LitElement, html, css } from 'https://esm.sh/lit';
  import Dexie from 'https://esm.sh/dexie';
  import { Peer } from 'https://esm.sh/peerjs';
</script>
```

### Mobile App (PWA)

| Layer | Technology | Source |
|-------|------------|--------|
| UI | **Lit** + Shadow DOM | esm.sh/lit |
| Storage | **Dexie.js** (IndexedDB) | esm.sh/dexie |
| Connection | **PeerJS** (WebRTC) | esm.sh/peerjs |
| Crypto | **Web Crypto API** | Native browser |
| Content | **IPFS** (via gateway) | HTTP fetch |

### PC Terminal (Web App)

| Layer | Technology | Source |
|-------|------------|--------|
| UI | **Lit** + Shadow DOM | esm.sh/lit |
| Connection | **PeerJS** (WebRTC) | esm.sh/peerjs |
| QR | **qrcode** library | esm.sh/qrcode |
| Caching | **Service Worker** | Native browser |

### Shared

| Component | Technology | Purpose |
|-----------|------------|---------|
| Modules | **ES Modules** | Native browser imports |
| Protocol | Custom JSON messages | Mobile ↔ PC communication |
| Types | JSDoc comments | Type hints in IDE |

### Content Layer

| Component | Technology | Purpose |
|-----------|------------|---------|
| Storage | **IPFS** | Decentralized, immutable content |
| Pinning | **Pinata** or **web3.storage** | Ensure content availability |
| Format | **Encrypted Markdown** | Mission briefings, evidence files |
| Encryption | **AES-GCM** | Symmetric encryption for content |

---

## Data Model (Mobile - Dexie.js)

```javascript
// Database schema

db.version(1).stores({
  // Player identity
  agent: 'id, codename, avatar, createdAt',
  
  // Chapter/mission progress
  progress: 'chapterId, status, completedAt, *unlockedMissions',
  
  // Collected evidence from IPFS
  evidence: 'cid, title, type, collectedAt, decrypted, verified, *connections',
  
  // Decrypted content cache
  decryptedContent: 'cid, content, decryptedAt',
  
  // NPCs and contacts
  contacts: 'codename, trustLevel, firstContact, lastContact, *intelGained',
  
  // Solved riddles / derived keys
  keychain: 'riddleId, keyHash, unlockedAt',
  
  // Mission objectives
  missions: 'id, chapterId, status, *completedObjectives, startedAt',
  
  // User settings
  settings: 'key, value',
});
```

---

## Communication Protocol

### Message Types: Mobile → PC

```javascript
// Initial state sync on connection
{
  type: 'INIT_STATE',
  payload: {
    agent: { codename, avatar },
    progress: { currentChapter, completedChapters },
    evidence: [{ cid, title, type, decrypted, verified, connections }],
    contacts: [{ codename, trustLevel, status }],
    missions: [{ id, title, status, progress }],
  }
}

// Content response (after PC requests a document)
{
  type: 'CONTENT_RESPONSE',
  cid: 'Qm...',
  status: 'success' | 'locked',
  content: '...',        // if success
  hint: '...',           // if locked
}

// State changes during gameplay
{
  type: 'STATE_UPDATE',
  path: 'evidence.verifiedCount',
  value: 4,
}

// Notifications
{
  type: 'NOTIFICATION',
  message: 'New intel from NIGHTINGALE',
  level: 'info' | 'warning' | 'success',
}
```

### Message Types: PC → Mobile

```javascript
// Navigation events
{
  type: 'UI_EVENT',
  action: 'NAVIGATE',
  screen: 'evidence-board' | 'contacts' | 'missions',
}

// Selection events
{
  type: 'UI_EVENT',
  action: 'SELECT_NODE',
  nodeId: 'cid-or-id',
}

// Content requests
{
  type: 'REQUEST_CONTENT',
  cid: 'Qm...',
}

// Remote control input
{
  type: 'REMOTE_INPUT',
  direction: 'up' | 'down' | 'left' | 'right',
}

{
  type: 'REMOTE_INPUT',
  action: 'select' | 'back',
}
```

---

## Game Mechanics

### Core Loop

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         GAMEPLAY LOOP                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   1. RECEIVE MISSION                                                    │
│      └── Encrypted briefing appears                                     │
│      └── Player decrypts using solved riddles                          │
│                                                                         │
│   2. COLLECT EVIDENCE                                                   │
│      └── Find IPFS CIDs through clues                                  │
│      └── Fetch encrypted files                                          │
│      └── Solve riddles to derive decryption keys                       │
│                                                                         │
│   3. BUILD CASE                                                         │
│      └── Add evidence to investigation board                           │
│      └── Connect related pieces                                         │
│      └── Verify evidence through analysis                              │
│                                                                         │
│   4. DEVELOP CONTACTS                                                   │
│      └── Chat with whistleblowers                                       │
│      └── Build trust through dialogue choices                          │
│      └── Unlock new intel and evidence                                 │
│                                                                         │
│   5. COMPLETE OBJECTIVES                                                │
│      └── Real-world actions (install Brave, etc.)                      │
│      └── In-game verifications                                          │
│      └── Unlock next chapter                                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Screens

| Screen | Platform | Description |
|--------|----------|-------------|
| QR Pairing | PC | Displays WebRTC offer as scannable QR |
| Scanner | Mobile | Camera view to scan PC QR codes |
| Remote Control | Mobile | D-pad/gestures to navigate PC UI |
| Evidence Board | PC | Visual investigation board with connected nodes |
| Document Viewer | PC | Displays decrypted evidence files |
| Mission Briefing | PC | Classified documents with redacted text |
| Whistleblower Chat | Mobile | Encrypted messaging with trust mechanics |
| Vault | Mobile | View all collected evidence and progress |
| Decrypt Prompt | Mobile | Riddle input to derive decryption keys |

### Evidence Types

| Type | Icon | Description |
|------|------|-------------|
| Document | 📄 | Memos, reports, leaked files |
| Person | 👤 | Contacts, whistleblowers, targets |
| Location | 📍 | Data centers, offices, servers |
| Organization | 🏢 | Companies, agencies, groups |
| Evidence | 🔍 | Code snippets, logs, screenshots |
| Unknown | ❓ | Locked until prerequisites met |

---

## Project Structure

```
cypher/
├── terminal/                       # PC Terminal (GitHub Pages: /cypher/terminal/)
│   ├── index.html                  # Entry point
│   ├── css/
│   │   └── styles.css              # Global styles
│   ├── js/
│   │   ├── app.js                  # Main application
│   │   ├── components/             # Lit web components
│   │   │   ├── app-shell.js
│   │   │   ├── qr-display.js
│   │   │   ├── connection-status.js
│   │   │   ├── evidence-board.js
│   │   │   ├── evidence-node.js
│   │   │   ├── document-viewer.js
│   │   │   └── mission-briefing.js
│   │   ├── state/
│   │   │   └── store.js            # App state management
│   │   └── connection/
│   │       └── peer.js             # PeerJS host mode
│   ├── assets/
│   │   ├── sounds/
│   │   └── images/
│   └── sw.js                       # Service worker (cache assets)
│
├── agent/                          # Agent Device PWA (GitHub Pages: /cypher/agent/)
│   ├── index.html                  # Entry point
│   ├── manifest.json               # PWA manifest
│   ├── css/
│   │   └── styles.css              # Global styles
│   ├── js/
│   │   ├── app.js                  # Main application
│   │   ├── components/             # Lit web components
│   │   │   ├── app-shell.js
│   │   │   ├── agent-setup.js      # First-time account creation
│   │   │   ├── qr-scanner.js
│   │   │   ├── remote-control.js
│   │   │   ├── vault-viewer.js
│   │   │   └── decrypt-prompt.js
│   │   ├── db/
│   │   │   └── index.js            # Dexie.js schema & queries
│   │   ├── state/
│   │   │   └── store.js            # Game state management
│   │   ├── connection/
│   │   │   └── peer.js             # PeerJS client mode
│   │   └── crypto/
│   │       └── decrypt.js          # AES-GCM decryption
│   ├── assets/
│   │   └── icons/                  # PWA icons
│   └── sw.js                       # Service worker
│
├── shared/                         # Shared utilities (imported by both)
│   ├── protocol.js                 # Message type definitions
│   ├── constants.js                # Shared constants
│   └── utils.js                    # Common utilities
│
├── content/                        # Game content (for IPFS)
│   ├── chapters/
│   │   └── 01-browser-shield/
│   │       ├── manifest.json
│   │       ├── briefing.md.enc
│   │       └── evidence/
│   └── assets/
│
├── tools/                          # Development tools (Node.js)
│   ├── encrypt.js                  # Encrypt content for IPFS
│   ├── upload-ipfs.js              # Upload to IPFS/Pinata
│   └── dev-server.js               # Simple local server for dev
│
├── docs/
│   └── PROJECT_BRIEF.md            # This document
│
└── README.md
```

---

## Design Principles

### Visual Language

- **Dark terminal aesthetic**: Slate/charcoal backgrounds
- **Accent colors**: Emerald (secure), Amber (warning), Red (danger)
- **Typography**: Monospace fonts for "classified" feel
- **Effects**: Subtle scan lines, glitch effects, redacted text
- **Classification stamps**: CONFIDENTIAL, SECRET, EYES ONLY

### UX Principles

- **Mobile-first**: Core experience works on phone alone
- **PC enhances**: Large screen for complex visualizations
- **Offline-capable**: Game works without internet after initial load
- **No accounts**: No sign-up required, privacy by default
- **Progressive disclosure**: Complexity revealed gradually

### Thematic Consistency

The game's architecture should reinforce its message:

| Game Teaches | Architecture Demonstrates |
|--------------|--------------------------|
| Your data is yours | Data stored locally on device |
| Minimize exposure | PC never stores sensitive info |
| Decentralization | Content on IPFS, not central server |
| Encryption matters | All evidence files encrypted |
| Trust no terminal | Any PC is just a display |

---

## Development Phases

### Phase 1: Foundation
- [ ] Project scaffolding (Vite + Lit)
- [ ] Dexie.js database layer
- [ ] WebRTC connection manager
- [ ] Basic QR pairing flow
- [ ] State synchronization protocol

### Phase 2: Core Gameplay
- [ ] Evidence board visualization
- [ ] Document viewer component
- [ ] Mission briefing screen
- [ ] Mobile remote control
- [ ] Basic navigation flow

### Phase 3: Content System
- [ ] IPFS integration
- [ ] Encryption/decryption utilities
- [ ] Riddle → key derivation
- [ ] Content manifest system
- [ ] First chapter content

### Phase 4: Advanced Features
- [ ] Whistleblower chat system
- [ ] Trust/relationship mechanics
- [ ] Evidence connection logic
- [ ] Progress persistence
- [ ] Offline support (Service Worker)

### Phase 5: Polish
- [ ] Sound effects and feedback
- [ ] Animations and transitions
- [ ] Accessibility review
- [ ] Performance optimization
- [ ] Cross-browser testing

---

## First Chapter: "Operation Browser Shield"

### Synopsis

Intel suggests widespread citizen data harvesting through compromised browser extensions. The player must investigate ChromaTrack Inc. and document evidence of their "Project Panopticon" surveillance initiative.

### Objectives

1. Install a privacy-focused browser (Brave/Firefox)
2. Establish contact with whistleblower NIGHTINGALE
3. Collect and decrypt internal memos
4. Analyze tracking scripts found on partner sites
5. Build evidence case connecting all findings
6. Submit findings to EU oversight committee

### Educational Outcomes

- Understanding of browser fingerprinting
- Awareness of extension permissions
- Introduction to privacy-focused alternatives
- Basics of encrypted communication

---

## Initial Connection Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FIRST-TIME USER EXPERIENCE                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. USER OPENS PC TERMINAL                                             │
│     └── Visits https://[user].github.io/cypher/terminal/               │
│     └── Sees welcome screen with large QR code                         │
│     └── QR contains: URL to agent app + session ID                      │
│                                                                         │
│  2. USER SCANS QR WITH PHONE CAMERA                                    │
│     └── Native camera app opens link                                    │
│     └── Opens https://[user].github.io/cypher/agent/?session=XXX       │
│                                                                         │
│  3. MOBILE: AGENT CREATION (first time only)                           │
│     └── "Welcome, Agent. Create your identity."                        │
│     └── Choose codename (e.g., SHADOW, CIPHER, GHOST)                  │
│     └── Select avatar/icon                                              │
│     └── Saved to IndexedDB                                              │
│                                                                         │
│  4. MOBILE: ESTABLISH CONNECTION                                        │
│     └── PeerJS connects using session ID from QR                       │
│     └── WebRTC handshake completes                                      │
│     └── Mobile sends INIT_STATE to PC                                  │
│                                                                         │
│  5. PC: RECEIVES STATE, RENDERS UI                                     │
│     └── Shows "Agent [CODENAME] connected"                             │
│     └── Displays personalized HQ terminal                              │
│     └── Ready for gameplay                                              │
│                                                                         │
│  RETURNING USERS:                                                       │
│  └── Skip step 3 (agent already exists in IndexedDB)                   │
│  └── Straight to connection                                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Development Commands

No bundler needed! Just serve the files:

```bash
# Option 1: Python (built-in)
python -m http.server 8000

# Option 2: Node.js simple server
npx serve .

# Option 3: VS Code Live Server extension
# Just click "Go Live"

# Open in browser:
# Terminal: http://localhost:8000/terminal/
# Agent:    http://localhost:8000/agent/
```

### Content Tools (require Node.js)

```bash
# Encrypt a markdown file for IPFS
node tools/encrypt.js content/chapters/01/briefing.md

# Upload encrypted content to Pinata/IPFS
node tools/upload-ipfs.js content/chapters/01/
```

### Testing on Real Devices

```bash
# Find your local IP
ifconfig | grep "inet "  # Mac/Linux
ipconfig                  # Windows

# Access from phone on same network:
# http://192.168.x.x:8000/agent/
```

---

## Key Files to Understand

When starting work, familiarize yourself with:

1. `shared/protocol.js` - All message types between devices
2. `shared/constants.js` - Shared constants and configuration
3. `agent/js/db/index.js` - Database schema and queries
4. `agent/js/connection/peer.js` - Connection management (client)
5. `agent/js/state/store.js` - Game state management
6. `terminal/js/connection/peer.js` - Connection management (host)
7. `terminal/js/components/app-shell.js` - Main terminal UI

---

## Questions to Consider

- How do we verify real-world actions (browser installation)?
- Should multiplayer/co-op be supported?
- How to handle content updates (new chapters)?
- What analytics (if any) are acceptable?
- How to handle users without cameras (QR scanning)?

---

*This document serves as the source of truth for the CYPHER project. Update it as decisions are made and architecture evolves.*
