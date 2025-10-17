# UI Redesign - Rectangular Table Layout

## Overview

This document outlines the requirements and architecture for redesigning the poker table UI from an ellipse-based layout to a rectangular table with edge-based player positioning.

## Design References

- **Desktop/Standard**: Players positioned along left/right/top edges, center area with vertical stack
- **Mobile**: Same edge-based positioning with scaled-down elements

## Requirements

### Visual Design

1. **Table Shape**
   - Change from ellipse to rounded rectangle
   - Maintain poker table aesthetic with border and felt texture

2. **Player Display**
   - **Remove player names entirely** - show only avatars and token history
   - Position players along table edges (left, top, right)
   - Each player: Avatar + token history row (no name labels)
   - Token history displayed horizontally next to/below avatar

3. **Center Area Layout**
   - Vertical flex column, centered
   - Top: Unowned tokens pool (no "POT" label)
   - Middle: Community cards (no "COMMUNITY CARDS" label)
   - Bottom: Current player's hand section

4. **Current Player Hand Section**
   - Container with border/highlight (distinct from other players)
   - Token history row (if applicable)
   - Hole cards displayed horizontally
   - **Hand strength text below hole cards** (e.g., "High Card, Q")
   - Ready/Proceed button below hand strength text

5. **Action Buttons**
   - Ready button (READY_UP phase)
   - Proceed/Next Turn button (TOKEN_TRADING phase)
   - Position: Below community cards in center area

6. **Labels**
   - No "POT" label above unowned tokens
   - No "COMMUNITY CARDS" label above community cards
   - No "YOUR HAND" label (visual distinction via border is sufficient)

### Reusable Components

- **Keep existing card design** (`cardRenderer.js`)
- **Keep existing token design** (`tokenRenderer.js`)
- **Keep existing avatar design** (`avatarManager.js`)

## HTML Structure

```html
<div class="poker-table-container">
  <div class="poker-table-border">
    <div class="poker-table">

      <!-- Players positioned around perimeter (no names) -->
      <div id="player-positions">
        <!-- Each player: avatar + token history only -->
      </div>

      <!-- Center area (flex column, centered) -->
      <div class="table-center">

        <!-- Unowned tokens pool (no label) -->
        <div id="token-area"></div>

        <!-- Community cards (no label) -->
        <div id="community-cards"></div>

        <!-- Action buttons (ready/proceed) -->
        <div id="action-buttons">
          <button id="ready-button">Ready</button>
          <button id="proceed-button">Proceed</button>
        </div>

        <!-- Player's hand section (highlighted) -->
        <div class="player-hand-section">
          <div id="player-token-history"></div>
          <div id="player-cards"></div>
          <div id="hand-strength-text"></div>
        </div>

      </div>

    </div>
  </div>
</div>
```

## CSS Architecture

### Desktop Layout

#### Table Shape
```css
.poker-table-border {
  border-radius: 20px; /* Rounded rectangle, not ellipse */
  aspect-ratio: 16/10; /* Rectangular aspect ratio */
}

.poker-table {
  border-radius: inherit;
  /* Remove ellipse-specific styling */
}
```

#### Player Positioning (Edge-Based)

Players distributed along three edges based on count:

```css
/* Left edge players (stacked vertically) */
.player-left-0 {
  position: absolute;
  left: 5%;
  top: 20%;
}

.player-left-1 {
  position: absolute;
  left: 5%;
  top: 50%;
}

/* Top edge players (horizontal row) */
.player-top-0 {
  position: absolute;
  top: 5%;
  left: 30%;
}

.player-top-1 {
  position: absolute;
  top: 5%;
  left: 50%;
}

/* Right edge players (stacked vertically) */
.player-right-0 {
  position: absolute;
  right: 5%;
  top: 30%;
}

.player-right-1 {
  position: absolute;
  right: 5%;
  top: 60%;
}
```

#### Center Layout
```css
.table-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 60%;
  max-width: 600px;
}

#token-area {
  display: flex;
  gap: 12px;
  justify-content: center;
}

#community-cards {
  display: flex;
  gap: 8px;
  justify-content: center;
}

#action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}
```

