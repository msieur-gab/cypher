# NEXUS Design Decisions

This document captures the key design, UX, UI, and technical decisions made during the development of NEXUS. Useful for portfolio presentation and onboarding.

---

## Project Identity

### Name: NEXUS (formerly CYPHER)

**Decision:** Renamed from CYPHER to NEXUS.

**Rationale:**
- "Nexus" means connection/link - fits the P2P two-device architecture
- The player becomes the "nexus" of their own privacy
- Game is about linking data, finding relationships, understanding causality
- Nostalgic connection to Google Nexus devices (pure Android, user control, openness)
- Thematically aligned with data sovereignty and privacy education

---

## Design System

### Token Architecture

**Decision:** Lean token system with `--nx-*` prefix, inspired by Suimo.

**Before (too verbose):**
```css
--cypher-text-bright, --cypher-text, --cypher-text-dim,
--cypher-text-muted, --cypher-text-faint, --cypher-text-ghost
```

**After (minimal):**
```css
--nx-fg, --nx-fg-dim, --nx-fg-muted
--nx-bg, --nx-bg-raised
--nx-primary, --nx-primary-dim, --nx-primary-glow
```

**Rationale:**
- Simpler mental model: fg/bg + primary accent
- Faster to type and remember
- Hierarchy through opacity, not hue
- Easy theme switching (change primary only)

### Naming Convention

**Decision:** Hybrid naming approach.

| Context | Format | Example |
|---------|--------|---------|
| Custom elements | Full name | `nexus-button` |
| CSS tokens | Short prefix | `--nx-primary` |
| Files | Match element | `nexus-button.js` |

**Rationale:**
- Elements are readable in HTML markup
- Tokens are frequently typed, brevity matters
- File names match component names for easy navigation

---

## Visual Design

### Color Philosophy

**Decision:** Single primary color + grayscale only.

**Primary:** `#00FFCC` (cyan/teal)
**Foreground:** White to gray scale
**Background:** Black to dark gray scale

**Rationale:**
- Cyberpunk aesthetic with minimal palette
- Easy theme management (swap primary for different themes)
- Tested Matrix green (`#00FF41`) as alternate theme
- High contrast for accessibility

### Dither Effects

**Decision:** Use dither patterns for hover states instead of solid colors.

```css
background-image: repeating-conic-gradient(
  var(--nx-bg) 0% 25%,
  transparent 0% 50%
);
background-size: 2px 2px;
```

**Rationale:**
- Retro/terminal aesthetic
- More interesting than flat color changes
- Low performance impact (GPU-accelerated)
- Consistent with the hacker/terminal theme

### Typography

**Decision:** Monospace-only typography.

**Font stack:** `'Courier New', Consolas, monospace`

**Rationale:**
- Terminal/hacker aesthetic
- No font loading required (system fonts)
- Consistent character width aids layout
- Reinforces the "dumb terminal" narrative

---

## Component Architecture

### Icons Approach

**Decision:** Use Lit's `svg` tagged template literal, no `unsafeSVG`.

**Suimo approach (external SVG, needs unsafe):**
```js
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
html`<svg>${unsafeSVG(icons[name])}</svg>`
```

**NEXUS approach (controlled, simpler):**
```js
import { svg } from 'lit';
export const icons = {
  close: svg`<path stroke="currentColor" d="M18 6L6 18M6 6l12 12"/>`,
};
// Usage
html`<svg viewBox="0 0 24 24">${icons.close}</svg>`
```

**Rationale:**
- We control all icons (no external/untrusted SVG)
- Cleaner API without unsafe directive
- Proper SVG namespace handling
- Icons inherit `currentColor` from parent

### Window Component

**Decision:** Single `nexus-window` component handles all window behaviors.

**Features:**
- Draggable by title bar
- Resizable from corner handle
- Fullscreen toggle (saves/restores position)
- Dither shadow effect
- Close event
- Focus management (z-index)

