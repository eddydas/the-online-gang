# P2P Message Protocol

This document describes the peer-to-peer messaging protocol used for game state synchronization between players.

## Message Structure

All messages follow this standard structure:

```javascript
{
  type: string,      // Message type identifier
  payload: any,      // Message-specific data
  timestamp: number  // Unix timestamp in milliseconds
}
```

## Message Types

### Game State Management

#### `STATE_UPDATE`
**Purpose:** Broadcast complete game state from host to all clients

**Sent by:** Host only

**Payload:**
```javascript
{
  phase: string,           // Current game phase
  turn: number,           // Current turn (1-4)
  players: Player[],      // All players with their data
  deck: Card[],           // Remaining deck
  communityCards: Card[], // Community cards on table
  tokens: Token[],        // All tokens and their owners
  readyStatus: Object,    // Ready status per player
  cardBackColor: string   // Card back color for this game
}
```

**When:**
- After any game state changes
- When a new client connects
- Periodically for sync verification

---

### Player Management

#### `PLAYER_JOIN`
**Purpose:** Notify all peers that a new player has joined

**Sent by:** Host (after client connects)

**Payload:**
```javascript
{
  playerId: string,  // Unique player ID
  name: string,      // Player's chosen name
  timestamp: number  // Join timestamp
}
```

**When:** Client successfully connects to host peer

---

#### `PLAYER_LEAVE`
**Purpose:** Notify all peers that a player has disconnected

**Sent by:** Host (after detecting disconnection)

**Payload:**
```javascript
{
  playerId: string,  // ID of player who left
  reason: string     // Reason (e.g., "disconnect", "kicked")
}
```

**When:** Client disconnects or connection is lost

---

#### `PLAYER_READY`
**Purpose:** Player signals they are ready to proceed to next phase

**Sent by:** Any player (client or host)

**Payload:**
```javascript
{
  playerId: string,  // ID of player marking ready
  ready: boolean     // Ready state (true/false)
}
```

**When:**
- Player clicks "Ready" button during READY_UP phase
- Player unmarks ready (if allowed)

---

### Token Actions

#### `TOKEN_SELECT`
**Purpose:** Player selects/claims a token

**Sent by:** Any player (client or host)

**Payload:**
```javascript
{
  playerId: string,   // ID of player selecting token
  tokenNumber: number // Token number (1-N where N = player count)
}
```

**When:**
- Player clicks on an available token during TOKEN_TRADING phase
- Selecting own current token (no-op, but valid)

---

#### `TOKEN_STEAL`
**Purpose:** Player steals a token from another player

**Sent by:** Any player (client or host)

**Payload:**
```javascript
{
  playerId: string,      // ID of player stealing
  tokenNumber: number,   // Token being stolen
  fromPlayerId: string,  // Previous owner (can be null)
  timestamp: number      // Action timestamp for conflict resolution
}
```

**When:** Player clicks on a token currently owned by another player

**Note:** Timestamp is used for conflict resolution if multiple players attempt to steal the same token simultaneously

---

### Phase Control

#### `PHASE_ADVANCE`
**Purpose:** Request to advance to next game phase

**Sent by:** Host only (after validation)

**Payload:**
```javascript
{
  fromPhase: string,  // Current phase being left
  toPhase: string     // Next phase being entered
}
```

**When:**
- All players ready during READY_UP
- Token trading complete
- Turn completion acknowledged

---

#### `GAME_START`
**Purpose:** Host initiates game start from lobby

**Sent by:** Host only

**Payload:**
```javascript
{
  players: Player[],  // Final player list
  seed: number        // Random seed for deck shuffling (optional, for reproducibility)
}
```

**When:** Host clicks "Start Game" with minimum 2 players ready

---

#### `GAME_RESET`
**Purpose:** Reset game for next round after END_GAME

**Sent by:** Host only

**Payload:**
```javascript
{
  keepPlayers: boolean  // Whether to keep same players (true) or return to lobby (false)
}
```

**When:**
- Host clicks "Play Again" after game ends
- Automatic reset after timeout

---

### Connection Health

#### `PING`
**Purpose:** Check connection health and latency

**Sent by:** Any peer

**Payload:**
```javascript
{
  senderId: string  // ID of peer sending ping
}
```

**When:**
- Periodically every 10 seconds
- Before important state updates
- On suspected connection issues

---

#### `PONG`
**Purpose:** Respond to PING for latency measurement

**Sent by:** Any peer (in response to PING)

**Payload:**
```javascript
{
  senderId: string,     // ID of peer responding
  originalTimestamp: number  // Timestamp from original PING
}
```

**When:** Immediately upon receiving a PING

---

## Message Flow Examples

### Example 1: Player Joins Game

```
1. Client connects to host's peer ID
2. Host → All: PLAYER_JOIN { playerId: "p2", name: "Alice" }
3. Host → Client: STATE_UPDATE { ...fullGameState }
4. Client renders game state
```

### Example 2: Ready-Up Phase

```
1. Host → All: PHASE_ADVANCE { toPhase: "READY_UP" }
2. Player1 → Host: PLAYER_READY { playerId: "p1", ready: true }
3. Host → All: STATE_UPDATE { readyStatus: { p1: true, p2: false } }
4. Player2 → Host: PLAYER_READY { playerId: "p2", ready: true }
5. Host → All: STATE_UPDATE { readyStatus: { p1: true, p2: true } }
6. Host → All: PHASE_ADVANCE { toPhase: "TOKEN_TRADING" }
```

### Example 3: Token Trading with Conflict

```
1. Player1 → Host: TOKEN_SELECT { playerId: "p1", tokenNumber: 3, timestamp: 1000 }
2. Player2 → Host: TOKEN_SELECT { playerId: "p2", tokenNumber: 3, timestamp: 1005 }
3. Host resolves: Player1 gets token (earlier timestamp)
4. Host → All: STATE_UPDATE { tokens: [...] }
5. Player2 sees token taken, selects different token
```

---

## Implementation Notes

### Host Authority
- The host is the source of truth for all game state
- Clients send action messages to host
- Host validates, updates state, broadcasts STATE_UPDATE

### Conflict Resolution
- Token actions include timestamps for conflict resolution
- Earlier timestamp wins in case of simultaneous actions
- Host's clock is authoritative

### State Synchronization
- Host broadcasts full state after every change (simple, reliable)
- Clients receive state and render (stateless client approach)
- Future optimization: delta updates for bandwidth efficiency

### Error Handling
- Invalid messages are silently ignored (logged in dev mode)
- Missing/malformed fields cause message rejection
- Connection loss triggers PLAYER_LEAVE after timeout

---

## Related Files

- `src/browser/p2pProtocol.js` - Message creation and validation
- `src/browser/p2pLinks.js` - Shareable link generation
- `tests/p2pProtocol.test.js` - Protocol tests
