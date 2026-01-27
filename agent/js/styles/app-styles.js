import { css } from 'https://esm.sh/lit@3';

export const agentAppStyles = css`
    :host {
      display: block;
      height: 100vh;
      height: 100dvh;
      overflow: hidden;
      background: var(--nx-bg);
      color: var(--nx-fg);
      font-family: var(--nx-font);
    }

    .agent-app {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    /* ========== Loading ========== */
    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--nx-fg-dim);
      font-size: var(--nx-text-sm);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    /* ========== Setup View ========== */
    .setup-view {
      position: fixed;
      inset: 0;
      background: var(--nx-bg);
      z-index: 2000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--nx-lg);
    }

    .setup-title {
      font-size: 24px;
      font-weight: bold;
      color: var(--nx-primary);
      text-shadow: var(--nx-glow);
      margin-bottom: var(--nx-xs);
    }

    .setup-subtitle {
      font-size: 11px;
      color: var(--nx-fg-dim);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: var(--nx-xl);
    }

    .setup-form {
      width: 100%;
      max-width: 280px;
    }

    .setup-form .form-group {
      margin-bottom: var(--nx-md);
    }

    .setup-form .form-label {
      display: block;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--nx-fg-dim);
      margin-bottom: var(--nx-xs);
    }

    .setup-badge {
      display: inline-block;
      background: var(--nx-primary);
      color: var(--nx-bg);
      padding: 4px 12px;
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin: var(--nx-md) 0;
    }

    /* ========== Lock Screen ========== */
    .lock-screen {
      position: fixed;
      inset: 0;
      background: var(--nx-bg);
      z-index: 1500;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .lock-time {
      font-size: 4rem;
      font-weight: bold;
      color: var(--nx-primary);
      text-shadow: var(--nx-glow-lg);
      margin-bottom: var(--nx-xs);
    }

    .lock-date {
      font-size: 11px;
      color: var(--nx-fg-dim);
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin-bottom: var(--nx-xl);
    }

    .lock-avatar {
      margin-bottom: var(--nx-md);
    }

    .lock-codename {
      font-size: 14px;
      font-weight: bold;
      color: var(--nx-fg);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: var(--nx-xl);
    }

    .lock-status {
      font-size: 9px;
      color: var(--nx-fg-muted);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: var(--nx-lg);
    }

    /* Swipe track */
    .swipe-track {
      width: 200px;
      height: 44px;
      border: var(--nx-thin) solid var(--nx-primary);
      display: flex;
      align-items: center;
      padding: 4px;
      position: relative;
    }

    .swipe-handle {
      width: 36px;
      height: 36px;
      background: var(--nx-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--nx-bg);
      font-size: 14px;
      cursor: pointer;
      box-shadow: var(--nx-glow);
      touch-action: none;
      user-select: none;
    }

    .swipe-text {
      position: absolute;
      width: 100%;
      text-align: center;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--nx-fg-muted);
      pointer-events: none;
    }

    /* ========== Main UI ========== */
    .main-ui {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    /* Status bar */
    .status-bar {
      height: 36px;
      background: var(--nx-bg);
      border-bottom: var(--nx-thin) solid var(--nx-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--nx-md);
      font-size: 11px;
      flex-shrink: 0;
    }

    .status-bar .system-name {
      display: flex;
      align-items: center;
      gap: var(--nx-xs);
      font-weight: bold;
      letter-spacing: 0.1em;
      color: var(--nx-primary);
    }

    .status-bar .clock {
      color: var(--nx-fg-dim);
    }

    .disconnect-btn {
      --nx-fg-dim: var(--nx-danger, #ff4444);
    }

    /* Main area */
    .main-area {
      flex: 1;
      overflow-y: auto;
      padding: var(--nx-lg);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Icon grid */
    .icon-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--nx-lg);
      max-width: 300px;
      justify-items: center;
    }

    /* Profile content */
    .profile-card {
      text-align: center;
      padding: var(--nx-md);
    }

    .profile-codename {
      font-size: 20px;
      font-weight: bold;
      margin-top: var(--nx-md);
    }

    .profile-level {
      font-size: 10px;
      color: var(--nx-fg-dim);
      text-transform: uppercase;
    }

    .profile-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--nx-md);
      text-align: center;
    }

    nexus-card {
      margin-top: var(--nx-lg);
    }

    .stat-value {
      font-size: 20px;
      font-weight: bold;
      color: var(--nx-primary);
    }

    .stat-label {
      font-size: 9px;
      color: var(--nx-fg-muted);
      text-transform: uppercase;
    }

    /* Intel list */
    .intel-item {
      border: var(--nx-thin) solid var(--nx-border);
      padding: var(--nx-md);
      margin-bottom: var(--nx-sm);
      cursor: pointer;
      transition: border-color 0.15s;
    }

    .intel-item:active {
      border-color: var(--nx-primary);
    }

    .intel-item-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: var(--nx-xs);
    }

    .intel-item-name {
      font-size: 12px;
      font-weight: bold;
    }

    .intel-item-badge {
      font-size: 9px;
      padding: 2px 6px;
      border: var(--nx-thin) solid var(--nx-primary);
      text-transform: uppercase;
    }

    .intel-item-meta {
      font-size: 10px;
      color: var(--nx-fg-muted);
    }

    /* Settings */
    .settings-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--nx-md) 0;
      border-bottom: var(--nx-thin) solid var(--nx-border);
    }

    .settings-label { font-size: 12px; }
    .settings-value { font-size: 11px; color: var(--nx-fg-dim); }

    /* Comms empty state */
    .comms-empty {
      text-align: center;
      padding: var(--nx-xl);
      color: var(--nx-fg-muted);
    }

    .comms-empty svg {
      margin-bottom: var(--nx-md);
      opacity: 0.4;
    }

    .comms-empty-title {
      font-size: 11px;
      text-transform: uppercase;
    }

    .comms-empty-sub {
      font-size: 10px;
      margin-top: var(--nx-sm);
    }

    /* Scanner content */
    .scanner-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--nx-lg);
    }

    .scanner-hint {
      font-size: 11px;
      color: var(--nx-fg-dim);
      text-align: center;
      margin-top: var(--nx-md);
    }

    /* ========== Vault Activation ========== */
    .vault-content {
      padding: var(--nx-lg);
      text-align: center;
    }

    .vault-title {
      font-size: 14px;
      font-weight: bold;
      color: var(--nx-primary);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: var(--nx-sm);
    }

    .vault-desc {
      font-size: 11px;
      color: var(--nx-fg-dim);
      margin-bottom: var(--nx-lg);
      line-height: 1.6;
    }

    .vault-warning {
      font-size: 10px;
      color: var(--nx-danger, #ff4444);
      border: var(--nx-thin) solid var(--nx-danger, #ff4444);
      padding: var(--nx-sm) var(--nx-md);
      margin-bottom: var(--nx-lg);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .mnemonic-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--nx-sm);
      margin-bottom: var(--nx-lg);
      text-align: left;
    }

    .mnemonic-word {
      font-size: 12px;
      padding: var(--nx-xs) var(--nx-sm);
      border: var(--nx-thin) solid var(--nx-border);
      background: var(--nx-bg-raised);
    }

    .mnemonic-word .num {
      color: var(--nx-fg-muted);
      font-size: 9px;
      margin-right: var(--nx-xs);
    }

    .vault-did {
      font-size: 9px;
      color: var(--nx-primary);
      word-break: break-all;
      padding: var(--nx-sm);
      border: var(--nx-thin) solid var(--nx-primary);
      margin-bottom: var(--nx-md);
      text-align: left;
      font-family: var(--nx-font);
    }

    .vault-did-label {
      font-size: 9px;
      color: var(--nx-fg-muted);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: var(--nx-xs);
    }

    .vault-check {
      font-size: 32px;
      color: var(--nx-primary);
      text-shadow: var(--nx-glow-lg);
      margin-bottom: var(--nx-md);
    }

    /* Override nexus-dock to sit in the flex layout */
    nexus-dock {
      position: relative;
      left: auto;
      right: auto;
      bottom: auto;
      z-index: auto;
      pointer-events: auto;
    }
`;
