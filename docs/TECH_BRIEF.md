# CYPHER - Technical Brief

## Architecture

```
┌──────────────┐         WebRTC (P2P)         ┌──────────────┐
│   TERMINAL   │◄────────────────────────────►│    AGENT     │
│     (PC)     │                              │   (Phone)    │
└──────────────┘                              └──────────────┘
     │                                              │
     │ QR Code contains:                            │
     │ URL + Session ID                             │
     └──────────────────────────────────────────────┘
```

## Connection Flow

1. Terminal generates session ID, displays QR
2. Phone scans QR → opens Agent app with session ID
3. Agent connects to Terminal via PeerJS (WebRTC)
4. Bidirectional communication established

## Tech Stack

| Component | Technology |
|-----------|------------|
| UI | Lit (ES modules via CDN) |
| P2P | PeerJS |
| Storage | Dexie.js (IndexedDB) |
| QR | qrcode library |
| Hosting | GitHub Pages |

## Folder Structure

```
cypher/
├── terminal/     # PC app
├── agent/        # Phone app  
├── shared/       # Protocol
└── docs/         # Briefs
```

## Data Principle

- **Agent** = source of truth (stores all game state)
- **Terminal** = display only (receives state, sends UI events)

## Message Protocol

```
Agent → Terminal: INIT_STATE, STATE_UPDATE, CONTENT_RESPONSE
Terminal → Agent: UI_EVENT, REQUEST_CONTENT
Both: PING/PONG, DISCONNECT
```
