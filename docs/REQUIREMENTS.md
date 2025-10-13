# The Online Gang - Game Requirements

## Game Overview
**The Online Gang** is a cooperative poker-like card game built entirely in JavaScript using peer.js for fully peer-to-peer connections (no server component).

## Core Game Concept

### Game Type
- Card game with poker-like mechanics
- No betting/money involved
- No fold/hold/raise mechanics

### Gameplay Flow
The game consists of 4 turns total:

1. **Turn 1 - Initial Deal (The Hole Cards):**
   - Each player receives 2 private cards (hole cards) to their hand
   - Players simultaneously choose tokens numbered 1 to N (where N = number of players)
   - Token 1 = weakest hand, Token N = strongest hand

2. **Turn 2 - The Flop:**
   - Three community cards are dealt to the center of the table (the flop)
   - All players can use these community cards combined with their hole cards
   - New set of numbered tokens (1 to N) are presented
   - Players simultaneously choose tokens based on current hand strength

3. **Turn 3 - The Turn:**
   - One additional community card (4th card total) is dealt to the table (the turn)
   - New set of numbered tokens (1 to N) are presented
   - Players simultaneously choose tokens based on current hand strength

4. **Turn 4 - The River (Final):**
   - One final community card (5th card total) is dealt to the table (the river)
   - Final set of numbered tokens (1 to N) are presented
   - Players make their final token selection
   - **All hole cards are revealed**
   - Win/loss determination happens

**Card Distribution Summary:**
- Each player has 2 private hole cards
- 5 community cards shared by all players
- Best 5-card poker hand is made from any combination of player's 2 hole cards + 5 community cards

### Game Conclusion & Continuation
- **End Game Summary Table:** After cards are revealed, an end game summary table displays all player results
- **"Ready for Next Game" Button:** All players see a "Ready for Next Game" button
  - **Cooperative Ready-Up:** ALL players must click "Ready for Next Game" before proceeding
  - Each player's ready status is displayed (e.g., "Players Ready: 2 / 4")
  - Game only starts when everyone has clicked ready
  - No return to lobby - seamless continuous play
- **Continuous Play Loop:** Players can play multiple consecutive games without interruption

### Token Selection Rules
- Each turn, players must select a token numbered 1 to N (N = number of players)
- Token numbers represent relative hand strength ranking:
  - Token 1 = weakest hand
  - Token 2 = second weakest hand
  - Token N = strongest hand
- Each token number can only be held by one player at a time

