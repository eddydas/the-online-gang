## Sprint 3: Animations & Sound (Week 4)

### Sprint Goal
**Make it feel smooth and engaging**

### Issues

#### 3.1 Card Animations
- **Priority:** HIGH
- **Estimate:** 8 hours
- **Tasks:**
  - Card dealing animation (deck → destination, 0.6s)
  - Card flip animation (back → face)
  - Staggered dealing (0.1-0.15s delays between cards)
  - Smooth CSS transitions
  - **Tests:** Animation completion callbacks

#### 3.2 Token Animations
- **Priority:** HIGH
- **Estimate:** 6 hours
- **Tasks:**
  - Token selection (pool → player, 0.6s)
  - Token stealing (player → player, 0.6s)
  - Placeholder appear/disappear
  - Hover effects
  - **Tests:** Animation state management

#### 3.3 End-Game Table Animations
- **Priority:** MEDIUM
- **Estimate:** 6 hours
- **Tasks:**
  - Cards fly from poker table into summary table positions
  - Card flip on reveal
  - Staggered card animations
  - WIN/LOSS banner appear animation
  - Smooth table transition

#### 3.4 Sound System (TDD)
- **Priority:** MEDIUM
- **Estimate:** 6 hours
- **Tests First:**
  - ✅ Play sound on token selection
  - ✅ Pitch variation based on token number (higher = higher pitch)
  - ✅ Mute/unmute state persistence
  - ✅ Sound queue management
- **Implementation:**
  - Token selection sound with pitch variation
  - Mute/unmute toggle
  - Audio context setup
  - Optional: card deal sounds
  - Session-based mute preference

#### 3.5 Avatar System
- **Priority:** MEDIUM
- **Estimate:** 4 hours
- **Tasks:**
  - Create 20 fun emoji pool
  - Random emoji assignment on join
  - Randomize button in lobby (only when not ready)
  - Display emoji with player name
  - **Tests:** Random selection, uniqueness (optional)

#### 3.6 Animation Testing
- **Priority:** MEDIUM
- **Estimate:** 4 hours
- **Tasks:**
  - Performance testing (60fps target)
  - Mobile animation smoothness
  - Animation callback tests
  - Timing validation

### **Sprint 3 Deliverable:**
✅ Smooth 60fps animations
✅ Engaging sound effects
✅ Avatar system complete
✅ Game feels polished and professional

---

