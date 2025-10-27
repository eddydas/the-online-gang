# Page Refresh Resilience

This document describes the page refresh resilience feature that allows both hosts and clients to recover from page refreshes without losing game state.

## Overview

The feature has two main components:
1. **Host Refresh**: Host can refresh and recover by requesting state from reconnecting clients
2. **Client Refresh**: Clients can refresh and reconnect to the host automatically

## URL Scheme

The application uses query parameters to determine browser role:

- **`?host=XXXXX`** - This browser is the host and should reuse peer ID `XXXXX`
- **`?peer=XXXXX`** - This browser is a client and should connect to host with peer ID `XXXXX`
- **No query params** - Fresh host initialization

## Host Behavior

### Initial Load (No Query Parameters)

1. Get random peer ID from peer.js
2. Update browser URL to `?host=XXXXX` (using History API, no reload)
3. Initialize as host with empty lobby state
4. "Copy Link" button generates `?peer=XXXXX` URLs for clients to join

### Refresh (With `?host=XXXXX`)

1. Read peer ID from URL query parameter
2. Request that specific peer ID from peer.js (reuse the same ID)
3. Establish peer connection with the reused ID
4. When **first client reconnects**, send `REQUEST_FULL_STATE` message to that client
5. Wait for client to respond with `FULL_STATE_RESPONSE`
6. If client responds: Use received state to restore game
7. If no client responds: Continue with current state (likely empty lobby)

### Edge Cases

- **Peer ID already taken**: Show `alert()` with error message (very rare, should be investigated)
- **No clients reconnect**: Host continues with pre-existing state (empty lobby)
- **Multiple clients reconnect**: Only request state from the first one

## Client Behavior

### Initial Connection (With `?peer=XXXXX`)

1. Extract host peer ID from URL query parameter
2. Show modal: **"Connecting to host XXXXX..."**
3. Attempt to connect to host via peer.js
4. Once connected, dismiss modal and show current state (lobby or game)

### Reconnection (Host Disconnects)

1. Detect host disconnection
2. Show modal: **"Host disconnected, re-connecting..."**
3. Retry connection every **1 second**
4. Continue retrying for **1 hour maximum**
5. If reconnected: Dismiss modal and resume game
6. If host requests state (`REQUEST_FULL_STATE`): Send back full game state via `FULL_STATE_RESPONSE`
7. After 1 hour of failed attempts: Silently give up (no special UX)

### State Management

- **Memory Only**: Clients keep last received game state in memory
- **No localStorage**: No persistent storage on client side
- Clients always have the most recent state broadcast from host

## Message Protocol

### New Message Types

#### `REQUEST_FULL_STATE`
- **Direction**: Host → Client (first reconnecting client only)
- **Purpose**: Request full game state after host refresh
- **Payload**: None

#### `FULL_STATE_RESPONSE`
- **Direction**: Client → Host
- **Purpose**: Send complete game state back to host
- **Payload**: Complete game state object (same structure as `STATE_UPDATE`)

## Phases Supported

This feature works across **all game phases**:
- `LOBBY` - Pre-game player gathering
- `READY_UP` - Turn ready-up phase
- `TOKEN_TRADING` - Token selection phase
- `TURN_COMPLETE` - Turn results phase
- `END_GAME` - Game over screen

## Technical Details

### No Persistent Storage

- **Host**: No localStorage - relies on clients for state recovery
- **Client**: No localStorage - keeps state in memory only
- **Rationale**: Simplifies implementation, clients serve as distributed backup

### URL Updates

Use History API to update URL without reload:
```javascript
const url = new URL(window.location.href);
url.searchParams.set('host', peerId);
window.history.replaceState({}, '', url);
```

### Connection Retry Strategy

**Client reconnection logic:**
- Retry interval: 1 second
- Maximum duration: 1 hour (3600 attempts)
- No exponential backoff (keep it simple)
- Silent failure after timeout

### State Recovery Priority

1. **Primary**: Request state from first reconnecting client
2. **Fallback**: Continue with host's current in-memory state
3. **No tertiary**: No localStorage backup

## Implementation Checklist

### Host
- [ ] Detect initial load vs refresh (check for `?host=` param)
- [ ] Update URL to `?host=XXXXX` on initial load
- [ ] Reuse peer ID from URL on refresh
- [ ] Send `REQUEST_FULL_STATE` to first reconnecting client
- [ ] Handle `FULL_STATE_RESPONSE` from client
- [ ] Alert on peer ID conflict
- [ ] Ensure "Copy Link" generates `?peer=XXXXX` URLs

### Client
- [ ] Parse `?peer=XXXXX` from URL
- [ ] Show "Connecting to host XXXXX..." modal
- [ ] Show "Host disconnected, re-connecting..." on disconnect
- [ ] Implement 1-second retry for 1 hour
- [ ] Handle `REQUEST_FULL_STATE` from host
- [ ] Send `FULL_STATE_RESPONSE` with full state
- [ ] Keep game state in memory (no localStorage)

### Protocol
- [ ] Add `REQUEST_FULL_STATE` message type
- [ ] Add `FULL_STATE_RESPONSE` message type
- [ ] Update message handlers

## Testing Scenarios

1. **Host refresh mid-game**: Host refreshes during TOKEN_TRADING, client sends state back
2. **Client refresh mid-game**: Client refreshes, reconnects, receives current state
3. **All clients disconnect**: Host refreshes with no clients, continues with empty lobby
4. **Host disconnect**: Clients retry connection for up to 1 hour
5. **Multiple clients**: First reconnecting client provides state, others just rejoin
6. **Lobby refresh**: Host refreshes in lobby before game starts
7. **End game refresh**: Host/client refresh on END_GAME screen
