import { css } from 'https://esm.sh/lit@3';

export const terminalAppStyles = css`
    :host {
      display: block;
      height: 100vh;
      overflow: hidden;
      background: var(--nx-bg);
      color: var(--nx-fg);
      font-family: var(--nx-font);
    }

    /* ========== Desktop Layout ========== */
    .desktop {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }

    .desktop-area {
      flex: 1;
      position: relative;
      min-height: 0;
      overflow: hidden;
      z-index: 1;
      isolation: isolate;
    }

    /* Desktop background pattern */
    .desktop-area::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: var(--nx-pattern-scanlines);
      background-size: 100% 2px;
      opacity: 0.15;
      pointer-events: none;
    }

    .desktop-area[data-pattern="dither"]::before {
      background-image: var(--nx-dither);
      background-size: var(--nx-dither-size);
    }

    .desktop-area[data-pattern="grid"]::before {
      background-image: var(--nx-pattern-grid);
      background-size: var(--nx-pattern-grid-size);
    }

    .desktop-area[data-pattern="scanlines"]::before {
      background-image: var(--nx-pattern-scanlines);
      background-size: var(--nx-pattern-scanlines-size);
    }

    .desktop-area[data-pattern="matrix"]::before {
      background-image:
        linear-gradient(var(--nx-primary) 0.5px, transparent 0.5px),
        linear-gradient(90deg, var(--nx-primary) 0.5px, transparent 0.5px);
      background-size: 20px 20px;
    }

    .desktop-area[data-pattern="hex"]::before {
      background-image: radial-gradient(var(--nx-primary) 1px, transparent 1px);
      background-size: 16px 16px;
    }

    .desktop-area[data-pattern="none"]::before {
      background-image: none;
    }

    /* Icon grids */
    .icon-grid {
      position: absolute;
      display: flex;
      flex-direction: column;
      gap: 2.5rem;
      padding: 1.5rem;
      z-index: 1;
    }

    .icon-grid.left { left: 0; }
    .icon-grid.right { right: 0; }

    /* Window layer */
    .window-layer {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .window-layer nexus-window {
      pointer-events: auto;
    }

    /* ========== Entry Animations ========== */
    nexus-header {
      opacity: 0;
      transform: translateY(-100%);
      transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1),
                  opacity 0.4s ease-out;
    }

    nexus-header.ready {
      opacity: 1;
      transform: translateY(0);
    }

    nexus-dock {
      opacity: 0;
      transition: opacity 0.6s ease-out 0.2s;
    }

    nexus-dock.ready {
      opacity: 1;
    }

    nexus-desktop-icon {
      opacity: 0;
      transform: scale(0.9);
      transition: opacity 0.4s ease-out, transform 0.4s ease-out;
    }

    nexus-desktop-icon.ready {
      opacity: 1;
      transform: scale(1);
    }

    /* ========== CRT Overlay ========== */
    .crt-overlay {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9999;
      background: repeating-linear-gradient(
        0deg,
        rgba(0, 0, 0, 0.1) 0px,
        rgba(0, 0, 0, 0.1) 1px,
        transparent 1px,
        transparent 2px
      );
      opacity: 0;
      transition: opacity 0.3s;
    }

    .crt-overlay.active { opacity: 1; }

    .crt-toggle {
      background: none;
      border: var(--nx-thin) solid var(--nx-primary-dim);
      color: var(--nx-primary);
      padding: 4px 8px;
      font-family: var(--nx-font);
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.15s, background 0.15s;
    }

    .crt-toggle:hover {
      opacity: 1;
      background: var(--nx-primary-dim);
    }

    .crt-toggle.active {
      background: var(--nx-primary);
      color: var(--nx-bg);
      opacity: 1;
    }

    /* ========== Header extras ========== */
    .status-text {
      font-size: var(--nx-text-sm);
      color: var(--nx-fg-dim);
      letter-spacing: 0.05em;
    }

    .status-text.online { color: var(--nx-primary); }

    .header-right {
      display: flex;
      align-items: center;
      gap: var(--nx-md);
    }

    /* ========== Locked Screen ========== */
    .locked {
      position: fixed;
      inset: 0;
      z-index: 5000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      gap: var(--nx-lg);
      padding: var(--nx-xl);
      background: var(--nx-bg);
    }

    .locked-icon {
      font-size: 3rem;
      color: var(--nx-fg-muted);
    }

    .locked h2 {
      color: var(--nx-fg-dim);
      letter-spacing: 0.1em;
      text-transform: uppercase;
      font-size: var(--nx-text-lg);
      margin: 0;
    }

    .locked p {
      color: var(--nx-fg-muted);
      font-size: var(--nx-text-sm);
      text-align: center;
      max-width: 300px;
    }

    /* ========== Config Window Styles ========== */
    .setup-section {
      margin-bottom: var(--nx-lg);
    }

    .setup-title {
      font-size: var(--nx-text-sm);
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: var(--nx-md);
      padding-bottom: var(--nx-xs);
      border-bottom: var(--nx-thin) solid var(--nx-border);
      letter-spacing: 0.1em;
      color: var(--nx-primary);
    }

    .pattern-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--nx-sm);
    }

    .pattern-preview {
      aspect-ratio: 1;
      border: var(--nx-thin) solid var(--nx-border);
      cursor: pointer;
      position: relative;
      background-color: var(--nx-bg);
      transition: all 0.15s;
    }

    .pattern-preview[data-pattern="dither"] {
      background-image: var(--nx-dither);
      background-size: var(--nx-dither-size);
    }
    .pattern-preview[data-pattern="grid"] {
      background-image: var(--nx-pattern-grid);
    }
    .pattern-preview[data-pattern="scanlines"] {
      background-image: var(--nx-pattern-scanlines);
    }
    .pattern-preview[data-pattern="matrix"] {
      background-image:
        linear-gradient(var(--nx-primary) 0.5px, transparent 0.5px),
        linear-gradient(90deg, var(--nx-primary) 0.5px, transparent 0.5px);
      background-size: 10px 10px;
    }
    .pattern-preview[data-pattern="hex"] {
      background-image: radial-gradient(var(--nx-primary) 1px, transparent 1px);
      background-size: 8px 8px;
    }

    .pattern-preview:hover { box-shadow: var(--nx-glow); }
    .pattern-preview.active {
      outline: 2px solid var(--nx-primary);
      outline-offset: 2px;
    }

    .pattern-label {
      position: absolute;
      bottom: 2px;
      left: 2px;
      font-size: 7px;
      background: var(--nx-bg);
      border: var(--nx-thin) solid var(--nx-border);
      padding: 1px 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--nx-fg-dim);
    }

    /* ========== Comms Window ========== */
    .comms-panel {
      padding: var(--nx-md);
      font-family: var(--nx-font);
    }

    .comms-header {
      text-align: center;
      margin-bottom: var(--nx-lg);
    }

    .comms-title {
      font-size: 14px;
      font-weight: bold;
      color: var(--nx-primary);
      text-shadow: var(--nx-glow);
      margin-bottom: var(--nx-sm);
    }

    .comms-subtitle {
      font-size: 11px;
      color: var(--nx-fg-dim);
    }

    .comms-stats {
      background: var(--nx-bg-raised);
      border: var(--nx-thin) solid var(--nx-border);
      padding: var(--nx-md);
      margin-bottom: var(--nx-md);
    }

    .comms-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: var(--nx-sm);
      font-size: 11px;
    }

    .comms-row:last-child { margin-bottom: 0; }
    .comms-label { color: var(--nx-fg-dim); }
    .comms-value { color: var(--nx-fg); }
    .comms-value.highlight { color: var(--nx-primary); }

    .comms-empty {
      text-align: center;
      color: var(--nx-fg-muted);
      font-size: 12px;
      padding: var(--nx-md);
    }

    /* ========== Agent Status Window ========== */
    .agent-status-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--nx-lg);
      gap: var(--nx-md);
      font-family: var(--nx-font);
    }

    .agent-avatar {
      width: 80px;
      height: 80px;
      border: var(--nx-thick) solid var(--nx-primary);
      box-shadow: var(--nx-glow-lg);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--nx-bg);
    }

    .agent-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      image-rendering: pixelated;
    }

    .agent-avatar-placeholder {
      font-size: 28px;
      color: var(--nx-fg-muted);
    }

    .agent-codename {
      font-size: 18px;
      font-weight: bold;
      color: var(--nx-primary);
      text-shadow: var(--nx-glow);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .agent-level {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--nx-fg-dim);
      border: var(--nx-thin) solid var(--nx-border);
      padding: 4px 12px;
    }

    .agent-details {
      width: 100%;
      background: var(--nx-bg-raised);
      border: var(--nx-thin) solid var(--nx-border);
      padding: var(--nx-md);
      margin-top: var(--nx-sm);
    }

    .agent-detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: var(--nx-sm);
      font-size: 11px;
    }

    .agent-detail-row:last-child { margin-bottom: 0; }
    .agent-detail-label { color: var(--nx-fg-dim); }
    .agent-detail-value { color: var(--nx-fg); }
    .agent-detail-value.online { color: var(--nx-primary); }

    /* Preview content */
    .preview-content { padding: var(--nx-md); }
    .preview-header {
      margin-bottom: var(--nx-md);
      padding-bottom: var(--nx-sm);
      border-bottom: var(--nx-thin) solid var(--nx-border);
    }
    .preview-title {
      font-size: 16px;
      font-weight: bold;
      color: var(--nx-primary);
      margin-bottom: var(--nx-xs);
      text-shadow: var(--nx-glow);
    }
    .preview-meta {
      display: flex;
      gap: var(--nx-md);
      font-size: 10px;
      color: var(--nx-fg-dim);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .preview-classification {
      padding: 2px 8px;
      border: var(--nx-thin) solid var(--nx-primary);
      font-size: 9px;
      font-weight: bold;
      letter-spacing: 0.1em;
      color: var(--nx-primary);
    }
    .preview-classification.secret {
      background: var(--nx-primary);
      color: var(--nx-bg);
    }
    .preview-body {
      font-size: 13px;
      line-height: 1.7;
      color: var(--nx-fg);
    }
    .preview-body p { margin-bottom: var(--nx-sm); }
    .preview-body .redacted {
      background: var(--nx-fg-muted);
      color: var(--nx-fg-muted);
      padding: 0 4px;
      border-radius: 2px;
      user-select: none;
    }
    .preview-tags {
      display: flex;
      flex-wrap: wrap;
      gap: var(--nx-sm);
      margin-top: var(--nx-md);
      padding-top: var(--nx-md);
      border-top: var(--nx-thin) solid var(--nx-border);
    }
    .preview-tag {
      padding: 4px 10px;
      border: var(--nx-thin) solid var(--nx-border);
      font-size: 10px;
      color: var(--nx-fg-dim);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .preview-actions {
      margin-top: var(--nx-lg);
      display: flex;
      gap: var(--nx-sm);
    }

    /* System info in config */
    .sys-info {
      font-size: 12px;
      line-height: 1.8;
      color: var(--nx-fg-dim);
    }

    .sys-info .val { color: var(--nx-primary); }
`;