#### Player Hand Section
```css
.player-hand-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  border: 2px solid rgba(212, 175, 55, 0.5); /* Gold border */
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.2);
}

#player-cards {
  display: flex;
  gap: 8px;
}

#hand-strength-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-gold);
  text-align: center;
}
```

### Mobile Layout

Same structure, with adjustments:

```css
@media (max-width: 768px) {
  .table-center {
    width: 80%;
    gap: 12px;
  }

  /* Tighter spacing for mobile */
  #token-area {
    gap: 6px;
  }

  #community-cards {
    gap: 4px;
  }

  .player-hand-section {
    padding: 12px 16px;
    gap: 8px;
  }

  /* Edge player positions scaled */
  .player-left-0 {
    left: 3%;
    top: 25%;
  }

  .player-right-0 {
    right: 3%;
    top: 25%;
  }

  .player-top-0 {
    top: 3%;
  }
}
```

## Migration Strategy

### Phase 1: Update Table Shape
1. Change `.poker-table-border` from ellipse to rounded rectangle
2. Update aspect ratio and border-radius
3. Remove ellipse-specific CSS (e.g., `border-radius: 50%`)

### Phase 2: Refactor Player Positioning
1. **Remove semicircle positioning logic** from `playerRenderer.js`
   - Remove all `translate(-X%, -Y%)` transforms
   - Remove data-attribute-based positioning
2. **Implement edge-based positioning**
   - Calculate which edge (left, top, right) based on player index and total count
   - Distribute players evenly along each edge
   - Algorithm:
     - 2 players: top-left, top-right
     - 3 players: top-left, top-center, top-right
     - 4 players: top-left, top-right, left, right
     - 5 players: top-left, top-center, top-right, left, right
     - 6-8 players: distribute across left (2), top (2-4), right (2)
3. **Remove player names** from rendering
   - Update `renderPlayers()` to exclude name elements
   - Keep only avatar and token history

### Phase 3: Restructure Center Area
1. **Create `.table-center` container** in `index.html`
2. **Move elements into vertical stack**:
   - Move `#token-area` into `.table-center` (top)
   - Move `#community-cards` into `.table-center` (middle)
   - Move `#action-buttons` into `.table-center` (middle-bottom)
   - Create `.player-hand-section` in `.table-center` (bottom)
3. **Update `gameController.js`** to render into new structure

### Phase 4: Update Player Hand Display
1. **Move player's token history** from separate container to `.player-hand-section`
2. **Reposition hand strength text** below hole cards (currently positioned elsewhere)
3. **Move ready/proceed buttons** from `#action-buttons` to below community cards
4. **Add border/highlight** to `.player-hand-section`

### Phase 5: Clean Up Labels
1. Remove "POT" label above `#token-area`
2. Remove "COMMUNITY CARDS" label above `#community-cards`
3. Remove "YOUR HAND" label (if exists)
4. Ensure phase indicator remains hidden (already done)

### Phase 6: Mobile Responsive
1. Update mobile breakpoints for new layout
2. Scale down edge positions (closer to table edges)
3. Reduce gaps and padding in `.table-center`
4. Test player positioning with 2-8 players on mobile

## Files to Modify

### Primary Changes
- `src/browser/playerRenderer.js` - Refactor positioning logic, remove names
- `src/browser/gameController.js` - Update rendering to new structure
- `index.html` - Restructure center area HTML

### Secondary Changes
- `src/browser/turnFlow.js` - Update button positioning logic (if applicable)
- End game screen - May need layout updates for consistency

### No Changes Needed
- `src/browser/cardRenderer.js` - Keep as-is
- `src/browser/tokenRenderer.js` - Keep as-is
- `src/browser/avatarManager.js` - Keep as-is

## Testing Checklist

- [ ] Desktop: 2-8 players positioned correctly on edges
- [ ] Mobile: 2-8 players positioned correctly on edges (scaled)
- [ ] Center stack: tokens → community cards → buttons → player hand
- [ ] Hand strength text appears below player's hole cards
- [ ] Ready/Proceed buttons appear below community cards
- [ ] No labels for "POT", "COMMUNITY CARDS", "YOUR HAND"
- [ ] No player names displayed anywhere
- [ ] Token history displays correctly for all players
- [ ] Visual distinction clear between player's hand and others
- [ ] All 299 tests still pass
- [ ] Type checking clean
