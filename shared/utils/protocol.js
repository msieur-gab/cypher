/**
 * CYPHER Protocol - Message types for Agent ↔ Terminal communication
 */

// Agent → Terminal
export const MSG = {
  // Connection
  INIT_STATE: 'INIT_STATE',       // Agent sends profile on connect
  STATE_UPDATE: 'STATE_UPDATE',   // Agent state changed
  PONG: 'PONG',                   // Response to heartbeat

  // Commands
  COMMAND: 'COMMAND',             // Agent sends command to terminal

  // File system
  FILE_REQUEST: 'FILE_REQUEST',   // Agent requests file content
};

// Terminal → Agent
export const TERM_MSG = {
  WELCOME: 'WELCOME',             // Terminal acknowledges connection
  HEARTBEAT: 'HEARTBEAT',         // Keep-alive ping

  // File system responses
  FILE_CONTENT: 'FILE_CONTENT',   // Terminal sends file to agent
  DIR_LISTING: 'DIR_LISTING',     // Terminal sends directory listing
  CMD_OUTPUT: 'CMD_OUTPUT',       // Terminal sends command output
  CMD_ERROR: 'CMD_ERROR',         // Terminal sends error message
};

// Connection states
export const STATE = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  LOCKED: 'locked',
};

// Heartbeat config
export const HEARTBEAT = {
  INTERVAL: 3000,   // Send heartbeat every 3s
  TIMEOUT: 10000,   // Disconnect after 10s without response
};