### Token Trading Mechanic (Core Gameplay)
- **Stealing Tokens:** Any player can take a token that another player currently holds
- **Reclaiming Tokens:** The original holder can take the token back from whoever took it
- **Dynamic Trading:** Tokens can change hands multiple times during a turn
- **Communication Through Trading:** Token trading is the ONLY way players can signal their hand strength to each other
  - Example: Player with King takes token 4 (thinking they're strong)
  - Player with Ace believes they deserve token 4 more, so they take it from the King player
  - The King player must then choose a different token or fight for token 4 back
- **Real-time Visibility:** All players can see who currently holds which token at all times during the selection phase
- **Trading Speed as Signal:** The speed and decisiveness of token grabs carries meaning
  - Quick grab of a high token often signals a strong hand (Pair, Ace, etc.)

### Turn Flow and Pacing
Each turn follows this sequence:

1. **Card Deal Phase:**
   - Cards are dealt to all players
   - Players review their new cards privately

2. **Ready-Up Phase:**
   - All players must indicate "I'm ready to start trading"
   - Trading does NOT begin until ALL players signal ready
   - This gives everyone time to think before the real-time trading begins

3. **Token Trading Phase:**
   - Once all players are ready, token trading begins
   - Players can select tokens, steal from others, and reclaim stolen tokens
   - Real-time dynamic trading continues

4. **Turn Completion:**
   - Turn ends when ALL players agree to proceed to next turn
   - Requires unanimous consent to advance

### Hand Evaluation
- Hands are evaluated using standard poker hand rankings
- If no poker combinations exist, high card determines strength
- Example: Player A has [4, 9], Player B has [3, K]
  - Player B wins (King high card beats 9 high card)
  - Player A should take token 1, Player B should take token 2

### Tie Handling
- **Identical Hands:** If two or more players have identical poker hand strength, they are considered tied
- **Tied Token Selection:** Tied players are considered correct if they select tokens that reflect the tie
  - Example: If Player A and Player B tie for 2nd/3rd strongest, both are correct if they end up with tokens 2 and 3 (in either order)
  - Player A with token 2 and Player B with token 3: **CORRECT**
  - Player A with token 3 and Player B with token 2: **CORRECT**
  - Any other combination: **INCORRECT**
- **Implementation Note:** Special attention required in win determination logic to handle tie scenarios correctly

### Win/Loss Condition
- **Cooperative Win Condition:** ALL players must correctly select their token ranking on the final turn (Turn 4)
- Cards are revealed after final token selection
- Actual hand rankings are compared to token selections
- If every player chose the correct token matching their actual hand rank: **Everyone Wins**
- If any player chose an incorrect token: **Everyone Loses**

## Multiplayer Architecture

### Player Count
- **Minimum:** 2 players (though gameplay will be less interesting)
- **Maximum:** 8 players
- **Recommended:** 3-8 players for optimal gameplay experience

### Lobby/Connection System
- **Host Creation:** When a user visits the page, peer.js assigns them a Peer() object with a unique ID
- **Invitation System:** The host copies a shareable link containing their Peer ID
- **Out-of-band Sharing:** Host shares the link through external means (text message, chat, email, etc.)
- **Guest Joining:** Other players visit the shared link to connect directly to the host via peer.js

### Game State Authority
- **Host as Authority:** The initial user (host) is the source of truth for all game state
- **Host Responsibilities:**
  - Deck shuffling
  - Card dealing to all players
  - Game state coordination
  - Turn progression
  - Final win/loss determination
- **Peer-to-Peer Architecture:** All players connect directly to the host; no central server required

## Technical Scope

### Technology Stack
- **Vanilla JavaScript:** No heavy transpiling (no Babel)
- **Modern ES6+ features:** Use native browser capabilities
- **peer.js** for P2P connections
- **HTML/CSS/JS only:** Single page application, no build tools required
- **DOM-based rendering:** Use standard DOM elements for UI
- **Canvas (sparingly):** Only use `<canvas>` if specific visuals cannot be achieved with DOM/CSS
- **No frameworks:** Pure vanilla implementation
- **Standard 52-Card Deck:** 13 ranks (A, 2-10, J, Q, K) × 4 suits (♠, ♥, ♦, ♣), no jokers

### Graphics/UI
- **Quality Standard:** Polished, premium UI/UX as if made by a high-quality game company
- **No Monetization:** No ads, no in-app purchases
- **Animations:** Smooth, polished animations expected throughout
  - Card dealing animations
  - Token selection/stealing animations
  - Turn transitions
  - Win/loss reveals
- **Visual Design:** Professional, engaging, game-quality interface
- **CSS-based animations:** Leverage CSS transforms, transitions, and keyframe animations

### Networking
- Real-time P2P communication via peer.js

### Persistence
- **Game State Persistence:** Game state must be saved locally to support reconnection
- **Session Duration:** Reconnection supported for disconnections < 30 minutes

### Disconnect & Reconnection Handling

#### Host Disconnect
- **Recovery Mechanism:** Host can reload the page and automatically reconnect to all peers
- **State Restoration:** Game state is preserved and continues from where it left off
- **Time Window:** Reconnection supported if disconnect is < 30 minutes
- **Peer Waiting:** Other players remain connected and wait for host to return
- **Game Pause:** Game MUST pause when host disconnects (host is the authority)
- **Visual Feedback:** All clients display a modal dialog:
  - Message: "Waiting for host to reconnect..."
  - Blocks all game actions until host returns
  - Clear indication that game cannot proceed without host

#### Client Disconnect
- **Recovery Mechanism:** Disconnected client can reload the page and automatically reconnect to host
- **State Restoration:** Client rejoins the game in progress
- **Seamless Continuation:** Game proceeds normally after reconnection
- **Time Window:** Reconnection supported if disconnect is < 30 minutes
- **Game Continuation:** Game continues even when a client is disconnected (does not pause)
- **Passive State:** Disconnected client is treated as inactive - takes no actions but retains their game state
  - Other players can steal tokens from disconnected players
  - Disconnected player's token remains available for stealing
  - All normal game actions proceed as if disconnected player is simply not acting
- **Ready-Up Phase Blocking:** During ready-up phase, disconnected clients MUST reconnect before turn can proceed
  - Game waits for all players (including disconnected ones) to signal ready
  - Host can kick disconnected players to unblock progression (see Host Controls)
- **Turn Completion Blocking:** During turn completion phase, disconnected clients MUST reconnect before proceeding to next turn
  - Game waits for all players (including disconnected ones) to click "proceed to next turn"
  - Host can kick disconnected players to unblock progression if they determine player won't return
- **Visual Indicators:** UI must clearly show which players are currently disconnected
  - Disconnected player's card/avatar should be visually distinct (grayed out, dimmed, marked with icon)
  - Status label indicating "Disconnected" or "Reconnecting..."
  - Other players can continue playing while waiting for reconnection

#### Host Controls
- **Kick Player:** Host has UI to kick any client at any time during the game
  - Available at all times (not just during disconnects)
  - Use case: Remove players who won't return, are AFK, or causing issues
  - Kicked players are removed from the game permanently
- **Game Abandonment on Kick:** When any player is kicked mid-game, the entire game is abandoned and resets
  - Simplifies logic by avoiding token renumbering
  - All players return to lobby/pre-game state
  - Host can start a new game with remaining players

#### Implementation Requirements
- **Local Storage:** Save game state (deck state, player hands, token selections, current turn phase)
- **Session IDs:** Persist connection/session identifiers for reconnection
- **State Synchronization:** Host re-syncs game state to reconnecting players

#### Token Grab Conflict Resolution
- **Host Authority:** When two players attempt to grab the same token simultaneously, the host processes messages in order of arrival
- **Sequential Processing:** Messages are processed chronologically:
  - If User A and User B both click the same token
  - User A's message arrives first → User A gets the token
  - User B's message arrives second → Treated as User B stealing the token from User A
  - Result: User B ends up with the token
- **Last Message Wins:** The most recent message to arrive determines final token ownership
- **Natural Stealing Behavior:** Conflict resolution follows the same rules as intentional token stealing

### Platform Support
- **Responsive Design:** Must render well on both desktop and mobile browsers
- **Primary Target:** Safari (iOS, macOS, and **Vision Pro**)
- **Secondary Target:** Chrome support is a big plus
- **Mobile-first considerations:** Touch-friendly interactions, appropriate sizing for mobile screens
- **Mobile Layout Adaptation:**
  - Small screens: Poker table transforms to vertical round rect table taking up most of the screen
  - Players positioned vertically on the left side
  - Maintains playability and readability on compact displays

### Vision Pro / Spatial Safari Considerations
- **Interactive Element Highlights:** Special attention to browser highlight behavior
  - Use semantic HTML elements (`<a>`, `<button>`) for all interactive elements
  - Wrap entire interactive areas in `<a>` tags, not just text content
  - Example: For clickable cards/tokens, the entire visual element should be wrapped in an anchor
  - This ensures proper highlight behavior in Vision Pro Safari's spatial interface
- **Click target sizing:** Ensure all interactive elements are large enough for comfortable spatial interaction

### Browser Testing
- **Primary Focus:** Safari only
- **Testing Platforms:** iOS Safari, macOS Safari, Vision Pro Safari

## User Experience

### Target Audience
- **Primary Users:** Groups of friends who want to play card games together while physically separated
- **Use Case:** Remote social gaming sessions
- **Optional Enhancement:** Players may use FaceTime/video calls alongside the game, but not required
- **Communication Design:** UI must be self-explanatory and communicate clearly what each player needs to do at any given moment
  - Clear turn phase indicators
  - Visual feedback for all player actions
  - Status indicators showing what each player is doing (thinking, ready, waiting, etc.)
  - Game state should be obvious without verbal communication

### Session Length
- **Per Round:** 1-2 minutes (card dealing + ready-up + token trading + turn completion)
- **Complete Game:** 5-10 minutes (4 rounds total)
- **Pacing:** Fast enough to maintain engagement, with natural breaks between rounds for strategy adjustment

## Audio & Sound Design

### Sound Effects (Required)
- **Token Acquisition:** Sound plays whenever any player takes a token
  - **Critical Feature:** Alerts all players that token trading activity is happening
  - **Pitch Variation:** Sound pitch changes based on token strength relative to player's previous turn
    - Higher pitched sound: Player took a stronger token than their last turn
    - Lower pitched sound: Player took a weaker token than their last turn
    - Neutral pitch: Same strength token as last turn (or first turn with no previous reference)
  - Helps players track trading dynamics through audio cues
- **Additional Sound Effects:** **TBD**
  - Card dealing sounds?
  - Ready notification sounds?
  - Turn transition sounds?
  - Win/loss sounds?
  - Button click feedback?

### Rules & Help
- **Menu Button:** Persistent menu button in corner of screen (available at all times)
- **Rules Access:** Menu provides access to game rules and instructions
- **Always Available:** Players can reference rules during lobby, gameplay, or between games
- **Poker Hand Ranking Guide:**
  - Small "?" button in corner next to menu button
  - Always accessible during all game phases
  - Clicking displays modal dialog with standard poker hand rankings
  - Shows all rankings from Royal Flush to High Card with examples

### Game History & Statistics
- **Visual Timeline:** Display a timeline of games played in the current session
  - Green dot = Victory (cooperative success)
  - Red dot = Defeat (cooperative failure)
  - Dots displayed in chronological order
- **Display Limit:** For sessions with >20 games, show only the last 20 games visually
- **Summary Text:** Display overall statistics text
  - Format: "X out of Y games won" (e.g., "17 out of 24 games won")
  - Shows total count even when only last 20 dots are displayed
- **Persistence:** Statistics tracked for the current session only (resets when host closes/refreshes)
- **Location:** Display prominently visible but not obstructive (e.g., top of screen, sidebar)

### Audio Controls
- **Mute Button:** Accessible mute/unmute toggle button
- **No Volume Slider:** Simple on/off toggle only, no granular volume control
- **Persistent State:** Mute preference persists for the session

## Visual Design

### Token Design
- **Base Style:** Poker chip aesthetic
- **Number Representation:** Stars in the center indicate token number
  - Star arrangements designed for easy visual distinction (e.g., 6 stars vs 8 stars)
  - Patterns should be intuitive and quickly readable
- **Outer Ring:** Striped color ring indicates current turn
  - **Turn 1:** 1 stripe, White color
  - **Turn 2:** 2 stripes, Yellow color
  - **Turn 3:** 3 stripes, Orange color
  - **Turn 4:** 4 stripes, Red color
- **Visual Hierarchy:** Color progression (white → yellow → orange → red) represents increasing game tension/finality

### Card Design
- **Minimalistic Style:** Cards display only the number/rank and suit symbol
- **Mobile Optimized:** Simple, clean design ensures legibility on small mobile screens
- **High Contrast:** Clear, easy-to-read typography and symbols
- **Card Back Design:** Face-down cards display a simple checker pattern
  - Colors: Dark blue OR dark red
  - Randomized once per game (all cards use same color for that game)
  - Pattern resets/re-randomizes for each new game

### Additional Visual Design
- **TBD:**
  - Hand ranking reference accessibility?
  - Score/statistics tracking?
  - Audio controls?

### Credits & Attribution
- **No Credits Section:** No footer, version info, or about section required
- **Minimal Branding:** Only the subtle background watermark for game title

### Color Scheme & Visual Theme
- **Poker Table:** Green felt color (traditional poker table aesthetic)
- **Background:** Gray
- **Overall Palette:** No strict palette - prioritize polished, coherent visual design
- **Design Philosophy:** Professional, clean, game-quality appearance
- **Game Title:** "The Online Gang" displayed as a subtle watermark in the background
  - Low opacity, non-obtrusive
  - Maintains clean visual aesthetic while providing branding

### Player Status Indicators
- **Default State:** No status indicator needed for normal/active players
- **Disconnected State Only:** Red "DISCONNECTED" text overlaid on player's avatar
- **Minimal UI:** Keep status displays minimal and only show when necessary

### Animation Design

#### Card Dealing Animations
- **Deck Visual:** Face-down "deck" visible on the poker table as the source for card dealing
- **Deal Animation:** Cards fly and flip from the deck to their destination
  - Hole cards animate to each player's position
  - Community cards animate to center of table
  - Smooth, polished animation quality befitting a high-quality game

#### End Game Summary Animations
- **Summary Table Presentation:** The end game summary table should be a showcase animation piece
- **Card Flying Animation:** Cards from the poker table fly and flip into their positions in the summary table
  - Hole cards reveal and animate into Column 5 (or Column 6 on desktop)
  - Community cards animate into Column 5 (or Column 6 on desktop)
  - Cards arrange to show best 5-card hand with yellow border highlight
- **Polished Execution:** High-quality, smooth animations that feel premium

### Animation Timing
- **Standard Duration:** 0.6 seconds for most animations (snappy, responsive feel)
- **Multi-Card Sequences:** When animating multiple cards:
  - Stagger with slight delay between each card
  - Prevents all cards from animating simultaneously
  - Creates a smooth, cascading visual effect
  - Example: Dealing 3 flop cards with 0.1-0.15s delay between each
- **Consistent Pacing:** Maintain snappy, engaging rhythm throughout all animations

### Game Phase Communication
- **Prominent Header Text:** Large, clear text at the top of screen tells players exactly what to do
- **User-Friendly Language:** Avoid poker jargon; use plain language
  - Examples:
    - "Take a token that best fits your hand's strength based on your best guess"
    - "Press 'Ready' when you are ready"
    - "Wait for other players to be ready"
    - "Cards are being dealt..."
    - "Review the results below"
- **No Technical Poker Terms:** Don't refer to "flop", "turn", "river" since audience may not be experienced poker players
- **Clear Instructions:** Every game state has obvious, actionable guidance text

### Player Hand & Card Display
- **Own Hand Display:** Player's 2 hole cards are displayed in a horizontal row near the bottom edge of the poker table
  - Positioned below the player's avatar area
  - Face-up and clearly visible to the player only
- **Opponent Hole Cards:** Other players' 2 hole cards are displayed face-down in front of their respective avatars
  - Back of card design shown
  - Positioned near each player's seat around the table
- **Community Cards:** 5 community cards dealt to the center of the table
  - Turn 2: 3 cards (the flop)
  - Turn 3: 4th card (the turn)
  - Turn 4: 5th card (the river)
  - Face-up and visible to all players

### Assistive Hand Strength Display
- **Real-time Evaluation:** During each turn, the game evaluates the player's best poker hand
- **Visual Highlighting:**
  - Yellow border highlights the cards that make up the best combination
  - Highlights apply to both hole cards and community cards involved in the hand
  - Examples: Two Pair highlights 4 cards, Three of a Kind highlights 3 cards, etc.
- **Hand Name Display:** Text displayed above the player's hand cards showing the combination name
  - Examples: "Two Pair - Kings and 3s", "Three of a Kind - 7s", "High Card - Ace", "Flush - Hearts"
- **Purpose:** Helps players understand their current hand strength for better token selection decisions
- **Updates Per Turn:** Highlighting and text update as new community cards are revealed

### End Game Summary Table
After the final turn (Turn 4) when all hole cards are revealed, a summary table is displayed:

**Presentation:**
- **Location:** Table is displayed directly on the poker table surface (not as a modal overlay)
  - Allows cards to fly and animate naturally into their table positions
  - Maintains spatial continuity with the game board
- **Win/Loss Announcement:** Prominent WIN or LOSS message displayed at the top of the table
  - Large, clear text indicating cooperative success or failure
  - Positioned above the summary table rows

**Table Structure:**
- **Row Order:** Players are sorted from strongest hand to weakest hand (descending order)
  - This sorting represents the "correct" expected order
  - If Turn 4 token numbers are in descending order (matching the row order), players won
  - If Turn 4 token numbers are NOT in descending order, players lost

**Columns (per Player Row):**
- **Column 1-4:** Token selections for Turn 1, Turn 2, Turn 3, Turn 4
  - **Per-Turn Validation:** Each turn's token is highlighted based on correctness
    - Green highlight: Player had correct token for that turn based on hand strength at that moment
    - Red highlight: Player had incorrect token for that turn
  - **Purpose:** Allows players to evaluate whether their token trading resulted in correct order for intermediate turns, not just the final turn
- **Column 5:** All cards available to the player (2 hole cards + 5 community cards = 7 cards total)
  - Yellow border highlights the best 5 cards used for hand strength evaluation
  - Note: Best 5-card combination from the 7 available cards determines strength; remaining 2 cards are ignored
- **Column 6:** Hand strength description
  - Examples: "Pair of Aces", "Straight to 8", "High Card J", "Two Pair - Kings and 3s", "Flush - Hearts", etc.
  - Human-readable poker hand ranking

**Visual Win/Loss Indicator:**
- Players can immediately see if they won by checking if Turn 4 column is in descending order (e.g., 4, 3, 2, 1 for 4 players)
- No explicit "expected value" column needed - the row order IS the expected order

**Win/Loss Determination:**
- If Turn 4 tokens match the sorted hand strength order (accounting for ties): Everyone wins (cooperative success)
- If Turn 4 tokens don't match the order: Everyone loses (cooperative failure)
- **Tie Logic:** Players with identical hands can have their tokens in either order among themselves (e.g., tied players with tokens 2 and 3 can be in either position)

### Token Selection & Ownership UI
- **Token Pool Display:** At the start of each turn, all available tokens are dealt/displayed in the center of the poker table
- **Token Selection:** Players click on tokens in the center to acquire them
- **Acquisition Animation:** When acquired, token animates from center to position in front of the player's avatar
- **Token History:** Tokens from previous turns remain visible in front of their owners
  - Creates a visual history of each player's token choices across all turns
  - Players can reference historical token values when making current turn decisions
- **Stolen Token Placeholder:** When a player's token is stolen:
  - A placeholder marker remains in the original position
  - Placeholder displays text: "Taken by [Player Name]"
  - Stolen token animates to the new owner's position
  - Placeholder text persists until the original player acquires a different token for the current turn
  - Once player acquires new token, placeholder is removed/replaced
- **Visual Token Organization:** Each player's area shows their token selections from Turn 1, Turn 2, Turn 3, Turn 4 (chronologically arranged)

## Game Flow & States

### Pre-Game Lobby
- **Visual:** Empty poker table displayed to all players
- **Player Status Display:** Text showing "Players Ready: X out of Y"
  - X = number of players who clicked "Ready"
  - Y = total number of connected players (including host)
- **Player Identification:**
  - **Default Name:** "Player X" assigned automatically when joining (X = join order number)
    - **Collision Prevention:** If "Player X" already exists, auto-increment to next unused number
    - Example: If "Player 1" exists, assign "Player 2"; if "Player 1" and "Player 2" exist, assign "Player 3"
    - Skip numbers already in use (e.g., if "Player 1", "Player 2", "Player 4" exist, assign "Player 3")
  - **Name Editing:** Players can edit their display name in lobby
    - Name field is editable when player is NOT ready
    - Once player clicks "Ready," name field becomes locked/non-editable
    - Player can click "Ready" again to toggle back to unready state, allowing name editing again
    - **Maximum Length:** 20 characters
  - **Avatar System:**
    - Generic avatar displayed for each player
    - Avatar is a randomly assigned icon/emoji
    - **Emoji Pool:** Approximately 20 fun, nice, colorful emojis
    - Cannot upload custom avatars
    - "Randomize" button next to avatar allows player to request a new random emoji
    - Randomize only available when player is NOT ready
    - **Avatar Initials:** Display first letter of EACH word in player's name
      - Extract first character from each word (split by spaces)
      - Maximum 2 characters displayed
      - Examples: "Peter Hill" → "PH", "John Doe Smith" → "JD", "Alice" → "AL"
      - NOT first 2 characters of first word only
    - **Avatar Color:** Background color must be unique per player
      - No color collisions allowed within the same game session
      - When new player joins, assign a color not currently in use
      - Maintain color palette of 8-12+ visually distinct colors
      - Suggested colors: Red (#e74c3c), Blue (#3498db), Green (#2ecc71), Orange (#f39c12), Purple (#9b59b6), Teal (#1abc9c), etc.
- **Player Positioning:**
  - Players are seated around the poker table
  - Evenly distributed around the table based on player count
  - **Self Position:** Current user is always positioned closest to the viewport (bottom/front position)
  - Other players arranged around the table from the user's perspective
- **Ready Mechanism:** Each player (including host) must click a "Ready" button
  - This is separate from the in-game ready-up phase
  - Occurs before any cards are dealt
  - Toggleable: clicking "Ready" again makes player unready
- **Game Start Trigger:** Host-only "Start Game" button
  - Only visible to the host
  - Allows host to wait for additional players even if current players are ready
  - Example: 3 players ready, but host waiting for 4th player before starting
- **Invite Link (Host Only):**
  - Prominent "Copy Game Link" button visible to host at all times
  - Available in lobby and during active gameplay
  - Allows host to invite new players mid-game
  - Link contains the host's peer.js ID for direct P2P connection
- **Late Joiners (Mid-Game):** New players can connect while a game is in progress
  - New player sees the poker table with a "Ready" button
  - New player clicks "Ready" to indicate they want to join next game
  - Current game continues to completion
  - At end of current game, all players see "Next Game" button
  - All players must click "Next Game" to proceed
  - New game starts with all players (including the new joiner) once everyone clicks "Next Game"
  - Ready status resets for new game cycle