**Attributes:**
```html
<nexus-window
  title="Intel Browser"
  x="100" y="100"
  width="400" height="300"
  min-width="200" min-height="150"
  no-resize
  no-shadow
></nexus-window>
```

**Events:**
- `close` - when close button clicked
- `focus-window` - when window should come to front

**Rationale:**
- Single component encapsulates window management
- CSS-only visual effects (dither shadow, gradients)
- Works as standalone or managed by window manager

### Button Variants

**Decision:** Three variants: primary, secondary, ghost.

| Variant | Use Case |
|---------|----------|
| Primary | Main actions, CTAs |
| Secondary | Alternative actions |
| Ghost | Subtle/toolbar actions |

**Rationale:**
- Covers 95% of button use cases
- Clear visual hierarchy
- Matches Suimo's proven pattern

---

## Two-Device Architecture

### Device Roles

**Decision:** Strict separation of concerns.

| Device | Role | Stores |
|--------|------|--------|
| Mobile (Agent) | Source of truth | All game state, keys, profile |
| PC (Terminal) | Display only | Nothing persistent |

**Rationale:**
- Practices what it teaches (data sovereignty)
- Mobile is always with the user
- PC can be public/shared without risk
- Demonstrates decentralized architecture

### Communication

**Decision:** WebRTC P2P via PeerJS, no central server.

**Rationale:**
- True peer-to-peer, no intermediary
- Works on local network (offline capable)
- Demonstrates decentralized communication
- Educational: shows alternative to client-server

---

## UX Patterns

### Terminal UI (Desktop)

**Key patterns:**
- Window system with drag/resize
- Two-pane list-detail for file browser
- Boot sequence animation
- CRT scanline overlay effect
- Dock at bottom for quick actions

**Inspiration:** Classic OS interfaces, Eva OS, retro terminals

### Agent UI (Mobile)

**Key patterns:**
- Boot sequence with terminal log
- Swipe-to-unlock lock screen
- Icon grid for navigation
- Full-screen app views
- Bottom dock navigation
- Haptic feedback on interactions

**Inspiration:** Retro Pocket OS, mobile-first design

### Consistency

**Decision:** Share visual language between terminal and agent.

- Same color tokens
- Same typography
- Same button styles
- Same icon set
- Theme toggle on both

**Rationale:**
- Feels like one coherent system
- Components can be reused
- Easier to maintain

---

## Technical Decisions

### No Build Step

**Decision:** Pure ES Modules, CDN dependencies.

```js
import { LitElement, html, css } from 'https://esm.sh/lit@3';
```

**Rationale:**
- Zero configuration
- Instant development start
- Works on any static host
- Educational: shows modern browser capabilities

### Lit Framework

**Decision:** Use Lit for web components.

**Rationale:**
- Small footprint (~5KB)
- Native web components (no framework lock-in)
- Reactive properties
- Scoped CSS in shadow DOM
- Works without build step

### Storage Strategy

**Decision:** IndexedDB via Dexie.js on mobile only.

**Rationale:**
- Large storage capacity
- Structured data support
- Works offline
- Dexie provides clean Promise-based API
- Terminal stores nothing (by design)

---

## Future Considerations

### IPFS Integration
Planned for decentralized content distribution. Game files stored on IPFS, retrieved by CID.

### Encryption Layer
AES-GCM encryption for sensitive game data. Keys stay on mobile device only.

### Theming
Single primary color makes theming trivial. Potential themes:
- Cyan (default)
- Matrix green
- Amber (retro terminal)
- Custom user colors

---

## References & Inspiration

- **Suimo Design System** - Lean token architecture, e-ink optimization
- **Google Nexus** - Pure, user-controlled devices
- **Eva OS** - Terminal UI aesthetic
- **Cyberpunk genre** - Visual language, narrative themes
- **Privacy-first apps** - Signal, Proton, etc.
